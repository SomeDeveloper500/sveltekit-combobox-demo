# ADR 0004: Open Graph images are rendered at build time

- Status: accepted
- Date: 2026-11-02

## Context

Every blog post needs a social preview image (`og:image`, `twitter:image`, `Article.image`). The
assignment leaves the method open: an edge function, `satori`, or pre-rendered images, with the
choice justified. There are 20 posts in two languages, so 40 images. The content is files in the
repository and changes only with a deploy.

## Options

1. **Render on request in an edge function** (`@vercel/og` or satori on an edge runtime). Always
   current and could carry dynamic data, but costs a cold start and compute per cache miss, ties
   the images to one host's runtime, and needs the WASM variant of the libraries.
2. **Render on request on the Node server.** Same cost per miss, plus a native module in the
   running server.
3. **Render while the site is built** (a prerendered endpoint). The image exists as a file next to
   the page it belongs to; there is nothing to run, cache or scale afterwards.
4. **Draw them by hand and commit the files.** No code, but they go stale the moment a title
   changes and nobody keeps them in step.

## Decision

Option 3. `/{lang}/blog/{slug}/og.png` is a prerendered `+server.ts` route listed by `entries`,
exactly like the post page. It draws a card with `satori` (markup to SVG) and `@resvg/resvg-js`
(SVG to PNG).

- The card is plain data: `ogCardMarkup` in `src/lib/seo/og.ts` returns the element tree and is
  unit-tested (size, colours, order, contrast). Rendering lives in `src/lib/server/og/render.ts`.
- Both libraries are imported dynamically and never run in the deployed server: the route is
  prerendered, so the request path serves a file. They are regular `dependencies` so the bundler
  leaves the native module alone.
- The page references the image with an absolute URL built from `SITE_URL`, with its pixel size,
  and the same URL goes into the `Article` JSON-LD.
- The design is deliberately plain: the post's cover colour as background, text colour chosen by
  WCAG contrast, site name, title, author and date. No images, nothing to license.

### Fonts

satori cannot read `.woff2` and has no system fonts, so Inter (SIL Open Font License, licence file
next to the fonts) is committed as `.woff`. Two subsets are needed: `latin` for English and German,
and `latin-ext` for names such as "Dvořák". satori falls back to another font only along a
`font-family` list, not between fonts of the same name, so the extension is registered as
`Inter Ext` and listed second.

## Consequences

- No runtime cost, no cold start, nothing host-specific: it works the same on Node and on any
  static host. The price is that a changed title needs a rebuild, which is also how the page
  itself changes.
- The build needs a native binary of resvg for the build machine's platform. `npm ci` installs the
  right one; a platform without a prebuilt binary would need the WASM build instead.
- Building adds a second or two for 40 images. Shared fonts are read once.
- Images are about 25 KB each (1.1 MB in total), served as files.
- If posts ever carry dynamic data (view counts, a user's name), this decision should be revisited
  in favour of option 1 for those pages only.
