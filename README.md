# SvelteKit take-home

A production-shaped SvelteKit slice: a public marketing surface (landing, blog, search) in English and German, and an authenticated dashboard with a server-driven data table and inline editing.

**Live site:** _add the Netlify URL here after the first deploy_

**Demo accounts** (password `demo1234` for all): `admin@demo.test` and `editor@demo.test` may change a campaign's status; `viewer@demo.test` is read-only.

## What is in it

- **Public:** landing page, blog with numbered pages, full-text search with tag and sort. The state of every list is in the URL (shareable, back button works), and the pages work without JavaScript. Posts and the home page are prerendered; OG images are drawn at build time.
- **Dashboard** (behind a login): a table of 220 campaigns with server-side pagination, sorting and filters, URL-synced; the status of a campaign can be edited in place with an optimistic update that rolls back when the server refuses (invalid move, no permission, lost connection, ended session), and a confirmation for moves that cannot be undone.
- **Primitives** written from scratch (no UI kit): button, inputs, select, an accessible combobox (ARIA 1.2), dialog on the native `<dialog>`, toasts, data table, pagination.
- **Quality gates:** unit and browser tests, Playwright end-to-end tests with axe, Lighthouse CI thresholds, a JavaScript budget per route, all wired into CI.
- **Observability:** `web-vitals` (LCP, INP, CLS, TTFB) with sampling, and client error reporting, sent to one beacon endpoint.

## Stack

SvelteKit 3, Svelte 5 (runes), TypeScript, Tailwind CSS 4, Zod 4, Vitest, Playwright, axe-core. Hosted on Netlify (Node functions plus one edge function).

## Requirements

- Node.js >= 22.18 (the build imports TypeScript route params with Node itself, which needs built-in type stripping)
- npm

## Getting started

```sh
npm install
cp .env.example .env   # optional, see the file for variables
npm run dev
```

### Environment variables

| Variable          | Meaning                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SESSION_SECRET`  | Signs the session cookie. At least 16 random characters. **Required in production** (the server refuses to start without it); development falls back to a demo key. |
| `SITE_URL`        | Public address, no trailing slash (canonical and hreflang URLs, sitemap). Read at build time.                                                                       |
| `RUM_SAMPLE_RATE` | Share of page loads (0 to 1) that report web vitals. Default 0.1; development always samples. Errors are always sent.                                               |

Behind a proxy that does not terminate HTTPS for the app, set `PROTOCOL_HEADER=x-forwarded-proto` for `adapter-node` or every form post is refused as cross-site.

## Scripts

| Script                | What it does                                                 |
| --------------------- | ------------------------------------------------------------ |
| `npm run dev`         | Start the dev server                                         |
| `npm run build`       | Production build                                             |
| `npm run preview`     | Serve the production build                                   |
| `npm run check`       | `svelte-check` (types for Svelte files)                      |
| `npm run typecheck`   | `tsc --noEmit`                                               |
| `npm run lint`        | Prettier check and ESLint                                    |
| `npm run test:unit`   | Vitest (watch mode; add `-- --run` for once)                 |
| `npm run e2e:install` | Install the Playwright browser                               |
| `npm run test:e2e`    | Playwright end-to-end and accessibility tests (builds first) |
| `npm run lighthouse`  | Lighthouse CI on the production build (needs Chrome)         |
| `npm run size`        | JavaScript budget per route (run after `npm run build`)      |

`E2E_SKIP_BUILD=1 npm run test:e2e` runs the tests on an existing build. A pre-commit hook (Husky and lint-staged) formats and lints staged files.

## Tests

- **Unit and component tests** (Vitest, 740+): schemas, query codecs, repositories, hooks, sessions, the optimistic-update logic, and every UI primitive in a real Chromium via `vitest-browser-svelte`.
- **End-to-end** (Playwright, about 60): a visitor searching and reading a post (also without JavaScript), signing in and out, editing a status with rollback on a refused move and on a dropped connection, a keyboard user keeping their place while sorting, and **axe** on 11 public pages (light and dark) and 8 dashboard states, failing on serious or critical findings. They run against the production build served by the real Node server.
- **Lighthouse CI** (mobile profile, three runs, median): every category at 0.95 or better, LCP under 2.0 s, CLS under 0.1, Total Blocking Time within 200 ms (the lab stand-in for INP; the real INP comes from the beacon). Measured here: Performance 0.98 to 0.99, other categories 1.0, LCP 1.7 s, CLS 0.
- **JavaScript budget** (`size-limit`, gzip, initial JavaScript of a route): public pages 80 KB, dashboard 100 KB. Measured: 61 to 65 KB and 61 to 69 KB.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit, build, Playwright, Lighthouse and the size check in that order. The visual snapshot test is skipped in CI: its baseline image is made on Windows and a Linux runner draws the fonts differently.

## Architecture in short

- **One source of truth for shapes:** Zod schemas in `src/lib/schemas` describe the data, the URL query and the forms; the same schema runs in the browser and on the server where both need it. Heavy validation stays out of the JavaScript every page downloads (see the budget).
- **The URL is the state** of every list. A list URL has one spelling; anything else redirects to it.
- **General-purpose code does not import the domain:** `src/lib/ui`, `schemas`-level helpers, `api`, `query` and `rum` know nothing about posts or campaigns.
- **Auth:** a signed session cookie (HMAC on Web Crypto, so it runs on Node and on the edge), the guard lives in `handle`, scripts get `401`, browsers get a redirect.
- **Decisions are written down** in [`docs/adr`](docs/adr): design tokens and state (0001), data contract (0002), rendering strategy per route (0003), OG images (0004), where each route runs and why (0005), RUM and error reporting (0006).

## Deployment

The app is deployed to Netlify. The server side runs as Node functions (rendering, sessions, the dashboard); `POST /api/vitals` runs as an edge function, with the reasons in [ADR 0005](docs/adr/0005-runtimes-and-hosting.md). To deploy your own copy:

1. Create a Netlify site from the repository (the build settings come from `netlify.toml`).
2. Set `SESSION_SECRET`, `SITE_URL` and, if you like, `RUM_SAMPLE_RATE` in the site's environment variables.
3. Deploy. The beacon's events appear in the function logs.

Any host that runs `node build` works too (`@sveltejs/adapter-node` is used outside Netlify); then put compression and a rate limit in front, as the notes below say.

## Trade-offs and known limits

- **Data is in memory.** Campaign edits live in the memory of the server instance that took them; a cold start or another instance shows the seeded data again. Fine for mock data, the repository sits behind one interface so a database can replace it (ADR 0002, 0005).
- **No rate limit** on login or the beacon (instances share no memory to count in); a platform-level limit is the right place.
- **No Content-Security-Policy yet.** It needs nonces for the inline theme script and a decision about inline styles; the other security headers are set (including for prerendered pages).
- **Sessions are stateless cookies**, so signing out ends the browser's session but does not revoke a copied cookie before it expires (seven days).
- **Lab INP is not measured** (it needs a person); Total Blocking Time stands in for it and the beacon reports the real value.
- **The visual snapshot is Windows-only** (see Tests).

## Time spent

_To fill in by the author before sending: total hours, and roughly how they split._
