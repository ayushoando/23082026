# Audit: `planner-remediation` and `site-page-css-remediation`

Audit date 2026-08-26. Method: every factual claim in both specs was checked against live
repository files and against the audit artifacts the CSS spec names as its source of truth.
Nothing here is inferred from the spec text itself.

Sources audited:

- `.kiro/specs/planner-remediation/{requirements,design,tasks}.md` — referred to below as **P**.
- `.kiro/specs/site-page-css-remediation/{requirements,design,tasks}.md` — referred to below as **C**.

Only two spec folders exist. Both are untracked (`git status`: `?? .kiro/specs/planner-remediation/`,
`?? .kiro/specs/site-page-css-remediation/`) and both were written on 2026-08-26. If a third plan was
intended it is not present in `.kiro/specs/`, `plans/`, or anywhere else modified in the last three days.

## Verdict

Both specs are well-structured and unusually disciplined about ownership and scope. Both are also
built on evidence that does not survive checking. C's entire Admin section rests on checks that never
rendered an Admin page, and its largest finding category has zero real defects. P's central defect
narrative is not what any persisted artifact records, and it does not model the one failure state that
is recorded.

The correct action is not to merge them. It is to re-establish evidence first, delete the categories
that measurement does not support, and keep the parts that verified clean.

| | Claims checked | Confirmed | Wrong or unsupported |
|---|---|---|---|
| C | 24 | 15 | 9 |
| P | 21 | 14 | 7 |

## Confirmed correct

These verified exactly and carry into our version unchanged.

- **C's headline counts.** `results/site/page-audit-production-complete/audit-results.json`
  reports `routeCount: 61`, `viewportCount: 5`, `checkCount: 305`, `statusCounts: {"200": 305}`, and
  `issueCounts` of `text below 11px: 16`, `missing footer/contentinfo landmark: 130`,
  `console errors: 15`, `visible controls without accessible names: 6`,
  `small interactive targets under 40px: 114`. Every number in C matches verbatim.
- **C's viewport set.** `scripts/site-page-audit.mjs:9-17` defines exactly w1920/1440/1078/768/390.
- **C's calculator owner gap.** Correct, and understated. `site/app/(site)/tools/office-space-calculator/page.tsx`
  renders a static `div.tools-engine-placeholder` and a `div.tools-faq` inside `HomeMarketingLayout`.
  Neither class has any rule anywhere in `site/focss/**/*.css`. Two live marketing pages render
  entirely unstyled content blocks. This is the most concrete real defect either spec found.
- **C's `/login` chrome contract.** `site/features/site/data/routeChromeRules.ts:72-77`: login paths
  return `{ header: "full", footer: "login-tools" }` when the `next` param is present and
  `{ header: "hidden", footer: "login-tools" }` otherwise. Exactly as C states.
- **C's fork isolation constraints.** The four zone entries exist and are separate;
  `site/focss/planner/entry.css` does carry its own `@import "tailwindcss"`.
- **P's API contract reading.** `site/app/api/Planner/projects/[id]/route.ts` returns
  `{ detail: "Project not found" }` with 404 (twice — a foreign project is masked as 404, not 403) and
  `{ detail: "Planner persistence not configured" }` with 503. Success returns the raw record, not the
  `{ success: true }` envelope. P's instruction to leave this route alone is sound.
- **P's status-loss diagnosis.** `site/lib/Planner/plannerApi.ts:13-38` — `readJson` extracts
  `detail`/`message`/`error` and throws a plain `new Error(detail)`. HTTP status is discarded unless the
  body is unparseable. `getProject(id)` (line 77) takes no options and no `AbortSignal`.
- **P's `useFabric` warning.** Load-bearing and correct. `site/hooks/Planner/usePlannerFabric.ts`
  bails when `wrapperRef.current`/`canvasElRef.current` are null and its effect has `[]` deps, so it
  never re-runs. An early-return gate would leave `ready` false permanently and kill the editor.
  P is right to forbid that pattern; our version keeps the warning and makes it a hard constraint.
