export type JsonLdObject = { '@type': string } & Record<string, unknown>;

/**
 * Serializes structured data for an inline script element of type application/ld+json. Inside a
 * script element the HTML parser ends the block at a closing script tag and treats an HTML comment
 * opener specially, so `<` is escaped; the line separators are escaped for older JavaScript
 * parsers. The JSON stays equivalent.
 */
export function serializeJsonLd(data: JsonLdObject): string {
	return JSON.stringify({ '@context': 'https://schema.org', ...data })
		.replace(/</g, '\\u003c')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}

export type OrganizationInput = {
	name: string;
	url: string;
	description?: string;
	logo?: string;
	sameAs?: readonly string[];
};

/** schema.org `Organization`; optional fields are left out instead of written as empty. */
export function organizationJsonLd(input: OrganizationInput): JsonLdObject {
	const { name, url, description, logo, sameAs } = input;
	return {
		'@type': 'Organization',
		name,
		url,
		...(description ? { description } : {}),
		...(logo ? { logo } : {}),
		...(sameAs?.length ? { sameAs: [...sameAs] } : {})
	};
}

export type BreadcrumbItem = { name: string; url: string };

/** schema.org `BreadcrumbList`; the last item is the current page. Positions start at 1. */
export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): JsonLdObject {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url
		}))
	};
}

export type ArticleInput = {
	headline: string;
	description: string;
	/** The canonical URL of the article. */
	url: string;
	/** ISO 8601 date or timestamp. */
	datePublished: string;
	authorName: string;
	/** BCP 47 tag of the article's language. */
	inLanguage: string;
	publisherName: string;
	image?: string;
};

/** schema.org `Article`. */
export function articleJsonLd(input: ArticleInput): JsonLdObject {
	return {
		'@type': 'Article',
		headline: input.headline,
		description: input.description,
		datePublished: input.datePublished,
		inLanguage: input.inLanguage,
		mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
		author: { '@type': 'Person', name: input.authorName },
		publisher: { '@type': 'Organization', name: input.publisherName },
		...(input.image ? { image: input.image } : {})
	};
}
