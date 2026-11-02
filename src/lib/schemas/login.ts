import { z } from 'zod';

/**
 * Shared by the login form (client) and the login action (server). The messages are codes, not
 * text, so each side can translate them; the server runs the same schema on every submit.
 */
export const loginSchema = z.object({
	email: z.email('invalid_email'),
	password: z.string().min(1, 'required')
});
export type LoginInput = z.infer<typeof loginSchema>;
