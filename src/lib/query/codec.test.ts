import { describe, expect, it } from 'vitest';
import { ITEM_CHANNELS, ITEM_STATUSES } from '#lib/schemas/item.js';
import {
	ITEM_SORT_KEYS,
	PER_PAGE_OPTIONS,
	POST_SORTS,
	SORT_DIRECTIONS,
	type ItemsQuery
} from '#lib/schemas/query.js';
import { itemsQueryCodec as items, postQueryCodec as posts } from './codecs';

const search = (query: string) => new URLSearchParams(query);

describe('decode: URL → typed query', () => {
	it('gives the defaults for an empty URL', () => {
		expect(items.decode(search(''))).toEqual(items.defaults);
		expect(items.decode(search(''))).toMatchObject({ page: 1, perPage: 10, sort: 'updatedAt' });
	});

	it('reads valid values and coerces numbers', () => {
		expect(
			items.decode(search('page=3&perPage=25&sort=budget&dir=asc&status=paused'))
		).toMatchObject({
			page: 3,
			perPage: 25,
			sort: 'budget',
			dir: 'asc',
			status: 'paused'
		});
	});

	it('accepts a plain string, with or without the leading ?', () => {
		expect(items.decode('?status=active').status).toBe('active');
		expect(items.decode('status=active').status).toBe('active');
	});

	it('falls back per field on garbage and never throws', () => {
		const decoded = items.decode(search('page=abc&perPage=7&sort=password&dir=up&status=gone'));
		expect(decoded).toEqual(items.defaults);
	});

	it('keeps the good fields next to a bad one', () => {
		const decoded = items.decode(search('page=2&sort=nope&status=active'));
		expect(decoded).toMatchObject({ page: 2, sort: 'updatedAt', status: 'active' });
	});

	it('ignores unknown parameters', () => {
		expect(items.decode(search('utm_source=mail&status=active&__proto__=x'))).toEqual({
			...items.defaults,
			status: 'active'
		});
	});

	it('takes the first value of a repeated parameter', () => {
		expect(items.decode(search('status=active&status=paused')).status).toBe('active');
		expect(posts.decode(search('q=first&q=second')).q).toBe('first');
	});

	it('decodes percent-escapes and plus signs in text', () => {
		expect(posts.decode(search('q=caf%C3%A9+au+lait')).q).toBe('café au lait');
		expect(posts.decode(search('q=a%26b%3Dc')).q).toBe('a&b=c');
	});

	it('trims the search text and caps its length', () => {
		expect(posts.decode(search('q=%20%20svelte%20')).q).toBe('svelte');
		expect(posts.decode(search(`q=${'x'.repeat(300)}`)).q).toBe('');
	});
});

describe('encode: typed query → canonical URL', () => {
	it('omits every default, so the default state is an empty query', () => {
		expect(items.encode(items.defaults).toString()).toBe('');
		expect(items.encode({}).toString()).toBe('');
	});

	it('writes only what differs from the defaults', () => {
		expect(items.encode({ status: 'active', page: 2 }).toString()).toBe('page=2&status=active');
	});

	it('always uses the same key order, whatever the order of the input', () => {
		const a = items.encode({ status: 'active', sort: 'name', page: 3 }).toString();
		const b = items.encode({ page: 3, sort: 'name', status: 'active' }).toString();
		expect(a).toBe(b);
		expect(a).toBe('page=3&sort=name&status=active');
	});

	it('escapes text so it survives a round trip', () => {
		const text = 'a&b=c d+e/é?#"\'%';
		const encoded = posts.encode({ q: text }).toString();
		expect(encoded).not.toContain('&b=');
		expect(posts.decode(search(encoded)).q).toBe(text);
	});

	it('encodes numbers without noise', () => {
		expect(items.encode({ perPage: 50 }).toString()).toBe('perPage=50');
	});
});

