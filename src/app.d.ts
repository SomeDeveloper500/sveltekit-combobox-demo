// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Locale } from '#lib/schemas/common.js';
import type { SessionUser } from '#lib/schemas/user.js';

declare global {
	namespace App {
		interface Error {
			/** A short reference for an unexpected error: shown to the visitor and written to the log. */
			id?: string;
		}
		interface Locals {
			/** The language of this request: from the URL's locale segment, else the browser's preference. */
			lang: Locale;
			/** The signed-in user, looked up from the session cookie on every request; `null` for visitors. */
			user: SessionUser | null;
		}
		interface PageData {
			/** The language of the request; error pages outside a locale route read it. */
			lang?: Locale;
			/** The signed-in user, if any (never set on prerendered pages). */
			user?: SessionUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
