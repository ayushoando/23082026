# Plans

Coordination lives here; durable architecture facts live in `docs/` and live code.

| File | Role |
| --- | --- |
| [`PLAN.md`](./PLAN.md) | **Active** execution plan (marketing i18n parity hardening) |
| [`CONTEXT.md`](./CONTEXT.md) | Optional lazy domain glossary (create when modeling) |
| [`adr/`](./adr/) | Optional architecture decision records |

**Truth order:** user → live code + fresh commands → `AGENTS.md` → `Agents/` → `docs/` → `plans/`.

**Issues / triage:** local Markdown under `plans/` (see `AGENTS.md` §Issue tracker). Hard blockers → [`Failures.md`](../Failures.md).

**Evidence:** `results/**` only — no hand-written audit reports under `results/`.
