<script lang="ts">
	import { onMount } from 'svelte';
	import Badge from '#lib/ui/Badge.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Card from '#lib/ui/Card.svelte';
	import Combobox from '#lib/ui/Combobox.svelte';
	import Container from '#lib/ui/Container.svelte';
	import Dialog from '#lib/ui/Dialog.svelte';
	import Heading from '#lib/ui/Heading.svelte';
	import Input from '#lib/ui/Input.svelte';
	import Select from '#lib/ui/Select.svelte';
	import Skeleton from '#lib/ui/Skeleton.svelte';
	import { getToasts, type ToastTone } from '#lib/ui/toast.svelte.js';

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

	const sortOptions = [
		{ value: 'new', label: 'Newest first' },
		{ value: 'old', label: 'Oldest first' },
		{ value: 'rated', label: 'Top rated (unavailable)', disabled: true }
	];
	const toasts = getToasts();
	const toastTones: ToastTone[] = ['info', 'success', 'warning', 'danger'];
	let email = $state('');
	let sort = $state('');
	const tagOptions = [
		{ value: 'a11y', label: 'Accessibility' },
		{ value: 'perf', label: 'Performance' },
		{ value: 'ssr', label: 'Server rendering' },
		{ value: 'svelte', label: 'Svelte 5' },
		{ value: 'tailwind', label: 'Tailwind' },
		{ value: 'testing', label: 'Testing' },
		{ value: 'i18n', label: 'Internationalisation' },
		{ value: 'legacy', label: 'Legacy (unavailable)', disabled: true },
		{ value: 'cafe', label: 'Café' }
	];
	let tag = $state('');
	let infoOpen = $state(false);
	let confirmOpen = $state(false);
	let formOpen = $state(false);
	let dialogTag = $state('');

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
				<Button href="#buttons" variant="secondary" disabled>link disabled</Button>
				<Button href="#buttons" variant="secondary" loading>link loading</Button>
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
					<Badge {tone} dot label="Status: ">{tone}</Badge>
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
					<Heading level={3} size={4}>
						<a href="#cards" class="outline-none after:absolute after:inset-0">Interactive</a>
					</Heading>
					<p class="mt-1 text-sm text-muted">Stretched link: lifts on hover.</p>
				</Card>
				<Card as="li" padding="lg">
					<Heading level={3} size={4}>Large padding</Heading>
					<p class="mt-1 text-sm text-muted">Static card.</p>
				</Card>
			</ul>
		</section>

		<Card as="section" aria-labelledby="forms" class="space-y-4">
			<Heading level={2} size={3} id="forms">Input, Select</Heading>
			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					label="Email"
					type="email"
					bind:value={email}
					placeholder="you@example.com"
					required
				/>
				<Input label="With hint" hint="We never share it." />
				<Input label="With error" value="nope" error="Enter a valid email address." />
				<Input label="Disabled" value="read only" disabled />
				<Select
					label="Sort"
					options={sortOptions}
					bind:value={sort}
					placeholder="Choose order"
					hint="Selected: {sort || 'nothing'}"
				/>
				<Select label="Disabled select" disabled options={sortOptions} value="new" />
				<Select label="Small select" size="sm" options={sortOptions} error="Pick another order." />
			</div>
		</Card>

		<Card as="section" aria-labelledby="combobox" class="space-y-4">
			<Heading level={2} size={3} id="combobox">Combobox</Heading>
			<div class="grid gap-4 sm:grid-cols-2">
				<Combobox
					label="Tag"
					options={tagOptions}
					bind:value={tag}
					placeholder="Type to filter"
					hint="Selected: {tag || 'nothing'}"
				/>
				<Combobox label="Disabled" options={tagOptions} value="a11y" disabled />
				<Combobox label="With error" options={tagOptions} error="Pick a tag." />
			</div>
		</Card>

		<Card as="section" aria-labelledby="dialogs" class="space-y-4">
			<Heading level={2} size={3} id="dialogs">Dialog</Heading>
			<div class="flex flex-wrap gap-3">
				<Button variant="secondary" onclick={() => (infoOpen = true)}>Open dialog</Button>
				<Button variant="secondary" onclick={() => (confirmOpen = true)}>Open confirmation</Button>
				<Button variant="secondary" onclick={() => (formOpen = true)}>Open with combobox</Button>
			</div>
		</Card>

		<Dialog
			bind:open={infoOpen}
			title="About this dialog"
			description="Escape, the close button and a click on the backdrop all close it."
		>
			<p class="text-sm">
				Focus is trapped inside while it is open and returns to the button that opened it.
			</p>
			{#snippet footer(close)}
				<Button onclick={close}>Got it</Button>
			{/snippet}
		</Dialog>

		<Dialog
			bind:open={confirmOpen}
			size="sm"
			dismissible={false}
			title="Mark as archived?"
			description="This cannot be undone. Only the buttons close this dialog."
		>
			{#snippet footer(close)}
				<!-- autofocus on the safe choice -->
				<Button variant="secondary" autofocus onclick={close}>Cancel</Button>
				<Button
					variant="danger"
					onclick={() => {
						toasts.add({ tone: 'success', message: 'Archived.' });
						close();
					}}
				>
					Archive
				</Button>
			{/snippet}
		</Dialog>

		<Dialog bind:open={formOpen} title="Pick a tag">
			<Combobox label="Tag" options={tagOptions} bind:value={dialogTag} />
			<p class="mt-3 text-sm text-muted">Escape closes the combobox list first, then the dialog.</p>
			{#snippet footer(close)}
				<Button onclick={close}>Done</Button>
			{/snippet}
		</Dialog>

		<Card as="section" aria-labelledby="skeletons" class="space-y-3">
			<Heading level={2} size={3} id="skeletons">Skeleton</Heading>
			<div class="flex items-center gap-3">
				<Skeleton radius="full" class="size-12" />
				<div class="flex-1 space-y-2">
					<Skeleton class="h-4 w-1/2" />
					<Skeleton class="h-4 w-3/4" />
				</div>
			</div>
		</Card>

		<Card as="section" aria-labelledby="toasts" class="space-y-4">
			<Heading level={2} size={3} id="toasts">Toast</Heading>
			<div class="flex flex-wrap gap-3">
				{#each toastTones as tone (tone)}
					<Button
						variant="secondary"
						onclick={() =>
							toasts.add({
								tone,
								title: `A ${tone} toast`,
								message: 'Hover or focus it to pause.'
							})}
					>
						Show {tone}
					</Button>
				{/each}
				<Button
					variant="ghost"
					onclick={() => toasts.add({ message: 'Stays until dismissed.', duration: 0 })}
				>
					Show sticky
				</Button>
				<Button variant="ghost" onclick={() => toasts.clear()}>Clear all</Button>
			</div>
		</Card>

		<Card as="section" aria-labelledby="headings" class="space-y-2">
			<Heading level={2} size={3} id="headings">Heading</Heading>
			<Heading level={3} size={1}>Size 1 display</Heading>
			<Heading level={3} size={2}>Size 2 section</Heading>
			<Heading level={3} size={3}>Size 3 subsection</Heading>
			<Heading level={3} size={4}>Size 4 label</Heading>
		</Card>
	</Container>
</main>
