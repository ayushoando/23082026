# Implementation Plan: Planner Comprehensive Audit

## Overview

Implement the audit as an evidence-driven TypeScript workstream. Begin with live route/source inventory, end-to-end workflow traces, and a normalized evidence matrix; use those records to drive the smallest sound Planner-owned remediations. Repository edits, protected validation, and hosted operations remain separate lanes: implementation tasks may author code, tests, migrations, and pending-action manifests, but protected commands and hosted actions execute only under separate exact authorization and hook permission.

## Tasks

- [ ] 1. Build the live audit inventory and evidence model
  - [x] 1.1 Implement typed coverage, workflow-trace, evidence, validation, and finding models plus deterministic validators in the approved audit workstream
    - Represent routes, APIs, Planner-owned and reachable shared sources, FOCSS, tests, viewport/input/state/security/persistence coverage, evidence classes, lifecycle states, and requirement links.
    - Keep generated machine evidence under a purpose-specific `results/planner-comprehensive-audit/**` path and authored audit records in the repository-approved plan-owned workstream; do not place reports in `site/`.
    - _Requirements: 1.1, 1.2, 1.4, 1.6, 18.1, 19.1, 19.3, 19.4_
  - [x] 1.2 Implement the live coverage collector and produce the initial inventory
    - Discover `site/app/ooplanner/**`, `site/app/api/Planner/**`, all Planner feature/component/lib/hook/store/server/platform/FOCSS roots, reachable shared support, and relevant tests/configuration without freezing the design baseline as a file list.
    - Assign `wired`, `present-but-unverified`, `demo/local-only`, `generated`, `legacy`, `unwired/absent`, or `unreachable` with source evidence and identify route/import documentation conflicts in favor of live source.
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  - [x] 1.3 Implement complete workflow tracing and generate the first evidence matrix
    - Trace entry/auth, list, create, load, edit, save, delete, catalog browse/select/upload where reachable, handoff, sketch-to-plan, offline/reconnect, conflict recovery, and unsaved destructive navigation from route entry through UI/state/API/persistence to user-visible outcome.
    - Link every trace to applicable viewport classes, input methods, required states, security controls, persistence modes, requirements, findings, and verification methods; reject orphan inventory rows and incomplete traces.
    - _Requirements: 1.3, 1.6, 5.1, 6.1, 7.1, 10.1-10.5, 19.3_
  - [-] 1.4 Implement the finding registry and monotonic lifecycle enforcement
    - Create exactly one compliant or defect finding per audited area, require adjacent-impact expansion before closure, and enforce terminal classifications and evidence/pending/blocker fields.
    - Preserve unrelated paths in remediation records and map each finding to the narrowest applicable verification.
    - _Requirements: 2.1, 2.3-2.6, 18.1, 19.1, 19.2, 19.7, 19.8_
  - [~] 1.5 Write property-based test for coverage closure
    - **Property 1: Coverage closure**
    - Generate route/import trees and verify unique inventory inclusion, evidence-backed status, and a complete user-visible workflow link.
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  - [~] 1.6 Write property-based test for finding traceability and impact closure
    - **Property 2: Finding traceability and impact closure**
    - Generate audited areas and adjacent impacts and verify one finding contains every route, workflow, source, requirement, and verification link.
    - **Validates: Requirements 1.6, 2.3, 19.1, 19.3**
  - [~] 1.7 Write property-based test for evidence-gated finding transitions
    - **Property 3: Evidence-gated finding transitions**
    - Generate lifecycle transitions and path sets and reject terminal states without observed evidence, exact pending authorization, or blocker evidence.
    - **Validates: Requirements 2.5, 2.6, 19.2, 19.7, 19.8**

