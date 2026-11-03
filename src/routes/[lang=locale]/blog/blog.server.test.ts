import { describe, expect, it } from 'vitest';
import { load } from './+page.server';

type Event = Parameters<typeof load>[0];

/** A fake request event: only what `load` reads. */
function run(search: string, lang: 'en' | 'de' = 'en') {
	const headers: Record<string, string> = {};
	const event = {
		url: new URL(`https://example.test/${lang}/blog${search}`),
		params: { lang },
		setHeaders: (h: Record<string, string>) => Object.assign(headers, h)
	} as unknown as Event;
	try {
		const data = load(event) as { result: { page: number; pages: number; posts: unknown[] } };
		return { data, headers, redirect: null as string | null };
	} catch (thrown) {
		const { status, location } = thrown as { status: number; location: string };
		return { data: null, headers, redirect: `${status} ${location}` };
	}
}

describe('/blog load', () => {
	it('returns the first page of six posts with cache headers', () => {
		const { data, headers } = run('');
		expect(data?.result.page).toBe(1);
		expect(data?.result.posts).toHaveLength(6);
		expect(headers['cache-control']).toContain('s-maxage=300');
		expect(headers['cache-control']).toContain('stale-while-revalidate');
	});

	it('returns the requested page', () => {
		expect(run('?page=2').data?.result.page).toBe(2);
	});

	it('redirects ?page=1 to the bare URL, so the first page has one address', () => {
		expect(run('?page=1').redirect).toBe('308 /en/blog');
	});

	it('redirects a page past the end to the last page', () => {
		const pages = run('').data!.result.pages;
		expect(run('?page=999').redirect).toBe(`308 /en/blog?page=${pages}`);
	});

	it('redirects garbage to the first page', () => {
		expect(run('?page=abc').redirect).toBe('308 /en/blog');
	});

	it('drops parameters the list does not use', () => {
		expect(run('?page=2&q=speed&sort=title').redirect).toBe('308 /en/blog?page=2');
	});

	it('keeps the language in the redirect', () => {
		expect(run('?page=1', 'de').redirect).toBe('308 /de/blog');
	});

	it('does not redirect a canonical URL', () => {
		expect(run('?page=2').redirect).toBeNull();
	});
});
