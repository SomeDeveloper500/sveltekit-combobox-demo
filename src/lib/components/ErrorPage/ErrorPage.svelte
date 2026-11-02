<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import { localizePath } from '#lib/i18n/locale.js';
	import Button from '#lib/ui/Button/Button.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';

	/**
	 * The content of an error page, shared by the localized and the root `+error.svelte`. A missing
	 * page gets its own wording; every other failure gets the generic one, plus the reference of the
	 * logged incident when there is one. Search engines are told not to index it.
	 */
	let { status, id }: { status: number; id?: string } = $props();

	const i18n = getI18n();
	const notFound = $derived(status === 404);
	const title = $derived(i18n.t(notFound ? 'error.notFound.title' : 'error.generic.title'));
	const body = $derived(i18n.t(notFound ? 'error.notFound.body' : 'error.generic.body'));
</script>

<svelte:head>
	<title>{title} – {i18n.t('site.name')}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<Container size="narrow" class="space-y-4 py-16">
	<p class="text-sm font-semibold text-muted">{status}</p>
	<Heading level={1}>{title}</Heading>
	<p class="text-lg text-muted">{body}</p>
	{#if id}
		<p class="text-sm text-muted">{i18n.t('error.reference', { id })}</p>
	{/if}
	<div class="pt-2">
		<Button href={localizePath(i18n.lang)}>{i18n.t('error.backHome')}</Button>
	</div>
</Container>
