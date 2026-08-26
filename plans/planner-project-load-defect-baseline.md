# Planner project-load defect baseline

Recorded: 2026-08-26
Source: Planner browser audit at 1920, 1440, 1078, 768, and 390 CSS pixels.
Spec: `.kiro/specs/planner-remediation/`

---

## Confirmed defect — invalid project id leaves canvas visible

### Route

`/ooplanner/projects/not-a-valid-id`

### Observed API behavior (correct)

- `GET /api/Planner/projects/not-a-valid-id/` returns HTTP **404**.
- Response body: `{ "detail": "Project not found" }`.
- The server-side contract is working as designed. No API change is required.

### Observed client behavior (defective)

1. The Planner client receives the 404 response.
2. A console load failure is emitted (generic error path).
3. A toast notification appears indicating load failure.
4. **The normal Planner canvas/workspace remains visible** as though a project loaded successfully.
5. Interactive workspace controls (Draw, Wall, Grid, Snap, Place, Review, BOQ, Layers, Validation, Export, Save) appear available despite no valid project data.

### Expected client behavior (not yet implemented)

- The normal canvas/workspace must not be presented as a loaded plan after a 404.
- An explicit not-found recovery surface should be shown with Retry and Back to projects actions.
- The route id must remain authoritative; a failed route id must not fall back to displaying a different saved project from local storage.

### Root cause summary

The Planner editor derives success from the absence of a blocking error rather than an explicit load-state model. When `getProject` throws on non-OK, the error is caught and toasted, but no state transition prevents the workspace from rendering in its default (apparently ready) state.

---

## Separate observation — repeated-load 429

### Context

During the same audit session, repeated automated project loading also produced HTTP **429 Too Many Requests** responses.

### Classification

This is a **transient request-lifecycle concern**, not a not-found defect:

- It results from the client issuing duplicate/uncancelled project requests in quick succession (effect re-runs, remounts, or navigation transitions).
- It is rate-limit enforcement by the server, not an indication that the project is missing.
- The 429 must be classified separately from a 404 in the remediation.

### Relationship to the primary defect

- The 429 observation reinforces the need for request deduplication and cancellation cleanup in the client lifecycle.
- It does not change the not-found fix: even without rate limiting, navigating to an invalid id must not leave the canvas visible.
- The remediation addresses both concerns (explicit load states for all failure classes, plus deduplicated/cancellable requests) but the 429 is a request-lifecycle improvement, not the primary invalid-project defect.

---

## Baseline contract to preserve

| Endpoint | Condition | Expected |
|---|---|---|
| `GET /api/Planner/projects/[id]/` | Valid project | 200 + project JSON |
| `GET /api/Planner/projects/[id]/` | Missing/unauthorized | 404 `{ detail: "Project not found" }` |
| `GET /api/Planner/projects/[id]/` | Persistence unavailable | 503 + existing detail |

These API behaviors are correct and must remain unchanged throughout the remediation.

## Graph evidence (frozen)

- Import graph: 1,740 files, 3,368 edges.
- Planner domain: 129 files; API domain: 69 files.
- `site/components/Planner/Planner.tsx`: 48 direct dependencies, 4 impacted Planner page files, no graph-discovered covering tests.
- `site/app/api/Planner/projects/[id]/route.ts`: 4 direct dependencies, covered by `tests/unit/app/api/Planner/projects/[id]/route.test.ts`.

## Affected viewport widths

The defect reproduces identically at all five audited widths: 1920, 1440, 1078, 768, and 390 CSS pixels. The invalid canvas remains visible regardless of viewport size.


---

## Ownership confirmation — Wave 0.2

Confirmed: 2026-08-26 (pre-edit freeze)

### Dynamic route page — `/ooplanner/projects/[id]`

- **App Router entry:** `site/app/ooplanner/projects/[id]/page.tsx`
  Re-exports from `@/features/Planner/projects/[id]/page`.
