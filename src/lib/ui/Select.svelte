<script lang="ts" module>
	export type SelectOption<V extends string | number = string | number> = {
		value: V;
		label: string;
		disabled?: boolean;
	};
</script>

<script lang="ts" generics="V extends string | number">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Field from './Field.svelte';
	import { controlClass, mergeIds, type ControlSize } from './control';

	/**
	 * Native `<select>`: `class` styles the wrapper, other attributes go to the control.
	 * `value` is `''` while nothing is chosen. Without `placeholder` an empty select shows nothing
	 * selected, so offer either a `placeholder` or an explicit option such as "All".
	 */
	type Props = {
		label: string;
		options: readonly SelectOption<V>[];
		value?: V | '';
		placeholder?: string;
		hint?: string;
		error?: string;
		hideLabel?: boolean;
		size?: ControlSize;
		id?: string;
		required?: boolean;
		class?: string;
		ref?: HTMLSelectElement | null;
	} & Omit<HTMLSelectAttributes, 'value' | 'size' | 'id' | 'required' | 'class'>;

	let {
		label,
		options,
		value = $bindable(''),
		placeholder,
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
		<!-- The chevron sits outside the <select>, so dimming lives on the wrapper. -->
		<div class="relative has-[:disabled]:opacity-50">
			<select
				{...rest}
				bind:this={ref}
				bind:value
				id={control.id}
				required={control.required}
				aria-invalid={control.invalid || undefined}
				aria-describedby={mergeIds(control.describedby, describedby)}
				class={[controlClass(control.invalid, size), 'appearance-none ps-3 pe-9']}
			>
				{#if placeholder}
					<option value="" disabled hidden>{placeholder}</option>
				{/if}
				{#each options as option (option.value)}
					<option value={option.value} disabled={option.disabled}>{option.label}</option>
				{/each}
			</select>
			<svg
				class="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted"
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
		</div>
	{/snippet}
</Field>
