<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from './cx';

	type Size = 'narrow' | 'default' | 'wide';
	let {
		size = 'default',
		class: className,
		children
	}: { size?: Size; class?: string; children: Snippet } = $props();

	const sizes: Record<Size, string> = {
		narrow: 'max-w-2xl',
		default: 'max-w-5xl',
		wide: 'max-w-7xl'
	};
</script>

<div class={cx('mx-auto w-full px-4 sm:px-6', sizes[size], className)}>
	{@render children()}
</div>