- [ ] 2. Audit and remediate fork and geometry integrity
  - [~] 2.1 Audit every inventoried Planner/Studio dependency and remediate all fork-boundary violations
    - Remove Planner-to-Studio, Studio-to-Planner, and cross-zone FOCSS imports; create independent Planner-owned equivalents where needed and extend findings to all affected workflows.
    - Preserve Planner API casing and approved shared-infrastructure boundaries.
    - _Requirements: 2.1, 2.3, 3.1, 3.2, 3.6_
  - [~] 2.2 Audit and remediate Planner scale use across geometry behavior
    - Consolidate Planner-local `0.05 px/mm` use across creation, placement, snapping, measurement, selection transforms, resize, rotate, export, and display without importing Studio geometry helpers.
    - Correct every evidenced `0.2 px/mm`, implicit-scale, or inconsistent-unit path.
    - _Requirements: 2.1, 3.3, 3.4_
  - [~] 2.3 Remediate serialization and deserialization scale integrity
    - Normalize persisted physical units and validated scale metadata, adapt known legacy snapshots deterministically, and return an explicit unsupported-scale/version result rather than silently applying Studio scale.
    - Preserve dimensions, placement, rotation, and source records through round trips.
    - _Requirements: 3.3, 3.5, 4.3, 13.7, 13.8_
  - [~] 2.4 Write property-based test for Planner scale conversion
    - **Property 4: Planner scale conversion**
    - Generate finite representable millimetre values and verify `mm × 0.05` and inverse conversion within stored precision.
    - **Validates: Requirements 3.3, 3.4**
  - [~] 2.5 Write property-based test for geometry persistence round trip
    - **Property 5: Geometry persistence round trip**
    - Generate valid geometry and verify serialize-save-load-deserialize preserves physical state and never applies `0.2 px/mm` or lossy conversion.
    - **Validates: Requirements 3.5, 4.3, 13.8**

- [ ] 3. Remediate core workflows and complete user-visible states
  - [~] 3.1 Remediate `/ooplanner` and project-route entry, list, and routing behavior
    - Produce deterministic guest/authenticated entry states, project-list loading/empty/error states, reachable next actions, and thin App Router entries with business logic in Planner-owned modules.
    - _Requirements: 2.1, 4.1, 5.1-5.3, 10.1-10.3_
  - [~] 3.2 Remediate create, load, edit, save, and delete workflows
    - Initialize valid defaults, restore all view-independent content, save one coherent revision, require delete confirmation, and return deterministic post-delete state.
    - Fix every verified dead end, stale selection, incorrect metadata, or data-loss path discovered by the traces.
    - _Requirements: 2.1, 4.2-4.5, 13.1, 13.2, 13.6_
  - [~] 3.3 Implement typed required-state mappings for every covered workflow
    - Distinguish default, loading, empty, success, validation, server, unauthenticated, forbidden, rate-limited, conflict, stale, offline, and recovery states where applicable.
    - Give each state an accessible status, focus target, memory-preservation rule, and deterministic next/recovery action; clear obsolete errors after successful retry.
    - _Requirements: 4.8, 5.1-5.8_
  - [~] 3.4 Remediate failure-safe editing, unsaved navigation, offline, conflict, and reauthentication behavior
    - Retain the last valid in-memory document after failed edits/requests, gate destructive replacement behind explicit decisions, and never silently overwrite newer persisted data.
    - _Requirements: 4.6-4.8, 5.6-5.8, 10.8_
  - [~] 3.5 Write property-based test for valid project initialization
    - **Property 6: Valid project initialization**
    - Generate valid owners and creation inputs and verify editable defaults, schema version, revision 1, coherent timestamps, and valid geometry.
    - **Validates: Requirements 4.2, 13.1, 13.2**
  - [~] 3.6 Write property-based test for failure-safe UI state
    - **Property 7: Failure-safe UI state**
    - Generate failed edit/save/offline/reauth/stale transitions and verify unsaved state survives, replacement is explicit, and later success clears obsolete errors.
    - **Validates: Requirements 4.6, 4.8, 5.6, 5.7, 5.8, 10.8**
  - [~] 3.7 Write property-based test for required state completeness
    - **Property 8: Required state completeness**
    - Generate workflow/state applicability sets and verify distinct presentation, status, focus, and deterministic recovery mappings.
    - **Validates: Requirements 5.1, 5.5**
  - [~] 3.8 Write property-based test for form value preservation
    - **Property 9: Form value preservation**
    - Generate mixed valid/invalid project and handoff forms and verify all invalid fields are associated while valid values remain unchanged and no submission occurs.
    - **Validates: Requirements 5.4, 8.5, 15.3, 15.4**

