import { splitLocale } from '#lib/i18n/locale.js';

/** A host that cannot exist: only used to resolve a relative URL and see where it really points. */
const PROBE_ORIGIN = 'http://internal.invalid';

/**
 * The page to return to after signing in, taken from the `next` query parameter. That parameter is
 * user input, so it is accepted only if it is a path on this site; anything else is the fallback.
 * Otherwise `?next=//evil.example` would turn the login page into an open redirect.
 *
 * Refused: no leading `/`, `//` or `/\` (a "protocol-relative" URL, which browsers treat as another
 * host), control characters, a URL that resolves to another origin, and the login page itself
 * (which would send a signed-in user straight back to the form).
 */
export function safeNext(raw: string | null | undefined, fallback: string): string {
	if (!raw || raw.length > 2000) return fallback;
	if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
	// eslint-disable-next-line no-control-regex -- control characters are exactly what is refused
	if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;

	let url: URL;
	try {
		url = new URL(raw, PROBE_ORIGIN);
	} catch {
		return fallback;
	}
	if (url.origin !== PROBE_ORIGIN) return fallback;
	if (splitLocale(url.pathname).rest === '/login') return fallback;
	return `${url.pathname}${url.search}${url.hash}`;
}
