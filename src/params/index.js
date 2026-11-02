import { LOCALES } from '#lib/schemas/locales.js';
import { defineParams } from '@sveltejs/kit/params';

/**
 * Route param matchers (SvelteKit 3: one module, a map of name → matcher). `[lang=locale]` matches
 * only a supported locale, so `/fr/blog` is a 404, not a page, and `params.lang` is typed
 * `'en' | 'de'`. Plain JavaScript because the build imports this file with Node, which cannot load
 * TypeScript on every version we support; it imports only other plain JavaScript.
 *
 * @param {string} param
 */
const locale = (param) => LOCALES.find((candidate) => candidate === param);

export const params = defineParams({ locale });
