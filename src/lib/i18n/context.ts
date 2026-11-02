import type { Locale } from '#lib/schemas/common.js';
import { getContext, setContext } from 'svelte';
import { createFormatters, type Formatters } from './format';
import { createTranslator, type Translate } from './translate';

const translators = new Map<Locale, Translate>();
const formatters = new Map<Locale, Formatters>();

/** One translator and one set of formatters per locale, built on first use. */
function cached<T>(cache: Map<Locale, T>, locale: Locale, create: (locale: Locale) => T): T {
	let value = cache.get(locale);
	if (!value) cache.set(locale, (value = create(locale)));
	return value;
}

/**
 * What a component needs to speak the page's language: the locale, `t` and the `Intl` formatters.
 * It reads the language through a function, not a copy, so a template that uses it updates by
 * itself when navigation switches `/en/…` to `/de/…` inside the same layout.
 */
export class I18n {
	readonly #lang: () => Locale;

	constructor(lang: () => Locale) {
		this.#lang = lang;
	}

	get lang(): Locale {
		return this.#lang();
	}

	/** Translates a key in the current language; reading `lang` makes templates reactive. */
	t: Translate = (key, params) => cached(translators, this.lang, createTranslator)(key, params);

	get format(): Formatters {
		return cached(formatters, this.lang, createFormatters);
	}
}

const key = Symbol('i18n');

/** Makes the language available to the component subtree. Call once, in the locale layout. */
export function provideI18n(lang: () => Locale): I18n {
	return setContext(key, new I18n(lang));
}

export function getI18n(): I18n {
	const i18n = getContext<I18n | undefined>(key);
	if (!i18n) throw new Error('getI18n() needs provideI18n() in a parent component');
	return i18n;
}
