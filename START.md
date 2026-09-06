# Start here

Use this onboarding guide to install, run, and orient in the Oando monorepo. The expected outcome is a local application at `http://localhost:3000` and a clear path to the relevant operating or reference document.

**Prerequisites:** work from the repository root, use `pnpm`, and read the [process floor](./AGENTS.md). Authority order: user instruction > live code and fresh command output > `AGENTS.md` > `Agents/` > `docs/`.

## 1. Read (in order)

| # | File | Why |
|---|------|-----|
| 1 | [`AGENTS.md`](./AGENTS.md) | The non-negotiable rules — incl. "this is NOT the Next.js you know" |
| 2 | [`README.md`](./README.md) | Product, surface routes, platform facts |
| 3 | [`CONTENTS.md`](./CONTENTS.md) | Full index of everything |
| 4 | [`DOC-MAP.md`](./DOC-MAP.md) | Where each kind of doc lives + authority |
| 5 | [`Testing-handbook.md`](./Testing-handbook.md) | How to run tests (two lanes) |

## 2. Install and run

**Warning:** install and local development commands change local dependencies or start a server. Deploy, database, worker, R2, test-like, and validation commands require exact current-session authorization and the applicable safety prerequisites in the [operations runbook](./OPERATIONS_RUNBOOK.md).

```bash
pnpm install      # root only — never inside site/ or tech-docs-generator/
pnpm dev          # http://localhost:3000 — never 127.0.0.1
pnpm run ops:list # long tail
```

Secrets → repo-root `.env.local` (+ `site/.env.local`). The site-only Vercel environment sync reads `site/.env.local` and never the root file; deploy after a sync: `pnpm run vercel:prod` · `pnpm run worker:deploy`. R2: `pnpm run r2:backup`.

## 3. Orient (durable reference)

| Topic | Open |
|-------|------|
| Repo directory map | [`docs/architecture/layout.md`](./docs/architecture/layout.md) |
| Tech stack / toolchain | [`docs/architecture/stack.md`](./docs/architecture/stack.md) |
| Routes (pages + API) | [`docs/architecture/routes.md`](./docs/architecture/routes.md) |
| CSS / FOCSS | [`docs/architecture/css.md`](./docs/architecture/css.md) |
| Database schema / ops | [`docs/database/schema.md`](./docs/database/schema.md) · [`ops.md`](./docs/database/ops.md) · [`drizzle.md`](./docs/database/drizzle.md) |
| Governance / rules | [`docs/governance/rules.md`](./docs/governance/rules.md) · [`benchmarks.md`](./docs/governance/benchmarks.md) · [`charter.md`](./docs/governance/charter.md) |
| Deploy / migrate / rollback | [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) |
| Observability / Telemetry | [`OBSERVABILITY.md`](./OBSERVABILITY.md) |

## 4. Core rules (just enough to not break things)

- `pnpm` from repo root; never install inside `site/` or `tech-docs-generator/`.
- No worktrees; UI at `http://localhost:3000` only.
- Edge is `site/proxy.ts`, **not** `middleware.ts`.
- Studio ↔ Planner forks: run `pnpm run scan:boundaries`.
- Migrations need `-- rollback`; run `check:governance`.
- `pnpm run test` = **two** vitest lanes — check both summaries.
- Do not recreate Phase A audit dumps under `.archive/audit/`.
