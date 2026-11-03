import { describe, expect, it } from 'vitest';
import { page as browser } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DataTableSkeleton from './DataTableSkeleton.svelte';

describe('DataTableSkeleton', () => {
	it('announces loading once, not once per placeholder', async () => {
		render(DataTableSkeleton, { columns: 4, rows: 5, label: 'Loading…' });
		await expect.element(browser.getByRole('status')).toHaveTextContent('Loading…');
		expect(browser.getByRole('status').elements()).toHaveLength(1);
	});

	it('marks the region busy and hides the placeholders from assistive technology', async () => {
		const { container } = render(DataTableSkeleton, { columns: 4, rows: 5, label: 'Loading…' });
		expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
		const bars = container.querySelectorAll('[aria-hidden="true"]');
		// 4 header cells + 5 rows of 4 cells
		expect(bars).toHaveLength(24);
	});

	it('draws one row per requested row, so the swap keeps the layout', () => {
		const { container } = render(DataTableSkeleton, { columns: 3, rows: 10, label: 'Loading…' });
		expect(container.querySelectorAll('.divide-y > div')).toHaveLength(10);
	});
});
