# ADR 0005: Where each route runs, and where it is hosted

- Status: accepted
- Date: 2026-11-03

## Context

The assignment asks for at least one route on an edge runtime and at least one on Node, with the
reason for each. `@sveltejs/adapter-vercel` 7 offers Node functions only (its options list
`nodejs22.x` and newer, no edge runtime), so Vercel could not meet the requirement. Netlify runs
SvelteKit on Node functions and also runs standalone edge functions in front of them, in one site.

## Decision

Netlify, with two runtimes.

| Route / part                                        | Runtime                             | Why                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/en`, `/de`, `/{lang}/blog/{slug}`                 | Static files (prerendered at build) | No runtime at all: nothing to cold-start, served from the CDN.                                                                                                                                                                                                                                    |
| OG images `/{lang}/blog/{slug}/og.png`              | Static files (prerendered at build) | `satori` and `@resvg/resvg-js` are native, heavy dependencies; running them in a function would cost cold-start time and bundle size for images that never change (ADR 0004).                                                                                                                     |
| `/blog`, `/search`, `/login`, `/dashboard/*`, forms | **Node** functions                  | They render per request, read the session cookie, and use the in-memory repository. Node keeps the full SvelteKit server, Web Crypto sessions and the data layer working unchanged, with predictable cold starts for a small bundle.                                                              |
| `POST /api/vitals` (web-vitals and error beacon)    | **Edge** function (Deno)            | It keeps no state, reads no cookie, touches no data and needs only web APIs plus one Zod validation. Every page of every visitor sends it, and it answers `204`, so the nearest edge location can reply at once and the browser never waits on the app's region. Cold start at the edge is small. |

The edge function (`netlify/edge-functions/vitals.ts`) imports the same `receiveBeacon` the Node
route uses. The SvelteKit route stays, so the endpoint also exists on any other host and in the
tests; on Netlify the edge function is matched first.

## Consequences

- **Data is in memory per function instance.** The campaign list is seeded from the mock files on
  each cold start, and a status change lives only in the instance that served it. Another instance
  (or the next cold start) shows the original data. That is acceptable for a demo built on mock
  data and is the reason the dashboard is on Node rather than on isolates that come and go; a real
  product puts a database behind the repository (ADR 0002 keeps it behind one interface).
- **No rate limit** on the login or on `/api/vitals`: instances share no memory to count in. Put a
  platform rate limit in front for real traffic.
- The edge function runs Deno, so the files it shares with the app are imported with relative
  paths and extensions, and `zod` is mapped in `netlify/edge-functions/import_map.json`. A test
  covers the handler in Node, but the first deploy is the first time it runs in Deno.
- Switching hosts means changing the adapter (`vite.config.ts` picks it from `NETLIFY`); the plain
  Node adapter runs the same app anywhere with `node build`.
