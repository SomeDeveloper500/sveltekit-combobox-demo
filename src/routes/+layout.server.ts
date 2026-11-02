import type { LayoutServerLoad } from './$types';

/**
 * The language of the request, for the pages that live outside a locale route: an error page for a
 * path that matched nothing has no `[lang]` param to read it from.
 */
export const load: LayoutServerLoad = ({ locals }) => ({ lang: locals.lang });
