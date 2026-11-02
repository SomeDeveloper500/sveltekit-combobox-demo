<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import Card from '#lib/ui/Card/Card.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';

	const i18n = getI18n();

	const quotes = [
		{
			quote: 'home.proof.1.quote',
			author: 'home.proof.1.author',
			role: 'home.proof.1.role'
		},
		{
			quote: 'home.proof.2.quote',
			author: 'home.proof.2.author',
			role: 'home.proof.2.role'
		}
	] as const;
</script>

<section aria-labelledby="proof-title" class="py-16">
	<Container class="space-y-8">
		<Heading level={2} id="proof-title">{i18n.t('home.proof.title')}</Heading>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each quotes as item (item.quote)}
				<Card as="div">
					<figure class="space-y-4">
						<blockquote class="text-lg">
							<p>{i18n.t(item.quote)}</p>
						</blockquote>
						<figcaption class="text-sm">
							<span class="font-semibold">{i18n.t(item.author)}</span>
							<span class="text-muted">, {i18n.t(item.role)}</span>
						</figcaption>
					</figure>
				</Card>
			{/each}
		</div>
		<p class="text-sm text-muted">{i18n.t('home.proof.disclaimer')}</p>
	</Container>
</section>
