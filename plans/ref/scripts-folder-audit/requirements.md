# Requirements Document

## Introduction

This feature defines a read-only audit of the repository `scripts/` folder and a detailed, actionable plan for making the scripts toolchain maintainable, discoverable, safe, and correctly wired. The audit is a planning capability, not an implementation change. The future audit plan SHALL be produced as `plans/ref/scripts-folder-audit.md`, following the repository's existing plan-reference convention.

The audit SHALL cover every visible file under `scripts/`, including root-level scripts and nested families such as `scripts/general/`, `scripts/AsNeeded/`, `scripts/codemods/`, `scripts/generate-svg/`, `scripts/kiro-repo-guidance-setup/`, and `scripts/lib/`. The audit SHALL also inspect the live wiring that makes scripts callable: root `package.json`, `scripts/run-ops.mjs`, `scripts/ops-command-registry.mjs`, `scripts/tsconfig.json`, applicable documentation, and `.github/workflows/`.

The current repository facts that anchor this requirements document are:

- `scripts/general/README.md` defines `scripts/general/` as the home for gate-critical install, layout, release-gate, build/start environment, and documentation-sync scripts. The README distinguishes `scripts/AsNeeded/` one-shots, seed/database helpers, and bulk audits from gate-critical scripts.
- `scripts/run-ops.mjs` owns the operational command map and dispatches Node, `tsx`, PowerShell, Python, Playwright, and pnpm invocations through helpers such as `runNode`, `runGeneral`, `runAsNeeded`, `runTsx`, `runPlaywright`, and `runPnpmScript`.
- `scripts/ops-command-registry.mjs` derives the visible ops command names from the `COMMANDS` map in `scripts/run-ops.mjs`; the audit SHALL verify this relationship rather than assume that package and ops names are interchangeable.
- `scripts/tsconfig.json` includes TypeScript, JavaScript, and MJS files and uses the repository's root configuration as its base.
- The live CI workflow set includes release-gate, site-ui, Supabase backup to R2, and tech-docs workflows. The scheduled Supabase backup workflow invokes `pnpm run ops backup:supabase:r2` with named database and R2 secret inputs.
- The repository process floor requires root-only `pnpm`, user-invoked tests and gates, a read-only production filesystem, mode-aware persistence wrappers, Admin-versus-Products database separation, migration dry runs before application, and rollback-aware operational changes.

The requirements deliberately distinguish observed repository facts from audit findings, recommendations, owner decisions, and unverified claims. The audit SHALL not infer ownership, safety, active status, or runtime correctness from a filename alone.

## Glossary

