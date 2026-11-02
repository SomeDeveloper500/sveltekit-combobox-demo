<script lang="ts">
	import JsonLd from '#lib/components/JsonLd/JsonLd.svelte';
	import Seo from '#lib/components/Seo/Seo.svelte';
	import { getI18n } from '#lib/i18n/context.js';
	import { localizePath } from '#lib/i18n/locale.js';
	import { articleJsonLd, breadcrumbJsonLd } from '#lib/seo/jsonld.js';
	import { OG_HEIGHT, OG_WIDTH } from '#lib/seo/og.js';
	import { siteOrigin } from '#lib/site.js';
	import Badge from '#lib/ui/Badge/Badge.svelte';
	import Breadcrumbs from '#lib/ui/Breadcrumbs/Breadcrumbs.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const i18n = getI18n();
	const post = $derived(data.post);

	const home = $derived(localizePath(i18n.lang));
	const blog = $derived(localizePath(i18n.lang, '/blog'));
	const self = $derived(localizePath(i18n.lang, `/blog/${post.slug}`));
	const image = $derived(`${self}/og.png`);

	const crumbs = $derived([
		{ label: i18n.t('nav.home'), href: home },
		{ label: i18n.t('nav.blog'), href: blog },
		{ label: post.title, href: self }
	]);
	const breadcrumbs = $derived(
		breadcrumbJsonLd(
			crumbs.map((crumb) => ({ name: crumb.label, url: `${siteOrigin}${crumb.href}` }))
		)
	);
	const article = $derived(
		articleJsonLd({
			headline: post.title,
			description: post.excerpt,
			url: `${siteOrigin}${self}`,
			datePublished: post.publishedAt,
			authorName: post.author.name,
			inLanguage: i18n.lang,
			publisherName: i18n.t('site.name'),
			image: `${siteOrigin}${image}`
		})
	);
</script>

<Seo
	title={post.title}
	description={post.excerpt}
	type="article"
	{image}
	imageSize={{ width: OG_WIDTH, height: OG_HEIGHT }}
/>
<JsonLd data={article} />
<JsonLd data={breadcrumbs} />

<Container size="narrow" class="space-y-8 py-12">
	<Breadcrumbs items={crumbs} label={i18n.t('breadcrumbs.label')} />

	<article class="space-y-6">
		<header class="space-y-4">
			<div
				class="h-2 rounded-full"
				style:background-color={post.coverColor}
				aria-hidden="true"
			></div>
			<Heading level={1}>{post.title}</Heading>
			<p class="text-sm text-muted">
				{post.author.name} ·
				<time datetime={post.publishedAt}>{i18n.format.date(post.publishedAt)}</time>
				·
				{i18n.t('blog.readingTime', { minutes: post.readingTimeMinutes })}
			</p>
			<ul class="flex flex-wrap gap-1.5" aria-label={i18n.t('blog.tags')}>
				{#each post.tags as tag (tag)}
					<li><Badge>{data.tagLabels[tag] ?? tag}</Badge></li>
				{/each}
			</ul>
		</header>

		<div class="space-y-4 text-lg leading-relaxed">
			{#each post.paragraphs as paragraph, index (index)}
				<p>{paragraph}</p>
			{/each}
		</div>
	</article>

	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a href={blog} class="inline-block rounded font-semibold underline-offset-4 hover:underline">
		← {i18n.t('blog.back')}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</Container>
