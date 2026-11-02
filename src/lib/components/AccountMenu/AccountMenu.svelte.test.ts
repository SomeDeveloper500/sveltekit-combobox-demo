import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AccountMenuHarness from './AccountMenuHarness.svelte';

const user = {
	id: 'demo_editor',
	email: 'editor@demo.test',
	name: 'Demo Editor',
	role: 'editor'
} as const;

function setHint(on: boolean) {
	document.cookie = on ? 'signed-in=1; path=/' : 'signed-in=; path=/; max-age=0';
}

afterEach(() => setHint(false));

describe('AccountMenu', () => {
	it('offers to sign in to a visitor', async () => {
		render(AccountMenuHarness, { lang: 'en' });
		await expect
			.element(page.getByRole('link', { name: 'Sign in' }))
			.toHaveAttribute('href', '/en/login');
		await expect.element(page.getByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
	});

	it('shows the dashboard, the name and a sign-out form to a known user', async () => {
		render(AccountMenuHarness, { lang: 'en', user });
		await expect
			.element(page.getByRole('link', { name: 'Dashboard' }))
			.toHaveAttribute('href', '/en/dashboard');
		await expect.element(page.getByText('Demo Editor')).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
	});

	it('signs out with a POST form, never with a link', async () => {
		render(AccountMenuHarness, { lang: 'en', user });
		const form = document.querySelector('form')!;
		expect(form.method).toBe('post');
		expect(new URL(form.action).pathname).toBe('/en/logout');
		expect(document.querySelector('a[href$="/logout"]')).toBeNull();
	});

	it('falls back to the hint cookie where the page cannot know the user', async () => {
		setHint(true);
		render(AccountMenuHarness, { lang: 'en' });
		await expect.element(page.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
	});

	it('does not invent a name from the hint', async () => {
		setHint(true);
		render(AccountMenuHarness, { lang: 'en' });
		await expect.element(page.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
		expect(document.body.textContent).not.toContain('Demo Editor');
	});

	it('uses the language of the page for labels and links', async () => {
		render(AccountMenuHarness, { lang: 'de', user });
		await expect
			.element(page.getByRole('link', { name: 'Dashboard' }))
			.toHaveAttribute('href', '/de/dashboard');
		await expect.element(page.getByRole('button', { name: 'Abmelden' })).toBeInTheDocument();
		expect(new URL(document.querySelector('form')!.action).pathname).toBe('/de/logout');
	});

	it('is a named group', async () => {
		render(AccountMenuHarness, { lang: 'en' });
		await expect.element(page.getByRole('group', { name: 'Account' })).toBeInTheDocument();
	});
});
