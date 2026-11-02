<script lang="ts">
	import type { PageUrl } from '#lib/i18n/locale.js';
	import type { Snippet } from 'svelte';
	import SiteFooter from './SiteFooter.svelte';
	import SiteHeader from './SiteHeader.svelte';
	import SkipLink from './SkipLink.svelte';

	/**
	 * The frame around every localized page: skip link, banner with the menu and switchers, the
	 * one `<main>` landmark and the footer. Pages render only their own content inside it.
	 * `<main>` is focusable by script (`tabindex="-1"`), which is where the skip link sends focus.
	 */
	let { url, children }: { url: PageUrl; children: Snippet } = $props();
</script>

<div class="flex min-h-dvh flex-col">
	<SkipLink target="main" />
	<SiteHeader {url} />
	<main id="main" tabindex="-1" class="flex-1 focus:outline-none">
		{@render children()}
	</main>
	<SiteFooter />
</div>
