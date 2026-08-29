# 10 · Quality and validation

[← Local/generated/environment](09-local-generated-environment.md) · [Next: working with Kiro →](./11-working-with-kiro.md)

## Match proof to the changed area

| Change | Appropriate evidence |
|---|---|
| Pure helper/data transformation | Targeted unit check/test plus types as applicable. |
| React/UI behavior | Component/unit proof; browser proof when interaction matters. |
| Planner/Studio | Boundary scan plus relevant fork checks/proof. |
| CSS/FOCSS | FOCSS/style-token/UI checks, plus browser proof where needed. |
| Migration/RLS | Reviewed migration, rollback, dry run, generated types, application evidence. |
| API/auth | Route/unit evidence; hosted behavior requires appropriate hosted proof. |
| Worker/R2/deploy | Edge/deployment-specific smoke evidence; unit-green is insufficient. |
| Tech-docs generator | Its own test lane/gate and generated output validation. |

## Main validation sources

| Location | Owns |
|---|---|
| `Testing-handbook.md` | Evidence rules, test commands, two lanes, browser reporting. |
| `tests/` | Unit/integration/E2E source and test configurations. |
| `config/build/` | Playwright/base URL/harness and related build setup. |
| `config/quality/` | Quality ratchets/baselines. |
| `package.json` | Script names and root gate composition. |
| `.github/workflows/` | CI versions of quality/release routines. |

## Authorization rule

Checks, builds, browser tests, DB actions, deploys, backups, and test-like operations require explicit current-session user authorization. Ask for only the exact command you want Kiro to run.

```text
You may run only `pnpm run typecheck` from the repository root and report the result.
```

```text
You may run `pnpm run scan:boundaries` and `pnpm run p0:unit` for this Planner change.
Do not run any other command.
```

## Honest reporting

A good report says: command, root cwd, scope, exit/result, what was not verified, and blockers. It does not call a unit result browser proof, a disk result hosted-persistence proof, or one Vitest lane the full suite.

## Before a release

Use [Operations and infrastructure](06-operations-infrastructure.md) to plan data/deployment order, then explicitly authorize only approved checks/actions.

Next: [Working with Kiro](./11-working-with-kiro.md).


## D15 — Tests, fixtures, mocks, and validation card

- **Goal:** Select the least broad permitted evidence that directly evaluates the Task Outcome.
- **Start Paths:** `./tests/`; `./tests/unit/`; `./tests/integration/`; `./tests/e2e/`; `./tests/fixtures/`; `./tests/helpers/`; `./tests/tech-docs-generator/`; `./config/build/`; `./Testing-handbook.md`; `./package.json`.
- **Scope:** Two Vitest lanes, Playwright, fixtures, helpers, source-to-proof matching, and authorization.
- **Evidence Steps:** Read authority; inspect relevant test/config paths; compare declared commands with live hook/policy evidence; classify quality/release risk; record exact check and limitation.
- **Allowed Actions:** Read-only planning; execution only with exact current-session Explicit User Authorization and Hook Permission.
- **Forbidden Actions:** Running tests/gates/builds/browser checks from convention, using inline markers as authorization, or claiming an unobserved result.
- **Risk:** Quality, release, browser, and owner-control risk.
- **Expected Evidence:** Exact command, repository-root cwd, scope, authorization, hook decision, exit status, output limitation, and behavior not verified.
- **Next Decision:** Keep the check pending or route to `verify-and-gate` only when both permissions are established.

## Four command classes

1. **read-only inspection** — file/path/document inspection without a user-owned quality, service, data, or external action;
2. **Normal-Agent Eligible Check** — an exact, named, non-mutating type/lint/static check explicitly permitted by the live policy and enabled hook;
3. **Protected Command** — Full Gate, tests, coverage, browser-test runner, build, deployment, database action, backup, or Local-Service Command;
4. **no-run pending authorization** — a command lacking exact authorization, Hook Permission, explicit eligibility, or required evidence.

Protected Commands require both exact current-session Explicit User Authorization and Hook Permission. An inline environment variable, prompt token, comment, old plan, or task wording is not enough. While the active `block-agent-tests` hook matches `typecheck`, `pnpm run typecheck` remains pending user validation unless a separate Policy Implementation Proposal changes the allowlist. `pnpm run typecheck:scripts` is unavailable while `./scripts/tsconfig.json` is absent and is excluded from suggested validation.

## Honest validation record

For every observed check record:

```text
Exact command:
Repository-root working directory:
Scope:
Explicit User Authorization:
Hook Decision:
Exit status:
Output limitation:
Behavior not verified:
```

A configured script is not a passing result. One Vitest lane is not the full suite. Disk/source evidence is not browser, hosted-persistence, deployment, or external-provider evidence. If a check was not run, state the exact command and reason as pending, blocked, unauthorized, or not applicable.

## D21 failure triage

When a Full Gate Failure is reported or observed, do read-only Failure Triage before proposing a gate, hook, baseline, test-selection, or allowlist change. Capture the exact Full Gate command, root cwd, authorization, hook decision, exit status, first failed subcommand, relevant output summary, and cause classification. If current authorized output is absent, call the cause `unobserved`/`unverified`, request the smallest authorized diagnostic, and preserve gate composition, test selection, coverage, quality baselines, and Hook Permission enforcement. Record a True Blocker only in root `./Failures.md` with reproducible evidence and exact authorization; supporting analysis belongs in an approved `./agents-work/<workstream>/<report-type>/` folder.

## Validation response boundary

The Plain-Language Response Contract is required for every task lifecycle response. Include selected/rejected skills, exact first evidence paths, allowed checks, Protected or pending checks, exact completion proof, and unavoidable Owner Decisions. A task may be statically coherent while rendered interaction, hosted persistence, command success, or external state remains unverified; report that limitation explicitly.
