/**
 * Headers set on every response, including redirects and error pages.
 *
 * - `nosniff`: the browser trusts the declared content type, never its own guess.
 * - `Referrer-Policy`: other sites get our origin only, and nothing at all on a downgrade.
 * - `X-Frame-Options`: the app cannot be embedded in a frame (clickjacking).
 * - `Permissions-Policy`: features the app never uses stay off, even if a script asks for them.
 * - `Cross-Origin-Opener-Policy`: a window opened from another site gets no handle on ours.
 *
 * A Content-Security-Policy is deliberately not here yet: it needs nonces for the inline theme
 * script and an answer for the inline styles the components set, and is decided with the
 * deployment (see docs/DECISIONS.md).
 */
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'x-frame-options': 'DENY',
	'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
	'cross-origin-opener-policy': 'same-origin'
};

/** One year, subdomains included. Meaningful only over HTTPS, so it is never sent on plain HTTP. */
const HSTS = 'max-age=31536000; includeSubDomains';

function entries(url: URL): [string, string][] {
	const headers = Object.entries(SECURITY_HEADERS);
	if (url.protocol === 'https:') headers.push(['strict-transport-security', HSTS]);
	return headers;
}

/**
 * Returns the response with the security headers on it. Some responses (a redirect built with
 * `Response.redirect`, one proxied from `fetch`) have immutable headers; those are copied into a
 * new response instead of failing.
 */
export function applySecurityHeaders(response: Response, url: URL): Response {
	try {
		for (const [name, value] of entries(url)) response.headers.set(name, value);
		return response;
	} catch {
		const copy = new Response(response.body, response);
		for (const [name, value] of entries(url)) copy.headers.set(name, value);
		return copy;
	}
}
