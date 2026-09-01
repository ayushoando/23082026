# Requirements Document

## Introduction

The Planner Comprehensive Audit will inspect and remediate the Floor Planner at `/ooplanner` and every Planner project route to the smallest practical, verifiable detail. The work covers user interface, user experience, responsive and accessible interaction, feature behavior, backend services, API contracts, authentication and authorization, database changes, mode-aware data persistence, performance, observability, and repository validation. The audit includes every Planner-owned feature, component, library, hook, store, server, API, platform, and FOCSS area that can affect a covered workflow.

The audit must remediate every verified defect, including minor visual defects, while preserving the product boundary between guest catalog and lead workflows and authenticated owner-scoped project workflows. Repository-side implementation and evidenced Admin database migrations are in scope. Hosted inspection, migration application, deployment, and other protected operations remain subject to separate explicit authorization.

## Glossary

- **Planner Application**: The Floor Planner product surface served from `/ooplanner` and the covered Planner project routes.
- **Planner Project Route**: A route owned by the Planner Application that creates, opens, edits, presents, or manages a floor-planning project.
- **Planner Audit Program**: The repository work that inventories, evaluates, remediates, and documents the Planner Application.
- **Planner Workflow**: A complete user journey through catalog browsing, project creation or loading, floor-plan editing, project saving or deletion, and lead handoff where applicable.
- **Planner-Owned Area**: A Planner feature, component, library, hook, store, server module, API route, platform module, test source, configuration entry, or Planner FOCSS source that affects the Planner Application.
- **Planner API**: A server endpoint owned by the Planner Application, including endpoints under the on-disk `/api/Planner/*` boundary.
- **Planner Persistence Layer**: The mode-aware repository boundary that selects one storage backend for Planner project operations.
- **Admin Database**: The Supabase Postgres project with reference `rxzpznmxbaoxpikowmfc` that owns Planner project data.
- **Project Record**: An owner-scoped persisted Planner project stored in the Admin Database table `oando_plans` or in the approved non-production disk backend.
- **Project Operation**: Listing, loading, saving, or deleting a Project Record.
- **Authenticated Owner**: A signed-in user whose verified server session identifies the owner of a Project Record.
- **Guest User**: A user without a verified authenticated session.
- **Guest Catalog Workflow**: Product and furniture catalog browsing available without authentication.
- **Lead Handoff**: The guest-accessible workflow that submits an inquiry or project-related sales lead without granting Project Operation access.
- **Owner Scope**: The rule that an Authenticated Owner can access only Project Records owned by the same authenticated identity.
- **Development Bypass Mode**: A non-production runtime mode enabled by `DEV_AUTH_BYPASS=1` that permits the approved disk persistence backend.
- **Production Mode**: A deployed runtime mode in which the application filesystem is read-only for Planner project persistence.
- **Exclusive Persistence**: Selection of exactly one persistence backend for each runtime mode, with no write to a second backend for the same Project Operation.
- **Planner Scale**: The Planner geometry conversion ratio of `0.05 px/mm`.
- **Fork Boundary**: The architectural separation that prohibits Planner-owned code and FOCSS from importing Studio-owned code or FOCSS, and prohibits Studio-owned code from importing Planner-owned code or FOCSS.
- **Input Parity**: Availability of equivalent workflow outcomes through pointer, touch, and keyboard input without requiring a device-specific action.
- **Viewport Class**: Desktop, tablet, or phone layout at documented representative viewport dimensions and orientations.
- **Required State Set**: Default, loading, empty, success, validation-error, server-error, unauthenticated, forbidden, rate-limited, conflict, stale, offline, and recovery states applicable to a workflow.
- **WCAG 2.2 AA**: Web Content Accessibility Guidelines version 2.2 conformance level AA.
- **FOCSS**: The repository semantic-token and surface-zone styling layer built on Tailwind CSS v4.
- **Verified Defect**: A reproducible mismatch between observed Planner behavior or source and an applicable requirement, contract, repository rule, or documented product expectation.
- **Audit Finding**: A traceable record containing evidence, affected scope, severity, remediation, and verification status for a Verified Defect or confirmed compliant behavior.
- **Repository-Side Migration**: A versioned Admin Database SQL migration stored under `site/platform/supabase/migrations.admin/` with forward SQL and a `-- rollback` section.
- **Hosted Operation**: An action against a remote database, deployed service, hosted browser surface, production environment, or external provider.
- **Protected Validation**: A test, gate, build, browser runner, coverage command, database dry run, type generation command, deployment, or other command that requires exact current-session user authorization and hook permission.
- **Planner Validation Plan**: The mapping from each Audit Finding to the exact checks, authorization state, execution evidence, and remaining proof required for completion.
- **Cross-Site Request Forgery (CSRF)**: An attack in which a browser is induced to submit an unintended authenticated request; the CSRF policy defines the repository-approved request authenticity controls.
- **Rate-Limit Policy**: The documented request quota, measurement interval, response status, and retry metadata for a Planner API endpoint.
- **Schema Version**: The explicit format version attached to persisted Project Record content.
- **Idempotency Identity**: A request identifier that allows the Planner Persistence Layer to recognize a retried state-changing request and prevent a duplicate effect.
- **Correlation Identifier**: A non-sensitive identifier that links one client-visible operation to related server, API, persistence, log, and metric records.
- **Supported Test Profile**: A documented combination of Viewport Class, input method, browser, device performance, network conditions, project fixture, sampling method, and run count used for repeatable measurement.
- **Largest Contentful Paint**: The elapsed time from route navigation until the largest visible content element renders.
- **Interaction to Next Paint**: The elapsed time from a user interaction until the next visual update.
- **Cumulative Layout Shift**: The aggregate score of unexpected visible layout movement during a page lifecycle.
- **Cold Start**: The first request whose duration includes initialization of an inactive local integration service.
- **Authorization Evidence**: A record of the exact authorized command, repository-root working directory, hook decision, exit status, and relevant output.
- **Representative Project**: A documented Planner project fixture containing at least one room boundary, ten furniture objects, rotation, dimensions, labels, and persisted metadata.