describe('round trip: decode(encode(q)) is q', () => {
	// Every status, channel, sort, direction and page size, walked in lockstep, plus text.
	const states: ItemsQuery[] = Array.from({ length: 36 }, (_, index) => ({
		page: (index % 5) + 1,
		perPage: PER_PAGE_OPTIONS[index % PER_PAGE_OPTIONS.length],
		sort: ITEM_SORT_KEYS[index % ITEM_SORT_KEYS.length],
		dir: SORT_DIRECTIONS[index % SORT_DIRECTIONS.length],
		q: ['', 'spring', 'Café & Co', 'a=b', '日本語', '100%'][index % 6],
		status: ['', ...ITEM_STATUSES][index % (ITEM_STATUSES.length + 1)] as ItemsQuery['status'],
		channel: ['', ...ITEM_CHANNELS][index % (ITEM_CHANNELS.length + 1)] as ItemsQuery['channel'],
		owner: ['', 'u_anna', 'u_marek'][index % 3]
	}));

	it.each(states.map((state, index) => [index, state] as const))('state #%i', (_index, state) => {
		expect(items.decode(items.encode(state))).toEqual(state);
	});

	it('is stable: encoding a decoded URL gives the same URL', () => {
		for (const state of states) {
			const once = items.encode(state).toString();
			const twice = items.encode(items.decode(search(once))).toString();
			expect(twice).toBe(once);
		}
	});

	it('works for the blog and search query too', () => {
		for (const sort of POST_SORTS) {
			const state = { q: 'edge cases', tag: 'performance', sort, page: 2 };
			expect(posts.decode(posts.encode(state))).toEqual(state);
		}
	});
});

describe('canonical: one URL per state', () => {
	it('drops defaults, junk and unknown parameters', () => {
		expect(items.canonical('page=1&sort=bogus&status=active&utm=x')).toBe('status=active');
	});

	it('reorders parameters into the canonical order', () => {
		expect(items.canonical('status=active&page=2')).toBe('page=2&status=active');
	});

	it('leaves an already canonical query alone', () => {
		expect(items.canonical('page=2&status=active')).toBe('page=2&status=active');
	});

	it('is empty for the default state, which is how a route spots "?page=1" as a duplicate', () => {
		expect(items.canonical('page=1')).toBe('');
		expect(posts.canonical('page=1&sort=newest')).toBe('');
	});
});

describe('withQuery: the link for a state change', () => {
	const current = items.decode(search('page=3&status=active&sort=name'));

	it('changes the page and keeps the filters', () => {
		expect(items.withQuery(current, { page: 4 })).toBe('?page=4&sort=name&status=active');
	});

	it('returns to the first page when a filter changes', () => {
		expect(items.withQuery(current, { channel: 'sms' })).toBe(
			'?sort=name&status=active&channel=sms'
		);
	});

	it('returns to the first page when the sort or page size changes', () => {
		expect(items.withQuery(current, { dir: 'asc' })).not.toContain('page=');
		expect(items.withQuery(current, { perPage: 25 })).not.toContain('page=');
	});

	it('keeps an explicit page given together with other changes', () => {
		expect(items.withQuery(current, { status: 'paused', page: 2 })).toContain('page=2');
	});

	it('does not reset the page when nothing actually changes', () => {
		expect(items.withQuery(current, { status: 'active' })).toContain('page=3');
	});

	it('clears a filter by setting it back to "any"', () => {
		const next = items.withQuery(current, { status: '' });
		expect(next).toBe('?sort=name');
		expect(next).not.toContain('status');
	});

	it('is just "?" for the default state, which links to the bare path', () => {
		expect(items.withQuery(items.defaults, {})).toBe('?');
		expect(items.withQuery(current, { page: 1, status: '', sort: 'updatedAt' })).toBe('?');
	});

	it('produces a link that decodes back to the intended state', () => {
		const link = items.withQuery(current, { owner: 'u_anna', q: 'café' });
		expect(items.decode(search(link.slice(1)))).toEqual({
			...current,
			owner: 'u_anna',
			q: 'café',
			page: 1
		});
	});

	it('works for the search page: a new query starts from page 1', () => {
		const here = posts.decode(search('q=old&page=3'));
		expect(posts.withQuery(here, { q: 'new' })).toBe('?q=new');
		expect(posts.withQuery(here, { page: 4 })).toBe('?q=old&page=4');
	});
});
