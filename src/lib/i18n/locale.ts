import { DEFAULT_LOCALE, isLocale, type Locale } from '#lib/schemas/common.js';

// tag [;q=weight] [;other-param]*: a `q` that is not a number makes the whole entry invalid.
const ACCEPT_ENTRY =
	/^\s*([A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*|\*)\s*(?:;\s*q\s*=\s*(\d(?:\.\d{0,3})?))?\s*(?:;\s*(?!q\s*=)[^;]*)*$/;

/**
 * The best supported locale for an `Accept-Language` header: highest `q` first (ties keep header
 * order), regional tags match their language (`de-CH` → `de`), `q=0` and malformed entries are
 * ignored, and anything unmatched falls back to the default locale.
 */
export function negotiateLocale(header: string | null | undefined): Locale {
	const candidates = (header ?? '')
		.split(',')
		.flatMap((part, index) => {
			const match = ACCEPT_ENTRY.exec(part);
			if (!match) return [];
			const quality = match[2] === undefined ? 1 : Math.min(Number(match[2]), 1);
			return quality > 0 ? [{ tag: match[1].toLowerCase(), quality, index }] : [];
		})
		.sort((a, b) => b.quality - a.quality || a.index - b.index);

	for (const { tag } of candidates) {
		if (tag === '*') return DEFAULT_LOCALE;
		const language = tag.split('-')[0];
		if (isLocale(language)) return language;
	}
	return DEFAULT_LOCALE;
}

/** Splits `/de/blog` into `{ locale: 'de', rest: '/blog' }`; a path with no locale has `null`. */
export function splitLocale(pathname: string): { locale: Locale | null; rest: string } {
	const [, first = '', ...others] = pathname.split('/');
	if (!isLocale(first)) return { locale: null, rest: pathname || '/' };
	return { locale: first, rest: `/${others.join('/')}` };
}

/** The path of a page in a locale: `localizePath('de', '/blog')` → `/de/blog`, `'/'` → `/de`. */
export function localizePath(locale: Locale, path = '/'): string {
	const clean = path.startsWith('/') ? path : `/${path}`;
	return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

/** The same page in another locale: `/en/blog` → `/de/blog`; a path with no locale gets one. */
export function switchLocalePath(pathname: string, target: Locale): string {
	return localizePath(target, splitLocale(pathname).rest);
}

/** The parts of a URL the language switch needs; SvelteKit's `page.url` provides them. */
export type PageUrl = Pick<URL, 'pathname' | 'search' | 'hash'>;

/** Like `switchLocalePath`, but keeps the query string and the hash, for language switch links. */
export function switchLocaleUrl(url: PageUrl, target: Locale): string {
	return `${switchLocalePath(url.pathname, target)}${url.search}${url.hash}`;
}
