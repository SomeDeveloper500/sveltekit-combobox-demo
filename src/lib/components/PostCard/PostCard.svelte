<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import { localizePath } from '#lib/i18n/locale.js';
	import Badge from '#lib/ui/Badge/Badge.svelte';
	import Card from '#lib/ui/Card/Card.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';

	type Props = {
		slug: string;
		title: string;
		excerpt: string;
		tags: readonly string[];
		tagLabels: Readonly<Record<string, string>>;
		authorName: string;
		publishedAt: string;
		readingTimeMinutes: number;
		coverColor: string;
	};

	let {
		slug,
		title,
		excerpt,
		tags,
		tagLabels,
		authorName,
		publishedAt,
		readingTimeMinutes,
		coverColor
	}: Props = $props();

	const i18n = getI18n();
</script>

<Card as="li" padding="none" interactive class="flex flex-col">
	<div class="h-2 shrink-0" style:background-color={coverColor} aria-hidden="true"></div>
	<div class="flex flex-1 flex-col gap-3 p-4 sm:p-6">
		<ul class="flex flex-wrap gap-1.5" aria-label={i18n.t('blog.tags')}>
			{#each tags as tag (tag)}
				<li><Badge>{tagLabels[tag] ?? tag}</Badge></li>
			{/each}
		</ul>
		<Heading level={2} size={3}>
			<!-- The path is built from our own locale and the post slug. -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a href={localizePath(i18n.lang, `/blog/${slug}`)} class="after:absolute after:inset-0">
				{title}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</Heading>
		<p class="flex-1 text-muted">{excerpt}</p>
		<p class="text-sm text-muted">
			{authorName} · <time datetime={publishedAt}>{i18n.format.date(publishedAt)}</time> ·
			{i18n.t('blog.readingTime', { minutes: readingTimeMinutes })}
		</p>
	</div>
</Card>
