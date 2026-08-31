# Design Document: Planner Comprehensive Audit

## Overview

The Planner Comprehensive Audit is an evidence-driven repository program for `/ooplanner`, `/ooplanner/projects`, `/ooplanner/projects/[id]`, and every reachable Planner-owned feature, component, library, hook, store, server, API, platform, FOCSS, and test area. It produces a complete coverage inventory, traces user-visible workflows to persistence, creates one lifecycle record per audited area or defect, applies the smallest sound remediation, and separates repository evidence from browser, integration, hosted, and deployment evidence.

This design does not assume that source presence proves behavior. Live code is the finding basis; documentation is supporting evidence. Existing repository patterns remain authoritative: thin App Router entries, Planner-local aliases and FOCSS, shared `withAuth`/structured API helpers, `getPlannerPersistenceMode()`, Admin Supabase `oando_plans`, Fabric-based geometry, and repository-root validation guarded by explicit authorization.

## Goals and Non-Goals

### Goals

- Enumerate every covered route and reachable Planner-owned source/test area without relying on a fixed historical file list.
- Trace entry, UI, state, server/API, persistence, and user-visible result for every workflow.
- Remediate every verified defect, including minor visual defects, with the smallest owned change.
- Preserve the Planner/Studio fork boundary and the Planner geometry scale of `0.05 px/mm`.
- Make API, authorization, concurrency, persistence, observability, performance, and validation expectations explicit and testable.
- Maintain honest completion records when protected or hosted evidence is unavailable.

### Non-Goals

- Sharing implementation between Planner and Studio.
- Replacing the Planner document model, Fabric, Dockview, FOCSS, auth middleware, or persistence architecture wholesale.
- Applying hosted migrations, deploying, starting services, or running protected checks without separate authorization.
- Treating generated inventories, screenshots, static imports, or documentation as proof of runtime behavior.

## Repository Evidence Baseline

| Concern | Existing evidence to start from | Design use |
|---|---|---|
| Routes | `site/app/ooplanner/**`, `site/features/Planner/**` | Live route inventory and thin route-to-view links |
| Planner UI | `site/components/Planner/**`, `site/hooks/Planner/**`, `site/store/Planner/**` | Interaction, state, responsive, accessibility, and canvas audit |
| Planner logic | `site/lib/Planner/**` | Geometry, document, commands, exports, validation, and API client |
| Server/API | `site/app/api/Planner/**`, `site/server/Planner/**`, shared API middleware | Endpoint contracts and route-to-persistence traces |
| Persistence | `plannerPersistenceMode.ts`, `projectsStore.ts`, `projectsStore.supabase.ts` | Exclusive disk/Admin Supabase adapters |
| Database | `migrations.admin/**`, Admin generated Supabase types | Optional evidenced `oando_plans` migration work |
| Styling | `site/focss/planner/**`, Planner `PhIcon` abstraction | Fork-local semantic styling and rendered remediation |
| Tests | Planner sources under `tests/unit`, `tests/integration`, `tests/e2e`, shared Vitest/Playwright config | Existing proof inventory and validation gap mapping |
| Observability | `site/lib/observability/metrics.ts`, instrumentation registration | Registry reuse and privacy-safe Planner metrics |

Initial static evidence identifies three live page routes and the `/api/Planner/{catalog,handoff,projects,sketch-to-plan}` branches. The audit must rediscover this from the live tree and classify additions, absences, generated artifacts, local-only paths, legacy paths, and unreachable paths rather than freezing this baseline.

## Architecture

```text
Live route/source/import trees
        │
        ▼
Coverage Collector ──► Coverage Matrix ──► Workflow Trace Builder
        │                                      │
        └──────────────► Finding Registry ◄────┘
                               │
                 reproduce/classify/approve scope
                               │
                               ▼
                     Smallest-Sound Remediator
                               │
         ┌──────── UI/FOCSS ───┼── API/security ──┐
         │                     │                  │
   geometry/state        persistence/data     tests/evidence
         └─────────────────────┼──────────────────┘
                               ▼
                      Validation Planner
              authorized evidence │ pending evidence
                               ▼
                      Completion Reconciler
```

The implementation is an audit workstream, not a new production runtime framework. Audit records may be maintained beside the owning active plan or in the repository-approved audit workstream; machine-generated command evidence belongs under a purpose-specific `results/**` directory. Product remediations stay in their existing Planner-owned paths. Hard blockers belong only in root `Failures.md` and only when that exact protected write is authorized.

