# 05 · Tooling, CI, and tech docs

[← Data, API, and persistence](04-data-api-persistence.md) · [Next: operations and infrastructure →](./06-operations-infrastructure.md)

## Tests

| Area | Role |
|---|---|
| `tests/unit/` | Unit contracts across app, components, features, lib, platform, server, scripts, Planner/Studio/Worker areas. |
| `tests/integration/` | Cross-module/feature/API behavior. |
| `tests/e2e/` | Playwright workflows, accessibility, visual/browser checks, helpers, snapshots. |
| `tests/fixtures/`, `tests/helpers/` | Shared test data and test utilities. |
| `tests/tech-docs-generator/` | Second Vitest lane for the Vite tech-docs package. |
| Root test configs/setup | Vitest, coverage, live/admin/site/tech-docs configurations and environment setup. |

## Scripts and command control plane

`package.json` is the root command authority. `scripts/run-ops.mjs` and `scripts/ops-command-registry.mjs` route long-tail operations.

| Scripts area | Role |
|---|---|
| `scripts/general/` | Common checks, audits, build support, cleanup, governance, documentation and validation utilities. |
| `scripts/AsNeeded/` | Focused maintenance, including FOCSS verification. |
| `scripts/lib/` | Shared script helpers. |
| `scripts/codemods/` | Source transformations. |
| `scripts/generate-svg/` | SVG/catalog generation support. |
| Root scripts | DB/migration/seed, R2, catalog assets, i18n, backups, visual/report generation, audits. |

Many scripts can mutate remote data or infrastructure. Treat them as operational tools, not casual utilities.

## Cross-task configuration

| Path | Role |
|---|---|
| `config/build/` | Next, PostCSS, TypeScript, Playwright, gate selection, Vitest reporter harness. |
| `config/quality/` | Governance/style-token baselines and ratchets. |
| `config/observability/` | Local Prometheus/Grafana Docker configuration. |
| `.oxlintrc.json` | Oxlint configuration. |
| `pnpm-workspace.yaml`, `turbo.json` | Workspace/task runner configuration. |

## CI and automation

| Path | Role |
|---|---|
| `.github/workflows/release-gate.yml` | Release/quality automation. |
| `.github/workflows/site-ui.yml` | Site UI automation. |
| `.github/workflows/supabase-backup-r2.yml` | Nightly database/catalog/repository backup flow. |
| `.github/workflows/tech-docs.yml` | Tech-docs automation. |
| `.github/instructions/` | Scoped guidance for boundaries, FOCSS, migrations, testing. |
| `.github/dependabot.yml` | Dependency-update automation. |

## Tech-docs generator

| Path | Role |
|---|---|
| `tech-docs-generator/src/` | Vite SPA implementation: auth, UI, data, hooks, pages, styles, types. |
| `tech-docs-generator/scripts/` | Extraction, validation, rendering, gate, publish/staging logic. |
| `tech-docs-generator/public/` | Static SPA assets. |
| `tech-docs-generator/*.config.*` | Vite/Vitest/TypeScript/package configuration. |
| `generated-documents/` | Disposable output: structured data, docs, and built static site. Never hand-edit. |

The SPA is separate from `site/`, does not use FOCSS, runs locally on port 3001, and is still included in root `pnpm run build`.

Use [Quality and validation](./10-quality-validation.md) before authorizing a test/gate, and [Operations](./06-operations-infrastructure.md) for deploy/backup work.


## Coverage-audited tooling cards

### D15 — Tests, fixtures, mocks, Vitest lanes, and Playwright

- **Goal:** Select the narrowest validation evidence for a change without treating one lane or an unrun command as proof.
- **Start Paths:** `./tests/`; `./tests/unit/`; `./tests/integration/`; `./tests/e2e/`; `./tests/fixtures/`; `./tests/helpers/`; `./tests/tech-docs-generator/`; `./config/build/`; `./Testing-handbook.md`; `./package.json`.
- **Scope:** Unit/integration/browser sources, fixtures, helpers, two Vitest lanes, Playwright, and evidence limitations.
- **Evidence Steps:** Read authority; inspect relevant source/config; compare script/config claims; classify quality/release risk; record exact command classification and next owner action.
- **Allowed Actions:** Read-only validation planning; execution only with exact current-session authorization and Hook Permission.
- **Forbidden Actions:** Running tests, browser checks, coverage, gates, or builds from convention; claiming a planned or partial result as full proof.
- **Risk:** Quality, release, browser, and owner-control risk.
- **Expected Evidence:** Exact command, repository-root cwd, scope, authorization state, hook decision, exit status, limitation, or explicit pending state.
- **Next Decision:** Select `verify-and-gate` only after both authorization conditions are established.

