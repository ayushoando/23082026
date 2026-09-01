# 17 — Component Quality & Performance

**Overall: the weakest area of the codebase.**

## Oversized files (>500 lines)

| File | Lines |
|---|---|
| `site/components/Planner/Planner.tsx` | **3,387** — god component: 40+ imports, 10 composed hooks, portals, undo/redo, snap, walls, BOQ, analytics all inline |
| `site/components/Studio/Studio.tsx` | 1,562 |
| `site/components/site/Header.tsx` | 578 |
| `site/components/shared/ContactTeaser.tsx` | 576 |
| `site/components/contact/CustomerQueryForm.tsx` | 499 |
| `site/components/products/ProductsPageView.tsx` | 480 |
| `site/components/site/MobileNavDrawer.tsx` | 471 |

Stores are healthy (4 zustand files, all ≤92 lines); hooks well-factored (18 files, max 405).

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 17.1 | **High** | `Planner.tsx` at 3,387 lines is far beyond maintainable and has no local error boundary (`site/components/Planner/Planner.tsx`). |
| 17.2 | **High** | ~24-file Planner/Studio parallel fork with no shared core package — every bugfix must land twice (see report 03 for the pair inventory and verified drift). |
| 17.3 | **Med** | No route-level `error.tsx` in `app/admin/`, `app/ooplanner/`, `app/oostudio/` — a render crash inside the 3.4k-line canvas or admin shell falls to root `global-error.tsx`, losing all chrome with no recovery path (glob: only `(site)/error.tsx` and `(site)/products/error.tsx` exist). |
| 17.4 | **Med** | Leaf UI primitives marked `"use client"` wholesale (`ui/Button.tsx:1`, `ui/Logo.tsx:1`, `ui/MarketingCta.tsx:1`, `shared/SectionIntro.tsx:1`) — client-ness comes only from framer-motion/gsap; 153/193 component files are client; hydration cost pushed to every marketing page. |
| 17.5 | Low | Dead code: `site/components/home/Hero.tsx` (204 lines, h1-bearing, zero importers) still carried in the style-token baseline (4 findings). See report 05. |
| 17.6 | Low | Mojibake in source comment ("â€”" for em-dash) — encoding drift (`components/about/AboutPageView.tsx:54`). |

## Performance

| # | Severity | Finding |
|---|----------|---------|
| 17.7 | **Med** | **gsap statically imported in ~28 route-level views** (no `next/dynamic`) — GSAP + ScrollTrigger lands in the JS bundle of about, contact, products, solutions, career, service, showrooms, downloads, planning, sitemap, trusted-by, sustainability, clients, compare, legal, quote-cart, access, offline, PDP ProductViewer, admin dashboard, … (`components/about/AboutPageView.tsx:6`, `(site)/quote-cart/page.tsx:7`, `access/AccessSignInView.tsx:7`, `features/site/catalog/ProductViewer.tsx:6`, +22 more). Shared helper `lib/helpers/gsapMotion.ts` wraps config only, not loading. |
| 17.8 | **Med** | **jspdf statically bundled** into workspace first load (`Planner.tsx:113` → `plannerExporters.ts:2`); same for Studio (`Studio.tsx:60` → `studioExporters.ts:2`) — could be dynamically imported at export time. |
| 17.9 | **Med** | **fabric statically imported** in `Planner.tsx:25` / `Studio.tsx:8`; `PlannerEntry` renders `<Planner>` directly with no dynamic import (`PlannerEntry.tsx:3,49`). |
| 17.10 | **Med** | Only 2 `next/dynamic` usages in the entire app (`HomeDeferredSections`, `DynamicBotWrapper`) — dynamic loading is the exception, not the tool (aggregate of 17.7–17.9). |
| 17.11 | Low | Homepage partially mitigated: below-fold sections are `next/dynamic` chunks with ssr (`components/home/HomeDeferredSections.tsx:11-41`). (positive) |
| 17.12 | Low | **Images unoptimized in production by default:** `useUnoptimizedImages` resolves `true` when `VERCEL_ENV === "production"` (COST-S01) — next/image emits raw URLs, relying on pre-optimized CDN assets (`config/build/next.config.js:31-37,392-399`). Documented, deliberate. |
| 17.13 | Low | Remaining raw `<img>`: 6 spots — all lazy thumbnails with valid alt text (`PortalPlanPageView.tsx:37`, `ClientLogoArea.tsx:51`, `PlannerProjectsList.tsx:292`, `PlannerCatalogRail.tsx:247`, `PlannerAutoArrangeDialog.tsx:174`, `InlinePlanSymbolPreview.tsx:22`). |
| 17.14 | Info (positive) | `optimizePackageImports` for `@phosphor-icons/react` + `framer-motion`; `typescript.ignoreBuildErrors: false` enforced (`config/build/next.config.js:400-407`). |
