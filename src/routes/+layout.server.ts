import type { LayoutServerLoad } from './$types';

/**
 * The language of the request, for the pages that live outside a locale route: an error page for a
 * path that matched nothing has no `[lang]` param to read it from, and the signed-in user for the
 * page header.
 */
export const load: LayoutServerLoad = ({ locals }) => ({
	lang: locals.lang,
	// `null` on prerendered pages, which are built once for everybody; see `lib/auth/hint.ts`.
	user: locals.user
});
