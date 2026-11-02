<script lang="ts">
	import { building } from '$app/env';
	import { page } from '$app/state';
	import AppShell from '#lib/components/AppShell/AppShell.svelte';
	import { provideI18n } from '#lib/i18n/context.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	provideI18n(() => data.lang);

	// SvelteKit forbids reading `url.search` while prerendering, and a prerendered page has no query.
	const url = $derived({
		pathname: page.url.pathname,
		search: building ? '' : page.url.search,
		hash: page.url.hash
	});

	// The server wrote <html lang> for the first page; client-side navigation between /en and /de
	// keeps the same document, so the attribute has to follow the URL by itself.
	$effect(() => {
		document.documentElement.lang = data.lang;
	});
</script>

<AppShell {url}>
	{@render children()}
</AppShell>
