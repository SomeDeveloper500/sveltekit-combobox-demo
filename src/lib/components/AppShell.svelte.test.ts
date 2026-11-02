import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ShellHarness from './testing/ShellHarness.svelte';

describe('AppShell: landmarks', () => {
	it('has exactly one banner, navigation, main and footer', async () => {
		render(ShellHarness, { lang: 'en', path: '/en' });
		await expect.element(page.getByRole('banner')).toBeInTheDocument();
		await expect
			.element(page.getByRole('navigation', { name: 'Main navigation' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('main')).toBeInTheDocument();
		await expect.element(page.getByRole('contentinfo')).toBeInTheDocument();
		expect(document.querySelectorAll('main')).toHaveLength(1);
		expect(document.querySelectorAll('header')).toHaveLength(1);
		expect(document.querySelectorAll('footer')).toHaveLength(1);
	});

	it('puts the page content inside main, with the one h1', async () => {
		render(ShellHarness);
		await expect
			.element(page.getByRole('main').getByRole('heading', { level: 1 }))
			.toHaveTextContent('Page content');
		expect(document.querySelectorAll('h1')).toHaveLength(1);
	});

	it('labels the navigation in the page language', async () => {
		render(ShellHarness, { lang: 'de', path: '/de' });
		await expect
			.element(page.getByRole('navigation', { name: 'Hauptnavigation' }))
			.toBeInTheDocument();
	});

	it('keeps the switchers in the banner and the copyright in the footer', async () => {
		render(ShellHarness, { lang: 'en', path: '/en' });
		const banner = page.getByRole('banner');
		await expect.element(banner.getByRole('list', { name: 'Language' })).toBeInTheDocument();
		await expect.element(banner.getByRole('button', { name: 'Dark mode' })).toBeInTheDocument();
		await expect.element(page.getByRole('contentinfo')).toHaveTextContent('© 2026 Demo Co.');
	});
});

describe('AppShell: skip link', () => {
	it('is the first thing a keyboard user reaches', async () => {
		render(ShellHarness, { lang: 'en', path: '/en' });
		// No positive tabindex anywhere, so tab order is document order.
		const tabbable = [
			...document.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])')
		];
		const first = tabbable[0] as HTMLAnchorElement;
		expect(first.getAttribute('href')).toBe('#main');
		expect(first.textContent?.trim()).toBe('Skip to main content');
		expect(document.querySelector('[tabindex]:not([tabindex="-1"])')).toBeNull();
	});

	it('speaks the page language', async () => {
		render(ShellHarness, { lang: 'de', path: '/de' });
		await expect
			.element(page.getByRole('link', { name: 'Zum Hauptinhalt springen' }))
			.toBeInTheDocument();
	});

	it('points at a main element that can take focus', async () => {
		render(ShellHarness);
		const main = document.querySelector('main')!;
		expect(main.id).toBe('main');
		expect(main.getAttribute('tabindex')).toBe('-1');
	});

	it('moves focus into main when activated', async () => {
		render(ShellHarness);
		const skip = page.getByRole('link', { name: 'Skip to main content' }).element() as HTMLElement;
		skip.focus();
		await userEvent.keyboard('{Enter}');
		expect(document.activeElement).toBe(document.querySelector('main'));
		history.replaceState(null, '', location.pathname + location.search);
	});

	it('comes before the header in the document', async () => {
		render(ShellHarness);
		const skip = page.getByRole('link', { name: 'Skip to main content' }).element();
		const header = document.querySelector('header')!;
		expect(skip.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});
});

describe('AppShell: navigation', () => {
	it('links the site name and the menu to the localized home page', async () => {
		render(ShellHarness, { lang: 'de', path: '/de' });
		await expect
			.element(page.getByRole('link', { name: 'Demo Co.' }))
			.toHaveAttribute('href', '/de');
		await expect
			.element(
				page
					.getByRole('navigation', { name: 'Hauptnavigation' })
					.getByRole('link', { name: 'Start' })
			)
			.toHaveAttribute('href', '/de');
	});

	it('marks the current page', async () => {
		render(ShellHarness, { lang: 'en', path: '/en' });
		const home = page
			.getByRole('navigation', { name: 'Main navigation' })
			.getByRole('link', { name: 'Home' });
		await expect.element(home).toHaveAttribute('aria-current', 'page');
	});

	it('does not mark the home item on another page', async () => {
		render(ShellHarness, { lang: 'en', path: '/en/somewhere' });
		const home = page
			.getByRole('navigation', { name: 'Main navigation' })
			.getByRole('link', { name: 'Home' });
		await expect.element(home).not.toHaveAttribute('aria-current');
	});

	it('only links to pages that exist', async () => {
		render(ShellHarness, { lang: 'en', path: '/en' });
		const links = [...document.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));
		expect(links).toEqual(['/en']);
	});
});
