import { describe, expect, it } from 'vitest';
import { buildSeo, type SeoInput } from './seo.js';

const base: SeoInput = {
	origin: 'https://example.com/',
	path: '/de/blog',
	title: 'Blog',
	description: 'Posts',
	siteName: 'Demo',
	lang: 'de',
	alternates: [
		{ hreflang: 'en', path: '/en/blog' },
		{ hreflang: 'de', path: '/de/blog' }
	],
	defaultPath: '/en/blog'
};

describe('buildSeo', () => {
	it('makes the canonical URL absolute and drops a trailing slash of the origin', () => {
		expect(buildSeo(base).canonical).toBe('https://example.com/de/blog');
	});

	it('lists every language plus x-default with absolute URLs', () => {
		expect(buildSeo(base).alternates).toEqual([
			{ hreflang: 'en', href: 'https://example.com/en/blog' },
			{ hreflang: 'de', href: 'https://example.com/de/blog' },
			{ hreflang: 'x-default', href: 'https://example.com/en/blog' }
		]);
	});

	it('omits x-default when no default path is given', () => {
		const { alternates } = buildSeo({ ...base, defaultPath: undefined });
		expect(alternates.some((a) => a.hreflang === 'x-default')).toBe(false);
	});

	it('fills Open Graph and Twitter from the same title and description', () => {
		const tags = buildSeo(base);
		expect(tags.openGraph).toMatchObject({
			'og:type': 'website',
			'og:title': 'Blog',
			'og:description': 'Posts',
			'og:url': 'https://example.com/de/blog',
			'og:locale': 'de'
		});
		expect(tags.twitter).toMatchObject({ 'twitter:card': 'summary', 'twitter:title': 'Blog' });
	});

	it('adds the image and switches to the large Twitter card', () => {
		const tags = buildSeo({ ...base, image: '/og.png' });
		expect(tags.openGraph['og:image']).toBe('https://example.com/og.png');
		expect(tags.twitter['twitter:image']).toBe('https://example.com/og.png');
		expect(tags.twitter['twitter:card']).toBe('summary_large_image');
	});

	it('keeps an absolute image URL as is', () => {
		const tags = buildSeo({ ...base, image: 'https://cdn.example.com/a.png' });
		expect(tags.openGraph['og:image']).toBe('https://cdn.example.com/a.png');
	});

	it('adds the image size only when it is given', () => {
		const plain = buildSeo({ ...base, image: '/og.png' });
		expect(plain.openGraph).not.toHaveProperty('og:image:width');
		const sized = buildSeo({ ...base, image: '/og.png', imageSize: { width: 1200, height: 630 } });
		expect(sized.openGraph).toMatchObject({ 'og:image:width': '1200', 'og:image:height': '630' });
	});
});
