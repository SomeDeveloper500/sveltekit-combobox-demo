# ADR 0003: Rendering strategy per route

- Status: accepted
- Date: 2026-11-02, final 2026-11-03

## Context

The assignment asks for a deliberate choice of SSG, SSR, ISR, streaming or CSR for every route,
with a reason. The public pages are about content that changes only with a deploy (20 posts, two
languages); the dashboard is about per-user, mutable data. Search engines must see complete HTML
for the public pages, and the pages that depend on the URL query must stay shareable.

## Decision

| Route                            | Strategy                                                                  | Why                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/en`, `/de` (home)              | SSG (`prerender`, `entries` from the locale list)                         | No per-request data. Built once, served as a file.                                                                                                                                                                                                   |
| `/{lang}/blog/{slug}`            | SSG (`prerender`, `entries` = every slug in every locale, 40 pages)       | The post is static content and the pages most worth indexing, so they should be the fastest and cheapest to serve.                                                                                                                                   |
| `/{lang}/blog?page=n`            | SSR with `s-maxage=300, stale-while-revalidate=3600`                      | The query makes the set of URLs open-ended, so it cannot be prerendered. The CDN cache gives most of the benefit of static pages and a redeploy shows up within minutes. This is ISR-like behaviour on a CDN, not an ISR feature of the framework.   |
| `/{lang}/search?q&tag&sort&page` | SSR with `s-maxage=60, stale-while-revalidate=600`, `noindex, follow`     | Open-ended query space. Rendered on the server so results are in the HTML (works without JavaScript, shareable); a short cache absorbs repeated queries. Not indexed: our own result pages should not compete with the posts.                        |
| `/login`                         | SSR, `private, no-store`                                                  | The page depends on the visitor (it sends a signed-in one on), so no shared cache may hold it.                                                                                                                                                       |
| `/dashboard/*`                   | SSR, `private, no-store`; the list is streamed to client-side navigations | Per-user data behind a session. A client-side navigation gets the heading and filters at once and the table after a skeleton; a document request (no JavaScript, a crawler) waits for the data, because a streamed promise is delivered by a script. |
| Error pages, `[...rest]`         | SSR                                                                       | Rendered on demand, never cached as success.                                                                                                                                                                                                         |

### How pages are made canonical

A list URL has exactly one spelling: defaults are dropped, parameters are in schema order, a page
past the end is clamped. Any other spelling answers `308` with the canonical URL. Otherwise the
same list would be reachable at many addresses, which splits caches and search ranking.

### Pagination for the blog

Numbered pages (`?page=n`), not infinite scroll or a cursor. Every page has its own URL, so it
can be indexed, opened in a new tab and reached with the back button. The data is small and
static (four pages), which removes the main reason for a cursor (large, changing lists).
`rel="prev"`, `rel="next"` and a canonical that includes the page make the sequence explicit.

### Interactivity

Pages work as HTML and links first. The search form is a plain `GET` form that works without
JavaScript; with JavaScript it navigates in place and keeps focus. Nothing on a public page
needs client-only rendering (CSR).

## Consequences

- Posts and the home page are fast and cheap, but a content change needs a rebuild (acceptable:
  the content is files in the repository).
- The list pages depend on a CDN in front of the server for their cache headers to matter.
- **Prerendered pages are served as files and skip the `handle` hook, so on `adapter-node` they
  carry no security headers.** The hosting configuration has to set the same headers for them
  (see below).

## Resolved with the hosting decision

- **Headers for prerendered pages** are set by the host (`netlify.toml`, the same list as
  `src/lib/server/security.ts`), since those pages skip `handle`.
- **Streaming** is on the dashboard list, where a real query's latency is worth hiding; ADR 0005
  says where each route runs.
- Server-rendered HTML is compressed by the app itself (`src/lib/server/compress.ts`) wherever
  nothing in front of it does, which is the plain Node server.
