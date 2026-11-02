import type { z } from 'zod';

type Primitive = string | number | boolean;

export type QueryCodecOptions = {
	/** The paging field, reset to its default when any other field changes. Default: `page`. */
	pageKey?: string;
};

/**
 * A codec between a URL's search params and a typed query object, driven by a Zod schema whose
 * fields are all primitives and all have a fallback (`catch`/`default`), so `schema.parse({})`
 * yields the defaults. The URL is the single source of truth for list state: shareable, and the
 * back/forward buttons just work.
 */
export function createQueryCodec<S extends z.ZodType<Record<string, Primitive>>>(
	schema: S,
	options: QueryCodecOptions = {}
) {
	type Query = z.output<S>;
	const defaults = schema.parse({}) as Query;
	const keys = Object.keys(defaults) as (keyof Query & string)[];
	const pageKey = options.pageKey ?? 'page';

	/** URL → typed query. Garbage, unknown keys and stale values fall back; it never throws. */
	function decode(source: URLSearchParams | string): Query {
		const params = typeof source === 'string' ? new URLSearchParams(source) : source;
		// The first value of a repeated key wins; later copies (`?q=a&q=b`) are ignored.
		const seen = new Set<string>();
		const entries = [...params].filter(([key]) => !seen.has(key) && !!seen.add(key));
		return schema.parse(Object.fromEntries(entries)) as Query;
	}

	/**
	 * Typed query → canonical params: schema order, defaults omitted, so equal states give equal,
	 * short URLs.
	 */
	function encode(query: Partial<Query>): URLSearchParams {
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
	function withQuery(current: Query, change: Partial<Query>): string {
		const alters = (Object.keys(change) as (keyof Query & string)[]).some(
			(key) => key !== pageKey && change[key] !== current[key]
		);
		const resetsPage = alters && !(pageKey in change) && pageKey in defaults;
		const next = { ...current, ...change, ...(resetsPage ? { [pageKey]: defaults[pageKey] } : {}) };
		const search = encode(next).toString();
		return search ? `?${search}` : '?';
	}

	/**
	 * The canonical search string (no leading `?`) for whatever the URL holds. A route compares it
	 * with the request and redirects when they differ, so `?page=1` and `?sort=bogus` do not
	 * become duplicate URLs.
	 */
	function canonical(source: URLSearchParams | string): string {
		return encode(decode(source)).toString();
	}

	return { decode, encode, withQuery, canonical, defaults };
}

export type QueryCodec<S extends z.ZodType<Record<string, Primitive>>> = ReturnType<
	typeof createQueryCodec<S>
>;
