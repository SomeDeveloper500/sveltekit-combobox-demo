<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cx } from './cx';

	type Padding = 'none' | 'sm' | 'md' | 'lg';
	type Props = {
		as?: 'div' | 'article' | 'section' | 'li';
		padding?: Padding;
		/** Lifts the card on hover; use when the whole card is a click target. */
		interactive?: boolean;
		class?: string;
		children: Snippet;
	} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'class'>;

	let {
		as = 'div',
		padding = 'md',
		interactive = false,
		class: className,
		children,
		...rest
	}: Props = $props();

	const paddings: Record<Padding, string> = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};
</script>

<svelte:element
	this={as}
	class={cx(
		'rounded-xl border border-line bg-raised shadow-card',
		interactive &&
			'transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md',
		paddings[padding],
		className
	)}
	{...rest}
>
	{@render children()}
</svelte:element>
