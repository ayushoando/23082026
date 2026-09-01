# Technical Design: Site UI, Content, and Links Audit

## Overview

This design defines a read-only audit program that produces an exhaustive, occurrence-level evidence set and implementation-ready remediation handoff without changing product code. The program treats live repository source as the canonical inventory authority, separates source-derived expectations from authorized runtime observations, preserves Planner and Studio as independent product surfaces, and never converts sampled tool output into a completeness claim.

The design has two execution lanes:

1. **Static Inspection lane** — reads source, configuration, content, repository data, generated inventories, and prior evidence. It may establish source-visible facts and expectations, but it cannot claim rendered, browser, network, authentication, analytics-delivery, hosted, accessibility-assistive-technology, offline-transition, or measured-performance behavior.
2. **Protected Runtime lane** — may gather browser, protected-route, authentication, consent, cross-browser, accessibility, analytics, offline, runtime-error, and performance evidence only after the exact operation has current-session user authorization and the enabled pre-execution hook permits it. A denial is evidence, not a reason to retry or bypass the hook.

The audit does not modify `site/**`, application data, databases, authentication state, deployment configuration, or production files. Any proposed product remediation is a separate handoff requiring its own approved implementation scope.

## Goals and Non-Goals

### Goals

- Build a canonical inventory of every route, discoverable dynamic instance, visible shared shell, state, journey, link, form, asset, copy occurrence, metadata record, analytics event, and security/privacy message.
- Expand applicability into one deterministic Coverage Matrix row per Occurrence.
- Produce exactly one terminal Occurrence Finding for every matrix row, including conforming rows.
- Retain all provenance, authorization, conflict, exclusion, gap, and duplicate relationships.
- Support resumable, bounded execution at a matrix size that may reach millions of rows.
- Deliver replacement-ready English copy and accountable Hindi review notes.
- Prove completion with computed closure invariants rather than narrative claims.

### Non-Goals

- Product-code, CSS, schema, content, route, or configuration changes.
- Database mutation, deployment, external-service mutation, or production filesystem writes.
- Browser, test, build, gate, performance, hosted, analytics, or protected-route execution during design generation.
- Legal approval, Hindi translation approval, accessibility certification, or ownership/licensing assertion from incomplete evidence.
- Sharing components, helpers, CSS, geometry, findings, or ownership between Planner and Studio.

## Design Principles

1. **Source before documentation:** source conflicts are preserved, and live source controls canonical inventory.
2. **No silent reduction:** applicability rules may mark a tuple not applicable with rationale; they may not sample it away.
3. **Evidence before conclusion:** expectations, observations, and conclusions are distinct records.
4. **Authorization is data:** each protected operation carries authorization and hook state; missing authorization yields a terminal `not-run` or `blocked` finding, never a pass.
5. **Occurrence identity is immutable:** duplicate grouping reduces remediation work, not evidence rows.
6. **Fork boundaries are ownership boundaries:** Planner and Studio receive separate inventories, occurrences, findings, handoffs, and likely-source recommendations.
7. **Generated evidence is reproducible:** every generated artifact records input hashes, tool version, run ID, and schema version.
8. **Completion is machine-checkable:** closure depends on set equality, mandatory-field validation, terminal-state predicates, and count reconciliation.

## Architecture

```text
Repository source and approved evidence
  ├─ Route/source adapters
  ├─ Dynamic-instance source adapters
  ├─ Shell/state/journey extractors
  ├─ Link/form/asset/copy/SEO/analytics/message extractors
  └─ Existing-tool adapters
                    │
                    ▼
        Canonical inventory reconciler
        ├─ normalization
        ├─ provenance union
        ├─ conflict ledger
        └─ exclusions / coverage gaps
                    │
                    ▼
        Applicability and profile registry
                    │
                    ▼
       Deterministic occurrence expander
                    │
                    ▼
              Coverage Matrix
       ┌────────────┴────────────┐
       ▼                         ▼
Static Inspection lane    Protected Runtime lane
       │                  (authorization gate first)
       └────────────┬────────────┘
                    ▼
          Evidence normalization
                    │
                    ▼
       Occurrence findings + defects
       ├─ severity calibration
       ├─ duplicate grouping
       ├─ copy/Hindi finalization
       └─ remediation handoffs
                    │
                    ▼
       Completion proof and run manifest
```

## Components and Interfaces

