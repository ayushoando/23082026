# Implementation Plan: Site UI, Content, and Links Audit

## Overview

Implement and execute a read-only TypeScript audit program in six ordered waves (`Wave 0` through `Wave 5`). The program may add or modify only non-product audit tooling, generated evidence, and authored audit work products. It must not remediate findings, modify `site/**`, mutate databases or hosted systems, or cross the Planner/Studio fork boundary. Each implementation task builds toward occurrence-level evidence, remediation handoffs, and machine-checkable completion proof.

## Execution and Authorization Legend

- **Audit-tooling source:** `scripts/site-ui-content-links-audit/**` (non-product tooling only).
- **Automated tests:** `tests/site-ui-content-links-audit/**` (optional tasks only).
- **Generated evidence:** `results/site-ui-content-links-audit/<runId>/<purpose>/**`, always machine-generated and manifest-owned.
- **Authored audit work:** `agents-work/site-ui-content-links-audit/<report-type>/**`; never hand-write reports under `results/**`.
- **Prohibited writes:** `site/**`, databases, production filesystems, deployment configuration, Planner/Studio product trees, and any product content or remediation.
- **`[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]`:** do not execute the named test, browser, build, gate, protected-route, hosted, analytics, performance, local-service, or other protected operation until the repository owner authorizes that exact operation in the current session and the enabled hook permits it. Authorization for one operation does not authorize retries or adjacent operations.
- **Optional tasks:** Tasks marked with `*` are test tasks and may be skipped for a faster audit-program implementation. They must not be implemented or run unless selected; execution still requires separate exact authorization.
- **Static audit batches:** Source-only audit execution may proceed without asserting rendered or runtime behavior. Any runtime-dependent row must terminate as `blocked` or `not-run` with its exact pending operation when authorization is absent.

## Tasks

