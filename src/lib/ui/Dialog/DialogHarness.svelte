<script lang="ts">
	import Combobox from '../Combobox/Combobox.svelte';
	import Dialog from './Dialog.svelte';

	/** Test-only: an opener button plus a dialog, with hooks the test can pull on. */
	type Props = {
		dismissible?: boolean;
		role?: 'dialog' | 'alertdialog';
		withInput?: boolean;
		withCombobox?: boolean;
		onclose?: () => void;
		onready?: (controls: { open: () => void; remove: () => void }) => void;
	};
	let {
		dismissible = true,
		role,
		withInput = false,
		withCombobox = false,
		onclose,
		onready
	}: Props = $props();

	const options = [
		{ value: 'a', label: 'Alpha' },
		{ value: 'b', label: 'Beta' }
	];

	let open = $state(false);
	let mounted = $state(true);

	// svelte-ignore state_referenced_locally
	onready?.({
		open: () => (open = true),
		remove: () => (mounted = false)
	});
</script>

<button type="button" onclick={() => (open = true)}>Open</button>

{#if mounted}
	<Dialog
		bind:open
		title="Confirm"
		description="Are you sure?"
		closeLabel="Close dialog"
		{dismissible}
		{role}
		{onclose}
	>
		<p>Body text</p>
		{#if withInput}<input aria-label="Name" />{/if}
		{#if withCombobox}<Combobox label="Letter" {options} />{/if}
		{#snippet footer(close)}
			<button type="button" onclick={close}>Done</button>
			<!-- svelte-ignore a11y_autofocus -->
			<button type="button" autofocus>Safe</button>
		{/snippet}
	</Dialog>
{/if}
