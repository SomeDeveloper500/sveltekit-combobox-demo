<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import Button from '#lib/ui/Button/Button.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';

	const i18n = getI18n();
</script>

<section class="border-b border-line bg-surface">
	<Container size="narrow" class="space-y-6 py-16 text-center sm:py-24">
		<Heading level={1}>{i18n.t('home.hero.title')}</Heading>
		<p class="text-lg text-muted">{i18n.t('home.hero.subtitle')}</p>
		<Button href="#pricing" size="lg">{i18n.t('home.hero.cta')}</Button>
	</Container>
</section>
