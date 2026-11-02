<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import Card from '#lib/ui/Card/Card.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';

	const i18n = getI18n();

	const features = [
		{ title: 'home.features.1.title', body: 'home.features.1.body' },
		{ title: 'home.features.2.title', body: 'home.features.2.body' },
		{ title: 'home.features.3.title', body: 'home.features.3.body' }
	] as const;
</script>

<section aria-labelledby="features-title" class="py-16">
	<Container class="space-y-8">
		<Heading level={2} id="features-title">{i18n.t('home.features.title')}</Heading>
		<ul class="grid gap-4 sm:grid-cols-3">
			{#each features as feature (feature.title)}
				<Card as="li" class="space-y-2">
					<Heading level={3}>{i18n.t(feature.title)}</Heading>
					<p class="text-muted">{i18n.t(feature.body)}</p>
				</Card>
			{/each}
		</ul>
	</Container>
</section>
