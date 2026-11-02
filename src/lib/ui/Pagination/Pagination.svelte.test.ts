import { describe, expect, it } from 'vitest';
import { page as browser } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Pagination from './Pagination.svelte';

const props = {
	href: (n: number) => `?page=${n}`,
	label: 'Pages',
	previousLabel: 'Previous page',
	nextLabel: 'Next page',
	pageLabel: (n: number) => `Page ${n}`
};

describe('Pagination', () => {
	it('is a named navigation landmark of links', async () => {
		render(Pagination, { ...props, page: 2, pages: 4 });
		await expect.element(browser.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
		const link = browser.getByRole('link', { name: 'Page 3' });
		await expect.element(link).toHaveAttribute('href', '?page=3');
	});

	it('marks only the current page', async () => {
		render(Pagination, { ...props, page: 2, pages: 4 });
		await expect
			.element(browser.getByRole('link', { name: 'Page 2' }))
			.toHaveAttribute('aria-current', 'page');
		await expect
			.element(browser.getByRole('link', { name: 'Page 3' }))
			.not.toHaveAttribute('aria-current');
	});

	it('links to the neighbours with rel prev and next', async () => {
		render(Pagination, { ...props, page: 2, pages: 4 });
		const previous = browser.getByRole('link', { name: 'Previous page' });
		const next = browser.getByRole('link', { name: 'Next page' });
		await expect.element(previous).toHaveAttribute('href', '?page=1');
		await expect.element(previous).toHaveAttribute('rel', 'prev');
		await expect.element(next).toHaveAttribute('href', '?page=3');
		await expect.element(next).toHaveAttribute('rel', 'next');
	});

	it('turns the previous control into plain text on the first page', async () => {
		render(Pagination, { ...props, page: 1, pages: 4 });
		await expect
			.element(browser.getByRole('link', { name: 'Previous page' }))
			.not.toBeInTheDocument();
		await expect.element(browser.getByRole('link', { name: 'Next page' })).toBeInTheDocument();
	});

	it('turns the next control into plain text on the last page', async () => {
		render(Pagination, { ...props, page: 4, pages: 4 });
		await expect.element(browser.getByRole('link', { name: 'Next page' })).not.toBeInTheDocument();
		await expect.element(browser.getByRole('link', { name: 'Previous page' })).toBeInTheDocument();
	});

	it('shows nothing when there is a single page', async () => {
		render(Pagination, { ...props, page: 1, pages: 1 });
		await expect.element(browser.getByRole('navigation')).not.toBeInTheDocument();
	});

	it('hides the skipped pages behind a decorative ellipsis', async () => {
		render(Pagination, { ...props, page: 10, pages: 20 });
		await expect.element(browser.getByRole('link', { name: 'Page 10' })).toBeInTheDocument();
		await expect.element(browser.getByRole('link', { name: 'Page 5' })).not.toBeInTheDocument();
		const gaps = document.querySelectorAll('[aria-hidden="true"]');
		expect([...gaps].some((el) => el.textContent === '…')).toBe(true);
	});
});