- **P's graph numbers.** Regenerated and matched: 1,740 files / 3,368 edges, planner 129, api 69,
  `Planner.tsx` 48 direct in-repo dependencies, `coveringTests: []`.

## Defects

### D1 — C's evidence was collected unauthenticated; 25 route patterns never rendered (critical)

The audit ran with no session. `scripts/site-page-audit.mjs` has no cookie, storage-state, or
`DEV_AUTH_BYPASS` handling anywhere. Guarded routes redirected to the sign-in page, and the audit
recorded the sign-in page while still labelling the row with the requested route.

`audit-results.json` shows `"routePattern": "/admin"` … `"finalPath": "/access/"`, and the same for
every `/admin/*` route. The run's own `footer-contract-evidence.json` states the scale plainly:

```
"classificationCounts": { "required public footer": 0,
                          "intentional footerless shell": 5,
                          "redirect/auth contract": 125 }
```

125 of 130 findings belong to the auth redirect — 25 route patterns × 5 viewports, all of them
measuring one page. Every `/admin/*` row in C carries `"smallInteractiveTargets": 2` and
`issueCount: 7`, identical across 17 routes, because it is the same `/access` page every time.

C nevertheless keeps a full Admin programme: design.md §2 and §3 assign Admin CSS ownership,
§5 lists Admin page owners, and Wave 4 is *"Fix `AdminLayoutShell` and Admin primitives once, then
page-family exceptions."* There is no measured Admin evidence for any of it. `AdminLayoutShell.tsx`
was never rendered by this audit.

### D2 — "production" is false (critical)

All three artifacts record `"baseUrl": "http://localhost:3000"`, and the script defaults to
`process.env.AUDIT_BASE_URL?.trim() || "http://localhost:3000"` (line 5). The directory is named
`page-audit-production-complete` and C's requirements.md calls it *"the completed audit in
`results/site/page-audit-production-complete/`"*. It is a local dev-server run. Findings inherit dev
behaviour — unminified CSS, dev asset resolution, dev prefetch aborts — none of which C accounts for.

### D3 — The 130-finding footer category contains zero real defects (high)

`scripts/site-page-audit.mjs:123-129` skips the footer assertion entirely for app shells
(`/ooplanner`, `/oostudio`, `/admin`), suite shells (`/dashboard`, `/portal`, `/choose-product`) and
`/offline`. Those routes were flagged only because the check reads the **final** path, and the final
path was `/access/`, which is not on any exclusion list. So the category is an artifact of D1 layered
on a path-resolution bug in the harness.

Combined with `footer-contract-evidence.json`'s `"required public footer": 0`, the real public-footer
defect count is zero. C's R5 is its longest requirement and its design §4 is a full classification
table for a category with nothing in it.

### D4 — The "40px target contract" C and P both cite does not exist (high)

The heuristic is `rect.width < 40 || rect.height < 40` (line 154) — **either** dimension, applied to
every `a, button, input, select, textarea`, and only at widths ≤768 (line 158). Because it fails on
either axis, every inline text link is flagged: body links are naturally under 40px tall. That alone
accounts for the bulk of 114.

There is no repo-wide 40px rule to measure against. In the Planner sheets the only 40px rules are
`controls.css:15` `.icon-btn { width: 40px; height: 40px }` (a fixed size, not a floor) and
`workspace.css:394` `.pw-step-bar__btn { min-height: 40px }`. `controls.css:14` `.btn--icon` is
**32px**. No lint rule, token, test, or doc states a 40px minimum.

C's R3 asserts *"the repository's 40px target contract"* and P's R8.3 asserts *"the existing 40px
target expectation"*. Both are describing a contract that has never been written down. For reference,
WCAG 2.2 SC 2.5.8 sets 24×24 and explicitly exempts inline links.

