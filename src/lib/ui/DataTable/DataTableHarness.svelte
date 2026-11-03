<script lang="ts">
	import DataTable, { type Column } from './DataTable.svelte';

	type Row = { id: string; name: string; plan: string; budget: number };

	let {
		rows = [
			{ id: 'a', name: 'Alpha', plan: 'pro', budget: 1200 },
			{ id: 'b', name: 'Beta', plan: 'free', budget: 80 }
		],
		sort = null
	}: { rows?: Row[]; sort?: { key: string; direction: 'asc' | 'desc' } | null } = $props();

	const columns: Column<Row>[] = [
		{ key: 'name', header: 'Name', sortable: true },
		{ key: 'plan', header: 'Plan', cell: planCell },
		{ key: 'budget', header: 'Budget', sortable: true, align: 'end', value: (r) => `$${r.budget}` }
	];
</script>

{#snippet planCell(row: Row)}
	<strong data-testid="plan">{row.plan}</strong>
{/snippet}

<DataTable
	{rows}
	{columns}
	{sort}
	rowKey={(row) => row.id}
	caption="Campaigns"
	sortHref={(key) => `?sort=${key}`}
	sortLabel={(header) => `Sort by ${header}`}
>
	{#snippet empty()}Nothing found{/snippet}
</DataTable>
