<script lang="ts">
	import Skeleton from '../Skeleton/Skeleton.svelte';
	import { cx } from '../shared/cx';

	/**
	 * What `DataTable` looks like while its rows are on the way: the same frame, a header bar and
	 * rows of the same height, so the swap does not move the page. Announced once, as a status
	 * ("Loading…"), not per placeholder.
	 */
	type Props = {
		columns: number;
		rows: number;
		/** The spoken word for what is happening, e.g. "Loading…". */
		label: string;
		class?: string;
	};

	let { columns, rows, label, class: className }: Props = $props();

	const range = (count: number) => [...Array(count).keys()];
</script>

<div
	aria-busy="true"
	class={cx('overflow-hidden rounded-xl border border-line bg-surface', className)}
>
	<p role="status" class="sr-only">{label}</p>
	<div class="flex h-10 items-center gap-4 bg-neutral-soft px-4">
		{#each range(columns) as column (column)}
			<Skeleton class="h-3 flex-1" />
		{/each}
	</div>
	<div class="divide-y divide-line">
		{#each range(rows) as row (row)}
			<div class="flex h-[3.25rem] items-center gap-4 px-4">
				{#each range(columns) as column (column)}
					<Skeleton class="h-4 flex-1" />
				{/each}
			</div>
		{/each}
	</div>
</div>
