<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from './cx';
	import { mergeIds } from './control';

	type ControlProps = {
		id: string;
		describedby: string | undefined;
		invalid: boolean;
		required: boolean;
	};
	/**
	 * Label, hint and error around one form control. The control is rendered by the `children`
	 * snippet, which receives what it must put on the real element: `id`, `describedby`,
	 * `invalid` and `required` (the single source for the asterisk and the control).
	 *
	 * Conventions: a form that uses these fields needs `novalidate` (the native validation bubble
	 * would compete with the inline errors) and a "* required" note near the submit button.
	 * Groups of controls (radio, checkbox, date parts) need a fieldset/legend, not this component.
	 */
	type Props = {
		label: string;
		id?: string;
		hint?: string;
		error?: string;
		required?: boolean;
		hideLabel?: boolean;
		class?: string;
		children: Snippet<[ControlProps]>;
	};

	let {
		label,
		id,
		hint,
		error,
		required = false,
		hideLabel = false,
		class: className,
		children
	}: Props = $props();

	const uid = $props.id();
	const controlId = $derived(id ?? `field-${uid}`);
	// Error first: screen readers read the more urgent text before the hint.
	const describedby = $derived(
		mergeIds(error && `${controlId}-error`, hint && `${controlId}-hint`)
	);
</script>

<div class={cx('flex flex-col gap-1.5', className)}>
	<label for={controlId} class={cx('text-sm font-medium', hideLabel && 'sr-only')}>
		{label}
		{#if required}<span class="text-danger" aria-hidden="true">*</span>{/if}
	</label>
	{@render children({ id: controlId, describedby, invalid: Boolean(error), required })}
	{#if hint}<p id="{controlId}-hint" class="text-xs text-muted">{hint}</p>{/if}
	<!-- role="alert" announces an error that appears after submit, when the control is not focused -->
	{#if error}
		<p id="{controlId}-error" role="alert" class="text-xs font-medium text-danger">{error}</p>
	{/if}
</div>
