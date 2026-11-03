# ADR 0006: Real-user monitoring and error reporting

- Status: accepted
- Date: 2026-11-03

## Context

The assignment wants real RUM with `web-vitals` sent to a beacon endpoint, sampling logic, and
client-side error reporting wired to the same beacon. The endpoint may only log; the wiring must
be real. Lab numbers (Lighthouse in CI) cannot measure INP, which needs a person.

## Decision

- **One endpoint, one batch format.** `POST /api/vitals` takes `{ events: [...] }` (1 to 20
  events), each a `vital` (LCP, INP, CLS, TTFB) or an `error`. The whole batch is validated with
  Zod and refused with `400` if any event is wrong; nothing is half-used. Unknown fields are
  dropped, sizes are capped, and a path may not carry a query or fragment (a URL can hold a
  search term or a token). Events are logged as one JSON line each.
- **Sampling once per page load**, not per metric, so the metrics of one visit stay together.
  `RUM_SAMPLE_RATE` (default 0.1, always 1 in development). Errors are never sampled, but the same
  error is sent once and a page sends at most five distinct ones.
- **Sending.** Vitals are held (the latest value per metric; CLS and INP revise themselves) and sent
  in one batch when the page is hidden or closing, with `sendBeacon` and a `keepalive` fetch as the
  fallback. Errors go at once, since a crashed page may not live to a later flush.
- **Where errors come from:** SvelteKit's `handleError` client hook (it also gives the error page a
  reference to show), `window.error`, and `unhandledrejection`. SvelteKit's own boundary catches
  render errors of pages and layouts first and routes them to that hook, so no second
  `<svelte:boundary>` is added.
- **A metric's path is the page its load began on**; client-side navigation does not start a new
  load. INP and CLS arrive more than once with the same id: a consumer keeps the last one.
- **The collector must not weigh on the page**: `web-vitals` is loaded when the browser is idle,
  and the collector imports no validation library (it would add 24 KB gzip to every page).

## Consequences

- The endpoint only logs. A real deployment forwards the events from `receiveBeacon` to a metrics
  store and an error tracker; the seam is one function.
- There is no server-side rate limit (see ADR 0005).
- Lab thresholds use Total Blocking Time as the stand-in for INP; the real INP comes from here.
