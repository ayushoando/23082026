# `scripts/general/` — gate-critical entrypoints and documented exceptions

**Purpose:** This folder holds install, layout, build/start environment, documentation, and quality-gate entrypoints used by the product loop. Its only non-gate contents are the named support/policy exceptions below. Keep day-to-day one-shots, seed/database helpers, and bulk audits outside this folder unless a later approved, caller-preserving migration says otherwise.

**Membership boundary:** The evidence-backed decision ledger is [`plans/ref/scripts-general-membership-decisions.md`](../../plans/ref/scripts-general-membership-decisions.md). Every listed artifact remains active at its current path. This document authorizes no move, archive, deletion, command change, import change, or runtime behavior change. For the complete cross-family catalog and command-documentation map, see [`docs/architecture/scripts.md`](../../docs/architecture/scripts.md).

Run commands from the **repository root**:

```powershell
pnpm run <root-script-key>
pnpm run ops <name> [-- args]
# examples:
pnpm run ops db:apply -- --dry
pnpm run ops list
```

Prefer the root package command when one exists. Use `pnpm run ops <name> [-- args]` only where no root alias exists.

## Gate-critical inventory

### Install, layout, and gate purity

| Basename | Gate/caller role |
|---|---|
| `guard-workspace-install.mjs` | `preinstall` — blocks npm/yarn inside workspace packages |
| `cleanup-nested-installs.mjs` | `postinstall` — removes nested installs/locks |
| `check-repo-layout.mjs` | `check:layout` and release gates — required/forbidden layout |
| `check-failures.mjs` | `check:failures` / `gate` — `Failures.md` purity |
| `check-agents-md.mjs` | `check:agents-md` / `gate` |
| `check-agents-folder.mjs` | `check:agents-folder` / `gate` |
| `check-active-docs.mjs` | `check:active-docs` / `gate` |
| `check-plans-purity.mjs` | `check:plans-purity` / `gate` |
| `check-docs-purity.mjs` | `check:docs-purity` / `gate` |
| `check-root-markdown-links.mjs` | `docs:check:root-links` |
| `check-test-layout.mjs` | `test:layout:check` — name-mirror layout |
| `check-governance.mjs` | `check:governance`, `release:gate`, and `release:gate:fast` |
| `check-style-tokens.mjs` | `check:style-tokens`, `release:gate`, and `release:gate:fast` |

### Build, start, and environment

| Basename | Gate/caller role |
|---|---|
| `check-sharp.js` | `check-sharp` / `build` — sharp resolve |
| `prepare-standalone.cjs` | `build` post-step — standalone static/public preparation |
| `startStandalone.cjs` | `start` — standalone server |
| `loadEnvLocal.cjs` | Root/site `.env.local` loader for Drizzle, seed, DB, Playwright, and Next |
| `validate-launch-env.mjs` | `launch:env` / `release:gate:fast` |
| `prune-stale-next-types.mjs` | `typecheck`, included by release gates |

### Quality and release audits

| Basename | Gate/caller role |
|---|---|
| `audit-hollow-tests.mjs` | `test:audit:hollow` — all `tests/**` |
| `run-test-audits.mjs` | `test:audit` and `test:audit:fast` |
| `audit-gate-skips.mjs` | `test:audit:gate-skips` |
| `audit-eslint-disable.mjs` | `test:audit:eslint-disable` |
| `audit-api-route-safety.mjs` | `test:audit:api-routes` |
| `scan_secrets.mjs` | `scan:secrets` |
| `lint-ui-contract.mjs` | `lint:ui` / `lint:ui:strict` |
| `run-oxlint.mjs` | `lint`, `lint:fix`, and `lint:type-aware` — folders sequentially: `site` → `tests` → `tech-docs-generator` → `scripts` → `config` |
| `check-composer-styles.mjs` | `check:composer-styles` and `check:ui-assets` |
| `check-product-icons.mjs` | `check:product-icons` and `check:ui-assets` |
| `prune-site-dumps.mjs` | `release:gate:fast` |

