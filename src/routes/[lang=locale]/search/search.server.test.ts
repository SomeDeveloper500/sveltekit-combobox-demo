import { describe, expect, it } from 'vitest';
import { load } from './+page.server';

type Event = Parameters<typeof load>[0];

function run(search: string, lang: 'en' | 'de' = 'en') {
	const headers: Record<string, string> = {};
	const event = {
		url: new URL(`https://example.test/${lang}/search${search}`),
		params: { lang },
		setHeaders: (h: Record<string, string>) => Object.assign(headers, h)
	} as unknown as Event;
	try {
		const data = load(event) as unknown as {
			query: { q: string; tag: string; sort: string; page: number };
			result: { total: number; pages: number; posts: { title: string; tags: string[] }[] };
			tags: { value: string; label: string }[];
		};
		return { data, headers, redirect: null as string | null };
	} catch (thrown) {
		const { status, location } = thrown as { status: number; location: string };
		return { data: null, headers, redirect: `${status} ${location}` };
	}
}

describe('/search load', () => {
	it('lists every post when nothing is asked', () => {
		const { data } = run('');
		expect(data?.result.total).toBe(20);
		expect(data?.query).toEqual({ q: '', tag: '', sort: 'newest', page: 1 });
	});

	it('filters by a keyword, ignoring case', () => {
		const all = run('').data!.result.total;
		const found = run('?q=DESIGN').data!;
		expect(found.result.total).toBeGreaterThan(0);
		expect(found.result.total).toBeLessThan(all);
		expect(run('?q=design').data!.result.total).toBe(found.result.total);
	});

	it('filters by tag', () => {
		const { data } = run('?tag=performance');
		expect(data!.result.total).toBeGreaterThan(0);
		expect(data!.result.posts.every((post) => post.tags.includes('performance'))).toBe(true);
	});

	it('combines a keyword and a tag', () => {
		const tagOnly = run('?tag=design').data!.result.total;
		const both = run('?q=design&tag=design').data!.result.total;
		expect(both).toBeLessThanOrEqual(tagOnly);
	});

	it('sorts by title, oldest first and newest first', () => {
		const titles = (search: string) => run(search).data!.result.posts.map((post) => post.title);
		const byTitle = titles('?sort=title');
		expect(byTitle).toEqual([...byTitle].sort((a, b) => a.localeCompare(b, 'en')));
		expect(titles('?sort=oldest')).not.toEqual(titles(''));
	});

	it('finds nothing for a nonsense query without failing', () => {
		const { data, redirect } = run('?q=zzzzqqqq');
		expect(redirect).toBeNull();
		expect(data?.result.total).toBe(0);
		expect(data?.result.posts).toEqual([]);
	});

	it('offers every tag in the page language', () => {
		const de = run('', 'de').data!.tags;
		expect(de.find((tag) => tag.value === 'engineering')?.label).toBe('Entwicklung');
	});

	it('sets a short shared cache', () => {
		expect(run('').headers['cache-control']).toContain('s-maxage=60');
	});

	it('redirects non-canonical URLs to one spelling', () => {
		expect(run('?sort=newest').redirect).toBe('308 /en/search');
		expect(run('?page=1&q=cache').redirect).toBe('308 /en/search?q=cache');
		expect(run('?sort=bogus').redirect).toBe('308 /en/search');
		expect(run('?q=  cache  ').redirect).toBe('308 /en/search?q=cache');
		expect(run('?foo=bar&tag=design').redirect).toBe('308 /en/search?tag=design');
	});

	it('orders parameters canonically', () => {
		expect(run('?sort=title&q=cache').redirect).toBe('308 /en/search?q=cache&sort=title');
	});

	it('clamps a page past the end', () => {
		const redirect = run('?page=99').redirect;
		expect(redirect).toMatch(/^308 \/en\/search\?page=\d+$/);
	});

	it('does not redirect a canonical URL', () => {
		expect(run('?q=design&tag=design&sort=oldest').redirect).toBeNull();
	});
});
