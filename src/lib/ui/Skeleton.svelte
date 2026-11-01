<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cx } from './cx';

	type Radius = 'sm' | 'md' | 'lg' | 'xl' | 'full';
	/**
	 * Loading placeholder, decorative (`aria-hidden`), so it cannot announce loading by itself:
	 * mark the loading region `aria-busy="true"` and render one `role="status"` "Loading…"
	 * (`sr-only`) per region, not per skeleton.
	 *
	 * Size comes from `class` (`h-4 w-40`); give call sites the real dimensions of the content
	 * (fixed heights, `aspect-video`) or the swap will still shift the layout. `radius` should match
	 * the element being replaced; it is a prop because a `rounded-*` class would not reliably beat
	 * the default. It is a `span` so it stays valid inside `p`, `a`, `button` and headings.
	 */
	let {
		radius = 'md',
		class: className,
		...rest
	}: { radius?: Radius; class?: string } & Omit<
		HTMLAttributes<HTMLSpanElement>,
		'class'
	> = $props();

	const radii: Record<Radius, string> = {
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		xl: 'rounded-xl',
		full: 'rounded-full'
	};
</script>

<span
	aria-hidden="true"
	class={cx(
		'block animate-pulse bg-neutral-soft motion-reduce:animate-none',
		// Forced-colors mode drops background colors, which would make the placeholder vanish.
		'forced-colors:border forced-colors:border-[CanvasText]',
		radii[radius],
		className
	)}
	{...rest}
></span>
