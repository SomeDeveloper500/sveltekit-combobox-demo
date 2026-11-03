<script lang="ts">
	import { goto } from '$app/navigation';
	import { allowedTransitions, isIrreversible } from '#lib/domain/item-status.js';
	import { getI18n } from '#lib/i18n/context.js';
	import { localizePath } from '#lib/i18n/locale.js';
	import type { ItemStatus } from '#lib/schemas/item.js';
	import Badge from '#lib/ui/Badge/Badge.svelte';
	import Button from '#lib/ui/Button/Button.svelte';
	import Dialog from '#lib/ui/Dialog/Dialog.svelte';
	import Select from '#lib/ui/Select/Select.svelte';
	import { getToasts } from '#lib/ui/Toast/toast.svelte.js';
	import { onMount, tick } from 'svelte';
	import { changeStatus, type ChangeStatusResult } from './change-status';

	/**
	 * A campaign's status in the table. Read-only people see the badge. People who may edit see a
	 * select that offers the current status and the moves the lifecycle allows from it, inside a
	 * plain form: without JavaScript it posts to the status endpoint and comes back to the list.
	 * A status with no way out (archived) stays a badge for everybody.
	 *
	 * With JavaScript a pick is applied at once (optimistic) and sent in the background. If the
	 * server refuses, or does not answer, the select goes back to the confirmed status and a toast
	 * says why; a signed-out session sends the person to sign in. A move into a status with no way
	 * back (`isIrreversible`) waits for a confirmation first; declining puts the select back.
	 */
	type Props = {
		item: { id: string; name: string; status: ItemStatus };
		canEdit: boolean;
		/** Where the form returns to: the list as the person had it (filters, sort, page). */
		redirectTo: string;
		/** The transport; replaced in tests. */
		fetcher?: typeof fetch;
		/** Called once a change has been answered, success or not; the page decides what to refresh. */
		onsettled?: (result: ChangeStatusResult) => void;
	};

	let { item, canEdit, redirectTo, fetcher, onsettled }: Props = $props();

	const i18n = getI18n();
	const toasts = getToasts();

	const tones: Record<ItemStatus, 'neutral' | 'info' | 'success' | 'warning'> = {
		draft: 'neutral',
		scheduled: 'info',
		active: 'success',
		paused: 'warning',
		completed: 'info',
		archived: 'neutral'
	};

	// What the server last confirmed. It follows the row, and moves on after a successful change.
	let confirmed = $derived(item.status);
	// What the select shows: the pick, before the server has answered.
	let chosen = $derived<ItemStatus>(item.status);
	let pending = $state(false);
	let confirming = $state(false);
	let enhanced = $state(false);
	let select = $state<HTMLSelectElement | null>(null);

	onMount(() => {
		enhanced = true;
	});

	const moves = $derived(allowedTransitions(confirmed));
	const options = $derived(
		[confirmed, ...moves].map((value) => ({ value, label: i18n.t(`item.status.${value}`) }))
	);
	const action = $derived(localizePath(i18n.lang, `/dashboard/items/${item.id}/status`));

	/** A pick: irreversible moves ask first, everything else is sent. */
	function pick() {
		if (pending || chosen === confirmed) return;
		if (isIrreversible(chosen)) confirming = true;
		else void send();
	}

	const statusName = (status: ItemStatus) => i18n.t(`item.status.${status}`);

	async function send() {
		const wanted = chosen;
		pending = true;
		const result = await changeStatus(action, wanted, fetcher);
		onsettled?.(result);
		if (result.ok) {
			confirmed = result.status;
			chosen = result.status;
			if (result.changed) {
				toasts.add({
					tone: 'success',
					message: i18n.t('dashboard.items.status.changed', {
						name: item.name,
						status: statusName(result.status)
					})
				});
			}
		} else {
			chosen = confirmed;
			toasts.add({
				tone: 'danger',
				title: i18n.t('dashboard.items.status.error.title'),
				message: i18n.t(`dashboard.items.status.error.${result.kind}`)
			});
			if (result.kind === 'unauthenticated') {
				const next = encodeURIComponent(redirectTo);
				// eslint-disable-next-line svelte/no-navigation-without-resolve -- built from our own locale
				void goto(`${localizePath(i18n.lang, '/login')}?next=${next}`);
			}
		}
		pending = false;
		// A disabled control drops focus; give it back so the keyboard user stays where they were.
		await tick();
		select?.focus();
	}

	function submit(event: SubmitEvent) {
		if (!enhanced) return;
		event.preventDefault();
		pick();
	}
</script>

{#if canEdit && moves.length > 0}
	<!-- The path is built from our own locale and the item id. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<form method="post" {action} onsubmit={submit} class="space-y-1">
		<div class="flex items-center gap-2">
			<input type="hidden" name="redirectTo" value={redirectTo} />
			<Select
				name="status"
				size="sm"
				hideLabel
				label={i18n.t('dashboard.items.status.change', { name: item.name })}
				{options}
				bind:value={chosen}
				bind:ref={select}
				disabled={pending}
				aria-busy={pending}
				onchange={() => enhanced && pick()}
			/>
			{#if !enhanced}
				<Button type="submit" size="sm" variant="secondary">{i18n.t('common.save')}</Button>
			{/if}
		</div>
	</form>
	<Dialog
		bind:open={
			() => confirming,
			(next) => {
				confirming = next;
				// Closed any way but the confirm button, which has already started sending: a no.
				if (!next && !pending) chosen = confirmed;
			}
		}
		role="alertdialog"
		size="sm"
		title={i18n.t('dashboard.items.status.confirm.title', { status: statusName(chosen) })}
		description={i18n.t('dashboard.items.status.confirm.body', { name: item.name })}
		closeLabel={i18n.t('common.close')}
	>
		{#snippet footer(close)}
			<!-- autofocus on the safe choice -->
			<Button variant="secondary" autofocus onclick={close}>{i18n.t('common.cancel')}</Button>
			<Button
				variant="danger"
				onclick={() => {
					void send();
					close();
				}}
			>
				{i18n.t('dashboard.items.status.confirm.action', { status: statusName(chosen) })}
			</Button>
		{/snippet}
	</Dialog>
{:else}
	<Badge tone={tones[confirmed]}>{i18n.t(`item.status.${confirmed}`)}</Badge>
{/if}
