# Requirements Document

## Introduction

This completed-audit handoff records the final static evidence baseline for the visible `scripts/` toolchain and defines only the owner-gated residual decisions. The completed audit evidence is authoritative at `plans/ref/scripts-folder-audit.md`. This deliverable changes planning artifacts only; it authorizes no script, support-artifact, archive, package, workflow, source, configuration, dependency, secret, database, storage, deployment, or external-service action.

**Definitive no-action result:** all 247 visible script artifacts remain active and untouched. The completed disposition baseline is **106 `keep`, 141 `maybe`, and 0 `archive candidate`**. No deletion, move, disablement, archival action, archive-path selection, or runtime/source change is authorized.

## Completed-audit status and current facts

- The completed visible inventory covers 247 artifacts. Each has one current disposition: 106 `keep`, 141 `maybe`, and 0 `archive candidate`.
- Completed caller evidence is bounded: `CSS-2` traces all 98 root package commands; `CSS-OPS-1` traces `run-ops` and the derived registry; `CSS-WF-1` covers all four visible workflows; and `CSS-DI-1` records bounded positive documentation, import, and direct-invocation evidence.
- `CSS-1` is incomplete because dynamic, external, ignored, untracked, generated, runtime-only, and secret-bearing material is excluded or unresolved and source-result presentation was capped. No artifact has a completed caller-free scope.
- `ops-command-registry.mjs` derives names from `run-ops.mjs` `COMMANDS`; no missing or additional registry keys, dispatcher/registry split, or consolidation target is evidenced. Intentional forwarding aliases and aggregates include `docs:sync`/`docs:sync:all`, `backup:r2`, `check:site-ui`, `check:ui-assets`, gates, and root aliases.
- Static `run-ops` evidence establishes root CWD, argument forwarding, dry/apply routes, error propagation, and pre-production gate forwarding. It does not prove terminal guards, confirmation, recovery, database routing, or runtime safety.
- All 26 README-listed in-folder `scripts/general/` members exist. The 32 observed general artifacts that are not listed as gate-critical require ownership/documentation decisions `MM-GEN-001`–`MM-GEN-032`. `MM-GEN-033` records the explicitly documented external `tech-docs-generator/scripts/fake-test-audit.mjs`; it is present at that exact external path and is not missing, mislocated, or a relocation target. The 13 documented SVG artifacts are path-stable and preserved.
- The eight evidence-backed `keep` Shared_Helpers are `assetPathMapTools`, `cdnAssetResolver`, `r2Catalog`, `repoRoot.mjs`, `repoRoot.ts`, `resolvePgDump`, `siteUiRouteSources`, and `scriptEnv`. Their accountable owners remain unresolved, and capped positive evidence does not establish comprehensive negative helper coverage.
- `SAF-ALL-001` / `PIT-P0-001` remains the active safety blocker: operational `maybe` artifacts lack complete static terminal-body and environment safety evidence.
- The proposed canonical command form is `pnpm run <root-script-key>` from repository root, or, when no root alias exists, `pnpm run ops <COMMANDS-key> [-- args]` from repository root. Its canonical source and command-surface owner remain unresolved.

## Glossary

- **Completed_Audit**: The completed, bounded static audit recorded at `plans/ref/scripts-folder-audit.md`.
- **Residual_Decision**: An owner-gated documentation, ownership, or static-evidence decision that remains after the Completed_Audit.
- **Caller_Search_Scope**: A named, bounded static source set. A positive match is evidence only within that set; caller absence requires an explicitly completed caller-free scope.
- **Keep**: An evidence-backed preservation classification. The artifact and every evidenced caller remain active and untouched.
- **Maybe**: A classification for incomplete caller, lifecycle, ownership, helper, or safety evidence. The artifact remains active and untouched.
- **Archive_Candidate**: A future-only classification requiring both explicit one-time/obsolete evidence and a completed caller-free scope. No current artifact has this classification.
- **Safety_Contract**: A static record of target, database classification, environment/secret-boundary name only, guard, preview/apply control, confirmation, approval, recovery, and rollback evidence.
- **Canonical_Command**: The proposed root-only invocation form whose source and owner must be accepted before it is treated as governance.

## Requirements

### Requirement 1: Publish and accept the completed-audit baseline without action

**User Story:** As a repository owner, I want the completed audit accepted as the current baseline, so that no completed audit work is repeated or represented as pending.

#### Acceptance Criteria

1. THE handoff SHALL cite `plans/ref/scripts-folder-audit.md` as the completed-audit evidence source and SHALL preserve the 247 / 106 `keep` / 141 `maybe` / 0 `archive candidate` baseline.
2. THE handoff SHALL state that `keep` and `maybe` artifacts remain active and untouched and that no deletion, move, disablement, archive action, archive-location selection, or runtime/source change is authorized.
3. THE handoff SHALL identify `CSS-2`, `CSS-OPS-1`, `CSS-WF-1`, and `CSS-DI-1` as completed bounded positive evidence and SHALL state that `CSS-1` remains incomplete.
4. THE acceptance review SHALL be static/manual and owner-owned; it SHALL not rerun the completed audit or execute project operations.

### Requirement 2: Appoint accountable owners and resolve general-membership decisions