- [ ] 4. Remediate responsive behavior and input parity
  - [~] 4.1 Implement and remediate desktop, tablet, and phone layout parity
    - Preserve document, unsaved state, active tool/workflow, and meaningful selection across resize/orientation changes.
    - Keep commands reachable without page-level horizontal scrolling; use reversible panels, dismissible tablet overlays, non-overlapping desktop regions, and visual-viewport-aware modal scrolling.
    - _Requirements: 2.2, 6.1-6.7_
  - [~] 4.2 Route every state-changing canvas action through Planner semantic commands
    - Make select, move, rotate, resize, duplicate, delete, zoom, and pan invoke common Planner-owned command logic from pointer, touch, keyboard, and visible accessible controls.
    - Provide explicit alternatives for multi-pointer gestures.
    - _Requirements: 7.1-7.4, 7.7_
  - [~] 4.3 Remediate touch scope, keyboard traversal, menus, panels, and dialogs
    - Restrict `touch-action` suppression to active gesture regions, provide logical visible focus, move focus into opened surfaces, trap only modal focus, and restore the invoker on close.
    - _Requirements: 7.4-7.6, 8.1, 8.2_
  - [~] 4.4 Write property-based test for responsive context preservation
    - **Property 10: Responsive context preservation**
    - Generate supported viewport/orientation transitions and verify equivalent content, unsaved state, active context, and reachable commands.
    - **Validates: Requirements 6.1, 6.2, 6.6**
  - [~] 4.5 Write property-based test for input-command parity
    - **Property 11: Input-command parity**
    - Generate state-changing actions and bindings and verify pointer, touch, keyboard, and accessible controls invoke the same semantic command with equivalent state.
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.7**

- [ ] 5. Remediate WCAG 2.2 AA and Planner FOCSS defects
  - [~] 5.1 Remediate semantic and assistive-technology behavior
    - Add correct names, roles, values, states, relationships, alternatives, field instructions/errors, live-region behavior, canvas-accessible command/list representations, and timeout recovery.
    - Correct every verified keyboard, focus-order, focus-obscuring, or target-size defect.
    - _Requirements: 2.1, 2.2, 8.1, 8.2, 8.4, 8.5, 8.8_
  - [~] 5.2 Remediate Planner visual states through Planner-local FOCSS and Phosphor abstractions
    - Correct semantic tokens, contrast, spacing, typography, elevation, borders, radii, icon/label/status alignment, and disabled/selected/hover/focus/pressed/invalid/busy states.
    - Add a Planner-zone pattern only when no existing pattern fits; never import Studio FOCSS, use raw visual values where a semantic token exists, or introduce inline/Lucide icons.
    - _Requirements: 2.2, 8.3, 9.1-9.4, 9.6, 9.7_
  - [~] 5.3 Remediate overflow, 200% reflow, reduced motion, and viewport accessibility
    - Preserve full values via wrapping, expansion, or accessible disclosure; preserve all chrome operations at 200% zoom except bounded canvas panning; suppress non-essential motion without hiding feedback.
    - _Requirements: 8.6, 8.7, 9.5_
  - [~] 5.4 Write property-based test for accessible control completeness
    - **Property 12: Accessible control completeness**
    - Generate interactive controls and declared states and verify semantic metadata and distinguishable semantic/visual mappings.
    - **Validates: Requirements 8.2, 9.6**
  - [~] 5.5 Write property-based test for accessible overflow disclosure
    - **Property 13: Accessible overflow disclosure**
    - Generate values and constrained regions and verify the complete value remains available through wrapping, expansion, or accessible disclosure.
    - **Validates: Requirements 9.5**

