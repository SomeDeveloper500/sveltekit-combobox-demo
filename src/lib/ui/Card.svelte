<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cx } from './cx';

	type Padding = 'none' | 'sm' | 'md' | 'lg';
	/**
	 * `as="section"` is a landmark only with an accessible name (`aria-labelledby`); `as="li"`
	 * expects a `ul`/`ol` parent. `padding="none"` clips children to the rounded corners, which
	 * suits full-bleed media but also clips anything that overflows the card.
	 *
	 * `interactive` is the stretched-link pattern: put a real link inside the card and stretch it
	 * over the card with `after:absolute after:inset-0`. The card then lifts on hover and shows a
	 * focus outline when that link has keyboard focus. Never attach `onclick` to the card itself.
	 */
	type Props = {
		as?: 'div' | 'article' | 'section' | 'li';
		padding?: Padding;
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
		none: 'overflow-hidden',
		sm: 'p-4',
		md: 'p-4 sm:p-6',
		lg: 'p-5 sm:p-8'
	};
</script>

<svelte:element
	this={as}
	class={cx(
		'rounded-xl border border-line bg-raised shadow-card',
		interactive &&
			[
				'relative transition-[border-color,box-shadow,transform] duration-150',
				'hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md',
				'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
				'motion-reduce:transition-none motion-reduce:hover:translate-y-0'
			].join(' '),
		paddings[padding],
		className
	)}
	{...rest}
>
	{@render children()}
</svelte:element>
