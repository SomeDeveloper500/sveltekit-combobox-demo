import { building, dev } from '$app/env';
import { SESSION_SECRET } from '$app/env/private';
import { SIGNED_IN_HINT_COOKIE } from '#lib/auth/hint.js';
import type { SessionUser } from '#lib/schemas/user.js';
import type { Cookies } from '@sveltejs/kit';
import { userRepository } from './data/users';
import { createSessions, type Sessions } from './session';

/**
 * A fixed key for development and tests only. A production server refuses to start without a real
 * `SESSION_SECRET` (see `assertSessionConfigured`), so this never signs a real cookie.
 */
const DEMO_SECRET = 'demo-only-secret-never-use-in-production';

/** `__Host-` pins the cookie to this exact host and to HTTPS; it needs `Secure`, so not in dev. */
export const SESSION_COOKIE = dev ? 'session' : '__Host-session';

let sessions: Sessions | undefined;

function getSessions(): Sessions {
	if (!sessions) {
		if (!SESSION_SECRET && !dev) {
			throw new Error('SESSION_SECRET is not set: sessions cannot be signed in production');
		}
		sessions = createSessions({ secret: SESSION_SECRET ?? DEMO_SECRET });
	}
	return sessions;
}

/** Called when the server starts, so a missing secret fails the deploy and not the first login. */
export function assertSessionConfigured(): void {
	if (!building) getSessions();
}

/** The user id from the request's session cookie, or `null`. */
export function readSession(cookies: Cookies): Promise<string | null> {
	return getSessions().verify(cookies.get(SESSION_COOKIE));
}

export async function startSession(cookies: Cookies, userId: string): Promise<void> {
	const current = getSessions();
	cookies.set(SESSION_COOKIE, await current.sign(userId), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: current.ttlSeconds
	});
	// Readable by the page (not `httpOnly`) on purpose; see `lib/auth/hint.ts`.
	cookies.set(SIGNED_IN_HINT_COOKIE, '1', {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: !dev,
		maxAge: current.ttlSeconds
	});
}

export function endSession(cookies: Cookies): void {
	// The same attributes the cookies were set with. A browser ignores an attempt to clear a
	// `__Host-` cookie that does not say `Secure`, and SvelteKit's own default for `secure` is off
	// on plain-http localhost, which is where a production build is tried out.
	cookies.delete(SESSION_COOKIE, { path: '/', secure: !dev });
	cookies.delete(SIGNED_IN_HINT_COOKIE, { path: '/', secure: !dev });
}

/**
 * The user behind the request's session cookie, or `null`. The user is looked up by id every time,
 * so a role change or a removed account applies at once. A cookie that no longer leads to a user
 * (expired, forged, account gone) is cleared instead of being sent back on every request.
 */
export async function currentUser(cookies: Cookies): Promise<SessionUser | null> {
	const id = await readSession(cookies);
	const user = id ? userRepository.findById(id) : null;
	if (!user && cookies.get(SESSION_COOKIE)) endSession(cookies);
	return user;
}
