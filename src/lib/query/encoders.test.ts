import { describe, expect, it } from 'vitest';
import { blogQueryCodec, itemsQueryCodec, postQueryCodec } from './codecs';
import { blogQueryEncoder, itemsQueryEncoder, postQueryEncoder } from './encoders';

describe('the page-side encoders agree with the codecs that read the URL', () => {
	it.each([
		['items', itemsQueryEncoder, itemsQueryCodec],
		['posts', postQueryEncoder, postQueryCodec],
		['blog', blogQueryEncoder, blogQueryCodec]
	] as const)('%s: same defaults, in the same order', (_name, encoder, codec) => {
		expect(encoder.defaults).toEqual(codec.defaults);
		// The order is the order of the URL, and the canonical redirect compares URLs.
		expect(Object.keys(encoder.defaults)).toEqual(Object.keys(codec.defaults));
	});

	it('write the same URL for a state, field by field', () => {
		const state = {
			...itemsQueryCodec.defaults,
			status: 'active',
			sort: 'budget',
			page: 3
		} as const;
		expect(itemsQueryEncoder.encode(state).toString()).toBe(
			itemsQueryCodec.encode(state).toString()
		);
		expect(itemsQueryEncoder.withQuery(state, { q: 'x' })).toBe(
			itemsQueryCodec.withQuery(state, { q: 'x' })
		);
	});
});
