# Progress report: CSS remediation and Planner baseline vs. the unified audit

Date: 2026-08-26. Companion to `audit.md`, `requirements.md`, `design.md`, `tasks.md` in this folder.
Trigger: `plans/ref/site-page-css-remediation/tasks.md` has moved since the audit (Wave 0/1 items now
checked), and a new file, `plans/ref/planner-project-load-defect-baseline.md`, has appeared and asserts a
defect baseline. This report reconciles both against the findings already recorded in `audit.md`.

## 1. Site CSS tasks.md — what changed and what it's worth

Six items are now checked that were unchecked when audited:

| Item | Claim | Status against `audit.md` |
|---|---|---|
| 0.1 | Freeze 61 route patterns/samples from `route-inventory.json` | Fine — the route list itself is accurate. |
| 0.2 | Record DOM class/box/type/owner per row | Not independently re-checked here; unaffected by D1/D3. |
| 0.3 | Classify every `F` using `routeChromeRules.ts` + layout owners | **Premature.** D3: the source audit's footer check tests the *final* path, not the requested one, so 25 `/admin/*`-style rows were classified against the `/access` sign-in page, not against the route named in the row. Wave 2's per-row `F`/`AC` calls for Admin rows (`#4`–`#22`) inherit this. |
| 0.4 | Confirm no CSS file is outside its zone, no unverified owner named | Holds for the rows checked (spot-checked in `audit.md`: `mobile-tap-targets.css`, Planner sheets exist; `contact/contact-page.css` does not — it's `shared/contact-page.css`). |
| 1.1 | Type scale review (`type.css`/`typography.css`) | Independent of the audit defects; fine to keep, but downstream `T` counts are a floor, not a total (D5 — sampling capped at 3). |
| 1.2 | Shared buttons/tap-targets review at 768/390 | **Built on a target-size heuristic with no repo contract behind it** (D4). Any box changed to satisfy "H" right now is chasing a threshold nobody has ratified — `rect.width < 40 \|\| rect.height < 40`, either axis, flags ordinary inline links. |

Net: the two completed reviews (1.1, 1.2) are reasonable engineering regardless of the audit's problems
— a type-scale and tap-target pass rarely hurts. But 0.3's classification work, and by extension every
Admin row in Wave 2 that depends on it, needs to be redone once Lane E (in `tasks.md` here) fixes the
redirect-blind footer check. Marking 0.3 done now will make it look closed when 21 of its 26 `F` rows
were classified against the wrong page.

Recommendation: don't check off 0.3 as satisfied. Either re-open it pending an authenticated re-run, or
annotate it "classified against unauthenticated evidence — Admin/`/dashboard`/`/portal`/`/choose-product`
rows need reclassification." Same caution applies before advancing Wave 2 rows 4–22.

## 2. `plans/ref/planner-project-load-defect-baseline.md` — the 404/429 narrative persists, still uncited

This file restates the same defect story `audit.md` (D7) already flagged: a 404 at
`/ooplanner/projects/not-a-valid-id` and a repeated-load 429, presented as "Recorded: 2026-08-26" with
"Source: Planner browser audit." No artifact path is given, and — as before — none exists. It also adds
new material not in the original spec: a Wave-0.2 ownership confirmation and a frozen route/viewport
acceptance matrix.

What's newly checkable in this file, checked against live code:

| Claim in the baseline doc | Verification |
|---|---|
| API route "matches the documented contract exactly. No modification needed." | Confirmed independently in `audit.md` — 404 `{ detail: "Project not found" }`, 503 detail, `withAuth({ role: "member" })`. Accurate. |
| `Planner.tsx` "will own load-state and gate logic" | Consistent with `usePlannerFabric`'s `[]`-deps constraint already documented in `audit.md`/`design.md` here. |
| CSS entry point: state-surface styles belong in `workspace-shell.css` or `controls.css`, "no new stylesheet file needed" | Matches this folder's `design.md` §3.5 — same conclusion, independently reached. |
| "The defect reproduces identically at all five audited widths" | **Cannot be verified.** No screenshot, network log, or JSON entry for `not-a-valid-id` exists anywhere under `results/site/**`. The only persisted Planner network evidence, for `/ooplanner/projects/demo-plan/`, records a **401** (`Authentication required`), not a 404, and no 429 appears anywhere in `audit-results.json`. |

This is the same gap as before, just restated with more surrounding detail rather than closed. A
"frozen baseline" that cites no artifact isn't frozen against anything falsifiable — it's frozen against
itself. If the 404/429 were seen in an interactive session that wasn't saved, that's a real thing that
can still happen, but it has to be re-run and captured before it's load-bearing for a spec, precisely
because the one thing that *was* captured (the 401) tells a different story and demands a different UI
(sign-in, not retry — see `design.md` §3.1 and `requirements.md` R5.2 in this folder).

The route/viewport acceptance matrix in this file is otherwise well-formed and mostly reusable: it
already separates "primary fix" (Invalid route) from "regression only" (Valid route) and lists the
audited ready-state workflow baseline (Draw/Wall/Grid/Snap/Place/Review/BOQ/Layers/Validation/Export/
Save/Open) that this folder's `tasks.md` V3 references. The one row that needs to change is the Invalid
route's table: it should gain a 401 row above the 404 row, and the 404 row needs its "no replacement
project from local storage" language checked against the actual clear-condition in `Planner.tsx:1217`
(substring match on `"404"`/`"not found"`, not a status check — `audit.md` D2/D12 and `requirements.md`
R6.1 here).

## 3. What this means for sequencing

Nothing in either file invalidates the plan already written in this folder. It sharpens one thing: work
is already underway against the flawed baseline (CSS Wave 0/1 checkboxes; a restated Planner baseline
doc), so the evidence-gate in `tasks.md` (Lane E) is not hypothetical risk-avoidance — it's already the
difference between "done" and "done against the sign-in page" for 21 rows in Wave 2.

Concretely:

- Don't advance CSS Wave 2 rows 4–22 (all `/admin/*`) or the `F`-classification parts of rows 3, 24,
  28, 41, 42, 44 until Lane E1.4 (route-chrome-driven footer check) has re-run.
- Treat `plans/ref/planner-project-load-defect-baseline.md`'s 404/429 section as an unconfirmed hypothesis,
  not a baseline, until it's re-captured with a citable artifact. Its ownership confirmation and
  viewport matrix are fine to keep as-is.
- The 401 finding is the one piece of Planner evidence that is actually on record. It should be the
  first browser-verification case run once Lane P (P2.2 in this folder's `tasks.md`) ships, not a
  footnote to a 404 story that isn't in the artifacts.

## Not verified in this pass

- Whether `plans/ref/planner-project-load-defect-baseline.md`'s 404/429 were observed in a real, unsaved
  session. Absence of an artifact makes this unconfirmed, not disproven.
- DOM-level correctness of the CSS tasks.md's completed 1.1/1.2 changes — I read the task list, not a
  diff of the sheets themselves.
