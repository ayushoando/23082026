# Updated findings — 36-db-worker-ci

**Date:** 2026-09-01

## Resolved
- CF-TOKEN-01: resolved — `npx wrangler vectorize list` now succeeds (wrangler 4.127.1) and shows the catalog-nav Vectorize index exists (768 dims / cosine, created 2026-09-01T03:25:03Z). The handover's index-creation step is already satisfied; this session did not create the index and did not deploy (deploy stays owner-gated).
- DB state verified 2026-09-01 (read-only + dry-run only, nothing applied): `db:test` exit 0 — Products DB reachable (6 tables present, `catalog_products=143`, 0 pending migrations per `db:apply -- --dry` "none — all up to date"); Admin DB reachable (`audit_events`, `oando_plans`); Supabase HTTP env vars present for both projects.

## Fixed along the way (discovered during remediation)
- none (observation pass; no migrations applied, no deploys, no index creation — the index already existed)

## Remaining (failures / open items)
- Admin pending migration: apply `20260901120000_user_history_owner_rls.sql` via `pnpm run db:apply:admin` — owner action, dry-run first (dry-run already done 2026-09-01); then `db:types:admin` → `db:types` → `typecheck` per runbook order.
- Worker deploy: `pnpm run worker:deploy` + runbook smoke verification (dead asset → `200 image/png` with `x-oando-proxy: r2-fallback`; valid asset → `x-oando-proxy: r2`) — owner-gated; the `catalog-nav` binding is still undeployed.
- CI to green: release-gate.yml red on main — 2 of the last 3 Release gate runs failed (job `gate-full` at `Run pnpm run release:gate:core`; newest run in_progress at observation time). Diagnose via `gh run view 33527825017 --log-failed` or an authorized local `release:gate:core` run; main must not be treated as green until fixed.
