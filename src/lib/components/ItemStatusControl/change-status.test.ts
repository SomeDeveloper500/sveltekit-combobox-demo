import { describe, expect, it, vi } from 'vitest';
import { changeStatus, needsRefresh } from './change-status';

const reply = (status: number, body: unknown) =>
	vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));

describe('changeStatus', () => {
	it('posts the status as JSON to the given URL', async () => {
		const fetcher = reply(200, { item: { status: 'paused' }, changed: true });
		await changeStatus('/en/dashboard/items/x/status', 'paused', fetcher);
		const [url, init] = fetcher.mock.calls[0];
		expect(url).toBe('/en/dashboard/items/x/status');
		expect(init?.method).toBe('POST');
		expect(JSON.parse(init?.body as string)).toEqual({ status: 'paused' });
		expect(new Headers(init?.headers).get('accept')).toBe('application/json');
	});

	it('reports the status the server confirmed, and whether it changed', async () => {
		expect(
			await changeStatus('/x', 'paused', reply(200, { item: { status: 'paused' }, changed: false }))
		).toEqual({ ok: true, status: 'paused', changed: false });
	});

	it('trusts the server over the request when they differ', async () => {
		expect(
			await changeStatus('/x', 'paused', reply(200, { item: { status: 'active' }, changed: true }))
		).toMatchObject({ ok: true, status: 'active' });
	});

	it('treats a success with an unreadable body as a success', async () => {
		const fetcher = vi.fn<typeof fetch>(async () => new Response('not json', { status: 200 }));
		expect(await changeStatus('/x', 'paused', fetcher)).toEqual({
			ok: true,
			status: 'paused',
			changed: true
		});
	});

	it.each([
		[409, 'conflict'],
		[403, 'forbidden'],
		[401, 'unauthenticated'],
		[404, 'not_found'],
		[422, 'validation'],
		[500, 'server']
	] as const)('sorts a %i answer as %s', async (status, kind) => {
		expect(await changeStatus('/x', 'paused', reply(status, { code: 'x' }))).toEqual({
			ok: false,
			kind
		});
	});

	it('reports no answer at all as a network failure instead of throwing', async () => {
		const fetcher = vi.fn<typeof fetch>(async () => {
			throw new TypeError('Failed to fetch');
		});
		expect(await changeStatus('/x', 'paused', fetcher)).toEqual({ ok: false, kind: 'network' });
	});

	it('gives up on an answer that is too slow', async () => {
		const fetcher = vi.fn<typeof fetch>(
			(_url, init) =>
				new Promise((_resolve, reject) =>
					init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
				)
		);
		expect(await changeStatus('/x', 'paused', fetcher, 20)).toEqual({ ok: false, kind: 'network' });
	});
});

describe('needsRefresh', () => {
	it('wants a refresh after a change that went through', () => {
		expect(needsRefresh({ ok: true, status: 'paused', changed: true })).toBe(true);
	});

	it('does not after a success that changed nothing', () => {
		expect(needsRefresh({ ok: true, status: 'paused', changed: false })).toBe(false);
	});

	it('wants one when the list was stale: the row moved on or is gone', () => {
		expect(needsRefresh({ ok: false, kind: 'conflict' })).toBe(true);
		expect(needsRefresh({ ok: false, kind: 'not_found' })).toBe(true);
	});

	it.each(['network', 'forbidden', 'unauthenticated', 'validation', 'server', 'unknown'] as const)(
		'does not after a %s failure, which leaves the list as it was',
		(kind) => {
			expect(needsRefresh({ ok: false, kind })).toBe(false);
		}
	);
});
