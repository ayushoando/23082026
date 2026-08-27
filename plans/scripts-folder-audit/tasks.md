# Scripts Toolchain Cleanup Plan

## Outcome

Reduce the **active** scripts toolchain without deleting code:

- preserve every proven caller, gate-critical artifact, path-stable SVG artifact, and shared helper;
- make `scripts/general/` genuinely gate-critical or explicitly document every exception;
- give each retained capability one owner, one preferred command, and one documented location;
- harden destructive and production-affecting scripts before consolidating or relocating them;
- use compatibility wrappers and documented migration steps so callers do not break; and
- move only proven, approved, caller-free one-off artifacts intact into `scripts/archive/`, never delete them.

The completed evidence baseline is `plans/ref/scripts-folder-audit.md`:

| Current state | Count | Required handling |
| --- | ---: | --- |
| Visible scripts/support artifacts | 247 | Account for every artifact during cleanup. |
| `keep` | 106 | Preserve paths/callers until a caller-preserving migration is approved. |
| `maybe` | 141 | Keep active and untouched until their caller and safety evidence is complete. |
| Archive candidates | 0 | Do not create an archive move in the current wave. |

## Target structure

The target is a simpler active surface, not an immediate mass move. Existing paths remain valid through compatibility wrappers until every recorded caller is migrated.

```text
scripts/
├─ general/        gate, install, build/start, docs, and quality entrypoints only
├─ lib/            reusable helpers with two or more direct consumers
├─ ops/            operational implementations by domain
│  ├─ database/
│  ├─ storage/
│  ├─ assets/
│  └─ deploy/
├─ maintenance/    active repair, audit, seed, migration-support, and backfill tools
├─ codemods/       active source transformations
├─ generate-svg/   path-stable SVG pipeline — preserve current public paths
├─ archive/        approved retired one-off tools, preserved intact with a manifest
└─ root/           stable public entrypoints, compatibility wrappers, and path-stable files
```

`ops/`, `maintenance/`, and `archive/` are target families. Creating or moving into them happens only in an approved implementation wave after caller, owner, safety, and rollback requirements are met.

## Non-negotiable controls

1. **No deletion.** A script or support artifact is never deleted by this program.
2. **Keep means preserve.** The 106 `keep` artifacts, including 26 documented `scripts/general/` members, 13 path-stable SVG artifacts, and eight evidence-backed shared helpers, remain active until a caller-preserving migration is approved.
3. **Maybe means untouched.** The 141 `maybe` artifacts stay active at their current paths until their evidence is completed; uncertainty is never treated as permission to move or archive.
4. **Archive is last.** An artifact may enter `scripts/archive/` only after explicit one-time/obsolete proof, a completed caller-free static scope, owner approval, an archive manifest, a hash check, restoration instructions, and a rollback procedure.
5. **Do not infer runtime safety.** Static `run-ops` controls do not prove terminal-script target guards, confirmation, recovery, database routing, or production safety.
6. **Keep existing callers working.** Every command, import, package entry, workflow caller, documentation command, and direct invocation is preserved or migrated in an ordered, reversible sequence.
7. **User-owned validation.** Tests, gates, builds, browser suites, databases, deployments, and persistent mutations are deferred to explicit user invocation.

## Cleanup phases

### - [ ] Task 1: Establish the protected compatibility surface

**Objective:** Freeze the currently proven live surface before cleanup changes begin.

**Actions:**

1. Turn the completed audit evidence into a compatibility matrix: current artifact/command, caller class, caller path, proposed canonical command, future target family, compatibility wrapper requirement, owner, and rollback dependency.
2. Include all 98 root package commands, all `run-ops` `COMMANDS` keys, the four visible workflow callers, documented commands, direct imports, and the eight shared helpers.
3. Mark the 26 documented `scripts/general/` entries and 13 path-stable SVG artifacts as protected paths.
4. Record the current canonical proposal without changing behavior: `pnpm run <root-script-key>` from repository root; use `pnpm run ops <COMMANDS-key> [-- args]` only where no root alias exists.

**Acceptance signal:** Every future move or consolidation has a caller list and an explicit preservation/rollback dependency before implementation starts.

**Validation:** Static/manual comparison with `plans/ref/scripts-folder-audit.md`; no command execution.

**Demo:** A maintainer can answer “what will break if this script moves?” from one compatibility row.

### - [ ] Task 2: Restore a truthful `scripts/general/` contract

**Objective:** Make `scripts/general/` mean gate-critical tooling only, with every exception explicit.

**Actions:**

