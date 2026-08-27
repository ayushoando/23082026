it in# Scripts Folder Audit — Read-Only Evidence and Caller-Search Contract

## Purpose and boundary

This is a planning-only contract for the future `scripts/` folder audit. It records what evidence may be collected, how that evidence must be qualified, and the caller-search boundary required before any later classification or recommendation. It makes no file-state, caller, safety, ownership, deletion, archival-location, or runtime assertions.

**Repository root (recorded):** `D:\23082026`

**Visible scripts scope (planned; not inspected in this task):** repository-root `scripts/` and its descendants, limited to files visible to a later authorized read-only static audit. The scope does not extend to any file outside that directory merely because it may reference a script.

**Explicit exclusions:**

- `.archive/audit/` and everything below it are excluded from both audit inventory and caller-search conclusions.
- Secret-bearing material is excluded from inspection and reporting. This includes environment files, credential material, tokens, keys, connection strings, and values that could expose protected configuration.
- No runtime execution, mutation, deployment, database, storage, external-service, or production evidence is in scope for this planning task.

## Non-negotiable preservation policy

The later audit must preserve the following policy unchanged:

1. **No deletion.** This audit must not delete files, and it must not recommend deletion as an action taken by the audit.
2. **Live callers, gate-critical scripts, and shared helpers remain active.** Any evidence of those roles requires preservation as active material.
3. **`maybe` stays active and untouched.** A `maybe` classification is not permission to relocate, archive, edit, disable, or remove the file.
4. **Archive candidates remain active and untouched pending independent owner approval.** A candidate cannot be archived, moved, edited, disabled, or deleted by this audit.
5. **Archive location is owner-selected.** No archive location is presumed, selected, created, or used by this audit.
6. **`.archive/audit/` remains excluded.** Its exclusion is not evidence for or against any other file's status.

## Evidence-state legend

| State | Meaning | Permitted wording |
| --- | --- | --- |
| `RECORDED` | A source, scope, method, or action boundary has been recorded in this document. It is not an observation about repository contents. | “Recorded as planned/declared.” |
| `PLANNED` | A future authorized read-only activity or source consultation. No inspection has occurred. | “Planned; not yet inspected.” |
| `COMPLETED` | A specifically bounded action whose source, method, scope, and result have been recorded. | “Completed within the recorded scope.” |
| `NOT_PERFORMED` | An action deliberately not taken for this task. | “Not performed; no conclusion follows.” |
| `OUT_OF_SCOPE` | Material or action excluded by this contract. | “Excluded; no conclusion follows.” |
| `UNVERIFIED` | A statement awaiting evidence from an authorized later review. | “Unverified.” |

No evidence state may be silently upgraded. In particular, `PLANNED`, `NOT_PERFORMED`, `OUT_OF_SCOPE`, and `UNVERIFIED` are never substitutes for `COMPLETED` evidence.

## Assertion classes

| Assertion class | Definition | Constraints |
| --- | --- | --- |
| `Contractual` | A process, scope, exclusion, or preservation rule stated in this document. | Does not describe repository contents or runtime behavior. |
| `Inventory` | A future factual record that a file exists at a specified path. | Requires a completed, recorded read-only inventory method and scope. |
| `Static-reference` | A future textual or structural observation that a source refers to a script/path/name. | Requires the exact searched source set, pattern/criterion, exclusions, and observed result. |
| `Caller-absence` | A future conclusion that no caller was found. | May apply **only** to the completed recorded caller-search scope; it never means “no callers exist anywhere.” |
| `Role/classification` | A future reasoned classification, such as live, gate-critical, shared helper, maybe, or archive candidate. | Requires supporting evidence and must preserve the non-negotiable policy above. |
| `Runtime-safety` | A claim about executable behavior, operational safety, or production effect. | Prohibited from static evidence alone. Static review does **not** establish runtime safety. |

## Static inspection method (planned)

A later review may use read-only static inspection only. For every consulted source, it must record:

- normalized repository-relative path and source category;
- the audit date/time and reviewer;
- the method used (for example, file inventory, text search, manifest-reference review, workflow-reference review, or source import/process-spawn review);
- search terms/patterns and the identifier/path variants considered;
- whether the source was fully searched, partially searched, unreadable, excluded, or not present;
- matching lines or an appropriately redacted summary when a match is relevant;
- the completed Caller_Search_Scope identifier to which a result belongs;
- limitations, including generated files, dynamic construction, indirect invocation, external callers, untracked files, ignored files, and runtime-only behavior.

Static inspection is limited to evidence collection. It must not execute scripts or project commands, modify files, infer runtime safety, or expose secret values.

## Intended consulted sources (all `PLANNED`, not inspected)

The later authorized audit should consult the following categories only as read-only static evidence, subject to the exclusions and redaction rules below:

1. **Audit governance and task source** — `plans/scripts-folder-audit/tasks.md`, its associated requirements/design artifacts, and this planning contract, to preserve acceptance criteria and policy.
2. **Scripts inventory** — `scripts/` recursively, excluding `.archive/audit/` if encountered through any path relationship; record paths and non-sensitive metadata only.
3. **Package/command manifests** — repository package manifests and lock/configuration entries only insofar as they define or reference project scripts. Do not report registry credentials, URLs containing credentials, or secret values.
4. **Automation and workflow definitions** — CI, release, deployment, scheduled, and local automation definitions that may reference scripts. Secrets, secret expressions, and protected values must not be inspected or reproduced.
5. **Repository source and configuration** — non-secret source, configuration, documentation, and operational metadata that may statically reference a script path, command name, or helper. Dynamic/external mechanisms must be marked as limitations, not resolved by assumption.
6. **Gate and quality configuration** — non-secret definitions that may establish a script as gate-critical or shared. A static reference alone is not runtime proof.
7. **Ownership evidence** — non-secret ownership metadata, maintainer guidance, or explicit owner statements, if available, for later independent owner approval. Absence of such evidence does not establish owner approval.

No source in this list has been opened, searched, read, or otherwise inspected for this task.

## Caller_Search_Scope register

### Completed scope — `CSS-0` (`NOT_PERFORMED`)

- **Scope name:** No completed caller search.
- **Included sources:** None.
- **Excluded sources:** All repository sources; `.archive/audit/`; all secret-bearing material; all external systems and runtime contexts.
- **Method:** None.
- **Search variants:** None.
- **Result:** No caller search was performed.
- **Permitted conclusion:** None about callers, liveness, gate criticality, sharing, archival suitability, or runtime safety.

A caller-absence assertion applies **only to a completed recorded Caller_Search_Scope**. Since `CSS-0` contains no searched sources and no completed search method, it supports no caller-absence assertion.

### Planned scope — `CSS-1` (`PLANNED`)

- **Scope name:** Repository-static caller search for visible `scripts/` candidates.
- **Candidate universe:** Files later inventoried under the planned visible scripts scope, excluding `.archive/audit/`.
- **Planned searched sources:** the intended consulted source categories listed above, excluding secret-bearing material; the candidate file itself may be examined only for static helper/entry-point context.
- **Planned identifier variants:** repository-relative script path; extensionless path when meaningful; basename; declared package-script name; command invocation forms; and non-secret helper/export identifiers where statically visible.
- **Planned method:** Read-only searches/reviews recorded per source and candidate, with all omissions, unreadable inputs, dynamic patterns, and excluded material stated explicitly.
- **Required output per candidate:** positive references, searched-source coverage, exclusions, limitations, evidence state, and no broader conclusion than the completed scope permits.
- **Scope limitation:** A later “no caller found” result would mean only that no qualifying static caller was found in the completed, recorded `CSS-1` source set. It cannot prove no runtime, external, dynamically constructed, generated, ignored, untracked, or otherwise unsearched caller exists.

`CSS-1` is not completed by this document.

### Completed scope — `CSS-2` (`COMPLETED`; package-manifest portion only)

- **Scope name:** Root package-command static wiring; this is a completed subset of the future caller search, not a replacement for `CSS-1`.
- **Included sources:** exactly `package.json:5-102`, plus the reached literal routes in `tech-docs-generator/package.json:6-18` and `workers/oando-worker-proxy/package.json:5-9`.
- **Excluded sources:** every other manifest/source/workflow/documentation/import/direct invocation, generated/ignored/untracked/external/runtime material, secret-bearing material, and `.archive/audit/`.
- **Method and result:** read-only manifest-key and literal-command resolution; 98 root keys received `CAL-CSS2-001`–`CAL-CSS2-098` and `WIR-001`–`WIR-098`. The complete bounded ledger, exact source evidence, redaction, CWD, duplicate, runtime, and unresolved-route limits are in Task 3.1 below.
- **Permitted conclusion:** a positive root package caller only within `CSS-2`; no caller absence, liveness, safety, ownership, lifecycle, or archival conclusion.

## Redaction and handling rules

1. Do not open, search, quote, copy, summarize, or expose secret values.
2. Do not include raw environment-variable values, tokens, API keys, passwords, private keys, cookies, authorization headers, signed URLs, connection strings, or credentials embedded in any source.
3. If a source is potentially secret-bearing, record only a non-sensitive exclusion statement such as “excluded as secret-bearing material”; do not record its values, contents, or path when doing so could itself disclose sensitive context.
4. For otherwise permissible sources, quote only the minimum non-sensitive reference needed to support a static-reference assertion. Prefer repository-relative paths, line ranges, and redacted command identifiers.
5. Redaction must preserve the evidence limitation: a redacted record cannot be represented as complete evidence for a caller, ownership, liveness, or runtime-safety assertion.
6. Treat generated, minified, vendor, cache, and external-service material as limitations unless an owner explicitly expands the scope.

## Actions and commands not performed (`NOT_PERFORMED`)

For this task, none of the following was performed:

- repository discovery, directory listing, file inventory, file read, text search, caller search, secret inspection, or source/workflow/package/configuration inspection;
- any command, shell operation, package-manager operation, script execution, test, coverage run, browser-test run, build, lint, type check, gate, validation command, or production operation;
- any modification outside this planning deliverable;
- any modification to scripts, archive files, package files, workflows, source, configuration, dependencies, databases, storage, deployments, or external services;
- deletion, archival, movement, renaming, disabling, or editing of any audited candidate;
- owner approval request, owner approval, archive-location selection, archive-directory creation, or archive action.

## Completion record for Task 1.1

**Status:** `COMPLETED` for establishing this planning contract only.

**Evidence collected:** contractual planning evidence only: repository root, planned visible scripts scope, exclusions, static method, intended sources, caller-search register, evidence legend, assertion classes, redaction rules, and the `NOT_PERFORMED` action record.

**Evidence not collected:** repository-content evidence, script inventory evidence, caller evidence, ownership evidence, live/gate/shared-helper evidence, classification evidence, archival approval evidence, and runtime evidence.

**Safety statement:** Static review, even when later completed, does not establish runtime safety. No action may be taken on a candidate until the applicable evidence and independent owner approval requirements are satisfied.

## Task 1.2 — Field-complete record schema and traceability keys

This section defines templates for a **future** evidence-backed audit. It records no findings, no caller or lifecycle conclusion, no archive location, and no approval. It preserves Task 1.1's contract: `RECORDED`, `PLANNED`, `COMPLETED`, `NOT_PERFORMED`, `OUT_OF_SCOPE`, and `UNVERIFIED` remain planning-contract states; they are not the finding-level `Evidence_State` below and are never silently upgraded.

### Required-value convention

Every field in every record is required. Its value must be one of: (a) an explicit, evidence-supported value; (b) `unknown — reason: <missing evidence>`; (c) `unresolved — reason: <decision or prerequisite pending>`; or (d) `not applicable — reason: <why the field does not apply>`. Empty, omitted, implied, `TBD`, and bare `none` values are invalid. A negative result must be explicit and bounded (for example, `none found within completed Caller_Search_Scope CSS-<n>`), never a claim about unsearched, runtime, external, generated, ignored, or secret-bearing callers. A list with no applicable members uses `not applicable — reason: <reason>`, except a caller result may use the bounded negative form above.

Each template includes the common fields `Record_ID`, `Record_Type`, `Auditor`, `Creation_Phase`, `Contract_State`, `Evidence_State`, `Evidence_Refs`, `Created_At`, `Updated_At`, and `Field_Completion`. `Contract_State` uses the Task 1.1 legend. `Evidence_State` is exactly one of `Observed`, `Documented`, `Inferred`, `Unverified`, or `Blocked`; it applies to the record's assertion and does not replace the Task 1.1 contract state. `Evidence_Refs` contains one or more `EVD-...` keys, or a required `unresolved — reason: <missing source and next investigation>` value. `Field_Completion` states either `complete` or `blocked — reason: <each incomplete field and follow-up>`.

### Traceability key format and relationship rules

Keys are stable, uppercase, hyphen-delimited identifiers. They are assigned once and are never repurposed if a record is superseded; successors list the earlier key in `Supersedes` or `Superseded_By` using the required-value convention.

| Record | Key format | Example | Required relationships |
| --- | --- | --- | --- |
| Evidence | `EVD-<scope>-<nnn>` | `EVD-CSS1-001` | Referenced by every assertion-bearing record. |
| Inventory | `INV-<artifact-token>` | `INV-SCRIPTS-GENERAL-FOO-MJS` | One per repository-relative artifact path; links Evidence, Ownership, Disposition, and applicable Caller/Wiring/Safety/Governance records. |
| Caller | `CAL-<scope>-<nnn>` | `CAL-CSS1-001` | Links a caller source to `INV-...` or an unresolved target and to Wiring. |
| Wiring | `WIR-<nnn>` | `WIR-001` | Links one Entry_Point/Caller route to terminal `INV-...` or unresolved target; links any P1 Plan_Item. |
| Ownership | `OWN-<artifact-or-family-token>` | `OWN-SCRIPTS-GENERAL` | Links Inventory or family to evidence, decision owner, and Disposition/Plan_Item. |
| Safety | `SAF-<artifact-token>` | `SAF-SCRIPTS-FOO-MJS` | Links Inventory, risk/safety Plan_Item, and rollback evidence. |
| Governance | `GOV-<rule-or-artifact-token>` | `GOV-ROOT-PNPM` | Links Canonical_Source evidence, retained Inventory, related callers, and Validation_Handoff. |
| Disposition | `DSP-<artifact-token>` | `DSP-SCRIPTS-FOO-MJS` | Exactly one current disposition per Inventory record; links caller scope, approval boundary, and any Plan_Item. |
| Archive Manifest | `AMF-<artifact-token>-<revision>` | `AMF-SCRIPTS-FOO-MJS-R1` | Future move record only; links Inventory, candidate Disposition, Archive_Index, evidence, and restoration/rollback. |
| Archive Index | `AIX-<archive-policy-token>` | `AIX-SCRIPTS-ARCHIVE-POLICY` | Links approved location, policy/documentation, manifests, and restoration outcomes. |
| Plan Item | `PIT-P<0-3>-<nnn>` | `PIT-P1-001` | Links affected records, Dependencies, safety gate, acceptance signal, rollback, and wave/blocker. |
| Dependency | `DEP-<from-key>-<to-key>` | `DEP-PIT-P1-001-OWN-SCRIPTS-GENERAL` | Links exactly one dependent record to exactly one prerequisite record or unresolved decision. |
| Validation Handoff | `VHD-<wave-or-item-token>-<nnn>` | `VHD-WAVE-1-001` | Links Plan_Item/wave, Governance/Safety evidence, and deferred user-owned check/manual review. |

`<artifact-token>` is the normalized uppercase repository-relative path with separators and non-alphanumerics replaced by one hyphen; it is paired with `Artifact_Path` to avoid ambiguity. `<scope>` identifies the completed Caller_Search_Scope (for example `CSS1`, only once completion is evidence-backed). `<nnn>` is a zero-padded sequential number within its type and scope. Foreign keys may name an unresolved target or decision only using `unresolved — reason: ...`; no fabricated key, archive location, archive path, approval, owner, caller, or outcome is permitted.

### Record templates

#### `Evidence_Record` (`EVD-...`)

| Field | Required value |
| --- | --- |
| `Source_Path` | Normalized repository-relative path, or the required-value convention with reason. |
| `Source_Location_or_Key` | Exact line/range, manifest key, workflow job/step, import, command key, or other precise static location. |
| `Assertion` | The bounded statement supported or the missing source and next investigation. |
| `Assertion_Class` | One of Task 1.1's `Contractual`, `Inventory`, `Static-reference`, `Caller-absence`, `Role/classification`, or `Runtime-safety`. |
| `Inspection_Method` | Read-only static method used, or a reasoned required-value status. |
| `Search_or_Selection_Criterion` | Query, pattern, identifier variants, or review criterion; redacted when needed. |
| `Caller_Search_Scope` | `CSS-...`, or `not applicable — reason: <not caller evidence>`. |
| `Observed_Result` | Exact non-sensitive result, bounded absence, or required-value status. |
| `Static_or_Execution_Label` | `static identification`, `execution evidence supplied by owner`, or required-value status; static evidence never establishes runtime safety. |
| `Redaction_Note` | Minimum necessary redaction and its evidentiary limitation, or `not applicable — reason: no redaction`. |
| `Limitations_and_Conflicts` | Dynamic/generated/external/secret exclusions, conflicts, or `not applicable — reason: none identified in this bounded evidence`. |

