# Implementation Plan: Site UI, Content, and Links Audit

## Overview

Implement and execute a read-only TypeScript audit program in six ordered waves (`Wave 0` through `Wave 5`). This consolidated plan reduces task-item count without reducing audit scope: it still covers canonical inventories, source/tool/evidence adapters, exact occurrence expansion, static audit, authorization-gated runtime evidence, findings and handoffs, and machine-checkable completion proof. The program may add or modify only non-product audit tooling, generated evidence, and authored audit work products. It must not remediate findings, modify `site/**`, mutate databases or hosted systems, or cross the Planner/Studio fork boundary.

Completion state is preserved from the prior plan: the consolidated Wave 0 items are `[x]` because former tasks 1.1–1.12 were complete, and Wave 1 item 2.1 is `[x]` because former task 2.1 was complete. Every remaining implementation or test item is `[ ]`; optional Wave 0 property work remains completed, while later optional work remains incomplete.

## Execution and Authorization Legend

- **Audit-tooling source:** `scripts/site-ui-content-links-audit/**` (non-product tooling only).
- **Automated tests:** `tests/site-ui-content-links-audit/**` (optional tasks only; fixture-based test code does not authorize runtime operations).
- **Generated evidence:** `results/site-ui-content-links-audit/<runId>/<purpose>/**`, always machine-generated and manifest-owned.
- **Authored audit work:** `agents-work/site-ui-content-links-audit/<report-type>/**`; never hand-write reports under `results/**`.
- **Prohibited writes:** `site/**`, databases, hosted systems, production filesystems, deployment configuration, Planner/Studio product trees, product content, and remediation code. Planner and Studio inventories, evidence, findings, likely source areas, artifacts, and handoffs remain separate; no Planner↔Studio import, comparison as shared implementation, or ownership crossing.
- **`[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]`:** do not execute the named test, browser, build, gate, protected-route, hosted, analytics, performance, local-service, external-network, or other protected operation until the repository owner authorizes that exact operation in the current session and the enabled hook permits it. Authorization for one operation does not authorize retries or adjacent operations.
- **Optional tasks:** Items marked with `*` are optional test work and may be skipped for a faster audit-program implementation. Property, golden-fixture, unit, and integration tests remain separately authorized; implementing adjacent audit code never implicitly authorizes them. Mixed implementation/checkpoint items identify their optional test portion explicitly.
- **Static audit batches:** Source-only audit execution may proceed without asserting rendered or runtime behavior. Any runtime-dependent row must terminate as `blocked` or `not-run` with its exact pending operation when authorization or a prerequisite is absent.
- **Shared evidence contract:** Every inventory, evidence, and finding record is occurrence-scoped, linked to canonical route/instance/shell and matrix IDs, and retains expectation/observation/conclusion plus source/runtime claim basis. Each applicable occurrence has exactly one terminal aggregate finding, including conforming rows. `blocked`/`not-run` records name the exact pending operation, missing authorization or prerequisite, and limitation; `not-applicable` records carry rationale; runtime claims carry an authorization envelope, profile, tool/action, result, and redaction status. Samples never close uncovered rows. Manifests preserve run/config/schema/tool/source hashes, generations, supersession and invalidation links, and the distinction between authored and generated artifacts.

## Tasks

### Wave 0 — Establish prerequisites, canonical inventory, schemas, profiles, and matrix