- **Scripts_Audit**: The read-only audit activity that inventories the repository scripts toolchain and produces the Audit_Plan.
- **Audit_Plan**: The future Markdown deliverable at `plans/ref/scripts-folder-audit.md` containing findings, priorities, dependencies, proposed remediation, and validation handoff.
- **Repository_Root**: The checkout root from which repository-local `pnpm` commands and paths are resolved.
- **Script_Artifact**: Any visible file, directory-contained fixture, configuration, helper, or executable source under `scripts/` that may affect the scripts toolchain.
- **Script_Family**: A coherent location or purpose grouping such as root scripts, `general`, `AsNeeded`, `codemods`, `generate-svg`, `kiro-repo-guidance-setup`, `lib`, or a family discovered during the audit.
- **Audit_Perspective**: One of the four required lenses: Inventory_and_Ownership, Wiring_and_Discoverability, Safety_and_Environment, or Documentation_and_Governance.
- **Inventory_Record**: A record describing one Script_Artifact, its role, family, runtime, inputs, outputs, dependencies, side effects, and evidence.
- **Ownership_Record**: A record naming the evidence-backed maintainer, proposed owner, or explicitly unknown owner for a Script_Artifact or Script_Family.
- **Wiring_Record**: A record connecting a Script_Artifact to a Package_Command, Ops_Command, direct caller, documentation entry, CI_Workflow, or no known entry point.
- **Safety_Record**: A record of the targets, permissions, environment controls, secrets, safeguards, and rollback conditions associated with a Script_Artifact.
- **Governance_Record**: A record of documentation, naming, placement, lifecycle, review, deprecation, and source-of-truth controls for a Script_Artifact or Script_Family.
- **Evidence_Record**: A traceable reference to a file path, line range, command definition, workflow entry, or other live repository source.
- **Evidence_State**: One of `Observed`, `Documented`, `Inferred`, `Unverified`, or `Blocked`; `Observed` requires live repository evidence, while `Inferred` requires an explicit inference from recorded evidence.
- **Entry_Point**: A callable path into a Script_Artifact, including a root package command, an Ops_Command, a direct runtime invocation, a lifecycle hook, or a CI_Workflow step.
- **Package_Command**: A command declared in the root `package.json` `scripts` object.
- **Ops_Command**: A command name handled by the `COMMANDS` map in `scripts/run-ops.mjs` and normally invoked through `pnpm run ops <name>`.
- **Ops_Registry**: `scripts/ops-command-registry.mjs`, which derives Ops_Command names from `scripts/run-ops.mjs`.
- **CI_Workflow**: A workflow definition under `.github/workflows/` that invokes, schedules, or supplies environment values to a script entry point.
- **Gate_Critical**: A script explicitly documented as part of install, layout, release-gate, build/start environment, documentation synchronization, or another protected repository control path.
- **One_Shot**: A script intended for occasional, focused execution rather than a recurring product or gate path.
- **Shared_Helper**: A reusable script module, especially under `scripts/lib/`, imported by multiple entry points or families.
- **Support_Artifact**: A fixture, golden, JSON catalog, SQL seed, configuration file, generated metadata file, or other non-entry source that supports a script path.
- **Destructive_Operation**: An operation that deletes, overwrites, migrates, backfills, seeds, restores, renames, or otherwise changes persistent data, files, buckets, credentials, or repository state.
- **Production_Affecting_Operation**: An operation that can target production databases, production storage, deployments, live external services, production credentials, or production filesystem paths.
- **External_Service**: A database, Supabase project, R2 bucket, Vercel deployment, CDN, GitHub secret store, email provider, AI service, or other service outside the local process.
- **Secret_Boundary**: The named credential, token, private URL, or permission boundary required to access an environment or External_Service; secret values are never part of an audit record.
- **Environment_Profile**: A named execution context such as local development, CI, preview, staging, production, or a `DEV_AUTH_BYPASS`-controlled disk mode.
- **Database_Target**: The database or project selected by a script. The repository defines the Admin database as holding staff/customer data, plans, profiles, handoffs, teams, price books, queries, audit, furniture, and descriptors, and the Products database as holding the marketing catalog, configurator, flags, and themes.
- **Risk_Level**: One of `critical`, `high`, `medium`, `low`, or `unknown with reason`, based on impact and control evidence.
- **Priority_Level**: One of `P0`, `P1`, `P2`, or `P3`, where P0 addresses production or secret safety, P1 addresses broken or misleading execution wiring, P2 addresses discoverability and maintainability, and P3 addresses low-risk cleanup.
- **Plan_Item**: One actionable recommendation in the Audit_Plan with evidence, owner, priority, dependencies, acceptance signal, safety gate, and rollback path.
- **Dependency**: A prerequisite relationship between Script_Artifacts, commands, packages, environment controls, documentation, owners, or validation actions.
- **Implementation_Wave**: An ordered group of future Plan_Items that can be implemented after its prerequisites and approval boundaries are satisfied.
- **Rollback_Path**: A concrete reversible action that restores the prior artifact, command wiring, documentation, or operational state.
- **Non_Test_Validation**: A static, structural, type, lint, documentation, governance, secret-scan, or other repository check that does not execute a test suite, build, deployment, database operation, or production operation.
- **Validation_Handoff**: The user-facing record of future validation commands, prerequisites, expected signals, side effects, owners, and deferred execution status.
- **Canonical_Source**: The one repository file or live source selected as authoritative for a rule, command, ownership statement, or script description.
- **Implementation_Owner**: The maintainer or team authorized to carry a future Plan_Item through design, implementation, and validation.
- **Approval_Boundary**: The point at which owner approval is required before a Plan_Item changes production data, secrets, permissions, External_Service state, global configuration, package dependencies, or CI behavior.

## Requirements

### Requirement 1: Establish an honest audit boundary and deliverable

**User Story:** As a repository maintainer, I want the scripts audit to have a precise boundary and evidence model, so that a partial scan is not presented as a complete toolchain assessment.

#### Acceptance Criteria