- [ ] 6. Remediate Planner API contracts, authorization, and security
  - [~] 6.1 Implement explicit typed endpoint descriptors and compatible client adapters
    - Cover methods, path/query/header/body schemas, success/error envelopes, statuses, auth/owner policy, CSRF/origin policy, and rate limits for catalog, upload, handoff, projects, project item, and sketch-to-plan endpoints found in inventory.
    - Use versioned adapters/dual-read parsing during transition and converge handlers and clients within each finding.
    - _Requirements: 11.1, 11.7, 15.1_
  - [~] 6.2 Enforce request-processing order before persistence
    - Apply correlation, quota, validation, origin/CSRF, verified session, owner scope, revision/idempotency, and persistence in the designed order; return structured failures and `405`/`Allow` where applicable.
    - Prove invalid requests cannot invoke a persistence adapter.
    - _Requirements: 11.2-11.7_
  - [~] 6.3 Remediate server-derived owner scope and session-expiry handling
    - Derive identity only from the verified server session, list only owned records, use one documented non-disclosing item policy, reject/ignore client owner identifiers, and retain unsaved UI state on expiry.
    - _Requirements: 10.3-10.8, 11.5_
  - [~] 6.4 Remediate safe structured errors and correlation responses
    - Return stable codes and correlation identifiers while excluding secrets, credentials, stack traces, tokens, request bodies, project content, and cross-owner data.
    - _Requirements: 11.8, 11.9, 17.3_
  - [~] 6.5 Write property-based test for server-derived owner scope
    - **Property 14: Server-derived owner scope**
    - Generate mixed-owner records and arbitrary client owner identifiers and verify server-session scope controls all list/item outcomes without disclosure or mutation.
    - **Validates: Requirements 10.3, 10.4, 10.5, 10.6, 10.7**
  - [~] 6.6 Write property-based test for endpoint contract completeness
    - **Property 15: Endpoint contract completeness**
    - Generate/inspect endpoint descriptors and verify every endpoint defines all method, schema, status, auth, authorization, CSRF/origin, and rate-limit fields.
    - **Validates: Requirements 11.1**
  - [~] 6.7 Write property-based test for security checks preceding persistence
    - **Property 16: Security checks precede persistence**
    - Generate invalid methods, inputs, origins, CSRF tokens, sessions, owner scopes, and quota states and verify the structured response and zero persistence calls.
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6, 11.7**
  - [~] 6.8 Write property-based test for safe structured errors
    - **Property 17: Safe structured errors**
    - Generate internal exceptions and sensitive payload fragments and verify stable safe errors, correlation ids, and prohibited-data exclusion.
    - **Validates: Requirements 11.8, 11.9**