- [x] 1.1 Establish the non-product audit foundation, schemas, adapters, discovery, profiles, matrix, manifests, and wave controls
  - Create the TypeScript entry points and run configuration; load immutable run inputs, stable run IDs, repository/configuration hashes, and approved artifact-path rules. Fail closed for `site/**`, unpartitioned `results/`, root reports, databases, production destinations, and either product fork.
  - Define versioned schemas and conditional validation for provenance, source/tool/evidence registries, routes, dynamic instances, shells, specialized inventories, profiles, applicability, matrix rows, authorization, evidence, findings, copy/Hindi proposals, severity, duplicate groups, exclusions, gaps, handoffs, checkpoints, manifests, and completion proof. Quarantine incomplete conditional records with stable diagnostics.
  - Register ranked source authorities and adapters for the App Router tree, repository data/read paths, static-generation declarations, route contracts, internal links, sitemap/metadata sources, generated inventories, and every Existing Audit Tool used. Preserve scope, inputs, outputs, omissions, profiles, authorization class, last-observed state, residual work, conflicts, and provenance; sampled output cannot close uncovered rows.
  - Discover every static/dynamic page, route-group owner, redirect-only route, layout, template, visible provider, loading/error/not-found boundary, consent/offline shell, and other user-visible Shared Shell. Union dynamic instances only from provenance-bearing declarations, data, contracts, links, sitemap candidates, prior revisioned inventories, or separately supplied authorized discoveries; do not invent placeholders. Normalize URLs deterministically and retain conflicts, exclusions, and unresolved-instance gaps.
  - Freeze versioned viewport, browser/OS/assistive-technology, access, English/Hindi, consent, and performance profiles; record applicability and expand the exact state × viewport × browser × access × language product. Generate stable occurrence/finding IDs, input fingerprints, wave ownership, and non-applicability rationales; never substitute representative rows.
  - Partition canonical data with manifests and optional CSV review projections; implement leases, heartbeats, terminal states, stale-lease recovery, one writer per partition, bounded concurrency, deterministic merges, inventory generations, dependency invalidation, redaction/quarantine, review queues, resumability, and wave entry/exit guards. Matching completed partitions may be skipped, but changed fingerprints invalidate dependents and no wave closes with nonterminal or invalidated owned items.
  - **Consolidates former tasks:** 1.1–1.6. **Prerequisites:** completed requirements/design and existing `.config.kiro`; no runtime authorization is required for source-level setup.
  - **Validation:** Valid examples for every record type parse; every candidate receives one canonical classification or explicit exclusion/gap/conflict; matrix cardinality equals declared Cartesian products; interrupted runs resume without duplicate identity; manifests reconcile and prove approved-path scope.
  - _Requirements: 1.1–1.8, 2.1–2.6, 3.1–3.9, 4.1–4.7, 19.1–19.8, 20.1–20.8, 22.1, 22.7–22.9, 23.3–23.7, 24.1–24.8, 25.1–25.7, 26.1–26.2, 26.5, 26.9, 26.12_

- [x]* 1.2 Complete the grouped optional Wave 0 property tests
  - **Property 1: Canonical inventory closure** — generate candidate sets and verify exactly one canonical, exclusion, gap, or conflict-linked classification with no unclassified record. **Validates:** Requirements 1.1–1.8, 2.1, 2.4, 2.6, 19.1–19.4, 26.1.
  - **Property 2: Provenance-preserving dynamic-instance deduplication** — verify order independence, one normalized instance, full provenance union, and discovery-time retention. **Validates:** Requirements 2.2, 2.3, 2.5.
  - **Property 3: Exact occurrence expansion and finding bijection** — verify the unique applicability Cartesian product and one aggregate finding ID per row without sampling. **Validates:** Requirements 3.1–3.9, 5.8, 7.1–7.2, 7.7, 9.1–9.2, 9.7, 10.7, 12.8, 17.3, 19.6–19.8, 26.2–26.4.
  - **Property 4: Authorization-lane non-escalation** — verify static evidence cannot satisfy runtime claims and missing/denied authorization never executes work. **Validates:** Requirements 4.1–4.6, 15.3, 15.7, 16.7, 17.8, 26.10.
  - **Property 5: Zero product-code mutation** — verify change manifests accept only approved audit-tooling/artifact paths and reject `site/**`, Planner/Studio product trees, and other product boundaries. **Validates:** Requirements 4.7, 23.6–23.7.
  - **Prerequisites:** 1.1 and the corresponding schemas/discovery/profile/controller behavior. Generate at least 100 cases per property and retain the required feature/property names. The exact targeted Vitest `--run` command remains separately authorized by the authorization legend; do not substitute a build or gate.

