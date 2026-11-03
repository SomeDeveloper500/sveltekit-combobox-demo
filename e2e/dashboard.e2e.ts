import { expect, test, type Locator, type Page } from '@playwright/test';
import { DEMO, signIn } from './support/auth';

/** The first campaign of the draft list, with what is needed to find it and put it back. */
async function firstDraft(page: Page) {
	await page.goto('/en/dashboard/items?status=draft');
	const row = page.locator('tbody tr').first();
	const name = (await row.getByRole('cell').first().innerText()).trim();
	const select = row.getByRole('combobox', { name: `Status of ${name}` });
	await expect(select).toHaveValue('draft');
	const action = await select.evaluate((element) => (element as HTMLSelectElement).form!.action);
	return { row, name, select, action };
}

/** Edits live in the server’s memory: whatever a test moved is moved back through the endpoint. */
async function putBack(page: Page, action: string) {
	const response = await page.request.post(action, { data: { status: 'draft' } });
	expect(response.ok()).toBe(true);
}

const total = (page: Page): Locator => page.getByRole('status').filter({ hasText: 'campaigns' });

test.describe('the header on a prerendered page', () => {
	test('still shows a signed-in visitor their links after a client-side navigation', async ({
		page
	}) => {
		await signIn(page);
		// Client-side navigations only: the header is never remounted on the way.
		await page.getByRole('link', { name: 'Blog' }).first().click();
		await expect(page).toHaveURL(/\/en\/blog/);
		await page.locator('main a[href^="/en/blog/"]').first().click();
		await expect(page).toHaveURL(/\/en\/blog\/[^/?]+$/);

		const header = page.getByRole('group', { name: 'Account' });
		await expect(header.getByRole('link', { name: 'Dashboard' })).toBeVisible();
		await expect(header.getByRole('button', { name: 'Sign out' })).toBeVisible();
	});

	test('sends a signed-in visitor who follows a stale sign-in link on to the dashboard', async ({
		page
	}) => {
		await signIn(page);
		await page.goto('/en/blog');
		await page.locator('main a[href^="/en/blog/"]').first().click();
		await expect(page).toHaveURL(/\/en\/blog\/[^/?]+$/);

		// A link that was rendered before the visitor signed in, followed without a reload.
		await page.evaluate(() => {
			const link = document.createElement('a');
			link.href = '/en/login';
			link.id = 'stale-sign-in';
			link.textContent = 'stale';
			document.body.append(link);
		});
		await page.locator('#stale-sign-in').click();

		await expect(page).toHaveURL(/\/en\/dashboard/);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard');
	});
});

test.describe('signing in and out', () => {
	test('signs in, reaches the campaigns, and signs out', async ({ page }) => {
		await signIn(page);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard');
		await expect(page.getByText('Welcome, ')).toBeVisible();

		await page.getByRole('link', { name: 'Open campaigns' }).click();
		await expect(page).toHaveURL(/\/en\/dashboard\/items$/);
		await expect(page.getByRole('table')).toBeVisible();

		await page.getByRole('button', { name: 'Sign out' }).click();
		await expect(page).toHaveURL(/\/en$/);
		await page.goto('/en/dashboard/items');
		await expect(page).toHaveURL(/\/en\/login\?next=/);
	});

	test('goes back to the page that asked for the sign-in', async ({ page }) => {
		await page.goto('/en/dashboard/items?status=active');
		await expect(page).toHaveURL(/\/en\/login\?next=/);
		await page.getByLabel('Email').fill(DEMO.editor);
		await page.getByLabel('Password').fill(DEMO.password);
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).toHaveURL('/en/dashboard/items?status=active');
	});

	test('refuses a wrong password and stays on the form', async ({ page }) => {
		await page.goto('/en/login');
		await page.getByLabel('Email').fill(DEMO.editor);
		await page.getByLabel('Password').fill('not-the-password');
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page.getByText('Invalid email or password.')).toBeVisible();
		await expect(page).toHaveURL(/\/en\/login/);
	});
});

test.describe('the sign-in form checks before it sends', () => {
	test('names the empty fields without a round trip, using the lazily loaded check', async ({
		page
	}) => {
		let posted = false;
		page.on('request', (request) => {
			if (request.method() === 'POST') posted = true;
		});
		await page.goto('/en/login');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page.getByText('This field is required.').first()).toBeVisible();
		await expect(page.getByLabel('Email')).toBeFocused();
		expect(posted).toBe(false);
	});

	test('rejects an email that is not one, in the browser', async ({ page }) => {
		await page.goto('/en/login');
		await page.getByLabel('Email').fill('not-an-email');
		await page.getByLabel('Password').fill('x');
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page.getByText('Enter a valid email address.')).toBeVisible();
	});
});

test.describe('a viewer', () => {
	test('sees the statuses but cannot change them', async ({ page }) => {
		await signIn(page, DEMO.viewer);
		await page.goto('/en/dashboard/items?status=draft');
		await expect(page.locator('tbody tr').first()).toBeVisible();
		await expect(page.locator('tbody select')).toHaveCount(0);

		// The server says no as well, whatever the page shows.
		const row = await page.locator('tbody tr').first().locator('td').first().innerText();
		expect(row.length).toBeGreaterThan(0);
		const response = await page.request.post('/en/dashboard/items/cmp_0001/status', {
			data: { status: 'active' }
		});
		expect(response.status()).toBe(403);
	});
});

