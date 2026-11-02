import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import I18nHarness from './testing/I18nHarness.svelte';

const link = (name: string) => page.getByRole('link', { name });

describe('the i18n context', () => {
	it('translates and formats in the language it was given', async () => {
		render(I18nHarness, { start: 'en' });
		await expect.element(page.getByTestId('greeting')).toHaveTextContent('Home');
		await expect.element(page.getByTestId('money')).toHaveTextContent('$2,500');
	});

	it('starts in German when told to', async () => {
		render(I18nHarness, { start: 'de' });
		await expect.element(page.getByTestId('greeting')).toHaveTextContent('Start');
		await expect.element(page.getByTestId('money')).toHaveTextContent('2.500');
	});

	it('follows the language when navigation switches it, without a remount', async () => {
		render(I18nHarness, { start: 'en' });
		await expect.element(page.getByTestId('greeting')).toHaveTextContent('Home');
		await page.getByRole('button', { name: 'navigate' }).click();
		await expect.element(page.getByTestId('greeting')).toHaveTextContent('Start');
		await expect.element(page.getByTestId('money')).toHaveTextContent('2.500');
		await page.getByRole('button', { name: 'navigate' }).click();
		await expect.element(page.getByTestId('greeting')).toHaveTextContent('Home');
	});
});

describe('LanguageSwitcher', () => {
	it('links to the same page in each language, keeping the query', async () => {
		render(I18nHarness, { start: 'en', path: '/en/blog?page=2' });
		await expect.element(link('English')).toHaveAttribute('href', '/en/blog?page=2');
		await expect.element(link('Deutsch')).toHaveAttribute('href', '/de/blog?page=2');
	});

	it('works from the German page too', async () => {
		render(I18nHarness, { start: 'de', path: '/de/search?q=svelte&tag=perf' });
		await expect.element(link('English')).toHaveAttribute('href', '/en/search?q=svelte&tag=perf');
		await expect.element(link('Deutsch')).toHaveAttribute('href', '/de/search?q=svelte&tag=perf');
	});

	it('links the home page to the bare locale', async () => {
		render(I18nHarness, { start: 'en', path: '/en' });
		await expect.element(link('Deutsch')).toHaveAttribute('href', '/de');
	});

	it('marks the current language and only that one', async () => {
		render(I18nHarness, { start: 'de' });
		await expect.element(link('Deutsch')).toHaveAttribute('aria-current', 'true');
		await expect.element(link('English')).not.toHaveAttribute('aria-current');
	});

	it('moves the mark when the language changes', async () => {
		render(I18nHarness, { start: 'en' });
		await expect.element(link('English')).toHaveAttribute('aria-current', 'true');
		await page.getByRole('button', { name: 'navigate' }).click();
		await expect.element(link('Deutsch')).toHaveAttribute('aria-current', 'true');
		await expect.element(link('English')).not.toHaveAttribute('aria-current');
	});

	it('names each language in that language and sets hreflang and lang on it', async () => {
		render(I18nHarness, { start: 'en' });
		const german = link('Deutsch');
		await expect.element(german).toHaveAttribute('hreflang', 'de');
		await expect.element(german).toHaveAttribute('lang', 'de');
		await expect.element(link('English')).toHaveAttribute('lang', 'en');
	});

	it('is a labelled list, named in the page language', async () => {
		render(I18nHarness, { start: 'en' });
		await expect.element(page.getByRole('list', { name: 'Language' })).toBeInTheDocument();
		await page.getByRole('button', { name: 'navigate' }).click();
		await expect.element(page.getByRole('list', { name: 'Sprache' })).toBeInTheDocument();
	});

	it('is a plain link, so it works without JavaScript', async () => {
		render(I18nHarness, { start: 'en' });
		const element = link('Deutsch').element() as HTMLAnchorElement;
		expect(element.tagName).toBe('A');
		expect(element.getAttribute('href')).toMatch(/^\/de/);
	});
});
