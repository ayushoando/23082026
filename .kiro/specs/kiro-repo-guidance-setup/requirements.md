# Requirements Document

## Introduction

This feature defines a small, repository-local Kiro onboarding and guidance configuration for the `oando1408` monorepo. The feature audits the repository authority chain and existing `.kiro` assets, records relevant official Kiro documentation with evidence, makes explicit owner decisions about surfaces and automation, and produces an install/retain/defer/disable plan that can be validated and rolled back.

The feature is a requirements-first review. This document does not authorize implementation by itself. Design and task work must not turn an unresolved owner decision, an unverified compatibility claim, or a historical handover statement into an enabled configuration. The feature scope is limited to repository guidance and repository-local Kiro configuration. Application code, dependencies, lockfiles, secrets, production data, external services, user/global Kiro configuration, and permission broadening remain outside scope unless the owner gives explicit approval at the applicable Approval_Boundary.

The review date for the supplied audit evidence is **2026-08-25**. The review must distinguish documented facts, live observations, unverified findings, owner decisions, approval boundaries, rollback procedures, and fresh validation evidence. The feature must not claim that every Kiro webpage was read. Complete review means coverage of every relevant current official Kiro page identified through official sitemap and search review and recorded in the Coverage_Matrix; non-applicable pages must be recorded as exclusions with reasons.

## Evidence and decision model

Every material claim in the review, design, validation record, and handover uses one of these states:

- **Documented**: stated by an official Kiro source reviewed on 2026-08-25 or by a repository canonical source. A documented claim describes Kiro or repository policy; it does not prove local compatibility.
- **Observed**: confirmed by a live repository inspection or fresh command. The observation includes date, command or file path, and result.
- **Unverified**: not confirmed on the Active_Surface, contradicted by another source, unavailable, version-sensitive, or dependent on a missing/stubbed prerequisite.
- **Owner_Decision**: a selection that only the repository owner or an explicitly delegated maintainer may make.
- **Approval_Boundary**: a proposed action that requires explicit owner approval before execution, including global configuration, credentials, external services, permission broadening, package changes, production data, or automated commands with material side effects.
- **Validated**: a documented or observed claim confirmed by a fresh Validation_Run on the relevant surface. A URL, registration entry, historical note, or green repository command alone does not establish local Kiro compatibility.

A capability cannot be described as enabled, supported, or repository-compatible when the only evidence state is Documented, Unverified, or historical.

## Verified baseline from the 2026-08-25 audit

The following baseline is input to the requirements. The status in the table is part of the evidence model and must not be silently upgraded during design or implementation.

| Finding | Evidence state | Required interpretation |
|---|---|---|
| The active environment is a Kiro IDE session. | Observed | Local enablement checks use the IDE session unless an owner selects another Active_Surface. |
| A fresh command reported `kiro-cli-chat 2.19.1`. | Observed | CLI 2.x evidence is available for that command; the command does not validate CLI 3.x behavior. |
| CLI 3.x behavior is not locally validated. | Unverified | CLI 3.x claims require a fresh CLI 3.x Validation_Run before enablement. |
| Official configuration documentation describes global `~/.kiro`, project `.kiro`, and agent scopes. | Documented | Project steering, skills, hooks, and specs are repository artifacts; permission behavior remains workspace-root/user-side and deny overrides allow. |
| Web and Mobile do not use global configuration and do not support hooks; custom agents are IDE/CLI only. | Documented | Web/Mobile hook claims and custom-agent claims require surface-specific dispositions; no cross-surface assumption is allowed. |
| Official skills documentation requires `SKILL.md` frontmatter with `name` matching the folder and a specific `description`. | Documented | Every selected workspace skill requires manifest validation before enablement. |
| Workspace skills are auto-discovered/on-demand and can be slash commands. | Documented | Skill activation scope remains an owner decision; discovery does not imply always-on activation. |
| Skills, steering, powers, and custom agents are distinct surfaces. | Documented | One artifact cannot be described as a substitute for another without evidence. |
| Custom agents require explicit resource URIs when applicable. | Documented | Any proposed custom agent must record and validate every applicable resource URI. |
| Hook manifests are standalone `.kiro/hooks/*.json` files with version `v1`, PascalCase triggers, command/agent actions, command JSON on stdin, narrow matchers, and hook-level `timeout` and `enabled` fields. | Documented | Hook schema validation is required; action-level timeout placement is not accepted as validated schema. |
| The repository currently has four enabled hook definitions and one disabled LTM hook. | Observed | Existing hook dispositions must be recorded before any hook change. |
| `domain-fast-check.json` places `timeout` inside `action`. | Observed and Unverified | The manifest is a repair candidate, not an enabled-valid claim, until current schema validation confirms the correct placement and behavior. |
| Current stored hook commands use semicolons, not `&&`. | Observed | The earlier PowerShell `&&` error came from an attempted shell command and is not evidence of a stored hook defect. |
| Legacy `POWER.md` powers continue to work, while new powers should use Agent Plugins with `plugin.json`. | Documented | The local legacy power requires a migration or retain decision; no undocumented equivalence may be inferred. |
| The local `oando-workflow` power contains `POWER.md`, empty `mcp.json`, and no `plugin.json`. | Observed | The power is a legacy-format candidate with a migration/retain decision. |
| `registryId: local` registration for `oando-workflow` is unverified. | Unverified | Registration alone cannot support an activation claim. |
| Recommended user-installed powers include external MCP-backed capabilities. | Observed | Routing, secrets, services, and broad permissions require explicit owner approval and active-surface validation. |
| The repository has six local skills: `repo-map`, `graph-impact`, `verify-and-gate`, `fork-boundaries`, `focss-css`, and `db-migrations`. | Observed | The six skills are the initial candidate set; the feature must not add duplicates without a gap analysis. |
| The repository has no repository-local custom agents and no `.kiro/settings` directory. | Observed | No custom-agent or project-settings enablement claim exists in the baseline. |
| The repository has manual graph tooling at `scripts/graph-impact.mjs` with `stats`, `impact`, and `cycle` modes. | Observed | The documented graph → scoped tests → fix for up to three times → `gate:fast` loop is manual, not a separate loop runner or hook. |
| Official specs and task execution build dependency graphs and parallel waves; official subagents support DAGs and bounded review loops. | Documented | Adoption requires an owner decision and repository-compatible validation. |
| Crew Task Runner documentation describes worktrees, up to three concurrent runs, retries/replans, and auto-approval. | Documented | Crew execution is currently incompatible with the repository's no-worktree rule, its default one-agent rule, and explicit approval; the scoped OD-04 Concurrent_Implementation_Wave exception does not authorize Crew worktrees, retries/replans, auto-approval, or general Crew adoption. |
| Crew was uninstalled. | Observed | Crew-specific behavior is not proof of local support. |
| Local compaction/session features are relevant; Crew memory and knowledge are distinct capabilities. | Documented and Observed | Continuity claims must identify the data boundary and surface. |
| The LTM capture hook depends on a documented stub. | Observed and Unverified | LTM remains disabled until a verified implementation and fresh execution evidence exist. |

## Glossary

