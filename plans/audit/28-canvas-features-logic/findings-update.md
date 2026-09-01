# Updated findings — 28-canvas-features-logic

**Date:** 2026-09-01

## Resolved
- none yet — all findings 28.1–28.18 are open (not started).

## Fixed along the way (discovered during remediation)
- none

## Remaining (failures / open items)
- 28.1: open (High) — history `suppress` deadlock: corrupt snapshot permanently stops undo/redo recording.
- 28.2: open (High) — `useKeyboardShortcuts` with no deps at `Planner.tsx:2390` → Ctrl+S duplicate project.
- 28.3: open — Studio `useHistory` regression (per-render `propsToInclude`, no `onRestore`).
- 28.4: open — Studio shortcut `inField` ordering + stale deps (inputs hijacked).
- 28.5: open — `useStudioDraftAutosave.ts` dead code (zero call sites).
- 28.6: open — Studio `fitToContent` still viewport-space (drifts at zoom ≠ 1).
- 28.7: open — undo/redo interleave window, history not reset on canvas re-create, 60-entry stringify per `object:added`, `findTarget` undefined risk, session-warning timer leak.
- 28.8: open (High) — zero error handling on DXF/raster export paths (raw throws reach the user).
- 28.9: open — `plannerUnits.ts:pxToMm` asserts scale then ignores it.
- 28.10: open — DXF geometry fidelity (rotation, group-local coords, freehand, text ignored).
- 28.11: open — Planner `exportPDF` empty-canvas guard, snap epsilon, live-grid `excludeFromExport` mutation.
- 28.12: open (High) — `projectsStore.supabase.ts` service-role upsert/delete without ownership checks (last-write-wins).
- 28.13: open — `updateFeatureFlags.server.ts` "succeeds" local-only (flags lost on restart).
- 28.14: open — PG `23505` not mapped to 409 in `catalogAdminHandlers.ts` (generic 500).
- 28.15: open — no reconnect auto-flush of offline saves (up to 30s lost).
- 28.16: open — `FilterGridInner.tsx` silent degradation when API fails with fallback present.
- 28.17: open — `resolveClientIp` trusts spoofable `x-forwarded-for` first hop.
- 28.18: open — `.single()` PGRST116 → 500, in-memory pagination, `Number(price)||null`, dbError.message leak, `void setQueryState`, shared `__draft__` key.
