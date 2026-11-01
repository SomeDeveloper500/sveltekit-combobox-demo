<script lang="ts">
	import Toaster from '../Toaster.svelte';
	import { provideToasts, type ToastStore } from '../toast.svelte.js';

	/** Test-only: provides the toast context and a Toaster, and hands the store to the test. */
	let { onready }: { onready: (store: ToastStore) => void } = $props();

	const store = provideToasts();
	// svelte-ignore state_referenced_locally
	onready(store);
</script>

<Toaster />
