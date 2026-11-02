import { describe, expect, it } from 'vitest';
import { createSessions } from './session.js';

const SECRET = 'a-test-secret-of-sufficient-length';

function make(options: { secret?: string; ttlSeconds?: number; now?: () => number } = {}) {
	return createSessions({ secret: SECRET, ...options });
}

/** Re-encodes a token's payload; the signature stays as it was, so it no longer matches. */
function withPayload(token: string, payload: object) {
	const encoded = btoa(JSON.stringify(payload))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
	return `${encoded}.${token.split('.')[1]}`;
}

describe('sessions', () => {
	it('returns the user id for a token it signed', async () => {
		const sessions = make();
		expect(await sessions.verify(await sessions.sign('demo_admin'))).toBe('demo_admin');
	});

	it('puts only the id and the expiry in the token', async () => {
		const token = await make().sign('demo_admin');
		const payload = JSON.parse(atob(token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
		expect(Object.keys(payload).sort()).toEqual(['exp', 'sub']);
	});

	it('gives different tokens at different times', async () => {
		let time = 1_000;
		const sessions = make({ now: () => time });
		const first = await sessions.sign('u');
		time += 1;
		expect(await sessions.sign('u')).not.toBe(first);
	});

	it('rejects a tampered payload (another user id)', async () => {
		const sessions = make();
		const token = await sessions.sign('demo_viewer');
		const forged = withPayload(token, { sub: 'demo_admin', exp: Date.now() + 1e9 });
		expect(await sessions.verify(forged)).toBeNull();
	});

	it('rejects a tampered signature', async () => {
		const sessions = make();
		const token = await sessions.sign('demo_admin');
		const [payload, signature] = token.split('.');
		const flipped = `${signature.slice(0, -2)}${signature.endsWith('AA') ? 'BB' : 'AA'}`;
		expect(await sessions.verify(`${payload}.${flipped}`)).toBeNull();
	});

	it('rejects a token signed with another secret', async () => {
		const token = await make({ secret: 'another-secret-of-sufficient-length' }).sign('demo_admin');
		expect(await make().verify(token)).toBeNull();
	});

	it('accepts a token until its expiry and rejects it from then on', async () => {
		let time = 0;
		const sessions = make({ ttlSeconds: 60, now: () => time });
		const token = await sessions.sign('demo_admin');
		time = 59_999;
		expect(await sessions.verify(token)).toBe('demo_admin');
		time = 60_000;
		expect(await sessions.verify(token)).toBeNull();
		time = 600_000;
		expect(await sessions.verify(token)).toBeNull();
	});

	it('rejects missing, empty and malformed tokens without throwing', async () => {
		const sessions = make();
		for (const bad of [
			undefined,
			'',
			'.',
			'abc',
			'a.b.c',
			'a.',
			'.b',
			'!!!.???',
			'a'.repeat(600)
		]) {
			expect(await sessions.verify(bad)).toBeNull();
		}
	});

	it('rejects a correctly signed payload of the wrong shape', async () => {
		// Signed by the real key but with a payload this code never produces: it must still fail.
		const sessions = make();
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(SECRET),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);
		const sign = async (payload: unknown) => {
			const body = btoa(JSON.stringify(payload)).replace(/=+$/, '');
			const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body)));
			return `${body}.${btoa(String.fromCharCode(...signature))
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=+$/, '')}`;
		};
		const future = Date.now() + 1e9;
		for (const payload of [
			{ sub: 5, exp: future },
			{ sub: '', exp: future },
			{ exp: future },
			{ sub: 'u' },
			{ sub: 'u', exp: 'soon' },
			null,
			'text',
			[]
		]) {
			expect(await sessions.verify(await sign(payload))).toBeNull();
		}
		expect(await sessions.verify(await sign({ sub: 'u', exp: future }))).toBe('u');
	});

	it('refuses a short secret', () => {
		expect(() => createSessions({ secret: 'short' })).toThrow(/16 characters/);
	});
});
