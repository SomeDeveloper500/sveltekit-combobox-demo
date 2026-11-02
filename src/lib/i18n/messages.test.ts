import { describe, expect, it } from 'vitest';
import { LOCALES } from '#lib/schemas/common.js';
import { dictionaries } from './messages';

const slotsOf = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
const en: Record<string, string> = dictionaries.en;
const de: Record<string, string> = dictionaries.de;

describe('the dictionaries', () => {
	it('cover the same keys in every locale', () => {
		const reference = Object.keys(en).sort();
		for (const locale of LOCALES) {
			expect(Object.keys(dictionaries[locale]).sort()).toEqual(reference);
		}
	});

	it('have no empty or padded strings', () => {
		for (const locale of LOCALES) {
			for (const [key, text] of Object.entries(dictionaries[locale])) {
				expect(text.trim(), `${locale}:${key}`).not.toBe('');
				expect(text, `${locale}:${key}`).toBe(text.trim());
			}
		}
	});

	it('use the same {slots} in a string and in its translation', () => {
		for (const key of Object.keys(en)) {
			expect(slotsOf(de[key]), key).toEqual(slotsOf(en[key]));
		}
	});

	it('include the provided keys and our own additions', () => {
		expect(en['nav.home']).toBe('Home');
		expect(de['nav.home']).toBe('Start');
		expect(en['a11y.skipToContent']).toBe('Skip to main content');
		expect(de['a11y.skipToContent']).toBe('Zum Hauptinhalt springen');
	});

	it('translate the strings that must differ between the languages', () => {
		const identicalAllowed = new Set([
			'nav.blog',
			'nav.dashboard',
			'dashboard.title',
			'dashboard.items.column.name',
			'dashboard.items.column.status',
			'dashboard.items.column.budget',
			'dashboard.items.column.ctr',
			'footer.copy',
			'site.name',
			// Plan names, people and company names are the same in both languages.
			// "Administrator" is the same word in both languages.
			'role.admin',
			'home.pricing.starter.name',
			'home.pricing.team.name',
			'home.pricing.enterprise.name',
			'home.proof.1.author',
			'home.proof.1.role',
			'home.proof.2.author',
			'home.proof.2.role',
			'lang.en',
			'lang.de'
		]);
		const untranslated = Object.keys(en).filter(
			(key) => en[key] === de[key] && !identicalAllowed.has(key)
		);
		expect(untranslated).toEqual([]);
	});

	it('name each language in its own language, whatever the page language', () => {
		expect(en['lang.de']).toBe('Deutsch');
		expect(de['lang.en']).toBe('English');
	});
});
