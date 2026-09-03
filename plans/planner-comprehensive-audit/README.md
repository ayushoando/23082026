# Dated — not the active plan

TypeScript here is leftover from a Planner audit workstream. Tests still import it. Do not extend this folder as a live plan.

**Decision that still holds:** [`decisions/task-4-9-schema-gap-decision.md`](./decisions/task-4-9-schema-gap-decision.md) — no extra Admin migration (`TASK_4_10_BRANCH = "no-migration"` in `schemaGapDecision.ts`). Remaining gaps are generated RPC types, Drizzle receipt envelope, legacy `projectsStore` paths, and a stale test — not missing SQL.

**Completion update (2026-09-03):** The authorized Admin dry run, application, and type generation completed successfully. The generated RPC type, Drizzle receipt envelope, adapter handoff, and migration test record are reconciled. The legacy `projectsStore` path is explicitly a non-atomic portal/Admin compatibility boundary, not the interactive Planner workspace flow.

Active sequence: [`../PLAN.md`](../PLAN.md).
