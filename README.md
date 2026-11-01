# SvelteKit take-home

A production-shaped SvelteKit slice: a public marketing surface (landing, blog, search) and an authenticated dashboard with a server-driven data table.

> Work in progress. This README grows with each stage; the final version will cover deployment, rendering choices, test commands and time spent.

## Stack

SvelteKit 3, Svelte 5 (runes), TypeScript, Tailwind CSS 4, Zod, Vitest, Playwright.

## Requirements

- Node.js >= 22.17
- npm

## Getting started

```sh
npm install
cp .env.example .env   # optional, see the file for variables
npm run dev
```

## Scripts

| Script                | What it does                                 |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Start the dev server                         |
| `npm run build`       | Production build                             |
| `npm run preview`     | Serve the production build                   |
| `npm run check`       | `svelte-check` (types for Svelte files)      |
| `npm run typecheck`   | `tsc --noEmit`                               |
| `npm run lint`        | Prettier check and ESLint                    |
| `npm run format`      | Format the project                           |
| `npm run test:unit`   | Vitest (watch mode; add `-- --run` for once) |
| `npm run e2e:install` | Install the Playwright browser               |
| `npm run test:e2e`    | Playwright end-to-end tests                  |

## Mock data

The provided files in [`mocks/`](mocks) are used as given: 20 posts (EN/DE), 220 campaigns, 3 demo users, tags and i18n dictionaries. They are read and validated on the server; nothing is fetched from external services. See [`mocks/README.md`](mocks/README.md) for their shape.

Demo accounts (password `demo1234`): `admin@demo.test`, `editor@demo.test`, `viewer@demo.test`.

## Adapters

The build uses `@sveltejs/adapter-node` locally and `@sveltejs/adapter-vercel` when the `VERCEL` environment variable is set.
