import { describe, expect, it } from 'vitest';
import { dictionaries } from '#lib/i18n/messages.js';
import { NAV_ITEMS, isCurrent, type NavItem } from './nav';

const home: NavItem = { path: '/', label: 'nav.home' };
const blog: NavItem = { path: '/blog', label: 'nav.blog' };

describe('isCurrent', () => {
	it('matches the home item only on the home page', () => {
		expect(isCurrent(home, '/')).toBe(true);
		expect(isCurrent(home, '/blog')).toBe(false);
		expect(isCurrent(home, '/blog/some-post')).toBe(false);
	});

	it('matches a section item on the section and on its subpages', () => {
		expect(isCurrent(blog, '/blog')).toBe(true);
		expect(isCurrent(blog, '/blog/some-post')).toBe(true);
		expect(isCurrent(blog, '/blog/')).toBe(true);
	});

	it('does not match a section that merely starts with the same letters', () => {
		expect(isCurrent(blog, '/blogger')).toBe(false);
		expect(isCurrent(blog, '/blog-archive')).toBe(false);
		expect(isCurrent(blog, '/search')).toBe(false);
	});

	it('ignores a trailing slash on the current path', () => {
		expect(isCurrent(home, '/')).toBe(true);
		expect(isCurrent(blog, '/blog//')).toBe(true);
	});
});

describe('the navigation list', () => {
	it('uses labels that exist in the dictionaries', () => {
		for (const item of NAV_ITEMS) {
			expect(dictionaries.en, item.label).toHaveProperty([item.label]);
			expect(dictionaries.de, item.label).toHaveProperty([item.label]);
		}
	});

	it('has unique, absolute paths without a locale', () => {
		const paths = NAV_ITEMS.map((item) => item.path);
		expect(new Set(paths).size).toBe(paths.length);
		for (const path of paths) {
			expect(path.startsWith('/'), path).toBe(true);
			expect(path, path).not.toMatch(/^\/(en|de)(\/|$)/);
		}
	});

	it('starts with the home page', () => {
		expect(NAV_ITEMS[0].path).toBe('/');
	});
});