## Components and Responsibilities

### 1. Coverage Collector

The collector builds the inventory from live paths and dependency evidence.

- **Route roots:** all `page.tsx` and `layout.tsx` under `site/app/ooplanner/**`.
- **API roots:** all handlers under `site/app/api/Planner/**`, preserving on-disk case.
- **Planner roots:** `features/Planner`, `components/Planner`, `lib/Planner`, `hooks/Planner`, `store/Planner`, `server/Planner`, `platform/Planner`, and `focss/planner`.
- **Reachable support:** shared modules imported by covered Planner roots, such as auth, CSRF, rate limiting, catalog adapters, Supabase clients/types, observability, persistence guards, and route contracts.
- **Tests/config:** tests naming or importing covered routes/modules plus test manifests and configuration that include Planner source.

Each item receives one status: `wired`, `present-but-unverified`, `demo/local-only`, `generated`, `legacy`, `unwired/absent`, or `unreachable`. Every non-wired status requires a source path and evidence note. Generated output is evidence only, never the source of truth.

### 2. Workflow Trace Builder

Each workflow is a directed trace whose required stages are:

```text
route entry → feature/view → component interaction → hook/store/command
→ browser API client → route handler/middleware → persistence facade
→ selected adapter → response/error mapping → user-visible result
```

Required traces include entry/auth routing, project list, create, load, edit, save, delete, catalog browse/select/upload where applicable, handoff, sketch-to-plan, offline/reconnect, conflict recovery, and destructive navigation with unsaved changes.

| Route | Primary trace target |
|---|---|
| `/ooplanner` | entry state → Planner workspace → canvas/state → catalog/handoff/project operations |
| `/ooplanner/projects` | authenticated list/create → `/api/Planner/projects` → owner-scoped store |
| `/ooplanner/projects/[id]` | load/edit/save/delete → `/api/Planner/projects/[id]` → revisioned owner record |

A trace is incomplete if it stops at a React component or route handler. It must end in a user-visible outcome and identify all applicable required states.

### 3. Coverage Matrix

A normalized matrix avoids one oversized checklist. Rows are stable identifiers; join records represent many-to-many coverage.

```ts
interface CoverageItem {
  id: string;
  kind: "route" | "workflow" | "source" | "api" | "focss" | "test";
  path: string;
  status: "wired" | "present-but-unverified" | "demo/local-only" |
    "generated" | "legacy" | "unwired/absent" | "unreachable";
  evidenceRefs: string[];
}

interface CoverageLink {
  itemId: string;
  routeIds: string[];
  workflowIds: string[];
  viewportClasses: Array<"desktop" | "tablet" | "phone">;
  inputMethods: Array<"pointer" | "touch" | "keyboard">;
  stateIds: string[];
  securityControlIds: string[];
  persistenceModes: Array<"disk" | "supabase">;
  requirementRefs: string[];
  findingIds: string[];
  verificationRefs: string[];
}
```

The matrix validator reports orphan routes, source areas, workflows, requirements, states, security controls, persistence modes, and evidence. It does not mark missing runtime proof as failure; it marks it `pending`.

### 4. Finding Registry and Lifecycle

```ts
type FindingState =
  | "candidate"
  | "verified"
  | "remediation-approved"
  | "remediated-validation-pending"
  | "remediated-with-evidence"
  | "blocked-with-evidence"
  | "compliant-with-evidence";

interface AuditFinding {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "note";
  state: FindingState;
  routeIds: string[];
  workflowIds: string[];
  sourcePaths: string[];
  requirementRefs: string[];
  reproduction: EvidenceRef[];
  expected: string;
  observed: string;
  affectedScope: string[];
  remediationPaths: string[];
  validationIds: string[];
  blocker?: { evidence: EvidenceRef[]; ownerDecision: string };
}
```

Allowed transitions are monotonic:

```text
candidate → verified → remediation-approved
                     ├→ remediated-validation-pending → remediated-with-evidence
                     └→ blocked-with-evidence
candidate → compliant-with-evidence
```

A finding expands before completion when dependency or workflow tracing reveals adjacent impact. `remediated-with-evidence` requires observed acceptable evidence; an unrun protected check yields only `remediated-validation-pending`. Every audited item has either a defect finding or a compliant finding.

### 5. Remediation Coordinator

For each verified defect:

1. Reproduce from live evidence and bind requirements.
2. Identify the narrowest owner path and adjacent workflow closure.
3. Prefer an existing Planner utility/component/style/API pattern.
4. Change only owned files; preserve unrelated work.
5. Re-run static trace reconciliation.
6. Attach the narrowest permitted validation or exact pending command.

Cross-cutting rewrites are rejected unless evidence proves the defect cannot be soundly fixed locally. Shared-code extraction is not permitted across the Planner/Studio fork.

## UI, Responsive, Input, and Accessibility Design

### Required State Model

Each workflow declares applicable states from: default, loading, empty, success, validation error, server error, unauthenticated, forbidden, rate-limited, conflict, stale, offline, and recovery. State presentation includes a title, concise explanation, primary action, optional secondary action, focus target, live-region behavior, and whether in-memory work is preserved.

Errors are typed rather than inferred from message text. A successful retry clears stale error state. Offline/re-auth transitions retain unsaved in-memory project state. Conflict recovery never silently overwrites the server revision.

### Responsive Pattern

- **Desktop:** preserve distinct canvas, toolbar, panel, and dialog regions without overlap.
- **Tablet:** panels become dismissible overlays or reversible tabs; active controls cannot be hidden behind an undismissable panel.
- **Phone:** commands move into reachable grouped surfaces; no page-level horizontal scroll; the canvas may pan in its bounded region.
- Resize/orientation changes preserve document content, selection where meaningful, active tool, current workflow step, and unsaved state.
- Modals use visual-viewport-aware max sizes and contained scrolling; action rows remain reachable.

Viewport acceptance uses documented representative dimensions and both orientations where meaningful. CSS-only evidence cannot prove fit or rendered target size.

### Input Parity Pattern

All state-changing canvas actions are represented as semantic commands before input bindings:

```ts
interface PlannerCommandDescriptor {
  id: string;
  label: string;
  execute(context: PlannerCommandContext): PlannerCommandResult;
  pointerBinding?: string;
  touchBinding?: string;
  keyboardBinding?: string;
  accessibleControlId?: string;
}
```

Pointer drag, touch gesture, keyboard command, command palette, and visible control invoke the same command. Selection, move, rotate, resize, duplicate, delete, zoom, and pan cannot exist only as canvas gestures. Multi-pointer outcomes have explicit buttons or keyboard alternatives. `touch-action` suppression is scoped to the active gesture region, not the page.

Focus enters menus, panels, and dialogs, remains trapped only for modal surfaces, and returns to the invoker. Roving focus is used for composite toolbars where appropriate. Focus indicators remain visible and are not hidden by sticky chrome.

### WCAG 2.2 AA Remediation Pattern

- Use semantic controls and programmatic name/role/value/state/relationships; canvas-only semantics receive an accessible command/list representation.
- Associate validation messages with fields using stable ids and error descriptions; preserve valid values.
- Verify text, non-text, focus, selected, invalid, and busy-state contrast using rendered values.
- Meaningful images receive concise alternatives; decorative images are ignored by assistive technology.
- At 200% zoom, reflow all chrome without two-dimensional page scrolling; the bounded planning canvas is the documented exception.
- Honor reduced motion while retaining state feedback.
- Meet WCAG 2.2 minimum target size of 24×24 CSS px subject to valid exemptions; treat 40×40 on narrow viewports as repository advisory, not an automatic defect.
- Any timeout that risks work warns first and offers extension, reauthentication, or retained-state recovery.

### FOCSS and Visual Pattern

Planner TSX uses the Planner Phosphor abstraction and Planner-local primitives. Repeated presentation belongs in `site/focss/planner/**`, uses semantic tokens, and never imports Studio FOCSS. Audit equivalent controls together for spacing, typography, elevation, borders, radii, icon/label alignment, truncation, focus, hover, selected, pressed, invalid, disabled, and busy states. New patterns are added only after an existing Planner pattern cannot satisfy the verified defect.

## Fork and Geometry Integrity

Planner files may import Planner aliases and approved shared infrastructure, but never Studio-owned source. Studio receives the symmetric prohibition. Geometry helpers remain fork-local because Studio uses `0.2 px/mm` while Planner uses `0.05 px/mm`.

`SCALE_PX_PER_MM = 0.05` is the Planner canonical conversion parameter. Millimetres are the view-independent persisted unit wherever a normalized model exists. Fabric pixels are an adapter concern.

```ts
const plannerMmToPx = (mm: number): number => mm * 0.05;
const plannerPxToMm = (px: number): number => px / 0.05;
```

