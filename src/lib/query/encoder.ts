type Primitive = string | number | boolean;

export type QueryEncoderOptions = {
	/** The paging field, reset to its default when any other field changes. Default: `page`. */
	pageKey?: string;
};

/**
 * The half of a query codec that writes URLs: typed query to canonical search params, and the link
 * for a state change. It knows only the default value of each field, in the order the URL lists
 * them, so a page that builds links does not need the schema that reads them (and the validation
 * library behind it). `createQueryCodec` adds the reading half on top of this.
 */
export function createQueryEncoder<Q extends Record<string, Primitive>>(
	defaults: Q,
	options: QueryEncoderOptions = {}
) {
	const keys = Object.keys(defaults) as (keyof Q & string)[];
	const pageKey = options.pageKey ?? 'page';

	/**
	 * Typed query → canonical params: field order of the defaults, defaults omitted, so equal states
	 * give equal, short URLs.
	 */
	function encode(query: Partial<Q>): URLSearchParams {
		const merged = { ...defaults, ...query };
		const params = new URLSearchParams();
		for (const key of keys) {
			if (merged[key] !== defaults[key]) params.set(key, String(merged[key]));
		}
		return params;
	}

	/**
	 * The link for a state change, as a relative `?query` (so it keeps the current path). Changing
	 * anything but the page returns to the first page, so a new filter never lands on a page that
	 * no longer exists; an explicit `page` in `change` is kept.
	 */
	function withQuery(current: Q, change: Partial<Q>): string {
		const alters = (Object.keys(change) as (keyof Q & string)[]).some(
			(key) => key !== pageKey && change[key] !== current[key]
		);
		const resetsPage = alters && !(pageKey in change) && pageKey in defaults;
		const next = { ...current, ...change, ...(resetsPage ? { [pageKey]: defaults[pageKey] } : {}) };
		const search = encode(next).toString();
		return search ? `?${search}` : '?';
	}

	return { defaults, encode, withQuery };
}
