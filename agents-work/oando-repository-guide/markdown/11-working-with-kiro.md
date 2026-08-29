# 11 · Working with Kiro

[← Quality and validation](10-quality-validation.md) · [Return to start](../README.md)

## Select the session and control mode

| Situation | Choose | Example |
|---|---|---|
| Explore, diagnose, small change | Vibe | “Find why the Planner save button is disabled. Do not edit yet.” |
| Feature, migration, redesign, cross-area work | Spec | “Create requirements, design, risks, and tasks for [feature]. Do not implement until I approve.” |
| Approach only | Plan | “Plan [change]. Do not edit.” |
| Routine/safe bounded work | Autopilot | “Implement the approved task and preserve unrelated work.” |
| Sensitive/unfamiliar/high impact | Supervised | “Show each edit for approval. Do not deploy or change hosted data.” |

## Supply precise context

| Context | Example |
|---|---|
| `#File` | “`#File site/server/Planner/plannerStore.ts` explain this save path.” |
| `#Folder` | “`#Folder site/features/admin` find the catalog-management pattern.” |
| `#Problems` | “`#Problems` diagnose the current errors.” |
| `#Terminal` | “`#Terminal` explain this failure; do not run further commands.” |
| `#Git Diff` | “`#Git Diff` review data risk, security, fork boundaries, UI, and missing proof.” |
| Attachments | Attach a design/screenshot/CSV/brief and state the expected outcome. |

A strong request = **area + outcome + constraints + expected proof**.

## Prompt templates

### Small fix

```text
#File [file] #Problems #Git Diff
In Supervised mode, investigate and fix [problem]. Explain the likely cause and
files first. Reuse patterns. Do not add dependencies/config. Tell me the smallest
relevant validation before running it.
```

### Cross-area feature

```text
Create a Spec for [feature]. It affects [surfaces/DB/API/etc.]. First map all
areas, requirements, design, risks, ownership, migration/security implications,
and tasks. Do not implement until I approve.
```

### Provider/external system task

```text
Create a read-only plan for [provider task]. Identify target, data risk,
least-privilege access, fallback, rollback, and exact actions requiring approval.
Do not query or mutate the external system yet.
```

## Skill routing

Say “Use the repository skills for this task,” or name `repo-map`, `graph-impact`, `focss-css`, `fork-boundaries`, `planner-studio`, `db-migrations`, or `verify-and-gate` when the area is clear. `oando-master` routes every repository task.

## When MCP is actually appropriate

MCP is not needed for normal source, UI, database migration, test, script, docs, or local workflow work. Consider it only for a recurring approved need for live provider state or external systems, and start read-only with least privilege.

[Return to the guide index](../README.md).


## Begin Here and the mandatory response contract

The contributor supplies only an ordinary-language desired outcome. The router reads `.kiro/skills/oando-master/SKILL.md` first, applies authority order, selects exact first evidence locations, chooses D01–D22, selects every matching skill, rejects non-matches with reasons, selects `Vibe`, `Plan`, `Spec`, `Autopilot`, or `Supervised`, classifies commands, classifies risk, and asks only unavoidable Owner Decisions. Path names, package names, skill names, and commands are routing outputs, not required input vocabulary.

Every task-start, progress, handoff, pause, and completion response uses this exact field order:

1. **Outcome** — desired result and selected Domain Index card.
2. **Known** — facts established by the current request, live evidence, or fresh authorized output.
3. **Unverified** — claims not established, including rendered behavior, hosted persistence, HTML parity, command results, Power/MCP availability, or runtime enforcement.
4. **Exact First Evidence Locations** — exact paths and why each is first.
5. **Selected Skills** — every matching skill and trigger evidence.
6. **Rejected Skills and Reasons** — every considered non-match or unavailable skill.
7. **Numbered Next Actions** — smallest sequential actions and whether each is read-only, a write, or owner-controlled.
8. **Likely Files or Areas** — candidates, not claims that each changes.
9. **Risk** — source, data, security, fork, release, external, or documentation risk.
10. **Allowed Checks** — only checks explicitly eligible now.
11. **Protected or Pending Checks** — exact commands awaiting authorization or Hook Permission.
12. **Exact Completion Proof** — exact artifact, static comparison, or authorized output required.
13. **Unavoidable Owner Decisions** — only decisions Local Evidence cannot establish.

