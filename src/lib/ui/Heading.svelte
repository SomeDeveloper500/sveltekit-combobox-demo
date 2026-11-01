<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cx } from './cx';

	type Level = 1 | 2 | 3 | 4;
	/**
	 * `level` is the semantic heading, `size` the visual one: they are decoupled on purpose.
	 * Color is inherited from the page (no `text-fg` here), so `class="text-muted"` just works.
	 */
	type Props = {
		level: Level;
		size?: Level;
		class?: string;
		children: Snippet;
	} & Omit<HTMLAttributes<HTMLHeadingElement>, 'children' | 'class'>;

	let { level, size = level, class: className, children, ...rest }: Props = $props();

	const sizes: Record<Level, string> = {
		1: 'text-4xl font-extrabold tracking-tight sm:text-5xl',
		2: 'text-2xl font-bold tracking-tight sm:text-3xl',
		3: 'text-xl font-semibold tracking-tight',
		4: 'text-base font-semibold'
	};
</script>

<svelte:element this={`h${level}`} class={cx(sizes[size], 'break-words', className)} {...rest}>
	{@render children()}
</svelte:element>
