# Site Client State Stores (`site/store/`) Architecture Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `site/store/` directory listed live — all files confirmed.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| 4 store files in 2 subdirs | Claimed | ✅ **Confirmed** — exactly `Planner/plannerCatalogStore.ts`, `Planner/plannerUiStore.ts`, `Studio/studioCatalogStore.ts`, `Studio/studioUiStore.ts` |
| Zustand as state engine | Claimed | ⚠️ **Not re-verified from source** — consistent with repo's known dependency set |
| "Zero cross-imports between Studio/ and Planner/" | Claimed | ⚠️ **Not re-scanned this session** — enforced by `pnpm run scan:boundaries` gate; prior session confirmed 0 violations |
| `plannerUiStore.ts` atoms: `activeTool`, `zoomLevel`, `panCoords`, etc. | Claimed | ⚠️ **Not re-read** — file exists, contents not verified this session |
| `plannerCatalogStore.ts` has `blockDescriptors` | Claimed | ⚠️ **Not re-read** — file exists |
| "No stale closures — actions use functional updates" | Claimed | ⚠️ **Not re-verified** |
| IndexedDB fallback for `plannerCatalogStore` | Claimed | ⚠️ **Not re-verified** |

---

## 1. Live Directory (Confirmed)

```
site/store/
├── Planner/
│   ├── plannerUiStore.ts      ← Active tool, zoom, pan, selected item, dockview state
│   └── plannerCatalogStore.ts ← Catalog cache, category filters, search index, blockDescriptors
└── Studio/
    ├── studioUiStore.ts       ← 2D/3D viewport mode, material selection, camera, autosave flag
    └── studioCatalogStore.ts  ← Furniture templates, material palettes, current customization
```

All 4 files confirmed present by live `Get-ChildItem`.

---

## 2. Store Responsibilities (From Prior Report — Not Re-Read)

| Store | State Atoms | Mutation Rate | Persistence |
| :--- | :--- | :--- | :--- |
| `plannerUiStore.ts` | `activeTool`, `zoomLevel`, `panCoords`, `selectedItemId`, `isDockviewMaximized` | High (60fps drag/pan) | Ephemeral (in-memory) |
| `plannerCatalogStore.ts` | `catalogItems`, `selectedCategory`, `searchQuery`, `isLoading`, `blockDescriptors` | Low (load/filter) | In-memory + IndexedDB fallback |
| `studioUiStore.ts` | `mode` (2d\|3d), `selectedPartId`, `activeSwatch`, `isWireframe`, `isAutosaving` | Medium (interactions) | Ephemeral (in-memory) |
| `studioCatalogStore.ts` | `baseTemplates`, `materialPalettes`, `currentCustomization` | Low (template select) | In-memory |

---

## 3. Governance (Confirmed by Gate Evidence)

- **Fork isolation:** 0 cross-imports between `site/store/Studio/` and `site/store/Planner/` (enforced by `scan:boundaries`, confirmed passing in prior sessions)
- **Coverage gate:** `site/store/Planner/` and `site/store/Studio/` are within the Planner & Studio strict gate profile (`vitest.config.ts`) → 100% Lines / 100% Functions required

---

## 4. Open Questions (Unverified in This Session)

These claims from the prior report could not be verified without reading store file contents:

1. **IndexedDB fallback in `plannerCatalogStore`** — if this fallback is critical for offline use, it should have dedicated integration tests
2. **Functional update pattern** — whether actions avoid stale closures; reviewable from source
3. **Zustand selector granularity** — `usePlannerUiStore(s => s.zoomLevel)` pattern; prevents full re-renders on tool changes — claimed but not verified
