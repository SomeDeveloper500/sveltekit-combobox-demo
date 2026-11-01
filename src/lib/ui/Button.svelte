<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cx } from './cx';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';
	type Props = {
		variant?: Variant;
		size?: Size;
		loading?: boolean;
		href?: string;
		class?: string;
		children: Snippet;
	} & Omit<HTMLButtonAttributes, 'children' | 'class'> &
		Omit<HTMLAnchorAttributes, 'children' | 'class' | 'type'>;

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		href,
		disabled,
		class: className,
		children,
		...rest
	}: Props = $props();

	const variants: Record<Variant, string> = {
		primary: 'bg-primary text-on-primary shadow-xs hover:bg-primary-hover',
		secondary:
			'border border-line-strong bg-raised text-fg shadow-xs hover:border-fg-muted hover:bg-surface',
		ghost: 'text-fg hover:bg-neutral-soft',
		danger: 'bg-danger text-on-danger shadow-xs hover:bg-danger-hover'
	};
	const sizes: Record<Size, string> = {
		sm: 'min-h-8 px-3 text-sm',
		md: 'min-h-10 px-4 text-sm',
		lg: 'min-h-12 px-6 text-base'
	};
	const classes = $derived(
		cx(
			'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap',
			'transition-[color,background-color,border-color,box-shadow,transform] duration-150',
			'active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
			variants[variant],
			sizes[size],
			className
		)
	);
</script>

{#if href}
	<!-- Callers pass an already resolved href; resolving here would tie the primitive to routing. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a {href} class={classes} {...rest as HTMLAnchorAttributes}>{@render children()}</a>
{:else}
	<button
		type="button"
		class={classes}
		aria-busy={loading || undefined}
		disabled={loading || disabled}
		{...rest as HTMLButtonAttributes}
	>
		{#if loading}
			<span
				class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
				aria-hidden="true"
			></span>
		{/if}
		{@render children()}
	</button>
{/if}
