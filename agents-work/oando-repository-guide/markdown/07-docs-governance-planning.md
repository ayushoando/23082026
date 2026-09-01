# 07 · Docs, governance, and planning

[← Operations and infrastructure](06-operations-infrastructure.md) · [Next: agent workspace →](./08-agent-workspace.md)

## Authority order

Use this order for every documentation, placement, planning, and governance decision:

```text
current user instruction
→ live code and fresh command output
→ AGENTS.md
→ Agents/
→ docs/
→ plans/README.md and the indexed active plan
```

`plans/README.md` coordinates active plans after the repository authority sources; it does not override live behavior. If documentation conflicts with live evidence, preserve the live fact, label the documentation claim pending correction, and do not silently create a competing authority.

## Documentation homes

| Area | Location | Use it for |
|---|---|---|
| Durable architecture | `docs/architecture/` | Layout, product map, stack, routes, CSS, and script catalog. |
| Database reference | `docs/database/` | Schema, Drizzle support, operations, RLS, persistence, and restore planning. |
| Governance | `docs/governance/` | Rules, benchmarks, charter, and FOCSS stop-drift constraints. |
| Root front doors | `START.md`, `README.md`, `CONTENTS.md`, `DOC-MAP.md` | Onboarding, product facts, indexes, and documentation placement. |
| Procedures | `OPERATIONS_RUNBOOK.md`, `Testing-handbook.md` | Deploy, migrate, backup, rollback, and validation procedures. |
| Hard blockers | `Failures.md` | The only canonical True Blocker ledger, with reproducible evidence. |
| Active planning | `plans/README.md`, `plans/<name>/` | Requirements/design/tasks and plan-owned evidence for an active plan. |
| Agent work | `agents-work/<workstream>/<report-type>/` | Human-authored guide, research, handoff, or workstream material. |

Durable reference changes belong under their canonical owner; active coordination belongs in an indexed plan; generated command evidence belongs under a purpose subfolder of `results/`; authored guide work belongs in the approved guide workstream. A location label is not proof that an artifact is current or generated.

## Planning and evidence

| Path | Role and boundary |
|---|---|
| `plans/README.md` | Planning coordination rules and index; read after authority sources. |
| `plans/<name>/` | Named-plan requirements, design, tasks, and plan-owned evidence when that plan exists. |
| `results/<purpose>/` | Machine-generated command/check evidence only, such as tests, site, site-ui, ops, or tooling purposes. |
| `generated-documents/` | Disposable output owned by the root `tech-docs-generator/` package; never hand-edit. |
| `agents-work/<workstream>/<report-type>/` | Agent-authored reports/work products and guide chapters. |
| `Failures.md` | True Blockers only, with exact reproduction evidence and current authorization for any write. |

Do not hand-write a plan, audit, guide, status, or handoff report under `results/`. Do not create a new report at the `agents-work/` root. Do not copy a locked source into an approved workstream and claim that the source changed.

## Correct placement request

```text
Update the correct durable documentation for [change]. State the canonical owner,
authority order, Artifact Class, exact Workstream or Purpose Subfolder, filename pattern,
owning source or script, authored/generated state, rejected placements, and proof limit.
Do not create a handwritten report in results/ or change a Locked Path without exact authorization.
```

## D18 — Documentation, architecture, locked, and legacy guidance card

- **Goal:** Place a durable documentation outcome under the canonical owner while preserving authority, locked sources, and legacy constraints.
- **Start Paths:** `./docs/architecture/`; `./docs/database/`; `./docs/governance/`; `./docs/governance/charter.md`; `./docs/governance/focss-stop-drift.md`; `./AGENTS.md`; `./DOC-MAP.md`; `./CONTENTS.md`; `./site/data/storage/`; `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`.
- **Scope:** Durable docs, root procedures, plans, guide work, Locked Paths, legacy paths, and artifact placement.
- **Evidence Steps:** Read authority; inspect the canonical owner and live path; compare documentation to live evidence; classify lock/legacy/documentation risk; record owner, placement, source relationship, limitation, and next decision.
- **Allowed Actions:** Read-only evidence and explicitly approved edits in owned guide files.
- **Forbidden Actions:** Changing `./docs/`, `./Agents/`, direct root files, `./Failures.md`, or legacy sources without exact authorization; treating a copy as a source update.
- **Risk:** Authority, placement, scope, lock, provenance, and stale-documentation risk.
- **Expected Evidence:** Canonical owner, status, exact destination, Artifact Class, source relationship, authorization boundary, and evidence limitation.
- **Next Decision:** Use an approved guide Workstream Subfolder for authored guide work, or route to D22 when ownership/provenance is unclear.

## D19 — Results, generated documents, agent work, and blockers card

