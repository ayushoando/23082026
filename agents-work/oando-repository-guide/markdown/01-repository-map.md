# 01 · Repository map

[Start](../README.md) · [Next: product domains →](./02-product-domains.md)

A listed path is a starting location, not proof that a capability is wired, loaded, hosted, or complete. The generated whole-repository map with live graph evidence is at `./agents-work/repository-map/index.html`.

## Product and source areas

| Area | Status | Role |
|---|---|---|
| `./site/` | Source / editable | Main Next.js product: UI, API, security edge, platform adapters, styles, assets, i18n, and observability. |
| `./tests/` | Source / editable | Vitest, Testing Library, Playwright, fixtures/helpers, and the tech-docs test lane. |
| `./scripts/` | Source / editable, sometimes operational | Checks, audits, migrations, seeds, backup/R2, catalog assets, generators, codemods, and command dispatch. |
| `./config/` | Source / editable | Build/test harness, governance baselines, and local observability configuration. |
| `./workers/` | Source / editable | Cloudflare Worker source, separate from the Vercel application deploy. |
| `./tech-docs-generator/` | Source / editable | Separate Vite inventory SPA and source-to-documentation generator. |
| `./i18n/` | Source / editable | Root next-intl resolver shim; real messages/config are in `./site/i18n/`. |

## Delivery, governance, and coordination areas

| Area | Status | Role |
|---|---|---|
| `./.github/` | Source / editable | CI workflows, scoped instructions, and Dependabot configuration. |
| `./docs/` | Canonical durable documentation | Architecture, database, and governance reference; live code wins on mismatch. Locked Path evidence. |
| `./plans/` | Active-work coordination | Requirements/design/tasks/plan evidence; use `./plans/README.md` for placement and authority. |
| `./Agents/` | Process handbook | Agent standard/testing/browser/failure/documentation/architecture/CSS procedures (`01`–`07`, indexed by `./Agents/INDEX.md`). Locked Path evidence. |
| `./agents-work/` | Working material | Research/work products, including this guide and generated graph reports; not application runtime authority. |

## Output, local, and private areas

| Area | Status | Role |
|---|---|---|
| `./generated-documents/` | Generated / disposable | Tech-docs generator output: data, rendered docs, and static site. Regenerate rather than patch. |
| `./results/` | Generated evidence | Command/test/report output. Use a purpose subfolder; never place handwritten plans or audits at the root. |
| `./node_modules/` | Local generated | Installed dependencies. Never hand-edit. |
| `./.git/`, `./.vscode/` | Local VCS/editor state | Git metadata and workspace settings only. |
| `./.env.local`, `./site/.env.local` | Local/private | Credentials and local runtime configuration; never commit or expose. |
| `./.env.example` | Editable template | Non-secret environment shape/documentation. |

## Root control files

| File or group | Owns |
|---|---|
| `./package.json`, `./pnpm-workspace.yaml`, `./pnpm-lock.yaml`, `./turbo.json` | Package ownership, scripts, workspace, package-manager lock, and task runner. |
| `./vercel.json`, `./.vercelignore` | Vercel build/deploy behavior. |
| `./.oxlintrc.json`, `./.gitignore` | Lint and ignore policy. |
| `./skills-lock.json` | Versioned lock pinning one externally sourced skill; does not govern the user-global opencode guidance layer. |
| `./AGENTS.md` | Repository process floor; Locked Path evidence. |
| `./START.md`, `./README.md`, `./CONTENTS.md`, `./DOC-MAP.md` | Onboarding and documentation index/placement. |
| `./OPERATIONS_RUNBOOK.md`, `./Testing-handbook.md` | Operations and test/validation procedures. |
| `./Failures.md` | Sole hard-blocker ledger. |
| `./HANDOVER.md`, `./owners.md` | Historical handoff and ownership context; verify against live code. |

## Areas that are not live source

- `./site/.next/`, `./site/next-env.d.ts`, `./site/tsconfig.tsbuildinfo`, and test/package build-info are local/generated.
- `./site/data/storage/` is legacy. Do not write runtime behavior there.
- A generic document may mention root `./supabase/` or `./mcp/`; neither exists. Supabase code and migrations live only under `./site/platform/supabase/` (`migrations/` and `migrations.admin/`).

## Fast routing

| If the task is about… | Start at… |
|---|---|
| Product page/API behavior | `./docs/architecture/routes.md`, `./docs/architecture/stack.md`, then [Product domains](./02-product-domains.md) |
| DB, RLS, persistence | `./docs/database/schema.md`, `./docs/database/ops.md`, `./AGENTS.md` §5 |
| Tests, checks, validation | `./Testing-handbook.md`, `./Agents/02-testing.md`, `./config/build/` |
| Deploy, Worker, R2, backup, incident | `./OPERATIONS_RUNBOOK.md`, `./workers/`, `./vercel.json` |
| Docs, plan, policy, ownership | `./docs/governance/`, `./DOC-MAP.md`, `./plans/README.md` |
| Agent guidance, skills, commands | [Agent workspace](./03-agent-workspace.md), `./Agents/INDEX.md` |
| Live layout/graph facts | `./agents-work/repository-map/index.html`, `./agents-work/repository-graph/stats/latest.json` |
