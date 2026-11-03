// The supported UI locales: the single list everything else derives from. It imports nothing, on
// purpose: pages and components that only need to know the languages (the language switcher, the
// SEO tags, the translator) import this file, and must not pull the validation library into the
// JavaScript every visitor downloads. `common.ts` builds the Zod schema from the same list.
//
// It is also loaded by Node itself at build time through `src/params` (see that file), so it is
// erasable TypeScript only.
export const LOCALES = ['en', 'de'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const isLocale = (value: string | undefined): value is Locale =>
	LOCALES.some((locale) => locale === value);
