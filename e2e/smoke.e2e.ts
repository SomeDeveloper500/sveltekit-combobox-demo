import { expect, test } from '@playwright/test';

test.describe('smoke', () => {
	test('the site opens on the visitor’s language with a single main heading', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/en$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
	});

	test('answers a missing page with a real 404 inside the site', async ({ page }) => {
		const response = await page.goto('/en/no-such-page');
		expect(response?.status()).toBe(404);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});

	test('keeps the dashboard behind a sign-in', async ({ page }) => {
		await page.goto('/en/dashboard/items');
		await expect(page).toHaveURL(/\/en\/login\?next=/);
	});
});
