import { LOCALES } from '#lib/schemas/locales.js';
import type { EntryGenerator } from './$types';

/** The home page has no per-request data, so each language is rendered once, at build time. */
export const prerender = true;

/** `[lang=locale]` has no crawlable links to it from outside, so list the languages explicitly. */
export const entries: EntryGenerator = () => LOCALES.map((lang) => ({ lang }));
