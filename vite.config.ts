import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import netlify from '@sveltejs/adapter-netlify';
import node from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Netlify's functions when deployed there (`NETLIFY` is set by its build); the plain Node
			// server everywhere else: locally, in CI, and on any host that runs `node build`.
			adapter: process.env.NETLIFY ? netlify() : node(),
			// The whole stylesheet (33 KB raw, 6 KB compressed) goes into each page's HTML instead of
			// a separate file. A stylesheet in <head> blocks the first paint, so fetching it costs a
			// network round trip before anything shows; on a slow phone connection that round trip is
			// what decides LCP. The price is that pages do not share a cached copy of the CSS, which
			// is small next to the saved round trip. Raise this if the stylesheet outgrows it.
			inlineStyleThreshold: 40_000
		})
	],
	environments: {
		// Only the browser's files. The server's are bundled per entry and never fetched over a network.
		client: {
			build: {
				rolldownOptions: {
					output: {
						codeSplitting: {
							// Small modules that two or more pages share go into one file instead of one file
							// each. Left alone they came out as about 25 files under 1 KB, and a request costs
							// a network round trip however small it is. Large modules keep their own files, so
							// a page still does not download the heavy code of another one.
							groups: [{ name: 'shared', minShareCount: 2, maxModuleSize: 8000 }]
						}
					}
				}
			}
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					// One test file at a time in the browser: files share a single pointer and focus, so
					// parallel pages can disturb each other, and one Chromium stays within a modest memory budget.
					fileParallelism: false,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
