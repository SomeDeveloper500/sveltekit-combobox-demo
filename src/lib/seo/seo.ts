export type SeoAlternate = { hreflang: string; path: string };

export type SeoInput = {
	/** Site origin without a trailing slash, e.g. `https://example.com`. */
	origin: string;
	/** Page path of this language version, e.g. `/en/blog`. */
	path: string;
	title: string;
	description: string;
	siteName: string;
	/** BCP 47 tag of this page, e.g. `en`. */
	lang: string;
	/** Every language version of the page, this one included. */
	alternates: readonly SeoAlternate[];
	/** Path of the version served to unknown languages (`x-default`). */
	defaultPath?: string;
	/** Path or absolute URL of the social preview image. */
	image?: string;
	type?: 'website' | 'article';
};

export type SeoTags = {
	title: string;
	description: string;
	canonical: string;
	alternates: { hreflang: string; href: string }[];
	openGraph: Record<string, string>;
	twitter: Record<string, string>;
};

function absolute(origin: string, path: string): string {
	return /^https?:\/\//.test(path) ? path : `${origin.replace(/\/+$/, '')}${path}`;
}

/** Turns page facts into the tag values for `<head>`; rendering stays in the component. */
export function buildSeo(input: SeoInput): SeoTags {
	const { origin, title, description } = input;
	const canonical = absolute(origin, input.path);
	const alternates = input.alternates.map(({ hreflang, path }) => ({
		hreflang,
		href: absolute(origin, path)
	}));
	if (input.defaultPath) {
		alternates.push({ hreflang: 'x-default', href: absolute(origin, input.defaultPath) });
	}
	const image = input.image ? absolute(origin, input.image) : undefined;

	const openGraph: Record<string, string> = {
		'og:type': input.type ?? 'website',
		'og:site_name': input.siteName,
		'og:title': title,
		'og:description': description,
		'og:url': canonical,
		'og:locale': input.lang.replace('-', '_')
	};
	const twitter: Record<string, string> = {
		'twitter:card': image ? 'summary_large_image' : 'summary',
		'twitter:title': title,
		'twitter:description': description
	};
	if (image) {
		openGraph['og:image'] = image;
		twitter['twitter:image'] = image;
	}
	return { title, description, canonical, alternates, openGraph, twitter };
}
