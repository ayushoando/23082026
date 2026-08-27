---
inclusion: fileMatch
fileMatchPattern: "site/platform/supabase/**,site/platform/drizzle/**,**/migrations/**,**/migrations.admin/**,scripts/db_*"
---

# Database Domain

## Architecture
- **Admin DB** (`rxzpznmxbaoxpikowmfc`): Plans, profiles, handoffs, teams, price books, queries, audit, furniture, descriptors
- **Products DB** (`erpweaiypimorcunaimz`): Marketing catalog, configurator, flags, themes
- ORM: Drizzle (`drizzle-orm` + `drizzle-kit`)
- Client: `@supabase/supabase-js` + `@supabase/ssr`
- Raw SQL: `postgres` driver

## Conventions
- Every migration MUST include `-- rollback` section.
- Always dry-run first: `pnpm run db:apply -- --dry` / `pnpm run db:apply:admin -- --dry`.
- After migration: regenerate types with `pnpm run db:types` / `pnpm run db:types:admin`.
- Grants AND policies must be included in migrations.
- Staff/customer + furniture + descriptors → Admin. Marketing catalog → Products.

## Checks (user-invoked only)
For an explicit migration or validation request, run the smallest applicable checks; do not run database commands automatically on save.
```
pnpm run db:apply -- --dry
pnpm run db:apply:admin -- --dry
pnpm run typecheck
```

## Persistence rules
- Prod FS is read-only. Use mode-aware wrappers (`writeFurnitureItem`, etc.).
- Disk when `DEV_AUTH_BYPASS=1`. Else Supabase.
- Never use raw disk helpers in production code paths.

## Graph-layer integration
Use `node scripts/graph-impact.mjs --file=<changed-file>` to inspect affected imports before an explicit migration review. This repository graph replaces the retired CAST integration.