Create, placement, snapping, measurement, resize, rotate, export, serialize, and deserialize paths either import the Planner constant or receive it explicitly from Planner context. Persisted records carry a validated `scalePxPerMm` when legacy Fabric snapshots require it; loaders reject or explicitly migrate unsupported scale metadata rather than silently assuming Studio scale. Round trips compare physical dimensions within the numeric precision of the stored format.

## API Contracts

Endpoint descriptors are the source of truth for methods, schemas, statuses, auth, owner policy, CSRF/origin policy, and rate limits. Existing `withAuth`, `ApiError`, `success`, `error`, and validation helpers are reused and extended rather than bypassed.

| Endpoint | Methods | Auth | Mutation controls | Purpose |
|---|---|---|---|---|
| `/api/Planner/catalog` | GET | guest | rate limit | public catalog fields only |
| `/api/Planner/catalog/upload` | POST | policy confirmed by audit | schema, origin/CSRF where browser-authenticated, rate limit | Planner-owned catalog upload path |
| `/api/Planner/handoff` | POST | guest | schema, origin/anti-abuse, consent, rate limit | lead handoff only |
| `/api/Planner/projects` | GET, POST | member | POST CSRF/origin, owner scope, rate limit | list/create |
| `/api/Planner/projects/[id]` | GET, PATCH, DELETE | member | mutation CSRF/origin, owner scope, revision/idempotency, rate limit | load/save/delete |
| `/api/Planner/sketch-to-plan` | POST | documented policy | schema, origin/CSRF as applicable, strict rate limit | bounded conversion operation |

### Schemas

```ts
interface PlannerProjectEnvelopeV1 {
  schemaVersion: 1;
  id: string;
  name: string;
  revision: number;
  status: "draft" | "active" | "archived";
  geometry: PlannerGeometryMm;
  canvasSnapshot?: Record<string, unknown>;
  sheet: Record<string, unknown>;
  layers: unknown[];
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SaveProjectRequestV1 {
  project: PlannerProjectEnvelopeV1;
  expectedRevision: number;
  idempotencyKey: string;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
  correlationId: string;
}

interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    issues?: Array<{ path: string; message: string }>;
    retryAfterSeconds?: number;
    currentRevision?: number;
  };
  correlationId: string;
}
```

Transition existing top-level payloads compatibly: first add adapters and dual-read client parsing if needed, then converge handlers and clients within one finding. Do not introduce unversioned response ambiguity.

### Request Processing Order

```text
correlation id → rate limit → method/path/query/header/body validation
→ origin + CSRF for state change → verified server session
→ owner scope → revision/idempotency checks → persistence → safe response
```

Validation, CSRF/origin, authentication, and authorization failures invoke no persistence operation. Owner identity is always derived from the verified session; client owner ids are ignored or rejected. Cross-owner access follows one documented non-disclosing policy, preferably 404 for item endpoints, and never returns record content. Unsupported methods return 405 with `Allow`.

Errors expose stable codes and safe remediation data only. Internal messages, stack traces, credentials, cookies, tokens, payload content, and cross-owner data are excluded. Every server-backed response includes a correlation identifier. Rate-limit responses use 429 and documented retry/reset metadata.

## Persistence, Revision, Schema Version, and Idempotency

### Exclusive Mode Selection

```text
DEV_AUTH_BYPASS=1 AND NODE_ENV != production → disk adapter only
otherwise                                      → Admin Supabase adapter only
production                                     → Admin Supabase adapter only
invalid/ambiguous configuration                 → reject, no adapter call
selected adapter failure                        → report, never fallback-write
```

The facade selects one adapter once per operation. Disk functions remain guarded by the existing non-production writable assertion. Supabase mode performs no project filesystem write; disk mode performs no `oando_plans` write. R2 is backup/operations only.

All project operations accept an owner context even when disk bypass maps to the deterministic development user. The persistence interface is explicit:

```ts
interface PlannerProjectRepository {
  list(ownerId: string): Promise<PlannerProjectSummary[]>;
  load(ownerId: string, id: string): Promise<PlannerProjectEnvelopeV1 | null>;
  create(ownerId: string, request: SaveProjectRequestV1): Promise<SaveResult>;
  save(ownerId: string, id: string, request: SaveProjectRequestV1): Promise<SaveResult>;
  delete(ownerId: string, id: string, expectedRevision: number, idempotencyKey: string): Promise<DeleteResult>;
}
```

### Coherent Revisions

