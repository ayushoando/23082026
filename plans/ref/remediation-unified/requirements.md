# Requirements: unified remediation (evidence-gated)

Supersedes `.kiro/specs/planner-remediation/` and `.kiro/specs/site-page-css-remediation/`.
Read `audit.md` in this folder first — it records why those two plans could not be merged as written.

Planning only. No implementation, no test runs, no gates, no browser runs are performed by creating
or reviewing this spec. Every command below is user-invoked.

## Governing principle

**No remediation task may exist without a measured finding from an authenticated run against a
correctly labelled base URL.**

The prior plans inverted this: they wrote 61 route rows and seven execution waves on top of a
dev-server run in which 25 of 61 route patterns never rendered their own page. Measurement comes
first here, and the remediation backlog is derived from it rather than assumed.

## Phase gate

Work is in two phases and Phase 2 cannot start for a zone until Phase 1 has produced evidence for
that zone.

- **Phase 1 — Evidence.** Fix the audit harness, decide the contracts it measures against, re-run it
  authenticated, and publish a finding set that distinguishes measured defects from harness artifacts.
- **Phase 2 — Remediation.** Fix what Phase 1 measured, in the verified owner, at the verified
  viewport.

Two items are exempt from the gate because they were verified independently of the audit and do not
depend on it: the calculator owner gap (R8) and the Planner load lifecycle (R4–R6), whose defects were
confirmed by reading live code.

## Phase 1 requirements

### R1 — The audit must run authenticated, and say so

1. `scripts/site-page-audit.mjs` must be able to run with a session so guarded routes render their own
   page instead of the sign-in page.
2. Every result row must record both the requested path and the final path, and any row where they
   differ across an auth boundary must be marked `unmeasured` rather than counted as a finding for the
   requested route.
3. The recorded `baseUrl` must appear in the output directory name. A run against
   `http://localhost:3000` must not be stored under a name containing `production`.
4. Coverage must be reported as measured-vs-requested. A run that renders 36 of 61 route patterns
   reports 36, not 61.
5. The command and its environment must be documented in `package.json` so the re-run is reproducible.

### R2 — The footer landmark check must be fixed or withdrawn

1. The shell-exclusion test must evaluate the route's own contract, not the final path it redirected
   to. Today an `/admin` request that lands on `/access/` is footer-checked as if it were a public
   marketing route.
2. Footer expectations must be read from `site/features/site/data/routeChromeRules.ts` rather than
   hardcoded in the audit script, so `footer: "full" | "login-tools" | "hidden"` is honoured.
3. A finding may only be raised where the resolved contract is `footer: "full"` and no
   `footer`/`[role="contentinfo"]` element is present.
4. The current 130-finding count must be restated as 0 measured defects plus 130 harness artifacts,
   with `footer-contract-evidence.json` cited. No remediation task may be carried forward from it.

### R3 — The interactive-target contract must be decided and written down

1. The repository has no 40px minimum-target rule. Both prior plans asserted one. A single
   authoritative statement of the contract must be written, in one place, before any target-size task
   is created.
2. The contract must state a pass/fail floor and, separately, any design aspiration. These are not the
   same thing and must not be conflated in a finding.
3. Exemptions must be explicit — at minimum inline text links within body copy, which the current
   heuristic flags because it fails on either axis (`rect.width < 40 || rect.height < 40`).
4. The audit heuristic must be changed to match the decided contract, and the finding must report the
   measured box and the failing axis so a fix can be verified.
5. Until R3 is satisfied, the 114 small-target findings are unclassified. They are not a backlog.

### R4 — Text-size findings must be complete before they are planned

The current sampling stops after three samples per check (`if (smallText.length >= 3) break;`), so 16
is a floor, not a total. The cap must be raised or removed, and each finding must carry its selector
and computed size, before a type task is written.

## Phase 2 requirements — Planner project load

Scope: `site/components/Planner/Planner.tsx`, `site/lib/Planner/plannerApi.ts`,
`site/components/Planner/PlannerProjectsList.tsx`, Planner FOCSS sheets, Planner tests.
Out of scope: the API route's status, auth, ownership, or rate-limit behaviour.