1. Resolve `MM-GEN-001` through `MM-GEN-032` for the 32 observed `scripts/general/` artifacts not listed as gate-critical.
2. For every mismatch, choose exactly one documented outcome: 
   - add it to the gate-critical inventory;
   - retain it as a named non-gate exception with a reason and review date;
   - schedule a caller-preserving relocation to `ops/`, `maintenance/`, or `lib/`; or
   - retain it as `maybe` pending evidence.
3. Preserve the 26 documented in-folder gate-critical artifacts in place unless a future approved migration provides a wrapper and caller migration sequence.
4. Preserve `tech-docs-generator/scripts/fake-test-audit.mjs` at its existing external path. It is a documented exception, not a missing or misplaced `scripts/general/` file.
5. Preserve all 13 path-stable SVG artifacts at their current public paths.

**Acceptance signal:** `scripts/general/README.md` and the family inventory distinguish gate entrypoints, documented exceptions, and planned caller-preserving relocations without claiming that any file is obsolete.

**Validation:** Static/manual membership review; no scripts move in this task.

**Demo:** A contributor can open `scripts/general/README.md` and know why every file in that folder exists.

### - [ ] Task 3: Define safety contracts for operational scripts

**Objective:** Strengthen operational scripts before changing their location, wrappers, or command surface.

**Actions:**

1. Start with the operational `maybe` set exposed through `run-ops`: database, storage/R2, assets, backups, seeds, backfills, deploys, secret synchronization, and restore-related tools.
2. Create one safety contract per affected tool with:
   - canonical command and repository-root CWD;
   - target service and database classification: Admin, Products, or unknown with reason;
   - environment profiles and variable/secret-boundary names only;
   - dry-run or preview behavior and explicit apply behavior;
   - target guard and ambiguity failure behavior;
   - confirmation and independent approval boundary;
   - backup/recovery prerequisite;
   - rollback procedure; and
   - explicit owner.
3. Treat existing `run-ops` root CWD, argument forwarding, dry/apply routes, error propagation, and pre-production gate forwarding as dispatcher-level evidence only.
4. Keep an incomplete safety contract blocked. Do not execute the tool to fill a missing field.

**Acceptance signal:** No operational script is consolidated, relocated, or newly documented as safe until its contract has every required field or an explicit block reason.

**Validation:** Static/manual safety-record review; runtime validation remains user-invoked.

**Demo:** A maintainer can identify a script’s target, dry/apply path, approval boundary, and rollback without reading code.

### - [ ] Task 4: Create one command catalog and rationalize aliases

**Objective:** Reduce command confusion without breaking existing package, Ops, CI, documentation, or direct callers.

**Actions:**

1. Publish a command catalog with capability, current commands, preferred command, implementation target, required arguments, risk level, owner, and caller references.
2. Classify every duplicate/overlap as one of: canonical command, compatibility alias, aggregate command, or future deprecation candidate.
3. Preserve intentional forwarding/aggregate behavior while documenting it, including:
   - `docs:sync` and `docs:sync:all`;
   - `backup:r2`;
   - `check:site-ui`;
   - `check:ui-assets`;
   - release/gate aggregations; and
   - root aliases into `run-ops`.
4. Preserve the proven no-drift result: `ops-command-registry.mjs` derives from `run-ops.mjs` `COMMANDS`; do not split or duplicate its registry without new evidence.
5. Assign a command-surface owner before any alias becomes deprecated or any canonical command is enforced.

**Acceptance signal:** Every retained capability has one preferred invocation, while every existing alias has a documented compatibility, aggregate, or migration status.

**Validation:** Static/manual reconciliation of package commands, `run-ops`, registry, workflows, and docs; no command execution.

**Demo:** A developer can search the catalog for “backup”, “docs”, or “site UI” and get one preferred command plus the reason aliases exist.

### - [ ] Task 5: Consolidate by capability, not filename

**Objective:** Reduce duplicated implementations and root-folder noise only where behavior and callers are understood.

**Actions:**

1. Form consolidation candidates by capability after Tasks 1–4, not by similar filenames alone:
   - documentation generation;
   - UI/site checks;
   - database and migration support;
   - R2/assets/backups;
   - catalog/seed/backfill maintenance;
   - shared script helpers; and
   - manual audit/repair tools.
2. For each candidate group, designate one implementation owner and one canonical implementation.
3. Prefer a compatibility wrapper first: retain the old path/command, delegate to the canonical implementation, migrate callers, and retire the wrapper only after an owner-approved evidence review.
4. Move only true reusable modules with two or more direct consumers to `scripts/lib/`. Preserve the eight already evidence-backed helpers: `assetPathMapTools`, `cdnAssetResolver`, `r2Catalog`, `repoRoot.mjs`, `repoRoot.ts`, `resolvePgDump`, `siteUiRouteSources`, and `scriptEnv`.
5. Keep uncertain groups as `maybe`; do not merge them merely to reduce file count.