### D5 — The sub-11px count is capped, so 16 is a floor not a total (medium)

`scripts/site-page-audit.mjs:121`: `if (smallText.length >= 3) break;`. Sampling stops at three per
check. The true number of sub-11px elements is unknown and at least 16. C treats 16 as the complete
set and enumerates four review points as if exhaustive.

### D6 — Neither spec's re-audit is runnable as written (medium)

`scripts/site-page-audit.mjs` and `scripts/generate-page-component-graph.mjs` are **not** registered
in `package.json`. C's R10 requires the user to *"re-run the deterministic 61 × 5 browser audit"* and
gives no command. The real invocation is `node scripts/site-page-audit.mjs --out=<dir>` with
`AUDIT_BASE_URL` in the environment. P has the same gap for its five-width browser lane.

### D7 — P's central defect is not what any artifact records (critical)

P names no artifact path at all. It asserts a *"verified Planner browser audit"* whose confirmed
defect is `/ooplanner/projects/not-a-valid-id` returning 404, plus repeated 429s.

The only persisted Planner evidence in the repository records neither. For
`/ooplanner/projects/demo-plan/`, `audit-results.json` has:

```
"httpErrors": [{ "status": 401, "url": ".../api/Planner/projects/demo-plan/", "resourceType": "fetch" }],
"consoleErrors": [
  "Failed to load resource: the server responded with a status of 401 (Unauthorized)",
  "[Planner] load project failed: Authentication required {effectiveId: demo-plan, routeId: demo-plan}"
]
```

The observed failure is **401 Unauthorized**. No persisted artifact anywhere contains a Planner 404
for `not-a-valid-id` or a 429. The 404 and 429 may well have been seen in an unsaved session, but a
plan cannot treat them as *"the confirmed defect"* while the recorded evidence says something else.

### D8 — P has no 401 state, which is the only state actually evidenced (critical)

`site/features/shared/api/withAuth.ts:136-138` returns `ApiError(401, AUTH_REQUIRED,
"Authentication required")` before the handler runs, for a `role: "member"` GET. P's state union is
Draft / Loading / Ready / NotFound / TransientError, and R4 sweeps everything non-404 into
`TransientError { retryable: true }`.

Applying that to a 401 produces a Try-again button that can never succeed, because the user is not
signed in. 403 has the same problem. An unauthenticated load must offer sign-in with a return path,
not retry. This is a design error, not a wording gap, and it lands precisely on the recorded case.

### D9 — P cites a covering test that does not exist, and leans on it (high)

`tests/unit/app/api/Planner/projects/[id]/route.test.ts` is named four times — requirements
("the covering unit test"), design §2 and §10, and tasks 1.4 and 5.3 — and carries P's argument for
leaving the API route alone: *"the existing route test … is the server-side guard."*

Neither the file nor the directory `tests/unit/app/api/Planner/` exists. `tests/unit/components/Planner/Planner.test.tsx`
does not exist either. `graph-impact.mjs --file=site/components/Planner/Planner.tsx` reports
`coveringTests: []`. What does exist is `tests/unit/lib/Planner/plannerApi.test.ts`, and it only
asserts URL/method path contracts — it does not test non-OK handling at all.

