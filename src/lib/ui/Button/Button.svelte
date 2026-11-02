<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cx } from '../shared/cx';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';
	type Base = {
		variant?: Variant;
		size?: Size;
		/** Shows a spinner without changing the button width and keeps keyboard focus on it. */
		loading?: boolean;
		/** Announced to screen readers while `loading`. */
		loadingLabel?: string;
		/** `class` is for layout (margin, width); it does not reliably override the variant styles. */
		class?: string;
		ref?: HTMLElement | null;
		children: Snippet;
	};
	type ButtonProps = Base & { href?: undefined } & Omit<HTMLButtonAttributes, 'children' | 'class'>;
	type LinkProps = Base & {
		href: string;
		disabled?: boolean;
	} & Omit<HTMLAnchorAttributes, 'children' | 'class' | 'type' | 'href'>;
	type Props = ButtonProps | LinkProps;

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		loadingLabel = 'Loading…',
		href,
		disabled = false,
		onclick,
		class: className,
		ref = $bindable(null),
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
	// A loading or disabled control must not react to the mouse at all (no hover, no press).
	const inert = $derived(loading || disabled);
	const classes = $derived(
		cx(
			'relative inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap',
			'transition-[color,background-color,border-color,box-shadow,transform] duration-150',
			'active:translate-y-px',
			variants[variant],
			sizes[size],
			disabled && 'opacity-50 shadow-none',
			inert && 'pointer-events-none',
			className
		)
	);

	// aria-disabled (unlike `disabled`) keeps focus on a loading button, so the click is swallowed here.
	function handleClick(event: MouseEvent) {
		if (loading) {
			event.preventDefault();
			return;
		}
		(onclick as ((event: MouseEvent) => void) | undefined)?.(event);
	}
</script>

{#snippet content()}
	<span class={cx('inline-flex items-center justify-center gap-2', loading && 'invisible')}>
		{@render children()}
	</span>
	{#if loading}
		<span
			class="absolute size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
			aria-hidden="true"
		></span>
		<span class="sr-only">{loadingLabel}</span>
	{/if}
{/snippet}

{#if href}
	<!-- Callers pass an already resolved href; resolving here would tie the primitive to routing. -->
	<!-- A link cannot be `disabled`, so it is made inert by hand: no href, aria-disabled, out of tab order. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		bind:this={ref}
		href={inert ? undefined : href}
		role={inert ? 'link' : undefined}
		aria-disabled={inert || undefined}
		tabindex={inert ? -1 : undefined}
		class={classes}
		onclick={handleClick}
		{...rest as HTMLAnchorAttributes}
	>
		{@render content()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button
		bind:this={ref}
		type="button"
		class={classes}
		{disabled}
		aria-disabled={loading || undefined}
		onclick={handleClick}
		{...rest as HTMLButtonAttributes}
	>
		{@render content()}
	</button>
{/if}
