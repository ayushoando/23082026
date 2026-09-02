# Plans

Active sequence: [`PLAN.md`](./PLAN.md).

## Sequence folders

| Folder | Phase |
|---|---|
| [`client-hub/`](./client-hub/) | Spine — public/client route map |
| [`chrome/`](./chrome/) | 1 — public chrome ([handover](./chrome/handover.md)) |
| [`homepage/`](./homepage/) | 2 — homepage + CSS |
| [`map-equals-code/`](./map-equals-code/) | 3 — redirects and indexability |
| [`walk/`](./walk/) | 4 — browser |

## Packets (input, not the spine)

`ui-audit` (CSS/tokens), `seosec`, `planner-audit`, `studio-audit`, `admin-audit`, `ai-audit`, `packages`, `db-audit`, `testing-audit`, `worker-audit`, `execution-checklist.md`.

`planner-comprehensive-audit/` is dated. Tests still import its `.ts` files. Do not treat it as the live plan.

Route map: [`client-hub/flowcharts/clients-hub-flow.md`](./client-hub/flowcharts/clients-hub-flow.md). Architecture: `docs/`. Blockers: [`Failures.md`](../Failures.md).