- **Repository_Root**: `D:\23082026`, the checkout from which repository commands and repository-local Kiro configuration are managed.
- **Kiro_Workspace**: The repository-local `.kiro` directory, including `skills`, `steering`, `hooks`, `powers`, `agents`, `settings` when present, and `specs`.
- **Guidance_Source**: User instructions, live code, fresh command output, `AGENTS.md`, `START.md`, `README.md`, `CONTENTS.md`, `DOC-MAP.md`, `HANDOVER.md`, `Agents/*`, canonical `docs/*`, or an official Kiro source.
- **Canonical_Source**: A Guidance_Source selected by the repository authority order: user instruction, live code and fresh commands, `AGENTS.md`, `Agents/*`, then canonical `docs/*`.
- **Kiro_Surface**: A Kiro execution or configuration environment, including IDE, CLI 2.x, CLI 3.x, Web, Mobile, Cloud/Crew, and the Local_Repository_Surface.
- **Active_Surface**: The Kiro surface used for a specific fresh validation. The supplied baseline observes a Kiro IDE session; the owner must select the surfaces that may be treated as targets.
- **Kiro_Skill**: A portable instruction package represented by `SKILL.md` and its required frontmatter.
- **Steering_File**: A repository-local Markdown guidance file with an inclusion scope such as always, file-match, or manual.
- **Kiro_Power**: An active Kiro capability bundle. A legacy `POWER.md` power and an Agent Plugin with `plugin.json` are distinct formats.
- **Custom_Agent**: An explicitly configured Kiro agent definition with documented scope, resources, and activation rules.
- **Subagent**: A subordinate agent used in a documented DAG or review loop.
- **Implementation_Agent**: An agent performing an implementation task for this feature under a declared read/write scope.
- **Concurrent_Implementation_Wave**: A time-overlapping set of independent implementation tasks for this feature, with disjoint declared file ownership and no overlapping writes.
- **File_Ownership_Reservation**: A file/task lock or equivalent recorded reservation granting one Implementation_Agent exclusive mutation ownership of declared files and shared generated outputs.
- **Shared_Contract_Freeze**: The recorded point at which shared interfaces and contracts are completed and frozen before dependent agents start.
- **Integration_Validation_Gate**: The single post-wave integration and validation step that records all agent outputs, runs both reviewer checks, resolves conflicts, and determines whether the wave may proceed.
- **Reviewer_Check**: One of the two required post-wave review checks run by the Integration_Validation_Gate.
- **Tool_Surface**: A Kiro built-in tool or tool invocation capability.
- **MCP_Service**: An external or local Model Context Protocol service exposed through Kiro configuration or a power.
- **Hook_Manifest**: A standalone JSON file under `.kiro/hooks` containing one or more versioned hook definitions.
- **Hook_Event**: A PascalCase Kiro lifecycle event that may trigger a hook.
- **Hook_Action**: A command action or agent-prompt action executed by a hook.
- **Hook_Matcher**: A narrow pattern limiting a hook to relevant files, tools, prompts, or events.
- **Hook_Schema**: The current official versioned JSON structure for Hook_Manifest files.
- **Approved_Hook**: A hook selected by the owner after safety, schema, overlap, command, timeout, and rollback checks pass.
- **Skill_Manifest**: `SKILL.md` frontmatter containing a folder-matching `name` and specific `description`.
- **Source_Inventory**: Source records for official pages, repository guidance, live configuration, and validation evidence.
- **Coverage_Matrix**: A human-readable matrix mapping every reviewed or excluded official documentation candidate to family, surface, applicability, evidence, review status, and disposition.
- **Exclusion_Register**: The list of official documentation candidates excluded from local scope with a specific reason, owner, and reconsideration trigger.
- **Evidence_Provenance**: Source URL or path, retrieval or observation method, date, revision/version when available, and trust or integrity basis.
- **Version_Sensitive_Claim**: A claim whose behavior may vary by surface, version, schema, migration state, or channel.
- **Configuration_Scope**: Global `~/.kiro`, workspace/project `.kiro`, agent, file-match, manual, or external-service scope.
- **Permission_Precedence**: The documented or observed order in which permission rules, prompts, denies, and overrides are evaluated.
- **Approval_Boundary**: The point requiring explicit owner approval before a proposed action changes global configuration, permissions, secrets, packages, production data, or external services.
- **Owner_Decision**: A recorded selection made by the owner before the selected capability is implemented or enabled.
- **Capability_Disposition**: `apply`, `retain`, `update`, `merge`, `add`, `observe`, `defer`, `disable`, `retire`, or `exclude` with a reason.
- **Validation_Run**: A fresh command or surface action with date, working directory/surface, scope, exit/result, evidence, and unverified items.
- **Rollback_Path**: A concrete reversible action that restores the prior artifact or disables the capability without deleting unrelated work.
- **Known_Gaps_Register**: Unresolved, unavailable, contradictory, version-sensitive, or unverified findings carried into handover.
- **LTM_Capture**: The repository long-term-memory capture command referenced by the existing disabled hook.
- **Repository_Command**: A root `package.json` command or reviewed repository-local script.
- **Complete_Review**: Coverage of every relevant current official Kiro page identified through official sitemap and search review and recorded in the Coverage_Matrix; Complete_Review does not mean that every Kiro webpage was read.
- **Official_Documentation_Family**: A named group of related official Kiro pages, such as configuration, hooks, skills, powers, MCP, specifications, continuity, or migration.
- **Unverified_Finding**: A claim or compatibility result that lacks confirmation from live repository evidence, a fresh Active_Surface Validation_Run, or an authoritative source.
- **Configuration_Precedence_Map**: A record separating documented and observed precedence for global, project, agent, file-match, manual, permission, and external-service scopes.
- **Surface_Compatibility_Statement**: A handover statement naming selected surfaces, supported claims, unsupported claims, migration constraints, and evidence for Version_Sensitive_Claims.
- **Capability_Disposition_Table**: A table assigning a Capability_Disposition, scope, owner, approval status, evidence, validation action, side effects, and Rollback_Path to each reviewed capability.
- **Handover_Record**: The operational document containing coverage, dispositions, compatibility, precedence, validation, known gaps, ownership, maintenance, and rollback information.
- **Guidance_Auditor**: The role that inventories guidance and official sources, resolves authority conflicts, and records evidence and gaps.
- **Surface_Compatibility_Reviewer**: The role that compares Kiro surfaces, versions, migrations, and local validation results.
- **Configuration_Configurator**: The role that maps configuration and permission scopes and their precedence.
- **Guidance_Configurator**: The role that places repository guidance, applies authority rules, and enforces scope boundaries.
- **Skill_Configurator**: The role that evaluates and assigns dispositions to Kiro skills and steering files.
- **Hook_Configurator**: The role that evaluates, validates, enables, disables, and rolls back hooks.
- **Capability_Configurator**: The role that assigns dispositions to powers, MCP, tools, agents, subagents, workflows, and continuity capabilities.
- **Configuration_Validator**: The role that runs artifact, repository, schema, and Active_Surface validation.
- **Handover_Generator**: The role that produces the Coverage_Matrix, Exclusion_Register, disposition records, and operational Handover_Record.

## Owner decision gate

The following decisions are recorded as owner-approved selections on 2026-08-25. The selected policy for each decision is **enable after validation**, with OD-04 additionally recording a feature-scoped four-agent concurrent exception. Approval was given by the repository owner in this conversation and remains conditional on fresh `Validation_Run` evidence, each applicable `Approval_Boundary`, and a concrete `Rollback_Path`. No documentation, registration entry, or historical evidence alone establishes compatibility or authorizes execution.

