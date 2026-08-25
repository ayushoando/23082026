# Implementation Plan: Kiro Repository Guidance Setup

## Overview

Implement the validated `kiro-repo-guidance-setup` design as a repository-local TypeScript/Node audit-and-plan pipeline. The implementation is fail-closed: documented, historical, registered, or cross-surface evidence cannot become an enabled-valid claim without exact-target validation, owner approval, repository-policy compatibility, artifact/schema checks, security-boundary confirmation, and a verified rollback path.

Use existing repository tooling and test infrastructure. Do not add dependencies, modify application code, change lockfiles, alter `AGENTS.md`, use global settings, contact external services, use secrets, write production data/filesystems, or authorize Crew behavior under these tasks. All commands run from `D:\23082026` with `pnpm` only. Use the existing `fast-check` installation for optional property tests if available; if it is absent, record the missing prerequisite and approval boundary rather than adding a dependency.

## Implementation root and ownership contract

The implementation root is selected and frozen before dependent work begins:

- Runtime modules: `scripts/kiro-repo-guidance-setup/`
- Lane-owned tests and private fixtures: `tests/kiro-repo-guidance-setup/lane-a/`, `lane-b/`, `lane-c/`, and `lane-d/`
- Integration-owned tests and generated evidence adapters: `tests/kiro-repo-guidance-setup/integration/` and `results/kiro-repo-guidance-setup/`
- Durable handover output, if approved by the design, is generated only by the integration/final-gate owner under the approved `Agents/` or repository-local guidance location; no lane writes generated handover output.

The four coding lanes are disjoint. Each Implementation_Agent may read frozen contracts and other lane outputs, but may mutate only its declared paths after a successful `File_Ownership_Reservation`:

| Lane | Implementation_Agent ownership | Explicit non-ownership |
|---|---|---|
| Lane A — contracts, discovery, provenance | `scripts/kiro-repo-guidance-setup/contracts.ts`, `discovery.ts`, `inventory.ts`, `provenance.ts`, `coverage.ts`; `tests/kiro-repo-guidance-setup/lane-a/**` | Does not write compatibility, policy, skills, hooks, capabilities, validation, rollback, orchestration, integration, handover, `package.json`, or `results/` |
| Lane B — compatibility, scope, policy | `scripts/kiro-repo-guidance-setup/compatibility.ts`, `scope.ts`, `owner-decisions.ts`, `policy.ts`; `tests/kiro-repo-guidance-setup/lane-b/**` | Does not write contracts, discovery, skills, hooks, capabilities, validation, rollback, orchestration, integration, handover, `package.json`, or `results/` |
| Lane C — skills, hooks, capabilities | `scripts/kiro-repo-guidance-setup/skills.ts`, `hooks.ts`, `capabilities.ts`, `continuity.ts`; `tests/kiro-repo-guidance-setup/lane-c/**` | Does not write contracts, discovery, compatibility, policy, validation, rollback, orchestration, integration, handover, `package.json`, or `results/` |
| Lane D — wave coordination, validation, rollback, handover, reviewers | `scripts/kiro-repo-guidance-setup/wave-manifest.ts`, `ownership.ts`, `reservations.ts`, `wave-guard.ts`, `validation.ts`, `rollback.ts`, `handover.ts`, `reviewers.ts`; `tests/kiro-repo-guidance-setup/lane-d/**` | Does not write Lane A/B/C modules, integration-owned pipeline/gate/final-gate files, `package.json`, or `results/` |

The post-wave Integration_Validation_Gate alone owns `scripts/kiro-repo-guidance-setup/integration-gate.ts`, `pipeline.ts`, and `enablement.ts`, `tests/kiro-repo-guidance-setup/integration/**`, and generated `results/kiro-repo-guidance-setup/**`. No lane writes shared generated output. If implementation inventory selects different concrete paths, the coordinator must update the ownership record before mutation and preserve one owner per file; no task may silently create a second shared path.

## Tasks

