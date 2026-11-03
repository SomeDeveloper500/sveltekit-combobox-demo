import { DEFAULT_LOCALE, type Locale } from '#lib/schemas/locales.js';
import { dictionaries, type MessageKey } from './messages';

export type Params = Record<string, string | number>;
export type Translate = (key: MessageKey, params?: Params) => string;

/**
 * Fills `{name}` slots. A slot without a parameter stays visible, so a forgotten parameter shows up
 * in the page instead of vanishing. Values are inserted as plain text: Svelte escapes them when
 * they are rendered, and nothing here produces HTML.
 */
export function interpolate(template: string, params: Params = {}): string {
	return template.replace(/\{(\w+)\}/g, (slot, name: string) =>
		Object.hasOwn(params, name) ? String(params[name]) : slot
	);
}

/**
 * A translator for one locale. A key missing from that locale falls back to English, and a key
 * missing everywhere to the key itself, so a gap is visible but never breaks a page.
 */
export function createTranslator(locale: Locale): Translate {
	const own: Record<string, string> = dictionaries[locale];
	const fallback: Record<string, string> = dictionaries[DEFAULT_LOCALE];
	return (key, params) => interpolate(own[key] ?? fallback[key] ?? key, params);
}