For an Output-Producing Task, also state Artifact Class, exact Workstream or Purpose Subfolder, filename pattern, owning source/script, authored-or-generated state, rejected placements, observed placement, and Site Write Gate state. Missing proof remains pending, blocked, or not-observed.

## Agent Compliance Contract

Before any Agent explores, proposes a command, writes, delegates, or hands off, it declares:

```text
I read the current user request: [yes / missing source].
I read the applicable global repository standard: [AGENTS.md and applicable named standard / missing source].
User instructions outrank defaults; the global standard remains in force unless explicitly overridden: [override / none].
Requested outcome:
Assigned scope:
Exact owned paths and permission for each:
Explicit exclusions:
Delivery conditions:
Validation allowed now:
Validation pending authorization:
Expected handoff owner:
```

The coordinator records the declaration in the Agent Roster and Ownership Matrix before that Agent acts. An Agent performs only requested and assigned work, does not infer permission from proximity, convention, package scripts, test configuration, inline markers, old plans, or helpfulness, preserves unrelated changes, and stops on conflict, missing authorization, ambiguous ownership, hidden constraint, contradictory evidence, or task expansion. A small defect directly inside the requested outcome and owned path may be fixed; an adjacent path, new behavior, new command, or unrelated cleanup requires a scope decision.

## Four-role Standing Multi-Agent procedure

Every Repository Task starts in Standing Multi-Agent Mode with exactly four Active Agent slots:

| Role | Permission | Owns | Must not do |
|---|---|---|---|
| **Scout/Map** | Read-only | Authority mapping, exact paths, candidate locations, evidence discovery | Modify files or run Protected Commands |
| **Planner/Risk** | Read-only | Scope, selected/rejected skills, workflow/risk/command classification, ownership and validation plan | Modify files or authorize commands |
| **Implementer** | Write only within recorded exclusive paths after approval | Smallest approved change | Write unowned/shared paths, expand scope, or overwrite conflicts |
| **Verifier/Reporter** | Read-only | Evidence reconciliation, gap review, completion proof, response contract | Modify implementation or turn pending evidence into pass |

One slot is designated Coordinator/Serial Integration Owner; it is a function, not a fifth role. The Roster, Ownership Matrix, Route Record, Deliverable Register, Pre-Action Gate Records, Handoff Register, Conflict Stop Rule, and statuses exist before action. Parallel work is limited to read-only research or genuinely disjoint ownership. Shared code, configuration, manifests, migrations, hooks, generated evidence, result paths, and shared guide terminology are serial. If four runtime entries cannot be observed, record `guidance-only` or `not-observed`; never silently fall back to one Agent. Automatic spawning and universal pre-action enforcement are Separate Approval Work.

### Operating sequence

1. Owner states the outcome in ordinary language.
2. Coordinator publishes four roster entries, exact ownership, Route Record, deliverables, Conflict Stop Rule, and next owner.
3. Scout/Map and Planner/Risk return read-only handoffs.
4. Coordinator serially reconciles scope, exclusions, evidence, and ownership.
5. Implementer receives write permission only for approved exclusive paths.
6. Verifier/Reporter reviews read-only after implementation or research handoff.
7. Coordinator serially integrates all disjoint work before a shared or overlapping write.
8. Any overlap, conflict, contradiction, missing authorization, or scope drift stops affected writes and routes to owner review.
9. Close only with exact proof, explicit pending evidence, or an evidenced True Blocker in root `./Failures.md` under its approval boundary.

### Handoff Record

Every handoff includes the following fields; unavailable fields are `not-observed`, not omitted:

```text
Objective
Role and Next Owner
Scope
Paths Read and Paths Changed
Route Record
Evidence
Decisions
Coverage Gaps
Validation Command
Repository Root
Authorization State
Hook Decision
Exit Status
Validation Limitation
Blockers
Next Action
Status
```

