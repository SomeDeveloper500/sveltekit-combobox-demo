# ADR 0002: Data contract, validation boundaries and the mock data layer

- Status: accepted
- Date: 2026-11-02

## Context

The assignment ships JSON files (`posts`, `items`, `users`, `tags`) and asks us to treat them like a
real API: validate them, and implement filtering, sorting and pagination of the 220 campaign rows
on the server. State of the public search and the dashboard table must live in the URL. The
dashboard also needs a sign-in with real sessions, role-based access and a write path (changing a
status) whose failures the UI can tell apart (401, 403, 404, 409).

Data crosses a boundary in four places: JSON files at startup, the URL on every request, form
payloads on every write, and (later) the session cookie. Each one is untrusted input.

## Decision

### One contract, in Zod

- Every shape is a Zod schema in `src/lib/schemas` (`post`, `item`, `user`, `login`, `query`).
  Types come only from `z.infer`; there are no hand-written duplicates of an entity.
- The same schema runs wherever the data enters: the login schema on the client form and in the
  server action, the status schema on the edit form and the server action, the query schemas on
  every request.
- Schemas are strict about the data they describe (a post needs a translation for every locale,
  `endDate >= startDate`, URL-safe slugs and tags) and lenient about the URL (below).
- Schemas know nothing about `load` functions or the server, so they move to another project as is.

### The mock data layer

- `src/lib/server/data` holds one repository per collection, built by a factory
  (`createPostRepository(raw, rawTags)`, `createItemRepository(raw, { now })`,
  `createUserRepository(raw)`) and one ready instance built from the shipped JSON. The factory
  makes the logic testable with small, controlled data and keeps instances independent.
- **Validation at the boundary, once, at startup.** `parseCollection` checks every row against its
  schema, then uniqueness (ids, slugs, emails) and cross references (post tags exist in the tag
  taxonomy). A bad file throws a `DataValidationError` naming the file, the `[index].field` of the
  problem and the first five problems; no partial result is ever returned. A broken data file
  stops the server from starting instead of failing a user's request.
- **Static JSON import**, bundled into the server build, instead of reading files at runtime or
  calling a mock HTTP endpoint. It works on Node and on edge runtimes (no `fs`), costs no request,
  and is validated once. The price is that data changes need a rebuild, which is fine for fixtures.
- **Server-side querying.** `query()` filters, sorts and paginates on the server and returns the
  page together with `total`, `pages` and the page actually served. Search ignores case and accents
  (shared `normalize`, also used by the Combobox); names sort with `Intl.Collator` (numeric), post
  titles by locale, status by lifecycle; ties break on id so order never flickers between
  requests; a page past the end is clamped.
- **Writes live in memory** and are replaced, never mutated in place, so a page that was already
  returned stays consistent. They last as long as the server process, which is why the dashboard is
  planned for a long-lived Node runtime (see the later ADR on runtimes).

### The URL is input: parse, never trust, canonicalize

- Query schemas give every field a fallback (`catch`), so a stale or hand-edited URL renders the
  default instead of an error.
- `createQueryCodec(schema)` (`src/lib/query`) turns URL params into a typed query and back.
  `encode` is canonical: schema key order, defaults omitted. A route compares `canonical(url)`
  with the request and redirects when they differ, so `?page=1` and `?sort=bogus` never become
  duplicate URLs. `withQuery` builds links for state changes and returns to the first page when a
  filter changes. Repeated parameters resolve to the first value.

### Business rules are pure and shared

- `src/lib/domain` holds the status lifecycle (`draft → scheduled → active ⇄ paused → completed →
archived`, archived being terminal) and the role permissions. The server enforces them on every
  write; the client reads the same functions to offer only the moves that can succeed and to ask
  for confirmation before an irreversible one.
- `updateStatus(id, status, actor)` checks in a fixed order, so callers learn nothing they are not
  entitled to: unauthenticated (401), forbidden (403), not found (404), bad transition (409).
  Repeating the current status succeeds without changing the row.
- `authenticate` normalizes the email, compares the password in time that depends on length only,
  does one comparison even for an unknown email, and returns a session user without the password.
  The mock passwords are plaintext and the check is demo-grade, not a production design.

## Consequences

- A change to an entity is a change to one schema; types, form validation, server validation and
  tests follow from it.
- Bad data and bad URLs fail in different, intended ways: files stop the boot, URLs degrade to
  defaults, writes return a typed refusal.
- The routes that come next stay thin: parse the URL with a codec, call a repository, render.
- Module-level repositories hold state per server process. That is deliberate for the in-memory
  edits and is unsuitable for multi-instance or edge deployments without a real store.
- Validating at startup means the first import of a data module is where an error surfaces; in dev
  that is the first request that touches it.

## Alternatives considered

- **TypeScript interfaces plus ad-hoc checks**: types and validation drift apart, and nothing
  checks the files.
- **Reading JSON with `fs` at request time**: ties the data layer to Node and re-validates or
  skips validation.
- **A mock HTTP API or an embedded database (SQLite)**: closer to production, but adds moving
  parts and a runtime dependency that the assignment does not ask for.
- **Failing on a bad URL (400)**: correct but hostile to shared and old links; falling back keeps
  every link working, and canonical redirects keep the URL space tidy.
- **Checking permissions only in the route**: the rule would be easy to bypass from another call
  site; the repository refuses regardless of who calls it.
