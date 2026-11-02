import type { Locale } from '#lib/schemas/common.js';
import de from '../../../mocks/i18n.de.json';
import en from '../../../mocks/i18n.en.json';
import { extraDe, extraEn } from './extra';

/** Every UI string, per locale: the provided dictionaries plus our own additions. */
export const dictionaries = {
	en: { ...en, ...extraEn },
	de: { ...de, ...extraDe }
} satisfies Record<Locale, Record<string, string>>;

/** The English table is the reference: a key that is not in it does not exist. */
export type MessageKey = keyof (typeof dictionaries)['en'];
