import { describe, expect, it } from 'vitest';
import { createFormatters } from './format';

// ICU separates parts with no-break and narrow no-break spaces; compare with ordinary ones.
const plain = (text: string) => text.replace(/[\u00a0\u202f]/g, ' ');

const en = createFormatters('en');
const de = createFormatters('de');

describe('number formatting', () => {
	it('uses each language’s separators', () => {
		expect(en.number(1234567.5)).toBe('1,234,567.5');
		expect(de.number(1234567.5)).toBe('1.234.567,5');
	});
});

describe('money formatting', () => {
	it('writes whole US dollars', () => {
		expect(plain(en.money(2500))).toBe('$2,500');
		expect(plain(de.money(2500))).toBe('2.500 $');
	});

	it('rounds away the cents', () => {
		expect(plain(en.money(2332.02))).toBe('$2,332');
	});
});

describe('percent formatting', () => {
	it('shows a ratio as a percentage with two decimals', () => {
		expect(plain(en.percent(0.0537))).toBe('5.37%');
		expect(plain(de.percent(0.0537))).toBe('5,37 %');
	});

	it('handles zero and the maximum', () => {
		expect(plain(en.percent(0))).toBe('0.00%');
		expect(plain(en.percent(1))).toBe('100.00%');
	});
});

describe('date formatting', () => {
	it('puts the day and month in each language’s order', () => {
		expect(plain(en.date('2026-04-03'))).toBe('Apr 3, 2026');
		expect(plain(de.date('2026-04-03'))).toBe('03.04.2026');
	});

	it('shows a date-only value on that day, in any time zone', () => {
		// Parsed as UTC midnight and printed in UTC: no slipping to the day before or after.
		expect(plain(en.date('2026-01-01'))).toBe('Jan 1, 2026');
		expect(plain(en.date('2026-12-31'))).toBe('Dec 31, 2026');
	});

	it('prints a timestamp in UTC, so the server and the browser agree', () => {
		expect(plain(en.dateTime('2026-04-09T22:00:00Z'))).toContain('Apr 9, 2026');
		expect(plain(en.dateTime('2026-04-09T22:00:00Z'))).toContain('10:00');
		expect(plain(de.dateTime('2026-04-09T22:00:00Z'))).toContain('22:00');
	});

	it('moves to the next day when UTC does', () => {
		expect(plain(en.date('2026-04-09T23:59:59Z'))).toBe('Apr 9, 2026');
		expect(plain(en.date('2026-04-10T00:00:00Z'))).toBe('Apr 10, 2026');
	});
});
