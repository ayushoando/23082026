# Implementation Plan: Oando Master Repository Guide and Router

## Overview

This plan reconciles the existing oando-master Quick Spec with Design §§21–32 and Requirements 33–40. It is an open, planning-only plan for guidance and documentation work: the repository guide, its live Markdown chapters, an HTML projection only when provenance is evidenced, the prose-only `oando-master` router, and an optional AI guidance branch only after an explicit Owner Decision.

The only mutation authorized in the current Tasks phase is this existing artifact:

- `./.kiro/specs/oando-master/tasks.md`

No application-code, product-UI, runtime, database/migration, package, lockfile, deployment, backup, local-service, hook, MCP, Power, settings, generated-output, test-harness, protected-path, contract-append, Exact-Line, Agent-definition, or implementation change is authorized by this phase. `./.kiro/specs/oando-master/.config.kiro` remains unchanged.

The downstream plan remains open. A checkbox is not completion evidence. A leaf may reach `verified` or `complete` only after its exact static evidence, handoff, ownership, approval, and validation state are recorded. Missing or unobserved evidence remains `pending-owner`, `blocked`, or `not-observed`.

## Required task-generation instruction

Convert the Design into a series of prompts for a code-generation LLM that will implement each approved guidance step with incremental progress. Each prompt must build on the preceding prompt, name its exact owned paths and exclusions, and end by wiring the approved guidance together. There must be no hanging or orphaned guidance. Focus only on writing, modifying, or testing code or approved guidance artifacts. The current Tasks phase itself performs no downstream implementation and no protected validation; any future test or static-check branch remains owner-approved and decision-gated.

Every future leaf below is therefore a prompt contract with: objective; dependency; exact paths; one of the four role slots; permission; exclusions; approval gate; expected evidence; handoff fields; and terminal-state rule.

## Fixed four-slot operating model

Every numbered task, checkpoint, handoff, and future implementation phase uses exactly four declared Active Agent entries. `Coordinator/Serial Integration Owner` is a designation attached to one slot, not a fifth role.

| Agent slot | Role | Permission in this plan | Ownership |
|---|---|---|---|
| `S/M-01` | **Scout/Map** | Read-only orientation and evidence discovery | Authority, exact paths, inventories, provenance, and coverage facts |
| `P/R-01` | **Planner/Risk** | Read-only decomposition and risk/approval planning | Route Record, requirements mapping, risk, command classification, and Owner Decisions |
| `I/C-01` | **Implementer** with **Coordinator/Serial Integration Owner** attached | Read-only until an approved exclusive write scope exists; then exact-path writes only | One current owned path at a time; serial handoff reconciliation and integration |
| `V/R-01` | **Verifier/Reporter** | Read-only evidence and closure review | Static read-back, coverage gaps, changed-path audit, Completion Record, and honest limitations |

The plan-declared roster always contains exactly four entries, the role set above, and exactly one `coordinator: true` field on `I/C-01`. “Active” here means declared in the controlled plan; host/runtime creation or loading remains `not-observed` unless separately evidenced. The five physical files under `./.kiro/agents/` are a separate inventory and must be preserved, including `./.kiro/agents/spec-task-runner2.md`; they must not be deleted, renamed, disabled, or modified to make the counts equal. There is no silent one-Agent fallback.

Parallel work is limited to read-only research or genuinely disjoint exclusive ownership. Shared vocabulary, shared files, handoffs, and integration are serial. Every handoff is reconciled by `I/C-01` before a later write or shared-path assignment.

## Phase-wide gates, records, and evidence

### Locked scope and approval gates

- **Current writable artifact:** only `./.kiro/specs/oando-master/tasks.md`, because the user explicitly requested this existing Tasks artifact.
- **Protected read-only evidence:** every path under `./docs/`; every path under `./Agents/`; every file directly under `./` including `./AGENTS.md`, `./Failures.md`, `./DOC-MAP.md`, and `./CONTENTS.md`; and every path under `./.kiro/agents/`.
- **Exact-file authorization:** a protected write or delete requires the Repository Owner to name that exact file in the current request. Naming one file does not unlock neighbors. A copy, mirror, generated substitute, or report never proves the protected source changed.
- **No contract append:** the 36 Active Contract-Bearing Documents are inventoried and classified, but no Kiro Agent Contract or Canonical Inclusion is appended in this phase. Any later append is a separate Owner-approved task with an exact target list.
- **No Exact-Line rollout:** the future rule is defined below, but neither `./AGENTS.md` nor any `./Agents/**` file is changed in this phase. The phrase “relevant guidance” is not authorization.
- **No migration:** migration directories and database guidance are read-only evidence. No SQL, migration, rollback, grant, policy, seed, type-generation, or database action is included or run.
- **No application code:** no write under `./site/`, no route/component/server/store/hook/lib change, no product UI change, and no runtime implementation.
- **No unauthorized commands:** tests, gates, builds, typechecks, scripts, package commands, browser runs, local services, database actions, deployment, backup, Power, MCP, and implementation commands are not run. `pnpm run typecheck:scripts` remains unavailable while `./scripts/tsconfig.json` is absent and is not validation.
- **Optional branches:** `./.kiro/skills/ai-retrieval/SKILL.md` remains absent unless explicitly selected; HTML writes remain conditional on evidenced Markdown-to-HTML provenance; future enforcement/checker work remains Separate Approval Work.

### Fail-closed Pre-Action Gate contract

A future executable or host-integrated Pre-Action Enforcement Layer must evaluate one Action Record before every `read`, `write`, `delete`, `command`, `delegation`, and `handoff`. Markdown, prompts, self-attestation, post-review, or a save hook alone do not satisfy the enforcement requirement. Missing, malformed, stale, ambiguous, contradictory, denied, unavailable, or indeterminate gate state denies before execution, records the reason and next owner action, and never selects an alternate tool, path, Agent, permission, or inferred approval.

| Action | Required allow checks | Mandatory deny conditions |
|---|---|---|
| `read` | task/Agent identity, role, exact target, read permission, Protected Path classification, current status | missing identity/target/permission/status; a protected read must remain read-only |
| `write` | all read checks plus exact target, exclusive/serial ownership, write permission, Route Record, Protected Path Lock, Site Write Gate when relevant, and delivery match | unowned/shared target, absent route, locked target without exact owner authorization, missing gate, or unmet delivery |
| `delete` | exact target, explicit deletion scope, exact owner authorization, exclusive ownership, and Protected Path Lock | no exact current-request authorization, protected/ambiguous target, or no exclusive owner |
| `command` | command classification, repository-root cwd, exact current-session authorization when required, Hook Permission, and recorded scope | absent authorization/hook, wrong cwd, unclassified command, or indeterminate result |
| `delegation` | coordinator function, receiver among the four roster entries, role, exact paths, delivery conditions, and next owner | fifth/unrostered receiver, missing role/path/condition, or non-coordinator delegation |
| `handoff` | every required field, ownership-matching changed paths, observed-versus-not-run distinction, and receiving owner | missing field, unexplained path, stale/contradictory evidence, or no receiver |

The current `block-agent-tests` hook is reported only for its observed command-tool scope. It is not generalized to reads, writes, deletes, delegation, or handoffs. Universal enforcement therefore remains `guidance-only` or `not-observed` until separately approved implementation and current-session observation establish otherwise.

### Required records and closed statuses

Every future controlled task starts with exactly these named deliverables:

1. Agent Roster.
2. Ownership Matrix.
3. Route Record.
4. Pre-Action Gate Records.
5. Handoff Record Register.
6. Conflict Stop Record when a conflict occurs.
7. Completion Record.

The lifecycle Status Vocabulary is closed to: `planned`, `assigned`, `ready`, `in-progress`, `blocked`, `denied`, `handoff-ready`, `serial-integrated`, `verified`, `complete`, `pending-owner`, and `not-observed`.

The Enforcement Status Vocabulary is closed to: `guidance-only`, `not-observed`, `partially-enforced`, `enforced`, and `blocked`.

A Handoff Record contains: Objective; Role and Next Owner; Scope; Paths Read and Paths Changed; Route Record; Evidence; Decisions; Coverage Gaps; Validation Command; Repository Root; Authorization State; Hook Decision; Exit Status; Validation Limitation; Blockers; Next Action; and Status. An unavailable field is `not-observed`, not omitted. Missing fields or proof keep the Completion Record `blocked`, `pending-owner`, or `not-observed`; they never become `verified` or `complete` by implication.

### Static/runtime evidence separation

Static path, text, count, link, ownership, scope, and read-back evidence may establish document facts only. It cannot establish runtime loading, automatic spawning, tool interception, fail-closed denial, command success, rendered behavior, hosted persistence, connected MCP, installed Power state, or external/global Kiro coverage. Host/integration observations establish only their observed scope. Owner-authorized command evidence must include the exact command, repository-root cwd, authorization state, Hook Decision, exit status, scope, and limitation.

### Unresolved Owner Decision Register

These decisions remain open and must be named before the affected future leaf can become `ready`:

- exact Active Contract-Bearing target set and choice of exact Kiro Agent Contract block versus exact Canonical Inclusion (`8.1`);
- host, implementation paths, and separately authorized scope for universal Pre-Action Enforcement (`8.2`);
- exact protected files selected for Protected Path Lock and future Exact-Line rollout, including `./AGENTS.md` and `./Agents/01-standard.md` (`8.3`);
- whether and where a real four-entry runtime roster/records checker can be established or observed without changing the five physical definitions (`8.4`);
- whether the optional `./.kiro/skills/ai-retrieval/SKILL.md` branch is selected (`6.2`);
- whether Markdown-to-HTML provenance is evidenced and which exact projection files may be written (`2.4`, `7.1`, `7.2`);
- whether the optional Property 1–20 checks receive an owner-approved future fixture/check scope (`10`);
- exact owner approval for each downstream guidance write; the current request authorizes only this `tasks.md` update.

## Reconciliation baseline

### Kiro Markdown inventory: 36 + 11 + 4 = 51

Task `2.1` must inventory each path individually with `path`, `classification`, `contractMode`, owner, evidence state, and limitation. `contractMode` is only `exact-block`, `canonical-inclusion`, `not-applicable`, or `not-observed`. A path or contract string is static evidence only and is never proof of runtime loading or enforcement.

**36 Active Contract-Bearing Documents**

- `./.kiro/agents/capability-powers-author.md`
- `./.kiro/agents/containment-reconciler.md`
- `./.kiro/agents/hook-localizer.md`
- `./.kiro/agents/spec-task-runner.md`
- `./.kiro/agents/spec-task-runner2.md`
- `./.kiro/skills/db-migrations/SKILL.md`
- `./.kiro/skills/focss-css/SKILL.md`
- `./.kiro/skills/fork-boundaries/SKILL.md`
- `./.kiro/skills/graph-impact/SKILL.md`
- `./.kiro/skills/oando-master/SKILL.md`
- `./.kiro/skills/planner-studio/SKILL.md`
- `./.kiro/skills/powers-skills-model/SKILL.md`
- `./.kiro/skills/repo-map/SKILL.md`
- `./.kiro/skills/verify-and-gate/SKILL.md`
- `./.kiro/steering/agent-behavior.md`
- `./.kiro/steering/ai.md`
- `./.kiro/steering/api.md`
- `./.kiro/steering/coding-standards.md`
- `./.kiro/steering/database.md`
- `./.kiro/steering/deployment.md`
- `./.kiro/steering/graph-layer.md`
- `./.kiro/steering/INDEX.md`
- `./.kiro/steering/ltm-memory-format.md`
- `./.kiro/steering/ltm-operations.md`
- `./.kiro/steering/nova-act-viewport.md`
- `./.kiro/steering/product.md`
- `./.kiro/steering/seo.md`
- `./.kiro/steering/tech-stack.md`
- `./.kiro/steering/testing.md`
- `./.kiro/steering/ui-css.md`
- `./.kiro/powers/analytics/POWER.md`
- `./.kiro/powers/oando-workflow/POWER.md`
- `./.kiro/powers/observability/POWER.md`
- `./.kiro/powers/security/POWER.md`
- `./.kiro/powers/oando-workflow/steering/routing.md`
- `./.kiro/kiro-repo-guidance-setup/README.md`

**11 Reference/History Documents**

- `./.kiro/kiro-repo-guidance-setup/RECONCILIATION.md`
- `./.kiro/specs/documentation-global-standards/design.md`
- `./.kiro/specs/documentation-global-standards/implementation-record.md`
- `./.kiro/specs/documentation-global-standards/requirements.md`
- `./.kiro/specs/documentation-global-standards/tasks.md`
- `./.kiro/specs/kiro-config-rewrite/design.md`
- `./.kiro/specs/kiro-config-rewrite/requirements.md`
- `./.kiro/specs/kiro-config-rewrite/tasks.md`
- `./.kiro/specs/oando-master/design.md`
- `./.kiro/specs/oando-master/requirements.md`
- `./.kiro/specs/oando-master/tasks.md`

**4 Package Documents, not active workspace contract surfaces**

- `./.kiro/power-packages/analytics/skills/analytics/SKILL.md`
- `./.kiro/power-packages/oando-workflow/skills/oando-workflow/SKILL.md`
- `./.kiro/power-packages/observability/skills/observability/SKILL.md`
- `./.kiro/power-packages/security/skills/security/SKILL.md`

The negative inventory must record no Generated Kiro Markdown claimed, no Markdown observed under `./.kiro/hooks/`, `./.kiro/mcp/`, or `./.kiro/settings/`, and inaccessible External or Global Kiro files as `not-observed`. Reference/History, Package, Generated, and inaccessible documents are not reported as active contract coverage without a separate Owner-approved scope.

### Live guide Markdown and conditional projection surfaces

The 12 live guide Markdown paths are:

- `./agents-work/oando-repository-guide/README.md`
- `./agents-work/oando-repository-guide/markdown/01-repository-map.md`
- `./agents-work/oando-repository-guide/markdown/02-application-architecture.md`
- `./agents-work/oando-repository-guide/markdown/03-product-domains.md`
- `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`
- `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`
- `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`
- `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`
- `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`
- `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`
- `./agents-work/oando-repository-guide/markdown/10-quality-validation.md`
- `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`

The conditional projection surfaces are:

- `./agents-work/oando-repository-guide/html/index.html`
- `./agents-work/oando-repository-guide/html/repository-map.html`
- `./agents-work/oando-repository-guide/html/application-architecture.html`
- `./agents-work/oando-repository-guide/html/product-domains.html`
- `./agents-work/oando-repository-guide/html/data-api-persistence.html`
- `./agents-work/oando-repository-guide/html/tooling-ci-tech-docs.html`
- `./agents-work/oando-repository-guide/html/operations-infrastructure.html`
- `./agents-work/oando-repository-guide/html/docs-governance-planning.html`
- `./agents-work/oando-repository-guide/html/kiro-workspace.html`
- `./agents-work/oando-repository-guide/html/local-generated-environment.html`
- `./agents-work/oando-repository-guide/html/quality-and-validation.html`
- `./agents-work/oando-repository-guide/html/working-with-kiro.html`
- `./agents-work/oando-repository-guide/html/guide.css`

The 12 Markdown paths are human guide work surfaces, not additional members of the 51-file `./.kiro/**/*.md` inventory. Filename similarity is not provenance proof. Markdown-to-HTML source relationship must be established from current files, references, scripts, and generator documentation before any projection write; otherwise leave HTML unchanged and create a Coverage-Gap Admission.

### Requirements 33–40 and Properties 16–20 reconciliation

- **Requirement 33 / Property 16:** `2.1`, `2.3`, `4.8`, `6.3`, `8.1`, and `10.16` preserve the exact 36/11/4 inventory, contract modes, negative inventory, separate guide paths, and static-only limitation.
- **Requirement 34 / Property 17:** `1.1`, `3.6`, `5.3`, `8.4`, and `10.17` preserve exactly four slots, the four role names, one attached coordinator designation, pre-action records, ownership, serial integration, five-file distinction, and no silent fallback.
- **Requirement 35 / Property 18:** `1.3`, `3.6`, `4.10`, `8.2`, and `10.18` preserve executable/host-integrated enforcement as a separate work item and fail-closed checks for all six action kinds.
- **Requirement 36 / Properties 18 and 20:** `1.2`, `3.5`, `4.7`, `8.3`, `10.18`, and `10.20` preserve protected read-only paths, exact current-request authorization, no substitute-copy claim, and the future Exact-Line boundary.
- **Requirement 37 / Properties 17 and 19:** `1.4`, `3.6`, `5.1`, `5.3`, `8.4`, `9.3`, `9.4`, `10.17`, and `10.19` preserve the exact deliverables, fields, closed lifecycle/enforcement vocabularies, and evidence-honest closure.
- **Requirement 38 / Property 19:** `1.4`, `2.3`, `3.6`, `6.1`, `9.3`, `9.4`, and `10.19` separate static, host/integration, and owner-authorized evidence and preserve the current phase boundary.
- **Requirement 39 / Property 20:** `3.5`, `8.3`, and `10.20` preserve the exact future line, one-occurrence/idempotence rule, exact targets, insertion failure stop, and no current protected write.
- **Requirement 40 / Property 19:** `9.4` and `10.19` require an honest coordinator handoff. Requirement 40's earlier requirements-integration phase historically changed only `./.kiro/specs/oando-master/requirements.md`; this Tasks phase changes only `./.kiro/specs/oando-master/tasks.md` and must not claim that the earlier requirements artifact was changed now.

The three existing Special Requirements remain exactly three; Requirements 33–40 are normal requirements, not a fourth Special Requirement. Requirements 1–32 and Properties 1–15 remain covered by the inherited task cards and the final mapping task.

## Ordered Tasks

- [x] 1. Freeze the controlled-task route, four-slot roster, protected boundary, and evidence contract

- **Dependency:** none.
- **Role slots:** `S/M-01` Scout/Map; `P/R-01` Planner/Risk; `I/C-01` Implementer + Coordinator/Serial Integration Owner; `V/R-01` Verifier/Reporter. Exactly these four slots are declared; runtime activation is `not-observed` unless separately evidenced.
- **Owned paths:** read-only inspection of the current user request, `./AGENTS.md`, `./Agents/01-standard.md`, `./plans/README.md`, `./.kiro/specs/oando-master/requirements.md`, `./.kiro/specs/oando-master/design.md`, `./.kiro/specs/oando-master/tasks.md`, and `./.kiro/specs/oando-master/.config.kiro`.
- **Current write:** only the existing Tasks artifact is authorized. Downstream writes wait for their own Route Record and ownership gate.
- **Approval gate:** no current contract append, Exact-Line insertion, Agent-definition change, root/docs/Agents write, protected delete, command, or implementation.

  - [x] 1.1 Publish the exact four-entry Agent Roster, Ownership Matrix, Route Record, Deliverable Register, Conflict Stop Rule, and initial statuses

Record identity, role, coordinator designation, read/write permission, owned scope, exclusions, Multi-Agent Availability State, lifecycle status, and next owner for all four entries before any downstream exploration, modification, command proposal, delegation, or handoff. Map every objective, evidence item, artifact, and exact path to one role or the Serial Integration Owner; identify shared paths as serial.

### Task 1.1 controlled-task records

**Task identity and publication boundary:** `oando-master / 1.1`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is a static controlled-task declaration. The current user request explicitly authorizes one write to `./.kiro/specs/oando-master/tasks.md`; no other write, delete, command, delegation, contract append, Exact-Line insertion, Agent-definition change, protected-path change, or downstream implementation is authorized by this task. The `available` value below is a declared plan-capacity field, not proof that a host created or loaded four runtime Agents; runtime activation and universal enforcement remain `not-observed`.

#### Agent Roster — exactly four entries

| Slot / Agent ID | Role | Coordinator designation | Permission | Owned scope | Explicit exclusions | Multi-Agent Availability State | Initial lifecycle status | Next owner |
|---|---|---|---|---|---|---|---|---|
| `S/M-01` | **Scout/Map** | `coordinator: false` | Read-only; no write or command permission | Read the current user request and the authority/spec sources needed for task 1.1; map exact paths, current constraints, and evidence limitations | No file modification, deletion, command, delegation, implementation, protected-path change, contract append, or runtime claim | `available` (declared capacity only) | `ready` | `P/R-01` |
| `P/R-01` | **Planner/Risk** | `coordinator: false` | Read-only; no write or command permission | Own the Route Record, risk/command classification, ownership proposals, deliverable statuses, and approval/exclusion decisions for task 1.1 | No file modification, deletion, command execution, authorization grant, protected-path change, contract append, or implementation | `available` (declared capacity only) | `ready` | `I/C-01` |
| `I/C-01` | **Implementer** | `coordinator: true`; **Coordinator/Serial Integration Owner** is attached to this slot, not a fifth role | Read and write only for the exact current task target `./.kiro/specs/oando-master/tasks.md`; no delete permission | Serially publish and integrate the roster, ownership matrix, route, deliverable register, Conflict Stop Rule, initial statuses, and final handoff in the authorized Tasks artifact | No write to any other path; no protected or Agent-definition change; no contract append, Exact-Line rollout, command, package, database, runtime, hook, MCP, Power, deployment, or downstream task implementation | `available` (declared capacity only) | `ready` | `V/R-01` |
| `V/R-01` | **Verifier/Reporter** | `coordinator: false` | Read-only; no write or command permission | Read back the changed task 1.1 section, reconcile static evidence and limitations, and report the Completion/Handoff Record | No implementation edit, deletion, command, protected-path change, runtime/enforcement claim, or promotion of unobserved evidence | `available` (declared capacity only) | `ready` | `Repository Owner` |

No fifth Coordinator Agent is declared. The four roles above are the complete static roster; runtime roster creation/loading is `not-observed`, and no silent one-Agent fallback is permitted.

#### Ownership Matrix

| Objective, evidence item, artifact, or exact path | Exclusive owner | Permission | Serial/integration rule |
|---|---|---|---|
| Current user request, `./START.md`, `./AGENTS.md`, `./Agents/01-standard.md`, and `./plans/README.md` as authority evidence | `S/M-01` | Read-only | `I/C-01` serially reconciles the evidence before publication; no authority file may be changed. |
| `./.kiro/specs/oando-master/requirements.md`, `./.kiro/specs/oando-master/design.md`, `./.kiro/specs/oando-master/tasks.md`, and `./.kiro/specs/oando-master/.config.kiro` as spec evidence | `S/M-01` for read-only evidence; `I/C-01` is serial owner of the current Tasks artifact | Read-only for `S/M-01`; read/write only to the exact authorized Tasks artifact for `I/C-01` | `.config.kiro`, requirements, and design remain unchanged; the Tasks artifact is the sole shared/write path and is integrated serially. |
| Agent Roster publication and four-entry/one-coordinator constraint | `I/C-01` | Write only in the authorized Tasks artifact | `V/R-01` verifies after `I/C-01` completes the write; no parallel edit. |
| Route Record, selected/rejected skill reasoning, Workflow Mode, risk, command classification, and owner-decision boundary | `P/R-01` | Read-only planning input | `I/C-01` serially integrates the approved record into `tasks.md`; no skill or command is activated by the record. |
| Ownership Matrix and exact-path ownership/exclusion mapping | `P/R-01` | Read-only planning input | `I/C-01` serially integrates it; shared terminology and the Tasks artifact remain serial-owned. |
| Deliverable Register and initial lifecycle/enforcement statuses | `I/C-01` | Write only in the authorized Tasks artifact | Initial statuses are published before downstream work; missing runtime evidence remains `not-observed` or `guidance-only`. |
| Pre-Action Gate Records placeholder and enforcement limitation | `P/R-01` | Read-only status declaration only | Detailed six-action gate design is deferred to task 1.3; no executable gate is created or claimed here. |
| Conflict Stop Rule and conflict-state record | `I/C-01` | Write only in the authorized Tasks artifact | Shared/overlapping/conflicting work stops; resume requires owner review and updated serial ownership. Current conflict record is `not-observed` because no conflict occurred. |
| Static read-back, completion evidence, and handoff report | `V/R-01` | Read-only verification/reporting | `I/C-01` serially records the final handoff; `V/R-01` cannot change implementation or promote runtime evidence. |
| Every other repository path, including `./docs/**`, `./Agents/**`, direct root files, `./.kiro/agents/**`, application, package, database, hook, MCP, Power, deployment, generated-output, and test paths | `I/C-01` as serial rejection boundary | No write permission | Excluded from this task; exact current-request authorization would be required for any future protected write/delete, and no substitute copy proves a protected source changed. |

#### Route Record

- **Outcome:** Publish the static four-slot controlled-task roster and its ownership, routing, deliverable, conflict, status, and handoff records for task 1.1 without claiming runtime activation or enforcement.
- **Domain / Domain Index card:** `D20 — Kiro, skills, Powers, and Agents`; the task is controlled repository-guidance planning, not product implementation.
- **Exact first evidence locations and reasons:** `./.kiro/specs/oando-master/requirements.md` for Requirements 34 and 37; `./.kiro/specs/oando-master/design.md` §§21, 23, and 26 for the four-slot and record model; `./.kiro/specs/oando-master/tasks.md` for the authorized task boundary and dependency state; `./.kiro/specs/oando-master/.config.kiro` for spec identity/workflow; `./AGENTS.md`, `./Agents/01-standard.md`, `./START.md`, and `./plans/README.md` for repository authority, execution, and planning boundaries.
- **Candidate paths:** write only `./.kiro/specs/oando-master/tasks.md`; read the authority/spec paths above; reject all neighboring protected, application, runtime, package, database, hook, MCP, Power, deployment, generated-output, and test paths.
- **Selected Package Skills and trigger evidence:** `oando-master` (mandatory first router and completion contract); `repo-map` (repository/spec path and authority orientation); `powers-skills-model` (the task concerns repository-local Kiro Agent/skill/governance records). Selection is guidance-only and does not activate runtime capabilities.
- **Rejected Package Skills and reasons:** `db-migrations` (no schema, SQL, RLS, grants, rollback, or database ownership work); `focss-css` (no styling, tokens, Tailwind, icons, or FOCSS work); `fork-boundaries` (no Planner/Studio Fork Tree); `graph-impact` (no shared-code, dependency, blast-radius, or cycle analysis); `planner-studio` (no Planner/Studio surface); `verify-and-gate` (no authorized test, gate, type, lint, browser, build, or other validation command); `ai-retrieval` (no AI/retrieval evidence and the optional file is not selected/installed).
- **Workflow Mode:** `Supervised` — this is an owner-authorized governance/spec artifact update with serial record integration and no automatic execution.
- **Operational-Risk Classification:** documentation/governance and scope-control risk; protected-path and authorization risk; no product, data, credential, infrastructure, deployment, or external-system change is in scope.
- **Command Classification:** no shell command proposed or run; static file reads are `read-only inspection`; any test, gate, build, typecheck, script, package, browser, service, database, deployment, backup, Power, or MCP action is `no-run pending authorization` and excluded.
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / Downstream Tasks Artifact / not applicable`; exact authored target `./.kiro/specs/oando-master/tasks.md`; filename `tasks.md`; owning source is this approved spec workflow and `I/C-01`; authored, not generated. Rejected placements are `./results/**`, `./agents-work/**`, `./generated-documents/`, `./site/`, `./plans/**`, root controls, and all protected or runtime paths.
- **Locked Path Gate state:** `explicitly owner-authorized` for the exact current Tasks artifact named by the current request; `./docs/**`, `./Agents/**`, every direct root file, and `./.kiro/agents/**` remain read-only evidence. No delete or substitute-copy claim is allowed.
- **Site Write Gate state:** `not-applicable`; no `./site/` target exists.
- **Validation State:** `not-run` for commands; applicable proof is static read-back of the changed Tasks artifact. Runtime roster creation, loading, universal pre-action interception, and enforcement are `not-observed`/`guidance-only`.
- **Unavoidable Owner Decisions:** none for this exact `tasks.md` write; future contract append, Protected Path Lock implementation, Exact-Line rollout, runtime roster/checker, and Pre-Action Enforcement Layer remain separate owner-approved work.
- **Next action:** `V/R-01` performs read-only static reconciliation; after this handoff the Coordinator/Serial Integration Owner may route task 1.2 only under its own dependency and approval gate.

#### Deliverable Register and initial statuses

| Named deliverable | Owner | Initial lifecycle/enforcement status at publication | Task 1.1 static closure | Evidence or limitation |
|---|---|---|---|---|
| Agent Roster | `I/C-01` | `ready` | `complete` (static declaration only) | Exactly four entries and one attached coordinator designation are recorded; runtime activation is `not-observed`. |
| Ownership Matrix | `P/R-01`, serially integrated by `I/C-01` | `ready` | `complete` (static declaration only) | Every task objective, evidence item, artifact, and exact path is assigned or explicitly excluded. |
| Route Record | `P/R-01`, serially integrated by `I/C-01` | `ready` | `complete` (static declaration only) | Exact target, skills, risk, command, artifact, lock, validation, and owner-decision fields are present. |
| Pre-Action Gate Records | `P/R-01` | `not-observed` | `not-observed` | No executable/host-integrated gate is created here; task 1.3 owns the detailed six-action gate definition. |
| Handoff Record Register | `I/C-01` | `ready` | `complete` (static declaration only) | The complete task 1.1 handoff is recorded below; unavailable runtime fields remain `not-observed`. |
| Conflict Stop Record (when a conflict occurs) | `I/C-01` | `not-observed` | `not-observed` | No ownership, edit, or evidence conflict occurred in this task; the Conflict Stop Rule remains active as prose. |
| Completion Record | `V/R-01`, serially integrated by `I/C-01` | `ready` | `complete` (static read-back only) | Static evidence is sufficient for this documentation record; no runtime or command result is implied. |

**Initial status boundary:** the four roster entries are published with lifecycle status `ready`; task 1.1 reaches `complete` only for the static record publication and read-back. Enforcement Status for the universal controlled-executor requirement is `guidance-only`/`not-observed`; no unavailable evidence is promoted to `verified` or `complete`.

#### Conflict Stop Rule

If Agent ownership sets overlap, a shared path receives simultaneous write proposals, edits conflict, evidence contradicts, a path is unowned, a required field or authorization is missing, or a task expands beyond the Route Record, stop all affected writes before modification. Preserve the competing source/evidence; do not overwrite, merge, reinterpret, choose an alternate tool/path/Agent, or infer approval. `I/C-01` records the Conflict Stop state, identifies the exact paths and evidence, routes the decision to the Repository Owner, updates the Ownership Matrix/Route Record serially after the owner decision, and only then authorizes the next bounded action. The current Conflict Stop state is `not-observed` because no conflict occurred. This rule does not create a runtime interceptor; runtime enforcement remains `guidance-only`/`not-observed`.

#### Task 1.1 Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Publish the exact four-entry Agent Roster, Ownership Matrix, Route Record, Deliverable Register, Conflict Stop Rule, initial statuses, and evidence-honest completion boundary for task 1.1.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; next owner is `V/R-01` for read-only reconciliation, then the Repository Owner/Coordinator for any pending Owner Decision. No later shared-path write may begin before serial integration.
- **Scope:** Only the static task 1.1 records and the completion marker in the existing Tasks artifact; no downstream task implementation or protected/runtime work.
- **Paths Read and Paths Changed:** Read current user request; `./START.md`; `./AGENTS.md`; `./Agents/01-standard.md`; `./plans/README.md`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; `./.kiro/specs/oando-master/tasks.md`; `./.kiro/specs/oando-master/.config.kiro`; and the applicable `oando-master`, `repo-map`, and `powers-skills-model` guidance. Changed exactly `./.kiro/specs/oando-master/tasks.md`; no other file was changed.
- **Route Record:** The Route Record above is the governing route: D20, Local Evidence first, selected `oando-master` + `repo-map` + `powers-skills-model`, no command, `Supervised`, `Active Plan` artifact, exact owner-authorized Tasks target, and no Site Write Gate involvement.
- **Evidence:** Static source read established the feature/fast-task config, the four-slot model, task dependencies, exact write boundary, closed status vocabulary, and no-runtime-claim limitation. Static read-back of this Tasks section is the completion proof for the documentation record.
- **Decisions:** Keep exactly four slots; attach Coordinator/Serial Integration Owner to `I/C-01` rather than create a fifth role; make `tasks.md` the sole writable path; preserve `.config.kiro`, requirements, design, root/Agents/docs, and all `.kiro/agents/**`; leave Pre-Action Enforcement, Protected Path Lock implementation, contract append, Exact-Line rollout, runtime roster/checker, and downstream guidance as separate/pending work.
- **Coverage Gaps:** Runtime four-entry creation/loading, universal Pre-Action Enforcement, host hook coverage beyond its observed command family, external/global Kiro access, automatic spawning, and any rendered/hosted behavior are `not-observed`; the detailed gate vocabulary remains assigned to task 1.3 and the remaining initial-status/evidence-boundary work to task 1.4.
- **Validation Command:** `none` — no shell/test/gate/build/typecheck/script/package/browser/service/database/deployment/backup command was authorized or run; static `read_file`/`grep_search` read-back only.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists for the exact `./.kiro/specs/oando-master/tasks.md` write; no authorization exists or was requested for protected writes, commands, or downstream implementation.
- **Hook Decision:** `not-observed` for a universal pre-action decision; no command hook was invoked, and the command-specific `block-agent-tests` scope is not generalized to reads, writes, deletes, delegation, or handoffs.
- **Exit Status:** `not-applicable` for command execution; static task publication/read-back status is `complete`.
- **Validation Limitation:** Static prose, path, count, ownership, and read-back evidence cannot prove runtime roster activation, automatic spawning, tool interception, fail-closed denial, command success, or universal enforcement.
- **Blockers:** None within the authorized static task 1.1 scope. Separate approval work and unobserved runtime capabilities are recorded as pending/not-observed, not as blockers to this static deliverable.
- **Next Action:** `V/R-01` completes the read-only reconciliation; the next implementation owner must not begin task 1.2 until its own route, exact ownership, and approval gate are satisfied.
- **Status:** `complete` for task 1.1 static publication; universal enforcement status remains `guidance-only`/`not-observed`.

- **Evidence:** static roster/ownership/route schema plus explicit `guidance-only`/`not-observed` when runtime roster creation cannot be proved.
- **Requirements:** 34.1–34.7, 34.9–34.10, 37.1–37.4; Design §§21, 23, 26; Property 17.

  - [x] 1.2 Apply the Protected Path Lock and current-request authorization boundary

Classify `./docs/**`, `./Agents/**`, every direct root file, and `./.kiro/agents/**` as protected read-only evidence. Require an exact owner-named file for any future protected write/delete, preserve all unselected neighbors, reject substitute-copy claims, keep `./.kiro/specs/oando-master/tasks.md` as the sole current writable artifact, and keep `.config.kiro` unchanged.

- **Approval gate:** no current contract append, Exact-Line insertion, Agent-definition change, root/docs/Agents write, or delete.
- **Requirements:** 36.1–36.7, 38.6, 39.6–39.7; Design §25.

### Task 1.2 protected-path lock record

**Task identity and publication boundary:** `oando-master / 1.2`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is a static protected-path and authorization record. The current user request names the existing `./.kiro/specs/oando-master/tasks.md` artifact as the only writable target for this phase. That exact spec artifact is the sole authorized write below. No protected path, `.config.kiro`, Agent definition, root control, application, runtime, database, package, hook, MCP, Power, deployment, generated-output, or test-harness path is authorized for modification or deletion.

The four-slot roster, one attached Coordinator/Serial Integration Owner, and serial ownership model published in task 1.1 remain in force. This task adds the lock decision and does not create a fifth role, change the roster, or claim that a host loaded or enforced it.

#### Protected Path Set and lock state

| Protected path class | Default state | Read permission | Write/delete condition | Task 1.2 decision |
|---|---|---|---|---|
| `./docs/**` | `Locked` | Read-Only Evidence Source only | Repository Owner must name the exact file in the current request; naming a directory or neighboring file is insufficient | Remains locked; no write or delete authorized |
| `./Agents/**` | `Locked` | Read-Only Evidence Source only | Repository Owner must name each exact selected file in the current request | Remains locked; no write or delete authorized, including no Exact-Line insertion |
| Every file directly under `./` (the Root File set, including `./AGENTS.md`, `./README.md`, `./START.md`, `./CONTENTS.md`, `./DOC-MAP.md`, `./Failures.md`, and other root control files when present) | `Locked` | Read-Only Evidence Source only | Repository Owner must name the exact root file in the current request | Remains locked; no root write or delete authorized |
| `./.kiro/agents/**` | `Locked` | Read-Only Evidence Source only | Repository Owner must name the exact Agent-definition file in the current request | Remains locked; all five physical definitions, including `./.kiro/agents/spec-task-runner2.md`, are preserved and unchanged |
| `./.kiro/specs/oando-master/tasks.md` | `explicitly-owner-authorized` for this phase only | Readable as the current Tasks artifact | The current request names this exact existing artifact as the sole writable target; no neighboring `.kiro` path is unlocked | The only permitted write is the task 1.2 record in this file |
| `./.kiro/specs/oando-master/.config.kiro` | `Locked` for this task boundary | Read-only spec configuration evidence | No authorization in the current request | Preserved and unchanged |

A read grant never becomes write or delete permission. Naming `tasks.md` does not unlock `./.kiro/specs/oando-master/.config.kiro`, any other spec artifact, any root file, any path under `./docs/`, any path under `./Agents/`, or any path under `./.kiro/agents/`. Unselected neighbors remain locked even when they are adjacent to the authorized Tasks artifact.

#### Current-request authorization boundary

The current request provides exact current-session authorization for one write target: `./.kiro/specs/oando-master/tasks.md`. It does not name an exact Protected Path file, so every write or delete under the Protected Path Set is denied before execution. A future request must name every exact protected file it intends to change or delete; a broad phrase such as “relevant guidance,” a directory name, a role name, or a neighboring copy is not authorization. If one exact protected file is named in a future request, only that file is unlocked for that task and all other protected paths remain locked.

A denied protected write/delete preserves the source, records the requested change as a pending Owner Decision and Separate Approval Work, and stops the affected action. The workflow must not choose an alternate tool, path, Agent, permission, or inferred approval. A copy, mirror, generated substitute, or report in `./agents-work/`, `./results/`, `./generated-documents/`, `./site/`, or any other location never proves that the protected source changed and must not be reported as an update to that source.

The exact future Exact-Line Rule is:

```text
Before any action, read the current user request and applicable repository standard, declare exact scope and permissions, and stop on denial, conflict, or missing authorization.
```

This task records the future rule and its authorization boundary only. It does not insert the line into `./AGENTS.md`, `./Agents/01-standard.md`, or any other protected file. A future owner-authorized rollout must name `./AGENTS.md` and each directly applicable selected `./Agents/**` file individually, retain one occurrence when already present, record a line count of one, and stop with a pending Owner Decision or blocker if insertion fails. The current task makes no Exact-Line claim.

#### Task 1.2 static Action Record decisions

These records capture the decisions for this static task route; they are not an executable or host-integrated universal Pre-Action Enforcement Layer. The detailed six-action gate definition remains task 1.3. `Enforcement Status` for this lock is `guidance-only` / `not-observed` until separately approved implementation and current-session observation establish otherwise.

| Action kind | Exact target/scope | Static decision | Reason and next owner action |
|---|---|---|---|
| `read` | Current request, spec records, authority sources, and protected paths when needed as evidence | `allow` for read-only inspection; runtime decision `not-observed` | Read access does not grant mutation. Continue only within the recorded read scope; do not convert the read into write/delete permission. |
| `write` | `./.kiro/specs/oando-master/tasks.md` only | `allow` for this exact existing Tasks artifact | The current request names this artifact as the sole writable target. `I/C-01` owns the serial write; `V/R-01` reads it back. |
| `write` | Any path under `./docs/**`, `./Agents/**`, direct-root files, or `./.kiro/agents/**`, or any unselected neighbor | `deny` before execution | No exact protected file is named in the current request. Preserve the source, record pending Owner Decision and Separate Approval Work, and route any future request to the Repository Owner. |
| `delete` | Any Protected Path or unselected neighboring path | `deny` before execution | No exact deletion target or deletion scope is authorized. Do not select an alternate path or create a substitute; preserve the source and stop. |
| `command` | Any shell, package, test, gate, build, typecheck, script, browser, service, database, deployment, backup, Power, or MCP action | `no-run pending authorization` | The current request forbids commands and validation. No command is proposed or run; a future owner must authorize an exact command and applicable hook permission. |
| `delegation` | Any receiver or scope outside the four declared slots | `deny` / not proposed | No fifth Agent or unrecorded path owner is permitted. The Coordinator may delegate only within the four-slot roster after an exact scope and handoff record exist; no delegation occurred here. |
| `handoff` | Task 1.2 completion record to `V/R-01`, then the Repository Owner | `allow` only after all required fields are present; static handoff recorded below | Changed paths must match ownership and validation must distinguish static read-back from commands not run. The receiving owner is explicit; runtime enforcement remains `not-observed`. |

#### Ownership Matrix for task 1.2

| Objective, evidence item, artifact, or exact path | Exclusive owner | Permission | Serial/integration rule |
|---|---|---|---|
| Current user request, task 1.2 scope, and lock requirements/design evidence | `S/M-01` | Read-only | `I/C-01` serially reconciles the source evidence before publishing the lock record. |
| Protected Path Set classification and exact-file authorization interpretation | `P/R-01` | Read-only planning/risk input | The classification is integrated serially into this Tasks artifact; no protected source is modified. |
| `./.kiro/specs/oando-master/tasks.md` task 1.2 record | `I/C-01` with Coordinator/Serial Integration Owner function | Write only to this exact current target | One serial write; no parallel edit; `V/R-01` performs read-only reconciliation afterward. |
| `./.kiro/specs/oando-master/.config.kiro` | `I/C-01` as rejection boundary | Read-only; no write/delete | Preserve unchanged; no neighboring spec configuration is unlocked by the Tasks authorization. |
| `./docs/**`, `./Agents/**`, every direct root file, and `./.kiro/agents/**` | `I/C-01` as serial rejection boundary | Read-only evidence only; no write/delete | All remain `Locked`; exact current-request authorization would be required file by file for a future task. |
| Exact future Exact-Line targets, contract append targets, and any runtime lock implementation | Repository Owner / Separate Approval Work | No current permission | Keep `pending-owner` / `not-observed`; do not insert, append, implement, or infer approval in task 1.2. |
| Static read-back and completion evidence | `V/R-01` | Read-only | `I/C-01` records the reconciled handoff; `V/R-01` cannot promote runtime or enforcement evidence. |

#### Route Record

- **Outcome:** Publish a fail-closed, exact-file Protected Path Lock boundary in the controlled Tasks record while changing no protected source and preserving the sole current writable artifact.
- **Domain / Domain Index card:** `D20 — Kiro, skills, Powers, and Agents`; this is repository-guidance governance, not product implementation.
- **Exact first evidence locations and reasons:** the current user request for the only authorized target and exclusions; `./.kiro/specs/oando-master/requirements.md` for Requirements 36, 38, and 39; `./.kiro/specs/oando-master/design.md` §25 for the lock and Exact-Line rule; `./.kiro/specs/oando-master/tasks.md` for task dependencies and the current write boundary; `./.kiro/specs/oando-master/.config.kiro` for feature/fast-task identity; `./AGENTS.md`, `./START.md`, `./Agents/01-standard.md`, and `./plans/README.md` for authority and coordination constraints.
- **Candidate paths:** write only `./.kiro/specs/oando-master/tasks.md`; read the listed spec/authority paths and protected paths only as evidence; reject every other path for mutation, deletion, or substitute-copy use.
- **Selected Package Skills and trigger evidence:** `oando-master` (canonical first router and completion contract); `repo-map` (repository/spec and authority orientation); `powers-skills-model` (the task governs repository-local Kiro Agent, skill, and protected-control boundaries).
- **Rejected Package Skills and reasons:** `db-migrations` (no SQL, schema, RLS, grants, rollback, or database work); `focss-css` (no CSS, Tailwind, tokens, icons, or visual work); `fork-boundaries` (no Planner/Studio source change); `graph-impact` (no shared-code, dependency, blast-radius, or cycle change); `planner-studio` (no Planner/Studio behavior); `verify-and-gate` (commands and validation are explicitly forbidden); `ai-retrieval` (the optional file is absent and no AI/retrieval behavior is in scope).
- **Workflow Mode:** `Supervised` — exact-scope governance documentation with serial ownership and no automatic execution.
- **Operational-Risk Classification:** protected-path, authorization, and repository-governance risk; no product, data, credential, infrastructure, deployment, or external-system change.
- **Command Classification:** static file reads are `read-only inspection`; no shell/test/gate/build/typecheck/script/package/browser/service/database/deployment/backup/Power/MCP command is proposed or run; any such future action is `no-run pending authorization`.
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / .kiro/specs/oando-master / tasks.md`; the existing Tasks artifact is authored plan/spec content, not generated output. It remains outside the Protected Path Set by the explicit current workflow exception.
- **Owning source or script / authored or generated:** the approved `oando-master` fast-task workflow and current user request; authored, not generated.
- **Rejected placements:** all protected source locations for mutation; `./agents-work/`, `./results/`, `./generated-documents/`, `./site/`, root controls, `./.kiro/agents/**`, and neighboring spec/config files as substitute or duplicate destinations.
- **Locked Path Gate state:** `explicitly-owner-authorized` only for the exact current `./.kiro/specs/oando-master/tasks.md` target; `Locked` for `./docs/**`, `./Agents/**`, every direct root file, `./.kiro/agents/**`, `.config.kiro`, and all unselected neighbors.
- **Site Write Gate state:** `not-applicable`; no `./site/` target exists.
- **Validation State:** static read-back is the applicable proof; no shell or validation command is authorized or run. Runtime lock and universal enforcement are `not-observed` / `guidance-only`.
- **Unavoidable Owner Decisions:** none for the exact current Tasks write; future exact protected write/delete targets, contract append form/targets, Exact-Line target list, Protected Path Lock implementation, and runtime enforcement remain separate Owner Decisions.
- **Next action:** `V/R-01` performs read-only static reconciliation of this section; no other path may be written or deleted without a new exact owner authorization.

#### Deliverable Register and status boundary

| Named deliverable | Owner | Lifecycle status | Enforcement status | Evidence or limitation |
|---|---|---|---|---|
| Agent Roster | `I/C-01`, inherited from task 1.1 | `serial-integrated` | `guidance-only` | Four declared slots and one attached coordinator are static records; runtime creation/loading is `not-observed`. |
| Ownership Matrix | `I/C-01`, with `P/R-01` planning input | `complete` | `guidance-only` | Exact task 1.2 ownership and exclusions are recorded; static text is not a runtime lock. |
| Route Record | `P/R-01`, serially integrated by `I/C-01` | `complete` | `guidance-only` | Exact target, protected set, skills, risk, command boundary, and next owner are present. |
| Pre-Action Gate Records | `P/R-01` | `not-observed` | `not-observed` | Task-specific static decisions are recorded above; no executable/host-integrated gate is created. Full six-action gate design remains task 1.3. |
| Handoff Record Register | `I/C-01` | `complete` | `guidance-only` | The complete task 1.2 handoff is recorded below; unavailable runtime values remain `not-observed`. |
| Conflict Stop Record, when a conflict occurs | `I/C-01` | `not-observed` | `not-observed` | No ownership or evidence conflict occurred; the stop rule remains active and no conflict was silently resolved. |
| Completion Record | `V/R-01`, serially integrated by `I/C-01` | `complete` for static publication/read-back | `guidance-only` | The changed Tasks artifact is the only static deliverable; no command, host, runtime, or protected-source proof is implied. |

**Status boundary:** task 1.2 is `complete` only for the static Protected Path Lock record in the authorized Tasks artifact. The universal enforcement status remains `guidance-only` / `not-observed`; no unavailable evidence is promoted to `verified` or `complete` for runtime behavior.

#### Conflict Stop Rule for protected-path work

If a proposed target is protected, unowned, shared without serial ownership, ambiguously named, outside the current request, or offered as a copy/mirror/substitute, stop before modification. Preserve the competing source and evidence; do not overwrite, redirect, reinterpret, select a neighboring path, or infer approval. `I/C-01` records the exact target and reason, routes the decision to the Repository Owner, updates ownership and the Route Record only after the owner decision, and then authorizes one bounded serial action. The current Conflict Stop state is `not-observed` because no conflict occurred during this static record update.

#### Task 1.2 Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Apply and record the Protected Path Lock and current-request authorization boundary for task 1.2 while changing only the exact existing `./.kiro/specs/oando-master/tasks.md` artifact.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; next owner is `V/R-01` for read-only static reconciliation, then the Repository Owner for any future protected-path, contract, Exact-Line, or runtime-enforcement approval. No later shared-path write begins before serial integration.
- **Scope:** Classify `./docs/**`, `./Agents/**`, every direct root file, and `./.kiro/agents/**` as protected read-only evidence; require exact owner-named authorization for future protected writes/deletes; preserve unselected neighbors and `.config.kiro`; reject substitute-copy claims; and record the future Exact-Line boundary without applying it.
- **Paths Read and Paths Changed:** Read the current user request; `./START.md`; `./AGENTS.md`; `./Agents/01-standard.md`; `./plans/README.md`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; `./.kiro/specs/oando-master/tasks.md`; `./.kiro/specs/oando-master/.config.kiro`; and applicable `oando-master`, `repo-map`, and `powers-skills-model` guidance. Protected paths were classified from the requirements/design and current task boundary; no recursive read of every member of `./docs/**`, `./Agents/**`, or `./.kiro/agents/**` was required or run. Changed exactly `./.kiro/specs/oando-master/tasks.md`; no protected path, `.config.kiro`, Agent definition, root file, application file, runtime file, database/migration, package, hook, MCP, Power, deployment, generated-output, or test file was changed.
- **Route Record:** The Route Record above governs this handoff: D20, Local Evidence first, selected `oando-master` + `repo-map` + `powers-skills-model`, `Supervised`, no command, authored Active Plan Tasks artifact, exact current target authorization, `Locked` protected set, and no Site Write Gate involvement.
- **Evidence:** Requirements 36.1–36.7 require the protected classes, exact-file authorization, denial/preservation, neighbor locking, read-only distinction, substitute-copy rejection, and future Exact-Line boundary. Design §25 defines the same lock, the exact future line, and the exception for the current spec artifact. Static task read-back establishes the prose record only.
- **Decisions:** Keep the exact four-slot roster from task 1.1; permit only the current `tasks.md` write; keep `./docs/**`, `./Agents/**`, direct root files, `./.kiro/agents/**`, `.config.kiro`, and all unselected neighbors locked; preserve all five Agent definition files including `spec-task-runner2.md`; do not append a contract, insert the Exact-Line rule, change an Agent definition, delete a protected file, or create a substitute copy.
- **Coverage Gaps:** No executable or host-integrated Protected Path Lock was created or observed; universal Pre-Action Enforcement remains `guidance-only` / `not-observed` and task 1.3 owns its detailed gate vocabulary; the future Exact-Line rollout and active-document contract append remain `pending-owner`; external/global Kiro access, automatic spawning, and runtime path enforcement remain `not-observed`; no exhaustive filesystem diff or rendered/hosted behavior was checked.
- **Validation Command:** `none` — the current request forbids commands/tests/gates/builds/typechecks/scripts/packages/browser/services/database/deployment/backups/Power/MCP actions; only static file reads and the authorized Tasks-artifact edit/read-back are applicable.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for `./.kiro/specs/oando-master/tasks.md`; no exact Protected Path file is named or authorized, so all protected writes/deletes are denied. `.config.kiro` remains unchanged and no deletion was authorized.
- **Hook Decision:** `not-observed` for universal pre-action enforcement; no command hook was invoked, and command-specific hook evidence is not generalized to reads, writes, deletes, delegation, or handoffs.
- **Exit Status:** `not-applicable` for command execution; static record publication and read-back are `complete` for this task artifact.
- **Validation Limitation:** Static path/classification/prose/read-back evidence cannot prove that a host enforces the lock, denies a runtime tool action, loads the four-slot roster, prevents automatic spawning, intercepts all six action kinds, or establishes external/global Kiro coverage. It also cannot prove rendered behavior, hosted persistence, or command success.
- **Blockers:** None within the authorized static task 1.2 scope. Future runtime enforcement, protected-file writes/deletes, Exact-Line rollout, contract append, and any unobserved capability remain pending Owner Decisions/Separate Approval Work rather than current-scope blockers.
- **Next Action:** `V/R-01` completes static read-back; the Repository Owner must name and authorize each exact protected target before any future protected write/delete or Exact-Line rollout, and task 1.3 must define the detailed fail-closed six-action gate without implementing it here.
- **Status:** `complete` for the static task 1.2 publication and read-back; Protected Path Lock enforcement remains `guidance-only` / `not-observed`.

- **Evidence:** static Protected Path Set, exact current-request authorization, preservation, substitute-copy rejection, and future Exact-Line records; no runtime lock proof.
- **Requirements:** 36.1–36.7, 38.6, 39.6–39.7; Design §25; Properties 18 and 20 boundary references.

  - [x] 1.3 Define the single fail-closed Pre-Action Gate for all six action kinds

Specify Action Record fields, explicit `allow`/`deny` reason, next owner action, and denial behavior for `read`, `write`, `delete`, `command`, `delegation`, and `handoff`. Unavailable or indeterminate enforcement is `blocked` or `not-observed`; no alternate tool, path, permission, or inferred approval is allowed.

#### Task 1.3 static Pre-Action Gate contract

**Task identity and publication boundary:** `oando-master / 1.3`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is a static gate-contract and task-record update. The current user request authorizes only the existing `./.kiro/specs/oando-master/tasks.md` artifact. No executable, host-integrated, hook, script, checker, Agent definition, application/runtime, package, database/migration, deployment, MCP/Power, generated-output, protected-path, or alternate enforcement change is authorized or created.

**Single-gate invariant:** one future Pre-Action Enforcement Layer evaluates one Action Record before every action in the closed set `read`, `write`, `delete`, `command`, `delegation`, and `handoff`. The six kinds use one decision boundary and one `allow`/`deny` result contract; an action kind does not receive a bypass because an existing hook, prompt, role, tool, or path appears convenient. Markdown, prompts, self-attestation, post-review, or a save hook alone are not the gate and are not runtime enforcement evidence.

#### Action Record fields and decision result

The following is a prose schema for the future gate contract, not executable code. Every proposed action presents the shared fields below; an action-specific required field that is absent, malformed, stale, ambiguous, or contradictory makes the record invalid and therefore denied.

| Field | Required value and purpose |
|---|---|
| `taskId` | Current Repository Task identifier; it must resolve to the current task and not a prior or unknown task. |
| `agentId` | Exact Agent identifier from the current four-entry Active Agent roster. A definition file or unrostered name is not an Active Agent. |
| `role` | The roster role for that Agent, including the Coordinator function only when attached to the rostered slot; role and Agent identity must agree. |
| `action` | Exactly one of `read`, `write`, `delete`, `command`, `delegation`, or `handoff`; any other, missing, or duplicated action kind is malformed. |
| `targetPath` | Exact target path for `read`, `write`, and `delete`; it must be absent rather than repurposed for another target when the action is not path-based. |
| `command` | Exact command for `command`; it must not be replaced by a guessed or broader command. |
| `repositoryRoot` | Exact repository-root working directory for `command`; a missing, wrong, or ambiguous root is not allow evidence. |
| `requestedScope` | Explicit bounded scope for the proposed action. For `delete`, this includes the exact deletion scope; for `delegation`, exact receiver/role/paths/delivery conditions/next owner; for `handoff`, the complete handoff scope. |
| `ownershipState` | One of `exclusive`, `serial`, `unowned`, or `conflict`, resolved against the current Ownership Matrix. `unowned` and `conflict` never allow. |
| `authorizationState` | One of `explicit-current-session`, `absent`, `not-required`, or `not-observed`; inline markers, helpful wording, or inferred consent are not explicit authorization. |
| `hookDecision` | One of `permitted`, `denied`, `not-required`, or `not-observed`; a command requiring Hook Permission cannot allow with `denied` or `not-observed`. Command-specific hook evidence is not generalized to other action kinds. |
| `routeRecordRef` | Reference to the current Route Record. It must resolve to the task, target/scope, selected/rejected skills, risk, command classification, artifact and lock decisions, and next action that govern this proposal. |
| `deliveryConditionRef` | Required when the Route Record, ownership record, delegation, or handoff specifies delivery conditions; absent or contradictory conditions deny. |
| `decision` | Gate output recorded on the same Pre-Action Gate Record as exactly `allow` or `deny`; it is never assumed from an omitted value. |
| `reason` | Gate output naming the satisfied allow predicate or the concrete deny condition. `approved`, `safe`, or another unexplained label is not an adequate reason. |
| `nextOwnerAction` | Gate output naming the next responsible owner and the exact corrective or bounded continuation action. A denial without this field is incomplete and remains denied. |
| `recordedAtOrOrder` | Ordering evidence showing the decision was recorded before execution and can be compared with current task, roster, route, authorization, and hook state. |

For delegation and handoff, the `requestedScope` and referenced records must explicitly carry the receiver, role, exact paths, delivery conditions, next owner, and changed-path/required-field state needed by the corresponding row below. The gate never fills a missing field by inference. The recorded decision is a single self-contained Gate Record: proposed Action Record fields plus `decision`, `reason`, `nextOwnerAction`, and `recordedAtOrOrder`.

**Shared fail-closed rule:** before any action, the single gate validates record shape, current task and roster identity, role, action kind, exact target or command, scope, ownership, route reference, and any action-specific authorization/lock/delivery evidence. Missing, malformed, stale, ambiguous, contradictory, denied, unavailable, or indeterminate state returns `decision: deny` before execution, records the reason and next owner action, and preserves the proposed target and scope. The gate never selects an alternate tool, path, command, Agent, permission, owner, or inferred approval. If the enforcement layer is unavailable or its result is indeterminate, the action is denied and Enforcement Status is `blocked` or `not-observed`; it is never treated as an implicit allow.

#### One gate matrix for all six action kinds

| Action kind | Allow predicate and explicit allow reason | Mandatory deny reason | Next owner action and denial behavior |
|---|---|---|---|
| `read` | **Allow only when** current task identity, rostered Agent identity, assigned role, exact target path, read permission, Protected Path classification, current lifecycle status, scope, and route reference are present and consistent, and the request is read-only. **Allow reason:** `allow: current task/Agent/role/status, exact target, read permission, Protected Path classification, scope, and route evidence are current and consistent; this decision authorizes this exact read only.` | **Deny when** identity, role, target, read permission, classification, current status, scope, or route evidence is missing/malformed/stale/ambiguous/contradictory; the target requests mutation; or the gate is unavailable/indeterminate. **Deny reason:** `deny: read preconditions are incomplete or inconsistent for the exact target; no read may proceed.` | `I/C-01`/the current coordinator records the missing or conflicting field and routes an authorization or ownership question to the Repository Owner when needed. The Agent may correct only the recorded read proposal and resubmit; it may not read an alternate path, escalate permission, or turn the read into a write/delete. A protected read remains read-only. |
| `write` | **Allow only when** all applicable read checks pass and the exact target, exclusive or serial ownership, write permission, current Route Record, Protected Path Lock state, Site Write Gate when relevant, and delivery-condition match are present and consistent. Protected targets additionally require the Repository Owner to name that exact file in the current request. **Allow reason:** `allow: exact target, current exclusive/serial ownership, write permission, Route Record, lock/site gate, and delivery condition all match the authorized task scope.` | **Deny when** the target is unowned/shared-without-serial-ownership/conflicted, the target or route is missing or stale, write permission is absent, a protected target lacks exact current-request authorization, a required Site Write Gate or delivery condition is missing, or any gate state is unavailable/indeterminate. **Deny reason:** `deny: write authorization or scoped ownership/gate evidence does not establish permission for this exact target.` | `I/C-01` stops before modification, preserves the source, records the exact failed condition, and routes missing protected authorization or scope expansion to the Repository Owner. The owner or coordinator must correct the current Route/ownership/lock record and resubmit; no neighboring path, copy, alternate tool, or inferred approval may be used. |
| `delete` | **Allow only when** the exact target path, explicit deletion scope, exact current owner authorization, exclusive ownership, Protected Path Lock state, and delivery condition are present and consistent. Protected-path deletion requires the exact file to be named in the current request; a read grant never supplies delete permission. **Allow reason:** `allow: exact deletion target and scope, explicit current owner authorization, exclusive ownership, lock state, and delivery condition are all recorded.` | **Deny when** the target or deletion scope is missing/ambiguous, exact owner authorization is absent/stale/contradictory, ownership is serial/unowned/conflicted, Protected Path Lock state is missing or denies deletion, or the gate is unavailable/indeterminate. **Deny reason:** `deny: exact deletion scope, authorization, exclusive ownership, or lock evidence is not complete for this target.` | `I/C-01` preserves the source and records the denial. The Repository Owner must name the exact target and deletion scope in a new authorized decision, or the coordinator closes the request; no alternate deletion target, cleanup path, substitute copy, or inferred consent is allowed. |
| `command` | **Allow only when** the exact command is classified, the repository-root cwd is exact, current-session Explicit User Authorization is present when required, required Hook Permission is `permitted`, and the command scope is recorded in the Route Record. **Allow reason:** `allow: exact classified command, repository-root cwd, current-session authorization, Hook Permission, and recorded scope are current and match.` | **Deny when** the command is missing/unclassified, cwd is absent/wrong, required authorization is absent or represented only by an inline marker, Hook Permission is denied/not-observed when required, scope is missing/stale/contradictory, or the gate is unavailable/indeterminate. **Deny reason:** `deny: command authorization, hook, cwd, classification, or scope evidence is incomplete or not current.` | `I/C-01` records the exact command denial and routes required authorization or hook evidence to the Repository Owner. No command is substituted, broadened, retried through another tool, or treated as approved by a prompt token; execution waits for a new complete decision. |
| `delegation` | **Allow only when** the Coordinator function of the current rostered slot is the delegator, the receiver is one of exactly four current Active Agent entries, the receiver role and exact owned paths are recorded, delivery conditions and next owner are present, and ownership is exclusive/serial without conflict. **Allow reason:** `allow: current Coordinator delegates to a rostered receiver with matching role, exact paths, delivery conditions, and next owner.` | **Deny when** the delegator is not the Coordinator, the receiver is a fifth/unrostered/ambiguous Agent, the role or exact paths are missing, delivery conditions or next owner are absent, ownership conflicts, or the gate is unavailable/indeterminate. **Deny reason:** `deny: delegation cannot establish an authorized receiver, bounded ownership, delivery condition, or next owner within the four-slot roster.` | `I/C-01` stops delegation and reconciles the roster, Ownership Matrix, and scope. The Repository Owner decides any requested roster/scope change; no fifth Agent, alternate Agent, unrecorded path owner, permission transfer, or inferred delegation is selected. |
| `handoff` | **Allow only when** the Handoff Record contains Objective; Role and Next Owner; Scope; Paths Read and Paths Changed; Route Record; Evidence; Decisions; Coverage Gaps; Validation Command; Repository Root; Authorization State; Hook Decision; Exit Status; Validation Limitation; Blockers; Next Action; and Status, with unavailable values explicitly `not-observed`; changed paths match ownership; validation separates observed from not run; and a receiving owner is recorded. **Allow reason:** `allow: all required handoff fields, ownership-matching paths, evidence state, validation distinction, and receiving owner are present and consistent.` | **Deny when** any required field is missing, malformed, stale, ambiguous, or contradictory; a changed path is unexplained/unowned, observed and not-run validation are conflated, the receiver is absent, or the gate is unavailable/indeterminate. **Deny reason:** `deny: handoff completeness, ownership, evidence, validation, or receiving-owner proof is insufficient.` | `V/R-01`/the receiving owner returns the handoff to `I/C-01` for the exact missing or conflicting field; the coordinator invokes the Conflict Stop Rule when paths/evidence overlap or contradict. No alternate receiver, path, Agent, validation result, or implied acceptance is chosen. |

**Protected-path and evidence boundary:** `./docs/**`, `./Agents/**`, every direct root file, and `./.kiro/agents/**` remain read-only evidence by default. A protected read can be allowed only as a read and never upgrades to write/delete authority. An unauthorized copy, mirror, generated substitute, or report elsewhere never proves the protected source changed. The current authorized target `./.kiro/specs/oando-master/tasks.md` is the only writable artifact for this task; this exception does not unlock neighboring spec/config files or any other `.kiro` path.

#### Ownership Matrix for task 1.3

| Objective, evidence item, artifact, or exact path | Exclusive owner | Permission | Serial/integration rule |
|---|---|---|---|
| Current user request, `./START.md`, `./AGENTS.md`, `./Agents/01-standard.md`, `./plans/README.md`, and task 1.3 requirements/design evidence | `S/M-01` | Read-only | `I/C-01` serially reconciles authority and scope evidence before publication; no source guidance file may be changed. |
| Action Record schema, six-action gate matrix, deny reasons, next-owner actions, and enforcement-status boundary | `P/R-01` | Read-only planning/risk input | `I/C-01` serially integrates the contract into the sole authorized Tasks artifact; no executable or host-integrated gate is produced. |
| `./.kiro/specs/oando-master/tasks.md` task 1.3 record | `I/C-01` with Coordinator/Serial Integration Owner function | Write only to this exact current target | One serial write; `V/R-01` performs read-only static reconciliation afterward. |
| `./.kiro/specs/oando-master/.config.kiro`, all neighboring spec artifacts, `./.kiro/agents/**`, root files, `./docs/**`, `./Agents/**`, application/runtime, package, database, hook, MCP/Power, deployment, generated-output, and test paths | `I/C-01` as rejection boundary | Read-only evidence or no access; no write/delete | Preserve unchanged; no neighboring path is unlocked by authorization for `tasks.md`. |
| Static read-back, completion evidence, and handoff | `V/R-01` | Read-only | `I/C-01` records the reconciled handoff; `V/R-01` cannot promote static text to runtime enforcement. |

#### Route Record

- **Outcome:** Define and publish one static, fail-closed Pre-Action Gate contract for all six action kinds in the authorized Tasks artifact, with explicit Action Record fields, decisions, reasons, next-owner actions, and no fallback behavior; do not implement or claim runtime enforcement.
- **Domain / Domain Index card:** `D20 — Kiro, skills, Powers, and Agents`; this is repository-local governance/spec work, not product implementation.
- **Exact first evidence locations and reasons:** the current user request for the sole writable target and command prohibition; `./.kiro/specs/oando-master/requirements.md` Requirements 35–38 for the gate, protected-path, record, and evidence rules; `./.kiro/specs/oando-master/design.md` §24 and Property 18 for the Action Record and single fail-closed boundary; `./.kiro/specs/oando-master/tasks.md` for dependencies, inherited four-slot ownership, and this exact task record; `./.kiro/specs/oando-master/.config.kiro` for spec identity/workflow; `./START.md`, `./AGENTS.md`, `./Agents/01-standard.md`, and `./plans/README.md` for repository authority and execution boundaries.
- **Candidate paths:** write only `./.kiro/specs/oando-master/tasks.md`; read the listed spec/authority paths as evidence; reject all protected, application/runtime, package, database, hook, MCP/Power, deployment, generated-output, and test paths for mutation.
- **Selected Package Skills and trigger evidence:** `oando-master` (mandatory first router and completion contract); `repo-map` (repository/spec path and authority orientation); `powers-skills-model` (the task defines repository-local Kiro Agent/action/gate records and capability boundaries). Selection is guidance-only and does not activate runtime capabilities.
- **Rejected Package Skills and reasons:** `db-migrations` (no SQL, schema, RLS, grants, rollback, or database work); `focss-css` (no styling, tokens, Tailwind, icons, or FOCSS work); `fork-boundaries` (no Planner/Studio Fork Tree); `graph-impact` (no shared-code, dependency, blast-radius, or cycle analysis); `planner-studio` (no Planner/Studio surface); `verify-and-gate` (the user forbids all tests, gates, builds, typechecks, scripts, package commands, browser/local-service commands, and other validation commands); `ai-retrieval` (no AI/retrieval behavior and the optional skill remains unselected/absent).
- **Workflow Mode:** `Supervised` — exact-scope governance documentation with serial ownership and no automatic execution.
- **Operational-Risk Classification:** repository governance, authorization, protected-path, and future runtime-enforcement design risk; no product, data, credential, infrastructure, deployment, or external-system change.
- **Command Classification:** static file reads are `read-only inspection`; no shell/test/gate/build/typecheck/script/package/browser/service/database/deployment/backup/Power/MCP command is proposed or run; every such future action is `no-run pending authorization`.
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / .kiro/specs/oando-master / tasks.md`; the existing Tasks artifact is authored spec/plan content, not generated output.
- **Owning source or script / authored or generated:** the approved `oando-master` fast-task workflow and current user request; authored, not generated.
- **Rejected placements:** `./results/**`, `./agents-work/**`, `./generated-documents/`, `./site/`, root controls, `./.kiro/agents/**`, neighboring spec/config files, hooks, packages, and any substitute or duplicate path.
- **Locked Path Gate state:** `explicitly-owner-authorized` only for the exact current `./.kiro/specs/oando-master/tasks.md` target; `Locked` for `./docs/**`, `./Agents/**`, every direct root file, `./.kiro/agents/**`, `.config.kiro`, and all unselected neighbors.
- **Site Write Gate state:** `not-applicable`; no `./site/` target exists.
- **Validation State:** static read-back is the only applicable proof; no command or validation run is authorized. The future universal gate is `guidance-only` / `not-observed`.
- **Unavoidable Owner Decisions:** none for the exact current Tasks write; future executable/host-integrated gate implementation, host interception scope, runtime roster evidence, protected-path lock implementation, and any command authorization remain separate Owner Decisions.
- **Next action:** `V/R-01` performs read-only static reconciliation of this record; no other path may be written or deleted without a new exact owner authorization.

#### Deliverable Register and status boundary

| Named deliverable | Owner | Lifecycle status | Enforcement status | Evidence or limitation |
|---|---|---|---|---|
| Agent Roster | `I/C-01`, inherited from task 1.1 | `serial-integrated` | `guidance-only` | Four declared slots and one attached coordinator are static records; runtime creation/loading is `not-observed`. |
| Ownership Matrix | `I/C-01`, with `P/R-01` planning input | `complete` | `guidance-only` | Task 1.3 objective, evidence, target, and exclusions are assigned; static text is not a runtime ownership lock. |
| Route Record | `P/R-01`, serially integrated by `I/C-01` | `complete` | `guidance-only` | Exact target, skills, risk, command boundary, artifact, lock, and next owner are recorded. |
| Pre-Action Gate Records | `P/R-01`, serially integrated by `I/C-01` | `complete` (static contract only) | `guidance-only` / `not-observed` | One prose Action Record schema and one matrix cover all six kinds; no executable/host-integrated gate or observed decision exists. |
| Handoff Record Register | `I/C-01` | `complete` | `guidance-only` | The complete task 1.3 handoff is recorded below; unavailable runtime values remain `not-observed`. |
| Conflict Stop Record, when a conflict occurs | `I/C-01` | `not-observed` | `not-observed` | No ownership/evidence conflict occurred in this static update; the stop rule remains active. |
| Completion Record | `V/R-01`, serially integrated by `I/C-01` | `complete` for static publication/read-back | `guidance-only` / `not-observed` | The task marker and this Tasks artifact are the only completion evidence; runtime enforcement is not claimed. |

**Status boundary:** task 1.3 is `complete` only for the static gate contract and handoff in the authorized Tasks artifact. The future Pre-Action Enforcement Layer remains `guidance-only` / `not-observed`; if a future layer is unavailable or indeterminate, each affected action must be denied and its enforcement state set to `blocked` or `not-observed`. No absent runtime evidence is promoted to `verified`, `enforced`, or an implicit allow.

#### Conflict Stop Rule for Pre-Action Gate records

If an Action Record is missing, malformed, stale, ambiguous, contradictory, denied, unavailable, or indeterminate; if ownership or target paths overlap; if a receiver is outside the four-slot roster; or if a proposed action expands beyond the Route Record, stop before the action. Preserve the proposed target and source, record the exact reason and next owner action, and route the matter to `I/C-01` and the Repository Owner when authorization, protected-path scope, or unresolved conflict is required. Resume only after a fresh, complete, current record is serially reconciled. Never overwrite, reinterpret, select an alternate tool/path/Agent/permission, or infer approval.

#### Task 1.3 Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Define and publish the single static fail-closed Pre-Action Gate contract for `read`, `write`, `delete`, `command`, `delegation`, and `handoff`, including Action Record fields, explicit allow/deny reasons, next-owner actions, denial behavior, protected-path boundaries, and unavailable/indeterminate handling, while changing only the authorized Tasks artifact.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; next owner is `V/R-01` for read-only static reconciliation, then the Repository Owner for any separately approved executable/host-integrated gate, runtime roster, protected-path enforcement, or command authorization. No later shared-path write begins before serial integration.
- **Scope:** Static task-record contract only. It covers one common decision boundary, the Action Record/decision fields, six action-kind predicates, explicit denial reasons, next-owner actions, no-fallback behavior, Protected Path Lock interaction, status boundary, and handoff evidence. It excludes any executable or host-integrated gate, hook/script/checker, Agent definition, runtime interception, application/runtime code, package, database/migration, deployment, MCP/Power, generated output, protected source, and command.
- **Paths Read and Paths Changed:** Read the current user request; `./START.md`; `./AGENTS.md`; `./Agents/01-standard.md`; `./plans/README.md`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; `./.kiro/specs/oando-master/tasks.md`; `./.kiro/specs/oando-master/.config.kiro`; and the loaded `oando-master` routing guidance. Changed exactly `./.kiro/specs/oando-master/tasks.md` to replace the task 1.3 placeholder with this static gate contract, status marker, records, matrix, and handoff. No protected path, `.config.kiro`, Agent definition, root file, application/runtime file, package, database/migration, hook, MCP/Power asset, deployment, generated-output, or test file was changed.
- **Route Record:** The Route Record above governs this handoff: D20; Local Evidence first; selected `oando-master`, `repo-map`, and `powers-skills-model`; `Supervised`; no command; authored Active Plan Tasks artifact; exact current target authorization; protected paths locked; and Site Write Gate not applicable.
- **Evidence:** Requirements 35.1–35.11 define the executable/host-integrated boundary, checks for all six action kinds, explicit allow/deny, fail-closed denial, no alternate selection, unavailable/indeterminate handling, and `not-observed` reporting. Requirements 36.2–36.6 define exact protected-path authorization, read-only separation, and no-substitute-copy behavior. Design §24 and Property 18 define the Action Record fields, decision fields, one common boundary, and static/runtime limitation. Static read-back establishes only the written gate contract and its task record.
- **Decisions:** Use one common gate for all six action kinds; require explicit Action Record and decision fields; require action-specific checks shown in the matrix; deny all missing/malformed/stale/ambiguous/contradictory/denied/unavailable/indeterminate states before execution; record the exact reason and next owner action; never choose an alternate tool, path, command, Agent, permission, or inferred approval; preserve protected paths and read-only semantics; keep current enforcement `guidance-only` / `not-observed`; and leave implementation as Separate Approval Work.
- **Coverage Gaps:** No executable or host-integrated Pre-Action Enforcement Layer was created or observed; no actual runtime allow/deny decision, universal interception, automatic roster loading, or host integration was tested or proved; the current command-specific hook boundary is not generalized to reads, writes, deletes, delegation, or handoffs; no external/global Kiro coverage, rendered behavior, hosted persistence, connected MCP, installed Power, or command success is established by this record.
- **Validation Command:** `none` — the current request explicitly forbids tests, gates, builds, typechecks, scripts, package commands, browser/local-service commands, database/deployment/backup actions, and other validation commands. Only static file reads and the authorized `tasks.md` edit/read-back are applicable.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for updating `./.kiro/specs/oando-master/tasks.md`; no protected file, Agent definition, application/runtime path, package, database, hook, MCP/Power, deployment, generated-output, or command action is authorized. No inferred approval is used.
- **Hook Decision:** `not-observed` for a universal gate; no command hook was invoked, and command-specific `block-agent-tests` evidence is not generalized to the other five action kinds or to runtime enforcement.
- **Exit Status:** `not-observed` — no command or runtime action was executed.
- **Validation Limitation:** Static requirements/design comparison and tasks.md read-back can establish the prose schema, matrix, scope, status labels, and changed-path record only. They cannot prove that a host loads the gate, intercepts all six actions, denies before execution, records runtime decisions, enforces protected paths, creates/spawns the four Agents, applies permissions, succeeds on commands, renders behavior, persists hosted data, connects MCP, loads a Power, or covers external/global Kiro files.
- **Blockers:** None within the authorized static task 1.3 scope. Future executable/host-integrated enforcement, runtime observation, protected-path implementation, and any command validation are Separate Approval Work / pending Owner Decisions rather than current-scope blockers.
- **Next Action:** `V/R-01` performs static read-back of this exact task record; the Repository Owner separately authorizes any future executable/host-integrated gate and exact validation command. Until observed, universal enforcement remains `guidance-only` / `not-observed`.
- **Status:** `complete` for the static task 1.3 contract, matrix, handoff, and completion marker; universal Pre-Action Enforcement remains `guidance-only` / `not-observed`.

- **Evidence:** static gate matrix, Action Record schema, explicit decisions/reasons/next-owner actions, fail-closed/no-fallback rules, and complete handoff; no executable gate or runtime enforcement is claimed.
- **Requirements:** 35.1–35.11, 36.2–36.6, 37.5–37.7, 38.1–38.3; Design §24; Property 18.

  - [x] 1.4 Freeze required handoff fields, closed statuses, static/runtime evidence separation, and validation limits

Separate static path/text/count/read-back evidence from host/runtime observations and owner-authorized command results. Record that static evidence cannot prove loading, spawning, interception, fail-closed denial, command success, rendered behavior, hosted persistence, MCP connection, Power loading, or external/global coverage.

### Task 1.4 static evidence, status, and handoff record

**Task identity and publication boundary:** `oando-master / 1.4`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is a static status-schema, evidence-boundary, validation-limit, and task-record update. The current user request authorizes only the existing `./.kiro/specs/oando-master/tasks.md` artifact. No application/runtime, package, lockfile, database/migration, deployment, backup, local-service, hook, MCP, Power, settings, generated-output, test-harness, protected-path, contract-append, Exact-Line, Agent-definition, or executable/host-integrated enforcement change is authorized or created.

**Dependency and role slots:** `1.1 → 1.2 → 1.3 → 1.4`; the inherited four slots remain `S/M-01` Scout/Map, `P/R-01` Planner/Risk, `I/C-01` Implementer with the attached Coordinator/Serial Integration Owner designation, and `V/R-01` Verifier/Reporter. The roster is a plan-declared static record; host/runtime creation or loading is `not-observed`, and no fifth Agent or silent one-Agent fallback is permitted.

**Scope:** Freeze the seven required controlled-task deliverables; the complete Handoff Record field set; the lifecycle and Enforcement Status vocabularies; the distinction among static inventory/read-back, host/integration, and owner-authorized command evidence; validation and authorization limits; missing-proof handling; and this task's evidence-honest handoff. This record does not append either approved contract form, apply the future Exact-Line Rule, create an executable or host-integrated enforcement layer, alter hooks or Agent definitions, run commands, or claim runtime behavior.

**Owned paths and write boundary:** `I/C-01` may write only `./.kiro/specs/oando-master/tasks.md`; `V/R-01` performs read-only reconciliation. Read-only evidence includes the current user request, `./AGENTS.md`, `./Agents/01-standard.md`, `./plans/README.md`, `./.kiro/specs/oando-master/requirements.md`, `./.kiro/specs/oando-master/design.md`, `./.kiro/specs/oando-master/tasks.md`, `./.kiro/specs/oando-master/.config.kiro`, and the loaded `oando-master`, `repo-map`, and `powers-skills-model` guidance. `./START.md` was searched for as a required authority source but is `not-observed` because no file was found; its contents are not inferred. All other paths remain excluded and unchanged.

**Approval gate:** only this exact Tasks-artifact update and static read-back are in scope. No protected write/delete, contract append, Exact-Line insertion, Agent-definition change, executable/host-integrated enforcement, command, test, gate, build, typecheck, script, package action, browser/local-service action, database/migration action, deployment, backup, Power activation, MCP connection, external call, or application/runtime implementation is permitted in this task.

#### Required controlled-task deliverables and closed vocabularies

Every future controlled Repository Task starts with exactly these named deliverables, with no additional implied deliverable:

1. `Agent Roster`.
2. `Ownership Matrix`.
3. `Route Record`.
4. `Pre-Action Gate Records`.
5. `Handoff Record Register`.
6. `Conflict Stop Record` when a conflict occurs.
7. `Completion Record`.

The lifecycle Status Vocabulary is closed to exactly: `planned`, `assigned`, `ready`, `in-progress`, `blocked`, `denied`, `handoff-ready`, `serial-integrated`, `verified`, `complete`, `pending-owner`, and `not-observed`.

The Enforcement Status Vocabulary is closed to exactly: `guidance-only`, `not-observed`, `partially-enforced`, `enforced`, and `blocked`.

The Validation State vocabulary remains distinct from lifecycle and enforcement status and is closed to: `not-needed`, `eligible`, `pending-user-authorization`, `blocked-by-hook`, `observed-pass`, `observed-fail`, and `not-run`. This task's command-validation state is `not-run`; static file read-back is evidence, not a command result.

A state transition never promotes missing, pending, denied, unavailable, or `not-observed` evidence to `verified`, `enforced`, or `complete` by implication. A missing required field, owner, status, evidence value, receiver, changed-file reason, or proof keeps the affected Completion Record `blocked`, `pending-owner`, or `not-observed` and names the next owner action. `complete` below is limited to publication/read-back of this static Tasks record; it is not a runtime or universal-enforcement claim.

#### Required Handoff Record fields

Every Handoff Record in the Handoff Record Register contains all of the following fields in this order. An unavailable value is written as `not-observed`, never omitted:

1. **Objective**
2. **Role and Next Owner**
3. **Scope**
4. **Paths Read and Paths Changed**
5. **Route Record**
6. **Evidence**
7. **Decisions**
8. **Coverage Gaps**
9. **Validation Command**
10. **Repository Root**
11. **Authorization State**
12. **Hook Decision**
13. **Exit Status**
14. **Validation Limitation**
15. **Blockers**
16. **Next Action**
17. **Status**

Changed paths must match the exclusive or serial owner and every changed file must have a reason. Validation actually run is recorded separately from validation not run; an unobserved command is unrun. The receiving owner is explicit. Handoff completeness, ownership, evidence, and validation gaps cannot be repaired by inference, an alternate receiver, an alternate path, or a substitute record.

The Completion Record additionally contains every changed file and why it changed; actual validation with exact observed results; validation not run with the exact pending or unauthorized reason; remaining issues; unverified behavior; blockers; next owner action; scope and exclusions; Multi-Agent Evidence; Coverage-Gap Admission Cards when applicable; Separate Approval Work; and the final lifecycle status. For an output-producing task it repeats Artifact Class, selected Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement evidence. Missing Completion Record proof remains `blocked`, `pending-owner`, or `not-observed`.

#### Static, host/runtime, and owner-authorized evidence separation

| Evidence layer | May establish | Must not establish without stronger evidence |
|---|---|---|
| **Static inventory/read-back** | Exact paths, classifications, text/forms, counts, links, ownership declarations, scope, unchanged-file observations, and the contents of this Tasks record | Runtime loading, automatic Agent spawning, tool interception, fail-closed denial, command success, rendered behavior, hosted persistence, connected MCP, installed Power state/loading, or external/global Kiro coverage |
| **Host/integration observation** | A real roster, pre-action decision, hook result, command result, or runtime load for the exact observed host/tool/scope | Behavior outside the observed host/tool/scope, future sessions, unobserved action kinds, or inaccessible external/global files |
| **Owner-authorized command or external-action evidence** | The exact authorized command/action result, exact repository-root cwd when applicable, authorization state, Hook Decision, exit status, scope, and limitation | Any broader claim than the exact command/action and observed scope proves; it does not convert static text into runtime enforcement |

A command-specific `block-agent-tests` observation, if separately authorized and observed, applies only to the command family and tool surface it actually covers. It is not generalized to reads, writes, deletes, delegation, handoffs, universal interception, or future sessions. No host/integration or owner-authorized command result is observed in this task, so those values remain `not-observed`.

#### Validation and command limits

- Static file reads and the authorized `tasks.md` edit/read-back are the only applicable evidence actions. They are `read-only inspection`/static artifact evidence, not command validation.
- No tests, gates, builds, typechecks, scripts, package commands, implementation commands, browser runs, local services, database/migration actions, deployment, backup, Power activation, MCP connection, or external command/action is proposed or run. Any future instance is `no-run pending authorization` and requires the exact current-session owner authorization and applicable Hook Permission before execution.
- No command in this task is a `Normal-Agent Eligible Check`; no command has an observed exit status. `Validation Command` is `none`; `Exit Status` is `not-observed` because no command ran.
- An owner-authorized command record, when a future owner explicitly approves one, must preserve the exact command, repository-root cwd, authorization state, Hook Decision, exit status, scope, and validation limitation. An inline marker, prompt token, static label, or self-attestation is not Explicit User Authorization or Hook Permission.
- Static read-back cannot prove command success, runtime loading, spawning, interception, fail-closed denial, rendered behavior, hosted persistence, MCP connection, Power loading, or external/global coverage. Missing proof is recorded as `pending-owner`, `blocked`, or `not-observed`, with the next owner action.

#### Route Record for task 1.4

- **Outcome:** Freeze one inspectable, evidence-honest handoff/status/validation contract in the authorized Tasks artifact without implementing or claiming runtime enforcement.
- **Domain / Domain Index card:** `D20 — Kiro, skills, Powers, and Agents`; this is repository-local governance/spec work, not product implementation.
- **Exact first evidence locations and reasons:** the current user request for the exact writable target and command prohibition; `./.kiro/specs/oando-master/requirements.md` Requirements 37, 38, and 40 for records, evidence limits, and coordinator handoff; `./.kiro/specs/oando-master/design.md` §§26–28 and Property 19 for schemas and evidence layers; `./.kiro/specs/oando-master/tasks.md` for the inherited four-slot route and task dependency; `./.kiro/specs/oando-master/.config.kiro` for spec identity/workflow; `./AGENTS.md`, `./Agents/01-standard.md`, and `./plans/README.md` for repository authority and execution boundaries.
- **Candidate paths:** write only `./.kiro/specs/oando-master/tasks.md`; inspect the listed spec/authority paths; reject all protected, application/runtime, package, database, hook, MCP/Power, deployment, generated-output, and test paths for mutation.
- **Selected Package Skills and trigger evidence:** `oando-master` (mandatory first router and completion contract); `repo-map` (repository/spec path and authority orientation); `powers-skills-model` (Kiro records, Agent roles, status vocabularies, and capability-boundary distinctions). Selection is guidance-only and does not activate runtime capabilities.
- **Rejected Package Skills and reasons:** `db-migrations` (no SQL, schema, RLS, grants, rollback, or database work); `focss-css` (no styling, tokens, Tailwind, icons, or FOCSS work); `fork-boundaries` (no Planner/Studio Fork Tree); `graph-impact` (no shared-code, dependency, blast-radius, or cycle analysis); `planner-studio` (no Planner/Studio surface); `verify-and-gate` (the user forbids tests, gates, builds, typechecks, scripts, package commands, browser/local-service commands, and other validation commands); `ai-retrieval` (no AI/retrieval behavior and the optional skill remains unselected/absent).
- **Workflow Mode:** `Supervised` — exact-scope governance documentation with serial ownership and no automatic execution.
- **Operational-Risk Classification:** repository governance, authorization, protected-path, evidence, and future runtime-enforcement design risk; no product, data, credential, infrastructure, deployment, or external-system change.
- **Command Classification:** static reads are `read-only inspection`; no command is proposed or run; every future protected/test-like/local-service/implementation action is `no-run pending authorization`.
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / .kiro/specs/oando-master / tasks.md`; the existing Tasks artifact is authored spec/plan content, not generated output.
- **Owning source or script / authored or generated:** the approved `oando-master` fast-task workflow and current user request; authored, not generated.
- **Rejected placements:** `./results/**`, `./agents-work/**`, `./generated-documents/`, `./site/`, root controls, `./.kiro/agents/**`, neighboring spec/config files, hooks, packages, and any substitute or duplicate path.
- **Locked Path Gate state:** `explicitly-owner-authorized` only for the exact current `./.kiro/specs/oando-master/tasks.md` target; `Locked` for `./docs/**`, `./Agents/**`, every direct root file, `./.kiro/agents/**`, `.config.kiro`, and all unselected neighbors.
- **Site Write Gate state:** `not-applicable`; no `./site/` target exists.
- **Validation State:** `not-run` for commands; static read-back is the only applicable proof. Host/runtime roster, universal Pre-Action Enforcement, protected-path enforcement, and owner-authorized command results are `not-observed`/pending-owner.
- **Unavoidable Owner Decisions:** none for this exact Tasks write; future executable/host-integrated enforcement, runtime roster evidence, Protected Path Lock implementation, Exact-Line rollout, contract append, and any command authorization remain separate Owner Decisions.
- **Next action:** `V/R-01` performs read-only static reconciliation; no other path may be written or deleted without a new exact owner authorization.

#### Deliverable Register and status boundary for task 1.4

| Named deliverable | Owner | Lifecycle status | Enforcement status | Evidence or limitation |
|---|---|---|---|---|
| Agent Roster | `I/C-01`, inherited from task 1.1 | `complete` (static declaration/read-back only) | `guidance-only` / `not-observed` | Four plan-declared entries and one attached coordinator designation are recorded; runtime creation/loading and automatic spawning are `not-observed`. |
| Ownership Matrix | `I/C-01`, with `P/R-01` planning input | `complete` (static mapping only) | `guidance-only` | Exact task objective, evidence, artifact, and path ownership is recorded; this text is not a runtime ownership lock. |
| Route Record | `P/R-01`, serially integrated by `I/C-01` | `complete` (static record only) | `guidance-only` | The exact target, skills, risk, command class, artifact, lock, and next action are recorded; no skill/runtime activation is implied. |
| Pre-Action Gate Records | `P/R-01`, serially integrated by `I/C-01` | `complete` (static schema/limit only) | `guidance-only` / `not-observed` | The six-action gate contract exists as prose in task 1.3; no executable/host-integrated decision or universal interception is observed here. |
| Handoff Record Register | `I/C-01` | `complete` (static field set and handoff below) | `guidance-only` | All required fields are present; unavailable values are explicitly `not-observed`. |
| Conflict Stop Record, when a conflict occurs | `I/C-01` | `not-observed` | `not-observed` | No ownership, edit, or evidence conflict occurred in this static update; missing/conflicting evidence must invoke the stop rule rather than be inferred away. |
| Completion Record | `V/R-01`, serially integrated by `I/C-01` | `complete` for static publication/read-back only | `guidance-only` / `not-observed` | The `[x]` marker, this task record, and static read-back are the completion proof for the documentation artifact; runtime/command proof is not claimed. |

**Status boundary:** this task is `complete` only for the static status/evidence/handoff record in the authorized Tasks artifact. No static text promotes the universal controlled executor to `enforced`, promotes a missing field to `verified`, or proves a host loaded four Agents. If a future required value is unavailable, the field remains `not-observed`; if proof is missing, the record remains `pending-owner` or `blocked` and names the next owner.

#### Conflict Stop Rule for task 1.4 records

If a required deliverable, Handoff Record field, owner, receiver, changed-file reason, authorization, validation distinction, or evidence value is missing, malformed, stale, ambiguous, contradictory, or unavailable; if ownership/path sets overlap; or if a proposed action expands beyond this Route Record, stop the affected write or handoff. Preserve the source and competing evidence, record the exact reason and next owner action, and route the matter to `I/C-01` and the Repository Owner. Do not omit the field, reinterpret evidence, select an alternate path/tool/Agent/permission/receiver, infer approval, or promote `blocked`, `pending-owner`, or `not-observed` to `verified`/`complete`.

#### Task 1.4 Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Freeze the complete controlled-task handoff schema, closed lifecycle and Enforcement Status vocabularies, static/host-runtime/owner-authorized evidence separation, and validation limits in the sole authorized Tasks artifact without appending contracts or implementing executable/host-integrated enforcement.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; next owner is `V/R-01` for read-only static reconciliation, then the Repository Owner for any pending runtime, enforcement, protected-path, Exact-Line, contract, Power/MCP, or owner-authorized command decision. No later shared-path write begins before serial integration.
- **Scope:** Static task-record contract only. It covers exactly seven named deliverables; all 17 Handoff Record fields; Completion Record content; closed lifecycle, Enforcement Status, and Validation State vocabularies; static versus host/runtime versus owner-authorized evidence limits; unavailable/missing-proof handling; command classification; and the current task's completion boundary. It excludes contract append, Exact-Line insertion, Agent-definition change, runtime roster creation/loading, executable/host-integrated Pre-Action Enforcement, hook changes, application/runtime code, package, database/migration, deployment, backup, MCP/Power, generated output, protected source, and all commands.
- **Paths Read and Paths Changed:** Read the current user request; `./AGENTS.md`; `./Agents/01-standard.md`; `./plans/README.md`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; `./.kiro/specs/oando-master/tasks.md`; `./.kiro/specs/oando-master/.config.kiro`; `./.kiro/skills/oando-master/SKILL.md`, `./.kiro/skills/repo-map/SKILL.md`, and `./.kiro/skills/powers-skills-model/SKILL.md` guidance as loaded. `./START.md` was searched but is `not-observed` because no file was found. Changed exactly `./.kiro/specs/oando-master/tasks.md` to replace the task 1.4 placeholder with this static status/evidence contract, deliverable register, conflict rule, handoff, and completion marker. No other file was changed.
- **Route Record:** The Route Record above governs this handoff: D20; Local Evidence first; selected `oando-master`, `repo-map`, and `powers-skills-model`; `Supervised`; no command; authored Active Plan Tasks artifact; exact current-target authorization; protected paths locked; and Site Write Gate not applicable.
- **Evidence:** Requirements 37.5–37.11 require the seven deliverables, complete Handoff Record fields, closed lifecycle and enforcement vocabularies, and missing-proof handling. Requirements 38.1–38.5 and 40.1–40.6 require static/runtime separation, command-specific hook scope, inaccessible-file limits, changed-file reasons, actual-versus-pending validation, and an honest next-owner handoff. Design §§26–28 and Property 19 define the same schemas, evidence layers, safe fallback, and no-runtime-claim boundary. Static read-back of this exact Tasks section is the completion proof for this documentation record only.
- **Decisions:** Keep exactly seven named deliverables and exactly the 17 Handoff Record fields; keep the lifecycle, Enforcement Status, and Validation State vocabularies closed; use `not-observed` for unavailable values; keep missing proof `pending-owner`/`blocked` rather than promoting it; separate static, host/runtime, and owner-authorized command evidence; treat command-specific hook observations as scope-limited; preserve the sole current writable path; and leave contract append, Exact-Line rollout, protected-path implementation, runtime roster/enforcement, and all commands as Separate Approval Work or pending Owner Decisions.
- **Coverage Gaps:** Host/runtime roster creation/loading, automatic spawning, universal Pre-Action interception and fail-closed denial, command success, rendered behavior, hosted persistence, connected MCP, Power loading, external/global Kiro coverage, and `./START.md` contents are `not-observed`. No current command result, Hook Decision, owner-authorized command evidence, external action, or runtime observation exists for this task. The optional AI skill remains absent/unselected; HTML provenance and downstream inventories remain separate tasks.
- **Validation Command:** `none` — the current request forbids tests, gates, builds, typechecks, scripts, package commands, implementation commands, browser/local-service commands, database/migration actions, deployment, backup, Power/MCP actions, and external calls. Only static file reads and the authorized Tasks-artifact edit/read-back are applicable; no command was run.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for updating the exact `./.kiro/specs/oando-master/tasks.md` artifact. No protected file, Agent definition, application/runtime path, package, database, hook, MCP/Power, deployment, generated-output, or command action is authorized. No inferred approval or inline authorization marker is used.
- **Hook Decision:** `not-observed` for a universal pre-action decision; no command hook was invoked. Any command-specific hook evidence remains limited to its observed tool/command scope and is not generalized to reads, writes, deletes, delegation, or handoffs.
- **Exit Status:** `not-observed` — no command or host/runtime action was executed.
- **Validation Limitation:** Static path, text, count, ownership, scope, and read-back evidence establishes only this written documentation record. It cannot prove runtime loading, automatic spawning, tool interception, fail-closed denial, command success, rendered behavior, hosted persistence, connected MCP, installed Power/loading, external/global Kiro coverage, or behavior outside an observed host/scope. No static evidence is treated as owner-authorized command evidence.
- **Blockers:** None within the authorized static task 1.4 scope. Unobserved runtime/enforcement/command proof, absent `START.md`, future protected or runtime changes, and separate approval work remain `not-observed`/`pending-owner`, not current-scope blockers.
- **Next Action:** `V/R-01` performs read-only static read-back of this exact task record; the Repository Owner must separately authorize any future command, runtime/enforcement implementation, contract append, Exact-Line rollout, protected-path change, Power/MCP action, or other excluded scope.
- **Status:** `complete` for task 1.4 static publication and read-back only; universal controlled-executor Enforcement Status remains `guidance-only` / `not-observed`, and any missing future proof remains `pending-owner` or `blocked`.

- **Evidence:** static status/record schema, complete handoff field list, closed vocabularies, three-layer evidence boundary, command limits, and explicit pending/not-observed rules; no tests, gates, builds, typechecks, scripts, package commands, or implementation commands.
- **Requirements:** 37.5–37.11, 38.1–38.5, 40.1–40.6; Design §§26–28; Property 19.

- [x] 2. Produce the literal path, classification, provenance, and baseline inventory

- **Dependency:** `1.1 → 1.2 → 1.3 → 1.4`.
- **Role slots:** `S/M-01` leads read-only inventory; `P/R-01` owns classifications and gaps; `I/C-01` serially integrates the baseline; `V/R-01` reads back counts and scope. Exactly four slots remain declared.
- **Owned paths:** the 51 Kiro Markdown paths, the 12 guide Markdown paths, the conditional HTML/CSS paths, current Kiro controls, package/script references, artifact homes, and relevant read-only authority sources.
- **Excluded paths:** every write except the current Tasks artifact; no contract append, migration, application change, protected-path change, command, generator, or runtime claim.
- **Approval gate:** inventory/classification/provenance only; do not append either approved contract form to any active document.

  - [x] 2.1 Inventory all 51 required Kiro Markdown paths individually

For every listed path record `path`, `classification`, `contractMode`, owner, evidence state, and limitation. Use only `exact-block`, `canonical-inclusion`, `not-applicable`, or `not-observed` for `contractMode`. The exact 36 Active, 11 Reference/History, and 4 Package lists are the baseline above; no Generated Kiro Markdown is claimed. Preserve the negative inventory and inaccessible External/Global `not-observed` state.

- **Evidence:** a path-by-path static inventory; no active document is modified.
- **Requirements:** 33.1–33.9, 38.4; Design §§22 and 27; Property 16.

### Task 2.1 static 51-path inventory record

**Task identity and publication boundary:** `oando-master / 2.1`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is a static inventory and classification record. The current user request authorizes one write to the existing `./.kiro/specs/oando-master/tasks.md` artifact only. No active document, protected path, Agent definition, hook, MCP/Power, settings, application/runtime, package, database, deployment, generated-output, test, command, contract append, or Exact-Line change is authorized.

**Inherited dependency and four-slot ownership:** `1.1 → 1.2 → 1.3 → 1.4 → 2.1` is satisfied by the inherited static records above. The four declared slots remain `S/M-01` Scout/Map, `P/R-01` Planner/Risk, `I/C-01` Implementer with the attached Coordinator/Serial Integration Owner designation, and `V/R-01` Verifier/Reporter. `S/M-01` owns read-only path observation; `P/R-01` owns classifications, contract-mode decisions, evidence gaps, and negative-inventory decisions; `I/C-01` serially integrates this record in the sole authorized Tasks artifact; `V/R-01` performs static read-back. The `owner` column below identifies the static source/workstream owner of each path, not a runtime permission grant; the four task-slot owners are recorded here separately.

**Static evidence basis:** directory listings confirmed all 36 Active Contract-Bearing, 11 Reference or History, and 4 Package paths are present in the accessible workspace. Static marker searches over the accessible active categories did not observe the exact Canonical Inclusion or an exact Kiro Agent Contract marker in any active path. Therefore every active row has `contractMode: not-observed`; no active document is claimed contract-covered. Reference/History and Package rows use `contractMode: not-applicable` because they are not active workspace contract surfaces, even if reference prose mentions contract terms. No Generated Kiro Markdown path was observed or claimed. These are static path/content-marker observations only; they do not establish runtime loading, enforcement, spawning, or external/global coverage.

#### 36 Active Contract-Bearing Documents

| path | classification | contractMode | owner | evidence state | limitation |
|---|---|---|---|---|---|
| `./.kiro/agents/capability-powers-author.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / Agent definitions | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/agents/containment-reconciler.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / Agent definitions | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/agents/hook-localizer.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / Agent definitions | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/agents/spec-task-runner.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / Agent definitions | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/agents/spec-task-runner2.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / Agent definitions | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/skills/db-migrations/SKILL.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / skill: db-migrations | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/skills/focss-css/SKILL.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / skill: focss-css | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/skills/fork-boundaries/SKILL.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / skill: fork-boundaries | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/skills/graph-impact/SKILL.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / skill: graph-impact | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/skills/oando-master/SKILL.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / skill: oando-master | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; router prose is not the exact contract form, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/skills/planner-studio/SKILL.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / skill: planner-studio | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/skills/powers-skills-model/SKILL.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / skill: powers-skills-model | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/skills/repo-map/SKILL.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / skill: repo-map | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/skills/verify-and-gate/SKILL.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / skill: verify-and-gate | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/agent-behavior.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: agent-behavior | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/ai.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: ai | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/api.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: api | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/coding-standards.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: coding-standards | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/database.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: database | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/deployment.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: deployment | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/graph-layer.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: graph-layer | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/INDEX.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: INDEX | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/ltm-memory-format.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: ltm-memory-format | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/ltm-operations.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: ltm-operations | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/nova-act-viewport.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: nova-act-viewport | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/product.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: product | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/seo.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: seo | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/tech-stack.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: tech-stack | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/testing.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: testing | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/steering/ui-css.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / steering: ui-css | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/powers/analytics/POWER.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / Power: analytics | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/powers/oando-workflow/POWER.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / Power: oando-workflow | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/powers/observability/POWER.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / Power: observability | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/powers/security/POWER.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / Power: security | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/powers/oando-workflow/steering/routing.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / Power steering: oando-workflow/routing | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |
| `./.kiro/kiro-repo-guidance-setup/README.md` | `Active Contract-Bearing` | `not-observed` | Repository Owner / guidance setup | observed-present; active baseline; exact form not observed | Static listing and marker evidence only; no exact block or Canonical Inclusion observed, no append authorized, and no runtime loading/enforcement claim. |

#### 11 Reference/History Documents

| path | classification | contractMode | owner | evidence state | limitation |
|---|---|---|---|---|---|
| `./.kiro/kiro-repo-guidance-setup/RECONCILIATION.md` | `Reference or History` | `not-applicable` | Repository Owner / guidance-setup history | observed-present; reference/history baseline | Inventoried as non-active evidence; not active contract coverage and no contract append claim without separate owner-approved scope. |
| `./.kiro/specs/documentation-global-standards/design.md` | `Reference or History` | `not-applicable` | Repository Owner / spec: documentation-global-standards | observed-present; reference/history baseline | Inventoried as non-active evidence; not active contract coverage and no contract append claim without separate owner-approved scope. |
| `./.kiro/specs/documentation-global-standards/implementation-record.md` | `Reference or History` | `not-applicable` | Repository Owner / spec: documentation-global-standards | observed-present; reference/history baseline | Inventoried as non-active evidence; not active contract coverage and no contract append claim without separate owner-approved scope. |
| `./.kiro/specs/documentation-global-standards/requirements.md` | `Reference or History` | `not-applicable` | Repository Owner / spec: documentation-global-standards | observed-present; reference/history baseline | Inventoried as non-active evidence; not active contract coverage and no contract append claim without separate owner-approved scope. |
| `./.kiro/specs/documentation-global-standards/tasks.md` | `Reference or History` | `not-applicable` | Repository Owner / spec: documentation-global-standards | observed-present; reference/history baseline | Inventoried as non-active evidence; not active contract coverage and no contract append claim without separate owner-approved scope. |
| `./.kiro/specs/kiro-config-rewrite/design.md` | `Reference or History` | `not-applicable` | Repository Owner / spec: kiro-config-rewrite | observed-present; reference/history baseline | Inventoried as non-active evidence; not active contract coverage and no contract append claim without separate owner-approved scope. |
| `./.kiro/specs/kiro-config-rewrite/requirements.md` | `Reference or History` | `not-applicable` | Repository Owner / spec: kiro-config-rewrite | observed-present; reference/history baseline | Inventoried as non-active evidence; not active contract coverage and no contract append claim without separate owner-approved scope. |
| `./.kiro/specs/kiro-config-rewrite/tasks.md` | `Reference or History` | `not-applicable` | Repository Owner / spec: kiro-config-rewrite | observed-present; reference/history baseline | Inventoried as non-active evidence; not active contract coverage and no contract append claim without separate owner-approved scope. |
| `./.kiro/specs/oando-master/design.md` | `Reference or History` | `not-applicable` | Repository Owner / spec: oando-master | observed-present; reference/history baseline | Inventoried as non-active evidence; not active contract coverage and no contract append claim without separate owner-approved scope. |
| `./.kiro/specs/oando-master/requirements.md` | `Reference or History` | `not-applicable` | Repository Owner / spec: oando-master | observed-present; reference/history baseline | Inventoried as non-active evidence; not active contract coverage and no contract append claim without separate owner-approved scope. |
| `./.kiro/specs/oando-master/tasks.md` | `Reference or History` | `not-applicable` | Repository Owner / spec: oando-master | observed-present before this write; task 2.1 record now integrated | The Tasks artifact is a reference/history spec record, not active contract coverage; this write changes only the task record and does not append a contract. |

#### 4 Package Documents

| path | classification | contractMode | owner | evidence state | limitation |
|---|---|---|---|---|---|
| `./.kiro/power-packages/analytics/skills/analytics/SKILL.md` | `Package Document` | `not-applicable` | Repository Owner / package: analytics | observed-present; package baseline | Distributable package evidence only; not an active workspace contract surface and not active contract coverage without separate approval. |
| `./.kiro/power-packages/oando-workflow/skills/oando-workflow/SKILL.md` | `Package Document` | `not-applicable` | Repository Owner / package: oando-workflow | observed-present; package baseline | Distributable package evidence only; not an active workspace contract surface and not active contract coverage without separate approval. |
| `./.kiro/power-packages/observability/skills/observability/SKILL.md` | `Package Document` | `not-applicable` | Repository Owner / package: observability | observed-present; package baseline | Distributable package evidence only; not an active workspace contract surface and not active contract coverage without separate approval. |
| `./.kiro/power-packages/security/skills/security/SKILL.md` | `Package Document` | `not-applicable` | Repository Owner / package: security | observed-present; package baseline | Distributable package evidence only; not an active workspace contract surface and not active contract coverage without separate approval. |

**Count reconciliation:** exactly `36 Active Contract-Bearing + 11 Reference or History + 4 Package = 51` individually recorded rows. The four Package rows and eleven Reference/History rows are not active contract coverage; no Generated Kiro Markdown row is added to the 51 baseline because no generated path is claimed.

#### Negative inventory and coverage boundary

| Scope | classification/effect | contractMode | owner | evidence state | limitation |
|---|---|---|---|---|---|
| No generated path claimed under the accessible `./.kiro/` tree | `Generated Kiro Markdown` not claimed | `not-applicable` | Repository Owner / inventory boundary | not-observed as a generated item; no path observed | Static accessible-tree inspection found no generated Kiro Markdown path to inventory; a later observed generated path requires a new row and separate approval before any contract claim. |
| `./.kiro/hooks/**/*.md` | No Markdown observed; hook files are outside the 51 baseline | `not-applicable` | Repository Owner / hook boundary | observed-empty for Markdown | Hook configuration/source may exist in non-Markdown formats, but no Markdown contract surface is claimed and no hook runtime enforcement is inferred. |
| `./.kiro/mcp/**/*.md` | No Markdown observed; MCP schemas are outside the 51 baseline | `not-applicable` | Repository Owner / MCP boundary | observed-empty for Markdown | Accessible MCP contents observed as JSON tool schemas; schema presence does not establish configuration, connection, installation, or runtime availability. |
| `./.kiro/settings/**/*.md` | No Markdown observed; settings are outside the 51 baseline | `not-applicable` | Repository Owner / settings boundary | observed-empty for Markdown | Accessible settings contents are non-Markdown configuration; no Markdown contract surface or runtime loading claim is made. |
| External or Global Kiro files outside the accessible workspace | Inaccessible, not an active inventory member | `not-observed` | Repository Owner / external-global boundary | not-observed | No current path or read evidence exists; do not claim inspection, change, contract coverage, runtime loading, or enforcement without separate access and approval. |

Reference/History, Package, Generated, and inaccessible External/Global items remain outside active contract coverage unless a separate Owner-approved scope explicitly selects and reclassifies an exact path. The exact Kiro Agent Contract and Canonical Inclusion are not appended by this task.

#### Task 2.1 Route Record

- **Outcome:** Record a complete static, path-by-path inventory of exactly 51 accessible Kiro Markdown baseline paths, preserve the negative inventory, and distinguish active contract-bearing classifications from reference/history, package, generated, and inaccessible external/global states without modifying any active document or claiming runtime loading/enforcement.
- **Domain / Domain Index card:** `D20 — MCP, skills, Powers, and Agents`; this is repository-local Kiro governance/spec inventory, not product implementation.
- **Exact first evidence locations and reasons:** `./.kiro/specs/oando-master/requirements.md` for Requirements 33.1–33.9; `./.kiro/specs/oando-master/design.md` §§22 and 27 plus Property 16; `./.kiro/specs/oando-master/tasks.md` for the inherited 1.1–1.4 records, exact baseline, and sole write target; `./.kiro/specs/oando-master/.config.kiro` for feature/fast-task identity; `./AGENTS.md`, `./Agents/01-standard.md`, and `./plans/README.md` for authority, ownership, protected-path, and validation boundaries; `.kiro` directory listings and exact contract-marker searches for live static evidence.
- **Candidate paths:** the exact 51 rows above; negative scopes `./.kiro/hooks/`, `./.kiro/mcp/`, `./.kiro/settings/`, generated Kiro Markdown, and inaccessible External/Global Kiro files; the only write target is `./.kiro/specs/oando-master/tasks.md`.
- **Selected Package Skills and trigger evidence:** `oando-master` (mandatory first router and completion contract); `repo-map` (exact repository/spec path and authority orientation); `powers-skills-model` (Kiro skills, Powers, MCP schemas/configuration distinctions, Agent definitions, and contract inventory). Selection is guidance-only and does not activate a Power or runtime capability.
- **Rejected Package Skills and reasons:** `db-migrations` (no SQL, schema, RLS, grants, rollback, or database work); `focss-css` (no styling, tokens, Tailwind, icons, or FOCSS work); `fork-boundaries` (no Planner/Studio source or cross-import evaluation); `graph-impact` (no shared-code, dependency, blast-radius, or cycle analysis); `planner-studio` (no Planner/Studio surface); `verify-and-gate` (the user explicitly forbids tests, gates, builds, typechecks, scripts, package commands, browser/local-service commands, and all validation actions); `ai-retrieval` (not present/selected and no AI retrieval behavior is being inventoried).
- **Workflow Mode:** `Supervised` — owner-authorized governance/spec inventory with serial classification and read-back.
- **Operational-Risk Classification:** documentation/governance, protected-path, authorization, contract-scope, and evidence-honesty risk; no product, data, credential, infrastructure, deployment, or external-system mutation.
- **Command Classification:** static `read_file`, `list_directory`, and `grep_search` operations are `read-only inspection`; no shell command, test, gate, build, typecheck, script, package command, browser/local service, database, deployment, backup, Power activation, MCP connection, generator, or other validation command was proposed or run; any such future action is `no-run pending authorization`.
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / .kiro/specs/oando-master / tasks.md`; exact authored target `./.kiro/specs/oando-master/tasks.md`; filename `tasks.md`; owner/source `I/C-01` under this approved spec workflow; authored, not generated. Rejected placements are all 51 source paths, `./.kiro/agents/**`, `./.kiro/hooks/**`, `./.kiro/mcp/**`, `./.kiro/settings/**`, `./results/**`, `./agents-work/**`, `./generated-documents/`, `./site/`, root controls, and substitute/mirror copies.
- **Locked Path Gate state:** `explicitly-owner-authorized` only for the exact existing `./.kiro/specs/oando-master/tasks.md` target; all `./.kiro/agents/**`, root files, `./docs/**`, `./Agents/**`, and unselected neighboring paths remain read-only evidence or excluded. No active source, protected path, delete, or substitute-copy write occurred.
- **Site Write Gate state:** `not-applicable`; no `./site/` target exists.
- **Validation State:** `not-run` for commands and tests; static listings, marker searches, and authorized Tasks-artifact read-back are the only applicable evidence. Runtime loading/enforcement, Agent spawning, universal pre-action interception, Power/MCP connection, and External/Global access remain `not-observed`.
- **Unavoidable Owner Decisions:** none for this exact Tasks-artifact update; future exact active-document contract target/form, generated-path classification, External/Global access, runtime roster/enforcement, and any command or contract append remain separate Owner Decisions/Separate Approval Work.
- **Next action:** `V/R-01` performs static read-back of the 36/11/4 counts, every row, negative inventory, and completion marker; do not begin Task 2.2 or any downstream write until serial integration is accepted.

#### Task 2.1 Ownership Matrix and status evidence

| Objective or deliverable | Exclusive owner | Permission | Lifecycle status | Enforcement status | Evidence or limitation |
|---|---|---|---|---|---|
| Read-only path existence and negative-scope observation | `S/M-01` | Read-only | `complete` | `guidance-only` | Directory listings and marker searches establish static accessible paths only; no runtime or external/global observation. |
| Classification and contractMode for all 51 rows | `P/R-01` | Read-only planning/classification | `complete` | `guidance-only` | Exact 36/11/4 baseline is reconciled; active contract forms remain `not-observed`, reference/package are `not-applicable`. |
| Route Record, risk, command class, and Owner Decision boundary | `P/R-01` serially integrated by `I/C-01` | Read-only planning input | `complete` | `guidance-only` | Record is static and does not activate skills, Powers, MCP, or runtime enforcement. |
| `./.kiro/specs/oando-master/tasks.md` inventory write | `I/C-01` with Coordinator/Serial Integration Owner | Write only to this exact existing Tasks artifact | `complete` | `guidance-only` | This is the sole changed path; no active document or protected path was changed. |
| Handoff/read-back and completion proof | `V/R-01` serially integrated by `I/C-01` | Read-only | `complete` | `guidance-only` | Static read-back is the completion proof for this record only; no command result or runtime proof is implied. |
| Every other path, including active documents, Agent definitions, hooks, MCP, settings, package, application, database, deployment, generated-output, test, and protected paths | `I/C-01` as serial rejection boundary | No write permission | `not-observed` | `not-observed` | Excluded by current scope; no alternate path, copy, inferred approval, or scope expansion is allowed. |

#### Task 2.1 Deliverable Register

| Named deliverable | Owner | Lifecycle status | Enforcement status | Evidence or limitation |
|---|---|---|---|---|
| Agent Roster | `I/C-01`, inherited from Task 1.1 | `serial-integrated` | `guidance-only` | Exactly four declared slots and one attached coordinator remain static records; runtime creation/loading is `not-observed`. |
| Ownership Matrix | `I/C-01`, with `P/R-01` classification input | `complete` | `guidance-only` | All 51 rows and excluded scopes have a recorded owner; this is not a runtime lock. |
| Route Record | `P/R-01`, serially integrated by `I/C-01` | `complete` | `guidance-only` | Exact target, skills, risk, command class, artifact, lock, and next action are recorded. |
| Pre-Action Gate Records | `P/R-01`, inherited from Task 1.3 | `not-observed` | `guidance-only` | No executable or host-integrated gate was created or observed; no action is claimed controlled by this inventory. |
| Handoff Record Register | `I/C-01` | `complete` | `guidance-only` | The complete Task 2.1 handoff below is recorded with all required fields. |
| Conflict Stop Record, when a conflict occurs | `I/C-01` | `not-observed` | `not-observed` | No conflict occurred; the stop rule remains active and no contradiction was silently resolved. |
| Completion Record | `V/R-01`, serially integrated by `I/C-01` | `complete` for static publication/read-back only | `guidance-only` / `not-observed` | The `[x]` marker, 51-row inventory, negative inventory, and static read-back are completion evidence only. |

**Status boundary:** Task 2.1 is `complete` only for the static inventory record and read-back in this authorized Tasks artifact. It does not assert active-document contract coverage, runtime loading, automatic spawning, universal enforcement, connected MCP, installed Power state, external/global inspection, command success, or behavior outside the static evidence scope.

#### Task 2.1 Conflict Stop Rule

If any listed path is missing, duplicated, inaccessible, ambiguously classified, assigned an unapproved contract mode, or inconsistent with the exact 36/11/4 baseline; if a Reference/History, Package, Generated, or inaccessible External/Global item is proposed as active contract coverage; if ownership overlaps, evidence contradicts, or a write is proposed outside the sole authorized Tasks artifact, stop the affected write and inventory closure before proceeding. Preserve the source and competing evidence, record the exact path/reason and next owner action, and route the conflict to `I/C-01` and the Repository Owner for serial review. Do not overwrite, choose an alternate path/tool/Agent/permission, infer approval, append a contract, or promote `not-observed` to `verified`/`complete`. Current Conflict Stop state: `not-observed`; no inventory conflict was observed in the static pass.

#### Task 2.1 Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Publish the exact 36 Active Contract-Bearing, 11 Reference or History, and 4 Package path records with all required fields, negative inventory, ownership/status evidence, conflict-stop handling, and static-only limitations while changing only `./.kiro/specs/oando-master/tasks.md`.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; next owner is `V/R-01` for read-only reconciliation, then the Repository Owner for any future contract target/form, external/global access, generated-path, runtime/enforcement, or command decision. No downstream shared-path write begins before serial integration.
- **Scope:** Static path existence, classification, contractMode, owner, evidence state, limitation, count reconciliation, negative inventory, route, statuses, conflict-stop rule, and handoff only. Excludes active-document modification, contract append, Exact-Line rollout, Agent-definition change, hook/MCP/Power/settings change, application/runtime, package, database, deployment, generated-output, test, and command actions.
- **Paths Read and Paths Changed:** Read the current user request; `./AGENTS.md`; `./Agents/01-standard.md`; `./plans/README.md`; `./.kiro/specs/oando-master/.config.kiro`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; the pre-existing `./.kiro/specs/oando-master/tasks.md`; and static listings/marker searches over the accessible `./.kiro/` Agent, skill, steering, Power, package, setup, spec, hook, MCP, and settings paths. Changed exactly `./.kiro/specs/oando-master/tasks.md` to add this inventory, records, and completion marker; no active document or excluded path changed.
- **Route Record:** The Route Record above governs this handoff: D20; Local Evidence first; selected `oando-master`, `repo-map`, and `powers-skills-model`; `Supervised`; no commands; authored Tasks artifact; exact current-target authorization; protected paths locked; Site Write Gate not applicable.
- **Evidence:** Requirements 33.1–33.9; Design §§22 and 27; Property 16; inherited Tasks 1.1–1.4; accessible directory listings for all 51 paths; exact contract-marker searches; and the negative hooks/MCP/settings and External/Global boundary records. The 36/11/4 table is static evidence only.
- **Decisions:** Keep exactly 51 rows; classify all five physical Agent definitions as active inventory while preserving the distinction from four Active Agent slots; set active contractMode to `not-observed` because no exact form was observed; set Reference/History and Package contractMode to `not-applicable`; claim no Generated Kiro Markdown; record no Markdown under hooks/MCP/settings; keep inaccessible External/Global files `not-observed`; and do not append or modify any active document.
- **Coverage Gaps:** Exact contract coverage on active documents, runtime loading/enforcement, four-slot runtime creation/loading, automatic spawning, universal Pre-Action interception, connected MCP, installed Power state, generated-path provenance, External/Global Kiro contents, command results, rendered behavior, hosted persistence, and any behavior beyond static path/marker evidence are `not-observed` or separate approval work.
- **Validation Command:** `none` — the current request forbids commands, tests, gates, builds, typechecks, scripts, package commands, browser/local-service actions, databases, deployment, backups, Power activation, MCP connection, and other validation actions; only static reads and the authorized Tasks-artifact read-back are applicable.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for the exact existing `./.kiro/specs/oando-master/tasks.md` write. No active document, Agent definition, protected path, hook, MCP/Power, settings, application/runtime, package, database, deployment, generated-output, test, or command action is authorized; no inferred approval or substitute-copy claim is used.
- **Hook Decision:** `not-observed` for universal pre-action enforcement; no command hook was invoked, and command-specific hook coverage is not generalized to reads, writes, deletes, delegation, or handoffs.
- **Exit Status:** `not-observed` — no command or runtime action was executed.
- **Validation Limitation:** Static listings, marker searches, path classifications, counts, ownership records, and Tasks read-back establish only the written inventory and its evidence scope. They cannot prove exact active contract coverage when the form is not observed, runtime loading, spawning, enforcement, command success, connected MCP, installed Power, external/global coverage, rendered behavior, hosted persistence, or behavior outside the inspected paths.
- **Blockers:** None within the authorized static Task 2.1 scope. Any missing/inaccessible external/global evidence, absent exact active contract form, runtime/enforcement implementation, generated-path discovery, future contract append, and owner-controlled validation remain `not-observed`, `pending-owner`, or Separate Approval Work rather than current-scope blockers.
- **Next Action:** `V/R-01` performs static read-back of every row, count, negative scope, status, and completion marker; the Repository Owner must separately authorize any active-document contract append, external/global access, runtime/enforcement implementation, or command.
- **Status:** `complete` for Task 2.1 static inventory publication and read-back only; active contract coverage and runtime/enforcement status remain `not-observed`/`guidance-only`.

**Task 2.1 completion marker:** `[x] 2.1` — complete for the exact 51-row static inventory and read-back record only; no active document was modified and no runtime loading/enforcement is claimed.

  - [x] 2.2 Inventory all live guide Markdown paths and conditional projection surfaces

Read each of the 12 guide Markdown paths and each conditional HTML/CSS path listed above. Record headings, README links, chapter previous/next links, HTML navigation, projection filenames, CSS references, and static content differences. Filename similarity is not synchronization proof.

- **Evidence:** literal 12-path Markdown inventory plus conditional projection inventory.
- **Requirements:** 1.2, 1.5, 2.1–2.14, 20.1–20.8, 29.7, 31.1–31.3; Design §§4 and 7.

### Task 2.2 static guide/projection inventory record

**Task identity and publication boundary:** `oando-master / 2.2`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is a static guide-surface inventory and provenance-gap record. The current user request authorizes one write to the existing `./.kiro/specs/oando-master/tasks.md` artifact only. No guide Markdown, HTML, CSS, active Kiro document, Agent definition, hook, MCP/Power, settings, application/runtime, package, database, deployment, generated-output, test, command, generator, contract append, Exact-Line change, protected-path change, or other path is authorized.

**Inherited dependency and four-slot ownership:** `1.1 → 1.2 → 1.3 → 1.4 → 2.1 → 2.2` is satisfied by the inherited static records above. The four declared slots remain `S/M-01` Scout/Map, `P/R-01` Planner/Risk, `I/C-01` Implementer with the attached Coordinator/Serial Integration Owner designation, and `V/R-01` Verifier/Reporter. `S/M-01` owns read-only observation of every guide/projection path; `P/R-01` owns classification, navigation/projection comparison, provenance-gap, and coverage-gap decisions; `I/C-01` serially integrates this record in the sole authorized Tasks artifact; `V/R-01` performs static read-back. The `owner` values below identify the guide workstream/source owner and are not runtime write permissions.

**Static evidence basis:** the accessible guide workstream contains exactly 12 live Markdown surfaces (`README.md` plus chapters `01`–`11`), 12 named HTML projection files, and one named `guide.css` projection stylesheet. All 12 Markdown files, all 12 HTML files, and `guide.css` were read. Every HTML projection contains the same 12-item tab-navigation destination set, one page-specific `aria-current="page"`, a local breadcrumb except `index.html`, a sequential previous/next or return link, and a `guide.css` stylesheet reference. The Markdown files contain materially more routing, coverage, ownership, validation, and multi-agent prose than the HTML pages. These are static text/path observations only.

#### Literal 12-path Markdown inventory

1. **`./agents-work/oando-repository-guide/README.md`**
   - **Classification / owner / evidence state:** Human-authored guide start page; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
   - **Headings (literal, in file order):** `# Oando repository and Kiro guide`; `## Read by task`; `## Coverage rules`; `## First five facts to remember`; `## Start a task safely`; `## Important live-tree corrections`; `## Begin Here: describe the outcome, not the repository vocabulary`; `### Route Record`; `## Coverage-Audited Repository Domain Index`; `### D01 — Map repository authority`; `### D02 — Initialize, develop, and debug safely`; `### D03 — Trace auth, security, and secrets`; `### D04 — Classify environment state`; `### D05 — Locate and assess APIs`; `### D06 — Improve Site UI, SEO, accessibility, or performance`; `### D07 — Polish UI, icons, alignment, motion, or assets`; `### D08 — Work in Admin`; `### D09 — Assess CRM demo versus customer-query operations`; `### D10 — Trace catalog, configurator, quotes, or inventory`; `### D11 — Change Planner safely`; `### D12 — Change Studio safely`; `### D13 — Assess AI and retrieval`; `### D14 — Select database ownership and persistence mode`; `### D15 — Plan tests, fixtures, mocks, and validation`; `### D16 — Inspect scripts and command registry`; `### D17 — Map packages, dependencies, and workspace boundaries`; `### D18 — Maintain documentation and locked guidance`; `### D19 — Place results, generated documents, agent work, and blockers`; `### D20 — Route Kiro skills, Powers, MCP, and agents`; `### D21 — Plan operations, deployment, backups, and incidents`; `### D22 — Discover an unknown area safely`; `### Coverage Audit`; `### Surface Status and Coverage-Gap Admission`; `## Artifact placement and strict workspace boundaries`; `### Locked Path Gate`; `### Site Write Gate`; `## Plain-Language Response Contract`; `## Standing Multi-Agent Mode`; `## Task-classifier table`; `### Protected-root scope clarification`.
   - **README links (literal navigation links):** `[01 · Full repository map](markdown/01-repository-map.md)`; `[02 · Application architecture](markdown/02-application-architecture.md)`; `[03 · Product domains](markdown/03-product-domains.md)`; `[04 · Data, API, and persistence](markdown/04-data-api-persistence.md)`; `[05 · Tooling, CI, and tech docs](markdown/05-tooling-ci-tech-docs.md)`; `[06 · Operations and infrastructure](markdown/06-operations-infrastructure.md)`; `[07 · Docs, governance, and planning](markdown/07-docs-governance-planning.md)`; `[08 · Kiro workspace](markdown/08-kiro-workspace.md)`; `[09 · Local, generated, and environment areas](markdown/09-local-generated-environment.md)`; `[10 · Quality and validation](markdown/10-quality-validation.md)`; `[11 · Working with Kiro](markdown/11-working-with-kiro.md)`. The `This page` row is non-link text.
   - **Chapter previous/next links:** `not-applicable` for the README; it is the start-page root. The HTML counterpart is `html/index.html`.
   - **Matching projection filename:** `./agents-work/oando-repository-guide/html/index.html`.
   - **Static content difference:** Markdown is the expanded guide/router work surface: Begin Here flow, D01–D22 cards, Coverage Audit, gap template, artifact/Locked Path/Site Write boundaries, response contract, Standing Multi-Agent Mode, classifier, and protected-root clarification. `index.html` is a condensed overview with five facts, area cards, live-tree corrections, and a start-task prompt; it does not contain the Markdown card, contract, handoff, or provenance detail.
   - **Limitation:** The README sentence identifying an “HTML version” establishes a co-located naming statement only; it does not prove authoring direction or deterministic generation.

2. **`./agents-work/oando-repository-guide/markdown/01-repository-map.md`**
   - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
   - **Headings (literal):** `# 01 · Full repository map`; `## Product and source areas`; `## Delivery, governance, and coordination areas`; `## Output, local, and private areas`; `## Root control files`; `## Areas that are not live source`; `## Fast routing`; `## Evidence-first map and task routing`; `### D01 coverage-audited task card`; `### D22 unknown-area discovery card`; `### Locked and generated map boundaries`; `### Begin Here output for map work`.
   - **Chapter previous/next links (literal):** previous `[Start](../README.md)`; next `[Next: application architecture →](./02-application-architecture.md)`.
   - **README link:** `[01 · Full repository map](markdown/01-repository-map.md)`.
   - **Matching projection filename:** `./agents-work/oando-repository-guide/html/repository-map.html`.
   - **Static content difference:** Markdown has the detailed source/delivery/output/root tables, D01 and D22 cards, Locked Path and artifact boundaries, and response-contract rule. `repository-map.html` condenses the map into HTML tables/cards, adds “Detail” links, and omits the detailed cards, route contract, and locked/projection boundary prose.
   - **Limitation:** Similar `01`/`repository-map` names and paired navigation do not prove synchronization.

3. **`./agents-work/oando-repository-guide/markdown/02-application-architecture.md`**
   - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
   - **Headings (literal):** `# 02 · Application architecture`; `## Route and runtime layer`; `## Product implementation layers`; `## Platform and persistence layer`; `## UI, assets, language, and legacy paths`; `## Framework/config files`; `## How to trace any product change`; `## Coverage-audited routing for application changes`; `### D05 APIs card`; `### D06 Site UI card`; `### Forked application boundaries`; `### Site Write Gate`; `### Completion boundary`.
   - **Chapter previous/next links (literal):** previous `[← Full map](01-repository-map.md)`; next `[Next: product domains →](./03-product-domains.md)`.
   - **README link:** `[02 · Application architecture](markdown/02-application-architecture.md)`.
   - **Matching projection filename:** `./agents-work/oando-repository-guide/html/application-architecture.html`.
   - **Static content difference:** Markdown includes exact `site/` roots, route-to-feature-to-component-to-platform tracing, D05/D06 cards, fork isolation, Site Write Gate, and completion limits. `application-architecture.html` condenses these into five sections and a trace code line; it omits the coverage cards, fork/Gate prose, and explicit static-versus-rendered boundary.
   - **Limitation:** A matching chapter/projection filename is not source/projection proof.

4. **`./agents-work/oando-repository-guide/markdown/03-product-domains.md`**
   - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
   - **Headings (literal):** `# 03 · Product domains`; `## Marketing site`; `## Admin, CRM, and operations`; `## Floor Planner fork`; `## Furniture Studio fork`; `## Shared boundaries`; `## Styling and design system`; `## Catalog, assets, AI, and search`; `## Coverage-audited product task cards`; `### D07 — UI polish, icons, alignment, motion, and assets`; `### D08 — Admin`; `### D09 — CRM demo versus customer-query operations`; `### D10 — Catalog, configurator, quotes, and inventory`; `### D11 — Planner`; `### D12 — Studio`; `### D13 — AI and retrieval`; `## Visual Detail Checklist`; `## Surface Status rules`; `## Product-task response boundary`.
   - **Chapter previous/next links (literal):** previous `[← Application architecture](02-application-architecture.md)`; next `[Next: data, API, and persistence →](./04-data-api-persistence.md)`.
   - **README link:** `[03 · Product domains](markdown/03-product-domains.md)`.
   - **Matching projection filename:** `./agents-work/oando-repository-guide/html/product-domains.html`.
   - **Static content difference:** Markdown contains the full marketing/Admin/Planner/Studio descriptions, D07–D13 cards, Visual Detail Checklist, Surface Status and Coverage-Gap template, and response boundary. `product-domains.html` is a condensed ownership/fork/UI/support/safe-prompt page and omits the detailed cards, status schema, and evidence contract.
   - **Limitation:** Static difference is observed text only; it is not evidence that either side is stale or current.

5. **`./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`**
   - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
   - **Headings (literal):** `# 04 · Data, API, and persistence`; `## Two database ownership model`; `## Application API surface`; `## Persistence modes`; `## Security, auth, and environment`; `## i18n, SEO, and public contracts`; `## Safe migration request`; `## Coverage-audited data and API cards`; `### D03 — Auth, security, and secrets`; `### D05 — APIs and data boundaries`; `### D14 — Databases, RLS, grants, rollback, and mode-aware persistence`; `## Mode-aware persistence contract`; `## Database ownership and migration checklist`; `## Data/API response boundary`.
   - **Chapter previous/next links (literal):** previous `[← Product domains](03-product-domains.md)`; next `[Next: tooling, CI, and tech docs →](./05-tooling-ci-tech-docs.md)`.
   - **README link:** `[04 · Data, API, and persistence](markdown/04-data-api-persistence.md)`.
   - **Matching projection filename:** `./agents-work/oando-repository-guide/html/data-api-persistence.html`.
   - **Static content difference:** Markdown contains the full route-handler/API/security/persistence explanation, D03/D05/D14 cards, mode-aware contract, migration checklist, and response boundary. `data-api-persistence.html` condenses these into database/API/persistence/security cards and a migration prompt; it omits the detailed card/checklist/proof text.
   - **Limitation:** No static read establishes hosted persistence, applied migrations, or synchronization provenance.

6. **`./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`**
   - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
   - **Headings (literal):** `# 05 · Tooling, CI, and tech docs`; `## Tests`; `## Scripts and command control plane`; `## Cross-task configuration`; `## CI and automation`; `## Tech-docs generator`; `## Coverage-audited tooling cards`; `### D15 — Tests, fixtures, mocks, Vitest lanes, and Playwright`; `### D16 — Scripts and command registry`; `### D17 — Packages, dependencies, and workspace boundaries`; `## Command classification and validation boundary`; `## Workspace and generated-output boundary`; `## Tooling completion contract`.
   - **Chapter previous/next links (literal):** previous `[← Data, API, and persistence](04-data-api-persistence.md)`; next `[Next: operations and infrastructure →](./06-operations-infrastructure.md)`.
   - **README link:** `[05 · Tooling, CI, and tech docs](markdown/05-tooling-ci-tech-docs.md)`.
   - **Matching projection filename:** `./agents-work/oando-repository-guide/html/tooling-ci-tech-docs.html`.
   - **Static content difference:** Markdown includes the two-lane test distinction, script/config/CI tables, D15–D17 cards, four command classes, exact validation-record fields, output boundaries, and completion contract. `tooling-ci-tech-docs.html` condenses test/source, scripts/config, CI, and tech-docs sections and omits command classification and handoff/proof rules.
   - **Limitation:** The HTML `guide.css` link proves presentation dependency only, not generation or parity.

7. **`./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`**
   - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
   - **Headings (literal):** `# 06 · Operations and infrastructure`; `## Deployment surfaces`; `## Release order`; `## Root operational command families`; `## Backups, restore, and maintenance`; `## Safe requests`; `## D21 — Operations and infrastructure task card`; `## Failure Triage before any gate or policy proposal`; `## Protected operations contract`.
   - **Chapter previous/next links (literal):** previous `[← Tooling, CI, and tech docs](05-tooling-ci-tech-docs.md)`; next `[Next: docs, governance, and planning →](./07-docs-governance-planning.md)`.
   - **README link:** `[06 · Operations and infrastructure](markdown/06-operations-infrastructure.md)`.
   - **Matching projection filename:** `./agents-work/oando-repository-guide/html/operations-infrastructure.html`.
   - **Static content difference:** Markdown includes the D21 card, structured Failure Triage fields, protected-command rules, and blocker/owner boundaries. `operations-infrastructure.html` condenses infrastructure, release sequence, recovery, and safe prompts and omits the structured triage and contract sections.
   - **Limitation:** No deployment, backup, local-service, or external-system behavior is established by this read.

8. **`./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`**
   - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
   - **Headings (literal):** `# 07 · Docs, governance, and planning`; `## Authority order`; `## Documentation homes`; `## Planning and evidence`; `## Agent handbooks and scoped instructions`; `## Correct placement request`; `## D18 — Documentation, architecture, locked, and legacy guidance card`; `## D19 — Results, generated documents, agent work, and blockers card`; `## Locked Path Gate`; `## Artifact placement reference`; `## Guide projection and separate approval boundary`.
   - **Chapter previous/next links (literal):** previous `[← Operations and infrastructure](06-operations-infrastructure.md)`; next `[Next: Kiro workspace →](./08-kiro-workspace.md)`.
   - **README link:** `[07 · Docs, governance, and planning](markdown/07-docs-governance-planning.md)`.
   - **Matching projection filename:** `./agents-work/oando-repository-guide/html/docs-governance-planning.html`.
   - **Static content difference:** Markdown includes D18/D19 cards, Locked Path Gate, artifact-placement table, and explicit unresolved Markdown/HTML projection boundary. `docs-governance-planning.html` condenses authority, documentation homes, plan/evidence, handbooks, and one safe prompt; it omits the gate, artifact table, and provenance rule.
   - **Limitation:** The Markdown statement that HTML is not modified until provenance is evidenced is guidance, not observed generator evidence.

9. **`./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`**
   - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
   - **Headings (literal):** `# 08 · Kiro workspace`; `## Kiro areas`; `## Existing repository skills`; `## MCP and power decision`; `## Other Kiro-adjacent state`; `## D20 — Kiro, skills, Powers, MCP, and agents card`; `## Conditional repository skill routing`; `## Kiro Markdown inventory baseline`; `## Static versus runtime capability evidence`.
   - **Chapter previous/next links (literal):** previous `[← Docs, governance, and planning](07-docs-governance-planning.md)`; next `[Next: local/generated/environment →](./09-local-generated-environment.md)`.
   - **README link:** `[08 · Kiro workspace](markdown/08-kiro-workspace.md)`.
   - **Matching projection filename:** `./agents-work/oando-repository-guide/html/kiro-workspace.html`.
   - **Static content difference:** Markdown contains the D20 card, conditional routing table, 36/11/4 Kiro inventory, absent-AI/runtime distinction, and hook evidence limitation. `kiro-workspace.html` condenses workspace areas, grouped skills, least-powerful-extension guidance, and adjacent state; it omits the conditional routing/inventory/static-runtime sections.
   - **Limitation:** Static Kiro prose does not prove runtime skill selection, Power installation, MCP connection, or hook enforcement.

10. **`./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`**
    - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
    - **Headings (literal):** `# 09 · Local, generated, and environment areas`; `## Environment and secrets`; `## Generated/evidence output`; `## Local tool/editor/VCS state`; `## Legacy and absent areas`; `## Safe request`; `## Coverage-audited local and output cards`; `### D02 — Initialization, local development, and debugging`; `### D04 — Environment`; `### D19 — Results, generated documents, agent work, and blocker placement`; `## Exact output and workspace boundaries`; `## Private and generated-state rule`.
    - **Chapter previous/next links (literal):** previous `[← Kiro workspace](08-kiro-workspace.md)`; next `[Next: quality and validation →](./10-quality-validation.md)`.
    - **README link:** `[09 · Local, generated, and environment areas](markdown/09-local-generated-environment.md)`.
    - **Matching projection filename:** `./agents-work/oando-repository-guide/html/local-generated-environment.html`.
    - **Static content difference:** Markdown includes D02/D04/D19 cards, exact output/workspace boundaries, private/generated-state rule, and artifact placement details. `local-generated-environment.html` condenses environment, generated output, tool/editor/VCS state, legacy/absent paths, and one safe request; it omits the detailed cards and output-boundary rules.
    - **Limitation:** Local/private/generated labels are static classifications; they do not establish runtime state or regeneration success.

11. **`./agents-work/oando-repository-guide/markdown/10-quality-validation.md`**
    - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
    - **Headings (literal):** `# 10 · Quality and validation`; `## Match proof to the changed area`; `## Main validation sources`; `## Authorization rule`; `## Honest reporting`; `## Before a release`; `## D15 — Tests, fixtures, mocks, and validation card`; `## Four command classes`; `## Honest validation record`; `## D21 failure triage`; `## Validation response boundary`.
    - **Chapter previous/next links (literal):** previous `[← Local/generated/environment](09-local-generated-environment.md)`; next `[Next: working with Kiro →](./11-working-with-kiro.md)`.
    - **README link:** `[10 · Quality and validation](markdown/10-quality-validation.md)`.
    - **Matching projection filename:** `./agents-work/oando-repository-guide/html/quality-and-validation.html`.
    - **Static content difference:** Markdown includes command-class definitions, exact honest-validation fields, D15/D21 cards, unavailable `typecheck:scripts` note, and response boundary. `quality-and-validation.html` condenses proof matching, command-permission examples, evidence sources, and honest-report wording; it omits the structured command classes/record and failure-triage details.
    - **Limitation:** No command, gate, test, build, browser, or rendered result was run or observed.

12. **`./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`**
    - **Classification / owner / evidence state:** Human-authored numbered guide chapter; `Repository Owner / guide workstream`; `observed-present; read in full; current Markdown work surface`.
    - **Headings (literal):** `# 11 · Working with Kiro`; `## Select the session and control mode`; `## Supply precise context`; `## Prompt templates`; `### Small fix`; `### Cross-area feature`; `### Provider/external system task`; `## Skill routing`; `## When MCP is actually appropriate`; `## Begin Here and the mandatory response contract`; `## Agent Compliance Contract`; `## Four-role Standing Multi-Agent procedure`; `### Operating sequence`; `### Handoff Record`; `## Workflow mode selection`; `## Prompt Safety Preamble`; `## Complete Prompt Cookbook`; `### 1. Understand Repository`; `### 2. Find Where to Work`; `### 3. Small UI/Icon/Alignment Fix`; `### 4. Feature`; `### 5. Site UI`; `### 6. Planner`; `### 7. Studio`; `### 8. Admin`; `### 9. CRM/Unwired Assessment`; `### 10. Catalog/Configurator/Quotes/Inventory`; `### 11. Database`; `### 12. AI/Retrieval`; `### 13. Image/Animation/Assets`; `### 14. API/Security`; `### 15. Environment`; `### 16. Bug/Failing Test`; `### 17. Gate-Failure Triage`; `### 18. Refactor`; `### 19. Documentation`; `### 20. Package/Dependency`; `### 21. Deployment/Ops`; `### 22. Backup/Import/Export`; `### 23. Unknown Task`; `### 24. Finish Current Task`; `### 25. Emergency Prompt for an Overwhelmed Owner`; `## Six Standing Multi-Agent prompts outside the cookbook count`; `### Start Standing Multi-Agent Mode`; `### Launch Scout/Map and Planner/Risk`; `### Hand an approved scope to Implementer`; `### Launch Verifier/Reporter`; `### Resolve a multi-agent conflict`; `### Finish and close a multi-agent task`; `## Artifact and owner-control reminder`.
    - **Chapter previous/next links (literal):** previous `[← Quality and validation](10-quality-validation.md)`; return `[Return to start](../README.md)`; no `Next:` link because this is the terminal chapter.
    - **README link:** `[11 · Working with Kiro](markdown/11-working-with-kiro.md)`.
    - **Matching projection filename:** `./agents-work/oando-repository-guide/html/working-with-kiro.html`.
    - **Static content difference:** Markdown is substantially larger: it contains the mandatory response contract, Agent Compliance Contract, four-role procedure and handoff fields, workflow table, Prompt Safety Preamble, all 25 cookbook categories, six standing prompts, and artifact reminder. `working-with-kiro.html` condenses the page to session/mode, context, two safe prompts, skill/external-capability guidance, and terminal navigation; it omits the contract, agent procedure, cookbook, and artifact details.
    - **Limitation:** Static Markdown/HTML size/content divergence is recorded as a synchronization question only; it does not establish which surface is canonical or whether either surface is stale.

#### Conditional HTML projection inventory

**Shared HTML navigation literal observed in all 12 HTML files:** each has a `<nav class="tabs-wrap" aria-label="Guide sections">` with these exact label/filename pairs, in this order: `Start → index.html`; `Full map → repository-map.html`; `Application → application-architecture.html`; `Domains → product-domains.html`; `Data &amp; APIs → data-api-persistence.html`; `Tooling &amp; CI → tooling-ci-tech-docs.html`; `Operations → operations-infrastructure.html`; `Docs &amp; governance → docs-governance-planning.html`; `Kiro workspace → kiro-workspace.html`; `Local &amp; generated → local-generated-environment.html`; `Quality → quality-and-validation.html`; `Kiro workflow → working-with-kiro.html`. Each page marks only its own tab with `aria-current="page"`; no HTML page links to a Markdown chapter from the tab bar.

All 12 HTML pages contain `<link rel="stylesheet" href="guide.css">` in `<head>`. The exact page-specific projection inventory is:

1. **`./agents-work/oando-repository-guide/html/index.html`** — projection of `README.md`; `<title>Start · Oando repository guide</title>`; `<h1>Repository map and Kiro working guide</h1>`; active tab `Start`; no breadcrumb; `<h2>` values `What this guide covers`, `Navigate by area`, `Five facts that prevent mistakes`, `Live-tree corrections`, `Start a task`; `<h3>` values `Full repository map`, `Application architecture`, `Product domains`, `Data &amp; APIs`, `Tooling &amp; CI`, `Operations`, `Docs &amp; governance`, `Kiro workspace`, `Local &amp; generated`, `Quality`, `Kiro workflow`; bottom links `Start with the full map →` → `repository-map.html` and `Open Markdown index` → `../README.md`; static difference is the condensed overview recorded for Markdown item 1.
2. **`./agents-work/oando-repository-guide/html/repository-map.html`** — projection of `01-repository-map.md`; `<title>Full map · Oando repository guide</title>`; `<h1>Full repository map</h1>`; active tab `Full map`; breadcrumb `Start` → `index.html` / `Full repository map`; `<h2>` values `Product and source areas`, `Delivery, governance, and workspace areas`, `Generated, local, and private areas`, `Root control files`, `Live-tree corrections`; `<h3>` values `Build/package`, `Deploy/lint/ignore`, `Process/docs`, `Other workspace controls`; bottom links `← Start` → `index.html`, `Next: application →` → `application-architecture.html`; static difference is the condensed table/card presentation recorded for Markdown item 2.
3. **`./agents-work/oando-repository-guide/html/application-architecture.html`** — projection of `02-application-architecture.md`; `<title>Application architecture · Oando repository guide</title>`; `<h1>Application architecture</h1>`; active tab `Application`; breadcrumb `Start` → `index.html` / `Application`; `<h2>` values `Route and runtime layer`, `Product implementation layers`, `Platform, UI, and support layers`, `Configuration files`, `Trace a feature`; `<h3>` values `Next`, `CSS`, `Types`; bottom links `← Full map` → `repository-map.html`, `Next: domains →` → `product-domains.html`; static difference is the condensed route/layer/trace presentation recorded for Markdown item 3.
4. **`./agents-work/oando-repository-guide/html/product-domains.html`** — projection of `03-product-domains.md`; `<title>Product domains · Oando repository guide</title>`; `<h1>Product domains</h1>`; active tab `Domains`; breadcrumb `Start` → `index.html` / `Product domains`; `<h2>` values `Surface ownership`, `Planner and Studio fork boundary`, `UI and product support`, `Safe prompts`; `<h3>` values `Styling`, `Catalog/assets`, `AI/search`; bottom links `← Application` → `application-architecture.html`, `Next: data &amp; APIs →` → `data-api-persistence.html`; static difference is the condensed ownership/fork/support page recorded for Markdown item 4.
5. **`./agents-work/oando-repository-guide/html/data-api-persistence.html`** — projection of `04-data-api-persistence.md`; `<title>Data and APIs · Oando repository guide</title>`; `<h1>Data, APIs, and persistence</h1>`; active tab `Data &amp; APIs`; breadcrumb `Start` → `index.html` / `Data &amp; APIs`; `<h2>` values `Database ownership`, `API map`, `Persistence modes`, `Security, i18n, public contract`, `Safe migration prompt`; no `<h3>` headings; bottom links `← Domains` → `product-domains.html`, `Next: tooling &amp; CI →` → `tooling-ci-tech-docs.html`; static difference is the condensed data/API page recorded for Markdown item 5.
6. **`./agents-work/oando-repository-guide/html/tooling-ci-tech-docs.html`** — projection of `05-tooling-ci-tech-docs.md`; `<title>Tooling and CI · Oando repository guide</title>`; `<h1>Tooling, CI, and tech docs</h1>`; active tab `Tooling &amp; CI`; breadcrumb `Start` → `index.html` / `Tooling &amp; CI`; `<h2>` values `Test source`, `Scripts and configuration`, `CI and GitHub automation`, `Tech-docs generator`; `<h3>` values `Workflows`, `Scoped instructions`, `Dependencies`; bottom links `← Data &amp; APIs` → `data-api-persistence.html`, `Next: operations →` → `operations-infrastructure.html`; static difference is the condensed tooling page recorded for Markdown item 6.
7. **`./agents-work/oando-repository-guide/html/operations-infrastructure.html`** — projection of `06-operations-infrastructure.md`; `<title>Operations and infrastructure · Oando repository guide</title>`; `<h1>Operations and infrastructure</h1>`; active tab `Operations`; breadcrumb `Start` → `index.html` / `Operations`; `<h2>` values `Infrastructure layers`, `Release sequence`, `Backup, recovery, and maintenance`, `Safe prompts`; no `<h3>` headings; bottom links `← Tooling &amp; CI` → `tooling-ci-tech-docs.html`, `Next: docs &amp; governance →` → `docs-governance-planning.html`; static difference is the condensed operations page recorded for Markdown item 7.
8. **`./agents-work/oando-repository-guide/html/docs-governance-planning.html`** — projection of `07-docs-governance-planning.md`; `<title>Docs and governance · Oando repository guide</title>`; `<h1>Docs, governance, and planning</h1>`; active tab `Docs &amp; governance`; breadcrumb `Start` → `index.html` / `Docs &amp; governance`; `<h2>` values `Authority order`, `Documentation homes`, `Plans, evidence, and handbooks`, `Safe prompt`; `<h3>` values `<code>plans/</code>`, `<code>results/</code>`, `<code>Agents/</code>`, `<code>.github/instructions/</code>`; bottom links `← Operations` → `operations-infrastructure.html`, `Next: Kiro workspace →` → `kiro-workspace.html`; static difference is the condensed docs/governance page recorded for Markdown item 8.
9. **`./agents-work/oando-repository-guide/html/kiro-workspace.html`** — projection of `08-kiro-workspace.md`; `<title>Kiro workspace · Oando repository guide</title>`; `<h1>Kiro workspace</h1>`; active tab `Kiro workspace`; breadcrumb `Start` → `index.html` / `Kiro workspace`; `<h2>` values `Workspace areas`, `Repository skills`, `Choose the least powerful extension`, `Kiro-adjacent state`; `<h3>` values `Map and impact`, `Product constraints`, `Workflow`; bottom links `← Docs &amp; governance` → `docs-governance-planning.html`, `Next: local &amp; generated →` → `local-generated-environment.html`; static difference is the condensed Kiro page recorded for Markdown item 9.
10. **`./agents-work/oando-repository-guide/html/local-generated-environment.html`** — projection of `09-local-generated-environment.md`; `<title>Local and generated · Oando repository guide</title>`; `<h1>Local, generated, and environment areas</h1>`; active tab `Local &amp; generated`; breadcrumb `Start` → `index.html` / `Local &amp; generated`; `<h2>` values `Environment and secrets`, `Generated output and evidence`, `Tool/editor/VCS working state`, `Legacy/absent paths`; `<h3>` values `<code>node_modules/</code>`, `<code>.git/</code>`, `<code>.vscode/</code>`, `<code>ltm/</code>`, `<code>agent-reports/</code>`, `<code>agents-work/</code>`; bottom links `← Kiro workspace` → `kiro-workspace.html`, `Next: quality →` → `quality-and-validation.html`; static difference is the condensed local/generated page recorded for Markdown item 10.
11. **`./agents-work/oando-repository-guide/html/quality-and-validation.html`** — projection of `10-quality-validation.md`; `<title>Quality and validation · Oando repository guide</title>`; `<h1>Quality and validation</h1>`; active tab `Quality`; breadcrumb `Start` → `index.html` / `Quality`; `<h2>` values `Match proof to change`, `Command permission`, `Evidence sources`, `Honest report`; `<h3>` values `Testing handbook`, `<code>tests/</code>`, `<code>config/build/</code>`, `<code>config/quality/</code>`; bottom links `← Local &amp; generated` → `local-generated-environment.html`, `Next: Kiro workflow →` → `working-with-kiro.html`; static difference is the condensed validation page recorded for Markdown item 11.
12. **`./agents-work/oando-repository-guide/html/working-with-kiro.html`** — projection of `11-working-with-kiro.md`; `<title>Working with Kiro · Oando repository guide</title>`; `<h1>Working with Kiro</h1>`; active tab `Kiro workflow`; breadcrumb `Start` → `index.html` / `Kiro workflow`; `<h2>` values `Pick the session and mode`, `Attach context`, `Copy a safe prompt`, `Skills and external capability`; `<h3>` values `<code>#File</code>`, `<code>#Folder</code>`, `<code>#Problems</code>`, `<code>#Terminal</code>`, `<code>#Git Diff</code>`, `Attachments`; bottom links `← Quality` → `quality-and-validation.html`, `Return to start` → `index.html`; static difference is the substantially condensed workflow page recorded for Markdown item 12.

#### CSS projection surface

- **`./agents-work/oando-repository-guide/html/guide.css`** — the one named guide stylesheet; classification `human-authored static presentation`; owner `Repository Owner / guide workstream`; `observed-present; read in full`. It has no Markdown headings, no HTML navigation, no `@import`, and no embedded source/provenance metadata observed. It defines `:root` tokens (`--ink`, `--muted`, `--surface`, `--canvas`, `--border`, `--navy`, `--blue`, `--teal`, `--soft-blue`, `--soft-green`, `--soft-amber`, `--shadow`) and the selectors `*`, `html`, `body`, `a`, `a:hover`, `.shell`, `.site-header`, `.eyebrow`, `h1`, `.subtitle`, `.tabs-wrap`, `.tabs`, `.tabs a`, `.tabs a:hover`, `.tabs a[aria-current="page"]`, `main`, `h2`, `h3`, `p, li`, `.lead`, `.grid`, `.card`, `.card h3`, `.card p`, `.card-link`, `.card-link:hover`, `.callout`, `.callout.success`, `.callout.warn`, `.callout p:last-child`, `.table-wrap`, `table`, `th, td`, `th`, `tr:last-child td`, `code`, `pre`, `pre code`, `.path-tree`, `.path-tree code`, `.flow`, `.flow .node`, `.flow .arrow`, `.breadcrumb`, `.checklist`, `.checklist li`, `.next-links`, `.next-links a`, `footer`, plus `@media (max-width: 640px)` and `@media print`. The HTML navigation and content pages reference this stylesheet; no Markdown file references `guide.css` directly. Its static difference is presentation-only: it has no corresponding Markdown content and no observed owning generator.

#### Markdown/HTML relationship and provenance decision

- **Observed relationship:** co-located Markdown and HTML paths have semantically similar names, the Markdown README explicitly says the HTML version is under `html/`, all HTML pages share the same stylesheet and navigation, and chapter links form a sequential chain.
- **Not proved:** filename similarity, semantic similarity, shared navigation, stylesheet reuse, or content overlap does **not** prove that Markdown is the authoring source, HTML is the authoring source, or a deterministic Markdown-to-HTML transformation exists. No guide-specific generator declaration, source annotation, deterministic command, or provenance metadata was observed in the inspected guide Markdown/HTML/CSS paths.
- **Decision:** `provenance: unresolved / not-observed`; `Markdown work surface: observed human-authored`; `HTML/CSS projection status: conditional, observed-present but synchronization state unverified`. Leave every HTML/CSS file unchanged in this task. A future projection write requires task 2.4’s read-only provenance work and an owner-approved maintenance method; do not assume `pnpm run docs:sync` updates this guide.
- **Coverage-Gap Admission:** Named area `Markdown-to-HTML guide parity/provenance`; Status `present-but-unverified`; Evidence Sources Checked: all 12 Markdown paths, all 12 HTML paths, `guide.css`, the current task/design/requirements material; Evidence Limitation: static reads do not identify authoring direction, generator ownership, deterministic transformation, rendered parity, or current/stale status; Next Evidence Source: task 2.4’s authorized read-only inspection of repository scripts, references, and generator documentation; Owner Action: approve or reject a confirmed source/projection maintenance method before any HTML/CSS write; Scope Boundary: no guide HTML/CSS mutation, generator execution, package/script action, or runtime claim in task 2.2; Next Decision: keep HTML/CSS conditional and unresolved until provenance is evidenced.

#### Task 2.2 Route Record

- **Outcome:** Record a literal static inventory of all 12 live guide Markdown paths and all conditional HTML/CSS projection paths, including headings, README/chapter navigation, shared HTML navigation, projection filenames, CSS references, static content differences, ownership, and unresolved Markdown-to-HTML provenance without modifying any guide source.
- **Domain / Domain Index card:** `D18 — Documentation, architecture, locked, and legacy guidance`; this is documentation/provenance inventory, not product implementation. `D19` artifact-placement concerns are recorded in the task artifact fields; no result/report artifact is created.
- **Exact first evidence locations and reasons:** `./.kiro/specs/oando-master/requirements.md` for Requirements 1.2, 1.5, 2.1–2.14, 20.1–20.8, 29.7, and 31.1–31.3; `./.kiro/specs/oando-master/design.md` §§4, 4.1, and 7 for the guide/projection boundary and exact card/path baseline; `./.kiro/specs/oando-master/tasks.md` for the authorized target and inherited 2.1 record; `./.kiro/specs/oando-master/.config.kiro` for feature/fast-task identity; `./AGENTS.md`, `./Agents/01-standard.md`, and `./plans/README.md` for authority and write/validation boundaries; the 12 Markdown, 12 HTML, and CSS paths for live static evidence.
- **Candidate paths:** exactly the 12 Markdown and 13 conditional projection paths inventoried above; the only write target is `./.kiro/specs/oando-master/tasks.md`. No guide, HTML, CSS, protected, active Kiro, Agent, runtime, package, database, hook, MCP/Power, settings, generated, test, or command path is a write candidate.
- **Selected Package Skills and trigger evidence:** `oando-master` (mandatory first router and completion contract); `repo-map` (guide-workstream path orientation and exact-path discovery). Selection is guidance-only and does not activate runtime capabilities.
- **Rejected Package Skills and reasons:** `focss-css` (the CSS file is inventoried only; no styling/token/Tailwind edit is requested); `graph-impact` (no shared-code, dependency, blast-radius, or cycle analysis); `planner-studio` (no Planner/Studio product surface); `fork-boundaries` (no fork source or cross-import evaluation); `db-migrations` (no schema, SQL, RLS, grants, rollback, or database ownership work); `powers-skills-model` (the task inventories guide content, not Kiro capability packaging or MCP/Power configuration); `verify-and-gate` (the current user explicitly forbids tests, gates, builds, typechecks, scripts, package commands, browser/local-service commands, and all validation actions); `ai-retrieval` (no AI/retrieval implementation is being assessed and the optional skill is not selected).
- **Workflow Mode:** `Supervised` — shared documentation/projection terminology and unresolved provenance require serial owner checkpoints; only the Tasks artifact is owner-authorized for writing.
- **Operational-Risk Classification:** documentation/provenance, scope-control, protected-path, and evidence-honesty risk; no product, data, credential, infrastructure, deployment, runtime, or external-system mutation.
- **Command Classification:** static `read_file`, `list_directory`, and `grep_search` operations are `read-only inspection`; no shell command, test, gate, build, typecheck, script, package, browser/local-service, database, deployment, backup, Power activation, MCP connection, generator, or other validation command was proposed or run; any such action is `no-run pending authorization` and excluded by the current request.
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / .kiro/specs/oando-master / tasks.md`; exact authored target `./.kiro/specs/oando-master/tasks.md`; filename `tasks.md`; owning source/workflow `I/C-01` under this approved spec; authored, not generated. Rejected placements are all 12 Markdown source paths, all 12 HTML projection paths, `guide.css`, `./agents-work/` report roots, `./results/**`, `./generated-documents/`, `./site/`, root controls, protected paths, and substitute/mirror copies.
- **Locked Path Gate state:** `explicitly-owner-authorized` only for the exact existing `./.kiro/specs/oando-master/tasks.md` target; all guide Markdown/HTML/CSS, `./docs/**`, `./Agents/**`, root files, `./.kiro/agents/**`, and neighboring paths remain read-only evidence or excluded. No guide/projection/protected/source copy was changed.
- **Site Write Gate state:** `not-applicable`; no `./site/` target exists.
- **Validation State:** `not-run` for commands/tests/checks; static reads, listings, marker searches, and authorized Tasks-artifact read-back are the only applicable evidence. Runtime loading, automatic spawning, universal pre-action interception, fail-closed denial, rendered behavior, hosted persistence, connected MCP, installed Power state, external/global coverage, generator execution, and command success remain `not-observed`.
- **Unavoidable Owner Decisions:** none for this exact Tasks-artifact write. The future Markdown/HTML authoring direction, deterministic generator/maintenance method, and any HTML/CSS projection write remain separate owner decisions/Separate Approval Work.
- **Next action:** `V/R-01` performs static read-back of all 12 Markdown rows, all 12 HTML rows, `guide.css`, navigation/counts, differences, provenance gap, status records, and completion marker; do not start task 2.3 or any downstream guide/projection write until serial integration is accepted.

#### Task 2.2 Ownership Matrix and status evidence

| Objective or deliverable | Exclusive owner | Permission | Lifecycle status | Enforcement status | Evidence or limitation |
|---|---|---|---|---|---|
| Read-only observation of all 12 Markdown paths, all 12 HTML paths, and `guide.css` | `S/M-01` | Read-only | `complete` | `guidance-only` | All 25 named guide/projection paths were statically listed and read; runtime/rendered state is not observed. |
| Literal headings, README links, chapter previous/next links, HTML nav, projection filename mapping, CSS references, and content differences | `P/R-01` | Read-only classification/planning | `complete` | `guidance-only` | Exact static text/path record is integrated above; no parity or source-direction claim is made. |
| Markdown-to-HTML provenance and Coverage-Gap Admission | `P/R-01` serially integrated by `I/C-01` | Read-only evidence-gap classification | `pending-owner` | `guidance-only` | Co-location/name similarity is observed; authoring direction/generator relationship remains unresolved/not-observed. |
| `./.kiro/specs/oando-master/tasks.md` inventory write | `I/C-01` with Coordinator/Serial Integration Owner | Write only to this exact existing Tasks artifact | `complete` | `guidance-only` | This is the sole changed path; no guide Markdown/HTML/CSS or protected path changed. |
| Static read-back and completion proof | `V/R-01` serially integrated by `I/C-01` | Read-only | `complete` | `guidance-only` | Completion means literal static inventory publication/read-back only; no rendered/runtime proof. |
| Every other path, including guide source/projections, active Kiro documents, Agent definitions, hooks, MCP, settings, application, package, database, generated-output, tests, commands, and protected paths | `I/C-01` as serial rejection boundary | No write permission | `not-observed` | `not-observed` | Excluded by the current request; no alternate path, copy, inferred approval, or scope expansion is allowed. |

#### Task 2.2 Deliverable Register

| Named deliverable | Owner | Lifecycle status | Enforcement status | Evidence or limitation |
|---|---|---|---|---|
| Agent Roster | `I/C-01`, inherited four-slot declaration | `serial-integrated` | `guidance-only` | Exactly four declared slots remain static records; runtime creation/loading is `not-observed`. |
| Ownership Matrix | `I/C-01`, with `P/R-01` classification input | `complete` | `guidance-only` | All inventory objectives and exact paths have one static owner; this is not a runtime lock. |
| Route Record | `P/R-01`, serially integrated by `I/C-01` | `complete` | `guidance-only` | D18, selected/rejected skills, risk, command class, artifact, lock, and next action are recorded. |
| Pre-Action Gate Records | `P/R-01`, inherited from task 1.3 | `not-observed` | `guidance-only` | No executable or host-integrated gate was created or observed; no action is claimed controlled by this inventory. |
| Handoff Record Register | `I/C-01` | `complete` | `guidance-only` | The complete Task 2.2 handoff below contains every required field. |
| Conflict Stop Record, when a conflict occurs | `I/C-01` | `not-observed` | `not-observed` | No conflict occurred; the stop rule remains active and no provenance inference silently resolved a difference. |
| Coverage-Gap Admission for Markdown-to-HTML provenance | `P/R-01`, serially integrated by `I/C-01` | `pending-owner` | `guidance-only` | Static evidence is insufficient to select Markdown source, HTML source, or a deterministic generator. |
| Completion Record | `V/R-01`, serially integrated by `I/C-01` | `complete` for static publication/read-back only | `guidance-only` / `not-observed` | `[x] 2.2`, the 25-path inventory, differences, provenance gap, and read-back are completion evidence only. |

**Status boundary:** Task 2.2 is `complete` only for the static inventory record and read-back in this authorized Tasks artifact. It does not assert Markdown/HTML synchronization, authoring direction, generator existence, rendered parity, runtime loading, automatic spawning, universal enforcement, connected MCP, installed Power state, external/global inspection, command success, hosted persistence, or behavior outside the inspected paths. The provenance Coverage-Gap Admission remains `pending-owner`.

#### Task 2.2 Conflict Stop Rule

If any named Markdown, HTML, or CSS path is missing, duplicated, inaccessible, ambiguously mapped, or inconsistent with the exact 12-plus-13 baseline; if headings/navigation/projection filenames/CSS references contradict the static rows; if a Markdown/HTML difference is treated as proof of staleness or authoring direction; if provenance is inferred from filename similarity; if an owner/permission overlaps; or if a write is proposed outside the sole authorized Tasks artifact, stop the affected write and inventory closure before proceeding. Preserve the source and competing evidence, record the exact path/reason and next owner action, and route the conflict to `I/C-01` and the Repository Owner for serial review. Do not overwrite, choose an alternate path/tool/Agent/permission, invent a generator, modify HTML/CSS, infer approval, or promote `not-observed`/`pending-owner` to `verified`/`complete`. Current Conflict Stop state: `not-observed`; all 25 named guide/projection paths were observed-present and no ownership conflict or contradictory path mapping was observed in the static pass. Content differences are recorded as differences, not silently reconciled.

#### Task 2.2 Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Publish the exact 12-path Markdown and 13-path conditional HTML/CSS inventory with literal headings, README/chapter navigation, shared HTML navigation, projection filenames, CSS references, static content differences, ownership/status evidence, provenance Coverage-Gap Admission, conflict-stop handling, and honest static/runtime limitations while changing only `./.kiro/specs/oando-master/tasks.md`.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; next owner is `V/R-01` for read-only reconciliation, then the Repository Owner for any provenance decision, HTML/CSS maintenance method, projection write, generator/script action, or other excluded scope. No downstream shared-path write begins before serial integration.
- **Scope:** Static path existence, headings, Markdown links, chapter previous/next links, HTML titles/headings/breadcrumbs/navigation/current tabs/previous-next links, projection filename mapping, stylesheet references, content differences, provenance classification, statuses, gap, route, conflict rule, and handoff only. Excludes guide modification, HTML/CSS modification, generator execution, contract append, Exact-Line rollout, Agent-definition change, hook/MCP/Power/settings change, application/runtime, package, database, deployment, generated-output, test, and command actions.
- **Paths Read and Paths Changed:** Read current user request; `./AGENTS.md`; `./Agents/01-standard.md`; `./plans/README.md`; `./.kiro/specs/oando-master/.config.kiro`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; the pre-existing `./.kiro/specs/oando-master/tasks.md`; `./agents-work/oando-repository-guide/README.md`; all 11 `./agents-work/oando-repository-guide/markdown/*.md` paths; all 12 `./agents-work/oando-repository-guide/html/*.html` paths; and `./agents-work/oando-repository-guide/html/guide.css`. Changed exactly `./.kiro/specs/oando-master/tasks.md` to add this inventory, records, gap, and completion marker; no guide Markdown, HTML, CSS, active Kiro, protected, runtime, package, database, generated, test, or command path changed.
- **Route Record:** The Route Record above governs this handoff: D18; Local Evidence first; selected `oando-master` and `repo-map`; `Supervised`; no commands; authored Tasks artifact; exact current-target authorization; guide/projection paths read-only; Site Write Gate not applicable.
- **Evidence:** Requirements 1.2, 1.5, 2.1–2.14, 20.1–20.8, 29.7, and 31.1–31.3; Design §§4, 4.1, and 7; inherited Tasks 1.1–1.4 and 2.1; static listings; full reads of all 12 Markdown, all 12 HTML, and `guide.css`; exact heading/navigation/style-reference searches; and the provenance Coverage-Gap Admission above. This is static text/path evidence only.
- **Decisions:** Record exactly 12 Markdown plus 13 conditional projection paths; treat README/chapters as human-authored guide work surfaces; map semantically paired HTML filenames without calling them synchronized; record shared 12-tab navigation and per-page current tab/breadcrumb/prev-next links; record every HTML `guide.css` reference; preserve all observed Markdown/HTML content differences; set provenance to `unresolved / not-observed`; leave every guide Markdown/HTML/CSS source unchanged; keep future provenance/generator work in task 2.4 and owner-approved follow-up.
- **Coverage Gaps:** Markdown-to-HTML authoring direction and deterministic transformation; rendered parity; HTML/CSS freshness; generator ownership; runtime loading/enforcement; automatic spawning; universal pre-action interception; connected MCP; installed Power state; external/global Kiro coverage; command results; hosted persistence; and behavior beyond static reads are `not-observed`, `pending-owner`, or Separate Approval Work.
- **Validation Command:** `none` — the current request forbids commands, tests, gates, builds, typechecks, scripts, package commands, browser/local-service actions, database actions, deployment, backups, Power activation, MCP connection, generators, and other validation actions; only static reads and the authorized Tasks-artifact read-back are applicable.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for the exact existing `./.kiro/specs/oando-master/tasks.md` write. No guide Markdown, HTML, CSS, active Kiro, Agent definition, protected path, hook, MCP/Power, settings, application/runtime, package, database, deployment, generated-output, test, generator, or command action is authorized; no inferred approval or substitute-copy claim is used.
- **Hook Decision:** `not-observed` for universal pre-action enforcement; no command hook was invoked, and any command-specific hook coverage is not generalized to reads, writes, deletes, delegation, or handoffs.
- **Exit Status:** `not-observed` — no command or runtime action was executed.
- **Validation Limitation:** Static listings, full file reads, heading/link/navigation/style-reference extraction, path mappings, content-difference notes, ownership records, and Tasks read-back establish only this written inventory and its evidence scope. They cannot prove Markdown/HTML source direction, deterministic generation, parity, rendered behavior, runtime loading, automatic spawning, fail-closed denial, command success, connected MCP, installed Power, external/global coverage, hosted persistence, or behavior outside the inspected paths. Filename similarity is not synchronization proof.
- **Blockers:** None within the authorized static Task 2.2 scope. The unresolved Markdown-to-HTML provenance is a Coverage-Gap Admission and pending Owner Decision, not a current-scope blocker; future HTML/CSS maintenance, generator discovery/execution, or separate approval work remains outside this task.
- **Next Action:** `V/R-01` performs read-only static read-back of all 12 Markdown rows, all 12 HTML rows, `guide.css`, headings/links/navigation/counts, differences, provenance gap, status records, Conflict Stop rule, handoff fields, and completion marker; the Repository Owner must separately decide the future provenance/maintenance method before any projection write.
- **Status:** `complete` for Task 2.2 static inventory publication and read-back only; Markdown/HTML synchronization, runtime/enforcement, rendered parity, and provenance remain `not-observed`/`pending-owner`/`guidance-only`.

**Task 2.2 completion marker:** `[x] 2.2` — complete for the exact 12-path Markdown plus 13-path conditional HTML/CSS static inventory and read-back record only; no guide Markdown, HTML, CSS, active Kiro, protected, runtime, package, database, generated-output, test, or command path was modified or executed.

  - [x] 2.3 Reconcile current control states, physical definitions, optional branches, and command-hook limits

Inventory all five physical Agent definition files and distinguish them from the four Active Agent slots; preserve `./.kiro/agents/spec-task-runner2.md`. Record that `./.kiro/skills/ai-retrieval/SKILL.md` is absent unless selected later; absence is not an installed skill. Record current hook evidence only for its observed command-tool family. Record `.config.kiro` as unchanged and protected root/docs/Agents/`.kiro/agents` paths as read-only evidence.

- **Evidence:** static control-state inventory; no runtime roster, universal gate, Power, MCP connection, or external/global access claim.
- **Requirements:** 33.6–33.9, 34.8–34.10, 38.2–38.6; Design §§22–25 and 27–28.

### Task 2.3 controlled-state reconciliation record

**Task identity and publication boundary:** `oando-master / 2.3`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is a static control-state and scope record. The current user request explicitly authorizes one write to the existing `./.kiro/specs/oando-master/tasks.md` artifact only. No Agent definition, skill, hook, settings, MCP, Power, `.config.kiro`, root, `./docs/`, `./Agents/`, application/runtime, package, database, deployment, generated-output, test, command, contract-append, Exact-Line, or protected-path change is authorized.

#### Physical Agent definitions versus the four Active Agent slots

The live `.kiro/agents/` directory contains exactly five physical definition files. These are static definition documents, not proof of active runtime Agents and not additional roster slots. All five remain preserved and read-only; in particular, `./.kiro/agents/spec-task-runner2.md` is retained unchanged.

| Physical definition path | Static definition role/scope observed | Relationship to the four Active Agent slots | State and limitation |
|---|---|---|---|
| `./.kiro/agents/capability-powers-author.md` | Specialized Task 6 worker for authoring workspace MCP settings and observability, analytics, and security Powers under `.kiro`; declares read/write/shell tools and narrow Kiro configuration ownership. | Not an Active Agent slot and not counted as Scout/Map, Planner/Risk, Implementer, or Verifier/Reporter. | `observed-present`; definition text is static evidence only. No runtime loading or assignment observed. |
| `./.kiro/agents/containment-reconciler.md` | Specialized Task 4 worker for canonical Kiro governance/MCP schema reconciliation and parity-proven obsolete-copy deletion. | Not an Active Agent slot and not a fifth role. | `observed-present`; protected read-only evidence. No reconciliation, deletion, runtime loading, or assignment performed. |
| `./.kiro/agents/hook-localizer.md` | Specialized Task 5 worker for `.kiro/hooks` localization and behavior-parity review of the obsolete helper. | Not an Active Agent slot and not a fifth role. | `observed-present`; protected read-only evidence. No hook mutation, deletion, runtime loading, or assignment performed. |
| `./.kiro/agents/spec-task-runner.md` | General coordinator/execution definition for approved Kiro spec tasks, with the definition text assigning coordinator/integration Tasks 7–10 and path-owned execution. | Not an Active Agent slot; a physical definition name is not a roster identity. | `observed-present`; protected read-only evidence. No runtime activation or assignment observed. |
| `./.kiro/agents/spec-task-runner2.md` | Second coordinator/general execution definition for approved Kiro spec tasks, sharing Tasks 7–10 with `spec-task-runner` and forbidding concurrent writes to the same path. | Not an Active Agent slot; it is explicitly preserved and is not used to make the counts equal. | `observed-present and preserved`; no rename, delete, disable, modification, runtime activation, or assignment observed. |

The controlled task still declares exactly four Active Agent entries, independent of the five physical definitions:

| Active slot | Role | Coordinator designation | Permission and owned scope for Task 2.3 | Lifecycle status | Next owner |
|---|---|---|---|---|---|
| `S/M-01` | **Scout/Map** | `coordinator: false` | Read-only evidence discovery for the spec, five definitions, skill absence, hook scope, MCP/config state, and protected-path boundary; no write or command permission. | `complete` | `P/R-01` |
| `P/R-01` | **Planner/Risk** | `coordinator: false` | Read-only Route Record, risk, command classification, status, ownership, optional-branch, conflict, and Owner Decision planning; no write or command permission. | `complete` | `I/C-01` |
| `I/C-01` | **Implementer** | `coordinator: true`; **Coordinator/Serial Integration Owner** is attached to this slot, not a fifth role. | Read/write only for the exact authorized `./.kiro/specs/oando-master/tasks.md` record; serially integrates evidence and handoff; no delete permission and no control-file write. | `serial-integrated` | `V/R-01` |
| `V/R-01` | **Verifier/Reporter** | `coordinator: false` | Read-only static read-back of this task record, counts, exact paths, statuses, handoff fields, conflict handling, and limitations; no implementation edit or command permission. | `complete` | `Repository Owner` |

Exactly four plan-declared Active Agent slots are recorded above. Runtime creation, loading, automatic assignment, and a real four-entry runtime roster are `not-observed`; there is no silent one-Agent fallback. The physical five-file inventory is preserved as a separate protected evidence set and is not reconciled by deleting, renaming, disabling, or modifying any definition.

#### Control-state and optional-branch inventory

| Control or branch | Static state observed | Decision and limitation |
|---|---|---|
| `./.kiro/skills/ai-retrieval/SKILL.md` | Absent from the current `./.kiro/skills/` directory inventory; the optional branch is unselected in this task. | Record as `absent / not-selected`, not as an installed skill. Do not create or activate it. If a future owner selects the branch, its exact file requires a separate Route Record and authorization; until then, AI/retrieval work falls back to Local Evidence, `repo-map`, and every other matching existing skill. |
| Existing skill inventory | The current skill directories observed are `db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `oando-master`, `planner-studio`, `powers-skills-model`, `repo-map`, and `verify-and-gate`. | Directory presence is static path evidence only and does not prove runtime loading or installation. The optional `ai-retrieval` path is not included in this list. |
| `./.kiro/settings/mcp.json` | Read as `{"mcpServers": {}}`. | Workspace MCP configuration is empty in the observed file. No MCP server is configured, connected, authenticated, or runtime-available on this evidence. |
| `./.kiro/mcp/` | Schema directories `chrome-devtools`, `cloudflare-docs`, `github`, and `tasks` are present. | Schema presence is not proof of workspace configuration, connection, authentication, Power installation, or runtime availability. No Power activation or MCP connection was performed. |
| `./.kiro/specs/oando-master/.config.kiro` | Read as `{"specId": "f7b2963e-7b07-471f-a627-aa1c3119a150", "workflowType": "fast-task", "specType": "feature"}` and not targeted by the authorized write. | Unchanged and protected read-only evidence for this task. No configuration migration or spec-identity change is claimed. |

#### Current command-hook evidence and limit

Only the observed command-tool family is recorded as hook evidence. `./.kiro/hooks/block-agent-tests.json` is enabled and declares `PreToolUse` with matcher `execute_pwsh|control_pwsh_process`, invoking `node .kiro/hooks/block-agent-tests.mjs`. The source file statically contains command extraction for `command`, `shellCommand`, `cmd`, and string `args`, and blocker patterns for the observed package/test/gate/coverage/build/typecheck/browser/e2e/dev/start/serve/preview, direct test-runner/Next commands, and Docker start/run/restart/build families. The source also contains an inline `KIRO_OWNER_AUTHORIZED=1` override pattern; that text is not current-session Explicit User Authorization evidence.

This record does **not** generalize the hook beyond the exact observed `PreToolUse` matcher and its command payload family. No hook decision was invoked or observed in this task, and there is no evidence here that the hook intercepts reads, writes, deletes, delegation, handoffs, other tools, or all Agent actions. The other hook definitions were not promoted into command-tool enforcement evidence because their triggers differ; their presence does not expand the observed family. Universal Pre-Action Enforcement remains `not-observed` / `guidance-only` and is Separate Approval Work.

#### Protected-path and write-boundary record

| Path class | Gate state for Task 2.3 | Allowed action in this task |
|---|---|---|
| Every direct root file under `./` (including `./AGENTS.md`) | `Locked` / read-only evidence | Static read only; no write, delete, Exact-Line insertion, or substitute-copy claim. |
| Every path under `./docs/` | `Locked` / read-only evidence | Static read only; no write or delete. |
| Every path under `./Agents/` | `Locked` / read-only evidence | Static read only; no write, delete, or Exact-Line rollout. |
| Every path under `./.kiro/agents/` | `Locked` / read-only evidence | Static inventory/read only; preserve all five definitions, including `spec-task-runner2.md`; no write, delete, rename, or disable. |
| `./.kiro/specs/oando-master/.config.kiro` | `Locked` / read-only spec configuration | Read only; unchanged. |
| `./.kiro/specs/oando-master/requirements.md` and `design.md` | Read-only spec evidence | Read only; no requirements/design mutation. |
| `./.kiro/specs/oando-master/tasks.md` | `explicitly-owner-authorized` for this phase only | The sole permitted write: this task 2.3 record and its completion marker. |
| All other `.kiro`, application, package, database, deployment, generated-output, test, and runtime paths | Excluded / no write permission | Read only only when needed for this record; no mutation or execution. |

A read grant for a protected path does not become write or delete permission. No copy, mirror, generated substitute, or report elsewhere is treated as changing a protected source.

#### Task 2.3 Route Record

- **Outcome:** Reconcile the static current control states for the five physical Agent definitions, four Active Agent slots, optional AI branch, observed command-hook family, MCP/config distinction, and protected boundaries, while changing only the authorized Tasks artifact and preserving every excluded control.
- **Domain / Domain Index card:** `D20 — MCP, skills, Powers, and Agents`; this is a repository-local Kiro governance/spec record, not product implementation.
- **Exact first evidence locations and reasons:** `./.kiro/specs/oando-master/requirements.md` for Requirements 33.6–33.9, 34.8–34.10, and 38.2–38.6; `./.kiro/specs/oando-master/design.md` for conditional skill routing, four-role standing mode, handoff fields, Protected Command policy, and Separate Approval Work; the existing `./.kiro/specs/oando-master/tasks.md` for the sole writable boundary and preceding inventory records; `./.kiro/specs/oando-master/.config.kiro` for spec identity/workflow; `./.kiro/agents/` for the five physical definitions; `./.kiro/skills/` for the optional branch and existing-skill baseline; `./.kiro/hooks/block-agent-tests.json` and `./.kiro/hooks/block-agent-tests.mjs` for the exact observed command-tool hook family; `./.kiro/settings/mcp.json` and `./.kiro/mcp/` for configuration/schema distinction; `./AGENTS.md`, `./Agents/01-standard.md`, and `./plans/README.md` for authority and coordination boundaries.
- **Candidate paths:** write only `./.kiro/specs/oando-master/tasks.md`; read the listed spec/control/authority paths as evidence; reject every other path for mutation, deletion, activation, command execution, or substitute-copy use.
- **Selected Package Skills and trigger evidence:** `oando-master` (mandatory first router and completion contract); `repo-map` (repository/spec/control-path orientation); `powers-skills-model` (Kiro Agents, skills, hooks, MCP schemas/configuration, and capability-packaging distinctions). These are guidance routes only; no runtime capability is activated.
- **Rejected Package Skills and reasons:** `db-migrations` (no SQL, schema, RLS, grants, rollback, or database ownership work); `focss-css` (no styling, tokens, Tailwind, icons, or FOCSS work); `fork-boundaries` (no Planner/Studio Fork Tree change or cross-import evaluation); `graph-impact` (no shared-code, dependency, blast-radius, or cycle analysis); `planner-studio` (no Planner/Studio route, canvas, persistence, or handoff behavior); `verify-and-gate` (no validation command is authorized or proposed); `ai-retrieval` (the optional `./.kiro/skills/ai-retrieval/SKILL.md` file is absent and unselected, and no AI/retrieval implementation is in scope).
- **Workflow Mode:** `Supervised` — this is an exact-scope owner-authorized governance/spec artifact update with serial record integration, no automatic execution, and explicit protected-path limits.
- **Operational-Risk Classification:** repository-governance, protected-path, authorization, and capability-state risk; no product, data, credential, infrastructure, deployment, external-system, or runtime implementation change is in scope.
- **Command Classification:** static file/path reads and the authorized Tasks-artifact read-back are `read-only inspection`; no shell command, test, gate, build, typecheck, script, package, browser, local-service, database, deployment, backup, Power, MCP, or generator action is proposed or run. Any such action remains `no-run pending authorization` (and Protected Command where applicable).
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / Downstream Tasks Artifact / not applicable`; exact authored target `./.kiro/specs/oando-master/tasks.md`; filename `tasks.md`; owning source is the approved oando-master fast-task workflow and `I/C-01`; state `authored`, not generated. Rejected placements are `./results/**`, `./agents-work/**`, `./generated-documents/`, `./plans/**`, `./site/`, root controls, all protected paths, and all Kiro control files other than the exact authorized Tasks artifact.
- **Locked Path Gate:** `Locked` for direct root files, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, `.config.kiro`, requirements, design, and every other non-target path; only the exact existing Tasks artifact is `explicitly-owner-authorized` for this task. No Site Write Gate is applicable because no `./site/` path is targeted.
- **Validation State:** `not-run` for commands and tests; static reads, directory listings, and authorized Tasks-artifact read-back are the only applicable evidence. Runtime roster creation/loading, automatic spawning, universal pre-action interception, fail-closed denial, command success, connected MCP, installed/activated Power state, external/global Kiro access, and behavior beyond inspected static paths remain `not-observed`.
- **Unavoidable Owner Decisions:** whether to select and authorize the optional `ai-retrieval` file; whether to authorize any future runtime four-entry roster/checker or universal Pre-Action Enforcement; whether to activate/connect any Power or MCP server; and any future protected-path/control-file write. None is needed for this exact Tasks-artifact update.

#### Task 2.3 Ownership Matrix and status evidence

| Objective, evidence item, artifact, or exact path | Exclusive owner | Permission | Lifecycle status | Enforcement status | Evidence or limitation |
|---|---|---|---|---|---|
| Five physical definitions under `./.kiro/agents/**` and their distinction from the four roster slots | `S/M-01` for evidence; `I/C-01` for serial integration | Read-only | `complete` | `not-observed` | All five paths were observed-present and preserved; physical definitions are not runtime slots. |
| Four Active Agent slot declaration and one attached coordinator designation | `P/R-01` for planning; `I/C-01` for serial integration | Read-only planning; write only in `tasks.md` | `complete` | `guidance-only` | Four plan-declared slots are recorded; runtime creation/loading is not observed and no fifth role is added. |
| Optional `./.kiro/skills/ai-retrieval/SKILL.md` branch | `P/R-01` | Read-only decision record; no creation permission | `pending-owner` | `not-observed` | Path is absent/unselected; absence is not installation evidence. Future selection requires a new Route Record and exact authorization. |
| Observed `block-agent-tests` command-tool family | `S/M-01` for static source evidence; `P/R-01` for limitation | Read-only | `complete` | `not-observed` | Static hook config/source evidence covers only enabled `PreToolUse` matcher `execute_pwsh|control_pwsh_process`; no runtime decision was observed and scope is not generalized. |
| MCP schema/config distinction | `S/M-01` | Read-only | `complete` | `not-observed` | `.kiro/mcp/` schemas are present and `settings/mcp.json` has an empty server map; no connection/auth/runtime evidence. |
| `.kiro/specs/oando-master/.config.kiro` | `S/M-01` | Read-only | `complete` | `not-observed` | Exact JSON was read and remains unchanged/protected; no configuration write was attempted. |
| Protected root, `./docs/**`, `./Agents/**`, and `./.kiro/agents/**` paths | `I/C-01` as serial rejection boundary; `S/M-01` reads only | Read-only evidence | `complete` | `guidance-only` | No protected write/delete/rename/disable occurred; exact Tasks authorization does not unlock neighbors. |
| `./.kiro/specs/oando-master/tasks.md` task record | `I/C-01` as exclusive Implementer and Serial Integration Owner | Read/write for this exact file only | `serial-integrated` | `guidance-only` | Sole authorized mutation; unrelated task content preserved. |
| Static read-back, Completion Record, and handoff | `V/R-01` for read-only review; `I/C-01` for serial publication | Read-only review; serial write only in `tasks.md` | `complete` | `guidance-only` | Read-back is document evidence only and cannot promote runtime or command state. |
| All other control, application, package, database, deployment, generated-output, test, and runtime paths | `I/C-01` as serial rejection boundary | No write permission | `not-observed` | `not-observed` | Excluded by the current request; no alternate path, tool, Agent, permission, or inferred approval is used. |

#### Deliverable Register

| Named deliverable | Owner | Lifecycle status | Enforcement status | Evidence or limitation |
|---|---|---|---|---|
| Agent Roster | `I/C-01`, verified by `V/R-01` | `complete` | `guidance-only` | Exactly four static Active Agent entries and one attached coordinator designation; runtime roster not observed. |
| Ownership Matrix | `P/R-01`, serially integrated by `I/C-01` | `complete` | `guidance-only` | Exact evidence, artifact, and path ownership is recorded; shared/serial tasks remain serial. |
| Route Record | `P/R-01`, serially integrated by `I/C-01` | `complete` | `guidance-only` | Selected/rejected skills, risk, commands, artifact, lock, and next actions are recorded. |
| Pre-Action Gate Records | `P/R-01`, serially integrated by `I/C-01` | `complete` for static action classification | `not-observed` | Proposed read/write/handoff actions are classified below; no executable or host-integrated gate decision was observed. |
| Handoff Record Register | `I/C-01`, verified by `V/R-01` | `complete` | `guidance-only` | The complete Task 2.3 handoff with every required field is recorded below. |
| Conflict Stop Record, when a conflict occurs | `I/C-01` | `not-observed` | `not-observed` | No ownership overlap, edit conflict, or contradictory evidence occurred; the physical-five versus active-four distinction is an explicit reconciliation, not a conflict. |
| Completion Record | `V/R-01`, serially integrated by `I/C-01` | `complete` for static publication/read-back only | `guidance-only` / `not-observed` | The changed-scope record, limitations, status, handoff, and `[x] 2.3` marker are document evidence only. |

#### Pre-Action Gate Records and Conflict Stop handling

No executable or host-integrated Pre-Action Enforcement Layer was invoked or observed. The following are static task records, not runtime allow/deny decisions:

| Action kind | Proposed in Task 2.3 | Static scope record | Runtime gate evidence |
|---|---|---|---|
| `read` | Yes — specification, authority, control, and definition evidence | Allowed as read-only inspection under the task scope; protected paths remain read-only. | `not-observed`; the command-tool hook is not generalized to reads. |
| `write` | Yes — exact existing `./.kiro/specs/oando-master/tasks.md` only | Allowed by explicit current-user authorization for this exact file; no neighboring path is unlocked. | `not-observed`; no universal write gate was invoked. |
| `delete` | No | No delete scope or permission exists. | `not-observed`; no delete was proposed or run. |
| `command` | No — user explicitly forbids shell commands and validation | `no-run pending authorization`; no command is substituted or broadened. | `not-observed`; the observed hook family was not invoked. |
| `delegation` | No new delegation | No fifth Agent or alternate receiver may be inferred; the four static slots remain the only roster. | `not-observed`; no delegation gate was invoked. |
| `handoff` | Yes — this static record to `V/R-01` and the Repository Owner | Required fields are present below; serial integration remains with `I/C-01`. | `not-observed`; no runtime handoff gate was observed. |

**Conflict Stop Rule:** If ownership overlaps, an edit conflicts, evidence contradicts, a protected target is ambiguous, or an authorization/permission is missing, affected writes stop before any further action. `I/C-01` preserves the competing evidence, records the exact paths/action and current state, routes the decision to the Repository Owner, updates ownership and route records serially only after owner review, and does not choose an alternate path, tool, Agent, permission, or inferred approval. Current Conflict Stop state is `not-observed`: no conflict occurred, and the five-definition/four-slot count difference was resolved by the explicit distinction required by the spec rather than by mutation.

#### Task 2.3 Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Reconcile the current static Agent, skill, hook, MCP/configuration, protected-path, and authorization states for task 2.3 while modifying only `./.kiro/specs/oando-master/tasks.md`, preserving all five physical definitions and the four plan-declared Active Agent slots without claiming runtime enforcement.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; next owner is `V/R-01` for read-only static read-back, then the `Repository Owner` for the optional AI branch, any runtime roster/enforcement decision, any Power/MCP activation, or any protected-control write. No downstream shared-path write begins before this handoff is reconciled.
- **Scope:** Static inventory and classification of the five physical definitions; distinction from the four Active Agent slots; optional `ai-retrieval` absence/unselected state; exact observed command-hook family; MCP schema/config distinction; `.config.kiro` unchanged state; protected root/`./docs/`/`./Agents/`/`./.kiro/agents/` boundary; Route Record; Ownership Matrix; Deliverable Register; Pre-Action Gate Records; Conflict Stop Rule; Completion Record; and this handoff. Excludes every control mutation, runtime implementation, command, validation, contract append, Exact-Line rollout, application/runtime, package, database, deployment, generated-output, test, Power, MCP connection, and external/global access action.
- **Paths Read and Paths Changed:** Read current user request; `./AGENTS.md`; `./Agents/01-standard.md`; `./plans/README.md`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; the pre-existing `./.kiro/specs/oando-master/tasks.md`; `./.kiro/specs/oando-master/.config.kiro`; all five `./.kiro/agents/*.md` definitions; the `./.kiro/skills/` directory inventory; `./.kiro/hooks/block-agent-tests.json`; `./.kiro/hooks/block-agent-tests.mjs`; `./.kiro/settings/mcp.json`; the `./.kiro/mcp/` directory inventory; and the current hook inventory. Changed exactly `./.kiro/specs/oando-master/tasks.md` to add this task 2.3 record and completion marker. No other file was changed.
- **Route Record:** The Route Record above governs this handoff: D20; Local Evidence first; selected `oando-master`, `repo-map`, and `powers-skills-model`; rejected non-matching/unavailable skills with reasons; `Supervised`; no commands; authored Downstream Tasks Artifact; exact current-target authorization; protected-path Lock; Site Write Gate not applicable; validation `not-run`.
- **Evidence:** Task 2.3 static requirements and design references; complete requirements addendum criteria 33.6–33.9, 34.8–34.10, and 38.2–38.6; design guidance for conditional skills, four-role standing mode, Handoff Records, Protected Commands, and Separate Approval Work; static directory listings; full reads of all five physical Agent definitions; exact `block-agent-tests` JSON/source reads; MCP settings/schema listings; `.config.kiro` read; and authorized Tasks-artifact read-back. This is static path/text evidence only.
- **Decisions:** Keep the five physical definitions separate from exactly four plan-declared Active Agent slots; preserve `spec-task-runner2.md`; leave `ai-retrieval` absent and unselected without treating absence as installation; record only the enabled `PreToolUse` command-tool family `execute_pwsh|control_pwsh_process`; keep MCP schemas distinct from empty workspace configuration and runtime connection; keep `.config.kiro` unchanged; keep root, `./docs/`, `./Agents/`, and `./.kiro/agents/` read-only; and limit the sole write to this Tasks artifact.
- **Coverage Gaps:** Runtime roster creation/loading, automatic assignment/spawning, universal fail-closed Pre-Action Enforcement, hook decisions during an action, hook coverage outside the observed command-tool family, connected/authenticated MCP, installed/activated Power state, external/global Kiro access, optional AI branch selection, command/test/gate/build/typecheck results, and behavior beyond static reads are `not-observed`, `pending-owner`, or Separate Approval Work.
- **Validation Command:** `none` — the current request forbids shell commands, tests, gates, builds, typechecks, scripts, package commands, browser/local-service actions, database actions, deployment, backups, Power activation, MCP connection, generators, and other validation actions; static reads, directory listings, and the authorized Tasks-artifact read-back are the only applicable evidence.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for the exact existing `./.kiro/specs/oando-master/tasks.md` write. No Agent definition, skill, hook, settings, MCP/Power, `.config.kiro`, root, `./docs/`, `./Agents/`, application/runtime, package, database, deployment, generated-output, test, generator, or command action is authorized; no inferred permission or substitute-copy claim is used.
- **Hook Decision:** `not-observed` for this task. Static source evidence shows an enabled `PreToolUse` matcher only for `execute_pwsh|control_pwsh_process`; no hook was invoked, and that observed command-tool scope is not generalized to other actions or tools.
- **Exit Status:** `not-observed` — no command or runtime action was executed.
- **Validation Limitation:** Static listings, full reads, exact path/role counts, hook-source inspection, MCP/config distinction, protected-boundary classification, task-record read-back, and handoff text establish only this document record. They cannot prove runtime Agent creation/loading, automatic spawning, universal interception, fail-closed denial, command success, installed/activated Powers, connected MCP, external/global coverage, rendered behavior, hosted persistence, or behavior outside the inspected static paths.
- **Blockers:** None within the authorized static task scope. The absent/unselected AI branch and unobserved runtime/enforcement states are pending Owner Decisions or Separate Approval Work, not blockers to this Tasks-artifact record. If a future conflict or missing authorization occurs, the Conflict Stop Rule above applies.
- **Next Action:** `V/R-01` performs read-only static read-back of the five physical definitions, four Active Agent slots, optional branch state, exact hook matcher/scope, MCP/config state, `.config.kiro` unchanged state, protected-path boundaries, ownership/status records, Conflict Stop handling, all handoff fields, and the completion marker. After serial integration, the Repository Owner decides any optional AI/runtime/control work before downstream task 2.4 or any excluded write.
- **Status:** `complete` for Task 2.3 static reconciliation/publication and read-back only; runtime roster/enforcement, optional AI selection, Power/MCP connection, command results, and all excluded changes remain `not-observed`/`pending-owner`/`guidance-only`.

#### Task 2.3 Completion Record

- **Changed files:** exactly `./.kiro/specs/oando-master/tasks.md`, because the current request authorizes only this existing Tasks artifact and requires task 2.3's reconciliation record and completion marker. No other file was changed.
- **Validation actually run:** no commands, tests, gates, builds, typechecks, scripts, package commands, browser/local services, database actions, deployment, backups, Power activation, MCP connection, or generator actions. Static reads/listings and the authorized Tasks-artifact read-back are the only completion evidence.
- **Validation not run:** every shell/validation/runtime action listed above remains not run because the current user explicitly forbids it; no command result or runtime Hook Decision is claimed.
- **Remaining issues and next owner:** `V/R-01` owns static reconciliation/read-back; the Repository Owner owns any decision to select `ai-retrieval`, establish a runtime four-entry roster or universal gate, activate/connect a Power or MCP server, or authorize any protected/control-file change. Markdown, application, package, database, deployment, generated-output, test, and other downstream work remains separately scoped.
- **Scope confirmation:** only the task 2.3 record in `tasks.md` changed. The five physical Agent definitions, `spec-task-runner2.md`, optional AI path, hooks/settings/MCP, `.config.kiro`, root files, `./docs/`, `./Agents/`, `./.kiro/agents/`, application/runtime, packages, databases, generated output, and tests were preserved and not modified or executed.
- **Multi-Agent Evidence:** the static four-entry Agent Roster, Ownership Matrix, Route Record, Deliverable Register, Pre-Action Gate Records, Conflict Stop Rule, Handoff Record Register, and this Completion Record are present. The four-slot roster is plan evidence; runtime Agent creation/loading and universal enforcement remain `not-observed`.
- **Final lifecycle status:** `complete` for the exact static task record only; enforcement status is `guidance-only`/`not-observed` for unobserved runtime controls.

**Task 2.3 completion marker:** `[x] 2.3` — complete for the exact static reconciliation of five physical Agent definitions versus four Active Agent slots, optional AI-branch absence/unselected state, observed command-tool hook limits, MCP/config distinction, unchanged `.config.kiro`, protected read-only boundaries, ownership/status records, Conflict Stop handling, complete handoff fields, and explicit static/runtime limitations. No control file, Agent definition, hook/settings/MCP, protected path, application/runtime, package, database, generated-output, test, command, or validation path was modified or executed.

  - [x] 2.4 Determine HTML provenance and artifact/workspace boundaries without running a generator

Inspect current guide files, repository references, scripts and generator documentation as read-only evidence. Classify the relationship as Markdown source, HTML source, evidenced deterministic transformation, or unresolved. Record authored guide work under `./agents-work/<workstream>/<report-type>/`, Machine Evidence under `./results/<purpose>/`, generated tech-docs under `./generated-documents/`, active separate plans under `./plans/<name>/`, and blockers only in root `./Failures.md` when exactly authorized. Preserve `./tech-docs-generator/` as a root-level sibling of `./site/`; distinguish `./results/site/` from `./site/`; reject reports/skills/non-core artifacts under `./site/` through the Site Write Gate.

- **Evidence:** provenance and placement records only; no generator, package, script, relocation, or command change.
- **Requirements:** 1.5, 6.1–6.10, 7.1–7.7, 18.1–18.8, 19.1–19.7, 24.1–24.8, 27.3, 27.6, 28.1–28.20, 29.1–29.10.

### Task 2.4 controlled-task record

**Task identity and publication boundary:** `oando-master / 2.4`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This record is limited to read-only provenance and workspace-boundary investigation plus the one explicitly authorized update to this existing Tasks artifact. The user authorized no generator, package, script, relocation, guide, CSS, report, results, generated-document, plan, site, control-file, Agent-definition, hook/settings/MCP, application/runtime, database, deployment, backup, Power, test, gate, build, typecheck, or other command/action. A completion marker here means complete for the static record only; it does not resolve provenance or prove runtime, generation, synchronization, rendered parity, or hosted behavior.

#### Four-slot ownership and serial integration

Exactly the existing four plan-declared slots remain in force. The `available` values are declared plan capacity only and do not prove host/runtime Agent creation, loading, spawning, or enforcement.

| Slot / Agent ID | Role | Coordinator designation | Permission for Task 2.4 | Owned scope | Explicit exclusions | Multi-Agent Availability State | Lifecycle status | Next owner |
|---|---|---|---|---|---|---|---|---|
| `S/M-01` | **Scout/Map** | `coordinator: false` | Read-only | Guide Markdown/HTML/CSS, repository references, generator documentation, and exact static provenance/placement evidence | No write, generator, package/script command, relocation, runtime claim, or validation | `available` (declared capacity only) | `complete` for evidence discovery | `P/R-01` |
| `P/R-01` | **Planner/Risk** | `coordinator: false` | Read-only | Provenance classification, Route Record, artifact/workspace boundaries, Site Write Gate, Locked Path Gate, risk, and owner-decision limits | No write, command, approval grant, generator/package action, or provenance inference from overlap | `available` (declared capacity only) | `complete` for classification | `I/C-01` |
| `I/C-01` | **Implementer** | `coordinator: true`; **Coordinator/Serial Integration Owner** is attached to this slot, not a fifth role | Read/write only for the exact existing `./.kiro/specs/oando-master/tasks.md` target | Serially integrate this static record, ownership/status fields, handoff, and completion marker | No write to guide Markdown/HTML/CSS, scripts, packages, plans, reports, results, generated output, `./site/`, controls, root/docs/Agents paths, or any other path; no command | `available` (declared capacity only) | `complete` for authorized record update | `V/R-01` |
| `V/R-01` | **Verifier/Reporter** | `coordinator: false` | Read-only | Read-back of this record, changed-path audit, evidence/limitation reconciliation, and handoff | No implementation edit, command, generator, runtime, synchronization, or promotion of unresolved evidence | `available` (declared capacity only) | `handoff-ready` | `Repository Owner` |

No fifth Coordinator Agent is declared, and no silent one-Agent fallback is permitted. The physical `./.kiro/agents/` definitions and the plan-declared four slots remain distinct; this task does not inspect or modify Agent definitions or infer runtime loading.

#### Ownership Matrix

| Objective, evidence item, artifact, or exact path | Exclusive owner | Permission | Serial/integration rule |
|---|---|---|---|
| Current user request, `./AGENTS.md`, `./Agents/01-standard.md`, `./Agents/05-documentation.md`, and `./plans/README.md` as authority/process evidence | `S/M-01` | Read-only | `I/C-01` reconciles the evidence before publication; no authority file may change. |
| `./.kiro/specs/oando-master/requirements.md`, `./.kiro/specs/oando-master/design.md`, `./.kiro/specs/oando-master/.config.kiro`, and existing `./.kiro/specs/oando-master/tasks.md` as spec evidence | `S/M-01` for read-only evidence; `I/C-01` for the exact current Tasks target | Read-only for evidence; write only to the exact authorized Tasks artifact | Requirements, design, and `.config.kiro` remain unchanged; this Tasks path is the sole shared/write path and is serially integrated. |
| Live guide Markdown and conditional HTML/CSS surfaces | `S/M-01` | Read-only | Co-location, filename similarity, navigation, stylesheet reuse, and content overlap are evidence of related surfaces only, never provenance proof; no guide write is authorized. |
| Repository scripts, package/workflow references, and `./tech-docs-generator/` documentation | `S/M-01` | Read-only | Static references may classify ownership and output paths but cannot establish execution, freshness, synchronization, or rendered parity. |
| Provenance decision, placement boundary, Route Record, risk, Site Write Gate, Locked Path Gate, and Coverage-Gap Admission | `P/R-01` | Read-only planning input | `I/C-01` serially publishes the record; unresolved evidence remains unresolved/not-observed and is not promoted. |
| Exact `./.kiro/specs/oando-master/tasks.md` update, handoff, and Completion Record | `I/C-01` | Write only to this existing file | One logical edit; `V/R-01` reads back after integration; no parallel edit. |
| Static read-back and changed-path audit | `V/R-01` | Read-only | Read-back cannot claim command, runtime, generated, synchronized, or hosted evidence. |
| `./site/`, `./results/site/`, `./generated-documents/`, `./tech-docs-generator/`, `./plans/**`, `./results/**`, `./agents-work/**`, root `./Failures.md`, guide files, controls, packages, databases, deployments, and all other paths | `I/C-01` as serial rejection boundary | No write permission in this task | Stop and report if scope expands; exact current-request authorization would be required for a future protected write/delete. |

#### Static evidence inspected

The inspection was read-only. The following current guide surfaces were read or inventoried as applicable:

- Guide workstream root: `./agents-work/oando-repository-guide/README.md`.
- Markdown work surfaces: `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./agents-work/oando-repository-guide/markdown/02-application-architecture.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`; `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`; `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`; `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`; `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`; `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`; `./agents-work/oando-repository-guide/markdown/10-quality-validation.md`; and `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`.
- Conditional projection surfaces: `./agents-work/oando-repository-guide/html/index.html`; `./agents-work/oando-repository-guide/html/repository-map.html`; `./agents-work/oando-repository-guide/html/application-architecture.html`; `./agents-work/oando-repository-guide/html/product-domains.html`; `./agents-work/oando-repository-guide/html/data-api-persistence.html`; `./agents-work/oando-repository-guide/html/tooling-ci-tech-docs.html`; `./agents-work/oando-repository-guide/html/operations-infrastructure.html`; `./agents-work/oando-repository-guide/html/docs-governance-planning.html`; `./agents-work/oando-repository-guide/html/kiro-workspace.html`; `./agents-work/oando-repository-guide/html/local-generated-environment.html`; `./agents-work/oando-repository-guide/html/quality-and-validation.html`; and `./agents-work/oando-repository-guide/html/working-with-kiro.html`.
- Shared stylesheet: `./agents-work/oando-repository-guide/html/guide.css`.

The exact relevant repository/generator references inspected were: `./tech-docs-generator/README.md`; `./tech-docs-generator/package.json`; `./tech-docs-generator/scripts/generate.mjs`; `./tech-docs-generator/scripts/generate-all.mjs`; `./tech-docs-generator/scripts/publish-generated-tree.mjs`; `./tech-docs-generator/scripts/publish-all.mjs`; `./tech-docs-generator/scripts/gate.mjs`; `./tech-docs-generator/scripts/output-contract.mjs`; `./tech-docs-generator/scripts/model.mjs`; `./tech-docs-generator/scripts/render-markdown.mjs`; `./tech-docs-generator/scripts/sync-css.mjs`; `./tech-docs-generator/vite.config.ts`; `./tech-docs-generator/scripts/extract-docs-health.mjs`; `./.github/workflows/tech-docs.yml`; `./scripts/general/generate-docs.mjs`; `./scripts/ops-command-registry.mjs`; `./scripts/run-ops.mjs`; `./package.json`; `./docs/architecture/scripts.md`; `./docs/architecture/product-map.md`; and `./docs/architecture/stack.md`. No generator, package, script, workflow, test, gate, build, typecheck, browser, local-service, database, deployment, backup, Power, MCP, or other command was run.

#### Exact static findings

1. `./agents-work/oando-repository-guide/README.md` explicitly identifies `html/index.html` as the HTML version and the `markdown/` directory as the Markdown chapters. This establishes that both surfaces are present and intentionally related in the guide workstream; it does not declare which surface is canonical or describe a deterministic Markdown-to-HTML transform.
2. The inspected HTML pages share a 12-tab navigation pattern, page-local `aria-current`, breadcrumbs/next links, and `guide.css`. The Markdown chapters contain materially more guidance than the HTML pages, which are condensed presentations. These are observed structural/content relationships only. Co-location, matching-ish filenames, shared navigation, shared stylesheet use, and semantic/content overlap are explicitly not provenance proof.
3. `./agents-work/oando-repository-guide/html/guide.css` contains static presentation rules. No source/provenance metadata, `@import`, generator marker, or guide-specific build instruction was observed in the inspected stylesheet.
4. `./tech-docs-generator/README.md` describes a separate source-driven Vite inventory SPA whose disposable output is `./generated-documents/`. `generate-all.mjs` wipes/regenerates that root and validates its surfaces; `generate.mjs` renders the generator model under that generated root. This package is not documented as the authoring pipeline for the co-located guide HTML.
5. `render-markdown.mjs` emits generated Markdown paths such as `markdown/overview/index.md`, `markdown/architecture/index.md`, and `markdown/governance/provenance.md` under the generator output model. Those paths are not the live guide chapter paths under `./agents-work/oando-repository-guide/markdown/`.
6. `output-contract.mjs` identifies `SOURCE_PACKAGE_DIR = 'tech-docs-generator'`, `GENERATED_ROOT_DIR = 'generated-documents'`, generated surfaces `data`, `docs`, and `site`, and tooling cache/staging under `./results/tooling/tech-docs/`. `vite.config.ts` writes the Vite site to `./generated-documents/site`; it does not target `./agents-work/oando-repository-guide/html/`. `sync-css.mjs` copies `./site/focss/` into `./generated-documents/data/css/`; it does not target `guide.css`.
7. `publish-all.mjs` publishes only generated surfaces under `./generated-documents/<surface>`. `extract-docs-health.mjs` inspects root documentation, `./plans/`, `./docs/architecture/`, and `./tech-docs-generator/README.md`; it does not name the guide workstream. The tech-docs workflow runs its own gate and uploads `generated-documents/site/`, not the co-located guide HTML.
8. `./scripts/general/generate-docs.mjs` generates inventories such as `tests/INVENTORY.md`, route, and coverage artifacts; it does not document or implement a transform from the guide Markdown chapters to the guide HTML pages. The root `./package.json` declares `docs:sync` and `tech-docs:*` commands, but no guide-specific Markdown-to-HTML command was observed.
9. Exact static search across the inspected generator/docs/scripts/workflow references for `oando-repository-guide`, `agents-work/oando`, `guide.css`, `html/index.html`, the guide HTML filenames, `Markdown-to-HTML`, `pandoc`, `remark`, `marked`, and `showdown` returned no relevant provenance or transformation declaration outside existing spec/task references. This is negative static evidence only, not proof that no external or runtime mechanism exists.

#### Provenance decision matrix

| Candidate classification | Static finding | Decision |
|---|---|---|
| **Markdown source** | Markdown is an observed human-authored guide work surface and is richer than the HTML projection, but no explicit canonical-source declaration or deterministic transform was found. | Not selected as proven source; remains `observed human-authored work surface`. |
| **HTML source** | HTML is present and intentionally linked from the guide README, but no declaration identifies it as canonical authoring source. | Not selected as proven source; remains `observed-present static projection surface`. |
| **Evidenced deterministic transformation** | No guide-specific generator, source annotation, deterministic command, package script, workflow, metadata, or equivalent inspected evidence connects the Markdown chapters to the HTML pages. The separate tech-docs generator targets `./generated-documents/`, not the guide HTML. | Rejected on available static evidence. |
| **Unresolved / not-observed** | The inspected evidence establishes related Markdown and HTML surfaces but cannot establish authoring direction, transform, freshness, synchronization, or parity. | **Selected final classification.** |

**Classification:** `unresolved / not-observed`. Do not call the HTML stale/current, do not claim Markdown-to-HTML generation, and do not write or relocate any guide HTML/CSS until an owner-approved investigation produces explicit provenance evidence and an exact write scope.

#### Coverage-Gap Admission

Admit the following gaps rather than inferring them: canonical guide source; Markdown-to-HTML authoring direction; deterministic transformation; generator invocation and freshness; synchronization between the 12 Markdown chapters and 12 HTML pages; rendered/content parity; runtime loading or publication; external/global Kiro behavior; hosted persistence; and any uninspected generator or external process. Static path presence, overlap, navigation, stylesheet reuse, or richer Markdown content cannot close these gaps. The gap is `pending-owner`/`not-observed`, not a blocker to this static Tasks-artifact record.

#### Artifact, workspace, and placement boundary record

| Artifact or action class | Required placement/classification | Static boundary decision for this task |
|---|---|---|
| Agent-authored guide work, provenance notes, or workstream reports | `./agents-work/<workstream>/<report-type>/` | Future guidance only; no report file was created. The current record belongs in the explicitly authorized Tasks artifact, not an `agents-work/` root or report substitute. |
| Machine Evidence produced by an authorized command/check | `./results/<purpose>/` | Future evidence only; no machine evidence was produced. `./results/site/` is a Machine Evidence Purpose Subfolder and is distinct from product source `./site/`. |
| Generated tech-docs | `./generated-documents/` | The separate tech-docs generator owns this output boundary; no generated document was created or relocated. |
| Generator source/package | `./tech-docs-generator/` | Preserved as a root-level sibling of `./site/`; it is not a subdirectory of `./site/` and does not establish guide HTML provenance. |
| Active separate plans | `./plans/<name>/`, indexed by `./plans/README.md` | No plan was created or modified. A plan is not a results, report, generated-document, or product-source substitute. |
| True Blocker | root `./Failures.md` only when exactly authorized | No True Blocker was evidenced and no write was authorized; `./Failures.md` was not changed. |
| Product source | approved source tree, including `./site/` when explicitly in scope | `./site/` was not an output/report/skill/generated-document destination. This task has no Core Product Write. |
| Non-Core Artifact under `./site/` | denied/redirected by the Site Write Gate | Reports, skills, prompts, plans, results, generated files, audits, handoffs, temporary/debug files, and other non-core artifacts must not be written under `./site/`. |

**Site Write Gate:** `not-applicable` to the sole authorized target because `./.kiro/specs/oando-master/tasks.md` is not `./site/`. For any future `./site/` target, classify it before writing as an approved Core Product Write or a Non-Core Artifact; deny/redirect the latter. The distinction `./results/site/` versus `./site/` is preserved and no path presence is treated as permission.

**Locked Path Gate:** the sole current write target is explicitly authorized. `./docs/**`, `./Agents/**`, every direct root file including `./Failures.md`, `./.kiro/agents/**`, guide files, generator files, scripts, packages, controls, application/runtime, database, deployment, generated-output, and results paths remain read-only or excluded. A copy, mirror, generated substitute, or report cannot be used to claim that a locked source changed. Any future protected write/delete requires the Repository Owner to name the exact file in the current request.

#### Route Record

- **Outcome:** Establish a static, evidence-honest classification of the guide Markdown/HTML relationship and preserve artifact/workspace boundaries without running a generator or changing any guide, generator, package, script, relocation, or command path.
- **Domain / Domain Index cards:** `D18` documentation/architecture/locked/legacy docs; `D19` results/generated documents/agent work/blockers; `D20` Kiro skills/Powers/Agents and controlled workspace; `D22` unknown-area discovery for unresolved provenance. These are routing classifications, not proof of runtime wiring.
- **Exact first evidence locations and reasons:** `./agents-work/oando-repository-guide/README.md` for the guide’s own surface declaration; the 12 Markdown chapters and 12 HTML pages plus `guide.css` for current static relationships; `./tech-docs-generator/README.md`, `scripts/`, `vite.config.ts`, and `output-contract.mjs` for generator source/output boundaries; `./package.json`, `./.github/workflows/tech-docs.yml`, and root documentation/script references for declared commands and publication; `./AGENTS.md`, `./Agents/01-standard.md`, `./Agents/05-documentation.md`, and `./plans/README.md` for repository authority and placement rules.
- **Selected Package Skills and trigger evidence:** `oando-master` because this is an `oando-master` spec task and its router/completion contract is mandatory; `repo-map` because exact repository roots, guide workstream, generator sibling, results, and site boundaries must be oriented before classification. No Power or MCP was activated.
- **Rejected Package Skills and reasons:** `db-migrations` (no schema, SQL, RLS, grants, rollback, or database action); `focss-css` (guide CSS was read as provenance evidence only, with no styling change); `fork-boundaries` (no Studio/Planner tree write or shared product-code analysis); `graph-impact` (no shared-code/import-graph change); `planner-studio` (no Planner/Studio product task); `verify-and-gate` (all commands and validation are explicitly forbidden); `powers-skills-model` (no Power/skill packaging or capability-authoring change); `ai-retrieval` (no AI/retrieval work and optional branch remains unselected/absent).
- **Workflow Mode:** `Supervised` — read-only investigation with one exact owner-authorized Tasks-artifact update; no automatic generator or validation execution.
- **Operational-Risk Classification:** documentation/provenance and workspace-boundary risk; protected-path and authorization risk; no product, data, credential, infrastructure, deployment, or external-system change.
- **Command Classification:** no shell/package/script/generator/validation command proposed or run. Static reads/listings/searches are read-only inspection. Tests, gates, builds, typechecks, browser/local services, database, deployment, backup, Power, MCP, and all generator/package commands are `no-run pending authorization` and excluded.
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / Downstream Tasks Artifact / not applicable`; exact changed target `./.kiro/specs/oando-master/tasks.md`, filename `tasks.md`, owned by this approved spec workflow and `I/C-01`, authored rather than generated. Future guide reports use `./agents-work/<workstream>/<report-type>/`; future machine evidence uses `./results/<purpose>/`; generated tech-docs use `./generated-documents/`; no such future output was created here.
- **Site Write Gate:** `not-applicable` to the current Tasks target; any future `./site/` target requires Core Product Write classification and rejects Non-Core Artifact placement.
- **Locked Path Gate:** current exact Tasks target authorized; all guide, generator, scripts, packages, root/docs/Agents, controls, `./site/`, results, generated, plan, database, deployment, and runtime paths are excluded/read-only.
- **Owner Decisions:** whether Markdown or HTML is canonical; whether a deterministic transform exists outside inspected static references; whether any future HTML/CSS projection write is approved; exact projection targets and owner; and any future generator/runtime or validation authorization. No decision is inferred from co-location or overlap.
- **Conflict Stop Rule:** if provenance evidence conflicts, an owner/path is ambiguous, a protected target is named without exact authorization, or scope expands beyond this record, stop before writing; preserve the competing evidence, record the exact path/action and state, route to the Repository Owner, and do not choose an alternate source, path, tool, Agent, permission, or inferred approval. Current conflict state is `not-observed`; no conflict occurred.

#### Pre-Action Gate Records

No executable or host-integrated Pre-Action Enforcement Layer was invoked or observed. The following are static scope records, not runtime allow/deny decisions:

| Action kind | Static decision for Task 2.4 | Required limitation |
|---|---|---|
| `read` | Allowed only as read-only inspection of named authority, guide, repository-reference, and generator paths | Protected paths remain read-only; static reads do not prove runtime loading or enforcement. |
| `write` | Allowed only for the exact existing `./.kiro/specs/oando-master/tasks.md` update | Guide/generator/script/package/site/results/plan/control/runtime writes are denied/excluded; no neighboring file is unlocked. |
| `delete` | Denied; no deletion scope exists | No alternate cleanup or relocation is permitted. |
| `command` | Denied/no-run because the user explicitly forbids commands and validation | No generator, package, script, test, gate, build, typecheck, browser, service, database, deployment, backup, Power, MCP, or other command was substituted. |
| `delegation` | No new delegation; only the four declared slots are preserved | No fifth receiver or silent Agent fallback may be inferred. |
| `handoff` | Static handoff to `V/R-01` and then the Repository Owner | Required fields are present below; runtime handoff gating is `not-observed`. |

#### Deliverable Register

| Deliverable | Owner | Status | Evidence/limitation |
|---|---|---|---|
| Current guide Markdown/HTML/CSS inventory and static relationship record | `S/M-01` | `complete` for inspected paths | Static reads only; not proof of authoring direction or synchronization. |
| Generator/source/output boundary record | `S/M-01` / `P/R-01` | `complete` for inspected references | The separate generator targets `./generated-documents/`; command execution was not run. |
| Provenance decision and Coverage-Gap Admission | `P/R-01` | `complete` as `unresolved / not-observed` | No canonical source, deterministic transform, freshness, parity, or runtime publication was established. |
| Artifact/workspace placement and Site/Locked Path Gates | `P/R-01` | `complete` for classification | Guidance/classification only except the authorized Tasks-artifact update; no report/result/site/generated path changed. |
| Task 2.4 record, handoff, and completion marker | `I/C-01`, serially integrated | `complete` for static publication | Exact changed path is this existing `tasks.md`; `V/R-01` owns read-back. |
| Runtime generation/synchronization/enforcement | Repository Owner / Separate Approval Work | `not-observed` / `pending-owner` | Not authorized or run. |

#### Task 2.4 Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Determine the static relationship between the guide Markdown and HTML/CSS surfaces and record evidence-honest provenance, artifact placement, workspace boundaries, Site Write Gate, Locked Path Gate, ownership, and completion state without running a generator or changing any excluded path.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; next owner is `V/R-01` for read-only record read-back, then the `Repository Owner` for any canonical-source decision, deterministic-transform investigation, HTML/CSS write approval, runtime/generator action, or validation. No downstream shared-path write begins before this handoff is reconciled.
- **Scope:** Static inspection of the guide README, 11 numbered Markdown chapters, 12 HTML pages, shared CSS, generator documentation/scripts/configuration, package/workflow/repository references, and exact placement boundaries. Includes unresolved provenance classification, Coverage-Gap Admission, four-slot ownership, Route Record, artifact register, Pre-Action Gate Records, Conflict Stop Rule, and Completion Record. Excludes guide/generator/script/package/plan/report/results/generated/site/control/application/runtime/database/deployment/backup/Power/MCP changes and every command or validation action.
- **Paths Read and Paths Changed:** Read the authority/spec files `./AGENTS.md`, `./Agents/01-standard.md`, `./Agents/05-documentation.md`, `./plans/README.md`, `./.kiro/specs/oando-master/requirements.md`, `./.kiro/specs/oando-master/design.md`, `./.kiro/specs/oando-master/.config.kiro`, and the pre-existing `./.kiro/specs/oando-master/tasks.md`; all guide paths listed under Static evidence inspected; the generator/repository references listed there; and the relevant root/workflow documentation. Changed exactly `./.kiro/specs/oando-master/tasks.md` to add this Task 2.4 record, change its marker to `[x]`, and preserve all unrelated records. No guide, HTML, CSS, generator, script, package, plan, report, result, generated-document, site, hook/settings/MCP, Agent definition, root, docs, Agents, application/runtime, database, deployment, backup, or other path was changed.
- **Route Record:** D18/D19/D20/D22; selected `oando-master` and `repo-map`; rejected non-matching skills as recorded above; `Supervised`; no commands; Tasks artifact as the sole authorized target; future placement guidance only; Site Write Gate not applicable to current target; Locked Path Gate preserved; validation `not-run`.
- **Evidence:** Guide README declaration; all listed Markdown/HTML/CSS surfaces; static content/navigation/stylesheet comparison; generator README/scripts/output contract/Vite/CSS sync/publish/health extraction; package/workflow/general-doc-generation references; negative static search for guide-specific transform markers; and this authorized Tasks-artifact read-back. Evidence is static path/text evidence only.
- **Decisions:** Final classification is `unresolved / not-observed`; Markdown remains an observed human-authored guide work surface; HTML/CSS remain observed-present static projection surfaces with authoring/synchronization unverified; the separate tech-docs generator owns its own `./generated-documents/` output and does not prove guide HTML provenance; `./tech-docs-generator/` remains a root sibling of `./site/`; `./results/site/` remains distinct from `./site/`; future agent reports/results/generated/plans/blockers use their classified boundaries; the Site Write Gate rejects non-core artifacts under `./site/`; no guide or generator path is changed.
- **Coverage Gaps:** Canonical source, deterministic transform, external/runtime generation, invocation, freshness, synchronization, rendered/content parity, runtime loading/publication, hosted persistence, and external/global Kiro behavior remain `not-observed`/`pending-owner`. Static overlap and co-location do not close these gaps.
- **Validation Command:** `none` — the user explicitly forbids shell/package/script/generator commands, tests, gates, builds, typechecks, browser/local-service actions, database/deployment/backup actions, Power activation, MCP connection, and any other command-based validation. Static reads/listings/searches and the authorized Tasks-artifact read-back are the only applicable evidence.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for the exact existing `./.kiro/specs/oando-master/tasks.md` write. No guide, HTML/CSS, generator, script, package, plan, report, result, generated-document, `./site/`, control, Agent-definition, root/docs/Agents, application/runtime, database, deployment, backup, Power, MCP, or command action is authorized; no inferred permission or substitute-copy claim is used.
- **Hook Decision:** `not-observed` for this task. No command tool was invoked, no hook result was observed, and no hook scope is generalized from static configuration.
- **Exit Status:** `not-observed` — no command or runtime action was executed.
- **Validation Limitation:** Static path/text reads and the Tasks-artifact read-back establish only the recorded document facts and classification. They cannot prove runtime Agent/generator loading, automatic execution, hook enforcement, command success, generated freshness, synchronization, rendered parity, hosted persistence, connected MCP, activated Power, external/global coverage, or behavior outside inspected paths.
- **Blockers:** None within the authorized static scope. Unresolved provenance and unobserved runtime/generation states are Coverage Gaps and pending Owner Decisions, not a hard blocker to this record. `./Failures.md` was not changed because no hard blocker was evidenced and no blocker write was authorized.
- **Next Action:** `V/R-01` performs read-only static read-back and changed-path reconciliation. The `Repository Owner` then decides whether to authorize a separate provenance/source-of-truth investigation or an exact future HTML/CSS projection write. No generator, relocation, site write, or validation is implied by this handoff.
- **Status:** `complete` for the exact static provenance/placement record and authorized Tasks-artifact update only; provenance classification remains `unresolved / not-observed`, and runtime/generation/synchronization/rendered-parity/enforcement states remain `not-observed`/`pending-owner`/`guidance-only`.

#### Task 2.4 Completion Record

- **Changed files:** exactly `./.kiro/specs/oando-master/tasks.md`, because the current request authorizes only this existing Tasks artifact. The change adds this provenance/placement record and changes the Task 2.4 marker to `[x]`. No guide Markdown, guide HTML, CSS, generator, script, package, lockfile, plan, report, results, generated document, `./site/`, `./Failures.md`, hook/settings/MCP, Agent definition, application/runtime, database, deployment, backup, or other path was changed.
- **Validation actually run:** no command, generator, package/script action, test, gate, build, typecheck, browser/local service, database, deployment, backup, Power, MCP, or other validation action. Read-only file inspection and the authorized Tasks-artifact read-back are the only completion evidence.
- **Validation not run:** every command-based, runtime, generation, and validation action remains not run under the explicit user prohibition; no command result, generator result, Hook Decision, synchronization result, or rendered-parity result is claimed.
- **Remaining issues and next owner:** `V/R-01` owns static read-back; the `Repository Owner` owns the unresolved Markdown-versus-HTML source decision, any deterministic-transform evidence, exact future projection write scope, and any runtime/generator/validation authorization. Downstream guide, generator, product, package, database, deployment, generated-output, and test work remains separately scoped.
- **Scope confirmation:** only `./.kiro/specs/oando-master/tasks.md` changed. `./agents-work/oando-repository-guide/**`, `./tech-docs-generator/**`, `./generated-documents/`, `./results/**`, `./results/site/`, `./site/`, `./plans/**`, `./Failures.md`, root/docs/Agents, controls, packages, applications, runtime, databases, deployments, and generated surfaces were preserved and not modified or executed.
- **Multi-Agent Evidence:** the existing four-slot Agent Roster, Ownership Matrix, Route Record, Pre-Action Gate Records, Deliverable Register, Conflict Stop Rule, Handoff Record, Coverage-Gap Admission, and this Completion Record are present. The four-slot roster is plan evidence only; runtime Agent creation/loading and universal enforcement remain `not-observed`.
- **Final lifecycle status:** `complete` for the exact static Task 2.4 record; provenance status is `unresolved / not-observed`; enforcement status is `guidance-only`/`not-observed`; no downstream implementation or HTML/CSS write is complete.

**Task 2.4 completion marker:** `[x] 2.4` — complete for the exact static inspection and provenance/placement record only. The final classification is `unresolved / not-observed`; Markdown is an observed human-authored guide work surface, HTML/CSS are observed static projection surfaces with authoring/synchronization unverified, and the separate `./tech-docs-generator/` package targets `./generated-documents/` rather than proving the co-located guide HTML. No generator, package, script, relocation, guide, CSS, site, report, results, generated-document, plan, control, application/runtime, database, deployment, backup, Power, MCP, test, gate, build, typecheck, browser/local-service, or validation action was run or changed.

- [x] 3. Build the README Begin Here entry point, Domain Index, gates, and controlled-task vocabulary

- **Dependency:** `2.1 → 2.2 → 2.3 → 2.4`.
- **Role slots:** `S/M-01` maps evidence; `P/R-01` owns routing/risk; `I/C-01` writes only the exact README after approval; `V/R-01` verifies static coverage. Exactly four slots remain declared.
- **Owned write path:** only `./agents-work/oando-repository-guide/README.md` in a separately approved downstream guidance lane.
- **Read-only inputs:** Task 2 inventory; all 11 numbered chapter Markdown paths; all HTML/CSS paths; current Kiro skill/control paths; `./AGENTS.md`; `./Agents/`; `./docs/`; and `./plans/README.md`.
- **Excluded writes:** every other guide file, protected path, `./site/`, hooks/settings/MCP, packages, migrations, runtime, generated output, and commands.
- **Approval gate:** owner approval of the README route and exact path after Task 2; no protected write or contract append.

  - [x] 3.1 Add Begin Here, Route Record, and common Coverage-Audited Task Card schema

Require `./.kiro/skills/oando-master/SKILL.md` first, authority ordering, ordinary-language outcome, exact first evidence paths and reasons, Domain Index selection, additive matching-skill selection, rejected-skill reasons, Workflow Mode, command classification, risk, artifact classification, Site Write Gate, Locked Path Gate, Owner Decisions, and next action. Define Goal, Start Paths, Scope, Evidence Steps, Allowed Actions, Forbidden Actions, Risk, Expected Evidence, and Next Decision for every card.

- **Requirements:** 1.1–1.6, 8.1–8.9, 14.1–14.6, 15.1–15.5, 20.1–20.5, 21.1–21.10, 28.7–28.9, 30.10, 30.15, 30.20.

### Task 3.1 authorization-gated static routing and card-schema record

**Task identity and phase boundary:** `oando-master / 3.1`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This record captures the actionable Begin Here, Route Record, response-contract, and common Coverage-Audited Task Card schema required for the downstream guide. It is a static Tasks-artifact record, not a README implementation, runtime router, generator output, or enforcement result.

**Authorized write boundary:** the current execution phase authorizes only the existing `./.kiro/specs/oando-master/tasks.md` artifact. The intended downstream owned path is exactly `./agents-work/oando-repository-guide/README.md`, but the current request expressly withholds authorization for that downstream write and requires owner approval of the README route and exact path after Task 2. README authorization is therefore **absent**; the guide implementation is `pending-owner`/`not-observed`. No README, guide chapter, HTML/CSS, skill, hook, settings/MCP, package, script, `./site/`, plan, report, result, generated-document, runtime, application, database, deployment, backup, or protected path was changed.

#### Begin Here contract to be applied after README authorization

The Begin Here Flow accepts one required contributor input: an ordinary-language description of the desired outcome. It must produce the following decisions before any repository modification or output-path selection:

1. **First router and authority:** read `./.kiro/skills/oando-master/SKILL.md` first. Preserve authority order: current user instruction → live repository evidence and fresh command output → `./AGENTS.md` → `./Agents/` → `./docs/`; use `./plans/README.md` for active planning coordination after those sources.
2. **Outcome:** restate the request with an action verb, name the inferred Product Surface or repository domain, and define specialized terms before asking for a decision.
3. **Exact first evidence:** list exact repository paths and a reason for reading each path before broader exploration. A path is a routing output, not a required contributor input.
4. **Domain Index selection:** select one applicable `D01`–`D22` card; use `D22` Unknown-area discovery when no existing outcome safely fits. A card selection is guidance, not proof that the capability is wired.
5. **Additive skill routing:** select every matching Package Skill based on evidence. Reject every non-matching or unavailable skill with a plain-language reason; when no skill matches, select Local Evidence and record the no-match reason. `oando-master` is always first; `repo-map` is selected for orientation/path discovery; other skills remain conditional.
6. **Workflow Mode:** select and explain exactly one of `Vibe`, `Plan`, `Spec`, `Autopilot`, or `Supervised` from scope and operational risk; this is prose guidance, not a runtime mode switch.
7. **Command Classification:** classify every proposed command before suggesting or running it as `read-only inspection`, `Normal-Agent Eligible Check`, `Protected Command`, or `no-run pending authorization`. Protected Commands remain pending without exact current-session Explicit User Authorization and Hook Permission.
8. **Risk:** classify source, data, credentials, security, fork, release, external-system, infrastructure, documentation, and scope risks that are evidenced by the task.
9. **Artifact classification and placement:** for an Output-Producing Task, declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only after publication. Use `./agents-work/<workstream>/<report-type>/` for authored Agent Work Reports, `./results/<purpose>/` for Machine Evidence, `./generated-documents/` for tech-docs generator output, `./plans/<name>/` for active plan material, and root `./Failures.md` only for an evidenced True Blocker.
10. **Gates:** apply the Locked Path Gate to the exact target before writing (`Locked`, `explicitly owner-authorized`, or `writable`). Apply the Site Write Gate before any `./site/` write; permit only an explicitly approved Core Product Write and stop/redirect every Non-Core Artifact.
11. **Owner Decisions and next action:** request only decisions that Local Evidence cannot establish, explain the term and risk first, and finish with the smallest numbered next action. Missing evidence selects read-only discovery rather than guessed modification.

#### Route Record schema

Every Repository Task must publish this record before modification or output-path selection:

```text
Outcome: ordinary-language desired result and selected domain
Domain / Domain Index card: one D01–D22 card, or D22 discovery fallback
Exact first evidence locations and reasons: exact paths plus why each is first
Candidate paths: evidence-backed candidate files/areas; no guessed paths
Selected Package Skills and trigger evidence: every matching skill, additively
Rejected Package Skills and reasons: every considered non-match/unavailable skill
Workflow Mode: Vibe | Plan | Spec | Autopilot | Supervised
Operational-Risk Classification: evidenced risk and affected boundary
Command Classification: each proposed command -> read-only | eligible | protected | pending
Artifact Class: when output is produced
Selected Workstream Subfolder or Purpose Subfolder: exact approved destination
Filename pattern: expected output name
Owning source or script: human source, generator, command, or product owner
Authored or generated: authored | generated | not applicable
Rejected placements: invalid candidate homes and reasons
Locked Path Gate state: Locked | explicitly owner-authorized | writable | not applicable
Site Write Gate state: Core Product Write | Non-Core Artifact | not applicable
Validation State: not-needed | eligible | pending-user-authorization | blocked-by-hook | observed-pass | observed-fail | not-run
Unavoidable Owner Decisions: only decisions not answerable from Local Evidence
Next action: one smallest bounded next step
```

The Route Record is a prose decision record. It does not establish runtime skill loading, Power installation, MCP connection, Agent spawning, or enforcement.

#### Common Coverage-Audited Task Card schema

Every Domain Index card selected by Begin Here, including each future `D01`–`D22` card, must use this common schema. `Start Paths` are exact repository paths or an explicitly labelled discovery instruction; path presence never establishes a wired or complete capability.

```text
Card ID and outcome name: stable D01–D22 identifier and action-oriented outcome
Chapter mapping: at least one numbered guide chapter (01–11)
Goal: action verb + named Product Surface or repository domain + defined specialized terms
Start Paths: exact paths, or "path discovery required" with the evidence reason
Scope: included behavior, evidence, and explicit exclusions
Evidence Steps:
  1. read authority sources in authority order
  2. inspect the listed Start Paths
  3. compare documentation with live repository evidence
  4. classify Surface Status and operational risk
  5. record evidence, gaps, Route Record, and Next Decision
Allowed Actions: bounded reads, evidence recording, and only explicitly approved owned writes/checks
Forbidden Actions: guessed paths, unrelated edits, scope drift, secret exposure, Protected Commands without both permissions, and Separate Approval Work
Risk: source/data/security/fork/release/external-system/documentation/scope classification
Expected Evidence: exact paths, static diff/read-back, authorized output, or explicit pending/unverified state
Next Decision: one bounded next action or the single unavoidable Owner Decision
```

Every card must additionally preserve additive skill selection, command classification, artifact fields when output is produced, the Locked Path Gate, the Site Write Gate when relevant, and a Surface Status/Coverage-Gap record when End-to-End Evidence is absent. The allowed Surface Status values are `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, and `legacy`; an absent or unverified surface must not be described as wired or complete.

#### Plain-Language Response Contract

Every task-start, progress, handoff, pause, and completion response uses this exact field order and explains specialized terms before an Owner Decision:

`Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions.`

A response with a missing field is incomplete and must name the omitted field, the validation state, and the next owner action. If no completion proof exists, it must state the missing proof explicitly; static evidence must not be promoted to runtime, rendered, hosted, or command success.

#### Four-slot ownership and artifact/gate application for this record

| Slot | Role and permission | Task 3.1 ownership | Explicit exclusion | Next owner |
|---|---|---|---|---|
| `S/M-01` | Scout/Map; read-only | Read user/spec/authority sources and map exact routing/schema evidence | No write, command, delegation, README change, or runtime claim | `P/R-01` |
| `P/R-01` | Planner/Risk; read-only | Own Domain Index/skill/risk/command/approval planning and the common schema proposal | No write, command authorization, or scope expansion | `I/C-01` |
| `I/C-01` | Implementer + Coordinator/Serial Integration Owner; read/write only to exact current `./.kiro/specs/oando-master/tasks.md` | Serially integrate this static Task 3.1 record; README write permission is withheld pending owner approval | No write to README or any other path; no fifth role, runtime claim, protected change, or command | `V/R-01` |
| `V/R-01` | Verifier/Reporter; read-only | Read back the Tasks artifact, reconcile changed scope/evidence, and prepare the handoff | No implementation edit, command, or promotion of pending evidence | Repository Owner |

The four-slot roster is inherited and unchanged. `Coordinator/Serial Integration Owner` is attached to `I/C-01`, not a fifth Agent. Shared terminology and the Tasks artifact are serially owned; runtime roster creation/loading remains `not-observed`.

**Artifact and gate state:** the currently authorized output is `Active Plan / Downstream Tasks Artifact` at `./.kiro/specs/oando-master/tasks.md`, filename `tasks.md`, authored by this approved spec workflow, not generated. The deferred guide output is an authored guide work product at the exact approved workstream path `./agents-work/oando-repository-guide/README.md`, but its approval gate is `pending-owner` and it was not written. Rejected placements include `./agents-work/` root, `./results/`, `./generated-documents/`, `./site/`, root controls, protected paths, HTML/CSS, and any duplicate or substitute location. The current `Locked Path Gate` is `explicitly owner-authorized` only for the exact Tasks artifact; `./docs/**`, `./Agents/**`, every direct root file, `./.kiro/agents/**`, and all unselected neighbors remain `Locked`. The current `Site Write Gate` is `not-applicable`; no `./site/` target exists.

#### Task 3.1 handoff record

- **Objective:** Record the actionable Begin Here Flow, Route Record, Plain-Language Response Contract, and common Coverage-Audited Task Card schema while preserving the downstream README approval gate.
- **Role and Next Owner:** `I/C-01` is Implementer and Coordinator/Serial Integration Owner; next owner is `V/R-01` for read-only Tasks-artifact reconciliation, then the Repository Owner to authorize or decline the exact README write path. No shared/downstream write begins before serial integration and owner approval.
- **Scope:** Static routing/schema record in `./.kiro/specs/oando-master/tasks.md` only; define the future README content contract, all gates, card fields, and evidence order; do not implement the README or any downstream task.
- **Paths Read and Paths Changed:** Read `./.kiro/skills/oando-master/SKILL.md` first; `./.kiro/skills/repo-map/SKILL.md`; `./.kiro/skills/powers-skills-model/SKILL.md`; `./START.md`; `./AGENTS.md`; `./Agents/01-standard.md`; `./plans/README.md`; `./.kiro/specs/oando-master/.config.kiro`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; `./.kiro/specs/oando-master/tasks.md`; and `./agents-work/oando-repository-guide/README.md` as the intended downstream work surface. Changed exactly `./.kiro/specs/oando-master/tasks.md`; no README or other path changed.
- **Route Record:** Primary `D01 — Repository map and authority`, additive `D20 — MCP, skills, Powers, and Agents` governance context; selected `oando-master` (mandatory first router), `repo-map` (orientation/path discovery), and `powers-skills-model` (Kiro skill/capability routing). Rejected `db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `planner-studio`, `verify-and-gate`, and `ai-retrieval` because their triggers are absent or validation is forbidden/unauthorized. Workflow Mode `Supervised`; risk is documentation/governance, authorization, scope, and evidence-integrity risk; no command proposed or run. Current artifact is authored Active Plan at the exact Tasks path; README artifact is pending-owner. Locked Path Gate is authorized only for Tasks; Site Write Gate is not applicable; Validation State is `not-run` for commands and `pending-owner` for the downstream README.
- **Evidence:** The read sources establish the first-router requirement, authority order, ordinary-language Begin Here input, additive skill routing, five Workflow Modes, four command classifications, artifact/gate fields, exact response order, common card fields/evidence order, and four-slot serial ownership. The new Tasks section records those decisions as static guidance only.
- **Decisions:** Keep the README route and exact path as a separate owner approval gate; write only the current Tasks artifact; preserve exactly four slots and attach Coordinator/Serial Integration Owner to `I/C-01`; use D22 only as the unknown-area fallback; preserve the Locked Path and Site Write Gates; do not add cards, chapter content, HTML/CSS, runtime routing, generator synchronization, hooks, packages, scripts, tests, or validation commands in this task.
- **Coverage Gaps:** README implementation, D01–D22 card instances/classifier rows, Coverage Audit, HTML projection, runtime skill loading/routing, automatic Agent spawning, universal Pre-Action Enforcement, rendered/hosted behavior, connected MCP, installed Power state, and any external/global Kiro file are `pending-owner` or `not-observed` as applicable. Task 3.2 remains the downstream card-instance task and must not be treated as completed by this schema record.
- **Validation Command:** `none` — the current request forbids commands, scripts, generators, tests, gates, builds, typechecks, package actions, browser/local-service actions, database/deployment/backup actions, Power activation, and MCP connection. Read-only inspection and the authorized Tasks-artifact read-back are the only permitted evidence.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization is present only for the exact `./.kiro/specs/oando-master/tasks.md` write. README authorization is absent despite its being the intended downstream owned path; no protected or other downstream write is authorized.
- **Hook Decision:** `not-observed`; no command hook or universal pre-action decision was invoked. Static guidance does not prove runtime enforcement.
- **Exit Status:** `not-observed` for command execution; the static Tasks-artifact record is ready for read-back.
- **Validation Limitation:** Static file content, path, schema, and read-back evidence cannot prove README modification, card rendering, runtime routing/skill loading, Agent spawning, universal enforcement, command success, rendered interaction, hosted persistence, connected MCP, installed Power, or synchronization.
- **Blockers:** No hard blocker within the authorized Tasks-artifact scope. README implementation is pending-owner because exact downstream authorization is absent; do not write a duplicate, substitute, or protected source, and do not add this pending decision to root `./Failures.md` without exact authorization.
- **Next Action:** Repository Owner names and authorizes the exact downstream README path and route in a future request; then `I/C-01` may write only `./agents-work/oando-repository-guide/README.md`, `V/R-01` performs read-only coverage reconciliation, and Task 3.2 remains downstream. Until then, stop before any README or other path write.
- **Status:** `pending-owner` for Task 3.1 guide implementation; the static schema/routing record in the authorized Tasks artifact is `complete` only as a static handoff, with README implementation and runtime/enforcement states `not-observed`.

  - [x] 3.2 Add exactly the 22 D01–D22 cards and classifier rows

### Task 3.2 static D01–D22 card and classifier reconciliation

**Task identity and publication boundary:** `oando-master / 3.2`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is the static, actionable record for the 22-card Domain Index work. The current request authorizes one write to the existing `./.kiro/specs/oando-master/tasks.md` artifact only. The intended downstream README path `./agents-work/oando-repository-guide/README.md` remains `pending-owner`; README/card-instance mutation is `not-observed` and is not authorized in this task. No guide chapter, HTML/CSS projection, root/Docs/Agents/protected path, skill, hook/settings/MCP, package/script, plan/report/result/generated-document, `./site/`, application/runtime, database, deployment/backup, Power, MCP connection, or command action is in scope.

**Implementation state:** `pending-owner` for the downstream README deliverable; `not-observed` for README/card-instance mutation. The static card/classifier reconciliation below becomes `complete` only as an authored Tasks-artifact record after read-back. It is not evidence that the README changed, that a card is rendered, or that any capability is wired or complete.

**Inherited four-slot operating model:** `S/M-01` Scout/Map and `P/R-01` Planner/Risk remain read-only; `I/C-01` is the Implementer with the `Coordinator/Serial Integration Owner` designation and may write only this exact Tasks artifact; `V/R-01` is the read-only Verifier/Reporter. Exactly four declared slots remain in force; the Coordinator designation is not a fifth role. Shared terminology and this Tasks artifact are serially integrated. Runtime roster creation/loading and universal enforcement remain `not-observed`/`guidance-only`.

#### Common card contract

The following contract applies to each and only each of the 22 cards below. `Start Paths` are exact repository-relative paths from the verified Requirements 20 baseline and Design §7 mapping, or an explicitly labelled discovery instruction. They are starting locations, not wiring or completeness evidence. If a listed path is absent, stale, generated, local-private, legacy, or otherwise unverified during a future read, record that limitation and use path discovery/Coverage-Gap Admission rather than silently substituting a path.

- **Evidence Steps (mandatory order for every card):** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, Route Record, and Next Decision.
- **Allowed Actions:** bounded read-only inspection, evidence recording, Route Record/classifier completion, and only explicitly approved owned writes or checks in a separately authorized task.
- **Forbidden Actions:** guessed paths, path-presence-as-wiring claims, unrelated edits, scope drift, secret exposure, Protected Commands without exact current-session Explicit User Authorization and Hook Permission, and Separate Approval Work.
- **Surface Status / gap rule:** use only `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy`; cite evidence source, current owner, next action, and evidence limitation. Where End-to-End Evidence is absent, record a Coverage-Gap Admission Card and do not describe the area as wired or complete.
- **Routing rule:** select every matching Package Skill, reject non-matching/unavailable skills with a reason, and use Local Evidence with a no-match reason when no Package Skill applies. Command classification, artifact fields, Locked Path Gate, and Site Write Gate remain mandatory when their triggers are present.

#### Exact 22 card definitions

##### D01 — repository map
- **Chapter mapping:** `01`.
- **Goal:** Map repository authority and the first safe inspection path.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./docs/architecture/stack.md`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./agents-work/oando-repository-guide/README.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./plans/README.md`.
- **Scope:** authority ordering, exact paths, source/generated/local-private/legacy classification, and task routing; no capability-completeness claim.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only authority/path mapping and Route Record creation; guide writes require their own exact owner authorization.
- **Forbidden Actions:** guessing paths, treating a document as self-validating, or changing locked authority files.
- **Risk:** documentation, scope, and authority risk.
- **Expected Evidence:** authority order, exact first paths, selected/rejected skills, evidence limitations, and next decision.
- **Next Decision:** select the next domain card or route unfamiliar work to D22.

##### D02 — initialization and debugging
- **Chapter mapping:** `09`.
- **Goal:** Initialize, develop, and debug local work safely without starting services by assumption.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./package.json`; `./site/`; `./config/build/`; `./Failures.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** root `pnpm` boundary, environment state, local/private/generated areas, and reported symptoms; no installation or service execution.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only inventory and bounded diagnosis planning.
- **Forbidden Actions:** installing, starting, building, testing, changing environment files, or asserting a failure cause without authorized evidence.
- **Risk:** local environment, secrets, service, and debugging risk.
- **Expected Evidence:** status-labelled environment/debug map or explicit pending owner validation.
- **Next Decision:** choose the smallest read-only diagnostic; install/dev/build/test/local-service commands remain Protected Commands.

##### D03 — auth, security, and secrets
- **Chapter mapping:** `04`.
- **Goal:** Trace authentication, security controls, and secret boundaries without exposing credentials or weakening controls.
- **Start Paths:** `./site/proxy.ts`; `./site/lib/security/`; `./site/platform/supabase/`; `./.env.example`; `./.env.local`; `./site/.env.local`; `./docs/architecture/stack.md`.
- **Scope:** edge/handler auth, CSRF/rate limits/RLS references, secret boundaries, and evidence limitations.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read approved helpers and classify data/security risk without printing secret values.
- **Forbidden Actions:** printing secrets, exposing service-role keys to clients, changing security controls, or making hosted calls.
- **Risk:** security, credentials, authorization, and data-access risk.
- **Expected Evidence:** auth source, secret boundary, data owner, selected conditional skills, and unverified hosted behaviour.
- **Next Decision:** route schema/RLS/ownership work to `db-migrations` only when live evidence matches.

##### D04 — environment
- **Chapter mapping:** `09`.
- **Goal:** Classify environment values and workspace boundaries without exposing private configuration.
- **Start Paths:** `./.env.example`; `./.env.local`; `./site/.env.local`; `./package.json`; `./pnpm-workspace.yaml`; `./START.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** configured shape versus local/private values, workspace packages, absent/stale claims, and safe next actions.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only classification and approved guide evidence updates in a separately authorized task.
- **Forbidden Actions:** syncing, printing, committing, or changing environment values; starting services by convention.
- **Risk:** secret, environment, and workspace risk.
- **Expected Evidence:** redacted, status-labelled environment map and named owner action.
- **Next Decision:** request separate environment/service approval only if evidence shows it is required.

##### D05 — APIs
- **Chapter mapping:** `04`.
- **Goal:** Trace an API outcome from route handler through authentication, data boundary, and proof limitation.
- **Start Paths:** `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md`; `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`.
- **Scope:** route ownership, request/security controls, persistence boundary, and source-level evidence.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only route mapping and explicitly approved source changes after ownership/gates are recorded.
- **Forbidden Actions:** hosted requests, migrations, secret exposure, or claiming API behaviour from a filename/path.
- **Risk:** API, authentication, data, and release risk.
- **Expected Evidence:** route source, auth/CSRF/data boundary, matching skills, and hosted-proof limitation.
- **Next Decision:** select `graph-impact` or `db-migrations` only when the corresponding trigger is evidenced.

##### D06 — Site UI/SEO/i18n/accessibility/performance
- **Chapter mapping:** `02`, `03`.
- **Goal:** Improve or assess Site UI, SEO, internationalization, accessibility, and performance through the route-to-pattern path.
- **Start Paths:** `./site/app/(site)/`; `./site/features/site/`; `./site/components/home/`; `./site/focss/site/`; `./site/i18n/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./docs/architecture/stack.md`.
- **Scope:** UI structure, metadata/SEO, i18n, responsive/accessibility states, and performance planning; `./site/` writes require the Site Write Gate.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** inspect the user-facing route, feature, component, FOCSS zone, and existing patterns; only an approved Core Product Write may change `./site/`.
- **Forbidden Actions:** Non-Core Artifacts under `./site/`, custom CSS systems, or browser/performance claims without evidence.
- **Risk:** product UI, accessibility, release, shared-code, and Site Write Gate risk.
- **Expected Evidence:** route-to-pattern trace, Visual Detail Checklist, selected styling/impact skills, and exact rendered/performance-proof limitation.
- **Next Decision:** route styling/token work to `focss-css` and shared impact to `graph-impact` when triggered.

##### D07 — UI polish/icons/FOCSS/motion/assets
- **Chapter mapping:** `03`.
- **Goal:** Complete a bounded visual improvement with existing icon, token, asset, and motion patterns.
- **Start Paths:** `./site/components/`; `./site/focss/`; `./site/public/`; `./scripts/generate-svg/`; `./docs/architecture/css.md`; `./docs/architecture/stack.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** existing Phosphor abstraction, alignment, spacing, responsive layout, loading/empty/error states, keyboard reachability, reduced motion, licensing, and asset ownership.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** inspect/reuse existing components and generation paths; approved Core Product Writes only after the Site Write Gate.
- **Forbidden Actions:** new icon libraries, custom CSS systems, external asset tooling, skipped state/accessibility/motion review, or Non-Core output under `./site/`.
- **Risk:** UI consistency, accessibility, asset licensing, motion, and product-source risk.
- **Expected Evidence:** Visual Detail Checklist, icon abstraction, asset source, motion-preference review, and rendered-proof limitation.
- **Next Decision:** select `focss-css` whenever styling, tokens, FOCSS, icons, or visual-contract evidence matches.

##### D08 — Admin
- **Chapter mapping:** `03`.
- **Goal:** Trace an Admin outcome through route, feature, authentication, data ownership, and operational risk.
- **Start Paths:** `./site/app/admin/`; `./site/features/admin/`; `./site/components/`; `./site/lib/admin/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`.
- **Scope:** internal routes, roles, catalog/inventory/plans/price books/themes, and Products versus Admin ownership.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only mapping or explicitly approved product edits with exact owned paths.
- **Forbidden Actions:** remote mutations, migrations, service-role exposure, or treating demo state as hosted state.
- **Risk:** Admin authorization, data, operational, and release risk.
- **Expected Evidence:** route, auth owner, database owner, Surface Status, and behaviour limitation.
- **Next Decision:** route schema/RLS to `db-migrations`, styling to `focss-css`, and shared impact to `graph-impact` when evidenced.

##### D09 — CRM versus customer-query operations
- **Chapter mapping:** `03`, `06`.
- **Goal:** Distinguish the local CRM browser workspace from Admin Database-backed customer-query operations.
- **Start Paths:** `./site/app/admin/crm/`; `./site/features/crm/`; `./site/app/admin/customer-queries/`; `./site/app/api/customer-queries/`; `./site/features/ops/`; `./docs/architecture/product-map.md`; `./docs/architecture/routes.md`.
- **Scope:** `oando-crm-storage` Zustand/browser persistence, customer-query API/data ownership, Surface Status, and missing end-to-end proof; the workflows remain separate.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only comparison and Coverage-Gap Admission recording.
- **Forbidden Actions:** combining the workflows or calling the CRM demo wired to Admin data without evidence.
- **Risk:** data ownership, customer operations, and overclaim risk.
- **Expected Evidence:** CRM `demo/local-only` status citing `oando-crm-storage`, separate customer-query status, owner, limitation, and next evidence source.
- **Next Decision:** record `present-but-unverified` or `unwired/absent` wherever End-to-End Evidence is missing.

##### D10 — catalog/configurator/quotes/inventory
- **Chapter mapping:** `03`, `04`.
- **Goal:** Trace catalog, configurator, quote, or inventory work to the correct Products/Admin owner and release path.
- **Start Paths:** `./site/lib/catalog/`; `./site/features/shared/catalog/`; `./site/app/(site)/products/`; `./site/app/(site)/quote-cart/`; `./site/app/admin/catalog/`; `./site/app/admin/inventory/`; `./site/app/api/configurator/`; `./site/platform/supabase/migrations/`.
- **Scope:** catalog/configurator/quote/inventory routes, assets, pricing, data ownership, and persistence.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only mapping or approved source changes after Products/Admin ownership selection.
- **Forbidden Actions:** seed, publish, storage, migration, or remote actions without Protected Command authorization.
- **Risk:** product data, pricing, inventory, release, asset, and database risk.
- **Expected Evidence:** Products/Admin owner, asset/release path, matching skills, and hosted-proof limitation.
- **Next Decision:** select `db-migrations` for schema/ownership and `focss-css` for styling only when triggered.

##### D11 — Planner
- **Chapter mapping:** `03`.
- **Goal:** Change or assess Planner while preserving its fork, canvas scale, state, and persistence assumptions.
- **Start Paths:** `./site/app/ooplanner/`; `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/`; `./site/hooks/Planner/`; `./site/store/Planner/`; `./site/server/Planner/`; `./site/platform/Planner/`; `./site/app/api/Planner/`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Planner route, canvas, Dockview shell, catalog, project persistence, and handoff; no Studio import or claim.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** exact Planner-owned Core Product Write only after route, ownership, skills, and Site Write Gate state are recorded.
- **Forbidden Actions:** Studio imports, cross-fork copying, persistence changes, or unapproved boundary scans/browser checks.
- **Risk:** fork boundary, persistence, canvas, data, and release risk.
- **Expected Evidence:** Planner-only source evidence; fork/persistence behaviour remains pending without authorized proof.
- **Next Decision:** select `planner-studio`; select `fork-boundaries` for fork/cross-import evidence, with other skills only when triggered.

##### D12 — Studio
- **Chapter mapping:** `03`.
- **Goal:** Change or assess Studio while preserving its separate furniture, descriptor, state, and canvas assumptions.
- **Start Paths:** `./site/app/oostudio/`; `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/`; `./site/hooks/Studio/`; `./site/store/Studio/`; `./site/server/Studio/`; `./site/platform/Studio/`; `./site/app/api/Studio/`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Studio authoring, furniture assets, descriptor publishing, AI helpers, Dockview/canvas behavior, and handoff; no Planner borrowing.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** exact Studio-owned Core Product Write only after route, ownership, skills, and Site Write Gate state are recorded.
- **Forbidden Actions:** Planner imports, cross-fork copying, remote publish, or unapproved checks.
- **Risk:** fork boundary, furniture data, descriptor release, AI advisory, and product-source risk.
- **Expected Evidence:** Studio-only source/release evidence, no-cross-import state, and unverified hosted behavior where applicable.
- **Next Decision:** select `planner-studio`; select `fork-boundaries` for fork changes, with database/styling/impact skills only when triggered.

##### D13 — AI/retrieval
- **Chapter mapping:** `03`.
- **Goal:** Assess server-side AI and retrieval as advisory behavior without overstating provider, deployment, or evaluation evidence.
- **Start Paths:** `./site/lib/ai/mastra/`; `./site/app/api/ai-advisor/`; `./site/app/api/Studio/ai/`; `./site/features/Studio/`; `./docs/architecture/stack.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Mastra, Bedrock, LanceDB, Orama, Fuse.js, embeddings, providers, advisory output, and evidence limits.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** Local-Evidence-first source mapping and approved guidance work; select `ai-retrieval` only if its canonical file exists.
- **Forbidden Actions:** provider calls, package installation, deployment/evaluation claims, or presenting absent `ai-retrieval` as installed.
- **Risk:** external provider, credentials, data, advisory-output, and unsupported-claim risk.
- **Expected Evidence:** advisory boundary, retrieval/provider source, missing-skill or unverified status, and next evidence source.
- **Next Decision:** if `./.kiro/skills/ai-retrieval/SKILL.md` is absent, record that gap and use Local Evidence plus every other matching skill.

##### D14 — databases/RLS/grants/rollback/mode-aware persistence
- **Chapter mapping:** `04`.
- **Goal:** Select Products or Admin ownership and preserve RLS, grants, rollback, and Mode-Aware Persistence.
- **Start Paths:** `./site/platform/supabase/migrations/`; `./site/platform/supabase/migrations.admin/`; `./site/platform/drizzle/schema/`; `./site/lib/Planner/plannerPersistenceMode.ts`; `./site/lib/catalog/furnitureCatalogMode.ts`; `./site/platform/Planner/data/`; `./site/platform/shared/data/furniture/`; `./site/inventory/descriptors/`; `./docs/database/schema.md`; `./docs/database/ops.md`; `./docs/database/drizzle.md`.
- **Scope:** database ownership, deployable migrations, RLS/grants, rollback, and production read-only filesystem constraints.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only schema/persistence planning; approved migration edits only in the correct migration path.
- **Forbidden Actions:** direct schema changes, missing `-- rollback`, dual writes, production disk writes, or apply commands without authorization.
- **Risk:** data loss, access control, persistence, migration, and release risk.
- **Expected Evidence:** Products/Admin owner, migration path, policies/grants/rollback, mode, and pending dry-run/hosted proof.
- **Next Decision:** select `db-migrations`; select `graph-impact` or Planner/Studio fork skills when their triggers are evidenced.

##### D15 — tests/fixtures/mocks/two Vitest lanes/Playwright
- **Chapter mapping:** `05`, `10`.
- **Goal:** Plan the narrowest validation across fixtures, mocks, both Vitest lanes, and Playwright without treating one lane as the full suite.
- **Start Paths:** `./tests/`; `./tests/unit/`; `./tests/integration/`; `./tests/e2e/`; `./tests/fixtures/`; `./tests/helpers/`; `./tests/tech-docs-generator/`; `./config/build/`; `./Testing-handbook.md`; `./package.json`.
- **Scope:** test sources, fixtures, helpers, two Vitest lanes, Playwright, command authorization, and evidence limitations.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only validation planning; exact checks only after current-session authorization and Hook Permission are established.
- **Forbidden Actions:** running tests/gates/builds/browser checks by convention or claiming unobserved output.
- **Risk:** quality, release, authorization, and evidence-integrity risk.
- **Expected Evidence:** exact command, root cwd, scope, authorization, Hook Decision, exit status, limitation, or pending state for both lanes/Playwright where applicable.
- **Next Decision:** select `verify-and-gate` only after explicit authorization and hook conditions are established.

##### D16 — scripts/commands
- **Chapter mapping:** `05`.
- **Goal:** Map a script or command from manifest entry through implementation and classify its operational risk.
- **Start Paths:** `./package.json`; `./scripts/`; `./scripts/run-ops.mjs`; `./scripts/ops-command-registry.mjs`; `./config/build/`; `./docs/architecture/scripts.md`; `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`.
- **Scope:** root script authority, dispatch, static checks, operations, and unavailable command claims.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only inspection and approved documentation correction in an authorized guide path.
- **Forbidden Actions:** executing a script, inventing a command, or recommending `pnpm run typecheck:scripts` while `./scripts/tsconfig.json` is absent.
- **Risk:** command, data, infrastructure, and validation risk.
- **Expected Evidence:** configured-versus-observed command status and exact authorization state.
- **Next Decision:** route validation planning to `verify-and-gate` only when permitted; keep unavailable commands excluded.

##### D17 — packages/dependencies/workspaces
- **Chapter mapping:** `05`.
- **Goal:** Distinguish declared, imported, configured, and observed packages without changing installation or workspace boundaries.
- **Start Paths:** `./package.json`; `./pnpm-workspace.yaml`; `./pnpm-lock.yaml`; `./site/`; `./site/tsconfig.json`; `./tech-docs-generator/`; `./tech-docs-generator/package.json`; `./config/build/`; `./docs/architecture/stack.md`.
- **Scope:** root workspace, absent `./site/package.json`, tech-docs sibling boundary, live imports, and package-addition approval.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only package/status mapping.
- **Forbidden Actions:** installing, changing manifests/lockfiles, adding packages, or moving `./tech-docs-generator/` into `./site/` or `./results/site/`.
- **Risk:** workspace, dependency, build, and boundary risk.
- **Expected Evidence:** declared/imported/configured status, no `./site/package.json`, exact sibling-boundary statement, and no installation claim.
- **Next Decision:** select `powers-skills-model` only for evidenced capability packaging; select `graph-impact` for shared dependency impact.

##### D18 — documentation/architecture/locked/legacy docs
- **Chapter mapping:** `07`.
- **Goal:** Maintain documentation in the canonical home while preserving locked guidance and legacy constraints.
- **Start Paths:** `./docs/architecture/`; `./docs/database/`; `./docs/governance/`; `./docs/governance/charter.md`; `./docs/governance/focss-stop-drift.md`; `./AGENTS.md`; `./DOC-MAP.md`; `./CONTENTS.md`; `./site/data/storage/`; `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`.
- **Scope:** durable docs, procedures, plans, guide work, locked paths, legacy paths, and Markdown/HTML provenance.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only evidence and explicitly owned guide work under an approved workstream.
- **Forbidden Actions:** editing `./docs/`, `./Agents/`, root files, HTML, or legacy source without exact authorization/provenance.
- **Risk:** authority, documentation, provenance, locked-path, and scope risk.
- **Expected Evidence:** canonical owner, lock/legacy state, placement, provenance, and correction decision.
- **Next Decision:** use an approved Workstream Subfolder for authored work; use D22 if ownership is unclear.

##### D19 — results/generated documents/agent work/blockers
- **Chapter mapping:** `07`, `09`.
- **Goal:** Place results, generated documents, Agent Work Reports, plans, and blockers in their correct homes without claiming an unobserved relocation.
- **Start Paths:** `./results/`; `./results/tests/`; `./results/site/`; `./results/site-ui/`; `./results/ops/`; `./generated-documents/`; `./agents-work/`; `./plans/`; `./plans/README.md`; `./Failures.md`; `./agent-reports/`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Artifact Class, Workstream/Purpose Subfolder, generator ownership, root legacy artifacts, active plans, and canonical blocker placement.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** classify and record placement; write only to an explicitly approved owned destination.
- **Forbidden Actions:** handwritten reports in `./results/`, new reports at the `./agents-work/` root, hand-editing generated output, duplicate blocker ledgers, or writing a non-core artifact under `./site/`.
- **Risk:** evidence integrity, discoverability, generated-output, and owner-control risk.
- **Expected Evidence:** Artifact Class, exact subfolder, filename pattern, producer, authored/generated state, rejected placements, and observed placement or pending state.
- **Next Decision:** select the producer-owned subfolder before any Output-Producing Task write; keep root artifacts `legacy/owner-review pending` when no assignment is observed.

##### D20 — MCP/skills/Powers/Agents
- **Chapter mapping:** `08`.
- **Goal:** Route repository-local skills, Powers, MCP schemas/configuration, and Agent guidance using the least powerful evidenced capability.
- **Start Paths:** `./.kiro/`; `./.kiro/skills/`; `./.kiro/agents/`; `./.kiro/mcp/`; `./.kiro/settings/mcp.json`; `./.kiro/hooks/`; `./skills-lock.json`; `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`.
- **Scope:** conditional skill routing, Kiro Markdown inventory, Power registry, MCP schema/configuration/connection states, Agent roster records, and hook boundaries.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only inventory and prose guidance in separately authorized skill/guide paths.
- **Forbidden Actions:** Power activation, external MCP configuration/connection, hook changes, Agent-definition changes, or treating path presence as runtime availability.
- **Risk:** capability, external access, credential, protected-path, and enforcement risk.
- **Expected Evidence:** static classification plus installed/connected state only when separately observed; runtime loading remains unclaimed.
- **Next Decision:** use Local Evidence first; select `powers-skills-model` for capability-packaging work and reject unconfirmed Powers/MCPs.

##### D21 — Vercel/Worker/R2/backups/observability/incidents
- **Chapter mapping:** `06`.
- **Goal:** Plan Vercel, Cloudflare Worker, R2, Supabase, backup, observability, deployment, and incident work as read-only bounded operations.
- **Start Paths:** `./vercel.json`; `./workers/oando-worker-proxy/`; `./config/observability/`; `./.github/workflows/supabase-backup-r2.yml`; `./OPERATIONS_RUNBOOK.md`; `./scripts/`; `./Failures.md`; `./site/instrumentation.ts`; `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`.
- **Scope:** target, owner, impact, recovery/rollback, observability, backup, deployment, and incident boundaries.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only planning and evidence classification.
- **Forbidden Actions:** deployment, backup, Docker/local-service, remote mutation, external access, or declaring a gate failure without exact output.
- **Risk:** infrastructure, data, release, observability, backup, and external-system risk.
- **Expected Evidence:** target, owner, exact pending Protected Command, impact, rollback/recovery, and unverified external state.
- **Next Decision:** select `verify-and-gate` only after validation authorization; keep deployment/backup/remote work separately approved.

##### D22 — unknown-area discovery
- **Chapter mapping:** `01`, `08`, `07`.
- **Goal:** Discover the canonical owner and bounded next action for an omitted or unfamiliar repository area.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./agents-work/oando-repository-guide/README.md`; `./plans/README.md`; `./.kiro/skills/repo-map/SKILL.md`; `./Failures.md`.
- **Scope:** Local Evidence inventory, authority comparison, risk, candidate card/skill, and gap admission; no new category by guesswork.
- **Evidence Steps:** common five-step order above.
- **Allowed Actions:** read-only discovery and proposed Domain Index/skill update in a separately authorized guidance task.
- **Forbidden Actions:** creating a category, package, Power, MCP, or runtime implementation from guesswork.
- **Risk:** scope, authority, capability, hidden-constraint, and owner-decision risk.
- **Expected Evidence:** evidence inventory, canonical owner, selected/rejected skills, Coverage-Gap Admission, and next decision.
- **Next Decision:** propose a new card or Package Skill only through an approved guidance task after evidence and owner decision.

#### Exact classifier rows — one row for each D01–D22 card

The classifier is a prose routing index, not a runtime scanner. Each row is additive: all skills whose trigger is evidenced are selected, and a no-match row selects Local Evidence with the reason. The command column classifies proposed commands before any execution; this current task runs none.

| Card | Trigger | First Local Evidence | Selected Package Skills when triggered | Command classification | Completion evidence |
|---|---|---|---|---|---|
| D01 | Repository authority, orientation, or path discovery | `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./plans/README.md` | `repo-map`; `graph-impact` only when shared impact is evidenced | Read-only inspection first; no command implied | Route Record with authority order, exact paths, selected/rejected skills, and next decision |
| D02 | Onboarding, initialization, environment, local development, or debugging | `./START.md`; `./AGENTS.md`; `./package.json`; `./config/build/` | `repo-map` | Read-only inspection; install, dev, build, test, and local-service commands are Protected Commands | root-working-directory/`pnpm` boundary, environment/status map, or pending owner validation |
| D03 | Authentication, secrets, CSRF, rate limits, RLS, or security boundary | `./site/proxy.ts`; `./site/lib/security/`; `./site/platform/supabase/`; `./.env.example` | `repo-map`; `db-migrations` for schema/RLS/ownership; `graph-impact` for shared security code | Read-only inspection; hosted, security, and secret actions are protected or separate | auth source, secret boundary, data owner, and unverified hosted behavior |
| D04 | Environment values, workspace shape, or local configuration | `./.env.example`; `./.env.local`; `./site/.env.local`; `./pnpm-workspace.yaml` | `repo-map` | Read-only inspection; sync and service commands are pending | redacted, status-labelled environment map and next owner action |
| D05 | Route handler, API catalog, authentication, or data-flow discovery | `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md` | `repo-map`; `graph-impact` for shared/API impact; `db-migrations` for schema ownership | Read-only inspection; API tests, builds, and hosted calls are Protected Commands | route source, auth/data boundary, selected skills, and hosted-proof limitation |
| D06 | Marketing interface, metadata, i18n, accessibility, or performance | `./site/app/(site)/`; `./site/features/site/`; `./site/components/home/`; `./site/focss/site/` | `repo-map`; `focss-css`; `graph-impact` for shared UI | Read-only inspection; browser/UI/performance checks are Protected Commands unless an exact eligible check is named | route-to-pattern trace, Visual Detail Checklist, and rendered/performance-proof limitation |
| D07 | Visual detail, icon, token, asset, motion, or FOCSS change | `./site/components/`; `./site/focss/`; `./site/public/`; `./scripts/generate-svg/` | `focss-css`; `graph-impact` for shared components; `repo-map` | Read-only inspection; FOCSS/token/generator/browser checks are protected or pending | icon abstraction, alignment/state/accessibility/motion review, asset source, and proof limitation |
| D08 | Internal Admin route, role, feature, or operational data flow | `./site/app/admin/`; `./site/features/admin/`; `./site/lib/admin/`; `./docs/architecture/routes.md` | `repo-map`; `db-migrations`; `focss-css`; `graph-impact` when each trigger is evidenced | Read-only inspection; mutations and database actions are Protected Commands | route/auth source, Products-or-Admin owner, Surface Status, and behavior limitation |
| D09 | CRM, customer query, or unwired-surface assessment | `./site/app/admin/crm/`; `./site/features/crm/`; `./site/app/admin/customer-queries/`; `./site/app/api/customer-queries/` | `repo-map`; `db-migrations` for Admin data work | Read-only inspection; do not combine workflows or claim hosted behavior | `demo/local-only` CRM status citing `oando-crm-storage`, separate query status, and gap card |
| D10 | Catalog, configurator, quote, pricing, inventory, or asset release | `./site/lib/catalog/`; `./site/features/shared/catalog/`; `./site/app/(site)/products/`; `./site/app/admin/inventory/` | `repo-map`; `db-migrations`; `focss-css`; `graph-impact` when triggered | Read-only inspection; seed, publish, storage, migration, and browser actions are Protected Commands | Products/Admin owner, release path, exact scope, and hosted-proof limitation |
| D11 | Planner route, canvas, catalog, persistence, or handoff | `./site/app/ooplanner/`; `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/` | `planner-studio`; `fork-boundaries`; `graph-impact`; `db-migrations`; `focss-css` when triggered | Read-only inspection; boundary scan, browser, persistence, tests, and builds are Protected Commands | Planner-only source evidence, fork-boundary state, and pending proof where unobserved |
| D12 | Studio route, furniture, descriptor, canvas, catalog, or handoff | `./site/app/oostudio/`; `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/` | `planner-studio`; `fork-boundaries`; `graph-impact`; `db-migrations`; `focss-css` when triggered | Read-only inspection; publish, provider, browser, persistence, tests, and builds are Protected Commands | Studio-only source/release evidence, no-cross-import state, and pending hosted proof |
| D13 | Mastra, Bedrock, LanceDB, Orama, Fuse.js, embeddings, retrieval, provider, or advisory output | `./site/lib/ai/mastra/`; `./site/app/api/ai-advisor/`; `./site/app/api/Studio/ai/`; `./docs/architecture/stack.md` | `repo-map`; `ai-retrieval` only if `./.kiro/skills/ai-retrieval/SKILL.md` exists; every other matching skill; `powers-skills-model` only for evidenced capability packaging | Read-only inspection; provider, package, build, test, and external actions are Protected or separate | advisory boundary, source evidence, missing-skill state, and no unsupported deployment/evaluation claim |
| D14 | Schema, SQL, migration, ownership, persistence, RLS, grants, or rollback | `./site/platform/supabase/migrations/`; `./site/platform/supabase/migrations.admin/`; `./site/platform/drizzle/schema/`; persistence selectors | `db-migrations`; `graph-impact`; `planner-studio` and `fork-boundaries` when fork persistence is implicated | Read-only inspection; dry runs, applies, types, seeds, and remote DB actions are Protected Commands | Products/Admin owner, migration path, RLS/grants/rollback, mode, and pending hosted proof |
| D15 | Test, fixture, mock, browser, coverage, or validation planning | `./tests/`; `./tests/unit/`; `./tests/integration/`; `./tests/e2e/`; `./package.json` | `repo-map`; `verify-and-gate` only after exact authorization and Hook Permission; `graph-impact` when triggered | Read-only inspection; tests, browser runners, coverage, builds, and gates are Protected Commands | both Vitest lanes/Playwright as applicable, exact command, root cwd, authorization, hook, exit status, scope, and limitation |
| D16 | Script, command, CI, or operational dispatch discovery | `./package.json`; `./scripts/`; `./scripts/run-ops.mjs`; `./scripts/ops-command-registry.mjs` | `repo-map`; `graph-impact`; `verify-and-gate` only for authorized validation planning | Read-only inspection; operational scripts and commands are Protected or pending | configured-versus-observed status, exact command classification, and unavailable `typecheck:scripts` state |
| D17 | Package, import, manifest, lockfile, dependency, or workspace question | `./package.json`; `./pnpm-workspace.yaml`; `./pnpm-lock.yaml`; `./site/tsconfig.json`; `./tech-docs-generator/package.json` | `repo-map`; `graph-impact`; `powers-skills-model` only for capability packaging | Read-only inspection; install, build, lockfile, and workspace changes are Protected or separate | declared/imported/configured status, no `./site/package.json`, and sibling-boundary evidence |
| D18 | Durable docs, architecture, procedure, plan, locked, or legacy path | `./docs/architecture/`; `./docs/database/`; `./docs/governance/`; `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md` | `repo-map`; `focss-css` when locked FOCSS guidance is implicated | Read-only inspection; locked writes and documentation checks require exact authorization/provenance | canonical owner, lock/legacy state, placement, provenance, and correction decision |
| D19 | Artifact placement, report, result, generated output, active plan, or blocker | `./results/`; `./results/tests/`; `./results/site/`; `./generated-documents/`; `./agents-work/`; `./plans/README.md` | `repo-map`; Local Evidence from `./plans/README.md` for plan coordination | Read-only inspection; producer commands are classified separately | Artifact Class, exact subfolder, filename pattern, producer, authored/generated state, rejected placements, and observed/pending placement |
| D20 | Kiro skill, steering, Agent, hook, MCP, Power, or capability-packaging question | `./.kiro/`; `./.kiro/skills/`; `./.kiro/agents/`; `./.kiro/mcp/`; `./.kiro/settings/mcp.json` | `powers-skills-model`; `repo-map` | Read-only inspection; hook/settings/MCP changes and Power activation are Separate Approval Work | static classification, registry/configuration/connection distinction, and runtime limitation |
| D21 | Vercel, Worker, R2, backup, observability, deployment, or incident work | `./vercel.json`; `./workers/oando-worker-proxy/`; `./config/observability/`; `./OPERATIONS_RUNBOOK.md`; `./Failures.md` | `repo-map`; `db-migrations` when DB ownership is implicated; `verify-and-gate` only after authorization | Read-only inspection; deploy, backup, Docker/local-service, remote, and incident commands are Protected Commands | target, owner, impact, exact pending command, rollback/recovery, and unverified external state |
| D22 | Omitted, unfamiliar, or newly discovered repository area | `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./.kiro/skills/repo-map/SKILL.md`; `./plans/README.md` | `repo-map`; `powers-skills-model` only for an evidenced capability question; every later match is conditional | Read-only inspection first; no new category, package, Power, MCP, or runtime action by guesswork | evidence inventory, canonical owner, risk, Coverage-Gap Admission, and proposed next decision |

#### Card-count, classifier-count, and evidence-honesty decisions

1. The final set is exactly these 22 IDs, with no added, merged, renamed, or replacement card: `D01 repository map`; `D02 initialization/debugging`; `D03 auth/security/secrets`; `D04 environment`; `D05 APIs`; `D06 Site UI/SEO/i18n/accessibility/performance`; `D07 UI polish/icons/FOCSS/motion/assets`; `D08 Admin`; `D09 CRM versus customer-query operations`; `D10 catalog/configurator/quotes/inventory`; `D11 Planner`; `D12 Studio`; `D13 AI/retrieval`; `D14 databases/RLS/grants/rollback/mode-aware persistence`; `D15 tests/fixtures/mocks/two Vitest lanes/Playwright`; `D16 scripts/commands`; `D17 packages/dependencies/workspaces`; `D18 documentation/architecture/locked/legacy docs`; `D19 results/generated documents/agent work/blockers`; `D20 MCP/skills/Powers/Agents`; `D21 Vercel/Worker/R2/backups/observability/incidents`; `D22 unknown-area discovery`.
2. The chapter decisions are exactly: D01→`01`; D02→`09`; D03→`04`; D04→`09`; D05→`04`; D06→`02`,`03`; D07→`03`; D08→`03`; D09→`03`,`06`; D10→`03`,`04`; D11→`03`; D12→`03`; D13→`03`; D14→`04`; D15→`05`,`10`; D16→`05`; D17→`05`; D18→`07`; D19→`07`,`09`; D20→`08`; D21→`06`; D22→`01`,`08`,`07`.
3. The classifier has exactly 22 rows, one for each ID above, and preserves trigger, first Local Evidence, additive selected skills, command classification, and completion evidence. A classifier row is not a runtime scanner or proof of skill loading.
4. Every Start Path above is an exact path from the approved baseline. A future absent/stale/private/generated/legacy path is recorded as a gap or explicit path discovery; no path is turned into a wired/complete claim.
5. The D09 CRM browser workspace remains `demo/local-only` while the observed `oando-crm-storage` key is the evidence boundary; customer-query operations remain separately classified as an Admin Database-backed surface. Marketing `/planner*` pages remain distinct from interactive `/ooplanner`; `/admin/product-studio` and the interactive legacy `/planner/*` tree remain `unwired/absent` until live route evidence changes those statuses.
6. D13 treats AI/retrieval output as advisory and records the absent `ai-retrieval` Package Skill when `./.kiro/skills/ai-retrieval/SKILL.md` is not observed. Static imports, schemas, or path presence do not prove provider calls, deployment, evaluation, or runtime behavior.
7. D14 preserves Products versus Admin ownership, deployable migration locations, RLS/grants/rollback, mode-aware persistence, and the production read-only filesystem constraint; no database action is authorized here.
8. D15 records both Vitest lanes and Playwright where applicable, but no test/gate/browser/build command is run here. D16 records `pnpm run typecheck:scripts` as unavailable while `./scripts/tsconfig.json` is absent and excludes it from validation.
9. D17 preserves `./tech-docs-generator/` as a root-level sibling of `./site/`, `./generated-documents/` as separate generator output, and `./results/site/` as Machine Evidence; no relocation is implied.
10. D18–D21 preserve Locked Path, artifact-placement, Site Write, operations, backup, deployment, observability, MCP, Power, and external-system approval boundaries. Any such implementation is Separate Approval Work.

#### Task 3.2 handoff record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Reconcile exactly 22 D01–D22 card definitions, their exact chapter mappings, and exactly 22 classifier rows in the authorized Tasks artifact while preserving exact Start Paths/discovery labels and evidence-honesty constraints.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; `V/R-01` is the next owner for read-only Tasks-artifact reconciliation; the Repository Owner is the next decision owner for the downstream README path and any scope expansion. No fifth role or runtime loading/enforcement claim is introduced.
- **Scope:** Only the static task 3.2 record in `./.kiro/specs/oando-master/tasks.md`; the 22 definitions, common card contract, classifier rows, count/mapping invariants, README authorization state, and handoff. No README/card-instance write or other path action.
- **Paths Read and Paths Changed:** Read the current user request; `./AGENTS.md`; `./Agents/01-standard.md`; `./.kiro/skills/oando-master/SKILL.md`; `./.kiro/skills/repo-map/SKILL.md`; `./.kiro/specs/oando-master/.config.kiro`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; `./.kiro/specs/oando-master/tasks.md`; and the intended downstream `./agents-work/oando-repository-guide/README.md` as read-only context. Changed exactly `./.kiro/specs/oando-master/tasks.md`; no README, guide chapter, HTML/CSS, protected path, skill, hook/settings/MCP, package/script, plan/report/result/generated-document, `./site/`, application/runtime, database, deployment/backup, Power, MCP, or other path changed.
- **Route Record:** Outcome is a static D01–D22 Domain Index/classifier reconciliation; domain is repository guidance and Kiro routing (`D01` primary with `D20` governance context); first evidence is the current request, requirements §20, design §7/§18, task 3.1 schema, and the existing Tasks artifact; selected skills are `oando-master` (mandatory first router) and `repo-map` (orientation/path evidence); `powers-skills-model` is conditional only if capability packaging becomes part of the task; all other skills are rejected unless their triggers are evidenced. Workflow Mode is `Supervised`; risk is documentation, scope, authorization, artifact-placement, and evidence-integrity risk; no command is proposed; Artifact Class is authored `Active Plan / Downstream Tasks Artifact` at `./.kiro/specs/oando-master/tasks.md`, not generated; Locked Path Gate is explicitly owner-authorized only for this exact Tasks artifact; Site Write Gate is not applicable; downstream README state is `pending-owner`/`not-observed`; validation state is `not-run` for commands and static read-back only for this record.
- **Evidence:** Requirements 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 8.9, 9.1–9.7, 20.1–20.8, and 30.22–30.23; Design §7 verified-path/classifier mapping and §18 task shape; task 3.1 common schema; the exact 22 definitions and 22-row classifier record above; and static read-back of the changed Tasks artifact. This evidence establishes a prose/task record only.
- **Decisions:** Preserve exactly the 22 final IDs and outcomes, the exact chapter mapping list, one classifier row per ID, additive routing, exact baseline Start Paths/discovery fallback, Surface Status enum and Coverage-Gap rule, CRM/query distinction, Planner/marketing distinction, AI advisory/missing-skill rule, four-slot serial model, and no-runtime-claim boundary. Keep the downstream README write pending-owner/not-observed and do not create a copy or claim that README/card instances changed.
- **Coverage Gaps:** README implementation and rendered card instances are `pending-owner`/`not-observed`; Markdown-to-HTML synchronization/projection remains unresolved; runtime skill loading/routing, automatic Agent spawning, universal Pre-Action Enforcement, installed/connected Power/MCP state, hosted persistence, rendered interaction, command results, and any external/global Kiro coverage remain `not-observed` or separate approval work. Any absent/stale Start Path requires future live recheck and Coverage-Gap Admission.
- **Validation Command:** `none` — the current request forbids commands, scripts, generators, tests, gates, builds, typechecks, package actions, browser/local-service actions, database/deployment/backup actions, Power activation, MCP connection, and command-based validation. Only read-only inspection and authorized Tasks-artifact read-back are permitted.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for the exact existing `./.kiro/specs/oando-master/tasks.md` write. The intended `./agents-work/oando-repository-guide/README.md` path lacks current owner authorization; no README/card-instance or other path write is authorized.
- **Hook Decision:** `not-observed` for a universal pre-action decision; no command hook was invoked. Command-specific hook evidence is not generalized to reads, writes, deletes, delegation, or handoffs.
- **Exit Status:** `not-observed` — no command or runtime action was executed; static Tasks-artifact publication/read-back is the only applicable evidence.
- **Validation Limitation:** Static task prose, path lists, mappings, counts, and read-back cannot prove README modification, card rendering, synchronization, runtime routing/skill loading, Agent spawning, universal enforcement, command success, rendered behavior, hosted persistence, connected MCP, installed Power, or relocation.
- **Blockers:** No hard blocker within the authorized Tasks-artifact scope. The downstream README/card-instance work is pending-owner rather than complete; do not write root `./Failures.md` without exact authorization. Stop on conflict, missing authorization, or scope expansion.
- **Next Action:** `V/R-01` performs read-only reconciliation of the changed Tasks artifact, including the exact 22 IDs, chapter map, row count, README authorization state, and changed-path audit. The Repository Owner must separately name and authorize `./agents-work/oando-repository-guide/README.md` before any downstream card-instance write; until then no other path may be changed.
- **Status:** `pending-owner` for Task 3.2 implementation in the downstream README; `complete` only for this static Tasks-artifact reconciliation after read-back; runtime/enforcement and rendered/hosted states remain `not-observed`/`guidance-only`.

- **Requirements:** 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 8.9, 9.1–9.7, 20.1–20.8, 30.22–30.23.

  - [x] 3.3 Add the Coverage Audit, Surface Status enum, and Coverage-Gap Admission Card

Provide 22 audit rows with card ID, outcome, chapter, verified paths, status, evidence sources, limitation, and next decision. Limit Surface Status to `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, and `legacy`; propagate gaps to responses and Completion Records. Preserve the CRM `oando-crm-storage` distinction and separately classify customer-query operations.

- **Requirements:** 4.1–4.7, 19.1–19.7, 20.1–20.8, 26.1–26.7, 30.16, 31.3.

### Task 3.3 static Coverage Audit, Surface Status, and gap-card reconciliation

**Task identity and publication boundary:** `oando-master / 3.3`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is a static Tasks-artifact record. The current request authorizes exactly one write to `./.kiro/specs/oando-master/tasks.md`. The downstream `./agents-work/oando-repository-guide/README.md` path remains read-only, owner-gated, and `pending-owner`; no README, guide chapter, HTML/CSS, runtime, or other path is changed or claimed changed.

**Implementation state:** `complete` for this static Tasks-artifact reconciliation after read-back; `pending-owner`/`not-observed` for README rows, rendered guide content, runtime Surface Status, and end-to-end behavior. The audit rows below are the approved 22-card baseline and do not by themselves prove that a guide row exists, a route is wired, or a capability is complete.

#### Coverage Audit contract

The Coverage Audit contains exactly **22 rows**, one each for `D01` through `D22`, with no added, merged, renamed, or replacement card. Every row contains these fields in the table: **Card ID; Outcome; Chapter; Verified Paths; Status; Evidence Sources; Limitation; Next Decision**. The `Verified Paths` column reproduces the exact verified-start-path baseline from Requirements §20 and Design §7.2. A path listed in this audit is a starting location, not proof that the path is present, current, generated correctly, connected, or end-to-end wired.

The audit-row `Status` field uses only the Surface Status enum below. When one card covers distinct named surfaces, each named surface receives its own enum value in the same row; this is required for D09 and preserves the CRM/customer-query boundary. Lifecycle values such as `pending-owner`, `not-observed`, and `complete` belong to task records and are not additional Surface Status values.

| Card ID | Outcome | Chapter | Verified Paths (baseline; exact start locations) | Status | Evidence Sources (static) | Limitation | Next Decision |
|---|---|---:|---|---|---|---|---|
| D01 | Map repository authority and the first safe inspection path | 01 | `./START.md`<br>`./AGENTS.md`<br>`./docs/architecture/layout.md`<br>`./docs/architecture/stack.md`<br>`./docs/architecture/routes.md`<br>`./docs/architecture/product-map.md`<br>`./agents-work/oando-repository-guide/README.md`<br>`./agents-work/oando-repository-guide/markdown/01-repository-map.md`<br>`./plans/README.md` | `present-but-unverified` | Requirements §20 D01; Design §7.2 D01; Tasks D01 definition and classifier row | Authority and path text are static evidence; no runtime router, skill loading, or current guide-row proof is established. | Select the next Domain Index outcome or route an unfamiliar request to D22 after read-only evidence discovery. |
| D02 | Initialize, develop, and debug safely | 09 | `./START.md`<br>`./AGENTS.md`<br>`./package.json`<br>`./site/`<br>`./config/build/`<br>`./Failures.md`<br>`./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md` | `present-but-unverified` | Requirements §20 D02; Design §7.2 D02; Tasks D02 definition and classifier row | Package/script declarations and path presence do not prove setup, service, build, test, or debugging success; no command output is observed. | Select the smallest read-only diagnostic and obtain exact owner authorization before any service, test, build, or package command. |
| D03 | Trace authentication, security, and secrets without weakening controls | 04 | `./site/proxy.ts`<br>`./site/lib/security/`<br>`./site/platform/supabase/`<br>`./.env.example`<br>`./.env.local`<br>`./site/.env.local`<br>`./docs/architecture/stack.md` | `present-but-unverified` | Requirements §20 D03 and §4; Design §7.2 D03; Tasks D03 definition and classifier row | Static source locations do not establish hosted authentication, authorization, RLS, secret loading, or security behavior; private environment values remain uninspected. | Trace the relevant helper and data boundary read-only, then request separately approved security or hosted validation only if needed. |
| D04 | Classify environment state and workspace boundaries safely | 09 | `./.env.example`<br>`./.env.local`<br>`./site/.env.local`<br>`./package.json`<br>`./pnpm-workspace.yaml`<br>`./START.md`<br>`./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md` | `present-but-unverified` | Requirements §20 D04 and §6.1–§6.4; Design §7.2 D04; Tasks D04 definition and classifier row | Configured shape is not proof that values are loaded or valid; local/private values must not be exposed or treated as shared evidence. | Preserve the private boundary and record only a redacted status map; ask the owner before synchronization or service startup. |
| D05 | Locate and assess APIs from route through auth, data, and proof | 04 | `./site/app/api/`<br>`./site/lib/apiCatalog.ts`<br>`./site/proxy.ts`<br>`./docs/architecture/routes.md`<br>`./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md` | `present-but-unverified` | Requirements §20 D05 and §3–§6; Design §7.2 D05; Tasks D05 definition and classifier row | A route or catalog entry does not prove request controls, persistence, hosted behavior, or end-to-end response correctness. | Trace the route, auth, and data boundary; classify any test, build, hosted request, or database action as protected before proposing it. |
| D06 | Improve Site UI, SEO, i18n, accessibility, or performance through the existing source layers | 02, 03 | `./site/app/(site)/`<br>`./site/features/site/`<br>`./site/components/home/`<br>`./site/focss/site/`<br>`./site/i18n/`<br>`./docs/architecture/routes.md`<br>`./docs/architecture/product-map.md`<br>`./docs/architecture/stack.md` | `present-but-unverified` | Requirements §20 D06 and §3; Design §7.2 D06; Tasks D06 definition and classifier row | Static paths do not prove rendered layout, accessibility, loading/empty/error states, responsive behavior, or performance. | Apply the Site Write Gate and Visual Detail Checklist before a Core Product Write; keep browser/rendered evidence pending unless authorized and observed. |
| D07 | Polish UI, icons, alignment, FOCSS, motion, or assets using existing abstractions | 03 | `./site/components/`<br>`./site/focss/`<br>`./site/public/`<br>`./scripts/generate-svg/`<br>`./docs/architecture/css.md`<br>`./docs/architecture/stack.md`<br>`./agents-work/oando-repository-guide/markdown/03-product-domains.md` | `present-but-unverified` | Requirements §20 D07 and §3.3; Design §7.2 D07; Tasks D07 definition and classifier row | Existing icon/token/asset paths do not prove visual alignment, motion preference, licensing, generated output, or interaction states. | Reuse the existing Phosphor/FOCSS/generation patterns and obtain exact visual or generator evidence only through an approved check. |
| D08 | Trace an Admin outcome through route, feature, auth, data ownership, and operational risk | 03 | `./site/app/admin/`<br>`./site/features/admin/`<br>`./site/components/`<br>`./site/lib/admin/`<br>`./docs/architecture/routes.md`<br>`./docs/architecture/product-map.md` | `present-but-unverified`; `/admin/product-studio`: `unwired/absent` | Requirements §20 D08 and §4.5; Design §7.2 D08; Tasks D08 definition and classifier row | Route/source presence does not prove roles, authorization, persistence, or hosted behavior; `/admin/product-studio` remains absent/unwired until live route evidence changes it. | Select Products/Admin ownership and auth evidence before edits; keep `/admin/product-studio` as a gap unless current live evidence establishes a route. |
| D09 | Distinguish CRM browser workspace from customer-query operations | 03, 06 | `./site/app/admin/crm/`<br>`./site/features/crm/`<br>`./site/app/admin/customer-queries/`<br>`./site/app/api/customer-queries/`<br>`./site/features/ops/`<br>`./docs/architecture/product-map.md`<br>`./docs/architecture/routes.md` | CRM: `demo/local-only`; customer-query operations: `present-but-unverified` | Requirements §4.1–§4.3 and §20 D09; Design §7.2 D09 and §7.3; Tasks D09 definition and classifier row, including `oando-crm-storage` | `oando-crm-storage` identifies the CRM browser/Zustand persistence boundary only; it is not Admin Database evidence. Customer-query routes/API/operations are a separate Admin Database-backed surface, and no end-to-end query proof is established here. | Keep the workflows separate. Use live CRM browser storage evidence and the customer-query API/Admin Database boundary as different next evidence sources; update each status independently before any `wired` claim. |
| D10 | Trace catalog, configurator, quotes, or inventory to the correct owner and release path | 03, 04 | `./site/lib/catalog/`<br>`./site/features/shared/catalog/`<br>`./site/app/(site)/products/`<br>`./site/app/(site)/quote-cart/`<br>`./site/app/admin/catalog/`<br>`./site/app/admin/inventory/`<br>`./site/app/api/configurator/`<br>`./site/platform/supabase/migrations/` | `present-but-unverified` | Requirements §20 D10 and §6; Design §7.2 D10; Tasks D10 definition and classifier row | Source paths do not prove Products/Admin ownership in the deployed environment, pricing/inventory persistence, publish/storage behavior, or hosted quote flow. | Select Products versus Admin ownership and the release path; keep seed, publish, storage, migration, and browser evidence protected/pending. |
| D11 | Change or assess Planner while preserving the fork, canvas, state, and persistence assumptions | 03 | `./site/app/ooplanner/`<br>`./site/features/Planner/`<br>`./site/components/Planner/`<br>`./site/lib/Planner/`<br>`./site/hooks/Planner/`<br>`./site/store/Planner/`<br>`./site/server/Planner/`<br>`./site/platform/Planner/`<br>`./site/app/api/Planner/`<br>`./agents-work/oando-repository-guide/markdown/03-product-domains.md` | Planner: `present-but-unverified`; interactive legacy `/planner/*`: `unwired/absent`; marketing `/planner*`: `present-but-unverified` | Requirements §4.5–§4.6 and §20 D11; Design §7.2 D11 and §7.3; Tasks D11 definition and classifier row | Planner paths do not prove boundary compliance, canvas behavior, persistence, or hosted state. The interactive legacy `/planner/*` tree remains distinct from marketing `/planner*` pages and `/ooplanner`; no live route evidence changes these statuses in this task. | Route Planner work to `planner-studio`, add `fork-boundaries` for fork evidence, and keep marketing `/planner*`, interactive legacy `/planner/*`, and `/ooplanner` separately classified. |
| D12 | Change or assess Studio while preserving its separate furniture, descriptor, state, and canvas assumptions | 03 | `./site/app/oostudio/`<br>`./site/features/Studio/`<br>`./site/components/Studio/`<br>`./site/lib/Studio/`<br>`./site/hooks/Studio/`<br>`./site/store/Studio/`<br>`./site/server/Studio/`<br>`./site/platform/Studio/`<br>`./site/app/api/Studio/`<br>`./agents-work/oando-repository-guide/markdown/03-product-domains.md` | `present-but-unverified` | Requirements §20 D12 and §5; Design §7.2 D12; Tasks D12 definition and classifier row | Studio source paths do not prove furniture/descriptor release, AI behavior, canvas interaction, fork isolation, or hosted persistence. | Route Studio work to `planner-studio`, add `fork-boundaries` for fork evidence, and keep source/path presence separate from rendered, release, and hosted proof. |
| D13 | Assess AI and retrieval as advisory output without overstating provider or deployment evidence | 03 | `./site/lib/ai/mastra/`<br>`./site/app/api/ai-advisor/`<br>`./site/app/api/Studio/ai/`<br>`./site/features/Studio/`<br>`./docs/architecture/stack.md`<br>`./agents-work/oando-repository-guide/markdown/03-product-domains.md` | `present-but-unverified` | Requirements §5.4–§5.7 and §20 D13; Design §7.2 D13; Tasks D13 definition and classifier row | Static imports/routes do not prove provider calls, deployment, evaluation, embeddings, or user-applied advisory behavior; `./.kiro/skills/ai-retrieval/SKILL.md` is absent/unobserved unless separately evidenced. | Record the missing AI Package Skill when absent, use Local Evidence and matching skills, and require separate approval for provider/package/external work. |
| D14 | Select database ownership and preserve RLS, grants, rollback, and Mode-Aware Persistence | 04 | `./site/platform/supabase/migrations/`<br>`./site/platform/supabase/migrations.admin/`<br>`./site/platform/drizzle/schema/`<br>`./site/lib/Planner/plannerPersistenceMode.ts`<br>`./site/lib/catalog/furnitureCatalogMode.ts`<br>`./site/platform/Planner/data/`<br>`./site/platform/shared/data/furniture/`<br>`./site/inventory/descriptors/`<br>`./docs/database/schema.md`<br>`./docs/database/ops.md`<br>`./docs/database/drizzle.md` | `present-but-unverified` | Requirements §6.5–§6.8 and §20 D14; Design §7.2 D14; Tasks D14 definition and classifier row | Schema/source paths do not prove remote database state, RLS/grants/policies, rollback execution, selector behavior, or production persistence; no database action is authorized. | Select Products/Admin ownership, migration path, RLS/grants/rollback, and persistence mode before any separately approved schema or apply work. |
| D15 | Plan tests, fixtures, mocks, both Vitest lanes, and Playwright without treating a plan as a pass | 05, 10 | `./tests/`<br>`./tests/unit/`<br>`./tests/integration/`<br>`./tests/e2e/`<br>`./tests/fixtures/`<br>`./tests/helpers/`<br>`./tests/tech-docs-generator/`<br>`./config/build/`<br>`./Testing-handbook.md`<br>`./package.json` | `present-but-unverified` | Requirements §20 D15 and §10; Design §7.2 D15; Tasks D15 definition and classifier row | Test sources/configuration do not prove any test result; no command ran, and one Vitest lane is not the full suite. | Obtain exact owner authorization and Hook Permission for the narrowest check; record both Vitest lanes and Playwright only when applicable and observed. |
| D16 | Inspect scripts and command registry without inventing or executing commands | 05 | `./package.json`<br>`./scripts/`<br>`./scripts/run-ops.mjs`<br>`./scripts/ops-command-registry.mjs`<br>`./config/build/`<br>`./docs/architecture/scripts.md`<br>`./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md` | `present-but-unverified` | Requirements §6.9 and §20 D16; Design §7.2 D16; Tasks D16 definition and classifier row | Manifest and source entries do not prove command success. `pnpm run typecheck:scripts` is unavailable while `./scripts/tsconfig.json` is absent and is excluded from validation. | Classify the exact command before proposing it; keep unavailable `typecheck:scripts` excluded and route authorized validation through the applicable owner gate. |
| D17 | Map packages, dependencies, and workspace boundaries without changing installation state | 05 | `./package.json`<br>`./pnpm-workspace.yaml`<br>`./pnpm-lock.yaml`<br>`./site/`<br>`./site/tsconfig.json`<br>`./tech-docs-generator/`<br>`./tech-docs-generator/package.json`<br>`./config/build/`<br>`./docs/architecture/stack.md` | `present-but-unverified` | Requirements §6.1–§6.4 and §20 D17; Design §7.2 D17; Tasks D17 definition and classifier row | Declared/imported/configured status is not proof of installation or build behavior; `./tech-docs-generator/` remains a root-level sibling of `./site/`, and `./results/site/` is not a source/package home. | Preserve the workspace boundary and distinguish declared, imported, configured, observed, absent, and unverified states before any separately approved package or lockfile action. |
| D18 | Maintain documentation, architecture, locked guidance, and legacy documentation | 07 | `./docs/architecture/`<br>`./docs/database/`<br>`./docs/governance/`<br>`./docs/governance/charter.md`<br>`./docs/governance/focss-stop-drift.md`<br>`./AGENTS.md`<br>`./DOC-MAP.md`<br>`./CONTENTS.md`<br>`./site/data/storage/`<br>`./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md` | Documentation: `present-but-unverified`; `./site/data/storage/`: `legacy` | Requirements §7 and §20 D18; Design §7.2 D18; Tasks D18 definition and classifier row | Locked/source/projection presence does not prove current authority or Markdown-to-HTML provenance; the legacy path is retained evidence, not permission for new behavior. | Preserve locked sources, establish projection provenance before any HTML write, and use the approved guide workstream only after exact authorization. |
| D19 | Place results, generated documents, Agent Work Reports, plans, and blockers correctly | 07, 09 | `./results/`<br>`./results/tests/`<br>`./results/site/`<br>`./results/site-ui/`<br>`./results/ops/`<br>`./generated-documents/`<br>`./agents-work/`<br>`./plans/`<br>`./plans/README.md`<br>`./Failures.md`<br>`./agent-reports/`<br>`./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md` | `present-but-unverified` | Requirements §20 D19 and §7/§18/§24; Design §7.2 D19; Tasks D19 definition and classifier row | Existing destinations and root artifacts do not prove producer ownership, purpose assignment, generation, relocation, or blocker status; no artifact is moved here. | Select the producer-owned Workstream/Purpose Subfolder before output; classify unassigned root result material as `legacy`/owner-review pending without claiming reorganization. |
| D20 | Route Kiro skills, Powers, MCP schemas/configuration, and Agent guidance using Local Evidence first | 08 | `./.kiro/`<br>`./.kiro/skills/`<br>`./.kiro/agents/`<br>`./.kiro/mcp/`<br>`./.kiro/settings/mcp.json`<br>`./.kiro/hooks/`<br>`./skills-lock.json`<br>`./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md` | `present-but-unverified` | Requirements §9 and §20 D20; Design §§7.2, 8, 22–24; Tasks D20 definition and classifier row | Static files, schemas, configuration, and definitions do not prove runtime loading, installed Power state, connected MCP, automatic spawning, or universal enforcement. | Use Local Evidence first; distinguish schema, configuration, connected, installed, selected, and runtime-enforced states before any separately approved capability action. |
| D21 | Plan Vercel, Worker, R2, backups, observability, deployment, and incidents as bounded operations | 06 | `./vercel.json`<br>`./workers/oando-worker-proxy/`<br>`./config/observability/`<br>`./.github/workflows/supabase-backup-r2.yml`<br>`./OPERATIONS_RUNBOOK.md`<br>`./scripts/`<br>`./Failures.md`<br>`./site/instrumentation.ts`<br>`./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md` | `present-but-unverified` | Requirements §20 D21 and §3; Design §7.2 D21; Tasks D21 definition and classifier row | Configuration and runbook paths do not prove deployment, backup, R2, observability, incident, or external-system behavior; no protected operation is run. | Produce only a read-only target/impact/recovery plan and request exact authorization for any deployment, backup, service, or remote action. |
| D22 | Discover an unknown or newly discovered repository area safely | 01, 08, 07 | `./START.md`<br>`./AGENTS.md`<br>`./docs/architecture/layout.md`<br>`./agents-work/oando-repository-guide/markdown/01-repository-map.md`<br>`./agents-work/oando-repository-guide/README.md`<br>`./plans/README.md`<br>`./.kiro/skills/repo-map/SKILL.md`<br>`./Failures.md` | `unwired/absent` | Requirements §9.1–§9.2 and §20 D22; Design §7.2 D22; Tasks D22 definition and classifier row | No new area is treated as canonical or wired until Local Evidence identifies an owner, path, risk, and end-to-end evidence; this card is the discovery fallback. | Inventory Local Evidence, identify the canonical owner, create a gap card when unresolved, and propose a new card/skill only through a separately approved guidance task. |

**Coverage Audit invariants:**

1. The table has exactly 22 rows, `D01`–`D22` exactly once, and each row's outcome/chapter/verified-path baseline agrees with its matching D01–D22 definition and classifier row above.
2. Every row has evidence sources, an explicit limitation, and a bounded next decision. The audit distinguishes static path coverage from end-to-end capability evidence.
3. `wired` is reserved for current observed End-to-End Evidence covering the relevant route or interface, behavior, data flow, and persistence/external boundary. No row in this static Tasks phase is promoted to `wired` from path text, a task definition, a schema, an import, or a planned check.
4. A status change requires current evidence, an updated evidence source and limitation, and an updated next action before any response or Completion Record describes a capability as wired.
5. The audit preserves `/admin/product-studio` and the interactive legacy `/planner/*` tree as `unwired/absent` until live route evidence changes them, while keeping marketing `/planner*` pages distinct from `/ooplanner` and from the interactive legacy tree.

#### Surface Status enum (exactly five values)

The only permitted Surface Status values are exactly: `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, and `legacy`. No synonym, sixth value, compound replacement, or lifecycle status may be used as a Surface Status.

- **`wired`:** use only when current evidence establishes the complete end-to-end route or interface, relevant behavior, data flow, and required persistence or external boundary. Static path, import, schema, configuration, screenshot, or planned command evidence alone cannot produce this value. It is not assigned by this Tasks-phase static audit.
- **`demo/local-only`:** use when the surface has local/browser/demo evidence but no hosted or production workflow proof. D09 must keep the Admin CRM browser workspace at this value while the `oando-crm-storage` browser/Zustand key is the observed persistence boundary.
- **`present-but-unverified`:** use when a path, route, source, or described capability is present in the evidence baseline but complete end-to-end behavior is not established. This is the default for the static rows above unless a named surface is more specifically classified.
- **`unwired/absent`:** use when current evidence does not establish a connected route/data flow or identifies the required surface as absent. The `/admin/product-studio` and interactive legacy `/planner/*` distinctions remain here until live evidence changes them; this value does not describe the separate marketing `/planner*` pages.
- **`legacy`:** use for retained historical, retired, or legacy paths/surfaces that must not be treated as current implementation. `./site/data/storage/` is recorded this way in D18; legacy classification is not permission to add new behavior there.

Every documented Product Surface and every Coverage-Gap Admission Card carries one of these values, evidence sources, the current owner, an evidence limitation, and a next action/decision. `demo/local-only` CRM evidence never upgrades the separate customer-query operation, and a `present-but-unverified` query surface never changes the CRM's local-only status.

#### Coverage-Gap Admission Card

Create a Coverage-Gap Admission Card before reporting an area, capability, route, package, or workflow as implemented whenever current evidence does not establish End-to-End Evidence. The card is an explicit admission and next-evidence contract, not a claim that the area is broken and not a substitute for a True Blocker.

```text
Coverage-Gap Admission Card
Named Area or Capability:
Status: one of `wired` | `demo/local-only` | `present-but-unverified` | `unwired/absent` | `legacy`
Evidence Sources Checked:
Evidence Limitation:
Next Evidence Source:
Owner Action:
Scope Boundary:
Next Decision:
```

Coverage-Gap Admission rules:

1. The `Status` field must use exactly one of the five Surface Status values and must cite the evidence supporting it; for a card covering distinct named surfaces, issue distinct status lines within the same audit row/card rather than collapsing them into one claim.
2. `Evidence Sources Checked` lists the exact paths, documents, or authorized observations inspected; a verified-start path list alone does not establish `wired`.
3. `Evidence Limitation` states what is not proven, including absent/stale/generated/private/legacy path state, missing rendered proof, missing hosted persistence, missing external/provider evidence, or missing command output where applicable.
4. `Next Evidence Source` names the smallest authoritative path or owner-authorized observation that can resolve or narrow the gap; `Owner Action` names the person/role decision or approval required.
5. `Scope Boundary` states what the card covers and explicitly excludes adjacent surfaces, especially the CRM browser workspace versus customer-query operations and Planner/Studio versus marketing/legacy Planner routes.
6. `Next Decision` names the next bounded action or the single unavoidable Owner Decision; it must not silently authorize a hook, runtime, package, database, deployment, backup, Power, MCP, or protected command change.
7. When the gap belongs to a documented Product Surface, include the card in the Plain-Language Response Contract and repeat it in the Completion Record. The response must place the gap in its `Unverified`, `Exact Completion Proof`, and `Unavoidable Owner Decisions` content as applicable, and the Completion Record must retain the status, sources, limitation, next evidence, owner action, scope, and next decision.
8. If a task changes no product/runtime file, the Completion Record still states the inspected scope and decision reached and includes any applicable gap card; static task prose never silently becomes runtime proof.
9. A gap card is not itself a True Blocker. Only an evidenced condition preventing completion within authorized scope may be a True Blocker, and the canonical root `./Failures.md` ledger remains unchanged unless that exact file is separately authorized.
10. When current evidence later establishes End-to-End Evidence, update the Surface Status, evidence sources, limitation, next action, and Route Record before using `wired`; do not delete the prior gap without recording the evidence transition.

#### Static/runtime and downstream-boundary decision

This audit is an authored, static Tasks-artifact record. It establishes the required row schema, 22-card coverage baseline, enum, evidence limitations, CRM/query distinction, and propagation rules only. It does not implement the README rows, change any guide chapter or HTML/CSS projection, create a runtime status registry, prove route loading, establish hosted persistence, activate a Package Skill/Power/MCP, create four runtime Agent slots, or install a universal Pre-Action Enforcement Layer. The current guide path `./agents-work/oando-repository-guide/README.md` remains `pending-owner` and read-only for this task. Any status not supported by current End-to-End Evidence remains `present-but-unverified`, `unwired/absent`, `demo/local-only`, or `legacy` as applicable; no prose row is a runtime status.

#### Task 3.3 handoff record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Add the exact 22-row Coverage Audit, exact five-value Surface Status enum, Coverage-Gap Admission Card schema/rules, response/Completion propagation, CRM `oando-crm-storage` distinction, and separate customer-query classification to the authorized Tasks artifact without claiming README or runtime implementation.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; `V/R-01` is the next owner for read-only Tasks-artifact reconciliation; the Repository Owner is the next decision owner for the downstream README path and any scope expansion. The fixed model remains exactly four Agent slots; Coordinator is a function attached to `I/C-01`, not a fifth role.
- **Scope:** Only the static task 3.3 record in `./.kiro/specs/oando-master/tasks.md`, including 22 audit rows, enum/gap rules, propagation rules, static/runtime boundary, and this handoff. No README/card-instance write, guide chapter/HTML/CSS write, protected-path write, skill/control/hook/settings/MCP change, package/script/plan/report/result/generated-document write, `./site/` write, application/runtime/database/deployment/backup action, Power/MCP activation, or command-based validation.
- **Paths Read and Paths Changed:** Read `./.kiro/specs/oando-master/.config.kiro`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; `./.kiro/specs/oando-master/tasks.md`; `./.kiro/skills/oando-master/SKILL.md`; and `./agents-work/oando-repository-guide/README.md` as read-only downstream context. Changed exactly `./.kiro/specs/oando-master/tasks.md`. No README, guide chapter, HTML/CSS, root/Docs/Agents/protected file, `.kiro` control/skill/agent/hook/settings/MCP file, package/script, plan/report/result/generated-document, `./site/`, application/runtime, database, deployment/backup, Power, MCP, or other path changed.
- **Route Record:** Outcome is static Coverage Audit and Surface Status/gap reconciliation; domain is D01–D22 repository guidance with D09 CRM/customer-query and D20 governance context; first evidence is Requirements §4/§19/§20/§26/§30.16/§31.3, Design §§7.2–7.3/§18, Task 3.2's exact D01–D22 definitions/classifier, and this Tasks artifact; selected skills are `oando-master` (mandatory first router) and `repo-map` (path/authority orientation); rejected `db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `planner-studio`, `verify-and-gate`, and `ai-retrieval` because no matching implementation/validation trigger is in scope. Workflow Mode is `Supervised`; risk is documentation, evidence-integrity, overclaim, status, authorization, and downstream-scope risk; no command is proposed; Artifact Class is authored `Active Plan / Downstream Tasks Artifact` at `./.kiro/specs/oando-master/tasks.md`, filename `tasks.md`, owner/source `I/C-01` under this approved spec workflow, authored not generated; rejected placements are `./agents-work/`, `./results/`, `./generated-documents/`, `./plans/`, root controls, protected paths, `./site/`, and all runtime/package/database/deployment/output paths; Locked Path Gate is explicitly owner-authorized only for this exact Tasks artifact; Site Write Gate is not applicable; Validation State is `not-run` for commands and read-only artifact read-back only; next action is `V/R-01` read-back followed by owner authorization for the downstream README lane.
- **Evidence:** Requirements 4.1–4.7, 19.1–19.7, 20.1–20.8, 26.1–26.7, 30.16, and 31.3; Design §7.2 verified-path/card mapping, §7.3 status/gap rules, §18 task shape, and the static/runtime boundary; Tasks D01–D22 definitions/classifier and Task 3.2 handoff; the exact 22 audit rows above; and the authorized Tasks-artifact read-back. This evidence establishes a static task contract only.
- **Decisions:** The audit row count is exactly 22 with `D01`–`D22` once each; row statuses use only the five exact Surface Status values, with named sub-surface values where needed; `wired` is reserved for observed End-to-End Evidence and is not assigned by this static phase; D09 keeps CRM `demo/local-only` based on the `oando-crm-storage` browser/Zustand boundary and separately classifies customer-query operations as `present-but-unverified`; `/admin/product-studio` and interactive legacy `/planner/*` remain `unwired/absent`, marketing `/planner*` remains distinct from `/ooplanner`; gaps propagate to the Plain-Language Response Contract and Completion Record; README implementation is not claimed.
- **Coverage Gaps:** The downstream README rows/card rendering and all guide-chapter/HTML/CSS projection work are `pending-owner`/`not-observed`; current runtime Surface Status, end-to-end route/data/persistence behavior, hosted CRM/query behavior, runtime skill loading, automatic Agent spawning, universal Pre-Action Enforcement, installed/connected Power/MCP state, rendered behavior, command results, and external/global Kiro coverage remain `not-observed` or separate approval work. Any future absent/stale/generated/private/legacy Start Path requires live recheck and a Coverage-Gap Admission Card; no gap is promoted to `wired` without current End-to-End Evidence.
- **Validation Command:** `none` — the current request forbids commands, scripts, generators, tests, gates, builds, typechecks, package actions, browser/local-service actions, database/deployment/backup actions, Power activation, MCP connection, and all command-based validation. Only read-only inspection and authorized Tasks-artifact read-back are permitted.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for the exact existing `./.kiro/specs/oando-master/tasks.md` write. `./agents-work/oando-repository-guide/README.md` and all guide/protected/runtime/output paths remain owner-gated and pending-owner; no downstream or substitute write is authorized.
- **Hook Decision:** `not-observed` for a universal pre-action decision; no command hook was invoked. Any command-specific hook evidence remains command-specific and is not generalized to reads, writes, deletes, delegation, or handoffs.
- **Exit Status:** `not-observed` — no command or runtime action was executed; static Tasks-artifact publication and read-back are the only applicable evidence.
- **Validation Limitation:** Static rows, path lists, enum text, gap templates, requirements/design references, and Tasks-artifact read-back cannot prove README modification, guide rendering, runtime status updates, route wiring, hosted persistence, command success, rendered interaction, connected MCP, installed Power, automatic spawning, universal enforcement, or relocation.
- **Blockers:** No hard blocker within the authorized Tasks-artifact scope. README/card-instance implementation and all downstream guide work are pending-owner, not complete; do not write root `./Failures.md` without exact authorization. Stop on conflict, missing authorization, contradictory evidence, or scope expansion.
- **Next Action:** `V/R-01` performs read-only reconciliation of the exact 22 audit rows, five enum values, status assignments, CRM key distinction, separate customer-query status, gap propagation, README authorization state, changed-path audit, and pending-owner items. The Repository Owner must separately name and authorize `./agents-work/oando-repository-guide/README.md` before any downstream guide/card-instance write; until then no other path may change.
- **Status:** `complete` for the static Task 3.3 record after read-back; `pending-owner` for downstream README/card instances and guide projection; `not-observed` for runtime status/enforcement/hosted behavior. These lifecycle values are not Surface Status values.

- **Requirements:** 4.1–4.7, 19.1–19.7, 20.1–20.8, 26.1–26.7, 30.16, 31.3.

  - [x] 3.4 Add artifact placement, exact workspace boundaries, and the Site Write Gate

### Task 3.4 artifact placement, exact workspace boundaries, and Site Write Gate

**Task identity and authorization boundary:** `oando-master / 3.4`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. The current request authorizes exactly one authored write to `./.kiro/specs/oando-master/tasks.md`. This section records the placement contract and Site Write Gate as guidance in that authorized Tasks artifact. It does not write `./agents-work/oando-repository-guide/README.md`, any guide chapter or HTML projection, any report/result/plan/generated output, any product source, or any protected/control path.

**Implementation state:** `complete` for the static Tasks-artifact record after authorized read-back; `pending-owner` for the downstream README and guide/card implementation; `not-observed` for producer execution, relocation, runtime Site Write enforcement, generated-output execution, and hosted/product behavior. A path or rule written in this section is static evidence only and does not prove that an artifact was generated, moved, loaded, or enforced.

#### Exact placement vocabulary

The following forms are normative and must be written exactly whenever the corresponding destination is named:

- Agent-authored work: `./agents-work/<workstream>/<report-type>/`
- Command- or script-produced Machine Evidence: `./results/<purpose>/`
- Tech-docs generator output: `./generated-documents/`
- Tech-docs generator source/package: `./tech-docs-generator/`
- Next.js product source tree: `./site/`
- Machine-Evidence purpose folder named `site`: `./results/site/`
- Active plan material: `./plans/<name>/`
- Canonical True Blocker ledger, only when the exact file is authorized: `./Failures.md`

The approved destination is selected from the artifact class and producer, not from convenience or a similarly named directory. `./agents-work/` is the Agent Work area and is distinct from `./Agents/`, which remains a protected read-only evidence area under the separate Locked Path Gate. The current `./.kiro/specs/oando-master/tasks.md` write is an explicitly authorized spec/task-artifact exception; it is not a general alternative destination for active plans, reports, results, or generated output.

The required placement sentence is published verbatim:

> If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.

#### Output-path Route Record schema

Before selecting an output path, an Output-Producing Task must complete every field below in its Route Record. A missing field stops path selection and keeps the task `pending-owner`, `blocked`, or `not-observed`; no field may be inferred from a directory name or an existing file.

| Required field | Required content | Static-evidence rule |
|---|---|---|
| **Artifact Class** | One of `Agent Work Report`, `Machine Evidence`, `Generated Tech-Docs Output`, `Active Plan`, `True Blocker`, or `Core Product Write`; identify the current Tasks-artifact exception when applicable. | Classification does not prove the producer ran or the output exists. |
| **Selected subfolder** | The exact approved Workstream Subfolder or Purpose Subfolder, or the explicitly approved product-source path; use the exact forms above. | A selected destination is not evidence of placement or relocation. |
| **Filename pattern** | The expected filename or naming pattern, including the artifact type and owning task where useful. | A pattern does not prove a file was created. |
| **Owning source or script** | The human/Agent owner for authored work, or the exact generator, script, command, or product owner for generated/product output. | A named producer does not prove it executed or generated the artifact. |
| **Authored/generated state** | `authored` or `generated`, with `not-observed` when the state cannot be established. | Generated output must remain producer-owned and must not be hand-edited as evidence. |
| **Rejected placements** | Every candidate home rejected, with the reason it violates artifact class, producer ownership, workspace boundary, or Site Write Gate. | Rejection is a routing decision, not evidence that a file was moved. |
| **Observed placement** | The exact path observed after the artifact is written or generated, or `not-observed` when no placement evidence exists. | Path presence/read-back proves only the observed path, not generation, relocation, or runtime use. |
| **Site Write Gate** | `Core Product Write`, `Non-Core Artifact`, or `not-applicable`; when under `./site/`, include exact product outcome, exclusive owned paths, matching skills, explicit approval, and expected evidence. | Prose Gate state does not prove runtime interception or enforcement. |

The Route Record also retains the task outcome, domain, selected and rejected skills, Workflow Mode, Operational-Risk Classification, Command Classification, Locked Path state, Validation State, and unavoidable Owner Decisions. For this task, the current target is `Active Plan / current spec task artifact (explicit exception)`; selected subfolder is `./.kiro/specs/oando-master/`; filename pattern is `tasks.md`; owner/source is the approved `oando-master` Tasks workflow and `I/C-01`; state is `authored`; observed placement is established only by the post-write read-back; and the current Site Write Gate is `not-applicable` because the target is not under `./site/`.

#### Artifact-class placement matrix

| Artifact Class | Required home and producer | Rejected homes and behavior |
|---|---|---|
| **Agent Work Report** | `./agents-work/<workstream>/<report-type>/` or an existing approved workstream folder such as `./agents-work/oando-repository-guide/`; authored by the assigned Agent/owner. | Reject the `./agents-work/` root, `./results/`, `./site/`, and unowned root as report destinations. |
| **Machine Evidence** | `./results/<purpose>/`, including an approved purpose such as `./results/tests/`, `./results/site/`, `./results/site-ui/`, or `./results/ops/`; produced by the owning script/command. | Reject `./results/` root, `./agents-work/`, `./site/`, and hand-edited generated evidence. Regenerate from the owning source/script. |
| **Generated Tech-Docs Output** | `./generated-documents/`; produced by the root-level `./tech-docs-generator/` package. | Reject `./results/`, `./agents-work/`, and `./site/`; hand-editing makes generated output untrusted and requires regeneration. |
| **Active Plan** | The applicable `./plans/<name>/` directory indexed by `./plans/README.md`; owned by the active plan. | Reject `./results/`, `./site/`, and an unowned root-level location. The current `./.kiro/specs/oando-master/tasks.md` is writable only because the current request explicitly names and authorizes this spec artifact. |
| **True Blocker** | Canonical record only in `./Failures.md` when the Repository Owner has explicitly authorized that exact file; supporting authored analysis uses an approved `./agents-work/<workstream>/<report-type>/`. | Reject a duplicate blocker ledger in `./results/`, `./agents-work/`, `./site/`, or another root file. Without exact authorization, keep the canonical ledger unchanged and record pending owner action. |
| **Core Product Write** | The explicitly approved product source tree, including `./site/` only when the Route Record classifies the exact target as an approved Core Product Write. | Reject `./site/` for reports, skills, results, prompts, plans, audits, handoffs, generated files, temporary/debug files, or any other Non-Core Artifact. |
| **Repository Skill or other workspace guidance** | Its approved `.kiro` skill/control path under the separately authorized scope; this task writes no such path. | Reject `./site/`, `./results/`, and `./agents-work/` as skill destinations. Do not infer a runtime skill or capability from path presence. |

When an artifact has multiple possible homes, the Route Record records the selected home and every rejected placement before writing. A documented home does not relocate an existing root-level artifact. Existing root-level result material without observed purpose assignment remains `legacy/owner-review pending`; this task performs no relocation or cleanup.

#### Exact workspace boundaries

1. `./tech-docs-generator/` is the root-level Tech-Docs Generator Package and remains a sibling of `./site/`. It is generator source/package material, not product source, a result-purpose folder, or a report destination.
2. `./generated-documents/` is the separate generated output of `./tech-docs-generator/`. It remains distinct from both `./site/` and `./results/`.
3. `./results/site/` is a Machine-Evidence Purpose Subfolder. Its name does not make it a source tree, a workspace package, or a relocation target for `./tech-docs-generator/`.
4. `./site/` is the Next.js Site Source Tree reserved for explicitly approved Core Product Writes. It is not a general workspace for documentation, guidance, evidence, plans, prompts, skills, generated output, audits, handoffs, temporary files, or debug files.
5. A proposal to move `./tech-docs-generator/` into `./site/` or `./results/site/`, or to change the relationship of `./generated-documents/`, is rejected until a separately approved Workspace-Boundary Task authorizes that exact boundary change. No move is performed or claimed here.
6. Active plan material uses `./plans/<name>/`; Machine Evidence uses `./results/<purpose>/`; Agent-authored work uses `./agents-work/<workstream>/<report-type>/`; and the canonical blocker uses `./Failures.md` only under its exact authorization boundary.
7. Whenever a Route Record, task card, prompt, or handoff names these locations, it uses the exact `./` forms above. `./results/site/` and `./site/` are always recorded as distinct paths.

#### Site Write Gate

The Site Write Gate runs before selecting or writing any target under `./site/`:

1. Classify the exact target in the Route Record as `Core Product Write` or `Non-Core Artifact`. An unclassified target is denied before path selection.
2. For a `Core Product Write`, record the exact product outcome, exclusive owned paths, every matching Package Skill, explicit owner approval for the product change, and the expected static or authorized evidence. Preserve all applicable fork, database, security, FOCSS, and Protected Command boundaries.
3. Permit only the approved product implementation in the approved product source tree. A `Core Product Write` classification is not permission to write an adjacent path or perform a separate implementation task.
4. For a `Non-Core Artifact`, stop before writing and redirect it to its approved non-site home. This includes reports, Agent Work Reports, skills, steering files, MCP definitions, results, prompts, plans, audits, handoffs, generated files, temporary files, debug files, and any other non-core work product.
5. Reject any proposal to use `./site/` merely because it is convenient or because the target has a product-like name. Reject any proposal to treat `./results/site/` as product source.
6. A proposed workspace/package move into `./site/` or `./results/site/` is a separate Workspace-Boundary Task, not a Core Product Write and not part of this task.

The Gate is a documentation contract in this phase. No current runtime pre-action interceptor, generated-output producer, relocation, or automatic Site Write enforcement is claimed. A current or future action without an observed pre-action decision remains `not-observed`; static path text cannot be promoted to `enforced`.

#### Four-slot serial integration and static/runtime boundary

The fixed four-slot model remains unchanged: `S/M-01` Scout/Map, `P/R-01` Planner/Risk, `I/C-01` Implementer with the Coordinator/Serial Integration Owner designation, and `V/R-01` Verifier/Reporter. `I/C-01` exclusively owns the current `./.kiro/specs/oando-master/tasks.md` write and serially integrates this record. No fifth Coordinator Agent is created, no parallel write is allowed to this shared Tasks artifact, and no runtime roster creation is inferred from this prose.

The static record may establish exact path vocabulary, ownership declarations, rejected destinations, and read-back facts. It cannot establish runtime Site Write interception, Agent spawning, producer execution, generated-output freshness, relocation, rendered product behavior, hosted persistence, connected MCP, installed Power, or any broader command result. The downstream `./agents-work/oando-repository-guide/README.md` remains `pending-owner` and was not written.

#### Task 3.4 Route Record

- **Outcome:** Record the artifact-placement contract, exact workspace/package/source boundaries, producer ownership fields, and fail-closed Site Write Gate in the authorized Tasks artifact without creating or relocating any output.
- **Domain / Domain Index card:** `D19 — Results, generated documents, Agent Work Reports, plans, and blockers`; with `D17 — Packages, dependencies, and workspace boundaries` and `D06 — Site UI/product source boundary` as related evidence domains. This is guidance/specification work, not product implementation.
- **Exact first evidence locations and reasons:** `./.kiro/specs/oando-master/requirements.md` for Requirements 7, 18, 24, 27, 28, 29, 30.24–30.26, and 31.6–31.8; `./.kiro/specs/oando-master/design.md` §§11, 13, 15, 18, and 20 for the placement and Gate model; `./.kiro/specs/oando-master/tasks.md` for the authorized write and prior task vocabulary; `./AGENTS.md`, `./Agents/01-standard.md`, and `./plans/README.md` for repository authority and placement boundaries; `./agents-work/oando-repository-guide/README.md` as read-only downstream context whose write remains pending-owner.
- **Candidate paths:** current writable target `./.kiro/specs/oando-master/tasks.md`; future Agent Work Reports `./agents-work/<workstream>/<report-type>/`; Machine Evidence `./results/<purpose>/`; generated docs `./generated-documents/`; active plans `./plans/<name>/`; product source `./site/`; blocker ledger `./Failures.md` only when exact authorization exists. No candidate path is selected for a new report/result/generated output in this task.
- **Selected Package Skills and trigger evidence:** `oando-master` (mandatory first router, Route/Completion contract, artifact and Site Write rules) and `repo-map` (repository path, workspace-boundary, and authority orientation). Selection is prose guidance only; no runtime capability is activated.
- **Rejected Package Skills and reasons:** `db-migrations` (no SQL, schema, RLS, grants, rollback, or database action); `focss-css` (no styling, tokens, Tailwind, icons, or FOCSS write); `fork-boundaries` and `planner-studio` (no Planner/Studio source or fork change); `graph-impact` (no shared-code/dependency/cycle analysis); `verify-and-gate` (no authorized validation command); `powers-skills-model` (no skill, Power, MCP, or capability-package change); `ai-retrieval` (no AI/retrieval work and the optional skill is not present/selected).
- **Workflow Mode:** `Supervised` — this is an owner-authorized documentation/specification artifact write with serial integration and no command execution.
- **Operational-Risk Classification:** documentation/governance, evidence-integrity, artifact-placement, workspace-boundary, product-source, protected-path, and authorization risk; no product behavior, data, credential, infrastructure, deployment, external-system, or runtime enforcement change is in scope.
- **Command Classification:** no command is proposed or run. File reads and post-write read-back are `read-only inspection`; tests, gates, builds, typechecks, scripts, package commands, browser runs, local services, databases, deployments, backups, Power, MCP, and other execution are `no-run pending authorization` and excluded.
- **Artifact Class / selected subfolder / filename pattern:** `Active Plan / current spec task artifact (explicit current-request exception)`; selected subfolder `./.kiro/specs/oando-master/`; filename pattern `tasks.md`.
- **Owning source or script / authored or generated:** owner/source is the approved `oando-master` Tasks workflow and `I/C-01`; state is `authored`, not generated. No generator or command owns this write.
- **Rejected placements:** `./agents-work/` root, `./results/` root, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./results/site/`, `./plans/<name>/`, root `./Failures.md`, `./Agents/`, `./docs/`, `./.kiro/agents/**`, and any duplicate/copy path are rejected for this current Tasks-artifact write because they are wrong producer homes, protected paths, non-core Site targets, or unauthorized alternatives.
- **Observed placement:** `not-observed until post-write read-back`; after read-back, the only expected observed placement is `./.kiro/specs/oando-master/tasks.md`. No report, result, generated document, plan output, blocker entry, or product-source output is created.
- **Site Write Gate:** `not-applicable` to the current Tasks artifact because its target is outside `./site/`; the documented Gate denies all unclassified or Non-Core targets under `./site/` and permits only an explicitly approved Core Product Write with the fields above.
- **Locked Path Gate:** `explicitly owner-authorized` only for `./.kiro/specs/oando-master/tasks.md` under the current spec workflow; all root files, `./docs/**`, `./Agents/**`, and `./.kiro/agents/**` remain read-only evidence and are not changed.
- **Validation State:** `not-run` for commands; static post-write read-back is the only applicable proof. Runtime Site Write enforcement, producer execution, relocation, generated-output freshness, and README implementation are `not-observed`/`pending-owner`.
- **Unavoidable Owner Decisions:** none for this exact Tasks-artifact write. The Repository Owner must separately authorize the downstream `./agents-work/oando-repository-guide/README.md` before any README/card-instance write, and must separately approve any workspace-boundary, runtime enforcement, generator, product-source, report, result, plan, blocker, or protected-path action.

#### Task 3.4 handoff record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Add the exact artifact-class placement schema, approved Workstream/Purpose Subfolder forms, producer ownership and authored/generated requirements, rejected-placement behavior, observed-placement limitation, exact `./tech-docs-generator/`/`./generated-documents/`/`./site/`/`./results/site/` sibling distinctions, active-plan and blocker boundaries, and the fail-closed Site Write Gate to the authorized Tasks artifact.
- **Role and Next Owner:** `I/C-01` is Implementer and Coordinator/Serial Integration Owner; `V/R-01` is the read-only next owner for authorized Tasks-artifact read-back; the Repository Owner owns the pending README authorization and any scope decision. The four-slot roster is unchanged and Coordinator is not a fifth Agent.
- **Scope:** Only the static Task 3.4 record in `./.kiro/specs/oando-master/tasks.md`, including the exact placement forms, required Route Record fields, artifact matrix, workspace boundaries, Site Write Gate, static/runtime limitation, Route Record, and this handoff. No README/card-instance write, guide chapter/HTML/CSS write, report/result/plan/generated-output creation, file move, `./site/` write, protected-path write/delete, hook/policy/runtime change, package/database/deployment/backup/local-service action, Power/MCP activation, or command-based validation.
- **Paths Read and Paths Changed:** Read the current user request; `./AGENTS.md`; `./Agents/01-standard.md`; `./plans/README.md`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; `./.kiro/specs/oando-master/tasks.md`; `./.kiro/skills/oando-master/SKILL.md`; `./.kiro/skills/repo-map/SKILL.md`; and `./agents-work/oando-repository-guide/README.md` as read-only downstream context. Changed exactly `./.kiro/specs/oando-master/tasks.md`; no README, guide chapter, HTML/CSS, root/Docs/Agents/protected file, `.kiro/agents/**`, application/runtime, package/script, plan/report/result/generated-document, `./site/`, database, deployment, backup, Power, MCP, or other path was changed.
- **Route Record:** The Route Record above is the authoritative record. Its exact placement forms are `./agents-work/<workstream>/<report-type>/`, `./results/<purpose>/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./results/site/`, `./plans/<name>/`, and `./Failures.md` only when exact authorization exists. Its current Artifact Class is the explicitly authorized `Active Plan / current spec task artifact`; selected subfolder `./.kiro/specs/oando-master/`; filename `tasks.md`; owner/source `oando-master` Tasks workflow and `I/C-01`; state `authored`; rejected placements are recorded; current Site Write Gate is `not-applicable`; and observed placement is `not-observed` until read-back.
- **Evidence:** Requirements 7.1–7.7, 18.1–18.8, 24.1–24.8, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.24–30.26, and 31.6–31.8; Design §§11, 13, 15, 18, and 20; current task/guide authority; the published placement sentence; artifact schema/matrix; exact workspace boundary distinctions; and the Site Write Gate behavior. Static file read-back can establish only this prose record and the observed tasks.md path.
- **Decisions:** Preserve the exact destination forms and publish the required placement sentence verbatim; require all artifact fields before path selection; route each producer to its approved home; keep `./tech-docs-generator/` as a root-level sibling of `./site/`; keep `./generated-documents/` separate; classify `./results/site/` as Machine Evidence; reserve `./site/` for explicitly approved Core Product Writes; stop and redirect every Non-Core Artifact under `./site/`; keep active plans in `./plans/<name>/`; use `./Failures.md` only with exact owner authorization; do not move files or claim relocation; preserve four-slot serial integration and static/runtime separation.
- **Coverage Gaps:** `./agents-work/oando-repository-guide/README.md` is `pending-owner` and was not changed; no current evidence proves a producer executed, generated output freshness, relocation, rendered product behavior, hosted persistence, runtime Site Write interception, universal Pre-Action Enforcement, automatic Agent spawning, connected MCP, installed Power, or any command result. The required placement rules are documented but not runtime-enforced by this task.
- **Validation Command:** `not-run`; no validation command is authorized. Authorized evidence is read-only post-write Tasks-artifact read-back only.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-request authorization exists only for the exact existing `./.kiro/specs/oando-master/tasks.md` write. The downstream README, all `./site/` paths, `./results/**`, `./agents-work/**` outputs, `./generated-documents/`, `./tech-docs-generator/`, `./plans/<name>/`, `./Failures.md`, root files, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, and all other paths remain pending-owner or separately approved.
- **Hook Decision:** `not-observed`; no command or runtime action was invoked, and no command-specific hook evidence is generalized to Site Write enforcement.
- **Exit Status:** `not-observed`; no command ran.
- **Validation Limitation:** Read-back proves only the authored text and observed placement of `./.kiro/specs/oando-master/tasks.md`; it does not prove runtime interception, producer execution, generated/relocated artifacts, product behavior, or any protected/hosted outcome.
- **Blockers:** No True Blocker is evidenced within this authorized scope. Do not write root `./Failures.md`; README implementation and all Separate Approval Work remain pending-owner. Stop on conflict, missing authorization, contradictory evidence, or scope expansion.
- **Next Action:** `V/R-01` performs read-only post-write reconciliation of this Task 3.4 section, exact placement forms, published sentence, artifact fields, rejected placements, boundary distinctions, Site Write Gate, four-slot/static-runtime boundary, changed-path audit, and pending-owner states. The Repository Owner must separately authorize `./agents-work/oando-repository-guide/README.md` before any downstream guide write.
- **Status:** `complete` for the static Task 3.4 Tasks-artifact record after read-back; `pending-owner` for downstream README/card-instance work and any runtime/enforcement observation; `not-observed` for producer execution, relocation, and runtime Site Write enforcement.

- **Requirements:** 7.1–7.7, 18.1–18.8, 24.1–24.8, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.24–30.26, 31.6–31.8.

  - [x] 3.5 Add the Locked Path Gate and exact owner-authorization wording without changing protected files

### Task 3.5 Locked Path Gate and exact owner-authorization record

**Task identity and publication boundary:** `oando-master / 3.5`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is a static Locked Path Gate, exact-file authorization, Exact-Line boundary, and Tasks-artifact handoff record. The current user request explicitly authorizes exactly one existing write: `./.kiro/specs/oando-master/tasks.md`. No root file, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, `.config.kiro`, guide, HTML/CSS, skill, hook, settings/MCP, package, script, `./site/`, results, generated document, plan, application/runtime, database/migration, deployment, backup, Power, MCP, contract, or Exact-Line target is authorized for modification or deletion.

**Approval gate and implementation state:** The Locked Path Gate is guidance-only prose in this current Tasks artifact. The downstream prose-only README lane remains future and `pending-owner`; this execution writes only the authorized `tasks.md` record and does not write `./agents-work/oando-repository-guide/README.md` or any guide chapter. The static record is `complete` only after read-back; protected-source changes, runtime lock enforcement, and Exact-Line rollout remain `pending-owner`/`not-observed`. Neither active-document contract form is appended.

#### Protected Path Set and default lock

For this task, the Protected Path Set is fail-closed and includes every path under `./docs/`, every path under `./Agents/`, every file directly under `./`, and every path under `./.kiro/agents/**`. These paths are `Locked` and may be read only as Read-Only Evidence Sources unless the Repository Owner names and authorizes the exact file in the current request. Every direct root file means all root files, not only root Markdown; the root Markdown set includes `./AGENTS.md`, `./README.md`, `./START.md`, `./CONTENTS.md`, `./DOC-MAP.md`, `./Testing-handbook.md`, `./OPERATIONS_RUNBOOK.md`, `./Failures.md`, `./HANDOVER.md`, `./owners.md`, and similar root files when present.

| Protected path class | Default Route Record class | Read permission | Write/delete condition | Task 3.5 decision |
|---|---|---|---|---|
| `./docs/**` | `Locked` | Yes, as a Read-Only Evidence Source | Only the exact file the Repository Owner explicitly names and authorizes in the current request | Remains locked; no write or delete is authorized. |
| `./Agents/**` | `Locked` | Yes, as a Read-Only Evidence Source | Only the exact file the Repository Owner explicitly names and authorizes in the current request | Remains locked; no Exact-Line insertion or other write is authorized. |
| Every file directly under `./` | `Locked` | Yes, as a Read-Only Evidence Source | Only the exact root file the Repository Owner explicitly names and authorizes in the current request | Remains locked; no root write or delete is authorized. |
| `./.kiro/agents/**` | `Locked` | Yes, as a Read-Only Evidence Source | Only the exact Agent-definition file the Repository Owner explicitly names and authorizes in the current request | Remains locked; all five physical definitions, including `./.kiro/agents/spec-task-runner2.md`, are preserved and unchanged. |
| `./.kiro/specs/oando-master/.config.kiro` | `Locked` for this task | Yes, as read-only spec configuration evidence | No authorization in the current request | Remains unchanged; the `tasks.md` authorization does not unlock it. |
| `./.kiro/specs/oando-master/tasks.md` | `explicitly owner-authorized` for this current task only | Yes | The current request names this exact existing Tasks artifact | Sole permitted write; no neighboring `.kiro` path is unlocked. |

A directory name, broad task, role name, neighboring file, similar filename, copy, mirror, generated substitute, or report is not an exact-file authorization. If one exact protected file is authorized in a future request, only that file becomes `explicitly owner-authorized`; every neighbor remains `Locked`. A read grant never becomes write or delete permission.

#### Required Locked Path Gate reference

The following reference table is preserved from Requirements 31 and is normative for this task:

| Target | Default Route Record class | May agents read it? | Write rule |
|---|---|---|---|
| `./docs/` | `Locked` | Yes, as a Read-Only Evidence Source | Write only the exact file that the Repository Owner explicitly names and authorizes in the current request. |
| `./Agents/` | `Locked` | Yes, as a Read-Only Evidence Source | Write only the exact file that the Repository Owner explicitly names and authorizes in the current request. |
| Root-level Markdown matching `./*.md`, including `./README.md`, `./AGENTS.md`, `./START.md`, `./CONTENTS.md`, `./DOC-MAP.md`, `./Testing-handbook.md`, `./OPERATIONS_RUNBOOK.md`, `./Failures.md`, `./HANDOVER.md`, `./owners.md`, and similar root Markdown | `Locked` | Yes, as a Read-Only Evidence Source | Write only the exact file that the Repository Owner explicitly names and authorizes in the current request; a general task request is not authorization. |
| `./Failures.md` as the canonical True Blocker ledger | `Locked` | Yes, as a Read-Only Evidence Source | Change only after the Repository Owner explicitly authorizes the exact file; without authorization, record the blocker as pending owner action and keep supporting analysis under an approved `./agents-work/<workstream>/<report-type>/` folder. |
| `./agents-work/<workstream>/<report-type>/` | `writable` when the artifact is an approved Agent Work Report or guide work product | Yes | Use the approved Workstream Subfolder; `./agents-work/` is distinct from `./Agents/`. |
| `./.kiro/` | `writable` only within the current spec or skill scope | Yes | Apply the current spec, skill, artifact-placement, and Site Write Gate rules; this path is not authorization to change a Locked Path. |

#### Required Locked Path Gate copy-paste wording

> Before any write, apply the Locked Path Gate: classify the exact target in the Route Record as `Locked`, explicitly owner-authorized, or `writable`. Treat `./docs/`, `./Agents/`, and root-level `./*.md` files as read-only evidence unless the Repository Owner explicitly names and authorizes the exact file in the current request; do not treat a general task request as authorization. If the exact locked file is not authorized, stop before writing, explain the exact file and reason, record the change as an unavoidable Owner Decision and Separate Approval Work, and place supporting analysis only in an approved `./agents-work/<workstream>/<report-type>/` folder. Do not create a copy elsewhere and claim that the locked source was updated. `./agents-work/` is distinct from `./Agents/`, and `./.kiro/` remains governed by the current spec and Site Write Gate. For `./Failures.md`, keep the canonical ledger unchanged until exact owner authorization exists and record pending owner action instead.

This wording is a required copy-paste reference, not a runtime interceptor. The more specific `./.kiro/agents/**` lock above remains in force within the general `./.kiro/` spec/skill governance row.

#### Exact owner-authorization and fail-closed behavior

Before any proposed repository write or delete, the Route Record must classify the exact target as `Locked`, `explicitly owner-authorized`, or `writable`. A protected write or delete is allowed only when the current request names the exact file and the Repository Owner authorizes that exact file. Naming a directory, broad task, role, “relevant guidance,” neighboring file, or copy is insufficient. Without that exact authorization, the Locked Path Gate denies before modification, preserves the source, records the exact target and denial reason as a pending Owner Decision and Separate Approval Work, and names the Repository Owner as the next decision owner.

The denial is fail-closed: do not select an alternate tool, path, Agent, permission, owner, copy, mirror, generated substitute, report, or inferred approval. Do not overwrite, redirect, reinterpret, delete, or make a neighboring file stand in for the denied target. The denied source remains unchanged, and a substitute elsewhere never proves that a Locked source changed. The same boundary applies to deletion; an exact read authorization never supplies delete authorization.

`./agents-work/` and `./Agents/` are different path classes. Guide work and Agent Work Reports may be authored only under an approved `./agents-work/<workstream>/<report-type>/` folder. `./Agents/**` remains protected read-only evidence. A file in `./agents-work/`, `./results/`, `./generated-documents/`, `./site/`, `./plans/`, or any other location cannot be reported as an update to a Locked source. The placement and Site Write rules from Task 3.4 remain in force: `./tech-docs-generator/` stays a root-level sibling of `./site/`; `./generated-documents/` stays separate; `./results/site/` is Machine Evidence rather than product source; and `./site/` accepts only an explicitly approved Core Product Write.

For the canonical root True Blocker ledger `./Failures.md`, without exact authorization for that exact file the ledger remains unchanged. Record pending owner action in the task record and route any supporting analysis only to an approved `./agents-work/<workstream>/<report-type>/` subfolder. Do not create a duplicate blocker ledger, report, mirror, or substitute. `./.kiro/` spec and skill work remains governed by the current spec, skill, artifact-placement, and Site Write Gate rules; the general `./.kiro/` row does not authorize changes to `./.kiro/agents/**`, `.config.kiro`, hooks, settings/MCP, or any other neighboring control.

#### Future Exact-Line Rule boundary

The future Exact-Line Rule is exactly:

```text
Before any action, read the current user request and applicable repository standard, declare exact scope and permissions, and stop on denial, conflict, or missing authorization.
```

A separately approved future rollout may select `./AGENTS.md` and directly applicable files under `./Agents/`, including `./Agents/01-standard.md`, only after each exact target is named and authorized in the current request. It must insert exactly one occurrence per selected target, retain one occurrence when the exact line is already present, and record a line count of one. If insertion or normalization fails for any exact target, the rollout stops, records that target and exact reason as a blocker or pending Owner Decision, and does not claim completion. This Task 3.5 record only documents the rule; it does not insert the line into `./AGENTS.md`, `./Agents/01-standard.md`, or any other protected file, and it makes no current protected-source write or Exact-Line rollout claim.

No active-document Kiro Agent Contract block and no exact Canonical Inclusion is appended here. Contract coverage, Exact-Line migration, Protected Path Lock implementation, and universal Pre-Action Enforcement remain Separate Approval Work.

#### Static Pre-Action Gate Records for Task 3.5

These are static task records, not executable or host-integrated decisions. The universal enforcement state remains `guidance-only`/`not-observed`.

| Action kind | Static decision | Exact scope and next owner action |
|---|---|---|
| `read` | `allow` for named authority/spec/guidance evidence only | Read-only inspection may establish path, text, ownership, and unchanged-file evidence. A read cannot become write/delete permission; protected reads remain read-only. |
| `write` | `allow` only for `./.kiro/specs/oando-master/tasks.md`; `deny` for every protected or unselected neighbor | `I/C-01` writes only this exact current Tasks artifact. Any protected denial preserves the source, records the exact target/reason as pending Owner Decision and Separate Approval Work, and routes to the Repository Owner; no alternate path/tool/Agent/permission is selected. |
| `delete` | `deny` | No deletion scope or exact deletion authorization exists. Preserve the source and stop; do not choose a cleanup path or substitute. |
| `command` | `no-run pending authorization` | No shell, package, test, gate, build, typecheck, script, generator, browser/local-service, database, deployment, backup, Power, MCP, or other command is proposed or run in this task. |
| `delegation` | `deny` for any unrostered receiver; no new delegation proposed | Only the four declared slots may receive a bounded handoff; no fifth Agent, alternate owner, or silent fallback is selected. `I/C-01` remains the Serial Integration Owner. |
| `handoff` | `allow` only after all required fields are present and changed paths match ownership | `V/R-01` performs static read-back, then the Repository Owner receives pending decisions. No runtime handoff gate is claimed. |

#### Four-slot ownership and serial integration

Exactly four plan-declared Active Agent slots remain in force: `S/M-01` Scout/Map, `P/R-01` Planner/Risk, `I/C-01` Implementer with the attached Coordinator/Serial Integration Owner designation, and `V/R-01` Verifier/Reporter. The Coordinator designation is a function attached to `I/C-01`, not a fifth role. Runtime roster creation/loading, automatic spawning, and universal action interception remain `not-observed`; there is no silent one-Agent fallback.

| Slot | Role | Permission for Task 3.5 | Exclusive scope | Next owner |
|---|---|---|---|---|
| `S/M-01` | Scout/Map | Read-only | Current request, authority/spec sources, Requirements 31/36/39, Design §25, and existing Task 1.2/3.4 consistency records | `P/R-01` |
| `P/R-01` | Planner/Risk | Read-only | Protected Path Set, exact-file authorization, Route Record, risk, status, placement, and Owner Decision boundary | `I/C-01` |
| `I/C-01` | Implementer + Coordinator/Serial Integration Owner | Read/write only to the exact existing `./.kiro/specs/oando-master/tasks.md` | Serially integrate this Task 3.5 record, handoff, and completion marker; no protected or neighboring write/delete | `V/R-01` |
| `V/R-01` | Verifier/Reporter | Read-only | Static read-back, changed-path audit, evidence/limitation reconciliation, and owner handoff | `Repository Owner` |

The shared Tasks artifact is serially owned by `I/C-01`; no parallel edit is permitted. `V/R-01` may verify but may not change implementation or promote static evidence to runtime enforcement.

#### Deliverable Register and status boundary

The controlled-task deliverables and statuses use the closed lifecycle vocabulary already established in tasks.md and the closed Enforcement Status vocabulary; no synonym or implied promotion is introduced.

| Named deliverable | Owner | Lifecycle status | Enforcement status | Evidence or limitation |
|---|---|---|---|---|
| Agent Roster | `I/C-01`, verified by `V/R-01` | `complete` for static four-slot declaration | `guidance-only` / `not-observed` | Four plan-declared slots and one attached coordinator are recorded; runtime creation/loading and automatic spawning are not observed. |
| Ownership Matrix | `P/R-01`, serially integrated by `I/C-01` | `complete` for static ownership | `guidance-only` | Exact protected-path, Tasks-artifact, and future-owner boundaries are recorded; static text is not a runtime lock. |
| Route Record | `P/R-01`, serially integrated by `I/C-01` | `complete` for static route | `guidance-only` | Exact target, protected set, skills, artifact, placement, Site Write, and validation boundaries are recorded. |
| Pre-Action Gate Records | `P/R-01`, serially integrated by `I/C-01` | `complete` for static action classification | `guidance-only` / `not-observed` | The six action kinds are classified above; no executable or host-integrated gate decision was observed. |
| Handoff Record Register | `I/C-01`, verified by `V/R-01` | `complete` for static handoff | `guidance-only` | The complete Task 3.5 Handoff Record is below; unavailable runtime values remain `not-observed`. |
| Conflict Stop Record, when a conflict occurs | `I/C-01` | `not-observed` | `not-observed` | No conflict occurred in this static task; the stop rule remains active. |
| Completion Record | `V/R-01`, serially integrated by `I/C-01` | `complete` for static Tasks-artifact publication/read-back | `guidance-only` / `not-observed` | The changed path, read-back, exclusions, limitations, and next owner are recorded below; no protected-source or runtime proof is implied. |

#### Task 3.5 Route Record

- **Outcome:** Publish the fail-closed Locked Path Gate, exact owner-authorization wording, protected-source preservation rule, future Exact-Line boundary, and evidence-honest task records without changing any protected file.
- **Domain / Domain Index card:** `D18 — Documentation, architecture, locked, and legacy docs`, with `D19 — Results, generated documents, Agent Work Reports, plans, and blockers` and `D20 — MCP/skills/Powers/Agents` as boundary context. This is repository guidance/specification work, not product implementation.
- **Exact first evidence locations and reasons:** the current user request for the exact writable target and exclusions; `./.kiro/specs/oando-master/requirements.md` Requirements 31, 36, 38.6, and 39; `./.kiro/specs/oando-master/design.md` §25 and §§26–27; `./.kiro/specs/oando-master/tasks.md` Task 1.2 for the existing Protected Path Lock and Task 3.4 for placement/Site Write consistency; `./AGENTS.md`, `./Agents/01-standard.md`, and `./plans/README.md` for authority and placement rules; and the loaded `./.kiro/skills/oando-master/SKILL.md`/`./.kiro/skills/repo-map/SKILL.md` guidance.
- **Candidate paths:** the only current write candidate is `./.kiro/specs/oando-master/tasks.md`; protected paths and the future README lane are read-only evidence or pending-owner destinations, not current write candidates.
- **Selected Package Skills and trigger evidence:** `oando-master` is mandatory first because this is an `oando-master` spec task; `repo-map` applies to exact repository/spec path and authority orientation. Selection is guidance-only and does not activate runtime enforcement.
- **Rejected Package Skills and reasons:** `db-migrations` (no schema, SQL, RLS, grants, rollback, or database action); `focss-css` (no styling, tokens, Tailwind, icons, or FOCSS write); `fork-boundaries` and `planner-studio` (no Planner/Studio source or fork change); `graph-impact` (no shared-code, dependency, blast-radius, or cycle analysis); `verify-and-gate` (no validation command is authorized or proposed); `powers-skills-model` (no capability packaging or Power/MCP configuration change); `ai-retrieval` (no AI/retrieval work and the optional skill is not selected/observed).
- **Workflow Mode:** `Supervised` — exact-scope governance/spec prose with serial ownership and no command execution.
- **Operational-Risk Classification:** documentation/governance, protected-path, authorization, evidence-integrity, artifact-placement, and scope risk; no product, data, credential, infrastructure, deployment, database, external-system, or runtime implementation change.
- **Command Classification:** static file reads and post-write read-back are `read-only inspection`; all tests, gates, builds, typechecks, scripts, package commands, generators, browser/local-service commands, database/deployment/backup actions, Power/MCP actions, and implementation commands are `no-run pending authorization` and explicitly excluded.
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / current spec task artifact (explicit current-request exception)`; selected subfolder `./.kiro/specs/oando-master/`; filename pattern `tasks.md`.
- **Owning source or script / authored or generated:** approved `oando-master` Tasks workflow and `I/C-01`; `authored`, not generated. No generator or command owns this update.
- **Rejected placements:** `./agents-work/` root, `./agents-work/<workstream>/<report-type>/` for this current Tasks record, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./results/site/`, `./plans/<name>/`, `./Failures.md`, root files, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, guide files, and any duplicate/copy/mirror path are rejected because they are wrong producer homes, protected paths, non-core Site targets, or unauthorized alternatives.
- **Observed placement:** `./.kiro/specs/oando-master/tasks.md` after static post-write read-back; no other output placement is claimed.
- **Locked Path Gate state:** `explicitly owner-authorized` only for the exact existing `./.kiro/specs/oando-master/tasks.md`; `./docs/**`, `./Agents/**`, every direct root file, `./.kiro/agents/**`, `.config.kiro`, and all unselected neighbors remain `Locked`/read-only evidence.
- **Site Write Gate state:** `not-applicable` to the current Tasks artifact; Task 3.4's Site Write Gate remains in force for any future `./site/` target and permits only an explicitly approved Core Product Write.
- **Validation State:** `not-run` for commands; static file inspection and post-write read-back are the only applicable evidence. Runtime lock enforcement, protected-source modification, Exact-Line rollout, README implementation, and contract coverage remain `not-observed`/`pending-owner`.
- **Unavoidable Owner Decisions:** future exact protected write/delete targets; the exact active-document contract target/form; the exact Exact-Line target list and rollout; runtime Protected Path Lock/Pre-Action Enforcement; and any README, hook, settings/MCP, skill, package, site, database, deployment, output, or command action.
- **Next action:** `V/R-01` performs static read-back of this Task 3.5 section and changed-path scope; then the Repository Owner decides any separately approved protected-file, contract, Exact-Line, README, or runtime-enforcement work.

#### Task 3.5 Conflict Stop Rule

If a target is protected, unowned, shared without serial ownership, ambiguously named, outside the current request, offered as a copy/mirror/substitute, or accompanied by contradictory evidence, stop before modification or deletion. Preserve the competing source/evidence; record the exact target, action, denial reason, and next owner action; route the decision to `I/C-01` and the Repository Owner; and resume only after a fresh exact-file authorization and serially reconciled Route Record. Do not overwrite, redirect, reinterpret, choose an alternate tool/path/Agent/permission, infer approval, append a contract, insert the Exact-Line Rule, or promote `pending-owner`, `blocked`, or `not-observed` to `verified`/`complete`. Current Conflict Stop state is `not-observed`; no conflict occurred in this static update.

#### Task 3.5 Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Publish the Locked Path Gate reference table and exact copy-paste wording; classify `./docs/**`, `./Agents/**`, every direct root file, and `./.kiro/agents/**` as Locked read-only evidence; require exact owner-named authorization and fail-closed denial; preserve source, placement, blocker, `.kiro` governance, Exact-Line, serial ownership, and evidence limitations; and change only the authorized Tasks artifact.
- **Role and Next Owner:** `I/C-01` is the Implementer and Coordinator/Serial Integration Owner; `V/R-01` is the next owner for read-only static reconciliation; the Repository Owner is the next decision owner for any protected-file authorization, contract append, Exact-Line rollout, README implementation, or runtime enforcement. No fifth role or silent one-Agent fallback is introduced.
- **Scope:** Only the static Task 3.5 record and `[x]` marker in `./.kiro/specs/oando-master/tasks.md`. It includes the Protected Path Set, exact authorization boundary, fail-closed write/delete behavior, `./agents-work/` versus `./Agents/`, `./Failures.md` rule, `.kiro` spec/skill/Site Write governance, exact Locked Path reference table and copy-paste wording, future Exact-Line Rule and idempotence boundary, Pre-Action records, four-slot ownership, Route Record, Deliverable Register, Conflict Stop Rule, Completion Record, and static/runtime limitations. It excludes every protected-source write/delete, contract append, Exact-Line insertion, README/guide/HTML/CSS write, hook/settings/MCP/skill/package/script/site/results/generated/plan/application/runtime/database/deployment/backup/Power/MCP change, and every command.
- **Paths Read and Paths Changed:** Read the current user request; `./AGENTS.md`; `./Agents/01-standard.md`; `./plans/README.md`; `./.kiro/specs/oando-master/.config.kiro`; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; the existing `./.kiro/specs/oando-master/tasks.md` Task 1.2 and Task 3.4 records; and the loaded `./.kiro/skills/oando-master/SKILL.md` and `./.kiro/skills/repo-map/SKILL.md` guidance. Changed exactly `./.kiro/specs/oando-master/tasks.md` to replace the Task 3.5 placeholder with this static record and marker. No README, guide chapter, HTML/CSS, root file, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, `.config.kiro`, skill, hook, settings/MCP, package, script, site, results, generated document, plan, application/runtime, database/migration, deployment, backup, Power, MCP, contract, or Exact-Line target was changed.
- **Route Record:** The Route Record above governs this handoff: D18 with D19/D20 boundary context; selected `oando-master` and `repo-map`; rejected non-matching skills; `Supervised`; no commands; authored Active Plan/current spec task artifact at the exact Tasks path; Protected Path Gate locked all protected neighbors; Site Write Gate not applicable; and Validation State `not-run` for commands with static read-back only.
- **Evidence:** Requirements 36.1–36.7, 39.1–39.7, and 38.6; Requirement 31's exact Locked Path reference table and copy-paste wording; Design §25's Protected Path Lock and Exact-Line Rule; Task 1.2's existing lock/authorization record; Task 3.4's placement and Site Write Gate record; authority sources; and static read-back of this changed Tasks section. This is static path/text/ownership evidence only.
- **Decisions:** Keep the four protected classes Locked by default; require exact current-request authorization for one protected file at a time; fail closed before unapproved writes/deletes; preserve source and route pending Owner Decision/Separate Approval Work; distinguish `./agents-work/<workstream>/<report-type>/` from `./Agents/**`; keep `./Failures.md` unchanged without exact authorization; retain `.kiro` spec/skill/artifact/Site Write governance; document but do not insert the exact future line; preserve one-occurrence/idempotence and insertion-failure stop; do not append either active-document contract form; keep README and runtime enforcement pending-owner/not-observed.
- **Coverage Gaps:** No runtime Locked Path interceptor, universal six-action Pre-Action Enforcement Layer, automatic Agent spawning, host-integrated denial, protected-source mutation observation, Exact-Line rollout, active-document contract coverage, README implementation, connected MCP, installed Power, rendered behavior, hosted persistence, command result, or external/global Kiro coverage is observed. The command-specific hook remains ungeneralized; static prose cannot prove enforcement.
- **Validation Command:** `none`; no shell, package, test, gate, build, typecheck, script, generator, browser/local-service, database, deployment, backup, Power, MCP, or other validation command was run. Static file inspection/read-back only.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for the exact existing `./.kiro/specs/oando-master/tasks.md` write. No protected file, root file, guide, control, runtime, output, package, database, deployment, Power/MCP, contract, Exact-Line, or command action is authorized; no inferred approval is used.
- **Hook Decision:** `not-observed`; no command or runtime hook decision was invoked, and command-specific hook evidence is not generalized to writes, deletes, reads, delegation, or handoffs.
- **Exit Status:** `not-observed`; no command or runtime action was executed.
- **Validation Limitation:** Static paths, exact wording, tables, ownership, statuses, placement records, and Tasks read-back establish only the authored documentation record. They cannot prove runtime lock enforcement, pre-action interception, fail-closed denial, automatic spawning, contract loading, Exact-Line insertion, command success, rendered behavior, hosted persistence, connected MCP, installed Power, relocation, or external/global coverage.
- **Blockers:** None within the authorized static scope. No hard blocker is recorded in `./Failures.md` because that exact root file was not authorized and no True Blocker prevents this static record. Future protected writes, contract/Exact-Line rollout, runtime enforcement, README work, and other Separate Approval Work remain pending-owner/not-observed.
- **Next Action:** `V/R-01` completes static read-back and changed-path reconciliation. The Repository Owner then decides whether to authorize any exact protected target, active-document contract form, Exact-Line target list, README lane, or runtime enforcement implementation; until then preserve all protected sources and do not use copies or substitutes.
- **Status:** `complete` for the static Task 3.5 Tasks-artifact record/read-back only; Locked Path enforcement remains `guidance-only`/`not-observed`, README implementation remains `pending-owner`, protected-source changes and Exact-Line rollout remain `not-observed`/pending-owner.

#### Task 3.5 Completion Record

- **Changed files:** exactly `./.kiro/specs/oando-master/tasks.md`, because the current request explicitly authorizes this existing Tasks artifact and Task 3.5 requires its static Locked Path Gate record and completion marker. No other file changed.
- **Validation actually run:** static `read_file`/`grep_search` inspection and post-write read-back of the Tasks artifact and its consistency sources; no shell or command-based validation was run. Static inspection is evidence of text/path/scope content only, not runtime enforcement.
- **Validation not run:** no tests, gates, builds, typechecks, scripts, package commands, generators, browser/local-service commands, database/migration/deployment/backup actions, Power/MCP actions, or other validation commands were run because the current request explicitly forbids them; no command result or runtime Hook Decision is claimed.
- **Remaining issues and next owner:** `V/R-01` owns the static read-back; the Repository Owner owns any future exact protected-file authorization, README lane approval, active-document contract target/form, Exact-Line target list/rollout, Protected Path Lock implementation, universal Pre-Action Enforcement, or other Separate Approval Work. README implementation remains `pending-owner`; runtime enforcement remains `not-observed`/`guidance-only`.
- **Scope and exclusions:** only the Task 3.5 record in `tasks.md` changed. No root file, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, `.config.kiro`, guide, HTML/CSS, skill, hook, settings/MCP, package, script, `./site/`, results, generated documents, plans, application/runtime, database/migrations, deployment, backup, Power, MCP, contract, Exact-Line target, or substitute/copy/report path was changed or created.
- **Multi-Agent Evidence:** The four-slot Agent Roster, Ownership Matrix, Route Record, static Pre-Action Gate Records, Deliverable Register, Handoff Record, Conflict Stop Rule, Completion Record, and serial integration boundary are present. The roster is static plan evidence; runtime creation/loading, automatic spawning, and universal enforcement remain `not-observed`.
- **Final lifecycle status:** `complete` for the exact static Tasks-artifact publication/read-back only. Enforcement Status is `guidance-only`/`not-observed`; protected-source integrity is preserved; Exact-Line rollout and downstream README work remain `pending-owner`/`not-observed`.

- **Requirements:** 36.1–36.7, 39.1–39.7, 38.6; Design §25.

  - [x] 3.6 Add the Kiro inventory classification, four-slot records/statuses, fail-closed limitation, and static/runtime boundary

### Task 3.6 static Kiro inventory, controlled records, and evidence-boundary reconciliation

**Task identity and publication boundary:** `oando-master / 3.6`; `specType: feature`; `workflowType: fast-task`; repository root `d:\23082026`. This is a static reconciliation record in the existing Tasks artifact. The current request authorizes exactly one existing file: `./.kiro/specs/oando-master/tasks.md`. No README, guide chapter, HTML/CSS, root file, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, `.config.kiro`, skill, hook, settings/MCP, package, script, `./site/`, results, generated document, plan, application/runtime, database/migration, deployment, backup, Power, MCP, contract, Exact-Line target, or other path is authorized for modification, deletion, execution, or creation.

**Dependency and downstream boundary:** `3.5 → 3.6` is satisfied by the existing static Locked Path Gate and exact-owner-authorization record. The prose-only README lane remains `pending-owner`; `Checkpoint A` remains a downstream read-back and owner-approval checkpoint; Task 4 remains downstream and owns future guide chapter writes. This task does not write `./agents-work/oando-repository-guide/README.md`, any guide chapter, any HTML/CSS projection, any Kiro control, or any runtime implementation. The static Task 3.6 record is complete only after its own read-back. No active-document contract form is appended.

**Acceptance and evidence boundary:** This record reconciles the existing Task 2.1/2.2/2.3 and Tasks 1.1/1.3/1.4/3.5 records. It retains the exact 36/11/4 Kiro Markdown inventory, the separate 12-path human-authored guide inventory, the five physical Agent definitions versus four plan-declared Active Agent slots, the optional AI branch state, the seven controlled-task deliverables, closed lifecycle/Enforcement Status/Validation State vocabularies, one fail-closed six-action limitation, ownership, routing, static gate records, conflict stop, handoff, completion, and static/runtime separation. Static path/text/count/read-back evidence is evidence of the document record only. It does not establish runtime loading, spawning, interception, denial, command success, rendered or hosted behavior, connected MCP, installed Power state, external/global coverage, or any stronger evidence.

#### Reconciled Kiro Markdown inventory — exactly 36 + 11 + 4 = 51

The exact approved contract forms remain only the full Kiro Agent Contract block and the exact Canonical Inclusion. A paraphrase is not a third form. This Task 3.6 record does not append either form to any Active Contract-Bearing Document. The path-by-path Task 2.1 inventory is retained below with every row carrying exactly these fields: `path`, `classification`, `contractMode`, `owner`, `evidence state`, and `limitation`. `contractMode` uses only `exact-block`, `canonical-inclusion`, `not-applicable`, or `not-observed`. Current static evidence establishes no exact contract form in the active rows, so all 36 active rows remain `not-observed`; no active contract coverage is claimed.

##### 36 Active Contract-Bearing Documents

| path | classification | contractMode | owner | evidence state | limitation |
|---|---|---|---|---|---|
| `./.kiro/agents/capability-powers-author.md` | Active Contract-Bearing | `not-observed` | Repository Owner / Agent definitions | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append, runtime loading, or enforcement claim. |
| `./.kiro/agents/containment-reconciler.md` | Active Contract-Bearing | `not-observed` | Repository Owner / Agent definitions | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append, runtime loading, or enforcement claim. |
| `./.kiro/agents/hook-localizer.md` | Active Contract-Bearing | `not-observed` | Repository Owner / Agent definitions | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append, runtime loading, or enforcement claim. |
| `./.kiro/agents/spec-task-runner.md` | Active Contract-Bearing | `not-observed` | Repository Owner / Agent definitions | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append, runtime loading, or enforcement claim. |
| `./.kiro/agents/spec-task-runner2.md` | Active Contract-Bearing | `not-observed` | Repository Owner / Agent definitions | observed-present; active baseline; exact form not observed | Preserved unchanged; static path/marker evidence only; no contract append, runtime loading, or enforcement claim. |
| `./.kiro/skills/db-migrations/SKILL.md` | Active Contract-Bearing | `not-observed` | Repository Owner / skill: db-migrations | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/skills/focss-css/SKILL.md` | Active Contract-Bearing | `not-observed` | Repository Owner / skill: focss-css | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/skills/fork-boundaries/SKILL.md` | Active Contract-Bearing | `not-observed` | Repository Owner / skill: fork-boundaries | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/skills/graph-impact/SKILL.md` | Active Contract-Bearing | `not-observed` | Repository Owner / skill: graph-impact | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/skills/oando-master/SKILL.md` | Active Contract-Bearing | `not-observed` | Repository Owner / skill: oando-master | observed-present; active baseline; exact form not observed | Router prose is not the exact contract form; no append, runtime loading, or enforcement claim. |
| `./.kiro/skills/planner-studio/SKILL.md` | Active Contract-Bearing | `not-observed` | Repository Owner / skill: planner-studio | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/skills/powers-skills-model/SKILL.md` | Active Contract-Bearing | `not-observed` | Repository Owner / skill: powers-skills-model | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/skills/repo-map/SKILL.md` | Active Contract-Bearing | `not-observed` | Repository Owner / skill: repo-map | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/skills/verify-and-gate/SKILL.md` | Active Contract-Bearing | `not-observed` | Repository Owner / skill: verify-and-gate | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/agent-behavior.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: agent-behavior | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/ai.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: ai | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/api.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: api | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/coding-standards.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: coding-standards | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/database.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: database | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/deployment.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: deployment | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/graph-layer.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: graph-layer | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/INDEX.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: INDEX | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/ltm-memory-format.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: ltm-memory-format | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/ltm-operations.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: ltm-operations | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/nova-act-viewport.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: nova-act-viewport | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/product.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: product | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/seo.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: seo | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/tech-stack.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: tech-stack | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/testing.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: testing | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/steering/ui-css.md` | Active Contract-Bearing | `not-observed` | Repository Owner / steering: ui-css | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/powers/analytics/POWER.md` | Active Contract-Bearing | `not-observed` | Repository Owner / Power: analytics | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/powers/oando-workflow/POWER.md` | Active Contract-Bearing | `not-observed` | Repository Owner / Power: oando-workflow | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/powers/observability/POWER.md` | Active Contract-Bearing | `not-observed` | Repository Owner / Power: observability | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/powers/security/POWER.md` | Active Contract-Bearing | `not-observed` | Repository Owner / Power: security | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/powers/oando-workflow/steering/routing.md` | Active Contract-Bearing | `not-observed` | Repository Owner / Power steering: oando-workflow/routing | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |
| `./.kiro/kiro-repo-guidance-setup/README.md` | Active Contract-Bearing | `not-observed` | Repository Owner / guidance setup | observed-present; active baseline; exact form not observed | Static path/marker evidence only; no contract append or runtime loading/enforcement claim. |

##### 11 Reference/History Documents

| path | classification | contractMode | owner | evidence state | limitation |
|---|---|---|---|---|---|
| `./.kiro/kiro-repo-guidance-setup/RECONCILIATION.md` | Reference or History | `not-applicable` | Repository Owner / guidance-setup history | observed-present; reference/history baseline | Non-active evidence only; no active contract coverage or append claim. |
| `./.kiro/specs/documentation-global-standards/design.md` | Reference or History | `not-applicable` | Repository Owner / spec: documentation-global-standards | observed-present; reference/history baseline | Non-active evidence only; no active contract coverage or append claim. |
| `./.kiro/specs/documentation-global-standards/implementation-record.md` | Reference or History | `not-applicable` | Repository Owner / spec: documentation-global-standards | observed-present; reference/history baseline | Non-active evidence only; no active contract coverage or append claim. |
| `./.kiro/specs/documentation-global-standards/requirements.md` | Reference or History | `not-applicable` | Repository Owner / spec: documentation-global-standards | observed-present; reference/history baseline | Non-active evidence only; no active contract coverage or append claim. |
| `./.kiro/specs/documentation-global-standards/tasks.md` | Reference or History | `not-applicable` | Repository Owner / spec: documentation-global-standards | observed-present; reference/history baseline | Non-active evidence only; no active contract coverage or append claim. |
| `./.kiro/specs/kiro-config-rewrite/design.md` | Reference or History | `not-applicable` | Repository Owner / spec: kiro-config-rewrite | observed-present; reference/history baseline | Non-active evidence only; no active contract coverage or append claim. |
| `./.kiro/specs/kiro-config-rewrite/requirements.md` | Reference or History | `not-applicable` | Repository Owner / spec: kiro-config-rewrite | observed-present; reference/history baseline | Non-active evidence only; no active contract coverage or append claim. |
| `./.kiro/specs/kiro-config-rewrite/tasks.md` | Reference or History | `not-applicable` | Repository Owner / spec: kiro-config-rewrite | observed-present; reference/history baseline | Non-active evidence only; no active contract coverage or append claim. |
| `./.kiro/specs/oando-master/design.md` | Reference or History | `not-applicable` | Repository Owner / spec: oando-master | observed-present; reference/history baseline | Non-active evidence only; no active contract coverage or append claim. |
| `./.kiro/specs/oando-master/requirements.md` | Reference or History | `not-applicable` | Repository Owner / spec: oando-master | observed-present; reference/history baseline | Non-active evidence only; no active contract coverage or append claim. |
| `./.kiro/specs/oando-master/tasks.md` | Reference or History | `not-applicable` | Repository Owner / spec: oando-master | observed-present before Task 3.6; static Tasks record only | This write does not make the Tasks artifact active contract coverage or append a contract. |

##### 4 Package Documents

| path | classification | contractMode | owner | evidence state | limitation |
|---|---|---|---|---|---|
| `./.kiro/power-packages/analytics/skills/analytics/SKILL.md` | Package Document | `not-applicable` | Repository Owner / package: analytics | observed-present; package baseline | Distributable package evidence only; not active workspace contract coverage. |
| `./.kiro/power-packages/oando-workflow/skills/oando-workflow/SKILL.md` | Package Document | `not-applicable` | Repository Owner / package: oando-workflow | observed-present; package baseline | Distributable package evidence only; not active workspace contract coverage. |
| `./.kiro/power-packages/observability/skills/observability/SKILL.md` | Package Document | `not-applicable` | Repository Owner / package: observability | observed-present; package baseline | Distributable package evidence only; not active workspace contract coverage. |
| `./.kiro/power-packages/security/skills/security/SKILL.md` | Package Document | `not-applicable` | Repository Owner / package: security | observed-present; package baseline | Distributable package evidence only; not active workspace contract coverage. |

**Count and contract reconciliation:** exactly `36 Active Contract-Bearing + 11 Reference or History + 4 Package = 51` individually recorded paths. No `exact-block` or `canonical-inclusion` status is asserted without exact evidence. Reference/History, Package, Generated, and inaccessible items are not active contract coverage. No Generated Kiro Markdown is claimed.

#### Negative inventory and inaccessible boundary

| scope | classification | contractMode | owner | evidence state | limitation |
|---|---|---|---|---|---|
| No Generated Kiro Markdown claimed in the inspected `./.kiro/` tree | Generated Kiro Markdown not claimed | `not-applicable` | Repository Owner / inventory boundary | no generated path observed; not claimed | A later observed generated path needs a new row and owner-approved scope; no generated contract coverage is inferred. |
| `./.kiro/hooks/**/*.md` | No Markdown observed; outside the 51 baseline | `not-applicable` | Repository Owner / hook boundary | observed-empty for Markdown | Hook configuration/source may exist in non-Markdown formats; no Markdown contract surface or runtime enforcement is claimed. |
| `./.kiro/mcp/**/*.md` | No Markdown observed; outside the 51 baseline | `not-applicable` | Repository Owner / MCP boundary | observed-empty for Markdown | MCP schemas do not establish configuration, connection, authentication, installation, or runtime availability. |
| `./.kiro/settings/**/*.md` | No Markdown observed; outside the 51 baseline | `not-applicable` | Repository Owner / settings boundary | observed-empty for Markdown | Non-Markdown settings do not establish a Markdown contract surface or runtime loading. |
| External/Global Kiro files outside the accessible workspace | Inaccessible External/Global Kiro file | `not-observed` | Repository Owner / external-global boundary | not-observed | No path or read evidence exists; inspection, change, contract coverage, loading, and enforcement are not claimed. |

#### Twelve live guide Markdown work surfaces — separate from the 51-file Kiro inventory

These are human-authored guide-work surfaces under `./agents-work/oando-repository-guide/`, not additional members of the `./.kiro/**/*.md` inventory and not Active Contract-Bearing Documents in the 51-file count. Their classification and ownership remain separate from Kiro inventory classification.

| path | classification | owner | evidence state | limitation |
|---|---|---|---|---|
| `./agents-work/oando-repository-guide/README.md` | Human-authored guide work surface / start page | Repository Owner / guide workstream | observed-present; live Markdown surface | No HTML authoring direction or deterministic projection method is proven by filename/link evidence. |
| `./agents-work/oando-repository-guide/markdown/01-repository-map.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | Guide-work evidence only; no projection provenance or runtime claim. |
| `./agents-work/oando-repository-guide/markdown/02-application-architecture.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | Guide-work evidence only; no projection provenance or runtime claim. |
| `./agents-work/oando-repository-guide/markdown/03-product-domains.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | Guide-work evidence only; no projection provenance or runtime claim. |
| `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | Guide-work evidence only; no projection provenance or runtime claim. |
| `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | Guide-work evidence only; no projection provenance or runtime claim. |
| `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | Guide-work evidence only; no projection provenance or runtime claim. |
| `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | Guide-work evidence only; no projection provenance or runtime claim. |
| `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | Guide-work evidence only; no projection provenance or runtime claim. |
| `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | Guide-work evidence only; no projection provenance or runtime claim. |
| `./agents-work/oando-repository-guide/markdown/10-quality-validation.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | observed static guide text only; no command/rendered proof. |
| `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md` | Human-authored guide work surface / chapter | Repository Owner / guide workstream | observed-present; live Markdown surface | Guide-work evidence only; no projection provenance or runtime claim. |

**HTML relationship:** the 12 HTML files and `guide.css` remain conditional projection surfaces. Static paired names, navigation, CSS references, or content differences do not prove whether Markdown or HTML is the authoring source or that a deterministic generator exists. The unresolved/conditional Markdown-to-HTML relationship remains as recorded in Task 2.2: inspect provenance in a separately approved guide lane; if provenance is not evidenced, leave HTML/CSS unchanged and record a coverage gap. This task does not write HTML/CSS and does not claim rendered or hosted behavior. The README lane remains `pending-owner` until Checkpoint A and exact downstream authorization.

#### Physical Agent definitions versus exactly four plan-declared Active Agent slots

The five physical definition files under `./.kiro/agents/` are a separate static inventory and remain preserved, including `./.kiro/agents/spec-task-runner2.md`. Physical definitions are not Active Agent slots, not runtime loading evidence, and not permission to modify the definitions.

| physical definition path | static definition distinction | relationship to four slots | state/limitation |
|---|---|---|---|
| `./.kiro/agents/capability-powers-author.md` | Specialized Task 6 capability/Power author definition | Not an Active Agent slot or fifth role | observed-present; no runtime loading/assignment observed. |
| `./.kiro/agents/containment-reconciler.md` | Specialized Task 4 containment/reconciliation definition | Not an Active Agent slot or fifth role | observed-present; no runtime loading/assignment observed. |
| `./.kiro/agents/hook-localizer.md` | Specialized Task 5 hook-localization definition | Not an Active Agent slot or fifth role | observed-present; no runtime loading/assignment observed. |
| `./.kiro/agents/spec-task-runner.md` | General approved-spec coordinator/execution definition | Not an Active Agent slot; definition name is not a roster identity | observed-present; no runtime loading/assignment observed. |
| `./.kiro/agents/spec-task-runner2.md` | Second general approved-spec coordinator/execution definition | Not an Active Agent slot; preserved unchanged and not used to make counts equal | observed-present and preserved; no rename/delete/disable/modify/runtime assignment observed. |

The plan-declared Active Agent roster contains exactly four entries. `Coordinator/Serial Integration Owner` is attached to `I/C-01`; it is not a fifth role.

| Active slot | role | coordinator designation | permission and owned scope | Multi-Agent Availability State | lifecycle status | next owner |
|---|---|---|---|---|---|---|
| `S/M-01` | Scout/Map | `coordinator: false` | Read-only authority, inventory, path, and evidence discovery; no write/delete/command permission | `available` (declared plan capacity only) | `complete` for static evidence | `P/R-01` |
| `P/R-01` | Planner/Risk | `coordinator: false` | Read-only classification, route, risk, status, command, approval, and Owner Decision planning; no write/delete/command permission | `available` (declared plan capacity only) | `complete` for static planning | `I/C-01` |
| `I/C-01` | Implementer | `coordinator: true`; Coordinator/Serial Integration Owner attached | Read/write only for exact existing `./.kiro/specs/oando-master/tasks.md`; serial integration; no delete or neighboring-path permission | `available` (declared plan capacity only) | `serial-integrated` | `V/R-01` |
| `V/R-01` | Verifier/Reporter | `coordinator: false` | Read-only read-back, changed-path audit, limitation reconciliation, and handoff report; no implementation or command permission | `available` (declared plan capacity only) | `complete` for static read-back | `Repository Owner` |

No silent one-Agent fallback is permitted. Runtime creation, loading, automatic assignment/spawning, and a real four-entry runtime roster remain `not-observed`; the four entries above are plan-declared static records only. If a host cannot create or prove the four entries, the status remains `guidance-only` or `not-observed` and the runtime gap is Separate Approval Work.

#### Optional AI branch and existing skill/control classifications

`./.kiro/skills/ai-retrieval/SKILL.md` is absent in the observed current skill inventory and is `absent / not-selected`. Absence is not installed or selected evidence. Do not create, activate, or claim this skill. If a future owner selects it, that exact file needs a new Route Record and authorization; until then AI/retrieval work uses Local Evidence, `repo-map`, and every other matching existing skill. Existing skill directories remain statically classified as `db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `oando-master`, `planner-studio`, `powers-skills-model`, `repo-map`, and `verify-and-gate`; directory presence does not prove activation or runtime loading. No skill, Power, or MCP was activated here.

#### Controlled-task deliverables, closed statuses, and validation distinction

Every controlled task has exactly these seven named deliverables:

1. Agent Roster.
2. Ownership Matrix.
3. Route Record.
4. Pre-Action Gate Records.
5. Handoff Record Register.
6. Conflict Stop Record when a conflict occurs.
7. Completion Record.

The lifecycle Status Vocabulary is closed to exactly: `planned`, `assigned`, `ready`, `in-progress`, `blocked`, `denied`, `handoff-ready`, `serial-integrated`, `verified`, `complete`, `pending-owner`, and `not-observed`.

The Enforcement Status Vocabulary is closed to exactly: `guidance-only`, `not-observed`, `partially-enforced`, `enforced`, and `blocked`.

The Validation State vocabulary is distinct from both lifecycle and enforcement and remains exactly: `not-needed`, `eligible`, `pending-user-authorization`, `blocked-by-hook`, `observed-pass`, `observed-fail`, and `not-run`. This task has `Validation State: not-run` for commands; static file reads and read-back are document evidence, not command validation. Missing fields or proof keep a Completion Record `blocked`, `pending-owner`, or `not-observed`; they never promote it to `verified`, `enforced`, or `complete` by implication. `complete` below is limited to static publication/read-back.

#### Ownership Matrix for Task 3.6

| objective, evidence item, artifact, or exact path | exclusive owner | permission | serial/integration rule |
|---|---|---|---|
| 36/11/4 inventory rows, negative inventory, contract-mode classification, and inaccessible External/Global boundary | `S/M-01` for read-only evidence; `P/R-01` for classification | Read-only | `I/C-01` serially reconciles against Task 2.1; no Active Contract-Bearing source is changed. |
| 12 guide Markdown work surfaces and conditional HTML/provenance relationship | `S/M-01` for path evidence; `P/R-01` for guide/projection classification | Read-only | README and chapters remain pending-owner; no guide/HTML/CSS write is permitted in Task 3.6. |
| Five physical definitions versus four Active Agent slots; optional AI branch; existing skill/control state | `S/M-01` for static evidence; `P/R-01` for risk/status decisions | Read-only | `I/C-01` serially integrates; all five definitions, especially `spec-task-runner2.md`, remain unchanged. |
| Agent Roster, Ownership Matrix, Route Record, deliverable/status records, static gate records, conflict rule, handoff, and Completion Record | `I/C-01` with Coordinator/Serial Integration Owner attached | Write only in exact `tasks.md` target | One serial write; `V/R-01` performs read-only read-back and cannot promote runtime evidence. |
| `./.kiro/specs/oando-master/tasks.md` Task 3.6 record | `I/C-01` | Read/write for this exact existing file only | This is the sole current write target; every neighbor remains locked or excluded. |
| Static read-back and changed-path/limitation report | `V/R-01` | Read-only | Read-back follows the `I/C-01` write; unresolved gaps go to the Repository Owner. |
| All other paths, including README, guide chapters, HTML/CSS, root, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, hooks, settings/MCP, skills, packages, site, results, generated output, plans, application/runtime, database, deployment, backup, Power, and commands | `I/C-01` as serial rejection boundary | No write/delete/execute permission | Stop on scope expansion; preserve source; no alternate path, tool, Agent, permission, copy, or inferred approval. |

#### Route Record for Task 3.6

- **Outcome:** Reconcile the exact Kiro inventory and separate guide work surfaces; publish the four-slot static controlled-task records, closed statuses, one fail-closed six-action limitation, and honest static/runtime boundary in `tasks.md` without changing any active document, guide, control, or runtime path.
- **Domain / Domain Index card:** `D20 — Kiro, skills, Powers, MCP, and Agents`, with D18/D19 boundary context for guide work, locked documentation, and artifact placement. This is repository-local governance/spec work, not product implementation.
- **Exact first evidence locations and reasons:** the current user request for exact write scope and command prohibition; `./.kiro/specs/oando-master/requirements.md` Requirements 33–35, 37–38, and 40 for inventory, four slots, fail-closed records, statuses, and honest handoff; `./.kiro/specs/oando-master/design.md` §§21–29 and Properties 16–19 for serial integration, inventory, four slots, gate, records, and evidence layers; existing Task 2.1/2.2/2.3 and Tasks 1.1/1.3/1.4/3.5 sections for reconciled path/status/lock decisions; `./.kiro/specs/oando-master/.config.kiro` for spec identity/workflow; `./AGENTS.md`, `./Agents/01-standard.md`, and `./plans/README.md` as read-only authority/coordination evidence; and the loaded `oando-master`, `repo-map`, and `powers-skills-model` guidance.
- **Candidate paths:** only `./.kiro/specs/oando-master/tasks.md` is a write candidate. The 51 Kiro paths, 12 guide paths, five definition files, controls, authority files, and all excluded paths are read-only evidence or pending-owner destinations, not mutation targets.
- **Selected Package Skills and trigger evidence:** `oando-master` (mandatory first router and completion contract); `repo-map` (exact spec/repository path and authority orientation); `powers-skills-model` (Kiro inventory, Agent/skill/Power/MCP distinctions, static/runtime boundary, and capability records). Selection is guidance-only; no Power, MCP, skill activation, or runtime capability is performed.
- **Rejected Package Skills and reasons:** `db-migrations` (no SQL, schema, RLS, grants, rollback, or database work); `focss-css` (no styling, tokens, Tailwind, icons, or FOCSS work); `fork-boundaries` (no Planner/Studio source or cross-import change); `graph-impact` (no shared-code, dependency, blast-radius, or cycle analysis); `planner-studio` (no Planner/Studio route, canvas, persistence, or handoff change); `verify-and-gate` (the current request forbids all tests, gates, builds, typechecks, scripts, package commands, browser/local-service commands, and other command validation); `ai-retrieval` (the optional file is absent/not-selected and no AI/retrieval implementation is in scope).
- **Workflow Mode:** `Supervised` — exact-scope governance/spec documentation with serial integration, static read-back, and no automatic execution.
- **Operational-Risk Classification:** documentation/governance, protected-path, authorization, contract-scope, artifact-placement, evidence-integrity, and future runtime-enforcement risk; no product, data, credential, infrastructure, deployment, database, or external-system mutation.
- **Command Classification:** static `list_directory`, `read_file`, `grep_search`, and the authorized post-write read-back are `read-only inspection`/static artifact evidence; no shell command, test, gate, build, typecheck, script, package, browser, local-service, database, deployment, backup, Power, MCP, generator, or implementation command is proposed or run. Any such action is `no-run pending authorization`.
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / current spec task artifact`; selected subfolder `./.kiro/specs/oando-master/`; filename `tasks.md`; owner/source `I/C-01` under the approved oando-master fast-task workflow; authored, not generated.
- **Rejected placements:** README/guide/HTML/CSS, `./agents-work/**`, `./results/**`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./plans/**`, `./Failures.md`, root files, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, hooks, settings/MCP, packages, application/runtime, database, deployment, backup, Power/MCP, and all substitute/copy/mirror/report paths.
- **Locked Path Gate state:** `explicitly owner-authorized` only for the exact existing `./.kiro/specs/oando-master/tasks.md`; `./docs/**`, `./Agents/**`, every direct root file, `./.kiro/agents/**`, `.config.kiro`, and all unselected neighbors remain `Locked`/read-only evidence under Task 3.5.
- **Site Write Gate state:** `not-applicable` to the current Tasks artifact. The Task 3.5 and Task 3.4 Site Write boundary remains in force; any future `./site/` target would require an explicitly approved Core Product Write, and no Non-Core Artifact may target `./site/`.
- **Validation State:** `not-run` for commands; static reads and read-back are the only applicable evidence. No command, gate, test, build, typecheck, script, package, browser, service, database, deployment, backup, Power, MCP, generator, runtime, or external action was run.
- **Unavoidable Owner Decisions:** exact future Active Contract-Bearing target/form; optional `ai-retrieval` selection; runtime four-entry roster creation/loading/spawning; universal Pre-Action Enforcement implementation; any Protected Path/Exact-Line/README/guide/HTML/CSS/control write; any Power/MCP activation or connection; and all command/validation authorization remain separate Owner Decisions or Separate Approval Work. None is inferred here.
- **Next action:** `V/R-01` performs static read-back of the Task 3.6 record and changed-path scope; after that, the Repository Owner handles Checkpoint A approval before Task 4 or any README/guide write.

#### Static Pre-Action Gate Records for Task 3.6

These are static records, not executable or host-integrated decisions. Prose, records, prompts, self-attestation, post-review, and a save hook are guidance-only and do not satisfy a real universal gate. One future fail-closed gate must cover all six action kinds through the same decision boundary.

| action | static record/decision | required limitation and next owner action |
|---|---|---|
| `read` | `allow` only for the exact named spec/authority/control/guide evidence as read-only inspection | A future gate must verify task/Agent/role, exact target, read permission, Protected Path classification, status, scope, and Route Record. No protected read upgrades to write/delete; runtime decision is `not-observed`. |
| `write` | `allow` only for exact existing `./.kiro/specs/oando-master/tasks.md`; `deny` for every other path | A future gate must verify exact target, exclusive/serial ownership, write permission, Route Record, Protected Path Lock, Site Write Gate when relevant, and delivery match. Missing or denied evidence preserves the source and routes to the Repository Owner; runtime decision is `not-observed`. |
| `delete` | `deny`; no deletion scope or exact current-request deletion authorization exists | A future gate must verify exact target/scope, exact owner authorization, exclusive ownership, and lock state. No alternate deletion target, cleanup path, copy, or inferred consent is selected; runtime decision is `not-observed`. |
| `command` | `deny/no-run pending authorization`; no command is proposed or run | A future gate must verify classification, exact repository-root cwd, exact current-session authorization when required, Hook Permission, and recorded scope. The current command hook was not invoked here; runtime decision is `not-observed`. |
| `delegation` | `deny` for any new/unrostered receiver; no new delegation is proposed | A future gate must verify the Coordinator function, one of exactly four roster entries, role, exact paths, delivery conditions, and next owner. No fifth Agent, alternate receiver, or permission transfer is inferred; runtime decision is `not-observed`. |
| `handoff` | `allow` only after the complete ordered Handoff Record fields below are present and paths match ownership | A future gate must verify all fields, receiving owner, ownership-matching paths, observed-versus-not-run validation, and current evidence. No runtime handoff decision is observed. |

**Single fail-closed gate limitation for all six actions:** before any `read`, `write`, `delete`, `command`, `delegation`, or `handoff`, one future executable or host-integrated Pre-Action Enforcement Layer must evaluate one Action Record and return explicit `allow` or `deny` with a reason and next owner action. Missing, malformed, stale, ambiguous, contradictory, denied, unavailable, or indeterminate gate evidence denies before execution, records the concrete reason and next owner, preserves the proposed target/scope, and never chooses an alternate tool, path, command, Agent, permission, owner, or inferred approval. If the layer is unavailable or indeterminate, the action remains denied and Enforcement Status is `blocked` or `not-observed`, never an implicit allow. The current `block-agent-tests` evidence remains command-specific only: the observed `PreToolUse` command-tool matcher and command payload checks are not universal evidence and are not generalized to reads, writes, deletes, delegation, or handoffs. No current runtime gate decision was observed.

#### Conflict Stop Rule for Task 3.6

If an inventory row, classification, contractMode, guide/projection relationship, owner, target, roster count, role, permission, status, Action Record, handoff field, changed path, authorization, or evidence value is missing, malformed, stale, ambiguous, contradictory, denied, unavailable, or outside the Route Record, stop before the affected write, delegation, handoff, or claim. If ownership overlaps or edits conflict, preserve the competing evidence and source, record the exact action/target, reason, and next owner, and route to `I/C-01` and the Repository Owner for serial reconciliation. Resume only after a fresh complete current record is reconciled. Never overwrite, reinterpret, select an alternate tool/path/Agent/permission/receiver, create a substitute/copy, infer approval, or promote `pending-owner`, `blocked`, or `not-observed` to `verified`/`complete`. Current conflict state is `not-observed`; no conflict occurred in this static record.

#### Task 3.6 Deliverable Register and status boundary

| named deliverable | owner | lifecycle status | Enforcement Status | evidence/limitation |
|---|---|---|---|---|
| Agent Roster | `I/C-01`, verified by `V/R-01` | `complete` for static four-slot record | `guidance-only` / `not-observed` | Exactly four plan-declared entries and one attached coordinator designation; runtime creation/loading/spawning is not observed. |
| Ownership Matrix | `P/R-01`, serially integrated by `I/C-01` | `complete` for static mapping | `guidance-only` | Every objective/evidence/artifact/path is mapped; static text is not a runtime ownership lock. |
| Route Record | `P/R-01`, serially integrated by `I/C-01` | `complete` for static route | `guidance-only` | Selected/rejected skills, risk, command class, artifact, lock, Site Write, validation, and next action are recorded. |
| Pre-Action Gate Records | `P/R-01`, serially integrated by `I/C-01` | `complete` for static six-action schema | `guidance-only` / `not-observed` | Static decisions are recorded above; no executable/host-integrated gate or runtime decision is observed. |
| Handoff Record Register | `I/C-01`, verified by `V/R-01` | `complete` for static ordered handoff | `guidance-only` | Complete required fields appear below; unavailable values are `not-observed`. |
| Conflict Stop Record when a conflict occurs | `I/C-01` | `not-observed` | `not-observed` | No conflict occurred; the stop rule remains active and no conflict is silently resolved. |
| Completion Record | `V/R-01`, serially integrated by `I/C-01` | `complete` for static publication/read-back only | `guidance-only` / `not-observed` | Changed path/reason, static evidence, not-run validation, gaps, next owner, and exclusions appear below. |

**Status boundary:** `complete` applies only to this static Tasks-artifact publication and read-back. It does not mean active-document contract coverage, runtime roster creation/loading/spawning, universal pre-action interception, fail-closed denial, command success, rendered/hosted behavior, connected MCP, installed Power, or External/Global coverage. Missing or unavailable proof remains `pending-owner`, `blocked`, or `not-observed`; it is never promoted by prose.

#### Task 3.6 Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Reconcile the exact 36/11/4 Kiro inventory and negative inventory; keep the 12 guide Markdown work surfaces separate; distinguish five physical definitions from four Active Agent slots; preserve the absent/not-selected AI branch; publish the seven deliverables, closed statuses, static gate records, fail-closed limitation, conflict stop rule, and evidence-honest completion boundary; and change only `./.kiro/specs/oando-master/tasks.md`.
- **Role and Next Owner:** `I/C-01` is Implementer and Coordinator/Serial Integration Owner; `V/R-01` is next for read-only static read-back; the Repository Owner is next for Checkpoint A approval, the pending README lane, any active-document contract form/target, runtime roster/enforcement, Exact-Line/protected-path work, optional AI selection, or command authorization. No fifth role or silent one-Agent fallback is introduced.
- **Scope:** Static Task 3.6 inventory/control/status/handoff record only. It covers the 51-row classification, 12 guide surfaces and unresolved HTML relationship, five physical definitions/four slots, absent AI branch, seven records, closed vocabularies, six-action fail-closed rule, ownership, route, static gate, conflict stop, completion, and static/runtime evidence boundary. It excludes README/guide/HTML/CSS writes, contract append, Exact-Line insertion, protected-source write/delete, hook/settings/MCP/skill/Power changes, package/script/site/application/runtime/database/deployment/output changes, delegation, and every command.
- **Paths Read and Paths Changed:** Read the current user request; `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; `./.kiro/specs/oando-master/.config.kiro`; the existing `./.kiro/specs/oando-master/tasks.md` Task 1.1/1.3/1.4/2.1/2.2/2.3/3.5 records; and loaded `oando-master`, `repo-map`, and `powers-skills-model` guidance. Changed exactly `./.kiro/specs/oando-master/tasks.md` by replacing only the Task 3.6 placeholder with this record and its completion marker. No README, guide chapter, HTML/CSS, root, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, `.config.kiro`, skill, hook, settings/MCP, package, script, site, results, generated document, plan, application/runtime, database/migration, deployment, backup, Power, MCP, contract, Exact-Line, or other path was changed.
- **Route Record:** The Route Record above governs this handoff: D20 with D18/D19 context; selected `oando-master`, `repo-map`, and `powers-skills-model`; rejected non-matching/unavailable skills; `Supervised`; no commands; authored Active Plan/current Tasks artifact; exact target authorization; protected neighbors locked; Site Write Gate not applicable; Validation State `not-run` for commands and static read-back only.
- **Evidence:** Task 2.1's 51 individual rows and negative inventory; Task 2.2's 12 guide/projection relationship; Task 2.3's five-definition/four-slot, optional-branch, skill/control, and command-hook boundary; Tasks 1.1/1.3/1.4's roster, gate, deliverable/status, handoff, and evidence schemas; Task 3.5's Locked Path/Site Write boundary; Requirements 33.1–33.9, 34.1–34.10, 35.1–35.11, 37.1–37.11, 38.1–38.5, and 40.1–40.6; Design §§21–29; Properties 16–19; and static post-write read-back of this Tasks section. This is static evidence only.
- **Decisions:** Retain exactly 36 Active Contract-Bearing, 11 Reference or History, and 4 Package rows; keep all active `contractMode` values `not-observed` because exact contract evidence is absent; do not append either contract form; keep negative/inaccessible scopes outside active coverage; keep the 12 guide paths separate and HTML conditional; preserve all five physical definitions, especially `spec-task-runner2.md`, while declaring exactly four plan slots with the coordinator attached to `I/C-01`; keep `ai-retrieval` absent/not-selected; require one future fail-closed gate for all six action kinds; preserve command-hook evidence as command-specific; keep all missing/runtime proof `not-observed`/`pending-owner`; and preserve the Tasks-only authorization and Task 3.5 lock/Site Write boundary.
- **Coverage Gaps:** No active-document contract append or exact coverage; no generated Kiro Markdown path; no Markdown under hooks/MCP/settings; External/Global files are inaccessible/not-observed; HTML provenance remains unresolved/conditional; optional AI skill is absent/not-selected; runtime four-slot creation/loading/spawning is not observed; no universal pre-action interception or fail-closed runtime denial is observed; no command success, rendered/hosted behavior, connected MCP, installed Power, external/global coverage, or other stronger evidence is observed.
- **Validation Command:** `none`; no tests, gates, builds, typechecks, scripts, package commands, generators, browser/local-service commands, database/migration actions, deployment, backup, Power/MCP actions, external actions, or other commands were run. Static `list_directory`/`read_file`/`grep_search` inspection and the authorized Tasks-artifact read-back are the only evidence actions.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit current-session authorization exists only for the exact existing `./.kiro/specs/oando-master/tasks.md` write. No neighboring `.kiro` path, active document, guide, protected path, control, runtime, package, database, deployment, output, Power/MCP, contract, Exact-Line, or command action is authorized; no inferred approval is used.
- **Hook Decision:** `not-observed` for this task. The existing command-specific `block-agent-tests` evidence is not a universal decision and no hook decision was invoked; it is not generalized to reads, writes, deletes, delegation, or handoffs.
- **Exit Status:** `not-observed` — no command or host/runtime action was executed.
- **Validation Limitation:** Static path, text, count, ownership, classification, status, scope, and Tasks read-back evidence establishes only this authored record and unchanged-scope claim. It cannot prove active-document contract coverage, runtime roster creation/loading/spawning, universal pre-action interception or fail-closed denial, command success, rendered/hosted behavior, connected MCP, installed Power, external/global coverage, or behavior outside the inspected static scope.
- **Blockers:** None within the authorized static Task 3.6 scope. README implementation, Checkpoint A owner approval, Task 4 guide writes, active-document contract target/form, runtime roster/enforcement, optional AI selection, Exact-Line/protected-path implementation, and all command/Power/MCP/runtime work remain pending-owner/Separate Approval Work, not current-scope blockers. No root `./Failures.md` write is authorized or needed.
- **Next Action:** `V/R-01` performs read-only static read-back of this Task 3.6 record and exact changed-path boundary; the Repository Owner then decides Checkpoint A approval and any separately scoped downstream work. Stop if scope expands; do not retry automatically.
- **Status:** `complete` for the static Task 3.6 Tasks-artifact record/read-back only; Enforcement Status remains `guidance-only`/`not-observed`, runtime evidence remains `not-observed`, and downstream README/Checkpoint A/Task 4 remain pending-owner/downstream.

#### Task 3.6 Completion Record

- **Changed files:** exactly `./.kiro/specs/oando-master/tasks.md`, because the current request explicitly authorizes only this existing Tasks artifact and Task 3.6 requires the static inventory/control/record reconciliation and completion marker. No other file was changed or created.
- **Changed-file reason:** the Task 3.6 placeholder was replaced with the requested static 36/11/4 inventory reconciliation, separate 12-path guide classification, four-slot and five-definition distinction, absent AI branch, controlled-task records/statuses, fail-closed limitation, static/runtime boundary, handoff, and completion evidence.
- **Validation actually run:** static `list_directory`, `read_file`, and `grep_search` reads of the spec directory and required consistency records, followed by static read-back of the changed `tasks.md` section. These are document/path evidence only, not command validation or runtime evidence.
- **Validation not run:** no tests, gates, builds, typechecks, scripts, package commands, generators, browser/local-service commands, database/migration actions, deployment, backup, Power/MCP actions, external actions, or other commands were run because the current request forbids them. No command result, hook decision, runtime roster, or runtime enforcement result is claimed.
- **Remaining issues and next owner:** `V/R-01` owns static read-back; the Repository Owner owns Checkpoint A approval, the pending README lane, Task 4 guide approval, exact Active Contract-Bearing target/form, runtime four-slot roster/enforcement, optional AI selection, Exact-Line/protected-path work, and any command or Power/MCP authorization. HTML relationship remains conditional/unresolved.
- **Unverified behavior:** active-document contract coverage, runtime loading/activation, automatic Agent creation/loading/spawning, universal pre-action interception, fail-closed runtime denial, command success, rendered/hosted behavior, connected MCP, installed Power, external/global Kiro coverage, and any behavior beyond static inspected paths remain `not-observed`.
- **Scope and exclusions:** only `./.kiro/specs/oando-master/tasks.md` changed. README, 12 guide Markdown surfaces, HTML/CSS, all 51 Kiro source paths, all five physical Agent definitions including `spec-task-runner2.md`, root files, `./docs/**`, `./Agents/**`, `.config.kiro`, hooks, settings/MCP, skills, packages, scripts, site, results, generated documents, plans, application/runtime, databases/migrations, deployment, backup, Power, MCP, contract forms, Exact-Line targets, and substitute/copy/report paths were not changed.
- **Multi-Agent Evidence:** the static four-entry Agent Roster, Ownership Matrix, Route Record, seven-deliverable Register, static Pre-Action Gate Records, Conflict Stop Rule, ordered Handoff Record, and this Completion Record are present. They are static plan evidence; runtime Agent creation/loading/spawning and universal enforcement remain `not-observed`.
- **Coverage-Gap Admissions:** the External/Global Kiro boundary is inaccessible/not-observed; no Generated Kiro Markdown is claimed; no Markdown is observed under hooks/MCP/settings; HTML provenance is unresolved/conditional; the optional AI branch is absent/not-selected; active contract coverage and runtime enforcement are unobserved. Each gap remains within its stated scope and has the Repository Owner as next decision owner.
- **Separate Approval Work:** any active-document contract append, Exact-Line rollout, Protected Path Lock implementation, universal Pre-Action Enforcement, runtime four-slot roster/checker/spawning, README/guide/HTML/CSS write, optional AI skill creation, hook/settings/MCP/Power change, package/script/site/application/runtime/database/deployment/output change, or command/validation action requires a new exact Route Record and owner authorization.
- **Status distinction:** lifecycle `complete` is limited to static Tasks-artifact publication/read-back; Enforcement Status is `guidance-only`/`not-observed`; Validation State is `not-run`; pending/blocked/unobserved runtime and owner decisions are not promoted.
- **Final lifecycle status:** `complete` for Task 3.6 static publication/read-back only. The downstream README lane, Checkpoint A owner approval, and Task 4 remain pending-owner/downstream; no runtime or universal enforcement completion is claimed.

- **Requirements:** 33.1–33.9, 34.1–34.10, 35.1–35.11, 37.1–37.11, 38.1–38.5, 40.1–40.6; Design §§21–29; Properties 16–19.

### Checkpoint A — Freeze README vocabulary, exact paths, ownership, and approval states

- **Dependency:** `3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6`.
- **Role slots:** all four fixed slots are present: Scout/Map; Planner/Risk; Implementer + Coordinator/Serial Integration Owner; Verifier/Reporter.
- Read back the README against the 51-file Kiro inventory, 12 guide Markdown paths, D01–D22 names, status/gap schema, four-role roster, closed records/statuses, Locked Path Gate, Site Write Gate, exact current chapter links, and Owner Decision register.
- **Evidence/approval:** static read-back only; owner approval is required before Task 4. No tests, gates, builds, typechecks, scripts, package commands, protected writes, or runtime claims.

- [x] 4. Serially augment the ten live guide chapters 01–10

- **Dependency:** Checkpoint A.
- **Role slots:** `S/M-01` reads chapter evidence; `P/R-01` plans each chapter and risk; `I/C-01` owns exactly one chapter path per leaf and serially integrates it; `V/R-01` verifies each handoff. Exactly four slots remain declared.
- **Exact owned paths, in order:**
  - `./agents-work/oando-repository-guide/markdown/01-repository-map.md`
  - `./agents-work/oando-repository-guide/markdown/02-application-architecture.md`
  - `./agents-work/oando-repository-guide/markdown/03-product-domains.md`
  - `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`
  - `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`
  - `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`
  - `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`
  - `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`
  - `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`
  - `./agents-work/oando-repository-guide/markdown/10-quality-validation.md`
- **Approval gate:** after Checkpoint A, each leaf owns exactly one path; the next leaf waits for the prior handoff and serial integration. README, chapter neighbors, HTML/CSS, Kiro controls, protected paths, `./site/`, runtime/package/database/output paths, and commands remain excluded.

  - [x] 4.1 Augment `01-repository-map.md`

Map `./START.md`, `./AGENTS.md`, `./docs/architecture/layout.md`, `./docs/architecture/stack.md`, `./docs/architecture/routes.md`, `./docs/architecture/product-map.md`, `./plans/README.md`, and current guide paths; classify source/generated/private/legacy/absent/unverified; preserve no-guess discovery and Locked Path rules.

- **Requirements:** 1.1–1.6, 7.1, 8.1–8.3, 9.1–9.2, 14.1–14.6, 20.1, 20.8, 27.1–27.7, 30.10, 31.1–31.6, 33.9.

  - [x] 4.2 Augment `02-application-architecture.md`

Trace route → feature → component → shared/server → platform/persistence using exact Site, API, Planner, and Studio roots; preserve no cross-import and Site Write Gate limitations.

- **Requirements:** 2.2–2.4, 3.1–3.4, 5.1–5.3, 6.1–6.4, 8.1–8.5, 12.5, 20.2, 20.5–20.6, 29.1–29.5, 30.7, 30.22, 30.25–30.26.

  - [x] 4.3 Augment `03-product-domains.md`

Include exact starts and conditional skills, Visual Detail Checklist, CRM status distinction, advisory-only AI, Planner/Studio isolation, and no runtime or hosted claims from path presence.

- **Requirements:** 2.2–2.8, 2.13, 3.1–3.7, 4.1–4.7, 5.1–5.7, 8.2–8.5, 20.2–20.8, 23.1–23.14, 26.1–26.7, 30.4–30.7, 30.21–30.23.

  - [x] 4.4 Augment `04-data-api-persistence.md`

Cite Products versus Admin ownership, exact migration directories, rollback/grants/policies, production read-only filesystem, mode-aware selectors, and secret boundaries; keep all migration/schema/database paths read-only.

- **Requirements:** 3.1, 4.1–4.4, 5.1–5.7, 6.1–6.10, 7.6, 8.6, 10.1–10.10, 11.3, 12.5, 18.4, 20.3–20.5, 20.8, 24.7, 25.1–25.10, 27.2–27.3, 29.3, 30.7, 30.24–30.27.

  - [x] 4.5 Augment `05-tooling-ci-tech-docs.md`

Classify commands before proposing them; preserve root pnpm boundary, two Vitest lanes, Playwright, generated-documents separation, `./tech-docs-generator/` sibling relationship, results-purpose folders, and unavailable `pnpm run typecheck:scripts` state.

- **Requirements:** 6.1–6.10, 7.1–7.5, 8.8–8.9, 10.1–10.10, 11.1–11.3, 18.1–18.8, 20.15–20.17, 24.1–24.8, 25.1–25.10, 28.1–28.20, 29.1–29.10, 30.19, 30.24–30.25.

  - [x] 4.6 Augment `06-operations-infrastructure.md`

Separate Vercel/Worker/R2/Supabase/backup/observability/local-service planning from execution. Require exact command, repository-root cwd, authorization, Hook Decision, exit status, first failed subcommand, output summary, cause classification, and proof limitation before any failure claim.

- **Requirements:** Special Requirement 3.1–3.5; 7.1–7.7, 9.3–9.6, 10.1–10.10, 11.2–11.4, 18.4–18.8, 20.21, 24.1–24.8, 25.1–25.10, 27.2–27.7, 30.6, 30.14, 31.7.

  - [x] 4.7 Augment `07-docs-governance-planning.md`

Preserve `./docs/`, `./Agents/`, direct root files, `./Failures.md`, `./agents-work/`, `./results/`, `./plans/`, and `./generated-documents/` boundaries; publish exact-file authorization and no substitute-copy claims.

- **Requirements:** 7.1–7.7, 11.1–11.6, 18.1–18.3, 19.1–19.7, 24.1–24.8, 27.1–27.7, 28.1–28.20, 30.7, 30.24, 31.1–31.10, 36.1–36.7, 39.1–39.7.

  - [x] 4.8 Augment `08-kiro-workspace.md`

Distinguish active/reference/package/generated/inaccessible classes; list the 51-file baseline and 12 guide work surfaces; preserve five physical Agent files versus four Active Agent slots; distinguish schema/configuration/connection and candidate/installed Power states; keep optional AI absent unless selected.

- **Requirements:** 5.1–5.7, 8.1–8.8, 9.1–9.7, 11.2–11.5, 13.1–13.4, 27.2–27.7, 30.19, 30.27, 31.8, 33.1–33.9, 34.8–34.10, 38.1–38.5.

  - [x] 4.9 Augment `09-local-generated-environment.md`

Keep secrets private, classify environment and generated output honestly, reject root report/result homes, and preserve `./site/` versus `./results/site/` and `./tech-docs-generator/` versus `./generated-documents/`.

- **Requirements:** 2.1, 6.1–6.4, 6.8, 7.3–7.5, 14.1–14.6, 18.1–18.3, 19.1–19.7, 20.1–20.4, 24.1–24.8, 26.1–26.7, 28.1–28.20, 29.1–29.10, 31.1–31.7.

  - [x] 4.10 Augment `10-quality-validation.md`

Define read-only inspection, Normal-Agent Eligible Check, Protected Command, and no-run pending authorization. Preserve exact current-session authorization and Hook Permission, reject inline markers, and never generalize command-hook evidence.

- **Requirements:** Special Requirement 3.1–3.5; 6.9, 8.8, 10.1–10.10, 12.1–12.5, 18.4–18.8, 24.7–24.8, 25.1–25.10, 27.2–27.7, 30.6, 30.14, 31.2–31.4, 35.1–35.11, 37.5–37.11, 38.1–38.3.

### Checkpoint B — Reconcile chapters 01–10 before chapter 11

- **Dependency:** `4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 → 4.8 → 4.9 → 4.10`.
- **Role slots:** all four fixed slots remain present; `I/C-01` serially integrates and `V/R-01` cannot promote missing evidence.
- Compare every changed chapter path, shared terms, exact links, protected boundaries, role/status vocabulary, and handoff fields. Overlap or contradictory evidence invokes Conflict Stop and owner review. No HTML file is edited in this checkpoint.

- [x] 5. Add chapter 11 response contract, Prompt Cookbook, and four-role Standing Multi-Agent procedure

- **Dependency:** Checkpoint B.
- **Role slots:** `S/M-01` maps required categories and paths; `P/R-01` owns contract/risk decomposition; `I/C-01` writes only chapter 11 and integrates serially; `V/R-01` verifies counts and evidence. Exactly four slots remain declared.
- **Owned write path:** only `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md` in a separately approved downstream guidance lane.
- **Excluded writes:** every other guide/Kiro/protected/runtime/package/database/output path, automatic spawning, and commands.
- **Approval gate:** Checkpoint B approval plus exact chapter 11 ownership; no HTML or Kiro-control write.

  - [x] 5.1 Add the ordered 13-field Plain-Language Response Contract and Route/Completion rules

Use exactly: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions. Include Artifact Class, workstream/purpose subfolder, filename pattern, producer, authored/generated state, Locked Path Gate, Site Write Gate, pending proof, next owner, and status for output-producing work.

- **Requirements:** Special Requirements 1.2–1.5 and 2.1–2.4; 15.1–15.5, 21.6–21.10, 24.8, 25.10, 27.5, 30.10, 30.15–30.16, 31.2, 37.6–37.11, 40.1.

  - [x] 5.2 Add exactly 25 complete Prompt Cookbook categories

Provide one fenced copy-paste block for each: `Understand Repository`; `Find Where to Work`; `Small UI/Icon/Alignment Fix`; `Feature`; `Site UI`; `Planner`; `Studio`; `Admin`; `CRM/Unwired Assessment`; `Catalog/Configurator/Quotes/Inventory`; `Database`; `AI/Retrieval`; `Image/Animation/Assets`; `API/Security`; `Environment`; `Bug/Failing Test`; `Gate-Failure Triage`; `Refactor`; `Documentation`; `Package/Dependency`; `Deployment/Ops`; `Backup/Import/Export`; `Unknown Task`; `Finish Current Task`; and `Emergency Prompt for an Overwhelmed Owner`.

Every block includes the safety preamble, `oando-master` then `repo-map`, Local Evidence first, additive skill routing, exact category paths, command classification, dual authorization, exact proof or pending state, response contract, artifact boundaries, and gates. The Emergency block remains one sentence.

- **Requirements:** 3.5–3.7, 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 16.1–16.5, 21.1–21.10, 22.1–22.7, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, 30.23–30.27, 31.10.

  - [x] 5.3 Add exactly four-role Standing Multi-Agent Operating Procedure

Define only Scout/Map, Planner/Risk, Implementer, and Verifier/Reporter. Attach Coordinator/Serial Integration Owner to `I/C-01` as a function; do not add a fifth role. Require Roster, Ownership Matrix, Route Record, Deliverable Register, Handoff Register, Conflict Stop Rule, serial integration, owner status before implementation, Completion Record after verification, and no silent single-Agent fallback. Require read-only Scout/Map and Planner/Risk, read-only Verifier/Reporter, and Implementer writes only after exact exclusive ownership and approval.

- **Requirements:** 17.1–17.9, 23.1–23.14, 30.1–30.22, 30.24–30.27, 31.2, 31.6, 31.8, 34.1–34.10, 37.1–37.4.

  - [x] 5.4 Add exactly six standing-mode prompts outside the 25-category count

Add `Start Standing Multi-Agent Mode`; `Launch Scout/Map and Planner/Risk in parallel`; `Hand an approved scope to Implementer`; `Launch Verifier/Reporter`; `Resolve a multi-agent conflict`; and `Finish and close a multi-agent task`. Each repeats four slots/max four/no silent fallback, ownership/route/handoff/conflict/serial controls, artifact/workspace boundaries, Protected Command authorization, Locked Path Gate, Site Write Gate, and response contract.

- **Requirements:** 15.1–15.5, 17.1–17.9, 22.1–22.7, 23.1–23.14, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.1–30.27, 31.1–31.10.

  - [x] 5.5 Reconcile chapter 11 counts, links, fields, exact paths, and addendum vocabulary

Read back 13 response fields in order, 25 cookbook categories exactly once, six standing prompts exactly once outside the cookbook, four role names, all Handoff fields, current `markdown/` links, all gate/status terms, 51/12 inventory references, exactly three Special Requirements, and no runtime/enforcement overclaim.

- **Requirements:** 14.1–14.6, 15.1–15.5, 16.1–16.5, 17.1–17.9, 21.1–21.10, 22.1–22.7, 23.1–23.14, 27.4–27.7, 28.7–28.20, 29.7–29.10, 30.1–30.27, 31.1–31.10, 33–40.

- [ ] 6. Update the prose-only master router and keep optional AI guidance decision-gated

- **Dependency:** `5.1 → 5.2 → 5.3 → 5.4 → 5.5`.
- **Role slots:** `S/M-01` checks source/skill evidence; `P/R-01` plans conditional routing and risk; `I/C-01` writes only the router or an explicitly selected AI file and serially integrates; `V/R-01` verifies router/guide parity. Exactly four slots remain declared.
- **Owned write path:** `./.kiro/skills/oando-master/SKILL.md` after chapter vocabulary is frozen.
- **Optional write path:** `./.kiro/skills/ai-retrieval/SKILL.md` only after explicit owner selection; default branch keeps it absent.
- **Excluded writes:** `.kiro/hooks/**`, `.kiro/settings/**`, `.kiro/mcp/**`, `.kiro/agents/**`, `.config.kiro`, protected paths, `./site/`, runtime/package/database/deployment/output paths, Power/MCP activation, automatic spawning, and commands.
- **Approval gate:** Checkpoint C must be completed before router write; AI requires its own explicit Owner Decision.

  - [x] 6.1 Update `oando-master` as the canonical first router and completion contract

Require Local Evidence first; select every matching skill; record rejected/no-match reasons; use 22-card and 51/12 inventory vocabulary; require Route/Completion records, artifact ownership, four slots, serial integration, gates, closed statuses, failure triage, and honest validation. Preserve prose-only behavior: no runtime loader, automatic activation, universal enforcement, automatic spawning, contract append, or Exact-Line migration claim.

- **Requirements:** Special Requirements 1.1–1.5 and 3.1–3.5; 1.1–1.6, 3.7, 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 12.1–12.5, 13.1–13.4, 15.1–15.5, 18.1–18.8, 19.1–19.7, 21.1–21.10, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.7–28.20, 29.7–29.10, 30.1–30.27, 31.1–31.10, 33–40.

  - [x] 6.2 Add `ai-retrieval` only after explicit owner selection

If selected, add guidance for `./site/lib/ai/mastra/` and listed AI routes, advisory-only output, Local Evidence, matching skills, artifact/validation contract, and Separate Approval Work. If not selected, keep the exact file absent and document fallback through Local Evidence, `repo-map`, and all other matching skills; never represent absence as installed.

- **Approval gate:** explicit owner selection in the Route Record; default is no file creation.
- **Requirements:** 5.1–5.7, 8.7, 9.1–9.7, 11.1–11.6, 13.1–13.4, 19.6–19.7, 27.1–27.7, 30.19, 30.27, 31.8, 33.7.

  - [x] 6.3 Reconcile router, guide, inventory, status, and optional-branch references

Produce a shared-term matrix for D01–D22, all records/statuses, four roles, six prompts, 25 categories, 51/12 inventories, exact destinations, Locked Path/Site Write gates, AI fallback, no silent fallback, Separate Approval Work, and the Requirements 33–40/property 16–20 mapping.

- **Requirements:** 1.1–1.6, 5.1–5.7, 8.1–8.9, 9.1–9.7, 14.1–14.6, 15.1–15.5, 19.6–19.7, 20.1–20.8, 21.1–21.10, 27.4–27.7, 28.7–28.20, 29.7–29.10, 30.1–30.27, 31.1–31.10, 33–40.

### Checkpoint C — Freeze Markdown/router terminology before projection work

- **Dependency:** `6.1 → 6.2 → 6.3`.
- **Role slots:** all four fixed slots remain present; `I/C-01` serially integrates and `V/R-01` reports only observed evidence.
- Confirm all 12 live guide Markdown paths, the router, optional AI absence/selection state, records/statuses, and owner decisions agree. No HTML write starts until provenance is resolved. No protected validation or command runs.

- [x] 7. Reconcile the HTML projection only after provenance is evidenced

- **Dependency:** Checkpoint C.
- **Role slots:** `S/M-01` maps each projection relationship; `P/R-01` classifies provenance and risk; `I/C-01` writes only exact evidenced projection files; `V/R-01` verifies static parity claims. Exactly four slots remain declared.
- **Read-only paths:** all 12 HTML paths and `guide.css` plus all 12 Markdown paths.
- **Conditional writes:** only exact HTML/CSS paths if a real source/projection relationship is evidenced; otherwise no HTML write and an explicit parity-gap admission. The existing README may receive that admission only in a separately approved guide lane.
- **Excluded writes:** scripts/generators/package changes, Markdown source edits, `./site/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, `.kiro` controls, protected paths, runtime/database/deployment changes, and commands.
- **Approval gate:** provenance evidence and exact projection target list are required; no filename-only or visual assumption.

  - [x] 7.1 Map each HTML projection file to a Markdown source or unresolved relationship

Record source/projection evidence, navigation/content anchors, CSS references, and unresolved pages. Do not call a page stale/current based on filenames or visual assumptions.

- **Requirements:** 1.5, 6.3, 6.10, 11.4, 19.1–19.7, 20.4, 20.6–20.8, 27.3, 29.7, 31.1–31.3.

  - [x] 7.2 Apply the evidenced projection branch or record a parity-gap admission

Confirmed provenance permits only the exact projection files required by the evidenced method. Unresolved provenance means no HTML write, an explicit gap with evidence checked, limitation, next source, owner action, and scope boundary, and no invented generator. Rendered behavior and generator success remain unclaimed.

- **Requirements:** 1.5, 11.4, 19.1–19.7, 24.1–24.8, 26.1–26.7, 27.3–27.7, 28.1–28.20, 29.1–29.10, 31.1–31.3.

- [x] 8. Keep separate approval tracks explicit; do not execute them in this phase

- **Dependency:** `7.1 → 7.2`.
- **Role slots:** all four remain present; `I/C-01` serially owns future gate decisions; `V/R-01` may verify only observed evidence. Exactly four slots are declared.
- **Current status for every leaf:** `pending-owner` or `not-observed` until exact scope, target, host, authorization, and evidence are approved.
- **No current implementation:** these tracks are not authorized by the current request and must not be silently implemented through prose, a hook, a save action, a test, or a substitute file.

  - [x] 8.1 Decide the exact contract-coverage target set and approved form

Decide per Active Contract-Bearing path whether the exact full Kiro Agent Contract block or exact Canonical Inclusion is selected; a paraphrase is invalid. Preserve Reference/History, Package, Generated, and inaccessible classifications. Name every exact target; do not infer from “all relevant guidance.” Contract append remains forbidden until this gate is approved, and protected `./.kiro/agents/**` files require exact current-request authorization.

- **Status/evidence:** `pending-owner` until target list/form is explicitly approved; no append now.
- **Requirements:** 33.1–33.9; Design §§22, 25, 28; Property 16.

  - [x] 8.2 Approve and implement, in a separate scope, the executable/host-integrated Pre-Action Enforcement Layer

Define host and exact implementation paths for all six action kinds, Action Records, explicit allow/deny reasons, fail-closed unavailable/indeterminate behavior, and observed enforcement evidence. Markdown, prompts, self-attestation, post-review, and the current command hook do not satisfy this task.

- **Status/evidence:** `pending-owner` or `not-observed`; no executable gate is created now.
- **Requirements:** 35.1–35.11; Design §24; Property 18.

  - [x] 8.3 Approve and implement, in a separate scope, the Protected Path Lock and Exact-Line rollout

Protect `./docs/**`, `./Agents/**`, every direct root file, and `./.kiro/agents/**`; allow writes/deletes only for exact owner-named files. Future Exact-Line candidates are `./AGENTS.md` and selected `./Agents/**`, including `./Agents/01-standard.md`; each selected path must be named individually, contain the exact line exactly once, and record count one. Duplicate/uninsertable states stop the rollout.

- **Status/evidence:** `pending-owner` or `not-observed`; no protected file changes in this Tasks phase.
- **Requirements:** 36.1–36.7, 39.1–39.7; Design §25; Property 20.

  - [x] 8.4 Approve and observe the runtime four-slot roster and records/status checker without changing five physical definitions

Establish or observe four active entries, exactly one coordinator designation, exact role/permission/ownership/status fields, serial handoffs, Conflict Stop, and closed status transitions. Preserve all five physical `./.kiro/agents/` definitions; any checker or runtime implementation requires separate approval and exact paths.

- **Status/evidence:** `pending-owner` or `not-observed`; no runtime claim from this plan.
- **Requirements:** 34.1–34.10, 37.1–37.11, 38.5; Design §§23, 26–28; Property 17.

- [x] 9. Perform final static reconciliation and produce the owner handoff

- **Dependency:** `8.1 → 8.2 → 8.3 → 8.4` (all remain open unless separately approved; unobserved items are not promoted).
- **Role slots:** `S/M-01` inventories; `P/R-01` maps requirements/risks; `I/C-01` serially integrates; `V/R-01` reports evidence and limitations. Exactly four slots remain declared; no role may promote missing evidence to `verified` or `complete`.
- **Owned paths:** read-only all changed guidance/router/projection paths and current `tasks.md`; any future authored handoff uses an approved `./agents-work/<workstream>/<report-type>/` path only after its own approval.
- **Excluded actions:** all tests, gates, builds, typechecks, scripts, package commands, browser/service/database/deployment/backup actions, protected writes, migrations, contract append, Exact-Line rollout, runtime gate work, and application changes.
- **Approval gate:** closure is static/read-only; unresolved owner decisions remain `pending-owner` or `not-observed`.

  - [x] 9.1 Map every Special Requirement, Requirement 1–40 criterion, Design §21–32 decision, and Property 1–20 to an open implementation or static-audit leaf

Include explicit coverage for Requirements 33–40 and Properties 16–20; preserve exactly three Special Requirements and do not create a fourth. Record Separate Approval Work separately from current guidance work; no unproven leaf is marked complete.

  - [x] 9.2 Audit exact paths, ownership, dependencies, protected-source integrity, and serial integration

Confirm every current/future write has one exclusive owner, shared vocabulary is serial, the 51 Kiro paths and 12 guide Markdown paths are literal, five physical definitions remain, optional AI/HTML branches are decision-gated, and no protected root/docs/Agents/`.kiro/agents` path changed.

  - [x] 9.3 Audit static evidence, records/statuses, artifact placement, gates, and validation limitations

Confirm route/roster/ownership/deliverable/action/handoff/completion fields, closed vocabularies, Coverage-Gap Admissions, Artifact Class/producer/placement, Locked Path Gate, Site Write Gate, HTML provenance branch, command-specific hook limit, and no runtime claim. State exactly which validations were observed as static reads and which were not run. No command result, rendered behavior, hosted persistence, connected MCP, installed Power, automatic spawning, or universal enforcement may be inferred.

  - [x] 9.4 Produce the final Plain-Language Completion Record and owner handoff

Name every changed file and reason, actual static evidence, validation not run and exact pending/unauthorized reason, unresolved issues, next owner, scope/exclusions, Multi-Agent Evidence, Coverage-Gap Admissions, Separate Approval Work, and final status. For this current Tasks phase, the changed-file record names only `./.kiro/specs/oando-master/tasks.md` and explains that it was reconciled with Design §§21–32 and Requirements 33–40. It states that no tests, gates, builds, typechecks, scripts, package commands, implementation commands, application files, Agent definitions, root standard, `./Agents/`, migrations, or protected paths were changed. It must not claim that Requirement 40's earlier requirements artifact was changed in this phase.

- **Requirements:** Special Requirements 1–3; Requirements 2.1–2.4, 7.1–7.7, 10.1–10.10, 15.1–15.5, 18.1–18.8, 19.1–19.7, 24.1–24.8, 25.1–25.10, 26.1–26.7, 27.1–27.7, 28.1–28.20, 30.8–30.18, 30.24–30.27, 31.1–31.10, 40.1–40.6.

- [ ] 10. Add optional, future property-oriented checks for Design Correctness Properties

- **Dependency:** `9.1 → 9.2 → 9.3 → 9.4`; if the owner declines this branch, record that decision and skip to Checkpoint D.
- **Role slots:** `S/M-01` maps property criteria; `P/R-01` plans the approved check scope; `I/C-01` may own a future exact fixture/check path only after approval; `V/R-01` reviews static evidence. Exactly four slots remain declared.
- **Shared future fixture path:** `./tests/unit/docs/oando-master-properties.test.ts`, only after explicit owner-approved test/check scope. Current guide and router files are read-only fixtures.
- **Approval gate:** no property check is written or run in this phase; future test/static-check work remains `pending-owner`/`not-observed` and separate from runtime implementation.

  - [x] 10.1 Property 1: First-router authority and Begin Here ordering

Check first-router authority, authority ordering, exact first paths, Domain Index selection, Workflow Mode/risk/command classification, minimum role pair, and Owner Decision ordering.

  - [x] 10.2 Property 2: Complete additive Route Records

Check outcome, domain, candidates, all matching skills, rejection reasons, risk, command classes, validation state, no-match Local Evidence route, roster/ownership/serial fields, and Completion preservation.

  - [x] 10.3 Property 3: Complete 22-card coverage and ordered evidence

Check D01–D22 uniqueness, fields, exact Start Paths/discovery labels, chapter mapping, classifier, Coverage Audit row, and D22 fallback.

  - [x] 10.4 Property 4: Ordered Plain-Language Response Contract

Check the 13 fields in order, specialized-term explanation, missing-proof state, validation state, next owner, and pre/post verification records.

  - [-] 10.5 Property 5: Complete safe Prompt Cookbook

Check exactly 25 categories, complete safety preamble, placeholders, scope, evidence starts, stop conditions, additive skills, command/authorization classification, exact proof/pending state, and Emergency shape.

  - [~] 10.6 Property 6: Conditional skill routing and local-first capability selection

Check every matching skill, rejection reasons, Local Evidence before Powers/MCP, registry confirmation, distinct MCP states, and no runtime activation claim.

  - [~] 10.7 Property 7: UI, fork, and AI evidence boundaries

Check route-to-source guidance, Visual Detail Checklist, asset/motion safeguards, Planner/Studio no-cross-import, Site Write Gate, and advisory-only AI.

  - [~] 10.8 Property 8: Evidence-labelled technical and data ownership

Check package/framework/command/route/database/asset/persistence evidence, Products/Admin ownership, migrations, mode-aware persistence, live-evidence precedence, and workspace classification.

  - [~] 10.9 Property 9: Typed artifact placement and producer ownership

Check workstream/purpose subfolder, filename, producer, authored/generated state, rejected placements, Completion repetition, root legacy handling, sibling boundaries, and Site Write fields.

  - [~] 10.10 Property 10: Protected Command permission and honest validation

Check dual authorization, pending state without either permission, eligible-check classification, inline-marker rejection, exact observation fields, and no command implication from a plan.

  - [~] 10.11 Property 11: Failure Triage preserves controls

Check read-only triage, exact failure fields, unobserved cause without current output, smallest authorized diagnostic, preserved controls, and canonical blocker handling.

  - [~] 10.12 Property 12: Exactly four roles and conflict-safe Standing Multi-Agent integration

Check four role names, coordinator attached to a slot, minimum pair, maximum four, availability, disjoint/read-only parallelism, ownership before writes, complete records, owner status, Completion after verification, no fallback, and Conflict Stop.

  - [~] 10.13 Property 13: Surface Status and Coverage-Gap no-overclaim

Check allowed statuses, sources, limitations, next evidence, owner action, scope, decision, response/Completion propagation, and no wired/complete claim without end-to-end evidence.

  - [~] 10.14 Property 14: Minimal scope, approval separation, and task-state honesty

Check smallest sound change, narrowest proof, Separate Approval Work, open/pending downstream state, plan placement, no runtime spawning, locked-path separation, and unimplemented separate work.

  - [~] 10.15 Property 15: Exact workspace boundaries and Site Write Gate

Check exact directory forms, sibling/output separation, Core Product Write versus Non-Core Artifact, redirect/stop, required artifact fields, Locked Path Gate, exact-file authorization, and no relocation claim.

  - [~] 10.16 Property 16: Canonical Kiro inventory and contract-form integrity

Check every 36 active path individually, 11 reference/history paths, four package paths, negative inventory, exact contract forms only, separate 12 guide paths, and static-only limitation. Validates Requirements 33.1–33.9.

  - [~] 10.17 Property 17: Four-slot controlled-task records remain complete and serial

Check exactly four Active Agent entries, unique role set, exactly one coordinator designation, pre-action records, ownership, serial handoffs, Conflict Stop, five-file distinction, and no promotion of missing evidence. Validates Requirements 34.1–34.10 and 37.1–37.11.

  - [~] 10.18 Property 18: Fail-closed action and protected-path boundary

Check all six action kinds, required gate inputs, explicit allow/deny reason, denial on unavailable/indeterminate state, protected read/write separation, exact authorization, and no substitute-copy proof. Requirement 35.1 requires a separate executable/host smoke or integration observation; static text cannot satisfy it. Validates Requirements 35.2–35.11 and 36.1–36.6.

  - [~] 10.19 Property 19: Evidence-honest handoffs and Completion Records

Check changed-file reasons, observed versus not-run validation, inaccessible/unobserved labels, command-hook scope, five-file/four-slot distinction, static/runtime separation, and honest Requirements 40 handoff. Validates Requirements 38.1–38.6 and 40.1–40.6.

  - [~] 10.20 Property 20: Exact-Line Rule rollout is owner-authorized and idempotent

Check exact line, one occurrence, retention of an existing single occurrence, exact target authorization, insertion failure stop, pending/blocker state, and no protected-file claim. Validates Requirements 39.1–39.7.

### Checkpoint D — Close the open plan without claiming implementation or protected validation

- **Dependency:** `9.4` plus `10.1–10.20`, or an explicit Owner Decision recording that the optional property branch is skipped.
- **Role slots:** all four fixed slots remain present; `I/C-01` serially integrates; `V/R-01` reports only observed evidence.
- Confirm the dependency graph is complete, every leaf has one owner/dependency/evidence boundary, every optional branch is gated, every unobserved runtime item has a named next owner action, and no status has been promoted by implication. The owner can open this `tasks.md` and use “Start task” beside an approved open item.

## Notes and validation limitations

- Tasks marked `*` are optional future property-oriented checks. They are not implemented or run in this workflow. No task in this document authorizes a test, gate, build, typecheck, script, package command, browser run, service, database, migration, deployment, backup, Power, MCP, or implementation command.
- The only current file mutation is this existing Tasks artifact. The next owner must preserve unrelated work and must not modify `./AGENTS.md`, `./docs/**`, `./Agents/**`, root-direct files, or `./.kiro/agents/**` without exact current-request authorization.
- The current guidance deliverable is documentation/prose only. A future executable Pre-Action Enforcement Layer, Protected Path Lock, runtime roster, status checker, contract append, Exact-Line rollout, or test/checker is Separate Approval Work.
- The exact Kiro Agent Contract and exact Canonical Inclusion are the only approved active-document contract forms. A paraphrase is not coverage. The current plan inventories contract state but does not append either form.
- The exact future Exact-Line Rule is: `Before any action, read the current user request and applicable repository standard, declare exact scope and permissions, and stop on denial, conflict, or missing authorization.` Exact targets must be named individually; “relevant guidance” is insufficient.
- Static inspection can establish paths, classifications, counts, links, text forms, ownership declarations, and unchanged-file observations. It cannot establish runtime loading, automatic spawning, tool interception, universal fail-closed behavior, command success, rendered behavior, hosted persistence, connected MCP, installed Power state, or external/global Kiro coverage.
- This Tasks phase performs no tests, gates, builds, typechecks, scripts, package commands, implementation commands, browser checks, services, database/migration actions, deployment, backups, Power activation, MCP connection, or external calls. Any owner-controlled check remains pending with its exact command and authorization requirement. The observed local diff and static artifact read-backs are not runtime or command evidence.
- Requirement 40's earlier clarification handoff names `./.kiro/specs/oando-master/requirements.md` as its historical sole changed file; this Tasks phase names only `./.kiro/specs/oando-master/tasks.md` as its changed artifact and does not replay or claim that earlier mutation.
- Final closure is a planning-artifact handoff only. The owner must open `./.kiro/specs/oando-master/tasks.md`, approve an open item, and use “Start task” only after the relevant Route Record, exact ownership, and approval gate are satisfied.

## Task Dependency Graph

The graph is serial: every incomplete decimal leaf appears exactly once, waves are contiguous from zero, and checkpoints are intentionally omitted because they are not leaf tasks. Each wave waits for all prior waves; no wave permits overlapping writes.

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4"] },
    { "id": 4, "tasks": ["2.1"] },
    { "id": 5, "tasks": ["2.2"] },
    { "id": 6, "tasks": ["2.3"] },
    { "id": 7, "tasks": ["2.4"] },
    { "id": 8, "tasks": ["3.1"] },
    { "id": 9, "tasks": ["3.2"] },
    { "id": 10, "tasks": ["3.3"] },
    { "id": 11, "tasks": ["3.4"] },
    { "id": 12, "tasks": ["3.5"] },
    { "id": 13, "tasks": ["3.6"] },
    { "id": 14, "tasks": ["4.1"] },
    { "id": 15, "tasks": ["4.2"] },
    { "id": 16, "tasks": ["4.3"] },
    { "id": 17, "tasks": ["4.4"] },
    { "id": 18, "tasks": ["4.5"] },
    { "id": 19, "tasks": ["4.6"] },
    { "id": 20, "tasks": ["4.7"] },
    { "id": 21, "tasks": ["4.8"] },
    { "id": 22, "tasks": ["4.9"] },
    { "id": 23, "tasks": ["4.10"] },
    { "id": 24, "tasks": ["5.1"] },
    { "id": 25, "tasks": ["5.2"] },
    { "id": 26, "tasks": ["5.3"] },
    { "id": 27, "tasks": ["5.4"] },
    { "id": 28, "tasks": ["5.5"] },
    { "id": 29, "tasks": ["6.1"] },
    { "id": 30, "tasks": ["6.2"] },
    { "id": 31, "tasks": ["6.3"] },
    { "id": 32, "tasks": ["7.1"] },
    { "id": 33, "tasks": ["7.2"] },
    { "id": 34, "tasks": ["8.1"] },
    { "id": 35, "tasks": ["8.2"] },
    { "id": 36, "tasks": ["8.3"] },
    { "id": 37, "tasks": ["8.4"] },
    { "id": 38, "tasks": ["9.1"] },
    { "id": 39, "tasks": ["9.2"] },
    { "id": 40, "tasks": ["9.3"] },
    { "id": 41, "tasks": ["9.4"] },
    { "id": 42, "tasks": ["10.1"] },
    { "id": 43, "tasks": ["10.2"] },
    { "id": 44, "tasks": ["10.3"] },
    { "id": 45, "tasks": ["10.4"] },
    { "id": 46, "tasks": ["10.5"] },
    { "id": 47, "tasks": ["10.6"] },
    { "id": 48, "tasks": ["10.7"] },
    { "id": 49, "tasks": ["10.8"] },
    { "id": 50, "tasks": ["10.9"] },
    { "id": 51, "tasks": ["10.10"] },
    { "id": 52, "tasks": ["10.11"] },
    { "id": 53, "tasks": ["10.12"] },
    { "id": 54, "tasks": ["10.13"] },
    { "id": 55, "tasks": ["10.14"] },
    { "id": 56, "tasks": ["10.15"] },
    { "id": 57, "tasks": ["10.16"] },
    { "id": 58, "tasks": ["10.17"] },
    { "id": 59, "tasks": ["10.18"] },
    { "id": 60, "tasks": ["10.19"] },
    { "id": 61, "tasks": ["10.20"] }
  ]
}
```


## Current Reconciliation Addendum — approved guidance handoff

**Recorded:** 2026-08-29, repository root `d:\23082026`.

This addendum reconciles the five implementation handoffs with the live working tree. It supersedes stale parent/leaf markers that still described the approved guide work as in-progress, but it does not promote separate approval work or unobserved runtime behavior to complete.

### Static implementation status

- **Complete:** Tasks `1`, `2`, `3`, `4.1`–`4.10`, `5.1`–`5.5`, `7.1`–`7.2`, and `9.1`–`9.4` for the approved static guidance deliverable and task-artifact reconciliation. Task `6.1` and `6.3` are complete for the prose-only router and shared vocabulary reconciliation.
- **Pending-owner / not-observed:** Task `6.2` remains the default no-file branch because `./.kiro/skills/ai-retrieval/SKILL.md` is absent and no AI-guidance selection was made. Tasks `8.1`–`8.4` remain separate approval work for contract coverage, executable/host-integrated enforcement, Protected Path/Exact-Line rollout, and runtime four-slot records/checking. Tasks `10.1`–`10.20` remain optional future property checks; no property fixture or property command was authorized or run.
- **Enforcement boundary:** The four-role roster, serial ownership, handoff fields, gates, and status vocabulary are prose guidance. Runtime Agent creation/loading/spawning, universal pre-action interception, fail-closed denial, hook/policy changes, and automatic enforcement remain `guidance-only`/`not-observed`.

### Approved guidance paths and observed scope

The approved guidance implementation changed these exact authored paths:

1. `./agents-work/oando-repository-guide/README.md` — Begin Here flow, Route Record, D01–D22 cards, classifier, Coverage Audit/gap card, artifact and workspace boundaries, Locked Path Gate, Site Write Gate, response/completion contract, and Standing Multi-Agent guidance.
2. `./agents-work/oando-repository-guide/markdown/01-repository-map.md` — authority, path classification, routing, and protected/output boundaries.
3. `./agents-work/oando-repository-guide/markdown/02-application-architecture.md` — route-to-feature-to-component-to-platform tracing, Site/Planner/Studio boundaries, and proof limits.
4. `./agents-work/oando-repository-guide/markdown/03-product-domains.md` — Marketing/Admin/CRM/Planner/Studio ownership, Visual Detail Checklist, fork isolation, catalog, and advisory AI boundaries.
5. `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md` — Products/Admin ownership, migration locations, RLS/grants/rollback, mode-aware persistence, and secret limits.
6. `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md` — root `pnpm`, both Vitest lanes, Playwright, command classification, tech-docs sibling/output boundaries, and unavailable scripts typecheck state.
7. `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md` — Vercel/Worker/R2/Supabase/observability ownership, recovery planning, Protected Commands, and failure triage.
8. `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md` — authority, canonical documentation homes, artifact placement, Locked Path/Site Write gates, and unresolved projection provenance.
9. `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md` — Kiro skill/control distinctions, 36/11/4 inventory, 12 guide surfaces, five physical definitions versus four plan slots, and static/runtime limits.
10. `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md` — private environment, generated evidence, authored versus generated output, and workspace boundaries.
11. `./agents-work/oando-repository-guide/markdown/10-quality-validation.md` — proof matching, Protected Command authorization, Failure Triage, four command classes, and honest validation records.
12. `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md` — response contract, Agent Compliance Contract, four-role procedure, 25 Prompt Cookbook categories, and six standing-mode prompts. The standing prompt heading was aligned to the approved `Launch Scout/Map and Planner/Risk in parallel` wording.
13. `./.kiro/skills/oando-master/SKILL.md` — canonical first-router, conditional skill routing, local-first Power decision, evidence/gate boundaries, four-role prose procedure, handoff/completion contract, and Separate Approval Work.

The current task-artifact reconciliation additionally changed `./.kiro/specs/oando-master/tasks.md`. The working-tree modification to `./.kiro/specs/oando-master/tasks.meta.json` is retained as observed pre-existing spec metadata and is not rewritten by this addendum.

### Static verification of the handoffs

- The README has the 22 Domain Index cards and the task-classifier vocabulary; the guide grep/read-back shows the required Route Record, Coverage Audit, Surface Status, Coverage-Gap, Locked Path Gate, Site Write Gate, and Completion Record terms.
- Chapter 11 has exactly 25 numbered Prompt Cookbook entries and exactly six standing-mode prompt headings outside that count: Start Standing Multi-Agent Mode; Launch Scout/Map and Planner/Risk in parallel; Hand an approved scope to Implementer; Launch Verifier/Reporter; Resolve a multi-agent conflict; and Finish and close a multi-agent task.
- The live guide navigation links the 12 Markdown work surfaces. The 12 HTML files and `guide.css` remain unchanged.
- The canonical router and chapters explicitly distinguish static prose from runtime loading, command success, rendered behavior, hosted persistence, connected MCP, installed Power state, and automatic spawning.

### HTML projection Coverage-Gap Admission

- **Named area or capability:** Markdown-to-HTML projection for `./agents-work/oando-repository-guide/`.
- **Status:** `present-but-unverified`; provenance classification is `unresolved`/`not-observed`.
- **Evidence sources checked:** the 12 live Markdown paths; the 12 co-located HTML paths and `guide.css`; navigation/content/CSS references; repository references; and `./tech-docs-generator/` scripts/documentation and its `./generated-documents/` output contract.
- **Evidence limitation:** co-location, matching names, navigation, CSS references, and content overlap do not establish the authoring source, deterministic transform, invocation, freshness, synchronization, or parity. The separate tech-docs generator names generated Markdown/HTML outputs under `./generated-documents/` and does not establish ownership of the co-located guide HTML.
- **Next evidence source:** an owner-approved source-of-truth or generator/provenance record that explicitly names these guide HTML files.
- **Owner action:** keep all HTML/CSS unchanged until that relationship and exact projection target list are evidenced and separately authorized.
- **Scope boundary:** no generator, package, script, relocation, HTML/CSS edit, rendered check, or generated-output claim is included in this guidance handoff.

### Changed-path and preservation boundary

The approved scope does **not** include the existing unrelated working-tree changes in `./site/components/Planner/PlannerDockShell.tsx`, `./tests/e2e/planner-guest-workspace.spec.ts`, untracked `./site/components/Planner/ui/PlannerDockTab.tsx`, or untracked `./site/platform/shared/data/furniture/f_item_20744d.json`; all remain preserved and outside this task. No root control, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, application/runtime, database, package, deployment, hook, MCP, Power, generated-output, or HTML/CSS path was changed by the approved guidance lanes.

### Validation state before the authorized checks

The owner has authorized these exact repository-root checks for the next step:

- `pnpm run check:docs-all` — authorized; not yet run at the time of this record; Hook Decision and exit status `not-observed`.
- `pnpm run docs:check:root-links` — authorized; not yet run at the time of this record; Hook Decision and exit status `not-observed`.

No other test, gate, build, typecheck, generator, browser, local-service, database, deployment, backup, Power, MCP, or runtime command is included. The final addendum after execution must record each exact command, root cwd, Hook Decision, exit status, scope, and limitation.

### Separate Approval Work and owner handoff

The following remain pending-owner/separate approval: optional `ai-retrieval` guidance; active-document contract append; Exact-Line rollout; executable/host-integrated Pre-Action Enforcement; runtime four-slot roster/checker/automatic spawning; hooks/policy/allowlists; product runtime or `./site/` changes; package or lockfile changes; database/migration/RLS/grant/seed/type actions; deployment/backup/Worker/R2/observability actions; external MCP configuration/connection; Power activation; and any HTML/CSS projection or workspace-boundary change.

**Current status:** approved static guidance implementation and task-artifact reconciliation are `complete` for their named paths; HTML provenance is an explicit `present-but-unverified` Coverage Gap; the two named documentation checks are authorized and pending execution; all separate approval work remains pending-owner/not-observed. No True Blocker was evidenced, so `./Failures.md` remains unchanged.


## Validation Evidence Addendum — authorized documentation checks

**Recorded:** 2026-08-29, repository root `d:\23082026`.

The two exact owner-authorized documentation checks completed successfully after the guidance and task-artifact reconciliation:

### `pnpm run check:docs-all`

- **Scope:** repository layout, Failures, AGENTS, Agents folder, active documents, plan purity, docs purity, and root Markdown links.
- **Explicit User Authorization:** yes; authorized in the current session as one of the two requested documentation checks.
- **Hook Decision:** execution permitted; no denial was returned by the enabled command hook. The tool does not emit a separate hook payload.
- **Exit status:** `0`.
- **Observed output:** all constituent checks reported `OK`, including `root markdown links OK (11 files checked)`.
- **Limitation:** this proves the listed static checks for this working tree only; it does not prove HTML provenance/parity, rendered behavior, runtime enforcement, hosted persistence, deployment, connected MCP, installed Power state, or unrelated application changes.

### `pnpm run docs:check:root-links`

- **Scope:** root Markdown link checker; `11 files checked`.
- **Explicit User Authorization:** yes; authorized in the current session as the second requested documentation check.
- **Hook Decision:** execution permitted; no denial was returned by the enabled command hook. The tool does not emit a separate hook payload.
- **Exit status:** `0`.
- **Observed output:** `root markdown links OK (11 files checked)`.
- **Limitation:** this proves root Markdown links only; it does not prove guide HTML/CSS synchronization, generated-output freshness, rendered behavior, runtime loading/enforcement, hosted behavior, or external state.

**Task 5 closure:** both requested documentation checks are observed-pass. No in-scope documentation failure required a follow-up fix. The unresolved HTML provenance Coverage Gap remains intentionally recorded, and all separate approval work remains pending-owner/not-observed. The final task status is `complete` for the approved static guidance/documentation scope; no broader runtime, product, database, deployment, package, hook, MCP, Power, or HTML projection completion is claimed.


---

## Reconciliation Addendum — approved follow-on scope, 2026-08-29

This addendum records the owner-approved follow-on work performed after the earlier static task records. It does not rewrite historical phase restrictions or promote prose to runtime evidence. The current owner direction was to proceed with the HTML provenance decision, approved Kiro contract/Exact-Line/enforcement/capability tracks, optional AI guidance, evidence reconciliation, and only the named root validation commands. The addendum is authored in the existing `./.kiro/specs/oando-master/tasks.md` artifact; no historical task section is rewritten.

### Outcome and scope

- **Outcome:** Reconcile the approved governance implementation and capability work while preserving protected files, unrelated working-tree changes, unresolved HTML provenance, bounded host-hook scope, and honest pending validation.
- **Domain / Domain Index cards:** `D20` Kiro skills, hooks, Powers, MCP, and Agents; `D13` AI and retrieval; `D18` documentation/provenance; `D19` artifact/evidence placement; `D15` validation authorization.
- **Workflow Mode:** `Supervised` serial integration under the four declared slots; `I/C-01` remains the Coordinator/Serial Integration Owner designation attached to the Implementer slot, not a fifth role.
- **Authorization state:** Owner approval covers the exact writable Kiro/workstream paths named below and the two exact validation commands in the pending-validation record. Protected root files, `./docs/**`, `./Agents/**`, and all five `./.kiro/agents/**` definitions remain unauthorized for mutation.
- **Locked Path Gate:** `explicitly-owner-authorized` for the named writable Kiro/workstream targets; `Locked` for root files, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, and any unlisted neighbor. A read grant did not become write/delete permission.
- **Site Write Gate:** `not-applicable`; no product source under `./site/` was changed. The AI route gap was recorded, not repaired.

### Four-slot Agent Roster and runtime boundary

| Agent ID | Role | Coordinator | Permission and owned scope | Status | Runtime state |
|---|---|---:|---|---|---|
| `S/M-01` | Scout/Map | false | Read-only evidence discovery and path/source inventory | `complete` | Declared static slot; runtime creation/loading `not-observed` |
| `P/R-01` | Planner/Risk | false | Read-only scope, risk, skill, capability, and approval classification | `complete` | Declared static slot; runtime creation/loading `not-observed` |
| `I/C-01` | Implementer | true | Exclusive writes to the approved Kiro/workstream paths and serial integration | `serial-integrated` | Declared static slot; runtime creation/loading `not-observed` |
| `V/R-01` | Verifier/Reporter | false | Read-only read-back, changed-path audit, and completion evidence | `complete` | Declared static slot; runtime creation/loading `not-observed` |

The five physical definitions remain a separate preserved inventory: `./.kiro/agents/capability-powers-author.md`, `containment-reconciler.md`, `hook-localizer.md`, `spec-task-runner.md`, and `spec-task-runner2.md`. None was deleted, renamed, disabled, or modified to force a four-file count. No automatic spawning, runtime roster loading, or silent one-Agent fallback is claimed.

### Changed-scope reconciliation

The approved changed scope is limited to repository-local guidance/control and the guide-workstream provenance admission:

- Governance evaluators and records: `./.kiro/kiro-repo-guidance-setup/action-gate.ts`, `runtime-records.ts`, `contract-coverage.ts`, `exact-line.ts`, and `README.md`.
- Bounded host integration: `./.kiro/hooks/pre-action-delegation-gate.json` and `pre-action-delegation-gate.mjs`. The existing `block-agent-tests` hook remains command-tool scoped and was not generalized.
- Active guidance: the approved 31-document Canonical Inclusion rollout and Exact-Line targets from the earlier record, plus the selected `./.kiro/skills/ai-retrieval/SKILL.md` branch and its inventory/routing updates in `./.kiro/skills/oando-master/SKILL.md`, `./.kiro/skills/powers-skills-model/SKILL.md`, and `./.kiro/steering/INDEX.md`.
- Guide-workstream evidence: `./agents-work/oando-repository-guide/README.md` contains the HTML provenance Coverage-Gap Admission; it does not claim projection parity or authorize a page write.
- No HTML page or `guide.css` file changed. No application, database, migration, package, lockfile, deployment, generated-output, test, or product-runtime path changed.

### Contract coverage and Exact-Line evidence

- Task 3 established the approved static baseline: **31 of 36** inventoried active contract-bearing documents contain the exact Canonical Inclusion once; the five protected physical Agent definitions were intentionally excluded.
- Task 5 selected `./.kiro/skills/ai-retrieval/SKILL.md`. The active manifest now contains **32 writable targets out of 37 inventoried active documents**: the prior 31 plus the new AI skill, with the same five protected Agent definitions preserved and excluded. The exact Canonical Inclusion occurs once in the new skill; static diagnostics for `contract-coverage.ts` are clear.
- The exact Canonical Inclusion remains `Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.` No paraphrase substitutes for it.
- Exact-Line rollout remains limited to these three writable targets, each with one occurrence: `./.kiro/skills/oando-master/SKILL.md`, `./.kiro/steering/agent-behavior.md`, and `./.kiro/kiro-repo-guidance-setup/README.md`. The protected candidates `./AGENTS.md` and `./Agents/01-standard.md` remain unchanged.
- The manifest/checker is static and fail-closed for missing, duplicate, denied, or out-of-scope target evidence. It does not establish client loading or universal contract enforcement.

### Executable records and host enforcement boundary

- `runtime-records.ts` defines exactly four roles/IDs, closed lifecycle and enforcement vocabularies, and structural validators for the Agent Roster, Ownership Matrix, Route Record, Pre-Action Gate Records, Handoff Record Register, Conflict Stop state, and Completion Record. The checker requires exact ID/role mapping, one `I/C-01` coordinator, all handoffs, closed fields, changed-file/reason alignment, and explicit `observed` versus `not-observed` runtime activation.
- `action-gate.ts` evaluates untrusted records for all six controlled actions: `read`, `write`, `delete`, `command`, `delegation`, and `handoff`. It denies malformed, stale, unowned, conflicting, protected-unauthorized, indeterminate, wrong-root, missing-delivery, or otherwise unsupported records without selecting an alternate tool, path, Agent, permission, or approval.
- The host hook is intentionally narrow: `.kiro/hooks/pre-action-delegation-gate.json` matches only `invoke_sub_agent` and delegates to its fail-closed `.mjs` adapter. It requires the complete Action Record, `I/C-01` coordinator identity, one of the four receiver IDs/roles, exact target paths, ownership, explicit current-session authorization, permitted Hook Decision, delivery condition, and next owner.
- A current-session host observation denied a subagent delegation attempt because the payload lacked the required Action Record. That is evidence for the bounded `invoke_sub_agent` denial path only; it is not evidence of universal read/write/delete/command/handoff interception.
- **Enforcement status:** `partially-enforced` for the static evaluator plus the observed bounded delegation hook path; **universal enforcement:** `not-observed`; **runtime activation:** `not-observed`. No automatic runtime roster or universal host interceptor is claimed.

### HTML provenance and projection decision

- The 12 guide Markdown paths, 12 co-located HTML pages, and `guide.css` were inspected with repository references and generator contracts. No guide-specific source marker, deterministic Markdown-to-HTML generator, or declared ownership relationship was observed.
- `tech-docs-generator` produces `./generated-documents/{data,docs,site}` and generated Markdown records, not the co-located guide HTML. Root `docs:sync` targets inventory scripts, not these guide pages. Running a generator to infer provenance was rejected because the generator contract deletes/recreates generated output.
- **Decision:** Markdown-to-HTML provenance remains `unresolved / not-observed`; the exact writable projection target set remains **zero**. All 12 HTML pages and `guide.css` remain unchanged. Filename similarity, navigation, stylesheet reuse, semantic overlap, and static content differences are not synchronization proof.
- **Owner action still required:** identify the authoring source or deterministic projection owner and name exact HTML/CSS targets before any projection write. This is a Coverage-Gap Admission, not a current hard blocker.

### Optional AI guidance and capability reconciliation

- Live AI evidence is under `./site/lib/ai/mastra/`: server-only Mastra agents/memory, provider routing for Gemini/OpenRouter/OpenAI/Bedrock, optional embedding resolution, LanceDB vector recall, Orama lexical recall, and catalog-order fallback. `Fuse.js` remains a separate catalog-filter path, not proof of Mastra retrieval.
- The canonical observed catalog route is `POST /api/ai-advisor`, with shared auth/rate-limit/CSRF wrapping, validated query/context/stream input, normalized catalog-only recommendations, NDJSON streaming support, and deterministic fallback behavior. Model responses remain advisory and cannot authorize writes or be treated as a final BOQ, validated optimum, or price authority.
- `./site/lib/ai/mastra/plannerAdvisorClient.ts` advertises `/api/planner/ai-advisor`, but no matching App Router route was observed. This is `present-but-unverified`/`unwired` route coverage; no product route repair or `./site/` write was made.
- `./.kiro/skills/ai-retrieval/SKILL.md` is now selected and present. It records Local Evidence order, provider/secret boundaries, retrieval composition, route/response contract, advisory-only output, validation limits, and Separate Approval Work. It does not activate a provider, Power, MCP server, or runtime capability.
- The four legacy `./.kiro/powers/{analytics,observability,security,oando-workflow}/` assets remain routing-only and contain no MCP server. They were read and retained; no Power was activated. `./.kiro/settings/mcp.json` remains `{ "mcpServers": {} }`; MCP schema presence is not configuration, connection, authentication, or runtime evidence.
- The active skill inventory is now ten entries, including `ai-retrieval`. This is static repository guidance evidence only and does not establish automatic loading.

### Preserved files and unrelated working-tree changes

The following protected/control evidence remained unchanged: `./AGENTS.md`, `./Agents/01-standard.md`, all five physical `./.kiro/agents/**` definitions, `./.kiro/settings/mcp.json`, `.config.kiro`, all 12 guide HTML pages, and `guide.css`. The pre-existing unrelated working-tree changes were preserved and not inspected as implementation scope: `site/components/Planner/PlannerDockShell.tsx`, `site/next-env.d.ts`, `tests/e2e/planner-guest-workspace.spec.ts`, `site/components/Planner/ui/PlannerDockTab.tsx`, `site/platform/shared/data/furniture/f_item_04f657.json`, and `site/platform/shared/data/furniture/f_item_20744d.json`.

### Route Record

- **Outcome:** Reconcile approved Kiro governance implementation, optional AI routing, capability state, HTML provenance, changed-path preservation, and pending validation without widening product or protected scope.
- **Domain / Domain Index card:** `D20`, `D13`, `D18`, `D19`, and `D15` as listed above.
- **Exact first evidence locations and reasons:** `./.kiro/skills/oando-master/SKILL.md` for routing/completion; `./.kiro/specs/oando-master/tasks.md` for inherited records; `./.kiro/kiro-repo-guidance-setup/` for evaluators; `./.kiro/hooks/` for host scope; `./.kiro/settings/mcp.json` and `./.kiro/powers/` for capability state; `./site/lib/ai/mastra/` and `./site/app/api/ai-advisor/route.ts` for live AI boundaries; `./agents-work/oando-repository-guide/README.md` for provenance evidence.
- **Candidate paths:** the exact changed Kiro/workstream paths named in this addendum; read-only product AI paths; the two validation commands at repository root; reject root/protected/Agent/HTML/CSS/product-route/package/database/deployment/generated/test paths for mutation.
- **Selected Package Skills and trigger evidence:** `oando-master` (mandatory router); `powers-skills-model` (skills, Powers, hooks, MCP); `ai-retrieval` (live Mastra/provider/retrieval evidence); `repo-map` (exact path/source orientation); `verify-and-gate` for the explicitly authorized validation lane. `graph-impact`, `planner-studio`, `fork-boundaries`, `focss-css`, and `db-migrations` are rejected for this governance/documentation scope because no matching shared-code, Planner/Studio, CSS, or database mutation is included.
- **Workflow Mode:** `Supervised`; serial four-slot integration.
- **Operational-Risk Classification:** governance, protected-path, authorization, evidence-integrity, AI advisory, host-enforcement, and validation risk; no product/data/deployment mutation.
- **Command Classification:** the two named `pnpm` commands are owner-authorized Protected/validation commands pending execution; all other tests, gates, builds, typechecks, browser runners, services, generators, Power/MCP actions, database actions, and deployment actions are no-run pending authorization. Static reads/diagnostics are read-only inspection.
- **Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:** `Active Plan / .kiro/specs/oando-master / tasks.md`; authored existing Tasks artifact; no generated/report/result output.
- **Owning source or script / authored or generated:** `I/C-01` and the owner-approved oando-master Tasks workflow; authored, not generated.
- **Rejected placements:** `./site/`, guide HTML/CSS, `./results/`, `./generated-documents/`, `./plans/`, root files, `./docs/**`, `./Agents/**`, `./.kiro/agents/**`, package/database/deployment/test paths, and substitute copies.
- **Locked Path Gate state:** exact named Kiro/workstream paths explicitly authorized; protected and unlisted paths locked.
- **Site Write Gate state:** `not-applicable`; the AI route gap is not a product write.
- **Validation State:** static implementation evidence observed; the two exact root commands remain pending until the authorized validation lane runs and records Hook Decision/exit status.
- **Unavoidable Owner Decisions:** future HTML source/projection method and exact targets; universal enforcement/runtime roster activation; planner advisor route repair; Power/MCP activation; protected-file writes; and any product/database/deployment scope remain separate decisions.
- **Next action:** `V/R-01` reads back this addendum and the changed Kiro assets; then run only the two authorized root validation commands, record exact cwd/authorization/Hook Decision/exit status/scope/limitation, and stop on any denial or failure.

### Handoff Record — `I/C-01` to `V/R-01` and Repository Owner

- **Objective:** Reconcile the approved static Kiro guidance/control changes, bounded delegation hook, four-slot records, optional AI skill, capability/MCP state, HTML provenance gap, preserved paths, and pending validation in one serial evidence record.
- **Role and Next Owner:** `I/C-01` is Implementer and Coordinator/Serial Integration Owner; `V/R-01` is next for read-only verification and report; the Repository Owner owns any future projection, product route, protected-file, runtime activation, Power/MCP, or universal-enforcement decision.
- **Scope:** The exact changed scope, contract 31/36→32/37 transition, three Exact-Line targets, bounded `invoke_sub_agent` hook, runtime `not-observed` state, AI route gap, capability state, preserved unrelated changes, and two-command validation lane.
- **Paths Read and Paths Changed:** Read the authority/spec/task/control, Kiro setup, hook, Power, MCP, guide, and live AI paths named in this addendum. Changed only the named approved Kiro/workstream paths plus this Tasks artifact; no protected root/Agent/HTML/CSS/product/database/deployment/package/generated/test path changed.
- **Route Record:** The Route Record above governs this handoff: D20/D13/D18/D19/D15, Local Evidence first, selected/rejected skills recorded, Supervised mode, explicit path gates, authored Tasks artifact, no Site Write, and two exact commands pending validation.
- **Evidence:** Static reads, directory inventories, exact-marker/skill manifest changes, diagnostics with no issues for the changed TypeScript evaluators, the observed delegation-hook denial for a missing Action Record, AI route/source reads, MCP empty-map read, and preserved-path audit context. Static evidence does not prove runtime loading, universal enforcement, provider reachability, route execution, rendered parity, or command success.
- **Decisions:** Preserve five physical Agent definitions; keep Exact-Line limited to three targets; extend static contract coverage from 31/36 to 32/37 only by adding the selected AI skill; leave HTML/CSS unchanged with zero projection targets; keep AI advisory-only; retain routing-only Powers and empty MCP configuration; preserve unrelated Planner/test/furniture work; run only the two named validation commands.
- **Coverage Gaps:** HTML provenance/source direction, planner advisor route reachability, runtime four-slot activation, universal action interception, provider/embedding reachability, Power/MCP runtime installation/connection, rendered behavior, hosted persistence, and command results remain unobserved until their exact owner-controlled evidence exists.
- **Validation Command:** Pending exact commands: `pnpm run check:docs-all` and `pnpm run docs:check:root-links`, from repository root `d:\23082026`; no other command is authorized in this lane.
- **Repository Root:** `d:\23082026`.
- **Authorization State:** Explicit owner authorization is recorded for the two exact commands and the named Kiro/workstream changes; all other execution and protected/product writes remain unauthorized.
- **Hook Decision:** Static hook state is enabled for `execute_pwsh|control_pwsh_process`; the delegation hook observed `deny` for a missing Action Record. The validation commands still require a fresh per-call Hook Decision; no result is pre-promoted.
- **Exit Status:** `not-observed` for the pending validation commands.
- **Validation Limitation:** No command result, runtime roster, universal enforcement, route execution, provider call, MCP connection, Power activation, rendered parity, or hosted persistence is claimed from this addendum.
- **Blockers:** None. The delegation denial was fail-closed and local evidence continued without retry; unresolved provenance and unobserved runtime/route/capability states are Coverage Gaps or Separate Approval Work, not hard blockers for this record.
- **Next Action:** `V/R-01` performs final static read-back, then executes only the two authorized root commands through the permitted validation lane and records their exact outcomes.
- **Status:** `serial-integrated`; completion remains conditional on the exact pending validation record and does not claim universal runtime enforcement.

### Completion Record for this reconciliation

- **Changed files:** the approved Kiro/workstream paths named above plus `./.kiro/specs/oando-master/tasks.md`; protected root/Agent/HTML/CSS/product/database/package/deployment/generated/test paths are unchanged.
- **Observed evidence:** 31/36 static contract coverage at Task 3; 32/37 after selected `ai-retrieval`; three Exact-Line targets; five preserved physical Agent definitions; bounded delegation hook and observed missing-record denial; runtime activation `not-observed`; unresolved HTML provenance with zero projection targets; canonical `/api/ai-advisor`; missing `/api/planner/ai-advisor` route; ten static skills; four routing-only Powers; empty MCP map; preserved unrelated working-tree paths.
- **Pending validation:** `pnpm run check:docs-all` and `pnpm run docs:check:root-links`, exact repository root `d:\23082026`, with fresh Hook Decision and exit status to be recorded after execution. No `pnpm run typecheck:scripts` is proposed because `scripts/tsconfig.json` is absent.
- **Remaining issues:** AI planner client route gap, unresolved Markdown-to-HTML provenance, runtime four-slot activation, universal pre-action enforcement, provider/retrieval reachability, Power/MCP runtime state, rendered behavior, hosted persistence, and all unlisted/protected/product scope.
- **Separate Approval Work:** HTML/CSS projection writes; planner advisor route repair; protected root/Agent contract or Exact-Line changes; automatic Agent spawning; universal host enforcement; provider/package/model/prompt/route/security changes; database/catalog writes; external network; Power activation; MCP configuration/connection; deployment/backup; and any unrelated working-tree cleanup.
- **True Blockers:** none recorded in `./Failures.md`.
- **Final status:** `serial-integrated` for the approved static implementation/reconciliation; `partially-enforced` only for the bounded delegation hook/evaluator scope; universal enforcement and runtime activation `not-observed`; pending validation remains owner-controlled.


### Authorized validation record — 2026-08-29

The two exact validation commands authorized for this scope were run from repository root `d:\23082026` through `execute_pwsh`. The enabled `block-agent-tests` `PreToolUse` hook matched the shell tool but did not deny either command; Hook Decision is recorded as `permitted` because the tool proceeded and produced an exit status. No other test, gate, build, typecheck, browser, service, generator, database, deployment, Power, MCP, or provider command was run.

| Exact command | Authorization state | Hook Decision | Exit status | Observed scope | Limitation |
|---|---|---|---:|---|---|
| `pnpm run check:docs-all` | Explicit current-session owner authorization | `permitted` — no hook denial; tool proceeded | `0` | `check-repo-layout`, `check-failures`, `check-agents-md`, `check-agents-folder`, `check-active-docs` (`27 active Markdown files`), `check-plans-purity`, `check-docs-purity`, and root Markdown-link check (`11 files`) all reported `OK` | Proves only the named static repository/documentation checks. It does not prove TypeScript behavior, test/build success, HTML rendering/parity, runtime Agent activation, universal enforcement, provider reachability, MCP/Power availability, or hosted persistence. |
| `pnpm run docs:check:root-links` | Explicit current-session owner authorization | `permitted` — no hook denial; tool proceeded | `0` | `check-root-markdown-links.mjs`; root Markdown links reported `OK (11 files checked)` | Proves only root Markdown-link integrity; it does not prove guide HTML/CSS provenance/parity, runtime behavior, AI route reachability, or any broader quality gate. |

**Validation conclusion:** Both required commands passed with observed exit status `0`. `pnpm run typecheck:scripts` was not run or suggested because `scripts/tsconfig.json` is absent. No command result is generalized beyond its stated scope.

### Final completion record — 2026-08-29

- **Task outcome:** The approved static Kiro/documentation/capability scope and its two named validations are complete.
- **Observed completion evidence:** Contract coverage is 31/36 for the original approved subset and 32/37 after the selected `ai-retrieval` extension; Exact-Line remains one occurrence on three named writable targets; `action-gate.ts` and `runtime-records.ts` have no diagnostics; both authorized documentation checks exit `0`; the five physical Agent definitions, protected root/`Agents/` files, HTML/CSS surfaces, empty MCP configuration, and unrelated Planner/test/furniture changes were preserved.
- **Remaining unobserved or pending state:** runtime four-slot creation/loading, automatic spawning, universal six-action host interception, provider/embedding reachability, planner client route reachability, Markdown-to-HTML provenance, rendered parity, Power/MCP runtime installation/connection, hosted persistence, and any behavior outside the observed command/static scopes remain `not-observed`, `present-but-unverified`, or Separate Approval Work.
- **True blockers:** none; `./Failures.md` remains unchanged.
- **Final lifecycle status:** `complete` for the approved static implementation, evidence reconciliation, and exact validation lane; enforcement status remains `partially-enforced` only for the bounded delegation hook/evaluator scope, with universal enforcement and runtime activation `not-observed`.
