# ADR 0001: Design tokens, theming and state management

- Status: accepted
- Date: 2026-11-01

## Context

The UI needs a light and a dark theme, a small primitive library (`src/lib/ui`) that can be
reused in other projects, and a stated approach to state. Tailwind 4 keeps its configuration in
CSS, and Svelte 5 offers runes (`$state`, `$derived`, `$props`) instead of the older store API.

## Decision

### Tokens and theming

- Colors, radii, shadows and fonts are **semantic tokens** defined once in `src/app.css`:
  CSS variables per theme (`:root` and `:root[data-theme='dark']`), exposed to Tailwind through
  `@theme inline` (`bg-surface`, `text-muted`, `border-line-strong`, `bg-primary`, ...).
  Components never use raw palette classes such as `bg-blue-500`.
- Light and dark are a **swap of the variables**, not parallel `dark:` class lists. The theme is
  the `data-theme` attribute on `<html>`; `@custom-variant dark` exists for the rare exception.
- An inline script in `app.html` sets the attribute before first paint (a saved choice wins over
  `prefers-color-scheme`), so there is no flash of the wrong theme.
- Two border tokens: `line` for decorative dividers and `line-strong` for control borders, which
  must reach 3:1 contrast (WCAG 1.4.11). Text and status pairs were checked for 4.5:1 in both
  themes.
- Fonts are the system stack: no web-font requests, no layout shift.

### Primitives

- Plain components with typed props and explicit variant maps (full class strings, so Tailwind
  can see them). `class` is accepted for layout (margins, width) only; variants that need a
  different shape are props (`Skeleton radius`, `Card padding`), because competing utilities such
  as `rounded-md` and `rounded-full` are resolved by stylesheet order, not by class order.
- `src/lib/ui` imports nothing from the product domain, so it can move to another project.
- No `tailwind-merge`, `cva` or UI kit: the variant surface is small and the dependency would
  only paper over override conflicts.

### State

- Component state uses runes: `$state` / `$derived` locally, `$bindable` for form controls.
- State shared by a subtree (the toast queue) is a **class with `$state` fields, created in the
  root layout and passed through context** (`provideToasts` / `getToasts`).
- No module-level singletons and no `svelte/store`. A module-level `$state` on the server is
  shared by every request; context gives each app instance its own store.
- The theme itself is not reactive state: it is a DOM attribute plus `localStorage`, read by the
  inline script, so it works before hydration.

## Consequences

- A new color or theme only touches `app.css`; components do not change.
- Dark-mode regressions are caught by checking token pairs, not every component.
- Callers cannot restyle a primitive by overriding utilities; they extend the component or add a
  prop. This is deliberate and keeps primitives predictable.
- Anything that needs shared state must live under the layout that provides it; reading it
  elsewhere throws a clear error.

## Alternatives considered

- **`dark:` variants on every class**: doubles the class lists and drifts out of sync.
- **A global `svelte/store` or module singleton for toasts**: simpler, but leaks state between
  requests on the server.
- **`tailwind-merge` + `cva`**: solves override conflicts, at the cost of a dependency and a
  second styling API; revisit if the variant surface grows.