#### `Inventory_Record` (`INV-...`)

| Field | Required value |
| --- | --- |
| `Artifact_Path` | Normalized repository-relative visible `scripts/` path. |
| `Artifact_Type` | Executable source, helper, fixture, configuration, generated metadata, catalog, seed, or distinctly named type. |
| `Family` | Exactly one: root tools, `scripts/general/`, `scripts/AsNeeded/`, `scripts/codemods/`, `scripts/generate-svg/`, `scripts/kiro-repo-guidance-setup/`, `scripts/lib/`, or distinctly named discovered family. |
| `Role` | Explicit evidence-backed role or required-value status. |
| `Runtime` | Runtime/interpreter or required-value status. |
| `Inputs`, `Outputs`, `Side_Effects`, `Dependencies` | Explicit static values or required-value status for each field. |
| `Support_Status` | `Support_Artifact`, `not Support_Artifact`, or required-value status. |
| `Known_Entry_Points` | `CAL-...`/`WIR-...` references, bounded `none found within completed Caller_Search_Scope ...`, or required-value status. |
| `Evidence_Refs`, `Ownership_Ref`, `Safety_Ref`, `Governance_Ref`, `Disposition_Ref` | Required traceability references or required-value status with reason. |

#### `Caller_Record` (`CAL-...`)

| Field | Required value |
| --- | --- |
| `Caller_Path_or_Command`, `Caller_Kind`, `Command_or_Import_Name` | Explicit path/command, kind (package, Ops, registry, workflow, documentation, source import, direct invocation, lifecycle hook, or other), and name; each independently completed. |
| `Target_Reference`, `Target_Resolution`, `Relation` | Target path/key or unresolved target, resolution, and direct/forwarded/imported/documented relation. |
| `Runtime`, `Working_Directory_Assumption`, `Arguments_and_Defaults` | Explicit static facts or required-value status for each. |
| `Caller_Search_Scope`, `Actual_Caller_Status` | Completed scope key and `Actual_Caller`, `unreferenced within scope`, `unresolved`, or required-value status with reason. |
| `Evidence_Refs`, `Wiring_Ref`, `Limitations` | Required traceability, route reference, and bounded limitations. |

#### `Wiring_Record` (`WIR-...`)

| Field | Required value |
| --- | --- |
| `Entry_Point`, `Caller_Ref`, `Terminal_Target` | Entry-point name, `CAL-...`, and terminal `INV-...` or unresolved target. |
| `Dispatch_and_Forwarding_Path` | Ordered route through package/Ops/registry/workflow/import/direct invocation, or required-value status. |
| `Runtime`, `Working_Directory_Assumption`, `Arguments_and_Defaults` | Explicit values or required-value status for each. |
| `Target_Resolution`, `Observable_Effect` | Resolution and expected observable effect, or `not established — reason: static evidence is insufficient`. |
| `Status` | Exactly one of `stale`, `unsupported`, `canonical`, or `duplicated`, assigned in that precedence order. |
| `Discrepancy_Type`, `Affected_Caller`, `Required_P1_Plan_Item` | Missing/additional/forwarding/missing-target/renamed/mislocated/incompatible/unregistered/unverified discrepancy, affected caller, and `PIT-P1-...` when required; otherwise each uses a reasoned not-applicable value. |
| `Evidence_Refs`, `Limitations` | Required supporting evidence and bounded limitations. |

#### `Ownership_Record` (`OWN-...`)

| Field | Required value |
| --- | --- |
| `Subject` | `INV-...` artifact or explicitly named family. |
| `Owner_Status`, `Owner_Evidence`, `Proposed_Owner` | Evidence-backed owner status; owner evidence; and proposed owner. Missing ownership is `unknown — reason: ...` and is never inferred from path, name, or comment. |
| `Decision_Owner`, `Ownership_Decision`, `Review_Trigger` | Decision role, needed decision, and review trigger. |
| `Shared_Helper_Status`, `Direct_Importers`, `Direct_Importer_Fan_In`, `Direct_Dependencies`, `Shared_Side_Effects` | Explicit values for each; for helpers with at least two direct importers, all consumers, numeric fan-in, dependencies, side effects, and one proposed owner are mandatory. |
| `Evidence_Refs`, `Related_Disposition_or_Plan_Item` | Required traceability references or reasoned status. |

#### `Safety_Record` (`SAF-...`)

| Field | Required value |
| --- | --- |
| `Subject`, `Risky_Behavior`, `Targets`, `Environment_Profile` | `INV-...`, static behavior category, targets, and environment profile. |
| `Database_Classification` | `Admin`, `Products`, or `unknown — reason: <artifact evidence and repository rules do not establish target>`. |
| `Variable_Names_Only`, `Secret_Boundary_Names_Only` | Names only; never values. |
| `Target_Guard`, `Preview_Control`, `Confirmation`, `Approval`, `Backup_or_Recovery_Evidence`, `Failure_Behavior`, `Rollback_Path` | Explicit evidence or required-value status for every control. |
| `Risk`, `Blocking_Safety_Plan_Item` | `critical`, `high`, or reasoned status; required `PIT-P...` for missing required controls (critical for production/credential/deployment/restored state, high otherwise). |
| `Evidence_Refs`, `Limitations` | Required traceability and static limitations. |

#### `Governance_Record` (`GOV-...`)

| Field | Required value |
| --- | --- |
| `Rule_or_Artifact`, `Purpose`, `Audience`, `Scope` | Explicit governance subject and context. |
| `Canonical_Source`, `Canonical_Source_Selection_Evidence` | Exactly one selected canonical source after ownership resolution, or `unresolved — reason: ownership or evidence is not resolved`; selection evidence is mandatory. |
| `Secondary_Sources`, `Secondary_Source_Status` | All other sources and one status per source: duplicate, stale, contradictory, or supporting. |
| `Preferred_Root_Only_Pnpm_Invocation`, `Risk`, `Owner`, `Dependencies`, `Lifecycle_Label`, `Validation_Handoff_Ref` | Explicit values or required-value status. |
| `Linked_Callers`, `Review_Trigger`, `Governance_Constraints`, `Evidence_Refs` | Caller references, review trigger, applicable preserved constraints (root-only pnpm; user-invoked tests/gates; read-only production filesystem; mode-aware persistence; Admin/Products separation; rollback-aware migrations; Studio/Planner isolation), and evidence. |

#### `Disposition_Record` (`DSP-...`)

| Field | Required value |
| --- | --- |
| `Subject`, `Disposition` | `INV-...` and exactly one of `keep`, `maybe`, `archive candidate`, `consolidate`, `relocate`, `wrap`, or `document`. |
| `Actual_Caller_Evidence`, `Gate_Critical_Evidence`, `Shared_Helper_Evidence`, `Caller_Search_Scope` | Explicit evidence/status for each, with complete scope required for any caller-absence conclusion. |
| `Rationale`, `Lifecycle_and_Safety_Evidence`, `Affected_Owner`, `Next_Investigation` | Explicit decision basis, evidence, owner, and follow-up. |
| `Active_and_Untouched_Requirement` | `required` for `maybe` and `archive candidate`; `keep active and preserve evidenced callers` for `keep`; otherwise explicit preservation handling. |
| `Approval_Boundary`, `Archive_Location_Status`, `Archive_Prerequisites`, `Blocked_Status` | Required approval, owner-approved location status, prerequisites, and blocked state. Archive-location status remains `unresolved — reason: no owner-approved repository-relative location and Archive_Index documentation path recorded` unless later independently approved. |
| `Evidence_Refs`, `Plan_Item_Ref` | Required traceability. |

A `keep` disposition is mandatory for any Actual_Caller, Gate_Critical, or Shared_Helper. Incomplete, inaccessible, or conflicting caller/lifecycle/ownership/safety evidence mandates `maybe`, active and untouched. `archive candidate` requires explicit one-time/obsolete evidence **and** no Actual_Caller found in a completed scope; it is never a destructive disposition and remains active and untouched. No record may select, create, or use an archive location; `.archive/audit/` remains excluded by the Task 1.1 contract and current guidance.

#### `Archive_Manifest` (`AMF-...`)

| Field | Required value |
| --- | --- |
| `Candidate_Disposition_Ref`, `Original_Path`, `Support_Artifact_Set` | `DSP-...`, original path, and every required Support_Artifact or reasoned bounded absence. |
| `Approved_Archive_Location`, `Archive_Path`, `Manifest_Path`, `Archive_Index_Path` | Owner-approved repository-relative values; before approval, each is `unresolved — reason: independent archive-location decision is pending`. |
| `Timestamp_ISO_8601`, `Pre_Move_SHA_256`, `Post_Move_SHA_256`, `Hash_Match_Evidence` | ISO 8601 timestamp, SHA-256 hashes before/after intact move, and equality evidence; pre-move planning records use required unresolved values and cannot authorize a move. |
| `Evidence_Refs`, `Completed_Caller_Search_Scope`, `Caller_Disposition`, `Caller_Preservation_or_Migration_Sequence` | Required evidence, completed scope, each caller disposition, and approved preservation/migration sequence. |
| `Artifact_Owner_Decision`, `Affected_Caller_Owner_Decisions`, `Independent_Approval_Boundary` | Independent approvals for artifact and every affected caller; unresolved values block archival. |
| `Restoration_Procedure`, `Restoration_Replacement_Path_Rule`, `Restoration_Hash_Verification`, `Restoration_Caller_Disposition`, `Restoration_Index_Update` | Full recovery procedure: intact move to original or owner-approved replacement path, SHA-256 verification, caller disposition restoration, and index outcome update. |
| `Rollback_Sequence`, `Move_Status`, `Blocked_Status` | Concrete reverse sequence using this manifest; `not started`/other explicit status; and blocked state. Any failed/missing prerequisite, field, hash comparison, caller preservation, index entry, or restoration procedure blocks the move and leaves or restores the artifact active. |

#### `Archive_Index` (`AIX-...`)

| Field | Required value |
| --- | --- |
| `Approved_Archive_Location`, `Archive_Policy_Reference`, `Restoration_Documentation_Source` | Owner-approved location, governing policy, and restoration source; unresolved until owner decision. |
| `Manifest_Refs`, `Manifest_Links` | Every `AMF-...` and durable link/location, or reasoned not-applicable value before any approved manifest exists. |
| `Restoration_Outcome`, `Restoration_Outcome_Evidence`, `Last_Reviewed_At`, `Index_Owner` | Explicit result/evidence, ISO 8601 review time, and owner or required-value status. |
| `Evidence_Refs`, `Blocked_Status` | Required evidence and a block when location/policy/documentation/manifest requirements are incomplete. |

#### `Plan_Item` (`PIT-P...`)

| Field | Required value |
| --- | --- |
| `Perspective`, `Affected_Paths_and_Commands`, `Related_Record_Refs` | Inventory_and_Ownership, Wiring_and_Discoverability, Safety_and_Environment, or Documentation_and_Governance; affected references; and linked records. |
| `Evidence_State`, `Evidence_Refs`, `Impact`, `Risk`, `Priority` | Exact finding state, evidence, impact, risk, and P0/P1/P2/P3 priority. |
| `Owner`, `Dependencies`, `Proposed_Action`, `Acceptance_Signal`, `Safety_Gate`, `Rollback_Path` | Explicit accountable owner, `DEP-...` links, non-destructive future action, acceptance signal, gate, and concrete rollback. |
| `Approval_Boundary`, `Wave`, `Blocked_Status`, `Blocker_Reason` | Required approval, sequence wave, blocked/executable state, and reason. Missing owner, resolved dependency, approval, acceptance signal, rollback, or applicable archival prerequisite means `blocked` and excluded from executable sequencing. |
| `Archival_Fields` | For archive-related items: Archive_Location status; AMF required fields; AIX documentation; caller scope/disposition; owner decision; reversible move, restoration, and rollback sequences. Otherwise `not applicable — reason: not an archival Plan_Item`. |

#### `Dependency` (`DEP-...`)

| Field | Required value |
| --- | --- |
| `Dependent_Record_Ref`, `Prerequisite_Record_or_Decision_Ref`, `Dependency_Type` | One dependent, one prerequisite/key or unresolved decision, and owner/evidence/caller/safety/archive-location/approval/manifest/index/restoration/rollback/wave dependency. |
| `Required_Condition`, `Resolution_Status`, `Resolution_Evidence_Refs`, `Decision_Owner` | Explicit completion condition, resolved/blocked/unresolved status, evidence, and accountable owner. |
| `Blocks_Execution`, `Failure_or_Expiry_Handling` | Explicit yes/no with reason and consequence/rollback or escalation. |

#### `Validation_Handoff` (`VHD-...`)

| Field | Required value |
| --- | --- |
| `Repository_Root`, `Related_Wave_or_Plan_Item`, `Named_Check_or_Manual_Inspection`, `Scope` | Root, linked wave/item, narrowest user-owned static/manual review, and affected scope. |
| `Prerequisites`, `Expected_Signal`, `Side_Effects`, `Owner` | Explicit preconditions, expected result, known effects, and user/owner who may invoke it. |
| `Rollback_Check_Outcome`, `Execution_Status`, `Deferred_Execution_Categories` | Expected rollback check result or status, exactly `not run by audit`, and deferred tests/gates/builds/deployments/databases/browser suites/persistent mutations as applicable. |
| `Blocked_Source_or_Future_Follow_Up`, `Evidence_Refs` | Secret/production/private-data/database/external-mutation/environment-state blocker or owner-approved follow-up, plus evidence. |

Validation handoffs guide future implementation only. They do not authorize commands, tests, gates, builds, deployments, database operations, browser suites, or mutations, and Task 1.2 does not execute any of them.

### Schema-level preservation and archival invariant

No schema field or Plan_Item authorizes deletion. Active/gate/shared artifacts receive `keep` and caller preservation. `maybe` remains active and untouched. Archive candidates remain active and untouched until both independent artifact/caller approval and an owner-approved repository-relative archive location and Archive_Index documentation path exist. An archival move additionally requires the complete caller scope, explicit obsolete/one-time evidence, support-artifact set, manifest and index, SHA-256 pre/post hash equality, approved caller preservation or migration, restoration procedure, and rollback sequence. Until every prerequisite is explicitly resolved, the only valid archival status is `blocked` and the active artifact remains in place.


## Task 2.1 — Exhaustive visible `scripts/` inventory and preservation baseline

**Status:** `COMPLETED` for a path-level, read-only static inventory only. This section does not assign a disposition and does not authorize modification, movement, archival, deletion, execution, or caller/liveness conclusions.

### Scope, method, and evidence boundary

- **Repository root:** `D:\23082026`.
- **Completed inventory scope:** every visible **file** under repository-relative `scripts/`, recursively, as exposed by read-only directory metadata during this task. The scope includes executables, helpers, placeholders, fixtures, configurations, generated metadata, catalogs, seed inputs, documentation, and support artifacts. It contains 247 files.
- **Excluded from artifact records:** directories themselves are containers rather than `Script_Artifact`/`Support_Artifact` files. Visible `.sonar` directories at `scripts/.sonar`, `scripts/AsNeeded/.sonar`, `scripts/general/.sonar`, and `scripts/kiro-repo-guidance-setup/.sonar` returned empty-or-not-present; therefore they contribute no visible file path. Secret-bearing material was neither opened nor reported.
- **Inspection method:** read-only recursive directory listings; three safe, non-secret supporting-file reads (`scripts/tsconfig.json`, `scripts/generate-svg/svgo.config.cjs`, and `scripts/general/README.md`). No script, project command, package-manager command, search, test, gate, build, lint, type check, browser runner, or runtime was executed.
- **Caller boundary:** `CSS-0` remains `NOT_PERFORMED`. Known entry points in every record are therefore `unknown — reason: Task 2.1 completed no caller search; CSS-0 supports no caller conclusion` unless the record is a non-executable data/support artifact, in which case the same bounded status still applies to its potential consumer.
- **Static limitation:** filename, extension, directory, and the specifically cited supporting documents establish only the stated static identification. They do not establish runtime safety, owner, caller, liveness, imports, side effects, or archival suitability.

### Evidence records

