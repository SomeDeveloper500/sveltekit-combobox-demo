import type { z } from 'zod';
import { createQueryEncoder, type QueryEncoderOptions } from './encoder.js';

type Primitive = string | number | boolean;

export type QueryCodecOptions = QueryEncoderOptions;

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
	// Writing URLs is the encoder's half; this adds the half that reads them.
	const { encode, withQuery } = createQueryEncoder(defaults, options);

	/** URL → typed query. Garbage, unknown keys and stale values fall back; it never throws. */
	function decode(source: URLSearchParams | string): Query {
		const params = typeof source === 'string' ? new URLSearchParams(source) : source;
		// The first value of a repeated key wins; later copies (`?q=a&q=b`) are ignored.
		const seen = new Set<string>();
		const entries = [...params].filter(([key]) => !seen.has(key) && !!seen.add(key));
		return schema.parse(Object.fromEntries(entries)) as Query;
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
