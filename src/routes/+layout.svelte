<script lang="ts">
	import '../app.css';
	import { asset } from '$app/paths';
	import Toaster from '#lib/ui/Toast/Toaster.svelte';
	import { provideToasts } from '#lib/ui/Toast/toast.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	provideToasts();
</script>

<svelte:head>
	<link rel="icon" href={asset('favicon.svg')} type="image/svg+xml" />
</svelte:head>

{@render children()}
<Toaster />
