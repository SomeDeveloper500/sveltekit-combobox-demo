import { expect, test } from '@playwright/test';

const POST = {
	slug: 'sub-second-lcp-on-a-content-site',
	title: 'Sub-second LCP on a content site',
	titleDe: 'LCP unter einer Sekunde auf einer Content-Seite'
};

test.describe('a visitor finds a post', () => {
	test('searches from the header, opens a post, and comes back to the same results', async ({
		page
	}) => {
		await page.goto('/en');
		await page
			.getByRole('navigation', { name: 'Main' })
			.getByRole('link', { name: 'Search' })
			.click();
		await expect(page).toHaveURL(/\/en\/search$/);

		await page.getByRole('searchbox', { name: 'Search' }).fill('sub-second');
		await page.getByRole('searchbox', { name: 'Search' }).press('Enter');

		// The URL is the state: the query is in it, and the result is the one post that matches.
		await expect(page).toHaveURL(/\/en\/search\?q=sub-second$/);
		await expect(page.getByRole('status').filter({ hasText: 'results for' })).toContainText(
			'1 results for "sub-second"'
		);
		await page.getByRole('link', { name: POST.title }).click();

		await expect(page).toHaveURL(`/en/blog/${POST.slug}`);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(POST.title);
		await expect(page).toHaveTitle(new RegExp(POST.title));

		await page.goBack();
		await expect(page).toHaveURL(/\/en\/search\?q=sub-second$/);
		await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue('sub-second');
	});

	test('says so, instead of showing an empty page, when nothing matches', async ({ page }) => {
		await page.goto('/en/search?q=zzzz-no-such-post');
		await expect(page.getByText('No matches. Try a different query.')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Clear' })).toBeVisible();
	});

	test('reads the post in German after switching the language, on the same page', async ({
		page
	}) => {
		await page.goto(`/en/blog/${POST.slug}`);
		await page.getByRole('link', { name: 'Deutsch' }).click();

		await expect(page).toHaveURL(`/de/blog/${POST.slug}`);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(POST.titleDe);
	});

	test('keeps the results, in the new language, when the language is switched on the list', async ({
		page
	}) => {
		// "LCP" is in the text of both languages; the search matches the language being read.
		await page.goto('/en/search?q=LCP');
		await expect(page.getByRole('link', { name: POST.title })).toBeVisible();
		await page.getByRole('link', { name: 'Deutsch' }).click();

		await expect(page).toHaveURL(/\/de\/search\?q=LCP$/);
		await expect(page.getByRole('link', { name: POST.titleDe })).toBeVisible();
	});

	test('turns the query into a shareable link that loads straight into the results', async ({
		page
	}) => {
		await page.goto('/en/search?q=sub-second&sort=title');
		await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue('sub-second');
		await expect(page.getByRole('link', { name: POST.title })).toBeVisible();
	});
});

test.describe('a visitor without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('still searches: the form is a plain GET', async ({ page }) => {
		await page.goto('/en/search');
		await page.getByRole('searchbox', { name: 'Search' }).fill('sub-second');
		await page.getByRole('button', { name: 'Search' }).click();

		await expect(page).toHaveURL(/\/en\/search\?q=sub-second/);
		await expect(page.getByRole('link', { name: POST.title })).toBeVisible();
	});

	test('still reads the post: the content is in the HTML, not built by a script', async ({
		page
	}) => {
		await page.goto(`/en/blog/${POST.slug}`);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(POST.title);
		await expect(page.getByText('boring choices were the right ones')).toBeVisible();
	});
});