The coordinator compares each handoff with the current user request, exclusions, Route Record, Agent Roster, Ownership Matrix, delivery conditions, prior evidence, and artifact boundary before integration. Changed files list the reason for each change. Validation actually run is separated from validation not run; an unobserved command is unrun.

## Workflow mode selection

| Mode | Select when | Plain-language meaning |
|---|---|---|
| `Vibe` | Read-only discovery or a small reversible task with no Protected Command/shared write | Find facts or make a narrow low-risk adjustment after routing. |
| `Plan` | Multi-step work needing scope, ownership, risk, placement, or validation planning | Establish a bounded execution plan before implementation. |
| `Spec` | Feature, policy, workflow, or cross-domain work needing requirements/design/approval | Make durable decisions before implementation. |
| `Autopilot` | Approved bounded implementation with exclusive ownership and known checks | Execute without pausing for routine decisions. |
| `Supervised` | High-risk/shared/serial paths, Protected Commands, external systems, migrations, deployment, or explicit checkpoints | Owner reviews scope, writes, commands, conflicts, and evidence. |

## Prompt Safety Preamble

Every cookbook block below includes this complete safety instruction: start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; do not guess paths, package names, Package Skills, or commands; select every matching Package Skill and reject the rest with plain-language reasons; classify every command as read-only inspection, Normal-Agent Eligible Check, Protected Command, or no-run pending authorization before suggesting or running it; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; treat inline markers as insufficient; classify Artifact Class, exact approved Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state before an Output-Producing Task; keep `./tech-docs-generator/` as a root-level sibling of `./site/`, keep generated tech-docs in `./generated-documents/`, Machine Evidence in `./results/<purpose>/`, authored work in `./agents-work/<workstream>/<report-type>/`, active plans in `./plans/<name>/`, and canonical blockers in root `./Failures.md`; apply the Locked Path Gate and Site Write Gate; treat AI/retrieval output as advisory and use Local Evidence plus all other matching skills when `./.kiro/skills/ai-retrieval/SKILL.md` is absent; keep hooks, policy, runtime, packages, databases, deployments, backups, external MCP, Power activation, automatic spawning, and workspace-boundary changes as Separate Approval Work; return the Plain-Language Response Contract and exact completion proof or an explicit unverified/pending state.

Each fenced block then supplies its own desired-outcome placeholder, ordinary-language context placeholder, scope boundary, exact first Local Evidence, expected evidence, and stop condition. For an Output-Producing Task, the block must repeat the artifact fields and rejected placements; for a `./site/` candidate it must classify an explicitly approved Core Product Write versus a Non-Core Artifact before any write. The six standing-mode prompts below remain outside the 25-category cookbook count.

## Complete Prompt Cookbook

Every prompt is a complete copy-paste block. Replace bracketed values. Each block declares an outcome, ordinary-language context, scope boundary, expected evidence, and stop condition. These are the 25 required categories; the six standing-mode prompts below are separate and do not increase the cookbook count.

### 1. Understand Repository

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; do not guess paths, packages, skills, or commands; select every matching skill; classify every command before suggesting or running it; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: map only; do not edit product code or protected files.
First evidence: `./START.md`, `./AGENTS.md`, `./docs/architecture/layout.md`, and `./agents-work/oando-repository-guide/README.md`.
Expected evidence: authority order, D01/D22 card, exact candidate paths, selected/rejected skills, risk, and unverified facts.
Stop before modification or command execution and state the next owner decision.
```

### 2. Find Where to Work

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; do not guess paths, packages, skills, or commands; select every matching skill; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: discover the owner and candidate paths only; do not edit.
First evidence: `./site/app/`, `./site/features/`, `./site/components/`, `./site/lib/`, `./site/platform/`, and the matching D01–D22 card.
Expected evidence: route/domain, exact candidate files, artifact boundary if output is proposed, selected/rejected skills, and risk.
Stop on competing owners, absent paths, or a proposed `./site/` Non-Core Artifact.
```

