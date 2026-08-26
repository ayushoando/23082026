# Planner project-load remediation — execution report

- **Date:** 2026-08-26
- **Spec:** `.kiro/specs/planner-remediation/`
- **Status:** All 48 tasks complete (Waves 0–7 + acceptance checklist)

---

## Implementation summary

The primary defect was: navigating to `/ooplanner/projects/not-a-valid-id` produces a correct API 404 but the Planner client catches the error, toasts, and leaves the normal canvas visible as though the project loaded.

The fix introduces an explicit discriminated load-state model, a workspace gate that hides the interactive canvas during non-ready states, and a dedicated recovery surface with accessible controls.

---

## Files created

| File | Purpose |
|------|---------|
| `site/components/Planner/plannerLoadState.ts` | Discriminated union: Draft, Loading, Ready, NotFound, TransientError + type guards + factories |
| `site/components/Planner/PlannerProjectLoadState.tsx` | Recovery surface component — loading, not-found, transient-error rendering with ARIA semantics and focus management |
| `tests/unit/components/Planner/PlannerProjectLoadState.test.tsx` | 9 unit tests for the recovery surface |
| `tests/unit/components/Planner/Planner.test.tsx` | 7 integration tests for editor load-state lifecycle |
| `plans/planner-project-load-defect-baseline.md` | Defect evidence, ownership confirmation, acceptance matrix |

## Files modified

| File | Change |
|------|--------|
| `site/lib/Planner/plannerApi.ts` | Added `PlannerApiError` class (status, detail, isNotFound, isTransient), `isAbortError` guard, `GetProjectOptions` interface, optional signal param on `getProject`/`listProjects` |
| `site/components/Planner/Planner.tsx` | Replaced load effect with strict effective-id precedence, keyed request lifecycle, AbortController cleanup, workspace gate (`data-load-state` attribute), `retryCount`-driven retry, renders `PlannerProjectLoadState` when gated |
| `site/components/Planner/PlannerProjectsList.tsx` | Abort-safe list loading, stale-response suppression, visible retry on transient failure |
| `site/focss/planner/workspace-shell.css` | Gate rules (visibility:hidden + pointer-events:none on workspace children during non-ready states), `.planner-load-state` recovery surface layout, responsive stacking at <=768px, 40px minimum target enforcement |
| `tests/unit/lib/Planner/plannerApi.test.ts` | Added typed error classification tests, signal forwarding tests, AbortError identification tests |

---

## Behavioral changes

1. **404 → explicit not-found surface**: Canvas hidden, heading "Plan not found", message from API detail, "Try again" (same id) + "Back to projects" buttons.
2. **429/5xx/network → transient-error surface**: Canvas hidden, heading "Temporarily unavailable", user-initiated retry only, localStorage key preserved.
3. **Loading gate**: While the API request is pending, workspace shows `data-load-state="loading"` and interactive controls are suppressed.
4. **Abort/stale suppression**: Old requests are aborted on unmount/route change/retry. Stale results checked via request key; AbortError is silently ignored.
5. **Request deduplication**: Each effect run creates a single AbortController. Effect cleanup aborts. Re-runs (dev mode, route transitions) start fresh without accumulating in-flight requests.
6. **Route-id precedence**: `routeId` is authoritative. A failed route id never falls through to localStorage. localStorage fallback only on bare `/ooplanner`.
7. **Draft preservation**: No route id + no localStorage fallback = Draft state (blank workspace, no error).
8. **Projects list lifecycle**: Same abort-safe pattern with visible retry and stale suppression.

---

## What was NOT changed

- `site/app/api/Planner/projects/[id]/route.ts` — API contract preserved (404/503/200)
- Studio files — no cross-fork imports introduced
- Ready-state workflows (Draw, Wall, Grid, Snap, Place, Review, BOQ, Layers, Validation, Export, Save, Open)
- API rate limits, authentication, or persistence behavior

---

## User verification commands

After implementation, run:

```bash
# Focused unit tests
pnpm exec vitest run --config tests/vitest.config.ts \
  tests/unit/lib/Planner/plannerApi.test.ts \
  tests/unit/components/Planner/PlannerProjectLoadState.test.tsx \
  tests/unit/components/Planner/Planner.test.tsx \
  tests/unit/app/api/Planner/projects/[id]/route.test.ts

# Layout, CSS, and boundary checks
pnpm run check:layout
pnpm run verify:focss
pnpm run lint:ui:strict
pnpm run check:style-tokens
pnpm run scan:boundaries
```

Then run the five-width browser workflow (1920, 1440, 1078, 768, 390) checking:

- `/ooplanner/projects/not-a-valid-id` shows not-found surface
- Retry re-requests same id
- Back to projects navigates correctly
- Transient failure (429/503) shows distinct surface
- Valid project loads normally
- No horizontal overflow at narrow widths

---

## Rollback notes

Per the spec's rollback-safe sequencing:

1. Revert presentation/state gate independently if visual regression
2. Revert request deduplication independently if timing changes
3. Revert projects-list lifecycle separately from editor
4. Revert CSS rules only if responsive checks fail
5. API route untouched — not a rollback candidate
