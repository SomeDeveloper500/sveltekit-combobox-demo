<script lang="ts">
	import { onMount } from 'svelte';
	import Badge from '#lib/ui/Badge.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Card from '#lib/ui/Card.svelte';
	import Container from '#lib/ui/Container.svelte';
	import Heading from '#lib/ui/Heading.svelte';

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
	const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
	const tones = ['neutral', 'success', 'warning', 'danger', 'info'] as const;

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

<header class="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
	<Container class="flex items-center justify-between gap-4 py-3">
		<Heading level={1} size={3}>Sandbox</Heading>
		<Button variant="secondary" size="sm" aria-pressed={theme === 'dark'} onclick={toggleTheme}>
			Dark theme
		</Button>
	</Container>
</header>

<main class="py-10">
	<Container class="space-y-6">
		<Card as="section" aria-labelledby="tokens">
			<Heading level={2} size={3} id="tokens">Tokens</Heading>
			<ul class="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
				{#each swatches as [name, cls] (name)}
					<li class="text-sm">
						<div class="h-12 rounded-lg border border-line {cls}"></div>
						<span class="mt-1.5 block text-muted">{name}</span>
					</li>
				{/each}
			</ul>
		</Card>

		<Card as="section" aria-labelledby="buttons" class="space-y-4">
			<Heading level={2} size={3} id="buttons">Button</Heading>
			<div class="flex flex-wrap items-center gap-3">
				{#each variants as variant (variant)}
					<Button {variant}>{variant}</Button>
				{/each}
			</div>
			<div class="flex flex-wrap items-center gap-3">
				<Button size="sm">small</Button>
				<Button size="md">medium</Button>
				<Button size="lg">large</Button>
				<Button disabled>disabled</Button>
				<Button loading>loading</Button>
				<Button href="#buttons" variant="secondary">link</Button>
			</div>
		</Card>

		<Card as="section" aria-labelledby="badges" class="space-y-4">
			<Heading level={2} size={3} id="badges">Badge</Heading>
			<div class="flex flex-wrap gap-2">
				{#each tones as tone (tone)}
					<Badge {tone}>{tone}</Badge>
				{/each}
			</div>
			<div class="flex flex-wrap gap-2">
				{#each tones as tone (tone)}
					<Badge {tone} dot>{tone}</Badge>
				{/each}
			</div>
		</Card>

		<section class="space-y-4" aria-labelledby="cards">
			<Heading level={2} size={3} id="cards">Card</Heading>
			<ul class="grid gap-4 sm:grid-cols-3">
				<Card as="li" padding="sm">
					<Heading level={3} size={4}>Small padding</Heading>
					<p class="mt-1 text-sm text-muted">Static card.</p>
				</Card>
				<Card as="li" interactive>
					<Heading level={3} size={4}>Interactive</Heading>
					<p class="mt-1 text-sm text-muted">Lifts on hover.</p>
				</Card>
				<Card as="li" padding="lg">
					<Heading level={3} size={4}>Large padding</Heading>
					<p class="mt-1 text-sm text-muted">Static card.</p>
				</Card>
			</ul>
		</section>

		<Card as="section" aria-labelledby="headings" class="space-y-2">
			<Heading level={2} size={3} id="headings">Heading</Heading>
			<Heading level={3} size={1}>Size 1 display</Heading>
			<Heading level={3} size={2}>Size 2 section</Heading>
			<Heading level={3} size={3}>Size 3 subsection</Heading>
			<Heading level={3} size={4}>Size 4 label</Heading>
		</Card>
	</Container>
</main>
