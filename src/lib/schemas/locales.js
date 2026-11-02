/**
 * The supported UI locales: the single list everything else derives from.
 *
 * This file is plain JavaScript on purpose. SvelteKit loads `src/params` with Node itself during
 * `vite build`, outside Vite, and Node cannot import TypeScript on every version we support.
 */
export const LOCALES = /** @type {const} */ (['en', 'de']);
