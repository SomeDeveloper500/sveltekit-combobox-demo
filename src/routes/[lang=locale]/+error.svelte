<script lang="ts">
	import { page } from '$app/state';
	import ErrorPage from '#lib/components/ErrorPage/ErrorPage.svelte';
</script>

<!-- Inside the locale layout, so the language and the shell are already in place. -->
<ErrorPage status={page.status} id={page.error?.id} />