1. WHEN the audit begins, THE Scripts_Audit SHALL record `Repository_Root`, an audit scope that explicitly lists included and excluded items, the inspection method used, and each visible repository input consulted as evidence before recording any finding.
2. THE Scripts_Audit SHALL create one `Inventory_Record` for every visible `Script_Artifact` under `scripts/` and one `Wiring_Record` for every live `Entry_Point` found in `package.json`, `scripts/run-ops.mjs`, `scripts/ops-command-registry.mjs`, repository documentation, or `.github/workflows/`; each record SHALL identify its source and target, and any source reference whose target is absent or not established SHALL be recorded as `Unverified` rather than as a live `Entry_Point`.
3. WHERE the future plan is produced, THE Audit_Plan SHALL be written at `plans/ref/scripts-folder-audit.md` and SHALL contain exactly one non-empty section for each of the four `Audit_Perspective` values—`Inventory_and_Ownership`, `Wiring_and_Discoverability`, `Safety_and_Environment`, and `Documentation_and_Governance`—a finding register containing every finding, a dependency ordering that places each established prerequisite before its dependent item and labels any unresolved dependency, and a `Validation_Handoff` that lists future validation commands, prerequisites, expected signals, side effects, owners, and deferred execution status.
4. WHEN a repository fact supports a finding, THE Scripts_Audit SHALL attach at least one traceable `Evidence_Record` that identifies the source and location and exactly one `Evidence_State` selected from `Observed`, `Documented`, `Inferred`, `Unverified`, or `Blocked` to that finding.
5. IF the inspected sources do not establish a claim, THEN THE Scripts_Audit SHALL classify the claim as `Unverified` for insufficient inspected evidence or `Blocked` for an unavailable or inaccessible required source, record the missing evidence, and assign one next investigation action naming the source or observation required to establish the claim.
6. WHILE the audit is being prepared, THE Scripts_Audit SHALL perform no operation that writes, deletes, renames, overwrites, installs, updates, or otherwise modifies application source, package dependencies, lockfiles, CI definitions, environment values, secrets, production data, or operational state.

### Requirement 2: Complete inventory and ownership across all script families

**User Story:** As a maintainer, I want every script and supporting artifact to have an explicit role and owner status, so that the toolchain is maintainable and future work has a clear handoff.

#### Acceptance Criteria

1. WHEN a Script_Artifact is inspected, THE Scripts_Audit SHALL create exactly one Inventory_Record for its repository-relative path, and the record SHALL contain a value or an explicit indication that no value applies or was identified for each of: file type, Script_Family, intended role, runtime, inputs, outputs, side effects, imported dependencies, and known Entry_Points.
2. WHEN a Script_Family is assigned to a Script_Artifact, THE Scripts_Audit SHALL record exactly one family classification as root tools, `scripts/general/`, `scripts/AsNeeded/`, `scripts/codemods/`, `scripts/generate-svg/`, `scripts/kiro-repo-guidance-setup/`, `scripts/lib/`, or a discovered family with a distinct identifier, and SHALL attach at least one supporting Evidence_Record reference.
3. WHEN `scripts/general/` is assessed, THE Scripts_Audit SHALL compare the Script_Artifacts located in or assigned to `scripts/general/` with the membership listed in `scripts/general/README.md` and SHALL record every mismatch, including each gate-critical Script_Artifact without a matching README entry and each Script_Artifact in `scripts/general/` classified as non-gate, with its path and supporting Evidence_Record.
4. WHEN an Evidence_Record identifies a maintainer for a Script_Artifact, THE Scripts_Audit SHALL create or update an Ownership_Record that names the maintainer and references that Evidence_Record as the supporting source.
5. IF a Script_Artifact or Script_Family has no Evidence_Record identifying a maintainer, THEN THE Scripts_Audit SHALL set its owner status to `unknown`, link an ownership Plan_Item to the affected artifact or family, and state the unresolved ownership decision required from a repository maintainer.
6. WHEN a Shared_Helper has at least two distinct Entry_Points importing it, THE Scripts_Audit SHALL record all consuming paths, define fan-in as the count of distinct direct importers, record fan-out as the complete set of direct dependencies used by the helper, identify each side effect shared across consuming paths, and record exactly one proposed Implementation_Owner.
7. IF an Evidence_Record supports any of the statuses `orphaned`, `duplicated`, `stale`, `unreachable`, `generated`, `fixture-only`, or `mislocated` for a Script_Artifact, THEN THE Scripts_Audit SHALL preserve one finding for each supported status, including the artifact path, supporting path evidence, Evidence_State, impact, proposed disposition, and a statement of the owner decision required.
8. THE Audit_Plan SHALL contain exactly one inventory row for each distinct Script_Artifact identified by the Scripts_Audit, including support artifacts that are not directly executable, and each row SHALL include the artifact path and a reference that resolves to its Inventory_Record.

### Requirement 3: Reconcile commands, packages, direct callers, and CI wiring

**User Story:** As a developer, I want each callable script to be discoverable through one correct invocation path, so that commands do not silently drift from their implementation or automation.

#### Acceptance Criteria

