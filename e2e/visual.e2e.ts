import { expect, test } from '@playwright/test';

/**
 * One visual snapshot: the top of the home page, the first thing anyone sees. The viewport, the
 * language, the colour scheme and the motion setting are fixed so the picture depends on the page
 * and nothing else. Fonts and anti-aliasing differ between operating systems, so the baseline is
 * the one made where the project is developed, and `maxDiffPixelRatio` allows for that noise
 * without letting a changed layout through.
 */
// The baseline was made on Windows. Another operating system draws the same page with other fonts,
// so a CI run on Linux would fail on the font, not on the page. Run it where the baseline lives.
test.skip(Boolean(process.env.CI), 'The baseline image is made on Windows; see the note above.');

test.use({
	viewport: { width: 1280, height: 720 },
	locale: 'en-US',
	timezoneId: 'UTC',
	colorScheme: 'light',
	reducedMotion: 'reduce'
});

test('the home page looks as it should', async ({ page }) => {
	await page.goto('/en');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await page.evaluate(() => document.fonts.ready);

	await expect(page).toHaveScreenshot('home-top.png', {
		animations: 'disabled',
		maxDiffPixelRatio: 0.02
	});
});
