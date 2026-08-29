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
