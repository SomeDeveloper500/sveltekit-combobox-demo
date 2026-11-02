import { z } from 'zod';

/**
 * Shared by the login form (client) and the login action (server). The messages are codes, not
 * text, so each side can translate them; the server runs the same schema on every submit.
 */
export const loginSchema = z.object({
	email: z.string().trim().min(1, 'required').pipe(z.email('invalid_email')),
	password: z.string().min(1, 'required')
});
export type LoginInput = z.infer<typeof loginSchema>;

export type LoginField = keyof LoginInput;
export type LoginFieldErrors = Partial<Record<LoginField, string>>;

/**
 * Checks the raw form values and, when they are wrong, says which field has which problem code
 * (first problem per field). The same call runs in the browser before sending and on the server.
 */
export function validateLogin(
	values: Record<LoginField, string>
): { ok: true; data: LoginInput } | { ok: false; errors: LoginFieldErrors } {
	const result = loginSchema.safeParse(values);
	if (result.success) return { ok: true, data: result.data };
	const errors: LoginFieldErrors = {};
	for (const issue of result.error.issues) {
		const field = issue.path[0] as LoginField;
		errors[field] ??= issue.message;
	}
	return { ok: false, errors };
}
