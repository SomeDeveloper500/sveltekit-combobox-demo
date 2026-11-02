import { negotiateLocale, splitLocale } from '#lib/i18n/locale.js';
import { localeRedirect } from '#lib/i18n/redirect.js';
import { toAppError } from '#lib/server/errors.js';
import { applySecurityHeaders } from '#lib/server/security.js';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';

/**
 * Decides the language of the request. A locale in the URL wins; without one (the sandbox, an
 * unknown path) the browser's preference is used, so even error pages speak the visitor's language.
 * Visitors without a locale on a page that has one are sent there first. Every response, redirects
 * included, leaves with the security headers.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const acceptLanguage = event.request.headers.get('accept-language');

	const target = localeRedirect({
		method: event.request.method,
		pathname: event.url.pathname,
		search: event.url.search,
		acceptLanguage
	});
	if (target) {
		// Temporary: the answer depends on a request header, so shared caches must key on it.
		const redirect = new Response(null, {
			status: 307,
			headers: { location: target, vary: 'Accept-Language' }
		});
		return applySecurityHeaders(redirect, event.url);
	}

	event.locals.lang = splitLocale(event.url.pathname).locale ?? negotiateLocale(acceptLanguage);

	// app.html carries `%lang%` in its <html> tag.
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
	return applySecurityHeaders(response, event.url);
};

/** Unexpected errors get a logged reference; the visitor sees only that reference. */
export const handleError: HandleServerError = (input) => toAppError(input);
