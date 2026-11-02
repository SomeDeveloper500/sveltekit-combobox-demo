import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { THEME_KEY, applyTheme, currentTheme, otherTheme } from '#lib/theme.js';
import I18nHarness from '../testing/I18nHarness.svelte';

const root = document.documentElement;
const toggle = () => page.getByRole('button', { name: /dark mode|dunkelmodus/i });

beforeEach(() => {
	delete root.dataset.theme;
	localStorage.removeItem(THEME_KEY);
});
afterEach(() => {
	vi.restoreAllMocks();
	delete root.dataset.theme;
	localStorage.removeItem(THEME_KEY);
});

describe('the theme module', () => {
	it('reads the theme from the html attribute, defaulting to light', () => {
		expect(currentTheme()).toBe('light');
		root.dataset.theme = 'dark';
		expect(currentTheme()).toBe('dark');
		root.dataset.theme = 'banana';
		expect(currentTheme()).toBe('light');
	});

	it('applies a theme and remembers it under the key the inline script reads', () => {
		applyTheme('dark');
		expect(root.dataset.theme).toBe('dark');
		expect(localStorage.getItem(THEME_KEY)).toBe('dark');
		applyTheme('light');
		expect(localStorage.getItem(THEME_KEY)).toBe('light');
	});

	it('still switches when storage is blocked', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('blocked', 'SecurityError');
		});
		expect(() => applyTheme('dark')).not.toThrow();
		expect(root.dataset.theme).toBe('dark');
	});

	it('flips between the two themes', () => {
		expect(otherTheme('light')).toBe('dark');
		expect(otherTheme('dark')).toBe('light');
	});
});

describe('ThemeToggle', () => {
	it('is a toggle button named after the setting, not the state', async () => {
		render(I18nHarness, { start: 'en' });
		await expect.element(toggle()).toBeInTheDocument();
		await expect.element(toggle()).toHaveAttribute('aria-pressed', 'false');
	});

	it('is pressed when the page is already dark', async () => {
		root.dataset.theme = 'dark';
		render(I18nHarness, { start: 'en' });
		await expect.element(toggle()).toHaveAttribute('aria-pressed', 'true');
	});

	it('switches the theme, the pressed state and the stored choice', async () => {
		render(I18nHarness, { start: 'en' });
		await toggle().click();
		expect(root.dataset.theme).toBe('dark');
		expect(localStorage.getItem(THEME_KEY)).toBe('dark');
		await expect.element(toggle()).toHaveAttribute('aria-pressed', 'true');
		await toggle().click();
		expect(root.dataset.theme).toBe('light');
		await expect.element(toggle()).toHaveAttribute('aria-pressed', 'false');
	});

	it('is labelled in the page language', async () => {
		render(I18nHarness, { start: 'de' });
		await expect.element(page.getByRole('button', { name: 'Dunkelmodus' })).toBeInTheDocument();
	});

	it('works from the keyboard', async () => {
		render(I18nHarness, { start: 'en' });
		(toggle().element() as HTMLButtonElement).focus();
		await userEvent.keyboard('{Enter}');
		expect(root.dataset.theme).toBe('dark');
		await userEvent.keyboard(' ');
		expect(root.dataset.theme).toBe('light');
	});
});
