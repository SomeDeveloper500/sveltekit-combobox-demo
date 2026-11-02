<script lang="ts">
	import { goto } from '$app/navigation';
	import { page as current } from '$app/state';
	import PostCard from '#lib/components/PostCard/PostCard.svelte';
	import Seo from '#lib/components/Seo/Seo.svelte';
	import { getI18n } from '#lib/i18n/context.js';
	import { comboboxLabels } from '#lib/i18n/labels.js';
	import { postQueryCodec } from '#lib/query/codecs.js';
	import { POST_SORTS, type PostSort } from '#lib/schemas/query.js';
	import Button from '#lib/ui/Button/Button.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';
	import Input from '#lib/ui/Input/Input.svelte';
	import Pagination from '#lib/ui/Pagination/Pagination.svelte';
	import Select from '#lib/ui/Select/Select.svelte';
	import Combobox from '#lib/ui/Combobox/Combobox.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const i18n = getI18n();
	const result = $derived(data.result);
	const query = $derived(data.query);

	// The form fields follow the URL (back/forward, a shared link) and can be edited in between.
	let q = $derived(query.q);
	let tag = $derived(query.tag);
	let sort = $derived<PostSort>(query.sort);

	const sortOptions = $derived(
		POST_SORTS.map((value) => ({ value, label: i18n.t(`search.sort.${value}`) }))
	);
	const labels = $derived(comboboxLabels(i18n.t));

	const filtered = $derived(query.q !== '' || query.tag !== '');
	const searchString = $derived(
		postQueryCodec.withQuery(postQueryCodec.defaults, query).replace(/^\?$/, '')
	);

	/** Same-page navigation to a state; the server redirects anything that is not canonical. */
	function go(change: { q?: string; tag?: string; sort?: PostSort }) {
		const search = postQueryCodec.withQuery(postQueryCodec.defaults, {
			q: q.trim(),
			tag,
			sort,
			...change
		});
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- same page, query only
		return goto(`${current.url.pathname}${search === '?' ? '' : search}`, { reset: false });
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		void go({});
	}

	const pageHref = (page: number) =>
		`${current.url.pathname}${postQueryCodec.withQuery(query, { page }).replace(/^\?$/, '')}`;

	const summary = $derived(
		query.q
			? i18n.t('search.results', { count: result.total, query: query.q })
			: i18n.t('search.summary', { count: result.total })
	);
</script>

<Seo
	title={i18n.t('search.title')}
	description={i18n.t('search.meta.description')}
	search={searchString}
	noindex={filtered || query.page > 1 || query.sort !== 'newest'}
/>

<Container class="space-y-8 py-12">
	<Heading level={1}>{i18n.t('search.title')}</Heading>

	<!-- A plain GET form: it works without JavaScript, and with it `submit` navigates in place. -->
	<form method="get" role="search" onsubmit={submit} class="grid gap-4 sm:grid-cols-4 sm:items-end">
		<Input
			type="search"
			name="q"
			label={i18n.t('search.field.q')}
			placeholder={i18n.t('search.placeholder')}
			autocomplete="off"
			bind:value={q}
			class="sm:col-span-2"
		/>
		<!-- Picking, clearing or emptying the field changes the URL; the hidden input keeps the
			no-JavaScript form working. -->
		<Combobox
			name="tag"
			label={i18n.t('search.field.tag')}
			placeholder={i18n.t('search.tag.any')}
			options={data.tags}
			bind:value={
				() => tag,
				(next) => {
					tag = next;
					void go({ tag: next });
				}
			}
			{...labels}
		/>
		<Select
			name="sort"
			label={i18n.t('search.field.sort')}
			options={sortOptions}
			bind:value={sort}
			onchange={(event) => go({ sort: event.currentTarget.value as PostSort })}
		/>
		<div class="flex gap-2 sm:col-span-4">
			<Button type="submit">{i18n.t('search.submit')}</Button>
			{#if filtered}
				<Button variant="ghost" href={current.url.pathname}>{i18n.t('search.reset')}</Button>
			{/if}
		</div>
	</form>

	<p role="status" class="text-muted">{summary}</p>

	{#if result.posts.length === 0}
		<p>{i18n.t('search.noResults')}</p>
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
