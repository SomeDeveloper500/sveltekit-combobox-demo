import { describe, expect, it } from 'vitest';
import { clampRate, ErrorBudget, sampled } from './sampling';

describe('clampRate', () => {
	it('keeps a probability as it is and pulls the rest into range', () => {
		expect(clampRate(0.25)).toBe(0.25);
		expect(clampRate(-1)).toBe(0);
		expect(clampRate(7)).toBe(1);
		expect(clampRate(NaN)).toBe(0);
	});
});

describe('sampled', () => {
	it('takes a load when the draw is under the rate, and not at or above it', () => {
		expect(sampled(0.1, () => 0.099)).toBe(true);
		expect(sampled(0.1, () => 0.1)).toBe(false);
		expect(sampled(0.1, () => 0.9)).toBe(false);
	});

	it('always samples at 1, whatever the draw', () => {
		for (const draw of [0, 0.5, 0.999999]) expect(sampled(1, () => draw)).toBe(true);
	});

	it('never samples at 0 or with a broken rate', () => {
		expect(sampled(0, () => 0)).toBe(false);
		expect(sampled(NaN, () => 0)).toBe(false);
		expect(sampled(-3, () => 0)).toBe(false);
	});

	it('lands near the rate over many loads', () => {
		let state = 12345;
		const random = () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
		let taken = 0;
		for (let i = 0; i < 10_000; i++) if (sampled(0.2, random)) taken++;
		expect(taken / 10_000).toBeGreaterThan(0.18);
		expect(taken / 10_000).toBeLessThan(0.22);
	});
});

describe('ErrorBudget', () => {
	it('lets an error through once', () => {
		const budget = new ErrorBudget();
		expect(budget.admit('a')).toBe(true);
		expect(budget.admit('a')).toBe(false);
	});

	it('stops after the limit of distinct errors', () => {
		const budget = new ErrorBudget(2);
		expect(budget.admit('a')).toBe(true);
		expect(budget.admit('b')).toBe(true);
		expect(budget.admit('c')).toBe(false);
	});
});
