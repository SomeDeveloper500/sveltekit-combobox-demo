<script lang="ts">
	import { getI18n } from '#lib/i18n/context.js';
	import Container from '#lib/ui/Container.svelte';

	const i18n = getI18n();
</script>

<footer class="mt-auto border-t border-line py-8 text-sm text-muted">
	<Container size="wide">
		<p>{i18n.t('footer.copy')}</p>
	</Container>
</footer>