1. WHEN root command wiring is inspected, THE Scripts_Audit SHALL create one Wiring_Record for each discovered Package_Command and SHALL record the command name, referenced Script_Artifact and whether it resolves, runtime, declared arguments or that none are declared, required working directory or that none is declared, and expected observable output or side effect or that none is declared.
2. WHEN Ops_Command wiring is inspected, THE Scripts_Audit SHALL create one Wiring_Record for each entry in `scripts/run-ops.mjs` `COMMANDS` and SHALL trace the entry from its command name through the dispatcher to its terminal invocation, recording the applicable Node, `tsx`, PowerShell, Python, Playwright, or pnpm runtime and target, arguments, and working-directory assumption.
3. WHEN the Ops_Registry is inspected, THE Scripts_Audit SHALL compare the set of registry-derived command names with the set of keys in the live `COMMANDS` map, SHALL record every missing or extra name, and SHALL record each forwarding or discoverability discrepancy with its affected registry name and `COMMANDS` key.
4. WHEN a CI_Workflow is inspected, THE Scripts_Audit SHALL create one Wiring_Record for each workflow job and SHALL record its trigger, job identifier, invoked Package_Command or Ops_Command or that none is invoked, working directory, runtime setup, configured schedule or manual-dispatch behavior or that neither is configured, environment variable names, Secret_Boundaries, timeout in seconds or that no timeout is configured, and artifact handoff source and destination or that none is configured.
5. WHEN a documentation or direct invocation reference is found, THE Scripts_Audit SHALL link it to exactly one Wiring_Record and SHALL assign exactly one classification using this order: `stale` when its target or required arguments do not match live wiring; `unsupported` when it is not declared as supported by package, Ops, registry, or CI wiring; `canonical` when it is the selected preferred invocation; otherwise, `duplicated` when it reaches the same callable Script_Artifact through an additional invocation path.
6. IF an Entry_Point references a Script_Artifact that is missing, renamed, mislocated, incompatible with its declared runtime or arguments, or absent from required registration, THEN THE Scripts_Audit SHALL create one P1 Plan_Item for that Entry_Point and SHALL record the broken path or reference, affected caller, observable impact, owner, dependency, and proposed correction, using `unassigned` or `none identified` when an owner or dependency cannot be determined.
7. IF a callable Script_Artifact has no discoverable Entry_Point, THEN THE Scripts_Audit SHALL classify it as `unreferenced` when no direct invocation evidence is found or as `direct-only with evidence` when direct invocation evidence exists without a registered or documented Entry_Point, SHALL record the evidence or its absence, and SHALL propose exactly one decision: retain, document, relocate, or retire.
8. THE Audit_Plan SHALL assign exactly one preferred invocation that resolves to every retained callable Script_Artifact, SHALL mark that invocation as canonical, and SHALL list every additional alias or duplicate invocation path with either a consolidation action or an explicit justification for retaining it.
9. WHEN argument or environment forwarding is present, THE Scripts_Audit SHALL record in the affected Wiring_Record the accepted flags, each flag's default or that no default is declared, the forwarding boundary identifying caller and receiver, and each caller-specific assumption.

### Requirement 4: Assess destructive, production-affecting, and environment-sensitive behavior

**User Story:** As a repository owner, I want risky scripts identified with explicit controls, so that future implementation work cannot accidentally alter production data, storage, deployments, or credentials.

#### Acceptance Criteria

