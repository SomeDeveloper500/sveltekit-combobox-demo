<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { provideI18n } from '#lib/i18n/context.js';
	import type { Locale } from '#lib/schemas/common.js';
	import type { ItemStatus } from '#lib/schemas/item.js';
	import Toaster from '#lib/ui/Toast/Toaster.svelte';
	import { provideToasts } from '#lib/ui/Toast/toast.svelte.js';
	import ItemStatusControl from './ItemStatusControl.svelte';

	/** Test-only: the status control for one campaign, in a given language. */
	let {
		lang = 'en',
		status,
		canEdit,
		fetcher,
		onsettled
	}: {
		lang?: Locale;
		status: ItemStatus;
		canEdit: boolean;
		fetcher?: typeof fetch;
		onsettled?: ComponentProps<typeof ItemStatusControl>['onsettled'];
	} = $props();

	provideI18n(() => lang);
	provideToasts();
</script>

<ItemStatusControl
	item={{ id: 'item_1', name: 'Spring sale', status }}
	{canEdit}
	{fetcher}
	{onsettled}
	redirectTo="/en/dashboard/items?status=active"
/>
<Toaster />
