import { describe, expect, it, vi } from 'vitest';
import { MAX_BODY_BYTES, receiveBeacon } from './rum';

const vital = {
	type: 'vital',
	name: 'LCP',
	value: 1500,
	rating: 'good',
	id: 'v5-1',
	path: '/en'
};
const error = { type: 'error', source: 'boundary', message: 'boom', id: 'abc12345', path: '/en' };

const post = (body: string, type = 'application/json') =>
	new Request('https://example.test/api/vitals', {
		method: 'POST',
		headers: { 'content-type': type },
		body
	});
const log = () => ({ info: vi.fn(), error: vi.fn() });

describe('receiveBeacon', () => {
	it('accepts a batch and logs every event', async () => {
		const out = log();
		expect(await receiveBeacon(post(JSON.stringify({ events: [vital, error] })), out)).toEqual({
			status: 204
		});
		expect(out.info).toHaveBeenCalledWith('[rum] vital', JSON.stringify(vital));
		expect(out.error).toHaveBeenCalledWith('[rum] client error', JSON.stringify(error));
	});

	it('accepts the plain-text type some beacons carry', async () => {
		const body = JSON.stringify({ events: [vital] });
		const { status } = await receiveBeacon(post(body, 'text/plain;charset=UTF-8'), log());
		expect(status).toBe(204);
	});

	it('refuses a body that is not JSON', async () => {
		const out = log();
		expect(await receiveBeacon(post('{nope'), out)).toEqual({ status: 400 });
		expect(out.info).not.toHaveBeenCalled();
	});

	it('refuses a batch with one bad event whole, logging none of it', async () => {
		const out = log();
		const body = JSON.stringify({ events: [vital, { ...vital, value: -1 }] });
		expect(await receiveBeacon(post(body), out)).toEqual({ status: 400 });
		expect(out.info).not.toHaveBeenCalled();
	});

	it('refuses other content types', async () => {
		const { status } = await receiveBeacon(post('a=b', 'application/x-www-form-urlencoded'), log());
		expect(status).toBe(415);
	});

	it('refuses a body over the limit, declared or not', async () => {
		const huge = JSON.stringify({ events: [{ ...error, message: 'x'.repeat(MAX_BODY_BYTES) }] });
		expect((await receiveBeacon(post(huge), log())).status).toBe(413);
		const lying = post(JSON.stringify({ events: [vital] }));
		lying.headers.set('content-length', String(MAX_BODY_BYTES + 1));
		expect((await receiveBeacon(lying, log())).status).toBe(413);
	});

	it('writes a visitor-supplied message as data, so it cannot forge a log line', async () => {
		const out = log();
		const message = 'x\n[rum] vital {"fake":true}';
		await receiveBeacon(post(JSON.stringify({ events: [{ ...error, message }] })), out);
		const [, line] = out.error.mock.calls[0] as [string, string];
		expect(line).not.toContain('\n');
		expect(JSON.parse(line).message).toBe(message);
	});
});
