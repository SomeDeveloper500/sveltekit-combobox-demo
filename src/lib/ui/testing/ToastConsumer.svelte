<script lang="ts">
	import { getToasts } from '../toast.svelte.js';

	/** Test-only: reads the toast store without a provider above it. */
	getToasts();
</script>
