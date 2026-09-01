# Handover — Admin Surface Audit Plan

**Date:** 2026-09-01 · **Status:** ✅ Closed — all 5 fixes applied and verified
**Owner:** Repository owner

## Completed tasks

- **ADM-FIX-01** — Studio auth gate: `requireAuthUser("/oostudio", "admin")` in `site/features/Studio/layout.tsx`.
- **ADM-FIX-02** — CRM feature gate: `site/app/admin/crm/layout.tsx` (new) renders "module off" unless the `adminCrm` flag is enabled.
- **ADM-FIX-03** — Audit log wiring: `site/lib/audit/logAdminAction.ts` (new), wired into catalog POST/PATCH/DELETE, features PATCH, themes publish.
- **ADM-FIX-04** — Analytics sample-data banner in `AdminAnalyticsPageView.tsx`.
- **ADM-FIX-05** — Production catalog DB error guard in `catalogAdminHandlers.ts` `listStandardCatalog`.

## Files modified

`site/app/admin/crm/layout.tsx` (new) · `site/lib/audit/logAdminAction.ts` (new) · `site/app/api/admin/catalogs/[type]/route.ts` · `site/app/api/admin/catalogs/[type]/[id]/route.ts` · `site/app/api/admin/features/route.ts` · `site/app/api/admin/themes/publish/route.ts` · `site/features/admin/analytics/AdminAnalyticsPageView.tsx` · `site/features/admin/api/catalogAdminHandlers.ts`.

## Verification evidence

- `pnpm run typecheck` — clean.
- Full two-lane suite green (2026-09-01): 715/715 files (4088 tests) — includes `catalogAdminHandlers.test.ts`, admin route tests, `adminApiGuards`.
- `pnpm run gate:fast` — full chain green (2026-09-01), including the admin priority tests.

## Blockers / out-of-scope

- CRM remains a localStorage demo by design; real persistence is a separate product decision.

## Ownership confirmation

- Only admin-surface and shared audit-log paths touched; no unrelated files modified.
