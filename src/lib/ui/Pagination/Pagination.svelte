<script lang="ts">
	import { cx } from '../shared/cx';
	import { pageItems } from './pagination';

	/**
	 * Page links, not buttons: every page has its own URL, so the pages can be indexed, opened in a
	 * new tab and shared. The caller builds the URLs (`href`) and supplies every visible and
	 * spoken word, so the component knows nothing about routing or language.
	 */
	type Props = {
		/** The current page, 1-based. */
		page: number;
		pages: number;
		/** The URL of a page. */
		href: (page: number) => string;
		/** Accessible name of the navigation landmark, e.g. "Pages". */
		label: string;
		previousLabel: string;
		nextLabel: string;
		/** Spoken name of a page link, e.g. "Page 3". */
		pageLabel: (page: number) => string;
		class?: string;
	};

	let {
		page,
		pages,
		href,
		label,
		previousLabel,
		nextLabel,
		pageLabel,
		class: className
	}: Props = $props();

	const items = $derived(pageItems(page, pages));

	const base =
		'inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors';
	const link = `${base} text-fg hover:bg-neutral-soft`;
	const current = `${base} bg-primary text-on-primary`;
	const disabled = `${base} text-muted opacity-50`;
</script>

{#if pages > 1}
	<!-- Callers pass already resolved URLs; resolving here would tie the primitive to routing. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<nav aria-label={label} class={cx('w-full', className)}>
		<ul class="flex flex-wrap items-center justify-center gap-1">
			<li>
				{#if page > 1}
					<a href={href(page - 1)} rel="prev" class={link}>
						<span aria-hidden="true">‹</span>
						<span class="sr-only">{previousLabel}</span>
					</a>
				{:else}
					<span class={disabled} aria-disabled="true">
						<span aria-hidden="true">‹</span>
						<span class="sr-only">{previousLabel}</span>
					</span>
				{/if}
			</li>
			{#each items as item, index (item === 'gap' ? `gap-${index}` : item)}
				<li>
					{#if item === 'gap'}
						<span class={cx(base, 'text-muted')} aria-hidden="true">…</span>
					{:else if item === page}
						<a href={href(item)} class={current} aria-current="page" aria-label={pageLabel(item)}
							>{item}</a
						>
					{:else}
						<a href={href(item)} class={link} aria-label={pageLabel(item)}>{item}</a>
					{/if}
				</li>
			{/each}
			<li>
				{#if page < pages}
					<a href={href(page + 1)} rel="next" class={link}>
						<span aria-hidden="true">›</span>
						<span class="sr-only">{nextLabel}</span>
					</a>
				{:else}
					<span class={disabled} aria-disabled="true">
						<span aria-hidden="true">›</span>
						<span class="sr-only">{nextLabel}</span>
					</span>
				{/if}
			</li>
		</ul>
	</nav>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/if}
