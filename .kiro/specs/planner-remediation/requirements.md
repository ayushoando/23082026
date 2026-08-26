# Requirements: Planner project-load remediation

## Status and source of truth

This is a planning-only remediation spec. It does not implement or execute fixes. It is based on the verified Planner browser audit completed on 2026-08-26 at 1920, 1440, 1078, 768, and 390 CSS pixels.

The audited route surface was:

- `/ooplanner` — blank/new-plan workspace and the verified Draw, Wall, Grid, Snap, Place, Review, BOQ, Layers, Validation, Export, and Save workflows.
- `/ooplanner/projects` — project list, empty-state actions, saved-plan cards, and navigation into an editor.
- `/ooplanner/projects/[id]` — valid saved-plan editor and an invalid `not-a-valid-id` editor path.

The confirmed defect is `/ooplanner/projects/not-a-valid-id`: the API correctly returns `404 {"detail":"Project not found"}`, but the Planner client catches the error, shows a toast, and leaves the normal canvas/workspace visible. Repeated automated project loading also produced `429 Too Many Requests`; that is a request-lifecycle/rate-limit concern, not evidence that a missing project should be treated as found.

Graph evidence used for ownership and scope:

- Import graph: 1,740 files and 3,368 edges.
- Planner domain: 129 files; API domain: 69 files.
- `site/components/Planner/Planner.tsx`: 48 direct dependencies, four impacted Planner page files, and no graph-discovered covering tests.
- `site/app/api/Planner/projects/[id]/route.ts`: four direct dependencies and the covering unit test `tests/unit/app/api/Planner/projects/[id]/route.test.ts`.

## Problem statement

A route-bound Planner must not present an empty or stale canvas as though the requested project loaded successfully. The client needs an explicit load lifecycle, a recoverable invalid-project surface, and request cleanup/deduplication that does not turn transient failures into a retry storm or clear a valid fallback unnecessarily.

The API's existing not-found behavior is correct and remains the contract. The primary remedy belongs in the Planner client and its Planner-only presentation layer.

## Scope and ownership boundaries

In scope:

- Project-load state handling in `site/components/Planner/Planner.tsx`.
- Error/status preservation in `site/lib/Planner/plannerApi.ts` while keeping existing paths and response semantics.
- The recoverable load-state surface owned by the dedicated Planner component `site/components/Planner/PlannerProjectLoadState.tsx`.
- Request cancellation, stale-result protection, and same-project request deduplication for the editor.
- Safe loading/retry behavior for `site/components/Planner/PlannerProjectsList.tsx`, including the observed 429 class of transient failure.
- Planner-only responsive and accessibility styling in existing canonical sheets, primarily `site/focss/planner/workspace-shell.css` and `site/focss/planner/controls.css` after their current rules are checked.
- Focused unit and browser verification instructions for the implementer/user to run later.

Out of scope:

- Changing the API route's 404, 503, authentication, ownership, or rate-limit contract.
- Changing global rate-limit values or suppressing server-side rate limiting.
- Rebuilding the Fabric canvas, Planner tools, catalog, BOQ, layers, validation, export, save, or open workflows that passed the audit.
- Adding a public footer, Studio import, shared cross-fork CSS, or a new graph dependency.

## State vocabulary

The implementation must distinguish these user-visible states:

- **Draft** — `/ooplanner` has no route id and no recoverable last-project id. The existing blank/new-plan workspace remains available.
- **Loading** — a concrete effective project id is being requested. The normal interactive Planner workspace is not presented as loaded.
- **Ready** — the requested project response succeeded and its project data has been applied to the canvas.
- **Not found** — the request returned 404 or a typed client error with status 404. The normal canvas is not presented; the user receives recovery actions.
- **Transient failure** — a network failure, 429, 5xx, or other non-404 request failure. The normal canvas is not presented as the requested project; the user receives a retry path and a return path.
- **Cancelled/stale** — an internal request result that must not update visible state or produce a toast/log after the component unmounts, the id changes, or a newer request wins. It is not a user-facing error state.

