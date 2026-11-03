import { z } from 'zod';

import { LOCALES } from './locales.ts';

// The list of locales lives in `locales.ts`, free of Zod, so the pages that only need the list do
// not download the validation library. This file is loaded by Node itself at build time (see
// `src/params`), so it imports only `zod` and `locales.ts`, and uses erasable TypeScript only.
export { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from './locales.ts';

export const localeSchema = z.enum(LOCALES);

export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected a #rrggbb color');

/** Lower-case words joined by dashes: safe in a URL path without encoding. */
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected a url slug');
