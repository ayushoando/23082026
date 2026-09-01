# Plan — Persistence & SQL Injection Surface

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Close the only cross-cutting gap (legacy data dir); mode-aware persistence and SQL parameterization verified clean end to end and stay untouched.

## Actions (prioritized)
1. **Med (cross-ref)** Retire legacy `site/data/storage/` (43 stale files, AGENTS.md marks it legacy; live store is `site/platform/`) — user-confirmed deletion required; add the `site/data/` prohibition to `scripts/general/check-repo-layout.mjs` so `check:layout` enforces it (cross-ref plan 04).
2. **Info (positive)** No action: all 11 raw `fs.writeFile(Sync)` sites are behind `assertDevDiskWritable()` (`site/lib/persistence/assertDevDiskWritable.ts`), `POST /api/exports` refuses outside dev (`site/app/api/exports/route.ts:47-54`), and Drizzle `sql` templates are static check constraints only (`site/platform/drizzle/schema/planner.ts:33-58`, `schema/catalog.ts:177-217`).

## Verification
- `node scripts/general/check-repo-layout.mjs`, `pnpm run test`, `pnpm run gate:fast` — gate runs require owner authorization.
