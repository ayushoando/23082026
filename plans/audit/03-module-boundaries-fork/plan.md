# Plan — Module Boundaries & Fork Discipline

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Fix the three boundary soft spots and reconcile the highest-drift fork pairs while keeping the zero-cross-import fork discipline intact.

## Actions (prioritized)
1. **Med** Backport `PlannerToast.tsx` a11y upgrades (aria-live, `role=alert`, dismiss button, PhIcon) to `StudioToast.tsx` under `site/components/{Planner,Studio}/`.
2. **Low** Reconcile `PlannerIconButton.tsx` vs `StudioIconButton.tsx` — unify `aria-pressed` coercion (`active` vs `!!active`) and icon size (18 vs 20) in `site/components/{Planner,Studio}/`.
3. **Low** Remove the shared-surface → product-namespace edge: `site/app/(site)/portal/page.tsx:9` and `site/app/(site)/portal/[id]/page.tsx:4` import `@planner/lib/projectsStore` — extract the shared read logic or route it through a portal-owned module.
4. **Low** Relocate `site/lib/observability/planner/` (5 files) into the `site/lib/Planner/` namespace the boundary scanner owns, and update its Planner-owned importers.

## Verification
- `node scripts/scan-boundaries.mjs`, `pnpm run typecheck`, `pnpm run test` — gate runs require owner authorization.
