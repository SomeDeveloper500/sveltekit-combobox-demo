<script lang="ts">
	import { provideI18n } from '#lib/i18n/context.js';
	import type { Locale } from '#lib/schemas/common.js';
	import ErrorPage from './ErrorPage.svelte';

	/** Test-only: an error page in a given language, status and incident reference. */
	let {
		lang = 'en',
		status = 404,
		id = undefined,
		next = undefined
	}: { lang?: Locale; status?: number; id?: string; next?: string } = $props();

	provideI18n(() => lang);
</script>

<ErrorPage {status} {id} {next} />
