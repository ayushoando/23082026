# Repository layout

This reference maps top-level repository paths and their roles. Verify a path against the live filesystem before relying on it; user instructions and live source take precedence over this document.

## Top-level directories

| Path | Role |
|------|------|
| `site/` | Next.js app (the product). App Router under `app/` (`app/(site)` = marketing, `app/admin`, `app/oostudio`, `app/ooplanner`), `components/`, `features/`, `lib/`, `hooks/`, `store/`, `server/` (server-only), `platform/` (types, drizzle, supabase migrations), `focss/` (`@focss/*` CSS), `inventory/` (descriptors), `i18n/`, `public/`, `data/` (legacy storage — do not write) |
| `tests/` | Vitest suite + configs (`vitest.config.ts`, `vitest.shared.ts`, `vitest.site.config.ts`, `vitest.admin.coverage.config.ts`, `vitest.coverage.inventory.config.ts`, `vitest.tech-docs.config.ts`). `unit/`·`integration/`·`e2e/` + the `tech-docs-generator/**` lane |
| `scripts/` | Repo tooling. `scripts/general/*.mjs` (audits, checks), `scripts/AsNeeded/*` (FOCSS verify), `scripts/run-ops.mjs` (ops registry). Full catalog: [`scripts.md`](./scripts.md). |
| `tech-docs-generator/` | Source-driven docs generator + Vite inventory SPA (second vitest lane; `ops tech-docs:generate` → `generated-documents/`) |
| `docs/` | Canonical docs — this tree (`architecture/`, `database/`, `governance/`). See [`docs/README.md`](../README.md) |
| `Agents/` | Agent handbooks (`01-standard` … `07-css`, `INDEX.md`) |
| `plans/` | Active sequence [`PLAN.md`](../../plans/PLAN.md). Route map: [`client-hub/flowcharts/clients-hub-flow.md`](../../plans/client-hub/flowcharts/clients-hub-flow.md). Active remedy suite: `05092026/`. Test fixtures and performance budgets live cleanly under `tests/fixtures/planner/` and `tests/e2e/helpers/`. |
| `config/` | Cross-task config: `config/build/` (next/playwright), `config/quality/` (baselines) |
| `workers/` | Cloudflare Workers (e.g. `oando-worker-proxy/` — apex asset edge) |
| `supabase/` | Supabase CLI / project config |
| `i18n/` | Next-intl root shim — re-exports `../site/i18n/request` |
| `results/` | Generated evidence (`.txt`/`.json`) — never plan status as `.md` |
| `.github/` | CI workflows + agent instructions/skills |
| `agent-reports/` | Agent report pointer |
| `mcp/` | MCP tool definitions |
| `.archive/` / `.tmp/` / `.vercel/` / `.vscode/` / `node_modules/` / `.qoder/` | Legacy / local / tooling — not source of truth (`.qoder` = disposable AI repowiki, gitignored, regenerated locally) |

The Tech-Docs test source and support files are package-local at `tech-docs-generator/tests/`. The root `tests/vitest.tech-docs.config.ts` remains the serial second-lane orchestrator for `pnpm run test`.

## Top-level files

| File | Role |
|------|------|
| `package.json` | Workspace root — scripts (gate, test, audit, tech-docs, ops) |
| `pnpm-workspace.yaml` / `pnpm-lock.yaml` / `turbo.json` | Workspace + task runner |
| `vercel.json` | Vercel deploy config (`bom1`, build command) |
| `AGENTS.md` | Process floor (won over docs) |
| `README.md` · `CONTENTS.md` · `DOC-MAP.md` | Repo index |
| `START.md` | Onboarding |
| `Failures.md` | Blockers ledger (single source). Empty table is valid |
| `.env.example` | Root env template. Copy to `.env.local` and `site/.env.local`. Default `DEV_AUTH_BYPASS=1` |
| `site/.env.example` | Next runtime template. Default `DEV_AUTH_BYPASS=0`. Prod `https://oando.co.in` |
| `tech-docs-generator/.env.example` | Vite SPA public Admin keys only. Port 3001 / `https://oando23.vercel.app` |
| `OPERATIONS_RUNBOOK.md` | Ops order |
| `Testing-handbook.md` | Testing rules + two-lane contract |
| `.env.example` / `.env.local` | Env scaffolds / secrets (**`.env.local` only**) |
| `.oxlintrc.json` / `.vercelignore` / `.gitignore` | Lint / deploy / ignore |

## Cross-cutting

- **Data separation:** Admin DB vs Products DB — see [`database/schema.md`](../database/schema.md).
- **Studio/Planner forks:** never import each other — `pnpm run scan:boundaries`.
- **Edge:** `site/proxy.ts`, **not** `middleware.ts`.
- **Docs:** this `docs/` tree is canonical; `.qoder/repowiki` is disposable AI output and is **not** a source of truth.
