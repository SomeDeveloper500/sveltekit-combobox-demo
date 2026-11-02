import { createTranslator } from '#lib/i18n/translate.js';
import { createFormatters } from '#lib/i18n/format.js';
import { LOCALES } from '#lib/schemas/common.js';
import { renderOgImage } from '#lib/server/og/render.js';
import { postRepository } from '#lib/server/data/posts.js';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';

/** One image per post and language, drawn while the site is built. See ADR 0004. */
export const prerender = true;

export const entries: EntryGenerator = () =>
	postRepository.listSlugs().flatMap((slug) => LOCALES.map((lang) => ({ lang, slug })));

export const GET: RequestHandler = async ({ params }) => {
	const post = postRepository.get(params.slug, params.lang);
	if (!post) error(404);

	const png = await renderOgImage({
		title: post.title,
		byline: `${post.author.name} · ${createFormatters(params.lang).date(post.publishedAt)}`,
		siteName: createTranslator(params.lang)('site.name'),
		background: post.coverColor
	});
	return new Response(png as BodyInit, { headers: { 'content-type': 'image/png' } });
};
