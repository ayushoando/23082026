# Updated findings — Module boundaries & fork discipline

**Date:** 2026-09-01

## Resolved
- None yet — remediation is in progress but nothing merged; source files were read, no edits made.

## Fixed along the way (discovered during remediation)
- None.

## Remaining (failures / open items)
- Plan action 1 (toast a11y drift): backport of aria-live / `role=alert` / dismiss button / PhIcon from `PlannerToast.tsx` to `site/components/Studio/StudioToast.tsx` — in progress, not merged.
- Plan action 2 (IconButton drift): unify `aria-pressed` coercion (`active` vs `!!active`) and icon size (18 vs 20) between `PlannerIconButton.tsx` and `StudioIconButton.tsx` — in progress, not merged.
- 3.2: shared-surface → product-namespace edge (`app/(site)/portal/page.tsx:9`, `app/(site)/portal/[id]/page.tsx:4` → `@planner/lib/projectsStore`) — in progress, not merged.
- 3.3: `site/lib/observability/planner/` (5 files) sits outside the `lib/Planner` namespace the boundary scanner owns — relocation in progress, not merged.
