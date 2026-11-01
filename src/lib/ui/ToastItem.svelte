<script lang="ts">
	import { fly } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { Toast, ToastTone } from './toast.svelte';
	import { cx } from './cx';

	type Props = { toast: Toast; dismissLabel: string; ondismiss: () => void };
	let { toast, dismissLabel, ondismiss }: Props = $props();

	const tones: Record<ToastTone, string> = {
		info: 'border-s-info text-info',
		success: 'border-s-success text-success',
		warning: 'border-s-warning text-warning',
		danger: 'border-s-danger text-danger'
	};
	const icons: Record<ToastTone, string> = {
		info: 'M12 16v-4M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
		success: 'm9 12 2 2 4-4M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
		warning:
			'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
		danger: 'm15 9-6 6M9 9l6 6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z'
	};

	// Hover or keyboard focus pauses the countdown, so the message can be read at any pace (WCAG 2.2.1).
	let paused = $state(false);
	let remaining: number | undefined;

	$effect(() => {
		if (!toast.duration || paused) return;
		const startedAt = Date.now();
		remaining ??= toast.duration;
		const left = remaining;
		const timer = setTimeout(ondismiss, left);
		return () => {
			clearTimeout(timer);
			remaining = left - (Date.now() - startedAt);
		};
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<li
	class={cx(
		'pointer-events-auto flex items-start gap-3 rounded-xl border border-s-4 border-line bg-raised p-4 shadow-lg',
		tones[toast.tone]
	)}
	transition:fly={{ y: 16, duration: prefersReducedMotion.current ? 0 : 200 }}
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
	onfocusin={() => (paused = true)}
	onfocusout={() => (paused = false)}
	onkeydown={(event) => event.key === 'Escape' && ondismiss()}
>
	<svg
		class="mt-0.5 size-5 shrink-0"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d={icons[toast.tone]} />
	</svg>
	<div class="min-w-0 flex-1 text-sm text-fg">
		{#if toast.title}<p class="font-semibold">{toast.title}</p>{/if}
		<p class={cx(toast.title && 'text-muted')}>{toast.message}</p>
	</div>
	<button
		type="button"
		class="-m-1 grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-neutral-soft hover:text-fg"
		aria-label={dismissLabel}
		onclick={ondismiss}
	>
		<svg
			class="size-4"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			aria-hidden="true"
		>
			<path d="M18 6 6 18M6 6l12 12" />
		</svg>
	</button>
</li>