### R5 — Model the full status set, including the one that was actually observed

1. The load state model must branch on: success, **unauthenticated (401)**, **forbidden (403)**,
   not-found (404), throttled (429), server/network failure, and aborted.
2. **401 must offer sign-in with a return path to the requested project, not a retry.** This is the
   only Planner failure state recorded in a persisted artifact:
   `[Planner] load project failed: Authentication required {effectiveId: demo-plan, routeId: demo-plan}`
   with HTTP 401 on `/api/Planner/projects/demo-plan/`. A Try-again button cannot resolve it.
3. 403 must not be presented as retryable either. Note the route currently masks a foreign project as
   404, so 403 is reachable only via `withAuth` role checks.
4. 404 must offer recovery to the projects list and a retry of the same id.
5. 429 and 5xx and network failures are retryable, user-initiated only, with no automatic retry loop.
6. Aborted requests are internal: no toast, no log, no state change.
7. A route-bound load that has not succeeded must not present the normal canvas as a loaded plan.
8. The bare `/ooplanner` draft path must keep working when there is no id and no fallback.

### R6 — Preserve HTTP status in the client

1. `plannerApi` currently throws `new Error(detail)` and discards status, which is why
   `Planner.tsx:1217` substring-matches `"404"`/`"not found"`. That coincidence must be replaced with
   status-based classification.
2. Reuse the vocabulary already in `site/features/shared/api/ApiError.ts` (`status`, `code`,
   `API_ERROR_CODES`) rather than inventing a parallel taxonomy. Note it is a server-side module today;
   the spec must state whether it is shared or mirrored, not assume.
3. `getProject(id)` must stay source-compatible; request options are additive and optional.
4. Existing error message text, URL paths, methods, credentials handling, and trailing-slash behaviour
   in `site/lib/api/browserApi.ts` must not change.

### R7 — Make the load cancellation-safe, and decide dedup deliberately

1. The current effect (`Planner.tsx:1189-1223`) has no cleanup, no abort, and depends on
   `drawGridAndSheet`/`refreshLayers`, so it can re-fire and cannot be cancelled. It must abort or
   detach on unmount and on id change.
2. A stale response must never overwrite a newer one or move a ready editor into an error state.
3. Before building a bespoke in-flight registry, confirm whether a `QueryClientProvider` wraps the
   Planner tree. `@tanstack/react-query ^5.101.4` is already a dependency and already used in
   `site/features/site/catalog/FilterGridInner.tsx`. If it is available, justify any hand-rolled
   alternative; if it is not, follow the existing precedent in `site/components/site/Header.tsx:43-45`
   rather than inventing a fourth pattern.
4. `PlannerProjectsList.tsx` must gain an error state. It currently catches with a bare `catch {}` and
   falls through to "No saved plans yet", which reports a failed fetch as an empty account.
5. The observed 429 must be treated as an artifact of automated looping until it reproduces under human
   navigation. The limiter is `withAuth`'s per-(scope, IP) window at 60/60s for
   `planner-projects-id:get`; do not change it.

### R8 — Do not break canvas initialisation

`site/hooks/Planner/usePlannerFabric.ts` bails when its wrapper/canvas refs are null and its effect has
`[]` deps, so it never re-runs. Any gate that early-returns before those refs mount leaves `ready`
false permanently and kills the editor. The canvas host must stay mounted; gating is by overlay,
visibility, and interaction suppression. Note `window.__plannerFabricView` is read by
`tests/e2e/plannerCanvasHelpers.ts`, so disposing or remounting the canvas has e2e blast radius.

## Phase 2 requirements — site CSS

### R9 — Fix the calculator owner gap

`site/app/(site)/tools/office-space-calculator/page.tsx` and
`site/app/(site)/tools/meeting-room-capacity-calculator/page.tsx` render `div.tools-engine-placeholder`
and `div.tools-faq`. Neither class has any rule in `site/focss/**`. Two live marketing pages render
unstyled content. This is exempt from the phase gate — it was confirmed by reading the pages, not by
the audit. Decide whether the placeholder ships styled or the pages are withdrawn; do not add CSS for a
placeholder that is meant to be replaced by a real calculator.

### R10 — Remediate only measured findings, at the verified owner

