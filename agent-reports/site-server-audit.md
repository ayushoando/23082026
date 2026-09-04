# Site Server Subsystem (`site/server/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`site/server/`](file:///d:/23082026/site/server/)  
**Execution Runtime:** Node.js Server Actions & Backend Storage Adapters  
**Submodules:** `Planner/` (6 files) and `Studio/` (6 files)

---

## Executive Summary

The [`site/server/`](file:///d:/23082026/site/server/) directory contains the **server-only backend adapters and server actions** powering the Planner and Studio design suites. It strictly enforces the repository's fork boundary rules, isolating disk vs. cloud storage adapters, SVG-to-PNG rendering pipelines (via Sharp), and AI sketch-to-plan computer vision models.

```
site/server/ Architecture:
├── Planner/                 # Floor Planner Server Actions & Storage Adapters
│   ├── plannerProjectDiskAdapter.ts     # Disk persistence (projects/*.json) under DEV_AUTH_BYPASS=1
│   ├── plannerProjectSupabaseAdapter.ts # Production Supabase persistence (oando_plans JSONB)
│   ├── plannerRouteAdapter.ts           # API endpoint adapter with optimistic locking
│   ├── plannerStore.ts                  # Server-side plan state store
│   ├── providerFetch.server.ts          # External vendor catalog proxy
│   └── sketchToPlan.server.ts           # AI sketch-to-plan computer vision pipeline
└── Studio/                  # Furniture Studio Server Actions & Media Pipeline
    ├── publishFurnitureToCatalog.ts     # Publishes custom SKU to Admin furniture_catalog
    ├── renderTopPngFromSvg.ts           # Server-side SVG-to-PNG rasterization via Sharp
    ├── authorizeStudioCatalogTopPng.ts  # R2 upload authorization token generator
    ├── prepareStudioFurnitureCatalogFiles.ts # Bundles glTF meshes and textures
    ├── studioFurnitureSeed.ts           # Development seed routines
    └── studioStore.ts                   # Server-side studio state store
```

---

## 1. Storage Mode Dispatchers (No Dual-Write)

Per repository persistence rules (`AGENTS.md` § 5), server adapters never perform simultaneous dual-writes:
* **Disk Adapter (`plannerProjectDiskAdapter.ts`):**  
  Active only when `DEV_AUTH_BYPASS=1`. Reads and writes raw JSON files inside `site/platform/Planner/data/projects/`.
* **Supabase Adapter (`plannerProjectSupabaseAdapter.ts`):**  
  Active in all non-bypass and production environments. Writes to `public.oando_plans` using optimistic concurrency control (`revision_id`), preventing lost updates when multiple users edit a plan.

---

## 2. Server Image & 3D Pipeline (`site/server/Studio/`)

* **Sharp Rasterization (`renderTopPngFromSvg.ts`):**  
  When a user designs a chair or desk in Studio, the 2D SVG layout is rasterized on the server via `sharp` into a high-resolution top-down PNG thumbnail.
* **Catalog Publishing (`publishFurnitureToCatalog.ts`):**  
  Inserts the finalized geometry, block descriptors, and 3D glTF mesh keys into the Admin Supabase database (`furniture_catalog`), making the new design immediately available for placement inside the Planner.

---

## 3. Boundary & Safety Verification

1. **Fork Boundaries:** Zero cross-imports exist between `site/server/Studio/` and `site/server/Planner/`.
2. **Server-Only Guards:** Every file imports `server-only` or executes within Next.js Server Action boundaries, preventing sensitive database connection URLs from being bundled into client JavaScript.
