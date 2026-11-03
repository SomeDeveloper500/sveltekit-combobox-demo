import { blogQueryCodec, postQueryCodec } from '#lib/query/codecs.js';
import { postRepository } from '#lib/server/data/posts.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Edge caches may keep a list for five minutes and serve a stale one while they refresh it. The
 * posts are static, but the list is rendered per request, so a redeploy shows up within minutes.
 */
const CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600';

export const load: PageServerLoad = ({ url, params, setHeaders }) => {
	const lang = params.lang;
	const { page } = blogQueryCodec.decode(url.searchParams);
	const result = postRepository.query({ ...postQueryCodec.defaults, page }, lang);

	// One URL per page: `?page=1`, `?page=999` (past the end) and stray parameters all redirect to
	// the canonical address, so the same list never lives at two URLs.
	const wanted = blogQueryCodec.encode({ page: result.page }).toString();
	if (wanted !== url.searchParams.toString()) {
		redirect(308, `${url.pathname}${wanted ? `?${wanted}` : ''}`);
	}

	setHeaders({ 'cache-control': CACHE_CONTROL });
	const tagLabels = Object.fromEntries(
		postRepository.listTags().map((tag) => [tag.slug, tag.label[lang]])
	);
	return { result, tagLabels };
};