- [ ] 1. Wave 0 — Establish prerequisites, canonical inventory, schemas, profiles, and matrix
  - [x] 1.1 Create the non-product audit-program entry points and run configuration
    - Add TypeScript command modules under `scripts/site-ui-content-links-audit/**` for wave execution, configuration loading, stable run IDs, repository revision/configuration hashing, and approved artifact-path enforcement.
    - Reject writes under `site/**`, unpartitioned `results/`, root report files, databases, and production destinations; preserve Planner and Studio as separate ownership partitions.
    - **Prerequisites:** Completed requirements/design and existing `.config.kiro`; no runtime authorization required.
    - **Validation criteria:** A dry source-level configuration load deterministically selects only approved audit paths, records immutable run inputs, and fails closed before any prohibited write.
    - _Requirements: 4.7, 19.5, 22.1, 22.7, 23.6, 23.7_

  - [x] 1.2 Implement typed schemas and conditional runtime validation
    - Define versioned TypeScript schemas for provenance, source/tool registries, routes, dynamic instances, shells, specialized inventories, profiles, applicability, matrix rows, authorization, evidence, findings, copy/Hindi proposals, severity, duplicate groups, exclusions, gaps, handoffs, wave checkpoints, manifests, and completion proof.
    - Enforce mandatory fields plus conditional blockers for `blocked`/`not-run`, rationale for `not-applicable`, and authorization envelopes for runtime-observed claims.
    - **Prerequisites:** 1.1.
    - **Validation criteria:** Valid examples for every record type parse; incomplete conditional records are quarantined with stable diagnostics and cannot close a partition.
    - _Requirements: 3.6, 3.7, 4.1-4.6, 20.1-20.8, 22.9, 26.5_

  - [x] 1.3 Build source, existing-tool, and evidence adapters
    - Register source authority ranks and typed adapters for the App Router tree, repository data/read paths, static generation declarations, route contracts, internal links, sitemap/metadata sources, generated inventories, and every Existing Audit Tool used.
    - Record each tool's scope, inputs, outputs, profiles, omissions, authorization class, last observed state, residual work, and adapter schema without executing protected tools.
    - **Prerequisites:** 1.2.
    - **Validation criteria:** Every adapter emits validated candidate records with provenance; unsupported fields become explicit gaps, sampled output cannot close uncovered rows, and higher-authority conflicts remain traceable.
    - _Requirements: 1.6, 2.1, 2.4, 2.5, 25.1-25.7_

  - [x] 1.4 Implement canonical route, shell, and dynamic-instance discovery
    - Collect every static/dynamic page, route group ownership, redirect-only route, layout, template, visible provider, loading/error/not-found boundary, consent/offline shell, and other user-visible Shared Shell.
    - Resolve dynamic instances by provenance-preserving union across declarations, repository data, contracts, links, sitemap candidates, prior revisioned inventories, and separately supplied authorized runtime discoveries; never invent placeholder instances.
    - Normalize URLs deterministically, preserve conflicting claims, classify surface/status, and create explicit exclusions or unresolved-instance Coverage Gaps.
    - **Prerequisites:** 1.3.
    - **Validation criteria:** Every discovered candidate has exactly one canonical classification or explicit exclusion/gap/conflict; duplicate concrete URLs retain all sources and discovery times; Planner, Studio, admin, auth, offline, and Shared Shell records remain distinct.
    - _Requirements: 1.1-1.8, 2.1-2.6, 19.1-19.4, 24.1-24.7, 26.1_

  - [x] 1.5 Implement profile registries, applicability, and exact occurrence expansion
    - Define versioned viewport, browser/OS/assistive-technology, access, English/Hindi, consent, and performance profile registries before evaluation.
    - Implement applicability decisions for all State Variants and audit dimensions, then generate the exact state × viewport × browser × access × language product for each route/instance/shell without representative substitution.
    - Generate stable occurrence/finding IDs, input fingerprints, wave ownership, and explicit non-applicability rationales.
    - **Prerequisites:** 1.4.
    - **Validation criteria:** Matrix cardinality equals the declared Cartesian products; every applicable tuple occurs once; inapplicable dimensions remain recorded; profile changes invalidate only dependent rows.
    - _Requirements: 3.1-3.9, 7.1, 9.1-9.2, 17.3, 19.6-19.8, 22.8, 26.2_

  - [ ] 1.6 Implement artifact manifests, partitioning, resumability, and wave control
    - Write generated inventories/matrices as partitioned canonical data with small manifests and optional CSV review projections; include run/config/schema/tool/source hashes and supersession links.
    - Implement leases, heartbeats, terminal states, stale-lease recovery, one writer per partition, bounded concurrency, deterministic merges, inventory generations, dependency invalidation, redaction/quarantine, and review queues.
    - Enforce wave entry/exit criteria and prevent closure while owned items are nonterminal or invalidated.
    - **Prerequisites:** 1.2 and 1.5.
    - **Validation criteria:** Interrupted runs resume without duplicate identity; matching completed partitions are skipped; changed fingerprints invalidate dependent partitions; manifests reconcile authored versus generated artifacts without copying them.
    - _Requirements: 22.1, 22.7-22.9, 24.8, 26.9, 26.12_

  - [ ] 1.7 Write the property test for canonical inventory closure
    - **Property 1: Canonical inventory closure** — generate candidate sets and verify exactly one canonical/exclusion/gap/conflict-linked classification with no unclassified record.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution; do not run a build or gate as a substitute.
    - **Prerequisites:** 1.4.
    - **Validation criteria:** At least 100 generated cases pass and the test name includes `Feature: site-ui-content-links-audit, Property 1: Canonical inventory closure`.
    - **Validates:** Requirements 1.1-1.8, 2.1, 2.4, 2.6, 19.1-19.4, 26.1.

  - [ ] 1.8 Write the property test for dynamic-instance deduplication
    - **Property 2: Provenance-preserving dynamic-instance deduplication** — verify order independence, one normalized instance, full provenance union, and discovery-time retention.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 1.4.
    - **Validation criteria:** At least 100 generated multisets pass with the required feature/property test name.
    - **Validates:** Requirements 2.2, 2.3, 2.5.

  - [ ] 1.9 Write the property test for occurrence expansion and finding bijection
    - **Property 3: Exact occurrence expansion and finding bijection** — verify the unique applicability Cartesian product and one aggregate finding ID per row.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 1.5.
    - **Validation criteria:** At least 100 generated profiles pass; no tuple is sampled away or represented by another tuple.
    - **Validates:** Requirements 3.1-3.9, 5.8, 7.1-7.2, 7.7, 9.1-9.2, 9.7, 10.7, 12.8, 17.3, 19.6-19.8, 26.2-26.4.

  - [ ] 1.10 Write the property test for authorization-lane non-escalation
    - **Property 4: Authorization-lane non-escalation** — verify static evidence cannot satisfy runtime claims and missing/denied authorization never executes work.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 1.2 and 1.6.
    - **Validation criteria:** At least 100 generated authorization combinations pass; every denied/missing case records exact pending work and claim basis.
    - **Validates:** Requirements 4.1-4.6, 15.3, 15.7, 16.7, 17.8, 26.10.

  - [ ] 1.11 Write the property test for zero product-code mutation
    - **Property 5: Zero product-code mutation** — verify change manifests accept only approved audit tooling/artifact paths and reject `site/**` and other product boundaries.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 1.1 and 1.6.
    - **Validation criteria:** At least 100 generated path manifests pass, including Planner/Studio product-tree rejection cases.
    - **Validates:** Requirements 4.7, 23.6, 23.7.

  - [ ] 1.12 Execute and checkpoint the Wave 0 static batch
    - Run only the source-inspection entry point to produce generation-1 registries, canonical route/dynamic/shell inventories, applicability records, matrix partitions, and manifests.
    - Record adapter errors and inaccessible domains as gaps; do not execute tests, browsers, builds, gates, protected routes, local services, or hosted operations.
    - **Prerequisites:** 1.1-1.6; optional 1.7-1.11 only if separately authorized.
    - **Validation criteria:** 100% of discovered Wave 0 items have terminal classification, registries are frozen, matrix counts reconcile to applicability, and the Wave 0 manifest proves no product-code write. Ensure all authorized tests pass; ask the user if questions arise.
    - _Requirements: 1.8, 2.6, 3.6, 22.1, 22.7-22.9, 26.1-26.2_