## Requirements

### Requirement 1: Establish exhaustive Planner coverage

**User Story:** As the repository owner, I want a traceable inventory of the Planner surface so that no relevant behavior or source area is omitted from the audit.

#### Acceptance Criteria

1. THE Planner Audit Program SHALL inventory `/ooplanner` and every Planner Project Route found in the live route tree.
2. THE Planner Audit Program SHALL inventory every Planner-Owned Area that affects a covered Planner Workflow.
3. THE Planner Audit Program SHALL trace each covered Planner Workflow from route entry through UI, state management, server boundary, API contract, persistence boundary, and user-visible result.
4. WHEN an inventoried path is absent, legacy, generated, local-only, or unreachable, THE Planner Audit Program SHALL assign the applicable status with source evidence.
5. WHEN documentation conflicts with live repository evidence, THE Planner Audit Program SHALL use live repository evidence as the finding basis.
6. THE Planner Audit Program SHALL link each Audit Finding to the affected route, workflow, source path, requirement, and verification method.

### Requirement 2: Remediate every verified defect

**User Story:** As the repository owner, I want every verified Planner defect corrected so that the audit produces a complete product improvement rather than a partial report.

#### Acceptance Criteria

1. WHEN the Planner Audit Program verifies a defect, THE Planner Audit Program SHALL implement the smallest sound remediation within the affected Planner-Owned Area.
2. WHEN the Planner Audit Program verifies a minor spacing, alignment, typography, icon, color, border, focus, overflow, truncation, or responsive defect, THE Planner Audit Program SHALL remediate the defect.
3. WHEN a remediation affects an adjacent workflow, THE Planner Audit Program SHALL extend the Audit Finding to the affected workflow before completion.
4. IF a Verified Defect cannot be remediated within an authorized repository scope, THEN THE Planner Audit Program SHALL record the exact blocker evidence and required owner decision.
5. THE Planner Audit Program SHALL preserve unrelated repository work during every remediation.
6. THE Planner Audit Program SHALL classify a finding as complete only after the specified verification method produces evidence or is explicitly recorded as pending authorization.

### Requirement 3: Preserve Planner and Studio fork integrity

**User Story:** As a maintainer, I want Planner to remain independent from Studio so that changes cannot create cross-fork behavior or geometry errors.

#### Acceptance Criteria