| Component | Responsibility | Inputs | Outputs |
|---|---|---|---|
| Source Registry | Declares every evidence source and authority rank | Source adapters, tool catalog | Versioned source descriptors |
| Route Tree Collector | Discovers all App Router `page.tsx`, layouts, boundaries, redirects, and visible shells | `site/app/**`, source imports | Route and shell candidates |
| Dynamic Instance Resolver | Unions static declarations, repository data, route contracts, internal links, and authorized runtime discoveries | Parameter adapters | Canonical concrete URLs with provenance |
| Dimension Extractors | Inventory links, forms, assets, copy, metadata, events, messages, states, and journeys | Route and component source graph | Typed inventory records |
| Reconciler | Normalizes identifiers, merges duplicate discoveries, records conflicts, gaps, and exclusions | Candidate records | Canonical inventories |
| Applicability Engine | Declares state/profile/access/language/dimension applicability with rationale | Inventory and profile registries | Applicability records |
| Occurrence Expander | Produces exact tuples without representative substitution | Canonical inventory + applicability | Coverage Matrix |
| Authorization Gate | Evaluates requested protected operation before execution | Operation request, user authorization, hook decision | Authorization Evidence or blocked/not-run record |
| Evidence Ingestor | Validates static and runtime evidence envelopes | Raw/manual/tool evidence | Normalized Evidence Records |
| Finding Engine | Requires one terminal finding per occurrence | Coverage rows + evidence | Occurrence Findings and Defect Findings |
| Grouping and Severity Engine | Links common causes and applies deterministic priority | Defects | Duplicate groups and calibrated order |
| Content Proposal Editor | Produces final English wording and Hindi review notes | Copy-related defects, product facts | Replacement-ready proposals |
| Handoff Builder | Converts defects/groups into bounded implementation work | Findings and dependencies | Remediation Handoffs |
| Wave Controller | Enforces entry, exit, invalidation, and resumability | Run state and manifests | Wave checkpoints |
| Completion Prover | Computes closure and reconciliation invariants | All canonical artifacts | Completion proof |

## Canonical Identity and Normalization

### Stable Identifiers

Identifiers are derived from canonical fields and a schema-versioned hash; display labels never participate in identity.

- `routeId`: route pattern plus route-tree ownership.
- `instanceId`: normalized concrete URL plus `routeId`.
- `shellId`: source path plus exported shell/boundary role.
- `inventoryId`: inventory kind plus canonical owner and locator.
- `occurrenceId`: `sha256(routeOrShellId, concreteUrl, stateId, viewportId, browserId, accessId, languageId)`.
- `findingId`: `F-${occurrenceId}`; each Coverage Matrix row owns exactly one aggregate Occurrence Finding, while dimension-level conclusions are Evidence Records referenced by that finding.
- `duplicateGroupId`: root-cause signature generated only after evidence supports grouping.
- `runId`: immutable timestamp plus repository revision and configuration hash.

URL normalization removes duplicate slashes, normalizes trailing-slash policy, sorts semantically unordered query parameters, preserves meaningful query values, normalizes percent encoding, and resolves internal URLs against `http://localhost:3000` only for comparison. It does not follow redirects during Static Inspection. Fragment identifiers are retained as target dimensions.

## Data Models

The audit support implementation should use TypeScript schemas with runtime validation. These interfaces describe the contract; they are not product-code changes.

```ts
export type ProductSurface =
  | "marketing"
  | "catalog-configurator"
  | "portal-dashboard"
  | "authentication"
  | "legal"
  | "administration"
  | "planner"
  | "studio"
  | "offline"
  | "shared-shell";

export type EvidenceLane = "static-inspection" | "protected-runtime";
export type ResultClassification =
  | "conforming"
  | "nonconforming"
  | "blocked"
  | "not-run"
  | "not-applicable"
  | "requires-owner-decision";
export type Severity = "critical" | "high" | "medium" | "low" | "advisory";

export interface ProvenanceReference {
  sourceId: string;
  sourceKind: "source" | "repository-data" | "contract" | "internal-link" | "tool" | "runtime" | "human-review";
  location: string;
  discoveredAt: string;
  contentHash?: string;
  authorityRank: number;
}

export interface CanonicalRouteRecord {
  routeId: string;
  pattern: string;
  concreteUrl?: string;
  routeKind: "static" | "dynamic" | "dynamic-instance";
  productSurface: ProductSurface;
  status: "active" | "redirected" | "absent" | "legacy" | "local-only" | "protected" | "unreachable";
  sourcePath: string;
  provenance: ProvenanceReference[];
  conflictIds: string[];
  exclusionId?: string;
  coverageGapIds: string[];
}

export interface ApplicabilityProfile {
  subjectId: string;
  states: string[];
  viewports: string[];
  browsers: string[];
  accessContexts: string[];
  languages: Array<"en" | "hi">;
  dimensionIds: string[];
  rationales: Record<string, string>;
}

export interface CoverageMatrixRow {
  occurrenceId: string;
  routeId?: string;
  shellId?: string;
  concreteUrl: string;
  productSurface: ProductSurface;
  stateId: string;
  viewportId: string;
  browserId: string;
  accessContextId: string;
  languageId: "en" | "hi";
  applicableDimensionIds: string[];
  waveId: string;
  status: "pending" | ResultClassification;
  findingId?: string;
  inputFingerprint: string;
  invalidatedAt?: string;
}

export interface AuthorizationEvidence {
  operationId: string;
  exactOperation: string;
  authorizationStatement: string;
  authorizedInCurrentSession: boolean;
  repositoryRoot: string;
  hookName: string;
  hookDecision: "permit" | "deny" | "not-observed";
  requestedAt: string;
  executedAt?: string;
  exitStatus?: number;
  outputLocations: string[];
  limitations: string[];
}

export interface EvidenceRecord {
  evidenceId: string;
  findingId: string;
  occurrenceId: string;
  route: string;
  concreteUrl: string;
  productSurface: ProductSurface;
  stateVariant: string;
  viewportProfile: string;
  browserProfile: string;
  accessContext: string;
  languageContext: "en" | "hi";
  auditDimension: string;
  expectedResult: string;
  observedResult: string;
  claimBasis: "source-observed" | "source-inferred-expectation" | "runtime-observed";
  resultClassification: ResultClassification;
  severity: Severity | "not-applicable";
  severityRationale: string;
  decidingSeverityDimension?: string;
  userImpact: string;
  evidenceLane: EvidenceLane;
  evidenceType: string;
  sourceOrRuntimeLocation: string;
  capturedAt: string;
  reproductionSteps: string[];
  evidenceReferences: string[];
  requirementIds: string[];
  journeyIds: string[];
  shellIds: string[];
  relatedFindingIds: string[];
  duplicateGroupId?: string;
  proposedOutcome: string;
  finalProposedWording?: CopyProposal;
  likelyOwner: string;
  dependencies: string[];
  authorization?: AuthorizationEvidence;
  verificationMethod: string;
  blockedBy?: string[];
  notApplicableRationale?: string;
}

export interface CopyProposal {
  currentText: string;
  finalEnglishText: string;
  placement: string;
  intent: string;
  applicableState: string;
  preservedFacts: string[];
  hindiNote: {
    translationRequired: boolean;
    approvedHindiText?: string;
    translationOwner: string;
    humanReviewRequired: boolean;
    reviewNotes: string;
  };
}
```

