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

- [ ] 1. Freeze the controlled-task route, four-slot roster, protected boundary, and evidence contract

- **Dependency:** none.
- **Role slots:** `S/M-01` Scout/Map; `P/R-01` Planner/Risk; `I/C-01` Implementer + Coordinator/Serial Integration Owner; `V/R-01` Verifier/Reporter. Exactly these four slots are declared; runtime activation is `not-observed` unless separately evidenced.
- **Owned paths:** read-only inspection of the current user request, `./AGENTS.md`, `./Agents/01-standard.md`, `./plans/README.md`, `./.kiro/specs/oando-master/requirements.md`, `./.kiro/specs/oando-master/design.md`, `./.kiro/specs/oando-master/tasks.md`, and `./.kiro/specs/oando-master/.config.kiro`.
- **Current write:** only the existing Tasks artifact is authorized. Downstream writes wait for their own Route Record and ownership gate.
- **Approval gate:** no current contract append, Exact-Line insertion, Agent-definition change, root/docs/Agents write, protected delete, command, or implementation.

  - [x] 1.1 Publish the exact four-entry Agent Roster, Ownership Matrix, Route Record, Deliverable Register, Conflict Stop Rule, and initial statuses

Record identity, role, coordinator designation, read/write permission, owned scope, exclusions, Multi-Agent Availability State, lifecycle status, and next owner for all four entries before any downstream exploration, modification, command proposal, delegation, or handoff. Map every objective, evidence item, artifact, and exact path to one role or the Serial Integration Owner; identify shared paths as serial.

### Task 1.1 controlled-task records

**Task identity and publication boundary:** `oando-master / 1.1`; `specType: feature`; `workflowType: fast-task`; repository root `d:\\23082026`. This is a static controlled-task declaration. The current user request explicitly authorizes one write to `./.kiro/specs/oando-master/tasks.md`; no other write, delete, command, delegation, contract append, Exact-Line insertion, Agent-definition change, protected-path change, or downstream implementation is authorized by this task. The `available` value below is a declared plan-capacity field, not proof that a host created or loaded four runtime Agents; runtime activation and universal enforcement remain `not-observed`.

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
- **Repository Root:** `d:\\23082026`.
- **Authorization State:** Explicit current-session authorization exists for the exact `./.kiro/specs/oando-master/tasks.md` write; no authorization exists or was requested for protected writes, commands, or downstream implementation.
- **Hook Decision:** `not-observed` for a universal pre-action decision; no command hook was invoked, and the command-specific `block-agent-tests` scope is not generalized to reads, writes, deletes, delegation, or handoffs.
- **Exit Status:** `not-applicable` for command execution; static task publication/read-back status is `complete`.
- **Validation Limitation:** Static prose, path, count, ownership, and read-back evidence cannot prove runtime roster activation, automatic spawning, tool interception, fail-closed denial, command success, or universal enforcement.
- **Blockers:** None within the authorized static task 1.1 scope. Separate approval work and unobserved runtime capabilities are recorded as pending/not-observed, not as blockers to this static deliverable.
- **Next Action:** `V/R-01` completes the read-only reconciliation; the next implementation owner must not begin task 1.2 until its own route, exact ownership, and approval gate are satisfied.
- **Status:** `complete` for task 1.1 static publication; universal enforcement status remains `guidance-only`/`not-observed`.

- **Evidence:** static roster/ownership/route schema plus explicit `guidance-only`/`not-observed` when runtime roster creation cannot be proved.
- **Requirements:** 34.1–34.7, 34.9–34.10, 37.1–37.4; Design §§21, 23, 26; Property 17.

  - [~] 1.2 Apply the Protected Path Lock and current-request authorization boundary

Classify `./docs/**`, `./Agents/**`, every direct root file, and `./.kiro/agents/**` as protected read-only evidence. Require an exact owner-named file for any future protected write/delete, preserve all unselected neighbors, reject substitute-copy claims, keep `./.kiro/specs/oando-master/tasks.md` as the sole current writable artifact, and keep `.config.kiro` unchanged.

- **Approval gate:** no current contract append, Exact-Line insertion, Agent-definition change, root/docs/Agents write, or delete.
- **Requirements:** 36.1–36.7, 38.6, 39.6–39.7; Design §25.

  - [~] 1.3 Define the single fail-closed Pre-Action Gate for all six action kinds

Specify Action Record fields, explicit `allow`/`deny` reason, next owner action, and denial behavior for `read`, `write`, `delete`, `command`, `delegation`, and `handoff`. Unavailable or indeterminate enforcement is `blocked` or `not-observed`; no alternate tool, path, permission, or inferred approval is allowed.

- **Evidence:** gate matrix only; no executable gate is created in this phase.
- **Requirements:** 35.1–35.11, 36.2–36.6; Design §24; Property 18.

  - [~] 1.4 Freeze required handoff fields, closed statuses, static/runtime evidence separation, and validation limits

Separate static path/text/count/read-back evidence from host/runtime observations and owner-authorized command results. Record that static evidence cannot prove loading, spawning, interception, fail-closed denial, command success, rendered behavior, hosted persistence, MCP connection, Power loading, or external/global coverage.

