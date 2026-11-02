import type { Role } from '#lib/schemas/user.js';

type Actor = { role: Role } | null | undefined;

/** Admins and editors may change a campaign; viewers are read-only; anonymous visitors cannot. */
export function canEditItems(actor: Actor): boolean {
	return actor?.role === 'admin' || actor?.role === 'editor';
}