- [x] 1. Prepare and freeze the feature-scoped `Concurrent_Implementation_Wave`
  - [x] 1.1 Select and create the frozen implementation/test roots and coordinator manifest.
    - Create `scripts/kiro-repo-guidance-setup/`, the four lane test directories, and Lane D-owned `wave-manifest.ts` recording feature scope `kiro-repo-guidance-setup`, repository root `D:\23082026`, `pnpm`, no worktrees, no hidden spawning, no automatic retry/replan, and generated-output ownership.
    - Do not change `package.json`, `AGENTS.md`, application code, dependencies, lockfiles, global settings, or external services.
    - _Requirements: 9.8, 9.10, 11.7–11.8, 14.5, 14.10–14.12; Design: Implementation root, ConcurrentImplementationWaveRecord, RepositoryPolicyGuard_

  - [x] 1.2 Define and implement Lane A-owned shared contracts before dependent lane work.
    - Create `contracts.ts` with the exact typed enums, discriminated unions, evaluator interfaces, stage results, evidence states, inventory statuses, dispositions, seven surface/version records, six skill candidates, OD-01..OD-10, validation/rollback records, known gaps, reviewer handoffs, and wave/integration records.
    - Ensure contracts encode task/default concurrency `0 | 1`, reviewer `iterationCeiling` `0..3`, feature-wave `maxActiveAgents <= 4`, explicit read/write scopes, and no handwritten `any`.
    - _Requirements: 2.4, 2.6, 4.1, 7.1, 8.1, 8.6–8.8, 9.1–9.4, 9.8–9.12, 10.1, 10.12–10.13, 11.1–11.2, 11.7–11.8, 13.1–13.6; Design: Data Models, Interface conventions_

  - [x] 1.3 Declare all four agents’ read/write ownership and shared-output ownership.
    - Create Lane D-owned `ownership.ts` records for Lane A, Lane B, Lane C, and Lane D, including agent IDs, read scopes, write scopes, disjoint module/test paths, `sharedGeneratedOutputOwnership: none`, and the integration owner’s later ownership of `integration-gate.ts`, `pipeline.ts`, `enablement.ts`, integration tests, and `results/`.
    - Reject duplicate, overlapping, missing, stale, or unspecified ownership before any lane mutation; record a conflict instead of resolving it implicitly.
    - _Requirements: 9.8–9.10, 10.12–10.13, 11.7–11.8, 14.10–14.12; Design: File_Ownership_Reservation, Concurrent Implementation Wave and ownership contract_

  - [x] 1.4 Implement reservation acquisition and wave preflight checks before mutation.
    - Create Lane D-owned `reservations.ts` and `wave-guard.ts` to require an active `File_Ownership_Reservation` before every write, reject stale/missing/conflicting reservations, enforce the four-agent maximum, and validate repository root, root-only `pnpm`, no worktree, no hidden spawning, no automatic retry/replan, and no out-of-scope mutation.
    - Record OD-04 approval boundary references, owner/date, feature-only scope, explicit read/write scopes, expected side effects, conflict policy, and rollback path; do not treat OD-04 as a change to `AGENTS.md` or the general repository rule.
    - _Requirements: 9.8–9.12, 10.12–10.13, 11.7–11.8, 14.10–14.12; Design: RepositoryPolicyGuard, Approval boundary interface, Phased rollout Phase 4_

  - [x] 1.5 Complete `Shared_Contract_Freeze` and block dependent lanes until it passes.
    - Record the frozen contract paths, contract version/hash, owner, timestamp, validation result, and `dependentWorkAllowed` only after 1.2–1.4 pass.
    - Preserve prior state and prevent Lane B/C/D dependent mutation when the freeze is missing, stale, or inconsistent with the ownership manifest.
    - _Requirements: 9.8–9.10, 10.12–10.13, 11.7–11.8, 14.10–14.12; Design: Shared_Contract_Freeze, Record lifecycle_

- [x] 2. Lane A — implement contracts, discovery, inventory, provenance, coverage, and exclusions
  - Lane A owns only the files listed for Lane A in the ownership contract. It may read the frozen contracts and repository sources but must acquire a reservation for every mutation.
  - [x] 2.1 Implement `DiscoveryCollector` and repository-local source discovery.
    - Record official sitemap/search discovery method, ISO review date, Active_Surface, URL/path, availability, and discovery evidence before using a candidate as decision evidence; emit unavailable `Unverified_Finding` records when retrieval is unavailable or unapproved.
    - Inspect required repository authority sources, visible `.kiro` artifacts, package scripts, and referenced paths without claiming external or surface success from static data.
    - _Requirements: 1.1–1.5, 2.1–2.2, 3.1, 13.3; Design: DiscoveryCollector, Discovery and source inventory_

  - [x] 2.2 Implement `RepositoryInventory` for canonical guidance and every visible Kiro artifact.
    - Assign every required source and visible skill, steering file, hook, power, agent, MCP/setting/ignore/spec artifact exactly one status: `present and readable`, `present but unreadable`, `absent`, or `unknown`.
    - Keep the six initial skills exactly `{repo-map, graph-impact, verify-and-gate, fork-boundaries, focss-css, db-migrations}` and record owner, scope, activation condition, canonical source, evidence state, disposition candidate, and one maintenance-risk value.
    - _Requirements: 2.1–2.6, 2.7, 11.1–11.2; Design: RepositoryInventory, Artifact records_

  - [x] 2.3 Implement `ProvenanceLedger` and `AuthorityResolver`.
    - Preserve every claim, source, date, surface, version, provenance, authority rank, selected claim, losing contextual claim, rationale, and unresolved impact using `user > live code/fresh commands > AGENTS.md > Agents/* > canonical docs/*`.
    - Hash artifacts only where safe, redact secrets/tokens/private URLs/personal data, and keep historical evidence separate from fresh validation evidence.
    - _Requirements: 2.3–2.5, 3.1–3.6, 14.1, 14.3, 14.6–14.7; Design: ProvenanceLedger, Authority resolution, Validation and rollback records_

  - [x] 2.4 Implement `CoverageMatrixBuilder` and `ExclusionRegister`.
    - Create one coverage record for each discovered official candidate and expand mandatory families page-by-page; classify relevant inaccessible/redirected/contradictory/impossible-to-match pages as unavailable `Unverified`, not excluded.
    - Record out-of-scope billing/marketing/unrelated/Crew candidates with reason, owner, scope boundary, and reconsideration trigger; emit the exact complete-review statement only when every relevant candidate has reviewed, excluded, or unavailable status.
    - _Requirements: 1.2–1.5, 3.1, 11.1, 13.3, 13.6; Design: Coverage Matrix, Exclusion Register_

  - [x] 2.5 Write the property-based test for **Property 1: Discovery evidence is complete and ordered**.
    - Use `fast-check` with at least 100 iterations to prove every candidate used as decision evidence has Source_Inventory and Coverage_Matrix records first, exclusions and unavailable findings remain distinct, unavailable candidates are listed, and the required completion statement is used.
    - Write only under `tests/kiro-repo-guidance-setup/lane-a/`.
    - **Validates: Requirements 1.1–1.5, 2.2, 13.3; Design: Correctness Property 1**

  - [x] 2.6 Write the property-based test for **Property 2: Authority resolution preserves evidence**.
    - Use at least 100 iterations to prove the highest-ranked applicable claim wins, losing claims/provenance/rationale remain contextual, and an unconfirmed rule remains `Unverified`.
    - **Validates: Requirements 2.3, 3.3, 3.6, 14.6–14.7; Design: Correctness Property 2**

  - [x] 2.7 Write the property-based test for **Property 3: Inventory and record schemas are total**.
    - Generate artifact kinds with missing/unsafe fields and assert exactly one inventory status, required owner/scope/evidence/disposition/provenance/validation/rollback fields, allowed maintenance risk, and no persisted secret values.
    - **Validates: Requirements 2.1, 2.4, 3.1, 3.4, 6.1, 7.1, 8.4, 11.2, 12.2, 13.5–13.6, 14.3; Design: Correctness Property 3**

  - [x] 2.8 Add Lane A example and edge-case tests.
    - Cover canonical-source status, unreadable/absent/unknown paths, contradictory sources, redirected/inaccessible relevant pages, excluded candidates, exact completion wording, and rejection of unapproved network or secret-bearing operations.
    - **Validates: Requirements 1.3–1.5, 2.1–2.3, 3.3, 13.3, 14.8; Design: Example and edge-case tests, Error handling_