- [ ] 2. Wave 1 — Audit shared foundations, route/link integrity, and global states
  - [ ] 2.1 Implement static inventories for shared shells, links, navigation, states, and journeys
    - Extract anchors, router actions, menu/breadcrumb models, downloads, fragments, external targets, headers/footers/dialogs/banners, global/local navigation, back/cancel/recovery actions, and foundational journey edges.
    - Compare normalized internal links with route/redirect evidence; retain external availability as an unresolved runtime claim while recording static ownership/protocol/opening/security attributes.
    - **Prerequisites:** Wave 0 closed (1.12).
    - **Validation criteria:** Every foundational inventory item maps to all applicable occurrences or an explicit rationale/gap; malformed, stale, circular, misleading, or journey-inconsistent targets produce occurrence-specific defects.
    - _Requirements: 5.1-5.8, 6.1-6.7, 7.1-7.7, 20.1-20.4_

  - [ ] 2.2 Implement auth, legal, consent, privacy, security, error, and offline foundation inventories
    - Inventory source-visible authentication/session/access messages, legal/policy references, consent controls/states, analytics declarations, security/privacy messages, loading/error/not-found/offline boundaries, logging paths, and recovery controls.
    - Keep source expectations distinct from runtime observations and enumerate exact pending runtime operations for consent delivery, auth transitions, offline/reconnect, and recovery behavior.
    - **Prerequisites:** 2.1.
    - **Validation criteria:** Every applicable Shared Shell and foundation occurrence receives static evidence or a terminal gap/not-run status; no legal conclusion or runtime claim is inferred from source.
    - _Requirements: 7.1-7.7, 16.1, 16.7, 17.1-17.3, 17.8, 18.1-18.7, 19.4, 26.10_

  - [ ] 2.3 Implement per-occurrence evidence ingestion and finding generation
    - Normalize dimension evidence into complete Evidence Records and require exactly one terminal aggregate Occurrence Finding per matrix row, including conforming rows.
    - Preserve expectation/observation/conclusion separation, source/runtime claim basis, requirement/journey/shell links, blockers, applicability rationale, likely owner, dependencies, and verification method.
    - **Prerequisites:** 1.2, 1.5, 2.1, and 2.2.
    - **Validation criteria:** Every Wave 1 row has exactly one schema-valid finding; every dimension record is traceable to inventory and occurrence IDs; blocked/not-run and not-applicable conditions carry mandatory details.
    - _Requirements: 3.7-3.9, 4.1-4.6, 7.7, 20.1-20.8, 26.3-26.5_

  - [ ] 2.4 Write the property test for inventory-to-occurrence traceability
    - **Property 6: Inventory-to-occurrence traceability** — verify all specialized items map to every applicable occurrence or an explicit rationale/gap/exclusion.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 2.1-2.3.
    - **Validation criteria:** At least 100 generated inventories pass with no silently orphaned dimension item.
    - **Validates:** Requirements 5.1-5.2, 7.1, 8.1, 10.1, 11.1, 12.1, 13.1, 14.1, 16.1, 17.1-17.2, 18.1.

  - [ ] 2.5 Write the property test for link normalization and defects
    - **Property 7: Link normalization and defect generation** — verify idempotence, route/redirect comparison, complete target fields, and occurrence-specific defect creation.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 2.1 and 2.3.
    - **Validation criteria:** At least 100 generated internal, fragment, download, external, malformed, and circular targets pass.
    - **Validates:** Requirements 5.3-5.7.

  - [ ] 2.6 Execute and checkpoint the Wave 1 static batch
    - Generate shell/link/message/state/error/offline inventories and per-occurrence static findings; list runtime-dependent checks as exact pending operations rather than executing them.
    - **Prerequisites:** 2.1-2.3; optional 2.4-2.5 only if separately authorized.
    - **Validation criteria:** Every Wave 1 item and matrix row is terminal as conforming, nonconforming, blocked, not-run, not-applicable, requires-owner-decision, or classified gap; manifests reconcile all outputs. Ensure all authorized tests pass; ask the user if questions arise.
    - _Requirements: 22.2, 22.7-22.9, 26.3-26.5, 26.10-26.12_