1. THE Planner Application SHALL use Planner-owned components, libraries, hooks, stores, server modules, APIs, platform modules, and FOCSS sources for Planner behavior.
2. THE Planner Application SHALL maintain the Fork Boundary for source imports and FOCSS imports.
3. THE Planner Application SHALL use the Planner Scale for geometry conversion, rendering, measurement, placement, snapping, serialization, and deserialization.
4. WHEN a measurement is converted from millimetres to pixels, THE Planner Application SHALL produce a pixel value equal to the millimetre value multiplied by `0.05` within the numeric precision of the stored geometry format.
5. WHEN a persisted Planner geometry value is loaded, THE Planner Application SHALL preserve physical dimensions without applying the Studio scale of `0.2 px/mm`.
6. IF a proposed remediation requires Studio-owned code, THEN THE Planner Audit Program SHALL implement an independent Planner-owned equivalent or stop for an owner decision.

### Requirement 4: Provide complete core workflow behavior

**User Story:** As a Planner user, I want each project workflow to behave consistently so that I can complete floor-planning work without dead ends or data loss.

#### Acceptance Criteria

1. WHEN a user enters `/ooplanner`, THE Planner Application SHALL present the correct entry state for the verified authentication state and available project context.
2. WHEN an Authenticated Owner creates a project, THE Planner Application SHALL initialize a valid editable project with the documented default metadata and geometry state.
3. WHEN an Authenticated Owner loads an owned Project Record, THE Planner Application SHALL restore persisted project metadata, geometry, furniture placement, and view-independent content.
4. WHEN an Authenticated Owner saves a valid project, THE Planner Application SHALL persist one coherent project revision through Exclusive Persistence.
5. WHEN an Authenticated Owner confirms project deletion, THE Planner Application SHALL remove the selected owned Project Record and return a deterministic post-delete state.
6. IF an edit action fails, THEN THE Planner Application SHALL retain the last valid in-memory project state and present a recoverable error state.
7. IF unsaved changes exist during a destructive navigation or replacement action, THEN THE Planner Application SHALL request an explicit discard or continue decision.
8. WHEN a recoverable operation succeeds after failure, THE Planner Application SHALL clear the obsolete error state and present the current project state.

### Requirement 5: Cover every applicable user-visible state

**User Story:** As a Planner user, I want explicit feedback for every workflow state so that I understand the current result and available recovery action.

#### Acceptance Criteria

1. THE Planner Application SHALL define each applicable member of the Required State Set for every covered Planner Workflow.
2. WHILE a Project Operation is pending, THE Planner Application SHALL present a loading state that identifies the pending operation.
3. WHEN a project list contains no Project Records, THE Planner Application SHALL present an empty state with an available next action.
4. IF input validation fails, THEN THE Planner Application SHALL identify each invalid field and preserve valid user-entered values.
5. IF the Planner API returns an authentication, authorization, rate-limit, conflict, or server error, THEN THE Planner Application SHALL present the corresponding distinct state.
6. WHILE network connectivity is unavailable, THE Planner Application SHALL preserve unsaved in-memory work and present an offline state.
7. WHEN network connectivity returns, THE Planner Application SHALL offer a deterministic recovery action without silently overwriting a newer Project Record.
8. IF persisted data is stale or conflicting, THEN THE Planner Application SHALL require an explicit reload, retry, or conflict-resolution action.

### Requirement 6: Achieve desktop, tablet, and phone workflow parity

**User Story:** As a user on any supported device, I want the complete Planner workflow available so that device size does not remove required capabilities.

#### Acceptance Criteria

1. THE Planner Application SHALL provide every covered Planner Workflow in desktop, tablet, and phone Viewport Classes.
2. WHEN the available viewport changes size or orientation, THE Planner Application SHALL preserve project content and the active workflow context.
3. WHILE the Planner Application is displayed in a phone Viewport Class, THE Planner Application SHALL keep every required project command reachable without horizontal page scrolling.
4. WHILE the Planner Application is displayed in a tablet Viewport Class, THE Planner Application SHALL prevent panels and dialogs from obscuring the active command without a dismissal control.
5. WHILE the Planner Application is displayed in a desktop Viewport Class, THE Planner Application SHALL maintain usable canvas, panel, toolbar, and dialog regions without unintended overlap.
6. IF a layout cannot display concurrent panels at the current viewport, THEN THE Planner Application SHALL provide a reversible panel switching mechanism.
7. WHEN a modal surface opens in any Viewport Class, THE Planner Application SHALL fit the modal controls within the visual viewport or provide contained scrolling.

