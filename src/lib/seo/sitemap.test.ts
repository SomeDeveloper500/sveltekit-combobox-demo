import { describe, expect, it } from 'vitest';
import { buildSitemap } from './sitemap.js';

describe('buildSitemap', () => {
	it('wraps the entries in a urlset with the xhtml namespace', () => {
		const xml = buildSitemap([{ loc: 'https://e.com/en' }]);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
		expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
		expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
	});

	it('writes loc and lastmod', () => {
		const xml = buildSitemap([{ loc: 'https://e.com/en/blog/a', lastmod: '2026-05-31T00:00:00Z' }]);
		expect(xml).toContain('<loc>https://e.com/en/blog/a</loc>');
		expect(xml).toContain('<lastmod>2026-05-31T00:00:00Z</lastmod>');
	});

	it('leaves out lastmod when there is none', () => {
		expect(buildSitemap([{ loc: 'https://e.com/en' }])).not.toContain('<lastmod>');
	});

	it('lists every language version, itself included, in each url', () => {
		const alternates = [
			{ hreflang: 'en', href: 'https://e.com/en/blog' },
			{ hreflang: 'de', href: 'https://e.com/de/blog' },
			{ hreflang: 'x-default', href: 'https://e.com/en/blog' }
		];
		const xml = buildSitemap([
			{ loc: 'https://e.com/en/blog', alternates },
			{ loc: 'https://e.com/de/blog', alternates }
		]);
		expect(xml.match(/<url>/g)).toHaveLength(2);
		expect(xml.match(/<xhtml:link /g)).toHaveLength(6);
		expect(xml).toContain('hreflang="x-default" href="https://e.com/en/blog"');
	});

	it('escapes characters that are special in XML', () => {
		const xml = buildSitemap([{ loc: 'https://e.com/search?q=a&tag=b' }]);
		expect(xml).toContain('<loc>https://e.com/search?q=a&amp;tag=b</loc>');
		expect(xml).not.toContain('q=a&tag');
	});

	it('is an empty urlset for no entries', () => {
		expect(buildSitemap([])).toContain('</urlset>');
		expect(buildSitemap([])).not.toContain('<url>');
	});
});