test.describe('a keyboard user sorting and filtering', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page, DEMO.viewer);
		await page.goto('/en/dashboard/items');
		await expect(page.getByRole('table')).toBeVisible();
	});

	test('keeps their place on the sort link, and the table stays on screen', async ({ page }) => {
		const sortByBudget = page.getByRole('link', { name: 'Sort by Budget' });
		await sortByBudget.focus();
		await page.keyboard.press('Enter');

		await expect(page).toHaveURL(/sort=budget/);
		await expect(page.getByRole('columnheader', { name: /Budget/ })).toHaveAttribute(
			'aria-sort',
			/ascending|descending/
		);
		await expect(sortByBudget).toBeFocused();
		await expect(page.getByRole('table')).toBeVisible();
	});

	test('filters only when Apply filters is pressed, and keeps their place', async ({ page }) => {
		const status = page.getByRole('combobox', { name: 'Status', exact: true });
		await status.click();
		await page.getByRole('option', { name: 'Active' }).click();
		await expect(status).toHaveValue('Active');
		await expect(page).not.toHaveURL(/status=/);

		const apply = page.getByRole('button', { name: 'Apply filters' });
		await apply.click();
		await expect(page).toHaveURL(/status=active/);
		await expect(apply).toBeFocused();
	});
});

test.describe('an editor changes a status', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page, DEMO.editor);
	});

	test('sees the change at once, and the list follows the server', async ({ page }) => {
		const { name, select, action } = await firstDraft(page);
		const before = await total(page).innerText();
		try {
			await select.selectOption('scheduled');

			await expect(page.getByRole('status').filter({ hasText: 'is now Scheduled' })).toContainText(
				`“${name}” is now Scheduled.`
			);
			// It no longer matches the draft filter, so the refreshed list drops it and counts one less.
			await expect(total(page)).not.toHaveText(before);
			await expect(page.getByRole('cell', { name, exact: true })).toHaveCount(0);
		} finally {
			await putBack(page, action);
		}
	});

	test('rolls back, and says why, when the server refuses the move', async ({ page }) => {
		const { name, select } = await firstDraft(page);
		await page.route('**/dashboard/items/*/status', (route) =>
			route.fulfill({ status: 409, json: { code: 'bad_transition' } })
		);

		await select.selectOption('scheduled');

		await expect(page.getByRole('alert')).toContainText('The status was reset');
		await expect(select).toHaveValue('draft');
		await expect(select).toBeEnabled();
		// Nothing changed on the page: the same campaign is still listed as a draft.
		await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
	});

	test('rolls back when the connection drops', async ({ page }) => {
		const { select } = await firstDraft(page);
		await page.route('**/dashboard/items/*/status', (route) => route.abort('failed'));

		await select.selectOption('scheduled');

		await expect(page.getByRole('alert')).toContainText('Could not reach the server');
		await expect(select).toHaveValue('draft');
	});

	test('sends a session that has ended back to sign in, and then to the same list', async ({
		page
	}) => {
		const { select } = await firstDraft(page);
		await page.context().clearCookies();

		await select.selectOption('scheduled');

		await expect(page).toHaveURL(/\/en\/login\?next=%2Fen%2Fdashboard%2Fitems%3Fstatus%3Ddraft/);
	});

	test('asks before an irreversible move, and a "no" changes nothing', async ({ page }) => {
		const { select } = await firstDraft(page);
		let sent = false;
		await page.route('**/dashboard/items/*/status', (route) => {
			sent = true;
			return route.abort();
		});

		await select.selectOption('archived');
		const dialog = page.getByRole('alertdialog', { name: 'Change status to Archived?' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();

		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(select).toHaveValue('draft');
		expect(sent).toBe(false);
	});

	test('sends the irreversible move only after it is confirmed', async ({ page }) => {
		const { name, select } = await firstDraft(page);
		let body: unknown;
		// Answered by the test: archiving for real could not be undone for the other tests.
		await page.route('**/dashboard/items/*/status', (route) => {
			body = route.request().postDataJSON();
			return route.fulfill({ status: 200, json: { item: { status: 'archived' }, changed: true } });
		});

		await select.selectOption('archived');
		await page.getByRole('button', { name: 'Change to Archived' }).click();

		await expect(page.getByRole('status').filter({ hasText: 'is now Archived' })).toContainText(
			`“${name}” is now Archived.`
		);
		expect(body).toEqual({ status: 'archived' });
	});
});

test.describe('an editor without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('changes a status with the form, and lands on the same list', async ({ page }) => {
		await signIn(page, DEMO.editor);
		const { name, select, action } = await firstDraft(page);
		try {
			await select.selectOption('scheduled');
			await page.locator('tbody tr').first().getByRole('button', { name: 'Save' }).click();

			await expect(page).toHaveURL('/en/dashboard/items?status=draft');
			await expect(page.getByRole('cell', { name, exact: true })).toHaveCount(0);
		} finally {
			await putBack(page, action);
		}
	});
});