- [ ] 7. Remediate mode-aware persistence and data integrity
  - [~] 7.1 Enforce exclusive persistence selection at the operation facade
    - Select disk only for non-production `DEV_AUTH_BYPASS=1`, Admin `oando_plans` otherwise and always in production; reject ambiguous configuration and never fallback-write after adapter failure.
    - Keep production filesystem writes behind approved guards and pass owner/correlation context through one selected adapter.
    - _Requirements: 12.1-12.8, 17.4_
  - [~] 7.2 Normalize the project envelope and repository adapters
    - Validate identity, server-derived owner, schema version, metadata, geometry, allowed response fields, and coherent timestamps at the persistence boundary; adapt legacy payload forms there rather than in UI code.
    - _Requirements: 13.1, 13.2, 13.5, 13.8_
  - [~] 7.3 Implement atomic revision compare-and-swap behavior
    - Require `expectedRevision`, increment once on success, preserve `createdAt`, update `updatedAt`, and return safe conflict metadata without changing a newer record.
    - _Requirements: 4.4, 5.8, 13.2, 13.4_
  - [~] 7.4 Implement owner-scoped idempotent create/save/delete behavior
    - Scope opaque bounded keys by owner/operation/project, store a request fingerprint and result, replay identical outcomes once, and conflict on different-fingerprint reuse.
    - Use atomic disk sidecar/write-rename behavior and transaction-safe Supabase behavior supported by repository evidence.
    - _Requirements: 13.3_
  - [~] 7.5 Implement schema compatibility and deterministic deletion semantics
    - Validate current versions, purely migrate known older versions in memory, preserve unsupported source records, and exclude successfully deleted records from subsequent owner list/load results.
    - _Requirements: 4.5, 13.6, 13.7, 14.6_
  - [~] 7.6 Write property-based test for exclusive persistence selection
    - **Property 18: Exclusive persistence selection**
    - Generate runtime configurations, operations, and adapter failures and verify exactly one approved adapter or no adapter for invalid configuration, with no fallback write.
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8**
  - [~] 7.7 Write property-based test for revision compare-and-swap
    - **Property 19: Revision compare-and-swap**
    - Generate current/expected revisions and valid saves and verify atomic single increments, timestamp rules, and unchanged records after stale requests.
    - **Validates: Requirements 4.4, 13.2, 13.4**
  - [~] 7.8 Write property-based test for idempotent mutation
    - **Property 20: Idempotent mutation**
    - Generate owner-scoped retries and fingerprints and verify exactly one create/save/delete effect or conflict on mismatched reuse.
    - **Validates: Requirements 13.3**
  - [~] 7.9 Write property-based test for delete unavailability
    - **Property 21: Delete unavailability**
    - Generate owned records and confirmed deletions and verify subsequent list/load exclusion and deterministic UI result.
    - **Validates: Requirements 4.5, 13.6**
  - [~] 7.10 Write property-based test for schema compatibility safety
    - **Property 22: Schema compatibility safety**
    - Generate current, known-old, and unsupported versions and verify validation/migration or unchanged source with explicit unsupported result.
    - **Validates: Requirements 13.1, 13.7, 14.6**

- [ ] 8. Add an Admin migration only if repository evidence requires it
  - [~] 8.1 Implement the schema-gap decision record from live Admin migration, type, and adapter evidence
    - Determine whether revision, schema version, idempotency, constraints, RLS, grants, or indexes already satisfy the contract; bind the decision and exact evidence to findings.
    - Do not inspect hosted schema or claim remote state in this repository-edit lane.
    - _Requirements: 14.1, 14.2, 14.6, 14.10, 19.4_
  - [~] 8.2 If and only if task 8.1 verifies a schema defect, create the reversible Admin migration and repository-side contract changes
    - Write under `site/platform/supabase/migrations.admin/`, target `oando_plans`/owner-scoped idempotency only, preserve/transform existing rows deterministically, and include dependency-safe `-- rollback`, least-privilege grants, indexes/constraints, and authenticated owner RLS.
    - Keep application-level owner checks and server-only service-role boundaries; do not touch Products migrations or apply the migration.
    - _Requirements: 14.1-14.6_
  - [~] 8.3 Add static/integration tests for any created migration and record its pending generated-type workflow
    - Verify SQL placement, forward/rollback structure, deterministic transformation, policies, grants, and compatibility expectations in code; record `pnpm run db:apply:admin -- --dry` before application and `pnpm run db:types:admin` after authorized application without claiming either ran.
    - _Requirements: 14.3-14.10, 18.4, 18.5, 19.5, 19.6_

- [ ] 9. Remediate guest catalog and lead handoff boundaries
  - [~] 9.1 Remediate guest catalog browsing, selection continuity, and response minimization
    - Expose only approved public furniture/product fields, preserve guest selection through guest-accessible planning context, and prevent project/owner data or project-operation capability from crossing the boundary.
    - _Requirements: 10.1, 10.3, 15.1, 15.2, 15.7_
  - [~] 9.2 Remediate lead handoff validation, draft recovery, and stable confirmation
    - Validate contact, consent, and inquiry fields; preserve valid draft values on validation/server failure; provide retry and a stable non-secret handoff reference on success without granting project access.
    - _Requirements: 10.2, 15.3-15.7_
  - [~] 9.3 Write property-based test for guest boundary integrity
    - **Property 23: Guest boundary integrity**
    - Generate guest catalog selections and handoff outcomes and verify public context/drafts/confirmation survive while restricted data and project capability never appear.
    - **Validates: Requirements 10.1, 10.2, 15.1, 15.2, 15.5, 15.6, 15.7**

