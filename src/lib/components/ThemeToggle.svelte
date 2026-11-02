<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import { applyTheme, currentTheme, otherTheme, type Theme } from '#lib/theme.js';
	import Button from '#lib/ui/Button.svelte';
	import { onMount } from 'svelte';

	const i18n = getI18n();

	// The server cannot know the theme (the inline script in app.html decides it in the browser),
	// so the real value is read once mounted.
	let theme = $state<Theme>('light');
	onMount(() => (theme = currentTheme()));

	function toggle() {
		theme = otherTheme(theme);
		applyTheme(theme);
	}
</script>

<!-- A toggle button: its label names the setting, `aria-pressed` carries the state. -->
<Button variant="ghost" aria-pressed={theme === 'dark'} onclick={toggle}>
	<svg
		class="size-5"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		{#if theme === 'dark'}
			<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
		{:else}
			<circle cx="12" cy="12" r="4" />
			<path
				d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
			/>
		{/if}
	</svg>
	<span class="sr-only">{i18n.t('a11y.toggleTheme')}</span>
</Button>