| Record_ID | Source_Path and location | Assertion / class | Method and result | Limitations |
| --- | --- | --- | --- | --- |
| `EVD-INV-001` | `scripts/`; directory-listing metadata, line not applicable | 120 visible root-level files exist; `Inventory` | Read-only listing; paths recorded below | Metadata did not inspect file bodies. |
| `EVD-INV-002` | `scripts/AsNeeded/`; directory-listing metadata, line not applicable | 17 visible files exist; `Inventory` | Read-only listing; paths recorded below | Metadata did not inspect file bodies. |
| `EVD-INV-003` | `scripts/codemods/`; directory-listing metadata, line not applicable | 2 visible files exist; `Inventory` | Read-only listing; paths recorded below | Metadata did not inspect file bodies. |
| `EVD-INV-004` | `scripts/generate-svg/`, `_fixtures/`, and `__goldens__/`; directory-listing metadata, line not applicable | 13 visible files exist; `Inventory` | Read-only listings; paths recorded below | Metadata did not inspect fixture/golden bodies. |
| `EVD-INV-005` | `scripts/kiro-repo-guidance-setup/`; directory-listing metadata, line not applicable | 25 visible files exist; `Inventory` | Read-only listing; paths recorded below | Metadata did not inspect module bodies. |
| `EVD-INV-006` | `scripts/lib/`; directory-listing metadata, line not applicable | 12 visible files exist; `Inventory` | Read-only listing; paths recorded below | Metadata did not inspect module bodies. |
| `EVD-INV-007` | `scripts/general/`; directory-listing metadata, line not applicable | 58 visible files exist; `Inventory` | Read-only listing; paths recorded below | Membership is not itself gate-critical evidence. |
| `EVD-INV-008` | `scripts/tsconfig.json:1-20` | TypeScript scripts configuration extends `../config/build/tsconfig.json`, includes TS/JS/MJS, and uses `noEmit`; `Static-reference` | Read-only file read | Does not establish individual script behavior. |
| `EVD-INV-009` | `scripts/generate-svg/svgo.config.cjs:1-15` | CommonJS SVGO configuration exports a locked plugin configuration; `Static-reference` | Read-only file read | Does not establish every consumer or runtime result. |
| `EVD-INV-010` | `scripts/general/README.md:1-76` | Documents intended `general/` gate-critical membership and path-stable SVG artifacts; `Static-reference` | Read-only file read | The documented/observed reconciliation is deferred to Task 2.2. |

### Inventory-record completion convention

Every row below is exactly one `Inventory_Record`. Its `Record_ID` is deterministically `INV-` plus the uppercased `Artifact_Path` with every separator/non-alphanumeric run replaced by one hyphen (for example, `scripts/apply-db-image-path-rewrite.mjs` is `INV-SCRIPTS-APPLY-DB-IMAGE-PATH-REWRITE-MJS`). Its `Family` is exactly the family named by its enclosing inventory heading, and its `Evidence_Refs` are exactly the family-level evidence citations stated immediately before its table (plus any profile-specific citation). Common fields for every record are: `Record_Type: Inventory_Record`; `Auditor: Kiro`; `Creation_Phase: Task 2.1`; `Contract_State: COMPLETED`; `Created_At/Updated_At: current task session — exact clock value unavailable from read-only tool evidence`; `Ownership_Ref/Safety_Ref/Governance_Ref/Disposition_Ref: unresolved — reason: these records are deferred to Tasks 2.3 and 4–6`; `Field_Completion: complete for this Task 2.1 static-inventory boundary`.

A profile expands the required fields, rather than omitting them. For profiles that use `unknown`, the reason is exactly that this task did not inspect the individual file body or perform caller/import analysis; this is deliberate scope discipline, not a negative fact.

