export type RobotsInput = {
	/** Paths crawlers must not fetch. Each starts with `/`. */
	disallow: readonly string[];
	/** Absolute URL of the sitemap. */
	sitemap: string;
};

/**
 * A robots.txt for every crawler. Blocking is for paths with nothing to index (private areas, the
 * component sandbox). Pages that should stay out of search results but may be fetched, such as
 * the search results, are marked `noindex` in the page instead: a crawler that is not allowed to
 * fetch a page never sees its `noindex`, and the bare URL can still end up in the index.
 */
export function buildRobots({ disallow, sitemap }: RobotsInput): string {
	const rules = disallow.length > 0 ? disallow.map((path) => `Disallow: ${path}`) : ['Disallow:'];
	return ['User-agent: *', ...rules, '', `Sitemap: ${sitemap}`, ''].join('\n');
}
