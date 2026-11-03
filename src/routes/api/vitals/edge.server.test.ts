import { afterEach, describe, expect, it, vi } from 'vitest';
import handler, { config } from '../../../../netlify/edge-functions/vitals';

// The edge function is Deno code, but it uses nothing Deno-specific, so its behaviour can be
// exercised here with the same web-standard Request and Response.
const event = { type: 'vital', name: 'CLS', value: 0.01, rating: 'good', id: 'a', path: '/en' };
const post = (body: string, type = 'application/json') =>
	new Request('https://example.test/api/vitals', {
		method: 'POST',
		headers: { 'content-type': type },
		body
	});

afterEach(() => vi.restoreAllMocks());

describe('the edge function for /api/vitals', () => {
	it('is mounted on the beacon path', () => {
		expect(config.path).toBe('/api/vitals');
	});

	it('accepts a beacon with 204, and logs it', async () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		const response = await handler(post(JSON.stringify({ events: [event] })));
		expect(response.status).toBe(204);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(info).toHaveBeenCalledWith('[rum] vital', expect.stringContaining('"name":"CLS"'));
	});

	it('refuses a payload that is not ours', async () => {
		expect((await handler(post('{"events":[{"type":"x"}]}'))).status).toBe(400);
	});

	it('answers anything but POST with 405 and says what is allowed', async () => {
		const response = await handler(new Request('https://example.test/api/vitals'));
		expect(response.status).toBe(405);
		expect(response.headers.get('allow')).toBe('POST');
	});
});
