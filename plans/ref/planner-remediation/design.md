# Design: Planner project-load remediation

## 1. Remedy strategy

The remedy is a client-side load gate around the existing Planner workspace, not an API semantic change.

1. Resolve the requested project id with strict route precedence.
2. Start one cancellation-safe, status-aware project request for the effective id.
3. Keep the normal interactive workspace unavailable until the request succeeds.
4. On success, apply project data once and render the existing Planner workflow unchanged.
5. On 404, render an inline not-found recovery surface instead of the canvas.
6. On 429, 5xx, network, or other non-404 failure, render a transient-unavailable surface with bounded, user-controlled retry.
7. On cleanup, route change, or a newer retry, abort/detach the old request and ignore its result.

The preferred error presentation is an inline Planner-owned load-state surface. A global error boundary is not required because the failure is an expected, recoverable data-load outcome and the shell already owns the route.

## 2. Current ownership and graph impact

| Concern | Current owner | Planned responsibility |
|---|---|---|
| Dynamic editor route | `site/app/ooplanner/projects/[id]/page.tsx` → `site/features/Planner/projects/[id]/page.tsx` | Continue rendering the shared Planner editor; no route/API contract rewrite |
| Bare Planner route | `site/app/ooplanner/page.tsx` → `site/features/Planner/page.tsx` | Preserve blank-draft and last-project fallback behavior |
| Editor state/render | `site/components/Planner/Planner.tsx` | Own effective-id resolution, load state, request lifecycle, state gate, and ready-state handoff |
| Load-state presentation | New `site/components/Planner/PlannerProjectLoadState.tsx` | Own heading, explanation, Retry, Back to projects, focus behavior, and accessible status semantics; receive typed state and parent-owned callbacks |
| Project client | `site/lib/Planner/plannerApi.ts` | Preserve paths and return values; expose response status/detail and accept an abort signal for GET |
| Project list | `site/components/Planner/PlannerProjectsList.tsx` | Avoid duplicate/stale list loads and provide bounded transient-error recovery |
| Planner state styling | `site/focss/planner/workspace-shell.css`, with `controls.css` only for shared control treatment | Style the gate and recovery controls using existing Planner tokens and 40px narrow targets |
| API contract | `site/app/api/Planner/projects/[id]/route.ts` | Remain unchanged unless a regression is found; its 404 behavior is already correct |

The refreshed graph reports 48 direct dependencies from `Planner.tsx`, four impacted Planner page files, and no graph-discovered covering tests. The API route has four direct dependencies and is covered by `tests/unit/app/api/Planner/projects/[id]/route.test.ts`. Any implementation touching the high-fan-out editor must re-run the scoped graph query after the change; this plan does not add a graph dependency.

## 3. State model

Use a discriminated union or equivalent explicit model. The exact type name is implementation detail, but the states and payload distinctions are required:

```text
Draft
  reason: "no-effective-project"

Loading
  projectId: string
  requestKey: string

Ready
  projectId: string
  project: PlannerProject

NotFound
  projectId: string
  status: 404
  message: user-safe recovery copy

TransientError
  projectId: string
  status?: number
  message: user-safe recovery copy
  retryable: true
```

`Cancelled/Stale` is an internal control-flow outcome, not a rendered union member. A request may finish after its state is obsolete, but it must be ignored rather than converted into `TransientError`.

### Effective-id rules

- On `/ooplanner/projects/[id]`, use the route id and never replace it with local storage after a failure.
- On bare `/ooplanner`, use the last-project key only when present; otherwise enter `Draft`.
- When a bare-route fallback returns 404, clear only that stale fallback key and show the same explicit not-found recovery surface or a clearly documented return-to-draft choice. Do not silently load a second project.
- When a route-bound request returns 404, do not clear an unrelated saved project in a way that could cause a later route to display the wrong record. If the existing key equals the failed route id, it may be cleared as stale after classification.

## 4. Render and gating model