| Profile | Artifact_Type | Role | Runtime | Inputs | Outputs | Side_Effects | Direct_Dependencies | Support_Status | Known_Entry_Points |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ROOT-MJS` | executable source candidate | root repository tool, filename-derived and non-dispositive | Node.js ESM candidate — inferred from `.mjs` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: support/entry classification needs caller/import evidence | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `ROOT-TS` | executable source candidate | root repository tool, filename-derived and non-dispositive | TypeScript/Node execution route unknown — inferred from `.ts` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: support/entry classification needs caller/import evidence | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `ROOT-PY` | executable source candidate | root repository tool, filename-derived and non-dispositive | Python candidate — inferred from `.py` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: support/entry classification needs caller/import evidence | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `ROOT-PS1` | executable source candidate | root repository tool, filename-derived and non-dispositive | PowerShell candidate — inferred from `.ps1` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: support/entry classification needs caller/import evidence | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `ROOT-BAT` | executable source candidate | root repository tool, filename-derived and non-dispositive | Windows batch candidate — inferred from `.bat` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: support/entry classification needs caller/import evidence | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `ROOT-DATA` | catalog or seed input | root data artifact, filename-derived and non-dispositive | not applicable — reason: data extension has no directly established interpreter | unknown — reason: data schema/body not inspected | unknown — reason: consumer analysis not performed | unknown — reason: consumer/runtime analysis not performed | unknown — reason: consumer analysis not performed | Support_Artifact — reason: catalog/seed/metadata data is not itself an executable entry point | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `PLACEHOLDER` | placeholder | repository directory-retention placeholder | not applicable — reason: `.gitkeep` is not executable source | not applicable — reason: placeholder has no established runtime input | not applicable — reason: placeholder has no established output | not applicable — reason: placeholder has no established effect beyond retention intent | not applicable — reason: no executable dependency established | Support_Artifact — reason: placeholder supports directory retention | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `TSCONFIG` | configuration | scripts TypeScript compiler configuration — documented by `EVD-INV-008` | TypeScript compiler configuration | compiler invocation/config resolution — evidenced at `scripts/tsconfig.json:1-20` | no emitted output configured — evidenced `noEmit` at line 14 | configuration selection only; runtime effects not established | `../config/build/tsconfig.json` — evidenced line 2 | Support_Artifact — reason: compiler configuration | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `TSBUILDINFO` | generated metadata | TypeScript build-info metadata, extension-derived | TypeScript build metadata | unknown — reason: metadata body not inspected | unknown — reason: metadata body not inspected | unknown — reason: generation source not inspected | unknown — reason: producer/consumer analysis not performed | Support_Artifact — reason: generated metadata is not an executable entry point | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `GENERAL-MJS` | executable source candidate | `general/` audit/check/generator/helper candidate, filename-derived; no gate status inferred from location | Node.js ESM candidate — inferred from `.mjs` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: documented membership reconciliation is deferred to Task 2.2 | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `GENERAL-PY` | executable source candidate | `general/` script candidate, filename-derived; no gate status inferred from location | Python candidate — inferred from `.py` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: documented membership reconciliation is deferred to Task 2.2 | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `GENERAL-CJS` | executable source candidate | `general/` script/config candidate, filename-derived; no gate status inferred from location | Node.js CommonJS candidate — inferred from `.cjs` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: documented membership reconciliation is deferred to Task 2.2 | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `GENERAL-JS` | executable source candidate | `general/` script candidate, filename-derived; no gate status inferred from location | Node.js JavaScript candidate — inferred from `.js` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: documented membership reconciliation is deferred to Task 2.2 | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `GENERAL-DOC` | documentation | `general/` membership/purpose documentation — `EVD-INV-010` | not applicable — reason: Markdown is not executable source | documentation reader — inferred from Markdown | no program output established | not applicable — reason: documentation itself has no executed side effect established | not applicable — reason: no executable dependency established | Support_Artifact — reason: supporting governance/documentation | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `ASNEEDED-MJS` | executable source candidate | one-shot/audit/verification candidate, filename-derived; no lifecycle conclusion | Node.js ESM candidate — inferred from `.mjs` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: support/entry classification needs caller/import evidence | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `ASNEEDED-DOC` | documentation | allowlist/support documentation candidate, filename-derived | not applicable — reason: Markdown is not executable source | documentation reader — inferred from Markdown | no program output established | not applicable — reason: documentation itself has no executed side effect established | not applicable — reason: no executable dependency established | Support_Artifact — reason: supporting documentation | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `CODEMOD-MJS` | executable source candidate | codemod candidate, directory-derived | Node.js ESM candidate — inferred from `.mjs` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: support/entry classification needs caller/import evidence | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `SVG-TS` | executable source or helper candidate | SVG pipeline module — documented as path-stable at `scripts/general/README.md:58-63` | TypeScript/Node execution route unknown — inferred from `.ts` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: documented path stability does not establish direct-import status | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `SVG-CJS-CONFIG` | configuration | locked SVGO plugin configuration — `EVD-INV-009` | Node.js CommonJS configuration | SVGO optimizer configuration, evidenced at `svgo.config.cjs:1-15` | optimizer option object — evidenced at `svgo.config.cjs:3-15` | not established — static configuration read does not prove runtime effect | SVGO consumer unknown — reason: consumer search not performed | Support_Artifact — reason: configuration consumed by a generate/sanitize path is documented at line 2 | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `SVG-FIXTURE` | fixture | SVG pipeline test/fixture input, directory and filename-derived | JSON data — no directly established interpreter | fixture data consumer unknown — reason: body/consumer not inspected | expected fixture use unknown — reason: test execution not performed | not applicable — reason: fixture data has no direct executable effect established | unknown — reason: consumer analysis not performed | Support_Artifact — reason: `_fixtures/` artifact and `README` calls fixtures critical at lines 61-62 | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `SVG-GOLDEN` | golden artifact | SVG expected-output/golden support artifact, directory and filename-derived | SVG data — no directly established interpreter | comparison consumer unknown — reason: body/consumer not inspected | expected output data — filename/directory-derived only | not applicable — reason: golden data has no direct executable effect established | unknown — reason: consumer analysis not performed | Support_Artifact — reason: `__goldens__/` artifacts are documented as snapshot goldens at `README.md:62-63` | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `GUIDANCE-TS` | helper/module candidate | repository-guidance setup module, filename-derived | TypeScript/Node execution route unknown — inferred from `.ts` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: import analysis not performed | unknown — reason: support/entry classification needs caller/import evidence | unknown — reason: Task 2.1 completed no caller search; `CSS-0` supports no caller conclusion |
| `LIB-MJS` | helper | shared library helper candidate, directory-derived | Node.js ESM candidate — inferred from `.mjs` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: direct-import analysis not performed | unknown — reason: shared-helper determination requires direct importer count | unknown — reason: Task 2.1 completed no caller/import search; `CSS-0` supports no caller conclusion |
| `LIB-TS` | helper | shared library helper candidate, directory-derived | TypeScript/Node execution route unknown — inferred from `.ts` | unknown — reason: individual body not inspected | unknown — reason: individual body not inspected | unknown — reason: static path inventory cannot establish effects | unknown — reason: direct-import analysis not performed | unknown — reason: shared-helper determination requires direct importer count | unknown — reason: Task 2.1 completed no caller/import search; `CSS-0` supports no caller conclusion |

### Inventory records — `root tools` (120)

All records in this family cite `EVD-INV-001` for existence; `Evidence_State` is `Observed` for path/type and `Inferred` for a filename/extension-derived role/runtime.

| Artifact_Path | Profile |
| --- | --- |
| `scripts/.gitkeep` | `PLACEHOLDER` |
| `scripts/apply-db-image-path-rewrite.mjs` | `ROOT-MJS` |
| `scripts/arrange_supabase_catalog_assets.ts` | `ROOT-TS` |
| `scripts/asset-path-map.mjs` | `ROOT-MJS` |
| `scripts/audit-broken-db-image-paths.mjs` | `ROOT-MJS` |
| `scripts/audit-disk-image-twins.mjs` | `ROOT-MJS` |
| `scripts/audit-product-quality.ts` | `ROOT-TS` |
| `scripts/audit-svg-catalog.ts` | `ROOT-TS` |
| `scripts/auditCdnAssetFailures.ts` | `ROOT-TS` |
| `scripts/auditUnresolvedCdnPaths.ts` | `ROOT-TS` |
| `scripts/audit_external_asset_hosts.py` | `ROOT-PY` |
| `scripts/audit_slug_id_integrity.ts` | `ROOT-TS` |
| `scripts/audit_supabase_admin.ts` | `ROOT-TS` |
| `scripts/audit_supabase_catalog.ts` | `ROOT-TS` |
| `scripts/backfill_canonical_catalog_metadata.ts` | `ROOT-TS` |
| `scripts/backfill_missing_product_images.ts` | `ROOT-TS` |
| `scripts/backup_supabase.ts` | `ROOT-TS` |
| `scripts/blockRenderUtils.ts` | `ROOT-TS` |
| `scripts/catalog-seating.json` | `ROOT-DATA` |
| `scripts/catalog_snapshot_upload_r2.ts` | `ROOT-TS` |
| `scripts/check-homepage-dialect.mjs` | `ROOT-MJS` |
| `scripts/check-i18n-key-parity.mjs` | `ROOT-MJS` |
| `scripts/check-marketing-copy-source.mjs` | `ROOT-MJS` |
| `scripts/check-marketing-inline-style.mjs` | `ROOT-MJS` |
| `scripts/check-site-page-shell.mjs` | `ROOT-MJS` |
| `scripts/check-supabase-missing-images.mjs` | `ROOT-MJS` |
| `scripts/checkAuthEnv.ts` | `ROOT-TS` |
| `scripts/check_all_env_full.ts` | `ROOT-TS` |
| `scripts/clean-test-artifacts.mjs` | `ROOT-MJS` |
| `scripts/configure-cf-security-txt.ps1` | `ROOT-PS1` |
| `scripts/contact-sheet.mjs` | `ROOT-MJS` |
| `scripts/count-r2-objects.mjs` | `ROOT-MJS` |
| `scripts/coverage-metrics.mjs` | `ROOT-MJS` |
| `scripts/coverage-policy.mjs` | `ROOT-MJS` |
| `scripts/create-bucket.ts` | `ROOT-TS` |
| `scripts/create-private-repo.bat` | `ROOT-BAT` |
| `scripts/create-private-repo.ps1` | `ROOT-PS1` |
| `scripts/db_advisors.ts` | `ROOT-TS` |
| `scripts/db_advisors_admin.ts` | `ROOT-TS` |
| `scripts/db_apply_migrations.ts` | `ROOT-TS` |
| `scripts/db_backup_dropped_tables.ts` | `ROOT-TS` |
| `scripts/db_backup_pg_dump.ts` | `ROOT-TS` |
| `scripts/db_backup_upload_r2.ts` | `ROOT-TS` |
| `scripts/db_ensure_plans_table.ts` | `ROOT-TS` |
| `scripts/db_gen_admin_types.ts` | `ROOT-TS` |
| `scripts/db_sync_drizzle_schema.ts` | `ROOT-TS` |
| `scripts/db_test_connection.ts` | `ROOT-TS` |
| `scripts/delete-twin-images.mjs` | `ROOT-MJS` |
| `scripts/deleteR2Bucket.ts` | `ROOT-TS` |
| `scripts/detect-corrupt-images.mjs` | `ROOT-MJS` |
| `scripts/downloadCdnAssets.ts` | `ROOT-TS` |
| `scripts/ensure-retire-restore-precondition.mjs` | `ROOT-MJS` |
| `scripts/ensureAuthTestUsers.ts` | `ROOT-TS` |
| `scripts/export-pending-failures.mjs` | `ROOT-MJS` |
| `scripts/export-pending-translations.mjs` | `ROOT-MJS` |
| `scripts/finish-all.ps1` | `ROOT-PS1` |
| `scripts/five-majors-hash-dedup.mjs` | `ROOT-MJS` |
| `scripts/fix-asset-paths.mjs` | `ROOT-MJS` |
| `scripts/fix-commit-author.ps1` | `ROOT-PS1` |
| `scripts/gate-site-ui.mjs` | `ROOT-MJS` |
| `scripts/generate-coverage-report.mjs` | `ROOT-MJS` |
| `scripts/generate-page-component-graph.mjs` | `ROOT-MJS` |
| `scripts/generate-route-classification.mjs` | `ROOT-MJS` |
| `scripts/generate-site-ui-route-matrix.mjs` | `ROOT-MJS` |
| `scripts/generate-sitemap-csv.ts` | `ROOT-TS` |
| `scripts/generate-svg.mjs` | `ROOT-MJS` |
| `scripts/generate-visual-audit-report.mjs` | `ROOT-MJS` |
| `scripts/generate-vitest-report.mjs` | `ROOT-MJS` |
| `scripts/generate_blocks.ts` | `ROOT-TS` |
| `scripts/graph-impact.mjs` | `ROOT-MJS` |
| `scripts/launch-smoke.mjs` | `ROOT-MJS` |
| `scripts/marketing-ui-audit.mjs` | `ROOT-MJS` |
| `scripts/merge-recovery-into-majors.mjs` | `ROOT-MJS` |
| `scripts/migrate-svg-catalog-to-png.mjs` | `ROOT-MJS` |
| `scripts/mirror-assets-to-r2.mjs` | `ROOT-MJS` |
| `scripts/mobile-canvas-share.mjs` | `ROOT-MJS` |
| `scripts/nova-act-demo.py` | `ROOT-PY` |
| `scripts/ops-command-registry.mjs` | `ROOT-MJS` |
| `scripts/organize-catalog-images.ts` | `ROOT-TS` |
| `scripts/planner-lift-project-trees.mjs` | `ROOT-MJS` |
| `scripts/playwright-dev-lock.mjs` | `ROOT-MJS` |
| `scripts/pushSvgCatalogToDb.ts` | `ROOT-TS` |
| `scripts/render-catalog-qa-sheet.ts` | `ROOT-TS` |
| `scripts/repo_backup_upload_r2.ts` | `ROOT-TS` |
| `scripts/responsive-audit.mjs` | `ROOT-MJS` |
| `scripts/reverse-asset-paths.mjs` | `ROOT-MJS` |
| `scripts/run-admin-production-auth-smoke.ps1` | `ROOT-PS1` |
| `scripts/run-admin-retire-restore-canvas.mjs` | `ROOT-MJS` |
| `scripts/run-full-vitest.mjs` | `ROOT-MJS` |
| `scripts/run-ops.mjs` | `ROOT-MJS` |
| `scripts/scan-boundaries.mjs` | `ROOT-MJS` |
| `scripts/scan-hardcoding.mjs` | `ROOT-MJS` |
| `scripts/seed-block-descriptors.ts` | `ROOT-TS` |
| `scripts/seed.ts` | `ROOT-TS` |
| `scripts/seed_configurator_catalog.ts` | `ROOT-TS` |
| `scripts/seed_data.sql` | `ROOT-DATA` |
| `scripts/seed_furniture_catalog.ts` | `ROOT-TS` |
| `scripts/seed_planner_managed_catalog.ts` | `ROOT-TS` |
| `scripts/setup-ayushonmicrosoft-remote.ps1` | `ROOT-PS1` |
| `scripts/shallow-push-ayushonmicrosoft.ps1` | `ROOT-PS1` |
| `scripts/site-page-audit.mjs` | `ROOT-MJS` |
| `scripts/smoke-svg-fixtures.mjs` | `ROOT-MJS` |
| `scripts/sync-deferred-locale-messages.mjs` | `ROOT-MJS` |
| `scripts/sync-descriptor-svgs.ts` | `ROOT-TS` |
| `scripts/sync-github-backup-secrets.ps1` | `ROOT-PS1` |
| `scripts/sync-hi-wave1-messages.mjs` | `ROOT-MJS` |
| `scripts/sync-marketing-i18n-messages.mjs` | `ROOT-MJS` |
| `scripts/sync-missing-alt-text.ts` | `ROOT-TS` |
| `scripts/sync-token-pairs.mjs` | `ROOT-MJS` |
| `scripts/syncClientLogosFromR2.ts` | `ROOT-TS` |
| `scripts/syncVendorCdnAssets.mjs` | `ROOT-MJS` |
| `scripts/translate-deferred-marketing-flat.mjs` | `ROOT-MJS` |
| `scripts/trim-catalog.mjs` | `ROOT-MJS` |
| `scripts/tsconfig.json` | `TSCONFIG` |
| `scripts/tsconfig.tsbuildinfo` | `TSBUILDINFO` |
| `scripts/ui-polish-pass1-audit.mjs` | `ROOT-MJS` |
| `scripts/uploadCdnAssets.ts` | `ROOT-TS` |
| `scripts/verify-asset-decode.mjs` | `ROOT-MJS` |
| `scripts/verify-png-release.mjs` | `ROOT-MJS` |
| `scripts/verify-remote.ps1` | `ROOT-PS1` |

### Inventory records — `scripts/AsNeeded/` (17)

All records in this family cite `EVD-INV-002`; `Evidence_State` is `Observed` for path/type and `Inferred` for extension/directory/filename role.

| Artifact_Path | Profile |
| --- | --- |
| `scripts/AsNeeded/.gitkeep` | `PLACEHOLDER` |
| `scripts/AsNeeded/ALLOWLIST.md` | `ASNEEDED-DOC` |
| `scripts/AsNeeded/audit-css-packages.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/audit-focss-static-defects.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/compare-focss-trees.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/count-focss-hardcodes.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/finalize-surface-classify.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/reapply-feature-flags-grants.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/smoke-site-pages.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/verify-db-svg-matrix.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/verify-focss-fences.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/verify-focss-imports.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/verify-focss-module-imports.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/verify-focss-structure.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/verify-site-css.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/_audit-stale-scripts.mjs` | `ASNEEDED-MJS` |
| `scripts/AsNeeded/_scan-circular-imports.mjs` | `ASNEEDED-MJS` |

### Inventory records — `scripts/codemods/` (2)

All records in this family cite `EVD-INV-003`; `Evidence_State` is `Observed` for path/type and `Inferred` for extension/directory role.

| Artifact_Path | Profile |
| --- | --- |
| `scripts/codemods/.gitkeep` | `PLACEHOLDER` |
| `scripts/codemods/homepage-dialect.mjs` | `CODEMOD-MJS` |

### Inventory records — `scripts/generate-svg/` (13)

All records in this family cite `EVD-INV-004`; `Evidence_State` is `Observed` for path/type and `Inferred` for directory/extension role, except `svgo.config.cjs`, which also has `EVD-INV-009`.

| Artifact_Path | Profile |
| --- | --- |
| `scripts/generate-svg/.gitkeep` | `PLACEHOLDER` |
| `scripts/generate-svg/pipelineCore.ts` | `SVG-TS` |
| `scripts/generate-svg/svgo.config.cjs` | `SVG-CJS-CONFIG` |
| `scripts/generate-svg/_fixtures/.gitkeep` | `PLACEHOLDER` |
| `scripts/generate-svg/_fixtures/chaise.json` | `SVG-FIXTURE` |
| `scripts/generate-svg/_fixtures/linear-desk-param.json` | `SVG-FIXTURE` |
| `scripts/generate-svg/_fixtures/missing-geometry.json` | `SVG-FIXTURE` |
| `scripts/generate-svg/_fixtures/sectional.json` | `SVG-FIXTURE` |
| `scripts/generate-svg/_fixtures/side-table.json` | `SVG-FIXTURE` |
| `scripts/generate-svg/__goldens__/.gitkeep` | `PLACEHOLDER` |
| `scripts/generate-svg/__goldens__/chaise-golden.svg` | `SVG-GOLDEN` |
| `scripts/generate-svg/__goldens__/sectional-golden.svg` | `SVG-GOLDEN` |
| `scripts/generate-svg/__goldens__/side-table-golden.svg` | `SVG-GOLDEN` |

### Inventory records — `scripts/kiro-repo-guidance-setup/` (25)

All records in this family cite `EVD-INV-005`; `Evidence_State` is `Observed` for path/type and `Inferred` for extension/directory/filename role.

| Artifact_Path | Profile |
| --- | --- |
| `scripts/kiro-repo-guidance-setup/capabilities.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/compatibility.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/continuity.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/contract-freeze.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/contracts.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/coverage.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/discovery.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/enablement.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/handover.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/hooks.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/integration-gate.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/inventory.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/owner-decisions.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/ownership.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/pipeline.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/policy.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/provenance.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/reservations.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/reviewers.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/rollback.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/scope.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/skills.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/validation.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/wave-guard.ts` | `GUIDANCE-TS` |
| `scripts/kiro-repo-guidance-setup/wave-manifest.ts` | `GUIDANCE-TS` |

### Inventory records — `scripts/lib/` (12)

All records in this family cite `EVD-INV-006`; `Evidence_State` is `Observed` for path/type and `Inferred` for extension/directory role.

| Artifact_Path | Profile |
| --- | --- |
| `scripts/lib/.gitkeep` | `PLACEHOLDER` |
| `scripts/lib/assetPathMapTools.mjs` | `LIB-MJS` |
| `scripts/lib/cdnAssetResolver.ts` | `LIB-TS` |
| `scripts/lib/exportMarketingCopy.ts` | `LIB-TS` |
| `scripts/lib/r2Catalog.ts` | `LIB-TS` |
| `scripts/lib/recoveryClassify.mjs` | `LIB-MJS` |
| `scripts/lib/repoRoot.mjs` | `LIB-MJS` |
| `scripts/lib/repoRoot.ts` | `LIB-TS` |
| `scripts/lib/resolvePgDump.ts` | `LIB-TS` |
| `scripts/lib/scriptEnv.mjs` | `LIB-MJS` |
| `scripts/lib/siteUiRouteSources.mjs` | `LIB-MJS` |
| `scripts/lib/vitest-excludes.mjs` | `LIB-MJS` |

### Inventory records — `scripts/general/` (58)

All records in this family cite `EVD-INV-007`; `Evidence_State` is `Observed` for path/type and `Inferred` for extension/directory/filename role. `EVD-INV-010` documents a membership policy but Task 2.1 intentionally does not infer gate-criticality from this path or document; Task 2.2 must reconcile documented and observed membership.

| Artifact_Path | Profile |
| --- | --- |
| `scripts/general/.gitkeep` | `PLACEHOLDER` |
| `scripts/general/audit-api-route-safety.mjs` | `GENERAL-MJS` |
| `scripts/general/audit-eslint-disable.mjs` | `GENERAL-MJS` |
| `scripts/general/audit-gate-skips.mjs` | `GENERAL-MJS` |
| `scripts/general/audit-hollow-tests.mjs` | `GENERAL-MJS` |
| `scripts/general/audit-repo-state.py` | `GENERAL-PY` |
| `scripts/general/block-agent-tests.mjs` | `GENERAL-MJS` |
| `scripts/general/check-active-docs.mjs` | `GENERAL-MJS` |
| `scripts/general/check-agents-folder.mjs` | `GENERAL-MJS` |
| `scripts/general/check-agents-md.mjs` | `GENERAL-MJS` |
| `scripts/general/check-composer-styles.mjs` | `GENERAL-MJS` |
| `scripts/general/check-docs-purity.mjs` | `GENERAL-MJS` |
| `scripts/general/check-failures.mjs` | `GENERAL-MJS` |
| `scripts/general/check-governance.mjs` | `GENERAL-MJS` |
| `scripts/general/check-plans-purity.mjs` | `GENERAL-MJS` |
| `scripts/general/check-product-icons.mjs` | `GENERAL-MJS` |
| `scripts/general/check-repo-layout.mjs` | `GENERAL-MJS` |
| `scripts/general/check-root-markdown-links.mjs` | `GENERAL-MJS` |
| `scripts/general/check-sharp.js` | `GENERAL-JS` |
| `scripts/general/check-style-tokens.mjs` | `GENERAL-MJS` |
| `scripts/general/check-test-layout.mjs` | `GENERAL-MJS` |
| `scripts/general/check-worker-origin.mjs` | `GENERAL-MJS` |
| `scripts/general/ci-gate-env.mjs` | `GENERAL-MJS` |
| `scripts/general/cleanup-nested-installs.mjs` | `GENERAL-MJS` |
| `scripts/general/console-audit.mjs` | `GENERAL-MJS` |
| `scripts/general/fix-plan-refs.py` | `GENERAL-PY` |
| `scripts/general/fix-plan-refs2.py` | `GENERAL-PY` |
| `scripts/general/fix-plan-refs3.py` | `GENERAL-PY` |
| `scripts/general/generate-api-inventory.mjs` | `GENERAL-MJS` |
| `scripts/general/generate-docs.mjs` | `GENERAL-MJS` |
| `scripts/general/generate-persistence-sweep.mjs` | `GENERAL-MJS` |
| `scripts/general/generate-pseo-sku-matrix.mjs` | `GENERAL-MJS` |
| `scripts/general/generate-redirect-map.mjs` | `GENERAL-MJS` |
| `scripts/general/generate-route-index.mjs` | `GENERAL-MJS` |
| `scripts/general/generate-session-docs.py` | `GENERAL-PY` |
| `scripts/general/generate-test-inventory.mjs` | `GENERAL-MJS` |
| `scripts/general/guard-workspace-install.mjs` | `GENERAL-MJS` |
| `scripts/general/hollow-test-patterns.mjs` | `GENERAL-MJS` |
| `scripts/general/lint-ui-contract.mjs` | `GENERAL-MJS` |
| `scripts/general/loadEnvLocal.cjs` | `GENERAL-CJS` |
| `scripts/general/move-checklist.py` | `GENERAL-PY` |
| `scripts/general/prepare-standalone.cjs` | `GENERAL-CJS` |
| `scripts/general/prune-site-dumps.mjs` | `GENERAL-MJS` |
| `scripts/general/prune-stale-next-types.mjs` | `GENERAL-MJS` |
| `scripts/general/README.md` | `GENERAL-DOC` |
| `scripts/general/rename-plans.py` | `GENERAL-PY` |
| `scripts/general/root-surface-purity.mjs` | `GENERAL-MJS` |
| `scripts/general/run-console-audit-with-server.py` | `GENERAL-PY` |
| `scripts/general/run-oxlint.mjs` | `GENERAL-MJS` |
| `scripts/general/run-plan-wave1.mjs` | `GENERAL-MJS` |
| `scripts/general/run-test-audits.mjs` | `GENERAL-MJS` |
| `scripts/general/scan_secrets.mjs` | `GENERAL-MJS` |
| `scripts/general/startStandalone.cjs` | `GENERAL-CJS` |
| `scripts/general/sync-env-local-files.mjs` | `GENERAL-MJS` |
| `scripts/general/update-plans.py` | `GENERAL-PY` |
| `scripts/general/validate-launch-env.mjs` | `GENERAL-MJS` |
| `scripts/general/verify-plans.py` | `GENERAL-PY` |
| `scripts/general/workstation-env.mjs` | `GENERAL-MJS` |

### Counts, coverage statement, and exceptions

| Required family | Visible file count |
| --- | ---: |
| root tools | 120 |
| `scripts/general/` | 58 |
| `scripts/AsNeeded/` | 17 |
| `scripts/codemods/` | 2 |
| `scripts/generate-svg/` | 13 |
| `scripts/kiro-repo-guidance-setup/` | 25 |
| `scripts/lib/` | 12 |
| clearly named discovered family | 0 |
| **Total** | **247** |

**Coverage statement:** The 247 rows above provide exactly one path-identified `Inventory_Record` for every visible file returned under `scripts/` by the completed recursive directory listings, including root tools, executable candidates, helpers, fixtures, configuration, generated metadata, catalogs, seed inputs, documentation, and placeholders. Every file is assigned exactly one required family and one profile that explicitly supplies `Artifact_Type`, `Role`, `Runtime`, `Inputs`, `Outputs`, `Side_Effects`, `Direct_Dependencies`, `Support_Status`, and `Known_Entry_Points`. The inventory does not cover invisible, ignored, untracked, dynamically generated after listing, external, secret-bearing, or runtime-only artifacts, and it does not establish behavior beyond the recorded static evidence.

**Unclassified-artifact exception list:** none. There are no unclassified visible file artifacts. The four `.sonar` container paths listed in the scope boundary produced no visible file artifact and therefore correctly have no Inventory_Record. No discovered family was needed.

**Disposition and preservation note:** No `keep`, `maybe`, or `archive candidate` value is assigned in Task 2.1. In particular, no archival recommendation, archive location, archival action, or deletion recommendation is made. All artifacts remain active and untouched under the Task 1.1 preservation policy.

**Inventory blockers:** none for the requested path-level visible-file inventory. Bounded evidence limitations—not blockers—are: no individual body review except the three cited non-secret support files; no caller/import search; no ownership review; no runtime execution; and no secret inspection. These limitations must remain visible for Tasks 2.2–3.4 rather than being converted into negative findings.


## Task 2.2 — `scripts/general/` documented-membership reconciliation

**Status:** `COMPLETED` for a read-only documentation-to-visible-path reconciliation only. This ledger establishes neither caller status, runtime behavior, runnable status, ownership, safety, lifecycle, nor any disposition. A documented name is not thereby runnable, and an undocumented artifact is not thereby safe to archive, move, disable, or remove.

### Scope, method, and exact evidence

- **Reconciliation subject:** the README's expressly documented gate-critical/path-stable membership, compared only with visible directory metadata; no file bodies beyond the README were read for this task.
- **Observed `scripts/general/` universe:** 58 visible files, including support/documentation files; directories are containers, not artifacts. `scripts/general/.sonar/` was present as a directory with no visible file returned by the read-only listing. This reconciles the Task 2.1 `EVD-INV-007` inventory count.
- **`EVD-GEN-REC-001` — documented general membership:** `scripts/general/README.md:1-3, 18-65, 67-86`; read-only README inspection. Lines 24-34 enumerate install/layout/gate-purity members, lines 40-44 build/start/env members, lines 50-57 release-audit entries, lines 63-65 docs-generator members, and lines 83-86 state the `scripts/general/` membership rules.
- **`EVD-GEN-REC-002` — observed general artifacts:** `scripts/general/`; current-task read-only directory listing, line not applicable. It returned the 58 paths represented by the 26 present documented members and the 32 unmatched observed artifacts below. This is corroborated by `EVD-INV-007` in Task 2.1 (`scripts/general/`; directory-listing metadata, line not applicable).
- **`EVD-GEN-REC-003` — documented external release-audit path:** `scripts/general/README.md:51`; read-only README inspection records `tech-docs-generator/scripts/fake-test-audit.mjs`. A current-task read-only listing of `tech-docs-generator/scripts/`, line not applicable, observed that exact file.
- **`EVD-GEN-REC-004` — root path-stable SVG policy:** `scripts/general/README.md:67-79`; read-only README inspection. Current-task read-only listings of `scripts/`, `scripts/generate-svg/`, `scripts/generate-svg/_fixtures/`, and `scripts/generate-svg/__goldens__/`, line not applicable, observed the named root/path-stable locations and their visible wildcard contents.

**Reconciliation limits:** Evidence is static and path/documentation-bounded. It does not establish whether any item is called, gate-wired, imported, executable, safe, owned, obsolete, or eligible for any lifecycle action. `CSS-0` remains `NOT_PERFORMED`; no caller conclusion follows.

### Documented gate-critical members and observation result

The README's strict `scripts/general/` membership is 26 basename entries. All 26 were observed at the corresponding `scripts/general/<basename>` path (`EVD-GEN-REC-001`, `EVD-GEN-REC-002`):

| README inventory group | Documented member basenames observed in `scripts/general/` |
| --- | --- |
| Install / layout / gate purity (`README.md:24-34`) | `guard-workspace-install.mjs`; `cleanup-nested-installs.mjs`; `check-repo-layout.mjs`; `check-failures.mjs`; `check-agents-md.mjs`; `check-agents-folder.mjs`; `check-active-docs.mjs`; `check-plans-purity.mjs`; `check-docs-purity.mjs`; `check-root-markdown-links.mjs`; `check-test-layout.mjs` |
| Build / start / env (`README.md:40-44`) | `check-sharp.js`; `prepare-standalone.cjs`; `startStandalone.cjs`; `loadEnvLocal.cjs`; `validate-launch-env.mjs` |
| Release audits (`README.md:50, 52-57`) | `audit-hollow-tests.mjs`; `audit-gate-skips.mjs`; `audit-eslint-disable.mjs`; `audit-api-route-safety.mjs`; `scan_secrets.mjs`; `lint-ui-contract.mjs`; `run-oxlint.mjs` |
| Docs generators (`README.md:63-65`) | `generate-docs.mjs`; `generate-test-inventory.mjs`; `generate-route-index.mjs` |

**Documented item missing on disk:** none. The 26 general-member basenames above were observed in `scripts/general/`; the one additional README release-audit entry, `tech-docs-generator/scripts/fake-test-audit.mjs`, was observed at its explicitly documented external path (`EVD-GEN-REC-003`). This is a bounded path-existence result, not a runnable/gate-status conclusion.

### Observed artifacts not documented as gate-critical

Each row is an observed `scripts/general/` artifact not named as a gate-critical member by the README inventory (`EVD-GEN-REC-001`, `EVD-GEN-REC-002`). This is a membership-documentation mismatch only. **Owner is unknown — no owner is inferred from path.** Every row remains active and untouched. The owner question deliberately asks only whether README membership/policy should be clarified; it does not propose a disposition, archive candidate, archive path, or file action.

| Mismatch ID | Observed artifact | Exact evidence | Owner-decision question |
| --- | --- | --- | --- |
| `MM-GEN-001` | `scripts/general/.gitkeep` | `EVD-GEN-REC-002` | Should the membership owner explicitly allow this directory-retention support artifact outside the gate-critical list, or otherwise clarify the README rule? |
| `MM-GEN-002` | `scripts/general/README.md` | `EVD-GEN-REC-001`; `EVD-GEN-REC-002` | Should the membership owner explicitly identify this governing documentation as a permitted non-gate-critical support artifact? |
| `MM-GEN-003` | `scripts/general/audit-repo-state.py` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-004` | `scripts/general/block-agent-tests.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-005` | `scripts/general/check-composer-styles.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-006` | `scripts/general/check-governance.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-007` | `scripts/general/check-product-icons.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-008` | `scripts/general/check-style-tokens.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-009` | `scripts/general/check-worker-origin.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-010` | `scripts/general/ci-gate-env.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-011` | `scripts/general/console-audit.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-012` | `scripts/general/fix-plan-refs.py` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-013` | `scripts/general/fix-plan-refs2.py` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-014` | `scripts/general/fix-plan-refs3.py` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-015` | `scripts/general/generate-api-inventory.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-016` | `scripts/general/generate-persistence-sweep.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-017` | `scripts/general/generate-pseo-sku-matrix.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-018` | `scripts/general/generate-redirect-map.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-019` | `scripts/general/generate-session-docs.py` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-020` | `scripts/general/hollow-test-patterns.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-021` | `scripts/general/move-checklist.py` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-022` | `scripts/general/prune-site-dumps.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-023` | `scripts/general/prune-stale-next-types.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-024` | `scripts/general/rename-plans.py` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-025` | `scripts/general/root-surface-purity.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-026` | `scripts/general/run-console-audit-with-server.py` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-027` | `scripts/general/run-plan-wave1.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-028` | `scripts/general/run-test-audits.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-029` | `scripts/general/sync-env-local-files.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-030` | `scripts/general/update-plans.py` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-031` | `scripts/general/verify-plans.py` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |
| `MM-GEN-032` | `scripts/general/workstation-env.mjs` | `EVD-GEN-REC-002` | Should the membership owner document this artifact as gate-critical, document a permitted non-gate-critical exception, or correct its location policy after separate evidence review? |

