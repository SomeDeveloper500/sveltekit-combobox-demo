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

	it('keeps the generic wording for a status it has no wording for', async () => {
		render(ErrorHarness, { lang: 'en', status: 418 });
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

describe('ErrorPage: 401, sign-in required', () => {
	it('says a sign-in is needed and offers it, remembering where the visitor was', async () => {
		render(ErrorHarness, { lang: 'en', status: 401, next: '/en/dashboard/items?page=2' });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Sign in required');
		await expect
			.element(page.getByRole('link', { name: 'Sign in' }))
			.toHaveAttribute('href', '/en/login?next=%2Fen%2Fdashboard%2Fitems%3Fpage%3D2');
	});

	it('works without a remembered page', async () => {
		render(ErrorHarness, { lang: 'de', status: 401 });
		await expect
			.element(page.getByRole('link', { name: 'Anmelden' }))
			.toHaveAttribute('href', '/de/login');
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Anmeldung erforderlich');
	});

	it('still lets the visitor go home', async () => {
		render(ErrorHarness, { lang: 'en', status: 401 });
		await expect
			.element(page.getByRole('link', { name: 'Back to the home page' }))
			.toBeInTheDocument();
	});
});

describe('ErrorPage: 403, not allowed', () => {
	it('says the account may not do this and does not offer a sign-in that cannot help', async () => {
		render(ErrorHarness, { lang: 'en', status: 403, next: '/en/dashboard' });
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('No access');
		await expect.element(page.getByText('not allowed to do this')).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
	});

	it('speaks German', async () => {
		render(ErrorHarness, { lang: 'de', status: 403 });
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Kein Zugriff');
	});

	it('is worded differently from 401', async () => {
		render(ErrorHarness, { lang: 'en', status: 403 });
		await expect.element(page.getByText('Sign in required')).not.toBeInTheDocument();
	});
});
