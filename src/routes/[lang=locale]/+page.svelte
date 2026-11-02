<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';

	const i18n = getI18n();
</script>

<svelte:head>
	<title>{i18n.t('home.hero.title')}</title>
</svelte:head>

<Container size="narrow" class="space-y-4 py-16">
	<Heading level={1}>{i18n.t('home.hero.title')}</Heading>
	<p class="text-lg text-muted">{i18n.t('home.hero.subtitle')}</p>
</Container>