- **Evidence:** status/record schema and explicit pending owner actions; no tests, gates, builds, typechecks, scripts, package commands, or implementation commands.
- **Requirements:** 37.5–37.11, 38.1–38.5, 40.1–40.6; Design §§26–28; Property 19.

- [ ] 2. Produce the literal path, classification, provenance, and baseline inventory

- **Dependency:** `1.1 → 1.2 → 1.3 → 1.4`.
- **Role slots:** `S/M-01` leads read-only inventory; `P/R-01` owns classifications and gaps; `I/C-01` serially integrates the baseline; `V/R-01` reads back counts and scope. Exactly four slots remain declared.
- **Owned paths:** the 51 Kiro Markdown paths, the 12 guide Markdown paths, the conditional HTML/CSS paths, current Kiro controls, package/script references, artifact homes, and relevant read-only authority sources.
- **Excluded paths:** every write except the current Tasks artifact; no contract append, migration, application change, protected-path change, command, generator, or runtime claim.
- **Approval gate:** inventory/classification/provenance only; do not append either approved contract form to any active document.

  - [~] 2.1 Inventory all 51 required Kiro Markdown paths individually

For every listed path record `path`, `classification`, `contractMode`, owner, evidence state, and limitation. Use only `exact-block`, `canonical-inclusion`, `not-applicable`, or `not-observed` for `contractMode`. The exact 36 Active, 11 Reference/History, and 4 Package lists are the baseline above; no Generated Kiro Markdown is claimed. Preserve the negative inventory and inaccessible External/Global `not-observed` state.

- **Evidence:** a path-by-path static inventory; no active document is modified.
- **Requirements:** 33.1–33.9, 38.4; Design §§22 and 27; Property 16.

  - [~] 2.2 Inventory all live guide Markdown paths and conditional projection surfaces

Read each of the 12 guide Markdown paths and each conditional HTML/CSS path listed above. Record headings, README links, chapter previous/next links, HTML navigation, projection filenames, CSS references, and static content differences. Filename similarity is not synchronization proof.

- **Evidence:** literal 12-path Markdown inventory plus conditional projection inventory.
- **Requirements:** 1.2, 1.5, 2.1–2.14, 20.1–20.8, 29.7, 31.1–31.3; Design §§4 and 7.

  - [~] 2.3 Reconcile current control states, physical definitions, optional branches, and command-hook limits

Inventory all five physical Agent definition files and distinguish them from the four Active Agent slots; preserve `./.kiro/agents/spec-task-runner2.md`. Record that `./.kiro/skills/ai-retrieval/SKILL.md` is absent unless selected later; absence is not an installed skill. Record current hook evidence only for its observed command-tool family. Record `.config.kiro` as unchanged and protected root/docs/Agents/`.kiro/agents` paths as read-only evidence.

- **Evidence:** static control-state inventory; no runtime roster, universal gate, Power, MCP connection, or external/global access claim.
- **Requirements:** 33.6–33.9, 34.8–34.10, 38.2–38.6; Design §§22–25 and 27–28.

  - [~] 2.4 Determine HTML provenance and artifact/workspace boundaries without running a generator

Inspect current guide files, repository references, scripts and generator documentation as read-only evidence. Classify the relationship as Markdown source, HTML source, evidenced deterministic transformation, or unresolved. Record authored guide work under `./agents-work/<workstream>/<report-type>/`, Machine Evidence under `./results/<purpose>/`, generated tech-docs under `./generated-documents/`, active separate plans under `./plans/<name>/`, and blockers only in root `./Failures.md` when exactly authorized. Preserve `./tech-docs-generator/` as a root-level sibling of `./site/`; distinguish `./results/site/` from `./site/`; reject reports/skills/non-core artifacts under `./site/` through the Site Write Gate.

- **Evidence:** provenance and placement records only; no generator, package, script, relocation, or command change.
- **Requirements:** 1.5, 6.1–6.10, 7.1–7.7, 18.1–18.8, 19.1–19.7, 24.1–24.8, 27.3, 27.6, 28.1–28.20, 29.1–29.10.

- [ ] 3. Build the README Begin Here entry point, Domain Index, gates, and controlled-task vocabulary

- **Dependency:** `2.1 → 2.2 → 2.3 → 2.4`.
- **Role slots:** `S/M-01` maps evidence; `P/R-01` owns routing/risk; `I/C-01` writes only the exact README after approval; `V/R-01` verifies static coverage. Exactly four slots remain declared.
- **Owned write path:** only `./agents-work/oando-repository-guide/README.md` in a separately approved downstream guidance lane.
- **Read-only inputs:** Task 2 inventory; all 11 numbered chapter Markdown paths; all HTML/CSS paths; current Kiro skill/control paths; `./AGENTS.md`; `./Agents/`; `./docs/`; and `./plans/README.md`.
- **Excluded writes:** every other guide file, protected path, `./site/`, hooks/settings/MCP, packages, migrations, runtime, generated output, and commands.
- **Approval gate:** owner approval of the README route and exact path after Task 2; no protected write or contract append.

  - [~] 3.1 Add Begin Here, Route Record, and common Coverage-Audited Task Card schema

