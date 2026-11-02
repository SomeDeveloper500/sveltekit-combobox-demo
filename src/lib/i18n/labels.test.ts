import { describe, expect, it } from 'vitest';
import { comboboxLabels } from './labels.js';
import { createTranslator } from './translate.js';

describe('comboboxLabels', () => {
	it('speaks English', () => {
		const labels = comboboxLabels(createTranslator('en'));
		expect(labels.clearLabel).toBe('Clear');
		expect(labels.noResultsLabel).toBe('No results');
		expect(labels.resultsLabel(1)).toBe('1 result');
		expect(labels.resultsLabel(5)).toBe('5 results');
	});

	it('speaks German', () => {
		const labels = comboboxLabels(createTranslator('de'));
		expect(labels.clearLabel).toBe('Leeren');
		expect(labels.noResultsLabel).toBe('Keine Ergebnisse');
		expect(labels.resultsLabel(1)).toBe('1 Ergebnis');
		expect(labels.resultsLabel(5)).toBe('5 Ergebnisse');
	});

	it('has a plural form of its own for zero', () => {
		expect(comboboxLabels(createTranslator('en')).resultsLabel(0)).toBe('0 results');
	});
});
