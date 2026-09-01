# Remaining — 24-platform-database
**Date:** 2026-09-01
- 24.1: open — P4 baseline (8) not re-recorded to 0 in `config/quality/governance-baseline.json` (all supabase migrations already carry `-- rollback` per this report's grep).
- 24.2: open — 3 Drizzle SQL files still lack rollback sections and are unscanned by P4; `products/0002_svg_assets_v2.sql` still un-journaled in `meta/_journal.json`.
- 24.3: open — stale hand-written `site/platform/supabase/types.ts` still consumed by `adminServer.ts` (cast workarounds in `rateLimit.ts:192`, `admin/themes/route.ts:64-76`); migration to generated types + deletion not done.
- 24.4: open — `admin/themes` route still reads archived `block_themes`; `rate_limits` targeting still errors to in-memory fallback (fail-open).
- 24.5: open — `drizzle.config.ts` still targets the Admin URL while including `drizzle/schema/catalog.ts` (Products tables).
- 24.6: open — Products generated types still lack the 4 `svg_*_v2` tables; `pnpm run db:types` regen still pending. (Strengthened: report 36 observed `svg_revision_artifacts`/`svg_revisions` live in the Products table list.)
- 24.7: open — duplicated env plumbing (`catalogAssetStorage.server.ts:62-76`, `updateFeatureFlags.server.ts:58-71`) unchanged.
- 24.8–24.10: no action needed — positive verifications (two-DB discipline, `site/data/storage` zero references, server tree clean) stand as recorded.
- Cross-ref: report 36 verified both DBs live 2026-09-01 (Products `catalog_products=143`, 0 pending migrations; Admin 1 pending migration) — consistent with this report; no schema remediation performed.
