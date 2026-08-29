# 07 · Docs, governance, and planning

[← Operations and infrastructure](06-operations-infrastructure.md) · [Next: Kiro workspace →](./08-kiro-workspace.md)

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

Next: [Kiro workspace](./08-kiro-workspace.md).


## D18 — Documentation, architecture, locked, and legacy guidance card

- **Goal:** Place a durable documentation outcome under the canonical owner while preserving authority, locked sources, and legacy constraints.
- **Start Paths:** `./docs/architecture/`; `./docs/database/`; `./docs/governance/`; `./docs/governance/charter.md`; `./docs/governance/focss-stop-drift.md`; `./AGENTS.md`; `./DOC-MAP.md`; `./CONTENTS.md`; `./site/data/storage/`; `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`.
- **Scope:** Durable docs, root procedures, plans, guide work, locked paths, legacy paths, and Markdown/HTML provenance.
- **Evidence Steps:** Read authority; inspect the owning path; compare documentation to live evidence; classify lock/legacy/documentation risk; record canonical owner, placement, and next decision.
- **Allowed Actions:** Read-only evidence and approved edits in owned guide files.
- **Forbidden Actions:** Changing `./docs/`, `./Agents/`, root files, `./Failures.md`, HTML projections, or legacy source without exact authorization/provenance.
- **Risk:** Authority, placement, scope, and stale-documentation risk.
- **Expected Evidence:** Canonical owner, status, source relationship, exact destination, and evidence limitation.
- **Next Decision:** Use a Workstream Subfolder for authored guide work or D22 when ownership is unclear.

## D19 — Results, generated documents, agent work, and blockers card

- **Goal:** Classify and place authored, generated, planned, and blocker artifacts without mixing evidence types.
- **Start Paths:** `./results/`; `./results/tests/`; `./results/site/`; `./results/site-ui/`; `./results/ops/`; `./generated-documents/`; `./agents-work/`; `./plans/`; `./plans/README.md`; `./Failures.md`; `./agent-reports/`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Artifact Class, Workstream/Purpose Subfolder, producer ownership, root legacy output, and canonical blockers.
- **Evidence Steps:** Read placement authorities; inspect the proposed/observed artifact; compare producer and destination; classify evidence/ownership risk; record placement and next action.
- **Allowed Actions:** Read-only inventory and approved guide updates; producer-owned generation only in a separately authorized task.
- **Forbidden Actions:** Handwritten reports in `./results/`, new reports at `./agents-work/` root, hand-editing generated output, or duplicate blocker ledgers.
- **Risk:** Evidence integrity, discoverability, and audit risk.
- **Expected Evidence:** Artifact Class, exact subfolder, filename pattern, owning source/script, authored/generated state, rejected placements, and observed placement.
- **Next Decision:** Select the approved destination before any Output-Producing Task write.

## Locked Path Gate

Treat every file directly under `./`, every path under `./docs/`, every path under `./Agents/`, and every path under `./.kiro/agents/` as Locked Paths and Read-Only Evidence Sources. Root-level `./*.md` files are included, but the protected set is not limited to Markdown. Before any write or delete, classify the exact target as `Locked`, `explicitly owner-authorized`, or `writable`. Only the exact file named and authorized by the Repository Owner in the current request is owner-authorized; a general task description does not unlock neighboring files. If authorization is absent, stop before modification, preserve the source, record the unavoidable Owner Decision and Separate Approval Work, and put supporting analysis only in `./agents-work/<workstream>/<report-type>/`. Never create a copy, mirror, or generated substitute and claim the locked source changed. `./agents-work/` is distinct from `./Agents/`; `./Failures.md` remains the sole canonical blocker ledger and changes only under exact authorization.

## Artifact placement reference

| Artifact Class | Approved destination | Rejected destination |
|---|---|---|
| Agent Work Report | `./agents-work/<workstream>/<report-type>/` or approved guide workstream | `./agents-work/` root, `./results/`, `./site/` |
| Machine Evidence | `./results/<purpose>/` | `./results/` root, `./agents-work/`, `./site/` |
| Generated Tech-Docs Output | `./generated-documents/` | `./results/`, `./agents-work/`, `./site/` |
| Active Plan | `./plans/<name>/` indexed by `./plans/README.md` | `./results/`, `./site/`, unowned root |
| True Blocker | Root `./Failures.md` with supporting workstream analysis | Any second ledger |
| Core Product Write | Approved product source, including `./site/` only after Site Write Gate | `./site/` for non-core artifacts |
| Repository Skill | `./.kiro/skills/` | `./site/`, `./results/`, `./agents-work/` |

> If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.

For every Output-Producing Task, the Route Record declares Artifact Class, selected Workstream or Purpose Subfolder, filename pattern, owning source/script, authored-or-generated state, rejected placements, and Site Write Gate state when applicable. The Completion Record repeats those fields with observed placement evidence. Existing root artifacts without observed purpose assignment remain `legacy/owner-review pending`; no relocation is claimed.

## Guide projection and separate approval boundary

The current guide Markdown is the human-authored work surface under `./agents-work/oando-repository-guide/`. Matching HTML is not modified until a Markdown-to-HTML source relationship is evidenced. If provenance remains unresolved, leave HTML unchanged and record a Coverage-Gap Admission. Hook/policy, product runtime, package, database, deployment, backup, external MCP, Power, and workspace-boundary changes are Separate Approval Work, not documentation completion.
