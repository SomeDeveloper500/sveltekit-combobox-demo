import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './+server';

type Event = Parameters<typeof POST>[0];

const send = (body: string, type = 'application/json') =>
	POST({
		request: new Request('https://example.test/api/vitals', {
			method: 'POST',
			headers: { 'content-type': type },
			body
		})
	} as unknown as Event);

afterEach(() => vi.restoreAllMocks());

describe('POST /api/vitals', () => {
	it('answers 204 with no body and logs the event on the server console', async () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		const response = await send(
			JSON.stringify({
				events: [{ type: 'vital', name: 'CLS', value: 0.01, rating: 'good', id: 'a', path: '/en' }]
			})
		);
		expect(response.status).toBe(204);
		expect(await response.text()).toBe('');
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(info).toHaveBeenCalledWith('[rum] vital', expect.stringContaining('"name":"CLS"'));
	});

	it('answers 400 for a payload that is not ours', async () => {
		expect((await send('{"events":[{"type":"x"}]}')).status).toBe(400);
	});
});
