import { describe, expect, it, vi } from 'vitest';
import { createRum } from './client';
import { rumPayloadSchema } from './schema';

const metric = (name: string, value: number) =>
	({ name, value, rating: 'good', id: `id-${name}`, navigationType: 'navigate' }) as never;

function setup(options: { sampleRate?: number; random?: () => number; errorLimit?: number } = {}) {
	const sent: { url: string; body: string }[] = [];
	const transport = vi.fn((url: string, body: string) => {
		sent.push({ url, body });
		return true;
	});
	const rum = createRum({
		endpoint: '/api/vitals',
		sampleRate: 1,
		path: () => '/en/blog',
		transport,
		...options
	});
	const events = () => sent.flatMap(({ body }) => JSON.parse(body).events);
	return { rum, sent, events, transport };
}

describe('createRum, vitals', () => {
	it('holds vitals until the page is hidden, then sends them in one batch', () => {
		const { rum, sent, events } = setup();
		rum.vital(metric('LCP', 1200));
		rum.vital(metric('CLS', 0.02));
		expect(sent).toHaveLength(0);
		rum.flush();
		expect(sent).toHaveLength(1);
		expect(sent[0].url).toBe('/api/vitals');
		expect(events().map((event: { name: string }) => event.name)).toEqual(['LCP', 'CLS']);
	});

	it('sends what the server accepts', () => {
		const { rum, sent } = setup();
		rum.vital(metric('INP', 180));
		rum.error(new Error('boom'), 'boundary', 'abc12345');
		rum.flush();
		for (const { body } of sent) {
			expect(rumPayloadSchema.safeParse(JSON.parse(body)).success).toBe(true);
		}
	});

	it('keeps only the latest value of a metric that revises itself', () => {
		const { rum, events } = setup();
		rum.vital(metric('CLS', 0.01));
		rum.vital(metric('CLS', 0.3));
		rum.flush();
		expect(events()).toHaveLength(1);
		expect(events()[0]).toMatchObject({ name: 'CLS', value: 0.3, path: '/en/blog' });
	});

	it('keeps a metric on the page its load began on, however far the visitor navigates', () => {
		let current = '/en';
		const sent: string[] = [];
		const rum = createRum({
			endpoint: '/api/vitals',
			sampleRate: 1,
			path: () => current,
			transport: (_url, body) => !!sent.push(body)
		});
		current = '/en/blog';
		rum.vital(metric('INP', 40));
		rum.error(new Error('later'), 'hook');
		const events = sent.flatMap((body) => JSON.parse(body).events);
		expect(events.find((event: { type: string }) => event.type === 'vital').path).toBe('/en');
		expect(events.find((event: { type: string }) => event.type === 'error').path).toBe('/en/blog');
	});

	it('sends nothing twice', () => {
		const { rum, transport } = setup();
		rum.vital(metric('LCP', 1200));
		rum.flush();
		rum.flush();
		expect(transport).toHaveBeenCalledOnce();
	});

	it('sends nothing when there is nothing to send', () => {
		const { rum, transport } = setup();
		rum.flush();
		expect(transport).not.toHaveBeenCalled();
	});

	it('ignores a metric it does not collect', () => {
		const { rum, transport } = setup();
		rum.vital(metric('FID', 10));
		rum.flush();
		expect(transport).not.toHaveBeenCalled();
	});

	it('sends no vitals from a load outside the sample', () => {
		const { rum, transport } = setup({ sampleRate: 0.1, random: () => 0.5 });
		expect(rum.sampled).toBe(false);
		rum.vital(metric('LCP', 1200));
		rum.flush();
		expect(transport).not.toHaveBeenCalled();
	});

	it('sends vitals from a load inside the sample', () => {
		const { rum, transport } = setup({ sampleRate: 0.1, random: () => 0.05 });
		expect(rum.sampled).toBe(true);
		rum.vital(metric('LCP', 1200));
		rum.flush();
		expect(transport).toHaveBeenCalledOnce();
	});
});

describe('createRum, errors', () => {
	it('reports an error at once, even from a load outside the sample', () => {
		const { rum, events } = setup({ sampleRate: 0, random: () => 0.9 });
		rum.error(new Error('render failed'), 'boundary', 'abc12345');
		expect(events()).toEqual([
			expect.objectContaining({
				type: 'error',
				source: 'boundary',
				message: 'render failed',
				id: 'abc12345',
				path: '/en/blog'
			})
		]);
		expect(events()[0].stack).toContain('render failed');
	});

	it('takes whatever was thrown', () => {
		const { rum, events } = setup({ errorLimit: 10 });
		rum.error('just text', 'window');
		rum.error({ code: 7 }, 'promise');
		rum.error(undefined, 'hook');
		rum.error(new Error(''), 'hook');
		expect(events().map((event: { message: string }) => event.message)).toEqual([
			'just text',
			'{"code":7}',
			'undefined',
			'Error'
		]);
	});

	it('reports the same error once', () => {
		const { rum, transport } = setup();
		for (let i = 0; i < 20; i++) rum.error(new Error('loop'), 'boundary');
		expect(transport).toHaveBeenCalledOnce();
	});

	it('caps the distinct errors a page can report', () => {
		const { rum, transport } = setup({ errorLimit: 3 });
		for (let i = 0; i < 10; i++) rum.error(new Error(`e${i}`), 'window');
		expect(transport).toHaveBeenCalledTimes(3);
	});

	it('clips a huge message and stack to what the server takes', () => {
		const { rum, sent } = setup();
		const big = new Error('m'.repeat(5000));
		big.stack = 's'.repeat(9000);
		rum.error(big, 'boundary');
		expect(rumPayloadSchema.safeParse(JSON.parse(sent[0].body)).success).toBe(true);
	});

	it('does not throw when the transport does', () => {
		const rum = createRum({
			endpoint: '/x',
			sampleRate: 1,
			path: () => '/',
			transport: () => {
				throw new Error('offline');
			}
		});
		expect(() => rum.error(new Error('a'), 'window')).not.toThrow();
	});
});
