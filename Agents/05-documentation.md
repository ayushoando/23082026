# Documentation handbook

## Authority map

| Need | Open |
|------|------|
| Process floor | [`../AGENTS.md`](../AGENTS.md) |
| Blockers | [`../Failures.md`](../Failures.md) |
| Doc index | [`../CONTENTS.md`](../CONTENTS.md) |
| Structure | [`../DOC-MAP.md`](../DOC-MAP.md) |
| Durable facts (stack / routes / schema / rules) | `docs/architecture/*` · `docs/database/*` · `docs/governance/*` |
| Deploy / migrate | [`../OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) |
| Testing | [`../Testing-handbook.md`](../Testing-handbook.md) |
| Coordination (active plan) | [`../plans/PLAN.md`](../plans/PLAN.md), [`../plans/README.md`](../plans/README.md) — never a fact source here |

## Rules

- Do not create shadow plans outside `plans/`.
- Do not invent PASS from plan files or `results/`.
- Prefer editing `plans/**` when coordinating programme work; keep facts in `docs/` / live code.
- **Placement:** active execution plan → [`plans/PLAN.md`](../plans/PLAN.md); index → [`plans/README.md`](../plans/README.md). Optional lazy context → `plans/CONTEXT.md`, `plans/adr/`. Evidence → `results/**`.
- `check:plans-purity` only checks that `plans/` exists.