| Decision ID | Owner | Decision date | Selected policy and scope | Rejected options | Approval status | Required validation and rollback boundary |
|---|---|---|---|---|---|---|
| OD-01 | repository owner | 2026-08-25 | **enable after validation** for IDE, CLI 2.x, CLI 3.x, Web/Mobile where compatible, Cloud/Crew, and the Local_Repository_Surface. Each surface/version requires its own compatibility evidence. | None explicitly rejected. | owner-approved in this conversation but conditional on fresh validation and rollback readiness | Run a fresh `Validation_Run` for each selected surface/version; do not transfer IDE or CLI 2.x evidence to another surface; record a rollback path before enablement. |
| OD-02 | repository owner | 2026-08-25 | **enable after validation**: repair and validate hook schema issues, then enable hooks that pass all checks. Keep the LTM capture hook disabled until its stub is implemented and successfully validated. | None explicitly rejected. | owner-approved in this conversation but conditional on fresh validation and rollback readiness | Validate standalone hook JSON, schema, matchers, commands, timeouts, enabled state, dependencies, and surface behavior; record disable and restoration paths. |
| OD-03 | repository owner | 2026-08-25 | **enable after validation**: automate the graph-impact workflow only after repository checks and an explicit approval/validation gate, bounded to at most three iterations, with the reviewed manual workflow retained as fallback. | None explicitly rejected. | owner-approved in this conversation but conditional on fresh validation and rollback readiness | Validate the reviewed `Repository_Command`, cost, failure behavior, bounded loop, matcher/trigger, side effects, and rollback before automatic execution. |
| OD-04 | repository owner | 2026-08-25 | **enable after validation with four-agent concurrent exception**: to reduce execution time for this feature, attempt native DAGs, parallel task waves, bounded review loops, and Cloud/Crew workflows after checks. For this feature only, permit up to four concurrent Implementation_Agents under disjoint declared file ownership, read/write scopes, File_Ownership_Reservation before mutation, Shared_Contract_Freeze before dependent work, no worktrees, explicit approval, named secrets/production/global/external-service Approval_Boundaries, and a single Integration_Validation_Gate after the wave. The exception does not modify `AGENTS.md`, the general repository one-agent rule, or authorize Crew worktrees, retries/replans, auto-approval, hidden spawning, or concurrency above four. Incompatible Crew behavior cannot be enabled without an approved repository-compatible design or an explicit owner-approved policy exception. | none explicitly rejected | owner-approved in this conversation but conditional on validation and rollback | Validate maximum active agents of four, disjoint read/write ownership, lock acquisition and conflict stop behavior, shared-contract freeze, no-worktree behavior, approval and boundary behavior, integration-gate execution including both reviewer checks, failure/partial/conflict/abandonment handling, iteration ceiling, and repository-rule compatibility separately; preserve prior state and provide a concrete rollback that releases reservations, disables the wave, and restores affected artifacts when compatibility is not proven. |
| OD-05 | repository owner | 2026-08-25 | **enable after validation** for all reviewed local and installed powers, with a repository-local fallback and a disposition for each legacy or plugin format. | None explicitly rejected. | owner-approved in this conversation but conditional on fresh validation and rollback readiness | Perform the repository-answer check first; validate loading, routing, format, permissions, provenance, and rollback for each power before activation. |
| OD-06 | repository owner | 2026-08-25 | **enable after validation** for all reviewed external MCP and network capabilities, each with a named service, data boundary, secret/permission boundary, and revocation path. | None explicitly rejected. | owner-approved in this conversation but conditional on fresh validation and rollback readiness | Record an `Approval_Boundary`, validate the service and data path on the selected surface, and do not transmit secrets or project data without the named approval and rollback action. |
| OD-07 | repository owner | 2026-08-25 | **enable after validation** for reviewed custom agents and bounded subagents, including required resource URIs, DAG/review-loop limits, and explicit approval behavior. | None explicitly rejected. | owner-approved in this conversation but conditional on fresh validation and rollback readiness | Validate configuration, surface availability, resource URIs, maximum concurrency, iteration ceiling, failure behavior, and rollback before adoption. |
| OD-08 | repository owner | 2026-08-25 | **enable after validation** for all six local skills (`repo-map`, `graph-impact`, `verify-and-gate`, `fork-boundaries`, `focss-css`, and `db-migrations`), with exactly one designated primary `Repository_Guidance_Skill`; activation scope may be always-on, on-demand, or slash-command eligible only after validation. | None explicitly rejected. | owner-approved in this conversation but conditional on fresh validation and rollback readiness | Validate every `SKILL.md` manifest, scope, overlap resolution, prerequisite, and activation behavior; record the one primary authority and rollback for changes. |
| OD-09 | repository owner | 2026-08-25 | **enable after validation** for named user/global Kiro configuration changes in addition to repository-local `.kiro` scope; every setting and path must be named before application. | None explicitly rejected. | owner-approved in this conversation but conditional on fresh validation and rollback readiness | Create an `Approval_Boundary`, capture and back up pre-change state, validate permissions and precedence, and restore the backup on rollback; unspecified global changes remain out of scope. |
| OD-10 | repository owner | 2026-08-25 | **enable after validation** using the required artifact, repository, schema, documentation, selected-surface, security, rollback, and handover checks, with known gaps explicitly dispositioned. | None explicitly rejected. | owner-approved in this conversation but conditional on fresh validation and rollback readiness | Record each `Validation_Run`, both test lanes when applicable, owner sign-off, limitations, blockers, evidence state, and the final `Rollback_Path` before granting enabled-valid status. |

### Owner-decision summary

The repository owner selected enable-after-validation for all reviewed capabilities and selected surfaces, including IDE, CLI, compatible Web/Mobile, external MCP/network capabilities, named user/global Kiro configuration, custom agents/subagents, native graph/task/review workflows, and Cloud/Crew. No option was explicitly rejected. The selection authorizes attempted enablement only after fresh validation, the applicable `Approval_Boundary`, and rollback readiness; it does not convert documented, historical, registered, or unverified evidence into compatibility proof. OD-04 additionally permits a maximum of four concurrent Implementation_Agents only for this feature's validated Concurrent_Implementation_Wave; this scoped exception does not change the general repository one-agent rule or `AGENTS.md`.

The repository safeguards remain binding: documentation alone cannot trigger secrets, permission broadening, external network access, global settings, worktrees, or production-impacting actions, and multi-agent execution is permitted only through the exact validated OD-04 exception. Each such action requires a fresh validation and its own `Approval_Boundary`. Graph-impact automation is limited to at most three iterations. Hooks must pass schema and behavior checks, and the LTM hook remains disabled until its stub is implemented and validated. Native and Cloud/Crew workflows require an explicit compatibility decision and rollback path; incompatible Crew worktree, concurrency, retry/replan, or auto-approval behavior remains disabled unless an approved repository-compatible design or an explicit owner-approved policy exception exists. The OD-04 wave must use disjoint ownership reservations, a frozen shared contract, no worktrees, no hidden spawning, no automatic retries/replans, and one post-wave Integration_Validation_Gate with both reviewer checks.

## Official documentation coverage boundary

The review uses official sitemap and search results to discover current candidates. The supplied catalog and the following families are mandatory starting points, not proof that every page has been read:

- Product and operation: `/docs/`, `/docs/how-kiro-works/`, installation, authentication, first project.
- Surfaces: `/docs/ide/`, `/docs/cli/`, `/docs/web/`, `/docs/mobile/`, `/docs/cloud-sessions/`.
- Configuration and security: `/docs/configuration/`, `/docs/permissions/`, `/docs/kiroignore/`, `/docs/privacy-and-security/`, `/docs/crew/security/`.
- Skills and steering: `/docs/steering/`, `/docs/crew/capabilities/steering/`, `/docs/skills/`, `/docs/crew/capabilities/skills/`.
- Hooks: `/docs/hooks/`, hook types/actions/examples/management/best-practices/troubleshooting, IDE hook updates, and CLI v3 hook migration.
- Agents and tools: custom-agent overview, built-in/creating/configuration-reference/subagents/examples/troubleshooting, tools, built-in tools, settings, CLI commands, and slash commands.
- MCP and powers: MCP overview/configuration/servers/usage/tool-search/examples/security/registry, powers, power installation, and power creation.
- Specs and execution: specs, feature specs, requirements-first, tech-design-first, bugfix specs, quick specs, plans, analyze requirements, correctness, best practices, and Crew Task Runner.
- Context and continuity: compaction, checkpoints, CLI chat/session management/context, Crew memory, and Crew knowledge.
- Version and workspace configuration: CLI v3, migration guide, new features, permissions, hook migration, agent configuration, CLI 2.x reference, Crew configuration, Crew agents, and Crew agent templates.