**User Story:** As a repository owner, I want accountable ownership and documentation decisions recorded, so that residual governance questions are decided without changing artifact behavior.

#### Acceptance Criteria

1. A repository owner SHALL appoint an accountable owner for `scripts/general/`, an Ops command-surface owner, and accountable owners for the eight evidence-backed Shared_Helpers, or SHALL record an explicit unresolved decision and escalation path.
2. The appointed `scripts/general/` owner SHALL resolve `MM-GEN-001` through `MM-GEN-033` as ownership/documentation decisions only. `MM-GEN-033` SHALL remain documented as the existing external tech-docs fake-test audit path and SHALL not be characterized as missing, mislocated, or a relocation target.
3. The handoff SHALL preserve the 26 README-listed in-folder members and the 13 path-stable SVG artifacts without proposing a path or behavior change.
4. The handoff SHALL retain the limitation that the completed helper evidence is positive-only and does not establish comprehensive negative importer coverage.

### Requirement 3: Permit only an owner-approved uncapped static caller/import review for `maybe` artifacts

**User Story:** As a repository owner, I want the residual caller uncertainty reduced only under an explicit static-review approval, so that completed bounded evidence is not rerun or overstated.

#### Acceptance Criteria

1. A future review SHALL begin only after owner approval and SHALL be uncapped, static, read-only, and scoped to the 141 `maybe` artifacts and their relevant caller/import variants.
2. The future review SHALL preserve the completed `CSS-2`, `CSS-OPS-1`, `CSS-WF-1`, and `CSS-DI-1` records as baseline evidence rather than rerunning them.
3. The future review SHALL record dynamic, external, ignored, untracked, generated, runtime-only, and secret-bearing limitations; it SHALL not claim caller absence unless its completed scope supports that conclusion.
4. The future review SHALL not execute scripts, inspect secret values, modify sources, packages, workflows, documentation, or artifacts, or authorize lifecycle action.

### Requirement 4: Resolve the operational safety blocker through an owner-approved static safety-contract review

**User Story:** As a repository owner, I want complete static safety contracts for operational `maybe` artifacts, so that safety uncertainty is explicit without performing runtime operations.

#### Acceptance Criteria

1. `SAF-ALL-001` / `PIT-P0-001` SHALL remain blocked until an owner-approved static review records, for each applicable operational `maybe` artifact: target, Admin/Products/unknown database classification, environment and secret-boundary names only, guard, preview/apply control, confirmation, approval, recovery, and rollback.
2. The review SHALL treat the observed `run-ops` controls as dispatcher-level static evidence only and SHALL not claim terminal guards, confirmation, recovery, database routing, or runtime safety from them.
3. The review SHALL not execute an artifact, access secret values, connect to a database, or perform a deployment, backup, restore, or other persistent operation.
4. An incomplete record SHALL preserve the `maybe` classification and active/untouched state.

### Requirement 5: Review governance and proposed canonical commands without behavior change

**User Story:** As an owner, I want command discoverability reviewed without converting known forwarding aliases into a refactor directive.

#### Acceptance Criteria

1. The appointed command-surface owner SHALL review the proposed canonical command form: `pnpm run <root-script-key>` from repository root, or `pnpm run ops <COMMANDS-key> [-- args]` from repository root when no root alias exists.
2. The review SHALL record the canonical source decision and the status of known intentional aliases/aggregates, including `docs:sync`/`docs:sync:all`, `backup:r2`, `check:site-ui`, `check:ui-assets`, gates, and root aliases.
3. The review SHALL preserve the no-drift conclusion: `ops-command-registry.mjs` derives from `run-ops.mjs` `COMMANDS`, with no evidenced missing/additional keys and no dispatcher/registry split to consolidate.
4. The review SHALL not alter command behavior, aliases, dispatch, registry code, packages, workflows, or sources.

### Requirement 6: Treat archival as a conditional future contingency only

**User Story:** As a repository owner, I want archival controls ready only if a future candidate is first evidenced, so that no archive policy becomes an active work wave.

#### Acceptance Criteria

1. No archival task, Archive_Location, Archive_Manifest, or Archive_Index decision SHALL enter an active priority wave while the completed baseline has zero archive candidates.
2. Only after a future artifact has both explicit one-time/obsolete evidence and a completed caller-free scope may an owner consider an archival contingency package.
3. That future package SHALL require independent owner approval, caller and Support_Artifact preservation decisions, an owner-approved repository-relative location and index path, intact content-hash evidence, restoration procedure, and rollback sequence. `.archive/audit/` remains excluded; this handoff SHALL not propose another destination.
4. If no future artifact satisfies the strict evidence rule, the archival contingency SHALL be an explicit no-op and every artifact SHALL remain active and untouched.

## Out of Scope

- Repeating completed inventory, package, Ops, workflow, documentation, import, or direct-invocation audit work.
- Deletion, movement, disablement, archival, archive-location selection, relocation, consolidation, or source/runtime behavior changes.
- Commands, tests, gates, builds, package operations, scripts, browsers, databases, deployments, external operations, or secret-value inspection.
- Treating bounded static evidence as runtime safety, comprehensive caller absence, ownership approval, or lifecycle authorization.