- [x] 1.3 Execute and checkpoint the Wave 0 static batch
  - Run only the source-inspection entry point to produce generation-1 source/tool registries, canonical route/dynamic/shell inventories, applicability records, exact matrix partitions, and manifests. Record adapter errors and inaccessible domains as gaps; do not execute tests, browsers, builds, gates, protected routes, local services, or hosted operations.
  - **Consolidates former task:** 1.12. **Prerequisites:** 1.1; optional 1.2 is not required unless separately authorized.
  - **Validation:** 100% of discovered Wave 0 items have terminal classification, registries are frozen, matrix counts reconcile to applicability, and the Wave 0 manifest proves no product-code write. Ensure all authorized tests pass; ask the user if questions arise.
  - _Requirements: 1.8, 2.6, 3.6, 22.1, 22.7–22.9, 26.1–26.2_

### Wave 1 — Audit shared foundations, route/link integrity, and global states

- [x] 2.1 Inventory shared shells, links, navigation, states, and journeys
  - Extract anchors, router actions, menu/breadcrumb models, downloads, fragments, external targets, headers/footers/dialogs/banners, global/local navigation, back/cancel/recovery actions, and foundational journey edges. Compare normalized internal links with route/redirect evidence while retaining external availability as an unresolved runtime claim; record static ownership, protocol, opening, and security attributes.
  - **Consolidates former task:** 2.1. **Prerequisites:** Wave 0 closed (1.3).
  - **Validation:** Every foundational inventory item maps to all applicable occurrences or an explicit rationale/gap; malformed, stale, circular, misleading, or journey-inconsistent targets produce occurrence-specific defects.
  - _Requirements: 5.1–5.8, 6.1–6.7, 7.1–7.7, 20.1–20.4_

- [x] 2.2 Build auth/legal/consent/error/offline foundation inventories and per-occurrence evidence/findings
  - Inventory source-visible authentication/session/access messages, legal/policy references, consent controls/states, analytics declarations, security/privacy messages, loading/error/not-found/offline boundaries, logging paths, and recovery controls. Keep source expectations distinct from runtime observations and enumerate exact pending operations for consent delivery, auth transitions, offline/reconnect, and recovery behavior.
  - Normalize dimension evidence into complete Evidence Records and require exactly one terminal aggregate Occurrence Finding per Wave 1 matrix row, including conforming rows. Preserve requirement/journey/shell links, blockers, applicability rationale, likely owner, dependencies, verification method, and source/runtime claim basis.
  - **Consolidates former tasks:** 2.2–2.3. **Prerequisites:** 2.1 plus the Wave 0 schema, profile, and occurrence services.
  - **Validation:** Every applicable Shared Shell/foundation occurrence receives static evidence or a terminal gap/not-run status; every dimension record traces to inventory and occurrence IDs; conditional fields are complete and no legal or runtime conclusion is inferred from source alone.
  - _Requirements: 3.7–3.9, 4.1–4.6, 7.1–7.7, 16.1, 16.7, 17.1–17.3, 17.8, 18.1–18.7, 19.4, 20.1–20.8, 26.3–26.5, 26.10_

- [x]* 2.3 Complete the grouped optional Wave 1 property tests
  - **Property 6: Inventory-to-occurrence traceability** — verify every specialized item maps to every applicable occurrence or an explicit rationale, gap, or exclusion. **Validates:** Requirements 5.1–5.2, 7.1, 8.1, 10.1, 11.1, 12.1, 13.1, 14.1, 16.1, 17.1–17.2, 18.1.
  - **Property 7: Link normalization and defect generation** — verify idempotence, route/redirect comparison, complete target fields, and occurrence-specific defects for internal, fragment, download, external, malformed, stale, and circular targets. **Validates:** Requirements 5.3–5.7.
  - **Prerequisites:** 2.1–2.2. Generate at least 100 cases per property; use the exact targeted Vitest `--run` command only with separate authorization under the legend.

