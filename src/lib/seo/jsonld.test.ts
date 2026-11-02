import { describe, expect, it } from 'vitest';
import { articleJsonLd, breadcrumbJsonLd, organizationJsonLd, serializeJsonLd } from './jsonld.js';

describe('serializeJsonLd', () => {
	it('adds the schema.org context and keeps the data', () => {
		const parsed = JSON.parse(serializeJsonLd({ '@type': 'Thing', name: 'A' }));
		expect(parsed).toEqual({ '@context': 'https://schema.org', '@type': 'Thing', name: 'A' });
	});

	it('cannot be closed early by </script> in a value', () => {
		const json = serializeJsonLd({ '@type': 'Thing', name: '</script><script>alert(1)</script>' });
		expect(json).not.toContain('<');
		expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script>');
	});

	it('escapes the line separators and still parses back', () => {
		const name = 'a\u2028b\u2029c';
		const json = serializeJsonLd({ '@type': 'Thing', name });
		expect(json).not.toMatch(/[\u2028\u2029]/);
		expect(JSON.parse(json).name).toBe(name);
	});
});

describe('organizationJsonLd', () => {
	it('contains only the given fields', () => {
		expect(organizationJsonLd({ name: 'Demo', url: 'https://example.com' })).toEqual({
			'@type': 'Organization',
			name: 'Demo',
			url: 'https://example.com'
		});
	});

	it('adds description, logo and sameAs when present', () => {
		const org = organizationJsonLd({
			name: 'Demo',
			url: 'https://example.com',
			description: 'About',
			logo: 'https://example.com/logo.png',
			sameAs: ['https://social.example/demo']
		});
		expect(org).toMatchObject({
			description: 'About',
			logo: 'https://example.com/logo.png',
			sameAs: ['https://social.example/demo']
		});
	});

	it('drops an empty sameAs list', () => {
		expect(organizationJsonLd({ name: 'D', url: 'https://e.com', sameAs: [] })).not.toHaveProperty(
			'sameAs'
		);
	});
});

describe('breadcrumbJsonLd', () => {
	it('numbers the items from 1 in order', () => {
		const list = breadcrumbJsonLd([
			{ name: 'Home', url: 'https://e.com/en' },
			{ name: 'Blog', url: 'https://e.com/en/blog' },
			{ name: 'Post', url: 'https://e.com/en/blog/post' }
		]);
		expect(list['@type']).toBe('BreadcrumbList');
		const items = list.itemListElement as { position: number; name: string; item: string }[];
		expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
		expect(items[2]).toMatchObject({
			'@type': 'ListItem',
			name: 'Post',
			item: 'https://e.com/en/blog/post'
		});
	});
});

describe('articleJsonLd', () => {
	const input = {
		headline: 'Fast pages',
		description: 'How',
		url: 'https://e.com/en/blog/fast',
		datePublished: '2026-05-31T00:00:00Z',
		authorName: 'Omar',
		inLanguage: 'en',
		publisherName: 'Demo'
	};

	it('describes the article, its author and publisher', () => {
		expect(articleJsonLd(input)).toMatchObject({
			'@type': 'Article',
			headline: 'Fast pages',
			datePublished: '2026-05-31T00:00:00Z',
			inLanguage: 'en',
			mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://e.com/en/blog/fast' },
			author: { '@type': 'Person', name: 'Omar' },
			publisher: { '@type': 'Organization', name: 'Demo' }
		});
	});

	it('leaves out the image when there is none', () => {
		expect(articleJsonLd(input)).not.toHaveProperty('image');
		expect(articleJsonLd({ ...input, image: 'https://e.com/a.png' })).toHaveProperty('image');
	});
});