- [x] 3. Lane B — implement compatibility, scope, owner decisions, approval boundaries, and policy guards
  - Lane B owns only the files listed for Lane B in the ownership contract. It may read frozen contracts and Lane A outputs but must not mutate Lane A files.
  - [x] 3.1 Implement `CompatibilityMatrix` with exactly seven surface/version records.
    - Create one record each for IDE, CLI 2.x, CLI 3.x, Web, Mobile, Cloud/Crew, and Local_Repository_Surface; isolate the observed IDE session and `kiro-cli-chat 2.19.1` to exact targets and classify missing/changed target evidence as `Unverified`.
    - Record documented/observed behavior, freshness, version sensitivity, validation action, migration constraints, unsupported claims, enablement status, and rollback path without transferring evidence across surfaces or versions.
    - _Requirements: 4.1–4.6, 10.3, 12.5, 12.8, 13.4, 13.7; Design: Surface/version model, CompatibilityRecord_

  - [x] 3.2 Implement `ScopePrecedenceMapper`.
    - Record global `~/.kiro`/`KIRO_HOME`, project `.kiro`, agent, file-match, manual, workspace-root permission, user permission, and external-service scopes with separate documented and observed precedence fields.
    - Represent `denyOverridesAllow` as `observed`, `Unverified`, or `contradicted`; do not infer absent user-level files or permission state from repository-local inspection.
    - _Requirements: 5.1–5.2, 5.6, 11.6; Design: Configuration and Permission Scopes, Permission precedence contract_

  - [x] 3.3 Implement approval-boundary records and safe permission probes.
    - Require scope, requested change, target surface, owner/date/status, pre-change state, security/data boundary, expected side effects, and rollback path before global, credential, external, permission-broadening, or Cloud/Crew operations.
    - Model allowed, denied, prompted, and restricted outcomes where applicable; unresolved or pending boundaries block without mutation.
    - _Requirements: 5.3–5.5, 8.4–8.5, 10.2, 10.9, 11.5–11.6, 14.8; Design: Approval boundary interface_

  - [x] 3.4 Implement `RepositoryPolicyGuard` and owner-decision validation.
    - Enforce root-only `pnpm`, no worktrees, default maximum one active agent, explicit approvals, production read-only filesystem, mode-aware persistence/no dual-write, Admin/Products routing, Studio/Planner isolation, both Vitest lanes, required gates, and the feature-only OD-04 maximum-four exception.
    - Validate exactly OD-01 through OD-10, preserve the broad conditional `enable after validation` selection, and keep unresolved decisions on safe fallbacks; OD-04 never changes `AGENTS.md` or authorizes Crew worktrees, general concurrency, hidden spawning, retries/replans, or auto-approval.
    - _Requirements: 9.2–9.3, 9.8–9.12, 10.1–10.13, 11.6–11.8, 14.2, 14.5, 14.10–14.12; Design: RepositoryPolicyGuard, Owner Decision Records, Crew compatibility guard_

  - [x] 3.5 Write the property-based test for **Property 4: Fixed candidate and decision sets are exact**.
    - Use at least 100 iterations to assert the exact six-skill set, exactly seven compatibility records, separate specification/execution/continuity capabilities, and exactly one each of OD-01 through OD-10.
    - **Validates: Requirements 2.6, 4.1, 9.1, 9.4, 10.1; Design: Correctness Property 4**

  - [x] 3.6 Write the property-based test for **Property 5: Evidence is isolated by surface and freshness**.
    - Generate mismatched surfaces/versions, historical evidence, registrations, and changed artifacts; assert only a fresh post-change run for the exact target satisfies validation.
    - **Validates: Requirements 3.2, 4.2–4.6, 12.5, 12.8, 13.7; Design: Correctness Property 5**

  - [x] 3.7 Write the property-based test for **Property 7: Scope and permission records do not broaden access**.
    - Generate pending approvals and precedence conflicts; assert separate scope fields, blocked actions, and no global/user/external mutation intent while approval or deny precedence is unresolved.
    - **Validates: Requirements 5.1–5.2, 5.4–5.6, 10.9, 11.6; Design: Correctness Property 7**

  - [x] 3.8 Add Lane B example and edge-case tests.
    - Cover CLI 2.x evidence not satisfying CLI 3.x, Web/Mobile non-applicability, Crew uninstallation/conflict, every unresolved OD fallback, precedence conflicts, pending boundaries, max-four rejection, and preservation of the general one-agent rule.
    - **Validates: Requirements 4.2–4.5, 5.2–5.5, 9.2–9.3, 9.8–9.12, 10.3–10.13; Design: Surface/version model, Crew compatibility guard, Error handling_