**Acceptance signal:** Each approved consolidation has a canonical implementation, caller migration sequence, compatibility plan, owner, safety contract where applicable, and rollback path.

**Validation:** Static/manual caller-preservation review before implementation; runtime behavior checks are explicitly user-invoked later.

**Demo:** A capability group shows one implementation path and all legacy callers still resolving through a documented compatibility route.

### - [ ] Task 6: Relocate active scripts into clear families with reversible wrappers

**Objective:** Make the active tree understandable without breaking imports, commands, gates, CI, or documentation.

**Actions:**

1. Relocate only owner-approved, evidence-complete artifacts:
   - reusable helpers → `scripts/lib/`;
   - gate-only entrypoints → `scripts/general/`;
   - domain operations → `scripts/ops/database/`, `scripts/ops/storage/`, `scripts/ops/assets/`, or `scripts/ops/deploy/`;
   - active manual repair/audit/seed/backfill tools → `scripts/maintenance/`;
   - active transformations → `scripts/codemods/`.
2. Keep root paths only for stable public entrypoints, compatibility wrappers, and documented path-stable artifacts.
3. For each relocation, perform this sequence: add canonical target → add/retain wrapper at old path → update one caller class at a time → update command catalog/docs → complete user-owned validation → obtain owner sign-off before removing the wrapper.
4. Do not move `generate-svg` public paths unless all existing product/test/publish callers have an approved migration plan.

**Acceptance signal:** Every moved active artifact retains a valid old path or command until all recorded callers have migrated and rollback remains possible.

**Validation:** Static/manual import and caller map review; user-owned checks only after implementation.

**Demo:** The root `scripts/` directory visibly trends toward public entrypoints and compatibility wrappers rather than mixed implementation files.

### - [ ] Task 7: Archive only proven retired one-off artifacts

**Objective:** Reduce the active scripts tree without deletion.

**Actions:**

1. Consider an artifact for `scripts/archive/` only if it has both explicit one-time/obsolete evidence and a completed caller-free static scope.
2. Require owner approval and an archive manifest containing original path, archive path, reason, date, SHA-256 hash, callers searched, support artifacts, restoration instructions, and rollback procedure.
3. Move the artifact intact, compare pre- and post-move hashes, update an archive index, and preserve restoration instructions.
4. If any evidence, approval, hash, caller review, manifest, index, or restoration field is missing, keep the artifact active at its existing path as `maybe`.
5. Do not use `.archive/audit/`; it remains excluded. The active archive target for approved retired scripts is `scripts/archive/`.

**Acceptance signal:** An archived artifact can be located, explained, integrity-checked, and restored without reconstruction.

**Validation:** Static/manual manifest and restoration-plan review. Any actual move and validation is user-owned and requires separate approval.

**Demo:** The archive index shows the artifact’s original path, reason, hash, owner decision, and exact restoration steps.

### - [ ] Task 8: Keep the toolchain clean after the migration

**Objective:** Prevent future script sprawl.

**Actions:**

1. Publish a scripts catalog covering active and archived artifacts: purpose, family, owner, lifecycle state, preferred command, caller classes, risk, safety contract, and review trigger.
2. Add contribution rules: every new script needs a family, owner, preferred invocation, caller registration, safety classification, and documentation entry before it becomes active.
3. Require a compatibility/rollback section for any new relocation, consolidation, wrapper, or archive proposal.
4. Review the catalog on changes to package commands, `run-ops`, workflows, or `scripts/general/` membership.

**Acceptance signal:** New scripts cannot enter the active toolchain without a clear purpose, family, owner, command path, and safety/lifecycle record.

**Validation:** Static/manual catalog and documentation review; user-owned checks apply only when implementation changes are made.

**Demo:** A new contributor can answer “what does this script do, how do I run it, who owns it, and can it mutate data?” from the catalog.

## Execution order

```text
Task 1: protect callers and paths
  → Task 2: make scripts/general truthful
  → Task 3: document operational safety
  → Task 4: establish canonical commands
  → Task 5: approve capability-level consolidation
  → Task 6: perform reversible family relocations
  → Task 7: archive proven retired one-offs
  → Task 8: enforce catalog and contribution rules
```

## Completion criteria

The cleanup is complete when:

- every active script has a documented family, purpose, owner, lifecycle state, and preferred command;
- `scripts/general/` contains only gate-critical scripts or documented, reviewed exceptions;
- all operational scripts have complete safety contracts or remain explicitly blocked;
- no caller is broken by a consolidation or relocation;
- active root-level script count is reduced through documented wrappers and family placement;
- no artifact is deleted;
- every archived artifact is intact, hashed, indexed, and restorable; and
- the scripts catalog prevents the same sprawl from returning.
