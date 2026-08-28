---
name: db-migrations
description: Apply the repo two-database rules and safe migration workflow. Use when writing SQL migrations, changing schema, or choosing which Supabase project a table belongs to.
---

# Databases and Migrations

Read root `AGENTS.md` first.

## Two databases — pick the right one
- Admin (`rxzpznmxbaoxpikowmfc`): plans, staff/customer, furniture, descriptors,
  teams, price books, audit, `customer_queries`.
- Products (`erpweaiypimorcunaimz`): marketing catalog, configurator, flags, themes.
Staff/customer + furniture + descriptors -> Admin. Marketing catalog -> Products.

## Migration rules
- Every migration needs a `-- rollback` section. `check:governance` ratchets
  `P4_migration_no_rollback` against `config/quality/governance-baseline.json`.
- Include GRANTS and POLICIES, not just DDL.
- Migrations live in `site/platform/supabase/migrations*` (raw SQL). Drizzle
  schema under `site/platform/drizzle/schema/`.

## Apply (repo root) — dry first, always
- `pnpm run db:apply -- --dry`  then  `pnpm run db:apply`   (Products)
- `pnpm run db:apply:admin -- --dry`  then  `pnpm run db:apply:admin`  (Admin)
- Regenerate types: `pnpm run db:types`, `pnpm run db:types:admin`.

## Persistence at runtime
Production filesystem is read-only. Runtime writes use mode-aware wrappers
(`plannerPersistenceMode.ts`, `furnitureCatalogMode.ts`), never raw disk helpers.
Disk only when `DEV_AUTH_BYPASS=1` non-prod; else Supabase. One mode per run.

Detail: `.github/instructions/migrations.instructions.md`, `docs/database/`.

## Powers to activate (agent decides)
- For live schema inspection, RLS/policies, or SQL against a project, first check
  the installed-power registry directly. Activate `supabase-hosted` only if that
  check confirms it is available, and confirm Admin versus Products first.
  Repository MCP schemas or prose references do not prove installation. Never
  run destructive SQL without explicit user confirmation.