- [x] 4. Lane C — implement skills, steering, hooks, powers, MCP, agents, capabilities, and continuity
  - Lane C owns only the files listed for Lane C in the ownership contract. It may read frozen contracts and Lane A/B records but must not mutate those files or external services.
  - [x] 4.1 Implement `SkillEvaluator` and steering overlap resolution.
    - Validate exactly the six `SKILL.md` manifests, folder/name matching, specific descriptions, canonical sources, root commands, constraints, prerequisites, activation scope, owner, risk, evidence, and rollback.
    - Designate exactly `repo-map` as the primary `Repository_Guidance_Skill`; resolve every overlap through merge/delegate/retire/reject and make no activation-scope claim without OD-08 and fresh validation.
    - _Requirements: 2.6, 3.4, 6.1–6.7, 10.8, 13.2; Design: Skills and steering evaluator interface, Skills/Steering plan_

  - [x] 4.2 Implement `HookEvaluator` and hook schema/safety checks.
    - Validate standalone `.kiro/hooks/*.json`, `version: "v1"`, PascalCase events, supported command/agent actions, JSON stdin contract, narrow target-only matchers, hook-level boolean `enabled`, hook-level timeout, referenced paths, root commands, surface availability, dependencies, overlap, owner, and rollback.
    - Keep `domain-fast-check.json` action-level timeout placement `Unverified`; preserve semicolon command evidence; classify an unrelated PowerShell `&&` error as unrelated unless fresh stored-command evidence identifies it; keep file-hook evidence agent-made-only absent fresh proof.
    - _Requirements: 7.1–7.9, 12.1, 12.6, 14.2; Design: Hook evaluator interface, Hook acceptance algorithm, Hook Schema/Repair/Safety plan_

  - [x] 4.3 Implement local/installed power, MCP, tool, custom-agent, and subagent capability evaluators.
    - Classify power format exactly as `Legacy_POWER`, `Agent_Plugin`, `Both`, or `Neither`; preserve separate observations for local `oando-workflow` `POWER.md`, empty `mcp.json`, absent `plugin.json`, and unverified `registryId: local`.
    - Perform the repository-answer check before external routing; record provenance, revision/license or unavailable, trust/integrity, secrets, permissions, named service/data boundary, resource URIs or `None`, owner approval, target validation, DAG/review graph, concurrency, failure behavior, and rollback.
    - _Requirements: 8.1–8.8; Design: Capability evaluator, Local power, External MCP and installed powers, Custom agents and subagents_

  - [x] 4.4 Implement continuity, graph-impact, specification, task-wave, review-loop, and Crew compatibility records.
    - Keep local compaction, checkpoints/rewind, CLI sessions, Crew memory, Crew knowledge, and LTM capture separate; keep LTM disabled while the capture command is a stub and do not use Crew documentation as LTM execution evidence.
    - Preserve the manual graph-impact loop, cap automation at three iterations, enforce default/native concurrency `0 | 1`, reviewer ceilings `0..3`, and classify Crew worktrees, concurrency above one, retries/replans, hidden spawning, or auto-approval as deferred/excluded.
    - _Requirements: 9.1–9.7, 10.4–10.7, 10.11, 14.5; Design: Continuity and LTM interface, Graph-impact automation interface, Native Spec DAGs/Task Waves/Review Loops, Crew compatibility guard_

  - [x] 4.5 Write the property-based test for **Property 8: Skill authority is unique and prerequisites are explicit**.
    - Generate overlap graphs and missing prerequisites for at least 100 iterations; assert exactly one primary (`repo-map`), a resolution for every non-authoritative path, and no activation claim without OD-08, valid manifest, approved prerequisites, and rollback validation.
    - **Validates: Requirements 6.2, 6.4–6.6; Design: Correctness Property 8**

  - [x] 4.6 Write the property-based test for **Property 9: Approved hooks satisfy schema and safety bounds**.
    - Mutate one hook rule at a time for timeout placement, event casing, action, matcher, enabled state, command, dependency, overlap, and side effect; assert invalid/unsafe hooks remain blocked or disabled.
    - **Validates: Requirements 7.2, 7.5–7.9, 12.1; Design: Correctness Property 9**

  - [x] 4.7 Write the property-based test for **Property 10: Extension routing and execution plans are bounded**.
    - Generate power formats, repository-answer results, external boundaries, custom-agent resource values, subagent graphs, concurrency, approvals, and review ceilings; assert missing/incompatible values produce inactive dispositions.
    - **Validates: Requirements 8.1, 8.3–8.4, 8.6–8.8, 9.2; Design: Correctness Property 10**

  - [x] 4.8 Write the property-based test for **Property 11: Incompatible Crew behavior is blocked**.
    - Generate worktree, concurrency, retry/replan, auto-approval, policy-exception, and validation states; assert incompatible behavior is deferred/excluded and cannot become enabled-valid through OD-04.
    - **Validates: Requirements 9.3, 10.6, 10.11, 14.5; Design: Correctness Property 11**

  - [x] 4.9 Write the property-based test for **Property 12: Continuity evidence does not cross data boundaries**.
    - Generate local, CLI, Crew, and LTM records; assert separate capabilities and that Crew memory/knowledge documentation cannot satisfy local LTM execution while the stub remains.
    - **Validates: Requirements 9.4–9.6; Design: Correctness Property 12**

  - [x] 4.10 Add Lane C example and edge-case tests.
    - Cover all six manifests, `repo-map` primary designation, duplicate resolution, unavailable prerequisites, action-level hook timeout, semicolon versus unrelated `&&`, disabled LTM, legacy power observations, empty MCP config, missing plugin manifest, unverified registration, `None` resource URIs, bounded graphs, and separate continuity records.
    - **Validates: Requirements 2.6, 6.1–6.7, 7.3–7.10, 8.1–8.8, 9.1–9.7, 10.4–10.8; Design: Example and edge-case tests_

