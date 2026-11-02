import type { Locale } from '#lib/schemas/common.js';

/** The regional variant behind each UI locale: it decides separators and the order of a date. */
const INTL_LOCALE: Record<Locale, string> = { en: 'en-US', de: 'de-DE' };

/**
 * Number, money, percent and date formatting for one locale, on `Intl`, never on string templates.
 * Dates are shown in UTC on purpose: the server and the browser then print the same text for the
 * same instant, so hydration never sees a difference, and date-only values (`2026-04-03`) never
 * slip to the neighbouring day.
 */
export function createFormatters(locale: Locale) {
	const intl = INTL_LOCALE[locale];
	const date = new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeZone: 'UTC' });
	const dateTime = new Intl.DateTimeFormat(intl, {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'UTC'
	});
	const number = new Intl.NumberFormat(intl);
	// Budgets are whole US dollars in the data; cents would only add noise to a table.
	const money = new Intl.NumberFormat(intl, {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
	const percent = new Intl.NumberFormat(intl, {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	return {
		/** `2026-04-03` or a full ISO timestamp → a medium date. */
		date: (iso: string) => date.format(new Date(iso)),
		/** An ISO timestamp → a medium date and a short time, in UTC. */
		dateTime: (iso: string) => dateTime.format(new Date(iso)),
		number: (value: number) => number.format(value),
		/** A US-dollar amount. */
		money: (value: number) => money.format(value),
		/** A ratio, `0.0537` → `5.37%`. */
		percent: (value: number) => percent.format(value)
	};
}
export type Formatters = ReturnType<typeof createFormatters>;