- [ ] 3. Wave 2 — Audit marketing, catalog/configurator, portal/dashboard, and primary journeys
  - [ ] 3.1 Implement surface-specific journey, form, asset, copy/IA, and metadata inventories
    - Traverse marketing, catalog/configurator, portal, and dashboard source graphs to inventory Primary Journeys, transitions, forms/transactions, user-visible assets/media, copy/IA, metadata/search/social/structured data, indexing policy, and perceived-performance expectations.
    - Preserve INR/product/business/legal facts, access/surface boundary contracts, state applicability, and route-instance identity.
    - **Prerequisites:** Wave 1 closed (2.6).
    - **Validation criteria:** Every scoped route/instance and specialized item maps to applicable occurrences; every journey terminates in an outcome or gap; every metadata-applicable instance has a source conclusion.
    - _Requirements: 6.1-6.7, 8.1-8.8, 12.1-12.8, 13.1-13.7, 14.1-14.8, 15.1, 15.3, 15.5, 22.3_

  - [ ] 3.2 Implement static dimension evaluators and proposal capture
    - Evaluate source-visible link/navigation, state/fallback, copy/IA, accessibility semantics, design-system usage, form contracts, assets, metadata, source performance risks, errors, analytics/consent, and security/privacy across all Wave 2 occurrences.
    - Capture replacement-ready English wording and accountable Hindi review notes for copy-related static defects without editing product content.
    - **Prerequisites:** 3.1 and 2.3.
    - **Validation criteria:** Each applicable dimension has per-occurrence evidence or an explicit runtime/gap status; no single route/profile result stands in for another; copy proposals preserve cited facts and approval state.
    - _Requirements: 5-18, 20.1-20.8, 26.6_

  - [ ] 3.3 Write the property test for journey terminality and boundary contracts
    - **Property 8: Journey graph terminality and boundary contracts** — verify every entry reaches a terminal outcome/gap and every access/surface crossing carries its complete contract.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 3.1.
    - **Validation criteria:** At least 100 generated journey graphs pass, including loops, dead ends, access transitions, and surface transitions.
    - **Validates:** Requirements 6.1-6.2, 6.4-6.7, 16.5.

  - [ ] 3.4 Write the property test for replacement-ready content completeness
    - **Property 9: Replacement-ready content completeness** — verify every relevant defect has final English content/structure, placement, intent, state, preserved facts, and a compliant Hindi Note.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 3.2.
    - **Validation criteria:** At least 100 generated content defects pass; unapproved machine Hindi can never satisfy approval evidence.
    - **Validates:** Requirements 8.3-8.8, 14.6, 18.6, 26.6.

  - [ ] 3.5 Write the property test for metadata route consistency
    - **Property 10: Metadata route consistency** — verify deterministic canonical/sitemap comparison, per-instance conclusions, and indexing rationale for specialized routes.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 3.1-3.2.
    - **Validation criteria:** At least 100 generated route/metadata datasets pass, including protected, transactional, offline, error-only, Planner, and Studio policies.
    - **Validates:** Requirements 14.2-14.8.

  - [ ] 3.6 Execute and checkpoint the Wave 2 static batch
    - Generate Wave 2 inventories, evidence, findings, initial copy/Hindi proposals, and exact pending runtime operations without remediating product code.
    - **Prerequisites:** 3.1-3.2; optional 3.3-3.5 only if separately authorized.
    - **Validation criteria:** All scoped journeys and occurrences are terminal or explicitly gapped; metadata conclusions cover all applicable route instances; generated manifests reconcile. Ensure all authorized tests pass; ask the user if questions arise.
    - _Requirements: 8.8, 14.8, 22.3, 22.7-22.9, 26.3-26.6, 26.10-26.12_