- [x] 2.4 Execute and checkpoint the Wave 1 static batch
  - Generate shell, link, message, state, error, and offline inventories plus per-occurrence static findings; list runtime-dependent checks as exact pending operations rather than executing them.
  - **Consolidates former task:** 2.6. **Prerequisites:** 2.1–2.2; optional 2.3 only if separately authorized.
  - **Validation:** Every Wave 1 item and matrix row is terminal as conforming, nonconforming, blocked, not-run, not-applicable, requires-owner-decision, or classified gap; manifests reconcile all outputs. Ensure all authorized tests pass; ask the user if questions arise.
  - _Requirements: 22.2, 22.7–22.9, 26.3–26.5, 26.10–26.12_

### Wave 2 — Audit marketing, catalog/configurator, portal/dashboard, and primary journeys

- [x] 3.1 Build surface-specific journey, form, asset, copy/IA, metadata, and static-dimension evidence
  - Traverse marketing, catalog/configurator, portal, and dashboard source graphs to inventory Primary Journeys, transitions, forms/transactions, user-visible assets/media, copy/IA, metadata/search/social/structured data, indexing policy, and perceived-performance expectations. Preserve INR/product/business/legal facts, access/surface boundary contracts, state applicability, and route-instance identity.
  - Evaluate source-visible link/navigation, state/fallback, copy/IA, accessibility semantics, design-system usage, form contracts, assets, metadata, source performance risks, errors, analytics/consent, and security/privacy across all Wave 2 occurrences. Capture replacement-ready English wording and accountable Hindi review notes for copy-related static defects without editing product content.
  - **Consolidates former tasks:** 3.1–3.2. **Prerequisites:** Wave 1 closed (2.4) and the shared evidence/finding services.
  - **Validation:** Every scoped route/instance and specialized item maps to applicable occurrences; every journey terminates in an outcome or gap; every metadata-applicable instance has a source conclusion; each dimension has per-occurrence evidence or an explicit runtime/gap status; proposals preserve cited facts and approval state.
  - _Requirements: 5.1–18.8, 20.1–20.8, 22.3, 26.6_

- [ ]* 3.2 Complete the grouped optional Wave 2 property tests
  - **Property 8: Journey graph terminality and boundary contracts** — verify every entry reaches a terminal outcome or gap and every access/surface crossing carries its complete contract. **Validates:** Requirements 6.1–6.2, 6.4–6.7, 16.5.
  - **Property 9: Replacement-ready content completeness** — verify every relevant defect has final English content/structure, placement, intent, state, preserved facts, and a compliant Hindi Note; unapproved machine Hindi cannot satisfy approval evidence. **Validates:** Requirements 8.3–8.8, 14.6, 18.6, 26.6.
  - **Property 10: Metadata route consistency** — verify deterministic canonical/sitemap comparison, per-instance conclusions, and indexing rationale for protected, transactional, offline, error-only, Planner, and Studio policies. **Validates:** Requirements 14.2–14.8.
  - **Prerequisites:** 3.1. Generate at least 100 cases per property and use the exact targeted Vitest `--run` command only with separate authorization under the legend.

- [-] 3.3 Execute and checkpoint the Wave 2 static batch
  - Generate Wave 2 inventories, evidence, findings, initial copy/Hindi proposals, and exact pending runtime operations without remediating product code.
  - **Consolidates former task:** 3.6. **Prerequisites:** 3.1; optional 3.2 only if separately authorized.
  - **Validation:** All scoped journeys and occurrences are terminal or explicitly gapped; metadata conclusions cover all applicable route instances; generated manifests reconcile. Ensure all authorized tests pass; ask the user if questions arise.
  - _Requirements: 8.8, 14.8, 22.3, 22.7–22.9, 26.3–26.6, 26.10–26.12_

### Wave 3 — Audit administration, Planner, Studio, protected contexts, and specialized states