### 3. Small UI/Icon/Alignment Fix

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; do not guess paths, packages, skills, or commands; select every matching skill including `focss-css` when triggered; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; apply the Site Write Gate; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: one bounded interface outcome; do not add an icon library, custom CSS system, or unrelated cleanup.
First evidence: user-facing route, nearby component, `./site/focss/`, existing Phosphor abstraction, and `./scripts/generate-svg/` when assets are involved.
Expected evidence: Visual Detail Checklist, exact owned paths, loading/empty/error/keyboard/reduced-motion review, and proof limitation.
Stop before any unowned write or external asset/tool proposal.
```

### 4. Feature

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; do not guess paths, packages, skills, or commands; select every matching skill; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; apply the Site Write Gate; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: trace route → feature → component → shared/server → platform/persistence → proof; do not implement adjacent work.
First evidence: matching route, feature, component, `./site/lib/`, `./site/server/`, `./site/platform/`, and tests.
Expected evidence: Route Record, exclusive owned paths, risk, data/fork/security boundaries, selected/rejected skills, and narrow proof.
Stop at an unverified external/data boundary or scope expansion.
```

### 5. Site UI

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; do not guess paths, packages, skills, or commands; select every matching skill including `focss-css` when triggered; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; apply the Site Write Gate; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: Site UI/SEO/i18n/accessibility/performance only; no report or generated file under `./site/`.
First evidence: `./site/app/(site)/`, `./site/features/site/`, `./site/components/home/`, `./site/focss/site/`, and `./site/i18n/`.
Expected evidence: route-to-pattern trace, Visual Detail Checklist, exact Core Product Write classification, and rendered-proof limitation.
Stop before claiming browser/performance proof.
```

### 6. Planner

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select `planner-studio` and `fork-boundaries` when the Fork Tree or imports are involved; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: Planner only; do not import Studio or modify unowned paths.
First evidence: `./site/app/ooplanner/`, `./site/features/Planner/`, `./site/components/Planner/`, `./site/lib/Planner/`, `./site/hooks/Planner/`, `./site/store/Planner/`, `./site/server/Planner/`, `./site/platform/Planner/`, and `./site/app/api/Planner/`.
Expected evidence: fork-safe Route Record, owned paths, persistence/canvas limitation, and pending boundary/browser checks.
Stop before cross-fork writes or persistence action.
```

### 7. Studio

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select `planner-studio` and `fork-boundaries` when the Fork Tree or imports are involved; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: Studio only; do not borrow Planner modules or claim Planner proof.
First evidence: `./site/app/oostudio/`, `./site/features/Studio/`, `./site/components/Studio/`, `./site/lib/Studio/`, `./site/hooks/Studio/`, `./site/store/Studio/`, `./site/server/Studio/`, `./site/platform/Studio/`, and `./site/app/api/Studio/`.
Expected evidence: Studio-only route/data/release trace, advisory AI limitation, owned paths, and pending persistence checks.
Stop before cross-fork or publish changes.
```

### 8. Admin

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select every matching skill including `db-migrations`, `focss-css`, or `graph-impact` only when triggered; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: Admin route/feature/auth/data ownership; no remote mutation or secret exposure.
First evidence: `./site/app/admin/`, `./site/features/admin/`, `./site/lib/admin/`, route docs, and the relevant database owner.
Expected evidence: role/auth source, Products/Admin decision, exact owned paths, Surface Status, and unverified hosted behavior.
Stop before migration, remote action, or service-role use.
```

