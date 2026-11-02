<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import Toaster from '#lib/ui/Toast/Toaster.svelte';
	import { provideToasts } from '#lib/ui/Toast/toast.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	provideToasts();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
<Toaster />
