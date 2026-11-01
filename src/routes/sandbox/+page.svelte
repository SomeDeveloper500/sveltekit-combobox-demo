<script lang="ts">
	import { onMount } from 'svelte';

	const swatches = [
		['bg', 'bg-bg'],
		['surface', 'bg-surface'],
		['raised', 'bg-raised'],
		['neutral-soft', 'bg-neutral-soft'],
		['primary', 'bg-primary'],
		['danger', 'bg-danger'],
		['success', 'bg-success'],
		['warning', 'bg-warning'],
		['info', 'bg-info']
	] as const;

	let theme = $state<'light' | 'dark'>('light');

	onMount(() => {
		theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {
			/* storage blocked: the choice lasts for this page view only */
		}
	}
</script>

<svelte:head>
	<title>Sandbox</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto max-w-3xl space-y-8 p-6">
	<header class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Sandbox</h1>
		<button
			type="button"
			class="rounded-md border border-line-strong bg-raised px-3 py-2 text-sm"
			aria-pressed={theme === 'dark'}
			onclick={toggleTheme}
		>
			Dark theme
		</button>
	</header>

	<section class="space-y-3">
		<h2 class="text-lg font-semibold">Tokens</h2>
		<ul class="grid grid-cols-3 gap-3">
			{#each swatches as [name, cls] (name)}
				<li class="rounded-md border border-line p-2 text-sm">
					<div class="h-10 rounded-sm border border-line {cls}"></div>
					<span class="mt-1 block">{name}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="space-y-2 rounded-lg bg-surface p-4 shadow-card">
		<p>Body text on surface.</p>
		<p class="text-muted">Muted text on surface.</p>
		<p class="rounded-md bg-danger-soft px-2 py-1 text-danger">Danger</p>
		<p class="rounded-md bg-success-soft px-2 py-1 text-success">Success</p>
		<p class="rounded-md bg-warning-soft px-2 py-1 text-warning">Warning</p>
		<p class="rounded-md bg-info-soft px-2 py-1 text-info">Info</p>
		<p class="inline-block rounded-md bg-primary px-3 py-1 text-on-primary">Primary</p>
	</section>
</main>