- **Feature page:** `site/features/Planner/projects/[id]/page.tsx`
  Renders `<Planner />` from `@planner/components/Planner`.
- **Status:** Delegates to the shared Planner editor as expected. No intermediate logic or layout wrapper.

### Bare Planner route — `/ooplanner`

- **App Router entry:** `site/app/ooplanner/page.tsx`
  Re-exports from `@/features/Planner/page`.
- **Feature page:** `site/features/Planner/page.tsx`
  Renders `<Planner />` from `@planner/components/Planner`.
- **Status:** Delegates to the same shared Planner editor. Bare and project routes share the component.

### Editor component

- **Path:** `site/components/Planner/Planner.tsx`
- **Status:** Exists, `"use client"`, imports `useRouter`/`useParams` from `next/navigation`, `useFabric`, `useHistory`, and Planner-domain utilities. This is the component that will own load-state and gate logic.

### API route — `GET /api/Planner/projects/[id]/`

- **Path:** `site/app/api/Planner/projects/[id]/route.ts`
- **404 contract:** Returns `{ detail: "Project not found" }` with status 404 for missing or unauthorized records.
- **503 contract:** Returns `{ detail: "Planner persistence not configured" }` with status 503 when the database is unavailable.
- **Auth:** Wrapped with `withAuth({ role: "member" })` and rate-limited at 60 req/scope.
- **Status:** Matches the documented contract exactly. No modification needed.

### Planner client

- **Path:** `site/lib/Planner/plannerApi.ts`
- **Status:** Exists. Will be extended (not replaced) in Wave 1 to retain HTTP status on error and accept AbortSignal.

### CSS entry point

- **Path:** `site/focss/planner/entry.css`
- **Imports:** `tailwindcss`, palette tokens, semantic, layout, document, chrome, controls, polish, workspace-shell, workspace, dock.
- **Status:** Confirmed as the self-contained Planner CSS entry. The state-surface styles belong in `workspace-shell.css` (already imported) or `controls.css` (already imported). No new stylesheet file is needed for the gate.

### Alternate paths noted in design doc

The design doc references `site/app/ooplanner/projects/[id]/page.tsx → site/features/Planner/projects/[id]/page.tsx`. Both paths exist and delegate correctly. The `site/features/Planner/` directory is the implementation layer; App Router entries are thin re-exports.

### Deviations from design doc

None. All owners match the expected state described in design.md § 2. The implementation plan can proceed.


---

## Route / viewport acceptance matrix (frozen)

Frozen: 2026-08-26
Purpose: Record the expected behavior at each route × viewport combination so browser verification can confirm both the primary fix and the absence of regressions. Ready-state workflows that passed the original audit are regression checks, not re-design targets.

### Routes under test

| Key | Route | Role |
|-----|-------|------|
| **Bare** | `/ooplanner` | Blank/new-plan workspace or last-project fallback |
| **List** | `/ooplanner/projects` | Project list, empty-state, saved-plan cards |
| **Invalid** | `/ooplanner/projects/not-a-valid-id` | Invalid project id — primary defect target |
| **Valid** | `/ooplanner/projects/[valid-id]` | Saved project editor — regression baseline |

### Viewport widths

All checks apply at exactly these five CSS pixel widths: **1920, 1440, 1078, 768, 390**.

---

### Bare route — `/ooplanner`

| Width | Expected behavior |
|-------|-------------------|
| All five | When no last-project fallback exists: Draft workspace renders (blank canvas, tool rail available). No error state is shown. |
| All five | When a valid last-project fallback exists: That project loads into the editor; Ready state applies. |
| All five | When a stale/invalid last-project fallback exists: Must not silently display a different project's canvas. The load lifecycle governs the outcome. |
| 768, 390 | Compact shell, mobile bottom action bar, and canvas geometry remain usable in Draft or Ready. No horizontal overflow. |

