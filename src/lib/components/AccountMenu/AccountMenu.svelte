<script lang="ts">
	import { hasSignedInHint } from '#lib/auth/hint.js';
	import { getI18n } from '#lib/i18n/context.js';
	import { localizePath } from '#lib/i18n/locale.js';
	import type { SessionUser } from '#lib/schemas/user.js';
	import { page } from '$app/state';

	/**
	 * Sign in, or the signed-in user's links. Pages rendered per request know the user. Prerendered
	 * pages are built once for everybody, so they cannot: for them the menu falls back to a hint
	 * cookie after hydration (see `lib/auth/hint.ts`), which is enough to show the right links.
	 */
	let { user }: { user: SessionUser | null | undefined } = $props();

	const i18n = getI18n();

	// The header outlives client-side navigations, so the hint is read again on each one: signing in
	// or out happens after it first mounted. Effects do not run on the server.
	let hinted = $state(false);
	$effect(() => {
		void page.url;
		hinted = hasSignedInHint(document.cookie);
	});

	const signedIn = $derived(Boolean(user) || hinted);

	const link =
		'inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold transition-colors text-muted hover:bg-neutral-soft hover:text-fg';
</script>

<!-- The paths are built from our own locale (see `localizePath`). -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="flex items-center gap-1" role="group" aria-label={i18n.t('account.label')}>
	{#if signedIn}
		<a href={localizePath(i18n.lang, '/dashboard')} class={link}>
			{i18n.t('nav.dashboard')}
		</a>
		{#if user}
			<span class="hidden px-1 text-sm text-muted sm:inline">{user.name}</span>
		{/if}
		<form method="post" action={localizePath(i18n.lang, '/logout')}>
			<button type="submit" class={link}>{i18n.t('nav.logout')}</button>
		</form>
	{:else}
		<a href={localizePath(i18n.lang, '/login')} class={link}>{i18n.t('nav.login')}</a>
	{/if}
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
