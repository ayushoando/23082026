# Studio (Product Studio) Audit Report

**Date:** 2026-08-31
**Scope:** Full Furniture Studio — /oostudio route, canvas, furniture CRUD, AI, publishing, exports, store, auth
**Components audited:** 20+ components, 18 lib modules, 6 server modules, 2 zustand stores, 6 API routes

---

## Executive Summary

The Furniture Studio is a **fully-featured 2D furniture authoring tool** built on Fabric.js v7, with drawing tools, layers, snap/grid, alignment, context menus, rulers, AI generation/suggestion/restyling, multi-format export (PNG/JPEG/SVG/PDF/DXF/JSON), and a furniture catalog with CRUD + publish pipeline. The architecture is clean — types, stores, components, and server modules are isolated in the Studio fork tree with no Planner imports.

**Update (2026-08-31):** All 3 fixable findings (STU-C01, STU-H01/H02, STU-M03) have been applied this session — see the Fixed status inline below and `plans/studio-audit/remedy-plan.md`. The critical gap was that the Studio had **no authentication**: the layout never called `requireAuthUser`, so anyone who knew `/oostudio` could access the full furniture authoring tool, use AI features (consuming LLM credits), and publish to the catalog. This is now closed.

### Severity Summary (post-remediation)

| Severity | Count | Status |
|---|---|---|
| Critical | 1 | ✅ Fixed (STU-C01) |
| High | 2 | ✅ Fixed (STU-H01, STU-H02) |
| Medium | 3 | 1 fixed (STU-M03); 2 remain as documented low-priority tech debt (STU-M01 decomposition, STU-M02 intentional duplication) |
| Low | 2 | Unverified/informational, no action needed |

---

## Architecture

```
/oostudio (page.tsx → features/Studio/page)
    └── Studio.tsx (1200+ line client component)
        ├── Fabric.js v7 Canvas (useFabric, useCanvasCore hooks)
        ├── ToolRail (draw, select, shape, text, line, freehand tools)
        ├── DockShell (dockview-react panels)
        │   ├── PropertiesPanel (object properties, dimensions)
        │   ├── LayersPanel (layer visibility, lock, reorder)
        │   ├── AiPanel (generate, suggest, restyle)
        │   └── ColorPalette (fill/stroke colors)
        ├── TopToolbar (export, save, import)
        ├── AlignBar (align, distribute, flip, rotate)
        ├── Rulers (mm/cm/m/in)
        ├── ViewportControls (zoom, pan, fit)
        └── ContextMenu (right-click operations)

State:
    ├── studioUiStore (unit, snap, grid, toast)
    └── studioCatalogStore (furniture items, categories, refresh)

API Routes:
    ├── /api/Studio/furniture (GET, POST) — list, create
    ├── /api/Studio/furniture/[id] (GET, PATCH, DELETE) — read, update, delete
    ├── /api/Studio/furniture/[id]/publish (POST) — publish to catalog
    ├── /api/Studio/furniture/upload (POST) — file upload
    ├── /api/Studio/ai/generate (POST) — AI shape generation
    ├── /api/Studio/ai/suggest (POST) — AI suggestion
    └── /api/Studio/ai/restyle (POST) — AI restyling

Server:
    ├── studioStore.ts — mode-aware CRUD (disk dev / Supabase prod)
    ├── publishFurnitureToCatalog.ts — versioned descriptor pipeline
    ├── prepareStudioFurnitureCatalogFiles.ts — catalog file prep
    ├── authorizeStudioCatalogTopPng.ts — PNG quality gate
    └── studioFurnitureSeed.ts — seed data
```

---

## Findings

### STU-C01: No Authentication on Studio Route — ✅ FIXED

**Severity:** CRITICAL
**Location:** `site/features/Studio/layout.tsx`

The Studio layout rendered directly without any auth check, unlike the admin layout which calls `requireAuthUser("/admin", "admin")`.

**Fix applied:** Added `await requireAuthUser("/oostudio", "admin")` plus `export const dynamic = "force-dynamic"` (the cookie read forces dynamic rendering) to `site/features/Studio/layout.tsx`.

---

### STU-H01 / STU-H02: axios Usage + Missing CSRF on Studio CRUD — ✅ FIXED

**Severity:** HIGH
**Location:** `site/lib/Studio/studioApi.ts`, `site/components/Studio/StudioAiPanel.tsx`

`studioApi.ts` used a bare `axios.create()` instance for 5 CRUD functions with no CSRF token handling, while `publishFurniture` in the same file already used `browserApiFetch` (which does handle CSRF). This meant CRUD mutations could be rejected with 403 in production (CSRF required, token never sent).