### Requirement 7: Provide pointer, touch, and keyboard input parity

**User Story:** As a Planner user, I want equivalent input methods so that I can operate the Planner without depending on a mouse.

#### Acceptance Criteria

1. THE Planner Application SHALL provide Input Parity for every required Planner Workflow outcome.
2. WHEN a pointer drag action changes geometry or placement, THE Planner Application SHALL provide an equivalent touch action and an equivalent keyboard-accessible command.
3. WHEN a user selects, moves, rotates, resizes, duplicates, or deletes an object, THE Planner Application SHALL expose the resulting action through an accessible control or documented keyboard command.
4. WHILE a touch interaction is active, THE Planner Application SHALL prevent browser gestures from replacing only the gesture region required by the Planner action.
5. WHEN a keyboard user traverses interactive controls, THE Planner Application SHALL present a visible focus indicator in logical workflow order.
6. WHEN a keyboard user opens a menu, panel, or dialog, THE Planner Application SHALL move focus into the opened surface and restore focus to the invoking control after closure.
7. IF a multi-pointer gesture is unavailable, THEN THE Planner Application SHALL provide controls for the same zoom, pan, rotate, or scale outcome.

### Requirement 8: Conform to WCAG 2.2 AA

**User Story:** As a user with an access need, I want the Planner to meet WCAG 2.2 AA so that core planning tasks remain perceivable and operable.

#### Acceptance Criteria

1. THE Planner Application SHALL conform to WCAG 2.2 AA across every covered Planner Workflow and applicable Required State Set member.
2. THE Planner Application SHALL provide programmatic names, roles, values, states, and relationships for interactive controls.
3. THE Planner Application SHALL meet WCAG 2.2 AA text, non-text, focus-indicator, and state-indicator contrast thresholds.
4. THE Planner Application SHALL provide text alternatives for meaningful non-text content and decorative treatment for non-informative imagery.
5. THE Planner Application SHALL associate validation messages and instructions with the corresponding controls.
6. WHILE reduced motion is requested, THE Planner Application SHALL suppress non-essential animation without removing workflow feedback.
7. WHEN content is magnified to 200 percent, THE Planner Application SHALL preserve required content and operations without two-dimensional page scrolling except for the planning canvas.
8. IF a timeout can cause loss of Planner work, THEN THE Planner Application SHALL warn the user and provide an extension or recovery path.

### Requirement 9: Maintain FOCSS and visual consistency

**User Story:** As a Planner user, I want a coherent professional interface so that controls and states are predictable across the product.

#### Acceptance Criteria

1. THE Planner Application SHALL use the Planner FOCSS zone and repository semantic tokens for Planner visual styling.
2. THE Planner Application SHALL use the Planner Phosphor icon abstraction for interface icons.
3. THE Planner Application SHALL align icons, labels, controls, and adjacent status indicators to the applicable component pattern.
4. THE Planner Application SHALL use consistent spacing, typography, elevation, border, radius, and state treatments across equivalent controls.
5. WHEN text exceeds an available region, THE Planner Application SHALL preserve the full value through wrapping, expansion, or an accessible disclosure mechanism.
6. WHEN a control is disabled, selected, hovered, focused, pressed, invalid, or busy, THE Planner Application SHALL present the corresponding distinguishable visual state.
7. IF a visual remediation requires a new pattern, THEN THE Planner Audit Program SHALL define the pattern within the Planner FOCSS zone without importing the Studio FOCSS zone.

### Requirement 10: Preserve guest and authenticated access boundaries

**User Story:** As a guest or authenticated customer, I want access appropriate to my identity so that catalog discovery remains open and project data remains private.

#### Acceptance Criteria

