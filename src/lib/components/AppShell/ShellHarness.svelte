<script lang="ts">
	import { provideI18n } from '#lib/i18n/context.js';
	import type { Locale } from '#lib/schemas/common.js';
	import AppShell from './AppShell.svelte';

	/** Test-only: the app shell around a page with one heading, in a given language and at a path. */
	let { lang = 'en', path = '/en' }: { lang?: Locale; path?: string } = $props();

	provideI18n(() => lang);
	const url = $derived(new URL(path, 'https://example.test'));
</script>

<AppShell {url}>
	<h1>Page content</h1>
</AppShell>
