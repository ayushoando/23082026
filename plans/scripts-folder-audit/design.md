# Design: Completed Scripts Folder Audit Handoff

## Overview

### Purpose and operating boundary

This design is a completed-audit handoff, not an architecture for repeating the audit. Its evidence baseline is `plans/ref/scripts-folder-audit.md`. Only the three planning artifacts in `plans/scripts-folder-audit/` are in scope for revision. No command, test, gate, build, package operation, script, browser, database, deployment, external operation, secret inspection, or non-planning-file change is authorized.

The definitive current result is: **247 visible artifacts; 106 `keep`; 141 `maybe`; 0 `archive candidate`**. Every `keep` and `maybe` artifact remains active and untouched. No deletion, move, disablement, archival action, archive-path choice, or runtime/source change is an output of this handoff.

## Architecture

### Completed-audit handoff architecture

```text
Completed evidence baseline
  -> owner acceptance with no artifact actions
  -> ownership and documentation decisions
  -> owner-approved uncapped static caller/import review for `maybe`
  -> owner-approved static operational safety-contract review
  -> governance/canonical-command review with no behavior change
  -> conditional archival contingency only if a future strict candidate exists
```

The active architecture is evidence-to-decision, not audit-to-implementation. `CSS-2` supplies the completed 98-root-command trace; `CSS-OPS-1` supplies completed dispatcher/registry tracing; `CSS-WF-1` covers four workflows; and `CSS-DI-1` supplies bounded positive documentation/import/direct-invocation evidence. `CSS-1` remains incomplete because dynamic, external, ignored, untracked, generated, runtime-only, and secret-bearing material is unresolved or excluded and source output was capped. Static evidence never proves runtime safety or caller absence beyond a completed, stated scope.

### Active decision components and sequencing

1. **Baseline acceptance:** publish and accept the completed counts and no-action result.
2. **Ownership and documentation:** appoint owners and resolve `MM-GEN-001`–`MM-GEN-033` plus command-surface ownership; preserve every path and behavior.
3. **Caller/import evidence:** only an owner-approved, uncapped, static review may extend evidence for the 141 `maybe` artifacts. It supplements, never reruns, completed scope records.
4. **Safety evidence:** `SAF-ALL-001` / `PIT-P0-001` is the active blocker. An owner-approved static review must capture the required safety-contract fields for operational `maybe` artifacts.
5. **Governance:** review proposed canonical command usage and known aliases without modifying command behavior.
6. **Archival contingency:** inactive and no-op unless a future artifact first satisfies the strict candidate rule.

Archive policy has no active P0 or P1 wave. There is no current archive candidate, location task, manifest task, index task, or archive destination. `.archive/audit/` remains excluded, and no alternate destination is proposed.

## Components and Interfaces

### Evidence baseline and ownership interface

The completed inventory is the immutable planning baseline. The 106 `keep` artifacts include the 26 README-listed `scripts/general/` gate-critical members, 13 path-stable SVG artifacts, positively called terminal artifacts, and the eight evidence-backed Shared_Helpers: `assetPathMapTools`, `cdnAssetResolver`, `r2Catalog`, `repoRoot.mjs`, `repoRoot.ts`, `resolvePgDump`, `siteUiRouteSources`, and `scriptEnv`. The completed positive-only importer query was capped; it does not establish comprehensive negative helper evidence. Accountable owners for those helpers remain unresolved.

All 26 README-listed in-folder general members exist. The 32 observed general artifacts not listed as gate-critical require `MM-GEN-001`–`MM-GEN-032` ownership/documentation decisions. `MM-GEN-033` records the explicitly documented external `tech-docs-generator/scripts/fake-test-audit.mjs`; it exists at that exact external path and is neither missing nor a relocation target. The 13 documented SVG artifacts remain path-stable and preserved.

### Command-surface interface and no-drift conclusion

`ops-command-registry.mjs` derives names from `run-ops.mjs` `COMMANDS`. The evidence establishes no missing/additional registry keys and no dispatcher/registry split to consolidate. Intentional forwarding aliases/aggregates include `docs:sync`/`docs:sync:all`, `backup:r2`, `check:site-ui`, `check:ui-assets`, gates, and root aliases. They are governance review subjects, not behavior-change proposals.

Static dispatcher evidence records root CWD, argument forwarding, dry/apply routes, error propagation, and pre-production gate forwarding. Those controls do not establish terminal guards, confirmation, recovery, database routing, or runtime safety. The proposed canonical command form is `pnpm run <root-script-key>` from repository root; if no root alias exists, it is `pnpm run ops <COMMANDS-key> [-- args]` from repository root. The canonical source and command-surface owner remain unresolved.

### Safety evidence boundary

The 141 `maybe` artifacts remain blocked by incomplete caller, lifecycle, ownership, helper, and/or safety evidence. `SAF-ALL-001` / `PIT-P0-001` requires a future owner-approved static safety-contract review for applicable operational artifacts. Each record must capture target, database classification (`Admin`, `Products`, or `unknown` with reason), environment/secret-boundary name only, guard, preview/apply control, confirmation, approval, recovery, and rollback. It must not access secret values or execute an artifact.

## Data Models

### Completed and residual records

