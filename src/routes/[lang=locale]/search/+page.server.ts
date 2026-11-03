import { postQueryCodec } from '#lib/query/codecs.js';
import { postRepository } from '#lib/server/data/posts.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Results change only with a deploy, so a short shared cache is safe and absorbs repeated queries. */
const CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=600';

export const load: PageServerLoad = ({ url, params, setHeaders }) => {
	const lang = params.lang;
	const requested = postQueryCodec.decode(url.searchParams);
	const result = postRepository.query(requested, lang);
	const query = { ...requested, page: result.page };

	// The URL is the state, so it has one spelling: defaults dropped, a page past the end clamped,
	// stray parameters removed. Anything else redirects there.
	const wanted = postQueryCodec.encode(query).toString();
	if (wanted !== url.searchParams.toString()) {
		redirect(308, `${url.pathname}${wanted ? `?${wanted}` : ''}`);
	}

	setHeaders({ 'cache-control': CACHE_CONTROL });
	const tags = postRepository.listTags().map((tag) => ({
		value: tag.slug,
		label: tag.label[lang]
	}));
	return {
		query,
		result,
		tags,
		tagLabels: Object.fromEntries(tags.map((tag) => [tag.value, tag.label]))
	};
};
