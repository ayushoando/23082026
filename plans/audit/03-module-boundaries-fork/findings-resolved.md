# Resolved — Module Boundaries & Fork Discipline

**Date:** 2026-09-01

- 3.2 (Med→Low, portal edge): portal pages no longer import `@planner/lib/projectsStore` directly — `site/features/site/portal/plannerProjectListing.ts` now owns the edge (`site/app/(site)/portal/page.tsx`, `site/app/(site)/portal/[id]/page.tsx` repointed).
- 3.3 (Low): `site/lib/observability/planner/` (4 modules) relocated to `site/lib/Planner/observability/`; all 5 referencing files repointed (2 site, 3 tests).
- 3.4 (Toast drift, Med): PlannerToast a11y upgrades backported to `StudioToast.tsx` (aria-live, role=alert/status, data-state, PhIcon, dismiss button) with `dismissToast` added to `studioUiStore`.
- 3.5 (IconButton drift, Low): `aria-pressed` unified to `!!active` in both forks (PlannerIconButton updated; size already unified at 18).
- Verified: `pnpm run scan:boundaries` — 1,024 files, 780 edges, zero cross-product; `pnpm run typecheck` clean; planner observability/validation suites 11/11 green.
