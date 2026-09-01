# Plan — Platform, Database & Server Layer

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Make the two-database layer self-consistent: correct the stale baseline, remove reads of archived/nonexistent tables, and fix the drizzle config footgun.

## Actions (prioritized)
1. **Med** Re-record `P4_migration_no_rollback` to 0 in `config/quality/governance-baseline.json` — all 64 migrations under `site/platform/supabase/migrations{,.admin}/` already carry `-- rollback`; the baseline (8) is stale, not a live defect list.
2. **Med** Add `-- rollback` sections to the 3 Drizzle SQL files (`drizzle/migrations/0000_…`, `drizzle/migrations/0001_add_missing_indexes.sql`, `drizzle/migrations/products/0002_svg_assets_v2.sql`), journal `0002` in `meta/_journal.json`, and extend the P4 scan to cover them.
3. **Med** Migrate the consumers of the stale hand-written `site/platform/supabase/types.ts` (`adminServer.ts`, `rateLimit.ts:192`, `admin/themes/route.ts:64-76`) onto generated `platform/types/database.types.ts`, then delete `site/platform/supabase/types.ts` — user-confirmed deletion required.
4. **Med** Remove the `block_themes` read in the admin/themes route (`route.ts:16,53` — table archived by migration `20260814200000`) and decide the fate of the `rate_limits` targeting in `rateLimit.ts:135-200` (table exists nowhere; fail-open in-memory fallback).
5. **Med** Fix `drizzle.config.ts` — it targets the Admin URL while including `drizzle/schema/catalog.ts` (Products tables) in its schema; split the config per DB.
6. **Low** Run `pnpm run db:types` once the 4 `svg_*_v2` tables are applied to the live project so `database.types.ts` covers them.
7. **Low** Dedupe env plumbing: route `features/shared/catalog/catalogAssetStorage.server.ts:62-76` through `platform/supabase/supabaseAdmin.ts` and share the auth-admin factory with `updateFeatureFlags.server.ts:58-71`.

## Verification
- `pnpm run db:test` and `pnpm run db:apply -- --dry` — live two-DB state; DB authorization required.
- `pnpm run typecheck` and `pnpm run test` — owner authorization required.
