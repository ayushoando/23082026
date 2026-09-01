# Plan — DB Pending Migration, Worker Deploy & Red Release Gate

**Status:** not started (all actions owner-gated; nothing applied/deployed during the 2026-09-01 observation pass). **Source:** [findings.md](./findings.md)

## Objective

Close the three remediation items observed on 2026-09-01: 1 pending Admin migration, the still-undeployed worker Vectorize binding, and a red `release-gate.yml` on `main`.

## Actions (prioritized)

1. **High** Diagnose the `release:gate:core` failure before the next push: `gh run view 33527825017 --log-failed` (observed failing step: `Run pnpm run release:gate:core` on job `gate-full`), or reproduce locally with an authorized `pnpm run release:gate:core`. `main` must not be treated as green while 2 of the last 3 Release gate runs failed.
2. **High** Apply the one pending Admin migration — `pnpm run db:apply:admin` **after** re-running `pnpm run db:apply:admin -- --dry` (observed pending: `20260901120000_user_history_owner_rls.sql`). Then follow the runbook order (`OPERATIONS_RUNBOOK.md:77`): `pnpm run db:types:admin` → `pnpm run db:types` → `pnpm run typecheck`. Products side needs nothing (`db:apply -- --dry`: "none — all up to date"), though the 24.6 type-regen note in `plans/audit/24-platform-database/findings.md:21` can be retired in the same pass since the `svg_*_v2` tables are now confirmed present live.
3. **Med** Deploy the worker so the already-existing `catalog-nav` binding goes live — `pnpm run worker:deploy` (unblocked since CF-TOKEN-01 is resolved; see `plans/audit/worker-audit/handover.md`). Then verify per `OPERATIONS_RUNBOOK.md:58`: dead asset path → `200 image/png` with `x-oando-proxy: r2-fallback`; valid asset → `x-oando-proxy: r2`, and close out `handover.md` pending items 2–3.
4. **Low** Re-run the full deploy order from `OPERATIONS_RUNBOOK.md:35-45` (migrations → seed → code → `db:test`) once actions 1–2 land, so `db:test` output can be re-recorded as the post-migration baseline.

## Verification

- `pnpm run db:apply:admin -- --dry` prints `(none — all up to date)` after action 2.
- `pnpm run db:test` prints `✅` for both DBs with unchanged `catalog_products=143` / `oando_plans` rows (or an explainable delta after reseed).
- `gh run list --workflow=release-gate.yml --limit 3` shows `completed success` on `main` after action 1's fix.
- Runbook smoke checks (`OPERATIONS_RUNBOOK.md:58`) pass against the deployed worker after action 3.
