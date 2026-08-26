# Tasks: Planner project-load remediation

This is an implementation task plan. It does not implement the remediation and it does not execute tests, browser audits, gates, or repository commands. Tasks are sequenced so the API contract remains stable and every change can be reverted independently.

## Execution contract

- Preserve `GET /api/Planner/projects/[id]/` 200, 404, and 503 behavior.
- Keep route ids authoritative over local-storage fallback ids.
- Do not render the normal route-bound Planner workspace as loaded until the requested project succeeds.
- Keep Studio and Planner fork boundaries isolated.
- Prefer the smallest existing Planner owners: `Planner.tsx`, `plannerApi.ts`, `PlannerProjectsList.tsx`, and existing Planner FOCSS sheets.
- Do not add a graph package, global error boundary, API rate-limit change, or unrelated Planner feature work.
- Tests and gates listed below are user-invoked verification steps. The agent must not run them while creating or reviewing this plan.

## Wave 0 — Freeze evidence and contracts

- [ ] **0.1 Record the confirmed defect and baseline.** Preserve the audit evidence for `/ooplanner/projects/not-a-valid-id`: API 404 `{ detail: "Project not found" }`, console load failure, and the incorrectly visible normal canvas. Record the separate repeated-load 429 observation as a transient request-lifecycle item, not a not-found fix.
- [ ] **0.2 Re-read the current owners before editing.** Confirm the dynamic route pages still delegate to `Planner`, the API route still owns the correct 404/503 contract, and the current CSS entry remains `site/focss/planner/entry.css`.
- [ ] **0.3 Freeze the route/viewport acceptance matrix.** Use `/ooplanner`, `/ooplanner/projects`, `/ooplanner/projects/not-a-valid-id`, and a valid saved project at 1920, 1440, 1078, 768, and 390. Keep the already audited ready-state workflows as regression checks rather than re-design targets.

## Wave 1 — Preserve client error information without changing the API

- [ ] **1.1 Update `site/lib/Planner/plannerApi.ts`.** Extend the non-OK client error representation to retain HTTP status and safe response metadata while preserving existing error messages and successful return types. Treat an abort as an abort, not a generic project failure.
- [ ] **1.2 Add optional GET request options in `site/lib/Planner/plannerApi.ts`.** Allow `getProject(id, options?)` to pass an `AbortSignal` through the existing `browserApiFetch`/credentials/trailing-slash path. Keep `getProject(id)` source-compatible and do not change `/api/Planner/projects/:id`.
- [ ] **1.3 Add focused client contract cases in `tests/unit/lib/Planner/plannerApi.test.ts`.** Cover typed 404 classification, typed 429/503 classification, optional signal forwarding, and unchanged successful project parsing. Preserve the existing path and error-detail assertions.
- [ ] **1.4 Do not modify `site/app/api/Planner/projects/[id]/route.ts` unless a contract regression is discovered.** The existing route test `tests/unit/app/api/Planner/projects/[id]/route.test.ts` is the server-side guard for 200, missing 404, mutation 404, auth, and persistence behavior.

## Wave 2 — Add the explicit editor load state and recovery surface

- [ ] **2.1 Add the discriminated load model in `site/components/Planner/Planner.tsx` or a narrowly scoped Planner state helper.** Represent Draft, Loading, Ready, NotFound, and TransientError; keep Cancelled/Stale internal and non-rendered.
- [ ] **2.2 Enforce effective-id precedence in `site/components/Planner/Planner.tsx`.** Use the dynamic route id first, consult local storage only on bare `/ooplanner`, and ensure a failed route id cannot fall through to a different saved project.
- [ ] **2.3 Add `site/components/Planner/PlannerProjectLoadState.tsx`.** Give it typed state plus parent-owned Retry and Back to projects callbacks. Do not let it call the API directly or import Studio code.
- [ ] **2.4 Gate the normal workspace in `site/components/Planner/Planner.tsx`.** Keep Fabric initialization safe, but prevent the normal route-bound canvas, docks, project actions, and workflow controls from appearing as a loaded plan during Loading, NotFound, or TransientError. Preserve the existing Draft and Ready render paths.
- [ ] **2.5 Implement 404 recovery.** Map status 404 to the not-found surface, show clear copy, provide Retry for the same id and Back to projects, avoid a misleading success toast, and avoid generic expected-error logging.
- [ ] **2.6 Implement transient recovery.** Map 429, 5xx, network, and other non-404 failures to a retryable unavailable state; retain the fallback key unless the failed key is known stale; do not add automatic retry loops.
- [ ] **2.7 Protect success handoff.** Apply project name, project id, sheet, canvas JSON, grid/sheet redraw, and layer refresh only for the current successful request. Prevent stale or aborted callbacks from mutating the canvas or visible state.