For every discovered candidate, the Coverage_Matrix records URL, current title, family, date, surface, applicability, key convention, version sensitivity, Evidence_Provenance, disposition, and validation action. The completion statement must say: “Complete review covers all relevant current official pages recorded in the Coverage_Matrix; it does not claim that every Kiro webpage was read.”

### Initial exclusion register

These entries are excluded from local repository adoption unless an owner decision changes the scope. The entries remain review records and are not silently omitted from coverage:

| Candidate family/page type | Initial exclusion reason | Reconsideration trigger |
|---|---|---|
| Product billing, pricing, marketing, and unrelated integrations | No repository-local onboarding, configuration, execution, continuity, security, or maintenance effect. | Owner adds a related external-service or product-management scope. |
| Crew Task Runner and Crew execution pages describing worktrees, up to three concurrent runs, retries/replans, or auto-approval | Crew was uninstalled and the documented behavior conflicts with the no-worktree rule, the default one-agent rule, and explicit-approval requirements. The scoped OD-04 exception allows only validated disjoint implementation work for this feature; it does not authorize Crew worktrees, retries/replans, auto-approval, or general concurrency. | Owner approves a repository-compatible design and named surface. |
| Crew memory and Crew knowledge pages | Crew capabilities do not prove that the local LTM capture implementation works. | A supported local implementation and fresh validation are available, or the owner selects Crew. |
| Crew-only configuration, steering, skills, agent, and agent-template pages | Crew-specific scope is not the observed IDE/project scope. | Owner selects Cloud/Crew as an Active_Surface. |
| Web/Mobile global-configuration and hook behavior | Official documentation states that Web/Mobile do not use global config and do not support hooks. | Owner selects Web or Mobile and requests a surface-specific review. |

A page that is unavailable, redirected, contradictory, or impossible to match to an Active_Surface is not excluded as non-applicable; the page receives an Unverified_Finding with attempted source, limitation, owner, and next Validation_Run.

## Requirements

### Requirement 1: Establish an honest review boundary

**User Story:** As a repository maintainer, I want the documentation review boundary stated precisely, so that a narrow review cannot be presented as a complete Kiro review.

#### Acceptance Criteria

1. WHEN a review run starts, THE Guidance_Auditor SHALL record the current-run discovery method, ISO review date, selected Active_Surface, and official sitemap or official-site search results in the Source_Inventory.
2. WHEN a current-run discovery method identifies a candidate, THE Guidance_Auditor SHALL create a Source_Inventory entry and a Coverage_Matrix entry before using the candidate as decision evidence.
3. IF a candidate concerns billing, marketing, an unrelated integration, or an out-of-scope Crew capability, THEN THE Guidance_Auditor SHALL record the candidate in the Exclusion_Register with a scope reason and reconsideration trigger and SHALL classify the candidate as excluded rather than unavailable.
4. IF a candidate is relevant to the selected Active_Surface and is inaccessible, redirected, contradictory, or impossible to match to a surface, THEN THE Guidance_Auditor SHALL create an Unverified_Finding with source, attempted date, limitation, owner, and next Validation_Run and SHALL classify the candidate as unavailable rather than excluded.
5. WHEN a review is reported complete, THE Handover_Generator SHALL state that Complete_Review covers all relevant current official pages recorded in the Coverage_Matrix, SHALL list unavailable candidates, and SHALL state that the review does not claim that every Kiro webpage was read.
6. IF validation evidence, required owner approval, or Rollback_Path readiness is missing for a proposed enablement, THEN THE Configuration_Validator SHALL block enablement and SHALL record the missing condition.

### Requirement 2: Audit repository guidance and the existing Kiro baseline

**User Story:** As a repository maintainer, I want current repository authority and Kiro artifacts inventoried, so that onboarding uses verified context instead of historical assumptions.

#### Acceptance Criteria

1. WHEN setup assessment begins, THE Guidance_Auditor SHALL inspect `AGENTS.md`, `START.md`, `README.md`, `CONTENTS.md`, `DOC-MAP.md`, `HANDOVER.md`, applicable `Agents/*`, canonical `docs/*`, active `plans/*`, and the visible Kiro_Workspace and SHALL assign each source exactly one status: `present and readable`, `present but unreadable`, `absent`, or `unknown`.
2. WHEN setup assessment begins, THE Guidance_Auditor SHALL create one inventory entry for every visible Kiro_Skill, Steering_File, Hook_Manifest, Kiro_Power, Custom_Agent, MCP_Service configuration, specification, permission configuration, ignore configuration, and relevant setting and SHALL assign the same four-value status set to each entry.
3. WHEN Guidance_Sources conflict, THE Guidance_Auditor SHALL record every claim, source, Evidence_Provenance, authority rank, selected claim, and unresolved impact using this order: user instruction, live code and fresh commands, `AGENTS.md`, `Agents/*`, and canonical `docs/*`; active plans, onboarding notes, handover notes, and historical evidence SHALL remain contextual unless a higher-authority source selects them.
4. WHEN the baseline inventory completes, THE Guidance_Auditor SHALL map every artifact to owner, Configuration_Scope, activation condition, Canonical_Source, evidence state, proposed Capability_Disposition, and exactly one maintenance-risk value from `low`, `medium`, `high`, or `unknown with reason`.
5. WHEN the baseline contains current-run observations and earlier claims, THE Guidance_Auditor SHALL label current-run observations fresh with date, source, and result and SHALL label earlier claims historical with a required fresh Validation_Run before enablement.
6. WHEN the skill inventory is created, THE Skill_Configurator SHALL treat `repo-map`, `graph-impact`, `verify-and-gate`, `fork-boundaries`, `focss-css`, and `db-migrations` as exactly the initial candidate set and SHALL assign each named skill one status from `present and readable`, `present but unreadable`, `absent`, or `unknown` without substitution.
7. IF exact-scope owner approval, fresh evidence, or a reversible pre-change state is missing for an inventory disposition, THEN THE Configuration_Validator SHALL block enablement and SHALL preserve the prior artifact state.

### Requirement 3: Record source provenance and coverage

**User Story:** As a repository maintainer, I want every relevant Kiro convention traceable to evidence, so that future Kiro changes can be reviewed without guessing.

#### Acceptance Criteria

1. WHEN an official Kiro page is reviewed, THE Guidance_Auditor SHALL record URL, canonical URL when different, title, Official_Documentation_Family, displayed publication or update date, ISO review date, availability, per-surface and per-version applicability, Version_Sensitive_Claim status, Evidence_Provenance, and Capability_Disposition.
2. WHEN a repository convention is derived from an official page, THE Guidance_Auditor SHALL link the convention to Source_Inventory and Canonical_Source, record the supporting passage and surface/version, and classify local compatibility as Unverified until a fresh Validation_Run passes.
3. WHEN official documentation, repository observation, or installed configuration conflicts, THE Guidance_Auditor SHALL preserve every source with source, date, surface, version, Evidence_Provenance, result classification, rationale, and impact.
4. WHEN an external skill, power, MCP_Service, or configuration source is considered, THE Guidance_Auditor SHALL record provenance, exact revision/version or unavailable, license/source or unavailable, trust decision, integrity result, required secrets or `none-declared`, required permissions or `none-declared`, owner approval, current-surface Validation_Run, and Rollback_Path.
5. IF provenance, version, license, integrity, trust, required-boundary, owner-approval, current-validation, or rollback evidence is missing or fails, THEN THE Guidance_Auditor SHALL not adopt the source and SHALL classify it as deferred or Unverified with the missing check and next action.
6. WHEN official documentation is unavailable, contradictory, version-sensitive, or incompatible with live repository behavior, THE Guidance_Auditor SHALL preserve the last working convention supported by observation or validation, record the limitation, surface, version, owner, and next action, and classify any replacement as Unverified or deferred.