1. WHEN a Script_Artifact is found to perform a write, delete, migration, seed, backfill, upload, restore, deployment, synchronization, or credential change, THE Scripts_Audit SHALL assign `Destructive_Operation` when the operation can change or remove data, storage, configuration, or credentials, assign `Production_Affecting_Operation` when the operation targets a production resource or production credential, assign both when both conditions apply, and record at least one traceable evidence reference supporting each assigned classification.
2. WHEN a Script_Artifact has been assigned `Destructive_Operation` or `Production_Affecting_Operation`, THE Scripts_Audit SHALL create a Safety_Record containing an entry for every identified target resource and recording the Database_Target or External_Service, Environment_Profile, required inputs, flags, Secret_Boundaries by name only, dry-run or preview mode, confirmation control, idempotency evidence, backup requirement, failure behavior, and Rollback_Path; the record SHALL state `not applicable` with a reason for any item that does not apply and SHALL identify any item that is unavailable rather than leaving it blank.
3. WHEN a Script_Artifact identifies one or more Database_Targets, THE Scripts_Audit SHALL classify each target as `Admin`, `Products`, or `unknown` with a recorded reason, using the repository database ownership rules and the inspected Script_Artifact evidence, and SHALL record the evidence used for each classification.
4. WHEN an environment reference is inspected, THE Scripts_Audit SHALL record, for each referenced variable, its name, source scope, default behavior, and environment assumption; it SHALL record `unknown` with a reason when the source scope or assumption cannot be determined, record `no default` when no default is defined, and record no secret values from `.env.local`, `site/.env.local`, CI secrets, or the process environment.
5. IF a Script_Artifact classified as `Destructive_Operation` or `Production_Affecting_Operation` lacks a target guard that restricts execution to the identified target, a dry-run or preview path that does not mutate target state, an approval boundary before execution, backup or recovery evidence, or an identified Rollback_Path, THEN THE Scripts_Audit SHALL record every missing control, create a blocking safety Plan_Item, and assign Risk_Level `critical` when the affected target is production or the operation changes a credential, deployment, or restored state, and otherwise assign Risk_Level `high`.
6. IF a Script_Artifact can write or delete production filesystem state directly, or can bypass the repository's mode-aware persistence boundary, THEN THE Scripts_Audit SHALL record a policy finding identifying the observed behavior and the violated production read-only or mode-aware write rule, and SHALL propose owner review as a prerequisite before implementation.
7. WHERE a Plan_Item concerns database migration application, THE Audit_Plan SHALL include a separate dry-run handoff entry labeled `Products` or `Admin` for each targeted database before any apply action for that target, and SHALL include a rollback reference.
8. WHERE a Plan_Item concerns deployment, bucket mutation, backup restoration, secret synchronization, catalog mutation, or production authentication, THE Audit_Plan SHALL include an Approval_Boundary identifying the required approval before execution, a named owner, an explicit environment selection, recovery evidence describing how affected state can be restored, and a validation step requiring explicit user invocation, and SHALL mark execution as blocked until all of these items are recorded.
9. THE Audit_Plan SHALL label each risk finding and its supporting evidence as static identification or execution evidence, and SHALL make no claim that any risky Script_Artifact was safely executed during the audit.

### Requirement 5: Evaluate documentation, governance, and discoverability controls

**User Story:** As a developer taking over the repository, I want script conventions documented in one discoverable place, so that future contributors can select safe commands without reverse-engineering source files.

#### Acceptance Criteria

1. WHEN the documentation review begins, THE Scripts_Audit SHALL inspect and record an inspection result for `scripts/general/README.md`, every root-level document designated for onboarding or process guidance, every applicable file under `Agents/`, every canonical document under `docs/`, `package.json`, every workflow definition, and comments in each audited script; each result SHALL state whether the source covers the audited Script_Artifact or command and whether the source is canonical, supporting, or not established as authoritative.
2. WHEN a distinct documented rule or command is identified, THE Scripts_Audit SHALL create exactly one Governance_Record for it containing non-empty values for Canonical_Source, audience, scope, maintenance owner, review trigger, and Evidence_State, together with a links field that lists related Entry_Points or explicitly records that none were identified.
3. WHEN two or more inspected sources describe the same Script_Artifact or command, THE Scripts_Audit SHALL designate exactly one source as Canonical_Source and SHALL record every other source separately with exactly one status: duplicate, stale, contradictory, or supporting.
4. IF any one of the following fields—purpose, safe invocation, maintenance owner, lifecycle state, or maintenance trigger—cannot be found through the Script_Artifact's Governance_Record and linked Canonical_Source, THEN THE Scripts_Audit SHALL create one P2 Plan_Item for each absent field, and each Plan_Item SHALL identify the Script_Artifact, the missing field, and a proposed documentation location.
5. WHEN placement or naming is assessed for a Script_Family, THE Scripts_Audit SHALL record the family's classification, the current location of each member, and a pass/fail result against each applicable documented naming rule and placement rule; the placement rules SHALL include gate-critical files in `scripts/general/`, one-shot files in `scripts/AsNeeded/`, reusable helpers in `scripts/lib/`, and protected publish paths at stable root locations only when a reviewed source documents both their protected status and required location.
6. IF a reviewed naming or placement rule conflicts with a live product import, gate contract, or workflow reference, THEN the Audit_Plan SHALL record the conflicting rule, each affected dependency, and a migration option that keeps each affected dependency valid until it is updated, and SHALL place documentation remediation in a plan item separate from any later code-move plan item.
7. WHEN the audit plan is finalized, THE Audit_Plan SHALL define a discoverability index or catalog with an entry for every retained Script_Artifact; each entry SHALL provide purpose, preferred invocation, risk, owner, dependencies, validation, and a reference to the artifact's Governance_Record or Canonical_Source, marking any unavailable field as unknown rather than omitting it.
8. WHEN governance gaps are prioritized, THE Scripts_Audit SHALL assign each retained Script_Artifact at least one lifecycle label from the following set: active, gate-critical, one-shot, helper, fixture, deprecated candidate, or unknown; when available evidence does not support another label, it SHALL assign unknown, and it SHALL define the observable evidence required to add, remove, or change each assigned label.
9. THE Audit_Plan SHALL contain a separate, non-optional governance entry for each of these constraints: `pnpm` commands run from the repository root only; tests and gates are user-invoked; the production filesystem is read-only; persistence is mode-aware; databases remain separated; migrations retain rollback; and Studio/Planner forks remain isolated. Each entry SHALL state that no proposed documentation or migration action may contradict the constraint.

