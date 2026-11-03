import { afterEach, describe, expect, it, vi } from 'vitest';
import { beacon, reportError, startRum, type Transport } from './client';

let stop: (() => void) | undefined;
// Not the window: the test runner treats an error event on it as a failure of the test itself.
let target = new EventTarget();
afterEach(() => {
	stop?.();
	stop = undefined;
	target = new EventTarget();
});

function start(sampleRate = 0) {
	const transport = vi.fn<Transport>(() => true);
	stop = startRum({ endpoint: '/api/vitals', sampleRate, transport, target });
	const bodies = () =>
		transport.mock.calls.flatMap(([, body]) => (JSON.parse(body) as { events: unknown[] }).events);
	return { transport, bodies };
}

describe('startRum', () => {
	it('reports an uncaught error from the window', () => {
		const { bodies } = start();
		target.dispatchEvent(
			new ErrorEvent('error', { error: new Error('uncaught'), message: 'uncaught' })
		);
		expect(bodies()).toEqual([
			expect.objectContaining({ type: 'error', source: 'window', message: 'uncaught' })
		]);
	});

	it('reports an unhandled promise rejection', () => {
		const { bodies } = start();
		const event = new Event('unhandledrejection') as PromiseRejectionEvent;
		Object.defineProperty(event, 'reason', { value: new Error('rejected') });
		target.dispatchEvent(event);
		expect(bodies()).toEqual([
			expect.objectContaining({ type: 'error', source: 'promise', message: 'rejected' })
		]);
	});

	it('lets hooks and boundaries report through reportError', () => {
		const { bodies } = start();
		reportError(new Error('render'), 'boundary', 'abc12345');
		expect(bodies()).toEqual([
			expect.objectContaining({ source: 'boundary', message: 'render', id: 'abc12345' })
		]);
	});

	it('stops listening, and reportError goes quiet, once stopped', () => {
		const { transport } = start();
		stop?.();
		stop = undefined;
		target.dispatchEvent(new ErrorEvent('error', { error: new Error('late') }));
		reportError(new Error('late too'), 'hook');
		expect(transport).not.toHaveBeenCalled();
	});

	it('sends the path of the page, without its query', () => {
		history.replaceState(null, '', '/some/page?q=secret#frag');
		try {
			const { bodies } = start();
			reportError(new Error('here'), 'hook');
			expect(bodies()).toEqual([expect.objectContaining({ path: '/some/page' })]);
		} finally {
			history.replaceState(null, '', '/');
		}
	});
});

describe('beacon', () => {
	it('hands the body to sendBeacon as JSON', () => {
		const spy = vi.spyOn(navigator, 'sendBeacon').mockReturnValue(true);
		expect(beacon('/api/vitals', '{"events":[]}')).toBe(true);
		const [url, blob] = spy.mock.calls[0] as [string, Blob];
		expect(url).toBe('/api/vitals');
		expect(blob.type).toBe('application/json');
		spy.mockRestore();
	});

	it('falls back to a keepalive fetch when the browser refuses the beacon', () => {
		const spy = vi.spyOn(navigator, 'sendBeacon').mockReturnValue(false);
		const fetchSpy = vi
			.spyOn(window, 'fetch')
			.mockResolvedValue(new Response(null, { status: 204 }));
		expect(beacon('/api/vitals', '{"events":[]}')).toBe(true);
		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/vitals',
			expect.objectContaining({ method: 'POST', keepalive: true })
		);
		spy.mockRestore();
		fetchSpy.mockRestore();
	});
});
