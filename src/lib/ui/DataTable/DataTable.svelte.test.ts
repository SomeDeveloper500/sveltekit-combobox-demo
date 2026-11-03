import { describe, expect, it } from 'vitest';
import { page as browser, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './DataTableHarness.svelte';

const header = (name: string) => browser.getByRole('columnheader', { name });

describe('DataTable', () => {
	it('is a named table with a header and one row per item', async () => {
		render(Harness);
		await expect.element(browser.getByRole('table', { name: 'Campaigns' })).toBeInTheDocument();
		// header row + 2 rows
		expect(browser.getByRole('row').elements()).toHaveLength(3);
		await expect.element(browser.getByRole('cell', { name: 'Alpha' })).toBeInTheDocument();
	});

	it('shows a column as text, a formatted value or custom markup', async () => {
		render(Harness);
		await expect.element(browser.getByRole('cell', { name: '$1200' })).toBeInTheDocument();
		await expect.element(browser.getByTestId('plan').first()).toHaveTextContent('pro');
	});

	it('marks sortable columns aria-sort none when the data is not ordered by them', async () => {
		render(Harness);
		await expect.element(header('Name')).toHaveAttribute('aria-sort', 'none');
		await expect.element(header('Budget')).toHaveAttribute('aria-sort', 'none');
	});

	it('leaves aria-sort off a column that cannot be sorted', async () => {
		render(Harness);
		await expect.element(header('Plan')).not.toHaveAttribute('aria-sort');
	});

	it('announces the direction of the sorted column, and only that column', async () => {
		render(Harness, { sort: { key: 'name', direction: 'asc' } });
		await expect.element(header('Name')).toHaveAttribute('aria-sort', 'ascending');
		await expect.element(header('Budget')).toHaveAttribute('aria-sort', 'none');
	});

	it('announces descending order', async () => {
		render(Harness, { sort: { key: 'budget', direction: 'desc' } });
		await expect.element(header('Budget')).toHaveAttribute('aria-sort', 'descending');
	});

	it('sorts through links, reachable from the keyboard', async () => {
		render(Harness);
		const link = browser.getByRole('link', { name: 'Sort by Budget' });
		await expect.element(link).toHaveAttribute('href', '?sort=budget');
		(browser.getByRole('region', { name: 'Campaigns' }).element() as HTMLElement).focus();
		await userEvent.tab(); // first sort link
		await expect.element(browser.getByRole('link', { name: 'Sort by Name' })).toHaveFocus();
		await userEvent.tab();
		await expect.element(link).toHaveFocus();
	});

	it('has a focusable region so a wide table can be scrolled with the keyboard', async () => {
		render(Harness);
		const region = browser.getByRole('region', { name: 'Campaigns' });
		await expect.element(region).toHaveAttribute('tabindex', '0');
	});

	it('aligns numeric columns to the end', async () => {
		render(Harness);
		await expect.element(header('Budget')).toHaveClass('text-end');
		await expect.element(header('Name')).toHaveClass('text-start');
	});

	it('shows the empty state across the whole row', async () => {
		render(Harness, { rows: [] });
		const cell = browser.getByRole('cell', { name: 'Nothing found' });
		await expect.element(cell).toBeInTheDocument();
		await expect.element(cell).toHaveAttribute('colspan', '3');
	});
});