### Requirement 6: Prioritize findings and sequence dependencies into an actionable plan

**User Story:** As a repository owner, I want findings ordered by risk, leverage, and dependency, so that later implementation can proceed in safe, reviewable waves.

#### Acceptance Criteria

1. WHEN a finding is accepted into the Audit_Plan, THE Scripts_Audit SHALL create exactly one Plan_Item for that finding and SHALL populate the identifier, primary Audit_Perspective, path references, Evidence_State, impact, Risk_Level, Priority_Level, Implementation_Owner, dependency list, proposed action, acceptance signal, safety gate, and Rollback_Path fields with non-blank values.
2. WHEN a Priority_Level is assigned, THE Scripts_Audit SHALL assign the highest-priority applicable level in this order: P0 for production, credential, or irreversible safety exposure; P1 for broken or misleading execution wiring; P2 for discoverability, ownership, documentation, or maintainability gaps; and P3 for cleanup that does not address any P0, P1, or P2 condition.
3. WHEN dependencies are mapped, THE Scripts_Audit SHALL record, for each dependency, the prerequisite item and dependent item, the affected files or commands, the status of the owner, environment, approval, and validation dependencies, and whether a cycle or unresolved dependency exists; for each dependency type and cycle state that does not apply, THE Scripts_Audit SHALL record an explicit not-applicable or none state.
4. WHEN future work is sequenced, THE Audit_Plan SHALL assign every unblocked Plan_Item to exactly one ordered Implementation_Wave and SHALL place Plan_Items addressing production, credential, or irreversible safety exposure in an earlier wave than Plan_Items changing broken or misleading execution wiring; SHALL place those wiring Plan_Items in an earlier wave than cleanup Plan_Items that depend on discoverability; and SHALL place documentation Plan_Items only after the ownership decision for the relevant source is recorded as confirmed.
5. IF a Plan_Item has no recorded Implementation_Owner, an unresolved dependency or cycle, no recorded Approval_Boundary, or no recorded acceptance signal, THEN THE Audit_Plan SHALL mark the Plan_Item `blocked`, record each missing or unresolved item, and exclude the Plan_Item from executable sequencing.
6. WHEN two or more Plan_Items reference the same Script_Artifact, shared helper, command map, workflow, or documentation source, THE Audit_Plan SHALL record one ownership handoff for that shared item and SHALL either record an explicit predecessor-successor ordering between the Plan_Items or replace them with one combined work item.
7. THE Audit_Plan SHALL include one prioritization summary that identifies the first safe Implementation_Wave as the lowest-numbered wave containing only unblocked Plan_Items with resolved mapped prerequisites, lists every Plan_Item assigned to a later wave as deferred or explicitly states that none is deferred, identifies every dependency whose prerequisite and dependent Plan_Items are assigned to different waves, and records a specific blocker, dependency, approval, or ordering reason for each deferred Plan_Item. If no safe Implementation_Wave exists, the summary SHALL state that no safe wave exists and identify the blocking condition.
8. IF a proposed remediation would change application production code, dependencies, lockfiles, secrets, production data, or global configuration without an Approval_Boundary that explicitly authorizes that change, THEN THE Audit_Plan SHALL classify the remediation as outside scope and SHALL retain the current state unchanged.

### Requirement 7: Produce a complete, traceable planning deliverable

**User Story:** As an implementation team, I want a plan that connects findings to evidence and acceptance signals, so that later work can be executed without repeating the audit from scratch.

#### Acceptance Criteria

