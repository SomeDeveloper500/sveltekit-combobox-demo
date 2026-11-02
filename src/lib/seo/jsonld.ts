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