### Documented membership mismatches

The 32 rows above are documented-membership mismatches because the observed artifact is not named in the README gate-critical inventory. There is one additional documentation-scope mismatch:

| Mismatch ID | Documented item and observed location | Exact evidence | Owner-decision question |
| --- | --- | --- | --- |
| `MM-GEN-033` | `tech-docs-generator/scripts/fake-test-audit.mjs` is listed in the `scripts/general/README.md` release-audit inventory but is observed at the explicitly named external location, not in `scripts/general/`. It is present, so it is **not** a missing-on-disk item. | `EVD-GEN-REC-001` (`README.md:50-57, 83-84`); `EVD-GEN-REC-003` | Should the membership owner keep this explicit external exception in the `general/` inventory and amend the basename/location rule, or relocate its documentation to a separate related-gate-artifacts section? |

### Protected-by-policy, path-stable SVG items — separate location ledger

These items are deliberately **outside** the `scripts/general/` observed-membership universe. The README preserves their existing locations because of stated product/test/publish/import relationships; their presence here is recorded separately so that policy is not misread as a `scripts/general/` location requirement. No caller or runtime assertion is made from this documentation.

| README-documented path-stable item | Visible observation | Stated location policy | Exact evidence |
| --- | --- | --- | --- |
| `scripts/generate-svg.mjs` | Observed at the root path. | Leave at `scripts/` root; README states product/tests import the path and it is the publish-authority entry. | `EVD-GEN-REC-004`; `README.md:67-75` |
| `scripts/generate-svg/pipelineCore.ts` | Observed in `scripts/generate-svg/`. | Leave at the documented path; README states planner SVG compile stages import it. | `EVD-GEN-REC-004`; `README.md:67-75` |
| `scripts/generate-svg/svgo.config.cjs` | Observed in `scripts/generate-svg/`. | Leave at the documented path; README identifies it as server sanitizer configuration. | `EVD-GEN-REC-004`; `README.md:67-75` |
| `scripts/generate-svg/_fixtures/*` | Observed visible contents: `.gitkeep`, `chaise.json`, `linear-desk-param.json`, `missing-geometry.json`, `sectional.json`, `side-table.json`. | Leave at the documented wildcard path; README identifies these as `p0:svg` and unit goldens. | `EVD-GEN-REC-004`; `README.md:67-76` |
| `scripts/generate-svg/__goldens__/*` | Observed visible contents: `.gitkeep`, `chaise-golden.svg`, `sectional-golden.svg`, `side-table-golden.svg`. | Leave at the documented wildcard path; README identifies these as snapshot goldens. | `EVD-GEN-REC-004`; `README.md:67-77` |

### Preservation record

No artifact was modified. All observed files remain active and untouched. This task creates no disposition records, archive candidates, archive-path decision, move/removal recommendation, or implementation action. The only outstanding matters are the owner decisions explicitly recorded for `MM-GEN-001` through `MM-GEN-033`.


## Task 3.1 — Root package-command wiring and caller evidence

**Status:** `COMPLETED` for the precise, read-only static package-manifest portion recorded as `CSS-2`. This is bounded caller evidence only. It does not complete `CSS-1`, Task 3.2 Ops-registry tracing, workflow/documentation/import/direct-invocation tracing, lifecycle/disposition work, or any runtime-safety conclusion. No command, package-manager operation, script, test, gate, build, browser runner, deployment, database operation, or mutation was run.

### Completed Caller_Search_Scope — `CSS-2` (`COMPLETED`)

- **Scope name:** root `package.json` `scripts` object and the two non-secret nested manifests strictly necessary to resolve root `pnpm --filter` / `pnpm --dir` command chains.
- **Included sources and exact selection:** `package.json:5-102` (all 98 root script keys); `tech-docs-generator/package.json:6-18` (only `build`, `dev`, `test`, and `gate` targets reached from root keys); and `workers/oando-worker-proxy/package.json:5-9` (only `dev`, `deploy`, and `tail` targets reached from root keys). `EVD-CSS2-001` through `EVD-CSS2-003` below record the source boundaries.
- **Excluded sources:** all other repository manifests, source, `scripts/` bodies (except Task 2 path evidence), workflows, documentation, imports, direct shell invocations, generated/ignored/untracked material, external systems, runtime contexts, and secret-bearing material. `.archive/audit/` remains excluded. No secret material was opened; environment assignments in manifest strings are reported only as variable names with values redacted.
- **Method:** read-only static manifest-key review; direct token resolution for `node <path>`, `pnpm exec tsx <path>`, and package-manager forwarding; nesting was followed only where the selected nested manifest supplied a literal command. A referenced `scripts/` path is corroborated as visible by Task 2.1 inventory evidence where applicable.
- **Search variants:** each exact root script key; literal `pnpm run <key>` targets; literal `pnpm --filter oando-tech-docs <key>` targets; literal `pnpm --dir workers/oando-worker-proxy <key>` targets; literal `node` / `tsx` script paths.
- **Result:** 98 root package commands have a `Caller_Record` and `Wiring_Record` pair below. Positive package caller evidence applies only to this manifest scope. No caller-absence assertion is made for any artifact.
- **Permitted conclusion:** each recorded root key is an `Actual_Caller` **within `CSS-2`** of its literal immediate route. A resolved terminal script artifact does not prove the artifact runs successfully, is safe, is live outside this scope, or has no additional callers. A root route that ends at `scripts/run-ops.mjs` is resolved only to that dispatcher; its dynamic command-registry terminal remains unresolved pending Task 3.2.

### Evidence records

| Record_ID | Source / exact location | Assertion and method | Limitation / redaction |
| --- | --- | --- | --- |
| `EVD-CSS2-001` | `package.json:5-102` | Read-only manifest-key review observed all 98 root `scripts` keys and their literal command strings. | Does not inspect command targets, package-manager lifecycle semantics, external binaries, runtime behavior, or callers outside this manifest. |
| `EVD-CSS2-002` | `tech-docs-generator/package.json:6-18` | Read-only nested-manifest review resolves root filtered `build`, `dev`, `test`, and `gate` routes. | Only keys reached from the root manifest were considered; target script bodies were not read. |
| `EVD-CSS2-003` | `workers/oando-worker-proxy/package.json:5-9` | Read-only nested-manifest review resolves root worker `dev`, `deploy`, and `tail` routes to `wrangler` runtimes. | Only keys reached from the root manifest were considered; no worker/runtime execution occurred. |
| `EVD-CSS2-004` | Task 2.1 `EVD-INV-001`, `EVD-INV-002`, `EVD-INV-007` | Prior read-only inventory corroborates visible `scripts/` literal path targets cited below. | Path existence is not behavior, caller, ownership, or safety evidence. |

### Record conventions, shared required fields, and terminology

Every table row represents the paired records named in its first column: `CAL-CSS2-nnn` (`Caller_Record`) and `WIR-nnn` (`Wiring_Record`). Common completed fields for **every** pair are: `Auditor: Kiro`; `Creation_Phase: Task 3.1`; `Contract_State: COMPLETED`; `Evidence_State: Observed` for the literal manifest text and `Inferred` only where the route is labelled by interpreter/tool; `Evidence_Refs: EVD-CSS2-001` plus `EVD-CSS2-002` or `EVD-CSS2-003` where cited; `Created_At/Updated_At: current task session — exact clock value unavailable from read-only tool evidence`; `Field_Completion: complete for the bounded CSS-2 manifest route`.

For every `Caller_Record`, `Caller_Path_or_Command` and `Command_or_Import_Name` are the displayed root key; `Caller_Kind: package`; `Relation: direct` unless the Route column says `forwarded`; `Caller_Search_Scope: CSS-2`; `Actual_Caller_Status: Actual_Caller within CSS-2`; `Working_Directory_Assumption: repository root (D:\23082026) — package scripts are declared by the root manifest; no `--dir` occurs unless shown`; and `Limitations: CSS-2 only; static evidence, no execution`.

For every `Wiring_Record`, `Entry_Point` is the displayed root key; `Caller_Ref` is the paired `CAL-CSS2-nnn`; `Observable_Effect: not established — reason: this task read manifests and did not inspect target bodies or execute a route`; `Discrepancy_Type` and `Required_P1_Plan_Item: not applicable — reason: Task 3.1 records wiring rather than assigning remediation`; and `Affected_Caller` is the paired caller. `Status: canonical` means only “literal manifest-declared entry route,” not an ownership/governance canonical-source decision. `Status: duplicated` is used only for an exact direct target/argument duplicate noted in the overlap column.

**Route notation:** `→` is ordered forwarding; `;` separates sequential literals in one command; `runtime:<tool>` is a terminal external runtime; `artifact:<path>` is a terminal script artifact for this task. `dispatcher unresolved` means the immediate artifact is resolved, but its internally dynamic route was deliberately not inspected until Task 3.2. `no-default` means the manifest declares no default beyond the exact literal arguments shown. `env:<NAME>=[redacted]` reports a name only; no environment value is reproduced.

### Caller_Record / Wiring_Record ledger — root package commands

