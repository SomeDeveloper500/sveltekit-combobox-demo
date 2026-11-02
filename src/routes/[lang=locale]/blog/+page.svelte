<script lang="ts">
	import { page as current } from '$app/state';
	import PostCard from '#lib/components/PostCard/PostCard.svelte';
	import Seo from '#lib/components/Seo/Seo.svelte';
	import { getI18n } from '#lib/i18n/context.js';
	import { localizePath } from '#lib/i18n/locale.js';
	import { blogQueryCodec } from '#lib/query/codecs.js';
	import { siteOrigin } from '#lib/site.js';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';
	import Pagination from '#lib/ui/Pagination/Pagination.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const i18n = getI18n();
	const result = $derived(data.result);

	/** The query that identifies this page: empty for the first one. */
	const search = $derived(
		blogQueryCodec.withQuery({ page: 1 }, { page: result.page }).replace(/^\?$/, '')
	);
	const title = $derived(
		result.page > 1
			? i18n.t('blog.pageTitle', { title: i18n.t('blog.title'), page: result.page })
			: i18n.t('blog.title')
	);
	const pageHref = (page: number) =>
		`${current.url.pathname}${blogQueryCodec.withQuery({ page: 1 }, { page }).replace(/^\?$/, '')}`;
	const absolute = (page: number) =>
		`${siteOrigin}${localizePath(i18n.lang, '/blog')}${blogQueryCodec.withQuery({ page: 1 }, { page }).replace(/^\?$/, '')}`;
</script>

<Seo {title} description={i18n.t('blog.meta.description')} {search} />

<svelte:head>
	{#if result.page > 1}<link rel="prev" href={absolute(result.page - 1)} />{/if}
	{#if result.page < result.pages}<link rel="next" href={absolute(result.page + 1)} />{/if}
</svelte:head>

<Container class="space-y-8 py-12">
	<Heading level={1}>{i18n.t('blog.title')}</Heading>
	{#if result.posts.length === 0}
		<p class="text-muted">{i18n.t('blog.empty')}</p>
	{:else}
		<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each result.posts as post (post.slug)}
				<PostCard
					slug={post.slug}
					title={post.title}
					excerpt={post.excerpt}
					tags={post.tags}
					tagLabels={data.tagLabels}
					authorName={post.author.name}
					publishedAt={post.publishedAt}
					readingTimeMinutes={post.readingTimeMinutes}
					coverColor={post.coverColor}
				/>
			{/each}
		</ul>
		<Pagination
			page={result.page}
			pages={result.pages}
			href={pageHref}
			label={i18n.t('pagination.label')}
			previousLabel={i18n.t('pagination.previous')}
			nextLabel={i18n.t('pagination.next')}
			pageLabel={(page) => i18n.t('pagination.page', { page })}
		/>
	{/if}
</Container>