- [ ] 4. Wave 3 — Audit administration, Planner, Studio, protected contexts, and specialized states
  - [ ] 4.1 Implement administration and protected-context static inventory
    - Inventory administration, portal/dashboard protection, auth redirects, role/session contracts, development-bypass behavior, specialized states, forms, messages, journeys, and unavailable fixtures/credentials without accessing protected routes.
    - Preserve guest, customer, staff, administrator, expired-session, insufficient-role, and development-bypass occurrences separately.
    - **Prerequisites:** Wave 2 closed (3.6).
    - **Validation criteria:** Protected routes remain in the matrix even without credentials; public/guest/bypass evidence cannot close authenticated or role-specific occurrences; exact access prerequisites are recorded.
    - _Requirements: 4.2-4.6, 7.1-7.7, 12.1-12.8, 18.1-18.7, 19.1, 19.6-19.8_

  - [ ] 4.2 Implement the Planner-only static audit partition
    - Inventory `/ooplanner`, every discoverable project instance, Planner shells, canvas/editor actions, states, persistence expectations, links, forms, assets, copy, metadata/indexing, accessibility-equivalent outcomes, and likely Planner-owned source areas.
    - Never import, compare as shared implementation, or recommend ownership from Studio; write only Planner audit partitions.
    - **Prerequisites:** 4.1 and Wave 0 dynamic discovery.
    - **Validation criteria:** Every Planner item and occurrence is separately traceable, unavailable instances become gaps, and no emitted handoff/source hypothesis crosses into Studio ownership.
    - _Requirements: 10.6-10.8, 11.7, 19.2, 19.5-19.8, 23.3-23.7_

  - [ ] 4.3 Implement the Studio-only static audit partition
    - Inventory `/oostudio`, Studio shells, canvas/editor actions, states, links, forms, assets, copy, metadata/indexing, accessibility-equivalent outcomes, and likely Studio-owned source areas.
    - Never import, compare as shared implementation, or recommend ownership from Planner; write only Studio audit partitions.
    - **Prerequisites:** 4.1; independent of 4.2 except for shared schemas.
    - **Validation criteria:** Every Studio item and occurrence is separately traceable and no emitted handoff/source hypothesis crosses into Planner ownership.
    - _Requirements: 10.6-10.8, 11.7, 19.3, 19.5-19.8, 23.3-23.7_

  - [ ] 4.4 Reconcile specialized states and access-context evidence
    - Generate per-occurrence static findings for admin, Planner, Studio, protected access, offline/recovery, error, empty, stale, conflict, rate-limit, and other specialized states.
    - Record exact protected-route/browser operations and fixture/credential needs for every unresolved runtime claim without executing them.
    - **Prerequisites:** 4.1-4.3 and 2.3.
    - **Validation criteria:** All Wave 3 matrix rows have terminal static/gap/pending status, fork ownership is explicit, and bypass/guest evidence never substitutes for hosted protected evidence.
    - _Requirements: 3.4-3.9, 4.3-4.6, 7.1-7.7, 16.1-16.7, 19.5-19.8, 20.6-20.7_

  - [ ] 4.5 Write the property test for duplicate grouping and fork ownership
    - **Property 13: Duplicate grouping preserves occurrence identity and fork ownership** — verify grouping retains every finding/evidence record and cannot merge Planner and Studio implementation ownership.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 4.2-4.4 and the grouping contract from the schemas.
    - **Validation criteria:** At least 100 generated groups pass, including equivalent cross-fork symptoms that must remain separate.
    - **Validates:** Requirements 19.5, 21.3.

  - [ ] 4.6 Execute and checkpoint the Wave 3 static batch
    - Generate administration, Planner, Studio, access-context, and specialized-state partitions plus exact pending protected operations; perform no protected-route access.
    - **Prerequisites:** 4.1-4.4; optional 4.5 only if separately authorized.
    - **Validation criteria:** Every Wave 3 item is terminal, fork/access separation is proven by artifact partition and IDs, and manifests show no product-code writes. Ensure all authorized tests pass; ask the user if questions arise.
    - _Requirements: 19.1-19.8, 22.4, 22.7-22.9, 26.3-26.5, 26.10-26.12_

