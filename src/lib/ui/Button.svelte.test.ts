import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Button from './Button.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>Save</span>' }));

describe('Button', () => {
	it('renders a type="button" by default', async () => {
		render(Button, { children: label });
		const button = page.getByRole('button', { name: 'Save' });
		await expect.element(button).toHaveAttribute('type', 'button');
		await expect.element(button).toBeEnabled();
	});

	it('applies the variant and size classes', async () => {
		render(Button, { children: label, variant: 'danger', size: 'lg' });
		const button = page.getByRole('button', { name: 'Save' });
		await expect.element(button).toHaveClass('bg-danger');
		await expect.element(button).toHaveClass('min-h-12');
	});

	it('calls onclick', async () => {
		const onclick = vi.fn();
		render(Button, { children: label, onclick });
		await page.getByRole('button', { name: 'Save' }).click();
		expect(onclick).toHaveBeenCalledOnce();
	});

	it('is natively disabled when disabled', async () => {
		render(Button, { children: label, disabled: true });
		await expect.element(page.getByRole('button', { name: 'Save' })).toBeDisabled();
	});

	it('announces loading, keeps focus and swallows clicks', async () => {
		const onclick = vi.fn();
		render(Button, { children: label, loading: true, onclick });
		const button = page.getByRole('button');
		// aria-disabled (not `disabled`) keeps the button focusable
		await expect.element(button).toBeEnabled();
		await expect.element(button).toHaveAttribute('aria-disabled', 'true');
		await expect.element(page.getByText('Loading…')).toBeInTheDocument();
		await button.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
	});

	it('renders a link when href is given', async () => {
		render(Button, { children: label, href: '/pricing' });
		await expect
			.element(page.getByRole('link', { name: 'Save' }))
			.toHaveAttribute('href', '/pricing');
	});

	it('makes a disabled link inert: no href, aria-disabled, out of tab order', async () => {
		render(Button, { children: label, href: '/pricing', disabled: true });
		const link = page.getByRole('link', { name: 'Save' });
		await expect.element(link).not.toHaveAttribute('href');
		await expect.element(link).toHaveAttribute('aria-disabled', 'true');
		await expect.element(link).toHaveAttribute('tabindex', '-1');
	});
});
