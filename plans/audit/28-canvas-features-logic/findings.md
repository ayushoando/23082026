# 28 — Canvas Hooks, Workspace Libs & Features Logic

## 1. Hooks (`site/hooks/{Planner,Studio}`)

| # | Severity | Finding |
|---|----------|---------|
| 28.1 | **High** | `usePlannerHistory.ts` / `useStudioHistory.ts` `loadJson`: sets `suppress.current = true` synchronously, clears only in `.then()`. If `JSON.parse(json)` throws (corrupt snapshot), suppress stays `true` forever → **all subsequent commits silently dropped — undo/redo permanently stops recording**. The throw also propagates out of `undo()`/`redo()`. |
| 28.2 | **High** | `Planner.tsx:2390` calls `useKeyboardShortcuts({...})` with **no `deps`** → `onKey` binds first-render handlers forever. `save: saveProject` closes over stale `projectId`/`projectRevision` → after first save, Ctrl+S still takes the create-branch with a fresh idempotency key → **duplicate project created per Ctrl+S**. |
| 28.3 | Med | Studio `useHistory` regression: `Studio.tsx:205` passes a default `propsToInclude` array allocated per render → `commit` identity churn → listener effect re-subscribes and commits on every render. Planner fixed exactly this (`usePlannerHistory.ts:13-25`); Studio regressed. Studio also has no `onRestore` → grid/sheet decorations dropped on undo. |
| 28.4 | Med | Studio keyboard shortcuts: `inField` checked AFTER the Ctrl+* blocks (`useStudioKeyboardShortcuts.ts:22-64`) → Ctrl+A/Z/S inside inputs hijacked to canvas actions; Planner copy fixed this (L43-46). Studio `deps` also stale-capture `openSave`, `deleteSelected`, copy/paste. |
| 28.5 | Med | `useStudioDraftAutosave.ts` is **dead code** (zero call sites); if adopted it has unstable-callback timer resets, no flush-on-unmount/pagehide, conflict re-queue loop risk. |
| 28.6 | Med | `useStudioCanvasCore.ts` `fitToContent` (L284-290) still uses viewport-space `getBoundingRect()`; Planner switched to `aCoords` with comment (L306-335) — Studio fit drifts at zoom != 1. |
| 28.7 | Low | Rapid undo/redo interleave window; canvas re-creation doesn't reset history stacks; 60-entry full-canvas JSON.stringify per `object:added`; context-menu `findTarget(e).target` may be undefined in fabric v7; session-warning timer not cleared when `enabled` flips false. |

## 2. Workspace libs (`site/lib/{Planner,Studio}`)

| # | Severity | Finding |
|---|----------|---------|
| 28.8 | **High** | `plannerDxfExport.ts` / `studioDxfExport.ts`: zero error handling — raw throws reach the user. Sibling raster exports throw uncaught on tainted canvas (cross-origin underlay → `toDataURL` SecurityError) (`plannerExporters.ts:17-43`). |
| 28.9 | Med | `plannerUnits.ts:34-40` `pxToMm(px, scale)` asserts scale then **ignores it**, calling global `plannerPxToMm` (fixed scale) — silent wrong conversion for non-default scale. `studioUnits.ts:28` is correct — divergence. |
| 28.10 | Med | DXF geometry fidelity: rotation ignored (AABB), line endpoints ignore object angle, group children exported in group-local coords (offset wrongly), freehand paths collapse to bounding rect, text ignores rotation/scale. |
| 28.11 | Low | `exportPDF` in Planner lacks Studio's empty-canvas guard (STU-FIX-03) → blank-PDF export possible; snap float artifacts (no epsilon); save path permanently mutates live grid objects' `excludeFromExport` (snapshot saved by post-filter at `Planner.tsx:1533-1535`). |

## 3. Features

| # | Severity | Finding |
|---|----------|---------|
| 28.12 | **High** | `projectsStore.supabase.ts:162-184`: `writeProjectToSupabase` upserts on client-supplied `project.id` via service-role client with **no ownership check**; `deleteProjectFromSupabase` (L186-191) has no `user_id` filter. Entirely dependent on route-layer auth — no defense-in-depth against cross-user overwrite/delete. Conflict handling is plain last-write-wins from client payload. |
| 28.13 | Med | `updateFeatureFlags.server.ts`: no admin Supabase client → update "succeeds" writing only the in-memory cache (`source:"local"`) — flags silently lost on restart / inconsistent across instances. |
| 28.14 | Med | `catalogAdminHandlers.ts`: standard-catalog create/patch don't map PG `23505` → 409 (configurator path does) → duplicate name/slug surfaces as generic 500. |
| 28.15 | Med | **No reconnect sync**: offline save refused (`saveIssue:"offline"`); on reconnect nothing auto-flushes — manual save required; up to 30s of work lost on crash (backup interval). |
| 28.16 | Med(-low) | `FilterGridInner.tsx`: when API fails but fallback has products, failure is fully invisible (silent degradation, no banner). |
| 28.17 | Med(-low) | `resolveClientIp` trusts spoofable `x-forwarded-for` first hop on non-CF hosts → rate-limit evasion. |
| 28.18 | Low | `.single()` PGRST116 → 500 not 404; in-memory list/pagination; `Number(price)||null` turns 0 into null; raw dbError.message to client (admin-only); `void setQueryState(...)` discards promise; `__draft__` backup key shared across concurrent guest tabs. |

Offline sync architecture is otherwise unusually robust: IndexedDB backup + revision/idempotency/documentEpoch conflict guards (`Planner.tsx:1503-1749`), guest→auth sessionStorage handoff with 15-min TTL (`Planner.tsx:2294-2323`), explicit conflict UX.

## 4. Planner.tsx (3,387 lines) — extraction seams (biggest win first)

1. `usePlannerDrawingTools` — L920-1138 (~220 lines): per-tool mouse interactions, snap during draw.
2. `usePlannerPersistence` — L1503-1749 + L1757-2255 (~740 lines): save/autosave/backup/conflict/load; pure snapshot logic (L1526-1610) → testable `plannerSavePipeline.ts`.
3. Reauth handoff — helpers L175-288 + `handleSignIn` L2294-2323 → `plannerReauthHandoff.ts` (serialization + TTL + restore).
4. Selection/clipboard/export ops — L1144-1500 (~350 lines) → `plannerClipboard.ts` + `plannerExportHandlers.ts` (also fixes missing export try/catch in one place).
5. Workspace shell — palette/context menu/AI placements L2438-2758 + JSX L2759-3295 → `PlannerWorkspace`/`PlannerToolsRail`/`PlannerDocks`; `PlannerBridge` context already exists; extract layout/panel state (L374-530) into `usePlannerLayout`.

Quick wins: fix `useKeyboardShortcuts` deps (28.2), wrap all export/download paths in try/catch, align Studio history + shortcut `inField` with Planner's fixes.
