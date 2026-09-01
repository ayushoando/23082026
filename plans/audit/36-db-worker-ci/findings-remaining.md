# Remaining — 36-db-worker-ci
**Date:** 2026-09-01
- Admin pending migration: apply `20260901120000_user_history_owner_rls.sql` via `pnpm run db:apply:admin` — owner action, dry-run first (dry-run already done 2026-09-01); then `db:types:admin` → `db:types` → `typecheck` per runbook order.
- Worker deploy: `pnpm run worker:deploy` + runbook smoke verification (dead asset → `200 image/png` with `x-oando-proxy: r2-fallback`; valid asset → `x-oando-proxy: r2`) — owner-gated; the `catalog-nav` binding is still undeployed.
- CI to green: release-gate.yml red on main — 2 of the last 3 Release gate runs failed (job `gate-full` at `Run pnpm run release:gate:core`; newest run in_progress at observation time). Diagnose via `gh run view 33527825017 --log-failed` or an authorized local `release:gate:core` run; main must not be treated as green until fixed.