### D16 — Scripts and command registry

- **Goal:** Map a command from root manifest through implementation and classify its safety before proposal or execution.
- **Start Paths:** `./package.json`; `./scripts/`; `./scripts/run-ops.mjs`; `./scripts/ops-command-registry.mjs`; `./config/build/`; `./docs/architecture/scripts.md`; `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`.
- **Scope:** Root command authority, dispatch, static checks, operational scripts, and configured-versus-observed status.
- **Evidence Steps:** Read authority; inspect manifest/registry/source; compare command documentation; classify read-only/eligible/protected/pending; record evidence and next action.
- **Allowed Actions:** Read-only inspection and owned guidance edits.
- **Forbidden Actions:** Executing a command, inventing a script, or recommending `pnpm run typecheck:scripts` while `./scripts/tsconfig.json` is absent.
- **Risk:** Command, data, infrastructure, and validation risk.
- **Expected Evidence:** Exact command classification and whether it is configured, observed, unavailable, blocked, or pending.
- **Next Decision:** Route authorized validation to `verify-and-gate`; keep operational commands protected.

### D17 — Packages, dependencies, and workspace boundaries

- **Goal:** Distinguish declared, imported, configured, observed, and absent packages without changing workspace boundaries.
- **Start Paths:** `./package.json`; `./pnpm-workspace.yaml`; `./pnpm-lock.yaml`; `./site/`; `./site/tsconfig.json`; `./tech-docs-generator/`; `./tech-docs-generator/package.json`; `./config/build/`; `./docs/architecture/stack.md`.
- **Scope:** Root workspace, absent `./site/package.json`, root dependencies/imports, tech-docs package, generated output, and package-addition approval.
- **Evidence Steps:** Read authority; inspect manifests and live imports; compare declared versus wired status; classify dependency/workspace risk; record boundary and next decision.
- **Allowed Actions:** Read-only package mapping and guide updates in owned paths.
- **Forbidden Actions:** Installation, manifest/lockfile changes, package activation, or moving `./tech-docs-generator/` into `./site/` or `./results/site/`.
- **Risk:** Dependency, workspace, build, and product-source boundary risk.
- **Expected Evidence:** Root and tech-docs package boundaries, no product `./site/package.json`, status-labelled package claims, and no install claim.
- **Next Decision:** Select `powers-skills-model` only for an evidenced capability-packaging question; select `graph-impact` for shared dependency impact.

## Command classification and validation boundary

Use these four labels before any command is suggested or run:

- **read-only inspection:** file/path/document inspection with no user-owned quality, service, data, or external action;
- **Normal-Agent Eligible Check:** an exact non-mutating type/lint/static check explicitly named by the active policy and enabled hook;
- **Protected Command:** Full Gate, tests, coverage, browser runner, build, deployment, database action, backup, or local-service command;
- **no-run pending authorization:** anything lacking exact current-session authorization, Hook Permission, explicit eligibility, or required evidence.

The current `block-agent-tests` hook matches `typecheck`; therefore `pnpm run typecheck` remains pending user validation unless a separately approved policy changes that state. `pnpm run typecheck:scripts` is unavailable while `./scripts/tsconfig.json` is absent and must not be suggested as validation. An inline environment marker, prompt token, comment, or old plan is not Explicit User Authorization.

For any observed command, record the exact command, repository-root working directory, scope, authorization state, Hook Decision, exit status, output limitation, and behavior not verified. The root `pnpm` boundary applies; do not install from `./site/`.

## Workspace and generated-output boundary

`./tech-docs-generator/` is a root-level sibling of `./site/`, not a child package or result folder. Its generated output belongs in `./generated-documents/`. `./results/site/` is a Machine Evidence Purpose Subfolder and is distinct from `./site/`. Command-generated evidence belongs in `./results/<purpose>/`; handwritten reports belong in `./agents-work/<workstream>/<report-type>/`; active plan material belongs in `./plans/<name>/`; generated output is not hand-edited. A placement decision is not evidence that anything was relocated.

## Tooling completion contract

The Plain-Language Response Contract is mandatory. Report configured commands separately from observed results, both Vitest lanes when applicable, exact pending checks, and any behavior not established by static inspection. Do not claim gate, test, build, browser, generated-output, or package success without observed evidence.
