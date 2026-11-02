<script lang="ts" generics="V extends string | number">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from '../Field/Field.svelte';
	import type { SelectOption } from '../Select/Select.svelte';
	import { controlClass, mergeIds, type ControlSize } from '../shared/control';
	import { cx } from '../shared/cx';
	import { filterOptions, firstEnabledIndex, moveActive, normalize } from './combobox';

	/**
	 * Editable combobox with a list popup (WAI-ARIA 1.2, "list autocomplete"), single selection.
	 *
	 * Focus never leaves the input: the highlighted option is exposed with `aria-activedescendant`.
	 * Keys: ArrowDown/ArrowUp open and move (wrapping, skipping disabled options), Alt+ArrowDown
	 * opens, Enter picks the highlighted option, Escape closes the list and drops unfinished text,
	 * Tab closes. Escape is stopped only while it closes the list, so a combobox inside a dialog
	 * does not close the dialog, and a second Escape reaches the dialog. Keys pressed while an IME
	 * composition is active are ignored.
	 *
	 * The input never shows something that is not the value: on blur the text commits if it matches
	 * an enabled option's label exactly (ignoring case and accents), otherwise it reverts to the
	 * selected label. Emptying the text clears the value. The popup is placed in the top layer
	 * (see `place`). `value` is `''` while nothing is chosen.
	 *
	 * The English labels are defaults to be overridden for other locales. `class` styles the
	 * wrapper; other attributes go to the `<input>`, except the event handlers this component owns
	 * (`onclick`, `oninput`, `onkeydown`, `onblur`), which are not accepted as props.
	 */
	type Props = {
		label: string;
		options: readonly SelectOption<V>[];
		value?: V | '';
		name?: string;
		hint?: string;
		error?: string;
		hideLabel?: boolean;
		size?: ControlSize;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		ref?: HTMLInputElement | null;
		clearLabel?: string;
		noResultsLabel?: string;
		resultsLabel?: (count: number) => string;
	} & Omit<
		HTMLInputAttributes,
		| 'value'
		| 'type'
		| 'size'
		| 'id'
		| 'required'
		| 'disabled'
		| 'name'
		| 'class'
		| 'role'
		| 'onclick'
		| 'oninput'
		| 'onkeydown'
		| 'onblur'
	>;

	let {
		label,
		options,
		value = $bindable(''),
		name,
		hint,
		error,
		hideLabel = false,
		size = 'md',
		id,
		required = false,
		disabled = false,
		class: className,
		ref = $bindable(null),
		clearLabel = 'Clear',
		noResultsLabel = 'No results',
		resultsLabel = (count: number) => (count === 1 ? '1 result' : `${count} results`),
		'aria-describedby': describedby,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const baseId = $derived(id ?? `combobox-${uid}`);
	const listboxId = $derived(`${baseId}-listbox`);
	const optionId = (index: number) => `${baseId}-option-${index}`;

	const selected = $derived(options.find((option) => option.value === value));
	const selectedLabel = $derived(selected?.label ?? '');

	// Writable derived: follows the selection, but holds what the user types until it changes.
	let text = $derived(selectedLabel);
	let open = $state(false);
	let filtering = $state(false);
	let activeIndex = $state(-1);

	// Right after opening, the whole list is shown; it narrows only once the user types.
	const visible = $derived(filtering ? filterOptions(options, text) : options);
	const expanded = $derived(open && visible.length > 0);
	const noResults = $derived(open && visible.length === 0);
	const announcement = $derived(
		open ? (visible.length > 0 ? resultsLabel(visible.length) : noResultsLabel) : ''
	);

	function openList() {
		if (open || disabled) return;
		open = true;
		const current = options.findIndex((option) => option.value === value);
		activeIndex = current === -1 ? -1 : current;
	}

	function closeList() {
		open = false;
		filtering = false;
		activeIndex = -1;
	}

	function choose(option: SelectOption<V>) {
		if (option.disabled) return;
		value = option.value;
		text = option.label;
		closeList();
	}

	function clear() {
		value = '';
		text = '';
		closeList();
		ref?.focus();
	}

	function oninput(event: Event & { currentTarget: HTMLInputElement }) {
		text = event.currentTarget.value;
		filtering = true;
		open = true;
		// A cleared field means "no value"; otherwise the old value would hide behind empty text.
		if (text === '') value = '';
		activeIndex = firstEnabledIndex(visible);
	}

	function onkeydown(event: KeyboardEvent) {
		// Enter or arrows that belong to an IME composition must not pick or move anything.
		if (event.isComposing || event.keyCode === 229) return;
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp': {
				event.preventDefault();
				const direction = event.key === 'ArrowDown' ? 1 : -1;
				if (!open) {
					openList();
					if (activeIndex !== -1 || event.altKey) return;
				}
				activeIndex = moveActive(visible, activeIndex, direction);
				break;
			}
			case 'Enter':
				if (expanded && activeIndex !== -1) {
					event.preventDefault();
					choose(visible[activeIndex]);
				}
				break;
			case 'Escape':
				// Only while it closes the list; otherwise Escape belongs to whatever surrounds us.
				if (open) {
					event.preventDefault();
					event.stopPropagation();
					closeList();
					text = selectedLabel;
				}
				break;
			case 'Tab':
				closeList();
				break;
		}
	}

	function onblur() {
		const typed = normalize(text.trim());
		const exact = typed
			? options.find((option) => !option.disabled && normalize(option.label) === typed)
			: undefined;
		if (exact) choose(exact);
		else {
			closeList();
			text = selectedLabel;
		}
	}

	// The popup lives in the top layer (Popover API), so no ancestor's `overflow` or `z-index`
	// (a dialog body, a scrolling table) can clip or cover it; it is placed from the input's rect.
	let popup = $state<HTMLElement>();
	let popupStyle = $state('');

	function place() {
		if (!ref) return;
		const rect = ref.getBoundingClientRect();
		const gap = 4;
		const margin = 8;
		// The visual viewport shrinks under a soft keyboard; the layout viewport does not.
		const viewport = window.visualViewport;
		const top = viewport?.offsetTop ?? 0;
		const bottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
		const below = bottom - rect.bottom - gap - margin;
		const above = rect.top - top - gap - margin;
		const flip = below < 160 && above > below;
		const maxHeight = Math.max(96, Math.min(240, flip ? above : below));
		const vertical = flip
			? `bottom:${window.innerHeight - rect.top + gap}px;`
			: `top:${rect.bottom + gap}px;`;
		popupStyle = `left:${rect.left}px;width:${rect.width}px;max-height:${maxHeight}px;${vertical}`;
	}

	$effect(() => {
		if (!popup) return;
		popup.showPopover();
		place();
		// Capture: also catches scrolling inside any ancestor, e.g. the body of a dialog.
		window.addEventListener('scroll', place, true);
		window.addEventListener('resize', place);
		// A dialog animates in with a transform, so the first measurement is slightly off.
		const host = ref?.closest('dialog');
		host?.addEventListener('animationend', place);
		window.visualViewport?.addEventListener('resize', place);
		window.visualViewport?.addEventListener('scroll', place);
		// Observation honors ancestors' clipping: close when the input scrolls out of its container.
		const observer = new IntersectionObserver(([entry]) => {
			if (entry && !entry.isIntersecting) closeList();
		});
		if (ref) observer.observe(ref);
		return () => {
			window.removeEventListener('scroll', place, true);
			window.removeEventListener('resize', place);
			host?.removeEventListener('animationend', place);
			window.visualViewport?.removeEventListener('resize', place);
			window.visualViewport?.removeEventListener('scroll', place);
			observer.disconnect();
		};
	});

	$effect(() => {
		if (expanded && activeIndex !== -1) {
			document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
		}
	});
