<script lang="ts">
	import { switchLocaleUrl, type PageUrl } from '#lib/i18n/locale.js';
	import { getI18n } from '#lib/i18n/context.js';
	import { LOCALES } from '#lib/schemas/common.js';
	import { cx } from '#lib/ui/shared/cx.js';

	/** The URL of the page being shown: each link points at the same page in another language. */
	let { url }: { url: PageUrl } = $props();

	const i18n = getI18n();
</script>

<ul class="flex items-center gap-1" aria-label={i18n.t('a11y.language')}>
	{#each LOCALES as locale (locale)}
		<li>
			<!-- `lang` makes a screen reader pronounce the name in its own language. -->
			<!-- The href is built from the current page URL, which already includes any base path. -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={switchLocaleUrl(url, locale)}
				lang={locale}
				hreflang={locale}
				aria-label={i18n.t(`lang.${locale}`)}
				aria-current={locale === i18n.lang ? 'true' : undefined}
				data-sveltekit-noscroll
				class={cx(
					'inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-semibold uppercase transition-colors',
					locale === i18n.lang
						? 'bg-neutral-soft text-fg'
						: 'text-muted hover:bg-neutral-soft hover:text-fg'
				)}
			>
				{locale}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</li>
	{/each}
</ul>
