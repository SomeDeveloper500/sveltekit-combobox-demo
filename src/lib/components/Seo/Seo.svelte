<script lang="ts">
	import { page } from '$app/state';
	import { getI18n } from '#lib/i18n/context.js';
	import { localizePath, splitLocale } from '#lib/i18n/locale.js';
	import { LOCALES, DEFAULT_LOCALE } from '#lib/schemas/common.js';
	import { buildSeo } from '#lib/seo/seo.js';
	import { siteOrigin } from '#lib/site.js';

	type Props = {
		title: string;
		description: string;
		/** Path or absolute URL of the social preview image. */
		image?: string;
		type?: 'website' | 'article';
		/** Query that identifies the page, e.g. `?page=2`; it goes into canonical and hreflang. */
		search?: string;
		/** Keep the page out of search engines (result pages of our own search). */
		noindex?: boolean;
	};

	let { title, description, image, type, search = '', noindex = false }: Props = $props();

	const i18n = getI18n();

	const tags = $derived.by(() => {
		const { rest } = splitLocale(page.url.pathname);
		return buildSeo({
			origin: siteOrigin,
			path: `${localizePath(i18n.lang, rest)}${search}`,
			title,
			description,
			siteName: i18n.t('site.name'),
			lang: i18n.lang,
			alternates: LOCALES.map((locale) => ({
				hreflang: locale,
				path: `${localizePath(locale, rest)}${search}`
			})),
			defaultPath: `${localizePath(DEFAULT_LOCALE, rest)}${search}`,
			image,
			type
		});
	});
</script>

<svelte:head>
	<title>{tags.title}</title>
	<meta name="description" content={tags.description} />
	{#if noindex}<meta name="robots" content="noindex, follow" />{/if}
	<link rel="canonical" href={tags.canonical} />
	{#each tags.alternates as alternate (alternate.hreflang)}
		<link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
	{/each}
	{#each Object.entries(tags.openGraph) as [property, content] (property)}
		<meta {property} {content} />
	{/each}
	{#each Object.entries(tags.twitter) as [name, content] (name)}
		<meta {name} {content} />
	{/each}
</svelte:head>
