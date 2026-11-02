/**
 * Signed session tokens on Web Crypto only (no `node:crypto`), so the same code runs on Node and
 * on edge runtimes.
 *
 * A token is `base64url(payload) "." base64url(HMAC-SHA256(payload))`. It is tamper-evident, not
 * encrypted: the payload is just the user id and an expiry, nothing secret. Who the user *is* (role,
 * name, whether the account still exists) is looked up on every request, so a role change or a
 * removed account takes effect at once instead of living on in a cookie until it expires.
 */

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/** A token longer than this is rejected before any work is done on it. */
const MAX_TOKEN_LENGTH = 512;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
	if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error('not base64url');
	const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export type SessionOptions = {
	/** Signing key material. Any long random string; a short one is rejected. */
	secret: string;
	ttlSeconds?: number;
	/** The clock, replaceable in tests. Milliseconds since the epoch. */
	now?: () => number;
};

export function createSessions({
	secret,
	ttlSeconds = SESSION_TTL_SECONDS,
	now = Date.now
}: SessionOptions) {
	if (secret.length < 16) throw new Error('The session secret must be at least 16 characters');

	const key = crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);

	return {
		ttlSeconds,

		/** A token for this user id, valid for `ttlSeconds`. */
		async sign(userId: string): Promise<string> {
			const payload = toBase64Url(
				encoder.encode(JSON.stringify({ sub: userId, exp: now() + ttlSeconds * 1000 }))
			);
			const signature = await crypto.subtle.sign('HMAC', await key, encoder.encode(payload));
			return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
		},

		/**
		 * The user id behind a token, or `null` for anything that is not a valid, current token:
		 * missing, malformed, tampered with, signed with another key, or expired. The reason is
		 * never reported, so a caller cannot tell the cases apart.
		 */
		async verify(token: string | undefined): Promise<string | null> {
			if (!token || token.length > MAX_TOKEN_LENGTH) return null;
			const parts = token.split('.');
			if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
			try {
				const [payload, signature] = parts;
				// `verify` compares in constant time.
				const valid = await crypto.subtle.verify(
					'HMAC',
					await key,
					fromBase64Url(signature),
					encoder.encode(payload)
				);
				if (!valid) return null;
				const decoded: unknown = JSON.parse(decoder.decode(fromBase64Url(payload)));
				if (typeof decoded !== 'object' || decoded === null) return null;
				const { sub, exp } = decoded as { sub?: unknown; exp?: unknown };
				if (typeof sub !== 'string' || sub === '') return null;
				if (typeof exp !== 'number' || exp <= now()) return null;
				return sub;
			} catch {
				return null;
			}
		}
	};
}

export type Sessions = ReturnType<typeof createSessions>;
