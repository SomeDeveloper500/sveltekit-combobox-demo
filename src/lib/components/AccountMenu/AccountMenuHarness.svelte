<script lang="ts">
	import { provideI18n } from '#lib/i18n/context.js';
	import type { Locale } from '#lib/schemas/common.js';
	import type { SessionUser } from '#lib/schemas/user.js';
	import AccountMenu from './AccountMenu.svelte';

	/** Test-only: the account menu in a given language, with or without a known user. */
	let { lang = 'en', user = null }: { lang?: Locale; user?: SessionUser | null } = $props();

	provideI18n(() => lang);
</script>

<AccountMenu {user} />
