<script lang="ts">
	import { page } from '$app/state';
	import AppShell from '#lib/components/AppShell/AppShell.svelte';
	import ErrorPage from '#lib/components/ErrorPage/ErrorPage.svelte';
	import { provideI18n } from '#lib/i18n/context.js';

	// Errors for paths that matched no route land here, outside the locale layout, so this page
	// provides the language and the shell itself.
	provideI18n(() => page.data.lang ?? 'en');
</script>

<AppShell url={page.url} user={page.data.user}>
	<ErrorPage
		status={page.status}
		id={page.error?.id}
		next={`${page.url.pathname}${page.url.search}`}
	/>
</AppShell>
