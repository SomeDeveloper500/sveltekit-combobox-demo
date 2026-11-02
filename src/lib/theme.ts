/**
 * The color theme lives in one place: the `data-theme` attribute on `<html>`. The inline script in
 * `app.html` sets it before the first paint (saved choice, else the system setting); this module
 * reads and changes it afterwards. Both use the same storage key.
 */
export type Theme = 'light' | 'dark';

export const THEME_KEY = 'theme';

type Storage = Pick<globalThis.Storage, 'setItem'>;

/** The theme the page is showing right now. */
export function currentTheme(root: HTMLElement = document.documentElement): Theme {
	return root.dataset.theme === 'dark' ? 'dark' : 'light';
}

/**
 * Applies a theme and remembers it. Storage can be blocked (private mode, site settings); then the
 * choice simply lasts until the page is closed.
 */
export function applyTheme(
	theme: Theme,
	root: HTMLElement = document.documentElement,
	storage?: Storage
): void {
	root.dataset.theme = theme;
	try {
		(storage ?? localStorage).setItem(THEME_KEY, theme);
	} catch {
		/* storage blocked: the choice is not remembered */
	}
}

export const otherTheme = (theme: Theme): Theme => (theme === 'dark' ? 'light' : 'dark');