1. WHEN the audit plan is finalized, THE Audit_Plan SHALL contain each of the following as a separately identifiable component, with none omitted: an executive summary; scope and method; current facts; exactly four Audit_Perspective sections; an inventory listing every Script_Artifact identified within the stated audit scope; a wiring matrix; a safety register; a documentation and governance register; a priority register; a dependency map; Implementation_Waves; open decisions; out-of-scope items; and Validation_Handoff.
2. WHEN a finding is reported, THE Audit_Plan SHALL assign each assertion in the finding text or table an explicit classification from this list: observed fact, documented policy, inference, recommendation, owner decision, or unverified claim; assertions with different classifications SHALL be separately identifiable.
3. WHEN a Plan_Item is proposed, THE Audit_Plan SHALL provide separately identifiable entries for an affected path or command, intended outcome, implementation boundary, required owner, prerequisite, expected evidence, acceptance signal, safety control, and Rollback_Path; the affected path or command entry SHALL identify at least one path or command, and every other entry SHALL contain a non-empty value or explicitly state that it is not applicable or unresolved, with unresolved entries cross-referenced to the open-decision register.
4. WHEN a Script_Artifact is retained without remediation, THE Audit_Plan SHALL provide separately identifiable, non-empty entries for the retention reason, owner, preferred invocation, supporting evidence, and future review trigger; the future review trigger SHALL specify a date, event, or condition, and the supporting evidence SHALL identify the evidence for the retention decision.
5. WHEN a Script_Artifact is recommended for relocation, consolidation, retirement, or wrapper creation, THE Audit_Plan SHALL list every identified affected caller, package command, Ops_Registry behavior, CI reference, and rollback dependency and SHALL associate each listed item with an ordered step in the proposed sequence; each item SHALL be preserved or have its planned disposition and associated rollback dependency explicitly recorded, and each category with no affected item SHALL be recorded as having none identified.
6. IF an Audit_Perspective has no finding, THEN THE Audit_Plan SHALL include a no-finding record that identifies the inspected scope, the inspection coverage, and the reason for the clean result, with the reason linked to at least one evidence reference.
7. THE Audit_Plan SHALL include an explicit statement that the audit deliverable guides later implementation only and does not itself authorize changes to code, packages, CI, environment, database, deployment, or production.
8. THE Audit_Plan SHALL include a separately identifiable open-decision register with an entry for every unresolved item concerning owners, command naming, lifecycle status, safety controls, documentation authority, or implementation sequencing; each entry SHALL identify its category and unresolved decision, and the register SHALL explicitly state when any listed category has no unresolved item.

### Requirement 8: Provide a non-test validation and implementation handoff

**User Story:** As a maintainer implementing the approved plan later, I want a precise non-test validation handoff, so that each change can be checked without guessing which repository guard applies.

#### Acceptance Criteria

1. WHEN a Plan_Item reaches the Validation_Handoff, THE Validation_Handoff SHALL contain a non-empty record of Repository_Root, each command or manual inspection, affected scope, prerequisite environment, expected success signal, side effects, owner, rollback check result, and execution status for each listed check.
2. WHEN a future change affects script layout or plan references, THE Validation_Handoff SHALL list `pnpm run check:layout` and every plan or documentation purity check whose documented scope includes the affected change, record Repository_Root as the starting location for each listed check, and label each check as user-invoked.
3. WHEN a future change affects TypeScript, JavaScript, or MJS under `scripts/`, THE Validation_Handoff SHALL list `pnpm run typecheck:scripts` and every lint or static check whose documented scope includes the affected files, and SHALL identify each as a conditional, user-invoked check from Repository_Root.
4. WHEN a future change affects secret-bearing references or environment controls, THE Validation_Handoff SHALL list each applicable secret scan and environment/static inspection whose documented scope includes the affected change, label each as user-invoked, and SHALL not copy, print, or otherwise include any secret value.
5. WHEN a future change affects a Studio or Planner boundary, THE Validation_Handoff SHALL list `pnpm run scan:boundaries` as a conditional, user-invoked check, name the affected boundary, and state the dependency or ownership relationship that makes the check applicable.
6. IF a proposed validation command would execute a test, gate, coverage collection, build, deployment, database operation, browser suite, any other command intended to validate software behavior, or any command that changes production or persistent data, THEN THE Validation_Handoff SHALL label the command `deferred to explicit user invocation`, record its prerequisite conditions and possible impact, and SHALL NOT execute the command during the audit.
7. THE Validation_Handoff SHALL contain a statement that, during this requirements phase, no tests, gates, coverage collection, builds, deployments, database operations, browser suites, or other commands intended to validate software behavior or change production or persistent data were executed.
8. WHEN a validation check has not been run by the audit, THE Validation_Handoff SHALL set that check's execution status to `not run by audit` and record the reason, responsible user or owner, and the named phase or event at which the check may next be invoked explicitly by that user or owner.
9. THE Audit_Plan SHALL, for each Implementation_Wave, identify the minimum non-test validation set by mapping every affected concern to at least one named check, and SHALL NOT require a full-repository gate when a named narrower static check covers that same concern.

### Requirement 9: Preserve safety, scope, and evidence integrity during the planning effort

**User Story:** As a repository owner, I want the audit itself to remain low-risk, so that planning does not change the system it is supposed to evaluate.

