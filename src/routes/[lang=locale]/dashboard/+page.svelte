<script lang="ts">
	import Seo from '#lib/components/Seo/Seo.svelte';
	import { getI18n } from '#lib/i18n/context.js';
	import { localizePath } from '#lib/i18n/locale.js';
	import Badge from '#lib/ui/Badge/Badge.svelte';
	import Button from '#lib/ui/Button/Button.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const i18n = getI18n();
	// The guard in `hooks.server.ts` lets only signed-in users reach this page.
	const user = $derived(data.user!);
</script>

<Seo title={i18n.t('dashboard.title')} description={i18n.t('dashboard.title')} noindex />

<Container class="space-y-4 py-12">
	<Heading level={1}>{i18n.t('dashboard.title')}</Heading>
	<p class="flex flex-wrap items-center gap-2 text-lg">
		{i18n.t('dashboard.welcome', { name: user.name })}
		<Badge tone="info">{i18n.t(`role.${user.role}`)}</Badge>
	</p>
	<Button href={localizePath(i18n.lang, '/dashboard/items')}
		>{i18n.t('dashboard.items.open')}</Button
	>
</Container>
