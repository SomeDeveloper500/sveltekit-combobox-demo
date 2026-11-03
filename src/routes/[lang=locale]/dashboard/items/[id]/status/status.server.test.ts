import itemsJson from '../../../../../../../mocks/items.json';
import { describe, expect, it } from 'vitest';
import { POST } from './+server';

type Event = Parameters<typeof POST>[0];
type Role = 'admin' | 'editor' | 'viewer';

const user = (role: Role) => ({ id: `demo_${role}`, email: `${role}@demo.test`, name: role, role });

/** One campaign in each status we need; `draft` may move to `scheduled`, `archived` may move nowhere. */
const draft = itemsJson.find((item) => item.status === 'draft')!;
const archived = itemsJson.find((item) => item.status === 'archived')!;

async function call(id: string, body: unknown, actor: ReturnType<typeof user> | null) {
	const request = new Request('https://example.test/x', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: typeof body === 'string' ? body : JSON.stringify(body)
	});
	const response = await POST({
		request,
		params: { lang: 'en', id },
		locals: { user: actor }
	} as unknown as Event);
	return { status: response.status, body: await response.json() };
}

describe('POST /dashboard/items/[id]/status', () => {
	it('refuses an anonymous caller with 401', async () => {
		expect(await call(draft.id, { status: 'scheduled' }, null)).toEqual({
			status: 401,
			body: { code: 'unauthenticated' }
		});
	});

	it('refuses a viewer with 403, and does not change anything', async () => {
		const result = await call(draft.id, { status: 'scheduled' }, user('viewer'));
		expect(result).toEqual({ status: 403, body: { code: 'forbidden' } });
		const again = await call(draft.id, { status: 'draft' }, user('admin'));
		expect(again.body.item.status).toBe('draft');
	});

	it('refuses a viewer before it looks at the request, so nothing leaks', async () => {
		for (const [id, body] of [
			['no-such-campaign', { status: 'active' }],
			[draft.id, { status: 'nonsense' }],
			[draft.id, 'not json']
		] as const) {
			expect((await call(id, body, user('viewer'))).status, String(id)).toBe(403);
		}
	});

	it('lets an editor and an admin change the status', async () => {
		const editor = await call(draft.id, { status: 'scheduled' }, user('editor'));
		expect(editor.status).toBe(200);
		expect(editor.body).toMatchObject({
			changed: true,
			item: { id: draft.id, status: 'scheduled' }
		});

		const admin = await call(draft.id, { status: 'draft' }, user('admin'));
		expect(admin.body).toMatchObject({ changed: true, item: { status: 'draft' } });
	});

	it('reports that nothing changed when the status is already that one', async () => {
		const result = await call(draft.id, { status: 'draft' }, user('editor'));
		expect(result).toMatchObject({ status: 200, body: { changed: false } });
	});

	it('answers 404 for a campaign that does not exist', async () => {
		expect(await call('no-such-campaign', { status: 'active' }, user('editor'))).toEqual({
			status: 404,
			body: { code: 'not_found' }
		});
	});

	it('answers 409 with both statuses for a move the lifecycle does not allow', async () => {
		expect(await call(archived.id, { status: 'active' }, user('admin'))).toEqual({
			status: 409,
			body: { code: 'bad_transition', from: 'archived', to: 'active' }
		});
	});

	it('answers 422 for a status that does not exist or is missing', async () => {
		expect((await call(draft.id, { status: 'nonsense' }, user('editor'))).status).toBe(422);
		expect((await call(draft.id, {}, user('editor'))).status).toBe(422);
		expect((await call(draft.id, null, user('editor'))).status).toBe(422);
	});

	it('answers 400 for a body that is not JSON', async () => {
		expect(await call(draft.id, 'not json', user('editor'))).toEqual({
			status: 400,
			body: { code: 'invalid_json' }
		});
	});

	it('takes the id from the URL and ignores one in the body', async () => {
		const result = await call(draft.id, { id: archived.id, status: 'scheduled' }, user('editor'));
		expect(result.body.item.id).toBe(draft.id);
		await call(draft.id, { status: 'draft' }, user('editor'));
	});
});

/** What a browser sends from the table when JavaScript is off. */
async function submit(
	id: string,
	fields: Record<string, string>,
	actor: ReturnType<typeof user> | null
) {
	const request = new Request('https://example.test/x', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(fields)
	});
	try {
		await POST({
			request,
			params: { lang: 'en', id },
			locals: { user: actor }
		} as unknown as Event);
	} catch (thrown) {
		const { status, location } = thrown as { status: number; location: string };
		return `${status} ${location}`;
	}
	throw new Error('a form post must redirect');
}

describe('POST /dashboard/items/[id]/status, from a plain form', () => {
	const list = '/en/dashboard/items';

	it('applies the change and goes back to the list view it came from (303)', async () => {
		const back = `${list}?status=draft&page=2`;
		expect(await submit(draft.id, { status: 'scheduled', redirectTo: back }, user('editor'))).toBe(
			`303 ${back}`
		);
		expect((await call(draft.id, { status: 'draft' }, user('editor'))).body.item.status).toBe(
			'draft'
		);
	});

	it('goes back to the list, unchanged, when the move is refused', async () => {
		expect(await submit(archived.id, { status: 'active', redirectTo: list }, user('admin'))).toBe(
			`303 ${list}`
		);
		expect((await call(archived.id, { status: 'archived' }, user('admin'))).body.changed).toBe(
			false
		);
	});

	it('does not let a viewer change anything, and still sends them back', async () => {
		expect(await submit(draft.id, { status: 'scheduled', redirectTo: list }, user('viewer'))).toBe(
			`303 ${list}`
		);
		expect((await call(draft.id, { status: 'draft' }, user('admin'))).body.changed).toBe(false);
	});

	it('follows only a path inside the campaign list, so it is not an open redirect', async () => {
		for (const back of [
			'https://evil.example/',
			'//evil.example',
			'/en/dashboard/items-x',
			'/en/login'
		]) {
			expect(
				await submit(draft.id, { status: 'draft', redirectTo: back }, user('editor')),
				back
			).toBe(`303 ${list}`);
		}
		expect(await submit(draft.id, { status: 'draft' }, user('editor'))).toBe(`303 ${list}`);
	});
});