`useFabric` currently needs the canvas element to become ready, so the implementation should not introduce a conditional early return that prevents the canvas ref from mounting while the load effect waits for `ready`. Instead:

1. Keep the existing Fabric initialization path mounted as needed for the hook contract.
2. Add a Planner load-state marker to the root/workspace render path.
3. While the effective state is `Loading`, `NotFound`, or `TransientError`, visually and interactively gate the normal workspace with a Planner-scoped state class/attribute. The normal canvas must not be visible as a usable loaded plan.
4. Render `PlannerProjectLoadState` as the visible surface over the gated area, with the appropriate state-specific copy and controls.
5. Do not show the normal project toolbar/docks as actionable loaded-project controls while the gate is active. This can be achieved with the same Planner-scoped gate plus `visibility`/pointer and keyboard exclusion, or with a carefully scoped conditional around the existing workspace after Fabric initialization is proven safe.
6. Once `Ready`, remove the gate and run the existing canvas load, grid/sheet redraw, layer refresh, and toast flow exactly once for the current project.
7. `Draft` keeps the existing blank Planner workspace path and does not show a project-not-found state.

The implementation must verify that a hidden/gated canvas does not create a flash of the invalid plan at first paint and that the gate does not prevent Fabric from initializing or disposing cleanly.

## 5. Client/API error contract

`site/app/api/Planner/projects/[id]/route.ts` already owns the correct server behavior:

- success: project JSON;
- missing or unauthorized record: 404 with `{ detail: "Project not found" }`;
- persistence unavailable: 503 with the existing detail.

Do not change that route for this defect.

`site/lib/Planner/plannerApi.ts` currently converts non-OK responses to a plain `Error`, which loses the HTTP status after extracting `detail`. Extend the client error path in the smallest compatible way:

- Preserve the existing error message text used by current callers.
- Attach the response status, and optionally a safe response detail/retry hint, to a typed error object or equivalent narrowing helper.
- Allow `getProject` to pass an `AbortSignal` through `RequestInit` to `browserApiFetch`; `browserApiFetch` already accepts `RequestInit` and preserves credentials/trailing-slash behavior.
- Keep `getProject(id)` valid for existing callers by making request options optional.
- Do not alter successful return shapes or any `/api/Planner/*` path.

The client should classify 404 by status first, with the existing detail text as a compatibility fallback. It should classify 429/5xx/network separately and treat `AbortError` as cancellation rather than a visible error.

## 6. Request lifecycle and deduplication

Use a keyed in-flight request strategy for the editor, scoped to the Planner client module/component and keyed by the effective project id. The implementation may use a small loader helper or a ref-backed registry, but it must satisfy these invariants:

1. A request key contains the effective id and does not collapse different project ids.
2. A repeated subscriber/effect for the same active key shares the in-flight promise instead of issuing another GET.
3. The registry entry is removed on resolve, reject, or cancellation; a failed request is never cached forever.
4. Cleanup detaches the current subscriber and aborts the underlying request when no subscriber remains.
5. A route-id change or user retry creates a new current generation and prevents older results from mutating state.
6. `AbortError` and stale-generation results do not call `showToast`, clear storage, or log an expected failure.
7. There is no automatic retry loop. A 429 response can display a retry hint, but only an explicit retry action starts a new request.

The projects list should use the same lifecycle principles in its existing `load` callback: one active list load, abort/detach on unmount, no stale response after route change, and a visible retry control for a settled transient failure. This is a separate list concern from the invalid dynamic id and must not change the API rate-limit threshold.

## 7. Recovery surface behavior

The new Planner load-state component should receive typed state and callbacks rather than reaching into the router or API directly. Its responsibilities are:

- `Loading`: announce that the plan is loading and do not offer misleading project actions.
- `NotFound`: state that the requested plan was not found; expose `Try again` and `Back to projects`.
- `TransientError`: state that the plan could not be loaded right now; expose `Try again` and `Back to projects`, with a concise retry-later hint for 429 when available.
- Keep the route id out of user-facing copy unless there is a product-approved reason to show it; never inject untrusted server text as markup.
- Use native buttons/links with explicit labels and the existing `router.push`/`router.replace` ownership supplied by the parent.
- Return focus to the heading or first recovery action when the visible state changes, but do not steal focus during ordinary ready-state renders.