| Paired records | Root command and exact root evidence | Dispatch and forwarding path / terminal target resolution | Runtime; declared arguments/defaults | Status and direct duplicate / overlap relationship |
| --- | --- | --- | --- | --- |
| `CAL-CSS2-001` / `WIR-001` | `preinstall` — `package.json:5` | `artifact:scripts/general/guard-workspace-install.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-002` / `WIR-002` | `postinstall` — `package.json:6` | `artifact:scripts/general/cleanup-nested-installs.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-003` / `WIR-003` | `dev` — `package.json:7` | `runtime:next dev` | Next.js CLI; `site --webpack` | canonical; none established |
| `CAL-CSS2-004` / `WIR-004` | `observability:up` — `package.json:8` | `runtime:docker compose` | Docker Compose; `-f config/observability/docker-compose.yml up -d` | canonical; observability runtime family with `WIR-005`/`WIR-006`, different operation |
| `CAL-CSS2-005` / `WIR-005` | `observability:down` — `package.json:9` | `runtime:docker compose` | Docker Compose; `-f config/observability/docker-compose.yml down` | canonical; observability runtime family with `WIR-004`/`WIR-006`, different operation |
| `CAL-CSS2-006` / `WIR-006` | `observability:logs` — `package.json:10` | `runtime:docker compose` | Docker Compose; `-f config/observability/docker-compose.yml logs -f` | canonical; observability runtime family with `WIR-004`/`WIR-005`, different operation |
| `CAL-CSS2-007` / `WIR-007` | `build` — `package.json:11` | forwarded: `pnpm run build:site → WIR-008`; `pnpm run build:tech-docs → WIR-009` | pnpm; no additional args | canonical; aggregate of `WIR-008` and `WIR-009` |
| `CAL-CSS2-008` / `WIR-008` | `build:site` — `package.json:12` | `artifact:scripts/general/check-sharp.js`; `runtime:next build`; `artifact:scripts/general/prepare-standalone.cjs` | Node.js / Next.js CLI; `site --webpack` on Next segment | canonical; component of `WIR-007` |
| `CAL-CSS2-009` / `WIR-009` | `build:tech-docs` — `package.json:13`; nested `tech-docs-generator/package.json:11` | forwarded: filtered `build → artifact:tech-docs-generator/scripts/generate-all.mjs; runtime:vite build; artifact:tech-docs-generator/scripts/publish-all.mjs` | pnpm / Node.js / Vite; nested publish args `--surfaces=site` | canonical; component of `WIR-007` |
| `CAL-CSS2-010` / `WIR-010` | `start` — `package.json:14` | `artifact:scripts/general/startStandalone.cjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-011` / `WIR-011` | `typecheck` — `package.json:15` | `artifact:scripts/general/prune-stale-next-types.mjs`; `runtime:tsc` | Node.js / TypeScript CLI; `-p site/tsconfig.json --noEmit` | canonical; included by `WIR-018` |
| `CAL-CSS2-012` / `WIR-012` | `typecheck:tests` — `package.json:16` | `runtime:tsc` | TypeScript CLI; `-p tests/tsconfig.json --noEmit` | canonical; included by `WIR-019` |
| `CAL-CSS2-013` / `WIR-013` | `lint` — `package.json:17` | `artifact:scripts/general/run-oxlint.mjs` | Node.js; no-default | duplicated; exact direct target/args duplicate of `WIR-047` |
| `CAL-CSS2-014` / `WIR-014` | `lint:fix` — `package.json:18` | `artifact:scripts/general/run-oxlint.mjs` | Node.js; `--fix` | canonical; overlaps `WIR-013`/`WIR-047`, argument differs |
| `CAL-CSS2-015` / `WIR-015` | `lint:ui:strict` — `package.json:19` | `artifact:scripts/general/lint-ui-contract.mjs` | Node.js; `--strict` | canonical; overlaps `WIR-047`, argument differs |
| `CAL-CSS2-016` / `WIR-016` | `gate` — `package.json:20` | forwarded: `pnpm run release:gate → WIR-018` | pnpm; no additional args | canonical; forwarding alias of `WIR-018` |
| `CAL-CSS2-017` / `WIR-017` | `gate:fast` — `package.json:21` | forwarded: `pnpm run release:gate:fast → WIR-019` | pnpm; no additional args | canonical; forwarding alias of `WIR-019` |
| `CAL-CSS2-018` / `WIR-018` | `release:gate` — `package.json:22` | forwarded in listed order: `check:layout → WIR-025`; `verify:focss → WIR-020`; `test:audit → WIR-065`; `lint → WIR-013`; `lint:ui:strict → WIR-015`; `typecheck → WIR-011`; `test → WIR-051`; `build → WIR-007`; `test:a11y → WIR-063`; `test:planner-catalog → WIR-064`; `test:coverage → WIR-061`; `test:coverage:site → WIR-062`; `check:docs-all → WIR-032`; `check:style-tokens → WIR-039`; `check:governance → WIR-040` | pnpm; no additional args | canonical; aggregate, not a direct terminal target |
| `CAL-CSS2-019` / `WIR-019` | `release:gate:fast` — `package.json:23` | `artifact:scripts/general/prune-site-dumps.mjs`; then forwarded `check:layout → WIR-025`, `verify:focss → WIR-020`, `typecheck → WIR-011`, `typecheck:tests → WIR-012`, `p0:unit → WIR-058`, `test:priority-7 → WIR-059`, `test:priority-8 → WIR-060`, `test:audit:fast → WIR-066`, `lint → WIR-013`, `lint:ui:strict → WIR-015`, `check:ui-assets → WIR-033`, `check:launch → WIR-038`, `check:docs-all → WIR-032`, `check:style-tokens → WIR-039`, `check:governance → WIR-040` | Node.js / pnpm; no additional args | canonical; aggregate, including prune terminal |
| `CAL-CSS2-020` / `WIR-020` | `verify:focss` — `package.json:24` | `artifact:scripts/AsNeeded/verify-focss-imports.mjs`; `artifact:scripts/AsNeeded/verify-site-css.mjs`; `artifact:scripts/AsNeeded/verify-focss-fences.mjs`; `artifact:scripts/AsNeeded/verify-focss-module-imports.mjs`; `artifact:scripts/AsNeeded/verify-focss-structure.mjs` | Node.js; no-default for each | canonical; aggregate used by `WIR-018`/`WIR-019` |
| `CAL-CSS2-021` / `WIR-021` | `plan:wave1` — `package.json:25` | `artifact:scripts/general/run-plan-wave1.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-022` / `WIR-022` | `plan:pseo-matrix` — `package.json:26` | `artifact:scripts/general/generate-pseo-sku-matrix.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-023` / `WIR-023` | `scan:boundaries` — `package.json:27` | `artifact:scripts/scan-boundaries.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-024` / `WIR-024` | `scan:secrets` — `package.json:28` | `artifact:scripts/general/scan_secrets.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-038` |
| `CAL-CSS2-025` / `WIR-025` | `check:layout` — `package.json:29` | `artifact:scripts/general/check-repo-layout.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-032` |
| `CAL-CSS2-026` / `WIR-026` | `check:failures` — `package.json:30` | `artifact:scripts/general/check-failures.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-032` |
| `CAL-CSS2-027` / `WIR-027` | `check:agents-md` — `package.json:31` | `artifact:scripts/general/check-agents-md.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-032` |
| `CAL-CSS2-028` / `WIR-028` | `check:agents-folder` — `package.json:32` | `artifact:scripts/general/check-agents-folder.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-032` |
| `CAL-CSS2-029` / `WIR-029` | `check:active-docs` — `package.json:33` | `artifact:scripts/general/check-active-docs.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-032` |
| `CAL-CSS2-030` / `WIR-030` | `check:plans-purity` — `package.json:34` | `artifact:scripts/general/check-plans-purity.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-032` |
| `CAL-CSS2-031` / `WIR-031` | `check:docs-purity` — `package.json:35` | `artifact:scripts/general/check-docs-purity.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-032` |
| `CAL-CSS2-032` / `WIR-032` | `check:docs-all` — `package.json:36` | `artifact:scripts/general/check-repo-layout.mjs`; `check-failures.mjs`; `check-agents-md.mjs`; `check-agents-folder.mjs`; `check-active-docs.mjs`; `check-plans-purity.mjs`; `check-docs-purity.mjs`; `check-root-markdown-links.mjs` (all under `scripts/general/`) | Node.js; no-default for each | canonical; aggregate overlaps `WIR-025`–`WIR-031` and `WIR-044` |
| `CAL-CSS2-033` / `WIR-033` | `check:ui-assets` — `package.json:37` | `artifact:scripts/general/check-product-icons.mjs`; `artifact:scripts/general/check-composer-styles.mjs` | Node.js; no-default for each | canonical; aggregate overlaps `WIR-034` and `WIR-035` |
| `CAL-CSS2-034` / `WIR-034` | `check:product-icons` — `package.json:38` | `artifact:scripts/general/check-product-icons.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-033` |
| `CAL-CSS2-035` / `WIR-035` | `check:composer-styles` — `package.json:39` | `artifact:scripts/general/check-composer-styles.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-033` |
| `CAL-CSS2-036` / `WIR-036` | `check:i18n:parity` — `package.json:40` | `artifact:scripts/check-i18n-key-parity.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-041` |
| `CAL-CSS2-037` / `WIR-037` | `check:env:full` — `package.json:41` | `artifact:scripts/check_all_env_full.ts` | `pnpm exec tsx`; no-default | canonical; potential environment use is not inspected; no values reported |
| `CAL-CSS2-038` / `WIR-038` | `check:launch` — `package.json:42` | `artifact:scripts/general/validate-launch-env.mjs`; `artifact:scripts/general/scan_secrets.mjs`; `artifact:scripts/db_test_connection.ts` | Node.js; Node.js; `pnpm exec tsx`, respectively; no-default | canonical; overlaps `WIR-024` and `WIR-042`; potential environment use not inspected |
| `CAL-CSS2-039` / `WIR-039` | `check:style-tokens` — `package.json:43` | `artifact:scripts/general/check-style-tokens.mjs` | Node.js; no-default | canonical; included by `WIR-018`/`WIR-019` |
| `CAL-CSS2-040` / `WIR-040` | `check:governance` — `package.json:44` | `artifact:scripts/general/check-governance.mjs` | Node.js; no-default | canonical; included by `WIR-018`/`WIR-019` |
| `CAL-CSS2-041` / `WIR-041` | `check:site-ui` — `package.json:45` | `artifact:scripts/check-site-page-shell.mjs`; `check-i18n-key-parity.mjs`; `check-marketing-copy-source.mjs`; `check-marketing-inline-style.mjs`; `check-homepage-dialect.mjs` (all under `scripts/`) | Node.js; no-default for each | canonical; overlaps `WIR-036` |
| `CAL-CSS2-042` / `WIR-042` | `launch:env` — `package.json:46` | `artifact:scripts/general/validate-launch-env.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-038` |
| `CAL-CSS2-043` / `WIR-043` | `env:sync` — `package.json:47` | `artifact:scripts/general/sync-env-local-files.mjs` | Node.js; no-default | canonical; potential environment use not inspected; no values reported |
| `CAL-CSS2-044` / `WIR-044` | `docs:check:root-links` — `package.json:48` | `artifact:scripts/general/check-root-markdown-links.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-032` |
| `CAL-CSS2-045` / `WIR-045` | `docs:check` — `package.json:49` | `artifact:scripts/general/generate-docs.mjs` | Node.js; `--check` | canonical; overlaps `WIR-046`, argument differs |
| `CAL-CSS2-046` / `WIR-046` | `docs:sync` — `package.json:50` | `artifact:scripts/general/generate-docs.mjs` | Node.js; `--all` | canonical; overlaps `WIR-045`, argument differs |
| `CAL-CSS2-047` / `WIR-047` | `lint:ui` — `package.json:51` | `artifact:scripts/general/lint-ui-contract.mjs` | Node.js; no-default | canonical; overlaps `WIR-015` (strict argument) and is not an exact duplicate |
| `CAL-CSS2-048` / `WIR-048` | `typecheck:scripts` — `package.json:52` | `runtime:tsc` | `pnpm exec tsc -p scripts/tsconfig.json --noEmit` | canonical; no script body target is declared |
| `CAL-CSS2-049` / `WIR-049` | `failures:sync` — `package.json:53` | `artifact:scripts/export-pending-failures.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-050` / `WIR-050` | `pretest` — `package.json:54` | forwarded: `pnpm run test:clean → WIR-053` | pnpm; no additional args | canonical; lifecycle association to `test` is a package-manager semantic not established by this manifest-only trace |
| `CAL-CSS2-051` / `WIR-051` | `test` — `package.json:55` | `artifact:scripts/run-full-vitest.mjs` | Node.js; no-default | canonical; `pretest`/`posttest` automatic lifecycle participation not expanded beyond literal manifest routes |
| `CAL-CSS2-052` / `WIR-052` | `posttest` — `package.json:56` | `artifact:scripts/generate-vitest-report.mjs` | Node.js; `results/tests/vitest-results.json` | canonical; report artifact also reached by `WIR-061` |
| `CAL-CSS2-053` / `WIR-053` | `test:clean` — `package.json:57` | `artifact:scripts/clean-test-artifacts.mjs` | Node.js; no-default | canonical; forwarded by `WIR-050`, `WIR-061`, `WIR-062`, `WIR-063`, `WIR-064` |
| `CAL-CSS2-054` / `WIR-054` | `test:watch` — `package.json:58` | `runtime:vitest` | `pnpm exec vitest --config tests/vitest.config.ts` | canonical; terminal runtime only |
| `CAL-CSS2-055` / `WIR-055` | `test:unit` — `package.json:59` | `runtime:vitest` | `pnpm exec vitest run --config tests/vitest.config.ts` | canonical; terminal runtime only |
| `CAL-CSS2-056` / `WIR-056` | `test:tech-docs` — `package.json:60` | `runtime:vitest` | `pnpm exec vitest run --config tests/vitest.tech-docs.config.ts` | canonical; terminal runtime only |
| `CAL-CSS2-057` / `WIR-057` | `test:coverage:admin` — `package.json:61` | `runtime:vitest` | `pnpm exec vitest run --coverage --config tests/vitest.admin.coverage.config.ts` | canonical; terminal runtime only |
| `CAL-CSS2-058` / `WIR-058` | `p0:unit` — `package.json:62` | `runtime:vitest` | `pnpm exec vitest run --config tests/vitest.config.ts --outputFile.json=../results/tests/vitest-p0-results.json` plus listed test paths | canonical; terminal runtime only |
| `CAL-CSS2-059` / `WIR-059` | `test:priority-7` — `package.json:63` | `runtime:vitest` | `pnpm exec vitest run --config tests/vitest.config.ts --outputFile.json=../results/tests/vitest-priority-7-results.json` plus listed test paths | canonical; terminal runtime only |
| `CAL-CSS2-060` / `WIR-060` | `test:priority-8` — `package.json:64` | `runtime:vitest` | `pnpm exec vitest run --config tests/vitest.config.ts --outputFile.json=../results/tests/vitest-priority-8-results.json` plus listed test paths | canonical; terminal runtime only |
| `CAL-CSS2-061` / `WIR-061` | `test:coverage` — `package.json:65` | `env:NODE_ENV=[redacted], env:DEV_AUTH_BYPASS=[redacted] → pnpm run test:clean → WIR-053`; then `runtime:vitest`; then `artifact:scripts/generate-coverage-report.mjs`; `artifact:scripts/generate-vitest-report.mjs` | cross-env / pnpm / Vitest / Node.js; Vitest `run --config tests/vitest.config.ts --coverage`; report args `planner`, then `results/tests/vitest-results.json` | canonical; overlaps `WIR-052` and `WIR-053`; environment names only |
| `CAL-CSS2-062` / `WIR-062` | `test:coverage:site` — `package.json:66` | `env:NODE_ENV=[redacted], env:DEV_AUTH_BYPASS=[redacted] → pnpm run test:clean → WIR-053`; then `runtime:vitest`; then `artifact:scripts/generate-coverage-report.mjs`; `artifact:scripts/generate-vitest-report.mjs` | cross-env / pnpm / Vitest / Node.js; Vitest `run --coverage --config tests/vitest.site.config.ts`; report args `site`, then `results/tests/vitest-site-results.json` | canonical; overlaps `WIR-052`, `WIR-053`, `WIR-061`; environment names only |
| `CAL-CSS2-063` / `WIR-063` | `test:a11y` — `package.json:67` | forwarded: `pnpm run test:clean → WIR-053`; then `runtime:playwright` | pnpm / Playwright; `test -c config/build/playwright.config.ts tests/e2e/accessibility.spec.ts` | canonical; overlaps `WIR-053` |
| `CAL-CSS2-064` / `WIR-064` | `test:planner-catalog` — `package.json:68` | forwarded: `pnpm run test:clean → WIR-053`; then `runtime:playwright` | pnpm / Playwright; `test -c config/build/playwright.config.ts` plus the listed seven E2E paths | canonical; overlaps `WIR-053` |
| `CAL-CSS2-065` / `WIR-065` | `test:audit` — `package.json:69` | `artifact:scripts/general/run-test-audits.mjs` | Node.js; `--preset=release` | canonical; overlaps `WIR-066`, argument differs |
| `CAL-CSS2-066` / `WIR-066` | `test:audit:fast` — `package.json:70` | `artifact:scripts/general/run-test-audits.mjs` | Node.js; `--preset=fast` | canonical; overlaps `WIR-065`, argument differs |
| `CAL-CSS2-067` / `WIR-067` | `test:audit:hollow` — `package.json:71` | `artifact:scripts/general/audit-hollow-tests.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-068` / `WIR-068` | `test:audit:fake-test` — `package.json:72` | `artifact:tech-docs-generator/scripts/fake-test-audit.mjs` | Node.js; no-default | canonical; external-to-`scripts/` terminal artifact, body not inspected |
| `CAL-CSS2-069` / `WIR-069` | `test:audit:gate-skips` — `package.json:73` | `artifact:scripts/general/audit-gate-skips.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-070` / `WIR-070` | `test:audit:eslint-disable` — `package.json:74` | `artifact:scripts/general/audit-eslint-disable.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-071` / `WIR-071` | `test:audit:api-routes` — `package.json:75` | `artifact:scripts/general/audit-api-route-safety.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-072` / `WIR-072` | `audit:visual` — `package.json:76` | `env:DEV_AUTH_BYPASS=[redacted] → runtime:playwright`; then `artifact:scripts/generate-visual-audit-report.mjs` | cross-env / Playwright / Node.js; `test -c config/build/playwright.config.ts tests/e2e/visual-audit-full-site.spec.ts` | canonical; terminal report overlaps `WIR-073`; environment name only |
| `CAL-CSS2-073` / `WIR-073` | `audit:visual:report` — `package.json:77` | `artifact:scripts/generate-visual-audit-report.mjs` | Node.js; no-default | canonical; terminal also reached by `WIR-072` |
| `CAL-CSS2-074` / `WIR-074` | `audit:site-pages` — `package.json:78` | `artifact:scripts/site-page-audit.mjs` | Node.js; `--out=results/site/page-audit-latest` | canonical; none established |
| `CAL-CSS2-075` / `WIR-075` | `graph:page-components` — `package.json:79` | `artifact:scripts/generate-page-component-graph.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-076` / `WIR-076` | `tech-docs:dev` — `package.json:80`; nested `tech-docs-generator/package.json:8` | forwarded: filtered `dev → runtime:vite` | pnpm / Vite; no-default | canonical; nested package CWD is `tech-docs-generator` after filter resolution |
| `CAL-CSS2-077` / `WIR-077` | `tech-docs:test` — `package.json:81`; nested `tech-docs-generator/package.json:15` | forwarded: filtered `test → runtime:vitest` | pnpm / Node.js; nested `../node_modules/vitest/vitest.mjs run` | canonical; nested package CWD is `tech-docs-generator` after filter resolution |
| `CAL-CSS2-078` / `WIR-078` | `tech-docs:gate` — `package.json:82`; nested `tech-docs-generator/package.json:12` | forwarded: filtered `gate → artifact:tech-docs-generator/scripts/gate.mjs` | pnpm / Node.js; no-default | canonical; nested package CWD is `tech-docs-generator` after filter resolution |
| `CAL-CSS2-079` / `WIR-079` | `gate:site-ui` — `package.json:83` | `artifact:scripts/gate-site-ui.mjs` | Node.js; no-default | canonical; none established |
| `CAL-CSS2-080` / `WIR-080` | `ops` — `package.json:84` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; no-default | canonical; Task 3.2 must resolve COMMANDS/default behavior |
| `CAL-CSS2-081` / `WIR-081` | `ops:list` — `package.json:85` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `list` | canonical; shared dispatcher with `WIR-080`, `WIR-082`–`WIR-088`, `WIR-092`–`WIR-097`; args differ |
| `CAL-CSS2-082` / `WIR-082` | `db:apply` — `package.json:86` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `db:apply` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-083` / `WIR-083` | `db:apply:admin` — `package.json:87` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `db:apply:admin` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-084` / `WIR-084` | `db:test` — `package.json:88` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `db:test` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-085` / `WIR-085` | `db:types` — `package.json:89` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `db:types` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-086` / `WIR-086` | `db:types:admin` — `package.json:90` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `db:types:admin` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-087` / `WIR-087` | `vercel:prod` — `package.json:91` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `vercel:prod` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-088` / `WIR-088` | `vercel:preview` — `package.json:92` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `vercel:preview` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-089` / `WIR-089` | `worker:dev` — `package.json:93`; nested `workers/oando-worker-proxy/package.json:6` | forwarded: `pnpm --dir workers/oando-worker-proxy dev → runtime:wrangler dev` | pnpm / Wrangler; no-default | canonical; nested command CWD is `workers/oando-worker-proxy` by explicit `--dir` |
| `CAL-CSS2-090` / `WIR-090` | `worker:deploy` — `package.json:94`; nested `workers/oando-worker-proxy/package.json:7` | forwarded: `pnpm --dir workers/oando-worker-proxy deploy → runtime:wrangler deploy` | pnpm / Wrangler; no-default | canonical; nested command CWD is `workers/oando-worker-proxy` by explicit `--dir` |
| `CAL-CSS2-091` / `WIR-091` | `worker:tail` — `package.json:95`; nested `workers/oando-worker-proxy/package.json:8` | forwarded: `pnpm --dir workers/oando-worker-proxy tail → runtime:wrangler tail` | pnpm / Wrangler; no-default | canonical; nested command CWD is `workers/oando-worker-proxy` by explicit `--dir` |
| `CAL-CSS2-092` / `WIR-092` | `r2:backup` — `package.json:96` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `backup:r2` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-093` / `WIR-093` | `r2:catalog-snapshot` — `package.json:97` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `catalog:snapshot:r2` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-094` / `WIR-094` | `r2:repo-backup` — `package.json:98` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `repo:backup:r2` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-095` / `WIR-095` | `r2:create-bucket` — `package.json:99` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `assets:r2:create-bucket` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-096` / `WIR-096` | `r2:count` — `package.json:100` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `assets:r2:count` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-097` / `WIR-097` | `dev:turbo` — `package.json:101` | `artifact:scripts/run-ops.mjs; dispatcher unresolved` | Node.js; `dev:turbo` | canonical; shared dispatcher, argument-specific route unresolved |
| `CAL-CSS2-098` / `WIR-098` | `seed:furniture` — `package.json:102` | `artifact:scripts/seed_furniture_catalog.ts` | `pnpm exec tsx`; no-default | canonical; potential environment/database interaction not inspected; no values reported |

