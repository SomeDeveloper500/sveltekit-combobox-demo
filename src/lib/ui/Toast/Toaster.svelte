<script lang="ts">
	import ToastItem from './ToastItem.svelte';
	import { getToasts } from './toast.svelte.ts';

	/**
	 * Renders the toasts of the store from `provideToasts()`. Mount it once, in the root layout.
	 * Both live regions are always in the DOM: a region must exist before its content changes,
	 * or screen readers miss the announcement. Errors go to the assertive one.
	 */
	let {
		label = 'Notifications',
		dismissLabel = 'Dismiss'
	}: { label?: string; dismissLabel?: string } = $props();

	const toasts = getToasts();
	const polite = $derived(toasts.items.filter((toast) => toast.tone !== 'danger'));
	const assertive = $derived(toasts.items.filter((toast) => toast.tone === 'danger'));
</script>

<section
	aria-label={label}
	class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 p-4 sm:inset-x-auto sm:end-0 sm:w-96"
>
	<!-- The live region is a wrapper, not the <ol>: a role on the list would take away its list
		semantics and leave its <li> children without a list. -->
	<div role="status">
		<ol class="flex flex-col gap-3">
			{#each polite as toast (toast.id)}
				<ToastItem {toast} {dismissLabel} ondismiss={() => toasts.dismiss(toast.id)} />
			{/each}
		</ol>
	</div>
	<div role="alert">
		<ol class="flex flex-col gap-3">
			{#each assertive as toast (toast.id)}
				<ToastItem {toast} {dismissLabel} ondismiss={() => toasts.dismiss(toast.id)} />
			{/each}
		</ol>
	</div>
</section>