### Documentation generators

| Basename | Gate/caller role |
|---|---|
| `generate-docs.mjs` | `docs:sync`, `docs:sync:all`, and `docs:check*` orchestrator |
| `generate-test-inventory.mjs` | Test inventory and migration map |
| `generate-route-index.mjs` | `docs:sync:routes` / API route index |

## Documented in-folder support and policy exceptions

These artifacts are intentionally retained in `scripts/general/`, but are not package/CI gate entrypoints:

| Artifact | Reason | Review trigger |
|---|---|---|
| `.gitkeep` | Retains the directory when it otherwise has no tracked content. | Membership-policy review |
| `README.md` | Documents the folder contract and gate membership. | Membership-policy review |
| `block-agent-tests.mjs` | Enabled Kiro `PreToolUse` policy hook; it is not a package or CI gate entrypoint. | Hook-registration or membership-policy review |

## Active review queues — no move authorized

The following artifacts remain active at their current paths. Their target family is a future review hypothesis, not an approved relocation. Any later change requires the compatibility matrix, complete caller evidence, an explicit owner decision, a wrapper, rollback, and the user-owned validation applicable to that change. `sync-env-local-files.mjs` also requires a complete safety contract before any change.

| Future family review | Active artifacts |
|---|---|
| `ops/` | `check-worker-origin.mjs`; `sync-env-local-files.mjs` — safety-contract blocker applies |
| `lib/` | `ci-gate-env.mjs`; `hollow-test-patterns.mjs`; `root-surface-purity.mjs`; `workstation-env.mjs` |
| `maintenance/` | `console-audit.mjs`; `generate-api-inventory.mjs`; `generate-persistence-sweep.mjs`; `generate-pseo-sku-matrix.mjs`; `generate-redirect-map.mjs`; `run-plan-wave1.mjs` |

## `maybe` — active and untouched

The following artifacts have unresolved current-use, lifecycle, or caller evidence. They remain active at their exact current paths and must not be moved, archived, disabled, consolidated, or treated as obsolete:

`audit-repo-state.py`, `generate-session-docs.py`, `move-checklist.py`, `rename-plans.py`, `update-plans.py`, and `verify-plans.py`.

## Related external gate artifact

`tech-docs-generator/scripts/fake-test-audit.mjs` remains at its existing external path. It supplies `test:audit:fake-test` and `tech-docs:gate`; it is neither a missing `scripts/general/` member nor a relocation target.

## Path-stable SVG policy

The SVG generation core and its fixture inputs remain outside this folder because static consumers depend on them. The unlinked snapshot-golden artifacts were deleted with explicit approval.

| Path | Static evidence / current handling |
|---|---|
| `scripts/generate-svg.mjs` | Imported by the SVG smoke wrapper; publish write entrypoint |
| `scripts/generate-svg/pipelineCore.ts` | Imported by descriptor-SVG publishing code and loaded by the wrapper |
| `scripts/generate-svg/svgo.config.cjs` | SVG sanitizer configuration |
| `scripts/generate-svg/_fixtures/*` | JSON inputs read by `smoke-svg-fixtures.mjs`; the directory is copied by `prepare-standalone.cjs` and inspected by its unit contract test |

## Rules

1. `scripts/general/` contains only the gate-critical inventory and the three named support/policy exceptions.
2. Preserve every existing command, import, workflow, and path. A future approved relocation must retain a compatibility wrapper or equivalent before migrating callers.
3. Shared helpers that are not gate entrypoints stay in `scripts/lib/` (for example, `repoRoot.mjs`) unless a later approved plan changes them.
4. Do not add AsNeeded one-shots, seed/database bulk tools, or unreviewed manual audits here. Root probe scripts remain removed; do not reintroduce them under `scripts/general/`.
5. `maybe` artifacts stay active and untouched. Archive is not current work: there are zero archive candidates, and no artifact may be moved to `scripts/archive/` without the later evidence, manifest, hash, restoration, rollback, and approval requirements.
