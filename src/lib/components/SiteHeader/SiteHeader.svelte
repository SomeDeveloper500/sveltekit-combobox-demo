<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import { localizePath, splitLocale, type PageUrl } from '#lib/i18n/locale.js';
	import { NAV_ITEMS, isCurrent } from '#lib/nav.js';
	import Container from '#lib/ui/Container/Container.svelte';
	import { cx } from '#lib/ui/shared/cx.js';
	import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher.svelte';
	import ThemeToggle from '../ThemeToggle/ThemeToggle.svelte';

	let { url }: { url: PageUrl } = $props();

	const i18n = getI18n();
	const rest = $derived(splitLocale(url.pathname).rest);
</script>

<header class="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
	<Container size="wide" class="flex flex-wrap items-center gap-x-6 gap-y-1 py-2">
		<!-- The hrefs below are built from our own locale and paths (see `localizePath`). -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={localizePath(i18n.lang)}
			class="rounded-md py-2 text-lg font-extrabold tracking-tight text-fg"
		>
			{i18n.t('site.name')}
		</a>

		<nav aria-label={i18n.t('a11y.mainNav')} class="flex-1">
			<ul class="flex flex-wrap items-center gap-1">
				{#each NAV_ITEMS as item (item.path)}
					{@const current = isCurrent(item, rest)}
					<li>
						<a
							href={localizePath(i18n.lang, item.path)}
							aria-current={current ? 'page' : undefined}
							class={cx(
								'inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold transition-colors',
								current
									? 'bg-neutral-soft text-fg'
									: 'text-muted hover:bg-neutral-soft hover:text-fg'
							)}
						>
							{i18n.t(item.label)}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->

		<div class="flex items-center gap-1">
			<LanguageSwitcher {url} />
			<ThemeToggle />
		</div>
	</Container>
</header>
