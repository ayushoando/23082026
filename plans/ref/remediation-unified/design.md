# Design: unified remediation

Companion to `requirements.md` and `audit.md` in this folder.

## 1. Shape of the work

Three lanes, one gate.

```
Lane E (evidence)  ──gate──▶ Lane S (site CSS)
                             Lane P (Planner load)  ── independent, ungated
```

Lane E fixes the measuring instrument. Lane S cannot produce tasks until Lane E has measured its
zone. Lane P is ungated because its defects were confirmed by reading live code, not by the audit —
but Lane P owns all Planner CSS, so Lane S never touches `site/focss/planner/*`.

The prior plans had no gate. That is how a full Admin remediation programme came to be written on top
of 85 checks that all rendered the same sign-in page.

## 2. Lane E — repair the instrument

### 2.1 Authentication

`scripts/site-page-audit.mjs` has no session handling. It drives Playwright contexts per viewport
(`browser.newContext({ viewport })`, line ~386) with nothing else attached.

Approach: acquire a session once, reuse it for every context.

- Preferred: Playwright `storageState`. Sign in once, persist the state, pass it into every
  `newContext`. Keeps the audit honest about what a real authenticated user sees.
- Alternative for local runs: `DEV_AUTH_BYPASS=1`, which the repository already uses for disk-mode
  persistence. Cheaper, but it exercises the bypass path rather than the real auth path, so any
  finding it produces must be labelled as bypass-derived.

Whichever is chosen, admin-role and member-role coverage are different runs or different states —
`/admin/*` needs `requireAuthUser('/admin', 'admin')` to pass, `/ooplanner/*` needs a member.

### 2.2 Redirect-aware result rows

Today `finalPath` is recorded but not acted on. Add a third outcome alongside pass and finding:

```
requested === final                     → measured
requested !== final, same contract      → measured (note the normalisation, e.g. trailing slash)
requested !== final, crossed auth       → unmeasured  (no findings attributed to the requested route)
requested !== final, intentional 3xx    → redirect-only (assert the destination, no page findings)
```

`/access/` as a destination is the signal for the third case. `/admin` → `/access/` is not an Admin
finding and must not be counted as one.

### 2.3 Footer check driven by the real contract

Current code (lines 123-129) hardcodes three prefix families and tests them against `pathName`, which
is the final path:

```js
const isAppShell   = /^\/(ooplanner|oostudio|admin)(\/|$)/.test(pathName);
const isSuiteShell = /^\/(dashboard|portal|choose-product)(\/|$)/.test(pathName);
const isOfflineShell = pathName.startsWith("/offline");
if (!isAppShell && !isSuiteShell && !isOfflineShell) { ... if (!footer) issues.push(...) }
```

Two problems: the prefix lists duplicate `routeChromeRules.ts` and can drift from it, and testing the
final path means a redirect to `/access/` escapes every exclusion.

Redesign: resolve the expectation from the **requested** route via `resolveRouteChromeMode`, then
assert against what rendered.

| Resolved contract | Expectation |
|---|---|
| `footer: "full"` | `footer` or `[role="contentinfo"]` must be present — a real finding if absent |
| `footer: "login-tools"` | assert the login-tools footer variant, not the marketing footer |
| `footer: "hidden"` | no assertion |

`routeChromeRules.ts` also covers CAD and workspace prefixes and returns
`{ header: "hidden", footer: "hidden" }` for them, so app and workspace shells fall out naturally
without a duplicate prefix list. Admin is outside the `(site)` layout entirely and is asserted against
`AdminLayoutShell`, not the public footer.

Expected result: the 130-finding category collapses to approximately zero, matching
`footer-contract-evidence.json`'s `"required public footer": 0`.

### 2.4 Target-size contract

Two separate things, currently conflated:

- **Floor (pass/fail).** WCAG 2.2 SC 2.5.8 — 24×24 CSS px, with the standard exemptions
  (inline links in body text, user-agent controls, essential and equivalent-alternative cases).
  Enforceable and defensible.
- **Touch aspiration (advisory).** 40px for primary touch controls on narrow viewports. This is what
  the repo's own `.icon-btn` (40×40) and `.pw-step-bar__btn` (`min-height: 40px`) already reach for,
  while `.btn--icon` sits at 32px.

Heuristic changes:

```
current:  rect.width < 40 || rect.height < 40           → either axis, flags all inline links
floor:    rect.width < 24 && rect.height < 24  (+ exemptions, both axes)
advisory: report 24–40 separately, as advisory, never as a defect
```

Each finding records selector, computed box, failing axis, and which bar it failed. Where the
contract is written down is a decision for Lane E task 1.5 — a candidate is a short section in
`docs/architecture/css.md` referenced from `Agents/07-css.md`, so `focss-css` guidance can point at it.

