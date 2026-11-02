<script lang="ts">
	import { classifyFailure } from '#lib/api/failure.js';
	import { getI18n } from '#lib/i18n/context.js';
	import { localizePath } from '#lib/i18n/locale.js';
	import Button from '#lib/ui/Button/Button.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';

	/**
	 * The content of an error page, shared by the localized and the root `+error.svelte`. A missing
	 * page, a visitor who has to sign in (401) and one who is signed in but not allowed (403) each
	 * get their own wording and way forward; every other failure gets the generic one, plus the
	 * reference of the logged incident when there is one. Search engines are told not to index it.
	 */
	let {
		status,
		id,
		next
	}: {
		status: number;
		id?: string;
		/** The path the visitor was on: after signing in (401) they return there. */
		next?: string;
	} = $props();

	const i18n = getI18n();
	const kind = $derived(classifyFailure(status));
	const wording = $derived(
		kind === 'not_found'
			? 'notFound'
			: kind === 'unauthenticated'
				? 'unauthenticated'
				: kind === 'forbidden'
					? 'forbidden'
					: 'generic'
	);
	const title = $derived(i18n.t(`error.${wording}.title`));
	const body = $derived(i18n.t(`error.${wording}.body`));
	const signIn = $derived(
		kind === 'unauthenticated'
			? `${localizePath(i18n.lang, '/login')}${next ? `?next=${encodeURIComponent(next)}` : ''}`
			: null
	);
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
	<div class="flex flex-wrap gap-2 pt-2">
		{#if signIn}
			<Button href={signIn}>{i18n.t('nav.login')}</Button>
		{/if}
		<Button href={localizePath(i18n.lang)} variant={signIn ? 'secondary' : 'primary'}>
			{i18n.t('error.backHome')}
		</Button>
	</div>
</Container>