- [ ] 10. Implement privacy-safe Planner observability
  - [~] 10.1 Instrument API and persistence operations with bounded Planner metrics and structured events
    - Reuse the existing observability registry for request/error counts, duration, rate limits, authorization denials, and persistence failures with bounded operation/method/result/status/persistence-mode labels.
    - Propagate one opaque correlation id through response, API, persistence, and client-visible server errors.
    - _Requirements: 17.1-17.4_
  - [~] 10.2 Implement redaction and exporter-failure isolation
    - Exclude contact data, owner/project identifiers and content, geometry, bodies, tokens, cookies, credentials, secrets, free-form errors, and identifier-bearing URLs from logs/labels.
    - Make export failure preserve the user and persistence result while sending the same redacted event to the approved fallback sink.
    - _Requirements: 17.5-17.7_
  - [~] 10.3 Write property-based test for correlation and privacy preservation
    - **Property 24: Correlation and privacy preservation**
    - Generate operations and prohibited values and verify one correlation id propagates unchanged while all sensitive/high-cardinality values are absent.
    - **Validates: Requirements 17.1, 17.3, 17.4, 17.5**
  - [~] 10.4 Write property-based test for observability failure isolation
    - **Property 25: Observability failure isolation**
    - Generate exporter failures and operation outcomes and verify user/persistence results remain unchanged and the redacted fallback event is emitted.
    - **Validates: Requirements 17.6**

- [ ] 11. Implement performance evidence and remediate measured bottlenecks
  - [~] 11.1 Add deterministic representative-project fixtures and supported-profile measurement code
    - Cover room boundary, at least ten furniture objects, rotation, dimensions, labels, metadata, route LCP/CLS, non-canvas INP, canvas FPS, direct feedback, API latency, and 20-cycle listener/subscription cleanup.
    - Record viewport/orientation/input/browser/device/CPU/network fixture, warm/cold status, sample count, method, and evidence class without claiming unexecuted browser or integration results.
    - _Requirements: 16.1-16.7, 18.1, 19.4_
  - [~] 11.2 Remediate every evidenced performance-budget or cleanup defect and capture comparable before/after definitions
    - Make the smallest local change for each measured bottleneck, preserve behavior, and bind measured value, profile, bottleneck evidence, remediation, and exact pending/observed verification to its finding.
    - Defect remediation is required; if no authorized measurement exists, retain the candidate as validation-pending rather than asserting compliance.
    - _Requirements: 2.1, 2.6, 16.1-16.8_
  - [~] 11.3 Write property-based test for performance finding completeness
    - **Property 26: Performance finding completeness**
    - Generate missed-budget findings and verify measured value, complete supported profile, bottleneck evidence, and remediation status are mandatory.
    - **Validates: Requirements 16.8**
  - [ ]* 11.4 Expand automated browser/device profiles beyond the required representative profiles
    - Add non-duplicative cross-browser/device cases only after required profiles and remediations are covered; do not make these extra profiles a prerequisite for closing already proven findings.
    - _Requirements: 6.1, 7.1, 8.1, 16.1-16.7_

