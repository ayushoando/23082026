# Documentation workflow

Use this workflow to place, edit, and report repository documentation without creating competing authority or evidence stores. Read the [documentation map](../DOC-MAP.md) before editing and preserve the authority order from [the process floor](../AGENTS.md).

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
| Coordination and active plans | [`../plans/README.md`](../plans/README.md) and its indexed plan folders — never a durable fact source |

## Rules

- Do not create shadow plans outside `plans/`.
- Do not invent PASS from plan files or `results/`.
- Prefer editing `plans/**` when coordinating programme work; keep facts in `docs/` / live code.
- **Placement:** active execution plans and plan-owned evidence → the folders indexed by [`plans/README.md`](../plans/README.md). Optional shared context → `plans/CONTEXT.md`, `plans/adr/`. Generated evidence → `results/**`.
- `check:plans-purity` only checks that `plans/` exists.