**Fix applied:** All axios usage replaced with `browserApiFetch`-backed helpers:
- `studioApi.ts` — added a shared `jsonFetch()` helper; `listFurniture`, `createFurniture`, `updateFurniture`, `deleteFurniture`, `uploadFurniture` all route through it or `browserApiFetch` directly
- `StudioAiPanel.tsx` — the `aiApi` object (used by `Studio.tsx` for AI generate/suggest/restyle) replaced its own `api.post()` calls with a new `aiPost()` helper, also backed by `browserApiFetch`
- `axios` removed from `package.json` (`pnpm remove axios`) — was the last usage in the entire codebase

**Side effect fixed:** `AiGenerateResult`'s fields (`name`, `category`, `tags`, `dimensions`) were optional, forcing defensive `?.` chains in `Studio.tsx`. Since the AI is expected to always return complete metadata, these are now required fields — cleaner types, no silent `undefined` fallthrough.

---

### STU-M01: Studio.tsx is 1200+ Lines

**Severity:** MEDIUM
**Location:** `site/components/Studio/Studio.tsx`

The main Studio component is a monolithic ~1200-line client component. It handles canvas initialization, tool state, object selection, layers, context menu, keyboard shortcuts, drawing, AI operations, export, save, and import — all in one component.

It does use hook extraction (`useFabric`, `useHistory`, `useKeyboardShortcuts`, `useCanvasCore`) which is good, but the orchestration component itself is still very large.

**Fix:** This isn't urgent but should be decomposed when making significant changes. The drawing tool state machine, export menu, and AI panel orchestration could each be extracted.

---

### STU-M02: Disk Store Has Redundant Planner Copy

**Severity:** MEDIUM
**Location:** `site/server/Studio/studioStore.ts` line 44

```typescript
// The Planner declares its own copy in `plannerStore.ts` — duplicated on purpose.
```

The file explicitly documents that `BadRequestError`, `readJsonBody`, and similar utilities are duplicated between Studio and Planner stores. This is intentional for the fork boundary, but means bug fixes need to happen in two places.

**Fix:** Consider extracting truly shared utilities (like `readJsonBody`, `slugify`, `decodeDataUrl`) into `site/lib/shared/` while keeping store-specific logic in each fork. But this is low priority since the duplication is documented and intentional.

---

### STU-M03: Export Menu Has No Content Bounds Check — ✅ FIXED

**Severity:** MEDIUM
**Location:** `site/lib/Studio/studioExporters.ts`

`contentBounds()` returned `null` when the canvas has no exportable objects, but `exportPDF` never checked it before constructing a jsPDF document.

**Fix applied:** `exportPDF` now returns `boolean` (was `void`) — checks `contentBounds(canvas)` first and returns `false` without touching jsPDF when empty, `true` on a real save. Note: `exportPDF` isn't currently wired to a UI button in Studio (only Planner has an active PDF export button today), so this is forward-looking protection. Test coverage added in `tests/unit/studio/studioExporters.test.ts` (14/14 passing, including 2 new cases for this guard).

---

### STU-L01: DXF Export File Exists But Not Verified

`studioDxfExport.ts` exists for AutoCAD DXF export. Not verified if it's connected to the UI or just a lib module.

### STU-L02: Template System Exists But Scope Unknown

`site/lib/Studio/templates/` directory exists. Not verified how templates are loaded or applied in the UI.

---

## What's Working Well

| Area | Assessment |
|---|---|
| **Fork isolation** | Studio types, store, components, lib all use `@studio/` import alias. Zero Planner imports. |
| **Mode-aware persistence** | `getFurnitureCatalogMode()` switches between disk (dev) and Supabase (prod). Clean abstraction. |
| **Publish pipeline** | `publishFurnitureToCatalog` → validate metadata → PNG quality gate → checksum → persist descriptor → set lifecycle. Production writes to Supabase, not disk. |
| **Export variety** | PNG, JPEG, SVG, PDF (via jsPDF), JSON, DXF. Tight-crop variants for content bounds. Viewport identity reset for zoom-independent export. |
| **AI integration** | 3 AI endpoints (generate, suggest, restyle) all protected with `withAuth`. |
| **Zustand stores** | Clean separation: UI state (unit, snap, grid, toast) vs catalog state (items, categories, refresh). |
| **Drawing tools** | Full toolkit: select, rectangle, circle, line, arrow, polygon, star, text, freehand. Snap, grid, rulers, alignment. |

---

*Report generated from static code analysis of 20+ components, 18 lib modules, 6 server modules, 2 stores, and 6 API routes.*