A project save is a compare-and-swap operation. `expectedRevision` must equal the persisted revision; success atomically writes the complete normalized envelope, increments revision once, and updates `updatedAt`. A stale revision returns 409 with safe current revision metadata and leaves the record unchanged. Creation sets revision 1 and both timestamps; updates preserve `createdAt`.

### Schema Versions

`schemaVersion` is mandatory at the normalized boundary. Load behavior is:

1. Current version: validate and return.
2. Known older version: apply a pure deterministic in-memory migration, validate, then return; persistence of the upgraded form requires explicit save.
3. Unknown/newer version: preserve source record unchanged and return `UNSUPPORTED_SCHEMA_VERSION`.

Legacy `payload`/`canvas_json` forms are adapted at the repository boundary, not throughout UI code. Geometry migrations retain millimetres and validated Planner scale.

### Idempotency

State-changing endpoints require a bounded, opaque idempotency key. The identity is scoped by owner, endpoint operation, project id, and key. The persistence transaction records a request fingerprint and resulting revision/status. An identical retry returns the stored result without a second effect; key reuse with a different fingerprint returns conflict. Retention and maximum key length are documented and rate-limited.

Disk mode uses an atomic sidecar/index within the approved Planner data directory and write-then-rename semantics; Supabase mode uses a transaction-safe table or function only if repository evidence proves the existing schema cannot enforce the contract.

## Optional Admin Migration Design

A migration is created only for a verified schema defect. It belongs under `site/platform/supabase/migrations.admin/`, targets Admin `oando_plans`, and does not modify Products migrations.

Potential evidenced additions are `revision`, `schema_version`, and an owner-scoped idempotency record. The preferred relational shape is:

```text
oando_plans: revision bigint not null default 1
             schema_version integer not null default 1
planner_operation_idempotency:
  owner_id, operation, project_id, idempotency_key, request_fingerprint,
  response_status, response_revision, created_at
  unique(owner_id, operation, project_id, idempotency_key)
```

Forward SQL must preserve existing rows with deterministic defaults or an explicit transformation. The same migration contains a `-- rollback` section that removes only introduced policies, grants, indexes, constraints, columns/tables in dependency-safe order. Before SQL is authored, inspect existing migrations and generated Admin types to avoid duplicate structures.

RLS policies use `auth.uid() = user_id/owner_id` for authenticated owner operations. Service-role access remains server-only. Grants expose only operations required by the documented server path; no anonymous project access is granted. Because current server evidence uses an admin client, application-level owner checks remain mandatory even when RLS is added.

Validation sequencing, when separately authorized, is:

1. `pnpm run db:apply:admin -- --dry`
2. authorized migration application in the intended environment
3. `pnpm run db:types:admin`
4. typecheck and targeted persistence/API checks under their own authorization

Without hosted authorization these remain pending exact actions; no remote schema state is claimed.

## Guest Catalog and Lead Handoff Boundary

Catalog responses expose only approved furniture/product fields and no project ownership or payload data. Guest selections remain client workflow context but do not create project-operation capability. Lead handoff validates contact, consent, and inquiry fields, preserves valid draft values on error, and returns a stable non-secret reference on success. Handoff authorization cannot be exchanged for project list/load/save/delete access.

## Performance Design

Every measurement records a Supported Test Profile: viewport, orientation, input, browser/version, device or emulation, CPU/network conditions, representative fixture, warm/cold classification, sample count, and method.

| Budget | Threshold | Evidence |
|---|---:|---|
| Route-entry LCP p75 | ≤ 2.5 s | browser performance run |
| Non-canvas INP p75 | ≤ 200 ms | representative interactions |
| Route-entry CLS | ≤ 0.1 | browser performance run |
| Canvas manipulation median | ≥ 30 FPS | pan/zoom/select/move/rotate/resize fixture |
| Direct feedback | ≤ 100 ms | input-to-visible-feedback trace |
| Local integration project API p95 | ≤ 2 s | list/load/save, cold start separately labeled |
| Resource cleanup | baseline after each of 20 load/close cycles | subscriptions/listeners instrumentation |

The Representative Project contains a room boundary, at least ten furniture objects, rotation, dimensions, labels, and persisted metadata. Remediation order is measure, identify bottleneck, make the smallest local change, remeasure with the same profile. Findings record both before/after values and never generalize one profile to all devices.

## Observability and Privacy

Planner server records use a fixed schema:

```ts
interface PlannerOperationEvent {
  operation: "list" | "load" | "create" | "save" | "delete" | "handoff";
  resultClass: "success" | "validation" | "auth" | "forbidden" |
    "rate_limited" | "conflict" | "persistence_failure" | "internal";
  durationMs: number;
  correlationId: string;
  persistenceMode?: "disk" | "supabase";
}
```

Metrics reuse the existing Prometheus registry and use bounded labels only: operation, method, result class, status class, and persistence mode. Required instruments cover request count, error count, duration, rate-limit outcomes, authorization denials, and persistence failures. Never label or log contact values, project ids/names/content, geometry, owner ids, tokens, cookies, credentials, secrets, free-form errors, URLs containing identifiers, or request bodies.

Accept a syntactically valid inbound correlation header or generate a random opaque id; return it in a response header and envelope, and pass it unchanged through API and persistence context. It is not an authentication or idempotency identity. Export failure cannot alter the user operation; a repository-approved safe fallback sink receives the same redacted event. Static instrumentation evidence is labeled separately from hosted telemetry.

## Error Handling

| Error | API behavior | UI behavior | Persistence effect |
|---|---|---|---|
| Validation | 400 structured issues | field association, values retained | none |
| Unauthenticated | 401 | reauth, unsaved state retained | none |
| Cross-owner | documented 404/403 | non-disclosing forbidden/not-found | none |
| CSRF/origin | 403 stable code | retry only after safe refresh | none |
| Rate limit | 429 + retry metadata | countdown/retry guidance | none |
| Stale revision/idempotency mismatch | 409 | reload/compare/explicit retry | no overwrite |
| Unsupported schema | 422 or documented conflict code | migration/unsupported state | source preserved |
| Invalid persistence config | 503 | configuration unavailable state | no adapter call |
| Backend failure | safe 5xx + correlation id | recoverable error, memory retained | no fallback write |
| Internal failure | safe 500 + correlation id | generic recovery | no sensitive response |

## Correctness Properties

The prework classified rendered UI, infrastructure, migration, performance, and hosted behavior as example, smoke, or integration checks. Property reflection consolidated overlapping criteria: owner filtering subsumes separate client-owner rejection cases; exclusive persistence combines no-dual-write and no-fallback invariants; project round trips combine creation/load and geometry preservation; finding closure combines matrix and lifecycle completeness. Each remaining property provides distinct validation value.

### Property 1: Coverage closure

For all live Planner route/import trees, every covered route and reachable Planner-owned area appears exactly once in the inventory, has an evidence-backed status, and is linked through at least one complete workflow trace to a user-visible result.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Finding traceability and impact closure

For every audited area or verified defect, exactly one finding links all affected routes, workflows, source paths, requirements, adjacent impacted workflows, and verification methods.

**Validates: Requirements 1.6, 2.3, 19.1, 19.3**

### Property 3: Evidence-gated finding transitions

For any finding transition to a terminal reporting state, the target state is one of the allowed classifications and all required observed evidence, pending authorization, or blocker evidence is present; unrelated paths remain unchanged by its remediation.

**Validates: Requirements 2.5, 2.6, 19.2, 19.7, 19.8**

### Property 4: Planner scale conversion

For all finite millimetre values representable by the geometry format, converting to Planner pixels produces `millimetres × 0.05`, and converting back preserves the original physical value within stored numeric precision.

**Validates: Requirements 3.3, 3.4**

### Property 5: Geometry persistence round trip

For any valid Planner project geometry, serialize-save-load-deserialize preserves physical dimensions, placement, rotation, and Planner scale without applying `0.2 px/mm` or a lossy unit conversion.

**Validates: Requirements 3.5, 4.3, 13.8**

### Property 6: Valid project initialization

For any valid owner and creation input, project initialization produces an editable document with required defaults, schema version, revision 1, coherent timestamps, and valid geometry.

**Validates: Requirements 4.2, 13.1, 13.2**

### Property 7: Failure-safe UI state

For any valid in-memory project state and failed edit, save, offline, reauthentication, or stale-data transition, the last valid unsaved state remains available and only an explicit recovery action can replace newer persisted content; a subsequent success clears obsolete errors.

**Validates: Requirements 4.6, 4.8, 5.6, 5.7, 5.8, 10.8**

### Property 8: Required state completeness

For every covered workflow, each applicable required state maps to a distinct presentation, accessible status, focus behavior, and deterministic next or recovery action.

**Validates: Requirements 5.1, 5.5**

