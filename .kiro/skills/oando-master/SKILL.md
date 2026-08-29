---
name: oando-master
description: Master router and completion contract for the oando1408 repo. Activate this FIRST on any repo task. It decides which repo skill, command, or power to use, and defines what "done" means so work actually finishes. Use when starting any task, unsure which skill applies, or before declaring work complete.
---

# oando Master Skill

`.kiro/skills/oando-master/SKILL.md` is the canonical repository-local Kiro skill workflow for Repository Task routing and completion criteria. When a Repository Task begins, read this workflow first for routing guidance and completion criteria; use the Referenced Skill Guidance for domain-specific instructions. Authority order remains: current user instruction → live repository evidence and fresh command output → `AGENTS.md` → `Agents/` → `docs/`.

## Prime directive: finish the work

Make the smallest sound change that meets the user's goal. Use the narrowest valid proof, retain exact evidence, and stop when the user’s acceptance criteria are met.

## Test and gate authorization

Tests, gates, coverage, browser-test runners, and test-like static checks are user-owned by default. An agent may execute one only when both conditions hold:

1. The user explicitly authorizes that command in the current session.
2. An enabled pre-execution `block-agent-tests` hook permits the tool call.

The current live hook is enabled and uses `PreToolUse` for `execute_pwsh` and
`control_pwsh_process`, so it enforces the second condition before agent shell
execution. If the hook denies a command, do not retry, bypass, weaken, or remove
it; provide the exact command for the user to run directly instead.

## Step 1 — Route the task

| The task is about... | Use this skill | Typical validation |
|----------------------|----------------|--------------------|
| Where does X live / orienting | `repo-map` | graph inspection when needed |
| Shared-code changes or impact analysis | `graph-impact` | graph-impact analysis |
| CSS, tokens, Tailwind, `site/focss/**` | `focss-css` | `verify:focss`, token checks when authorized |
| Studio/Planner code, imports across forks | `fork-boundaries` | `scan:boundaries` when authorized |
| SQL, schema, migrations, choosing a DB | `db-migrations` | migration dry-run when authorized |
| An evidenced condition matches an Additional Repository Skill | the matching Additional Repository Skill | that guidance's applicable validation |

Route to the Referenced Skill Guidance for every applicable row when conditions overlap; do not discard a matching route. An Additional Repository Skill is conditional on evidence of a match—do not assume a fixed inventory or default route. If no row applies, this completion contract still governs.

## Step 2 — Route to a power only when the repo cannot answer

Start with Local Evidence: repository documentation, source files, configuration, and fresh command output. The Installed-Power Registry is the source of truth. The names below are candidate-Power guidance, not installation or availability evidence.

| Need | Power |
|---|---|
| Repo-local workflow, fork boundaries, database routing | `oando-workflow` |
| Complete design-system scaffolding | `design-system-power-builder` |
| Exploratory human-like browser automation | `nova-act` |
| Repeatable browser workflows, screenshots, deploy smoke checks, test authoring | `kane-cli` |
| Version-correct official library/framework docs | `context7` |
| Broad live-web research | `exa` |
| Supabase/Postgres/auth/storage/RLS operations | `supabase-hosted` |
| API collection and API resource management | `postman` |
| Image/video asset operations | `cloudinary` |
| Local project memory and recall | `ltm-power` |
| AI code-review/security-review information | `cubic-code-review` |

Apply these decisions in order:

1. Use Local Evidence first. If it answers the Repository Task need, do not select a Power.
2. Only when Local Evidence is insufficient, consult the Installed-Power Registry before considering a Candidate Power.
3. When the registry confirms a needed Power, present it as an optional specialized capability; do not activate it automatically.
4. When the registry does not confirm a Candidate Power, do not represent it as installed or activate it; continue with Local Evidence and applicable Referenced Skill Guidance.
5. When a Repository Task requests Power activation, require Installed-Power Registry confirmation before activation. No Power is activated automatically by this workflow.

