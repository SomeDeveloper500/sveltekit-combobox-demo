import { safeNext } from '#lib/auth/next.js';
import { localizePath } from '#lib/i18n/locale.js';
import { validateLogin, type LoginFieldErrors } from '#lib/schemas/login.js';
import { startSession } from '#lib/server/auth.js';
import { userRepository } from '#lib/server/data/users.js';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/** Where to go when the visitor did not come from a protected page. */
const home = (lang: Parameters<typeof localizePath>[0]) => localizePath(lang, '/dashboard');

/** Someone who is already signed in has no use for the form. */
export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, safeNext(url.searchParams.get('next'), home(locals.lang)));
};

export type LoginFailure = {
	/** What was typed, so the field is not emptied. The password is never sent back. */
	email: string;
	/** Per-field problems from the shared schema (codes the page translates). */
	errors: LoginFieldErrors;
	/** Set when the fields are fine but the credentials are not. */
	code?: 'invalid_credentials';
};

export const actions: Actions = {
	default: async ({ request, cookies, url, locals }) => {
		const form = await request.formData();
		const values = {
			email: String(form.get('email') ?? ''),
			password: String(form.get('password') ?? '')
		};

		// The same schema the form ran in the browser: a client that skipped it gets the same answer.
		const checked = validateLogin(values);
		if (!checked.ok) {
			return fail(400, { email: values.email, errors: checked.errors } satisfies LoginFailure);
		}

		const user = userRepository.authenticate(checked.data.email, checked.data.password);
		if (!user) {
			// One answer for an unknown email and a wrong password, so the form cannot be used to
			// find out which emails have an account.
			return fail(401, {
				email: values.email,
				errors: {},
				code: 'invalid_credentials'
			} satisfies LoginFailure);
		}

		await startSession(cookies, user.id);
		redirect(303, safeNext(url.searchParams.get('next'), home(locals.lang)));
	}
};
