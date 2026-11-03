<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type Column<R> = {
		/** Identifies the column; also the value sent to `sortHref`. */
		key: string;
		header: string;
		/** A sortable header is a link to `sortHref(key)`; the table itself never reorders rows. */
		sortable?: boolean;
		align?: 'start' | 'end';
		/** The cell as text. Without it and without `cell`, `row[key]` is shown. */
		value?: (row: R) => string;
		/** The cell as markup, for badges and the like. Wins over `value`. */
		cell?: Snippet<[R]>;
	};
</script>

<script lang="ts" generics="Row">
	import { cx } from '../shared/cx';

	/**
	 * A table whose order, filtering and paging all happen elsewhere (on the server): it renders the
	 * rows it is given and links to the next state. Sorting is a link, so it works without
	 * JavaScript, can be opened in a new tab and is announced to assistive technology through
	 * `aria-sort` on the header. The caller supplies every visible and spoken word.
	 */
	type Props = {
		rows: readonly Row[];
		columns: readonly Column<Row>[];
		/** A stable key per row, so a row keeps its DOM (and focus) when the rows change. */
		rowKey: (row: Row) => string;
		/** Accessible name of the table, shown to everyone but visually hidden. */
		caption: string;
		/** The current order, or `null` when the data is not ordered by a column of this table. */
		sort?: { key: string; direction: 'asc' | 'desc' } | null;
		/** The URL of the table ordered by this column (the caller decides the direction). */
		sortHref?: (key: string) => string;
		/** Spoken name of a sort link, e.g. "Sort by Name". */
		sortLabel?: (header: string) => string;
		/** Shown in place of the rows when there are none. */
		empty: Snippet;
		class?: string;
	};

	let {
		rows,
		columns,
		rowKey,
		caption,
		sort = null,
		sortHref,
		sortLabel = (header) => header,
		empty,
		class: className
	}: Props = $props();

	const ariaSort = (column: Column<Row>) => {
		if (!column.sortable) return undefined;
		if (sort?.key !== column.key) return 'none';
		return sort.direction === 'asc' ? 'ascending' : 'descending';
	};

	const text = (row: Row, column: Column<Row>) =>
		column.value ? column.value(row) : String((row as Record<string, unknown>)[column.key] ?? '');

	const align = (column: Column<Row>) => (column.align === 'end' ? 'text-end' : 'text-start');
</script>

<!-- Focusable so a keyboard user can scroll a table wider than the screen. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	role="region"
	aria-label={caption}
	tabindex="0"
	class={cx('overflow-x-auto rounded-xl border border-line bg-surface', className)}
>
	<table class="w-full border-collapse text-sm">
		<caption class="sr-only">{caption}</caption>
		<thead class="bg-neutral-soft text-xs tracking-wide text-muted uppercase">
			<tr>
				{#each columns as column (column.key)}
					<th
						scope="col"
						aria-sort={ariaSort(column)}
						class={cx('px-4 py-3 font-semibold whitespace-nowrap', align(column))}
					>
						{#if column.sortable && sortHref}
							<!-- The caller passes an already resolved URL. -->
							<!-- eslint-disable svelte/no-navigation-without-resolve -->
							<a
								href={sortHref(column.key)}
								data-sveltekit-reset="false"
								aria-label={sortLabel(column.header)}
								class="inline-flex items-center gap-1 rounded text-inherit hover:text-fg"
							>
								{column.header}
								<span aria-hidden="true">
									{sort?.key === column.key ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
								</span>
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						{:else}
							{column.header}
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-line">
			{#each rows as row (rowKey(row))}
				<tr class="hover:bg-neutral-soft/50">
					{#each columns as column (column.key)}
						<td class={cx('px-4 py-3', align(column), column.align === 'end' && 'tabular-nums')}>
							{#if column.cell}
								{@render column.cell(row)}
							{:else}
								{text(row, column)}
							{/if}
						</td>
					{/each}
				</tr>
			{:else}
				<tr>
					<td colspan={columns.length} class="px-4 py-10 text-center text-muted">
						{@render empty()}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
