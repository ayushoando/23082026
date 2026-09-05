# Operations runbook

Use this runbook to deploy, migrate, seed, back up, and recover the platform from the repository root. Prerequisites are operator access to the owning services, correctly configured server-only variables in `.env.local`, a reviewed rollback path, and explicit current-session authorization for every test-like or production-affecting command.

**Warning — production impact:** migration apply, seed, deploy, restore, and backup commands can alter hosted data or infrastructure. Confirm the target project, take or verify a recoverable backup, run migration dry-runs first, and use the documented rollback or provider recovery procedure before executing a live step.

- Routine deploy, database, and R2 commands use root `pnpm run <name>` routes from `package.json`. Use `pnpm run ops:list` to inspect long-tail operations.
- Blockers: [`Failures.md`](./Failures.md) · Schema: [`docs/database/schema.md`](./docs/database/schema.md) · Restore: [`docs/database/ops.md`](./docs/database/ops.md). The `mcp/` tree contains tool definitions, not runtime-worker evidence.

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

Verify route handlers by static source inspection or an authorized repository check; do not substitute an untracked shell grep for the owning validation route.

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
| `gate:fast` / `release:gate:fast` | Fast development gate |
| `gate` / `release:gate` | Full release gate |
| `tech-docs:gate` | Inventory package |

Ops routes include `db:apply`, `db:test`, `backup:supabase:r2`, `gate:site-ui`, and `list`. Confirm current names with `pnpm run ops:list` when that exact command is authorized.

---

## 8. Observability & Monitoring

The platform uses a lean, cloud-first telemetry architecture (documented in [`OBSERVABILITY.md`](./OBSERVABILITY.md)):
- **Real User Monitoring (RUM):** `@vercel/analytics` and `@vercel/speed-insights` deployed with the Next.js site.
- **Business Metrics:** Google Analytics 4 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`).
- **Distributed Tracing:** Native Next.js OpenTelemetry instrumentation in `site/instrumentation.ts`.
- **Metrics Scraping:** Optional `/api/metrics` Prometheus-compatible endpoint.

Blockers: [`Failures.md`](./Failures.md) only.
