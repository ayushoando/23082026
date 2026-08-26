# Tasks: unified remediation

Implementation plan. Authoring this file executes nothing. Every test, gate, browser run, and audit
below is user-invoked.

Read order: `audit.md` → `requirements.md` → `design.md` → this file.

## Execution contract

- No Lane S remediation task may be started before Lane E has measured that zone.
- Lane P owns every `site/focss/planner/*` edit. Lane S must not touch Planner or Studio sheets.
- `GET /api/Planner/projects/[id]/` keeps its 200/401/404/503 behaviour and its rate-limit thresholds.
- Do not cite `tests/unit/app/api/Planner/projects/[id]/route.test.ts` as existing coverage. It does not
  exist. Create coverage or say there is none.
- Do not assert a 40px target contract until Lane E task 1.5 writes one down.
- Agents do not run tests or gates. Tasks marked **[user]** are for the user to run.

---

## Lane E — evidence

- [ ] **E1.1 Add session support to `scripts/site-page-audit.mjs`.** Acquire a session once and pass
  `storageState` into every `browser.newContext({ viewport })` call. Support both an admin-role and a
  member-role run. If `DEV_AUTH_BYPASS=1` is used instead, label every resulting finding as
  bypass-derived in the artifact.
- [ ] **E1.2 Make result rows redirect-aware.** Add a per-row outcome of `measured` /
  `redirect-only` / `unmeasured`. A row whose `finalPath` crossed an auth boundary (the tell is a
  `/access/` destination) is `unmeasured` and contributes no findings to the requested route. Today
  `finalPath` is recorded and ignored, which is why 17 `/admin/*` routes carry findings measured on the
  sign-in page.
- [ ] **E1.3 Report measured-vs-requested coverage.** `routeCount` alone is misleading. Emit
  `requestedRoutes`, `measuredRoutes`, `unmeasuredRoutes`, and list the unmeasured patterns in
  `summary.txt`. The 2026-08-26 run would report roughly 36 measured of 61 requested.
- [ ] **E1.4 Drive the footer check from `routeChromeRules.ts`.** Replace the hardcoded `isAppShell` /
  `isSuiteShell` / `isOfflineShell` prefix tests (lines 123-129) with `resolveRouteChromeMode` on the
  **requested** path. Assert only where the resolved contract is `footer: "full"`; assert the
  login-tools variant for `footer: "login-tools"`; assert nothing for `footer: "hidden"`. Expect the
  130-finding category to collapse to ~0.
- [ ] **E1.5 Write down the interactive-target contract.** One authoritative location. State the
  pass/fail floor (WCAG 2.2 SC 2.5.8, 24×24, both axes) separately from the 40px touch aspiration, and
  list exemptions — at minimum inline links in body copy. Reference it from the CSS handbook so
  `focss-css` guidance can point at it.
- [ ] **E1.6 Align the target heuristic to E1.5.** Change `rect.width < 40 || rect.height < 40`
  (line 154) to the decided floor with both-axes logic and exemptions. Report 24–40px separately as
  advisory. Record selector, computed box, and failing axis per finding.
- [ ] **E1.7 Uncap text sampling.** Remove `if (smallText.length >= 3) break;` (line 121). Record
  selector and computed size. Note in the artifact that the prior 16 was capped, so runs are not
  directly comparable.
- [ ] **E1.8 Register the generators in `package.json`.** `audit:site-pages` and
  `graph:page-components`. Echo `AUDIT_BASE_URL` into the output directory label so a localhost run can
  never again be stored as `production`.
- [ ] **E1.9 [user] Re-run the audit authenticated.** Two runs if needed (admin, member). Write to a
  correctly labelled directory. Do not overwrite `page-audit-production-complete` — it is the record of
  what the prior plans were built on.
- [ ] **E1.10 Publish the corrected finding set.** Findings grouped as measured defects, advisory, and
  harness artifacts. Restate the five prior categories against the new run. Explicitly record: footer
  0 measured defects, Admin previously 0 measured, target findings now split by bar.

**Gate:** Lane S starts per zone only after E1.10 covers that zone.

---

## Lane P — Planner project load

Ungated. Defects confirmed by reading live code.

### P1 — Client status preservation

- [ ] **P1.1 Preserve status in `site/lib/Planner/plannerApi.ts`.** `readJson` (lines 13-38) throws
  `new Error(detail)` and discards status. Keep the existing message text; attach `status` and, where
  present, the envelope `code`. Handle both shapes: bare `{ detail }` from the `[id]` route handler,
  and `{ success: false, error: { code, message } }` from `withAuth` failures. 404 and 503 arrive bare;
  401 and 429 arrive as the envelope.
