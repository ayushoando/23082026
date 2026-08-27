# Plans

This directory holds active planning coordination. Durable architecture facts belong in `docs/`; current behavior belongs in live code.

| Location | Role |
|---|---|
| Plan folders (`plans/<name>/`) | Canonical requirements, design, tasks, and plan-owned evidence for active work. |
| [`focss-static-defects/`](./focss-static-defects/) | Reconciled static-defects plan and its colocated audit/decision records. |
| [`plans-reports-references.csv`](./plans-reports-references.csv) | Root registry of known plans, reports, and durable references. |
| [`CONTEXT.md`](./CONTEXT.md) | Optional lazy domain glossary; create only when domain modeling requires it. |
| [`adr/`](./adr/) | Optional architecture decision records. |

**Truth order:** user → live code + fresh commands → `AGENTS.md` → `Agents/` → `docs/` → `plans/`.

**Issues / triage:** local Markdown under `plans/` (see `AGENTS.md` §Issue tracker). Hard blockers → [`Failures.md`](../Failures.md).

**Evidence placement:** plan-specific, handwritten audit evidence stays beside its owning plan. Generated evidence belongs in `results/**`; do not hand-write audit reports there.
