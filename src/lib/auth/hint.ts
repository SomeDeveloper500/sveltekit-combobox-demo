/**
 * A cookie that only says "this browser has signed in", for the page header on prerendered pages.
 * Those pages are built once for everybody, so the server cannot put the visitor's name in them;
 * after hydration the header reads this hint to show "Dashboard" and "Sign out" instead of "Sign in".
 *
 * It is not a credential and grants nothing: anyone can set it, and the only effect is which links
 * the header shows. Every protected page still checks the signed session on the server.
 */
export const SIGNED_IN_HINT_COOKIE = 'signed-in';

/** Reads the hint from a `document.cookie` string. */
export function hasSignedInHint(cookieHeader: string): boolean {
	return cookieHeader.split(';').some((part) => part.trim() === `${SIGNED_IN_HINT_COOKIE}=1`);
}
