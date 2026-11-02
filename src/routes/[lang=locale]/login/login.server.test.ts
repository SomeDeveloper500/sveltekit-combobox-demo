import usersJson from '../../../../mocks/users.json';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';

// Signing the cookie is tested with the session itself; here we only watch whether it was started.
const mocks = vi.hoisted(() => ({ started: [] as string[] }));
vi.mock('#lib/server/auth.js', () => ({
	startSession: async (_cookies: unknown, id: string) => {
		mocks.started.push(id);
	}
}));

const viewer = usersJson.find((user) => user.role === 'viewer')!;

type ActionEvent = Parameters<NonNullable<typeof actions.default>>[0];
type LoadEvent = Parameters<typeof load>[0];

/** Runs the action on a fake form post; a thrown `redirect` comes back as `{ redirect }`. */
async function submit(fields: Record<string, string>, query = '') {
	const body = new FormData();
	for (const [name, value] of Object.entries(fields)) body.set(name, value);
	const event = {
		request: new Request('https://example.test/en/login', { method: 'POST', body }),
		cookies: {},
		url: new URL(`https://example.test/en/login${query}`),
		locals: { lang: 'en', user: null }
	} as unknown as ActionEvent;
	try {
		const result = await actions.default!(event);
		return { result: result as { status: number; data: Record<string, unknown> }, redirect: null };
	} catch (thrown) {
		const { status, location } = thrown as { status: number; location: string };
		return { result: null, redirect: `${status} ${location}` };
	}
}

beforeEach(() => {
	mocks.started.length = 0;
});

describe('login action', () => {
	it('signs a valid user in and goes to the dashboard', async () => {
		const { redirect } = await submit({ email: viewer.email, password: viewer.password });
		expect(redirect).toBe('303 /en/dashboard');
		expect(mocks.started).toEqual([viewer.id]);
	});

	it('ignores the case and the spaces around the email', async () => {
		const { redirect } = await submit({
			email: `  ${viewer.email.toUpperCase()} `,
			password: viewer.password
		});
		expect(redirect).toBe('303 /en/dashboard');
	});

	it('returns to the page the visitor came from', async () => {
		const { redirect } = await submit(
			{ email: viewer.email, password: viewer.password },
			'?next=%2Fen%2Fdashboard%3Fpage%3D2'
		);
		expect(redirect).toBe('303 /en/dashboard?page=2');
	});

	it('does not follow a next that points to another site', async () => {
		for (const next of ['//evil.example', 'https://evil.example', '/\\evil.example']) {
			const { redirect } = await submit(
				{ email: viewer.email, password: viewer.password },
				`?next=${encodeURIComponent(next)}`
			);
			expect(redirect, next).toBe('303 /en/dashboard');
		}
	});

	it('answers a wrong password with 401 and keeps the typed email', async () => {
		const { result } = await submit({ email: viewer.email, password: 'wrong' });
		expect(result?.status).toBe(401);
		expect(result?.data).toEqual({ email: viewer.email, errors: {}, code: 'invalid_credentials' });
		expect(mocks.started).toEqual([]);
	});

	it('gives the same answer for an unknown email, so accounts cannot be probed', async () => {
		const wrong = await submit({ email: viewer.email, password: 'wrong' });
		const unknown = await submit({ email: 'nobody@demo.test', password: 'wrong' });
		expect(unknown.result?.status).toBe(wrong.result?.status);
		expect({ ...unknown.result?.data, email: '' }).toEqual({ ...wrong.result?.data, email: '' });
	});

	it('never sends the password back', async () => {
		const { result } = await submit({ email: viewer.email, password: 'wrong' });
		expect(JSON.stringify(result)).not.toContain('wrong');
	});

	it('runs the shared schema: bad fields give 400 with the problem codes', async () => {
		const { result } = await submit({ email: 'not-an-email', password: '' });
		expect(result?.status).toBe(400);
		expect(result?.data).toEqual({
			email: 'not-an-email',
			errors: { email: 'invalid_email', password: 'required' }
		});
		expect(mocks.started).toEqual([]);
	});

	it('treats missing fields like empty ones', async () => {
		const { result } = await submit({});
		expect(result?.status).toBe(400);
		expect(result?.data.errors).toEqual({ email: 'required', password: 'required' });
	});
});

describe('login page load', () => {
	const run = (user: unknown, search = '') => {
		try {
			load({
				locals: { lang: 'en', user },
				url: new URL(`https://example.test/en/login${search}`)
			} as unknown as LoadEvent);
			return null;
		} catch (thrown) {
			const { status, location } = thrown as { status: number; location: string };
			return `${status} ${location}`;
		}
	};

	it('shows the form to a visitor', () => {
		expect(run(null)).toBeNull();
	});

	it('sends a signed-in user on to the page they wanted, or the dashboard', () => {
		const user = { id: viewer.id };
		expect(run(user)).toBe('303 /en/dashboard');
		expect(run(user, '?next=%2Fen%2Fblog')).toBe('303 /en/blog');
		expect(run(user, '?next=%2F%2Fevil.example')).toBe('303 /en/dashboard');
	});
});
