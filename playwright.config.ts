import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const baseURL = `http://localhost:${PORT}`;

/**
 * The tests drive the production build served by the real adapter-node server, not the dev
 * server: cookies, CSRF checks, caching and prerendering behave as they will when deployed.
 *
 * `npm run build` runs before every full run. While working on the tests themselves, build once
 * and set `E2E_SKIP_BUILD=1`: the server then starts from the existing `build/` and a run costs
 * a browser and a server, not a whole build.
 *
 * The server sits behind no proxy here, so the tests send `x-forwarded-proto: http` themselves
 * and the server is told to trust it (`PROTOCOL_HEADER`); without it every form post is refused
 * as cross-site (see docs/DECISIONS.md, D-123). Edits live in the server's memory, so a test that
 * changes data puts it back.
 */
export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	// One server with shared in-memory data: tests that edit it must not run side by side.
	workers: 1,
	fullyParallel: false,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL,
		extraHTTPHeaders: { 'x-forwarded-proto': 'http' },
		trace: 'retain-on-failure'
	},
	// One baseline per snapshot, not one per operating system; see `e2e/visual.e2e.ts`.
	snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: process.env.E2E_SKIP_BUILD ? 'node build' : 'npm run build && node build',
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 240_000,
		env: {
			PORT: String(PORT),
			PROTOCOL_HEADER: 'x-forwarded-proto',
			SESSION_SECRET: 'e2e-only-secret-not-for-real-use',
			// Vitals are covered by their own tests; keep the beacon out of the runs.
			RUM_SAMPLE_RATE: '0'
		}
	}
});
