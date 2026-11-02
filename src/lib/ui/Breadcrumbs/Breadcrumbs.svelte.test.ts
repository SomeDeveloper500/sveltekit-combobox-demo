import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Breadcrumbs from './Breadcrumbs.svelte';

const items = [
	{ label: 'Home', href: '/en' },
	{ label: 'Blog', href: '/en/blog' },
	{ label: 'A post', href: '/en/blog/a-post' }
];

describe('Breadcrumbs', () => {
	it('is a named navigation landmark with an ordered list', async () => {
		render(Breadcrumbs, { items, label: 'Breadcrumbs' });
		await expect.element(page.getByRole('navigation', { name: 'Breadcrumbs' })).toBeInTheDocument();
		await expect.element(page.getByRole('list')).toBeInTheDocument();
		expect(document.querySelector('ol')).not.toBeNull();
		expect(document.querySelectorAll('li')).toHaveLength(3);
	});

	it('links every item except the last', async () => {
		render(Breadcrumbs, { items, label: 'Breadcrumbs' });
		await expect.element(page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/en');
		await expect
			.element(page.getByRole('link', { name: 'Blog' }))
			.toHaveAttribute('href', '/en/blog');
		await expect.element(page.getByRole('link', { name: 'A post' })).not.toBeInTheDocument();
	});

	it('marks the last item as the current page', async () => {
		render(Breadcrumbs, { items, label: 'Breadcrumbs' });
		const current = document.querySelector('[aria-current="page"]');
		expect(current?.textContent).toBe('A post');
	});

	it('hides the separators from assistive technology', async () => {
		render(Breadcrumbs, { items, label: 'Breadcrumbs' });
		const separators = [...document.querySelectorAll('[aria-hidden="true"]')];
		expect(separators.map((el) => el.textContent)).toEqual(['/', '/']);
	});
});
