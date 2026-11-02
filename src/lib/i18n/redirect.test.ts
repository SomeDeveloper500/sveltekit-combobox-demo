import { describe, expect, it } from 'vitest';
import { LOCALIZED_SECTIONS, localeRedirect } from './redirect';

const go = (pathname: string, acceptLanguage: string | null = null, search = '', method = 'GET') =>
	localeRedirect({ method, pathname, search, acceptLanguage });

describe('the root', () => {
	it('goes to the language the browser asks for', () => {
		expect(go('/', 'de-DE,de;q=0.9,en;q=0.8')).toBe('/de');
		expect(go('/', 'en-US,en;q=0.9')).toBe('/en');
	});

	it('goes to English without a preference or with an unsupported one', () => {
		expect(go('/')).toBe('/en');
		expect(go('/', 'fr-FR,fr;q=0.9')).toBe('/en');
	});

	it('keeps the query string', () => {
		expect(go('/', 'de', '?utm_source=mail')).toBe('/de?utm_source=mail');
	});
});

describe('sections without a locale', () => {
	it.each(LOCALIZED_SECTIONS)('sends /%s to the visitor language', (section) => {
		expect(go(`/${section}`, 'de')).toBe(`/de/${section}`);
		expect(go(`/${section}`, 'en')).toBe(`/en/${section}`);
	});

	it('keeps the rest of the path and the query', () => {
		expect(go('/blog/my-post', 'de')).toBe('/de/blog/my-post');
		expect(go('/search', 'en', '?q=a%26b&tag=perf')).toBe('/en/search?q=a%26b&tag=perf');
		expect(go('/dashboard/items', 'de', '?page=2')).toBe('/de/dashboard/items?page=2');
	});
});

describe('requests that are left alone', () => {
	it('does not touch a path that already has a locale', () => {
		expect(go('/en', 'de')).toBeNull();
		expect(go('/de/blog', 'en')).toBeNull();
		expect(go('/en/anything/at/all', 'de')).toBeNull();
	});

	it('does not invent a locale for other paths', () => {
		const others = ['/sandbox', '/robots.txt', '/favicon.ico', '/nope', '/blogger', '/fr/blog'];
		for (const path of others) expect(go(path, 'de'), path).toBeNull();
	});

	it('only redirects reads', () => {
		expect(go('/', 'de', '', 'HEAD')).toBe('/de');
		expect(go('/blog', 'de', '', 'POST')).toBeNull();
		expect(go('/', 'de', '', 'PUT')).toBeNull();
		expect(go('/login', 'de', '', 'DELETE')).toBeNull();
	});
});

describe('safety', () => {
	it('never produces a target that leaves the site', () => {
		const hostile = ['//evil.test', '//evil.test/blog', '/blog//evil.test', '/%2F%2Fevil.test'];
		for (const path of hostile) {
			const target = go(path, 'de');
			if (target !== null) {
				expect(target.startsWith('/'), path).toBe(true);
				expect(target.startsWith('//'), path).toBe(false);
			}
		}
	});

	it('treats a double slash as a different path, not as the root', () => {
		expect(go('//evil.test', 'de')).toBeNull();
	});
});
