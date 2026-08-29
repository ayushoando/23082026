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