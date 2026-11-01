<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';
	import Heading from './Heading.svelte';
	import { cx } from './cx';

	type Size = 'sm' | 'md' | 'lg';
	/**
	 * Modal dialog on the native `<dialog>` + `showModal()`: the browser provides the top layer,
	 * the inert page behind it, the focus trap and focus return to the opener, and Escape.
	 * This component adds the rest of the contract: a required title wired with `aria-labelledby`
	 * (and an optional description with `aria-describedby`), backdrop click, a close button,
	 * `dismissible={false}` for flows that must end with an explicit choice (no Escape, no
	 * backdrop click and no close button: only the footer actions close it), and scroll lock
	 * (see `app.css`).
	 *
	 * Bind `open` to show it. Initial focus goes to the first focusable element, or to the one
	 * marked `autofocus`: for a destructive confirmation, put `autofocus` on the safe button.
	 * The close button is last in the DOM (positioned in the corner) so that initial focus lands
	 * on the content, not on it. The `footer` snippet receives a `close` function. Content is
	 * mounted only while open, so there is no exit animation; adding one later means keeping it
	 * mounted. Escape inside a Combobox closes only its popup, not the dialog. For a destructive
	 * confirmation pass `role="alertdialog"`. If the component is destroyed while open it closes
	 * the dialog first, so `onclose` and focus return still happen.
	 *
	 * `closedby` (Chrome, Firefox) is what makes Escape and the backdrop inert when not
	 * dismissible; browsers without it fall back to cancelling the `cancel` event, which covers
	 * Escape but not an Android back gesture. Handlers for `click`, `mousedown` and `cancel` are
	 * owned by this component and are not accepted as props.
	 */
	type Props = {
		open?: boolean;
		title: string;
		description?: string;
		size?: Size;
		/** `false`: only the footer actions can close it (no Escape, backdrop click or close button). */
		dismissible?: boolean;
		closeLabel?: string;
		class?: string;
		onclose?: () => void;
		children?: Snippet;
		footer?: Snippet<[close: () => void]>;
	} & Omit<
		HTMLDialogAttributes,
		| 'open'
		| 'title'
		| 'class'
		| 'children'
		| 'onclose'
		| 'onclick'
		| 'onmousedown'
		| 'oncancel'
		| 'closedby'
		| 'aria-labelledby'
		| 'aria-describedby'
	>;

	let {
		open = $bindable(false),
		title,
		description,
		size = 'md',
		dismissible = true,
		closeLabel = 'Close',
		class: className,
		onclose,
		children,
		footer,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const titleId = `dialog-title-${uid}`;
	const descriptionId = `dialog-description-${uid}`;

	const sizes: Record<Size, string> = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl'
	};

	let element = $state<HTMLDialogElement>();

	$effect(() => {
		if (!element) return;
		if (open && !element.open) element.showModal();
		else if (!open && element.open) element.close();
	});

	// Destroyed while open (a route change): close first, so `onclose` and focus return still run.
	$effect(() => () => {
		if (element?.open) element.close();
	});

	function close() {
		open = false;
	}

	// The native `close` event fires for Escape and for programmatic closing alike.
	function handleClose() {
		open = false;
		onclose?.();
	}

	// `closedby="none"` is the real switch: Chrome overrides a prevented `cancel` on a second
	// Escape, so this handler is only the fallback for browsers without `closedby`.
	function handleCancel(event: Event) {
		if (!dismissible) event.preventDefault();
	}

	// Only a press that started on the backdrop closes: selecting text inside and releasing
	// outside must not dismiss the dialog.
	let pressedOnBackdrop = false;
</script>

<!-- A backdrop click is a mouse extra; Escape and the close button are the keyboard paths. -->
<dialog
	{...rest}
	bind:this={element}
	aria-labelledby={titleId}
	aria-describedby={description ? descriptionId : undefined}
	closedby={dismissible ? 'closerequest' : 'none'}
	class={cx(
		'm-auto w-[calc(100%-2rem)] rounded-xl border border-line bg-raised p-0 text-fg shadow-xl',
		'backdrop:bg-black/50 backdrop:backdrop-blur-xs',
		sizes[size],
		className
	)}
	onclose={handleClose}
	oncancel={handleCancel}
	onmousedown={(event) => (pressedOnBackdrop = event.target === element)}
	onclick={(event) => {
		if (dismissible && pressedOnBackdrop && event.target === element) close();
	}}
>
	{#if open}
		<div class="flex max-h-[85dvh] flex-col">
			<header class="border-b border-line p-4 pe-14 sm:ps-6">
				<Heading level={2} size={3} id={titleId}>{title}</Heading>
			</header>
			<div class="overflow-y-auto p-4 sm:p-6">
				{#if description}
					<p id={descriptionId} class="mb-4 text-sm text-muted">
						{description}
					</p>
				{/if}
				{@render children?.()}
			</div>
			{#if footer}
				<footer class="flex flex-wrap justify-end gap-3 border-t border-line p-4 sm:px-6">
					{@render footer(close)}
				</footer>
			{/if}
			<!-- Last in the DOM so initial focus lands on the content or the footer, not on Close. -->
			{#if dismissible}
				<button
					type="button"
					class="absolute end-2 top-2 grid size-10 place-items-center rounded-md text-muted transition-colors hover:bg-neutral-soft hover:text-fg"
					aria-label={closeLabel}
					onclick={close}
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
			{/if}
		</div>
	{/if}
</dialog>
