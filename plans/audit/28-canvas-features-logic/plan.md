# Plan — Canvas Hooks, Workspace Libs & Features Logic

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Fix the three user-data-loss/duplication bugs (history deadlock, Ctrl+S duplicate, service-role project writes), then port the Planner fixes to Studio.

## Actions (prioritized)
1. **High** Fix `suppress` deadlock in `site/hooks/Planner/usePlannerHistory.ts` + `useStudioHistory.ts`: clear `suppress.current` in a `finally`, wrap `JSON.parse` in try/catch.
2. **High** Pass `deps` to `useKeyboardShortcuts` at `site/components/Planner/Planner.tsx:2390` (or memoize handlers) — kills the Ctrl+S duplicate-project bug.
3. **High** Add ownership filters to `site/lib/Planner/projectsStore.supabase.ts` (`writeProjectToSupabase`, `deleteProjectFromSupabase`) — defense-in-depth against cross-user overwrite/delete.
4. **Med** Port Planner's history fixes to Studio (`Studio.tsx:205` memoized propsToInclude, `onRestore`), fix `inField` ordering + stale deps in `useStudioKeyboardShortcuts.ts`.
5. **Med** Wrap all DXF/raster/PDF export paths in try/catch with user-visible toasts (`plannerDxfExport.ts`, `studioDxfExport.ts`, `plannerExporters.ts`); respect `scale` in `plannerUnits.ts:pxToMm`.
6. **Med** Map PG `23505` → 409 in `catalogAdminHandlers.ts`; wire the admin Supabase client into `updateFeatureFlags.server.ts`; delete dead `useStudioDraftAutosave.ts` (user-confirmed deletion required).
7. **Med** Add reconnect auto-flush for offline saves (`Planner.tsx` save pipeline).
8. **Low** `aCoords` for Studio `fitToContent`; FilterGrid silent-degradation banner; spoofable `x-forwarded-for` handling.
9. Refactor: extract Planner.tsx seams (drawing tools, persistence, clipboard/exports, workspace shell) per findings §4.

## Verification
- `pnpm run test` (Planner/Studio hook suites), `pnpm run typecheck`, `pnpm run gate:fast` — owner authorization required.
