---
inclusion: fileMatch
fileMatchPattern: "site/focss/**,site/components/**,site/app/**/layout.*,site/app/**/page.*,**/*.css,**/postcss*,**/tailwind*"
---

# UI & CSS Domain

## Stack
- Tailwind CSS v4 (utility-first, `@tailwindcss/postcss`)
- Focss (`site/focss/`) — project CSS architecture (`@focss/*` imports)
- `postcss.config.mjs` at `site/`
- `tailwind-merge` for class deduplication
- `tw-animate-css` for animation utilities
- `react-aria-components` for accessible primitives
- `framer-motion` / `gsap` for animation

## Conventions
- Never use inline styles for layout or spacing — use Tailwind utilities or Focss tokens.
- All responsive breakpoints follow mobile-first: default → `md:` (768) → `lg:` (1024) → `xl:` (1440) → `2xl:` (1920).
- Fixed widths are forbidden on content containers — use `max-w-*` with `w-full`.
- Images must use `next/image` with explicit `sizes` prop for responsive srcset.
- Touch targets: minimum 44×44px on interactive elements at ≤1024px.

## Checks (user-invoked only)
For an explicit UI/CSS validation request, run the applicable checks; do not run tests or gates automatically.
```
pnpm run verify:focss
pnpm run lint:ui:strict
pnpm run check:style-tokens
pnpm run check:ui-assets
```

## Viewport audit protocol
Test at: 1920w, 1440w, 1024w, 390w. Look for:
- Horizontal overflow (scrollbar at any width)
- Text truncation without `title` or tooltip
- Overlapping elements
- Missing responsive variants (stacked at mobile, grid at desktop)
- Container max-width respecting the viewport

## Graph-layer integration
Inspect imports and dependents directly from the live source tree before optional visual validation.
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.