### 9. CRM/Unwired Assessment

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select matching skills; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract with a Coverage-Gap Admission Card.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: compare CRM browser workspace and customer-query operations; do not combine them.
First evidence: `./site/app/admin/crm/`, `./site/features/crm/`, `./site/app/admin/customer-queries/`, `./site/app/api/customer-queries/`, and `./site/features/ops/`.
Expected evidence: `demo/local-only` CRM status citing `oando-crm-storage`, separate query status, owner, limitation, next evidence source, and action.
Stop before calling an unverified surface wired.
```

### 10. Catalog/Configurator/Quotes/Inventory

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select matching `db-migrations`, `focss-css`, and `graph-impact` skills when triggered; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: catalog/configurator/quote/inventory trace; no seed/publish/storage/migration action.
First evidence: `./site/lib/catalog/`, `./site/features/shared/catalog/`, `./site/app/(site)/products/`, `./site/app/(site)/quote-cart/`, `./site/app/admin/catalog/`, `./site/app/admin/inventory/`, `./site/app/api/configurator/`, and Products migrations.
Expected evidence: Products/Admin owner, asset/release path, exact scope, and hosted-proof limitation.
Stop before remote or data mutation.
```

### 11. Database

```text
Start with `oando-master`, then `repo-map`; select `db-migrations` for schema/SQL/RLS/grants/rollback/ownership and every other matching skill; use Local Evidence before assumptions; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: plan/review only unless exact migration ownership is approved; no apply.
First evidence: `./site/platform/supabase/migrations/`, `./site/platform/supabase/migrations.admin/`, `./site/platform/drizzle/schema/`, persistence selectors, and database docs.
Expected evidence: Products/Admin owner, RLS, grants, `-- rollback`, mode, generated types/API impact, and exact pending dry-run.
Stop before SQL apply, seed, or remote access.
```

### 12. AI/Retrieval

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select `ai-retrieval` only if `./.kiro/skills/ai-retrieval/SKILL.md` exists and select all other matching skills; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: advisory server-side AI/retrieval assessment; no provider call, package, or deployment.
First evidence: `./site/lib/ai/mastra/`, `./site/app/api/ai-advisor/`, `./site/app/api/Studio/ai/`, `./site/features/Studio/`, and stack guidance.
Expected evidence: Mastra/Bedrock/LanceDB/Orama/Fuse source, advisory boundary, missing-skill status if applicable, and unverified provider/deployment facts.
Stop before unsupported evaluation or deployment claims.
```

### 13. Image/Animation/Assets

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select every matching visual/impact skill; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; apply the Site Write Gate; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: asset/motion work only; no external capability or new package by assumption.
First evidence: `./site/public/`, `./scripts/generate-svg/`, nearby component patterns, `./site/focss/`, and existing motion imports.
Expected evidence: asset owner/generation path, licensing review, reduced-motion and interaction-state review, artifact destination, and visual-proof limitation.
Stop before publication or external tooling.
```

### 14. API/Security

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select `db-migrations` or `graph-impact` when evidence triggers; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: API/security trace; no security-control weakening or hosted call.
First evidence: `./site/app/api/`, `./site/lib/apiCatalog.ts`, `./site/proxy.ts`, `./site/lib/security/`, and route docs.
Expected evidence: auth, CSRF, rate-limit, RLS, persistence boundary, owned paths, and unverified hosted behavior.
Stop before changing security controls or exposing secrets.
```

### 15. Environment

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select matching skills; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: classify environment only; do not print, sync, commit, or change secrets.
First evidence: `./.env.example`, local env paths, `./package.json`, `./pnpm-workspace.yaml`, `./START.md`, and D04.
Expected evidence: redacted configured/private/generated/legacy status map, workspace boundary, and next owner action.
Stop before service launch or environment mutation.
```

### 16. Bug/Failing Test

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select matching skills; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: inspect the symptom and narrow source/test owner; do not infer a failure cause from unobserved output.
First evidence: reported symptom, relevant test source, `./Failures.md`, and narrow implementation path.
Expected evidence: known/unverified distinction, candidate cause, exact smallest diagnostic, authorization state, and next action.
Stop before running a test or changing configuration without authorization.
```

### 17. Gate-Failure Triage

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; classify every proposed command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; preserve gate composition and return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: read-only Full Gate Failure Triage; do not alter hooks, baselines, tests, or allowlists.
First evidence: exact reported command, repository root, authorization/hook state, and any current output.
Expected evidence: first failed subcommand, output summary, cause classification, smallest authorized diagnostic, preserved controls, and next owner.
Stop if current authorized output is absent and label the cause unverified.
```