- [ ] 5. Wave 4 — Run authorization-gated runtime evidence batches
  - [ ] 5.1 Implement the protected-operation registry and authorization gate
    - Register each exact command/browser action, environment, occurrence selector, credential/fixture, profile, expected output, sensitivity control, authorization statement, hook decision, retry identity, and limitation before invocation.
    - Emit `not-run` or `blocked` records when exact current-session authorization or hook permission is absent; never weaken, retry, or rewrite denied work.
    - **Prerequisites:** Wave 3 closed (4.6); runtime profiles and performance budgets frozen.
    - **Validation criteria:** Runtime evidence is accepted only when authorization selects the same operation and occurrences; missing/denied cases remain unexecuted and complete all conditional evidence fields.
    - _Requirements: 4.1-4.6, 15.1-15.2, 15.7, 17.8, 22.5, 26.10_

  - [ ] 5.2 Run responsive and cross-browser occurrence batches
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Obtain authorization for each exact browser runner, browser/profile set, route batch, environment, and retry before execution.
    - Capture reflow, overflow, clipping, overlap, truncation, sticky/viewport/safe-area/orientation/zoom/input behavior and reachability of dialogs, menus, drawers, tables, canvases, toolbars, and forms for each selected occurrence.
    - **Prerequisites:** 5.1 and matching matrix partitions.
    - **Validation criteria:** Each authorized operation has complete Authorization Evidence and exact-profile results; unauthorized/unselected rows retain explicit `not-run` records and no browser inherits another browser's conclusion.
    - _Requirements: 9.1-9.7, 12.3, 22.5_

  - [ ] 5.3 Run accessibility and assistive-technology occurrence batches
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Obtain authorization for each exact automated accessibility command, keyboard/browser workflow, assistive-technology profile, route batch, and protected access context.
    - Capture WCAG 2.2 AA semantic, keyboard/focus, contrast/reflow, pointer/motion/timing, alternative/caption, instruction/error, autocomplete/language/status, and equivalent-outcome evidence independently for Planner and Studio.
    - **Prerequisites:** 5.1 and matching profiles/fixtures.
    - **Validation criteria:** Every runtime accessibility claim maps to an exact occurrence, WCAG criterion, profile, and authorization record; automated output never substitutes for required human/AT evidence.
    - _Requirements: 10.1-10.8, 19.5, 22.5_

  - [ ] 5.4 Run state, form, journey, protected-route, error, offline, and recovery batches
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Obtain authorization separately for each exact browser workflow, protected route/access identity, fixture, local service, destructive-action simulation, offline transition, and retry.
    - Capture pending/success/validation/failure behavior, input preservation, duplicate prevention, navigation, error/request/console/hydration/resource evidence, offline/reconnect behavior, and recovery results without mutating production or real user data.
    - **Prerequisites:** 5.1 and approved safe fixtures/credentials.
    - **Validation criteria:** Each executed step has redacted evidence and reproduction details; unavailable credentials/fixtures are `blocked`; no guest/bypass result closes another access context.
    - _Requirements: 6.3-6.6, 7.1-7.7, 12.2-12.8, 16.2-16.7, 19.4, 19.6-19.8_

  - [ ] 5.5 Run assets, analytics/consent, security/privacy, metadata/hosted, and external-link batches
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Obtain authorization for each exact hosted inspection, external network check, analytics inspection, consent workflow, asset-failure simulation, metadata fetch, protected identity, and retry.
    - Capture asset fallback/layout/render evidence, external destination behavior, runtime metadata/structured data, analytics delivery/suppression/uniqueness/payload minimization, consent persistence/withdrawal, and visible security/privacy messaging without persisting secrets or personal data.
    - **Prerequisites:** 5.1 and approved environment/data-sensitivity controls.
    - **Validation criteria:** Runtime observations are redacted and occurrence-scoped; absent authorization is listed exactly; static ownership or declarations are never reported as delivery, availability, legality, or runtime conformance.
    - _Requirements: 5.4-5.6, 13.2-13.7, 14.1-14.7, 17.3-17.8, 18.2-18.7_

  - [ ] 5.6 Run performance and perceived-performance batches
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Obtain authorization for each exact performance command/browser action, route/interaction batch, profile, cache state, fixture, run count, percentile, environment, and retry.
    - Capture LCP, INP, CLS, route duration, resource evidence, and perceived-performance behavior against frozen budgets; preserve raw measurements as generated evidence only.
    - **Prerequisites:** 5.1 and frozen performance registry/budgets.
    - **Validation criteria:** Every measurement records value, budget, profile, run count, percentile, authorization, and affected occurrence; unauthorized rows have no pass/fail measurement conclusion.
    - _Requirements: 15.1-15.7, 22.5_

  - [ ] 5.7 Write authorization-gate unit and adapter integration tests
    - Cover permit, deny, not-observed, stale authorization, selector mismatch, partial output, tool crash, redaction, and retry isolation using fixtures only.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command; these tests do not authorize any browser, protected route, hosted operation, or performance command.
    - **Prerequisites:** 5.1 and runtime adapters.
    - **Validation criteria:** All selected fixture cases pass without external services or product mutation, and each failure remains mapped to explicit rows/gaps.
    - _Requirements: 4.3-4.6, 20.6, 25.3-25.7_

  - [ ] 5.8 Ingest runtime outputs and checkpoint Wave 4
    - Normalize authorized outputs through adapters, preserve partial completion, and emit exact blocked/not-run findings for every unexecuted runtime row.
    - **Prerequisites:** 5.1; 5.2-5.6 only where each exact operation was separately authorized; optional 5.7 only if authorized.
    - **Validation criteria:** Every selected operation has Authorization Evidence plus result, or every affected row records exact missing authorization/prerequisite; all Wave 4 items are terminal and no runtime claim is sourced only from static evidence. Ensure all authorized tests pass; ask the user if questions arise.
    - _Requirements: 4.1-4.6, 20.1-20.8, 22.5, 22.7-22.9, 26.3-26.5, 26.10-26.12_