1. Every task must cite route, audit path, viewport, finding, measured value, and the CSS or markup
   owner.
2. Accessible names and landmarks are markup work and must never be closed with CSS. A pseudo-element
   cannot create a landmark.
3. Console errors are runtime work. `/offline`'s is a 404 on
   `/media/hero/planning-poster.webp` plus a dev RSC prefetch abort — an asset and environment item,
   not an Offline-shell CSS item.
4. Presentation changes stay in the existing `site/focss/` tree and existing class names. A new sheet
   requires a stated reason why no existing canonical owner fits.
5. No Admin remediation task may be written until an authenticated run has rendered Admin pages. There
   is currently zero measured Admin evidence.

### R11 — One owner for the shared Planner sheets

`site/focss/planner/controls.css` and `workspace-shell.css` were targeted by both prior plans for the
same narrow-viewport concern. All Planner CSS in this remediation is owned by the Planner lane (R5–R8).
The site CSS lane must not edit Planner or Studio sheets.

### R12 — Fork isolation

No Planner file imports Studio and no Studio file imports Planner, in TSX or CSS. Planner keeps its own
`@import "tailwindcss"` and does not import `site/focss/base/scan.css`. Admin does not import site
marketing barrels. A similarly named file in the other fork is not a shared owner.

## R13 — Establish the tests both prior plans assumed existed

`tests/unit/app/api/Planner/projects/[id]/route.test.ts` and
`tests/unit/components/Planner/Planner.test.tsx` do not exist, and `Planner.tsx` has no covering tests
(`coveringTests: []`). `tests/unit/lib/Planner/plannerApi.test.ts` exists but only asserts URL/method
contracts. Coverage for status classification, the 401 branch, abort suppression, and the gate must be
created, not referenced.

Directory note: `tests/unit/planner/` (lowercase) is what `pnpm run p0:unit` targets, while
`tests/unit/lib/Planner/` and `tests/unit/components/Planner/` use the capitalised fork name. Pick
deliberately.

## Acceptance criteria

Phase 1:

- [ ] Audit runs authenticated; guarded routes render their own page or are marked `unmeasured`.
- [ ] Output directory name matches the recorded `baseUrl`.
- [ ] Coverage reported as measured-vs-requested, not as 61 assumed.
- [ ] Footer check honours `routeChromeRules`; the 130 findings are restated as 0 defects + artifacts.
- [ ] Target-size contract written down in one place, with exemptions, and the heuristic matches it.
- [ ] Text sampling uncapped; findings carry selector and computed size.
- [ ] Re-run command in `package.json`.

Phase 2 — Planner:

- [ ] 401 routes to sign-in with a return path; 403 is not presented as retryable.
- [ ] 404 gates the canvas and offers retry plus back-to-projects.
- [ ] 429/5xx/network are retryable, user-initiated, no automatic loop.
- [ ] Aborted and stale results cannot mutate state, toast, log, or clear storage.
- [ ] Status is classified from status, not from substring matching.
- [ ] Canvas still initialises; `window.__plannerFabricView` still available to e2e helpers.
- [ ] `PlannerProjectsList` distinguishes empty from failed.
- [ ] API route unchanged.

Phase 2 — site CSS:

- [ ] Calculator pages resolved (styled or withdrawn), with the decision recorded.
- [ ] Every remediation task cites a measured finding.
- [ ] No Admin task exists without authenticated Admin evidence.
- [ ] Landmarks and accessible names fixed in markup.
- [ ] Fork boundaries intact; Planner sheets touched only by the Planner lane.

## Non-goals

- Merging the two prior plans as written.
- Carrying forward the 130 footer findings, the Admin programme, or the unclassified 114 target
  findings as a backlog.
- Changing API status codes, auth, ownership checks, persistence selection, or rate-limit thresholds.
- Converting a missing project into a successful empty project.
- Adding a public footer to an app, workspace, admin, or redirect shell to satisfy a heuristic.
- Rebuilding FOCSS, adding a parallel CSS tree, or adding a breakpoint for this work.
- Treating aggregate pass counts as closure.
- Running tests, gates, browser suites, or Postman collections as part of authoring this spec.
