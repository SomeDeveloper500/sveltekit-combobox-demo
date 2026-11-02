import { describe, expect, it } from 'vitest';
import { buildRobots } from './robots.js';

describe('buildRobots', () => {
	it('addresses every crawler and points to the sitemap', () => {
		const text = buildRobots({ disallow: ['/sandbox'], sitemap: 'https://e.com/sitemap.xml' });
		expect(text.startsWith('User-agent: *\n')).toBe(true);
		expect(text).toContain('Sitemap: https://e.com/sitemap.xml');
	});

	it('writes one Disallow line per path', () => {
		const text = buildRobots({
			disallow: ['/sandbox', '/en/dashboard', '/de/dashboard'],
			sitemap: 'https://e.com/sitemap.xml'
		});
		expect(text.match(/^Disallow: /gm)).toHaveLength(3);
		expect(text).toContain('Disallow: /de/dashboard\n');
	});

	it('allows everything when nothing is disallowed', () => {
		const text = buildRobots({ disallow: [], sitemap: 'https://e.com/sitemap.xml' });
		expect(text).toContain('Disallow:\n');
		expect(text).not.toContain('Disallow: /');
	});

	it('ends with a newline', () => {
		expect(buildRobots({ disallow: [], sitemap: 'https://e.com/s.xml' }).endsWith('\n')).toBe(true);
	});
});