### Requirement 4: Establish surfaces, versions, and migration limits

**User Story:** As a maintainer, I want compatibility stated per Kiro surface and version, so that IDE evidence is not silently applied to CLI, Web, Mobile, or Crew.

#### Acceptance Criteria

1. WHEN the compatibility inventory is created, THE Surface_Compatibility_Reviewer SHALL create exactly one compatibility record for each of IDE, CLI 2.x, CLI 3.x, Web, Mobile, Cloud/Crew, and Local_Repository_Surface.
2. WHEN a compatibility record is created, THE Surface_Compatibility_Reviewer SHALL classify the capability as applicable, not applicable with a reason, or Unverified and SHALL record documented behavior, observed behavior, evidence freshness, Version_Sensitive_Claim status, validation action, and enablement status for that surface/version.
3. WHEN local validation begins, THE Surface_Compatibility_Reviewer SHALL record the Kiro IDE session as the observed Active_Surface and SHALL record fresh `kiro-cli-chat 2.19.1` evidence only for CLI 2.x; THE Surface_Compatibility_Reviewer SHALL not transfer that evidence to CLI 3.x, Web, Mobile, Cloud/Crew, or another surface.
4. WHEN a migration guide changes an existing artifact, THE Capability_Configurator SHALL record current behavior, target behavior, prerequisites, compatibility evidence, migration action, affected surface/version, and Rollback_Path before applying the migration.
5. IF a surface/version lacks a fresh Validation_Run after the relevant change, THEN THE Configuration_Validator SHALL classify that surface/version as Unverified and SHALL block its enablement and compatibility claim.
6. WHEN handover is produced, THE Handover_Generator SHALL include a Surface_Compatibility_Statement naming every selected surface, observed evidence, unsupported and Unverified claims, migration constraints, and links to fresh Validation_Run evidence.

### Requirement 5: Map configuration, permissions, and security boundaries

**User Story:** As a repository owner, I want Kiro scope and permission precedence understood before changes, so that repository guidance cannot widen access or override a security boundary.

#### Acceptance Criteria

1. WHEN configuration and security scope is assessed, THE Configuration_Configurator SHALL inventory scope, applicability, access, and actions for global `~/.kiro`, project `.kiro`, agents, workspace-root permissions, user permissions, and external services for each selected surface.
2. WHEN configuration or permission precedence is assessed, THE Configuration_Configurator SHALL record documented precedence separately from observed precedence and SHALL record deny-overrides-allow as observed, Unverified, or contradicted with evidence.
3. WHEN fresh permission validation runs for a selected surface, THE Configuration_Configurator SHALL test an allowed action, a denied action, a prompted action, and a restricted action where each state is applicable and SHALL record the result and prompt or restriction.
4. WHEN a proposed change affects global configuration, KIRO_HOME, permission breadth, a private credential, or an external service, THE Guidance_Configurator SHALL create an Approval_Boundary record containing scope, requested change, owner approval, and pre-change state before application.
5. IF required approval, fresh validation, Rollback_Path readiness, or security-boundary confirmation is missing, THEN THE Guidance_Configurator SHALL block the change and SHALL leave unrelated resources unchanged.
6. WHEN `.kiroignore` is assessed, THE Capability_Configurator SHALL record protected content, surface, documented behavior, observed behavior, validation action, and Rollback_Path.
7. WHEN rollback is run for a configuration or permission change, THE Configuration_Validator SHALL record whether the recorded pre-change state was restored successfully or unsuccessfully.

### Requirement 6: Select skills and steering without duplicate authorities

**User Story:** As a future agent, I want repository skills and steering to activate at the right scope, so that onboarding receives useful context without duplicated instructions.

#### Acceptance Criteria

1. WHEN a Kiro_Skill or Steering_File is evaluated, THE Skill_Configurator SHALL assign exactly one disposition from `retain`, `update`, `merge`, `add`, `retire`, `observe`, or `defer` and SHALL record Evidence_Provenance.
2. WHEN an onboarding or handover gap is confirmed, THE Skill_Configurator SHALL designate exactly one Repository_Guidance_Skill as the primary entry point and SHALL record the designation and reason.
3. WHEN the primary Repository_Guidance_Skill or another selected skill is validated, THE Skill_Configurator SHALL verify a `SKILL.md` Skill_Manifest whose `name` matches the folder and whose specific `description` states purpose, activation, and scope and SHALL record Canonical_Source files, root commands, constraints, and activation scope.
4. IF OD-08 is not recorded, THEN THE Skill_Configurator SHALL not classify a skill or steering file as auto-discovered, on-demand, slash-command, or always-on.
5. WHEN a Kiro_Skill overlaps a Steering_File or another Kiro_Skill, THE Skill_Configurator SHALL retain exactly one authoritative rule path and SHALL record a merge, delegation, retirement, or rejection result for every other path.
6. IF a skill requires an unavailable script, package, power, MCP_Service, secret, permission, or network service, THEN THE Skill_Configurator SHALL record the prerequisite and SHALL block activation until the prerequisite has owner approval and fresh Validation_Run evidence.
7. WHEN a skill activation is proposed, THE Configuration_Validator SHALL require a documented Rollback_Path and a successful rollback validation before classifying the activation as enabled-valid.

### Requirement 7: Assess and safely disposition hooks

**User Story:** As a maintainer, I want hooks to be useful, schema-valid, narrow, and reversible, so that automation does not create unsafe or noisy repository behavior.

#### Acceptance Criteria

1. WHEN existing Hook_Manifests are assessed, THE Hook_Configurator SHALL create one record for every hook definition containing Hook_Event, Hook_Matcher, Hook_Action type, enabled state, hook-level timeout, dependencies, surface availability, overlap, owner, and Rollback_Path.
2. WHEN a Hook_Manifest is validated, THE Configuration_Validator SHALL accept it only when it is standalone `.kiro/hooks/*.json` JSON with version `v1`, PascalCase triggers, a command or agent action, command JSON on stdin when applicable, a target-only narrow matcher, hook-level `timeout`, and hook-level boolean `enabled`.
3. WHEN `domain-fast-check.json` is assessed, THE Hook_Configurator SHALL classify an action-level `timeout` placement as Unverified, SHALL leave the hook disabled, and SHALL require schema repair and a fresh post-repair hook Validation_Run before enablement.
4. WHEN stored hook commands are inspected, THE Hook_Configurator SHALL record semicolon separators as the current repository evidence and SHALL classify a PowerShell `&&` error as unrelated unless fresh evidence identifies the same stored command.
5. WHERE OD-02 approves automatic execution and a verified repository benefit exists, THE Hook_Configurator SHALL limit an Approved_Hook to a supported event, a narrow target-only matcher, a reviewed Repository_Command, a named owner, a hook-level timeout from 1 through 120 seconds, and no secret, production-data, or unrelated-file write.
6. IF a hook dependency, command, prompt, script, external service, surface, or version is unavailable or unvalidated, THEN THE Hook_Configurator SHALL leave the hook disabled and SHALL record the remediation required for enablement.
7. WHEN a file hook is considered, THE Hook_Configurator SHALL record that file-hook evidence covers agent-made changes only unless fresh evidence proves coverage of user-made file changes.
8. WHEN enabled hooks overlap on an event and resource, THE Hook_Configurator SHALL remove duplicate work or SHALL record distinct purpose, order independence, measured combined runtime, and owner approval before retaining the overlap.
9. WHEN an Approved_Hook blocks, changes, or validates work, THE Hook_Configurator SHALL record the disable action, failure signal, surface, owner, expected side effects, and Rollback_Path and SHALL validate the rollback path.
10. WHEN the LTM capture hook depends on the documented stub, THE Hook_Configurator SHALL keep the hook disabled until the implementation is verified and a fresh execution Validation_Run passes.

