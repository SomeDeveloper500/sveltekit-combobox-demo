export type SitemapAlternate = { hreflang: string; href: string };

export type SitemapEntry = {
	/** Absolute URL of the page. */
	loc: string;
	/** ISO 8601 date or timestamp of the last change. */
	lastmod?: string;
	/** Every language version of the page, this one included, plus `x-default` if there is one. */
	alternates?: readonly SitemapAlternate[];
};

const ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&apos;'
};

function escapeXml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/**
 * A sitemap with `xhtml:link` alternates, the form search engines read for language versions.
 * Each language version of a page is its own `<url>` that lists all the versions, itself too.
 */
export function buildSitemap(entries: readonly SitemapEntry[]): string {
	const urls = entries.map((entry) => {
		const lines = [`\t\t<loc>${escapeXml(entry.loc)}</loc>`];
		if (entry.lastmod) lines.push(`\t\t<lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
		for (const alt of entry.alternates ?? []) {
			lines.push(
				`\t\t<xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(alt.href)}" />`
			);
		}
		return `\t<url>\n${lines.join('\n')}\n\t</url>`;
	});
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...urls,
		'</urlset>',
		''
	].join('\n');
}
