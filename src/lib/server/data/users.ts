import { sessionUserSchema, userRecordSchema, type SessionUser } from '#lib/schemas/user.js';
import usersJson from '../../../../mocks/users.json';
import { parseCollection } from './validate';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Compared against when the email is unknown, so that path costs the same as a wrong password.
const DECOY_PASSWORD = '\u0000no-such-user\u0000';

/**
 * Compares two strings in time that depends on their lengths, not on where they first differ, so
 * a guess does not learn how much of the password it got right.
 */
export function safeEqual(a: string, b: string): boolean {
	let difference = a.length ^ b.length;
	for (let index = 0; index < Math.max(a.length, b.length); index++) {
		difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
	}
	return difference === 0;
}

/**
 * The demo accounts, validated once when the repository is built. Passwords are plaintext in the
 * mock data (demo only) and are checked on the server; they never leave this module.
 */
export function createUserRepository(rawUsers: unknown) {
	const users = parseCollection('mocks/users.json', userRecordSchema, rawUsers, {
		id: (user) => user.id,
		email: (user) => normalizeEmail(user.email)
	});
	const byEmail = new Map(users.map((user) => [normalizeEmail(user.email), user]));
	const byId = new Map(users.map((user) => [user.id, user]));

	return {
		/** The user for these credentials, or `null`; the reason is never revealed to the caller. */
		authenticate(email: string, password: string): SessionUser | null {
			const record = byEmail.get(normalizeEmail(email));
			// Always one comparison, so an unknown email and a wrong password look the same.
			const matches = safeEqual(record?.password ?? DECOY_PASSWORD, password);
			// `parse` drops every field the session user does not have, the password included.
			return record && matches ? sessionUserSchema.parse(record) : null;
		},

		/** For validating a session: the current user behind an id, without the password. */
		findById(id: string): SessionUser | null {
			const record = byId.get(id);
			return record ? sessionUserSchema.parse(record) : null;
		}
	};
}

export type UserRepository = ReturnType<typeof createUserRepository>;

export const userRepository = createUserRepository(usersJson);
