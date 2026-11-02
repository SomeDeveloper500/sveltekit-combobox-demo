import { describe, expect, it } from 'vitest';
import { pageItems } from './pagination.js';

describe('pageItems', () => {
	it('lists every page when there are few', () => {
		expect(pageItems(1, 4)).toEqual([1, 2, 3, 4]);
		expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	it('returns nothing without pages', () => {
		expect(pageItems(1, 0)).toEqual([]);
	});

	it('collapses the far end near the start', () => {
		expect(pageItems(1, 20)).toEqual([1, 2, 3, 4, 5, 'gap', 20]);
		expect(pageItems(4, 20)).toEqual([1, 2, 3, 4, 5, 'gap', 20]);
	});

	it('collapses the near end near the finish', () => {
		expect(pageItems(20, 20)).toEqual([1, 'gap', 16, 17, 18, 19, 20]);
		expect(pageItems(17, 20)).toEqual([1, 'gap', 16, 17, 18, 19, 20]);
	});

	it('shows a window with two gaps in the middle', () => {
		expect(pageItems(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
	});

	it('keeps the same length wherever the visitor is', () => {
		const lengths = new Set(Array.from({ length: 20 }, (_, i) => pageItems(i + 1, 20).length));
		expect(lengths).toEqual(new Set([7]));
	});

	it('clamps a page outside the range', () => {
		expect(pageItems(99, 20)).toEqual(pageItems(20, 20));
		expect(pageItems(-5, 20)).toEqual(pageItems(1, 20));
	});

	it('never hides a single page behind a gap', () => {
		for (let pages = 1; pages <= 30; pages++) {
			for (let page = 1; page <= pages; page++) {
				const items = pageItems(page, pages);
				items.forEach((item, i) => {
					if (item !== 'gap') return;
					const before = items[i - 1] as number;
					const after = items[i + 1] as number;
					expect(after - before).toBeGreaterThan(2);
				});
			}
		}
	});

	it('is strictly increasing and contains the current page', () => {
		for (let page = 1; page <= 20; page++) {
			const numbers = pageItems(page, 20).filter((item): item is number => item !== 'gap');
			expect(numbers).toContain(page);
			expect([...numbers].sort((a, b) => a - b)).toEqual(numbers);
		}
	});
});