| Record | Current handoff use |
| --- | --- |
| `Completed_Audit_Baseline` | Counts, dispositions, scope limitations, preservation policy, and reference to completed audit evidence. |
| `Ownership_Decision` | Accountable owner, evidence, decision, escalation, and unresolved status for general membership, helpers, and command surface. |
| `General_Membership_Decision` | One owner/documentation decision for each `MM-GEN-001`–`MM-GEN-033`; never a path-action instruction. |
| `Caller_Review_Record` | Owner approval, uncapped static scope, positive/negative result boundaries, exclusions, and unchanged artifact disposition. |
| `Safety_Contract` | Static target, database classification, environment/secret-boundary name only, controls, recovery, rollback, and blocked status. |
| `Governance_Decision` | Canonical source, proposed command form, alias/aggregate status, owner, and no-behavior-change result. |
| `Archival_Contingency` | Future-only record that exists only after a strict candidate is evidenced; otherwise `not applicable — no current candidate`. |
| `Validation_Handoff` | Static/manual, user-owned review evidence only; no execution result is implied. |

Every unresolved field is explicit. A future record may add evidence but may not silently upgrade static evidence to runtime proof, caller absence outside its complete scope, ownership approval, or authorization to act.

## Evidence and Disposition Rules

### Evidence integrity

1. The completed audit remains the baseline; residual work supplements it and does not repeat it.
2. `CSS-2`, `CSS-OPS-1`, `CSS-WF-1`, and `CSS-DI-1` are bounded positive evidence. `CSS-1` is incomplete and cannot support repository-wide caller absence.
3. The current disposition result remains exactly 106 `keep`, 141 `maybe`, and 0 `archive candidate` until future evidence is accepted through the owner-gated process.
4. `keep` and `maybe` both mean active and untouched. No negative inference from a capped, dynamic, external, ignored, untracked, generated, runtime-only, or secret-bearing limitation is permitted.
5. Static dispatcher controls and static command routes are not claims of terminal safety, confirmation, recovery, database routing, or runtime success.

### Non-negotiable triage

| Evidence outcome | Current / future disposition | Required handling |
| --- | --- | --- |
| Existing positive caller, gate-critical, or Shared_Helper evidence | `keep` | Preserve active artifact and evidenced callers; no behavior or path action is authorized. |
| Incomplete caller, lifecycle, ownership, helper, or safety evidence | `maybe` | Keep active and untouched; record only owner-approved residual evidence work. |
| Future explicit one-time/obsolete evidence **and** completed caller-free scope | possible future `archive candidate` | Remain active and untouched until every independent approval and contingency prerequisite is met. |

## Reversible Archival Contract

### Conditional-only trigger

There are zero current archive candidates. Therefore Archive_Location, Archive_Manifest, and Archive_Index are not active decisions, tasks, or priority-wave work. `.archive/audit/` remains excluded, and this design proposes no other destination.

Only if a future artifact first has explicit one-time/obsolete evidence and a completed caller-free scope may an owner open an archival contingency. The contingency remains blocked unless independent owner approval, caller and Support_Artifact preservation decisions, an owner-approved repository-relative location and index path, intact pre/post hash equality, restoration procedure, and rollback sequence are all documented.

### Future-only prerequisites

A future candidate may enter a separately approved contingency only after it has: complete caller-search evidence; explicit obsolete/one-time evidence; affected caller and Support_Artifact decisions; artifact and affected-caller owner approvals; an owner-approved archive location and index path; manifest fields; hash evidence; caller preservation; restoration; and rollback. If no candidate satisfies the strict trigger, the required outcome is no-op and all artifacts remain active and untouched.

## Error Handling

### Evidence, safety, and contingency failures

An absent owner, incomplete static scope, capped output, unreviewed terminal body, missing safety-control evidence, or unresolved governance source keeps the affected artifact in its current active state and leaves the relevant decision blocked. No failure authorizes execution, source changes, or archival.

For the future-only archival contingency, any missing prerequisite, approval, manifest/index field, hash comparison, caller-preservation decision, restoration procedure, or rollback sequence makes the outcome no-op. The artifact remains or is restored at its active path; this handoff does not select or create an archive destination.

## Correctness Properties

This handoff property governs owner review and future contingency; it has not been executed.

### Property 1: Archive readiness requires complete reversible-archival evidence

For any future evaluated artifact, the archival process SHALL mark the artifact `archive-ready` only when the record contains explicit one-time or obsolete evidence; no Actual_Caller in a completed caller-free scope; independent approval; an owner-approved repository-relative Archive_Location; required Archive_Manifest and Archive_Index paths and fields; and documented restoration and rollback procedures. Otherwise, the archival process SHALL retain the artifact as active.

**Validates: Requirements 6**

The current baseline satisfies the non-ready branch for every artifact because it contains zero archive candidates and no completed caller-free scope.

## Testing Strategy

### Static/manual, user-owned validation handoff

No test, gate, build, package operation, script, browser, database, deployment, or external operation is part of this handoff. Residual increments use only static/manual, user-owned evidence review:

- baseline acceptance: compare planning-artifact statements with the completed audit evidence;
- ownership/governance: review recorded decisions and no-action wording;
- caller/import and safety: owner-approved read-only static record completeness;
- archival: not applicable unless the strict future trigger is met.

No execution status is implied or claimed.

## Requirements Traceability

| Requirements | Design coverage |
| --- | --- |
| 1 | Overview and Architecture: completed baseline, no-action result, and bounded evidence scopes. |
| 2 | Components and Interfaces and Data Models: ownership, `MM-GEN-*`, helpers, SVG preservation, and command-surface accountability. |
| 3 | Architecture, Data Models, and Evidence Rules: owner-approved uncapped static caller/import review for `maybe` only. |
| 4 | Components and Interfaces and Error Handling: `SAF-ALL-001` / `PIT-P0-001` safety-contract boundary. |
| 5 | Command-surface interface and Data Models: canonical command review and no-drift alias conclusion. |
| 6 | Reversible Archival Contract and Property 1: inactive conditional contingency and strict future prerequisites. |
