# 05 · Tooling, CI, and tech docs

[← Data, API, and persistence](04-data-api-persistence.md) · [Next: operations and infrastructure →](./06-operations-infrastructure.md)

## Root workspace and command authority

Run repository tooling from the repository root with `pnpm`. The root `package.json` is the command authority; `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `config/build/`, and the live script implementation determine whether a command is configured, unavailable, or merely described by a document. There is no separate `site/package.json`; product dependencies are declared at the root and the primary product TypeScript configuration is `site/tsconfig.json`.

A configured script is not an observed result. Before proposing or running any command, classify it and record the scope, authorization, hook decision, and evidence expected. This chapter names commands for routing only; the current guide-chapter lane does not execute them.

## Tests and the two Vitest lanes

| Area | Role |
|---|---|
| `tests/unit/` | Unit contracts across app, components, features, libraries, platform, server, scripts, Planner/Studio, and Worker areas. |
| `tests/integration/` | Cross-module, feature, and API behavior. |
| `tests/e2e/` | Playwright workflows, accessibility, visual/browser checks, helpers, and snapshots. |
| `tests/fixtures/`, `tests/helpers/` | Shared test data and test utilities. |
| `tests/tech-docs-generator/` | Tech-docs-specific tests in the second Vitest lane. |
| `config/build/`, `tests/vitest*.config.ts` | Vitest, coverage, Playwright, reporter, environment, and lane configuration. |

`pnpm run test` is a two-lane command: the default Vitest lane and the tech-docs Vitest lane. Read and report both lane summaries; one green lane is not the full suite. The tech-docs lane is represented by `tests/vitest.tech-docs.config.ts` and the root `test:tech-docs`/package lane. A focused test command or `pnpm run test:unit` covers only its stated scope and cannot be reported as the two-lane suite. Playwright, accessibility, visual, coverage, gate, and build commands are separate evidence and do not follow from a Vitest result.

The root `test` script performs test-artifact preparation/reporting around the Vitest run. Treat `pnpm run test`, `pnpm run test:tech-docs`, focused Vitest invocations, Playwright commands, coverage, and gates as Protected Commands unless an active policy and enabled hook explicitly classify a narrower non-mutating check as eligible. Do not run tests from convention or report a planned lane as observed evidence.

## Scripts and command control plane

`scripts/run-ops.mjs` and `scripts/ops-command-registry.mjs` route long-tail operations. `package.json` remains the source for command names; the implementation and registry determine what a command actually does.

| Scripts area | Role |
|---|---|
| `scripts/general/` | Common checks, audits, build support, cleanup, governance, documentation, and validation utilities. |
| `scripts/AsNeeded/` | Focused maintenance, including FOCSS verification. |
| `scripts/lib/` | Shared script helpers. |
| `scripts/codemods/` | Source transformations. |
| `scripts/generate-svg/` | SVG/catalog generation support. |
| Root scripts | Database/migration/seed, R2, catalog assets, i18n, backups, visual/report generation, audits, and release work. |

Many scripts can mutate remote data or infrastructure. Treat operational scripts as protected tools, not casual checks. `pnpm run docs:sync` concerns generated repository inventories; it is not evidence of a Markdown-to-HTML transform for the co-located guide pages.

## Cross-task configuration and CI

| Path | Role |
|---|---|
| `config/build/` | Next, PostCSS, TypeScript, Playwright, gate selection, and Vitest reporter harness. |
| `config/quality/` | Governance/style-token baselines and ratchets. |
| `config/observability/` | Local Prometheus/Grafana Docker configuration. |
| `.oxlintrc.json` | Oxlint configuration. |
| `pnpm-workspace.yaml`, `turbo.json` | Workspace/task-runner configuration. |
| `.github/workflows/release-gate.yml` | Release/quality automation. |
| `.github/workflows/site-ui.yml` | Site UI automation. |
| `.github/workflows/supabase-backup-r2.yml` | Nightly database/catalog/repository backup flow. |
| `.github/workflows/tech-docs.yml` | Tech-docs automation. |
| `.github/instructions/` | Scoped boundaries, FOCSS, migration, and testing guidance. |
| `.github/dependabot.yml` | Dependency-update automation. |

CI configuration describes an automation path; it does not establish that the workflow ran, passed, deployed, or produced current artifacts.

## Tech-docs workspace boundary

`tech-docs-generator/` is a root-level Vite workspace package and a sibling of `site/`. It is an inventory SPA, not product runtime source, and it does not import `site/` or use the product FOCSS layer. The product Next app uses `http://localhost:3000`; the tech-docs SPA uses `http://localhost:3001/tech-stack` when a separately authorized local-service check is needed.

Its source lives under `tech-docs-generator/src/`, scripts under `tech-docs-generator/scripts/`, tests under `tests/tech-docs-generator/`, and package configuration under `tech-docs-generator/*.config.*`. The generator owns disposable output under `generated-documents/`; do not hand-edit that output. The root build includes the tech-docs build step, but a configured build is not build evidence.

`results/tooling/tech-docs/` and other `results/<purpose>/` folders are machine-evidence destinations, not package or source locations. Never move `tech-docs-generator/` into `site/` or `results/site/`; a workspace-boundary change requires a separate approved task.