### Requirement 8: Assess powers, MCP, tools, custom agents, and subagents

**User Story:** As a repository maintainer, I want extension paths assessed before routing or configuration, so that automation uses supported capabilities without uncontrolled access.

#### Acceptance Criteria

1. WHEN a power is assessed, THE Capability_Configurator SHALL classify its format as exactly one of `Legacy_POWER`, `Agent_Plugin`, `Both`, or `Neither` from `POWER.md` and `plugin.json` presence and SHALL record its migration or retain path.
2. WHEN the local `oando-workflow` power is assessed, THE Capability_Configurator SHALL record `POWER.md`, empty `mcp.json`, absent `plugin.json`, and `registryId: local` as separate observations and SHALL keep activation Unverified until current Active_Surface validation confirms loading.
3. WHEN a local or installed power may route work, THE Capability_Configurator SHALL perform and record a repository-answer check classified as `Answered`, `Not_Answered`, or `Not_Testable` before external routing.
4. WHEN an external MCP_Service or power requires a registry, secret, permission, network, or external service, THE Capability_Configurator SHALL record the named service, data boundary, secret boundary, permission boundary, owner approval, validation action, and revocation or Rollback_Path.
5. IF owner approval or current-surface Validation_Run evidence is missing for an extension capability, THEN THE Capability_Configurator SHALL classify it as observe, defer, disable, or exclude and SHALL record it in the Known_Gaps_Register without an enabled claim.
6. WHEN a Custom_Agent is proposed, THE Capability_Configurator SHALL record configuration format, IDE availability, CLI availability, scope, activation, authority relationship, every applicable resource URI or `None`, validation action, pass condition, owner, and Rollback_Path.
7. WHEN a Subagent is proposed, THE Capability_Configurator SHALL record its DAG or review-loop graph, maximum concurrent agents, iteration ceiling, approval behavior, failure behavior, and repository-rule compatibility; THE Capability_Configurator SHALL reject adoption when any value is missing or incompatible.
8. WHEN a capability is unavailable or unvalidated on the Active_Surface, THE Configuration_Validator SHALL record the capability, evidence, owner, remediation, and next Validation_Run in the Known_Gaps_Register and SHALL classify the capability as Unavailable or Unverified.

### Requirement 9: Decide whether native execution and continuity capabilities fit repository rules

**User Story:** As a developer taking over the repository, I want specification, execution, context, and continuity behavior understood, so that Kiro workflows do not violate repository process rules.

#### Acceptance Criteria

1. WHEN specification and execution capabilities are assessed, THE Capability_Configurator SHALL create one separate assessment entry for each named capability: feature specification, bugfix specification, plans, correctness, analysis, best practices, native task graphs, parallel waves, Subagent DAGs, and review loops.
2. WHEN a specification or execution entry is created, THE Capability_Configurator SHALL record activation, inputs, outputs, dependencies, approvals, failure disposition, surface/version, validation, Rollback_Path, and a maximum concurrency of 0 or 1 for task graphs and waves under the default repository rule, or a maximum of four active Implementation_Agents only for the `kiro-repo-guidance-setup` implementation wave when every OD-04 exception condition is recorded and validated; review iterations SHALL remain from 0 through 3 for review loops.
3. WHEN Crew Task Runner behavior includes worktrees, more than one concurrent run, automatic retries or replans, or auto-approval, THE Capability_Configurator SHALL classify the behavior as deferred or excluded with conflict evidence and SHALL not make a compatibility or enabled claim.
4. WHEN continuity capabilities are assessed, THE Capability_Configurator SHALL create separate entries for local compaction, checkpoints/rewind, CLI session persistence, Crew memory, and Crew knowledge and SHALL record surface, scope, data boundary, retention or continuity limit, validation, evidence, version, and Rollback_Path for each entry.
5. WHEN handover is produced, THE Handover_Generator SHALL keep local capabilities and each Crew capability in separate records and SHALL not combine their evidence, compatibility, or data boundaries.
6. WHEN Crew memory or knowledge documentation is reviewed, THE Capability_Configurator SHALL classify the documentation as non-execution evidence and SHALL not use it as evidence that LTM_Capture works; THE Capability_Configurator SHALL keep LTM disabled until a fresh Active_Surface execution result exists.
7. IF a specification, task-runner, continuity, memory, or knowledge capability lacks a current-surface pass, required approval, repository compatibility, or Rollback_Path readiness, THEN THE Configuration_Validator SHALL classify it as Unverified or deferred and SHALL block enablement.
8. WHEN a Concurrent_Implementation_Wave is proposed for this feature, THE Capability_Configurator SHALL record no more than four active Implementation_Agents, each agent's disjoint declared file ownership, shared generated-output ownership, read/write scope, File_Ownership_Reservation, Shared_Contract_Freeze status, root-only `pnpm` scope, secrets/production/global/external-service Approval_Boundaries, and the single Integration_Validation_Gate before wave enablement.
9. WHEN an Implementation_Agent requests mutation during a Concurrent_Implementation_Wave, THE Configuration_Validator SHALL require a successful File_Ownership_Reservation for every target file and shared generated output and SHALL stop the agent on a missing, stale, duplicate, or conflicting reservation.
10. IF a Concurrent_Implementation_Wave requests more than four active Implementation_Agents, overlapping declared writes, mutation before Shared_Contract_Freeze, a worktree, hidden spawning, automatic retry or replan, or a mutation outside an agent's read/write scope, THEN THE Configuration_Validator SHALL block the affected wave and SHALL preserve the prior state.
11. WHEN all agents in a Concurrent_Implementation_Wave finish, THE Integration_Validation_Gate SHALL collect every agent output, run both reviewer checks, resolve ownership or integration conflicts, run the required repository validation, and determine enablement as one integrated result.
12. IF an agent fails, becomes partial or abandoned, or produces a conflict during a Concurrent_Implementation_Wave, THEN THE Configuration_Validator SHALL fail closed for the affected wave, SHALL prevent dependent enablement, SHALL prohibit automatic retry or replan, and SHALL preserve or restore the prior working state.

### Requirement 10: Resolve owner decisions before crossing approval boundaries

**User Story:** As a repository owner, I want unresolved choices surfaced before configuration changes, so that the final setup reflects deliberate governance rather than implied defaults.

#### Acceptance Criteria