### Specialized Inventories

Each specialized inventory has a stable `inventoryId`, owner, source locator, provenance list, applicable occurrence selector, and status.

- **State Inventory:** default, loading, skeleton, empty, populated, success, validation-error, authentication-required, forbidden, not-found, rate-limited, conflict, stale, server-error, offline, degraded, recovery, and explicitly inapplicable states.
- **Journey Inventory:** graph nodes, transitions, entry conditions, access/surface boundary contracts, preserved context, recovery edges, and terminal outcome or gap.
- **Link Inventory:** source occurrence selector, visible label, accessible name expectation, raw and normalized target, type, fragment, download declaration, ownership, protocol, opening behavior, security attributes, and expected destination.
- **Form Inventory:** form, fields, controls, labels, instructions, required state, purpose, defaults, validation rules/timing, submission action, destructive consequence, and terminal outcomes.
- **Asset Inventory:** reference, ownership/provenance state, file type, dimensions, ratio, loading strategy, alternative/decorative treatment, transcript/caption/control requirements, product-fact relationship, and fallback.
- **Copy/IA Inventory:** text role, English/Hindi source, hierarchy position, audience, business facts, legal references, duplicate concept, action binding, and state.
- **SEO Inventory:** title, description, canonical, robots, language, Open Graph/social values, icons, sitemap membership, Structured Data nodes, indexing policy, and visible-content correspondence.
- **Analytics/Consent Inventory:** event name, trigger, purpose, payload fields and sensitivity, consent predicate, journey, route attribution, uniqueness rule, and user-visible preference controls.
- **Security/Privacy Message Inventory:** message category, audience, timing, consequence, recovery, policy target, personal-data purpose/retention disclosure, and non-disclosure requirement.
- **Error/Recovery Inventory:** error, loading, not-found and offline boundaries; logging paths; recovery controls; source-visible exposure risks; and affected journeys.

## Inventory Discovery and Reconciliation

### Route and Shared-Shell Discovery

The collector walks the live App Router source and records all page patterns, layouts, templates, loading boundaries, error boundaries, not-found boundaries, visible providers, headers, footers, banners, dialogs, consent controls, and offline shells. Route groups are omitted from URL construction but retained in ownership provenance. Redirect-only routes remain inventory items with redirect status.

Documentation and generated route maps are comparison sources, never canonical substitutes. A disagreement produces a conflict record containing both claims, authority ranks, and the selected source claim.

### Dynamic Instance Discovery

For each dynamic route, parameter adapters run conceptually in this order:

1. static generation declarations and route-local constants;
2. repository-owned data and mode-aware read paths, read-only only;
3. route contracts and typed identifier definitions;
4. internal link targets and sitemap declarations;
5. prior generated inventories with recorded revision;
6. separately authorized runtime/API discovery.

The resolver unions normalized concrete URLs and retains all provenance. It never inserts placeholder examples such as `demo-plan` or `sample-product` as discovered instances unless a source proves that they are real user-visible instances. Inaccessible datasets produce a Coverage Gap tied to the unresolved parameter domain.

Dynamic discovery is rerunnable. New instances increment the inventory generation, invalidate downstream occurrence partitions for the affected route, and leave unaffected partitions valid.

### Occurrence Expansion

The Applicability Engine computes the exact product of declared dimensions:

```ts
occurrences(subject) =
  applicableStates(subject)
  × applicableViewports(subject)
  × applicableBrowsers(subject)
  × applicableAccessContexts(subject)
  × applicableLanguages(subject)
```

Dimensions that truly do not apply are represented by applicability decisions with evidence and rationale; they are not omitted. Dimension-specific inventories, such as links and form states, bind to each matching occurrence. Representative sampling is allowed only as a tool execution optimization and never changes the canonical matrix.

### Required Profile Registries

Wave 0 freezes versioned registries before occurrence evaluation:

- viewport width, height, orientation, DPR, input mode, zoom, and safe-area assumptions;
- browser family/version, engine, OS, assistive technology, and support status;
- access contexts: guest, customer, staff, administrator, expired session, insufficient role, and development bypass;
- language contexts: English and Hindi applicability;
- performance profiles: network, device, cache, viewport, browser, fixture, runs, percentile, and budgets.

