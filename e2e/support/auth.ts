import { expect, type Page } from '@playwright/test';

/** The demo accounts from `mocks/users.json`; all share one password. */
export const DEMO = {
	admin: 'admin@demo.test',
	editor: 'editor@demo.test',
	viewer: 'viewer@demo.test',
	password: 'demo1234'
} as const;

/** Signs in through the form, the way a person does, and waits to land on the dashboard. */
export async function signIn(page: Page, email: string = DEMO.editor, next?: string) {
	await page.goto(next ? `/en/login?next=${encodeURIComponent(next)}` : '/en/login');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(DEMO.password);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/en\/dashboard/);
}
