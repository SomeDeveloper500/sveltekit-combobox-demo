<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from './cx';

	type Level = 1 | 2 | 3 | 4;
	/** `level` is the semantic heading, `size` the visual one: they are decoupled on purpose. */
	let {
		level,
		size = level,
		id,
		class: className,
		children
	}: { level: Level; size?: Level; id?: string; class?: string; children: Snippet } = $props();

	const sizes: Record<Level, string> = {
		1: 'text-4xl font-extrabold tracking-tight sm:text-5xl',
		2: 'text-2xl font-bold tracking-tight sm:text-3xl',
		3: 'text-xl font-semibold tracking-tight',
		4: 'text-base font-semibold'
	};
</script>

<svelte:element this={`h${level}`} {id} class={cx(sizes[size], 'text-fg', className)}>
	{@render children()}
</svelte:element>