#### Acceptance Criteria

1. THE Scripts_Audit SHALL perform inspection without modifying any existing source, configuration, data, database, deployment, external service, or environment state, and SHALL write no artifact other than the requirements-first spec artifact or, when authorized by this feature in a subsequent phase, the future Audit_Plan document.
2. IF an inspection step would require reading a secret value, using a production credential, accessing private data, opening a database connection, performing a deployment action or external mutation, or changing environment state, THEN THE Scripts_Audit SHALL not perform that step during the audit, SHALL record it as blocked when explicit owner approval is absent or as an owner-approved follow-up when explicit owner approval is recorded, and SHALL leave all affected state unchanged.
3. IF a source contains a secret, token, private URL, credential, or personal-data value, THEN THE Scripts_Audit SHALL record only the source path, variable name, or redacted evidence that identifies the finding, and SHALL exclude the corresponding sensitive value from every audit artifact.
4. WHEN a command path is evaluated, THE Scripts_Audit SHALL evaluate it as an invocation from the repository root using `pnpm` only and SHALL record every path, shell, platform, runtime, or package-manager dependency required for that invocation, including any absence or mismatch that would prevent it from running.
5. WHEN an audit finding or planned follow-up concerns production filesystem behavior, database placement, or migration handling, THE Audit_Plan SHALL state all of the following repository rules without omission or contradiction: Admin data and furniture/descriptors remain in the Admin database; marketing catalog data remains in the Products database; production filesystem writes use mode-aware wrappers; and migrations require a dry-run step before application and rollback handling.
6. IF an evidence source conflicts with a live fact or repository rule identified as higher authority for the audit, THEN THE Scripts_Audit SHALL retain both sources subject to the redaction rule in criterion 3, SHALL base the audit conclusion on the higher-authority source, and SHALL record the conflict and either the affected finding, scope, command status, or follow-up, or that none of those is affected.
7. THE Audit_Plan SHALL list every command and operational action deliberately not performed during the audit and SHALL state that static inspection does not establish runtime safety or production validation.
8. WHEN the requirements phase completes, THE Scripts_Audit SHALL stop after producing the requirements-first spec artifact and SHALL defer design, implementation tasks, code changes, and operational execution to subsequent workflow phases without producing or performing them during the requirements phase.

## Four audit perspectives

The future audit SHALL use exactly these four primary perspectives. A finding may carry secondary tags, but every finding SHALL have one primary perspective.

1. **Inventory_and_Ownership**: What exists, where it lives, what role it serves, who maintains it, and whether lifecycle status is known.
2. **Wiring_and_Discoverability**: How scripts are invoked through package commands, `run-ops`, the derived registry, direct callers, documentation, and CI workflows, and whether one preferred path is discoverable.
3. **Safety_and_Environment**: What data, files, databases, deployments, credentials, and external services a script can affect, and which environment, approval, preview, dry-run, backup, and rollback controls exist.
4. **Documentation_and_Governance**: Which source is canonical, how conventions are documented, how ownership and lifecycle are maintained, and how future changes are reviewed and validated.

## Out of scope for this phase

- Editing any file under `scripts/`, `site/`, `tests/`, `config/`, `.github/workflows/`, or any other production or automation source.
- Changing `package.json`, the lockfile, CI workflows, environment files, secrets, permissions, database schema, database contents, storage, deployments, or external services.
- Running tests, gates, coverage, builds, deployments, database commands, browser suites, development servers, or other test-like or production-affecting commands.
- Reading or copying secret values from `.env.local`, `site/.env.local`, CI configuration, process environment, or editor state.
- Treating a filename, historical note, command registration, or documentation entry as proof of runtime correctness or ownership without live evidence.

## Conservative assumptions

- The four Audit_Perspective names above are the required structure; a later design phase may refine table columns without changing the four primary lenses.
- `plans/ref/scripts-folder-audit.md` is the future plan location because the live repository uses `plans/ref/` for plan and audit references. A later workflow phase may record an owner-approved path adjustment if repository conventions change.
- Current facts about `scripts/general/README.md`, `run-ops`, the derived Ops_Registry, `scripts/tsconfig.json`, root Package_Commands, and the four CI_Workflows are starting evidence, not a claim that the audit is complete.
- Owner fields remain `unknown` until a live repository source or explicit maintainer decision supports an Ownership_Record.
- Static identification of a risky operation does not establish that the operation is safe, reversible, or approved.
- The later implementation plan may recommend changes, but each change remains subject to the repository's user-invoked validation policy, approval boundaries, database routing, production filesystem rules, and rollback requirements.
