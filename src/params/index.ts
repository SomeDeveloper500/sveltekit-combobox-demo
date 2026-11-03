// `.ts`, not `.js`: SvelteKit imports this module with Node itself during `vite build`, outside
// Vite, and Node does not map `.js` to `.ts`. Everything reachable from here (this file and
// `locales.ts`, which imports nothing) must stay erasable TypeScript: no enums or namespaces.
import { isLocale } from '#lib/schemas/locales.ts';
import { defineParams } from '@sveltejs/kit/params';

/**
 * Route param matchers (SvelteKit 3: one module, a map of name → matcher). `[lang=locale]` is
 * described by the list of locales everything else derives from, so only a supported locale
 * matches (`/fr/blog` is a 404, not a page) and `params.lang` is typed as `Locale`.
 *
 * A plain function, not a Zod schema: the browser's router runs the matcher too, and a schema
 * would put the whole validation library into the first JavaScript of every page.
 */
export const params = defineParams({
	locale: (param: string) => (isLocale(param) ? param : undefined)
});