- [x] 4.1 Build the protected/admin, Planner-only, Studio-only, and specialized-state static partitions
  - Inventory administration, portal/dashboard protection, auth redirects, role/session contracts, development-bypass behavior, specialized states, forms, messages, journeys, and unavailable fixtures/credentials without accessing protected routes. Keep guest, customer, staff, administrator, expired-session, insufficient-role, and development-bypass occurrences separate; public/guest/bypass evidence cannot close authenticated or role-specific rows.
  - Build a Planner-only partition for `/ooplanner`, every discoverable project instance, Planner shells, canvas/editor actions, states, persistence expectations, links, forms, assets, copy, metadata/indexing, accessibility-equivalent outcomes, and likely Planner-owned source areas. Build a separate Studio-only partition for `/oostudio` and its equivalent surfaces. Never import, compare as shared implementation, or recommend ownership from the other fork.
  - Reconcile per-occurrence static findings for admin, Planner, Studio, protected access, offline/recovery, error, empty, stale, conflict, rate-limit, and other specialized states. Record exact protected-route/browser operations and fixture/credential needs for unresolved runtime claims without executing them.
  - **Consolidates former tasks:** 4.1–4.4. **Prerequisites:** Wave 2 closed (3.3), Wave 0 dynamic discovery, and shared evidence services.
  - **Validation:** Protected routes remain in the matrix without credentials; every Planner/Studio item and occurrence is separately traceable; all Wave 3 rows have terminal static/gap/pending status; bypass/guest evidence never substitutes for hosted protected evidence; fork ownership and artifact partitions are explicit.
  - _Requirements: 3.4–3.9, 4.2–4.6, 7.1–7.7, 10.6–10.8, 11.7, 12.1–12.8, 16.1–16.7, 18.1–18.7, 19.1–19.8, 23.3–23.7_

- [ ] 4.2 Complete the grouped optional fork-ownership property test and checkpoint Wave 3
  - **Property 13: Duplicate grouping preserves occurrence identity and fork ownership** — verify grouping retains every finding/evidence record and cannot merge Planner and Studio implementation ownership, including equivalent cross-fork symptoms. **Validates:** Requirements 19.5, 21.3.
  - **Consolidates former tasks:** 4.5–4.6. **Prerequisites:** 4.1, the grouping contract, and shared schemas; generate at least 100 property cases if the optional test is selected.
  - **Checkpoint validation:** Generate administration, Planner, Studio, access-context, and specialized-state partitions plus exact pending protected operations; every Wave 3 item is terminal, fork/access separation is proven by artifact partition and IDs, and manifests show no product-code writes. The property test uses the exact targeted Vitest `--run` command only with separate authorization under the legend. Ensure all authorized tests pass; ask the user if questions arise.
  - _Requirements: 19.1–19.8, 21.3, 22.4, 22.7–22.9, 26.3–26.5, 26.10–26.12_

### Wave 4 — Run authorization-gated runtime evidence batches

- [ ] 5.1 Register protected operations and enforce the authorization gate
  - Register each exact command/browser action, environment, occurrence selector, credential/fixture, profile, expected output, sensitivity control, authorization statement, hook decision, retry identity, and limitation before invocation. Match authorization to the same operation and occurrences; missing, denied, stale, or mismatched authorization emits `not-run` or `blocked` and never executes work.
  - Freeze runtime profiles and performance budgets before evidence collection. Preserve redaction, no-secret/no-personal-data rules, retry isolation, and exact pending-operation records; never weaken, retry, or rewrite denied work.
  - **Consolidates former task:** 5.1. **Prerequisites:** Wave 3 closed (4.2), runtime profiles and performance budgets frozen.
  - **Validation:** Runtime evidence is accepted only with the authorization envelope required by the legend; conditional fields are complete for every blocked/not-run record; static evidence cannot satisfy a runtime claim.
  - _Requirements: 4.1–4.6, 15.1–15.2, 15.7, 17.8, 22.5, 26.10_

