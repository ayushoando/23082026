# Database & Migrations Audit

**Created:** 2026-08-31
**Status:** Audit complete

## Key Findings

### Migration Hygiene
- **43 Products DB migrations** in `site/platform/supabase/migrations/` (recount 2026-09-01; the original "44" overcounted by one) — clean naming, chronological, all have `-- rollback` comments
- **21 Admin DB migrations** in `site/platform/supabase/migrations.admin/` — same quality; includes the new `20260901120000_user_history_owner_rls.sql` (SEC-R08 owner-scoped RLS, authored 2026-09-01, **not yet applied** — dry-first in deploy prep). Total: **43 + 21 = 64** (previously claimed 64 vs actual 63)
- **Rollback (2026-09-01):** the 8 Admin migrations that lacked `-- rollback` (`20260524240000_drop_catalog_duplicates`, `20260524240001_drop_dead_better_auth`, `20260524240002_create_missing_tables`, `20260628100000_planner_plans_and_audit`, `20260713000000_price_books`, `20260727010000_product_studio_drafts`, `20260727020000_workspace_editor_configs`, `20260727030000_product_studio_templates`) received real commented reverse-SQL rollback sections; grep 2026-09-01 confirms **0** migrations in either folder lack a `-- rollback`/`-- down` marker
- **Governance baseline:** `P4_migration_no_rollback` was baselined at 42, tightened to 8 on 2026-09-01; observed debt is now **0**, but `config/quality/governance-baseline.json` still records 8 — re-record pending in the verification sweep
- **Drizzle schema** in `site/platform/drizzle/schema/` — 3 files: `catalog.ts`, `planner.ts`, `index.ts`

### Architecture (solid)
- **Two databases, clear ownership:** Products DB (catalog, configurator, flags, themes) vs Admin DB (plans, profiles, handoffs, furniture, descriptors, analytics, price books)
- **All queries via Supabase client** with parameterized `.from().select().eq()` — no raw SQL in app code
- **Direct Postgres only in scripts** (`postgres` package for seeds, migrations, type generation, backups)
- **RLS everywhere:** All tables have RLS enabled with policies. Service-role-only tables documented in migration `20260801120000`.
- **Persistence mode pattern:** Both Planner and Studio use exclusive disk/Supabase mode with production safety guards

### Issues
- **No `rate_limits` table in generated types** — the rate limiter uses a table that isn't in the Drizzle schema. Comment in `rateLimit.ts` acknowledges this.
- **`_local_migration_history` table** — exists on Products DB for tracking applied migrations. Has RLS + service-role-only policy. Fine.
- **Archive schema used for retired tables** — `archive.furniture_catalog`, etc. Good housekeeping.
- **Stale governance number (2026-09-01)** — rollback debt is eliminated (observed 0 via grep), but the baseline file still records `P4_migration_no_rollback: 8`; re-record it in the next verification sweep.

### No remedy plan needed
The database layer is clean. The only suggestion: add `rate_limits` to the Drizzle schema and regenerate types to eliminate the type cast in `rateLimit.ts`.
