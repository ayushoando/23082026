# 01 · Full repository map

[Start](README.md) · [Next: application architecture →](02-application-architecture.md)

This is the exhaustive functional map. It includes all meaningful repository areas while intentionally excluding dependency contents and individual generated files.

## Product and source areas

| Area | Status | Role |
|---|---|---|
| `site/` | Source / editable | Main Next.js product: UI, API, security edge, platform adapters, styles, assets, i18n, observability. |
| `tests/` | Source / editable | Vitest, Testing Library, Playwright, fixtures/helpers, and the tech-docs test lane. |
| `scripts/` | Source / editable, sometimes operational | Checks, audits, migrations, seeds, backup/R2, catalog assets, generators, codemods, and command dispatch. |
| `config/` | Source / editable | Build/test harness, governance baselines, and local observability configuration. |
| `workers/` | Source / editable | Cloudflare Worker source, separate from the Vercel application deploy. |
| `tech-docs-generator/` | Source / editable | Separate Vite inventory SPA and source-to-documentation generator. |
| `i18n/` | Source / editable | Root next-intl resolver shim; real messages/config are in `site/i18n/`. |

## Delivery, governance, and coordination areas

| Area | Status | Role |
|---|---|---|
| `.github/` | Source / editable | CI workflows, scoped instructions, Dependabot configuration. |
| `.kiro/` | Workspace source / editable | Skills, steering, hooks, specs, agent definitions, power/MCP schemas, settings. |
| `docs/` | Canonical durable documentation | Architecture, database, and governance reference; live code wins on mismatch. |
| `plans/` | Active-work coordination | Requirements/design/tasks/plan evidence. The live tree currently has `PLAN.md` and `README.md`; no named active plan folder was found. |
| `Agents/` | Process handbook | Agent standard/testing/browser/failure/documentation/architecture/CSS procedures. |
| `agent-reports/` | Reference pointer | Agent-report conventions, not product source. |
| `agents-work/` | Working material | Research/work products, including this guide; not application runtime authority. |
| `ltm/` | Local Kiro memory state | Tool continuity support, not product source. |

## Output, local, and private areas

| Area | Status | Role |
|---|---|---|
| `generated-documents/` | Generated / disposable | Tech-docs generator output: data, rendered docs, static site. Regenerate rather than patch. |
| `results/` | Generated evidence | Command/test/report output. Never place handwritten plans/audits here. |
| `node_modules/` | Local generated | Installed dependencies. Never hand-edit. |
| `.git/` | Local VCS state | Git metadata only. |
| `.vscode/` | Editor configuration | VS Code workspace settings/tasks. |
| `.env.local`, `.env copy.local` | Local/private | Credentials and local runtime configuration; never commit. |
| `.env.example` | Editable template | Non-secret environment shape/documentation. |

## Root control files

| File or group | Owns |
|---|---|
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json` | Package ownership, scripts, workspace, package-manager lock, task runner. |
| `vercel.json`, `.vercelignore` | Vercel build/deploy behavior. |
| `.oxlintrc.json`, `.gitignore` | Lint/ignore policy. |
| `.postman.json` | API collection. |
| `skills-lock.json` | Kiro skill lock/configuration state. |
| `AGENTS.md` | Repository process floor. |
| `START.md`, `README.md`, `CONTENTS.md`, `DOC-MAP.md` | Onboarding and documentation index/placement. |
| `OPERATIONS_RUNBOOK.md`, `Testing-handbook.md` | Operations and test/validation procedures. |
| `Failures.md` | Sole hard-blocker ledger. |
| `HANDOVER.md`, `owners.md` | Historical handoff and ownership context; verify against live code. |

## Areas that are not live source

- `site/.next/`, `site/next-env.d.ts`, `site/tsconfig.tsbuildinfo`, and test/package build-info are local/generated.
- `site/data/storage/` is legacy. Do not write runtime behavior there.
- A generic doc may mention root `supabase/` or root `mcp/`, but neither exists in the live tree. Use `site/platform/supabase/` and `.kiro/mcp/`.

## Fast routing

| If the task is about… | Start at… |
|---|---|
| Product page/API behavior | [Application architecture](02-application-architecture.md) then [Product domains](03-product-domains.md) |
| DB, RLS, catalog/furniture persistence | [Data, API, and persistence](04-data-api-persistence.md) |
| Test, check, script, CI, or generated tech docs | [Tooling, CI, and tech docs](05-tooling-ci-tech-docs.md) |
| Deploy, Worker, R2, backup, incident | [Operations and infrastructure](06-operations-infrastructure.md) |
| Docs, plan, policy, ownership, blocker | [Docs, governance, and planning](07-docs-governance-planning.md) |
| Kiro configuration or external-tool capability | [Kiro workspace](08-kiro-workspace.md) |
| Local environment or generated output | [Local, generated, and environment](09-local-generated-environment.md) |