- [ ] 5.2 Execute the authorized responsive, accessibility, state, asset, analytics, security, metadata, external-link, and performance workstreams
  - **Responsive/cross-browser:** with separate authorization for each exact browser runner, browser/profile set, route batch, environment, and retry, capture reflow, overflow, clipping, overlap, truncation, sticky/viewport/safe-area/orientation/zoom/input behavior, and reachability of dialogs, menus, drawers, tables, canvases, toolbars, and forms. Unauthorized or unselected rows remain `not-run`; no browser inherits another browser's conclusion. _Requirements: 9.1–9.7, 12.3, 22.5._
  - **Accessibility/assistive technology:** with separate authorization for each automated command, keyboard/browser workflow, assistive-technology profile, route batch, and protected access context, capture WCAG 2.2 AA semantic, keyboard/focus, contrast/reflow, pointer/motion/timing, alternative/caption, instruction/error, autocomplete/language/status, and equivalent-outcome evidence independently for Planner and Studio. Automated output never substitutes for required human/AT evidence. _Requirements: 10.1–10.8, 19.5, 22.5._
  - **State/form/journey/protected/error/offline/recovery:** with separate authorization for each exact browser workflow, protected route/access identity, fixture, local service, destructive-action simulation, offline transition, and retry, capture pending/success/validation/failure behavior, input preservation, duplicate prevention, navigation, request/console/hydration/resource evidence, offline/reconnect behavior, and recovery without mutating production or real user data. Unavailable credentials/fixtures are `blocked`; guest/bypass results cannot close another context. _Requirements: 6.3–6.6, 7.1–7.7, 12.2–12.8, 16.2–16.7, 19.4, 19.6–19.8._
  - **Assets/analytics/consent/security/privacy/metadata/hosted/external links:** with separate authorization for each exact hosted inspection, external network check, analytics inspection, consent workflow, asset-failure simulation, metadata fetch, protected identity, and retry, capture fallback/layout/render evidence, external destination behavior, runtime metadata/structured data, analytics delivery/suppression/uniqueness/payload minimization, consent persistence/withdrawal, and visible security/privacy messaging without persisting secrets or personal data. Static declarations never become delivery, availability, legality, or runtime-conformance claims. _Requirements: 5.4–5.6, 13.2–13.7, 14.1–14.7, 17.3–17.8, 18.2–18.7._
  - **Performance/perceived performance:** with separate authorization for each exact performance command/browser action, route/interaction batch, profile, cache state, fixture, run count, percentile, environment, and retry, capture LCP, INP, CLS, route duration, resource evidence, and perceived-performance behavior against frozen budgets. Every measurement records value, budget, profile, run count, percentile, authorization, and affected occurrence; unauthorized rows receive no pass/fail measurement conclusion. _Requirements: 15.1–15.7, 22.5._
  - **Prerequisites:** 5.1 and matching matrix partitions, profiles, fixtures, credentials, environments, and sensitivity controls. Each workstream is independently authorization-gated; no operation in one workstream authorizes another.

- [ ] 5.3 Ingest runtime outputs and checkpoint Wave 4, with optional authorization-gate tests
  - Normalize authorized outputs through typed adapters, preserve partial completion, and emit exact `blocked`/`not-run` findings for every unexecuted runtime row. Redact sensitive output and retain reproduction details, operation identity, occurrence selectors, profile, authorization, hook decision, and limitation.
  - **Optional unit/adapter integration tests (former task 5.7):** cover permit, deny, not-observed, stale authorization, selector mismatch, partial output, tool crash, redaction, and retry isolation using fixtures only. The exact targeted Vitest `--run` command remains separately authorized and does not authorize any browser, protected route, hosted operation, or performance command.
  - **Consolidates former tasks:** 5.7–5.8. **Prerequisites:** 5.1; 5.2 only where each exact operation was separately authorized; optional tests only if selected and authorized.
  - **Validation:** Every selected operation has Authorization Evidence plus result, or every affected row records the exact missing authorization/prerequisite; all Wave 4 items are terminal and no runtime claim is sourced only from static evidence. Ensure all authorized tests pass; ask the user if questions arise.
  - _Requirements: 4.1–4.6, 4.3–4.6, 20.1–20.8, 20.6, 22.5, 22.7–22.9, 25.3–25.7, 26.3–26.5, 26.10–26.12_

### Wave 5 — Reconcile findings, proposals, handoffs, manifests, completion proof, and review

