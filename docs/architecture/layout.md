# Layout — repository map

One monorepo, `pnpm` workspace, Next.js App Router in `site/`. Truth order: **user > live code + fresh commands > `AGENTS.md` > `Agents/` > `docs/`**.

## Top-level directories

| Path | Role |
|------|------|
| `site/` | Next.js app (the product). App Router under `app/` (`app/(site)` = marketing, `app/admin`, `app/oostudio`, `app/ooplanner`), `components/`, `features/`, `lib/`, `hooks/`, `store/`, `server/` (server-only), `platform/` (types, drizzle, supabase migrations), `focss/` (`@focss/*` CSS), `inventory/` (descriptors), `i18n/`, `public/`, `data/` (legacy storage — do not write) |
| `tests/` | Vitest suite + configs (`vitest.config.ts`, `vitest.shared.ts`, `vitest.site.config.ts`, `vitest.admin.coverage.config.ts`, `vitest.coverage.inventory.config.ts`, `vitest.tech-docs.config.ts`). `unit/`·`integration/`·`e2e/` + the `tech-docs-generator/**` lane |
| `scripts/` | Repo tooling. `scripts/general/*.mjs` (audits, checks), `scripts/AsNeeded/*` (FOCSS verify), `scripts/run-ops.mjs` (ops registry) |
| `tech-docs-generator/` | Source-driven docs generator + Vite inventory SPA (second vitest lane; `ops tech-docs:generate` → `generated-documents/`) |
| `docs/` | Canonical docs — this tree (`architecture/`, `database/`, `governance/`). See [`docs/README.md`](../README.md) |
| `Agents/` | Agent handbooks (`01-standard` … `07-css`, `INDEX.md`) |
| `plans/` | Active execution plan [`PLAN.md`](../../plans/PLAN.md), index [`README.md`](../../plans/README.md); optional `CONTEXT.md`, `adr/` |
| `config/` | Cross-task config: `config/build/` (next/playwright), `config/quality/` (baselines) |
| `workers/` | Cloudflare Workers (e.g. `oando-worker-proxy/` — apex asset edge) |
| `supabase/` | Supabase CLI / project config |
| `i18n/` | Next-intl root shim — re-exports `../site/i18n/request` |
| `results/` | Generated evidence (`.txt`/`.json`) — never plan status as `.md` |
| `.github/` | CI workflows + agent instructions/skills |
| `agent-reports/` | Agent report pointer |
| `mcp/` | MCP tool definitions |
| `.archive/` / `.tmp/` / `.vercel/` / `.vscode/` / `node_modules/` / `.qoder/` | Legacy / local / tooling — not source of truth (`.qoder` = disposable AI repowiki, gitignored, regenerated locally) |

## Top-level files

| File | Role |
|------|------|
| `package.json` | Workspace root — scripts (gate, test, audit, tech-docs, ops) |
| `pnpm-workspace.yaml` / `pnpm-lock.yaml` / `turbo.json` | Workspace + task runner |
| `vercel.json` | Vercel deploy config (`bom1`, build command) |
| `AGENTS.md` | Process floor (won over docs) |
| `README.md` · `CONTENTS.md` · `DOC-MAP.md` | Repo index |
| `START.md` | Onboarding |
| `Failures.md` | Blockers ledger (single source) |
| `OPERATIONS_RUNBOOK.md` | Ops order |
| `Testing-handbook.md` | Testing rules + two-lane contract |
| `.env.example` / `.env.local` | Env scaffolds / secrets (**`.env.local` only**) |
| `.oxlintrc.json` / `.vercelignore` / `.gitignore` | Lint / deploy / ignore |

## Cross-cutting

- **Data separation:** Admin DB vs Products DB — see [`database/schema.md`](../database/schema.md).
- **Studio/Planner forks:** never import each other — `pnpm run scan:boundaries`.
- **Edge:** `site/proxy.ts`, **not** `middleware.ts`.
- **Docs:** this `docs/` tree is canonical; `.qoder/repowiki` is disposable AI output and is **not** a source of truth.
