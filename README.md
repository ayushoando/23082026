# Oando furniture platform

This repository contains a Next.js 16 App Router application for the Oando marketing catalog, administration, Furniture Studio (`/oostudio`), and Floor Planner (`/ooplanner`). Use this page for product orientation; new contributors should follow [Start here](./START.md) and then use the [documentation index](./CONTENTS.md).

## Surfaces

| Surface | Route |
|---------|-------|
| Studio | `/oostudio` |
| Planner | `/ooplanner` |
| Marketing | `/` |
| Admin | `/admin/*` |

## Quick start

```bash
pnpm install      # root only — never inside site/ or tech-docs-generator/
pnpm dev          # http://localhost:3000 — never 127.0.0.1
pnpm run ops:list # long tail (db extras, catalog, CDN)
```

Secrets live in the repo-root `.env.local` (plus `site/.env.local` when Next loads from `site/`).

## Platform (durable facts)

| Item | This repo |
|------|-----------|
| Edge | `site/proxy.ts` — **not** `middleware.ts` |
| Output | `standalone` (`config/build/next.config.js`) |
| Trailing slash | `trailingSlash: true` — probes need a trailing `/` |
| Images (prod) | Unoptimized by design (COST-S01); R2 webp already compressed — do not force `/_next/image` |
| i18n runtime | English-only `request.ts` (COST-S02) — do not claim multi-locale |
| Security | CSP nonce + `'self'`, **no** `strict-dynamic` — see [`docs/governance/rules.md`](./docs/governance/rules.md) |
| Deploy | [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) §1 · `pnpm run vercel:prod` · `pnpm run worker:deploy` · R2: `pnpm run r2:backup` |
| Windows prod lab | `pnpm exec next start site -p 3000` if standalone `pnpm start` EPERM |

Read `node_modules/next/dist/docs/` before changing Next APIs (see the `AGENTS.md` agent-rules block).

## Forks

Studio and Planner are **fully forked** — `@studio/*` and `@planner/*` never import each other. Run `pnpm run scan:boundaries` before committing either tree.

| | Studio | Planner |
|--|--------|---------|
| Alias | `@studio/*` | `@planner/*` |
| CSS | `site/focss/studio/` | `site/focss/planner/` |

```
POST /api/Studio/furniture → furniture_catalog (Admin) / disk (dev)
GET  /api/Planner/catalog  ← same store
```

No shared module — each fork declares its own store and they meet at the same backing location.

## Persistence

Production filesystem is **read-only**; all runtime writes use mode-aware wrappers (`site/lib/Planner/plannerPersistenceMode.ts`, `site/lib/catalog/furnitureCatalogMode.ts`). One mode per run.

| Mode | When | Plans | Furniture |
|------|------|-------|-----------|
| disk | `DEV_AUTH_BYPASS=1`, non-prod | `site/platform/Planner/data/projects/` | `site/platform/shared/data/furniture/` |
| supabase | else | `oando_plans` (Admin) | `furniture_catalog` (Admin) |

Descriptors: `site/inventory/descriptors/` (disk) ⇄ `block_descriptors` (Admin).

## Two databases

| DB | Ref | Holds |
|----|-----|-------|
| **Admin** | `rxzpznmxbaoxpikowmfc` | Plans, staff, furniture, descriptors, teams, price books, audit, `customer_queries` |
| **Products** | `erpweaiypimorcunaimz` | Marketing catalog, configurator, flags, themes |

## APIs

Studio `/api/Studio/*` · Planner `/api/Planner/*` · assets `/api/files/*` · discovery `/.well-known/*`. Full catalog in `site/lib/apiCatalog.ts`; route inventory in [`docs/architecture/routes.md`](./docs/architecture/routes.md).
CRM demo is **localStorage** under `/admin/crm`; the real contact inbox is Admin DB `customer_queries`.

## Reference

Repo map: [`docs/architecture/layout.md`](./docs/architecture/layout.md) · stack: [`docs/architecture/stack.md`](./docs/architecture/stack.md) · routes: [`docs/architecture/routes.md`](./docs/architecture/routes.md) · schema: [`docs/database/schema.md`](./docs/database/schema.md) · governance: [`docs/governance/rules.md`](./docs/governance/rules.md).

## Checks

**Authorization required:** the commands below are configured validation routes. Run an exact command only with current-session user authorization and enabled-hook permission; otherwise report it as unrun.

```bash
pnpm run typecheck && pnpm run scan:boundaries && pnpm run gate
```

| | `pnpm run …` |
|--|-------------|
| Dev | `dev` · `dev:turbo` |
| Test | `test` (2 lanes) · `test:unit` · `test:tech-docs` · `gate` · `gate:fast` |
| DB | `db:apply` · `db:apply:admin` · `db:test` · `db:types` · `db:types:admin` (`-- --dry` first) |
| Deploy | `vercel:preview` · `vercel:prod` · `worker:deploy` · `worker:tail` |
| R2 | `r2:backup` · `r2:catalog-snapshot` · `r2:repo-backup` · `r2:count` |
| More | `ops:list` |

- `pnpm run test` = **two** vitest lanes — check both summaries under `results/tests/`.
- Migrations need `-- rollback` (ratcheted by `check:governance`).
- FOCSS: `verify:focss` · `lint:ui:strict` · `check:style-tokens` · `check:composer-styles`.
- Audits: `test:audit:hollow` · `test:audit:gate-skips` · `test:audit:api-routes`.

## Index

| | |
|--|--|
| Index | [`CONTENTS.md`](./CONTENTS.md) · [`DOC-MAP.md`](./DOC-MAP.md) |
| Onboarding | [`START.md`](./START.md) |
| Ops | [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) |
| Tests | [`Testing-handbook.md`](./Testing-handbook.md) |
| Blockers | [`Failures.md`](./Failures.md) |
| Agents | [`AGENTS.md`](./AGENTS.md) |

