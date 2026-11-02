<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';

	/** The id of the element that holds the page's main content. */
	let { target = 'main' }: { target?: string } = $props();

	const i18n = getI18n();
</script>

<!-- First in the page: a keyboard user can jump past the header and menu. It shows on focus. -->
<a
	href="#{target}"
	class="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:border focus:border-line-strong focus:bg-raised focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
>
	{i18n.t('a11y.skipToContent')}
</a>