### 18. Refactor

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; use `graph-impact` for Shared Code or blast radius and every other matching skill; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: preserve behavior and exact approved paths; no opportunistic cleanup.
First evidence: owning source, imports/consumers, fork roots, persistence boundary, and narrow proof source.
Expected evidence: exclusive ownership, impact/risk map, unchanged behavior target, rejected adjacent scope, and pending validation.
Stop on shared/unowned paths, fork boundary, or new behavior.
```

### 19. Documentation

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select matching skills; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; apply the Locked Path Gate; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: update only the approved guide/workstream path; do not edit locked docs or HTML without provenance.
First evidence: `./AGENTS.md`, `./DOC-MAP.md`, `./CONTENTS.md`, `./Agents/05-documentation.md`, `./plans/README.md`, and the owning document.
Expected evidence: canonical source, placement, Markdown/HTML relationship, artifact fields, and gap/pending state.
Stop before a handwritten report under `./results/` or a locked write.
```

### 20. Package/Dependency

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select `powers-skills-model` or `graph-impact` only when triggered; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: assess package status only; no install, manifest, lockfile, or workspace move.
First evidence: `./package.json`, `./pnpm-workspace.yaml`, `./pnpm-lock.yaml`, live imports, `./site/tsconfig.json`, `./tech-docs-generator/package.json`, and stack docs.
Expected evidence: declared/imported/configured/observed status, exact sibling boundary, approval need, and risk.
Stop before package installation or moving `./tech-docs-generator/` into `./site/`/`./results/site/`.
```

### 21. Deployment/Ops

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select matching operational/database skills; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: read-only target/risk/rollback plan; no deploy, remote mutation, service, or backup.
First evidence: `./vercel.json`, Worker, R2, observability, runbook, workflows, scripts, and instrumentation.
Expected evidence: target environment, owner, data sensitivity, exact pending command, rollback/recovery, and limitation.
Stop before external action.
```

### 22. Backup/Import/Export

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select matching operational/database skills; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: plan backup/import/export/recovery only; no data movement.
First evidence: `./OPERATIONS_RUNBOOK.md`, R2 scripts/registry, backup workflow, data owner, and recovery path.
Expected evidence: target, sensitivity, retention, restore path, exact command classification, authorization requirement, and fallback.
Stop before backup, import, export, or external storage action.
```

### 23. Unknown Task

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; do not guess paths, packages, skills, or commands; select every matching skill; classify every command; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: D22 read-only discovery; do not create a category, package, Power, MCP, or runtime implementation.
First evidence: `./START.md`, `./AGENTS.md`, layout docs, this guide, `./plans/README.md`, `./.kiro/skills/repo-map/SKILL.md`, and `./Failures.md`.
Expected evidence: local inventory, canonical owner, risk, selected/rejected skills, Coverage-Gap Admission, and one next decision.
Stop before editing from guesswork.
```