## Step 3 — Validate in the permitted lane

Run the smallest check that proves the specific change. Non-test static inspection may proceed normally; test-like checks require the authorization conditions above.

1. Layout floor: `pnpm run check:layout`
2. Area-specific checks:
   - CSS: `pnpm run verify:focss`, `pnpm run check:style-tokens`
   - Studio/Planner forks: `pnpm run scan:boundaries`
   - Migrations: `pnpm run db:apply -- --dry` or `:admin`
   - Types: `pnpm run typecheck`
   - Lint: `pnpm run lint`
3. Read the changed path and confirm it remains coherent.

Classify an observed result from a Test-Like Command as Validation Evidence only when the exact command had both current-session User Authorization and Hook Permission. If a required Test-Like Command lacks either condition, identify that exact command as Pending User Validation; do not claim it passed.

## Step 4 — Declare done

A task can be reported as fully complete only when all applicable conditions hold:

- The stated Repository Task goal is met.
- Every required permitted validation command has an observed result classified as Validation Evidence.
- Any validation failure is fixed within scope or escalated only when evidence establishes a True Blocker that prevents completion within the authorized scope.
- If a Studio or Planner Fork Tree changed, applicable Fork Boundary validation evidence is observed.
- No evidenced True Blocker prevents completion within the authorized scope.

In every completion report, distinguish the stated task goal, changed scope, observed Validation Evidence with exact command outcomes, and Pending User Validation with each exact command. If a changed Fork Tree lacks applicable Fork Boundary validation evidence, report that validation as pending rather than report the task as fully complete. Escalate only an evidenced True Blocker that prevents completion within the authorized scope, and record it in root `Failures.md` with reproduction evidence. Never claim a test passed when it did not run, and never claim rendered behavior from static evidence alone. Repo root and `pnpm` only; UI uses `http://localhost:3000`.


## Current Guidance Deliverable: mandatory routing and completion contract

This skill is the canonical first router for every Repository Task. Its routing and contract remain prose guidance; the approved static Canonical Inclusion and Exact-Line records are explicit repository artifacts, not a runtime route, automatic Agent roster, universal pre-action interceptor, or enforcement implementation.

### Begin Here and Route Record

Accept an ordinary-language desired outcome as the only required contributor input. Before any repository modification or output-path selection:

1. Read this skill first, then apply authority order: current user instruction → live code and fresh command output → `AGENTS.md` → `Agents/` → `docs/`; use `plans/README.md` for active coordination after those sources.
2. Restate the outcome with an action verb and named domain/Product Surface; define specialized terms.
3. Select exact first evidence locations with a reason for each.
4. Choose a D01–D22 Repository Domain Index card in `./agents-work/oando-repository-guide/README.md`, using D22 for an unfamiliar area.
5. Select every matching Package Skill and reject every non-matching/unavailable skill with a plain-language reason. If no skill matches, select Local Evidence and record the no-match reason.
6. Select `Vibe`, `Plan`, `Spec`, `Autopilot`, or `Supervised` from scope and operational risk; this is guidance, not a runtime switch.
7. Classify every proposed command as `read-only inspection`, `Normal-Agent Eligible Check`, `Protected Command`, or `no-run pending authorization` before proposing or running it.
8. For an Output-Producing Task, classify Artifact Class, exact Workstream or Purpose Subfolder, filename pattern, owning source/script, authored-or-generated state, rejected placements, and Site Write Gate state.
9. Ask only unavoidable Owner Decisions; underspecified work defaults to read-only discovery.

The Route Record is:

```text
Outcome:
Domain / Domain Index card:
Exact first evidence locations and reasons:
Candidate paths:
Selected Package Skills and trigger evidence:
Rejected Package Skills and reasons:
Workflow Mode:
Operational-Risk Classification:
Command Classification:
Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:
Owning source or script / authored or generated:
Rejected placements:
Locked Path Gate state:
Site Write Gate state, when relevant:
Validation State:
Unavoidable Owner Decisions:
Next action:
```

