# Operations runbook

Deploy · migrate · seed · roll back. **Repo root only.**

- Daily + deploy/DB/R2: root `pnpm run <name>` (see `package.json`). Long tail: `pnpm run ops:list`.
- Blockers: [`Failures.md`](./Failures.md) · Schema: [`docs/database/schema.md`](./docs/database/schema.md) · restore: [`docs/database/ops.md`](./docs/database/ops.md) · MCP workers: `mcp/`.

---

## 0. Environments

| | FS | Persistence | Bypass |
|---|----|--------------|--------|
| Local | writable | **disk** | `DEV_AUTH_BYPASS=1` |
| CI | writable | **supabase** | unset |
| Prod | **read-only** | **supabase** | never |

`DEV_AUTH_BYPASS` is ignored in production. Don't set `DEV_AUTH_BYPASS_ALLOW_PRODUCTION` (dead).

| DB | Ref | URL env | DB env |
|----|-----|---------|--------|
| Products | `erpweaiypimorcunaimz` | `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | `PRODUCTS_DATABASE_URL` |
| Admin | `rxzpznmxbaoxpikowmfc` | `NEXT_ADMIN_SUPABASE_URL` | `SUPABASE_AUTH_DATABASE_URL` |

Furniture + descriptors → **Admin**. Products may still hold legacy assets. Selector: `catalogAssetStorage.server.ts`.

---

## 1. Deploy

Order: **migrations → seed → code.** Field-opens after a real deploy: SEO field checks and COST-live measurement — record under `results/` per [`docs/governance/benchmarks.md`](./docs/governance/benchmarks.md) §7; never close a field row on local state.

```bash
pnpm install
pnpm run db:apply -- --dry
pnpm run db:apply:admin -- --dry
pnpm run db:apply
pnpm run db:apply:admin
pnpm run seed:furniture           # once per env — else empty Planner rail
pnpm run release:gate
pnpm run vercel:prod              # VERCEL_TOKEN from .env.local
pnpm run db:test
```

Smoke in browser: `/ooplanner` → rail populated → place → save → reload.

**Edge worker (`oando-worker-proxy`)** — manual Cloudflare deploy via wrangler (the Vercel site auto-deploys on push; the worker does not):

```bash
pnpm run worker:dev               # wrangler dev
pnpm --dir workers/oando-worker-proxy exec wrangler login   # once; or CLOUDFLARE_API_TOKEN
pnpm run worker:deploy            # wrangler deploy
pnpm run worker:tail
```

Verify: dead asset path → `200 image/png` with `x-oando-proxy: r2-fallback`; valid asset → `x-oando-proxy: r2`.

Verify no route handler does a raw disk write:

```bash
grep -r 'writeFileSync\|mkdirSync' site/app/api/ --include='*.ts' | grep -v 'mode'
# Expected: zero results
```

---

## 2. Migration

1. File under `site/platform/supabase/migrations/` or `migrations.admin/`: `YYYYMMDDHHMMSS_snake_case.sql`.
2. Include `-- rollback:`. Run `pnpm run check:governance` to verify against the current baseline.
3. New table → **grants + policies**:

```sql
alter table public.thing enable row level security;
grant select on public.thing to anon, authenticated;
grant all on public.thing to service_role;
-- policies next
```

4. `--dry`, then apply. 5. Types: `pnpm run db:types:admin` then `pnpm run db:types` (not interchangeable). 6. `pnpm run typecheck`.

Re-run: delete the row from `_local_migration_history` only if the migration is idempotent.

---

## 3. Seed

| Command | Target |
|---------|--------|
| `ops seed` | `catalog_products` |
| `ops seed:configurator` | `configurator_products` |
| `ops seed:managed` | `planner_managed_products` |
| `seed:furniture` | `furniture_catalog` (Planner rail) |

`seed:furniture -- --dry` / `-- --force`. Source: `site/platform/Studio/data/seed-furniture.json`.

---

## 4. Rollback

Code and schema are separate. Revert migrations (newest first, hand-run `-- rollback:`) **before** Instant Rollback if schema moved.

Hazard: legacy tables now in `archive` are invisible to PostgREST. Don't roll code past schema without reverting.

---

## 5. Incidents

| Symptom | Check |
|---------|-------|
| Empty rail in prod | `seed:furniture` not run |
| Saves fail in prod | Stuck on `disk`? `DEV_AUTH_BYPASS` set? |
| `permission denied for table` | Grant missing |
| `PGRST204` column | Stale types / wrong columns |
| Empty plan list | `user_id` / profile row |
| `relation does not exist` | Archived table or wrong DB |
| Catalog outage | R2 fallback — [`docs/database/ops.md`](./docs/database/ops.md) |
| Bad deploy | Instant Rollback → §4 |

Maintenance: `SITE_MAINTENANCE_MODE=readonly` blocks mutating APIs (an API gate, not a filesystem change — prod FS is always read-only).

---

## 6. Backups

Nightly: `.github/workflows/supabase-backup-r2.yml` (02:15 UTC) → both DBs + catalog + repo to R2.

```bash
pnpm run r2:backup
pnpm run ops backup:github-secrets:sync
```

Prove with a restore drill (P5). Pre-2026-08-01 dumps still contain public legacy tables.

---

## 7. Gates

| Command | Covers |
|---------|--------|
| `check:layout` | Workspace shape |
| `scan:boundaries` | Studio ↔ Planner forks |
| `typecheck` · `typecheck:tests` | Types |
| `test` | Both vitest lanes |
| `check:docs-all` | Docs + plan-set integrity |
| `check:governance` | Ratchets (rollback, CSP, npx) |
| `gate` / `release:gate` | Fast / full |
| `tech-docs:gate` | Inventory package |

Ops: `db:apply` · `db:test` · `backup:supabase:r2` · `gate:site-ui` · `gate:open3d` · `list`.

Blockers: [`Failures.md`](./Failures.md) only.
