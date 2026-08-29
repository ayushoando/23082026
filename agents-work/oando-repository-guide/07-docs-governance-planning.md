# 07 · Docs, governance, and planning

[← Operations and infrastructure](06-operations-infrastructure.md) · [Next: Kiro workspace →](08-kiro-workspace.md)

## Authority order

```text
current user instruction
→ live code and fresh command output
→ AGENTS.md
→ Agents/
→ docs/
→ plans/
```

## Documentation homes

| Area | Location | Use it for |
|---|---|---|
| Durable architecture | `docs/architecture/` | Layout, product map, stack, routes, CSS, script catalog. |
| Database reference | `docs/database/` | Schema, Drizzle, operations, RLS/persistence/restore planning. |
| Governance | `docs/governance/` | Rules, benchmarks, charter, FOCSS stop-drift. |
| Root front doors | `START.md`, `README.md`, `CONTENTS.md`, `DOC-MAP.md` | Onboarding, product facts, index, documentation placement. |
| Procedures | `OPERATIONS_RUNBOOK.md`, `Testing-handbook.md` | Deploy/migrate/backup/rollback and validation procedures. |
| Hard blockers | `Failures.md` | The only blocker ledger. |
| Ownership/handoff | `owners.md`, `HANDOVER.md` | Ownership/reference context; verify against live source. |

## Planning and evidence

| Path | Role |
|---|---|
| `plans/README.md` | Planning coordination rules/index. |
| `plans/PLAN.md` | Current live plan material, if applicable. |
| `plans/<name>/` | Named-plan requirements/design/tasks/evidence when a plan exists. |
| `results/` | Generated output only. Never hand-write a plan/audit report there. |
| `Failures.md` | Genuine unresolved hard blockers only. |

## Agent handbooks and scoped instructions

| Area | Role |
|---|---|
| `Agents/01-standard.md` | Core repository execution procedure. |
| `Agents/02-testing.md` / `03-browser.md` | Test/browser evidence rules. |
| `Agents/04-failures.md` | Blocker handling. |
| `Agents/05-documentation.md` | Documentation procedure. |
| `Agents/06-architecture.md` / `07-css.md` | Architecture/CSS guidance. |
| `.github/instructions/` | Boundaries, FOCSS, migrations, testing instructions applied by scope. |

## Correct placement request

```text
Update the correct durable documentation for [change]. State which source is
canonical, preserve authority order, and do not create a handwritten report in results/.
```

Next: [Kiro workspace](08-kiro-workspace.md).