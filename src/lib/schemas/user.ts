import { z } from 'zod';

export const roleSchema = z.enum(['admin', 'editor', 'viewer']);
export type Role = z.infer<typeof roleSchema>;

/** Shape of users.json. The plaintext password is demo-only and never leaves the server. */
export const userRecordSchema = z.object({
	id: z.string().min(1),
	email: z.email(),
	password: z.string().min(1),
	name: z.string().min(1),
	role: roleSchema
});
export type UserRecord = z.infer<typeof userRecordSchema>;

/** What is stored in the session and exposed to pages: a user without the password. */
export const sessionUserSchema = userRecordSchema.omit({ password: true });
export type SessionUser = z.infer<typeof sessionUserSchema>;