**Regression checks (passed audit, not re-design targets):** Draft workspace layout, tool rail availability, fallback-load flow.

---

### List route — `/ooplanner/projects`

| Width | Expected behavior |
|-------|-------------------|
| All five | Project list renders with saved-plan cards or empty-state actions. Navigation into an editor works. |
| All five | Transient list-load failure (429/5xx/network) shows a recoverable state, not a blank page or stale list. |
| All five | No duplicate effect-driven list requests or uncontrolled 429 storm. |
| 768, 390 | List cards/actions wrap or stack without horizontal overflow. Interactive targets meet 40 px expectation. |

**Regression checks (passed audit, not re-design targets):** Card layout, empty-state actions, navigation into editor.

---

### Invalid route — `/ooplanner/projects/not-a-valid-id`

| Width | Expected behavior (primary fix target) |
|-------|----------------------------------------|
| All five | API returns 404 `{ detail: "Project not found" }`. |
| All five | Normal canvas/workspace is NOT visible as a loaded plan. |
| All five | Not-found recovery surface is visible: clear message, **Try again** (same id), **Back to projects**. |
| All five | No replacement project from local storage is displayed. |
| All five | No uncaught generic error log for the expected 404 path. Toast alone is insufficient. |
| All five | Recovery controls are keyboard-accessible with visible focus. |
| 768, 390 | Recovery message and actions wrap/stack without horizontal overflow. 40 px interactive targets preserved. |

**This is not a regression check — it is the primary defect under remediation.**

---

### Valid saved project — `/ooplanner/projects/[valid-id]`

| Width | Expected behavior |
|-------|-------------------|
| All five | Project loads; Ready state applies; canvas renders the saved project data. |
| All five | All audited workflows remain available after Ready: Draw, Wall, Grid, Snap, Place/catalog search and placement, Review, BOQ, Layers, Validation, Export, Save, Open. |
| All five | No stale/aborted response overwrites the current project after navigation or retry. |
| 768, 390 | Compact shell, mobile bottom action bar, canvas geometry, and tool access remain usable. No horizontal overflow. |

**Regression checks (passed audit, not re-design targets):** Draw, Wall, Grid, Snap, Place/catalog, Review, BOQ, Layers, Validation, Export, Save, Open workflows.

---

### Transient failure overlay (applies to Invalid and Valid routes)

| Width | Expected behavior |
|-------|-------------------|
| All five | 429, 5xx, or network failure shows a transient-failure surface distinct from not-found. |
| All five | Last-project local-storage key is NOT cleared by a transient failure. |
| All five | Retry is user-initiated or bounded; no automatic retry loop. |
| All five | After successful retry, Ready state applies normally. |
| 768, 390 | Transient-failure message and controls wrap/stack. 40 px targets. No overflow. |

---

### Summary of fix vs regression scope

| Route | Scope |
|-------|-------|
| Invalid | **Primary fix.** Not-found surface must replace the incorrectly visible canvas. |
| Valid | **Regression only.** Ready-state workflows must remain unchanged. |
| Bare | **Mixed.** Draft/fallback behavior preserved; stale-fallback handling is part of the fix. |
| List | **Secondary fix.** Transient-failure recovery and request deduplication; card layout is regression only. |

### Workflow audit status (frozen regression baseline)

The following workflows were confirmed working during the 2026-08-26 browser audit at all five widths for a valid saved project in Ready state. They are not re-design targets:

1. Draw (freehand/line tools)
2. Wall (wall placement and editing)
3. Grid (grid toggle and settings)
4. Snap (snap toggle)
5. Place / catalog (search, browse, place furniture)
6. Review (review mode)
7. BOQ (bill of quantities)
8. Layers (layer management)
9. Validation (plan validation)
10. Export (export actions)
11. Save (save project)
12. Open (open/navigate projects)

Any future regression in these workflows is a separate defect, not part of this remediation scope.
