import type { MessageKey } from '#lib/i18n/messages.js';

export type NavItem = {
	/** The page without its locale: `/` is the home page, `/blog` the blog section. */
	path: string;
	label: MessageKey;
};

/**
 * The main navigation. An entry is added in the stage that builds its page, so the menu never
 * links to a page that does not exist yet.
 */
export const NAV_ITEMS: readonly NavItem[] = [{ path: '/', label: 'nav.home' }];

/**
 * Whether the page being shown belongs to a menu item. `rest` is the current path without the
 * locale. The home item matches only the home page; any other item also matches its subpages, so
 * `/blog/some-post` keeps "Blog" highlighted.
 */
export function isCurrent(item: NavItem, rest: string): boolean {
	const path = rest.length > 1 ? rest.replace(/\/+$/, '') : rest;
	if (item.path === '/') return path === '/';
	return path === item.path || path.startsWith(`${item.path}/`);
}
