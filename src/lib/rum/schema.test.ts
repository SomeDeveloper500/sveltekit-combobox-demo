import { describe, expect, it } from 'vitest';
import { MAX_EVENTS, rumPayloadSchema } from './schema';

const vital = {
	type: 'vital',
	name: 'LCP',
	value: 1234.5,
	rating: 'good',
	id: 'v5-1',
	navigationType: 'navigate',
	path: '/en/blog'
};
const error = { type: 'error', source: 'boundary', message: 'boom', path: '/en' };
const accepts = (event: unknown) => rumPayloadSchema.safeParse({ events: [event] }).success;

describe('rumPayloadSchema', () => {
	it('accepts a vital and an error, in one batch', () => {
		expect(rumPayloadSchema.safeParse({ events: [vital, error] }).success).toBe(true);
	});

	it.each(['LCP', 'INP', 'CLS', 'TTFB'])('accepts %s', (name) => {
		expect(accepts({ ...vital, name })).toBe(true);
	});

	it('refuses a metric we do not collect', () => {
		expect(accepts({ ...vital, name: 'FID' })).toBe(false);
	});

	it('refuses values that are not measurements', () => {
		for (const value of [-1, NaN, Infinity, 600_001, '12']) {
			expect(accepts({ ...vital, value }), String(value)).toBe(false);
		}
		expect(accepts({ ...vital, value: 0 })).toBe(true);
	});

	it('refuses an unknown rating and a missing id', () => {
		expect(accepts({ ...vital, rating: 'great' })).toBe(false);
		expect(accepts({ ...vital, id: '' })).toBe(false);
	});

	it('refuses a path with a query or fragment, which can carry a secret', () => {
		expect(accepts({ ...vital, path: '/en/search?q=secret' })).toBe(false);
		expect(accepts({ ...vital, path: '/en#token' })).toBe(false);
		expect(accepts({ ...vital, path: 'en/blog' })).toBe(false);
		expect(accepts({ ...vital, path: `/${'a'.repeat(200)}` })).toBe(false);
	});

	it('refuses an error without a message, from an unknown place, or with a huge stack', () => {
		expect(accepts({ ...error, message: '' })).toBe(false);
		expect(accepts({ ...error, source: 'elsewhere' })).toBe(false);
		expect(accepts({ ...error, stack: 'x'.repeat(4001) })).toBe(false);
		expect(accepts({ ...error, stack: 'x'.repeat(4000) })).toBe(true);
	});

	it('refuses an unknown event type', () => {
		expect(accepts({ type: 'click', path: '/' })).toBe(false);
	});

	it('refuses an empty batch and one over the limit', () => {
		expect(rumPayloadSchema.safeParse({ events: [] }).success).toBe(false);
		const many = Array.from({ length: MAX_EVENTS + 1 }, () => vital);
		expect(rumPayloadSchema.safeParse({ events: many }).success).toBe(false);
		expect(rumPayloadSchema.safeParse({ events: many.slice(1) }).success).toBe(true);
	});

	it('drops fields it does not know instead of passing them on', () => {
		const parsed = rumPayloadSchema.parse({ events: [{ ...vital, cookie: 'session=abc' }] });
		expect(parsed.events[0]).not.toHaveProperty('cookie');
	});
});
