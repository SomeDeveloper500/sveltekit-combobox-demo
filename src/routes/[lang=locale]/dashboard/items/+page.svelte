<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { page as current } from '$app/state';
	import { needsRefresh } from '#lib/components/ItemStatusControl/change-status.js';
	import ItemStatusControl from '#lib/components/ItemStatusControl/ItemStatusControl.svelte';
	import Seo from '#lib/components/Seo/Seo.svelte';
	import { canEditItems } from '#lib/domain/permissions.js';
	import { getI18n } from '#lib/i18n/context.js';
	import { comboboxLabels } from '#lib/i18n/labels.js';
	import { itemsQueryEncoder } from '#lib/query/encoders.js';
	import type { Item } from '#lib/schemas/item.js';
	import {
		ITEM_CHANNELS,
		ITEM_STATUSES,
		type ItemChannel,
		type ItemSortKey,
		type ItemStatus
	} from '#lib/schemas/lists.js';
	import type { ItemsQuery } from '#lib/schemas/query.js';
	import Button from '#lib/ui/Button/Button.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Combobox from '#lib/ui/Combobox/Combobox.svelte';
	import DataTable, { type Column } from '#lib/ui/DataTable/DataTable.svelte';
	import DataTableSkeleton from '#lib/ui/DataTable/DataTableSkeleton.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';
	import Input from '#lib/ui/Input/Input.svelte';
	import Pagination from '#lib/ui/Pagination/Pagination.svelte';
	import type { PageData, PageProps } from './$types';
	import { ITEMS_LIST } from './keys';

	let { data }: PageProps = $props();

	const i18n = getI18n();
	const query = $derived(data.query);

	// The form fields follow the URL (back/forward, a shared link) and can be edited in between.
	let q = $derived(query.q);
	let status = $derived<ItemStatus | ''>(query.status);
	let channel = $derived<ItemChannel | ''>(query.channel);
	let owner = $derived(query.owner);

	const labels = $derived(comboboxLabels(i18n.t));
	const statusOptions = $derived(
		ITEM_STATUSES.map((value) => ({ value, label: i18n.t(`item.status.${value}`) }))
	);
	const channelOptions = $derived(
		ITEM_CHANNELS.map((value) => ({ value, label: i18n.t(`item.channel.${value}`) }))
	);
	const ownerOptions = $derived(
		data.owners.ok ? data.owners.value.map((o) => ({ value: o.id, label: o.name })) : []
	);

	const filtered = $derived(
		query.q !== '' || query.status !== '' || query.channel !== '' || query.owner !== ''
	);

	/** Same-page navigation to a state; the server redirects anything that is not canonical. */
	function go(change: Partial<ItemsQuery> = {}) {
		const search = itemsQueryEncoder.withQuery(query, {
			q: q.trim(),
			status,
			channel,
			owner,
			...change
		});
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- same page, query only
		return goto(`${current.url.pathname}${search === '?' ? '' : search}`, { reset: false });
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		void go();
	}

	const href = (change: Partial<ItemsQuery>) =>
		`${current.url.pathname}${itemsQueryEncoder.withQuery(query, change).replace(/^\?$/, '')}`;

	/** Text columns start A to Z; numbers and dates start with the largest. */
	const FIRST_ASCENDING: readonly ItemSortKey[] = ['name', 'status', 'channel', 'owner'];

	/** A click on the sorted column flips its direction; on another column it starts that column. */
	function sortHref(key: string) {
		const column = key as ItemSortKey;
		const dir =
			query.sort === column
				? query.dir === 'asc'
					? 'desc'
					: 'asc'
				: FIRST_ASCENDING.includes(column)
					? 'asc'
					: 'desc';
		return href({ sort: column, dir });
	}

	/**
	 * The list as the server last reported it. A client-side navigation delivers the result as a
	 * promise, and so does a refresh after a status change. The table stays on screen while the new
	 * result is on its way (dimmed, and marked busy, when it is for another view): replacing it
	 * with a skeleton would destroy the sort link or button the person is using and drop their
	 * keyboard focus. A skeleton is for when there is nothing to show yet.
	 */
	type Outcome = Awaited<PageData['result']>;
	const view = $derived(JSON.stringify(data.query));
	let last = $state<{ view: string; outcome: Outcome } | null>(null);
	$effect(() => {
		const wanted = view;
		const incoming = data.result;
		if (!(incoming instanceof Promise)) {
			last = { view: wanted, outcome: incoming };
			return;
		}
		let live = true;
		void incoming.then((outcome) => {
			if (live) last = { view: wanted, outcome };
		});
		return () => {
			live = false;
		};
	});
	const outcome = $derived(data.result instanceof Promise ? (last?.outcome ?? null) : data.result);
	const stale = $derived(data.result instanceof Promise && last?.view !== view);

	/** Only the list is reloaded, not the layout, the owners or the session. */
	const refresh = () => invalidate(ITEMS_LIST);

	const canEdit = $derived(canEditItems(data.user));
	/** The list as it is now, so a form post without JavaScript comes back to the same view. */
	const here = $derived(`${current.url.pathname}${current.url.search}`);

	const columns = $derived<Column<Item>[]>([
		{ key: 'name', header: i18n.t('dashboard.items.column.name'), sortable: true },
		{
			key: 'status',
			header: i18n.t('dashboard.items.column.status'),
			sortable: true,
			cell: statusCell
		},
		{
			key: 'channel',
			header: i18n.t('dashboard.items.column.channel'),
			sortable: true,
			value: (row) => i18n.t(`item.channel.${row.channel}`)
		},
		{
			key: 'owner',
			header: i18n.t('dashboard.items.column.owner'),
			sortable: true,
			value: (row) => row.owner.name
		},
		{
			key: 'budget',
			header: i18n.t('dashboard.items.column.budget'),
			sortable: true,
			align: 'end',
			value: (row) => i18n.format.money(row.budget)
		},
		{
			key: 'spent',
			header: i18n.t('dashboard.items.column.spent'),
			sortable: true,
			align: 'end',
			value: (row) => i18n.format.money(row.spent)
		},
		{
			key: 'ctr',
			header: i18n.t('dashboard.items.column.ctr'),
			sortable: true,
			align: 'end',
			value: (row) => i18n.format.percent(row.ctr)
		},
		{
			key: 'updatedAt',
			header: i18n.t('dashboard.items.column.updated'),
			sortable: true,
			value: (row) => i18n.format.date(row.updatedAt)
		}
	]);
