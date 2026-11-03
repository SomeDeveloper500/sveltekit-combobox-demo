import { building } from '$app/env';
import { negotiateLocale, splitLocale } from '#lib/i18n/locale.js';
import { localeRedirect } from '#lib/i18n/redirect.js';
import { accessDecision, isPrivatePath, markPrivate } from '#lib/server/access.js';
import { assertSessionConfigured, currentUser } from '#lib/server/auth.js';
import { compressResponse } from '#lib/server/compress.js';
import { toAppError } from '#lib/server/errors.js';
import { applySecurityHeaders } from '#lib/server/security.js';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit/hooks';

/** A production server without a session secret refuses to start, instead of failing at the first login. */
export const init: ServerInit = () => assertSessionConfigured();

/**
 * Decides the language of the request. A locale in the URL wins; without one (the sandbox, an
 * unknown path) the browser's preference is used, so even error pages speak the visitor's language.
 * Visitors without a locale on a page that has one are sent there first, and anonymous visitors on
 * a protected page are sent to the login page. Every response, redirects included, leaves with the
 * security headers; pages that depend on the visitor are marked private, and rendered pages are
 * compressed (see `compressResponse`).
 */
export const handle: Handle = async ({ event, resolve }) => {
	const acceptLanguage = event.request.headers.get('accept-language');

	const target = localeRedirect({
		method: event.request.method,
		pathname: event.url.pathname,
		search: () => event.url.search,
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

	// A prerendered page has no visitor, and reading the cookie there would need the secret at build time.
	event.locals.user = building ? null : await currentUser(event.cookies);

	// The dashboard is for signed-in users only. The check lives here, in front of every route, so a
	// page or an action added later cannot forget it.
	const access = accessDecision({
		pathname: event.url.pathname,
		search: () => event.url.search,
		lang: event.locals.lang,
		signedIn: event.locals.user !== null,
		method: event.request.method,
		accept: event.request.headers.get('accept')
	});
	if (access) {
		const refusal =
			access.kind === 'login'
				? new Response(null, { status: 303, headers: { location: access.location } })
				: Response.json({ code: 'unauthenticated' }, { status: 401 });
		return applySecurityHeaders(markPrivate(refusal), event.url);
	}

	// app.html carries `%lang%` in its <html> tag.
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
	const secured = applySecurityHeaders(compressResponse(event.request, response), event.url);
	return isPrivatePath(event.url.pathname) ? markPrivate(secured) : secured;
};

/** Unexpected errors get a logged reference; the visitor sees only that reference. */
export const handleError: HandleServerError = (input) => toAppError(input);
