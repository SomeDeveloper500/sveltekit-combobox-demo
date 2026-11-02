<script lang="ts">
	import { page } from '$app/state';
	import AppShell from '#lib/components/AppShell/AppShell.svelte';
	import { provideI18n } from '#lib/i18n/context.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	provideI18n(() => data.lang);

	// The server wrote <html lang> for the first page; client-side navigation between /en and /de
	// keeps the same document, so the attribute has to follow the URL by itself.
	$effect(() => {
		document.documentElement.lang = data.lang;
	});
</script>

<AppShell url={page.url}>
	{@render children()}
</AppShell>
