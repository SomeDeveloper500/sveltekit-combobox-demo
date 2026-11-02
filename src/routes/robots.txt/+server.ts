import { LOCALES } from '#lib/schemas/common.js';
import { buildRobots } from '#lib/seo/robots.js';
import { siteOrigin } from '#lib/site.js';
import type { RequestHandler } from './$types';

/** Written once at build time. */
export const prerender = true;

export const GET: RequestHandler = () =>
	new Response(
		buildRobots({
			disallow: ['/sandbox', ...LOCALES.map((lang) => `/${lang}/dashboard`)],
			sitemap: `${siteOrigin}/sitemap.xml`
		}),
		{ headers: { 'content-type': 'text/plain; charset=utf-8' } }
	);