Changing a registry creates a new configuration hash and invalidates only occurrences derived from the changed profile.

## Evidence Lanes and Authorization Gate

### Static Inspection Lane

Permitted claims include source existence, route pattern, import/reference relationships, literal or translated copy, metadata declarations, source-visible boundaries, static links, asset references, configuration, and source-visible risk. Static evidence may say “the source declares” or “the source implies an expectation.” It may not say a route rendered, a request succeeded, a control was reachable, analytics was suppressed, a browser behaved consistently, an assistive technology announced content, an offline transition recovered, or a performance budget passed.

### Protected Runtime Lane

Every protected operation is registered before invocation with its exact command or browser action, target environment, affected occurrence IDs, credentials/fixtures required, expected outputs, and data-sensitivity controls. Execution requires both:

1. an explicit current-session user authorization naming the exact operation; and
2. a permitting decision from the enabled pre-execution hook.

Tests, gates, builds, browser runners, performance tools, hosted inspection, protected-route access, analytics inspection, deployment, database actions, backups, and local service commands remain protected. Authorization for one operation does not authorize a related command, another browser profile, another credential, or a retry. A denied operation is not retried, bypassed, weakened, or rewritten to evade the hook.

Without both conditions, affected rows receive `not-run` or `blocked`, exact pending-operation text, missing permission/fixture/credential/environment, and a non-runtime conclusion. Runtime evidence is accepted only when its Authorization Evidence references the same operation and occurrence selector.

## Dimension Evaluation Design

### Links and Navigation

Static extraction finds anchors, router calls, menu models, breadcrumb definitions, button-as-navigation actions, telephone/email targets, downloads, fragments, and external destinations across route and shared component source. Internal targets are normalized and compared to the canonical route/redirect inventory. Fragment IDs are checked statically where present and at runtime only when authorized. External availability is never inferred from source; ownership, protocol, opening behavior, and security attributes can still be recorded statically.

Journey graphs connect entry, transition, access boundary, product-surface boundary, recovery, cancellation, back behavior, and terminal outcome. Cross-surface edges record destination, context-transfer contract, and owner. Cross-access edges record authentication, authorization, return path, and preserved context.

### States, Runtime Errors, and Offline

Every route, data region, form, and shell receives an explicit state applicability set. Runtime transition checks are separate occurrences or dimension evidence, not annotations on the default state. Error evidence captures reproduction, expected/observed behavior, failed resources, recovery, retained input, stale-message removal, repeated failure, and exposure of sensitive detail. Offline inventory covers `/offline`, transition into offline state, queued or unavailable actions, reconnect, and post-reconnect state; runtime transition claims require authorization.

### Responsive and Cross-Browser

Profiles cover reflow, overflow, clipping, overlap, truncation, sticky positioning, viewport units, safe areas, orientation, zoom, input mode, and modal/menu/drawer/table/canvas/toolbar/form reachability. Results are keyed to the exact browser and viewport profile. No profile inherits conformance from another profile.

### Accessibility

Each occurrence maps applicable WCAG 2.2 AA criteria and records semantic, keyboard/focus, visual, pointer, motion/timing, text alternative, caption, instruction, error, autocomplete, language, status, and assistive-technology evidence. Automated output is only one evidence source. Keyboard and assistive-technology journeys require authorized runtime evaluation and human review. Planner and Studio canvas actions require equivalent-outcome evaluation independently; a conforming action in one fork is not evidence for the other.

### Visual and Design-System Consistency

Static evidence maps source-visible tokens, components, icons, and FOCSS zones; authorized visual evidence evaluates computed and rendered treatments. Equivalent components are compared by semantic role. A divergence is a defect only when no documented semantic reason exists. New-pattern handoffs name the semantic purpose and closest existing pattern, but never recommend Planner importing Studio, Studio importing Planner, cross-zone CSS, or shared geometry helpers.

### Forms and Transactions

Forms are expanded by state, profile, access, and language. Runtime checks cover keyboard, touch, pointer, autofill, paste, password manager, validation timing, focus movement, pending/duplicate submission, success navigation, failed-submit preservation/retry, sensitive-data handling, and destructive-action confirmation/cancellation. Static evidence defines expected contracts only.

### Assets and Media

The asset inventory records every user-visible media reference and document. Existence, type, source reference, declared dimensions, ratios, loading configuration, alternatives, captions, controls, motion handling, and duplication can be inspected statically where available. Render quality, layout stability, media failure, and reduced-motion behavior require runtime evidence. Unknown licensing/provenance produces a Coverage Gap.

### Copy, Information Architecture, and Localization

Copy review covers headings, labels, body text, calls to action, helper text, errors, confirmations, tooltips, empty states, metadata, consent/security messages, and legal references. Every copy defect receives complete final English text—not an editing instruction—plus placement, intent, state, and preserved facts. INR, product data, legal meaning, and business intent are cited as constraints.

A Hindi Note is mandatory for every copy defect. It either contains already approved Hindi wording with its approval reference or names the translation owner, states that human review is required, and explains context. Machine-generated Hindi is never labeled approved.

### Metadata, Search Presentation, and Structured Data

Every applicable route instance receives a metadata conclusion for title, description, canonical, robots, language, social metadata, icons, sitemap, and Structured Data. Canonical and sitemap values are normalized against route and redirect inventories. Protected, transactional, offline, error-only, Planner, and Studio routes require explicit indexing policy and rationale. Unsupported material claims are defects; wording defects receive English proposals and Hindi Notes where localization applies.