- [ ] 6. Wave 5 — Reconcile findings, proposals, handoffs, manifests, completion proof, and review
  - [ ] 6.1 Reconcile final occurrence findings, severity, and duplicate groups
    - Merge static and authorized runtime evidence by authority without losing conflicts; ensure one terminal finding per row and complete mandatory fields.
    - Assign severity from all documented dimensions, highest-supported deciding factor, rationale, and deterministic order; group supported root causes while retaining per-occurrence evidence and separate Planner/Studio groups.
    - **Prerequisites:** Waves 0-4 closed (1.12, 2.6, 3.6, 4.6, 5.8) and latest inventory generation propagated.
    - **Validation criteria:** Matrix/finding bijection holds; every defect has severity/rationale or `requires-owner-decision`; duplicate groups preserve every member and fork owner.
    - _Requirements: 20.1-20.8, 21.1-21.7, 26.3-26.5, 26.7_

  - [ ] 6.2 Finalize replacement-ready copy, IA, metadata, and Hindi review queues
    - Produce complete English wording/structure, placement, intent, state, preserved facts, and a Hindi Note for every copy-related defect; include only evidenced approved Hindi or named translation ownership and mandatory human review.
    - Keep proposals in authored audit work products and linked generated indices; do not edit product content.
    - **Prerequisites:** 6.1 and all copy-related evidence.
    - **Validation criteria:** Proposal count equals copy-related defect count; INR, product facts, legal meaning, and business intent are cited/preserved; approval gaps remain explicit queues.
    - _Requirements: 8.3-8.8, 14.6, 18.6-18.7, 26.6_

  - [ ] 6.3 Build implementation-ready remediation handoffs without remediation
    - Create one authored handoff per independent defect or supported duplicate group with IDs, occurrence selectors/counts, root-cause hypothesis, expected/proposed outcome, copy/Hindi content, ownership, likely source areas, dependencies, review/authorization/migration/asset needs, all applicable acceptance contexts, risk, rollout/rollback, and verification method.
    - State that all product-code changes are separate implementation work requiring new approval; never prescribe Planner/Studio cross-imports or database mutation.
    - **Prerequisites:** 6.1-6.2.
    - **Validation criteria:** Every defect/group links to exactly one complete handoff; every handoff is bounded, traceable, and contains no product edit or implied authorization.
    - _Requirements: 11.6-11.7, 23.1-23.8, 26.8_

  - [ ] 6.4 Reconcile exclusions, coverage gaps, conflicts, owner decisions, and pending operations
    - Complete every Exclusion Record and Coverage Gap, retain absent/legacy/local-only/unreachable items, require owner decisions for visible-scope exclusions, and list every pending protected operation with affected occurrences and exact authorization need.
    - **Prerequisites:** 6.1 and all wave manifests.
    - **Validation criteria:** Zero silent exclusions, zero unclassified inventory items/gaps, conflict authority is explicit, and pending-operation totals equal their canonical records.
    - _Requirements: 1.6-1.8, 2.4, 24.1-24.8, 25.5-25.7, 26.9-26.10_

  - [ ] 6.5 Generate final artifact manifests and machine-checkable completion proof
    - Compute canonical inventory/dynamic-source/matrix/finding/evidence/copy/severity/handoff/exclusion/gap/pending/result/wave totals, one-to-one/set-equality invariants, schema closure, authorization coverage, invalidation generation, and content-signed manifests.
    - Emit a changed-path manifest proving zero `site/**` or product-code mutation and distinguish authored handoffs from generated evidence.
    - **Prerequisites:** 6.1-6.4.
    - **Validation criteria:** All totals reconcile; every in-scope item and wave is terminal; completion prominently reports blocked/not-run/owner-decision totals rather than treating them as passes.
    - _Requirements: 4.7, 22.8-22.9, 26.1-26.12_

  - [ ] 6.6 Write the property test for complete conditional evidence schemas
    - **Property 11: Complete conditional evidence schema** — verify mandatory fields and conditional blocker/applicability fields for every result classification.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 2.3 and 6.1.
    - **Validation criteria:** At least 100 generated records pass/fail in accordance with the schema contract.
    - **Validates:** Requirements 20.1-20.8, 26.5.

  - [ ] 6.7 Write the property test for severity monotonicity and ordering
    - **Property 12: Severity monotonicity and deterministic ordering** — verify higher impact cannot reduce severity and ordering is stable with a deciding dimension/rationale.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 6.1.
    - **Validation criteria:** At least 100 generated finding sets pass.
    - **Validates:** Requirements 15.6, 16.4, 17.7, 21.1-21.7, 26.7.

  - [ ] 6.8 Write the property test for wave closure and downstream invalidation
    - **Property 14: Wave closure and downstream invalidation** — verify entry/terminality guards and dependent-row invalidation after upstream changes.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 1.6 and all wave controllers.
    - **Validation criteria:** At least 100 generated wave/invalidation scenarios pass.
    - **Validates:** Requirements 22.1-22.9, 26.12.

  - [ ] 6.9 Write the property test for remediation handoff completeness
    - **Property 15: Remediation handoff completeness** — verify exactly one complete handoff per defect/group and explicit separate-implementation authorization.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 6.3.
    - **Validation criteria:** At least 100 generated defects/groups pass, including state/profile/access/language acceptance selectors.
    - **Validates:** Requirements 11.6-11.7, 23.1-23.6, 23.8, 26.8.

  - [ ] 6.10 Write the property test for explicit exclusions and coverage gaps
    - **Property 16: Explicit exclusions and coverage gaps** — verify complete records, owner decisions for visible exclusions, and no disappearance from totals.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 6.4.
    - **Validation criteria:** At least 100 generated excluded/gapped item sets pass.
    - **Validates:** Requirements 13.7, 24.1-24.8, 26.9.

  - [ ] 6.11 Write the property test for partial existing-tool evidence
    - **Property 17: Existing tools remain partial evidence** — verify exact mapping, residual uncovered rows, authority conflict handling, and prohibition on sample-based completeness.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command; do not execute the adapted browser/test tools as part of this property test.
    - **Prerequisites:** 1.3 and 6.4.
    - **Validation criteria:** At least 100 generated tool outputs/scope declarations pass.
    - **Validates:** Requirements 25.1-25.7.

  - [ ] 6.12 Write the property test for completion-proof reconciliation
    - **Property 18: Completion proof reconciles all totals** — verify all canonical set totals, classifications, waves, pending operations, and zero-unclassified invariants before completion.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command before execution.
    - **Prerequisites:** 6.5.
    - **Validation criteria:** At least 100 generated complete/incomplete runs pass; any mismatch prevents a complete declaration.
    - **Validates:** Requirements 26.1-26.12.

  - [ ] 6.13 Write golden-fixture and end-to-end audit-program integration tests
    - Cover route groups, redirects, dynamic provenance, fragments/downloads/external links, source conflicts, denied authorization, missing credentials, partial output, invalidation/resume, copy/Hindi constraints, fork separation, and manifest closure using repository-safe fixtures.
    - **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** Authorize the exact targeted Vitest `--run` command; no browser, protected route, build, or gate is authorized by this task.
    - **Prerequisites:** 6.1-6.5.
    - **Validation criteria:** The selected fixture run produces deterministic manifests and completion proof without `site/**`, network, database, or hosted mutation.
    - _Requirements: 1-26_

  - [ ] 6.14 Perform final artifact review and close Wave 5
    - Review generated manifests/proof and authored copy/handoffs for traceability, completeness, artifact placement, redaction, no-product-code scope, and Planner/Studio separation; regenerate from canonical inputs to fix audit-program defects only.
    - Do not run a build, full gate, browser suite, protected route, or product remediation. **[SEPARATE EXPLICIT AUTHORIZATION REQUIRED]** if the owner requests any such operation during review.
    - **Prerequisites:** 6.1-6.5; optional 6.6-6.13 only if separately authorized.
    - **Validation criteria:** Every wave exit criterion is satisfied; completion proof reconciles; all gaps/pending operations remain visible; handoffs cover every defect/group; changed-path manifest contains no product code. Ensure all authorized tests pass; ask the user if questions arise.
    - _Requirements: 19.5, 22.6-22.9, 23.1-23.8, 26.1-26.12_

