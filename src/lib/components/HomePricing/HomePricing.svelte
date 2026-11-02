<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import Badge from '#lib/ui/Badge/Badge.svelte';
	import Card from '#lib/ui/Card/Card.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';

	const i18n = getI18n();

	/** `price` is in whole US dollars per month; `null` means "talk to us". */
	const plans = [
		{
			id: 'starter',
			price: 0,
			name: 'home.pricing.starter.name',
			tagline: 'home.pricing.starter.tagline',
			features: ['home.pricing.starter.f1', 'home.pricing.starter.f2', 'home.pricing.starter.f3'],
			popular: false
		},
		{
			id: 'team',
			price: 29,
			name: 'home.pricing.team.name',
			tagline: 'home.pricing.team.tagline',
			features: ['home.pricing.team.f1', 'home.pricing.team.f2', 'home.pricing.team.f3'],
			popular: true
		},
		{
			id: 'enterprise',
			price: null,
			name: 'home.pricing.enterprise.name',
			tagline: 'home.pricing.enterprise.tagline',
			features: [
				'home.pricing.enterprise.f1',
				'home.pricing.enterprise.f2',
				'home.pricing.enterprise.f3'
			],
			popular: false
		}
	] as const;
</script>

<section id="pricing" aria-labelledby="pricing-title" class="border-y border-line bg-surface py-16">
	<Container class="space-y-8">
		<div class="space-y-2">
			<Heading level={2} id="pricing-title">{i18n.t('home.pricing.title')}</Heading>
			<p class="text-muted">{i18n.t('home.pricing.subtitle')}</p>
		</div>
		<ul class="grid gap-4 sm:grid-cols-3">
			{#each plans as plan (plan.id)}
				<Card as="li" class="flex flex-col gap-4 {plan.popular ? 'border-primary' : ''}">
					<div class="space-y-1">
						<div class="flex items-center justify-between gap-2">
							<Heading level={3}>{i18n.t(plan.name)}</Heading>
							{#if plan.popular}
								<Badge tone="info">{i18n.t('home.pricing.popular')}</Badge>
							{/if}
						</div>
						<p class="text-sm text-muted">{i18n.t(plan.tagline)}</p>
					</div>
					<p>
						{#if plan.price === null}
							<span class="text-3xl font-bold">{i18n.t('home.pricing.custom')}</span>
						{:else}
							<span class="text-3xl font-bold">{i18n.format.money(plan.price)}</span>
							<span class="text-sm text-muted">{i18n.t('home.pricing.perMonth')}</span>
						{/if}
					</p>
					<ul class="space-y-1 text-sm">
						{#each plan.features as feature (feature)}
							<li>{i18n.t(feature)}</li>
						{/each}
					</ul>
				</Card>
			{/each}
		</ul>
	</Container>
</section>
