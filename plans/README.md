# Plans

Active coordination only. Architecture facts live in `docs/`. The public/client page map is `agents-work/client-hub/flowcharts/clients-hub-flow.md`.

**Truth order:** user → live code + fresh commands → `AGENTS.md` → `Agents/` → `docs/` → `plans/`.

Hard blockers go in [`Failures.md`](../Failures.md). Generated evidence goes in `results/`.

## Live

| Path | Role |
|---|---|
| [`PLAN.md`](./PLAN.md) | Whether a cross-cutting plan is in flight (currently none) |
| [`planner-comprehensive-audit/`](./planner-comprehensive-audit/) | TypeScript modules imported by tests — keep |

## Closed packets

These are finished audit/remedy records, not a new build list. Read the folder only when you need that surface’s history.

| Path | Surface |
|---|---|
| [`seosec/`](./seosec/) | SEO and security |
| [`ui-audit/`](./ui-audit/) | Marketing UI |
| [`packages/`](./packages/) | Dependencies |
| [`ai-audit/`](./ai-audit/) | AI / vector search |
| [`admin-audit/`](./admin-audit/) | Admin |
| [`studio-audit/`](./studio-audit/) | Studio |
| [`planner-audit/`](./planner-audit/) | Planner |
| [`db-audit/`](./db-audit/) | Databases and migrations |
| [`testing-audit/`](./testing-audit/) | Test and gate machinery |
| [`worker-audit/`](./worker-audit/) | Cloudflare worker |
| [`execution-checklist.md`](./execution-checklist.md) | 2026-08-31 session log of work already done |

## Not in this tree

`focss-static-defects/`, `CONTEXT.md`, `adr/`, and `plans-reports-references.csv` were listed here before. They are not on disk. Do not recreate them.
