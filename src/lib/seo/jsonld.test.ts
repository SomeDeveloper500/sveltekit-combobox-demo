import { describe, expect, it } from 'vitest';
import { organizationJsonLd, serializeJsonLd } from './jsonld.js';

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
