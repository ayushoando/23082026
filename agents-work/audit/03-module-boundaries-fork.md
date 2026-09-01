# 03 — Module Boundaries & Fork Discipline

**Rule** (from `scripts/scan-boundaries.mjs`): ten namespace roots (`site/{components,lib,hooks,store,server}/{Planner,Studio}`), ownership extends to `site/features/{Planner,Studio}`, `site/app/{ooplanner,oostudio}`, `site/app/api/{Planner,Studio}`, `site/focss/{planner,studio}`. Cross-product edges, forwarding modules, and the deleted shared layer (`lib/shared`, `components/OOShared`, `focss/ooshared`) are violations. Aliases `@planner/*` / `@studio/*` in `site/tsconfig.json:32-62`.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 3.1 | Info (positive) | **0 cross-product imports** found in an independent grep sweep across all owned trees, both directions. Only cross mentions are deliberate-duplication comments (`server/Planner/plannerStore.ts:12,47,234`, `server/Studio/studioStore.ts:11,46,196`, `app/api/Planner/ai-advisor/route.ts:21-22`). |
| 3.2 | Low | Marketing portal pages import Planner internals: `app/(site)/portal/[id]/page.tsx:4` and `app/(site)/portal/page.tsx:9` → `@planner/lib/projectsStore`. Not a scanner violation (portal is unowned) but a shared-surface → product-namespace edge. |
| 3.3 | Low | Product-named folder inside shared tree: `site/lib/observability/planner/` (5 files) — imported only by Planner-owned code (direction safe) but sits outside the `lib/Planner` namespace the scanner owns. |

## Fork duplication inventory (by design — drift is the risk)

- File counts: `components/Planner` 54 vs `components/Studio` 33; `hooks` 10 vs 7; `lib` ~44 vs 19; `server` 6 vs 6.
- **~28 parallel component pairs** (root: Planner/Studio, AiPanel, AlignBar, ColorPalette, Constants, ContextMenu, DockShell, IconButton, LayersPanel, PropertiesPanel, Rulers, Toast, ToolRail, TopBar, TopToolbar, ViewportControls; ui/: DockFloatHeaderActions, DockPanelButtons, DraggableCanvasOverlay, ExportMenu+types, HueSlider, PanelEmptyState, PhIcon+map, PropertiesEmptyHint, SidePanelResizeHandle, TopBarGitUser, TopBarShell, usePanelResize; dock/: DockPanels).
- 6 hook pairs (Fabric, History, CanvasCore, DockBridge, GitUserEmail, KeyboardShortcuts) and 7 lib pairs (ColorUtils, Snap, Units, DxfExport, CanvasLayers, Exporters, FabricSerialize).
- Planner-only: BOQ panel, command palette, auto-arrange, handoff dialog, project menu/list, validation panel, sheet settings, touch gestures, focus manager, session warning, viewport hook. Studio-only: FloatingPanel, ColorRail, DraftAutosave, Importers, ShapeGeometry. Planner is the more-invested fork.

### Verified drift examples
- **Med — `PlannerToast.tsx` (77 lines) vs `StudioToast.tsx` (57 lines):** reducer copied verbatim, but Planner gained a11y upgrades (aria-live, `role=alert`, dismiss button, PhIcon) Studio never received.
- **Low — `PlannerIconButton.tsx` vs `StudioIconButton.tsx`:** identical except `aria-pressed={active}` vs `aria-pressed={!!active}` and icon size 18 vs 20 — silent behavioral divergence.
