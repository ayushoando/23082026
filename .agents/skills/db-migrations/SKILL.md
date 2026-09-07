---
name: db-migrations
description: "Author, apply, and audit database migrations, Drizzle ORM schemas, and RLS policies across Admin and Products Supabase instances under the thermonuclear standard. Enforces mandatory rollback SQL, dry-run preflights, security grants, and TypeScript type regeneration."
---

# Database Migrations & Schema Engineering — Thermonuclear Standard

Use this skill whenever modifying database schemas, writing SQL migrations, creating Drizzle ORM models, adjusting Row Level Security (RLS) policies, or regenerating database types across the Oando platform. 

Data persistence in this repository is distributed across two separate Supabase instances. Database migrations are strictly managed: every migration must be reversible, dry-run preflighted, and fully typed.

---

## 1. The Thermonuclear Truth Floor for Databases

Under `AGENTS.md` §4, §7, and [`docs/database/schema.md`](file:///d:/23082026/docs/database/schema.md):
$$\text{User Instruction} > \text{Live Code / Fresh Command Output} > \text{AGENTS.md} > \text{Agents/} > \text{docs/}$$

- **The Production Read-Only Invariant:** Production serverless execution is read-only (`EROFS`). Runtime code must never execute raw disk writes. Disk persistence is permitted only when `DEV_AUTH_BYPASS=1` on non-production.
- **Dual Supabase Instances:**
  - **Admin Database** (`rxzpznmxbaoxpikowmfc`): Plans (`oando_plans`), profiles, teams, handoffs, price books, furniture items (`furniture_catalog`), and block descriptors.
  - **Products Database** (`erpweaiypimorcunaimz`): Public marketing catalog, configurator 3D models, themes, and feature flags.
- **No Dual-Write:** Never write to both Supabase and disk simultaneously. Persistence mode selector decides exclusively based on environment.
- **Scope Discipline:** Do exactly the stated task. Do not expand scope, refactor adjacent code, or make opportunistic improvements. Make the smallest reversible change that achieves the requested outcome. If scope is exceeded, stop and report it.

---

## 2. The Five Non-Negotiable Laws of Database Migrations

```
┌────────────────────────────────────────────────────────────────────────┐
│               THE 5 THERMONUCLEAR LAWS OF DB MIGRATIONS                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. MANDATORY ROLLBACK SQL BLOCK IN EVERY MIGRATION                     │
│ 2. STRICT DUAL-DATABASE PARTITIONING & ROUTING                         │
│ 3. MANDATORY DRY-RUN PREFLIGHT BEFORE APPLYING                         │
│ 4. ROW LEVEL SECURITY (RLS) & EXPLICIT ROLE GRANTS                     │
│ 5. IMMEDIATE TYPE REGENERATION & ZERO HANDWRITTEN 'ANY'                │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Law 1: Mandatory Rollback SQL Block in Every Migration
- Every SQL file created under `site/platform/supabase/migrations/` **must** contain an explicit `-- rollback` delimiter followed by the exact SQL needed to revert the change:
  ```sql
  -- Up migration
  CREATE TABLE IF NOT EXISTS public.example_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- rollback
  DROP TABLE IF EXISTS public.example_items;
  ```
- **Ratchet Enforcement:** `pnpm run check:governance` ratchets the metric `P4_migration_no_rollback` against `config/quality/governance-baseline.json`. A migration without `-- rollback` causes a hard build gate failure.

### Law 2: Strict Dual-Database Partitioning & Routing
- Route tables strictly according to ownership:
  - User profiles, staff handoffs, floor plans, furniture definitions → **Admin Database** (`rxzpznmxbaoxpikowmfc`).
  - Marketing products, 3D assets, global themes → **Products Database** (`erpweaiypimorcunaimz`).
- Never mix tables across database instances.

### Law 3: Mandatory Dry-Run Preflight Before Applying
- Never apply migrations directly without running dry-run preflights:
  ```powershell
  # 1. Dry run against Products Database
  pnpm run db:apply -- --dry

  # 2. Dry run against Admin Database
  pnpm run db:apply:admin -- --dry
  ```
- Only when both dry-runs succeed with zero errors may migrations be applied:
  ```powershell
  pnpm run db:apply
  pnpm run db:apply:admin
  ```

### Law 4: Row Level Security (RLS) & Explicit Role Grants
- Every new table must enable RLS:
  ```sql
  ALTER TABLE public.example_items ENABLE ROW LEVEL SECURITY;
  ```
- Define explicit policies for `anon` (public read if marketing), `authenticated` (owner access), and `service_role`:
  ```sql
  CREATE POLICY "Users can access their own items"
    ON public.example_items
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);
  ```
- Add required `GRANT` statements:
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.example_items TO authenticated;
  GRANT SELECT ON public.example_items TO anon;
  ```
- **Service Role Isolation:** Asserts that `SUPABASE_ADMIN_SERVICE_ROLE_KEY` is never leaked to client bundles via `assertNotServiceRoleKey` in `site/platform/supabase/env.ts`.

### Law 5: Immediate Type Regeneration & Zero Handwritten `any`
- When any table or column is added, altered, or dropped, regenerate TypeScript types immediately:
  ```powershell
  pnpm run db:types:admin
  pnpm run db:types
  ```
- **Zero Handwritten `any`:** Never use `as any` or `: any` to circumvent lagging database types. Type casts hid past production bugs where missing columns crashed save operations. Always regenerate types from the active schema.

---

## 3. Migration Authoring Workflow

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THERMONUCLEAR DB MIGRATION PIPELINE                  │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Drizzle Schema Update:                                              │
│    • Define model under site/platform/supabase/schema/                 │
│    • Ensure relations, foreign keys, and indexes are specified         │
├────────────────────────────────────────────────────────────────────────┤
│ 2. SQL Migration Authoring:                                            │
│    • Create sequential migration file in migrations directory          │
│    • Write forward DDL + explicit -- rollback block                    │
│    • Include ENABLE ROW LEVEL SECURITY and GRANT statements            │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Dry-Run Verification:                                               │
│    • pnpm run db:apply -- --dry                                        │
│    • pnpm run db:apply:admin -- --dry                                  │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Type Generation & Governance Check:                                 │
│    • pnpm run db:types:admin && pnpm run db:types                      │
│    • pnpm run check:governance                                         │
│    • pnpm run typecheck                                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Verification & Audit Runbook

Execute this sequence to certify database changes:

```powershell
# 1. Verify migration rollback governance (must report 0 violations)
pnpm run check:governance

# 2. Run dry-run validation on both database instances
pnpm run db:apply -- --dry
pnpm run db:apply:admin -- --dry

# 3. Regenerate and typecheck TypeScript database definitions
pnpm run db:types:admin
pnpm run db:types
pnpm run typecheck

# 4. Verify secret scanning ensures no service keys leaked
pnpm run scan:secrets
```