- [x] 5. Lane D — implement wave coordination, validation, rollback, handover, and reviewer modules
  - Lane D owns the coordinator and review infrastructure paths listed in the ownership contract. Its early coordinator files are preparation artifacts; its later modules may read every frozen contract and lane output but may not mutate another lane’s files.
  - [x] 5.1 Implement `ValidationRunner` and typed gate adapters.
    - Record artifact, repository, focused, fast, two-lane test, ship, surface, security, rollback, and handover runs with action, root/surface, scope, UTC date, result, command/interaction, outcome, evidence, Unverified items, and `blocker: none` when clear; interrupted work is `partial`/`blocked`, never PASS.
    - _Requirements: 12.2–12.5, 12.7, 13.5–13.7; Design: ValidationRunner, Validation and rollback records, Validation Gates_

  - [x] 5.2 Implement `RollbackManager` and snapshot-first restore/disable behavior.
    - Capture pre-change bytes/settings, expected success signal, restore or disable without deleting unrelated work, verify by hash/bytes or a documented no-change result, and block later enablement after rollback failure or unverified rollback readiness.
    - _Requirements: 5.7, 7.9, 11.2, 12.6–12.7, 13.5, 13.8, 14.3; Design: RollbackManager, Failure and rollback testing_

  - [x] 5.3 Implement `HandoverGenerator`, `CapabilityDispositionTable`, and `KnownGapsRegister` projections.
    - Produce one non-empty record per audited artifact/capability, one allowed disposition, canonical path, owner, evidence, activation condition, expected side effects, validation action, and rollback value; use `no rollback applies` for no-change dispositions.
    - Include the ordered first-read path, complete-review statement, Coverage_Matrix, Exclusion_Register, official-family statuses, seven-surface statement, precedence map, OD-01..OD-10, evidence labels, known gaps, validation runs, rollback records, maintenance triggers, and limitations.
    - _Requirements: 1.5–1.6, 4.6, 8.5, 9.5–9.7, 11.1–11.8, 13.1–13.8, 14.3–14.9; Design: Capability disposition and handover records, Handover Record Design, Known Gaps Register_

  - [x] 5.4 Implement the two review-only roles and their bounded handoff contracts.
    - Implement `EvidenceCompatibilityReviewer` and `SafetyRollbackReviewer` as read-only, sequential stages with `maximumConcurrency: 1` and `iterationCeiling: 3`; they may inspect and emit findings but may not mutate configuration, spawn agents, create worktrees, retry/replan automatically, bypass approval, or enable external/global/Crew capabilities.
    - Enforce handoff order and blocked behavior for missing/stale/contradictory inputs, incomplete outputs, policy violations, failed rollback, and partial/failed wave state.
    - _Requirements: 1.6, 4.5–4.6, 9.11–9.12, 10.2, 10.6–10.7, 10.11, 11.5, 12.6–12.8, 13.4–13.8, 14.8–14.9; Design: EvidenceCompatibilityReviewer, SafetyRollbackReviewer, implementation review DAG_

  - [x] 5.5 Write the property-based test for **Property 6: Enablement is fail-closed and side-effect-free when incomplete**.
    - Generate each enablement predicate and assert enabled-valid only when owner approval, fresh exact-target validation, schema pass, repository compatibility, security confirmation, rollback readiness, no blocking gap, and policy pass are all true; otherwise assert blocked/inactive status and preserved state.
    - **Validates: Requirements 1.6, 2.7, 5.5, 6.7, 8.5, 9.7, 10.2, 11.5, 12.6–12.7, 14.8–14.9; Design: Correctness Property 6**

  - [x] 5.6 Write the property-based test for **Property 13: Unresolved owner decisions preserve safe fallbacks**.
    - Generate unresolved OD records and assert IDE-only limitation, preserved hook states, manual graph loop, no-worktree/default-one-agent/explicit-approval safeguards, inactive extensions, no activation-scope claim, unchanged global settings, and no enabled-valid status.
    - **Validates: Requirements 10.3–10.10; Design: Correctness Property 13**

  - [x] 5.7 Write the property-based test for **Property 14: Disposition and handover projections are one-to-one**.
    - Generate duplicate/incomplete artifacts and assert one allowed disposition, one canonical path, duplicate resolution, evidence/reason, activation condition, owner, rollback value, and incomplete status when official-family coverage is incomplete.
    - **Validates: Requirements 11.1–11.5, 13.1–13.4; Design: Correctness Property 14**

  - [x] 5.8 Write the property-based test for **Property 15: Repository policy invariants survive every plan**.
    - Generate commands, hooks, task graphs, powers, agents, and reviewer plans; assert root-only `pnpm`, no worktrees, default one-agent ceiling, read-only production behavior, mode-aware persistence, database/fork isolation, both Vitest lanes, and required gates.
    - **Validates: Requirements 9.2, 11.6, 14.2, 14.5; Design: Correctness Property 15**

  - [x] 5.9 Write the property-based test for **Property 16: The feature implementation wave is bounded and fail-closed**.
    - Generate wave plans with zero through four agents, overlapping/disjoint ownership, reservation states, freeze states, scope violations, shared-output writes, partial/abandoned agents, integration conflicts, and reviewer outcomes.
    - Assert max four, disjoint writes, reservation-before-mutation, freeze-before-dependent-work, root-only `pnpm`, no worktree/hidden spawn/retry/replan, fail-closed conflict handling, preserved/restored state, exactly one integration gate, and sequential reviewers before enablement.
    - **Validates: Requirements 9.8–9.12, 10.12–10.13, 11.7–11.8, 14.10–14.12; Design: Correctness Property 16**

  - [x] 5.10 Add Lane D contract, example, and controlled rollback tests.
    - Cover max-four enforcement, zero-agent/default-one-agent behavior, ownership conflicts, stale/missing reservations, shared-contract freeze, shared generated-output rejection, partial/abandoned agents, no automatic retry/replan, reviewer restrictions, rollback failure, and `no rollback applies` records.
    - **Validates: Requirements 9.8–9.12, 10.12–10.13, 11.7–11.8, 12.6–12.7, 13.5, 13.8, 14.10–14.12; Design: Failure and rollback testing, implementation review DAG_

