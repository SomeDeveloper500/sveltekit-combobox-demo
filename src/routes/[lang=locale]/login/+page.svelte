<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { classifyFailure } from '#lib/api/failure.js';
	import Seo from '#lib/components/Seo/Seo.svelte';
	import { getI18n } from '#lib/i18n/context.js';
	import { validateLogin, type LoginFieldErrors } from '#lib/schemas/login.js';
	import Button from '#lib/ui/Button/Button.svelte';
	import Card from '#lib/ui/Card/Card.svelte';
	import Container from '#lib/ui/Container/Container.svelte';
	import Heading from '#lib/ui/Heading/Heading.svelte';
	import Input from '#lib/ui/Input/Input.svelte';
	import type { PageProps } from './$types';
	import type { LoginFailure } from './+page.server';

	let { form }: PageProps = $props();

	const i18n = getI18n();

	// What the server sent back after a submit: the typed email, field problems, wrong credentials.
	const refused = $derived(form as LoginFailure | null | undefined);
	let email = $derived(refused?.email ?? '');
	let password = $state('');
	// Starts from the server's answer; the browser-side check overwrites it before a request is sent.
	let errors = $derived<LoginFieldErrors>(refused?.errors ?? {});

	/** Why the request itself failed, as opposed to why the credentials were refused. */
	let failure = $state<'network' | 'server' | null>(null);
	let submitting = $state(false);

	let emailField = $state<HTMLInputElement | null>(null);
	let passwordField = $state<HTMLInputElement | null>(null);

	const messages = {
		invalid_email: 'login.error.invalidEmail',
		required: 'login.error.required'
	} as const;
	const describe = (code: string | undefined) =>
		code && code in messages ? i18n.t(messages[code as keyof typeof messages]) : undefined;

	// One alert for everything that is not about a single field.
	const alert = $derived(
		failure === 'network'
			? i18n.t('login.error.network')
			: failure === 'server'
				? i18n.t('login.error.server')
				: refused?.code === 'invalid_credentials'
					? i18n.t('login.error')
					: undefined
	);

	const submit: SubmitFunction = ({ cancel }) => {
		failure = null;

		// The same check the server runs, so mistakes show at once and without a round trip.
		const checked = validateLogin({ email, password });
		if (!checked.ok) {
			cancel();
			errors = checked.errors;
			(checked.errors.email ? emailField : passwordField)?.focus();
			return;
		}

		errors = {};
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'error') {
				// No usable answer: a dropped connection has no status, a crash on our side has 5xx.
				failure = classifyFailure(result.status) === 'network' ? 'network' : 'server';
				return;
			}
			// Keep what was typed; only a refused password is cleared.
			await update({ reset: false });
			if (result.type === 'failure') {
				password = '';
				(refused?.errors?.email ? emailField : passwordField)?.focus();
			}
		};
	};
</script>

<Seo title={i18n.t('login.title')} description={i18n.t('login.meta.description')} noindex />

<Container size="narrow" class="py-12">
	<Card padding="lg" class="space-y-6">
		<div class="space-y-2">
			<Heading level={1} size={2}>{i18n.t('login.title')}</Heading>
			<p class="text-muted">{i18n.t('login.subtitle')}</p>
		</div>

		<!-- Without JavaScript this is an ordinary POST to the same URL (`next` stays in the query). -->
		<form method="post" novalidate use:enhance={submit} class="space-y-4">
			{#if alert}
				<p
					role="alert"
					class="rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
				>
					{alert}
				</p>
			{/if}

			<Input
				name="email"
				type="email"
				label={i18n.t('login.email')}
				autocomplete="username"
				inputmode="email"
				bind:value={email}
				bind:ref={emailField}
				error={describe(errors.email)}
			/>
			<Input
				name="password"
				type="password"
				label={i18n.t('login.password')}
				autocomplete="current-password"
				bind:value={password}
				bind:ref={passwordField}
				error={describe(errors.password)}
			/>

			<Button type="submit" loading={submitting} loadingLabel={i18n.t('login.submitting')}>
				{i18n.t('login.submit')}
			</Button>
		</form>
	</Card>
</Container>
