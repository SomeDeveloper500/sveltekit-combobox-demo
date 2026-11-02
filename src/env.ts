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
	}
});