## Wave 3 — Deduplicate and cancel project requests

- [ ] **3.1 Add a keyed in-flight lifecycle in the Planner client/editor.** Use the effective project id as the request key, share an active same-id request when appropriate, remove entries after settle, and allow a fresh user retry after failure.
- [ ] **3.2 Abort or detach obsolete requests.** On unmount, route-id change, or replacement retry, ensure obsolete requests cannot update state, clear local storage, show a toast, or log an expected error.
- [ ] **3.3 Verify React effect behavior.** Specifically check development effect re-runs and navigation transitions so the same id does not trigger an uncontrolled GET storm and a previous id cannot win a race against the current id.
- [ ] **3.4 Update `site/components/Planner/PlannerProjectsList.tsx`.** Add the same bounded load lifecycle to list loading: no duplicate effect loop, stale-response suppression, abort/detach on unmount, and a visible user-triggered retry for a settled transient list failure. Do not change list API limits.

## Wave 4 — Style the Planner-owned recovery surface

- [ ] **4.1 Inspect existing owners before adding CSS.** Check `site/focss/planner/workspace-shell.css`, `controls.css`, `chrome.css`, `workspace.css`, and `dock.css`; place the gate/state styles in the narrowest existing canonical owner.
- [ ] **4.2 Update `site/focss/planner/workspace-shell.css` for the full-area state surface.** Add only Planner-scoped state/gate rules needed to hide interaction behind the recovery surface, align the content, preserve focus visibility, and avoid canvas flash/overflow.
- [ ] **4.3 Reuse the existing Planner control contract.** Use existing `.btn` and semantic tokens; add a narrow control rule only if Retry/Back to projects need a missing target-size or wrapping treatment. Do not add raw palette values or a new CSS tree.
- [ ] **4.4 Cover 1920, 1440, 1078, 768, and 390.** At 768 and 390, stack/wrap recovery controls, preserve the 40px interactive target expectation, and verify no horizontal overflow. At wider widths, keep the surface inside the Planner app shell without adding public marketing chrome.
- [ ] **4.5 Keep the fork boundary intact.** Do not edit or import `site/focss/studio/*`; all CSS remains under `site/focss/planner/*`.

## Wave 5 — Accessibility and focused verification artifacts

- [ ] **5.1 Implement state semantics and focus management.** Provide a stable heading/name, appropriate status/alert semantics, `aria-busy` while loading, keyboard-operable native recovery controls, visible focus, and no keyboard access to a hidden loaded workspace.
- [ ] **5.2 Add focused component coverage.** Create `tests/unit/components/Planner/PlannerProjectLoadState.test.tsx` for the dedicated recovery surface and `tests/unit/components/Planner/Planner.test.tsx` for the editor integration. Cover route-id precedence, Loading gate, 404 surface/actions, transient retry, stale/abort suppression, successful handoff, and Draft preservation.
- [ ] **5.3 Preserve API contract coverage.** Keep or extend `tests/unit/app/api/Planner/projects/[id]/route.test.ts` only if the API file is touched. The expected result remains 404 `{ detail: "Project not found" }` for a missing id.
- [ ] **5.4 Refresh the scoped graph after implementation.** Re-run the Planner component and API route graph queries, review impacted page files/test owners, and confirm no Studio import was introduced. This is a user-run implementation verification step, not part of spec creation.

## Wave 6 — User-run browser acceptance matrix

For each width **1920, 1440, 1078, 768, and 390**, the user/auditor runs the following checks using the repository's existing browser workflow:

- [ ] **6.1 Invalid route gate:** Open `http://localhost:3000/ooplanner/projects/not-a-valid-id`; confirm the normal canvas/workspace is not visible as loaded, the not-found heading/copy is visible, and no replacement project appears.
- [ ] **6.2 Invalid route retry:** Activate Retry; confirm the same invalid id is requested again, no automatic retry loop starts, and the error surface remains recoverable.
- [ ] **6.3 Return recovery:** Activate Back to projects; confirm `/ooplanner/projects` loads and its list/empty state remains usable.
- [ ] **6.4 Transient failure:** Use a controlled 429/503/network interruption available to the audit harness; confirm transient copy is distinct from not-found, the last-project key is not wiped, retry is bounded/user initiated, and success recovers the editor.
- [ ] **6.5 Valid project regression:** Open a known valid saved project and confirm the ready-state canvas, Draw, Wall, Grid, Snap, Place/catalog, Review/BOQ/Layers/Validation, Export, Save, and Open workflows remain available as previously audited.
- [ ] **6.6 Bare route regression:** Open `/ooplanner` with no fallback and confirm Draft remains usable; with a valid last-project fallback, confirm it loads that project; with a stale fallback, confirm it does not silently substitute another project.
- [ ] **6.7 Accessibility/responsive check:** Verify keyboard focus order, named Retry/Back controls, announcement semantics, no horizontal overflow, and usable recovery targets at every width.
- [ ] **6.8 Request-lifecycle check:** Inspect the browser network log for one active same-id load during initial mount/retry, no stale overwrite after navigation, and no repeated 429 storm caused by the client lifecycle.

## Wave 7 — User-run repository checks after implementation

These are deliberately not executed by the agent while creating this plan:

- [ ] **7.1** User runs the focused Planner unit command (after the planned test files exist): `pnpm exec vitest run --config tests/vitest.config.ts tests/unit/lib/Planner/plannerApi.test.ts tests/unit/components/Planner/PlannerProjectLoadState.test.tsx tests/unit/components/Planner/Planner.test.tsx tests/unit/app/api/Planner/projects/[id]/route.test.ts`.
- [ ] **7.2** User runs the relevant five-width browser workflow and reviews route-level evidence rather than an aggregate pass count only.
- [ ] **7.3** User runs `pnpm run check:layout`, `pnpm run verify:focss`, `pnpm run lint:ui:strict`, and `pnpm run check:style-tokens`; because Planner files are touched, also run `pnpm run scan:boundaries`.
- [ ] **7.4** User records any remaining runtime/environment blocker in the repository's documented blocker workflow rather than relabeling it as a CSS or invalid-project pass.

## Acceptance checklist

- [ ] All three project-load outcomes—Loading, NotFound, and TransientError—have explicit UI states; Ready and Draft remain distinct.
- [ ] `/ooplanner/projects/not-a-valid-id` never leaves the normal loaded canvas visible after the API 404.
- [ ] Retry repeats the same id; Back to projects is always available from the recovery state.
- [ ] A transient 429/5xx/network failure is not presented as not-found and does not trigger an automatic retry loop or accidental fallback substitution.
- [ ] Same-id requests are deduplicated/shared or safely cancelled; stale and aborted results cannot mutate visible state.
- [ ] The API route contract remains unchanged and the Planner/Studio fork boundary is intact.
- [ ] Recovery controls and messaging are accessible and usable at all five audited widths.
- [ ] Existing valid and bare Planner workflows remain unchanged in Ready/Draft states.
- [ ] User-run unit, browser, layout, and boundary verification instructions are complete; no tests or gates were executed while creating this spec.

## Rollback-safe sequencing

1. Revert the presentation/state gate while retaining no API changes if the recovery surface causes a visual regression.
2. Revert request deduplication/cancellation independently if it changes request timing, while retaining status-aware error classification.
3. Revert the projects-list lifecycle separately from the dynamic editor because the observed 429 list/editor behavior is related but not the same invalid-id defect.
4. Revert only the new Planner CSS rules if responsive checks fail; do not broaden the rollback into Studio or site shell CSS.
5. Keep the API route untouched unless a separate contract test proves an actual server regression; the server-side 404 behavior is not a rollback candidate for this client defect.