### Property 9: Form value preservation

For any project or handoff form containing valid and invalid fields, validation identifies every invalid field, associates its message with the control, and preserves every valid entered value without submission.

**Validates: Requirements 5.4, 8.5, 15.3, 15.4**

### Property 10: Responsive context preservation

For any supported viewport resize or orientation change, project content, unsaved changes, active workflow context, and reachable command set remain equivalent before and after the transition.

**Validates: Requirements 6.1, 6.2, 6.6**

### Property 11: Input-command parity

For every state-changing Planner action, all required pointer, touch, keyboard, and accessible-control bindings invoke the same semantic command and produce equivalent valid state, including alternatives for multi-pointer outcomes.

**Validates: Requirements 7.1, 7.2, 7.3, 7.7**

### Property 12: Accessible control completeness

For every interactive control and declared control state, programmatic name, role, value/state/relationship metadata and a distinguishable semantic/visual state mapping are present.

**Validates: Requirements 8.2, 9.6**

### Property 13: Accessible overflow disclosure

For any user-visible value that exceeds its region, the rendering policy preserves the complete value through wrapping, expansion, or an accessible disclosure.

**Validates: Requirements 9.5**

### Property 14: Server-derived owner scope

For any authenticated owner and arbitrary mixed-owner records or client-supplied owner identifiers, effective scope derives only from the verified server session; list returns only owned records and item operations reveal or mutate no cross-owner data.

**Validates: Requirements 10.3, 10.4, 10.5, 10.6, 10.7**

### Property 15: Endpoint contract completeness

For every Planner endpoint, its descriptor defines allowed methods, all input/output schemas, statuses, auth and authorization, CSRF/origin policy, and rate-limit policy.

**Validates: Requirements 11.1**

### Property 16: Security checks precede persistence

For any request with an invalid method/input/origin/CSRF/session/owner scope or exceeded quota, the documented structured response is returned and no persistence operation is invoked.

**Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6, 11.7**

### Property 17: Safe structured errors

For any internal exception or generated sensitive payload, the client response contains a stable non-sensitive code and correlation identifier while excluding secrets, stack traces, credentials, tokens, project content, and cross-owner data.

**Validates: Requirements 11.8, 11.9**

### Property 18: Exclusive persistence selection

For any runtime environment and project operation, exactly one approved adapter is selected—disk only for non-production development bypass and Admin Supabase otherwise; invalid configuration or selected-adapter failure invokes no alternate backend.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8**

### Property 19: Revision compare-and-swap

For any valid save, success occurs only when expected revision equals current revision, atomically increments the revision once, preserves creation time, updates modification time, and stale requests leave the current record unchanged.

**Validates: Requirements 4.4, 13.2, 13.4**

### Property 20: Idempotent mutation

For any state-changing request retried with the same owner-scoped idempotency identity and fingerprint, the observable create/save/delete revision effect occurs exactly once; reuse with a different fingerprint conflicts.

**Validates: Requirements 13.3**

### Property 21: Delete unavailability

For any owned project whose confirmed deletion succeeds, all subsequent owner list and load operations exclude that record and the UI receives the deterministic post-delete result.

**Validates: Requirements 4.5, 13.6**

### Property 22: Schema compatibility safety

For any persisted project, current and known older schema versions validate or deterministically migrate in memory, while unsupported versions leave the source record unchanged and produce an explicit unsupported-version result.

**Validates: Requirements 13.1, 13.7, 14.6**

### Property 23: Guest boundary integrity

For any guest catalog selection or handoff operation, required public data and draft/confirmation state are preserved while project records, owner data, and project-operation capability are never exposed or granted.

**Validates: Requirements 10.1, 10.2, 15.1, 15.2, 15.5, 15.6, 15.7**

### Property 24: Correlation and privacy preservation

For any server-backed Planner operation, one correlation identifier propagates unchanged through API and persistence and appears in safe client errors, while logs and metric labels exclude all prohibited sensitive or high-cardinality values.

**Validates: Requirements 17.1, 17.3, 17.4, 17.5**

### Property 25: Observability failure isolation

For any observability exporter failure, the user-visible and persistence result remains unchanged and the approved redacted fallback sink receives the operation event.

**Validates: Requirements 17.6**

### Property 26: Performance finding completeness

For any missed performance budget, its finding records the measured value, complete test profile, bottleneck evidence, and remediation status.

**Validates: Requirements 16.8**

### Property 27: Authorization-gated validation