### Totals, overlaps, and unresolved-route limitations

- **Commands traced:** 98 of 98 root `package.json` script keys (`CAL-CSS2-001` through `CAL-CSS2-098`).
- **Direct script targets:** 92 literal terminal script-target invocations appear in the resolved routes (this is an invocation count, not a distinct-path count; it includes repeated aggregate members and target artifacts outside `scripts/`). The remaining route segments terminate at declared external runtimes or forward to another recorded root key.
- **Terminal runtimes:** eight declared runtime families — `docker compose`, `next`, `tsc`, `tsx`, `vitest`, `playwright`, `vite`, and `wrangler` — with 28 literal runtime invocations across the ledger. This counts manifest route declarations, not successful execution.
- **Unresolved routes:** 15 argument-specific downstream routes are unresolved: `WIR-080` through `WIR-088` and `WIR-092` through `WIR-097` resolve to the visible `scripts/run-ops.mjs` dispatcher but not through its `COMMANDS` registry. This is a deliberate Task 3.2 boundary, not an absence finding. Package-manager automatic lifecycle behavior for `pretest`/`posttest` is also not asserted beyond their literal command declarations.
- **Key direct duplicate/overlap observations:** `lint` / `lint:ui` have the exact same direct target and no arguments (`WIR-013`, `WIR-047`); `lint:fix` and `lint:ui:strict` reuse their respective targets with distinct flags; `check:docs-all` aggregates seven individually exposed check targets plus `docs:check:root-links`; `check:ui-assets` aggregates both individually exposed UI checks; `check:launch` reuses both `scan:secrets` and `launch:env` targets; `docs:check` and `docs:sync` share `generate-docs.mjs` with different flags; coverage routes reuse clean/report targets; `audit:visual` reuses its report target; and 15 Ops keys share the `run-ops.mjs` dispatcher with distinct or absent subcommand arguments. These are static route relationships only, not a recommendation to consolidate, remove, or change any command.
- **CWD contract:** every root package command is declared from repository root `D:\23082026`; root-relative literal paths therefore carry a repository-root CWD contract. The only explicit deviations are nested filtered Tech Docs commands (effective package CWD `tech-docs-generator`) and worker commands with explicit `--dir workers/oando-worker-proxy`. This does not establish the CWD expected by target script bodies.
- **Expected observable effects:** no route has a behavior/effect conclusion beyond its literal declared command form. All `Wiring_Record` observable-effect fields are `not established` for the stated static-evidence reason.

### Preservation and next-task boundary

This bounded caller evidence preserves every cited artifact and command as active and untouched. It creates no disposition, no archive candidate, no archive location, no deletion/removal/move recommendation, and no archive manifest or index. The completed `CSS-2` register must not be represented as a completed full caller search: workflow, documentation, source/import, direct invocation, dynamic registry, external, ignored/untracked, generated, and runtime callers remain outside it. Task 3.2 must inspect `run-ops` and its `COMMANDS` registry before its downstream routes can be resolved; Tasks 3.3–3.4 remain required before any caller-search completion or lifecycle classification.


## Task 2.3 — Ownership and shared-helper records

**Status:** `COMPLETED` for the bounded static evidence below. No ownership is inferred from a path, name, historical comment, or the fact that an artifact has a caller. No owner approval was requested or received.

### Ownership evidence and decisions

| Record_ID | Subject | Static evidence | Owner status / proposed owner | Decision owner and required decision |
| --- | --- | --- | --- | --- |
| `OWN-SCRIPTS-ALL` | every `INV-...` under `scripts/` | `EVD-INV-001`–`EVD-INV-007` establish visible paths only; no non-secret CODEOWNERS/maintainer record was found in the bounded metadata review. | `unknown — reason: no explicit ownership evidence was observed`; proposed owner `unresolved — reason: ownership may not be inferred`. | repository owner; identify accountable owners before any lifecycle, governance, or archival decision. |
| `OWN-SCRIPTS-GENERAL` | `scripts/general/` | `EVD-GEN-REC-001` documents membership policy but names no accountable maintainer. | `unknown — reason: policy authorship/location does not identify an owner`; proposed owner `unresolved`. | repository owner; decide the membership-policy owner and resolve `MM-GEN-001`–`MM-GEN-033`. |
| `OWN-SCRIPTS-OPS` | `scripts/run-ops.mjs` and `scripts/ops-command-registry.mjs` | `EVD-OPS-001`–`EVD-OPS-003` below establish dispatcher/registry relation, not ownership. | `unknown — reason: no explicit owner record`; proposed owner `unresolved`. | repository owner; designate an Ops command-surface owner before any canonicalization work. |

### Shared-helper direct-import evidence

The direct-import inspection is static. “Direct importer” means an observed literal import in the shown source, not a runtime invocation. `Shared_Helper` is asserted only where two or more direct importers were observed. The complete source query had a 100-result presentation cap; it supports positive records below but **no negative importer conclusion** for any artifact omitted from the table.

| Record_ID | Helper / direct importers | Fan-in | Dependencies / shared side effects | Status and proposed owner |
| --- | --- | ---: | --- | --- |
| `OWN-LIB-ASSET-PATH-MAP-TOOLS` | `scripts/lib/assetPathMapTools.mjs` ← `scripts/fix-asset-paths.mjs:37-38`; `scripts/reverse-asset-paths.mjs:36-38` | 2 | helper body not inspected in Task 2.3; effects `unknown — reason: imports do not prove effects`. | `Shared_Helper`; owner `unknown`; proposed owner `unresolved`. |
| `OWN-LIB-CDN-ASSET-RESOLVER` | `scripts/lib/cdnAssetResolver.ts` ← `scripts/downloadCdnAssets.ts:10-12`; `scripts/auditUnresolvedCdnPaths.ts:5-7` | 2 | imports establish shared dependency only; side effects unknown. | `Shared_Helper`; owner `unknown`; proposed owner `unresolved`. |
| `OWN-LIB-R2-CATALOG` | `scripts/lib/r2Catalog.ts` ← `scripts/create-bucket.ts:6-8`; `scripts/deleteR2Bucket.ts:7-8`; `scripts/db_backup_upload_r2.ts:19-22`; `scripts/repo_backup_upload_r2.ts:21-23` | 4 | static import relationship; R2/database effects are not established by import evidence. | `Shared_Helper`; owner `unknown`; proposed owner `unresolved`. |
| `OWN-LIB-REPO-ROOT-MJS` | `scripts/lib/repoRoot.mjs` ← `scripts/check-site-page-shell.mjs:11-14`; `scripts/generate-site-ui-route-matrix.mjs:3-6`; `scripts/export-pending-failures.mjs:3-5`; `scripts/general/generate-docs.mjs:12-14`; `scripts/general/generate-test-inventory.mjs:10-12`; `scripts/codemods/homepage-dialect.mjs:6-8` | 6 observed | path-resolution dependency; side effects unknown. | `Shared_Helper`; owner `unknown`; proposed owner `unresolved`. |
| `OWN-LIB-REPO-ROOT-TS` | `scripts/lib/repoRoot.ts` ← `scripts/audit_slug_id_integrity.ts:9-12`; `scripts/audit_supabase_catalog.ts:4-6`; `scripts/audit_supabase_admin.ts:8-10`; `scripts/backfill_canonical_catalog_metadata.ts:9-12`; `scripts/backup_supabase.ts:4-6`; `scripts/db_backup_upload_r2.ts:19-23`; `scripts/downloadCdnAssets.ts:10-13` | 7 observed | path-resolution dependency; side effects unknown. | `Shared_Helper`; owner `unknown`; proposed owner `unresolved`. |
| `OWN-LIB-RESOLVE-PG-DUMP` | `scripts/lib/resolvePgDump.ts` ← `scripts/db_backup_pg_dump.ts:11-13`; `scripts/db_backup_upload_r2.ts:19-22` | 2 | executable-location resolution only; operational effect unknown. | `Shared_Helper`; owner `unknown`; proposed owner `unresolved`. |
| `OWN-LIB-SITE-UI-ROUTE-SOURCES` | `scripts/lib/siteUiRouteSources.mjs` ← `scripts/check-site-page-shell.mjs:11-14`; `scripts/generate-site-ui-route-matrix.mjs:3-6` | 2 | source-discovery dependency; effects unknown. | `Shared_Helper`; owner `unknown`; proposed owner `unresolved`. |
| `OWN-LIB-SCRIPT-ENV` | `scripts/lib/scriptEnv.mjs` ← `scripts/launch-smoke.mjs:6-8`; `tests/unit/scripts/lib/scriptEnv.test.ts:11-13` | 2 observed | base-URL/environment helper; values were neither read nor reported. | `Shared_Helper`; owner `unknown`; proposed owner `unresolved`. |
| `OWN-LIB-VITEST-EXCLUDES` | `scripts/lib/vitest-excludes.mjs` ← `tests/unit/scripts/lib/vitest-excludes.test.ts:8-10` | 1 observed | one observed direct importer; no negative conclusion because capped source output prevents exhaustive absence. | `not established as Shared_Helper`; owner `unknown`. |
| `OWN-LIB-EXPORT-MARKETING-COPY`, `OWN-LIB-RECOVERY-CLASSIFY` | the two remaining `scripts/lib/` executable helpers | no qualifying two-importer evidence observed | `unknown — reason: bounded query is positive-only and did not establish complete importer coverage`. | not Shared_Helper on this evidence; owner `unknown`. |

**Preservation consequence:** every `Shared_Helper` above is `keep`; it remains active and untouched. All ownership fields remain unresolved and block owner-dependent work.

## Task 3.2 — `run-ops` command map and registry derivation

**Status:** `COMPLETED` for static dispatcher/registry tracing. No command was run, no environment file was opened, and no secret value is reported.

### Evidence records

| Record_ID | Source / location | Assertion | Limitations |
| --- | --- | --- | --- |
| `EVD-OPS-001` | `scripts/run-ops.mjs:1-529` | `ROOT` resolves from the dispatcher location; every `run`, `runNode`, `runGeneral`, `runAsNeeded`, `runTsx`, `runPlaywright`, and `runPnpmScript` path uses `cwd: ROOT` directly or through `run`; `argv` removes one leading `--`; missing/help lists, and unknown names fail. `COMMANDS` is the dispatch source. | Static behavior only; no handler executed. |
| `EVD-OPS-002` | `scripts/ops-command-registry.mjs:1-56` | `listOpsCommandNames` reads `scripts/run-ops.mjs`, locates `const COMMANDS = {`, parses keys to its closing `};`, and sorts names; `opsCommandInvocation` returns `pnpm run ops <scriptName>`. | Parsing may fail if the dispatcher structure changes; it does not execute or validate handlers. |
| `EVD-OPS-003` | `package.json:84-101`; `scripts/general/README.md:11-16` | root aliases call the dispatcher; README documents root-only `pnpm run ops <name> [-- args]`. | The aliases cover only a subset of dispatcher keys. |

### Complete static `COMMANDS` route ledger

Each listed key is a `Caller_Record`/`Wiring_Record` under `CSS-OPS-1`: caller kind `Ops`; entry point `pnpm run ops <key>` (or a root alias where `EVD-CSS2-001` supplies one); runtime/CWD `Node dispatcher → ROOT`; observable effect `not established — static route only`; and owner `unknown`. The grouped terminal notation preserves each handler without presupposing a future dispatcher/registry split.