- [x] 6.1 Reconcile final occurrence findings, severity, and duplicate groups
  - Merge static and authorized runtime evidence by authority without losing conflicts; retain one terminal finding per matrix row, including conforming rows, with complete mandatory fields. Assign severity from all documented dimensions using the highest-supported deciding factor, rationale, and deterministic order.
  - Group supported root causes while retaining every per-occurrence evidence/finding record, occurrence selector/count, and separate Planner/Studio group. Preserve `requires-owner-decision` where severity or ownership is not evidenced.
  - **Consolidates former task:** 6.1. **Prerequisites:** Waves 0–4 closed (1.3, 2.4, 3.3, 4.2, 5.3) and the latest inventory generation propagated.
  - **Validation:** Matrix/finding bijection holds; every defect has severity/rationale or an explicit owner decision; duplicate groups preserve every member and fork owner.
  - _Requirements: 20.1–20.8, 21.1–21.7, 26.3–26.5, 26.7_

- [x] 6.2 Finalize copy/Hindi proposals, remediation handoffs, exclusions, gaps, conflicts, and pending operations
  - Produce complete English wording/structure, placement, intent, state, preserved facts, and a Hindi Note for every copy-related defect; include only evidenced approved Hindi or named translation ownership and mandatory human review. Keep proposals in authored audit work products linked to generated indices; do not edit product content.
  - Create one authored handoff per independent defect or supported duplicate group with IDs, occurrence selectors/counts, root-cause hypothesis, expected/proposed outcome, copy/Hindi content, ownership, likely source areas, dependencies, review/authorization/migration/asset needs, all acceptance contexts, risk, rollout/rollback, and verification method. State that product-code changes are separate implementation work requiring new approval; never prescribe Planner/Studio cross-imports or database mutation.
  - Complete every Exclusion Record and Coverage Gap, retain absent/legacy/local-only/unreachable items, require owner decisions for visible-scope exclusions, and list every pending protected operation with affected occurrences and exact authorization need. Resolve authority conflicts explicitly; no silent exclusion or unclassified item may disappear from totals.
  - **Consolidates former tasks:** 6.2–6.4. **Prerequisites:** 6.1, all copy-related evidence, and all wave manifests.
  - **Validation:** Proposal count equals copy-related defect count and cites/preserves INR, product facts, legal meaning, and business intent; every defect/group links to exactly one complete handoff; pending-operation totals equal canonical records; zero silent exclusions and zero unclassified gaps remain.
  - _Requirements: 1.6–1.8, 2.4, 8.3–8.8, 11.6–11.7, 13.7, 14.6, 18.6–18.7, 23.1–23.8, 24.1–24.8, 25.5–25.7, 26.6, 26.8–26.10_

- [x] 6.3 Generate final artifact manifests and machine-checkable completion proof
  - Compute canonical inventory, dynamic-source, matrix, finding, evidence, copy, severity, handoff, exclusion, gap, pending, result, and wave totals; verify one-to-one/set-equality invariants, schema closure, authorization coverage, generation/invalidation state, and content-signed manifests.
  - Emit a changed-path manifest proving zero `site/**` or product-code mutation and distinguish authored handoffs from generated evidence. Completion prominently reports blocked, not-run, owner-decision, and gap totals rather than treating them as passes.
  - **Consolidates former task:** 6.5. **Prerequisites:** 6.1–6.2.
  - **Validation:** All totals reconcile; every in-scope item and wave is terminal; every pending limitation remains visible; completion cannot be declared with an unclassified or invalidated row.
  - _Requirements: 4.7, 22.8–22.9, 26.1–26.12_