For any protected check or hosted action, execution is possible only with exact current-session authorization and hook permission; otherwise it remains unexecuted with the exact pending command/action and no claimed result.

**Validates: Requirements 14.10, 18.2, 18.3, 18.4, 18.9, 19.5, 19.6**

### Property 28: Change-derived validation plan

For any set of finding categories and changed paths, the validation plan includes every applicable narrow check, adds fork and FOCSS checks when triggered, includes `pnpm run typecheck` when required, and never includes unavailable `typecheck:scripts`.

**Validates: Requirements 18.1, 18.5, 18.6, 18.7, 18.8**

### Property 29: Evidence-class separation

For every evidence record, exactly one class—repository, browser, integration, hosted, or deployment—is assigned, and static evidence is never promoted to a stronger class.

**Validates: Requirements 17.7, 19.4**

## Testing and Validation Strategy

Use a dual approach. Property tests exercise pure inventory validators, state machines, geometry, schemas, authorization ordering with mocks, persistence selection, revision/idempotency models, sanitizers, and validation-plan derivation for at least 100 generated cases per property. Each property test is tagged:

`Feature: planner-comprehensive-audit, Property {number}: {property title}`

Example/unit tests cover concrete entry states, dialogs, form errors, unsupported methods, focus movement, timeout recovery, and compatibility adapters. Integration tests cover API middleware, Admin/disk adapters, RLS behavior, metrics, and migration transformations. Browser tests cover responsive fit, touch/keyboard parity, focus, reflow, contrast, reduced motion, visual states, and performance. Smoke/static checks cover route/source inventories, fork imports, FOCSS structure, icon abstraction, migration placement/rollback/grants, and generated types.

Validation is planned, not implicitly authorized. Applicable pending commands include:

- Fork changes: `pnpm run scan:boundaries`
- Planner UI/FOCSS: `pnpm run verify:focss`, `pnpm run lint:ui:strict`, `pnpm run check:style-tokens`
- Type impact: `pnpm run typecheck` (never `typecheck:scripts`)
- Migration: `pnpm run db:apply:admin -- --dry`, then later `pnpm run db:types:admin`
- Targeted Vitest/Playwright/accessibility/performance commands selected from live scripts and recorded exactly before authorization
- Ship bar only when explicitly authorized: repository-configured full gate

Each execution record contains exact command, repository-root working directory, user authorization, hook decision, exit status, relevant output, evidence class, and limitation. A command that did not run has no pass/fail result.

## Requirements Traceability

| Requirement group | Primary design sections |
|---|---|
| 1. Exhaustive coverage | Coverage Collector, Workflow Trace Builder, Coverage Matrix |
| 2. Every defect | Finding Registry, Remediation Coordinator |
| 3. Fork integrity/geometry | Fork and Geometry Integrity; Properties 4–5 |
| 4. Core workflows | Workflow traces, state model, persistence; Properties 6–7, 19, 21 |
| 5. User-visible states | Required State Model; Properties 7–9 |
| 6. Responsive parity | Responsive Pattern; Property 10 |
| 7. Input parity | Input Parity Pattern; Property 11 |
| 8. WCAG 2.2 AA | WCAG remediation; Properties 12–13 |
| 9. FOCSS consistency | FOCSS and Visual Pattern |
| 10. Access boundaries | API processing, owner scope; Property 14 |
| 11. API/security | API Contracts, Request Processing, Error Handling; Properties 15–17 |
| 12. Exclusive persistence | Exclusive Mode Selection; Property 18 |
| 13. Integrity/concurrency | Revisions, versions, idempotency; Properties 19–22 |
| 14. Admin database | Optional Admin Migration Design |
| 15. Catalog/handoff | Guest Boundary; Property 23 |
| 16. Performance | Performance Design; Property 26 |
| 17. Observability | Observability and Privacy; Properties 24–25, 29 |
| 18. Authorization gates | Testing and Validation; Properties 27–28 |
| 19. Completion evidence | Coverage Matrix, Finding Lifecycle, Evidence separation |

## Completion Model

Repository remediation is complete only when every verified defect is either remediated or has an evidenced blocker accepted by the owner. Full validation is a separate state and requires every mandatory authorized check to have an observed acceptable result. The final record lists changed scope, compliant and defect findings, exact observed evidence, pending protected commands, separately authorized hosted work, coverage gaps, and accepted blockers without claiming deployment, hosted database state, rendered behavior, or command success that was not observed.