1. WHILE a user is a Guest User, THE Planner Application SHALL permit the Guest Catalog Workflow.
2. WHILE a user is a Guest User, THE Planner Application SHALL permit Lead Handoff without granting Project Operation access.
3. WHEN a Guest User requests a Project Operation, THE Planner Application SHALL require authentication before processing the Project Operation.
4. WHEN an Authenticated Owner lists projects, THE Planner Application SHALL return only Project Records within the Authenticated Owner's Owner Scope.
5. WHEN an Authenticated Owner loads, saves, or deletes a Project Record, THE Planner Application SHALL verify Owner Scope on the server before the Project Operation.
6. IF a requested Project Record belongs to a different owner, THEN THE Planner Application SHALL return a forbidden or non-disclosing not-found response according to the documented Planner API contract.
7. IF a client-provided owner identifier differs from the verified server-session identity, THEN THE Planner Application SHALL derive Owner Scope from the verified server-session identity.
8. WHEN an authenticated session expires during a Project Operation, THE Planner Application SHALL preserve unsaved in-memory work and require reauthentication.

### Requirement 11: Enforce explicit Planner API contracts and security controls

**User Story:** As a platform owner, I want each Planner API protected by explicit contracts so that invalid or abusive requests cannot corrupt data or cross authorization boundaries.

#### Acceptance Criteria

1. THE Planner API SHALL define accepted methods, request schema, response schema, status outcomes, authentication policy, authorization policy, CSRF policy, and rate-limit policy for each endpoint.
2. WHEN the Planner API receives a request, THE Planner API SHALL validate path, query, header, and body inputs before invoking persistence.
3. IF request validation fails, THEN THE Planner API SHALL return a structured validation error without invoking persistence.
4. WHEN a state-changing browser request is received, THE Planner API SHALL validate the repository-approved CSRF and origin controls before invoking persistence.
5. WHEN a Project Operation is received, THE Planner API SHALL verify the server session and Owner Scope before invoking persistence.
6. WHEN an endpoint quota is exceeded, THE Planner API SHALL return the documented rate-limit status and retry metadata.
7. IF an unsupported method is received, THEN THE Planner API SHALL return the documented method-not-allowed response.
8. IF an internal failure occurs, THEN THE Planner API SHALL return a non-sensitive error response with a correlation identifier.
9. THE Planner API SHALL exclude server secrets, database credentials, stack traces, and cross-owner data from client responses.

### Requirement 12: Use exclusive mode-aware persistence

**User Story:** As a platform owner, I want one persistence backend per runtime mode so that projects cannot diverge through dual writes or production filesystem access.

#### Acceptance Criteria

1. THE Planner Persistence Layer SHALL select the approved disk backend only while Development Bypass Mode is active in a non-production runtime.
2. THE Planner Persistence Layer SHALL select Admin Database `oando_plans` while Development Bypass Mode is inactive.
3. THE Planner Persistence Layer SHALL select Admin Database `oando_plans` in Production Mode.
4. THE Planner Persistence Layer SHALL use Exclusive Persistence for every Project Operation.
5. WHEN a Project Operation targets the Admin Database, THE Planner Persistence Layer SHALL avoid a corresponding project write to the application filesystem.
6. WHEN a Project Operation targets the approved disk backend, THE Planner Persistence Layer SHALL avoid a corresponding write to Admin Database `oando_plans`.
7. IF runtime mode selection is invalid or ambiguous, THEN THE Planner Persistence Layer SHALL reject the Project Operation with a configuration error.
8. IF the selected persistence backend fails, THEN THE Planner Persistence Layer SHALL report the failure without falling back to a second write backend.

### Requirement 13: Preserve project data integrity and concurrency

**User Story:** As an authenticated project owner, I want project data saved coherently so that retries and concurrent edits do not silently lose work.

#### Acceptance Criteria

1. THE Planner Persistence Layer SHALL validate Project Record identity, owner identity, schema version, metadata, and geometry before persistence.
2. WHEN a valid project save succeeds, THE Planner Persistence Layer SHALL persist a coherent Project Record revision with creation and update timestamps.
3. WHEN an identical save request is retried with the same idempotency identity, THE Planner Persistence Layer SHALL avoid creating a duplicate Project Record or duplicate revision effect.
4. IF a save is based on an obsolete project revision, THEN THE Planner Persistence Layer SHALL return a conflict result without overwriting the newer revision.
5. WHEN a project load succeeds, THE Planner Persistence Layer SHALL return only fields allowed by the Planner API response contract.
6. WHEN project deletion succeeds, THE Planner Persistence Layer SHALL make the deleted Project Record unavailable to subsequent owner list and load operations.
7. IF persisted project content has an unsupported schema version, THEN THE Planner Application SHALL preserve the source record and present a migration or unsupported-version result.
8. WHEN project data crosses the persistence boundary, THE Planner Persistence Layer SHALL preserve Planner Scale geometry without lossy unit conversion.