The Completion Record repeats selected/rejected skills, changed scope, exact observed evidence, pending validation, artifact placement, gaps, Separate Approval Work, and True Blockers. A task with no file change states inspected scope and the decision reached.

### Conditional skill routing

The observed repository-local Package Skill inventory is the ten files named in the guide: `ai-retrieval`, `db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `oando-master`, `planner-studio`, `powers-skills-model`, `repo-map`, and `verify-and-gate`. This inventory is static evidence of repository guidance, not proof of client loading or automatic activation. Route additively when evidence matches:

- `repo-map` for orientation, route, feature, path, or code-location discovery.
- `graph-impact` for Shared Code, dependencies, blast radius, or circular-dependency analysis.
- `focss-css` for FOCSS, Tailwind configuration, semantic tokens, icons, alignment, styling, or visual contracts.
- `planner-studio` for Planner/Studio route, feature, component, library, hook, store, server, platform, canvas, catalog, persistence, or handoff behavior.
- `fork-boundaries` whenever a Planner/Studio Fork Tree changes or cross-fork imports are evaluated; Planner and Studio never import one another.
- `db-migrations` for schema selection, SQL, migrations, RLS, grants, rollback, or Products/Admin ownership.
- `powers-skills-model` for repository-local skills, steering, Powers, MCPs, agents, or capability packaging.
- `verify-and-gate` only after exact current-session Explicit User Authorization and Hook Permission are established for the requested validation.
- `ai-retrieval` for evidence concerning `./site/lib/ai/mastra/`, Mastra, Bedrock, LanceDB, Orama, Fuse.js, embeddings, retrieval, advisory output, or provider behavior. It remains guidance-only: route through Local Evidence, preserve server-only/provider boundaries, and do not infer route reachability or runtime capability.

A skill directory or schema file does not prove installation, applicability, connection, or runtime loading. Use Local Evidence before any Power. Consult the Installed-Power Registry only when Local Evidence cannot answer the question; present a confirmed Power as optional, never activate automatically, and use a read-only least-privilege fallback for external access. If a recurring repository task lacks a matching Package Skill, record a separate Package Skill proposal with its trigger, canonical location, authority sources, safety boundary, and completion expectation; do not represent the proposal as an available skill.

### Domain and surface safeguards

The guide at `./agents-work/oando-repository-guide/README.md` is the beginner start page and contains 22 coverage-audited cards. Each card has Goal, Start Paths, Scope, Evidence Steps in authority → listed paths → live comparison → status/risk → evidence/decision order, Allowed Actions, Forbidden Actions, Risk, Expected Evidence, and Next Decision. Surface Status is one of `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy`, with evidence source, owner, next action, and limitation. The Admin CRM browser workspace is `demo/local-only` while `oando-crm-storage` is the observed browser key; customer queries are a separate Admin Database-backed surface. `/admin/product-studio` and the interactive legacy `/planner/*` app tree remain `unwired/absent` until current route evidence changes them; marketing `/planner*` remains distinct from `/ooplanner`.

For UI changes, route from user-facing path through feature, component, FOCSS zone, and existing pattern. Require the Visual Detail Checklist: existing Phosphor abstraction, icon and adjacent-control alignment, spacing, responsive layout, loading/empty/error states, keyboard reachability, and reduced-motion behavior when applicable. For image/animation work inspect ownership, existing `./scripts/generate-svg/` or asset path, licensing, and motion preference. AI output is advisory and requires explicit user application; never claim deployed or evaluated AI from static imports.

For data work select Products (`erpweaiypimorcunaimz`) versus Admin (`rxzpznmxbaoxpikowmfc`) before edits. Products migrations are `./site/platform/supabase/migrations/`; Admin migrations are `./site/platform/supabase/migrations.admin/`; `./site/platform/drizzle/schema/` is schema support, not the deployable path. Require RLS, grants, `-- rollback`, and mode-aware persistence. Production filesystem is read-only; disk is only for non-production `DEV_AUTH_BYPASS=1` through approved wrappers, with Supabase for other runtime modes and no dual-write.

### Artifact placement, workspace, Locked Path, and Site Write Gates

| Artifact | Approved destination | Prohibited destination |
|---|---|---|
| Agent-authored report/work product | `./agents-work/<workstream>/<report-type>/` or approved guide workstream | `./agents-work/` root, `./results/`, `./site/` |
| Machine Evidence | `./results/<purpose>/` | `./results/` root, `./agents-work/`, `./site/` |
| Generated tech-docs | `./generated-documents/` | `./results/`, `./agents-work/`, `./site/` |
| Active plan | `./plans/<name>/` indexed by `./plans/README.md` | `./results/`, `./site/`, unowned root |
| True Blocker | root `./Failures.md`, with supporting workstream analysis | duplicate ledger |
| Core Product Write | explicitly approved product source | `./site/` for a Non-Core Artifact |
| Repository skill | `./.kiro/skills/` | `./site/`, `./results/`, `./agents-work/` |

> If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.

Keep `./tech-docs-generator/` as a root-level sibling of `./site/`; keep `./generated-documents/` separate; `./results/site/` is Machine Evidence and is not source or a package relocation target. A documented placement decision does not prove relocation.

Before any write, apply the Locked Path Gate: classify the exact target as `Locked`, `explicitly owner-authorized`, or `writable`. Treat `./docs/`, `./Agents/`, every root-level `./*.md`, and `./.kiro/agents/` as read-only evidence unless the Repository Owner names and authorizes the exact file in the current request. A read grant never becomes write/delete permission. Without exact authorization, stop, preserve the source, record the Owner Decision and Separate Approval Work, and use only an approved workstream for supporting analysis. Do not create a copy and claim the source changed.

Before any write under `./site/`, apply the Site Write Gate. Permit only an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence. Stop and redirect reports, results, audits, handoffs, prompts, plans, skills, steering files, MCP definitions, generated files, temporary/debug files, and all other Non-Core Artifacts. A move of `./tech-docs-generator/` into `./site/` or `./results/site/` is a separate Workspace-Boundary Task.

### Protected validation and Failure Triage

Protected Commands are Full Gates, tests, coverage, browser-test runners, builds, deployments, database actions, backups, and Local-Service Commands. They require exact current-session Explicit User Authorization and Hook Permission. An inline marker is insufficient. A Normal-Agent Eligible Check is allowed only when the active policy and enabled hook name the exact non-mutating check. While `block-agent-tests` matches `typecheck`, `pnpm run typecheck` is pending user validation; `pnpm run typecheck:scripts` is unavailable while `./scripts/tsconfig.json` is absent and is not suggested.

Every observed check records exact command, repository-root cwd, scope, authorization state, Hook Decision, exit status, output limitation, and behavior not verified. When a Full Gate Failure is reported or observed, perform read-only Failure Triage first and capture exact command, root cwd, authorization, hook decision, exit status, first failed subcommand, output summary, and cause classification. Without current authorized output, label the cause unverified and request the smallest authorized diagnostic. Preserve gate composition, test selection, coverage, quality baselines, and Hook Permission. A True Blocker with reproducible evidence belongs only in root `./Failures.md` within its locked-path approval boundary.

### Plain-Language Response Contract

Every task-start, progress, handoff, pause, and completion response uses this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions. Explain specialized terms before decisions. For Output-Producing Tasks include Artifact Class, selected subfolder, filename pattern, owner/source, authored/generated state, rejected placements, observed placement, and Site Write Gate state.

### Standing Multi-Agent Mode and compliance

Every Repository Task begins with exactly four Active Agent slots: Scout/Map (read-only), Planner/Risk (read-only), Implementer (write only after approved exclusive ownership), and Verifier/Reporter (read-only). Attach Coordinator/Serial Integration Owner to one slot; never count it as a fifth role. Publish Agent Roster, Ownership Matrix, Route Record, Deliverable Register, Pre-Action Gate Records, Handoff Register, Conflict Stop Rule, and statuses before action. Parallel work is limited to read-only research or disjoint ownership; shared paths are serial. If runtime four-slot creation cannot be observed, report `guidance-only` or `not-observed` and do not silently use one Agent. Automatic spawning and universal pre-action enforcement are Separate Approval Work.

Before acting, every Agent declares the Agent Compliance Contract in plain language:

```text
I read the current user request: [yes / missing source].
I read the applicable global repository standard: [AGENTS.md and applicable named standard / missing source].
User instructions outrank defaults; the global standard remains in force unless explicitly overridden: [override / none].
Requested outcome: [what the user asked for].
Assigned scope: [what I will do].
Exact owned paths and permission for each: [paths and read-only/write permission].
Explicit exclusions: [paths, actions, and outputs I will not touch].
Delivery conditions: [required result and evidence].
Validation allowed now: [exact permitted checks / none].
Validation pending authorization: [exact checks / none].
Expected handoff owner: [named Agent or Repository Owner].
```

Agents do only assigned work, preserve unrelated changes, do not infer permission from proximity or helpfulness, and stop on conflict, missing authorization, ambiguous ownership, contradictory evidence, hidden constraint, or scope expansion. A runtime roster or executor is not implied by this prose declaration.

Every handoff contains Objective; Role and Next Owner; Scope; Paths Read and Paths Changed; Route Record; Evidence; Decisions; Coverage Gaps; Validation Command; Repository Root; Authorization State; Hook Decision; Exit Status; Validation Limitation; Blockers; Next Action; and Status. Unavailable values are `not-observed`. The coordinator rejects unreconciled scope drift and does not promote missing evidence to `verified` or `complete`.

### Separate Approval Work and completion

The Current Guidance Deliverable is guide chapters, D01–D22 cards, Prompt Cookbook, response contract, handoff/coverage rules, and conditional skill-routing prose. The approved static Canonical Inclusion covers the named writable subset of Active Contract-Bearing Documents; the five protected `.kiro/agents/` definitions remain unchanged. Runtime hook/policy/allowlist changes, universal enforcement, automatic spawning, protected-root or protected-Agent contract append, protected Exact-Line rollout, product runtime, packages, database actions, deployment, backup, external MCP, Power activation, and workspace-boundary changes remain Separate Approval Work. HTML remains untouched while Markdown-to-HTML provenance is unresolved. Completion states exact changed scope, observed static evidence, pending checks, Coverage-Gap Admissions, Separate Approval Work, and True Blockers without claiming runtime loading, command success, rendered behavior, hosted persistence, connected MCP, installed Power, or relocation from prose alone.

## Task-classifier and protected-root reference

Use the 22-row task-classifier table in `./agents-work/oando-repository-guide/README.md` as the shared routing index. It is a prose reference, not a runtime scanner: each D01–D22 row supplies the trigger, first Local Evidence, additive skill set, command class, and completion proof. If no trigger matches, route through Local Evidence and record the no-match reason; if several match, select every matching skill.

The Protected Path Set is broader than root Markdown: every file directly under `./`, every path under `./docs/`, every path under `./Agents/`, and every path under `./.kiro/agents/` is read-only evidence by default. A write or delete requires the exact file to be named and authorized in the current request. This clarification does not authorize protected-path changes, protected contract append, protected Exact-Line migration, or runtime enforcement; those remain Separate Approval Work.
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.
Before any action, read the current user request and applicable repository standard, declare exact scope and permissions, and stop on denial, conflict, or missing authorization.