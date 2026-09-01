# Handover — Database & Migrations Audit Plan

**Date:** 2026-09-01 · **Status:** ✅ Closed — no remedy required; deployment checks observed
**Owner:** Repository owner

## Completed tasks

- Audit only (recount 2026-09-01: **43 Products + 21 Admin = 64** migrations; the original claim "44 + 20 = 64" overcounted by one — actual at audit time was 63. Rollback coverage now complete: the 8 Admin files that lacked it received real commented reverse-SQL rollback sections on 2026-09-01; RLS everywhere; two-DB ownership clean).
- Deployment-readiness checks executed 2026-09-01 with owner authorization:
  - `pnpm run db:apply -- --dry` → **"all up to date"** (Products).
  - `pnpm run db:apply:admin -- --dry` → **"all up to date"** (Admin).
  - `pnpm run db:test` → ✅ Products connection (143 `catalog_products`), ✅ Admin connection (`oando_plans` reachable, 2 rows), ✅ HTTP env vars present for both Supabase projects.
  - `pnpm run seed:furniture` → 16 specs, 17 already present, **nothing to do**.
- Addendum (later 2026-09-01): the `db:apply:admin --dry` "all up to date" output above predates `20260901120000_user_history_owner_rls.sql` (SEC-R08 owner-scoped RLS on `public.user_history`, authored 2026-09-01 with a `-- rollback` section). It is **not yet applied** — apply dry-first during deploy prep. Governance: P4 real debt now 0; baseline file still records 8 (re-record pending).

## Files modified

None (no migrations created or applied; no schema changes required by this audit).

## Blockers / out-of-scope

- Suggested (non-blocking): add `rate_limits` to the Drizzle schema and regenerate types to remove the acknowledged cast in `rateLimit.ts`.
- SEC-R08 (tracking table anon key + RLS migration) lives under `../seosec/`: migration `20260901120000_user_history_owner_rls.sql` authored 2026-09-01 (rollback included) and `site/app/api/tracking/route.ts` now forwards the visitor token via `createSupabaseAuthAnonClient(token)`; applying it is the next migration work — authorized dry-first `db:apply:admin` still pending.

## Ownership confirmation

- No repository files modified under this plan.