### 24. Finish Current Task

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; select every matching skill; classify every check; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; return the Plain-Language Response Contract and Completion Record.
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: reconcile only the current Route Record, ownership, changed paths, handoffs, gaps, and evidence; do not add cleanup.
First evidence: current Route Record, Agent Roster, Ownership Matrix, changed scope, handoffs, and target files.
Expected evidence: every changed-file reason, observed versus pending validation, artifact placement, Coverage-Gap Cards, Separate Approval Work, blockers, next owner, and final status.
Stop if proof, ownership, or authorization is unresolved.
```

### 25. Emergency Prompt for an Overwhelmed Owner

```text
Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions, classify every command, do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission, select every matching Package Skill, and return the Plain-Language Response Contract while helping me choose the safest next action for [DESIRED_OUTCOME].
```

## Six Standing Multi-Agent prompts outside the cookbook count

### Start Standing Multi-Agent Mode

```text
Start Standing Multi-Agent Mode for [DESIRED_OUTCOME]. Create exactly four Active Agent slots before action: Scout/Map, Planner/Risk, Implementer, and Verifier/Reporter; designate one slot Coordinator/Serial Integration Owner. Publish the Agent Roster, Ownership Matrix, Route Record, Deliverable Register, Pre-Action Gate Records, Handoff Register, Conflict Stop Rule, and statuses. Permit parallel work only for read-only research or disjoint ownership. Keep agent reports in ./agents-work/<workstream>/<report-type>/, Machine Evidence in ./results/<purpose>/, generated tech-docs in ./generated-documents/, plans in ./plans/<name>/, and canonical blockers in ./Failures.md. Keep ./tech-docs-generator/ beside ./site/ and apply the Site Write Gate. Classify Protected Commands and return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state. If four runtime entries are not observed, report guidance-only/not-observed and do not fall back silently.
```

### Launch Scout/Map and Planner/Risk in parallel

```text
Launch a read-only Parallel Research Wave for [DESIRED_OUTCOME]. Scout/Map owns authority, paths, and evidence; Planner/Risk owns scope, skills, risk, command classification, artifact placement, and validation planning. Publish exact four-slot ownership and the Route Record before action. No writes, commands, or Implementer permission. Require a complete Handoff Record at the wave boundary and serial reconciliation. Apply Locked Path, Site Write, artifact-placement, Protected Command, and Plain-Language Response Contract rules; return not-observed where evidence is unavailable.
```

### Hand an approved scope to Implementer

```text
Hand [DESIRED_OUTCOME] to Implementer only for these exact exclusive paths: [PATHS]. Confirm the Route Record, Ownership Matrix, artifact destination, Site Write Gate, matching skills, exclusions, and owner status first. The Implementer may not write any shared/unowned path, run a Protected Command, expand scope, or overwrite conflicts. Require changed-file reasons, observed/pending validation, blockers, and next owner in the Handoff Record. Use ./agents-work/<workstream>/<report-type>/ for authored reports, ./results/<purpose>/ for Machine Evidence, and redirect all Non-Core Artifacts out of ./site/. Return the Plain-Language Response Contract before writing and at handoff.
```

### Launch Verifier/Reporter

```text
Launch a read-only Verifier/Reporter for [DESIRED_OUTCOME] after the Implementer handoff. Reconcile Route Record, Roster, Ownership Matrix, artifact placement, Site Write Gate, gaps, conflicts, changed-file reasons, and observed versus pending validation. Do not modify implementation or turn static evidence into runtime proof. If ownership/evidence conflicts, invoke Conflict Stop and return to the Serial Integration Owner. Return the Plain-Language Response Contract and Completion Record with Separate Approval Work and True Blockers.
```

### Resolve a multi-agent conflict

```text
Invoke the Conflict Stop Rule for [CONFLICT].
Stop affected writes. Preserve the four-slot Roster, Ownership Matrix, Route Record, Handoff Register, and competing evidence. Identify exact paths, owners, scope, and contradictory facts; route only the unavoidable decision to the Repository Owner. Do not overwrite, silently merge, select another tool, or infer permission. After the decision, update ownership and serially reconcile before writing. Keep Protected Commands pending without both permissions and return the Plain-Language Response Contract, exact completion proof or an explicit unverified/pending state; for Output-Producing Tasks also declare Artifact Class, exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state.
```

### Finish and close a multi-agent task

```text
Finish [DESIRED_OUTCOME] by reconciling the four-slot Roster, Ownership Matrix, Route Record, deliverables, handoffs, conflicts, artifact placement, Site Write Gate, and validation. The Verifier/Reporter must remain read-only. List every changed file and reason, validation actually run, validation not run and why, unverified behavior, Coverage-Gap Cards, Separate Approval Work, True Blockers, next owner, and final status. Do not claim runtime enforcement, command success, rendered behavior, hosted persistence, connected MCP, installed Power, or relocation without exact evidence. Return the Plain-Language Response Contract and Completion Record.
```

## Artifact and owner-control reminder

If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site. The exact `./tech-docs-generator/` sibling boundary, `./generated-documents/` output boundary, `./results/site/` Purpose Subfolder, Locked Path Gate, Site Write Gate, Protected Command rule, and four-role standing procedure apply to every prompt and handoff.
