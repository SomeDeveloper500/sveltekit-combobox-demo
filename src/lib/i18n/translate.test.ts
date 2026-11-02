import { describe, expect, it } from 'vitest';
import { dictionaries, type MessageKey } from './messages';
import { createTranslator, interpolate } from './translate';

describe('interpolate', () => {
	it('fills every slot', () => {
		expect(interpolate('{count} results for "{query}"', { count: 3, query: 'svelte' })).toBe(
			'3 results for "svelte"'
		);
	});

	it('accepts numbers, including zero', () => {
		expect(interpolate('{n} left', { n: 0 })).toBe('0 left');
	});

	it('fills a repeated slot each time', () => {
		expect(interpolate('{a} and {a}', { a: 'x' })).toBe('x and x');
	});

	it('leaves a slot without a parameter visible', () => {
		expect(interpolate('Hello {name}, {missing}', { name: 'Ada' })).toBe('Hello Ada, {missing}');
		expect(interpolate('Hello {name}')).toBe('Hello {name}');
	});

	it('ignores parameters that have no slot', () => {
		expect(interpolate('plain', { unused: 1 })).toBe('plain');
	});

	it('does not read inherited properties as parameters', () => {
		expect(interpolate('{constructor} {toString}', {})).toBe('{constructor} {toString}');
	});

	it('inserts values as plain text, so markup stays inert', () => {
		expect(interpolate('Hi {name}', { name: '<img src=x onerror=alert(1)>' })).toBe(
			'Hi <img src=x onerror=alert(1)>'
		);
	});

	it('does not re-scan inserted values for slots', () => {
		expect(interpolate('{a}', { a: '{b}', b: 'oops' })).toBe('{b}');
	});
});

describe('createTranslator', () => {
	it('translates into the locale', () => {
		expect(createTranslator('en')('nav.login')).toBe('Sign in');
		expect(createTranslator('de')('nav.login')).toBe('Anmelden');
	});

	it('interpolates parameters', () => {
		expect(createTranslator('en')('blog.readingTime', { minutes: 4 })).toBe('4 min read');
		expect(createTranslator('de')('blog.readingTime', { minutes: 4 })).toBe('4 Min. Lesezeit');
		expect(createTranslator('de')('error.reference', { id: 'abc123' })).toBe('Referenz: abc123');
	});

	it('returns the key itself for a key that does not exist', () => {
		const t = createTranslator('de');
		expect(t('no.such.key' as MessageKey)).toBe('no.such.key');
	});

	it('falls back to English for a key missing from the locale', () => {
		const original = dictionaries.de['nav.home'];
		try {
			delete (dictionaries.de as Record<string, string>)['nav.home'];
			expect(createTranslator('de')('nav.home')).toBe('Home');
		} finally {
			(dictionaries.de as Record<string, string>)['nav.home'] = original;
		}
	});

	it('works on every key of the reference dictionary', () => {
		for (const locale of ['en', 'de'] as const) {
			const t = createTranslator(locale);
			for (const key of Object.keys(dictionaries.en) as MessageKey[]) {
				expect(t(key)).toBeTruthy();
			}
		}
	});
});
