import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ErrorHarness from './ErrorHarness.svelte';

afterEach(() => {
	document.head.querySelectorAll('meta[name="robots"]').forEach((meta) => meta.remove());
});

describe('ErrorPage: a missing page', () => {
	it('says so in English', async () => {
		render(ErrorHarness, { lang: 'en', status: 404 });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Page not found');
		await expect.element(page.getByText('does not exist or has moved')).toBeInTheDocument();
		await expect.element(page.getByText('404')).toBeInTheDocument();
	});

	it('says so in German', async () => {
		render(ErrorHarness, { lang: 'de', status: 404 });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Seite nicht gefunden');
		await expect
			.element(page.getByRole('link', { name: 'Zurück zur Startseite' }))
			.toBeInTheDocument();
	});

	it('shows no incident reference, because nothing went wrong', async () => {
		render(ErrorHarness, { lang: 'en', status: 404 });
		await expect.element(page.getByText(/Reference/)).not.toBeInTheDocument();
	});
});

describe('ErrorPage: any other failure', () => {
	it('uses the generic wording and shows the reference to quote', async () => {
		render(ErrorHarness, { lang: 'en', status: 500, id: 'abc12345' });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Something went wrong');
		await expect.element(page.getByText('Reference: abc12345')).toBeInTheDocument();
		await expect.element(page.getByText('500')).toBeInTheDocument();
	});

	it('translates the reference label', async () => {
		render(ErrorHarness, { lang: 'de', status: 500, id: 'abc12345' });
		await expect.element(page.getByText('Referenz: abc12345')).toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Etwas ist schiefgelaufen');
	});

	it('treats a 403 like any non-404 failure for now', async () => {
		render(ErrorHarness, { lang: 'en', status: 403 });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Something went wrong');
	});
});

describe('ErrorPage: structure', () => {
	it('links back to the home page of the same language', async () => {
		render(ErrorHarness, { lang: 'de', status: 404 });
		await expect
			.element(page.getByRole('link', { name: 'Zurück zur Startseite' }))
			.toHaveAttribute('href', '/de');
		document.body.innerHTML = '';
		render(ErrorHarness, { lang: 'en', status: 404 });
		await expect
			.element(page.getByRole('link', { name: 'Back to the home page' }))
			.toHaveAttribute('href', '/en');
	});

	it('has exactly one h1', async () => {
		render(ErrorHarness, { lang: 'en', status: 500, id: 'x' });
		expect(document.querySelectorAll('h1')).toHaveLength(1);
	});

	it('asks search engines not to index it and titles the page', async () => {
		render(ErrorHarness, { lang: 'en', status: 404 });
		await expect.poll(() => document.title).toBe('Page not found – Demo Co.');
		expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
			'noindex'
		);
	});
});
