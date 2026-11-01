<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from './cx';

	type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
	let {
		tone = 'neutral',
		dot = false,
		children
	}: { tone?: Tone; dot?: boolean; children: Snippet } = $props();

	const tones: Record<Tone, string> = {
		neutral: 'bg-neutral-soft text-fg',
		success: 'bg-success-soft text-success',
		warning: 'bg-warning-soft text-warning',
		danger: 'bg-danger-soft text-danger',
		info: 'bg-info-soft text-info'
	};
</script>

<span
	class={cx(
		'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
		'ring-1 ring-current/20 ring-inset',
		tones[tone]
	)}
>
	{#if dot}
		<span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
	{/if}
	{@render children()}
</span>