- [ ]* 6.4 Complete the grouped optional Wave 5 property, golden-fixture, and integration tests
  - **Property 11: Complete conditional evidence schema** — verify mandatory fields and conditional blocker/applicability fields for every result classification. **Validates:** Requirements 20.1–20.8, 26.5.
  - **Property 12: Severity monotonicity and deterministic ordering** — verify higher impact cannot reduce severity and ordering is stable with a deciding dimension/rationale. **Validates:** Requirements 15.6, 16.4, 17.7, 21.1–21.7, 26.7.
  - **Property 14: Wave closure and downstream invalidation** — verify entry/terminality guards and dependent-row invalidation after upstream changes. **Validates:** Requirements 22.1–22.9, 26.12.
  - **Property 15: Remediation handoff completeness** — verify exactly one complete handoff per defect/group and explicit separate-implementation authorization, including state/profile/access/language selectors. **Validates:** Requirements 11.6–11.7, 23.1–23.6, 23.8, 26.8.
  - **Property 16: Explicit exclusions and coverage gaps** — verify complete records, owner decisions for visible exclusions, and no disappearance from totals. **Validates:** Requirements 13.7, 24.1–24.8, 26.9.
  - **Property 17: Existing tools remain partial evidence** — verify exact mapping, residual uncovered rows, authority conflict handling, and prohibition on sample-based completeness. **Validates:** Requirements 25.1–25.7.
  - **Property 18: Completion proof reconciles all totals** — verify canonical set totals, classifications, waves, pending operations, and zero-unclassified invariants before completion. **Validates:** Requirements 26.1–26.12.
  - **Golden-fixture/end-to-end integration coverage:** exercise route groups, redirects, dynamic provenance, fragments/downloads/external links, source conflicts, denied authorization, missing credentials, partial output, invalidation/resume, copy/Hindi constraints, fork separation, and manifest closure with repository-safe fixtures only. **Validates:** Requirements 1–26.
  - **Prerequisites:** 6.1–6.3 and the corresponding grouped contracts. Generate at least 100 cases per property where applicable. The exact targeted Vitest `--run` command remains separately authorized under the legend; no browser, protected route, build, gate, network, database, hosted, or product mutation is authorized by this task.

- [ ] 6.5 Perform final artifact review and close Wave 5
  - Review generated manifests/proof and authored copy/handoffs for traceability, completeness, artifact placement, redaction, no-product-code scope, and Planner/Studio separation. Regenerate from canonical inputs only to fix audit-program defects; do not remediate product findings.
  - **Consolidates former task:** 6.14. **Prerequisites:** 6.1–6.3; optional 6.4 only if separately authorized.
  - **Validation:** Every wave exit criterion is satisfied; completion proof reconciles; all gaps, blocked/not-run rows, pending operations, owner decisions, and handoffs remain visible; changed-path manifest contains no product code. Do not run a build, full gate, browser suite, protected route, or product remediation unless the owner separately authorizes that exact operation and the hook permits it. Ensure all authorized tests pass; ask the user if questions arise.
  - _Requirements: 19.5, 22.6–22.9, 23.1–23.8, 26.1–26.12_

## Notes

- The 20 numbered items are consolidation boundaries, not deleted requirements. Former task coverage is named in each item; optional property, unit, golden-fixture, and integration work remains separately authorized.
- Tasks marked with `*` are optional automated-test tasks. Mixed tasks 4.2 and 5.3 contain optional test portions but retain mandatory checkpoint/output-ingestion work.
- Browser, protected-route, test, build, gate, hosted, analytics, external-network, local-service, and performance execution always requires separate exact current-session authorization plus hook permission. Runtime batches may close procedurally with complete `blocked`/`not-run` evidence; that does not mean runtime behavior passed.
- The audit program may produce remediation handoffs, copy/Hindi proposals, exclusions, gaps, manifests, and completion proof, but must not implement remediation or modify product code.
- Planner and Studio inventories, occurrences, findings, groups, likely source areas, artifacts, and handoffs remain separate even when symptoms match. Any upstream inventory/profile change increments the generation and invalidates dependent downstream work before closure.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1"] },
    { "id": 4, "tasks": ["2.2"] },
    { "id": 5, "tasks": ["2.3", "2.4"] },
    { "id": 6, "tasks": ["3.1"] },
    { "id": 7, "tasks": ["3.2", "3.3"] },
    { "id": 8, "tasks": ["4.1"] },
    { "id": 9, "tasks": ["4.2"] },
    { "id": 10, "tasks": ["5.1"] },
    { "id": 11, "tasks": ["5.2"] },
    { "id": 12, "tasks": ["5.3"] },
    { "id": 13, "tasks": ["6.1"] },
    { "id": 14, "tasks": ["6.2"] },
    { "id": 15, "tasks": ["6.3"] },
    { "id": 16, "tasks": ["6.4", "6.5"] }
  ]
}
```
