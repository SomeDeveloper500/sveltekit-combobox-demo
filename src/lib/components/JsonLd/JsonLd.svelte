<script lang="ts">
	import { serializeJsonLd, type JsonLdObject } from '#lib/seo/jsonld.js';

	let { data }: { data: JsonLdObject } = $props();

	// `serializeJsonLd` escapes `<`, so the data cannot close the script element.
	const json = $derived(serializeJsonLd(data));
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${json}<${'/'}script>`}
</svelte:head>