Require `./.kiro/skills/oando-master/SKILL.md` first, authority ordering, ordinary-language outcome, exact first evidence paths and reasons, Domain Index selection, additive matching-skill selection, rejected-skill reasons, Workflow Mode, command classification, risk, artifact classification, Site Write Gate, Locked Path Gate, Owner Decisions, and next action. Define Goal, Start Paths, Scope, Evidence Steps, Allowed Actions, Forbidden Actions, Risk, Expected Evidence, and Next Decision for every card.

- **Requirements:** 1.1–1.6, 8.1–8.9, 14.1–14.6, 15.1–15.5, 20.1–20.5, 21.1–21.10, 28.7–28.9, 30.10, 30.15, 30.20.

  - [~] 3.2 Add exactly the 22 D01–D22 cards and classifier rows

Preserve these outcomes and chapter mappings: D01 repository map; D02 initialization/debugging; D03 auth/security/secrets; D04 environment; D05 APIs; D06 Site UI/SEO/i18n/accessibility/performance; D07 UI polish/icons/FOCSS/motion/assets; D08 Admin; D09 CRM versus customer-query operations; D10 catalog/configurator/quotes/inventory; D11 Planner; D12 Studio; D13 AI/retrieval; D14 databases/RLS/grants/rollback/mode-aware persistence; D15 tests/fixtures/mocks/two Vitest lanes/Playwright; D16 scripts/commands; D17 packages/dependencies/workspaces; D18 documentation/architecture/locked/legacy docs; D19 results/generated documents/agent work/blockers; D20 MCP/skills/Powers/Agents; D21 Vercel/Worker/R2/backups/observability/incidents; D22 unknown-area discovery. Use only verified exact Start Paths or explicitly labelled discovery; never turn path presence into wired or complete behavior.

- **Requirements:** 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 8.9, 9.1–9.7, 20.1–20.8, 30.22–30.23.

  - [~] 3.3 Add the Coverage Audit, Surface Status enum, and Coverage-Gap Admission Card