- [x] 6. Integrate the completed concurrent wave through one post-wave `Integration_Validation_Gate`
  - [x] 6.1 Implement the integration-owned gate and pipeline wiring.
    - Create only `integration-gate.ts`, `pipeline.ts`, and the integration-owned final-gate interface after all four lanes complete; consume every lane output through frozen contracts and preserve the manual graph-impact/sequential fallbacks.
    - The gate must collect every agent output, reservation status, changed-file manifest, contract-freeze record, validation result, and conflict report before any reviewer or enablement stage.
    - _Requirements: 1.1–14.9, especially 9.11–9.12, 11.7–11.8, 12.2–12.8, 13.5–13.8; Design: IntegrationValidationGate, High-level flow, Phased rollout Phase 5_

  - [x] 6.2 Add integration tests for collection, ownership, and conflict handling.
    - Use synthetic agents to prove the gate rejects missing/stale reservations, overlapping writes, shared generated-output writes, mutation before freeze, out-of-scope mutation, more than four agents, partial/abandoned output, unresolved conflicts, and missing reviewer inputs; assert affected-wave stop, no dependent enablement, no automatic retry/replan, and preserve/restore behavior.
    - Write only under `tests/kiro-repo-guidance-setup/integration/`.
    - **Validates: Requirements 9.8–9.12, 10.12–10.13, 11.7–11.8, 12.6, 14.10–14.12; Design: IntegrationValidationGate, Error handling, Failure and rollback testing_

  - [x] 6.3 Run the integration gate’s focused tests and required repository gates.
    - Verify all lane outputs and changed-file ownership, resolve only declared integration conflicts, run focused evaluator tests, `pnpm run check:layout`, applicable documentation checks, and `pnpm run gate:fast`; record generated `.json`/`.txt` evidence under `results/kiro-repo-guidance-setup/` and never hand-write Markdown there.
    - If `pnpm run test` is used, record default and tech-docs Vitest lanes independently; do not claim a full ship gate unless `pnpm run gate` actually runs.
    - _Requirements: 12.2–12.5, 12.7, 13.5–13.7, 14.5; Design: Validation Gates and Evidence Outputs, Smoke and repository gates_

- [ ] 7. Run the first sequential review stage: `EvidenceCompatibilityReviewer`
  - [x] 7.1 Add contract tests for reviewer ordering and read-only restrictions.
    - Assert the only permitted order is `Integration_Validation_Gate -> EvidenceCompatibilityReviewer -> SafetyRollbackReviewer -> final owner-approved gate`; assert one reviewer at a time, maximum concurrency 1, iteration ceiling 3, no mutation/spawning/worktrees/retries/replans/approval bypass, and no external/global/Crew enablement.
    - **Validates: Requirements 9.11–9.12, 10.2, 10.6–10.7, 11.5, 14.8–14.9; Design: Implementation review task execution and DAG plan_

  - [-] 7.2 Execute `EvidenceCompatibilityReviewer` only after the integration gate passes or explicitly records a blocked handoff.
    - Review source inventory, coverage/exclusions, artifact inventory, all seven surface/version records, owner decisions, and Validation_Run freshness; report transferred claims, missing evidence, unavailable candidates, and blockers without repair or mutation.
    - Record `maximumConcurrency: 1`, `iterationCeiling: 3`, read-only status, evidence references, and `no rollback applies` for the review stage.
    - _Requirements: 1.1–1.6, 2.1–2.7, 3.1–3.6, 4.1–4.6, 9.11, 10.2, 12.2, 12.5, 12.8, 13.3, 13.7; Design: EvidenceCompatibilityReviewer_

