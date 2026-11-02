import { localizePath, splitLocale } from '#lib/i18n/locale.js';
import type { Locale } from '#lib/schemas/common.js';

/** `rest` is the path without its locale segment. */
const isDashboard = (rest: string) => rest === '/dashboard' || rest.startsWith('/dashboard/');

/** Pages only a signed-in user may open. */
export function isProtectedPath(pathname: string): boolean {
	return isDashboard(splitLocale(pathname).rest);
}

/**
 * Pages whose content depends on who is asking. Their responses must never be stored by a shared
 * cache, or one visitor's page could be served to another.
 */
export function isPrivatePath(pathname: string): boolean {
	const { rest } = splitLocale(pathname);
	return rest === '/login' || isDashboard(rest);
}

type Request = {
	pathname: string;
	/** The query string with its leading `?`, or `''`. A function: it must not be read while prerendering. */
	search: () => string;
	lang: Locale;
	signedIn: boolean;
	method: string;
	/** The request's `Accept` header. */
	accept: string | null;
};

export type AccessDecision =
	/** A page request: send the visitor to the login page, which remembers the way back. */
	| { kind: 'login'; location: string }
	/** A call made by code (a fetch for JSON, a write): a redirect to an HTML page would be useless, so answer 401. */
	| { kind: 'unauthorized' };

/**
 * Whether the caller is a script that wants data, not a browser showing a page. A form post that
 * accepts HTML is a page request even though it is not a GET: the visitor should land on the login
 * page, not see raw JSON.
 */
function wantsData({ method, accept }: Pick<Request, 'method' | 'accept'>): boolean {
	const readsHtml = accept?.includes('text/html') ?? false;
	if (readsHtml) return false;
	const readsJson = accept?.includes('application/json') ?? false;
	return readsJson || (method !== 'GET' && method !== 'HEAD');
}

/**
 * What to do with an anonymous request for a protected page, or `null` to let the request through.
 * A browser is sent to the login page; a script gets a 401 it can act on.
 */
export function accessDecision(request: Request): AccessDecision | null {
	if (request.signedIn || !isProtectedPath(request.pathname)) return null;
	if (wantsData(request)) return { kind: 'unauthorized' };
	const next = encodeURIComponent(`${request.pathname}${request.search()}`);
	return { kind: 'login', location: `${localizePath(request.lang, '/login')}?next=${next}` };
}

/** The same response, marked as not cacheable by anyone but the visitor's own browser. */
export function markPrivate(response: Response): Response {
	response.headers.set('cache-control', 'private, no-store');
	return response;
}