- [ ] **P1.2 Decide the client error carrier.** Share `site/features/shared/api/ApiError.ts` or mirror
  a minimal client type reusing the same `API_ERROR_CODES` values. Record the decision and the reason.
  `ApiError` is server-side today with 41 fan-in — do not drag server-only imports into the browser
  bundle, and do not invent new codes.
- [ ] **P1.3 Add optional request options to `getProject`.** `getProject(id, options?)` forwarding an
  `AbortSignal` through `browserApiFetch`, which already spreads `RequestInit` and handles
  `credentials: "include"` and trailing slashes. `getProject(id)` stays source-compatible.
- [ ] **P1.4 Extend `tests/unit/lib/Planner/plannerApi.test.ts`.** It currently asserts only URL/method
  path contracts. Add 401, 403, 404, 429, 503 classification across both response shapes, signal
  forwarding, and unchanged success parsing. Keep the existing assertions.

### P2 — State model and recovery surface

- [ ] **P2.1 Add the state union.** Draft, Loading, Ready, Unauthorized(401), Forbidden(403),
  NotFound(404), Unavailable(429/5xx/network). Aborted and stale stay internal and unrendered.
- [ ] **P2.2 Implement the 401 branch first.** This is the only state a persisted artifact records:
  HTTP 401 on `/api/Planner/projects/demo-plan/` with
  `[Planner] load project failed: Authentication required {effectiveId: demo-plan, routeId: demo-plan}`.
  Copy says sign-in is required. The action is sign-in carrying a return path to the requested project.
  No retry action — it cannot succeed. Retain the last-project key.
- [ ] **P2.3 Implement 403.** Not retryable. Route to the projects list. Note the `[id]` route masks a
  foreign project as 404, so 403 is reachable only through `withAuth` role checks.
- [ ] **P2.4 Implement 404.** Gate the canvas, state that the plan was not found, offer retry of the
  same id plus back-to-projects. Clear the last-project key only when it equals the failed id. Replace
  the current substring match (`Planner.tsx:1217` tests `"404"` / `"not found"`, and only works because
  `"Project not found"` happens to contain `"not found"`) with status-based classification.
- [ ] **P2.5 Implement 429/5xx/network.** Retryable, user-initiated only, no automatic loop. Surface a
  server retry hint if present. Never clear the fallback key. Do not change the limiter
  (`planner-projects-id:get`, 60/60s per IP).
- [ ] **P2.6 Add the load-state component.** Typed state in, parent-owned callbacks out. It must not
  call the API or the router itself, and must not import Studio. Per-state copy and actions; never
  inject server text as markup.
- [ ] **P2.7 Enforce effective-id precedence.** Route id first, localStorage only on bare
  `/ooplanner`. A failed route id must never fall through to a different saved project. Note the id
  arrives via `useParams()` at `Planner.tsx:104` — `features/Planner/projects/[id]/page.tsx` renders
  `<Planner />` with no props — so state which mechanism the precedence rule constrains.
- [ ] **P2.8 Protect the success handoff.** Apply project id, name, sheet, canvas JSON, grid/sheet
  redraw, and layer refresh only for the current request. Stale and aborted callbacks must not touch
  the canvas.

### P3 — Gate without breaking Fabric

- [ ] **P3.1 Keep the canvas host mounted in every state.** `usePlannerFabric.ts` returns early when
  its wrapper/canvas refs are null and its effect has `[]` deps, so it never re-runs — an early-return
  gate leaves `ready` false permanently and kills the editor. Gate by overlay, visibility, and
  interaction suppression scoped to a Planner root state class.
- [ ] **P3.2 Suppress interaction and keyboard reach.** The gated workspace must not be tab-reachable
  as an apparently loaded plan. `aria-busy` while loading. No flash of an empty canvas presented as the
  requested plan.
- [ ] **P3.3 Keep the e2e probe intact.** `window.__plannerFabricView` must stay published;
  `tests/e2e/plannerCanvasHelpers.ts` reads it. Do not dispose or remount the canvas to implement the
  gate.

### P4 — Lifecycle

- [ ] **P4.1 Confirm whether a `QueryClientProvider` wraps the Planner tree.** Check
  `site/features/Planner/layout.tsx` and `site/app/ooplanner/layout.tsx`. This decides P4.2 and could
  not be confirmed by search.