### Analytics, Consent, Security, and Privacy

Source inspection inventories consent controls and event declarations. Runtime delivery/suppression is protected. Consent states are separate occurrences: undecided, accepted, rejected, customized, withdrawn, and unavailable. Runtime evidence must establish event uniqueness, timing, route attribution, payload minimization, preference persistence, future suppression, and confirmation without exposing secrets or personal data in artifacts.

Security/privacy review records visible claims and source contracts but does not issue legal conclusions. Messages are checked for purpose, consent, retention reference, policy target, consequence, recovery, return-path preservation, unsaved-work handling, scope of sharing/export/deletion/upload, and non-disclosure.

## Existing Audit Tool Strategy

Existing tools are registered before use with scope, inputs, outputs, supported profiles, known omissions, authorization class, last observed execution state, and artifact schema. Their outputs are ingested through adapters; tools do not write directly into canonical records.

| Existing capability | Reuse | Known residual scope |
|---|---|---|
| `scripts/generate-site-ui-route-matrix.mjs` / `site-ui:matrix` | Seed source-visible page patterns and layout dialect evidence | Filters route roots, focuses homepage dialect, does not enumerate all admin/fork/shared-shell/state/dynamic-instance occurrences |
| `tech-docs-generator/scripts/extract-routes.mjs` as consumed by page audit | Seed route pattern candidates | Route extraction is not dynamic-instance, state, or occurrence closure |
| `scripts/site-page-audit.mjs` | Adapter for authorized viewport screenshots, basic semantic/layout signals, auth-mode labels, and route outcome classification | Chromium-only, selected samples/placeholders, limited state/access/language/AT coverage; browser execution is protected |
| `scripts/responsive-audit.mjs` | Adapter for authorized responsive observations and screenshots | Hard-coded route/sample/profile sets; not exhaustive; Chromium runtime is protected |
| `scripts/marketing-ui-audit.mjs` | Adapter for authorized marketing screenshots, runtime errors, failed assets, and selected interactions | Marketing-only, fixed routes/viewports, consent preconfiguration, no complete state/cross-browser matrix |
| `scripts/generate-sitemap-csv.ts` and sitemap source | Seed route-instance and SEO comparison candidates | Sitemap inclusion is not proof of live route or metadata correctness |
| `scripts/general/generate-route-index.mjs` | API-contract context for dynamic discovery and journey dependencies | Inventories API handlers, not user-facing page completeness |
| `check:site-ui*`, i18n parity, icon/style checks, and existing Playwright specs | Map authorized results to precise dimensions and occurrences | Test-like/protected when applicable; representative checks leave residual rows open |

Extension proceeds in three stages, each requiring separately approved audit-tooling scope:

1. **Adapters first:** parse existing output without modifying the tool; record unsupported fields as gaps.
2. **Shared audit schema second:** add non-product tooling under a dedicated audit-support location only after ownership approval, preserving existing outputs.
3. **Tool enhancement last:** extend an existing tool only when its owner, command authorization class, output compatibility, and residual manual work are documented.

No extension may broaden a command silently, replace a static tool with browser execution, or claim exhaustive coverage from route samples. Existing scripts are not executed by this design phase.

## Planner, Studio, Admin, Auth, and Offline Boundaries

- Planner `/ooplanner`, each discovered Planner project instance, Planner shells, Planner access modes, and Planner states receive `productSurface: "planner"`.
- Studio `/oostudio`, Studio shells, Studio access modes, and Studio states receive `productSurface: "studio"`.
- Duplicate symptoms may share a conceptual defect category, but Planner and Studio occurrence findings, duplicate groups, owners, likely source paths, and handoffs remain separate. No recommendation crosses `site/**/Planner/**`, `site/**/Studio/**`, `site/focss/planner/**`, or `site/focss/studio/**` boundaries.
- Admin routes are retained even when credentials are unavailable. Guest redirect evidence never closes administrator occurrences.
- Real authenticated, insufficient-role, expired-session, and `DEV_AUTH_BYPASS=1` contexts are separate profiles. Bypass evidence cannot stand in for hosted authentication.
- Offline route source, offline state, transition, reconnection, and recovery are separate evidence targets.

## Severity and Duplicate Grouping

### Severity Decision

Severity inputs are independently recorded: user impact, affected audience, Primary Journey criticality, data sensitivity, legal/consent exposure, occurrence count, recoverability, and workaround quality. The highest supported class wins, and the deciding dimension is stored.

- **Critical:** unauthorized disclosure/action, unrecoverable data loss, total primary-journey failure, or immediate material legal/consent exposure.
- **High:** primary journey blocked for an affected group, substantial accessibility barrier, materially misleading commercial statement, or sensitive exposure below Critical.
- **Medium:** impaired secondary journey, recoverable functional failure, repeated responsive/cross-browser failure, or significant content/metadata defect.
- **Low:** localized visual, wording, consistency, minor accessibility, or low-impact interaction defect.
- **Advisory:** supported improvement opportunity without a verified contract failure.

Insufficient evidence yields `requires-owner-decision`, not guessed severity. Ordering is severity, Primary Journey impact, affected occurrence count, dependency order, then stable identifier.

### Duplicate Groups