1. WHEN the requirements review is presented to the owner, THE Handover_Generator SHALL record exactly OD-01 through OD-10 with selected option, rejected options, owner, decision date, approval status, validation action, Rollback_Path, and unresolved status where applicable and SHALL record the owner’s broad `enable after validation` decision.
2. WHEN a capability is proposed for enablement, THE Configuration_Validator SHALL mark the capability enabled only after scope-specific owner approval, fresh target-surface Validation_Run evidence, repository compatibility, and Rollback_Path readiness are recorded.
3. WHEN OD-01 is unresolved, THE Configuration_Validator SHALL limit compatibility claims to the observed IDE session and SHALL classify CLI 3.x, Web, Mobile, and Cloud/Crew claims as Unverified.
4. WHEN OD-02 is unresolved, THE Hook_Configurator SHALL preserve current hook states and SHALL not enable automatic command execution.
5. WHEN OD-03 is unresolved, THE Guidance_Configurator SHALL preserve the observed manual graph-impact loop and SHALL not add an automated loop or hook.
6. WHEN OD-04 is unresolved, THE Capability_Configurator SHALL preserve no worktrees, the default one-active-agent rule, and explicit approval and SHALL defer or exclude native DAGs, parallel waves, review loops, and Crew runner adoption; THE Capability_Configurator SHALL not use the four-agent exception.
7. WHEN OD-05, OD-06, or OD-07 is unresolved, THE Capability_Configurator SHALL leave affected powers, MCP, Custom_Agents, and Subagents in observe, defer, disable, or exclude status.
8. WHEN OD-08 is unresolved, THE Skill_Configurator SHALL preserve existing skill discovery and SHALL make no always-on claim.
9. WHEN OD-09 is unresolved, THE Guidance_Configurator SHALL leave global and user configuration unchanged and SHALL limit the plan to repository-local scope.
10. WHEN OD-10 is unresolved, THE Configuration_Validator SHALL use documented minimum gates provisionally and SHALL label the final handover bar Owner_Decision.
11. IF Crew worktree, concurrency, retry/replan, or auto-approval behavior lacks an approved repository-compatible design or an explicit owner-approved policy exception, THEN THE Capability_Configurator SHALL keep that behavior disabled.
12. WHEN OD-04 is approved for this feature, THE Configuration_Validator SHALL permit no more than four active Implementation_Agents only after disjoint declared file ownership, File_Ownership_Reservation, Shared_Contract_Freeze, read/write scope, no-worktree behavior, explicit approval, and the post-wave Integration_Validation_Gate are recorded and validated; THE Configuration_Validator SHALL not treat the exception as a change to `AGENTS.md` or the general repository rule.
13. IF a proposed OD-04 wave lacks an ownership reservation, detects an ownership conflict, exceeds four active Implementation_Agents, or requests hidden spawning, automatic retries/replans, or a worktree, THEN THE Configuration_Validator SHALL stop the affected action, record the pending or failed state, and leave unrelated resources unchanged.

### Requirement 11: Produce a complete capability disposition table

**User Story:** As a repository owner, I want every relevant capability to end in an explicit decision, so that the final setup remains small, understandable, and safe.

#### Acceptance Criteria

1. WHEN the capability audit completes, THE Capability_Configurator SHALL create exactly one Capability_Disposition_Table entry for every audited Kiro_Skill, Steering_File, Hook_Manifest, Custom_Agent, Subagent, Tool_Surface, MCP_Service, Kiro_Power, specification workflow, continuity capability, permission mechanism, ignore mechanism, and relevant configuration artifact.
2. WHEN an entry is created, THE Capability_Configurator SHALL populate non-empty disposition, Configuration_Scope, Canonical_Source, surface/version applicability, activation condition, owner, Approval_Boundary, evidence, validation action, expected side effects, and Rollback_Path fields and SHALL write `no rollback applies` for a no-change disposition.
3. WHEN a capability duplicates an existing artifact or authority path, THE Capability_Configurator SHALL retain exactly one canonical path and SHALL record a resolution for every non-authoritative path.
4. IF a capability is unverified, unavailable, insecure, unsupported, or stub-dependent, THEN THE Capability_Configurator SHALL assign observe, defer, disable, or exclude with reason and next action and SHALL leave the capability inactive.
5. IF fresh evidence, required approval, or Rollback_Path readiness is missing, THEN THE Configuration_Validator SHALL block enablement even when the disposition is `apply`, `retain`, `update`, `merge`, or `add`.
6. IF a capability would modify application source, dependencies, lockfiles, production data, secrets, or global configuration without specific approval, THEN THE Guidance_Configurator SHALL classify the change outside feature scope and SHALL leave unrelated resources unchanged.
7. WHEN a Capability_Disposition_Table entry covers a Concurrent_Implementation_Wave, THE Capability_Configurator SHALL record the feature-only scope, default one-agent policy, maximum of four active Implementation_Agents under OD-04, disjoint file and shared-output ownership, File_Ownership_Reservation mechanism, Shared_Contract_Freeze, no-worktree constraint, integration-gate owner, both reviewer checks, approval status, expected side effects, and Rollback_Path.
8. IF a capability disposition omits ownership, locking, integration-gate, failure, or rollback evidence for a proposed Concurrent_Implementation_Wave, THEN THE Configuration_Validator SHALL assign observe, defer, disable, or exclude and SHALL block enablement.

### Requirement 12: Validate artifacts and enablement claims

**User Story:** As a maintainer, I want configuration artifacts validated before enablement, so that malformed or unsupported guidance cannot silently degrade future sessions.

#### Acceptance Criteria

1. WHEN a Kiro configuration artifact changes, THE Configuration_Validator SHALL check type-specific manifest and schema rules, including exact `SKILL.md` folder/name matching, specific description, hook JSON syntax, version `v1`, PascalCase events, supported actions, target-only matcher, hook-level boolean `enabled`, hook-level `timeout` within schema bounds, referenced paths, scope, and surface applicability.
2. WHEN a Validation_Run executes, THE Configuration_Validator SHALL record action, Repository_Root or Active_Surface, scope, ISO UTC date, result, evidence, Unverified item, and blocker and SHALL record `none` when no blocker exists.
3. WHEN guidance or layout changes, THE Configuration_Validator SHALL run `pnpm run check:layout` and applicable documentation checks from Repository_Root.
4. WHEN a repository gate runs, THE Configuration_Validator SHALL record the gate result and SHALL record both Vitest lanes independently when `pnpm run test` is used.
5. WHEN a surface or version claim is affected by a change, THE Configuration_Validator SHALL run a new post-change Validation_Run for that surface/version before enablement and SHALL record surface, version, action, result, and limitation.
6. IF validation fails, THEN THE Configuration_Validator SHALL identify the exact artifact and failed rule, block enabled-valid status, and restore the prior working artifact or leave the failed artifact disabled.
7. WHEN enabled-valid status is granted, THE Configuration_Validator SHALL confirm that all enabled hooks parse, all designated skills have valid manifests, every activation has an owner, every disposition has evidence or explicit Unverified status, every blocking Known_Gaps_Register item has a disposition, and every enabled capability has rollback readiness.
8. IF compatibility is supported only by an official URL, registration entry, or historical document, THEN THE Configuration_Validator SHALL classify the compatibility as Unverified until fresh Active_Surface Validation_Run evidence passes.

### Requirement 13: Produce an operational handover with rollback and known gaps

**User Story:** As a developer taking over the repository, I want a concise and evidence-backed handover, so that I know what Kiro loads, what Kiro may run, which surface supports each claim, and how to undo changes.

#### Acceptance Criteria

