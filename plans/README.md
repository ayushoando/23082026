# Plans

Planning and audit records. Durable architecture facts belong in `docs/`; current behavior belongs in live code.

## Layout (reorganized 2026-09-01 — former `plans/<name>/` folders now live under [`audit/`](./audit/))

| Location | Role |
|---|---|
| [`audit/`](./audit/) | Repository audit program. One folder per report (`NN-slug/` with `findings.md` + `plan.md`, plus `findings-resolved.md` / `findings-remaining.md` as remediation lands). Index: [`audit/INDEX.md`](./audit/INDEX.md). |
| `audit/01–29/` | Full-repo static audit: findings + remediation plans (remediation tracked per folder). |
| `audit/30–36/` | Post-audit verification findings (git-history orphans, CVE/currency, i18n hi quality, canvas algorithms, runtime verification, bundle/SEO/visual, DB-worker-CI observed run) — findings only, no plans. |
| [`audit/planner-audit/`](./audit/planner-audit/) · [`audit/studio-audit/`](./audit/studio-audit/) · [`audit/testing-audit/`](./audit/testing-audit/) · [`audit/ui-audit/`](./audit/ui-audit/) · [`audit/worker-audit/`](./audit/worker-audit/) | The 5 closed pre-audit audit+remedy programs, moved intact under `audit/` (see `audit/INDEX.md` §Legacy program reconciliation). |
| [`audit/FIX-LOG-20260901.md`](./audit/FIX-LOG-20260901.md) | Verification-sweep fix log — one entry per corrected file, with evidence. |
| [`audit/PLAN.md`](./audit/PLAN.md) | Active-plan placeholder (none in flight). |
| [`audit/execution-checklist.md`](./audit/execution-checklist.md) | Remediation execution checklist (superseded in large part by the per-folder `findings-resolved.md`/`findings-remaining.md`; removal awaits owner confirmation). |
| [`remaining-areas/`](./remaining-areas/) | Backlog of audit areas not yet covered (list only, prerequisites stated). |
| [`.archive/`](./.archive/) | Retired plan folders kept for the record (currently `03-module-boundaries-fork/`). |

There is no `plans/CONTEXT.md` or `plans/adr/`; create them only if/when domain modeling or ADRs are actually needed.

**Truth order:** user → live code + fresh commands → `AGENTS.md` → `Agents/` → `docs/` → `plans/`.

**Issues / triage:** local Markdown under `plans/` (see `AGENTS.md` §Issue tracker). Hard blockers → [`Failures.md`](../Failures.md).

**Evidence placement:** plan-specific, handwritten audit evidence stays beside its owning plan. Generated evidence belongs in `results/**`; do not hand-write audit reports there.