Grouping requires a supported root-cause signature: owner surface, likely source area, violated contract, and matching failure mechanism. Grouping never deletes or replaces Occurrence Findings. Planner and Studio are never placed in the same implementation duplicate group. Shared-shell defects may group many occurrences only when each retains occurrence-specific evidence and impact.

## Controlled Audit Waves

| Wave | Scope | Entry criteria | Exit criteria | Owned outputs | Authorization |
|---|---|---|---|---|---|
| 0 | Inventory, glossary, profiles, authorization state, schemas, matrices | Repository revision recorded; source roots available | 100% discovered items classified; profiles frozen; schemas valid; initial matrix generated | Run manifest, source/tool registries, canonical inventories, profile registries, matrix generation 1 | Static inspection only; no protected execution |
| 1 | Shared shells, routes, links, global navigation, auth/legal/consent/offline foundations | Wave 0 closed | Every Wave 1 item has terminal static conclusion/gap/pending runtime operation | Shell/link/message/state inventories, foundational findings | Runtime portions only with exact authorization + hook permit |
| 2 | Marketing, catalog/configurator, portal/dashboard, Primary Journeys | Wave 1 dependencies resolved or recorded | All scoped journeys terminal or gap; all scoped occurrences terminal | Journey/copy/form/asset/SEO findings | Same gate per exact operation |
| 3 | Administration, Planner, Studio, protected access, specialized states | Required fixtures and ownership recorded | All rows terminal; fork ownership and access-context separation proven | Specialized inventories and findings | Protected access never inferred; exact authorization required |
| 4 | Responsive, cross-browser, accessibility, runtime errors, analytics, performance | Profiles/budgets frozen; operations registered | Every selected operation has Authorization Evidence and result, or every affected row has exact blocked/not-run status | Runtime evidence partitions | Exact current-session authorization and hook permit for each operation |
| 5 | Reconciliation, duplicate linking, severity, copy, gaps, handoffs, proof | Waves 0–4 terminal; latest inventory generation propagated | All closure invariants pass; every defect/group has handoff; all gaps classified | Final findings, copy proposals, handoffs, completion proof | Static reconciliation; any new runtime request returns to Wave 4 gate |

If an upstream wave changes inventory or applicability, downstream rows with matching dependency fingerprints become invalidated. A wave cannot close until all owned items are terminal; `blocked`, `not-run`, `not-applicable`, and `requires-owner-decision` are terminal only when their conditional fields are complete.

## Artifact Ownership and Placement

| Artifact class | Placement | Owner/state |
|---|---|---|
| Spec requirements/design/tasks | `.kiro/specs/site-ui-content-links-audit/` | Authored workflow artifacts |
| Agent-authored audit decisions, copy review, gap analysis, and remediation handoffs | `agents-work/site-ui-content-links-audit/<report-type>/` | Authored, reviewable work product |
| Machine-generated inventories, matrices, normalized tool output, screenshots, traces, metrics, and completion proof | `results/site-ui-content-links-audit/<runId>/<purpose>/` | Generated evidence with manifest |
| Product source | `site/**` | Read-only for the audit; prohibited output destination |
| Hard blocker | Root `Failures.md` only when separately authorized and supported by reproducible evidence | Canonical blocker location; no duplicate ledger |

The run manifest references authored decisions and generated evidence without copying either into the other tree. No report is written to `results/` by hand, no audit output is written under `site/`, and no competing plan or blocker ledger is created.

Recommended generated partitions are newline-delimited JSON or Parquet for large tables, plus small JSON manifests and CSV review views. CSV is a projection, never the canonical data store.

## Resumability and Scale Controls

1. **Immutable inputs:** each run records repository revision, configuration hash, schema version, source hashes, and tool versions.
2. **Partitioning:** matrix/evidence is partitioned by wave, product surface, route hash prefix, and profile group.
3. **Idempotent writes:** records use stable IDs and content hashes; reruns upsert identical evidence and append changed evidence with supersession links.
4. **Checkpoints:** each partition has `pending`, `leased`, `complete`, `blocked`, or `invalidated` state plus heartbeat and owner.
5. **Safe resume:** stale leases return to pending; completed partitions are skipped only when input fingerprints match.
6. **No sampling closure:** execution batches limit work size, not coverage. Unexecuted rows remain explicit.
7. **Bounded concurrency:** one writer per partition; Planner, Studio, admin, and shared-shell partitions do not share mutable output files.
8. **Backpressure:** capture-heavy evidence has quotas and retention policy; textual records are written before optional screenshots/traces so failures remain diagnosable.
9. **Secret/PII controls:** redact tokens, cookies, personal data, and payload values before persistence; store only minimum evidence needed.
10. **Deterministic merge:** sorted stable IDs and authority rules produce the same canonical result regardless of adapter order.
11. **Inventory generations:** additions create delta rows and invalidate only dependent partitions.
12. **Review queues:** owner decisions, Hindi review, legal/content review, and provenance uncertainty are explicit queues with IDs, not free-text TODOs.

## Error Handling

