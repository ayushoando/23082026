# Planner Comprehensive Audit: Specification, Architecture & Verification Record

## Overview

The Planner Comprehensive Audit defines the repository-wide audit, architectural remediation, and automated verification framework for the Planner product (`/ooplanner`).

It establishes five disjoint workstreams to ensure strict Studio/Planner fork separation, physical unit fidelity, fail-safe persistence, accessible interaction design, server-derived security boundaries, and complete test traceability across 29 formal correctness properties.

---

## 1. Five Core Workstreams & Architecture

### Workstream 1: Audit Foundation, Workflow Tracing & Finding Registry
- **Location:** [`plans/planner-comprehensive-audit/`](file:///d:/23082026/plans/planner-comprehensive-audit)
- **Components:**
  - Strongly typed evidence models and validators ([`auditModel.ts`](file:///d:/23082026/plans/planner-comprehensive-audit/auditModel.ts), [`auditValidators.ts`](file:///d:/23082026/plans/planner-comprehensive-audit/auditValidators.ts)).
  - Live coverage discovery across routes, APIs, and components ([`coverageCollector.ts`](file:///d:/23082026/plans/planner-comprehensive-audit/coverageCollector.ts)).
  - End-to-end workflow tracing ([`workflowTraceBuilder.ts`](file:///d:/23082026/plans/planner-comprehensive-audit/workflowTraceBuilder.ts)).
  - Monotonic finding lifecycle and ownership ledger ([`findingRegistry.ts`](file:///d:/23082026/plans/planner-comprehensive-audit/findingRegistry.ts)).

### Workstream 2: Geometry, Scale & Persistence Integrity
- **Scale Consolidation:** Enforces Planner's native `0.05 px/mm` scale across placement, measurement, snapping, resizing, and serialization, decoupled from Studio's `0.2 px/mm`.
- **Persistence Mode Isolation:** Strict mode selection via [`site/lib/Planner/plannerPersistenceMode.ts`](file:///d:/23082026/site/lib/Planner/plannerPersistenceMode.ts):
  - Local disk writes allowed **only** when `DEV_AUTH_BYPASS=1`.
  - Supabase Admin database (`rxzpznmxbaoxpikowmfc`, `oando_plans`) used in all production and standard environments.
  - Zero dual-writes; read-only production filesystem safety.
- **Revision Compare-and-Swap (CAS) & Idempotency:** Prevents lost updates with atomic revision checks and owner-scoped request fingerprinting.

### Workstream 3: UI/UX, Responsive Layouts & Accessibility
- **Semantic Canvas Commands:** All canvas mutations (`select`, `move`, `rotate`, `resize`, `delete`, `pan`, `zoom`) route through common Planner-owned command dispatchers across mouse, touch, keyboard, and accessible buttons.
- **Responsive Parity:** Retains unsaved states, active selections, and tools across desktop, tablet, and mobile orientations without horizontal page scrollbars.
- **Guest Boundary Integrity:** Public catalog exploration and lead handoffs preserve visitor context without exposing private project capabilities or cross-tenant data.

### Workstream 4: API, Security & Authorization Controls
- **Endpoint Route Order:** Enforces strict pipeline ordering before touching persistence:
  $$\text{Correlation} \to \text{Quota/Rate Limit} \to \text{Validation} \to \text{Origin/CSRF} \to \text{Session} \to \text{Owner Scope} \to \text{Revision/Idempotency} \to \text{Persistence}$$
- **Server-Derived Identity:** Owner scope is derived strictly from verified session tokens, completely ignoring client-supplied user identifiers.
- **Structured Safe Errors:** Returns deterministic error codes and correlation IDs while stripping secrets, stack traces, and internal payloads.

### Workstream 5: Observability, Performance & Regression Evidence
- **Validation Manifest:** Implemented at [`plans/planner-comprehensive-audit/validationEvidence.ts`](file:///d:/23082026/plans/planner-comprehensive-audit/validationEvidence.ts).
- **Automated Verification:** 44 comprehensive test suites in [`tests/unit/planner/`](file:///d:/23082026/tests/unit/planner) enforcing Properties 1 through 29.

---

## 2. Correctness Properties Matrix (Properties 1–29)

| Property | Description | Test File Location |
|---|---|---|
| **Property 1** | Coverage closure | [`tests/unit/planner/plannerCoverageClosure.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerCoverageClosure.property.test.ts) |
| **Property 2** | Finding traceability and impact closure | [`tests/unit/planner/plannerFindingTraceability.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerFindingTraceability.property.test.ts) |
| **Property 3** | Evidence-gated finding transitions | [`tests/unit/planner/plannerFindingTransitions.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerFindingTransitions.property.test.ts) |
| **Property 4** | Planner scale conversion (`0.05 px/mm`) | [`tests/unit/planner/plannerScale.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerScale.property.test.ts) |
| **Property 5** | Geometry persistence round-trip | [`tests/unit/planner/plannerGeometryPersistence.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerGeometryPersistence.property.test.ts) |
| **Property 6** | Valid project initialization | [`tests/unit/planner/plannerValidProjectInitialization.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerValidProjectInitialization.property.test.ts) |
| **Property 7** | Failure-safe UI state | [`tests/unit/planner/plannerFailureSafeUiState.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerFailureSafeUiState.property.test.ts) |
| **Property 8** | Required state completeness | [`tests/unit/planner/plannerRequiredStateCompleteness.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerRequiredStateCompleteness.property.test.ts) |
| **Property 9** | Form value preservation | [`tests/unit/planner/plannerFormValuePreservation.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerFormValuePreservation.property.test.ts) |
| **Property 10** | Responsive context preservation | [`tests/unit/planner/plannerResponsiveContext.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerResponsiveContext.property.test.ts) |
| **Property 11** | Input-command parity | [`tests/unit/planner/plannerInputCommandParity.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerInputCommandParity.property.test.ts) |
| **Property 12** | Accessible control completeness | [`tests/unit/planner/plannerAccessibleControlCompleteness.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerAccessibleControlCompleteness.property.test.ts) |
| **Property 13** | Accessible overflow disclosure | [`tests/unit/planner/plannerAccessibleOverflowDisclosure.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerAccessibleOverflowDisclosure.property.test.ts) |
| **Property 14** | Server-derived owner scope | [`tests/unit/planner/plannerRepositoryFacade.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerRepositoryFacade.property.test.ts) |
| **Property 15** | Endpoint contract completeness | [`tests/unit/planner/plannerValidationManifest.test.ts`](file:///d:/23082026/tests/unit/planner/plannerValidationManifest.test.ts) |
| **Property 16** | Security checks precede persistence | [`tests/unit/planner/plannerWorkflowState.test.ts`](file:///d:/23082026/tests/unit/planner/plannerWorkflowState.test.ts) |
| **Property 17** | Safe structured errors | [`tests/unit/planner/plannerWorkflowState.test.ts`](file:///d:/23082026/tests/unit/planner/plannerWorkflowState.test.ts) |
| **Property 18** | Exclusive persistence selection | [`tests/unit/planner/plannerExclusivePersistence.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerExclusivePersistence.property.test.ts) |
| **Property 19** | Revision compare-and-swap | [`tests/unit/planner/plannerRevisionCas.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerRevisionCas.property.test.ts) |
| **Property 20** | Idempotent mutation | [`tests/unit/planner/plannerIdempotentMutation.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerIdempotentMutation.property.test.ts) |
| **Property 21** | Delete unavailability | [`tests/unit/planner/plannerDeleteUnavailability.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerDeleteUnavailability.property.test.ts) |
| **Property 22** | Schema compatibility safety | [`tests/unit/planner/plannerSchemaCompatibility.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerSchemaCompatibility.property.test.ts) |
| **Property 23** | Guest boundary integrity | [`tests/unit/planner/plannerGuestBoundaryIntegrity.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerGuestBoundaryIntegrity.property.test.ts) |
| **Property 24** | Correlation & privacy preservation | [`tests/unit/planner/plannerObservability.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerObservability.property.test.ts) |
| **Property 25** | Observability failure isolation | [`tests/unit/planner/plannerObservability.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerObservability.property.test.ts) |
| **Property 26** | Performance finding completeness | [`tests/unit/planner/plannerPerformanceFindingCompleteness.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerPerformanceFindingCompleteness.property.test.ts) |
| **Property 27** | Authorization-gated validation | [`tests/unit/planner/plannerValidationEvidence.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerValidationEvidence.property.test.ts) |
| **Property 28** | Change-derived validation plan | [`tests/unit/planner/plannerValidationEvidence.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerValidationEvidence.property.test.ts) |
| **Property 29** | Evidence-class separation | [`tests/unit/planner/plannerValidationEvidence.property.test.ts`](file:///d:/23082026/tests/unit/planner/plannerValidationEvidence.property.test.ts) |

