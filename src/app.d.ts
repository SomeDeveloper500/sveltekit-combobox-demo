// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Locale } from '#lib/schemas/common.js';

declare global {
	namespace App {
		interface Error {
			/** A short reference for an unexpected error: shown to the visitor and written to the log. */
			id?: string;
		}
		interface Locals {
			/** The language of this request: from the URL's locale segment, else the browser's preference. */
			lang: Locale;
		}
		interface PageData {
			/** The language of the request; error pages outside a locale route read it. */
			lang?: Locale;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