- [ ] 12. Add targeted regression tests and authorization-aware evidence planning
  - [~] 12.1 Add targeted unit and integration regression tests for every remediated finding
    - Cover geometry, commands, state transitions, API middleware order, owner scope, adapters, revision/idempotency/schema behavior, guest handoff, observability, migration transformations when present, and all defect-specific edge cases.
    - Tag/link tests to finding ids, source paths, requirements, and evidence class.
    - _Requirements: 2.6, 18.1, 18.5, 19.1-19.4_
  - [~] 12.2 Add targeted browser specifications for rendered behavior that static tests cannot prove
    - Cover representative desktop/tablet/phone layouts, resize/orientation context, touch/keyboard parity, focus movement/restoration, dialogs, 200% reflow, reduced motion, contrast/visual states, offline/conflict recovery, accessibility, and required performance profiles.
    - Author tests only; execution remains protected validation.
    - _Requirements: 5.1-5.8, 6.1-6.7, 7.1-7.7, 8.1-8.8, 9.2-9.6, 16.1-16.7, 18.5_
  - [~] 12.3 Implement the change-derived validation manifest and evidence recorder
    - Derive the narrowest applicable exact repository-root commands from changed paths/findings, including fork, FOCSS, UI lint/token, typecheck, targeted Vitest/Playwright/accessibility/performance, migration dry-run/types, and full gate only when applicable.
    - Exclude `typecheck:scripts`; store authorization, hook decision, exit status, output limitation, evidence class, and unverified behavior, and leave every unexecuted command without pass/fail.
    - _Requirements: 18.1-18.9, 19.4-19.6_
  - [~] 12.4 Write property-based test for authorization-gated validation
    - **Property 27: Authorization-gated validation**
    - Generate protected/hosted actions and authorization/hook states and verify execution eligibility only when both permissions exist, otherwise exact pending action and no result claim.
    - **Validates: Requirements 14.10, 18.2, 18.3, 18.4, 18.9, 19.5, 19.6**
  - [~] 12.5 Write property-based test for change-derived validation planning
    - **Property 28: Change-derived validation plan**
    - Generate finding categories and changed paths and verify all narrow triggered checks, fork/FOCSS/type rules, and exclusion of `typecheck:scripts`.
    - **Validates: Requirements 18.1, 18.5, 18.6, 18.7, 18.8**
  - [~] 12.6 Write property-based test for evidence-class separation
    - **Property 29: Evidence-class separation**
    - Generate evidence records and verify exactly one repository/browser/integration/hosted/deployment class with no promotion from static evidence.
    - **Validates: Requirements 17.7, 19.4**

- [ ] 13. Reconcile all findings and produce the final implementation record
  - [~] 13.1 Re-run static inventory/trace reconciliation and remediate every remaining verified repository defect
    - Expand findings for newly affected adjacent workflows, apply the smallest owned fixes, and leave no verified defect merely optional; record exact blocker evidence and owner decision only when authorized scope truly prevents remediation.
    - _Requirements: 1.1-1.6, 2.1-2.6, 19.1, 19.7_
  - [~] 13.2 Finalize the coverage/evidence matrix and finding classifications
    - Ensure every route, source area, workflow, viewport, input, state, security control, persistence mode, requirement, and verification method closes to a compliant, remediated-with-evidence, remediated-validation-pending, or blocked-with-evidence finding.
    - _Requirements: 19.1-19.4, 19.7, 19.8_
  - [~] 13.3 Generate the final completion record with strict lane separation
    - List repository changes and evidence, exact unexecuted protected commands, separately authorized hosted inspection/migration application/type generation/deployment/production-smoke actions, accepted blockers, and remaining limits without claiming unobserved behavior or results.
    - Declare repository remediation and full validation as separate completion states.
    - _Requirements: 14.8-14.10, 17.7, 18.1-18.9, 19.2, 19.4-19.8_

- [~] 14. Final checkpoint
  - Reconcile observed results only for exact checks authorized in the current session and permitted by the enabled hook; list every unauthorized or unexecuted check as pending without a pass/fail claim.
  - Keep hosted operations separate from repository validation and leave them unexecuted unless the repository owner separately authorizes the exact action.

## Notes