### Requirement 14: Deliver evidenced Admin database changes

**User Story:** As a database owner, I want repository-side schema changes to be reversible and owner-scoped so that Planner persistence is deployable without weakening data protection.

#### Acceptance Criteria

1. WHEN a Verified Defect requires a database change, THE Planner Audit Program SHALL create a Repository-Side Migration under `site/platform/supabase/migrations.admin/`.
2. THE Repository-Side Migration SHALL target the Admin Database and `oando_plans` ownership boundary.
3. THE Repository-Side Migration SHALL include a `-- rollback` section that reverses the forward schema change.
4. THE Repository-Side Migration SHALL define row-level security policies that enforce Owner Scope for authenticated Project Operations.
5. THE Repository-Side Migration SHALL define the least-privilege grants required by documented Planner operations.
6. THE Repository-Side Migration SHALL preserve existing Project Records or define an explicit deterministic data transformation.
7. WHEN a Repository-Side Migration changes generated database types, THE Planner Audit Program SHALL update the Admin Database type artifact through the repository-approved type-generation workflow after authorization.
8. WHERE a Repository-Side Migration exists, THE Planner Validation Plan SHALL include `pnpm run db:apply:admin -- --dry` before any migration application.
9. WHERE a Repository-Side Migration exists, THE Planner Validation Plan SHALL include `pnpm run db:types:admin` after the migration reaches the authorized environment.
10. IF hosted inspection or migration application lacks separate authorization, THEN THE Planner Audit Program SHALL leave the Hosted Operation unexecuted and record the pending exact action.

### Requirement 15: Preserve catalog browsing and lead handoff

**User Story:** As a prospective customer, I want to browse furniture and hand off a lead without authentication so that project discovery can continue before account creation.

#### Acceptance Criteria

1. WHEN a Guest User browses the catalog, THE Planner Application SHALL expose the product information required by the Guest Catalog Workflow without exposing restricted project data.
2. WHEN a Guest User selects catalog furniture for planning context, THE Planner Application SHALL preserve the selection through the guest-accessible portion of the workflow.
3. WHEN a Guest User submits a Lead Handoff, THE Planner Application SHALL validate required contact, consent, and inquiry fields before submission.
4. IF Lead Handoff validation fails, THEN THE Planner Application SHALL preserve valid entered values and identify invalid fields.
5. WHEN a Lead Handoff succeeds, THE Planner Application SHALL present a confirmation with a stable handoff reference.
6. IF a Lead Handoff fails, THEN THE Planner Application SHALL preserve the draft and present a retry action.
7. THE Lead Handoff SHALL avoid granting access to Project Operations or Project Records.

### Requirement 16: Meet measurable performance budgets

**User Story:** As a Planner user, I want responsive loading and editing so that floor-planning work remains efficient on supported devices.

#### Acceptance Criteria

1. THE Planner Application SHALL achieve Largest Contentful Paint no greater than 2.5 seconds at the 75th percentile for covered route entry measurements in the documented supported test profile.
2. THE Planner Application SHALL achieve Interaction to Next Paint no greater than 200 milliseconds at the 75th percentile for covered non-canvas interactions in the documented supported test profile.
3. THE Planner Application SHALL maintain Cumulative Layout Shift no greater than `0.1` for covered route entry measurements in the documented supported test profile.
4. WHILE a Representative Project is visible, THE Planner Application SHALL render pan, zoom, selection, move, rotate, and resize interactions at a median rate of at least 30 frames per second in the documented supported test profile.
5. WHEN a direct manipulation input begins, THE Planner Application SHALL present visual feedback within 100 milliseconds in the documented supported test profile.
6. WHEN an owner lists, loads, or saves a Representative Project against the authorized local integration environment, THE Planner API SHALL complete the request within 2 seconds at the 95th percentile excluding an explicitly measured cold start.
7. WHEN the same Representative Project is loaded and closed 20 times, THE Planner Application SHALL release project-specific subscriptions and event handlers after each close.
8. IF a performance budget is missed, THEN THE Planner Audit Program SHALL record the measured value, test profile, bottleneck evidence, and remediation status.

