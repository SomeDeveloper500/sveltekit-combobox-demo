import { defineEnvVars } from '@sveltejs/kit/env';

// Erasable TypeScript only: SvelteKit loads this file with Node itself, outside Vite.
export const variables = defineEnvVars({
	SITE_URL: {
		public: true,
		static: true,
		description: 'Public origin of the site, used for canonical and hreflang URLs.',
		schema: (value) => {
			if (!value) return 'http://localhost:5173';
			const url = new URL(value);
			if (url.protocol !== 'https:' && url.protocol !== 'http:') {
				throw new Error('SITE_URL must be an http(s) URL');
			}
			return url.origin;
		}
	},
	SESSION_SECRET: {
		description:
			'Key that signs session cookies. At least 16 random characters; required in production.',
		// Optional here: a build and the tests run without it. `lib/server/auth.ts` insists on it
		// when the server runs in production.
		schema: (value) => value || undefined
	}
});
