import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { signIn } from './support/auth';

const POST = '/en/blog/sub-second-lcp-on-a-content-site';

/**
 * Runs axe on the page as it is now and fails on anything serious or critical (the project’s bar).
 * Lesser findings are not hidden: they are attached to the report so they stay visible.
 */
async function expectAccessible(page: Page, name: string) {
	const { violations } = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
		.analyze();

	const blocking = violations.filter(
		(violation) => violation.impact === 'serious' || violation.impact === 'critical'
	);
	const minor = violations.filter((violation) => !blocking.includes(violation));
	if (minor.length > 0) {
		await test.info().attach(`${name}: lesser findings`, {
			body: JSON.stringify(
				minor.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length })),
				null,
				2
			),
			contentType: 'application/json'
		});
	}

	expect(
		blocking.map(({ id, impact, help, nodes }) => ({
			id,
			impact,
			help,
			targets: nodes.map((node) => node.target.join(' '))
		})),
		`${name}: serious or critical accessibility violations`
	).toEqual([]);
}

const PUBLIC_PAGES = [
	['home', '/en'],
	['home (German)', '/de'],
	['blog list', '/en/blog'],
	['blog list, page 2', '/en/blog?page=2'],
	['post', POST],
	['post (German)', `/de/blog/sub-second-lcp-on-a-content-site`],
	['search', '/en/search'],
	['search results', '/en/search?q=LCP'],
	['search, nothing found', '/en/search?q=zzzz-no-such-post'],
	['sign in', '/en/login'],
	['not found', '/en/no-such-page']
] as const;

for (const scheme of ['light', 'dark'] as const) {
	test.describe(`public pages, ${scheme} theme`, () => {
		test.use({ colorScheme: scheme });

		for (const [name, path] of PUBLIC_PAGES) {
			test(name, async ({ page }) => {
				await page.goto(path);
				await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
				await expectAccessible(page, name);
			});
		}
	});
}

test.describe('the dashboard', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	test('overview', async ({ page }) => {
		await page.goto('/en/dashboard');
		await expectAccessible(page, 'dashboard');
	});

	test('campaign list, with editing controls', async ({ page }) => {
		await page.goto('/en/dashboard/items');
		await expect(page.getByRole('table')).toBeVisible();
		await expectAccessible(page, 'campaign list');
	});

	test('campaign list, filtered and sorted', async ({ page }) => {
		await page.goto('/en/dashboard/items?status=active&sort=budget&dir=asc');
		await expect(page.getByRole('table')).toBeVisible();
		await expectAccessible(page, 'campaign list, filtered');
	});

	test('campaign list, dark theme', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/en/dashboard/items');
		await expect(page.getByRole('table')).toBeVisible();
		await expectAccessible(page, 'campaign list, dark');
	});

	test('campaign list, empty result', async ({ page }) => {
		await page.goto('/en/dashboard/items?q=zzzz-no-such-campaign');
		await expect(page.getByText('No campaigns match these filters.')).toBeVisible();
		await expectAccessible(page, 'campaign list, empty');
	});

	test('campaign list, with the confirmation dialog open', async ({ page }) => {
		await page.goto('/en/dashboard/items?status=draft');
		await page.locator('tbody select').first().selectOption('archived');
		await expect(page.getByRole('alertdialog')).toBeVisible();
		await expectAccessible(page, 'confirmation dialog');
	});

	test('campaign list, with a toast on screen', async ({ page }) => {
		await page.goto('/en/dashboard/items?status=draft');
		await page.route('**/dashboard/items/*/status', (route) =>
			route.fulfill({ status: 409, json: { code: 'bad_transition' } })
		);
		await page.locator('tbody select').first().selectOption('scheduled');
		await expect(page.getByText('The status was reset')).toBeVisible();
		await expectAccessible(page, 'campaign list with a toast');
	});

	test('campaign list, German', async ({ page }) => {
		await page.goto('/de/dashboard/items');
		await expect(page.getByRole('table')).toBeVisible();
		await expectAccessible(page, 'campaign list (German)');
	});
});