| Failure | Handling |
|---|---|
| Source unreadable or malformed | Record adapter error and Coverage Gap; continue independent sources |
| Dynamic data source unavailable | Preserve dynamic route; create unresolved-instance-set gap |
| Conflicting evidence | Preserve both records, select higher authority, create conflict record |
| Schema validation failure | Quarantine record; partition cannot close |
| Missing authorization | Emit `not-run` with exact pending operation |
| Hook denial | Preserve denial Authorization Evidence; do not execute or retry |
| Credential/fixture absent | Emit `blocked` with affected occurrences and prerequisite |
| Runtime output partial | Map completed evidence; leave remaining rows pending/blocked, never infer |
| Tool crash | Preserve stderr/exit metadata only if execution was authorized; tool scope remains uncovered |
| Sensitive evidence detected | Quarantine/redact, restrict reference, assign severity from impact; do not duplicate raw value |
| Inventory changes mid-wave | Increment generation and invalidate dependent downstream partitions |
| Duplicate-group uncertainty | Keep findings independent and mark owner decision |
| Hindi approval unavailable | Provide translation owner/review note; do not invent approval |
| Unknown asset provenance | Coverage Gap, not ownership claim |

## Remediation Handoff Contract

One handoff is produced per Defect Finding or supported duplicate group and contains:

- handoff ID; Finding IDs; duplicate-group ID; affected Occurrence selectors and counts;
- problem statement, evidence summary, root-cause hypothesis, expected outcome, and proposed behavior;
- final English wording and Hindi Note when applicable;
- owning Product Surface and likely source areas, with Planner/Studio paths strictly separated;
- Shared Shell impact, dependencies, migration need, asset need, content/legal/Hindi review need, and authorization need;
- acceptance checks for default and every applicable state, viewport, browser, access, and language context;
- related journeys, regression risk, rollout considerations, rollback considerations, and verification method;
- explicit statement that product-code modification is separate implementation work requiring approved scope.

Likely source areas are hypotheses, not edit authorization. Handoffs never prescribe cross-fork imports or runtime database mutation.

## Testing Strategy

No tests, browser tools, builds, gates, or protected commands are executed while creating this design. Future audit-program validation uses a dual approach only after the relevant command is explicitly authorized where required.

### Static Schema and Example Validation

- schema examples for every record type and conditional field;
- golden fixtures for route normalization, route-group handling, redirects, fragments, downloads, external links, and source conflicts;
- example wave manifests for denied authorization, missing credentials, partial tool output, and inventory invalidation;
- review checklists for IA, legal-message boundaries, copy fact preservation, Hindi ownership, and asset provenance.

### Property-Based Validation

Pure transformations—normalization, union/deduplication, occurrence expansion, authorization classification, schema validation, severity ordering, grouping preservation, wave closure, and completion arithmetic—should use at least 100 generated cases per property. Each test name must include:

`Feature: site-ui-content-links-audit, Property N: <property title>`

### Integration and Human Validation

Browser, cross-browser, accessibility/assistive-technology, auth, consent, analytics, offline, runtime-error, and performance checks are integration or expert-review activities. They are not replaced by PBT and remain protected runtime work where applicable.

## Correctness Properties

*A property is a behavior that must hold across all valid audit inputs. These properties cover deterministic audit-program logic; they do not claim that external browsers, services, authentication, analytics, or runtime behavior have been exercised.*

### Property 1: Canonical inventory closure

For all discovered route, dynamic-route, dynamic-instance, Shared Shell, and specialized inventory candidates, reconciliation shall produce exactly one canonical record or one explicit Exclusion Record, Coverage Gap, or conflict-linked status, and no canonical record shall remain unclassified.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.4, 2.6, 19.1, 19.2, 19.3, 19.4, 26.1**

### Property 2: Provenance-preserving dynamic-instance deduplication

For any multiset of dynamic-instance discoveries, normalizing and reconciling it in any order shall produce one instance per normalized concrete URL while preserving the union of all discovery sources and a discovery time for every retained instance.

**Validates: Requirements 2.2, 2.3, 2.5**

### Property 3: Exact occurrence expansion and finding bijection

For all inventory subjects and applicability profiles, occurrence expansion shall produce exactly the unique Cartesian product of applicable states, viewports, browsers, access contexts, and languages, and every resulting row shall map to exactly one aggregate Occurrence Finding without substituting another tuple.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 5.8, 7.1, 7.2, 7.7, 9.1, 9.2, 9.7, 10.7, 12.8, 17.3, 19.6, 19.7, 19.8, 26.2, 26.3, 26.4**

### Property 4: Authorization-lane non-escalation

For any evidence or requested operation, static evidence shall never satisfy a runtime claim, and protected work lacking both exact current-session authorization and a permitting hook decision shall remain unexecuted with `blocked` or `not-run`, the exact pending operation, and explicit claim basis.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 15.3, 15.7, 16.7, 17.8, 26.10**

### Property 5: Zero product-code mutation

For any audit run change manifest, every changed path shall be an approved audit artifact or audit-tooling path and no changed path shall be under `site/**` or another product-code boundary.

**Validates: Requirements 4.7, 23.6, 23.7**

### Property 6: Inventory-to-occurrence traceability

For all discovered links, forms, assets, copy items, metadata records, analytics events, consent controls, security/privacy messages, states, and error/recovery controls, each item shall have a canonical inventory record and shall map to every applicable occurrence or to an explicit applicability rationale, gap, or exclusion.

**Validates: Requirements 5.1, 5.2, 7.1, 8.1, 10.1, 11.1, 12.1, 13.1, 14.1, 16.1, 17.1, 17.2, 18.1**

