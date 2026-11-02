// `.ts`, not `.js`: SvelteKit imports this module with Node itself during `vite build`, outside
// Vite, and Node does not map `.js` to `.ts`. Everything reachable from here (this file and
// `common.ts`, which imports only `zod`) must stay erasable TypeScript: no enums or namespaces.
import { localeSchema } from '#lib/schemas/common.ts';
import { defineParams } from '@sveltejs/kit/params';

/**
 * Route param matchers (SvelteKit 3: one module, a map of name → matcher). `[lang=locale]` is
 * described by the same Zod schema as everywhere else, so only a supported locale matches
 * (`/fr/blog` is a 404, not a page) and `params.lang` is typed as `Locale`.
 */
export const params = defineParams({ locale: localeSchema });