## Requirements

### R1 — Preserve route binding and project identity

1. A dynamic `routeId` is authoritative whenever `/ooplanner/projects/[id]` is rendered.
2. The local-storage last-project fallback may be consulted only for the bare `/ooplanner` route when no route id is present.
3. A failed route id must never fall back to another local-storage project and display that other project's canvas.
4. A successful response must bind `projectId`, project name, sheet data, and canvas data to the same requested project id before the editor becomes ready.
5. Existing bare-route draft behavior must remain available when there is no route id and no fallback project.

### R2 — Model the complete project-load lifecycle

1. The editor must expose an explicit state for loading, success, not-found, and transient failure rather than deriving success from the absence of an error toast.
2. While a route-bound load is pending, the normal canvas, docks, tool controls, save actions, and project data must not be visually or interactively available as a successfully loaded plan.
3. The ready state may render the existing Planner workspace without changing its feature behavior.
4. The draft state may render the existing blank workspace only when no project load is required.
5. A stale or cancelled request must not move the editor from ready to an error state and must not overwrite a newer project.

### R3 — Render an explicit invalid-project recovery surface

For `/ooplanner/projects/not-a-valid-id` and any other 404 project response:

1. The normal canvas/workspace must be hidden or gated, not left visible behind only a toast.
2. The user must see a clear not-found message that does not imply the project loaded.
3. The surface must provide a keyboard-accessible **Try again** action and a **Back to projects** action. A new-plan action may be included only if it does not obscure those two recovery paths.
4. Retry must request the same route id; it must not silently substitute the last local-storage project.
5. The expected 404 path must not be logged as an uncaught generic console error. Unexpected failures remain observable through the appropriate runtime logging path.

### R4 — Separate transient failure from not-found

1. A 429, 5xx, network failure, or other non-404 error must not be classified as not-found.
2. A transient failure must not clear the last-project local-storage key merely because the request failed.
3. The user must receive a concise unavailable/retry message and a return-to-projects action.
4. Retry is user initiated or otherwise bounded by an explicit request policy; no automatic retry loop may be introduced.
5. A retry after a settled failure starts a fresh request for the same id and replaces the old error state only when the new request is current.
6. The client may surface a server-provided retry hint such as `Retry-After`, but it must not invent a server-side rate-limit policy or change API limits in this remediation.

### R5 — Preserve the existing API contract

1. `GET /api/Planner/projects/[id]/` continues to return the existing project payload on success.
2. A missing or unauthorized project continues to return HTTP 404 with `{ detail: "Project not found" }`.
3. Persistence-not-configured behavior continues to return the existing HTTP 503 response.
4. `plannerApi` may preserve response status/detail in a typed client error so the UI can classify 404 versus 429/5xx, but the URL paths, HTTP methods, credentials path, trailing-slash behavior, and successful return types remain compatible with existing callers.
5. No API route implementation is required unless implementation evidence discovers a contract regression; the current API route is not the source of the confirmed invalid-project defect.

### R6 — Make project requests cancellation-safe and deduplicated

1. For one mounted editor and one effective id, there must be at most one active project GET for the current request key.
2. Repeated React effects, route transitions, retries, or remounts must not allow an older response to overwrite a newer response.
3. Cleanup must abort or otherwise detach obsolete requests so their result cannot update state after unmount or id change.
4. The same in-flight request may be shared by repeated subscribers for the same id, but it must be removed from the in-flight registry after settle and must not cache a failed project forever.
5. User retry after a settled error must be allowed and must not be deduplicated against the old settled failure.
6. Aborted requests must not show a failure toast or produce noisy expected-error logging.
7. The projects-list load must also avoid effect-driven duplicate requests, ignore stale responses, and expose a bounded retry path for transient failures.

### R7 — Keep successful Planner workflows unchanged

