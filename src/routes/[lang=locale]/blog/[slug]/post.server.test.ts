import { postRepository } from '#lib/server/data/posts.js';
import { describe, expect, it } from 'vitest';
import { entries, load, prerender } from './+page.server';

type Event = Parameters<typeof load>[0];

function run(slug: string, lang: 'en' | 'de' = 'en') {
	return load({ params: { lang, slug }, locals: { lang } } as unknown as Event) as {
		post: { slug: string; title: string; paragraphs: string[] };
		tagLabels: Record<string, string>;
	};
}

describe('/blog/[slug]', () => {
	it('is prerendered', () => {
		expect(prerender).toBe(true);
	});

	it('lists every post once per language', async () => {
		const list = await (entries as () => { lang: string; slug: string }[])();
		const slugs = postRepository.listSlugs();
		expect(list).toHaveLength(slugs.length * 2);
		expect(new Set(list.map((entry) => `${entry.lang}/${entry.slug}`)).size).toBe(list.length);
		expect(list.filter((entry) => entry.lang === 'de')).toHaveLength(slugs.length);
	});

	it('loads a post in the requested language', () => {
		const slug = postRepository.listSlugs()[0];
		const en = run(slug, 'en');
		const de = run(slug, 'de');
		expect(en.post.slug).toBe(slug);
		expect(en.post.paragraphs.length).toBeGreaterThan(0);
		expect(en.post.title).not.toBe(de.post.title);
	});

	it('labels the tags in the requested language', () => {
		expect(run(postRepository.listSlugs()[0], 'de').tagLabels.engineering).toBe('Entwicklung');
	});

	it('answers 404 for an unknown post', () => {
		expect(() => run('no-such-post')).toThrowError(expect.objectContaining({ status: 404 }));
	});
});
