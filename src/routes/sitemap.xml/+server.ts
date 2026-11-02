import { localizePath } from '#lib/i18n/locale.js';
import { DEFAULT_LOCALE, LOCALES } from '#lib/schemas/common.js';
import { buildSitemap, type SitemapEntry } from '#lib/seo/sitemap.js';
import { postRepository } from '#lib/server/data/posts.js';
import { siteOrigin } from '#lib/site.js';
import type { RequestHandler } from './$types';

/** Written once at build time, next to the prerendered pages it describes. */
export const prerender = true;

/** One entry per language version of a page, each listing all versions. */
function pageEntries(path: string, lastmod?: string): SitemapEntry[] {
	const href = (locale: (typeof LOCALES)[number]) => `${siteOrigin}${localizePath(locale, path)}`;
	const alternates = [
		...LOCALES.map((locale) => ({ hreflang: locale, href: href(locale) })),
		{ hreflang: 'x-default', href: href(DEFAULT_LOCALE) }
	];
	return LOCALES.map((locale) => ({ loc: href(locale), lastmod, alternates }));
}

/**
 * The indexable pages: the home page, the blog's first page and every post. Search results are
 * `noindex`, and later pages of the list are reachable through the prev/next links, so neither
 * belongs in the sitemap.
 */
export const GET: RequestHandler = () => {
	const posts = postRepository.listSlugs().flatMap((slug) => {
		const post = postRepository.get(slug, DEFAULT_LOCALE)!;
		return pageEntries(`/blog/${slug}`, post.publishedAt);
	});

	return new Response(buildSitemap([...pageEntries('/'), ...pageEntries('/blog'), ...posts]), {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
