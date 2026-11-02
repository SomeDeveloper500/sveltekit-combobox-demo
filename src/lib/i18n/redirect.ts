import { negotiateLocale, localizePath, splitLocale } from './locale';

/**
 * The first path segment of pages that live under a locale. A visitor (or an old link) that
 * arrives without a locale, `/blog`, is sent to `/en/blog` or `/de/blog`.
 */
export const LOCALIZED_SECTIONS = ['blog', 'search', 'login', 'dashboard'] as const;

type Request = {
	method: string;
	pathname: string;
	search: string;
	acceptLanguage: string | null | undefined;
};

/**
 * Where a request without a locale should go, or `null` when it should be served as it is.
 *
 * The root and the localized sections are redirected, keeping the rest of the path and the query.
 * Anything else (the sandbox, files, a path that is simply wrong) is left alone and ends up on the
 * 404 page. Only reads are redirected: a POST to a locale-less URL is a mistake, not a visitor.
 * The target is built from our own locale and the request path, never from user-supplied URLs, so
 * it cannot point off-site.
 */
export function localeRedirect({
	method,
	pathname,
	search,
	acceptLanguage
}: Request): string | null {
	if (method !== 'GET' && method !== 'HEAD') return null;
	if (splitLocale(pathname).locale) return null;

	const section = pathname.split('/')[1];
	const isRoot = pathname === '/';
	if (!isRoot && !(LOCALIZED_SECTIONS as readonly string[]).includes(section)) return null;

	return `${localizePath(negotiateLocale(acceptLanguage), pathname)}${search}`;
}
