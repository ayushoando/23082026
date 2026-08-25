---
name: focss-css
description: Write CSS the FOCSS-on-Tailwind-v4 way for this repo. Use when editing files under site/focss, adding styles to product TSX, or touching postcss/tailwind config.
---

# FOCSS on Tailwind v4

FOCSS is a semantic-token layer ON TOP OF Tailwind v4, not a replacement.

## Rules
- Write against FOCSS semantic tokens and zone structure in product TSX, not raw
  utilities.
- Tailwind v4 provides the utility engine and `@reference`. PostCSS runs
  `@tailwindcss/postcss` (`config/build/postcss.config.mjs`).
- Four zone entries, one per surface: site, admin, planner, studio. No cross-zone
  imports. `site/focss/base/scan.css` starts with `@import "tailwindcss"` (site,
  admin, studio). Planner `entry.css` has its OWN `@import "tailwindcss"` and does
  not import `scan.css`.
- Class composition via `tailwind-merge` + `clsx`. Animations via `tw-animate-css`
  (CSS-imported, no TS import).
- Icons: each app's `PhIcon` + `phIconMap` (Phosphor). No inline SVG, no Lucide.

## Verify (repo root)
`pnpm run verify:focss` · `pnpm run lint:ui:strict` · `pnpm run check:style-tokens`

Detail: `docs/architecture/css.md`, `.github/instructions/focss.instructions.md`.