The conclusion (don't touch the route) is still right. The stated reason is false, and the plan's
rollback logic in tasks §"Rollback-safe sequencing" item 5 depends on that false premise.

### D10 — P plans a bespoke in-flight registry without checking what exists (medium)

P's R6, design §6 and task 3.1 specify a hand-rolled keyed in-flight registry.
`@tanstack/react-query ^5.101.4` is already a dependency and already in product use
(`site/features/site/catalog/FilterGridInner.tsx:7`, `useQuery` with a `queryKey`). Three ad-hoc
precedents also exist: a module-level promise in `site/components/site/Header.tsx:43-45` (written for
exactly this Strict-Mode double-fetch problem), an `inFlight` ref in
`site/hooks/Studio/useStudioDraftAutosave.ts`, and an `abortRef` in `site/lib/ai/useAiAdvisor.ts`.

The deciding question is whether a `QueryClientProvider` wraps the Planner tree. It could not be
confirmed by search. P never asks it, and would add a fourth bespoke pattern without justification.

### D11 — P misdescribes how the route id reaches the editor (medium)

P's R1.1 makes `routeId` authoritative "whenever `/ooplanner/projects/[id]` is rendered", implying a
route binding. `site/features/Planner/projects/[id]/page.tsx` is `return <Planner />;` — no `params`
read, nothing threaded. The id is picked up client-side at `Planner.tsx:104` via `useParams()`.
A requirement about id precedence has to name the mechanism it is constraining.

### D12 — P's 429 concern is real but mis-scoped (low-medium)

The limiter is `withAuth`'s per-`(scope, IP)` sliding window: `rateLimitScope: "planner-projects-id:get"`,
`rateLimit: 60` per 60s. There is no `site/middleware.ts`. A human navigating cannot plausibly reach
60 GETs/minute; the 429 was almost certainly produced by the audit loop itself. Worth fixing the
lifecycle regardless — the load effect at `Planner.tsx:1189-1223` has no cleanup, no abort, and
includes `drawGridAndSheet`/`refreshLayers` callbacks in its deps, so it can legitimately re-fire.

Related: the current 404 handling only works by coincidence. Status is lost, so `Planner.tsx:1217`
substring-matches `"404"`/`"not found"`; it fires only because `"Project not found"` happens to
contain `"not found"`.

### D13 — The two specs collide on the same files with no cross-reference (structural)

C's R7 assigns the `/ooplanner/projects` and `/ooplanner/projects/[id]` console errors to "runtime
owners". P owns exactly that code. C's Wave 5 edits Planner `controls.css` and `workspace-shell.css`;
P's Wave 4 edits the same two sheets for the same narrow-viewport target concern. Neither mentions the
other. Run independently they produce conflicting edits to the same rules.

### D14 — `/offline`'s console error is an asset 404, not a shell concern (low)

`audit-results.json` for `/offline`: a 404 on `http://localhost:3000/media/hero/planning-poster.webp`
plus an aborted RSC prefetch (`net::ERR_ABORTED` on `/?_rsc=…`). A missing media file and a dev
prefetch abort. C's ownership table frames `/offline` around `OfflinePageView` and `error-page.css`,
which is not where this lives.

## Not verified

Stated so it is not mistaken for confirmed:

- Whether 61 is the complete user-facing route surface. Route records come from
  `tech-docs-generator/scripts/extract-routes.mjs`; I did not independently enumerate `site/app` to
  check for omissions.
- Whether a `QueryClientProvider` is mounted over the Planner tree (D10).
- The internals of `site/lib/rateLimit` (store and window implementation).
- C's full canonical CSS file list. Spot checks passed (`mobile-tap-targets.css`,
  `site/focss/planner/*`), and the two calculator classes were confirmed absent, but I did not
  existence-check all ~90 paths C names.
- Whether the `/ooplanner/projects/not-a-valid-id` 404 and the 429 were genuinely observed in an
  unsaved session. They are absent from artifacts; that makes them unsupported, not disproven.

## What carries forward

Keep: C's counting discipline and its refusal to let CSS paper over markup problems; C's
calculator owner gap; C's classification vocabulary; P's `useFabric` constraint; P's API-contract
restraint; P's insistence on separating expected recovery from unexpected failure; both specs'
fork-boundary rules.

Drop: C's Admin programme (no evidence), C's footer classification programme (zero defects),
both specs' appeals to a 40px contract that does not exist, P's 404/429 defect narrative, P's
reliance on a non-existent test.

Add: an authenticated re-audit before any remediation task is written; a 401/403 branch in the
Planner state model; a decision on the target-size contract; a single owner for the shared Planner
sheets.
