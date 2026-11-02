<script lang="ts">
	import { provideI18n } from '#lib/i18n/context.js';
	import type { Locale } from '#lib/schemas/common.js';
	import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher.svelte';
	import ThemeToggle from '../ThemeToggle/ThemeToggle.svelte';

	/** Test-only: provides the language and renders what a page would put in its header. */
	let { start = 'en', path = '/en/blog?page=2' }: { start?: Locale; path?: string } = $props();

	// A state, not a prop: the test flips it to mimic navigation from /en to /de in one layout.
	// svelte-ignore state_referenced_locally
	let lang = $state<Locale>(start);
	const i18n = provideI18n(() => lang);
	const url = $derived(new URL(path, 'https://example.test'));
</script>

<button type="button" onclick={() => (lang = lang === 'en' ? 'de' : 'en')}>navigate</button>
<p data-testid="greeting">{i18n.t('nav.home')}</p>
<p data-testid="money">{i18n.format.money(2500)}</p>
<LanguageSwitcher {url} />
<ThemeToggle />
