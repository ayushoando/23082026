# 10 · Quality and validation

[← Local/generated/environment](09-local-generated-environment.md) · [Next: working with Kiro →](11-working-with-kiro.md)

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

Next: [Working with Kiro](11-working-with-kiro.md).