</script>

{#snippet statusCell(row: Item)}
	<ItemStatusControl
		item={row}
		{canEdit}
		redirectTo={here}
		onsettled={(result) => needsRefresh(result) && void refresh()}
	/>
{/snippet}

<Seo
	title={i18n.t('dashboard.items.title')}
	description={i18n.t('dashboard.items.meta.description')}
	noindex
/>

<Container class="space-y-8 py-12">
	<Heading level={1}>{i18n.t('dashboard.items.title')}</Heading>

	<!-- A plain GET form: it works without JavaScript, and with it `submit` navigates in place. -->
	<form
		method="get"
		role="search"
		aria-label={i18n.t('dashboard.items.filters')}
		onsubmit={submit}
		class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-start"
	>
		<Input
			type="search"
			name="q"
			label={i18n.t('dashboard.items.field.q')}
			autocomplete="off"
			bind:value={q}
			class="sm:col-span-2 lg:col-span-4"
		/>
		<!-- The three filters are the same control. Nothing is applied until the form is submitted. -->
		<Combobox
			name="status"
			label={i18n.t('dashboard.items.field.status')}
			placeholder={i18n.t('dashboard.items.any.status')}
			options={statusOptions}
			bind:value={status}
			{...labels}
		/>
		<Combobox
			name="channel"
			label={i18n.t('dashboard.items.field.channel')}
			placeholder={i18n.t('dashboard.items.any.channel')}
			options={channelOptions}
			bind:value={channel}
			{...labels}
		/>
		<!-- The hidden input carries the choice in the form submit. If the owners could not be loaded the filter is off, but an owner already in the URL is kept. -->
		<Combobox
			name={data.owners.ok ? 'owner' : undefined}
			label={i18n.t('dashboard.items.field.owner')}
			placeholder={i18n.t('dashboard.items.any.owner')}
			options={ownerOptions}
			disabled={!data.owners.ok}
			hint={data.owners.ok ? undefined : i18n.t('dashboard.items.owners.failed')}
			bind:value={owner}
			{...labels}
		/>
		{#if !data.owners.ok && query.owner}
			<input type="hidden" name="owner" value={query.owner} />
		{/if}
		<!-- Sorting and paging live in links; a form submit must not forget them. -->
		{#if query.sort !== itemsQueryEncoder.defaults.sort}
			<input type="hidden" name="sort" value={query.sort} />
		{/if}
		{#if query.dir !== itemsQueryEncoder.defaults.dir}
			<input type="hidden" name="dir" value={query.dir} />
		{/if}
		{#if query.perPage !== itemsQueryEncoder.defaults.perPage}
			<input type="hidden" name="perPage" value={query.perPage} />
		{/if}
		<div class="flex gap-2 sm:col-span-2 lg:col-span-4">
			<Button type="submit">{i18n.t('dashboard.items.submit')}</Button>
			{#if filtered}
				<Button variant="ghost" href={href({ q: '', status: '', channel: '', owner: '' })}>
					{i18n.t('dashboard.items.reset')}
				</Button>
			{/if}
		</div>
	</form>

	<!-- The result is streamed to client-side navigations: the heading and filters are on screen. -->
	{#if outcome === null}
		<DataTableSkeleton
			columns={columns.length}
			rows={query.perPage}
			label={i18n.t('common.loading')}
		/>
	{:else if !outcome.ok}
		<div role="alert" class="space-y-3 rounded-xl border border-danger bg-danger-soft p-6">
			<p class="font-semibold text-danger">{i18n.t('dashboard.items.error.title')}</p>
			<p>{i18n.t('dashboard.items.error.body')}</p>
			<Button variant="secondary" onclick={() => refresh()}>{i18n.t('common.retry')}</Button>
		</div>
	{:else}
		{@const list = outcome.value}
		<div class={['space-y-8 transition-opacity', stale && 'opacity-60']} aria-busy={stale}>
			<p role="status" class="text-muted">
				{i18n.t('dashboard.items.summary', { count: list.total })}
			</p>
			<DataTable
				rows={list.rows}
				{columns}
				rowKey={(row) => row.id}
				caption={i18n.t('dashboard.items.title')}
				sort={{ key: query.sort, direction: query.dir }}
				{sortHref}
				sortLabel={(column) => i18n.t('dashboard.items.sortBy', { column })}
			>
				{#snippet empty()}
					<p>{filtered ? i18n.t('dashboard.items.noMatch') : i18n.t('dashboard.items.empty')}</p>
					{#if filtered}
						<Button
							variant="ghost"
							class="mt-3"
							href={href({ q: '', status: '', channel: '', owner: '' })}
						>
							{i18n.t('dashboard.items.reset')}
						</Button>
					{/if}
				{/snippet}
			</DataTable>
			<Pagination
				page={list.page}
				pages={list.pages}
				href={(page) => href({ page })}
				label={i18n.t('pagination.label')}
				previousLabel={i18n.t('pagination.previous')}
				nextLabel={i18n.t('pagination.next')}
				pageLabel={(page) => i18n.t('pagination.page', { page })}
			/>
		</div>
	{/if}
</Container>
