<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import Seo from '#lib/components/Seo/Seo.svelte';
	import HomeFeatures from '#lib/components/HomeFeatures/HomeFeatures.svelte';
	import HomeHero from '#lib/components/HomeHero/HomeHero.svelte';
	import HomePricing from '#lib/components/HomePricing/HomePricing.svelte';
	import HomeSocialProof from '#lib/components/HomeSocialProof/HomeSocialProof.svelte';
	import JsonLd from '#lib/components/JsonLd/JsonLd.svelte';
	import { organizationJsonLd } from '#lib/seo/jsonld.js';
	import { siteOrigin } from '#lib/site.js';

	const i18n = getI18n();

	const organization = $derived(
		organizationJsonLd({
			name: i18n.t('site.name'),
			url: siteOrigin,
			description: i18n.t('home.meta.description')
		})
	);
</script>

<Seo title={i18n.t('home.hero.title')} description={i18n.t('home.meta.description')} />

<JsonLd data={organization} />

<HomeHero />
<HomeFeatures />
<HomePricing />
<HomeSocialProof />
