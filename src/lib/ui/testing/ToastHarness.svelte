<script lang="ts">
	import Toaster from '../Toaster.svelte';
	import { provideToasts, type ToastStore } from '../toast.svelte.js';

	/** Test-only: provides the toast context and a Toaster, and hands the store to the test. */
	let { onready }: { onready: (store: ToastStore) => void } = $props();

	const store = provideToasts();
	// svelte-ignore state_referenced_locally
	onready(store);
</script>

<!-- A spot far from where toasts appear, to park the pointer on (see `mount` in the test). -->
<div
	data-testid="parking"
	style="position: fixed; right: 0; bottom: 0; width: 8px; height: 8px;"
></div>
<Toaster />