- [ ] **P4.2 Implement dedup and cancellation per P4.1.** Provider present → `useQuery` keyed by
  project id. Absent → follow `site/components/site/Header.tsx:43-45` (module-level promise, written for
  this exact Strict-Mode double-fetch case) or `useAiAdvisor.ts`'s `abortRef`. A bespoke keyed registry
  is the last option and needs a written reason, given `@tanstack/react-query ^5.101.4` is already a
  dependency and already used in `FilterGridInner.tsx`.
- [ ] **P4.3 Abort or detach on unmount, id change, and replacement retry.** The current effect
  (`Planner.tsx:1189-1223`) has no cleanup at all and depends on `drawGridAndSheet`/`refreshLayers`, so
  callback identity changes can re-fire it. Aborted requests must not toast, log, or clear storage.
- [ ] **P4.4 Verify Strict-Mode and navigation behaviour.** One active request per id on mount and
  retry; an older id must not win a race against the current id.
- [ ] **P4.5 Give `PlannerProjectsList.tsx` an error state.** It has `loading` but catches with a bare
  `catch {}` and falls through to "No saved plans yet", so a 401 and an empty account are
  indistinguishable. Add a distinct error state, stale-response suppression, abort on unmount, and a
  user-triggered retry.

### P5 — Planner CSS

- [ ] **P5.1 Reuse existing state styles before adding any.** `.empty-state` (`controls.css:37`),
  `.panel-empty-state` (`controls.css:39-48`), `.planner-handoff__error`
  (`workspace-shell.css:239-249`), `.dialog-scrim` (`workspace-shell.css:194`). There is no load-gate
  overlay, skeleton, or spinner today, so the gate surface is new. `.canvas-overlay` is the floating
  toolbar — do not repurpose it.
- [ ] **P5.2 Add the gate and state surface to `site/focss/planner/workspace-shell.css`.** Planner-scoped
  rules only: overlay, alignment, focus visibility, no canvas flash, no overflow.
- [ ] **P5.3 Use the existing `.btn` contract for recovery actions.** Touch `controls.css` only if a
  wrapping or sizing treatment is genuinely missing. Semantic Planner tokens only; no raw palette
  values, no new sheet. Do not assert a 40px floor before Lane E task 1.5 — `.btn--icon` is currently
  32px.
- [ ] **P5.4 Cover 1920, 1440, 1078, 768, 390.** Stack or wrap recovery actions at 768 and 390 with no
  horizontal overflow. At wider widths keep the surface inside the Planner shell with no marketing
  chrome.

### P6 — Tests

- [ ] **P6.1 Create the load-state component test.** One case per state. The 401 case asserts a sign-in
  action and the **absence** of a retry action.
- [ ] **P6.2 Create the editor integration test.** `Planner.tsx` currently has zero covering tests
  (`coveringTests: []`). Cover id precedence, the loading gate, each error branch, stale and abort
  suppression, successful handoff, and Draft preservation. Choose the directory deliberately:
  `tests/unit/planner/` is what `p0:unit` targets, while `tests/unit/components/Planner/` uses the
  capitalised fork name.
- [ ] **P6.3 Add API route coverage if and only if the route is touched.** No such test exists today.
  If the route stays untouched, record that it is uncovered rather than implying a guard exists.

---

## Lane S — site CSS (gated on E1.10)

- [ ] **S1.1 Resolve the calculator owner gap.** *Exempt from the gate — confirmed by reading the
  pages.* `site/app/(site)/tools/office-space-calculator/page.tsx` and
  `.../meeting-room-capacity-calculator/page.tsx` render `div.tools-engine-placeholder` and
  `div.tools-faq`; neither class has any rule in `site/focss/**`. Choose and record: style the
  placeholder in a site sheet, build the real calculator (product decision, out of scope here), or
  withdraw the routes (already `indexable: false`).
- [ ] **S1.2 Confirm the footer category is empty.** After E1.4, verify 0 measured `footer: "full"`
  failures and close the category. Cite `footer-contract-evidence.json`
  (`"required public footer": 0`). Carry no task forward from the prior 130.
- [ ] **S1.3 Fix floor failures at the zone primitive.** Site: `shared/buttons.css`,
  `mobile-tap-targets.css`, and the relevant shell sheet. Admin: `base/buttons.css`, `primitives.css`,
  shell sheets. One fix per repeated failure at the narrowest shared owner.
