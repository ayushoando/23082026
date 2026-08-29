# Requirements Document

## Introduction

This revision defines an expanded Repository Guide and Master Router for the Oando repository. The system is a repository-local guidance and task-routing system, not a product-runtime feature. The system must help contributors and agents identify the correct repository area, select applicable repository skills, distinguish wired capabilities from demos or absent surfaces, complete bounded work, and report evidence honestly.

The revision preserves the existing master-router responsibilities for authority ordering, local-evidence-first routing, confirmed-power selection, narrow validation, and evidence-based completion. The revision expands the requirements to make the existing guide understandable through outcome-focused task cards, to cover every required repository domain, and to make task routing observable rather than an unused list of skills.

## Evidence-Based Implementation Scope

| Scope | Live baseline | Required boundary |
|---|---|---|
| Repository guide | `agents-work/oando-repository-guide/README.md`, eleven numbered Markdown chapters, matching static HTML pages, and `guide.css` | Guidance/documentation work only; determine and preserve the Markdown-to-HTML synchronization method before modifying rendered pages. |
| Master routing | `.kiro/skills/oando-master/SKILL.md` and `.kiro/skills/repo-map/SKILL.md` | Repository-local Kiro guidance only; no product route, package command, or runtime API is created. |
| Existing domain skills | `.kiro/skills/` contains `db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `oando-master`, `planner-studio`, `powers-skills-model`, `repo-map`, and `verify-and-gate` | Reuse and make conditional routing to existing skills visible before adding duplicate guidance. |
| Planner and Studio | `site/app/ooplanner`, `site/app/oostudio`, and the corresponding forked feature, component, library, hook, store, server, and platform trees | Documentation must preserve the fork boundary; no cross-fork source change is included in this revision. |
| AI and retrieval | `site/lib/ai/mastra/` contains server-side Mastra, catalog retrieval, LanceDB, Orama, and provider modules | A dedicated AI Package Skill is guidance work; no AI provider, package, or runtime behavior changes are included. |
| Command enforcement | `.kiro/hooks/block-agent-tests.json` and `.kiro/hooks/block-agent-tests.mjs` enforce `PreToolUse` command blocking; the current matcher blocks full gates, tests, builds, and `typecheck` | The requirements may describe a separately approved policy proposal, but this revision must not silently modify, bypass, or weaken hook enforcement. |
| Capability configuration | `.kiro/settings/mcp.json` has an empty `mcpServers` object and `.kiro/mcp/` contains schemas | A schema directory does not establish a connected MCP server or an installed power. |
| Repository reports and evidence | `results/` is generated evidence; the current guide is under `agents-work/`; `agent-reports/` is an existing reference location | New guide-directed agent work reports belong under `agents-work/`; generated command output belongs only under `results/`. |

## Assumptions

1. The user-reported full-gate failure is accepted as a current routing concern, but no current-session `pnpm run gate` output or failed subcommand has been observed. The guide must therefore describe a failure-triage path without asserting a failure cause.
2. The existing `.config.kiro` identifies this artifact as the established `oando-master` fast-task feature specification. The configuration remains valid and does not require a new specification identifier.
3. `planner-studio` is the existing Planner Package Skill for Planner and Studio work. No dedicated AI Package Skill exists in the current `.kiro/skills/` inventory; this specification uses `ai-retrieval` as the proposed canonical skill name for future repository-local AI and retrieval guidance.
4. The root `package.json` declares `typecheck:scripts`, but the workspace rule and file inventory establish that `scripts/tsconfig.json` is absent. The revised guide must label that command unavailable and must not recommend the command as validation.
5. Durable documentation contains historical or inconsistent claims in some locations. The guide must resolve task decisions from current user instructions, live code or fresh command output, and the repository authority order rather than treating a document as self-validating.
6. The requested work is limited to guidance, documentation, and repository-local Kiro workflow design. Any future hook, policy, generated-page, or skill implementation must be separately scoped and approved.

## Glossary

- **Repository Guide and Master Router**: The combined repository-local documentation and Kiro routing system described by this specification.
- **Repository Guide**: The outcome-focused guide rooted at `agents-work/oando-repository-guide/README.md` and its numbered chapters and rendered pages.
- **Oando Master Skill**: The repository-local Kiro skill at `.kiro/skills/oando-master/SKILL.md` that starts routing and defines completion expectations.
- **Repository Task**: A user-requested activity that requires repository orientation, inspection, modification, validation planning, or reporting.
- **Task Outcome**: A stated user-visible or repository-maintenance result that a Repository Task must produce.
- **Operational-Risk Classification**: A task classification that identifies whether a Repository Task can affect source, data, credentials, infrastructure, release quality, or external systems.
- **Shared Code**: Source code used by more than one Product Surface or repository domain.
- **Fork Tree**: The isolated Planner or Studio source tree across application, feature, component, library, hook, store, server, and platform paths.
- **FOCSS**: The repository semantic-token and zone layer built on Tailwind CSS v4.
- **RLS**: Row Level Security rules that control database-row access.
- **Phosphor Icon Abstraction**: The repository wrappers and icon maps that select `@phosphor-icons/react` icons for product interfaces.
- **Zustand Persistence**: Browser or application state persistence implemented through the Zustand state-management package.
- **AI Retrieval Stack**: The server-side Mastra, Amazon Bedrock, LanceDB, Orama, Fuse.js, embedding, provider, and advisory modules used for AI and retrieval behavior.
- **Route Record**: A task-start record containing the Task Outcome, task domain, candidate paths, selected and rejected Package Skills, Operational-Risk Classification, and Validation State.
- **Outcome-Focused Task Card**: A guide entry with the fields Goal, Start Path, Scope, Required Actions, Prohibited Actions, Expected Evidence, and Next Decision.
- **Repository Domain Index**: The guide index that maps a Repository Task outcome to a repository domain, canonical paths, applicable Package Skills, authority sources, and evidence expectations.
- **Package Skill**: A repository-local Kiro skill with a defined triggering condition, canonical path, and workflow for a technical domain.
- **Planner Package Skill**: The existing `planner-studio` Package Skill used for Planner and Studio task guidance.
- **AI Package Skill**: The proposed `ai-retrieval` Package Skill for server-side AI, retrieval, provider, vector-search, and advisory work under `site/lib/ai/mastra/`.
- **Conditional Routing**: Selection of every Package Skill whose documented trigger matches Repository Task evidence, followed by an explicit no-match record when no Package Skill applies.
- **Local Evidence**: Repository documentation, source files, configuration, and fresh command output available in the workspace.
- **Authority Ordering**: Current user instruction, live repository evidence and fresh command output, `AGENTS.md`, `Agents/`, `docs/`, and active planning coordination in `plans/`.
- **Product Surface**: A user-facing repository area: Site UI, Admin, Planner, Studio, CRM, Operations, or tech-docs.
- **Surface Status**: One of `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy`; each status must cite current evidence and a next action.
- **Unwired Surface**: A route, interface, data flow, or described capability without evidence of a complete end-to-end implementation.
- **Visual Detail Checklist**: The required review points for a UI change: correct existing icon abstraction, alignment, spacing, responsive layout, interaction states, keyboard reachability, and motion preference behavior.
- **Image or Animation Work**: A Repository Task that creates, changes, selects, exports, or presents visual assets or motion.
- **Repository Package**: A workspace package or root dependency whose purpose and installation boundary must be described from current manifests and imports.
- **Products Database**: Supabase project `erpweaiypimorcunaimz`, which owns marketing catalog, configurator, flags, and themes.
- **Admin Database**: Supabase project `rxzpznmxbaoxpikowmfc`, which owns staff, customers, plans, furniture, descriptors, price books, audit data, and customer queries.
- **Mode-Aware Persistence**: Exclusive runtime selection of disk storage only for non-production `DEV_AUTH_BYPASS=1` and Supabase storage for other runtime modes.
- **Generated Result**: Machine-generated command, test, report, or inventory output stored under `results/`.
- **Agent Work Report**: Human-authored guide, research, or agent work material stored under `agents-work/`.
- **Locked Documentation**: Retained architectural constraints or locked and retired locations that must be treated as constraints, including `docs/governance/charter.md` and the locked or retired paths identified by FOCSS governance.
- **MCP**: A Model Context Protocol server or integration that can expose external tools or data.
- **MCP Schema**: A repository file that describes MCP tools but does not prove MCP configuration, authentication, connection, installation, or runtime availability.
- **MCP Configuration**: The workspace connection configuration in `.kiro/settings/mcp.json`.
- **Installed-Power Registry**: The current Kiro capability inventory that confirms whether a Power is available for activation.
- **Power**: An installed Kiro capability package that can provide specialized tools or guidance.
- **Candidate Power**: A Power considered for a Repository Task before Installed-Power Registry confirmation.
- **Full Gate**: `pnpm run gate`, which delegates to the root `release:gate` command.
- **Full Gate Failure**: A reported or observed non-successful Full Gate outcome that has not been resolved by current evidence.
- **Test Command**: A command that runs tests, gates, coverage, browser-test runners, builds, or other user-owned validation.
- **Local-Service Command**: A command that starts, serves, watches, or otherwise runs a local process for application, browser, or infrastructure behavior.
- **Narrow Static Check**: A named, non-mutating lint, type, layout, documentation, or source inspection command scoped to a Repository Task.
- **Normal-Agent Eligible Check**: A TypeScript type check or Narrow Static Check that an active policy and enabled hook explicitly allow for normal agent execution without a Full Gate or Test Command authorization.
- **Explicit User Authorization**: Current-session user permission for an exact command.
- **Hook Permission**: An enabled pre-execution hook decision that permits a command invocation.
- **Validation State**: One of `not-needed`, `eligible`, `pending-user-authorization`, `blocked-by-hook`, `observed-pass`, `observed-fail`, or `not-run`.
- **Failure Triage**: A read-only process that captures a reported or observed Full Gate failure, identifies the first failed command and evidence-based cause classification, and selects the narrowest permitted next diagnostic.
- **Policy Implementation Proposal**: A separately approved change proposal for repository policy or hook source that preserves enforced protections while changing a documented command-eligibility rule.
- **Completion Record**: A task-end report containing the Task Outcome, changed scope, selected Package Skills, observed evidence, pending validation, and true blockers.
- **True Blocker**: An evidenced condition that prevents Repository Task completion within the authorized scope and belongs in root `Failures.md`.
- **Begin Here Flow**: The plain-language entry sequence that converts a contributor's ordinary-language Repository Task description into a Task Outcome, first inspection locations, candidate paths, selected Package Skills, Workflow Mode, Command Classification, Operational-Risk Classification, and next action.
- **Workflow Mode**: One of `Vibe`, `Plan`, `Spec`, `Autopilot`, or `Supervised`, selected from Repository Task scope and Operational-Risk Classification.
- **Command Classification**: The command state `read-only inspection`, `Normal-Agent Eligible Check`, `Protected Command`, or `no-run pending authorization`.
- **Protected Command**: A Full Gate, Test Command, coverage command, browser-test runner, build, deployment, database action, backup, or Local-Service Command requiring exact current-session Explicit User Authorization and Hook Permission.
- **Plain-Language Response Contract**: The mandatory structure for a Repository Task response: desired outcome, known facts, unverified facts, first inspection locations, selected Package Skills, rejected Package Skills with reasons, numbered next actions, likely files or areas, risk, checks allowed now, Protected Commands pending authorization, exact completion evidence, and unavoidable Owner Decisions.
- **Owner Decision**: A decision reserved for the repository owner, including exact Protected Command authorization, scope approval, or selection among alternatives not established by Local Evidence.
- **Prompt Cookbook**: The guide section containing one complete copy-paste prompt for every Prompt Cookbook Category and common routing and safety instructions.
- **Prompt Cookbook Category**: One of `Understand Repository`, `Find Where to Work`, `Small UI/Icon/Alignment Fix`, `Feature`, `Site UI`, `Planner`, `Studio`, `Admin`, `CRM/Unwired Assessment`, `Catalog/Configurator/Quotes/Inventory`, `Database`, `AI/Retrieval`, `Image/Animation/Assets`, `API/Security`, `Environment`, `Bug/Failing Test`, `Gate-Failure Triage`, `Refactor`, `Documentation`, `Package/Dependency`, `Deployment/Ops`, `Backup/Import/Export`, `Unknown Task`, `Finish Current Task`, or `Emergency Prompt for an Overwhelmed Owner`.
- **Agent**: A Kiro execution participant assigned a bounded Repository Task role.
- **Multi-Agent Operating Procedure**: A beginner-readable sequence for assigning Scout/Map, Planner/Risk Analyst, Implementer, and Verifier/Reporter roles under bounded ownership and serial integration.
- **Handoff Record**: An agent-to-agent transfer containing objective, evidence, files read or changed, decisions, validation status, blockers, and next owner.
- **Conflict Stop Rule**: A rule requiring affected multi-agent work to stop before further writes when file ownership overlaps, edits conflict, or evidence contradicts.
- **Serial Integration**: Sequential reconciliation of Agent handoffs by one owner before subsequent writes to overlapping or shared paths.
- **Machine Evidence**: Command, check, test, gate, build, browser, coverage, deployment, database, backup, or local-service output generated by a tool rather than authored as a human work report.
- **Inline Authorization Marker**: An environment variable, prompt token, comment, or other inline text that appears to grant permission without constituting current-session Explicit User Authorization and Hook Permission.
- **End-to-End Evidence**: Current evidence covering the route or interface, relevant behavior, data flow, and persistence or external boundary required to establish a complete workflow.
- **Coverage-Gap Admission Card**: A record for any missing or unverified area containing the named area or capability, status, evidence checked, evidence limitation, next evidence source, owner action, and scope boundary.
- **Coverage-Audited Task Card**: An Outcome-Focused Task Card whose Goal, Start Paths, Scope, Evidence Steps, Allowed Actions, Forbidden Actions, Risk, Expected Evidence, and Next Decision are individually checked against the Repository Domain Index coverage baseline.
- **Verified Source Path**: A repository path confirmed by the current guide or live repository evidence and cited as the first location for a Domain Index card; a Verified Source Path does not prove that a capability is wired or complete.
- **Coverage Audit**: A recorded comparison between the required Domain Index card set, each card's Verified Source Paths, and the evidence status for each required repository area.
- **Prompt Safety Preamble**: The mandatory copy-paste instructions that require `oando-master`, then `repo-map`, Local Evidence before assumptions, command classification before execution, Protected Command authorization, and the Plain-Language Response Contract.
- **Current Guidance Deliverable**: The documentation and skill-routing work covered by this specification, including the Repository Guide, Domain Index, task cards, Prompt Cookbook, response contract, handoff procedure, and coverage-gap admission rules.
- **Separate Approval Work**: Hook, policy, runtime, package, database, deployment, backup, external MCP, or Power changes outside the Current Guidance Deliverable that require a separately authorized Repository Task.
- **Downstream Tasks Artifact**: The approved task list generated from this requirements document and used to track open, blocked, validated, and completed work; a stale task list marked complete is not completion evidence.
- **Owner-Controlled Validation**: Validation whose execution requires exact current-session Explicit User Authorization and Hook Permission, including Protected Commands.
- **Workstream Subfolder**: A report location below `agents-work/` that names a workstream and, when applicable, a report type, including `agents-work/<workstream>/<report-type>/` and an existing approved workstream folder such as `agents-work/oando-repository-guide/` or `agents-work/repository-graph/`.
- **Purpose Subfolder**: A named directory below `results/` that identifies the purpose of Machine Evidence, including existing folders such as `results/tests/`, `results/site/`, `results/site-ui/`, and `results/ops/`, or a documented additional purpose folder.
- **Artifact Class**: The classification of an output as an agent-authored report or work product, Machine Evidence, generated tech-docs output, active plan material, a True Blocker, or a Core Product Write.
- **Output-Producing Task**: A Repository Task that creates or updates an authored artifact, generated output, plan artifact, blocker record, or product source file.
- **Core Product Write**: An explicitly approved write to an existing product source tree for core product code, product UI or FOCSS, product assets, route, API, server, persistence, or another clearly scoped product implementation.
- **Non-Core Artifact**: A report, result, audit, handoff, prompt, plan, Agent Work Report, skill, steering file, MCP definition, generated output, temporary file, debug file, or other work product that is not a Core Product Write.
- **Site Write Gate**: The Route Record classification and stop-or-redirect control required before any write under `site/`.
- **Tech-Docs Generator Package**: The root-level workspace package at `./tech-docs-generator/`, a sibling of `./site/`, that generates documentation output.
- **Site Source Tree**: The Next.js product source tree rooted at `./site/`, reserved for Core Product Writes.
- **Results Site Purpose Subfolder**: The machine-generated result-purpose directory at `./results/site/`, distinct from the Site Source Tree.
- **Generated Documents Directory**: The directory at `./generated-documents/` that receives output from the Tech-Docs Generator Package and remains separate from `./site/` and `./results/`.
- **Workspace-Boundary Task**: A separately approved Repository Task that specifically authorizes changing the placement or relationship of a workspace package or generated-output directory.
- **Exact Directory Path**: A repository-relative directory name written with a leading `./`, a trailing `/`, and enough surrounding path context to distinguish similarly named directories.
- **Standing Multi-Agent Mode**: The default operating mode for every Repository Task in which an Orchestrator assigns and tracks multiple Agents with declared roles, bounded ownership, explicit handoffs, serial integration, and evidence-based closure; Standing Multi-Agent Mode is a persistent repository rule rather than a one-time suggestion or package-installation step.
- **Agent Roster**: The task-start record listing every active Agent, declared role, read-only or write permission, owned scope, availability state, and current status for a Repository Task.
- **Ownership Matrix**: The mapping from each Repository Task objective, evidence item, artifact, and repository path to one exclusive Agent owner and the Serial Integration Owner, including serial ownership for shared paths.
- **Parallel Research Wave**: A bounded simultaneous work phase limited to read-only research or disjoint exclusive file ownership, with a declared start, end, and handoff point.
- **Serial Integration Owner**: The single Orchestrator or Agent responsible for reconciling Handoff Records, resolving or escalating conflicts, sequencing shared-path writes, and producing the final Completion Record for a Repository Task.
- **Multi-Agent Availability State**: The recorded capacity state `available`, `limited`, or `unavailable`; `available` means at least two required Agents can be assigned, `limited` means at least one required Agent or role cannot be assigned, and `unavailable` means no second Agent can be assigned.
- **Orchestrator**: The repository-task coordinator responsible for selecting Workflow Mode, assigning Agents, publishing the Agent Roster and Ownership Matrix, enforcing the Route Record and Site Write Gate, and sequencing Serial Integration.
- **Multi-Agent Evidence**: The Roster, Ownership Matrix, Route Record, Handoff Records, status messages, conflict decisions, verification evidence, and Completion Record that demonstrate Standing Multi-Agent Mode for a Repository Task.
- **Repository Owner**: The person or governing owner who receives plain-language status, controls Owner Decisions and Protected Command authorization, and accepts the Completion Record.
- **Locked Path**: A repository path that agents and guide work may read as authority or evidence but may not change unless the Repository Owner explicitly names and authorizes the exact file in the current request; this specification treats `./docs/`, `./Agents/`, and root-level Markdown files matching `./*.md` as Locked Paths, while `./.kiro/` remains governed by the current spec and Site Write Gate.
- **Locked Path Gate**: The Route Record control performed before any proposed write that classifies the exact target as Locked, explicitly owner-authorized, or writable and stops an unapproved write to a Locked Path.
- **Owner-Authorized File**: The exact file within a Locked Path that the Repository Owner explicitly names and authorizes in the current request; general task wording does not authorize another file in the same path.
- **Read-Only Evidence Source**: A Locked Path or other repository source that agents may inspect as authority or evidence but may not use as an implementation or report destination.

## Special Requirements

### Special Requirement 1: Make skill routing mandatory and inspectable

**User Story:** As a repository owner, I want each Repository Task to show the routing decision before work begins, so that agents consistently use applicable skills instead of leaving skills undiscovered.

#### Acceptance Criteria

1. WHEN a Repository Task starts, THE Repository Guide and Master Router SHALL require a Route Record before repository modification.
2. THE Repository Guide and Master Router SHALL require every Route Record to include the Task Outcome, task domain, candidate paths, selected Package Skills, rejected Package Skills with rejection reasons, operational-risk classification, and Validation State.
3. WHEN Repository Task evidence matches more than one Package Skill, THE Repository Guide and Master Router SHALL route the Repository Task to every matching Package Skill in the Route Record.
4. WHEN Repository Task evidence matches no Package Skill, THE Repository Guide and Master Router SHALL record Local Evidence as the selected route and record the no-match reason.
5. WHEN a Completion Record is produced, THE Repository Guide and Master Router SHALL identify the selected Package Skills and rejected Package Skills from the Route Record.

### Special Requirement 2: Make delivery outcomes explicit

**User Story:** As a repository owner, I want agents to finish bounded work with evidence and a clear handoff, so that Repository Tasks produce results rather than unexecuted guidance.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL present every Outcome-Focused Task Card with Goal, Start Path, Scope, Required Actions, Prohibited Actions, Expected Evidence, and Next Decision.
2. WHEN a Repository Task ends, THE Repository Guide and Master Router SHALL require a Completion Record with the Task Outcome, changed scope, observed evidence, pending validation, and True Blockers.
3. IF a Repository Task cannot produce required observed evidence, THEN THE Repository Guide and Master Router SHALL label the affected validation as pending or blocked and SHALL name the next owner action.
4. WHEN a Repository Task changes no repository files, THE Repository Guide and Master Router SHALL require the Completion Record to state the inspected scope and the decision reached.

### Special Requirement 3: Contain full-gate failures without weakening quality controls

**User Story:** As a repository owner, I want an actionable failure path for the reported Full Gate failure, so that agents expose causes and preserve the release standard.

#### Acceptance Criteria

1. WHEN a Full Gate Failure is reported or observed, THE Repository Guide and Master Router SHALL route the Repository Task to Failure Triage before proposing a Full Gate configuration change.
2. THE Repository Guide and Master Router SHALL require Failure Triage to capture the exact command, repository-root working directory, authorization state, hook decision, exit status, first failed subcommand, relevant output summary, and cause classification.
3. WHEN Failure Triage lacks current authorized command output, THE Repository Guide and Master Router SHALL label the failure cause as unobserved and SHALL request the smallest authorized diagnostic from the user.
4. THE Repository Guide and Master Router SHALL preserve Full Gate composition, quality baselines, test selection, and Hook Permission enforcement until a separate approved Policy Implementation Proposal changes those assets.
5. WHEN Failure Triage establishes a True Blocker, THE Repository Guide and Master Router SHALL direct the True Blocker and reproducible evidence to root `Failures.md`.

## Requirements

### Requirement 1: Provide one outcome-focused repository entry point

**User Story:** As a repository contributor, I want one understandable entry point for repository work, so that Repository Tasks start from the correct context and outcome.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL identify `.kiro/skills/oando-master/SKILL.md` as the canonical entry point for Repository Task routing and completion expectations.
2. THE Repository Guide and Master Router SHALL identify `agents-work/oando-repository-guide/README.md` as the start page for Repository Guide navigation.
3. WHEN a contributor selects a Repository Task outcome, THE Repository Guide and Master Router SHALL direct the contributor to an Outcome-Focused Task Card in the Repository Domain Index.
4. THE Repository Guide and Master Router SHALL preserve Authority Ordering for every Repository Task decision.
5. WHEN the Markdown guide and a matching rendered guide page differ, THE Repository Guide and Master Router SHALL require the guide-maintenance task to determine the synchronization source before publishing a guide update.
6. THE Repository Guide and Master Router SHALL state every Outcome-Focused Task Card goal with an action verb, a named Product Surface or repository domain, and defined terminology for every specialized term.

### Requirement 2: Cover every required repository domain through task outcomes

**User Story:** As a repository contributor, I want the Repository Guide to cover every required repository area in outcome-focused language, so that unfamiliar work has a clear starting point.

#### Acceptance Criteria

1. THE Repository Domain Index SHALL contain an Initialization and Onboarding task outcome with the root working-directory rule, `pnpm` installation boundary, `START.md`, `AGENTS.md`, and initial authority sources.
2. THE Repository Domain Index SHALL contain a Site UI task outcome with marketing route, feature, component, FOCSS zone, SEO, and accessibility starting paths.
3. THE Repository Domain Index SHALL contain an Admin task outcome with internal route, feature, authentication, data-ownership, and operational-risk starting paths.
4. THE Repository Domain Index SHALL contain separate Planner and Studio task outcomes with route roots, forked source roots, persistence roots, canvas concerns, and fork-boundary guidance.
5. THE Repository Domain Index SHALL contain a CRM and Operations task outcome with Surface Status, data ownership, contact-query distinction, and Unwired Surface discovery guidance.
6. THE Repository Domain Index SHALL contain a UI Improvement task outcome with Visual Detail Checklist, FOCSS routing, icon guidance, and responsive-accessibility evidence expectations.
7. THE Repository Domain Index SHALL contain an Image or Animation Work task outcome with asset ownership, existing generation paths, motion guidance, licensing review, and visual-evidence expectations.
8. THE Repository Domain Index SHALL contain a Database task outcome with Products Database and Admin Database ownership, migration locations, RLS, rollback, and Mode-Aware Persistence guidance.
9. THE Repository Domain Index SHALL contain a Tests, Scripts, and Validation task outcome with root script authority, command classification, generated-output placement, and authorization boundaries.
10. THE Repository Domain Index SHALL contain a Repository Packages and Tech Stack task outcome with workspace boundaries, manifest sources, wired-versus-declared package status, and package-addition approval boundary.
11. THE Repository Domain Index SHALL contain a Repository Hygiene and Documentation task outcome with authority sources, Locked Documentation, generated artifacts, local-private artifacts, Agent Work Reports, and True Blocker placement.
12. THE Repository Domain Index SHALL contain an Operations and Infrastructure task outcome with Vercel, Cloudflare Worker, R2, Supabase, observability, backup, deployment, and read-only planning boundaries.
13. THE Repository Domain Index SHALL contain a Kiro, Skills, Powers, and MCP task outcome with Conditional Routing, Power availability, MCP Schema status, MCP Configuration status, and least-privilege guidance.
14. THE Repository Domain Index SHALL contain a Discovery and Extension task outcome for omitted or newly discovered repository areas.

### Requirement 3: Route UI improvements through visual details, assets, and motion guidance

**User Story:** As a product contributor, I want UI improvement guidance that includes small visual details and media work, so that visual changes remain consistent, accessible, and complete.

#### Acceptance Criteria

1. WHEN a Repository Task changes a product interface, THE Repository Guide and Master Router SHALL route the Repository Task from the user-facing route through the relevant feature, component, FOCSS zone, and existing component pattern.
2. WHEN a Repository Task changes a product interface, THE Repository Guide and Master Router SHALL require a Visual Detail Checklist before the Repository Task is reported complete.
3. THE Visual Detail Checklist SHALL require review of the existing Phosphor icon abstraction, icon alignment, adjacent-control alignment, spacing, responsive layout, loading state, empty state, error state, keyboard reachability, and reduced-motion behavior when applicable.
4. WHEN a Repository Task changes `site/focss/`, Tailwind configuration, design tokens, or surface styling, THE Repository Guide and Master Router SHALL route the Repository Task to the `focss-css` Package Skill.
5. WHEN Image or Animation Work requires a repository asset, THE Repository Guide and Master Router SHALL identify the existing asset location or `scripts/generate-svg/` workflow before proposing a new package or external capability.
6. WHEN Image or Animation Work changes product motion, THE Repository Guide and Master Router SHALL identify the existing motion pattern and SHALL require a motion-preference and interaction-state review.
7. WHEN Image or Animation Work requires an external capability, THE Repository Guide and Master Router SHALL require Installed-Power Registry confirmation before presenting an external Power as an option.

### Requirement 4: Classify wired, demo, and incomplete product surfaces explicitly

**User Story:** As a repository contributor, I want clear Surface Status labels for product areas, so that agents do not mistake demos, historical paths, or absent routes for complete workflows.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL present every documented Product Surface with a Surface Status, evidence source, current owner, next action, and evidence limitation.
2. THE Repository Guide and Master Router SHALL label the Admin CRM browser workspace as `demo/local-only` while current evidence shows Zustand persistence under the `oando-crm-storage` browser key.
3. THE Repository Guide and Master Router SHALL distinguish the Admin CRM browser workspace from Admin Database-backed customer-query operations.
4. WHEN a route, capability, or data flow lacks end-to-end evidence, THE Repository Guide and Master Router SHALL label the route, capability, or data flow as `present-but-unverified` or `unwired/absent` and SHALL identify the authoritative verification path.
5. THE Repository Guide and Master Router SHALL identify `/admin/product-studio` and the interactive legacy `/planner/*` app tree as `unwired/absent` until live repository evidence establishes current application routes.
6. THE Repository Guide and Master Router SHALL distinguish the existing marketing `/planner*` pages from the interactive Planner route `/ooplanner`.
7. WHEN a Surface Status changes through live evidence, THE Repository Guide and Master Router SHALL require an update to the Surface Status, evidence source, and next action before a capability is described as `wired`.

### Requirement 5: Provide dedicated Planner, Studio, and AI package guidance

**User Story:** As a repository contributor, I want dedicated package guidance for Planner and AI work, so that forked canvas behavior and server-side advisory behavior receive appropriate routing.

#### Acceptance Criteria

1. WHEN a Repository Task concerns Planner or Studio route, component, library, hook, store, server, platform, canvas, catalog, persistence, or handoff behavior, THE Repository Guide and Master Router SHALL route the Repository Task to the Planner Package Skill.
2. WHEN a Repository Task changes a Planner or Studio Fork Tree, THE Repository Guide and Master Router SHALL route the Repository Task to the `fork-boundaries` Package Skill and SHALL identify the no-cross-import constraint.
3. THE Planner Package Skill SHALL identify `/ooplanner` and `/oostudio` as separate Product Surfaces with separate source trees, state, persistence assumptions, canvas scales, and Dockview shells.
4. THE Repository Guide and Master Router SHALL define `.kiro/skills/ai-retrieval/SKILL.md` as the canonical future location for the AI Package Skill.
5. WHEN a Repository Task concerns `site/lib/ai/mastra/`, Amazon Bedrock, Mastra, LanceDB, Orama, Fuse.js, retrieval, embeddings, advisory output, or AI provider behavior, THE Repository Guide and Master Router SHALL route the Repository Task to the AI Package Skill after the AI Package Skill exists.
6. WHILE the AI Package Skill does not exist, THE Repository Guide and Master Router SHALL route AI and retrieval work through Local Evidence, `repo-map`, and any other matching existing Package Skills and SHALL record the missing AI Package Skill in the Route Record.
7. THE AI Package Skill SHALL describe AI output as advisory behavior requiring explicit user application and SHALL prohibit unsupported claims of deployed or evaluated AI behavior.

### Requirement 6: Keep technology, package, database, and script guidance accurate

**User Story:** As a repository contributor, I want current technical guidance with evidence sources, so that agents use the actual workspace boundaries, persistence model, and commands.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL identify root `package.json`, `pnpm-workspace.yaml`, `site/tsconfig.json`, `tech-docs-generator/package.json`, and live imports as authority sources for Repository Package and Tech Stack claims.
2. THE Repository Guide and Master Router SHALL identify the repository root and `tech-docs-generator/` as workspace package boundaries and SHALL identify the absence of `site/package.json`.
3. WHEN a guide claim names a package, framework version, command, route, database, or asset pipeline, THE Repository Guide and Master Router SHALL label the claim as `configured`, `observed`, `present-but-unverified`, `historical`, `deprecated`, `blocked`, or `pending-owner-validation` according to available evidence.
4. THE Repository Guide and Master Router SHALL identify Next.js App Router, TypeScript, React, Tailwind CSS v4 with FOCSS, Oxlint, Vitest, Playwright, Vercel, Cloudflare Worker, R2, OpenTelemetry, Prometheus, and Grafana as technology areas whose details must be confirmed from live manifests and source.
5. THE Repository Guide and Master Router SHALL identify the Products Database migration directory as `site/platform/supabase/migrations/` and the Admin Database migration directory as `site/platform/supabase/migrations.admin/`.
6. THE Repository Guide and Master Router SHALL identify `site/platform/drizzle/schema/` as schema support and SHALL identify Supabase migrations as the deployable database-change path.
7. THE Repository Guide and Master Router SHALL require Products Database or Admin Database ownership selection before database, furniture, descriptor, customer, plan, catalog, configurator, or theme work begins.
8. THE Repository Guide and Master Router SHALL identify Mode-Aware Persistence and the production read-only filesystem constraint for Planner, furniture, and descriptor writes.
9. THE Repository Guide and Master Router SHALL label `pnpm run typecheck:scripts` unavailable while `scripts/tsconfig.json` is absent and SHALL exclude the command from suggested validation.
10. WHEN a documentation claim conflicts with live repository evidence, THE Repository Guide and Master Router SHALL direct the Repository Task to the live source and SHALL label the documentation claim pending correction.

### Requirement 7: Enforce repository hygiene, documentation placement, and report placement

**User Story:** As a repository contributor, I want every artifact directed to the correct repository location, so that generated output, durable documentation, active work, and agent reports retain distinct purposes.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL identify `AGENTS.md`, `Agents/`, `docs/`, `DOC-MAP.md`, `CONTENTS.md`, `plans/README.md`, `Testing-handbook.md`, and `Failures.md` as repository guidance and placement authorities according to Authority Ordering.
2. THE Repository Guide and Master Router SHALL direct durable reference changes to `docs/`, execution procedures to the relevant root procedure document, and active coordination to plan folders indexed by `plans/README.md`.
3. THE Repository Guide and Master Router SHALL direct Generated Results only to `results/` and SHALL prohibit handwritten guide, plan, audit, or status documents under `results/`.
4. THE Repository Guide and Master Router SHALL direct new Agent Work Reports to `agents-work/` and SHALL identify `agent-reports/` as an existing reference or historical location rather than the destination for new guide-directed reports.
5. THE Repository Guide and Master Router SHALL identify `generated-documents/`, `site/.next/`, generated TypeScript artifacts, `node_modules/`, local environment files, and legacy paths as generated, local-private, or legacy before a Repository Task proposes a source edit.
6. WHEN a Repository Task touches Locked Documentation or a locked or retired path, THE Repository Guide and Master Router SHALL identify the retained constraint, the current owning source, the approval boundary, and the supported alternative path.
7. WHEN a Repository Task establishes a True Blocker, THE Repository Guide and Master Router SHALL direct the True Blocker to root `Failures.md` with reproduction evidence and SHALL avoid duplicate blocker ledgers.

### Requirement 8: Make repository skills discoverable and conditionally routed

**User Story:** As a repository contributor, I want the Master Router to expose the correct skill at the correct time, so that agents use repository knowledge before improvised exploration.

#### Acceptance Criteria

1. WHEN a Repository Task begins, THE Repository Guide and Master Router SHALL route the Repository Task to the Oando Master Skill before domain-specific exploration.
2. WHEN a Repository Task requires orientation, feature discovery, path discovery, repository mapping, or code-location discovery, THE Repository Guide and Master Router SHALL route the Repository Task to the `repo-map` Package Skill.
3. WHEN a Repository Task changes Shared Code or requires dependency, blast-radius, or circular-dependency analysis, THE Repository Guide and Master Router SHALL route the Repository Task to the `graph-impact` Package Skill.
4. WHEN a Repository Task changes styling, design tokens, Tailwind configuration, FOCSS, icons, alignment, or component visual contracts, THE Repository Guide and Master Router SHALL route the Repository Task to the `focss-css` Package Skill.
5. WHEN a Repository Task changes a Planner or Studio Fork Tree or evaluates cross-fork imports, THE Repository Guide and Master Router SHALL route the Repository Task to the `planner-studio` and `fork-boundaries` Package Skills.
6. WHEN a Repository Task requires schema selection, SQL, database migrations, RLS, grants, rollback, or Supabase ownership selection, THE Repository Guide and Master Router SHALL route the Repository Task to the `db-migrations` Package Skill.
7. WHEN a Repository Task concerns repository-local skills, steering, Powers, MCPs, or capability packaging, THE Repository Guide and Master Router SHALL route the Repository Task to the `powers-skills-model` Package Skill.
8. WHEN a Repository Task requests authorized validation planning, THE Repository Guide and Master Router SHALL route the Repository Task to the `verify-and-gate` Package Skill only after Explicit User Authorization and Hook Permission conditions are established.
9. THE Repository Guide and Master Router SHALL publish a task-classifier table with the task trigger, required Package Skills, first Local Evidence sources, command-authorization status, and completion-evidence expectation for every Repository Domain Index entry.

### Requirement 9: Provide a safe discovery and extensibility path for omitted topics, MCPs, and Powers

**User Story:** As a repository contributor, I want a predictable path for unfamiliar or omitted repository topics, so that the guide can expand without inventing capabilities or bypassing controls.

#### Acceptance Criteria

1. WHEN a Repository Task concerns an omitted or unfamiliar topic, THE Repository Guide and Master Router SHALL route the Repository Task through the Discovery and Extension task outcome before creating a new guidance category.
2. THE Discovery and Extension task outcome SHALL require a Local Evidence inventory, canonical owner identification, authority-source comparison, risk classification, and proposed Repository Domain Index update.
3. WHEN Local Evidence answers a Repository Task question, THE Repository Guide and Master Router SHALL use Local Evidence before considering a Power or MCP.
4. WHEN Local Evidence does not answer a Repository Task question, THE Repository Guide and Master Router SHALL require Installed-Power Registry confirmation before presenting a Power as an optional specialized capability.
5. THE Repository Guide and Master Router SHALL distinguish an MCP Schema under `.kiro/mcp/`, MCP Configuration under `.kiro/settings/mcp.json`, and a connected MCP server as separate states.
6. WHEN a proposed MCP or Power would access external data, source, credentials, or infrastructure, THE Repository Guide and Master Router SHALL require a read-only, least-privilege proposal with user approval and a fallback before configuration or invocation.
7. WHEN a recurring repository task lacks a matching Package Skill, THE Repository Guide and Master Router SHALL require a Package Skill proposal with a trigger, canonical location, authority sources, safety boundary, and completion expectation.

### Requirement 10: Separate normal static-check eligibility from protected gates and tests

**User Story:** As a repository contributor, I want agents to use narrow safe checks when policy permits while keeping Full Gates and tests under explicit owner control, so that validation is efficient without weakening enforcement.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL classify the Full Gate, Test Commands, coverage commands, browser-test runners, builds, deploys, database applies, backups, and local-service commands as protected commands requiring Explicit User Authorization and Hook Permission.
2. WHEN a Repository Task requires protected-command evidence, THE Repository Guide and Master Router SHALL identify the exact command as pending until Explicit User Authorization and Hook Permission are observed.
3. THE Repository Guide and Master Router SHALL prohibit Full Gate execution as a default Repository Task action.
4. WHERE an active policy and enabled hook identify `pnpm run typecheck` or a named Narrow Static Check as a Normal-Agent Eligible Check, THE Repository Guide and Master Router SHALL permit only the identified command within the Repository Task scope.
5. WHILE the active `block-agent-tests` hook matches `typecheck`, THE Repository Guide and Master Router SHALL label `pnpm run typecheck` as pending user validation and SHALL identify a Policy Implementation Proposal as required for normal-agent eligibility.
6. WHEN a Narrow Static Check is not named by an active policy and enabled hook as a Normal-Agent Eligible Check, THE Repository Guide and Master Router SHALL classify the Narrow Static Check as pending user validation.
7. IF a command lacks Explicit User Authorization, THEN THE Repository Guide and Master Router SHALL treat an inline owner-authorization marker as insufficient evidence of owner approval.
8. WHEN a Policy Implementation Proposal considers command-eligibility changes, THE Repository Guide and Master Router SHALL preserve protected-command enforcement for Full Gates and Test Commands and SHALL use a named, non-mutating command allowlist for any new Normal-Agent Eligible Check.
9. WHEN a Normal-Agent Eligible Check is observed, THE Repository Guide and Master Router SHALL report the exact command, repository-root working directory, scope, exit status, and validation limitation.

### Requirement 11: Keep documentation work separate from optional policy and implementation work

**User Story:** As a repository owner, I want the expanded guide and Master Router to state which work is documentation-only and which work requires separate approval, so that the revision remains safe and achievable.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL identify guide chapter updates, route-table updates, skill-discovery updates, Surface Status updates, and AI Package Skill authoring as repository-local guidance and documentation work.
2. THE Repository Guide and Master Router SHALL identify any modification to `.kiro/hooks/block-agent-tests.json`, `.kiro/hooks/block-agent-tests.mjs`, hook matchers, hook overrides, or command allowlists as optional Policy Implementation work requiring separate explicit approval.
3. THE Repository Guide and Master Router SHALL identify product runtime code, package installation, database migration, deployment, external MCP configuration, and Power activation as out of scope for the guidance revision unless a separately approved Repository Task authorizes the work.
4. WHEN guide maintenance proposes a static HTML page update, THE Repository Guide and Master Router SHALL require confirmation of the Markdown-to-HTML source relationship before modifying the static HTML page.
5. WHEN guide maintenance proposes a new Package Skill, THE Repository Guide and Master Router SHALL require the new Package Skill to state the triggering evidence, canonical path, Local Evidence sources, authority ordering, safety boundary, and completion expectation.
6. THE Repository Guide and Master Router SHALL retain the existing fast-task configuration at `.kiro/specs/oando-master/.config.kiro` while the configuration remains valid.

### Requirement 12: Preserve minimal, evidence-based task completion

**User Story:** As a repository contributor, I want Repository Tasks to use the smallest sound change and the narrowest permitted proof, so that task completion preserves unrelated work and reports evidence honestly.

#### Acceptance Criteria

1. WHEN a Repository Task modification is planned, THE Repository Guide and Master Router SHALL select the minimum scoped modification that achieves the Task Outcome without changing unrelated behavior.
2. WHEN a Repository Task modification requires validation, THE Repository Guide and Master Router SHALL select the least broad permitted evidence that directly evaluates the Task Outcome.
3. WHEN a Repository Task changes a Fork Tree and no authorized `pnpm run scan:boundaries` result is observed, THE Repository Guide and Master Router SHALL label Fork Tree boundary validation as pending user validation in the Completion Record.
4. WHEN a Repository Task changes a Fork Tree and an authorized `pnpm run scan:boundaries` result is observed, THE Repository Guide and Master Router SHALL include the observed command outcome in the Completion Record.
5. WHEN observed evidence cannot establish rendered interaction or hosted persistence behavior, THE Repository Guide and Master Router SHALL identify the unverified behavior in the Completion Record.

### Requirement 13: Preserve local-evidence-first Power selection

**User Story:** As a repository contributor, I want specialized capability selection to begin with repository evidence, so that agents do not claim or activate unconfirmed Powers.

#### Acceptance Criteria

1. WHEN Local Evidence answers a Repository Task question, THE Repository Guide and Master Router SHALL use Local Evidence before considering a Power.
2. WHERE the Installed-Power Registry confirms a Power that matches a Repository Task need, THE Repository Guide and Master Router SHALL present the Power as an optional specialized capability.
3. WHEN the Installed-Power Registry does not confirm a candidate Power, THE Repository Guide and Master Router SHALL continue routing through Local Evidence and matching Package Skills without representing the candidate Power as available.
4. WHEN a Repository Task requests Power activation, THE Repository Guide and Master Router SHALL require Installed-Power Registry confirmation before Power activation.

### Requirement 14: Provide a beginner-safe Begin Here flow

**User Story:** As a beginner contributor, I want to describe repository intent in ordinary language, so that the Repository Guide and Master Router select a safe path without requiring repository-specific vocabulary.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL provide a Begin Here Flow that accepts an ordinary-language Repository Task description as the only required starting input.
2. THE Repository Guide and Master Router SHALL make path names, package names, Package Skill names, Workflow Mode, and command names outputs of the Begin Here Flow rather than required inputs.
3. WHEN a contributor submits an ordinary-language Repository Task description, THE Repository Guide and Master Router SHALL determine and display the Task Outcome, first inspection locations, candidate paths, selected Package Skills, Workflow Mode, Command Classification, Operational-Risk Classification, and next action.
4. WHEN a Repository Task is submitted through the Begin Here Flow, THE Repository Guide and Master Router SHALL own discovery, candidate path selection, Package Skill selection, Workflow Mode selection, and Command Classification before requesting an Owner Decision.
5. WHEN a Repository Task requires a path, package, Package Skill, or command, THE Repository Guide and Master Router SHALL provide the candidate name and Local Evidence reason before requesting contributor approval or use.
6. IF an ordinary-language Repository Task description lacks information for safe routing, THEN THE Repository Guide and Master Router SHALL select a read-only discovery step and SHALL identify only the unavoidable Owner Decision.

### Requirement 15: Require a Plain-Language Response Contract for every task

**User Story:** As a repository owner, I want every task response to expose facts, decisions, risks, and proof in plain language, so that task progress and completion remain auditable.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL require a Plain-Language Response Contract for every Repository Task response.
2. WHEN a Repository Task starts or receives an update, THE Repository Guide and Master Router SHALL require the response to state the desired outcome, known facts, unverified facts, first inspection locations, selected Package Skills, rejected Package Skills with reasons, numbered next actions, likely files or areas, risk, checks allowed now, and Protected Commands pending authorization.
3. WHEN a Repository Task ends or pauses, THE Repository Guide and Master Router SHALL require the response to state exact completion evidence, pending validation, and only unavoidable Owner Decisions.
4. THE Repository Guide and Master Router SHALL require the Plain-Language Response Contract to explain specialized routing and validation terms before requesting an Owner Decision.
5. IF a Repository Task response omits a required Plain-Language Response Contract field, THEN THE Repository Guide and Master Router SHALL label the response incomplete and SHALL identify the missing field before Repository Task closure.

### Requirement 16: Provide a complete copy-paste Prompt Cookbook

**User Story:** As a contributor who does not know repository vocabulary, I want ready-to-use prompts for common and unknown work, so that every prompt starts with safe orientation and produces an inspectable response.

#### Acceptance Criteria

1. THE Repository Guide SHALL contain a Prompt Cookbook with one complete copy-paste prompt for each Prompt Cookbook Category: `Understand Repository`, `Find Where to Work`, `Small UI/Icon/Alignment Fix`, `Feature`, `Site UI`, `Planner`, `Studio`, `Admin`, `CRM/Unwired Assessment`, `Catalog/Configurator/Quotes/Inventory`, `Database`, `AI/Retrieval`, `Image/Animation/Assets`, `API/Security`, `Environment`, `Bug/Failing Test`, `Gate-Failure Triage`, `Refactor`, `Documentation`, `Package/Dependency`, `Deployment/Ops`, `Backup/Import/Export`, `Unknown Task`, `Finish Current Task`, and `Emergency Prompt for an Overwhelmed Owner`.
2. THE Repository Guide SHALL present every Prompt Cookbook prompt as a category-specific copy-paste block with a desired outcome placeholder, first local-evidence instruction, scope boundary, and expected evidence request.
3. WHEN a contributor uses a Prompt Cookbook prompt, THE Prompt Cookbook SHALL instruct the Agent to orient from Local Evidence first, invoke the Oando Master Skill and `repo-map` Package Skill, and invoke every other matching Package Skill before selecting a work path.
4. WHEN a Prompt Cookbook prompt could lead to command execution, THE Prompt Cookbook SHALL instruct the Agent to classify each command, prohibit uncontrolled Protected Command execution, and SHALL require exact current-session Explicit User Authorization and Hook Permission before a Protected Command.
5. THE Repository Guide SHALL require every Prompt Cookbook prompt to request a Plain-Language Response Contract in the Agent response.

### Requirement 17: Provide a beginner-readable Use Multiple Agents procedure

**User Story:** As a repository owner coordinating several agents, I want bounded roles and explicit handoffs, so that parallel research is safe and implementation remains conflict-free.

#### Acceptance Criteria

1. THE Repository Guide SHALL provide a beginner-readable `Use Multiple Agents` Multi-Agent Operating Procedure with a numbered sequence for role assignment, research, planning, implementation, verification, handoff, and serial integration.
2. THE Multi-Agent Operating Procedure SHALL define the Scout/Map role as read-only orientation and path discovery, the Planner/Risk Analyst role as scope, skill, risk, and command-classification planning, the Implementer role as approved changes within owned paths, and the Verifier/Reporter role as evidence review and Plain-Language Response Contract reporting.
3. WHEN a Repository Task uses multiple Agents, THE Repository Guide and Master Router SHALL limit the active Agent count to four.
4. WHERE a Repository Task permits parallel work, THE Repository Guide and Master Router SHALL permit parallel Agents only for read-only research or disjoint file ownership.
5. WHEN an Agent writes repository files, THE Repository Guide and Master Router SHALL require exclusive file ownership to be declared before the write and SHALL require Serial Integration for shared or subsequently overlapping work.
6. WHEN all parallel research or disjoint file work is handed off, THE Repository Guide and Master Router SHALL require one owner to perform Serial Integration before additional shared-path writes.
7. IF Agent file-ownership sets overlap, Agent edits conflict, or Agent evidence contradicts, THEN THE Repository Guide and Master Router SHALL invoke the Conflict Stop Rule before further writes and SHALL route the conflict to owner review.
8. WHEN an Agent hands work to another Agent or owner, THE Repository Guide and Master Router SHALL require a Handoff Record containing objective, evidence, files read or changed, decisions, validation status, blockers, and next owner.
9. THE Repository Guide SHALL include copy-paste delegation and review prompts that state the Agent role, objective, owned paths, evidence required, stop conditions, Handoff Record fields, and validation-authorization boundary.

### Requirement 18: Enforce artifact placement and owner-controlled checks

**User Story:** As a repository owner, I want evidence and commands governed by explicit placement and authorization rules, so that generated output and protected quality controls remain trustworthy.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL direct Machine Evidence exclusively to `results/` and SHALL identify any other destination for Machine Evidence as invalid.
2. THE Repository Guide and Master Router SHALL direct human-authored Agent Work Reports exclusively to `agents-work/`.
3. WHEN a True Blocker is evidenced, THE Repository Guide and Master Router SHALL record the blocker and reproduction evidence only in root `Failures.md`.
4. THE Repository Guide and Master Router SHALL classify Full Gates, Test Commands, coverage commands, browser-test runners, builds, deployments, database actions, backups, and Local-Service Commands as Protected Commands requiring exact current-session Explicit User Authorization and Hook Permission before execution.
5. WHERE a type check, lint check, or static check is proposed, THE Repository Guide and Master Router SHALL permit execution only when the live hook or active policy explicitly names the exact command as a Normal-Agent Eligible Check.
6. IF a command has only an Inline Authorization Marker, THEN THE Repository Guide and Master Router SHALL classify the command as pending Explicit User Authorization and Hook Permission.
7. WHEN a Full Gate Failure is reported or observed, THE Repository Guide and Master Router SHALL use read-only evidence-based Failure Triage and SHALL preserve gate composition, quality baselines, test selection, and Hook Permission enforcement.
8. IF Failure Triage lacks current authorized command output, THEN THE Repository Guide and Master Router SHALL label the failure cause unverified and SHALL request the smallest authorized diagnostic without changing a protected control.

### Requirement 19: Admit coverage gaps and separate approval-required implementation

**User Story:** As a repository owner, I want missing or unverified areas recorded with an evidence path, so that documentation does not overstate implementation and future changes remain owner-controlled.

#### Acceptance Criteria

1. WHEN current evidence cannot establish End-to-End Evidence for a repository area, capability, route, package, or workflow, THE Repository Guide and Master Router SHALL require a Coverage-Gap Admission Card before reporting the area as implemented.
2. THE Coverage-Gap Admission Card SHALL contain the named area or capability, explicit status, evidence sources checked, evidence limitation, next evidence source, owner action, and scope boundary.
3. WHEN a Repository Task reports a missing or unverified area, THE Repository Guide and Master Router SHALL include the Coverage-Gap Admission Card in the Plain-Language Response Contract and Completion Record.
4. IF current evidence does not establish End-to-End Evidence, THEN THE Repository Guide and Master Router SHALL label the area `present-but-unverified` or `unwired/absent` and SHALL not describe the area as `wired` or complete.
5. THE Repository Guide and Master Router SHALL require every Coverage-Gap Admission Card to name a next evidence source and an owner action that can resolve or narrow the gap.
6. THE Repository Guide and Master Router SHALL distinguish documentation work and Package Skill routing work from future hook, policy, product-runtime, package, database, deployment, and MCP implementation work requiring separate approval.
7. WHEN a guide or Package Skill task identifies future implementation work, THE Repository Guide and Master Router SHALL mark the implementation as a separate approval-required Repository Task and SHALL not treat documentation or routing work as implementation approval.

### Requirement 20: Make the Repository Domain Index coverage-audited and executable

**User Story:** As a beginner contributor, I want every meaningful repository area to have a verified starting point and a bounded task card, so that I can discover the correct path without guessing.

The following matrix is the minimum verified-path coverage baseline for the Repository Domain Index. Guide maintenance verifies each path against current repository evidence; a listed path is a starting location and is not proof of a wired or complete capability.

| Required Domain Index card | Verified Start Paths |
|---|---|
| Repository map and authority | `START.md`; `AGENTS.md`; `docs/architecture/layout.md`; `docs/architecture/stack.md`; `docs/architecture/routes.md`; `docs/architecture/product-map.md`; `agents-work/oando-repository-guide/README.md`; `agents-work/oando-repository-guide/markdown/01-repository-map.md`; `plans/README.md` |
| Initialization, local development, and debugging | `START.md`; `AGENTS.md`; `package.json`; `site/`; `config/build/`; `Failures.md`; `agents-work/oando-repository-guide/09-local-generated-environment.md` |
| Auth, security, and secrets | `site/proxy.ts`; `site/lib/security/`; `site/platform/supabase/`; `.env.example`; `.env.local`; `site/.env.local`; `docs/architecture/stack.md` |
| Environment | `.env.example`; `.env.local`; `site/.env.local`; `package.json`; `pnpm-workspace.yaml`; `START.md`; `agents-work/oando-repository-guide/09-local-generated-environment.md` |
| APIs | `site/app/api/`; `site/lib/apiCatalog.ts`; `site/proxy.ts`; `docs/architecture/routes.md`; `agents-work/oando-repository-guide/04-data-api-persistence.md` |
| Site UI, SEO, i18n, accessibility, and performance | `site/app/(site)/`; `site/features/site/`; `site/components/home/`; `site/focss/site/`; `site/i18n/`; `docs/architecture/routes.md`; `docs/architecture/product-map.md`; `docs/architecture/stack.md` |
| UI polish, icons, alignment, FOCSS, motion, and assets | `site/components/`; `site/focss/`; `site/public/`; `scripts/generate-svg/`; `docs/architecture/css.md`; `docs/architecture/stack.md`; `agents-work/oando-repository-guide/03-product-domains.md` |
| Admin | `site/app/admin/`; `site/features/admin/`; `site/components/`; `site/lib/admin/`; `docs/architecture/routes.md`; `docs/architecture/product-map.md` |
| CRM demo versus customer-query operations | `site/app/admin/crm/`; `site/features/crm/`; `site/app/admin/customer-queries/`; `site/app/api/customer-queries/`; `site/features/ops/`; `docs/architecture/product-map.md`; `docs/architecture/routes.md` |
| Catalog, configurator, quotes, and inventory | `site/lib/catalog/`; `site/features/shared/catalog/`; `site/app/(site)/products/`; `site/app/(site)/quote-cart/`; `site/app/admin/catalog/`; `site/app/admin/inventory/`; `site/app/api/configurator/`; `site/platform/supabase/migrations/` |
| Planner | `site/app/ooplanner/`; `site/features/Planner/`; `site/components/Planner/`; `site/lib/Planner/`; `site/hooks/Planner/`; `site/store/Planner/`; `site/server/Planner/`; `site/platform/Planner/`; `site/app/api/Planner/`; `agents-work/oando-repository-guide/03-product-domains.md` |
| Studio | `site/app/oostudio/`; `site/features/Studio/`; `site/components/Studio/`; `site/lib/Studio/`; `site/hooks/Studio/`; `site/store/Studio/`; `site/server/Studio/`; `site/platform/Studio/`; `site/app/api/Studio/`; `agents-work/oando-repository-guide/03-product-domains.md` |
| AI and retrieval | `site/lib/ai/mastra/`; `site/app/api/ai-advisor/`; `site/app/api/Studio/ai/`; `site/features/Studio/`; `docs/architecture/stack.md`; `agents-work/oando-repository-guide/03-product-domains.md` |
| Databases, RLS, grants, rollback, and mode-aware persistence | `site/platform/supabase/migrations/`; `site/platform/supabase/migrations.admin/`; `site/platform/drizzle/schema/`; `site/lib/Planner/plannerPersistenceMode.ts`; `site/lib/catalog/furnitureCatalogMode.ts`; `site/platform/Planner/data/`; `site/platform/shared/data/furniture/`; `site/inventory/descriptors/`; `docs/database/schema.md`; `docs/database/ops.md`; `docs/database/drizzle.md` |
| Tests, fixtures, mocks, two Vitest lanes, and Playwright | `tests/`; `tests/unit/`; `tests/integration/`; `tests/e2e/`; `tests/fixtures/`; `tests/helpers/`; `tests/tech-docs-generator/`; `config/build/`; `Testing-handbook.md`; `package.json` |
| Scripts and command registry | `package.json`; `scripts/`; `scripts/run-ops.mjs`; `scripts/ops-command-registry.mjs`; `config/build/`; `docs/architecture/scripts.md`; `agents-work/oando-repository-guide/05-tooling-ci-tech-docs.md` |
| Packages, dependencies, and workspace boundaries | `package.json`; `pnpm-workspace.yaml`; `pnpm-lock.yaml`; `site/`; `site/tsconfig.json`; `tech-docs-generator/`; `tech-docs-generator/package.json`; `config/build/`; `docs/architecture/stack.md` |
| Documentation, architecture, locked documentation, and legacy documentation | `docs/architecture/`; `docs/database/`; `docs/governance/`; `docs/governance/charter.md`; `docs/governance/focss-stop-drift.md`; `AGENTS.md`; `DOC-MAP.md`; `CONTENTS.md`; `site/data/storage/`; `agents-work/oando-repository-guide/07-docs-governance-planning.md` |
| Results, generated documents, agent work, and blocker placement | `results/`; `generated-documents/`; `agents-work/`; `plans/`; `plans/README.md`; `Failures.md`; `agent-reports/`; `agents-work/oando-repository-guide/09-local-generated-environment.md` |
| MCP, skills, powers, and agents | `.kiro/`; `.kiro/skills/`; `.kiro/agents/`; `.kiro/mcp/`; `.kiro/settings/mcp.json`; `.kiro/hooks/`; `skills-lock.json`; `agents-work/oando-repository-guide/08-kiro-workspace.md` |
| Vercel, Worker, R2, backups, observability, and incidents | `vercel.json`; `workers/oando-worker-proxy/`; `config/observability/`; `.github/workflows/supabase-backup-r2.yml`; `OPERATIONS_RUNBOOK.md`; `scripts/`; `Failures.md`; `site/instrumentation.ts`; `agents-work/oando-repository-guide/06-operations-infrastructure.md` |
| Unknown-area discovery | `START.md`; `AGENTS.md`; `docs/architecture/layout.md`; `agents-work/oando-repository-guide/markdown/01-repository-map.md`; `agents-work/oando-repository-guide/README.md`; `plans/README.md`; `.kiro/skills/repo-map/SKILL.md`; `Failures.md` |

#### Acceptance Criteria

1. THE Repository Domain Index SHALL contain one Coverage-Audited Task Card for every row in the verified-path coverage baseline.
2. THE Repository Guide and Master Router SHALL identify the current guide at `agents-work/oando-repository-guide/README.md` as an eleven-chapter guide and SHALL map every Coverage-Audited Task Card to at least one numbered chapter.
3. THE Repository Guide and Master Router SHALL require every Coverage-Audited Task Card to contain Goal, Start Paths, Scope, Evidence Steps, Allowed Actions, Forbidden Actions, Risk, Expected Evidence, and Next Decision.
4. THE Repository Guide and Master Router SHALL require every Start Path in a Coverage-Audited Task Card to be an exact repository path or an explicitly labeled path-discovery instruction.
5. WHEN a contributor selects a Coverage-Audited Task Card, THE Repository Guide and Master Router SHALL present Evidence Steps in the order of authority reading, listed-path inspection, live-evidence comparison, status-and-risk classification, and evidence-and-decision recording.
6. WHEN a Coverage-Audited Task Card covers a path that is absent, stale, generated, local-private, legacy, or unverified, THE Repository Guide and Master Router SHALL require a Coverage-Gap Admission Card before the card reports a wired or complete capability.
7. THE Repository Guide and Master Router SHALL publish a Coverage Audit that records coverage status, verified source paths, evidence limitations, and the next decision for every required Domain Index card.
8. WHEN the guide or live repository evidence adds a domain outside the baseline, THE Repository Guide and Master Router SHALL route the domain to the Unknown-Area Discovery card before adding a new authoritative card.

### Requirement 21: Make Begin Here routing and the response contract unavoidable

**User Story:** As a non-expert owner, I want to describe an outcome in ordinary language and receive a complete routing response, so that I do not need to know repository paths, packages, skills, or commands before starting.

#### Acceptance Criteria

1. THE Begin Here Flow SHALL accept an ordinary-language description of the desired outcome as the only required contributor input.
2. THE Begin Here Flow SHALL discover candidate paths, choose an initial Workflow Mode, select every matching Package Skill, reject non-matching Package Skills with reasons, and classify proposed commands before asking for an Owner Decision.
3. WHEN the Begin Here Flow receives an ordinary-language description, THE Repository Guide and Master Router SHALL display the Task Outcome, Workflow Mode, exact first evidence locations, candidate files or areas, selected Package Skills, rejected Package Skills with reasons, Command Classification, Operational-Risk Classification, and numbered next action.
4. THE Begin Here Flow SHALL treat path names, package names, Package Skill names, and command names as routing outputs rather than required contributor vocabulary.
5. IF the ordinary-language description lacks information for safe modification, THEN THE Begin Here Flow SHALL choose a read-only discovery action and SHALL identify only the unavoidable Owner Decision.
6. THE Repository Guide and Master Router SHALL require every task-start, progress, handoff, pause, and completion response to use the Plain-Language Response Contract.
7. THE Plain-Language Response Contract SHALL present the following fields in this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; and Unavoidable Owner Decisions.
8. WHEN a response names an Exact First Evidence Location, THE Repository Guide and Master Router SHALL require an exact repository path and a reason for reading the path before broader exploration.
9. WHEN a Repository Task has no observed completion proof, THE Repository Guide and Master Router SHALL require the response to state the missing proof, the validation state, and the next owner action.
10. IF a task response omits a Plain-Language Response Contract field, THEN THE Repository Guide and Master Router SHALL label the response incomplete and SHALL identify the omitted field before task closure.

### Requirement 22: Provide a complete copy-paste Prompt Cookbook

**User Story:** As a non-expert owner, I want category-specific prompts that invoke safe repository routing automatically, so that I can start work without writing a technically complete request.

The Prompt Cookbook contains complete blocks rather than generic examples. The required categories are `Understand Repository`, `Find Where to Work`, `Small UI/Icon/Alignment Fix`, `Feature`, `Site UI`, `Planner`, `Studio`, `Admin`, `CRM/Unwired Assessment`, `Catalog/Configurator/Quotes/Inventory`, `Database`, `AI/Retrieval`, `Image/Animation/Assets`, `API/Security`, `Environment`, `Bug/Failing Test`, `Gate-Failure Triage`, `Refactor`, `Documentation`, `Package/Dependency`, `Deployment/Ops`, `Backup/Import/Export`, `Unknown Task`, `Finish Current Task`, and `Emergency Prompt for an Overwhelmed Owner`.

#### Acceptance Criteria

1. THE Repository Guide SHALL provide one complete copy-paste prompt block for every required Prompt Cookbook category.
2. THE Repository Guide SHALL require every Prompt Cookbook block to contain a desired-outcome placeholder, an ordinary-language context placeholder, a scope boundary, an expected-evidence request, and a stop condition.
3. THE Prompt Cookbook SHALL include the following Prompt Safety Preamble in every prompt block: start with `oando-master`, then `repo-map`; use Local Evidence before assumptions; do not guess paths, package names, Package Skills, or commands; classify every command before suggesting or running it; do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission; and return the Plain-Language Response Contract.
4. WHEN a Prompt Cookbook block names a domain, THE block SHALL identify the relevant verified start paths and SHALL instruct the Agent to select all matching Package Skills rather than one assumed skill.
5. WHEN a Prompt Cookbook block could lead to a command, THE block SHALL require the Agent to label the command as read-only inspection, Normal-Agent Eligible Check, Protected Command, or no-run pending authorization before any execution.
6. WHEN a contributor copies the Emergency Prompt for an Overwhelmed Owner, THE one-sentence prompt SHALL still require `oando-master`, `repo-map`, Local Evidence first, no uncontrolled Protected Command, and the Plain-Language Response Contract.
7. THE Repository Guide SHALL require every Prompt Cookbook response to include exact completion proof or an explicit unverified and pending state.

### Requirement 23: Provide a safe beginner-readable Use Multiple Agents procedure

**User Story:** As a non-expert owner coordinating agents, I want each agent to have one clear role and exclusive boundaries, so that parallel research is safe and implementation conflicts stop before damage.

#### Acceptance Criteria

1. THE Multi-Agent Operating Procedure SHALL define exactly four available roles: Scout/Map, Planner/Risk, Implementer, and Verifier/Reporter.
2. THE Scout/Map role SHALL be read-only and SHALL own repository orientation, authority mapping, candidate paths, and evidence discovery.
3. THE Planner/Risk role SHALL be read-only and SHALL own scope decomposition, Package Skill selection, risk classification, command classification, ownership proposals, and validation planning.
4. THE Implementer role SHALL write only within explicitly approved exclusive paths and SHALL stop before writing a path without recorded ownership.
5. THE Verifier/Reporter role SHALL be read-only and SHALL own evidence reconciliation, coverage-gap review, completion proof review, and Plain-Language Response Contract reporting.
6. THE Repository Guide and Master Router SHALL limit a multi-agent Repository Task to a maximum of four active Agents.
7. WHERE Agents work in parallel, THE Repository Guide and Master Router SHALL permit parallel work only for read-only research or disjoint file ownership.
8. THE Repository Guide and Master Router SHALL prohibit overlapping writes to shared code, configuration, manifests, package-lock or workspace files, migrations, hooks, generated evidence, and result paths.
9. THE Repository Guide and Master Router SHALL require ownership declarations for every Implementer path before a write begins.
10. WHEN parallel research or disjoint implementation finishes, THE Repository Guide and Master Router SHALL require Serial Integration by one owner before any shared-path or subsequently overlapping write.
11. THE Handoff Record SHALL contain Objective; Role and Next Owner; Scope; Paths Read and Paths Changed; Route Record; Evidence; Decisions; Coverage Gaps; Validation Command; Repository Root; Authorization State; Hook Decision; Exit Status; Validation Limitation; Blockers; and Next Action.
12. WHEN an Agent hands work to another Agent or owner, THE Repository Guide and Master Router SHALL require every Handoff Record field to be present or explicitly marked not observed.
13. IF Agent ownership sets overlap, Agent edits conflict, or Agent evidence contradicts, THEN THE Repository Guide and Master Router SHALL invoke the Conflict Stop Rule, prohibit further affected writes, and route the conflict to owner review.
14. THE Repository Guide SHALL provide copy-paste delegation and review prompts that state the role, objective, exclusive paths, read-only or write permission, evidence required, stop conditions, Handoff Record fields, and validation-authorization boundary.

### Requirement 24: Enforce artifact placement and prevent handwritten result reports

**User Story:** As a repository owner, I want every output in the correct repository home, so that generated evidence, human guidance, active plans, and blockers remain distinguishable.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL direct Machine Evidence generated by commands, tests, gates, builds, browser runs, coverage, deployments, database actions, backups, or local services exclusively to `results/`.
2. THE Repository Guide and Master Router SHALL direct human-authored guide, research, and Agent Work Reports exclusively to `agents-work/`.
3. THE Repository Guide and Master Router SHALL direct generated inventories and regenerated tech-docs data, documents, and static sites exclusively to `generated-documents/`.
4. THE Repository Guide and Master Router SHALL direct active plan material exclusively to the applicable `plans/<name>/` directory indexed by `plans/README.md`.
5. WHEN a true blocker is evidenced, THE Repository Guide and Master Router SHALL direct the blocker and reproducible evidence exclusively to root `Failures.md`.
6. IF a contributor proposes a handwritten report, audit, plan, or status document under `results/`, THEN THE Repository Guide and Master Router SHALL reject the placement and SHALL identify `agents-work/` or the applicable `plans/<name>/` directory as the correct human-authored destination.
7. THE Repository Guide and Master Router SHALL identify `generated-documents/`, `site/.next/`, generated TypeScript artifacts, `node_modules/`, and local environment files as generated or local-private before an Agent treats any item as editable source.
8. WHEN an artifact has multiple possible homes, THE Repository Guide and Master Router SHALL apply Authority Ordering and SHALL record the selected placement and rejected placements in the Route Record.

### Requirement 25: Keep validation under exact owner control

**User Story:** As a repository owner, I want quality controls to remain protected while agents use only explicitly permitted narrow checks, so that validation evidence cannot be manufactured by bypassing policy.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL classify Full Gate, tests, coverage, browser tests, builds, deploys, database applies or other database actions, backups, and local services as Protected Commands.
2. THE Repository Guide and Master Router SHALL require exact current-session Explicit User Authorization and Hook Permission before a Protected Command executes.
3. WHEN a Protected Command is proposed without both authorization conditions, THE Repository Guide and Master Router SHALL label the command pending user validation and SHALL not execute it.
4. WHERE a live policy and enabled hook explicitly name an exact type, lint, or static check as a Normal-Agent Eligible Check, THE Repository Guide and Master Router SHALL permit only that named check within its declared scope.
5. IF a live policy or enabled hook does not explicitly name an exact type, lint, or static check as eligible, THEN THE Repository Guide and Master Router SHALL classify the check as pending user validation and SHALL not infer eligibility from repository convention.
6. IF a command has only an inline environment marker, prompt token, comment, or other Inline Authorization Marker, THEN THE Repository Guide and Master Router SHALL treat the command as lacking Explicit User Authorization.
7. WHEN a Full Gate Failure is reported or observed, THE Repository Guide and Master Router SHALL require read-only evidence-based Failure Triage before any control-change proposal.
8. THE Failure Triage process SHALL preserve Full Gate composition, test selection, coverage requirements, quality baselines, and Hook Permission enforcement while the cause remains unverified.
9. WHEN Failure Triage lacks current authorized output, THE Repository Guide and Master Router SHALL label the failure cause unverified and SHALL request the smallest authorized diagnostic rather than weaken a control.
10. WHEN a validation command is observed, THE Repository Guide and Master Router SHALL record the exact command, repository-root working directory, scope, authorization state, hook decision, exit status, output limitation, and behavior not verified.

### Requirement 26: Admit missing and unverified areas without overstating completion

**User Story:** As a repository owner, I want missing evidence to become an explicit next step, so that documentation never calls a demo, absent path, or unverified flow wired or complete.

#### Acceptance Criteria

1. WHEN current evidence cannot establish End-to-End Evidence for an area, capability, route, package, or workflow, THE Repository Guide and Master Router SHALL require a Coverage-Gap Admission Card.
2. THE Coverage-Gap Admission Card SHALL contain Status; Evidence Source; Evidence Limitation; Next Evidence Source; Owner Action; Scope Boundary; and Next Decision.
3. THE Coverage-Gap Admission Card SHALL use a status from `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy` and SHALL cite the evidence supporting the status.
4. IF current evidence does not establish End-to-End Evidence, THEN THE Repository Guide and Master Router SHALL label the area `present-but-unverified` or `unwired/absent` and SHALL not describe the area as wired or complete.
5. WHEN a Coverage-Gap Admission Card is created, THE Repository Guide and Master Router SHALL include the card in the Plain-Language Response Contract and the Completion Record.
6. THE Repository Guide and Master Router SHALL require every Coverage-Gap Admission Card to name a next evidence source and an Owner Action that can resolve or narrow the gap.
7. WHEN a Surface Status changes through live evidence, THE Repository Guide and Master Router SHALL update the status, evidence source, limitation, next action, and Route Record before describing the capability as wired.

### Requirement 27: Separate the current guidance deliverable from approval-required implementation

**User Story:** As a repository owner, I want this revision to deliver documentation and skill routing without silently approving implementation work, so that future changes remain explicit and controlled.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL identify the Current Guidance Deliverable as guide chapters, Domain Index cards, task cards, Prompt Cookbook prompts, response-contract rules, handoff rules, coverage-gap rules, and conditional skill-routing guidance.
2. THE Repository Guide and Master Router SHALL identify modifications to hooks, policy, command allowlists, product runtime, packages or dependencies, databases or migrations, deployments, backups, external MCP configuration, and Power activation as Separate Approval Work.
3. WHEN a Separate Approval Work item is discovered during guidance or routing work, THE Repository Guide and Master Router SHALL record the item as a separate approval-required Repository Task and SHALL not perform the item as part of the Current Guidance Deliverable.
4. THE Repository Guide and Master Router SHALL require the Downstream Tasks Artifact to replace any stale old plan that is incorrectly marked complete with open, evidence-bound tasks for every unresolved approved requirement.
5. WHILE a task lacks exact completion proof or authorized validation evidence, THE Downstream Tasks Artifact SHALL keep the task open, pending, or blocked and SHALL name the next owner action.
6. THE Repository Guide and Master Router SHALL require active plan material for Separate Approval Work to reside under the applicable `plans/<name>/` directory and SHALL not treat a `results/` file as plan state.
7. WHEN the Current Guidance Deliverable is reported complete, THE Completion Record SHALL state that Separate Approval Work remains unimplemented unless separate observed evidence proves otherwise.


### Requirement 28: Enforce report placement and the strict site boundary

**User Story:** As a repository owner and beginner contributor, I want every authored, generated, and product-source output to have one obvious repository home, so that reports remain discoverable, machine evidence remains reproducible, and `site/` remains a strict product-source boundary.

The following beginner-friendly reference is normative for output placement:

#### Beginner output-placement reference

| If the output is... | Put it here | Do not put it here |
|---|---|---|
| Written by an agent as a report or work product | `agents-work/<workstream>/<report-type>/`, or an existing approved workstream folder such as `agents-work/oando-repository-guide/` or `agents-work/repository-graph/` | The `agents-work/` root, `results/`, or `site/` |
| Produced by a script or command | `results/<purpose>/`, including existing `results/tests/`, `results/site/`, `results/site-ui/`, `results/ops/`, or a documented purpose folder | The `results/` root, `agents-work/`, or `site/`; generated output is not hand-edited |
| Produced by the tech-docs generator | `generated-documents/` | `results/`, `agents-work/`, or `site/` as a report destination |
| Active plan material | The applicable `plans/<name>/` folder indexed by `plans/README.md` | `results/`, `site/`, or an unowned root-level location |
| A true blocker | Root `Failures.md`; supporting authored analysis uses the appropriate `agents-work/<workstream>/<report-type>/` location | A second blocker ledger in `results/`, `agents-work/`, or `site/` |
| Product source | The approved product source tree; a write under `site/` is allowed only as a Core Product Write | `site/` for a report, skill, result, or other Non-Core Artifact |
| A repository skill | `.kiro/skills/` | `site/`, `results/`, or `agents-work/` |

#### Required copy-paste wording

> If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.

#### Acceptance Criteria

1. WHEN a Repository Task produces an agent-authored report or work product, THE Repository Guide and Master Router SHALL direct the artifact to a Workstream Subfolder under `agents-work/`, including `agents-work/<workstream>/<report-type>/` or an existing approved workstream folder such as `agents-work/oando-repository-guide/` or `agents-work/repository-graph/`.
2. IF an agent-authored report or work product targets the `agents-work/` root, THEN THE Repository Guide and Master Router SHALL stop the write and SHALL require selection of a Workstream Subfolder before the artifact is written.
3. WHEN an existing script or command produces Machine Evidence, THE Repository Guide and Master Router SHALL direct the output to a Purpose Subfolder under `results/`, including `results/tests/`, `results/site/`, `results/site-ui/`, `results/ops/`, or a documented additional purpose folder within approved scope.
4. IF Machine Evidence targets the `results/` root, THEN THE Repository Guide and Master Router SHALL stop publication and SHALL require the owning source or script to write the output to a Purpose Subfolder.
5. IF Machine Evidence is hand-edited after generation, THEN THE Repository Guide and Master Router SHALL classify the edited artifact as untrusted evidence and SHALL require regeneration by the owning source or script in the correct Purpose Subfolder.
6. WHEN a Repository Task reviews an existing root-level result artifact, THE Repository Guide and Master Router SHALL inventory the artifact's observed path and SHALL either assign the artifact to a Purpose Subfolder or explicitly mark the artifact as `legacy/owner-review pending`.
7. IF observed evidence does not establish relocation or purpose assignment for a root-level result artifact, THEN THE Repository Guide and Master Router SHALL label the artifact `legacy/owner-review pending` and SHALL not claim that the artifact has been reorganized.
8. WHEN an Output-Producing Task begins, THE Route Record SHALL declare the Artifact Class, the applicable Workstream Subfolder or Purpose Subfolder, the filename pattern, the owning source or script, and whether the output is authored or generated.
9. WHEN an Output-Producing Task ends, THE Completion Record SHALL repeat the Artifact Class, selected Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, and observed placement evidence.
10. WHEN a tech-docs generator produces output, THE Repository Guide and Master Router SHALL direct the output to `generated-documents/` and SHALL classify the output separately from Agent Work Reports and Machine Evidence.
11. WHEN a True Blocker is evidenced, THE Repository Guide and Master Router SHALL keep the canonical blocker record in root `Failures.md` and SHALL direct supporting authored analysis to the appropriate Workstream Subfolder.
12. WHEN any Repository Task proposes a write under `site/`, THE Site Write Gate SHALL require the Route Record to classify the target as a Core Product Write or a Non-Core Artifact before the write begins.
13. THE Repository Guide and Master Router SHALL reserve `site/` for explicitly approved Core Product Writes covering core product code, product UI or FOCSS, product assets, route, API, server, persistence, or another clearly scoped product implementation.
14. IF a target under `site/` is classified as a Non-Core Artifact, THEN THE Site Write Gate SHALL stop the write and SHALL redirect the artifact to its correct repository home before work continues.
15. WHEN a Repository Task changes `site/`, THE Route Record SHALL state the exact core product outcome, owned paths, applicable Package Skills, and expected evidence before the first write.
16. IF a task changing `site/` proposes a report, result, audit, handoff, prompt, plan, Agent Work Report, skill, steering file, MCP definition, generated output, temporary file, debug file, or other Non-Core Artifact under `site/`, THEN THE Site Write Gate SHALL stop the proposal and SHALL require the artifact to use its approved non-site repository home.
17. THE Repository Guide and Master Router SHALL direct skills to `.kiro/skills/`, Agent Work Reports to Workstream Subfolders under `agents-work/`, Machine Evidence to Purpose Subfolders under `results/`, generated tech-docs to `generated-documents/`, active plan material to `plans/<name>/`, and canonical blockers to root `Failures.md`.
18. THE Repository Guide and Master Router SHALL include the beginner output-placement reference table with the artifact class, approved destination, and prohibited destination for each output class before a contributor selects a write path.
19. THE Repository Guide and Master Router SHALL publish the Required copy-paste wording verbatim so that a contributor can select an output home without knowing repository-specific terminology.
20. WHEN a Repository Task identifies an output path outside the approved home for its Artifact Class, THE Repository Guide and Master Router SHALL record the rejected placement in the Route Record and SHALL select the approved repository home before completion.

### Requirement 29: Preserve the exact tech-docs workspace boundary

**User Story:** As a repository owner and beginner contributor, I want the tech-docs workspace package, product source tree, generated documents, and generated result folders distinguished by exact paths, so that documentation work cannot relocate a workspace package or place non-core artifacts under product source.

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL identify `./tech-docs-generator/` as the root-level Tech-Docs Generator Package and SHALL identify the package as a sibling of `./site/`.
2. THE Repository Guide and Master Router SHALL require `./tech-docs-generator/` to remain outside `./site/` unless a separately approved Workspace-Boundary Task authorizes a boundary change.
3. THE Repository Guide and Master Router SHALL identify `./site/` as the Next.js Site Source Tree only.
4. THE Repository Guide and Master Router SHALL identify `./results/site/` as a machine-generated Purpose Subfolder and SHALL distinguish `./results/site/` from `./site/`.
5. THE Repository Guide and Master Router SHALL classify `./results/site/` as a result destination and SHALL not classify `./results/site/` as a source-tree or workspace-package relocation target.
6. THE Repository Guide and Master Router SHALL identify `./generated-documents/` as generated output of `./tech-docs-generator/` and SHALL keep `./generated-documents/` separate from `./site/` and `./results/` unless a separately approved Workspace-Boundary Task changes that policy.
7. WHEN the Repository Guide, a Route Record, an Outcome-Focused Task Card, or a Prompt Cookbook prompt names one of these directories, THE Repository Guide and Master Router SHALL use the Exact Directory Path form with a leading `./`, a trailing `/`, and enough surrounding path context to distinguish `./tech-docs-generator/`, `./site/`, `./results/site/`, and `./generated-documents/`.
8. IF a Repository Task proposes moving `./tech-docs-generator/` into `./site/` or `./results/site/`, THEN THE Repository Guide and Master Router SHALL reject the proposed move and SHALL require the user to separately approve a dedicated Workspace-Boundary Task before the move can be considered.
9. THE Repository Guide and Master Router SHALL reserve `./site/` for Core Product Writes and SHALL direct reports, results, skills, prompts, Agent Work Reports, generated files, and other Non-Core Artifacts to their approved non-site repository homes.
10. IF a Route Record, Outcome-Focused Task Card, or Prompt Cookbook prompt proposes a report, result, skill, prompt, Agent Work Report, generated file, or other Non-Core Artifact under `./site/`, THEN THE Site Write Gate SHALL stop the proposal and SHALL redirect the artifact to its approved repository home.

### Requirement 30: Enforce “Always Use Multiple Subagents” through Standing Multi-Agent Mode

**User Story:** As a repository owner, I want every Repository Task to begin and end with bounded multi-agent coordination, so that research, planning, implementation, verification, and evidence remain explicit, conflict-safe, and owner-controlled.

The “Always Use Multiple Subagents” rule is expressed through Standing Multi-Agent Mode, a persistent Repository Guide and Master Router rule. Standing Multi-Agent Mode is not a one-time suggestion, a request to install a package, an automatic-spawning implementation, or a replacement for the existing routing, artifact-placement, Site Write Gate, Protected Command, or Separate Approval Work boundaries.

#### Acceptance Criteria

1. WHEN a Repository Task starts, THE Repository Guide and Master Router SHALL select Standing Multi-Agent Mode as the default operating mode for the entire Repository Task without requiring the Repository Owner to select a mode.
2. WHEN a Repository Task is ready to begin repository exploration or a repository write, THE Orchestrator SHALL assign at least two Agents with declared roles before the exploration or write begins.
3. WHERE the Multi-Agent Availability State is `available`, THE Orchestrator SHALL assign Scout/Map and Planner/Risk as the minimum default pair, and both roles SHALL have read-only permission.
4. WHEN a Repository Task contains an approved implementation scope, THE Orchestrator SHALL add an Implementer with explicitly approved exclusive paths before the first implementation write.
5. WHEN a Repository Task requires verification, THE Orchestrator SHALL add a read-only Verifier/Reporter and SHALL keep the total active Agent count at four or fewer.
6. WHERE a Parallel Research Wave is declared, THE Orchestrator SHALL permit simultaneous Agents only for read-only research or disjoint exclusive file ownership.
7. IF a target is shared by Agents or is a shared file, manifest, configuration, migration, hook, generated output, result path, or guide/router shared terminology, THEN THE Orchestrator SHALL assign serial ownership and SHALL prohibit simultaneous writes to the target.
8. WHEN a Repository Task starts, THE Orchestrator SHALL publish an Agent Roster containing every active Agent, declared role, permission, owned scope, Multi-Agent Availability State, and status.
9. WHEN a Repository Task starts, THE Orchestrator SHALL publish an Ownership Matrix that maps every task objective, evidence item, artifact, and repository path to one exclusive Agent owner or the Serial Integration Owner.
10. WHEN a Repository Task starts, THE Orchestrator SHALL publish a Route Record for the task and SHALL designate one Serial Integration Owner before any exploration or write begins.
11. WHEN a Repository Task starts, THE Orchestrator SHALL establish a Handoff Record set for the task and SHALL mark the set `not applicable—no transfer` when the task has no Agent transfer.
12. WHEN an Agent transfers work or evidence, THE receiving Agent or Serial Integration Owner SHALL complete a Handoff Record with the Objective, Role and Next Owner, Scope, Paths Read and Paths Changed, Route Record, Evidence, Decisions, Coverage Gaps, Validation Command, Repository Root, Authorization State, Hook Decision, Exit Status, Validation Limitation, Blockers, and Next Action, or shall mark each unavailable field `not observed`.
13. WHEN a Repository Task starts, THE Orchestrator SHALL attach the Conflict Stop Rule to the Agent Roster and Ownership Matrix.
14. IF Agent ownership sets overlap, Agent edits conflict, or Agent evidence contradicts, THEN THE Conflict Stop Rule SHALL stop all affected writes before further modification and SHALL route the conflict to Repository Owner review and Serial Integration.
15. WHEN an Implementer is assigned, THE Orchestrator SHALL provide the Repository Owner with a plain-language status using the Plain-Language Response Contract before the first implementation write, including the approved outcome, known and unverified facts, Route Record, Ownership Matrix, artifact destination, Site Write Gate state, allowed checks, Protected Commands pending authorization, and next action.
16. WHEN the Verifier/Reporter completes verification, THE Verifier/Reporter SHALL provide the Repository Owner with a Completion Record using the Plain-Language Response Contract, including Multi-Agent Evidence, changed scope, observed evidence, pending validation, Coverage-Gap Admission Cards, Separate Approval Work, and True Blockers.
17. IF the Multi-Agent Availability State is `limited` or `unavailable`, THEN THE Orchestrator SHALL record the unavailable Agent or role, SHALL not silently switch to a single-Agent workflow, and SHALL mark Multi-Agent Evidence as pending owner review.
18. THE Repository Guide and Master Router SHALL persist Standing Multi-Agent Mode in `./agents-work/oando-repository-guide/README.md` and `./.kiro/skills/oando-master/SKILL.md` as the default rule for every Repository Task.
19. THE Current Guidance Deliverable SHALL describe Standing Multi-Agent Mode as repository guidance only and SHALL classify automatic Agent spawning, hook changes, package installation, and runtime-code changes as Separate Approval Work.
20. WHEN the Repository Guide and Master Router select a Workflow Mode, THE Repository Guide and Master Router SHALL select and explain one of Vibe, Plan, Spec, Autopilot, or Supervised without requiring the Repository Owner to choose the mode.
21. WHEN Standing Multi-Agent Mode guidance is added, THE Repository Guide and Master Router SHALL preserve exactly the three existing Special Requirements and SHALL not create a fourth Special Requirement.
22. WHEN Standing Multi-Agent Mode guidance is added, THE Repository Guide and Master Router SHALL preserve all 22 existing Repository Domain Index cards and SHALL not rename, remove, merge, or replace a card.
23. WHEN Standing Multi-Agent Mode guidance is added, THE Repository Guide and Master Router SHALL preserve all 25 existing Prompt Cookbook categories and SHALL keep the standing-mode prompt set separate from the Prompt Cookbook category count.
24. WHEN Standing Multi-Agent Mode guidance is added, THE Repository Guide and Master Router SHALL preserve Workstream Subfolder, Purpose Subfolder, generated-documents, active-plan, and root-Failures.md artifact-placement rules.
25. WHEN Standing Multi-Agent Mode guidance names the tech-docs workspace, THE Repository Guide and Master Router SHALL preserve the exact boundary in which `./tech-docs-generator/` remains a root-level sibling of `./site/`, generated output remains under `./generated-documents/`, and machine evidence remains under `./results/`.
26. WHEN Standing Multi-Agent Mode guidance names a product-source target, THE Site Write Gate SHALL preserve the strict `./site/` boundary by permitting only an explicitly approved Core Product Write and redirecting every Non-Core Artifact to its approved non-site home.
27. WHEN Standing Multi-Agent Mode guidance identifies automatic spawning, hook, package, runtime, database, deployment, backup, external MCP, Power, or other implementation work, THE Repository Guide and Master Router SHALL classify the work as Separate Approval Work and SHALL not treat the requirements revision as implementation approval.

#### Workflow mode selection guidance

The Repository Owner describes the desired outcome in ordinary language. The Repository Guide and Master Router selects and explains the mode; the Repository Owner is not required to choose a mode.

| Workflow Mode | Router selection guidance | Plain-language explanation |
|---|---|---|
| `Vibe` | Read-only discovery or a small, low-risk, reversible task with no Protected Command and no shared-path write | Use for finding facts or making a narrowly bounded low-risk adjustment after the roster and route are recorded. |
| `Plan` | A multi-step task that needs scope, ownership, risk, artifact placement, or validation planning before implementation | Use when the work needs a bounded execution plan before an Implementer is assigned. |
| `Spec` | A feature, policy, workflow, or cross-domain change requiring requirements, design, acceptance criteria, or explicit approval boundaries | Use when the task needs durable requirements and decisions before implementation. |
| `Autopilot` | An approved, bounded implementation with exclusive ownership, no unresolved Owner Decision, and known permitted checks | Use when the Orchestrator can execute the approved scope without pausing for routine decisions. |
| `Supervised` | High-risk work, shared or serial paths, Protected Commands, external systems, migrations, deployments, or a Repository Owner request for stepwise checkpoints | Use when the Repository Owner must review scope, writes, conflicts, commands, or evidence at defined checkpoints. |

#### Standing Multi-Agent Mode copy-paste prompts

Each prompt below is a complete copy-paste prompt. Each prompt includes the artifact-placement rules, Site Write Gate, Protected Command authorization rule, and Plain-Language Response Contract so the prompt remains safe when copied without surrounding context.

##### 1. Start Standing Multi-Agent Mode

```text
Start Standing Multi-Agent Mode for this Repository Task.

Desired outcome: [describe the outcome in ordinary language].
Orchestrator: treat Standing Multi-Agent Mode as the default for this entire task, not as a one-time suggestion or package-installation request. Set and report the Multi-Agent Availability State. Before any repository exploration or write, assign at least two Agents with declared roles; use Scout/Map (read-only) and Planner/Risk (read-only) as the minimum default pair when available. Add Implementer only for an approved implementation scope and Verifier/Reporter when verification is required; never exceed four active Agents. Publish the Agent Roster, Ownership Matrix, Route Record, Handoff Record register, Conflict Stop Rule, and Serial Integration Owner before work starts. Do not silently switch to a single-Agent workflow; if the required pair is unavailable, record the limitation and mark Multi-Agent Evidence pending owner review.

Controls: Put agent-authored reports and work products in ./agents-work/<workstream>/<report-type>/ or an existing approved workstream folder; put command-generated Machine Evidence in ./results/<purpose>/; put tech-docs output in ./generated-documents/; put active plans in ./plans/<name>/; put canonical True Blockers in ./Failures.md. Keep ./tech-docs-generator/ as a root-level sibling of ./site/. Before any ./site/ write, apply the Site Write Gate: classify the target in the Route Record as an explicitly approved Core Product Write or a Non-Core Artifact; stop and redirect every Non-Core Artifact, report, prompt, skill, result, generated file, plan, handoff, or audit to its approved non-site home.

Protected Commands: Treat tests, gates, coverage, browser runs, builds, deployments, database actions, backups, and local-service commands as Protected Commands. Do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission. Classify every proposed command before execution.

Report contract: Return the Plain-Language Response Contract in this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; and Unavoidable Owner Decisions. Send the Repository Owner a plain-language status before implementation and a Completion Record after verification.
```

##### 2. Launch Scout/Map and Planner/Risk in parallel

```text
Launch the default Parallel Research Wave for this Repository Task.

Desired outcome: [describe the outcome in ordinary language]. Assign exactly two read-only Agents in parallel: Scout/Map owns repository orientation, authority ordering, candidate paths, and evidence discovery; Planner/Risk owns scope decomposition, matching Package Skills, Workflow Mode, Operational-Risk Classification, command classification, artifact placement, ownership proposals, and validation planning. Publish the Agent Roster, Ownership Matrix, Route Record, Handoff Record register, Conflict Stop Rule, and Serial Integration Owner first. Allow parallel work only because both assignments are read-only. Do not write files, edit shared terminology, or silently add an Implementer. At the wave boundary, require Handoff Records and serial reconciliation by the Serial Integration Owner.

Controls: Put agent-authored reports and work products in ./agents-work/<workstream>/<report-type>/ or an existing approved workstream folder; put command-generated Machine Evidence in ./results/<purpose>/; put tech-docs output in ./generated-documents/; put active plans in ./plans/<name>/; put canonical True Blockers in ./Failures.md. Keep ./tech-docs-generator/ as a root-level sibling of ./site/. Before any ./site/ write, apply the Site Write Gate: classify the target in the Route Record as an explicitly approved Core Product Write or a Non-Core Artifact; stop and redirect every Non-Core Artifact to its approved non-site home.

Protected Commands: Treat tests, gates, coverage, browser runs, builds, deployments, database actions, backups, and local-service commands as Protected Commands. Do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission. Classify every proposed command before execution.

Report contract: Each Agent returns the Plain-Language Response Contract in this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; and Unavoidable Owner Decisions. Each Handoff Record must include the required objective, ownership, paths, evidence, decisions, validation, authorization, blockers, and next action fields, or mark a field not observed.
```

##### 3. Hand an approved scope to Implementer

```text
Hand this approved scope to an Implementer.

Approved outcome: [state the approved outcome]. Approved paths: [list exact exclusive repository paths]. The Orchestrator must first provide the Repository Owner a plain-language implementation status, publish the Route Record and Ownership Matrix, confirm the Implementer has exclusive ownership, and confirm the Site Write Gate state. The Implementer may write only the approved paths, must stop before an unowned or shared target, and must hand off changed paths, decisions, evidence, validation state, blockers, and next action. Shared files, manifests, configs, migrations, hooks, generated outputs, result paths, and guide/router shared terminology remain serial ownership. Invoke the Conflict Stop Rule before any further affected write if ownership overlaps, edits conflict, or evidence contradicts.

Controls: Put agent-authored reports and work products in ./agents-work/<workstream>/<report-type>/ or an existing approved workstream folder; put command-generated Machine Evidence in ./results/<purpose>/; put tech-docs output in ./generated-documents/; put active plans in ./plans/<name>/; put canonical True Blockers in ./Failures.md. Keep ./tech-docs-generator/ as a root-level sibling of ./site/. Before any ./site/ write, apply the Site Write Gate: classify the target in the Route Record as an explicitly approved Core Product Write or a Non-Core Artifact; permit only the approved Core Product Write and redirect every Non-Core Artifact to its approved non-site home.

Protected Commands: Treat tests, gates, coverage, browser runs, builds, deployments, database actions, backups, and local-service commands as Protected Commands. Do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission. Classify every proposed command before execution and mark unapproved checks pending.

Report contract: Before writing, return the Plain-Language Response Contract in this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; and Unavoidable Owner Decisions. At handoff, return a Handoff Record with every required field and identify the Verifier/Reporter or Serial Integration Owner as next owner.
```

##### 4. Launch Verifier/Reporter

```text
Launch a read-only Verifier/Reporter for this Repository Task.

Desired outcome: [state the implementation or documentation outcome to verify]. Assign Verifier/Reporter only after the Implementer or research Agents provide their Handoff Records. The Verifier/Reporter owns evidence reconciliation, Route Record and Ownership Matrix review, artifact-placement review, Site Write Gate review, coverage-gap review, conflict review, and Completion Record drafting. The Verifier/Reporter must not modify implementation files or silently repair an ownership conflict. If evidence contradicts or ownership overlaps, invoke the Conflict Stop Rule and return the issue to the Serial Integration Owner and Repository Owner.

Controls: Put agent-authored reports and work products in ./agents-work/<workstream>/<report-type>/ or an existing approved workstream folder; put command-generated Machine Evidence in ./results/<purpose>/; put tech-docs output in ./generated-documents/; put active plans in ./plans/<name>/; put canonical True Blockers in ./Failures.md. Keep ./tech-docs-generator/ as a root-level sibling of ./site/. Before any proposed ./site/ write, apply the Site Write Gate: classify the target in the Route Record as an explicitly approved Core Product Write or a Non-Core Artifact; stop and redirect every Non-Core Artifact to its approved non-site home.

Protected Commands: Treat tests, gates, coverage, browser runs, builds, deployments, database actions, backups, and local-service commands as Protected Commands. Do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission. Classify each check and report pending authorization or hook state rather than inferring a pass.

Report contract: Return the Plain-Language Response Contract in this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; and Unavoidable Owner Decisions. Then provide a Completion Record containing Multi-Agent Evidence, changed scope, observed evidence, pending validation, Coverage-Gap Admission Cards, Separate Approval Work, and True Blockers.
```

##### 5. Resolve a multi-agent conflict

```text
Invoke the Conflict Stop Rule for this Repository Task.

Conflict: [describe the overlapping ownership, edit conflict, or contradictory evidence]. Stop all affected writes immediately. The Orchestrator must preserve the current Agent Roster, Ownership Matrix, Route Record, Handoff Records, and Serial Integration Owner; identify the exact paths and evidence in conflict; classify shared files, manifests, configs, migrations, hooks, generated outputs, result paths, and guide/router shared terminology as serial ownership; and route the decision to the Repository Owner. No Agent may silently overwrite, merge, reinterpret, or continue affected work. After the Repository Owner decision, the Serial Integration Owner must update ownership, reconcile the Handoff Records, and authorize the next bounded action.

Controls: Put agent-authored reports and work products in ./agents-work/<workstream>/<report-type>/ or an existing approved workstream folder; put command-generated Machine Evidence in ./results/<purpose>/; put tech-docs output in ./generated-documents/; put active plans in ./plans/<name>/; put canonical True Blockers in ./Failures.md. Keep ./tech-docs-generator/ as a root-level sibling of ./site/. Before any ./site/ write, apply the Site Write Gate: classify the target in the Route Record as an explicitly approved Core Product Write or a Non-Core Artifact; stop and redirect every Non-Core Artifact to its approved non-site home.

Protected Commands: Treat tests, gates, coverage, browser runs, builds, deployments, database actions, backups, and local-service commands as Protected Commands. Do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission. Classify every proposed diagnostic before execution; preserve the existing control while the conflict remains unresolved.

Report contract: Return the Plain-Language Response Contract in this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; and Unavoidable Owner Decisions. Include a conflict Handoff Record with the conflict evidence, blocked paths, Owner Decision, updated owner, validation state, blocker state, and next action.
```

##### 6. Finish and close a multi-agent task

```text
Finish and close this Standing Multi-Agent Repository Task.

Desired outcome: [state the outcome being closed]. The Serial Integration Owner must reconcile every Agent Roster entry, Ownership Matrix assignment, Route Record, Handoff Record, Conflict Stop Rule decision, artifact destination, Site Write Gate decision, and validation result. The Verifier/Reporter must review the final scope read-only and confirm that all writes were exclusive or serially integrated. Record any unavailable Agent, missing handoff, unverified behavior, pending Protected Command, Coverage-Gap Admission Card, Separate Approval Work, or True Blocker; do not silently convert pending evidence into a pass. Send the Repository Owner a plain-language status before implementation if that status is missing, and send the Completion Record only after verification.

Controls: Put agent-authored reports and work products in ./agents-work/<workstream>/<report-type>/ or an existing approved workstream folder; put command-generated Machine Evidence in ./results/<purpose>/; put tech-docs output in ./generated-documents/; put active plans in ./plans/<name>/; put canonical True Blockers in ./Failures.md. Keep ./tech-docs-generator/ as a root-level sibling of ./site/. Before any ./site/ write, apply the Site Write Gate: classify the target in the Route Record as an explicitly approved Core Product Write or a Non-Core Artifact; permit only the approved Core Product Write and redirect every Non-Core Artifact to its approved non-site home.

Protected Commands: Treat tests, gates, coverage, browser runs, builds, deployments, database actions, backups, and local-service commands as Protected Commands. Do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission. Report each exact command, authorization state, hook decision, exit status, scope, and validation limitation; identify unrun checks as pending.

Report contract: Return the Plain-Language Response Contract in this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; and Unavoidable Owner Decisions. The Completion Record must state the final Agent Roster, Ownership Matrix, Route Record, Multi-Agent Evidence, changed scope, observed evidence, pending validation, Coverage-Gap Admission Cards, Separate Approval Work, True Blockers, and next owner action.
```


### Requirement 31: Enforce the Locked Path Gate for protected repository guidance

**User Story:** As a Repository Owner, I want durable guidance and root control documents protected from unapproved edits, so that agents can use those files as evidence without changing repository authority or hiding required owner decisions.

The following beginner-readable reference is normative for locked-path handling:

#### Locked Path Gate reference

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

#### Acceptance Criteria

1. THE Repository Guide and Master Router SHALL define `./docs/`, `./Agents/`, and root-level Markdown files matching `./*.md` as Locked Paths that remain read-only unless the Repository Owner explicitly names and authorizes the exact file in the current request.
2. WHEN a Repository Task proposes any repository write, THE Route Record SHALL classify the exact target as `Locked`, explicitly owner-authorized, or `writable` before the write begins.
3. THE Repository Guide and Master Router SHALL permit Locked Paths to serve as Read-Only Evidence Sources and SHALL exclude Locked Paths from implementation and report destinations.
4. IF a proposed write targets a Locked Path without an Owner-Authorized File, THEN THE Locked Path Gate SHALL stop the write before modification, explain the exact file and reason, and record the change as an unavoidable Owner Decision and Separate Approval Work.
5. IF a Repository Owner authorizes one exact file in a Locked Path, THEN THE Locked Path Gate SHALL treat only that exact file as an Owner-Authorized File and SHALL keep other files in the Locked Path classified as Locked.
6. THE Repository Guide and Master Router SHALL distinguish `./agents-work/` from `./Agents/` and SHALL allow guide work and Agent Work Reports only under an approved `./agents-work/<workstream>/<report-type>/` folder.
7. IF a Repository Task requires a change to `./Failures.md` without explicit authorization for that exact file, THEN THE Repository Guide and Master Router SHALL keep the canonical blocker ledger unchanged, record the blocker as pending owner action, and direct supporting analysis to an approved Workstream Subfolder.
8. THE Repository Guide and Master Router SHALL keep `./.kiro/` spec and skill work governed by the current spec, artifact-placement rules, and Site Write Gate rather than treating `./.kiro/` as permission to change a Locked Path.
9. IF a Repository Task proposes a copy in another location as a substitute for an unauthorized Locked Path change, THEN THE Repository Guide and Master Router SHALL reject the claim that the Locked Path was updated and SHALL preserve the change as an unavoidable Owner Decision and Separate Approval Work.
10. THE Repository Guide and Master Router SHALL publish the Locked Path Gate reference table and Required Locked Path Gate copy-paste wording before a contributor selects a write path.

### Requirement 32: Enforce an Agent Compliance Contract and stop scope drift

**User Story:** As a non-expert repository owner, I want every Agent to say what it may do, what it must not do, and how it will prove completion before work begins, so that helpful-looking extra work cannot silently change the task.

For this requirement:

- **Current user request** means the complete request that started the Repository Task, including explicit scope, exclusions, and validation limits.
- **Applicable global repository standard** means the repository-wide `AGENTS.md` and any directly applicable standard or handbook it names, such as `Agents/01-standard.md`.
- **Assigned scope** means the approved outcome and the exact work an Agent is responsible for.
- **Delivery conditions** means the plain-language facts and evidence that must be handed back before the Agent can say its assignment is complete.
- **Scope drift** means work, paths, decisions, commands, or outputs that were not in the assigned scope or later-approved change record.
- **Agent Compliance Contract** means the pre-work, in-work, stop, coordination, and handoff rules below.

#### Acceptance Criteria

1. BEFORE an Agent begins repository exploration, modification, or command proposal, THE Agent Compliance Contract SHALL require the Agent to read the current user request in full and the applicable global repository standard, and SHALL require the Agent to state that both were read or identify the exact missing source.
2. THE Agent Compliance Contract SHALL state that current user instructions outrank defaults and that the applicable global repository standard remains in force unless the current user explicitly overrides a specific rule; an Agent SHALL not treat silence as an override.
3. BEFORE work begins, EVERY Agent SHALL state in plain language the requested outcome, assigned scope, exact owned paths, read/write permission for each owned path, explicit exclusions, delivery conditions, expected handoff owner, and allowed or pending validation.
4. THE Agent Compliance Contract SHALL require the coordinator to record each Agent declaration in the Agent Roster and Ownership Matrix before that Agent begins any repository exploration or writes any file.
5. EVERY Agent SHALL perform only requested and assigned work. An Agent SHALL NOT infer permission for adjacent cleanup, refactoring, tests, test configuration, scripts, documentation, package or dependency changes, configuration changes, UI changes, generated output, or other helpful additions merely because the addition appears useful or nearby.
6. THE Repository Guide and Master Router SHALL state that tests and scripts are not assumed to be declared by `package.json` or an ordinary test configuration. Any proposed test or script work SHALL require repository evidence for the exact target and exact current-session authorization; any execution additionally requires the applicable Hook Permission. No Agent may add or run such work from convention, an inline marker, or an inferred need.
7. WHEN a small quality defect is directly within the requested outcome and an owned path, THE Agent SHALL resolve it even if the requested functionality already works; THE Agent SHALL stop and request a scope decision when resolving it would require an adjacent path, new behavior, new command, or unrelated cleanup.
8. EVERY Agent SHALL preserve unrelated work and SHALL NOT overwrite, revert, reformat, rename, or clean up an unowned change. Existing changes are evidence to preserve, not permission to expand the assignment.
9. IF an Agent encounters a conflict, missing authorization, ambiguous ownership, hidden repository constraint, contradictory evidence, or a request that expands the task, THEN THE Agent SHALL stop the affected work, state the exact issue and paths or actions involved, and surface it to the coordinator or Repository Owner instead of deciding silently.
10. THE Agent Compliance Contract SHALL explain that scope drift can arise from ambiguous ownership, default helpful behavior, hidden repository constraints, or task expansion, and SHALL name a control for each cause: exact ownership declarations for ambiguous ownership; explicit exclusions and no-inferred-permission rules for helpful behavior; mandatory reading of the current user request and applicable global standard plus live evidence for hidden constraints; and a re-route, approval, and delivery-condition check for task expansion.
11. BEFORE integration, THE coordinator SHALL compare each Agent handoff with the current user request, Route Record, Agent Roster, Ownership Matrix, exclusions, and delivery conditions; THE coordinator SHALL reject or reconcile scope drift before accepting the handoff, SHALL not hide drift inside a combined change, and SHALL record the owner decision when the scope must change.
12. THE coordinator SHALL use no more than four Agents, SHALL assign disjoint ownership for parallel work, SHALL integrate work serially, and SHALL invoke the Conflict Stop Rule before further affected writes when ownership overlaps, edits conflict, evidence contradicts, or a handoff cannot be reconciled to the approved scope.
13. EVERY Agent handoff SHALL be written in plain language and SHALL list: each changed file and why that file changed; validation actually run, with the exact command and observed result or `none`; validation not run, with the exact command or check that remains pending or the reason it was not applicable; remaining issues, unverified behavior, blockers, and the next owner action.
14. THE Completion Record SHALL distinguish requested work from extra proposed work, SHALL identify every changed file and reason, SHALL distinguish validation actually run from validation not run, and SHALL remain incomplete until unresolved scope drift, missing authorization, ownership conflict, and remaining issues are either resolved or explicitly assigned to an owner.
15. THE Agent Compliance Contract SHALL preserve the repository placement boundaries: `./docs/`, `./Agents/`, and root-level `./*.md` are Locked Paths and read-only evidence by default; Agent-authored reports use `./agents-work/<workstream>/<report-type>/`; machine output uses `./results/<purpose>/`; `./tech-docs-generator/` remains a root-level sibling of `./site/`; and `./site/` accepts only an explicitly approved Core Product Write while reports, skills, results, prompts, plans, generated files, and other Non-Core Artifacts are redirected elsewhere.
16. THIS requirements revision SHALL be guidance/specification work only. It SHALL not authorize tests, gates, builds, typechecks, scripts, package or configuration changes, application implementation, UI changes, database actions, deployment actions, or other commands; any such work remains separately scoped and explicitly authorized.