import { LOCALES } from '#lib/schemas/common.js';
import { postRepository } from '#lib/server/data/posts.js';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';

/** The posts are static data, so every post is rendered once per language at build time. */
export const prerender = true;

/** One page per post and language; nothing links to them from outside the crawl. */
export const entries: EntryGenerator = () =>
	postRepository.listSlugs().flatMap((slug) => LOCALES.map((lang) => ({ lang, slug })));

export const load: PageServerLoad = ({ params, locals }) => {
	const post = postRepository.get(params.slug, locals.lang);
	if (!post) error(404);

	const tagLabels = Object.fromEntries(
		postRepository.listTags().map((tag) => [tag.slug, tag.label[locals.lang]])
	);
	return { post, tagLabels };
};
