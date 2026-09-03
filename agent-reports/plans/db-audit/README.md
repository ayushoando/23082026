# Database & Migrations Audit

**Created:** 2026-08-31
**Status:** ✅ Audit complete — Verified clean architecture (2026-08-31)

## Key Findings

### Migration Hygiene
- **44 Products DB migrations** in `site/platform/supabase/migrations/` — clean naming, chronological, all have `-- rollback` comments
- **20 Admin DB migrations** in `site/platform/supabase/migrations.admin/` — same quality
- **Governance baseline:** `P4_migration_no_rollback: 42` — means 42 migrations were baselined before the rollback rule was enforced. New migrations all have rollback sections.
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
- **42 migrations without rollback** (baselined) — all pre-governance-rule. New migrations comply.

### No remedy plan needed
The database layer is clean. The only suggestion: add `rate_limits` to the Drizzle schema and regenerate types to eliminate the type cast in `rateLimit.ts`.
