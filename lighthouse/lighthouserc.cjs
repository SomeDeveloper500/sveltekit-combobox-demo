/**
 * Lighthouse CI against the production build served by the real server (`node build`).
 * Started by `lighthouse/run.mjs`, which says which target to measure (`LIGHTHOUSE_TARGET`) and, for the
 * dashboard, hands over the session cookie (`LIGHTHOUSE_COOKIE`); see there for why. The names
 * avoid the `LHCI_` prefix, which Lighthouse CI reads as its own command-line options.
 *
 * Lighthouse's default is its mobile profile (a mid-range phone, slow 4G, 4x CPU slowdown), which is
 * what the brief asks for. Each page is measured three times and judged by the median run.
 *
 * The thresholds are the brief's: every category at 0.95 or better, LCP under 2.0 s and CLS under
 * 0.1. INP needs a person to interact, which a lab run does not do; Total Blocking Time is its lab
 * stand-in, held to 200 ms (the same limit INP is judged by), and the real INP is reported by the
 * RUM beacon.
 */
const PORT = process.env.PORT;
const base = `http://localhost:${PORT}`;
const target = process.env.LIGHTHOUSE_TARGET;
const POST = 'sub-second-lcp-on-a-content-site';

const URLS = {
	public: [`${base}/en`, `${base}/en/blog/${POST}`],
	dashboard: [`${base}/en/dashboard/items`]
};
if (!URLS[target]) throw new Error(`Unknown Lighthouse target "${target}"`);

const settings = { chromeFlags: '--no-sandbox' };
if (process.env.LIGHTHOUSE_COOKIE)
	settings.extraHeaders = { Cookie: process.env.LIGHTHOUSE_COOKIE };

// The dashboard is private on purpose (`noindex`, and disallowed in robots.txt), so the SEO category
// would fail it for being "blocked from indexing", which is the point. Public pages are held to it.
const categories = [
	'performance',
	'accessibility',
	'best-practices',
	...(target === 'public' ? ['seo'] : [])
];

const score = ['error', { minScore: 0.95, aggregationMethod: 'median-run' }];
const atMost = (maxNumericValue) => ['error', { maxNumericValue, aggregationMethod: 'median-run' }];

module.exports = {
	ci: {
		collect: {
			url: URLS[target],
			numberOfRuns: 3,
			startServerCommand: 'node build',
			startServerReadyPattern: 'Listening on',
			startServerReadyTimeout: 60000,
			settings
		},
		assert: {
			assertions: {
				...Object.fromEntries(categories.map((name) => [`categories:${name}`, score])),
				'largest-contentful-paint': atMost(2000),
				'cumulative-layout-shift': atMost(0.1),
				'total-blocking-time': atMost(200)
			}
		},
		upload: { target: 'filesystem', outputDir: `.lighthouseci/${target}` }
	}
};
