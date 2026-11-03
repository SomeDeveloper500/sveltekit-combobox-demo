<script lang="ts">
	import '../app.css';
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import { provideI18n } from '#lib/i18n/context.js';
	import Toaster from '#lib/ui/Toast/Toaster.svelte';
	import { provideToasts } from '#lib/ui/Toast/toast.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// The toaster sits above every page's own provider, so it speaks the request's language itself.
	const i18n = provideI18n(() => page.data.lang ?? 'en');
	provideToasts();
</script>

<svelte:head>
	<link rel="icon" href={asset('favicon.svg')} type="image/svg+xml" />
</svelte:head>

{@render children()}
<Toaster label={i18n.t('common.notifications')} dismissLabel={i18n.t('common.dismiss')} />