- [x] 8. Run the second sequential review stage: `SafetyRollbackReviewer`
  - [x] 8.1 Execute `SafetyRollbackReviewer` only after the EvidenceCompatibilityReviewer handoff.
    - Review approval boundaries, secret/permission/network results, repository invariants, pre-change snapshots, Known_Gaps_Register, rollback records, and proposed handover; block missing approval, unsafe boundary, failed rollback, policy violation, incomplete evidence, or handover inconsistency.
    - Record `maximumConcurrency: 1`, `iterationCeiling: 3`, read-only status, no mutation/spawning/worktree/retry/replan/approval bypass/external-global-Crew enablement, and `no rollback applies` for the review stage.
    - _Requirements: 1.6, 5.1–5.7, 7.9, 8.4–8.8, 9.2, 9.7, 9.11–9.12, 10.2, 10.11–10.13, 11.2–11.8, 12.6–12.7, 13.4–13.8, 14.1–14.12; Design: SafetyRollbackReviewer_

  - [x] 8.2 Add safety-review integration tests for failed/partial handoffs.
    - Prove SafetyRollbackReviewer cannot start a successful enablement path from partial EvidenceCompatibilityReviewer output and cannot repair, approve, mutate, spawn, or bypass an unresolved boundary; assert prior state remains preserved.
    - **Validates: Requirements 9.11–9.12, 10.2, 10.11–10.13, 11.5, 12.6, 13.7–13.8, 14.8–14.12; Design: Error handling, implementation review DAG_

- [x] 9. Apply the final owner-approved validation/enablement gate after both reviewers
  - [x] 9.1 Implement the integration-owned `EnablementGate` in `enablement.ts` and consume both reviewer outputs.
    - Grant `enabled-valid` only when scope-specific owner approval, fresh exact-target validation, schema/artifact pass, repository compatibility, security-boundary confirmation, rollback readiness, no blocking known gap, policy pass, and both reviewer passes are present.
    - Otherwise retain `blocked`, `deferred`, `observe`, `disable`, or `exclude`; do not enable LTM, incompatible Crew behavior, unvalidated powers/MCP/agents/subagents, unvalidated surfaces, or unrepaired hooks.
    - _Requirements: 1.6, 4.5, 5.5, 7.3, 7.6, 8.5, 9.7, 10.2–10.11, 11.4–11.5, 12.6–12.8, 13.7–13.8, 14.8–14.9; Design: Enablement predicate, Gate sequence_

  - [x] 9.2 Add the end-to-end local-surface integration test.
    - Exercise inventory through both reviewers and final gate with incomplete discovery, failed schema, unresolved approval, Crew conflict, stubbed LTM, ownership conflict, partial agent, failed rollback, and successful local artifact validation; assert exact statuses, generated evidence, preserved state, and no unsafe side effects.
    - **Validates: Requirements 1.6, 2.7, 4.5, 5.5, 7.3, 7.6, 8.5, 9.7, 10.2–10.13, 11.4–11.8, 12.6–12.8, 13.5–13.8, 14.8–14.12; Design: Error handling, Failure and rollback testing_

  - [x] 9.3 Execute the final owner-approved gate only after both sequential reviewers have recorded results.
    - Record the exact target surface/version, predicates, reviewer handoffs, enabled/blocked disposition, evidence references, limitations, and rollback readiness; no reviewer may be treated as an approval substitute.
    - _Requirements: 10.2, 11.4–11.5, 12.7–12.8, 13.7–13.8; Design: Enablement predicate, Handover Record Design_

- [ ] 10. Regenerate the operational handover and complete final validation
  - [-] 10.1 Run the final applicable artifact, documentation, repository, test, security, rollback, and handover validation sequence from `D:\23082026`.
    - Run artifact checks, `pnpm run check:layout`, applicable `pnpm run check:docs-all`, focused tests, `pnpm run gate:fast`, and both Vitest lanes independently when `pnpm run test` is used; run `pnpm run gate` only when the ship bar is requested.
    - Run `pnpm run scan:boundaries` only if a future implementation touches Studio or Planner; otherwise record that it is not applicable. Do not claim browser, hook, external-service, surface, build, or ship success without fresh evidence.
    - _Requirements: 12.2–12.5, 12.7, 13.5–13.7, 14.5; Design: Gate sequence, Smoke and repository gates_

  - [-] 10.2 Regenerate and validate the final Handover_Record and generated evidence.
    - Confirm every artifact has exactly one handover disposition, every enabled-valid claim has exact-surface evidence/approval/schema/security/rollback/reviewer proof, every other claim is explicitly labeled, all blocking gaps have disposition/owner/next run, and the exact complete-review sentence is accurate.
    - Confirm no lane wrote outside its ownership, no generated result is hand-written Markdown, no Crew exception was implied, and the final rollback path can restore or disable each changed artifact.
    - _Requirements: 1.5–1.6, 4.6, 11.1–11.8, 12.7–12.8, 13.1–13.8, 14.3–14.9; Design: Handover Record Design, Validation Gates and Evidence Outputs_

  - [-] 10.3 Record the final wave, integration, reviewer, enablement, and rollback statuses as append-only validation evidence.
    - Include all agent outputs, reservations released/stale/conflicting status, shared-contract freeze, changed-file ownership, conflict resolutions, both reviewer results, final gate predicates, generated evidence references, limitations, and blockers (`none` when absent).
    - _Requirements: 9.8–9.12, 10.12–10.13, 11.7–11.8, 12.2, 13.5–13.8, 14.10–14.12; Design: Record lifecycle, IntegrationValidationGateRecord, ValidationRun_