- Task `11.4` is the only optional task; it extends the required representative browser/device matrix. All verified-defect remediation, correctness-property tests, and targeted regression evidence remain required.
- Task `8.2` is conditional, not optional: skip it only when task `8.1` proves no Admin schema defect. If a defect exists, the migration is required.
- Repository edits include source, tests, generated-by-code audit evidence, and any conditional migration. Protected validation commands are not repository-edit tasks and remain unexecuted until separately authorized.
- Hosted inspection, migration application, Admin type generation against an authorized environment, deployment, backup, and production smoke testing are separate owner-authorized operations, not implied by completing this plan.
- Every property test uses at least 100 generated cases where the generator domain supports it and is tagged `Feature: planner-comprehensive-audit, Property {number}: {property title}`.
- Every task references granular requirements; every finding additionally carries its exact route, workflow, source, remediation, and verification links.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4"] },
    { "id": 4, "tasks": ["1.5"] },
    { "id": 5, "tasks": ["1.6"] },
    { "id": 6, "tasks": ["1.7"] },
    { "id": 7, "tasks": ["2.1"] },
    { "id": 8, "tasks": ["2.2"] },
    { "id": 9, "tasks": ["2.3"] },
    { "id": 10, "tasks": ["2.4"] },
    { "id": 11, "tasks": ["2.5"] },
    { "id": 12, "tasks": ["3.1"] },
    { "id": 13, "tasks": ["3.2"] },
    { "id": 14, "tasks": ["3.3"] },
    { "id": 15, "tasks": ["3.4"] },
    { "id": 16, "tasks": ["3.5"] },
    { "id": 17, "tasks": ["3.6"] },
    { "id": 18, "tasks": ["3.7"] },
    { "id": 19, "tasks": ["3.8"] },
    { "id": 20, "tasks": ["4.1"] },
    { "id": 21, "tasks": ["4.2"] },
    { "id": 22, "tasks": ["4.3"] },
    { "id": 23, "tasks": ["4.4"] },
    { "id": 24, "tasks": ["4.5"] },
    { "id": 25, "tasks": ["5.1"] },
    { "id": 26, "tasks": ["5.2"] },
    { "id": 27, "tasks": ["5.3"] },
    { "id": 28, "tasks": ["5.4"] },
    { "id": 29, "tasks": ["5.5"] },
    { "id": 30, "tasks": ["6.1"] },
    { "id": 31, "tasks": ["6.2"] },
    { "id": 32, "tasks": ["6.3"] },
    { "id": 33, "tasks": ["6.4"] },
    { "id": 34, "tasks": ["6.5"] },
    { "id": 35, "tasks": ["6.6"] },
    { "id": 36, "tasks": ["6.7"] },
    { "id": 37, "tasks": ["6.8"] },
    { "id": 38, "tasks": ["7.1"] },
    { "id": 39, "tasks": ["7.2"] },
    { "id": 40, "tasks": ["7.3"] },
    { "id": 41, "tasks": ["7.4"] },
    { "id": 42, "tasks": ["7.5"] },
    { "id": 43, "tasks": ["7.6"] },
    { "id": 44, "tasks": ["7.7"] },
    { "id": 45, "tasks": ["7.8"] },
    { "id": 46, "tasks": ["7.9"] },
    { "id": 47, "tasks": ["7.10"] },
    { "id": 48, "tasks": ["8.1"] },
    { "id": 49, "tasks": ["8.2"] },
    { "id": 50, "tasks": ["8.3"] },
    { "id": 51, "tasks": ["9.1"] },
    { "id": 52, "tasks": ["9.2"] },
    { "id": 53, "tasks": ["9.3"] },
    { "id": 54, "tasks": ["10.1"] },
    { "id": 55, "tasks": ["10.2"] },
    { "id": 56, "tasks": ["10.3"] },
    { "id": 57, "tasks": ["10.4"] },
    { "id": 58, "tasks": ["11.1"] },
    { "id": 59, "tasks": ["11.2"] },
    { "id": 60, "tasks": ["11.3"] },
    { "id": 61, "tasks": ["11.4"] },
    { "id": 62, "tasks": ["12.1"] },
    { "id": 63, "tasks": ["12.2"] },
    { "id": 64, "tasks": ["12.3"] },
    { "id": 65, "tasks": ["12.4"] },
    { "id": 66, "tasks": ["12.5"] },
    { "id": 67, "tasks": ["12.6"] },
    { "id": 68, "tasks": ["13.1"] },
    { "id": 69, "tasks": ["13.2"] },
    { "id": 70, "tasks": ["13.3"] },
    { "id": 71, "tasks": ["14"] }
  ]
}
```