- **Goal:** Classify and place authored, generated, planned, and blocker artifacts without mixing evidence types or creating competing ledgers.
- **Start Paths:** `./results/`; `./results/tests/`; `./results/site/`; `./results/site-ui/`; `./results/ops/`; `./generated-documents/`; `./agents-work/`; `./plans/`; `./plans/README.md`; `./Failures.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Artifact Class, Workstream/Purpose Subfolder, filename, producer ownership, authored/generated state, legacy root output, and canonical blockers.
- **Evidence Steps:** Read placement authorities; inspect the proposed or observed artifact; compare producer and destination; classify evidence/ownership risk; record placement and next action.
- **Allowed Actions:** Read-only inventory and approved guide updates; producer-owned generation only in a separately authorized task.
- **Forbidden Actions:** Handwritten reports in `./results/`, new reports at `./agents-work/` root, hand-editing `./generated-documents/`, duplicate blocker ledgers, or treating `./results/site/` as product source.
- **Risk:** Evidence integrity, discoverability, ownership, and audit risk.
- **Expected Evidence:** Artifact Class; exact subfolder; filename pattern; owning source/script; authored/generated state; rejected placements; observed placement or explicit not-observed state.
- **Next Decision:** Select and record the approved destination before any Output-Producing Task write.

## Locked Path Gate

Treat every direct root file, every path under `./docs/`, and every path under `./Agents/` as a Locked Path and Read-Only Evidence Source. This includes direct root controls such as `./AGENTS.md`, `./Failures.md`, `./DOC-MAP.md`, and `./CONTENTS.md`. Before any write or delete, classify the exact target as `Locked`, `explicitly owner-authorized`, or `writable`.

Only the exact file named and authorized by the Repository Owner in the current request is owner-authorized; naming one file does not unlock its neighbors. A read grant is not write or delete permission. If authorization is absent, stop before modification, preserve the source, record the Owner Decision and Separate Approval Work, and place supporting authored analysis only in an approved `./agents-work/<workstream>/<report-type>/` folder. Never create a copy, mirror, or generated substitute and claim that a Locked Path changed. `./agents-work/` is distinct from `./Agents/`; `./Failures.md` remains the sole canonical blocker ledger.

This guide's Markdown work surfaces under `./agents-work/oando-repository-guide/markdown/` are authored guide work, but only the exact files named and authorized by the current request are writable; a lane's authorization does not extend to sibling guide files it does not name, root/docs/Agents files, or any product/runtime path.

## Site Write Gate

`./site/` is the Next.js product source tree. Before any write under it, classify the target as one of:

- **Approved Core Product Write:** an explicitly approved product outcome with exact owned paths, matching skills (the live `oando-*` routing intents per chapter 01), and expected source/static or authorized runtime evidence; or
- **Non-Core Artifact:** a report, result, audit, handoff, prompt, plan, skill, steering file, MCP definition, generated file, temporary/debug file, or other work product that must be redirected away from `./site/`.

Reject or redirect every Non-Core Artifact under `./site/`, including documentation produced by an agent. Use `./agents-work/<workstream>/<report-type>/` for authored work, `./results/<purpose>/` for machine evidence, and `./generated-documents/` for tech-docs generator output. `./results/site/` is a machine-evidence purpose folder and is not the Site Source Tree. A source-path label or documented placement decision does not prove relocation.

A Site Write Gate record names the exact product outcome, owned paths, matching skills, Artifact Class, expected evidence, and rejected placement. This documentation lane has no Site Write; every target it names is under the approved guide workstream.

## Artifact placement reference

| Artifact Class | Owner/source | Authored or generated | Approved destination | Rejected destination |
|---|---|---|---|---|
| Agent Work Report / guide work product | Agent or Repository Owner; exact workstream owner | Authored | `./agents-work/<workstream>/<report-type>/` or approved `./agents-work/oando-repository-guide/` | `./agents-work/` root, `./results/`, `./site/` |
| Machine Evidence | Command/script producer | Generated | `./results/<purpose>/` | `./results/` root, `./agents-work/`, `./site/` |
| Generated Tech-Docs Output | `./tech-docs-generator/` scripts | Generated/disposable | `./generated-documents/` | `./results/`, `./agents-work/`, `./site/` |
| Active Plan | Plan owner | Authored | `./plans/<name>/`, indexed by `./plans/README.md` | `./results/`, `./site/`, unowned root |
| True Blocker | Repository Owner with reproduction evidence | Authored record | Root `./Failures.md` only | Any second ledger or guide/report substitute |
| Core Product Write | Approved product owner/source | Authored | Approved product source, including `./site/` only after Site Write Gate | `./site/` for Non-Core Artifacts |
| Agent Skill | Skill owner | Authored | User-global opencode configuration under `~/.config/opencode/`, outside this repository; no repository skill home | `./site/`, `./results/`, `./agents-work/` |

For every Output-Producing Task, the Route Record declares Artifact Class, exact Workstream or Purpose Subfolder, filename pattern, owning source or script, authored/generated state, rejected placements, and Site Write Gate state when applicable. The Completion Record repeats those fields with observed placement evidence. Existing root artifacts without observed purpose assignment remain `legacy/owner-review pending`; no relocation is claimed.

## Separate Approval Work

This guide's Markdown is the source of truth under `./agents-work/oando-repository-guide/`; its `html/` projection is regenerated by the tech-docs pipeline. Separate Approval Work includes hook/policy or command-allowlist changes; runtime enforcement, automatic Agent spawning, or contract append; product runtime and `./site/` changes; package installation or workspace-boundary changes; database/migration/RLS/grant/deployment/backup actions; external MCP configuration; and generated-output or local-service actions. None is implied by these guide chapters.

Next: [Agent workspace](./08-agent-workspace.md).