## Coverage-audited tooling cards

### D15 — Tests, fixtures, mocks, two Vitest lanes, and Playwright

- **Goal:** Select the narrowest validation evidence for a change without treating one Vitest lane, a planned command, or an unrun command as proof.
- **Start Paths:** `./tests/`; `./tests/unit/`; `./tests/integration/`; `./tests/e2e/`; `./tests/fixtures/`; `./tests/helpers/`; `./tests/tech-docs-generator/`; `./config/build/`; `./Testing-handbook.md`; `./package.json`.
- **Scope:** Unit/integration/browser sources, fixtures, helpers, both Vitest lanes, Playwright, coverage, and evidence limitations.
- **Evidence Steps:** Read authority; inspect relevant source/config; compare script/config claims; classify quality/release risk; record exact command class, authorization, hook, scope, and next owner action.
- **Allowed Actions:** Read-only validation planning; execution only after exact current-session authorization and Hook Permission.
- **Forbidden Actions:** Running tests, browser checks, coverage, gates, or builds from convention; claiming one lane or a partial result as full proof; hiding the tech-docs lane.
- **Risk:** Quality, release, browser, and owner-control risk.
- **Expected Evidence:** Exact command, repository-root cwd, lane/scope, authorization state, hook decision, exit status, limitation, or explicit pending state for each lane.
- **Next Decision:** Select `verify-and-gate` only after both authorization conditions are established.

### D16 — Scripts and command registry

- **Goal:** Map a command from the root manifest through its implementation and classify its safety before proposal or execution.
- **Start Paths:** `./package.json`; `./scripts/`; `./scripts/run-ops.mjs`; `./scripts/ops-command-registry.mjs`; `./config/build/`; `./docs/architecture/scripts.md`; `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`.
- **Scope:** Root command authority, dispatch, static checks, operational scripts, documentation-generation scripts, and configured-versus-observed status.
- **Evidence Steps:** Read authority; inspect manifest/registry/source; compare command documentation; classify read-only/eligible/protected/pending; record evidence and next action.
- **Allowed Actions:** Read-only inspection and owned guidance edits.
- **Forbidden Actions:** Executing a command without its required permissions, inventing a script, treating `package.json` as a pass, or recommending `pnpm run typecheck:scripts` while `./scripts/tsconfig.json` is absent.
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

Classify every proposed command before suggesting or running it:

- **read-only inspection:** a file, path, or document inspection with no user-owned quality, service, data, or external action;
- **Normal-Agent Eligible Check:** an exact non-mutating type/lint/static check explicitly named by the active policy and enabled hook as allowed for normal agent execution;
- **Protected Command:** a Full Gate, test, coverage, browser runner, build, deployment, database action, backup, or local-service command, including the two Vitest lanes and tech-docs gate;
- **no-run pending authorization:** anything lacking exact current-session Explicit User Authorization, Hook Permission, explicit eligibility, or required evidence.

The current `block-agent-tests` hook matches `typecheck`, so `pnpm run typecheck` remains pending user validation unless a separately approved policy changes that state. `pnpm run typecheck:scripts` is declared in the root manifest but unavailable while `scripts/tsconfig.json` is absent; it must not be suggested as validation. An inline environment marker, prompt token, comment, or old plan is not Explicit User Authorization.

For any observed command, record the exact command, repository-root working directory, scope or lane, current-session authorization state, Hook Decision, exit status, output limitation, and behavior not verified. For `pnpm run test`, report both Vitest lane summaries and identify any Playwright, coverage, build, gate, generated-output, or hosted behavior that was not established.

## Artifact and output boundary

| Output | Owning producer/state | Approved destination | Rejected destination |
|---|---|---|---|
| Agent-authored guide/report/work product | Agent; authored | `./agents-work/<workstream>/<report-type>/` or the approved guide workstream | `./results/`, `./site/`, or the `./agents-work/` root |
| Machine command/check evidence | Command/script; generated | `./results/<purpose>/` such as `./results/tests/`, `./results/site/`, or `./results/ops/` | `./results/` root, `./agents-work/`, or `./site/` |
| Generated tech-docs | `tech-docs-generator/` scripts; generated/disposable | `./generated-documents/` | `./results/`, `./agents-work/`, or `./site/` |
| Product source | Approved product owner; authored | Approved source tree, including `./site/` only after the Site Write Gate | `./site/` for a Non-Core Artifact |

The owning source or script, exact filename pattern, and authored/generated state belong in the Route Record and Completion Record. A destination table does not prove that generation, publication, or relocation occurred.

## Tooling completion contract

Use the Plain-Language Response Contract. Report configured commands separately from observed results; report both Vitest lanes when applicable; state exact pending checks and any behavior not established by static inspection. Do not claim gate, test, build, browser, generated-output, package, or workspace-boundary success without observed evidence.

## Separate Approval Work

Test, coverage, Playwright, build, gate, typecheck, package-install, lockfile, generator, local-service, deployment, database, backup, external-MCP, Power, and runtime enforcement actions remain owner-controlled or separately approved. A policy or hook change that would alter command eligibility must preserve Full Gate/test protections and is not implied by this documentation update.

Next: [Operations and infrastructure](./06-operations-infrastructure.md).