## Notes

- Tasks marked with `*` are optional automated-test tasks. They are never implicitly authorized by implementing the adjacent audit code.
- Browser, protected-route, test, build, gate, hosted, analytics, external-network, local-service, and performance execution always requires separate exact current-session authorization plus hook permission.
- Runtime batches may close procedurally with complete `blocked`/`not-run` evidence; this does not mean runtime behavior passed.
- The audit program may produce remediation handoffs but must not implement any remediation or modify product code.
- Planner and Studio inventories, occurrences, findings, groups, likely source areas, artifacts, and handoffs remain separate even when symptoms match.
- Any upstream inventory/profile change increments the generation and invalidates dependent downstream work before closure.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1"]
    },
    {
      "id": 1,
      "tasks": ["1.2"]
    },
    {
      "id": 2,
      "tasks": ["1.3"]
    },
    {
      "id": 3,
      "tasks": ["1.4"]
    },
    {
      "id": 4,
      "tasks": ["1.5"]
    },
    {
      "id": 5,
      "tasks": ["1.6", "1.7", "1.8"]
    },
    {
      "id": 6,
      "tasks": ["1.9", "1.10", "1.11"]
    },
    {
      "id": 7,
      "tasks": ["1.12"]
    },
    {
      "id": 8,
      "tasks": ["2.1"]
    },
    {
      "id": 9,
      "tasks": ["2.2"]
    },
    {
      "id": 10,
      "tasks": ["2.3"]
    },
    {
      "id": 11,
      "tasks": ["2.4", "2.5"]
    },
    {
      "id": 12,
      "tasks": ["2.6"]
    },
    {
      "id": 13,
      "tasks": ["3.1"]
    },
    {
      "id": 14,
      "tasks": ["3.2"]
    },
    {
      "id": 15,
      "tasks": ["3.3", "3.4", "3.5"]
    },
    {
      "id": 16,
      "tasks": ["3.6"]
    },
    {
      "id": 17,
      "tasks": ["4.1"]
    },
    {
      "id": 18,
      "tasks": ["4.2", "4.3"]
    },
    {
      "id": 19,
      "tasks": ["4.4"]
    },
    {
      "id": 20,
      "tasks": ["4.5"]
    },
    {
      "id": 21,
      "tasks": ["4.6"]
    },
    {
      "id": 22,
      "tasks": ["5.1"]
    },
    {
      "id": 23,
      "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7"]
    },
    {
      "id": 24,
      "tasks": ["5.8"]
    },
    {
      "id": 25,
      "tasks": ["6.1"]
    },
    {
      "id": 26,
      "tasks": ["6.2", "6.4", "6.6", "6.7", "6.8"]
    },
    {
      "id": 27,
      "tasks": ["6.3", "6.10", "6.11"]
    },
    {
      "id": 28,
      "tasks": ["6.5", "6.9"]
    },
    {
      "id": 29,
      "tasks": ["6.12", "6.13"]
    },
    {
      "id": 30,
      "tasks": ["6.14"]
    }
  ]
}
```
