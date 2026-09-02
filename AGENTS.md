<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- markdownlint-disable MD025 -->

## Process floor

This document defines the repository-wide execution and safety floor. Current user instructions and live repository evidence take precedence; lower-level handbooks and durable docs add detail without weakening these rules.

## 1. Truth

- **Authority order:** user instruction > live code and fresh command output > `AGENTS.md` > `Agents/` > `docs/`.
**User Wins:**  User always wins, User Wins.
- Never invent browser, build, test, or gate state. An unobserved command is unrun.
- Tests, gates, builds, browser checks, coverage, and test-like commands require exact current-session user authorization and enabled-hook permission.
- **Blockers:** record hard blockers only in [`Failures.md`](./Failures.md).

## 2. Work

- Repository root only. **Never create worktrees.** Use **`pnpm`** only.
- **Agents:** use at most four agents, with disjoint ownership and serial integration.
- Make the smallest sound change and preserve unrelated work. Do not write `any` by hand.
- Store local secrets only in `.env.local` or `site/.env.local`.
- Use `http://localhost:3000` for UI work; never use `127.0.0.1`.

## 3. Layout

Studio (`/oostudio`) and Planner (`/ooplanner`) are **forked** — never import each other. Run `pnpm run scan:boundaries` before committing either tree.

| Path | Role |
| ------ | ------ |
| `site/` | Next app |
| `site/app/(site)`, `site/app/admin` | Marketing + Admin |
| `site/{components,lib,hooks,store,server}/{Studio,Planner}/` | Fork trees |
| `site/focss/` | CSS (`@focss/*`) |
| `tests/`, `tech-docs-generator/`, `config/build/` | Tests, inventory SPA, harness |
| `site/platform/shared/data/` | Furniture (disk dev only) |
| `plans/` | Plans and agentic execution prompts |
| `results/` | Generated evidence only — no hand-written Markdown reports or audit archives |
| `Agents/` | Agent handbooks and agent-readable Markdown research/audit notes |

`site/data/storage/` is legacy — do not write there.

## 4. Databases

| | Ref | Holds |
| --- | ----- | ------- |
| **Admin** | `rxzpznmxbaoxpikowmfc` | Plans, profiles, handoffs, teams, price books, queries, audit, **furniture** + **descriptors** |
| **Products** | `erpweaiypimorcunaimz` | Marketing catalog, configurator, flags, themes |

Staff/customer + furniture + descriptors → **Admin**. Marketing catalog tables → **Products**.

## 5. Persistence (no dual-write)

> **Production filesystem is read-only.** Raw disk helpers will throw `EROFS`. All runtime writes must use mode-aware wrappers.

Disk when `DEV_AUTH_BYPASS=1` (non-prod). Else Supabase. Prod FS is read-only. Use mode-aware wrappers (`writeFurnitureItem`, …), never raw disk helpers.

| Data | Disk | Supabase | Selector |
| ------ | ------ | ---------- | ---------- |
| Plans | `site/platform/Planner/data/projects/` | `oando_plans` | [`plannerPersistenceMode.ts`](site/lib/Planner/plannerPersistenceMode.ts) |
| Furniture | `site/platform/shared/data/furniture/` | `furniture_catalog` | [`furnitureCatalogMode.ts`](site/lib/catalog/furnitureCatalogMode.ts) |
| Descriptors | `site/inventory/descriptors/` | `block_descriptors` | (same as furniture) |

Seed: `pnpm run seed:furniture` (off the read path).

## 6. Validation routes

Run only an exact command authorized by the current user and permitted by the enabled hook. The routes below describe intended scope; they do not assert a current result.

- Before completion, an authorized owner may run `pnpm run check:layout`, then `pnpm run gate:fast` for a development loop or `pnpm run gate` for the ship bar.
- Ship: `pnpm run gate` (= `release:gate` — full suite, build, coverage). Dev loop: `pnpm run gate:fast`.
- CSS: `verify:focss`, `lint:ui:strict`, `check:style-tokens`.
- `pnpm run test` = **two** vitest lanes (default + tech-docs). Check both. DOM: **happy-dom**.

## 7. Migrations

- Need `-- rollback`. `check:governance` ratchets `P4_migration_no_rollback` against the current baseline (`config/quality/governance-baseline.json`).
- Apply: always dry first — `pnpm run db:apply -- --dry` and `pnpm run db:apply:admin -- --dry`. Then `db:apply` / `db:apply:admin`.
- Grants **and** policies. Types: `pnpm run db:types:admin`, `pnpm run db:types`.
- Deploy: `pnpm run vercel:prod` · `pnpm run worker:deploy`. R2: `pnpm run r2:backup`. Long tail: `pnpm run ops:list`.

## 8. Traps

1. One green test summary ≠ full suite.
2. Migration without `-- rollback`.
3. Disk write in prod.
4. Studio ↔ Planner import.
5. `127.0.0.1` instead of `localhost`.
6. Hand-written Markdown reports under `results/`.
7. Recreating Phase A audit dumps, or PNG under `agent-reports/`.

## 9. Handbooks

| Topic | Open |
| ------- | ------ |
| Standard | `Agents/01-standard.md` |
| Testing | `Agents/02-testing.md`, `Testing-handbook.md` |
| Browser | `Agents/03-browser.md` |
| Blockers | `Agents/04-failures.md`, `Failures.md` |
| Docs | `Agents/05-documentation.md`, `DOC-MAP.md`, `CONTENTS.md` |
| Architecture | `Agents/06-architecture.md`, `docs/architecture/product-map.md`, `docs/architecture/stack.md`, `docs/architecture/routes.md` |
| CSS | `Agents/07-css.md`, `docs/architecture/css.md` |
| Tech-docs SPA | `tech-docs-generator/README.md` (detail also in product-map § Tech-docs) |
| Onboarding / ops | `START.md`, `OPERATIONS_RUNBOOK.md`, `README.md`, `Testing-handbook.md` |
| Plans | [`plans/PLAN.md`](plans/PLAN.md); route map [`plans/client-hub/flowcharts/clients-hub-flow.md`](plans/client-hub/flowcharts/clients-hub-flow.md) |