| COMMANDS keys | Static route / defaults and forwarding |
| --- | --- |
| `list`; omitted name; `help`; `--help` | lists sorted command keys, excluding `list`; no terminal script. |
| `db:apply`; `db:apply:admin` | `runTsx db_apply_migrations.ts`; admin prepends `--target admin`, then forwards remaining arguments. |
| `db:test`; `db:types:admin`; `db:advisors`; `db:advisors:security`; `db:advisors:performance`; `db:advisors:admin`; `db:backup-dropped`; `db:backup:pgdump`; `db:ensure-plans`; `db:sync-drizzle` | `runTsx` to respectively `db_test_connection.ts`, `db_gen_admin_types.ts`, `db_advisors.ts` (security/performance arguments where named), `db_advisors_admin.ts`, `db_backup_dropped_tables.ts`, `db_backup_pg_dump.ts`, `db_ensure_plans_table.ts`, `db_sync_drizzle_schema.ts`. |
| `db:types` | invokes `pnpm exec supabase gen types` using a project id derived from environment name(s) or documented fallback, then statically writes `site/platform/types/database.types.ts`; secret values were not inspected. |
| `check:worker-origin`; `launch:env`; `env:sync`; `scan:secrets`; `lint:type-aware`; `lint:ui`; `verify:db-svg`; `check-sharp`; `check:layout`; `check:failures`; `check:agents-md`; `check:agents-folder`; `check:active-docs`; `check:plans-purity`; `check:docs-purity`; `check:style-tokens`; `check:governance`; `check:product-icons`; `check:composer-styles`; `test:layout:check` | `runGeneral`/`runAsNeeded` to the same-named documented helper (except `lint:type-aware` adds `--type-aware`). |
| `backup:supabase:r2`; `catalog:snapshot:r2`; `repo:backup:r2`; `backup:r2`; `backup:github-secrets:sync` | `runTsx` database/catalog/repository backup target(s); `backup:r2` forwards sequentially to both upload scripts; GitHub secrets sync invokes the named PowerShell artifact. |
| `seed`; `seed:managed`; `seed:configurator`; `seed:block-descriptors`; `seed:furniture`; `sync:descriptor-svgs`; `audit:svg-catalog`; `catalog:blocks:qa`; `catalog:qa:sheet`; `catalog:organize:dry`; `catalog:organize:apply`; `catalog:organize:sync` | `runTsx` to the named seed/catalog target; organizer supplies respectively `--dry-run`, `--apply`, or `--sync-db --sync-catalog`. |
| `supabase:assets:arrange`; `supabase:backup`; `audit:supabase:catalog`; `audit:supabase:admin`; `supabase:backfill:canonical`; `supabase:backfill:images`; `audit:slug-id`; `audit:products:quality`; `alt:sync:dry`; `alt:sync:apply` | `runTsx` to the named target; alt apply adds `--apply`. |
| `assets:cdn:sync`; `assets:cdn:catalog`; `assets:cdn:audit`; `assets:cdn:fix`; `assets:cdn:replacements`; `assets:r2:create-bucket`; `assets:r2:delete-bucket`; `assets:cdn:upload`; `assets:cdn:upload:incremental`; `assets:audit:thirdparty`; `assets:r2:count` | Node/TSX/Python terminal; `assets:cdn:fix` adds `--apply`, incremental adds `--skip-existing`, third-party audit adds `--fail-on-hit`. |
| `launch:smoke`; `scan:tokens`; `scan:hardcoding`; `lint:secrets`; `typecheck:scripts` | Node terminal or external `pnpm exec` runtime; no target safety claim follows. |
| `docs:sync`; `docs:sync:all`; `docs:sync:routes`; `docs:sync:sitemap-csv`; `docs:sync:coverage`; `docs:check`; `docs:check:coverage`; `docs:check:root-links` | General/TSX docs target; `sync` and `sync:all` are exact forwarding duplicates to `generate-docs.mjs --all`; coverage/check variants forward declared arguments. |
| `site-ui:matrix`; `check:site-ui`; `check:site-ui:shell`; `check:i18n:parity`; `check:site-ui:copy`; `check:site-ui:inline-style`; `check:site-ui:dialect` | Node paths; aggregate `check:site-ui` sequentially calls its five component checks. |
| `i18n:sync:marketing`; `i18n:sync:hi-wave1`; `i18n:sync:deferred-locales`; `i18n:translate:deferred-locales`; `codemod:homepage-dialect`; `failures:sync`; `planner:lift-verify`; `planner:lift` | Node terminal; verify appends `--verify`; otherwise no default extra arguments. |
| `check:docs-all`; `check:ui-assets`; `check:launch`; `test:audit`; `test:audit:fast`; `test:audit:hollow`; `test:audit:fake-test`; `test:audit:gate-skips`; `test:audit:eslint-disable`; `test:audit:api-routes`; `gate:site-ui` | root-package forwarding or general/root terminal; audit preset adds `--preset=release`/`--preset=fast`; `check:launch` sequences env, secret scan, and DB check. |
| `vercel:preview`; `vercel:prod`; `dev:turbo` | external `pnpm` route; production first forwards to `release:gate`, then Vercel; preview/production conditionally append a token obtained by name only; Turbo supplies `DEV_AUTH_BYPASS=1`. |
| `tech-docs:generate`; `tech-docs:check`; `tech-docs:typecheck`; `tech-docs:test`; `tech-docs:build`; `test:tech-docs` | filtered package or Vitest terminal; no execution. |
| `test:browsers:install`; `test:unit`; `test:planner`; `test:planner:watch`; `test:apps`; `test:ui`; `test:coverage:inventory`; `test:coverage:admin`; `test:site-ui`; `test:design-kit`; `test:planner-catalog:watch`; `test:e2e:open3d-world`; `test:e2e:world-standard-w1w2`; `test:e2e:admin-retire-restore`; `test:e2e:assistant`; `test:e2e:nav`; `test:e2e:visual`; `test:admin:production-auth`; `test:auth:seed-users`; `test:auth:env`; `p0:svg`; `gate:planner`; `gate:open3d` | external Vitest/Playwright/PowerShell or named Node/TSX target; clean/coverage/gate branches have the explicit sequential forwarding in `run-ops.mjs`. All are deferred user-owned execution categories. |

**Registry comparison:** `ops-command-registry.mjs` has no independent command table: it derives names from the same `COMMANDS` source. Therefore there are **no evidenced missing or additional registry keys** and no registry/dispatcher split to consolidate. The only static forwarding differences are intentional handler aliases/aggregates above (`docs:sync` = `docs:sync:all`, `backup:r2`, `check:site-ui`, `check:ui-assets`, gates, and root aliases). `PIT-P1-001` is not created because no missing, renamed, mislocated, incompatible, unregistered, or unsupported target was evidenced.

## Task 3.3 — Workflow, documentation, source-import, and direct-invocation callers

**Status:** `COMPLETED` for the explicitly bounded positive static evidence. It does not establish runtime completion, a secret value, an external caller, or caller absence outside the completed source subsets.

### Workflow records (`CSS-WF-1`)

| Caller record | Trigger / job / setup / CWD / timeout | Command handoff | Secret boundary names only |
| --- | --- | --- | --- |
| `CAL-CSSWF-001` | `.github/workflows/release-gate.yml:1-99`; pull request and push to `main`; `gate-fast` (45 minutes) or `gate-full` (90 minutes); checkout, pnpm setup, Node 24/cache, root default CWD. | `pnpm run release:gate:fast` or `pnpm run release:gate`; full job additionally installs browser dependency. | workflow has secret expressions; names are intentionally not reproduced. |
| `CAL-CSSWF-002` | `.github/workflows/site-ui.yml:1-42`; pull request, push to `main`, manual dispatch; `gate`, 45 minutes; checkout/pnpm/Node 24/cache, root CWD. | `pnpm run gate:site-ui` → `scripts/gate-site-ui.mjs` by `WIR-079`. | secret expressions present; names not reproduced. |
| `CAL-CSSWF-003` | `.github/workflows/supabase-backup-r2.yml:1-35`; scheduled cron and manual dispatch; `backup`, 60 minutes; checkout/pnpm/Node 24/cache plus pg_dump installation, root CWD. | `pnpm run ops backup:supabase:r2` → `run-ops` → `db_backup_upload_r2.ts`. | database/R2 secret expressions present; names not reproduced. |
| `CAL-CSSWF-004` | `.github/workflows/tech-docs.yml:1-38`; pull request, push to `main`, manual dispatch; `gate`, 30 minutes; checkout/pnpm/Node 24/cache, root CWD. | `pnpm run tech-docs:gate` → nested tech-docs gate; artifact handoff `generated-documents/site/`, retention 7 days. | not applicable — no secret boundary is declared in this workflow. |

`EVD-CSSWF-001` is the full four-file workflow listing above. No other visible workflow file exists in the completed `.github/workflows/` listing. Workflow execution, secret values, environment effectiveness, and external service effects were not inspected.

### Documentation/source records and limitations

- `EVD-CSSD-001`: `START.md:21-25` documents root-only pnpm, `ops:list`, deployment/worker/R2 aliases; it is a documentation caller, not execution evidence.
- `EVD-CSSD-002`: `scripts/general/README.md:11-16, 18-86` documents root Ops invocation, general gate membership, and path-stable SVG contract.
- `EVD-CSSD-003`: `.github/instructions/migrations.instructions.md:73-105` documents Ops database commands; `tech-docs-generator/README.md:30-35`, `tech-docs-generator/src/pages/Database.tsx:99-110`, `Security.tsx:76-80`, and `Workflows.tsx:59-62` document selected Ops/deployment paths. These are documentation callers only.
- `EVD-CSSI-001`: positive direct imports include `tech-docs-generator/scripts/extract-commands.mjs:8-10` and `extract-route-domains.mjs:8-10` importing the Ops registry; test/source imports cited in Task 2.3; and the named test imports of `validate-launch-env`, i18n sync scripts, coverage/report helpers, general checks, and SVG support shown by the bounded search. Each positive literal import makes its target `keep`.
- `EVD-CSSX-001`: positive direct invocations include the root manifest routes in CSS-2 and test/source construction of literal script paths observed by the bounded search. Fixture strings and temporary-repository examples in tests are **not** treated as callers of repository artifacts. A capped search presentation and dynamic path construction remain limitations.

## Task 3.4 — Completed caller-search scope and dispositions

### Caller_Search_Scope register update

| Scope | Completion / included sources | Permitted conclusion |
| --- | --- | --- |
| `CSS-2` | completed root manifest subset, Task 3.1. | positive package callers only. |
| `CSS-OPS-1` | completed `scripts/run-ops.mjs:1-529`, `scripts/ops-command-registry.mjs:1-56`, and root Ops alias subset. | dispatcher/registry route and positive alias evidence only; no handler execution or non-alias caller absence. |
| `CSS-WF-1` | completed all four visible `.github/workflows/` YAML files. | positive workflow callers and absence only of an additional visible workflow file, not of other caller classes. |
| `CSS-DI-1` | completed positive documentation/import/direct-invocation search subsets cited in Task 3.3, excluding secrets and `.archive/audit/`; result presentation was capped. | positive matches only; no caller absence. |

`CSS-1` remains incomplete: dynamic construction, ignored/untracked/generated material, external callers, runtime-only callers, secret-bearing material, and capped source-search output are excluded or unresolved. Thus no artifact has a repository-wide caller-absence finding.

### Disposition records and count baseline

The 247 Task-2.1 inventory artifacts have one current disposition: **106 `keep`, 141 `maybe`, 0 `archive candidate`**. `keep` consists only of (1) the 26 README-documented `scripts/general` gate-critical artifacts, (2) the 13 README-protected path-stable SVG artifacts, (3) visible terminal artifacts with an `Actual_Caller` in `CSS-2`, `CSS-OPS-1`, `CSS-WF-1`, or positive `CSS-DI-1`, and (4) the eight evidence-backed Shared_Helpers in Task 2.3, with overlap counted once. The remaining 141 have incomplete caller, lifecycle, ownership, import, or safety evidence and are `maybe`; all remain active and untouched. The named source sets are the record index for the grouped `DSP-KEEP-001` and `DSP-MAYBE-001` disposition ledgers; no absence in a grouped ledger is broader than its completed scope.

No `archive candidate` record exists: no visible artifact has both explicit one-time/obsolete evidence and a completed, caller-free search scope. The only lifecycle result found (`START.md:46-47`) excludes `.archive/audit/` from recreation; it does not establish an archive destination or make any current artifact obsolete.

## Task 4.1 — Mandatory `keep` preservation

`DSP-KEEP-001` applies to all 106 evidence-backed keep artifacts. Each has `Actual_Caller_Evidence`, `Gate_Critical_Evidence`, or `Shared_Helper_Evidence` as stated in Tasks 2.2–3.4; `Affected_Owner: unknown`; `Active_and_Untouched_Requirement: keep active and preserve evidenced callers`; `Approval_Boundary: no removal/move authority`; `Plan_Item_Ref: PIT-P2-001` for future caller-preserving documentation only. No maintenance move, wrapper, or consolidation is authorized.

## Task 4.2 — Mandatory `maybe` preservation and safety contracts

`DSP-MAYBE-001` applies to the remaining 141 artifacts. Missing or conflicting inputs include incomplete CSS-1 coverage, no explicit owner, no individual lifecycle proof, dynamic/external caller limits, and uninspected operational side effects. `Next_Investigation: owner-approved complete static caller and safety review`; `Decision_Owner: repository owner`; `Active_and_Untouched_Requirement: required`; `Blocked_Status: blocked`.

Static safety controls observed in `run-ops.mjs` include fixed root CWD (`:14, 31-35`), argument forwarding (`:150-154`), explicit dry/apply routes (`:221-227, 240-241, 245-246`), error/non-zero propagation (`:36-44, 172-174, 519-527`), and a pre-production `release:gate` forwarding (`:437-448`). They do **not** prove terminal-script guards, confirmation, backup, recovery, database targeting, or runtime safety. Missing required safety evidence is a blocker for any future work; it must never be resolved by executing the artifact. `SAF-ALL-001` therefore assigns `Risk: unknown — reason: terminal bodies/environment were not fully safety-reviewed` and `Blocking_Safety_Plan_Item: PIT-P0-001`.

## Task 4.3 — Archive candidate assessment

**Result: 0 archive candidates.** There is no selected archive location, no move proposal, and no statement that an artifact can move now. Every artifact is either `keep` or `maybe`; any future archive candidate must remain active/untouched and meet the complete evidence, independent approval, manifest/index, caller-preservation, hash, restoration, and rollback requirements below.

## Tasks 5.1–5.4 — Reversible archival decision package

| Record | Current required value / block |
| --- | --- |
| `AIX-SCRIPTS-ARCHIVE-POLICY` | `Approved_Archive_Location: unresolved — reason: repository evidence establishes no approved scripts/support-artifact location`; `Archive_Index_Path: unresolved`; `.archive/audit/` excluded; `Blocked_Status: blocked`. |
| future `AMF-...` | original/approved archive/manifest/index paths, timestamp, pre/post SHA-256, equality evidence, caller dispositions, support-artifact set, artifact/caller owner approvals, restoration, and rollback are all `unresolved — reason: no approved candidate or location`. |
| `PIT-P0-002` | archive-location decision package: repository owner must independently approve exact repository-relative `Archive_Location` and Archive_Index documentation path. Blocked; no location is proposed. |
| future archive approval package | must contain completed caller scope, explicit one-time/obsolete evidence, affected Support_Artifact set, artifact owner and affected caller-owner decisions, acceptance signal, caller-preservation/migration sequence, restoration procedure, and rollback sequence. |
| future reversible sequence | reconfirm approvals → capture pre-move SHA-256 → intact move only to owner-approved location → capture post-move SHA-256 and require equality → preserve approved callers → update approved index → execute documented restoration verification only when owner-authorized; any failure/missing prerequisite blocks the move and leaves/restores the active artifact. |

## Tasks 6.1–6.3 — Future Audit_Plan, governance, and validation handoff

### Priority, dependencies, and waves

| Plan item / wave | Priority / dependency | Non-destructive future outcome / block |
| --- | --- | --- |
| `PIT-P0-001` / Wave 0 | P0; `DEP-PIT-P0-001-OWN-SCRIPTS-ALL` | owner-approved safety and ownership evidence for operational `maybe` artifacts; blocked. |
| `PIT-P0-002` / Wave 0 | P0; independent repository-owner archive-location decision | approve exact location and index path or keep every artifact active; blocked. |
| `PIT-P1-002` / Wave 1 | P1; complete uncapped caller scope and direct-import review | reconcile documentation/dispatcher/root aliases without changing command behavior; blocked. |
| `PIT-P2-001` / Wave 2 | P2; ownership resolution and `MM-GEN-*` decisions | publish governance/discoverability records for retained artifacts; no consolidation action implied; blocked. |
| future `PIT-P3-ARCHIVE-*` / Wave 3 | P3; depends on both P0s, complete caller evidence, explicit obsolete evidence, independent approvals, AMF/AIX, SHA equality, preservation/restoration/rollback | archival consideration only; blocked and non-executable. |

`GOV-ROOT-PNPM`: proposed canonical invocation is **`pnpm run <root-script-key>` from repository root**; where an Ops registry command has no root alias, the proposed canonical form is **`pnpm run ops <COMMANDS-key> [-- args]` from repository root**. This is a proposed governance contract, not a command change. `Canonical_Source: unresolved — reason: ownership is unresolved`; root package, dispatcher, README, workflows, and tech-doc documentation remain discoverability sources with duplicate/forwarding status as recorded above.

### Deferred validation handoffs

| Handoff | Narrowest future user-owned review | Prerequisites / execution status |
| --- | --- | --- |
| `VHD-WAVE-0-001` | manual owner review of CSS scopes, ownership, safety contracts, and `MM-GEN-*` records. | no secrets or runtime checks; `not run by audit`. |
| `VHD-WAVE-1-001` | static re-review of changed documentation/command maps against `package.json`, dispatcher, registry, and visible workflows. | owner-approved proposed change only; tests, gates, builds, browser, DB, deployment, storage, and persistent mutations deferred. |
| `VHD-WAVE-3-001` | owner-authorized manifest/index/hash/restoration review for a separately approved candidate. | requires all archive prerequisites; not run by audit; no move is authorized by this handoff. |

## Task 7.1 — Read-only completeness review

**Status:** `COMPLETED` for this assembled planning deliverable. The review confirms: all 247 inventory artifacts are covered by the current keep/maybe disposition baseline; positive package/Ops/workflow/documentation/import/direct-invocation caller evidence is recorded with scope limits; all evidenced caller/gate/shared-helper artifacts are keep; every maybe remains active and untouched; there are zero archive candidates; no archive destination is invented; `.archive/audit/` remains excluded; all future archive controls require independent approval, owner-approved location/index, manifests, SHA-256 equality, caller preservation, restoration, and rollback.

The plan contains no instruction to modify a non-planning file and claims no project/script/package/test/build/gate/browser/database/deployment command was executed. Remaining incomplete/capped/dynamic/external/secret-boundary facts are deliberately `maybe` or blocked, never treated as archival authorization.