### Property 7: Link normalization and defect generation

For any Link Target, normalization shall be idempotent; internal targets shall compare deterministically with route and redirect evidence; required target fields shall remain complete; and every target classified as missing, malformed, circular, misleading, stale, or journey-inconsistent shall generate a Defect Finding for each affected occurrence.

**Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7**

### Property 8: Journey graph terminality and boundary contracts

For every Primary Journey graph, each entry path shall reach a documented terminal outcome or Coverage Gap, and every access-context or Product Surface crossing shall carry its required authentication, authorization, return-path, preserved-context, destination, transfer, and ownership contract.

**Validates: Requirements 6.1, 6.2, 6.4, 6.5, 6.6, 6.7, 16.5**

### Property 9: Replacement-ready content completeness

For every copy, IA, metadata, security, or privacy Defect Finding, the record shall contain complete final English wording or replacement-ready structure, placement, intent, applicable state, preserved facts, and a Hindi Note containing either approved wording evidence or translation ownership and mandatory human review.

**Validates: Requirements 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 14.6, 18.6, 26.6**

### Property 10: Metadata route consistency

For any canonical route and metadata dataset, normalized canonical and sitemap sets shall be compared deterministically, every applicable route instance shall receive a metadata conclusion, and every specialized protected, transactional, offline, error-only, Planner, or Studio route shall retain an indexing policy and rationale.

**Validates: Requirements 14.2, 14.3, 14.4, 14.5, 14.7, 14.8**

### Property 11: Complete conditional evidence schema

For every Occurrence Finding, all mandatory identity, context, result, provenance, traceability, remediation, ownership, authorization, and verification fields shall validate; blocked/not-run records shall include exact blockers, and not-applicable records shall include a specific rationale.

**Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 26.5**

### Property 12: Severity monotonicity and deterministic ordering

For any Defect Finding and supported severity dimensions, adding a higher-impact dimension shall never reduce severity; the highest supported severity shall be selected with its deciding dimension and rationale, and sorting the same finding set shall always produce the same severity/journey/count/dependency order.

**Validates: Requirements 15.6, 16.4, 17.7, 21.1, 21.2, 21.4, 21.5, 21.6, 21.7, 26.7**

### Property 13: Duplicate grouping preserves occurrence identity and fork ownership

For any supported duplicate group, grouping shall preserve every member Occurrence Finding and its evidence, and no group shall merge Planner and Studio implementation ownership even when symptoms are equivalent.

**Validates: Requirements 19.5, 21.3**

### Property 14: Wave closure and downstream invalidation

For every audit wave, closure shall be rejected unless its entry contract is met and 100 percent of owned items have terminal status; any upstream inventory or profile change shall invalidate or regenerate every dependent downstream row before downstream closure.

**Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 22.9, 26.12**

### Property 15: Remediation handoff completeness

For every Defect Finding or supported duplicate group, exactly one linked handoff shall include affected occurrences, root-cause hypothesis, expected/proposed outcome, ownership, dependencies, review and authorization needs, all applicable acceptance contexts, regression/rollout/rollback considerations, and a separate-implementation authorization statement.

**Validates: Requirements 11.6, 11.7, 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.8, 26.8**

### Property 16: Explicit exclusions and coverage gaps

For every excluded or insufficiently evidenced item, the audit shall retain a complete Exclusion Record or Coverage Gap; visible-scope exclusions shall require an owner decision; and no discovered item or gap shall disappear from completion totals without classification.

**Validates: Requirements 13.7, 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8, 26.9**

### Property 17: Existing tools remain partial evidence

For any Existing Audit Tool and output, every result shall map to exact inventory items and occurrences or an explicit conflict/gap; uncovered rows shall remain in the matrix; higher-authority evidence shall win with conflict provenance; and tool availability or sampled output alone shall never satisfy completeness.

**Validates: Requirements 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7**

### Property 18: Completion proof reconciles all totals

For any audit run declared complete, inventory, matrix, finding, evidence, copy, severity, handoff, exclusion, gap, pending-operation, result-classification, and wave totals shall reconcile to their canonical sets, with zero silent exclusions, zero unclassified inventory items, zero unclassified gaps, and no nonterminal in-scope row.

**Validates: Requirements 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 26.8, 26.9, 26.10, 26.11, 26.12**

## Completion Proof

The Completion Prover emits a signed-by-content manifest, not a subjective summary. It must show:

- discovered and canonical counts by inventory kind and Product Surface;
- dynamic route parameter-source closure and unresolved sets;
- exact occurrence count derived from applicability profiles;
- matrix rows partitioned into conforming, nonconforming, blocked, not-run, not-applicable, and requires-owner-decision;
- one-to-one matrix/finding reconciliation;
- mandatory Evidence Record validation count;
- copy-defect versus English/Hindi proposal count;
- defects versus severity-rationale count;
- defects/groups versus handoff count;
- exclusions, owner decisions, Coverage Gaps, and pending protected operations;
- wave entry/exit status and invalidation generation;
- changed-path manifest proving no product-code modification;
- every runtime claim’s Authorization Evidence and every static-only limitation.

“Complete” means every in-scope item has a valid terminal status and every wave exit criterion is satisfied. It does not mean all runtime checks passed: an audit may be procedurally complete with fully classified blocked or not-run rows, but its summary must state those totals and exact authorization needs prominently.