### Requirement 17: Provide actionable observability without exposing sensitive data

**User Story:** As an operator, I want Planner failures and performance signals to be diagnosable so that production issues can be traced without exposing customer data.

#### Acceptance Criteria

1. THE Planner Application SHALL emit structured server-side records for Project Operation outcomes with operation name, result class, duration, and correlation identifier.
2. THE Planner Application SHALL emit metrics for Planner API request count, error count, duration, rate-limit outcomes, authorization denials, and persistence failures.
3. WHEN a client-visible Planner error occurs, THE Planner Application SHALL associate the error state with a correlation identifier when a server request exists.
4. WHEN a Project Operation crosses the Planner API and Planner Persistence Layer, THE Planner Application SHALL propagate the correlation identifier across both boundaries.
5. THE Planner Application SHALL exclude contact values, project content, geometry payloads, authentication tokens, cookies, database credentials, and server secrets from logs and metric labels.
6. IF observability export is unavailable, THEN THE Planner Application SHALL preserve the user-facing workflow result and use the repository-approved fallback sink.
7. WHEN an Audit Finding concerns production-only observability, THE Planner Audit Program SHALL distinguish static instrumentation evidence from unverified hosted telemetry.

### Requirement 18: Gate validation and hosted actions by explicit authorization

**User Story:** As the repository owner, I want validation and hosted actions to remain authorization-controlled so that the audit cannot trigger protected operations implicitly.

#### Acceptance Criteria

1. THE Planner Validation Plan SHALL map each Audit Finding to the narrowest repository check that can verify the remediation.
2. WHEN execution of a Protected Validation is requested, THE Planner Audit Program SHALL require exact current-session user authorization and enabled-hook permission for the exact command.
3. WHEN a Protected Validation is authorized and permitted, THE Planner Audit Program SHALL execute the command from the repository root and retain Authorization Evidence.
4. IF a Protected Validation lacks authorization or hook permission, THEN THE Planner Audit Program SHALL record the exact command as pending user validation without claiming a result.
5. THE Planner Validation Plan SHALL include applicable unit, integration, browser, accessibility, responsive, touch, keyboard, API, persistence, migration, type, FOCSS, fork-boundary, performance, and full-gate checks.
6. WHERE Planner or Studio fork trees change, THE Planner Validation Plan SHALL include `pnpm run scan:boundaries`.
7. WHERE Planner FOCSS or Planner UI styling changes, THE Planner Validation Plan SHALL include `pnpm run verify:focss`, `pnpm run lint:ui:strict`, and `pnpm run check:style-tokens`.
8. WHERE repository implementation changes require type validation, THE Planner Validation Plan SHALL include `pnpm run typecheck` and exclude the unavailable `typecheck:scripts` command.
9. IF hosted inspection, migration application, deployment, backup, or production smoke testing lacks separate authorization, THEN THE Planner Audit Program SHALL leave the Hosted Operation unexecuted and identify the pending owner action.

### Requirement 19: Define completion with traceable evidence

**User Story:** As the repository owner, I want a precise completion record so that verified work, pending validation, and hosted limitations cannot be confused.

#### Acceptance Criteria

1. THE Planner Audit Program SHALL maintain an Audit Finding for every verified defect and every audited area with no verified defect.
2. THE Planner Audit Program SHALL classify each Audit Finding as remediated with evidence, remediated with validation pending, blocked with evidence, or compliant with evidence.
3. THE Planner Audit Program SHALL provide a coverage matrix linking routes, Planner-Owned Areas, Planner Workflows, Viewport Classes, input methods, Required State Set members, security controls, persistence modes, and verification evidence.
4. THE Planner Audit Program SHALL distinguish repository-side evidence from browser evidence, integration evidence, hosted evidence, and deployment evidence.
5. THE Planner Audit Program SHALL report each unexecuted Protected Validation with the exact pending command or owner action.
6. THE Planner Audit Program SHALL report each unexecuted Hosted Operation as separately authorized work.
7. THE Planner Audit Program SHALL declare comprehensive remediation complete only when every Verified Defect is remediated or has an evidenced blocker accepted by the repository owner.
8. THE Planner Audit Program SHALL declare full validation complete only when every mandatory authorized check has an observed acceptable result.