## 8. Responsive and CSS design

Use existing Planner FOCSS ownership. Do not create a site-wide or Studio stylesheet.

- `site/focss/planner/workspace-shell.css` is the primary owner for the full-area load-state surface, overlay/gate behavior, spacing, narrow wrapping, and canvas/workspace interaction suppression.
- `site/focss/planner/controls.css` is the owner for any shared Planner button treatment if the existing `.btn` contract does not already cover the recovery actions.
- `site/focss/planner/chrome.css`, `workspace.css`, and `dock.css` may be adjusted only if DOM evidence shows the state gate intersects an existing owner there; they are not a reason to add a new parallel stylesheet.
- Use existing semantic Planner tokens. Do not add raw palette values, global utility classes, or Studio imports.
- At 390, stack or wrap recovery actions, keep usable controls at the existing narrow target size, and prevent horizontal overflow.
- At 768, allow the state surface to occupy the content area without pushing the canvas into a clipped strip.
- At 1078, 1440, and 1920, keep the state surface aligned with the Planner workspace and avoid an unwanted public site footer or marketing shell.

## 9. Accessibility design

- The state container should have a stable accessible heading and an appropriate `role="status"` for loading or `role="alert"`/equivalent for failures without duplicate announcements.
- The parent should expose `aria-busy` while loading and should not leave the gated workspace keyboard-reachable as if it were ready.
- Retry and Back to projects must have explicit accessible names, visible focus indicators, and native keyboard activation.
- The state surface must remain understandable without color, toast timing, or developer-console output.
- Focus management must be resilient to a retry transition: focus should not land on a removed control or be trapped behind the hidden workspace.

## 10. Verification design

The implementation verification has two lanes for the user:

### Focused unit lane

- Client error classification and optional abort options in `tests/unit/lib/Planner/plannerApi.test.ts`.
- `tests/unit/components/Planner/PlannerProjectLoadState.test.tsx` covers the dedicated recovery surface.
- `tests/unit/components/Planner/Planner.test.tsx` covers editor integration for route-id precedence, 404 gating, transient retry, stale/aborted request suppression, successful handoff, and Draft preservation.
- Existing API contract tests in `tests/unit/app/api/Planner/projects/[id]/route.test.ts` remain the server-side 404/503/success guard. They should only change if implementation evidence shows the route was touched.

### Focused browser lane

For each of 1920, 1440, 1078, 768, and 390 CSS pixels:

1. Open `/ooplanner/projects/not-a-valid-id`; assert the API 404 is represented by the not-found surface, not the normal canvas.
2. Activate Retry; assert the same route id is requested and no other saved project appears.
3. Activate Back to projects; assert navigation to `/ooplanner/projects` and a usable list state.
4. Exercise a transient failure such as a controlled 429/503 fixture or network interruption; assert transient copy, no local-storage wipe, bounded retry, and recovery.
5. Open a valid project and confirm the existing editor shell and audited workflows remain usable.
6. Check no horizontal overflow, focus visibility, keyboard recovery, and no repeated GET storm during initial mount/retry.

The user runs these lanes after implementation. This spec creation does not run them.

## 11. Fork and blast-radius guardrails

- Planner files may depend on Planner and neutral shared infrastructure already used by Planner, but never on Studio.
- The high-fan-out `Planner.tsx` change must remain narrowly scoped to load state and lifecycle; unrelated workflow refactors are prohibited.
- After implementation, refresh `node scripts/graph-impact.mjs --file=site/components/Planner/Planner.tsx --depth=3` and the API route query if either surface changes. Review impacted Planner pages and the existing API test owner before validation.
- Because this plan touches Planner application/CSS ownership, the user must run the repository's boundary and appropriate static checks after implementation; the agent does not execute them here.
