import { z } from 'zod';

// The supported UI locales: the single list everything else derives from, the route matcher in
// `src/params` included. This file is loaded by Node itself at build time (see that file), so it
// imports only `zod` and uses erasable TypeScript only.
export const LOCALES = ['en', 'de'] as const;
export const localeSchema = z.enum(LOCALES);
export type Locale = z.infer<typeof localeSchema>;
export const DEFAULT_LOCALE: Locale = 'en';

export const isLocale = (value: string | undefined): value is Locale =>
	localeSchema.safeParse(value).success;

export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected a #rrggbb color');

/** Lower-case words joined by dashes: safe in a URL path without encoding. */
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected a url slug');