1. WHEN the configuration plan reaches handover, THE Handover_Generator SHALL enumerate every artifact with exactly one disposition from `installed`, `retained`, `updated`, `merged`, `added`, `deferred`, `observed`, `retired`, `excluded`, or `disabled` and SHALL record evidence and reason for each artifact.
2. WHEN the Handover_Record is produced, THE Handover_Generator SHALL record the ordered first-read path `START.md`, `AGENTS.md`, applicable `Agents/*`, and canonical `docs/*`, followed by the single Repository_Guidance_Skill, Steering_File scopes, Hook_Manifests, power and MCP boundaries, Custom_Agents and Subagents, and Active_Surface.
3. WHEN the Handover_Record is produced, THE Handover_Generator SHALL include Coverage_Matrix, Exclusion_Register, every Official_Documentation_Family status, and the Complete_Review statement and SHALL mark the review incomplete when any in-scope family lacks status or evidence and SHALL list the unresolved item.
4. WHEN the Handover_Record is produced, THE Handover_Generator SHALL include Surface_Compatibility_Statement, Configuration_Precedence_Map, Capability_Disposition_Table, owner approval decisions, and evidence-state labels.
5. WHEN a changed artifact is handed over, THE Handover_Generator SHALL record the command, expected success signal, observed evidence, limitation, owner, maintenance trigger, Rollback_Path, and rollback verification result.
6. WHEN a Known_Gaps_Register item remains, THE Handover_Generator SHALL record evidence, owner, next Validation_Run, blocked action, and disposition and SHALL label every Unverified_Finding explicitly Unverified.
7. WHEN historical and fresh evidence coexist, THE Handover_Generator SHALL separate the evidence and SHALL make no build, test, browser, hook, Active_Surface, or external-service success claim without fresh validation.
8. IF approval, current validation, or rollback readiness is absent for a global, external, secret-bearing, permission-broadening, application, dependency, or production change, THEN THE Handover_Generator SHALL record the change as outside scope, record that no change was made, and make no enabled claim.

### Requirement 14: Preserve repository authority, security, and maintainability

**User Story:** As a repository owner, I want guidance setup changes to remain safe and maintainable, so that onboarding improvements do not create secret exposure, configuration drift, or competing sources of truth.

#### Acceptance Criteria

1. IF an update contains a secret, token, private URL, personal data, or production credential, THEN THE Guidance_Configurator SHALL reject the update, preserve the last approved content, and record the detection.
2. WHEN a command artifact is added or updated, THE Hook_Configurator SHALL use an existing or reviewed Repository_Command or repository-local script and SHALL record owner, Repository_Root working directory, timeout from 1 through 3600 seconds, and side effects.
3. WHEN a guidance or capability artifact is updated, THE Handover_Generator SHALL record the Canonical_Source check, review trigger, validation action, Active_Surface, owner, Rollback_Path, and post-change evidence.
4. IF an official Kiro convention or Active_Surface changes, THEN THE Guidance_Auditor SHALL reevaluate affected skills, steering, hooks, powers, agents, MCP, permissions, ignore mechanisms, specification workflows, and continuity capabilities before enablement.
5. THE Guidance_Configurator SHALL preserve root-only `pnpm` usage, no worktrees, the default one-active-agent repository rule, the feature-scoped OD-04 exception of no more than four active Implementation_Agents with disjoint ownership and validated locks, production read-only filesystem behavior, mode-aware persistence, two-database routing, Studio/Planner fork isolation, both test lanes, and required repository gates; THE Guidance_Configurator SHALL not modify `AGENTS.md` to grant the exception.
6. WHEN a repository-wide rule is added or updated, THE Guidance_Configurator SHALL record one Canonical_Source, Configuration_Scope, activation reason, maintainer owner, surface applicability, and validation evidence before enablement and SHALL require other artifacts to reference rather than duplicate that rule.
7. IF a rule is not confirmed by live code, a fresh command, or a higher-authority source, THEN THE Guidance_Configurator SHALL label the rule Unverified.
8. IF a proposed action crosses an Approval_Boundary, THEN THE Configuration_Validator SHALL stop the action, record pending status, and leave resources unchanged until owner approval exists.
9. IF owner approval, fresh target-surface evidence, repository compatibility, or Rollback_Path readiness is missing, THEN THE Configuration_Validator SHALL block enablement.
10. WHEN an OD-04 Concurrent_Implementation_Wave is prepared, THE Guidance_Configurator SHALL require a Shared_Contract_Freeze before dependent agents start, a File_Ownership_Reservation before every mutation, read/write scopes for every Implementation_Agent, no shared generated-output writes, no hidden spawning, and one Integration_Validation_Gate after the concurrent wave.
11. IF ownership conflict, missing lock, shared-file mutation, shared-generated-output mutation, agent failure, partial completion, abandonment, or integration conflict occurs, THEN THE Guidance_Configurator SHALL stop the affected agent or wave, SHALL fail closed, and SHALL preserve or restore prior state without enabling dependent work.
12. IF a proposed concurrent wave exceeds four active Implementation_Agents or attempts a worktree, automatic retry, automatic replan, or concurrency outside the OD-04 feature scope, THEN THE Configuration_Validator SHALL reject the action and SHALL record that the general repository one-agent rule remains unchanged.

## Conservative assumptions

- The user’s “skiro” reference means Kiro.
- “Install” means repository-local Kiro guidance/configuration under `.kiro` by default; named user/global settings, external MCP/network capabilities, and other non-local changes may be attempted only after fresh validation, the applicable `Approval_Boundary`, and a rollback-ready pre-change state.
- The selected validation target includes IDE, CLI 2.x, CLI 3.x, Web/Mobile where compatible, Cloud/Crew, and the Local_Repository_Surface; each surface/version requires separate fresh evidence, and the `kiro-cli-chat 2.19.1` observation does not validate CLI 3.x, Web, Mobile, or Cloud/Crew behavior.
- Existing `.kiro` skills, steering, powers, agents, and hooks receive an evidence-backed disposition; owner approval permits enable-after-validation attempts but does not establish compatibility or bypass schema, security, scope, or rollback checks.
- The six observed local skills are the complete initial candidate set, all six are selected for enable-after-validation consideration, and exactly one is designated as the primary `Repository_Guidance_Skill`; this is not an instruction to add duplicates of `repo-map`.
- The existing LTM hook remains disabled because the capture implementation is documented as a stub; Crew memory and knowledge documentation does not change that status. The hook may be enabled only after the implementation is verified and a fresh execution succeeds.
- The local `oando-workflow` power remains a legacy-format and activation-unverified candidate until fresh validation establishes loading or an approved migration to an Agent Plugin is validated; owner approval permits the attempt but does not prove activation.
- The repository authority order remains user > live code and fresh commands > `AGENTS.md` > `Agents/*` > canonical `docs/*`; official Kiro documentation describes Kiro behavior but does not override repository rules.
- The graph-impact process may be automated after OD-03’s approved checks and validation gate, using a reviewed `Repository_Command`, matcher, timeout, side-effect policy, rollback path, and a maximum of three iterations; the observed manual loop remains the fallback.
- Native DAGs, parallel waves, bounded review loops, and Cloud/Crew workflows may be attempted after OD-04 validation. The general repository default remains one active agent and no worktrees; only this feature's OD-04 Concurrent_Implementation_Wave may use up to four active Implementation_Agents, with disjoint declared file ownership, File_Ownership_Reservation before mutation, Shared_Contract_Freeze before dependent work, root-only `pnpm`, explicit approvals, no shared generated-output writes, and one Integration_Validation_Gate after the wave. Incompatible Crew worktree, concurrency, retry/replan, or auto-approval behavior cannot be enabled without an approved repository-compatible design or policy exception.
- The OD-04 concurrent exception is a scoped owner decision dated 2026-08-25, not a repository-wide rule and not an `AGENTS.md` change. Overlapping execution means time-overlapping independent work, not overlapping writes to the same resource. Agents must stop on ownership conflict; more than four active agents, hidden spawning, worktrees, automatic retries/replans, and dependent work before Shared_Contract_Freeze are prohibited. Failed, partial, conflicting, or abandoned agents fail closed for the affected wave and preserve prior state; the integration gate records all agent outputs, runs both reviewer checks, resolves conflicts, and controls enablement.
- No secret, permission broadening, external network, global setting, worktree, production-impacting action, or multi-agent execution outside the exact validated OD-04 exception may occur merely from documentation; each requires fresh validation and its own `Approval_Boundary`, with no unrelated resources changed.
- No requirement author may invent a successful command, browser result, hook execution, active-surface compatibility result, or external-service operation; every such claim requires a fresh `Validation_Run`.
