<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cx } from './cx';

	type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
	/**
	 * Non-interactive status label. Let the text carry the meaning ("Failed", not just a red pill);
	 * `label` adds a screen-reader-only prefix when the text alone is ambiguous ("Status: ").
	 * Do not wrap it in a link or button: it is too small for a touch target.
	 */
	type Props = {
		tone?: Tone;
		dot?: boolean;
		label?: string;
		class?: string;
		children: Snippet;
	} & Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'class'>;

	let {
		tone = 'neutral',
		dot = false,
		label,
		class: className,
		children,
		...rest
	}: Props = $props();

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
		tones[tone],
		className
	)}
	{...rest}
>
	{#if dot}
		<span class="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true"></span>
	{/if}
	{#if label}<span class="sr-only">{label}</span>{/if}
	{@render children()}
</span>
