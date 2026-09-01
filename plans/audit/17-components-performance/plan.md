# Plan — Component Quality & Performance

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Shrink the workspace/marketing bundles and bring the Planner god component and its Studio fork back under maintainable limits.

## Actions (prioritized)
1. **High** Split `site/components/Planner/Planner.tsx` (3,387 lines) by concern (undo/redo, snap, walls, BOQ, analytics) and add a local error boundary around the canvas.
2. **High** Reconcile the ~24-file Planner/Studio parallel fork into a shared core (pair inventory in report 03), starting with the verified drift: StudioToast a11y and IconButton behavior.
3. **Med** Add route-level `error.tsx` under `app/admin/`, `app/ooplanner/`, `app/oostudio/` so canvas/admin crashes don't fall to root `global-error.tsx`.
4. **Med** Lazy-load gsap with `next/dynamic` across the ~28 statically importing route views, starting with `site/components/about/AboutPageView.tsx:6` and `app/(site)/quote-cart/page.tsx:7`; make `lib/helpers/gsapMotion.ts` wrap loading, not just config.
5. **Med** Dynamically import `jspdf` at export time (`site/components/Planner/plannerExporters.ts:2`, `site/components/Studio/studioExporters.ts:2`) and `fabric` (`site/components/Planner/Planner.tsx:25`, `site/components/Studio/Studio.tsx:8`); render `<Planner>` via `next/dynamic` from `site/components/Planner/PlannerEntry.tsx:3,49`.
6. **Med** Remove wholesale `"use client"` from leaf primitives where the only client source is framer-motion/gsap: `site/components/ui/Button.tsx:1`, `site/components/ui/Logo.tsx:1`, `site/components/ui/MarketingCta.tsx:1`, `site/components/shared/SectionIntro.tsx:1`.
7. **Low** Delete dead `site/components/home/Hero.tsx` (204 lines, zero importers) — user-confirmed deletion required; drop its 4 stale findings from `config/quality/style-token-baseline.json`.

## Verification
- `pnpm run build:site` — measured bundle delta; `typescript.ignoreBuildErrors: false` enforced (`config/build/next.config.js:400-407`); owner authorization required.
- `pnpm run gate:fast` and `pnpm run test` — owner authorization required.
