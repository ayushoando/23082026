# Site Client State Stores (`site/store/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`site/store/`](file:///d:/23082026/site/store/)  
**State Engine:** Zustand Reactive Client Stores  
**Submodules:** `Planner/` (2 stores) and `Studio/` (2 stores)

---

## Executive Summary

The [`site/store/`](file:///d:/23082026/site/store/) directory houses the **client-side reactive state stores** powering the interactive floor planner and furniture studio. It strictly decouples volatile UI state (zoom levels, active tools, panel docking) from persistent catalog and plan models, while maintaining total architectural isolation between the two suites.

```
site/store/ Architecture:
├── Planner/                 # Floor Planner Client Stores
│   ├── plannerUiStore.ts    # Active tool, zoom, pan offset, selected item, grid snaps
│   └── plannerCatalogStore.ts # Client catalog cache, category filters, item search index
└── Studio/                  # Furniture Studio Client Stores
    ├── studioUiStore.ts     # Active 2D/3D viewport, selected material, camera angle
    └── studioCatalogStore.ts # Furniture templates, swatch palettes, custom part assemblies
```

---

## 1. Store Responsibilities & State Atoms

| Store File | State Atoms Managed | Mutation Frequency | Storage Layer |
| :--- | :--- | :--- | :--- |
| **`Planner/plannerUiStore.ts`** | `activeTool` (`select`, `wall`, `door`, `dimension`), `zoomLevel`, `panCoords`, `selectedItemId`, `isDockviewMaximized` | High (60 FPS on drag/pan/zoom) | In-memory client state (ephemeral) |
| **`Planner/plannerCatalogStore.ts`** | `catalogItems`, `selectedCategory`, `searchQuery`, `isLoading`, `blockDescriptors` | Low (on catalog load/filter) | In-memory cache + IndexedDB fallback |
| **`Studio/studioUiStore.ts`** | `mode` (`2d` \| `3d`), `selectedPartId`, `activeSwatch`, `isWireframe`, `isAutosaving` | Medium (user interactions) | In-memory client state (ephemeral) |
| **`Studio/studioCatalogStore.ts`** | `baseTemplates`, `materialPalettes`, `currentCustomization` | Low (on template selection) | In-memory cache |

---

## 2. Boundary Compliance & Performance

1. **Strict Fork Separation:** Zero cross-imports exist between `site/store/Studio/` and `site/store/Planner/`.
2. **Selector Optimization:** Components subscribe using fine-grained Zustand selectors (e.g. `usePlannerUiStore(s => s.zoomLevel)`) to prevent full canvas re-renders when orthogonal properties (such as tool selection) change.
3. **No Stale Closures:** Actions use functional updates, avoiding React 19 hook dependency warning traps.