After a valid project is ready, the existing audited workflows must remain available: Draw, Wall, Grid, Snap, Place/catalog search and placement, Review, BOQ, Layers, Validation, Export, Save, and Open. The remediation may gate these controls during loading/error states but must not alter their ready-state semantics.

### R8 — Cover all five audited viewport widths

The load, not-found, and transient-failure surfaces must be checked at exactly 1920, 1440, 1078, 768, and 390 CSS pixels.

1. At desktop and tablet widths, the state surface must occupy the Planner content area without exposing the unusable canvas behind it.
2. At 768 and 390, the message and recovery actions must wrap or stack without horizontal overflow.
3. Recovery controls must retain the repository's interactive target contract, including the existing 40px target expectation for narrow viewports.
4. The fix must not regress the already audited compact Planner shell, mobile bottom action bar, or canvas geometry when the state is ready.

### R9 — Meet accessibility and recovery requirements

1. Loading and failure states must expose an appropriate status/alert semantics without repeatedly announcing the same message on every render.
2. The visible state must have a meaningful heading or accessible name.
3. Retry and return controls must be native keyboard-operable controls with visible focus styles and explicit accessible names.
4. The normal workspace must not remain keyboard-reachable as an apparently loaded plan while the route-bound request is loading or failed.
5. Focus should move to the state heading or first recovery control when the state changes, without stealing focus during ordinary ready-state updates.
6. Color, toast presence, or console output must not be the only indication of failure.

### R10 — Keep the Planner fork isolated

All application and CSS changes must stay within the Planner ownership tree or neutral Planner API client already used by Planner. No Planner file may import Studio code or Studio CSS, and no Studio file may be changed as a shortcut. The Planner entry remains `site/focss/planner/entry.css`; existing canonical Planner sheets must be preferred over a new stylesheet.

### R11 — Preserve observability without treating expected states as crashes

The implementation must distinguish expected 404 recovery, user cancellation, transient request failure, and unexpected programming/runtime failures. It must not silence unexpected failures merely to make the audit green, and it must not emit repeated error logs for an expected invalid-project navigation or an aborted stale request.

## Acceptance criteria

- [ ] A route-bound invalid id never leaves the normal Planner canvas visible as the loaded result.
- [ ] The invalid-id surface clearly says the plan could not be found and provides working Retry and Back to projects recovery controls.
- [ ] Loading, ready, not-found, transient failure, cancelled/stale, and bare-route draft behavior are represented by an explicit state model.
- [ ] Route ids take precedence over local-storage fallback ids; no invalid route can display a different saved project.
- [ ] 404, 429, 5xx, network, and aborted outcomes are classified separately enough to produce the required UI behavior.
- [ ] Same-id in-flight requests are deduplicated or safely shared, stale results are ignored, and no automatic retry storm is introduced.
- [ ] The existing API 404/503/success contract and Planner fork boundaries remain unchanged.
- [ ] The recovery surface passes keyboard/focus/accessibility review and remains usable at 1920, 1440, 1078, 768, and 390.
- [ ] Ready-state Draw, Wall, Grid, Snap, Place, Review, BOQ, Layers, Validation, Export, Save, and Open behavior remains available.
- [ ] Focused unit and five-width browser verification are specified for the user to run after implementation; the agent does not execute them as part of this planning task.

## Non-goals

- Do not convert a missing project into a successful empty project response.
- Do not redirect every project-load failure to `/ooplanner`; the user must understand whether the requested project is missing or temporarily unavailable.
- Do not change API authentication, ownership checks, persistence selection, rate-limit thresholds, database schema, or disk/Supabase behavior.
- Do not add a global error boundary for a recoverable project GET when an inline Planner state surface is sufficient.
- Do not treat transient `_next` cold-development asset 404s as part of this product remedy unless they reproduce independently and are assigned to their own environment/runtime plan.
- Do not remediate unverified Planner features or claim that unrelated console findings are fixed by this plan.
- Do not modify Studio, add cross-fork imports, install a graph package, run tests, run browser suites, or run repository gates as part of creating this spec.
