import { describe, expect, it } from 'vitest';
import {
	localizePath,
	negotiateLocale,
	splitLocale,
	switchLocalePath,
	switchLocaleUrl
} from './locale';

describe('negotiateLocale', () => {
	it('defaults to English without a header', () => {
		expect(negotiateLocale(null)).toBe('en');
		expect(negotiateLocale(undefined)).toBe('en');
		expect(negotiateLocale('')).toBe('en');
	});

	it('picks a supported language', () => {
		expect(negotiateLocale('de')).toBe('de');
		expect(negotiateLocale('en')).toBe('en');
	});

	it('matches a regional tag to its language', () => {
		expect(negotiateLocale('de-CH')).toBe('de');
		expect(negotiateLocale('en-GB')).toBe('en');
	});

	it('honors quality values over header order', () => {
		expect(negotiateLocale('en;q=0.5, de;q=0.9')).toBe('de');
		expect(negotiateLocale('de-CH,de;q=0.9,en;q=0.8')).toBe('de');
		expect(negotiateLocale('en-US,en;q=0.9,de;q=0.8')).toBe('en');
	});

	it('keeps header order for equal quality', () => {
		expect(negotiateLocale('de, en')).toBe('de');
		expect(negotiateLocale('en, de')).toBe('en');
	});

	it('skips unsupported languages and takes the next supported one', () => {
		expect(negotiateLocale('fr, es;q=0.8, de;q=0.5')).toBe('de');
	});

	it('falls back when nothing is supported', () => {
		expect(negotiateLocale('fr, ja;q=0.7')).toBe('en');
	});

	it('never picks a language the client refused with q=0', () => {
		expect(negotiateLocale('de;q=0, en;q=0.5')).toBe('en');
		expect(negotiateLocale('de;q=0')).toBe('en');
	});

	it('treats a wildcard as "anything", i.e. the default', () => {
		expect(negotiateLocale('*')).toBe('en');
		expect(negotiateLocale('fr, *;q=0.1, de;q=0.05')).toBe('en');
	});

	it('is case-insensitive', () => {
		expect(negotiateLocale('DE-at')).toBe('de');
	});

	it('survives malformed input', () => {
		expect(negotiateLocale(';;;,,,')).toBe('en');
		expect(negotiateLocale('de;q=abc')).toBe('en');
		expect(negotiateLocale('x'.repeat(5000))).toBe('en');
		expect(negotiateLocale('de;q=1.5')).toBe('de');
	});
});

describe('splitLocale', () => {
	it('separates the locale from the rest of the path', () => {
		expect(splitLocale('/de/blog/my-post')).toEqual({ locale: 'de', rest: '/blog/my-post' });
		expect(splitLocale('/en')).toEqual({ locale: 'en', rest: '/' });
		expect(splitLocale('/en/')).toEqual({ locale: 'en', rest: '/' });
	});

	it('reports a path without a locale as it is', () => {
		expect(splitLocale('/blog')).toEqual({ locale: null, rest: '/blog' });
		expect(splitLocale('/')).toEqual({ locale: null, rest: '/' });
	});

	it('does not mistake a longer segment for a locale', () => {
		expect(splitLocale('/english/blog').locale).toBeNull();
		expect(splitLocale('/EN/blog').locale).toBeNull();
		expect(splitLocale('/deutsch').locale).toBeNull();
	});
});

describe('localizePath', () => {
	it('puts the locale in front of a path', () => {
		expect(localizePath('de', '/blog')).toBe('/de/blog');
		expect(localizePath('en', '/blog/my-post')).toBe('/en/blog/my-post');
	});

	it('maps the root to the bare locale', () => {
		expect(localizePath('en')).toBe('/en');
		expect(localizePath('de', '/')).toBe('/de');
	});

	it('accepts a path without the leading slash', () => {
		expect(localizePath('de', 'blog')).toBe('/de/blog');
	});
});

describe('switchLocalePath', () => {
	it('swaps the locale and keeps the page', () => {
		expect(switchLocalePath('/en/blog', 'de')).toBe('/de/blog');
		expect(switchLocalePath('/de/blog/my-post', 'en')).toBe('/en/blog/my-post');
		expect(switchLocalePath('/en', 'de')).toBe('/de');
	});

	it('is a no-op for the current locale', () => {
		expect(switchLocalePath('/en/blog', 'en')).toBe('/en/blog');
	});

	it('gives a path without a locale one', () => {
		expect(switchLocalePath('/blog', 'de')).toBe('/de/blog');
		expect(switchLocalePath('/', 'de')).toBe('/de');
	});

	it('only touches the first segment', () => {
		expect(switchLocalePath('/en/blog/de', 'de')).toBe('/de/blog/de');
	});
});

describe('switchLocaleUrl', () => {
	it('keeps the query string and the hash', () => {
		const url = new URL('https://example.test/en/search?q=a%26b&tag=perf#results');
		expect(switchLocaleUrl(url, 'de')).toBe('/de/search?q=a%26b&tag=perf#results');
	});

	it('works for a page with no query', () => {
		expect(switchLocaleUrl(new URL('https://example.test/de/blog'), 'en')).toBe('/en/blog');
	});
});