Provide 22 audit rows with card ID, outcome, chapter, verified paths, status, evidence sources, limitation, and next decision. Limit Surface Status to `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, and `legacy`; propagate gaps to responses and Completion Records. Preserve the CRM `oando-crm-storage` distinction and separately classify customer-query operations.

- **Requirements:** 4.1–4.7, 19.1–19.7, 20.1–20.8, 26.1–26.7, 30.16, 31.3.

  - [~] 3.4 Add artifact placement, exact workspace boundaries, and the Site Write Gate

Use exact forms `./agents-work/<workstream>/<report-type>/`, `./results/<purpose>/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./results/site/`, `./plans/<name>/`, and root `./Failures.md` only when authorized. Require Artifact Class, selected subfolder, filename pattern, owner/source, authored/generated state, rejected placements, observed placement, and Site Write Gate fields before selecting an output path. Publish: “If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.”

- **Requirements:** 7.1–7.7, 18.1–18.8, 24.1–24.8, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.24–30.26, 31.6–31.8.

  - [~] 3.5 Add the Locked Path Gate and exact owner-authorization wording without changing protected files

State that `./docs/`, `./Agents/`, every direct root file, and `./.kiro/agents/**` are read-only evidence unless the owner names the exact file in the current request. Require denial before unapproved writes/deletes, source preservation, pending Owner Decision and Separate Approval Work, distinction between `./agents-work/` and `./Agents/`, and rejection of copies claiming locked-source updates. Define the future Exact-Line Rule exactly as: `Before any action, read the current user request and applicable repository standard, declare exact scope and permissions, and stop on denial, conflict, or missing authorization.`

- **Approval gate:** prose only in the approved README lane; no current root/Agents/protected write and no contract append.
- **Requirements:** 36.1–36.7, 39.1–39.7, 38.6; Design §25.

  - [~] 3.6 Add the Kiro inventory classification, four-slot records/statuses, fail-closed limitation, and static/runtime boundary

Reference the 36/11/4 classification, the 12 guide Markdown work surfaces, exact contract forms, `contractMode`, five physical definitions versus four Active Agent slots, absent AI branch, Agent Roster, Ownership Matrix, Route Record, Pre-Action Gate Records, Handoff Register, Conflict Stop Record, Completion Record, closed lifecycle/enforcement vocabularies, and no silent fallback. State that prose is guidance-only unless runtime evidence proves otherwise and command-hook evidence remains command-specific.

- **Requirements:** 33.1–33.9, 34.1–34.10, 35.1–35.11, 37.1–37.11, 38.1–38.5, 40.1–40.6; Design §§21–29; Properties 16–19.

### Checkpoint A — Freeze README vocabulary, exact paths, ownership, and approval states

- **Dependency:** `3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6`.
- **Role slots:** all four fixed slots are present: Scout/Map; Planner/Risk; Implementer + Coordinator/Serial Integration Owner; Verifier/Reporter.
- Read back the README against the 51-file Kiro inventory, 12 guide Markdown paths, D01–D22 names, status/gap schema, four-role roster, closed records/statuses, Locked Path Gate, Site Write Gate, exact current chapter links, and Owner Decision register.
- **Evidence/approval:** static read-back only; owner approval is required before Task 4. No tests, gates, builds, typechecks, scripts, package commands, protected writes, or runtime claims.

- [ ] 4. Serially augment the ten live guide chapters 01–10

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

  - [~] 4.1 Augment `01-repository-map.md`

Map `./START.md`, `./AGENTS.md`, `./docs/architecture/layout.md`, `./docs/architecture/stack.md`, `./docs/architecture/routes.md`, `./docs/architecture/product-map.md`, `./plans/README.md`, and current guide paths; classify source/generated/private/legacy/absent/unverified; preserve no-guess discovery and Locked Path rules.

- **Requirements:** 1.1–1.6, 7.1, 8.1–8.3, 9.1–9.2, 14.1–14.6, 20.1, 20.8, 27.1–27.7, 30.10, 31.1–31.6, 33.9.

  - [~] 4.2 Augment `02-application-architecture.md`

Trace route → feature → component → shared/server → platform/persistence using exact Site, API, Planner, and Studio roots; preserve no cross-import and Site Write Gate limitations.

- **Requirements:** 2.2–2.4, 3.1–3.4, 5.1–5.3, 6.1–6.4, 8.1–8.5, 12.5, 20.2, 20.5–20.6, 29.1–29.5, 30.7, 30.22, 30.25–30.26.

  - [~] 4.3 Augment `03-product-domains.md`

Include exact starts and conditional skills, Visual Detail Checklist, CRM status distinction, advisory-only AI, Planner/Studio isolation, and no runtime or hosted claims from path presence.

- **Requirements:** 2.2–2.8, 2.13, 3.1–3.7, 4.1–4.7, 5.1–5.7, 8.2–8.5, 20.2–20.8, 23.1–23.14, 26.1–26.7, 30.4–30.7, 30.21–30.23.

  - [~] 4.4 Augment `04-data-api-persistence.md`

Cite Products versus Admin ownership, exact migration directories, rollback/grants/policies, production read-only filesystem, mode-aware selectors, and secret boundaries; keep all migration/schema/database paths read-only.

- **Requirements:** 3.1, 4.1–4.4, 5.1–5.7, 6.1–6.10, 7.6, 8.6, 10.1–10.10, 11.3, 12.5, 18.4, 20.3–20.5, 20.8, 24.7, 25.1–25.10, 27.2–27.3, 29.3, 30.7, 30.24–30.27.

  - [~] 4.5 Augment `05-tooling-ci-tech-docs.md`

Classify commands before proposing them; preserve root pnpm boundary, two Vitest lanes, Playwright, generated-documents separation, `./tech-docs-generator/` sibling relationship, results-purpose folders, and unavailable `pnpm run typecheck:scripts` state.

- **Requirements:** 6.1–6.10, 7.1–7.5, 8.8–8.9, 10.1–10.10, 11.1–11.3, 18.1–18.8, 20.15–20.17, 24.1–24.8, 25.1–25.10, 28.1–28.20, 29.1–29.10, 30.19, 30.24–30.25.

  - [~] 4.6 Augment `06-operations-infrastructure.md`

Separate Vercel/Worker/R2/Supabase/backup/observability/local-service planning from execution. Require exact command, repository-root cwd, authorization, Hook Decision, exit status, first failed subcommand, output summary, cause classification, and proof limitation before any failure claim.

- **Requirements:** Special Requirement 3.1–3.5; 7.1–7.7, 9.3–9.6, 10.1–10.10, 11.2–11.4, 18.4–18.8, 20.21, 24.1–24.8, 25.1–25.10, 27.2–27.7, 30.6, 30.14, 31.7.

  - [~] 4.7 Augment `07-docs-governance-planning.md`

Preserve `./docs/`, `./Agents/`, direct root files, `./Failures.md`, `./agents-work/`, `./results/`, `./plans/`, and `./generated-documents/` boundaries; publish exact-file authorization and no substitute-copy claims.

- **Requirements:** 7.1–7.7, 11.1–11.6, 18.1–18.3, 19.1–19.7, 24.1–24.8, 27.1–27.7, 28.1–28.20, 30.7, 30.24, 31.1–31.10, 36.1–36.7, 39.1–39.7.

  - [~] 4.8 Augment `08-kiro-workspace.md`

Distinguish active/reference/package/generated/inaccessible classes; list the 51-file baseline and 12 guide work surfaces; preserve five physical Agent files versus four Active Agent slots; distinguish schema/configuration/connection and candidate/installed Power states; keep optional AI absent unless selected.

- **Requirements:** 5.1–5.7, 8.1–8.8, 9.1–9.7, 11.2–11.5, 13.1–13.4, 27.2–27.7, 30.19, 30.27, 31.8, 33.1–33.9, 34.8–34.10, 38.1–38.5.

  - [~] 4.9 Augment `09-local-generated-environment.md`

Keep secrets private, classify environment and generated output honestly, reject root report/result homes, and preserve `./site/` versus `./results/site/` and `./tech-docs-generator/` versus `./generated-documents/`.

- **Requirements:** 2.1, 6.1–6.4, 6.8, 7.3–7.5, 14.1–14.6, 18.1–18.3, 19.1–19.7, 20.1–20.4, 24.1–24.8, 26.1–26.7, 28.1–28.20, 29.1–29.10, 31.1–31.7.

  - [~] 4.10 Augment `10-quality-validation.md`

Define read-only inspection, Normal-Agent Eligible Check, Protected Command, and no-run pending authorization. Preserve exact current-session authorization and Hook Permission, reject inline markers, and never generalize command-hook evidence.

- **Requirements:** Special Requirement 3.1–3.5; 6.9, 8.8, 10.1–10.10, 12.1–12.5, 18.4–18.8, 24.7–24.8, 25.1–25.10, 27.2–27.7, 30.6, 30.14, 31.2–31.4, 35.1–35.11, 37.5–37.11, 38.1–38.3.

### Checkpoint B — Reconcile chapters 01–10 before chapter 11

- **Dependency:** `4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 → 4.8 → 4.9 → 4.10`.
- **Role slots:** all four fixed slots remain present; `I/C-01` serially integrates and `V/R-01` cannot promote missing evidence.
- Compare every changed chapter path, shared terms, exact links, protected boundaries, role/status vocabulary, and handoff fields. Overlap or contradictory evidence invokes Conflict Stop and owner review. No HTML file is edited in this checkpoint.

- [ ] 5. Add chapter 11 response contract, Prompt Cookbook, and four-role Standing Multi-Agent procedure

- **Dependency:** Checkpoint B.
- **Role slots:** `S/M-01` maps required categories and paths; `P/R-01` owns contract/risk decomposition; `I/C-01` writes only chapter 11 and integrates serially; `V/R-01` verifies counts and evidence. Exactly four slots remain declared.
- **Owned write path:** only `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md` in a separately approved downstream guidance lane.
- **Excluded writes:** every other guide/Kiro/protected/runtime/package/database/output path, automatic spawning, and commands.
- **Approval gate:** Checkpoint B approval plus exact chapter 11 ownership; no HTML or Kiro-control write.

  - [~] 5.1 Add the ordered 13-field Plain-Language Response Contract and Route/Completion rules

Use exactly: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions. Include Artifact Class, workstream/purpose subfolder, filename pattern, producer, authored/generated state, Locked Path Gate, Site Write Gate, pending proof, next owner, and status for output-producing work.

- **Requirements:** Special Requirements 1.2–1.5 and 2.1–2.4; 15.1–15.5, 21.6–21.10, 24.8, 25.10, 27.5, 30.10, 30.15–30.16, 31.2, 37.6–37.11, 40.1.

  - [~] 5.2 Add exactly 25 complete Prompt Cookbook categories

Provide one fenced copy-paste block for each: `Understand Repository`; `Find Where to Work`; `Small UI/Icon/Alignment Fix`; `Feature`; `Site UI`; `Planner`; `Studio`; `Admin`; `CRM/Unwired Assessment`; `Catalog/Configurator/Quotes/Inventory`; `Database`; `AI/Retrieval`; `Image/Animation/Assets`; `API/Security`; `Environment`; `Bug/Failing Test`; `Gate-Failure Triage`; `Refactor`; `Documentation`; `Package/Dependency`; `Deployment/Ops`; `Backup/Import/Export`; `Unknown Task`; `Finish Current Task`; and `Emergency Prompt for an Overwhelmed Owner`.

Every block includes the safety preamble, `oando-master` then `repo-map`, Local Evidence first, additive skill routing, exact category paths, command classification, dual authorization, exact proof or pending state, response contract, artifact boundaries, and gates. The Emergency block remains one sentence.

- **Requirements:** 3.5–3.7, 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 16.1–16.5, 21.1–21.10, 22.1–22.7, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, 30.23–30.27, 31.10.

  - [~] 5.3 Add exactly four-role Standing Multi-Agent Operating Procedure

Define only Scout/Map, Planner/Risk, Implementer, and Verifier/Reporter. Attach Coordinator/Serial Integration Owner to `I/C-01` as a function; do not add a fifth role. Require Roster, Ownership Matrix, Route Record, Deliverable Register, Handoff Register, Conflict Stop Rule, serial integration, owner status before implementation, Completion Record after verification, and no silent single-Agent fallback. Require read-only Scout/Map and Planner/Risk, read-only Verifier/Reporter, and Implementer writes only after exact exclusive ownership and approval.

- **Requirements:** 17.1–17.9, 23.1–23.14, 30.1–30.22, 30.24–30.27, 31.2, 31.6, 31.8, 34.1–34.10, 37.1–37.4.

  - [~] 5.4 Add exactly six standing-mode prompts outside the 25-category count

Add `Start Standing Multi-Agent Mode`; `Launch Scout/Map and Planner/Risk in parallel`; `Hand an approved scope to Implementer`; `Launch Verifier/Reporter`; `Resolve a multi-agent conflict`; and `Finish and close a multi-agent task`. Each repeats four slots/max four/no silent fallback, ownership/route/handoff/conflict/serial controls, artifact/workspace boundaries, Protected Command authorization, Locked Path Gate, Site Write Gate, and response contract.

- **Requirements:** 15.1–15.5, 17.1–17.9, 22.1–22.7, 23.1–23.14, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.1–30.27, 31.1–31.10.

  - [~] 5.5 Reconcile chapter 11 counts, links, fields, exact paths, and addendum vocabulary

Read back 13 response fields in order, 25 cookbook categories exactly once, six standing prompts exactly once outside the cookbook, four role names, all Handoff fields, current `markdown/` links, all gate/status terms, 51/12 inventory references, exactly three Special Requirements, and no runtime/enforcement overclaim.

- **Requirements:** 14.1–14.6, 15.1–15.5, 16.1–16.5, 17.1–17.9, 21.1–21.10, 22.1–22.7, 23.1–23.14, 27.4–27.7, 28.7–28.20, 29.7–29.10, 30.1–30.27, 31.1–31.10, 33–40.

- [ ] 6. Update the prose-only master router and keep optional AI guidance decision-gated

- **Dependency:** `5.1 → 5.2 → 5.3 → 5.4 → 5.5`.
- **Role slots:** `S/M-01` checks source/skill evidence; `P/R-01` plans conditional routing and risk; `I/C-01` writes only the router or an explicitly selected AI file and serially integrates; `V/R-01` verifies router/guide parity. Exactly four slots remain declared.
- **Owned write path:** `./.kiro/skills/oando-master/SKILL.md` after chapter vocabulary is frozen.
- **Optional write path:** `./.kiro/skills/ai-retrieval/SKILL.md` only after explicit owner selection; default branch keeps it absent.
- **Excluded writes:** `.kiro/hooks/**`, `.kiro/settings/**`, `.kiro/mcp/**`, `.kiro/agents/**`, `.config.kiro`, protected paths, `./site/`, runtime/package/database/deployment/output paths, Power/MCP activation, automatic spawning, and commands.
- **Approval gate:** Checkpoint C must be completed before router write; AI requires its own explicit Owner Decision.

  - [~] 6.1 Update `oando-master` as the canonical first router and completion contract

Require Local Evidence first; select every matching skill; record rejected/no-match reasons; use 22-card and 51/12 inventory vocabulary; require Route/Completion records, artifact ownership, four slots, serial integration, gates, closed statuses, failure triage, and honest validation. Preserve prose-only behavior: no runtime loader, automatic activation, universal enforcement, automatic spawning, contract append, or Exact-Line migration claim.

- **Requirements:** Special Requirements 1.1–1.5 and 3.1–3.5; 1.1–1.6, 3.7, 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 12.1–12.5, 13.1–13.4, 15.1–15.5, 18.1–18.8, 19.1–19.7, 21.1–21.10, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.7–28.20, 29.7–29.10, 30.1–30.27, 31.1–31.10, 33–40.

  - [~] 6.2 Add `ai-retrieval` only after explicit owner selection

If selected, add guidance for `./site/lib/ai/mastra/` and listed AI routes, advisory-only output, Local Evidence, matching skills, artifact/validation contract, and Separate Approval Work. If not selected, keep the exact file absent and document fallback through Local Evidence, `repo-map`, and all other matching skills; never represent absence as installed.

- **Approval gate:** explicit owner selection in the Route Record; default is no file creation.
- **Requirements:** 5.1–5.7, 8.7, 9.1–9.7, 11.1–11.6, 13.1–13.4, 19.6–19.7, 27.1–27.7, 30.19, 30.27, 31.8, 33.7.

  - [~] 6.3 Reconcile router, guide, inventory, status, and optional-branch references

Produce a shared-term matrix for D01–D22, all records/statuses, four roles, six prompts, 25 categories, 51/12 inventories, exact destinations, Locked Path/Site Write gates, AI fallback, no silent fallback, Separate Approval Work, and the Requirements 33–40/property 16–20 mapping.

- **Requirements:** 1.1–1.6, 5.1–5.7, 8.1–8.9, 9.1–9.7, 14.1–14.6, 15.1–15.5, 19.6–19.7, 20.1–20.8, 21.1–21.10, 27.4–27.7, 28.7–28.20, 29.7–29.10, 30.1–30.27, 31.1–31.10, 33–40.

### Checkpoint C — Freeze Markdown/router terminology before projection work

- **Dependency:** `6.1 → 6.2 → 6.3`.
- **Role slots:** all four fixed slots remain present; `I/C-01` serially integrates and `V/R-01` reports only observed evidence.
- Confirm all 12 live guide Markdown paths, the router, optional AI absence/selection state, records/statuses, and owner decisions agree. No HTML write starts until provenance is resolved. No protected validation or command runs.

- [ ] 7. Reconcile the HTML projection only after provenance is evidenced

- **Dependency:** Checkpoint C.
- **Role slots:** `S/M-01` maps each projection relationship; `P/R-01` classifies provenance and risk; `I/C-01` writes only exact evidenced projection files; `V/R-01` verifies static parity claims. Exactly four slots remain declared.
- **Read-only paths:** all 12 HTML paths and `guide.css` plus all 12 Markdown paths.
- **Conditional writes:** only exact HTML/CSS paths if a real source/projection relationship is evidenced; otherwise no HTML write and an explicit parity-gap admission. The existing README may receive that admission only in a separately approved guide lane.
- **Excluded writes:** scripts/generators/package changes, Markdown source edits, `./site/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, `.kiro` controls, protected paths, runtime/database/deployment changes, and commands.
- **Approval gate:** provenance evidence and exact projection target list are required; no filename-only or visual assumption.

  - [~] 7.1 Map each HTML projection file to a Markdown source or unresolved relationship

Record source/projection evidence, navigation/content anchors, CSS references, and unresolved pages. Do not call a page stale/current based on filenames or visual assumptions.

- **Requirements:** 1.5, 6.3, 6.10, 11.4, 19.1–19.7, 20.4, 20.6–20.8, 27.3, 29.7, 31.1–31.3.

  - [~] 7.2 Apply the evidenced projection branch or record a parity-gap admission

Confirmed provenance permits only the exact projection files required by the evidenced method. Unresolved provenance means no HTML write, an explicit gap with evidence checked, limitation, next source, owner action, and scope boundary, and no invented generator. Rendered behavior and generator success remain unclaimed.

- **Requirements:** 1.5, 11.4, 19.1–19.7, 24.1–24.8, 26.1–26.7, 27.3–27.7, 28.1–28.20, 29.1–29.10, 31.1–31.3.

- [ ] 8. Keep separate approval tracks explicit; do not execute them in this phase

- **Dependency:** `7.1 → 7.2`.
- **Role slots:** all four remain present; `I/C-01` serially owns future gate decisions; `V/R-01` may verify only observed evidence. Exactly four slots are declared.
- **Current status for every leaf:** `pending-owner` or `not-observed` until exact scope, target, host, authorization, and evidence are approved.
- **No current implementation:** these tracks are not authorized by the current request and must not be silently implemented through prose, a hook, a save action, a test, or a substitute file.

  - [~] 8.1 Decide the exact contract-coverage target set and approved form

Decide per Active Contract-Bearing path whether the exact full Kiro Agent Contract block or exact Canonical Inclusion is selected; a paraphrase is invalid. Preserve Reference/History, Package, Generated, and inaccessible classifications. Name every exact target; do not infer from “all relevant guidance.” Contract append remains forbidden until this gate is approved, and protected `./.kiro/agents/**` files require exact current-request authorization.

- **Status/evidence:** `pending-owner` until target list/form is explicitly approved; no append now.
- **Requirements:** 33.1–33.9; Design §§22, 25, 28; Property 16.

  - [~] 8.2 Approve and implement, in a separate scope, the executable/host-integrated Pre-Action Enforcement Layer

Define host and exact implementation paths for all six action kinds, Action Records, explicit allow/deny reasons, fail-closed unavailable/indeterminate behavior, and observed enforcement evidence. Markdown, prompts, self-attestation, post-review, and the current command hook do not satisfy this task.

- **Status/evidence:** `pending-owner` or `not-observed`; no executable gate is created now.
- **Requirements:** 35.1–35.11; Design §24; Property 18.

  - [~] 8.3 Approve and implement, in a separate scope, the Protected Path Lock and Exact-Line rollout

Protect `./docs/**`, `./Agents/**`, every direct root file, and `./.kiro/agents/**`; allow writes/deletes only for exact owner-named files. Future Exact-Line candidates are `./AGENTS.md` and selected `./Agents/**`, including `./Agents/01-standard.md`; each selected path must be named individually, contain the exact line exactly once, and record count one. Duplicate/uninsertable states stop the rollout.

- **Status/evidence:** `pending-owner` or `not-observed`; no protected file changes in this Tasks phase.
- **Requirements:** 36.1–36.7, 39.1–39.7; Design §25; Property 20.

  - [~] 8.4 Approve and observe the runtime four-slot roster and records/status checker without changing five physical definitions

Establish or observe four active entries, exactly one coordinator designation, exact role/permission/ownership/status fields, serial handoffs, Conflict Stop, and closed status transitions. Preserve all five physical `./.kiro/agents/` definitions; any checker or runtime implementation requires separate approval and exact paths.

- **Status/evidence:** `pending-owner` or `not-observed`; no runtime claim from this plan.
- **Requirements:** 34.1–34.10, 37.1–37.11, 38.5; Design §§23, 26–28; Property 17.

- [ ] 9. Perform final static reconciliation and produce the owner handoff

- **Dependency:** `8.1 → 8.2 → 8.3 → 8.4` (all remain open unless separately approved; unobserved items are not promoted).
- **Role slots:** `S/M-01` inventories; `P/R-01` maps requirements/risks; `I/C-01` serially integrates; `V/R-01` reports evidence and limitations. Exactly four slots remain declared; no role may promote missing evidence to `verified` or `complete`.
- **Owned paths:** read-only all changed guidance/router/projection paths and current `tasks.md`; any future authored handoff uses an approved `./agents-work/<workstream>/<report-type>/` path only after its own approval.
- **Excluded actions:** all tests, gates, builds, typechecks, scripts, package commands, browser/service/database/deployment/backup actions, protected writes, migrations, contract append, Exact-Line rollout, runtime gate work, and application changes.
- **Approval gate:** closure is static/read-only; unresolved owner decisions remain `pending-owner` or `not-observed`.

  - [~] 9.1 Map every Special Requirement, Requirement 1–40 criterion, Design §21–32 decision, and Property 1–20 to an open implementation or static-audit leaf

Include explicit coverage for Requirements 33–40 and Properties 16–20; preserve exactly three Special Requirements and do not create a fourth. Record Separate Approval Work separately from current guidance work; no unproven leaf is marked complete.

  - [~] 9.2 Audit exact paths, ownership, dependencies, protected-source integrity, and serial integration

Confirm every current/future write has one exclusive owner, shared vocabulary is serial, the 51 Kiro paths and 12 guide Markdown paths are literal, five physical definitions remain, optional AI/HTML branches are decision-gated, and no protected root/docs/Agents/`.kiro/agents` path changed.

  - [~] 9.3 Audit static evidence, records/statuses, artifact placement, gates, and validation limitations

Confirm route/roster/ownership/deliverable/action/handoff/completion fields, closed vocabularies, Coverage-Gap Admissions, Artifact Class/producer/placement, Locked Path Gate, Site Write Gate, HTML provenance branch, command-specific hook limit, and no runtime claim. State exactly which validations were observed as static reads and which were not run. No command result, rendered behavior, hosted persistence, connected MCP, installed Power, automatic spawning, or universal enforcement may be inferred.

  - [~] 9.4 Produce the final Plain-Language Completion Record and owner handoff

Name every changed file and reason, actual static evidence, validation not run and exact pending/unauthorized reason, unresolved issues, next owner, scope/exclusions, Multi-Agent Evidence, Coverage-Gap Admissions, Separate Approval Work, and final status. For this current Tasks phase, the changed-file record names only `./.kiro/specs/oando-master/tasks.md` and explains that it was reconciled with Design §§21–32 and Requirements 33–40. It states that no tests, gates, builds, typechecks, scripts, package commands, implementation commands, application files, Agent definitions, root standard, `./Agents/`, migrations, or protected paths were changed. It must not claim that Requirement 40's earlier requirements artifact was changed in this phase.

- **Requirements:** Special Requirements 1–3; Requirements 2.1–2.4, 7.1–7.7, 10.1–10.10, 15.1–15.5, 18.1–18.8, 19.1–19.7, 24.1–24.8, 25.1–25.10, 26.1–26.7, 27.1–27.7, 28.1–28.20, 30.8–30.18, 30.24–30.27, 31.1–31.10, 40.1–40.6.

- [ ] 10. Add optional, future property-oriented checks for Design Correctness Properties

- **Dependency:** `9.1 → 9.2 → 9.3 → 9.4`; if the owner declines this branch, record that decision and skip to Checkpoint D.
- **Role slots:** `S/M-01` maps property criteria; `P/R-01` plans the approved check scope; `I/C-01` may own a future exact fixture/check path only after approval; `V/R-01` reviews static evidence. Exactly four slots remain declared.
- **Shared future fixture path:** `./tests/unit/docs/oando-master-properties.test.ts`, only after explicit owner-approved test/check scope. Current guide and router files are read-only fixtures.
- **Approval gate:** no property check is written or run in this phase; future test/static-check work remains `pending-owner`/`not-observed` and separate from runtime implementation.

  - [~] 10.1 Property 1: First-router authority and Begin Here ordering

Check first-router authority, authority ordering, exact first paths, Domain Index selection, Workflow Mode/risk/command classification, minimum role pair, and Owner Decision ordering.

  - [~] 10.2 Property 2: Complete additive Route Records

Check outcome, domain, candidates, all matching skills, rejection reasons, risk, command classes, validation state, no-match Local Evidence route, roster/ownership/serial fields, and Completion preservation.

  - [~] 10.3 Property 3: Complete 22-card coverage and ordered evidence

Check D01–D22 uniqueness, fields, exact Start Paths/discovery labels, chapter mapping, classifier, Coverage Audit row, and D22 fallback.

  - [~] 10.4 Property 4: Ordered Plain-Language Response Contract

Check the 13 fields in order, specialized-term explanation, missing-proof state, validation state, next owner, and pre/post verification records.

  - [~] 10.5 Property 5: Complete safe Prompt Cookbook

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