Enforcement reality check: `verify:focss` is five import/fence/structure verifiers
(`verify-focss-imports`, `verify-site-css`, `verify-focss-fences`, `verify-focss-module-imports`,
`verify-focss-structure`), `lint:ui:strict` is `lint-ui-contract.mjs --strict`, and
`check:style-tokens` is `check-style-tokens.mjs`. None of them measures a rendered box. Target size is
only catchable by the browser audit or a new DOM test — the CSS gates cannot regress-guard it.

### 2.5 Text sampling

Remove the three-sample cap. Record selector and computed size per finding. Report the total, and note
in the artifact that the previous 16 was capped so the two runs are not compared as like for like.

### 2.6 Reproducibility

Register the entry points. Neither generator is in `package.json` today:

```
audit:site-pages   → node scripts/site-page-audit.mjs --out=results/site/page-audit-<label>
graph:page-components → node scripts/generate-page-component-graph.mjs
```

`AUDIT_BASE_URL` selects the target and must be echoed into the output directory label, so a localhost
run can never again be filed as `production`.

## 3. Lane P — Planner project load

### 3.1 State model

Extends the prior plan's union with the branches the recorded evidence needs.

```
Draft         no effective id
Loading       projectId, requestKey
Ready         projectId, project
Unauthorized  projectId, status 401   → sign-in, carries return path      [recorded case]
Forbidden     projectId, status 403   → no retry, route to projects
NotFound      projectId, status 404   → retry same id + back to projects
Unavailable   projectId, status?      → retryable: 429, 5xx, network
```

Aborted and stale are internal control flow, never rendered.

The split that matters: **retryable vs not**. The prior plan's single `TransientError { retryable: true }`
bucket would put a Try-again button in front of a signed-out user, which can never succeed. 401 is the
one state a persisted artifact actually recorded, so it gets the most careful treatment:

- copy states that sign-in is required, not that the plan is missing or broken;
- the action is sign-in, carrying a return path back to the requested project;
- the last-project key is retained — being signed out says nothing about whether the project exists.

Storage rules per state: retain the key on 401/403/429/5xx/network; clear it on 404 **only** when it
equals the failed id.

### 3.2 Status classification

`readJson` in `site/lib/Planner/plannerApi.ts` throws `new Error(detail)`. Every consumer then guesses.
Replace with a carrier that keeps `status`, plus the code where the envelope supplies one.

Two response shapes must both be handled, because the Planner route is inconsistent with the rest of
the API:

```
bare:      { detail: "Project not found" }                                   ← the [id] route
envelope:  { success: false, error: { code: "AUTH_REQUIRED", message: ... } } ← withAuth failures
```

401 and 429 arrive as the envelope (from `withAuth` → `apiResponse.error()`); 404 and 503 arrive bare
(from the route handler itself). `readJson` already reads both shapes for the message — it just drops
the status.

Reuse `site/features/shared/api/ApiError.ts`'s `status`/`code`/`API_ERROR_CODES` vocabulary.
It is a server-side module today with 41 fan-in, so decide explicitly between sharing it and mirroring
a small client type. Sharing is preferable if it does not drag server-only imports into the bundle;
mirroring is acceptable if it reuses the same `API_ERROR_CODES` values. Do not invent new codes.

`AbortError` is cancellation, never a rendered state.

### 3.3 Gating without killing the canvas

Hard constraint from `usePlannerFabric.ts`: the effect has `[]` deps and returns early when
`wrapperRef.current` or `canvasElRef.current` is null. It never re-runs. So:

- the wrapper and canvas elements stay mounted in every state;
- gating is an overlay plus interaction suppression plus keyboard exclusion, scoped by a Planner state
  class or attribute on the root;
- `aria-busy` while loading; the gated workspace must not remain tab-reachable as an apparently loaded
  plan;
- no flash of an empty canvas presented as the requested plan at first paint;
- `window.__plannerFabricView` must stay published — `tests/e2e/plannerCanvasHelpers.ts` reads it.

The alternative — making `usePlannerFabric` re-initialisable via a callback ref — is a larger change
with e2e blast radius and is not proposed here.

### 3.4 Request lifecycle

The current effect has deps `[ready, routeId, fabricRef, showToast, drawGridAndSheet, refreshLayers]`
and no cleanup, so callback identity changes can re-fire it and nothing can cancel it.

Sequence: resolve effective id (route id first; localStorage only on bare `/ooplanner`) → one request
per id with an `AbortSignal` → abort or detach on unmount, id change, or replacement retry → apply
project data only if the result is still current.

Dedup is a decision, not a default. Check for a `QueryClientProvider` over the Planner tree first:

- present → use `useQuery` with the project id in the key; dedup, cancellation, and staleness come free;
- absent → follow `site/components/site/Header.tsx:43-45`, the module-level promise written for this
  exact Strict-Mode double-fetch problem, or `site/lib/ai/useAiAdvisor.ts`'s `abortRef` pattern.