- [ ] **S1.4 Fix residual layout context in page-family sheets only.** Existing sheets only. A new file
  needs a stated reason why no canonical owner fits.
- [ ] **S1.5 Fix type findings at the confirmed owner.** Use the uncapped E1.7 set with DOM
  confirmation. Do not globally inflate intentional metadata labels.
- [ ] **S1.6 Name controls in markup.** The 6 unnamed-control findings are markup work in the product
  owners (`CategoryPageView.tsx`, `FilterGridInner.tsx`, `FilterGrid.components.tsx`,
  `CategoryListingHero.tsx`). CSS cannot close them; a pseudo-element cannot create a landmark.
- [ ] **S1.7 Route console errors to runtime owners.** `/offline`'s is a 404 on
  `/media/hero/planning-poster.webp` plus a dev RSC prefetch abort (`net::ERR_ABORTED` on `/?_rsc=…`) —
  an asset and environment item, not an Offline-shell CSS item. The `/ooplanner*` console errors are
  Lane P's 401 and belong to P2.2, not here.
- [ ] **S1.8 Admin: no task until authenticated evidence exists.** Every prior Admin finding was
  measured on the sign-in page. `AdminLayoutShell.tsx` has never been rendered by this audit. Blocked on
  E1.9.

---

## User-run verification

- [ ] **V1 [user]** Re-run the audit authenticated and compare per route, per viewport against the
  Phase 1 baseline. Aggregate counts do not close a route.
- [ ] **V2 [user]** Focused Planner unit lane over the `plannerApi`, load-state, and editor tests once
  they exist.
- [ ] **V3 [user]** Five-width Planner browser lane: signed-out load shows sign-in; missing id shows
  not-found with recovery; throttled or 5xx shows retryable copy and preserves the fallback key; a valid
  project still exercises Draw, Wall, Grid, Snap, Place, Review, BOQ, Layers, Validation, Export, Save,
  Open; no repeated GET storm on mount or retry.
- [ ] **V4 [user]** `pnpm run check:layout`, `verify:focss`, `lint:ui:strict`, `check:style-tokens`, and
  `scan:boundaries` for the touched forks. None of these can catch a target-size regression — only the
  audit or a new DOM test can.
- [ ] **V5 [user]** Refresh `node scripts/graph-impact.mjs --file=site/components/Planner/Planner.tsx --depth=3`
  and confirm no Studio import was introduced. The tool prints to stdout and persists nothing.
- [ ] **V6 [user]** Record any remaining runtime or environment blocker in `Failures.md` rather than
  relabelling it as a CSS or invalid-project pass.

## Acceptance checklist

- [ ] Audit runs authenticated; unmeasured routes are marked, not counted.
- [ ] Output directory name matches the recorded `baseUrl`.
- [ ] Footer category closed at 0 measured defects with evidence cited.
- [ ] Target-size contract written down; heuristic matches it; findings split floor vs advisory.
- [ ] Text findings uncapped and owner-confirmed.
- [ ] Re-run commands registered in `package.json`.
- [ ] Planner 401 offers sign-in with a return path and no retry; 403 is not retryable.
- [ ] Planner 404 gates the canvas with working recovery; 429/5xx/network are retryable and bounded.
- [ ] Status is classified from status, not substring matching.
- [ ] Canvas still initialises; `window.__plannerFabricView` intact.
- [ ] `PlannerProjectsList` distinguishes empty from failed.
- [ ] Planner tests exist for every state branch; API route coverage stated honestly.
- [ ] Calculator gap resolved with a recorded decision.
- [ ] No Admin task exists without authenticated Admin evidence.
- [ ] Fork boundaries intact; Planner sheets touched only by Lane P.

## Rollback-safe sequencing

1. Lane E changes are additive to a script and reversible on their own. Revert them and the prior
   artifacts still stand as a historical record.
2. Revert P1 status preservation independently of P2 presentation — the message text is unchanged, so
   existing callers keep working either way.
3. Revert the P3 gate without touching P1/P2 if it causes a visual or init regression. The gate is the
   riskiest change because of the `usePlannerFabric` `[]`-deps constraint.
4. Revert P4 dedup and cancellation independently if request timing changes.
5. Revert P4.5 (projects list) separately from the editor — related concern, different surface.
6. Revert P5 CSS alone if responsive checks fail. Do not broaden into Studio or site shell CSS.
7. The API route is not a rollback candidate. It is not the source of any confirmed defect, and it
   currently has no test coverage, so changes there carry unguarded risk.
