<script lang="ts">
	import { cx } from '../shared/cx';

	export type Crumb = { label: string; href: string };

	/**
	 * The path to the current page. The last item is the page itself: shown as text with
	 * `aria-current="page"`, not as a link. The caller supplies the accessible name and the URLs.
	 */
	type Props = {
		items: readonly Crumb[];
		/** Accessible name of the navigation landmark, e.g. "Breadcrumbs". */
		label: string;
		class?: string;
	};

	let { items, label, class: className }: Props = $props();
</script>

<!-- Callers pass already resolved URLs; resolving here would tie the primitive to routing. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<nav aria-label={label} class={className}>
	<ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
		{#each items as item, index (item.href)}
			{@const last = index === items.length - 1}
			<li class="flex items-center gap-2">
				{#if last}
					<span aria-current="page" class="font-medium text-fg">{item.label}</span>
				{:else}
					<a
						href={item.href}
						class={cx('rounded underline-offset-4 hover:text-fg hover:underline')}
					>
						{item.label}
					</a>
					<span aria-hidden="true">/</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