A bespoke keyed registry is the last option and needs a written reason, given
`@tanstack/react-query ^5.101.4` is already a dependency.

Projects list: add an error state distinct from empty. It currently has `loading` but swallows errors
in a bare `catch {}` and renders "No saved plans yet", so a 401 and an empty account look identical.

### 3.5 Planner CSS

Owner: `site/focss/planner/workspace-shell.css` for the gate and state surface;
`controls.css` only if the recovery actions need treatment the existing `.btn` contract lacks.

Reuse what exists rather than inventing: `.empty-state` (`controls.css:37`), `.panel-empty-state`
(`controls.css:39-48`), `.planner-handoff__error` (`workspace-shell.css:239-249`), `.dialog-scrim`
(`workspace-shell.css:194`). There is no load-gate overlay, skeleton, or spinner in the Planner sheets
today, so the gate surface is genuinely new. Note `.canvas-overlay` is the floating toolbar, not a
blocking overlay — do not repurpose it.

Semantic Planner tokens only. No raw palette values, no Studio import, no new sheet.

## 4. Lane S — site CSS

Ordering, once Lane E has measured:

1. **Shell contract.** Should resolve to nothing after §2.3. Confirm zero and move on.
2. **Zone primitives.** Repeated failures against the decided floor, fixed once at the narrowest shared
   owner — site `shared/buttons.css` and `mobile-tap-targets.css`, Admin `base/buttons.css` and
   `primitives.css`. Verified to exist.
3. **Page families.** Only residual layout context the primitive cannot solve.
4. **Markup and runtime.** Accessible names and landmarks in components; console errors to their
   runtime owner. Never closed with CSS.
5. **Owner gaps.** The calculators (§5).

Admin enters at step 2 only with authenticated evidence. Until then Admin has no measured findings at
all.

## 5. Calculator owner gap

Both pages render, inside `HomeMarketingLayout`:

```tsx
<div className="tools-engine-placeholder" data-testid="office-space-calculator-placeholder">
<div className="tools-faq">
```

Neither class matches any rule in `site/focss/**`. The FAQ content is substantial and SEO-shaped
(`buildBreadcrumbJsonLd`, four FAQ entries) but `metadata.indexable: false`.

Three options, and the choice must be recorded before any CSS is written:

1. **Style the placeholder.** Add the two classes to a site sheet. Fastest, but styles something whose
   name says it is temporary.
2. **Build the calculator.** The FAQ text specifies real behaviour (NBC circulation ratios per preset,
   6/8/2.2 sqm per seat). Largest scope, out of a CSS remediation's remit.
3. **Withdraw the routes.** They are already non-indexable.

Option 1 is the CSS-lane-appropriate answer; option 2 is a product decision that does not belong in
this spec.

## 6. Verification design

All user-invoked.

**Lane E** — re-run the audit authenticated; confirm measured-vs-requested coverage rose (36+ of 61
route patterns rather than 61 assumed), footer findings collapsed to ~0, and target findings are split
into floor failures and advisory notes.

**Lane P, unit** — `plannerApi` status classification for 401/403/404/429/503 across both response
shapes, plus abort. A load-state component test per branch, with the 401 branch asserting a sign-in
action and no retry action. An editor integration test for id precedence, gating, stale/abort
suppression, and successful handoff. These files do not exist yet and must be created; the prior plan
cited a route test that has never existed.

**Lane P, browser** — at 1920/1440/1078/768/390: signed-out project load shows sign-in (the recorded
case); a missing id shows not-found with recovery; a throttled or 5xx response shows retryable copy and
does not clear the fallback key; a valid project still exercises Draw, Wall, Grid, Snap, Place, Review,
BOQ, Layers, Validation, Export, Save, Open; no repeated GET storm on mount or retry.

**Lane S** — per-route, per-viewport comparison against the Phase 1 baseline. Aggregate counts do not
close a route.

**Repo checks** — `check:layout`, `verify:focss`, `lint:ui:strict`, `check:style-tokens`, and
`scan:boundaries` when a fork is touched. Note none of these can catch a target-size regression; only
the audit or a new DOM test can.

## 7. Guardrails

- Planner never imports Studio; Studio never imports Planner. `scan:boundaries` before committing
  either tree.
- Lane S does not edit `site/focss/planner/*` or `site/focss/studio/*`.
- `Planner.tsx` has 48 direct in-repo dependencies and no covering tests. Changes stay scoped to load
  state and lifecycle; re-run `node scripts/graph-impact.mjs --file=site/components/Planner/Planner.tsx --depth=3`
  after implementation. The graph tool prints to stdout and persists nothing, so cite the command, not
  a file.
- Durable planning stays in `.kiro/specs/remediation-unified/`. Generated evidence stays under
  `results/**`. No hand-written Markdown reports under `results/`.
