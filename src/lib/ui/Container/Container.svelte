<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cx } from '../shared/cx';

	type Size = 'narrow' | 'default' | 'wide';
	type Props = {
		as?: 'div' | 'main' | 'section' | 'header' | 'footer' | 'nav';
		size?: Size;
		class?: string;
		children: Snippet;
	} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'class'>;

	let { as = 'div', size = 'default', class: className, children, ...rest }: Props = $props();

	const sizes: Record<Size, string> = {
		narrow: 'max-w-2xl',
		default: 'max-w-5xl',
		wide: 'max-w-7xl'
	};
</script>

<svelte:element
	this={as}
	class={cx('mx-auto w-full px-4 sm:px-6 lg:px-8', sizes[size], className)}
	{...rest}
>
	{@render children()}
</svelte:element>