</script>

<Field {label} id={baseId} {hint} {error} {required} {hideLabel} class={className}>
	{#snippet children(control)}
		<div class="relative">
			<input
				{...rest}
				bind:this={ref}
				type="text"
				role="combobox"
				id={control.id}
				{disabled}
				required={control.required}
				value={text}
				autocomplete="off"
				aria-autocomplete="list"
				aria-expanded={expanded}
				aria-controls={listboxId}
				aria-activedescendant={expanded && activeIndex !== -1 ? optionId(activeIndex) : undefined}
				aria-invalid={control.invalid || undefined}
				aria-describedby={mergeIds(control.describedby, describedby)}
				class={cx(
					controlClass(control.invalid, size),
					'ps-3 pe-16 placeholder:text-muted disabled:opacity-50'
				)}
				onclick={openList}
				{oninput}
				{onkeydown}
				{onblur}
			/>
			{#if name}<input type="hidden" {name} value={selected ? value : ''} />{/if}
			{#if text !== '' && !disabled}
				<!-- Out of the tab order and mousedown-safe: focus stays in the input. -->
				<button
					type="button"
					tabindex="-1"
					aria-label={clearLabel}
					class="absolute end-8 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-neutral-soft hover:text-fg"
					onmousedown={(event) => event.preventDefault()}
					onclick={clear}
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
			<svg
				class={cx(
					'pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted transition-transform motion-reduce:transition-none',
					disabled && 'opacity-50',
					expanded && 'rotate-180'
				)}
				viewBox="0 0 20 20"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="m5 8 5 5 5-5" />
			</svg>

			{#if expanded || noResults}
				<!-- Keeps focus in the input when the list or its scrollbar is pressed (not an interactive control). -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					bind:this={popup}
					popover="manual"
					style={popupStyle}
					onmousedown={(event) => event.preventDefault()}
					class="popover-open:flex fixed inset-auto m-0 flex-col overflow-hidden rounded-lg border border-line bg-raised p-0 text-fg shadow-lg"
				>
					{#if expanded}
						<ul id={listboxId} role="listbox" aria-label={label} class="overflow-auto p-1">
							{#each visible as option, index (option.value)}
								<!-- Options are driven from the input by keyboard; the mouse is an extra. -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<li
									id={optionId(index)}
									role="option"
									aria-selected={option.value === value}
									aria-disabled={option.disabled || undefined}
									class={cx(
										'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm',
										option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
										index === activeIndex && 'bg-neutral-soft',
										option.value === value && 'font-semibold'
									)}
									onmousemove={() => !option.disabled && (activeIndex = index)}
									onclick={() => choose(option)}
								>
									<span>{option.label}</span>
									{#if option.value === value}
										<svg
											class="size-4 shrink-0 text-primary"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											aria-hidden="true"
										>
											<path d="m5 12 5 5L20 7" />
										</svg>
									{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="px-3 py-2 text-sm text-muted">{noResultsLabel}</p>
					{/if}
				</div>
			{/if}
		</div>
		<!-- Announces the result count to screen readers without moving focus. -->
		<div class="sr-only" role="status" aria-live="polite">{announcement}</div>
	{/snippet}
</Field>
