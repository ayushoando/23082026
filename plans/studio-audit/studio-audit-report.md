# Studio (Product Studio) Audit Report

**Date:** 2026-08-31
**Scope:** Full Furniture Studio — /oostudio route, canvas, furniture CRUD, AI, publishing, exports, store, auth
**Components audited:** 20+ components, 18 lib modules, 6 server modules, 2 zustand stores, 6 API routes

---

## Executive Summary

The Furniture Studio is a **fully-featured 2D furniture authoring tool** built on Fabric.js v7, with drawing tools, layers, snap/grid, alignment, context menus, rulers, AI generation/suggestion/restyling, multi-format export (PNG/JPEG/SVG/PDF/DXF/JSON), and a furniture catalog with CRUD + publish pipeline. The architecture is clean — types, stores, components, and server modules are isolated in the Studio fork tree with no Planner imports.

The **critical gap** is that the Studio has **no authentication**. The layout doesn't call `requireAuthUser`. Anyone who knows `/oostudio` can access the full furniture authoring tool, create/edit/delete items, use AI features (which consume LLM credits), and publish to the catalog. This is likely an oversight since the admin nav links to Studio and admin has auth.

### Severity Summary

| Severity | Count |
|---|---|
| Critical | 1 |
| High | 2 |
| Medium | 3 |
| Low | 2 |

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

### STU-C01: No Authentication on Studio Route

**Severity:** CRITICAL
**Location:** `site/features/Studio/layout.tsx`

The Studio layout renders directly without any auth check:
```typescript
export default function StudioLayout({ children }) {
  return (
    <main id="main-content" className="oostudio-root" tabIndex={-1}>
      <div className="app-root">
        <TopBar />
        {children}
        <Toast />
      </div>
    </main>
  );
}
```

Compare with the admin layout which calls `await requireAuthUser("/admin", "admin")`. Studio is entirely open.

**All 6 Studio API routes DO have auth** (they use `withAuth({ role: "admin" })` or `withAuth({ role: "member" })`), so the API itself is protected. But:
- The Studio **page and UI** loads for unauthenticated users
- The client-side `studioApi.ts` (using axios) will get 401s from API routes, but the UI renders first
- AI panel, tool rail, export menu — all visible to anonymous visitors
- This is a privacy/brand risk even if data mutations fail

**Fix:** Add `await requireAuthUser("/oostudio", "admin")` to the Studio layout.

---

### STU-H01: studioApi.ts Uses axios (Single Remaining Import)

**Severity:** HIGH
**Location:** `site/lib/Studio/studioApi.ts`

This is the only file in the codebase using `axios`. It creates a bare `axios.create({ baseURL: "/api" })` instance with:
- No CSRF token handling (the `publishFurniture` function in the same file already uses `browserApiFetch` which handles CSRF)
- No error normalization consistent with the rest of the codebase
- No retry logic

Five CRUD functions (`listFurniture`, `createFurniture`, `updateFurniture`, `deleteFurniture`, `uploadFurniture`) use bare axios, while `publishFurniture` uses `browserApiFetch`. This inconsistency means CRUD operations **skip CSRF protection** that `browserApiFetch` provides.

**Fix:** Replace all axios calls with `browserApiFetch`, then `pnpm remove axios`. See `plans/packages/remedy-plan.md` B1.

---

### STU-H02: Studio CRUD Missing CSRF on Mutations

**Severity:** HIGH
**Location:** `site/lib/Studio/studioApi.ts`

Because the axios instance doesn't include CSRF tokens, POST/PATCH/DELETE to `/api/Studio/furniture/*` lack the `X-CSRF-Token` header. The API routes have `requireCsrf: true` in their `withAuth` config, which means:
- In production, mutations should be rejected with 403 (CSRF failed)
- Unless `isDevAuthBypassEnabled()` is true, which skips CSRF checks

This is a functional bug — Studio CRUD operations may fail in production for non-bypass users.

**Fix:** Same as STU-H01 — replace axios with `browserApiFetch` which automatically handles CSRF token acquisition and retry.

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

### STU-M03: Export Menu Has No Content Bounds Check

**Severity:** MEDIUM
**Location:** `site/lib/Studio/studioExporters.ts`

`contentBounds()` returns `null` when the canvas has no exportable objects. Individual export functions handle this, but the `exportPDF` function doesn't check for empty canvas:
```typescript
export const exportPDF = (canvas: Canvas, filename = "floor-plan.pdf"): void => {
  const dataUrl = exportPNG(canvas, { dpiMultiplier: 3 });
  // ... creates PDF from potentially empty canvas
};
```

**Fix:** Check `contentBounds()` before PDF export, show toast "Nothing to export" if empty.

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