- [~] 11. Final checkpoint — ensure the selected implementation and validation tasks are complete
  - Confirm the general repository default remains one active agent/no worktrees, the only concurrency above one was the feature-scoped OD-04 wave capped at four, and no `AGENTS.md` change, Crew worktree, hidden spawn, automatic retry/replan, external/global/secret-bearing operation, production write, dependency change, or unrelated file mutation occurred.
  - Confirm all reservations are released or explicitly recorded, all generated outputs are owned by the integration/final-gate owner, both reviewer stages ran sequentially or are explicitly blocked, and the final enablement decision is fail-closed.

## Notes

- The general repository rule remains one active agent and no worktrees. OD-04 is a conditional, feature-only exception for `kiro-repo-guidance-setup` and permits at most four active Implementation_Agents only after explicit approval boundaries, disjoint ownership, successful reservations before mutation, a completed shared-contract freeze, explicit read/write scopes, root-only `pnpm`, no shared generated-output writes, and one post-wave Integration_Validation_Gate. It does not modify `AGENTS.md`.
- Waves 3 through 12 in the dependency graph represent time-overlapping work across the four named lanes. Each such wave has no more than one task per lane, so the graph never schedules more than four active Implementation_Agents. They are not permission for overlapping writes, dependent work before freeze, hidden spawning, worktrees, automatic retries/replans, or general/native/Crew parallel execution.
- Lane ownership is exclusive. A lane may read another lane’s frozen contracts/output but may not mutate another lane’s files. A shared file must be assigned to one owner before mutation or moved behind the integration gate. The integration owner alone writes integration pipeline/gate/final-gate files, integration tests, and `results/kiro-repo-guidance-setup/**`.
- `File_Ownership_Reservation` is acquired and validated before every mutation. Missing, stale, duplicate, conflicting, or out-of-scope reservations stop the affected agent/wave fail-closed and preserve or restore prior state.
- `Shared_Contract_Freeze` must pass before Lane B, Lane C, or dependent Lane D work begins. If contract files change later, the wave is invalidated and must return to a new bounded freeze; no dependent work proceeds on a stale contract hash.
- All 16 design correctness properties have dedicated optional property-test subtasks with at least 100 `fast-check` iterations when the existing dependency is available. Property tests assert records and decisions, not real external services.
- Testing subtasks are marked `*` and may be skipped for an MVP, but the implementation and required validation tasks must still preserve their contracts. If `fast-check` is unavailable, do not install it implicitly; record the dependency/approval boundary and leave affected optional tests deferred.
- The two reviewer stages are not implementation lanes: `EvidenceCompatibilityReviewer` runs first, then `SafetyRollbackReviewer`. Each is read-only, maximum concurrency 1, bounded to three review iterations, and prohibited from mutation, spawning, worktrees, retries/replans, approval bypass, and external/global/Crew enablement. The final owner-approved enablement gate comes only after both reviewer results.
- The LTM hook remains disabled while `ltm/bin/ltm.py capture-turn` is a stub. Crew memory/knowledge documentation cannot prove local LTM execution. Incompatible Crew worktrees, concurrency, retries/replans, hidden spawning, and auto-approval remain deferred/excluded.
- All commands run from `D:\23082026` with `pnpm`; no package manager is run from `site/` or `tech-docs-generator/`. `results/` receives generated `.json`/`.txt` evidence only, never hand-written Markdown reports or audit archives.
- If `pnpm run test` is used, record the default Vitest and tech-docs Vitest lanes independently. Run `pnpm run check:layout` before done and `pnpm run gate:fast` for the fast bar; run `pnpm run gate` only when the ship bar is requested. Never invent a browser, build, hook, surface, external-service, or rollback result.
- No task changes application source, dependencies, lockfiles, production data/filesystems, global settings, credentials, or external services without a named Approval_Boundary, fresh target-surface validation, and rollback-ready pre-change state. The plan itself does not authorize those actions.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5"] },
    { "id": 3, "tasks": ["2.1", "3.1", "4.1", "5.1"] },
    { "id": 4, "tasks": ["2.2", "3.2", "4.2", "5.2"] },
    { "id": 5, "tasks": ["2.3", "3.3", "4.3", "5.3"] },
    { "id": 6, "tasks": ["2.4", "3.4", "4.4", "5.4"] },
    { "id": 7, "tasks": ["2.5", "3.5", "4.5", "5.5"] },
    { "id": 8, "tasks": ["2.6", "3.6", "4.6", "5.6"] },
    { "id": 9, "tasks": ["2.7", "3.7", "4.7", "5.7"] },
    { "id": 10, "tasks": ["2.8", "3.8", "4.8", "5.8"] },
    { "id": 11, "tasks": ["4.9", "5.9"] },
    { "id": 12, "tasks": ["4.10", "5.10"] },
    { "id": 13, "tasks": ["6.1"] },
    { "id": 14, "tasks": ["6.2"] },
    { "id": 15, "tasks": ["6.3"] },
    { "id": 16, "tasks": ["7.1"] },
    { "id": 17, "tasks": ["7.2"] },
    { "id": 18, "tasks": ["8.1"] },
    { "id": 19, "tasks": ["8.2"] },
    { "id": 20, "tasks": ["9.1"] },
    { "id": 21, "tasks": ["9.2"] },
    { "id": 22, "tasks": ["9.3"] },
    { "id": 23, "tasks": ["10.1", "10.2", "10.3"] }
  ]
}
```
