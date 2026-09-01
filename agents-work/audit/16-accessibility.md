# 16 — Accessibility

**Overall: strong; the enforced bar is high.**

**The bar** (`tests/e2e/accessibility.spec.ts`): zero axe WCAG-2AA violations on the homepage, the full guest planner, and the export-menu panel; a keyboard-only journey through the toolbar (Draw activation, Save reachability); a `prefers-reduced-motion: reduce` run that keeps all workspace tools reachable.

## Verified in code

- Skip-link block with documented WCAG 2.4.1 rationale as first focusable element — `(site)/layout.tsx:51-59`.
- **Focus traps:** `site/components/ui/dialog.tsx` uses `react-aria-components` Modal/ModalOverlay/Dialog (built-in trap + restore); `MobileNavDrawer.tsx` additionally implements Escape handling and a manual Tab-cycle trap (lines 141–159) with initial focus to the close button (line 101).
- **44px tap targets:** token `--control_height-sm: 2.75rem` (=44px) at `focss/base/tokens/layout.css:23`; `mobile-tap-targets.css` applies ≥44px floors to links, icon buttons (`button[aria-label]` floor at line 122), footer/consent/catalog controls at ≤md; carousel dots get content-box padding expansion (lines 160–164).
- **Heading hierarchy:** exactly one `h1` per page view — verified across DownloadsPageView:244, PlanningPageView:232, ProductsPageView:218, ContactPageView:198, HomepageHero:212, ClientsHero:86, plus `sr-only` h1s in PlannerTopToolbar:147 / StudioTopToolbar:86; `SectionIntro` deliberately renders `h2` (`shared/SectionIntro.tsx:14-17`).
- **Alt/aria discipline:** `IconButton` enforces `aria-label` at the type level (`ui/IconButton.tsx:6-24`); decorative icons `aria-hidden`; carousel uses `role="region"` + `aria-roledescription="carousel"` (`ShowcaseCarousel.tsx:207-209`); raw `<img>` spots all carry alts (`ClientLogoArea.tsx:53`, `PortalPlanPageView.tsx:39`; decorative `alt=""` in `PlannerProjectsList.tsx:292`, `PlannerCatalogRail.tsx:247`).
- Global `:focus-visible` ring in `focss/base/document.css:66`.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 16.1 | Low | axe coverage limited to home + guest planner + export menu (4 scan targets total); PDP/catalog/contact-form surfaces — the largest interactive forms — have no automated axe scan. |
| 16.2 | Low | Manual focus trap in MobileNavDrawer coexists with the React Aria `Modal` it already imports (`MobileNavDrawer.tsx:7,141-159`) — two trap mechanisms in one component can drift. |
| 16.3 | Low | Tap-target floor list is an explicit allowlist (many `:where(…)` selectors); new link classes silently miss the 44px floor unless added (`focss/site/components/shared/mobile-tap-targets.css`). |
| 16.4 | Low (cross-ref) | StudioToast lacks PlannerToast's a11y upgrades (aria-live, role=alert, dismiss button) — see reports 03/17. |
