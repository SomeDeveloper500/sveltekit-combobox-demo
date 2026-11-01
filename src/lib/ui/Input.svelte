<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from './Field.svelte';
	import { controlClass, mergeIds, type ControlSize } from './control';

	/**
	 * Text-like input bound to a string. `class` styles the wrapper; every other attribute
	 * (`name`, `autocomplete`, `inputmode`, ...) goes to the `<input>`. Numbers, files, checkboxes
	 * and radios need their own components.
	 */
	type Props = {
		label: string;
		value?: string;
		type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
		hint?: string;
		error?: string;
		hideLabel?: boolean;
		size?: ControlSize;
		id?: string;
		required?: boolean;
		class?: string;
		ref?: HTMLInputElement | null;
	} & Omit<HTMLInputAttributes, 'value' | 'type' | 'size' | 'id' | 'required' | 'class'>;

	let {
		label,
		value = $bindable(''),
		type = 'text',
		hint,
		error,
		hideLabel = false,
		size = 'md',
		id,
		required = false,
		class: className,
		ref = $bindable(null),
		'aria-describedby': describedby,
		...rest
	}: Props = $props();
</script>

<Field {label} {id} {hint} {error} {required} {hideLabel} class={className}>
	{#snippet children(control)}
		<input
			{...rest}
			bind:this={ref}
			bind:value
			{type}
			id={control.id}
			required={control.required}
			aria-invalid={control.invalid || undefined}
			aria-describedby={mergeIds(control.describedby, describedby)}
			class={[
				controlClass(control.invalid, size),
				'px-3 placeholder:text-muted disabled:opacity-50'
			]}
		/>
	{/snippet}
</Field>
