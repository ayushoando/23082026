# Site Inventory & Block Descriptors (`site/inventory/`) Audit

**Date:** 2026-09-04  
**Target:** [`site/inventory/`](file:///d:/23082026/site/inventory/) & [`site/inventory/descriptors/`](file:///d:/23082026/site/inventory/descriptors/)  
**Schema Version:** `2026-07-04.v2`  
**Contents:** 23 Native 2D CAD/Canvas Block Descriptors

---

## Executive Summary

The [`site/inventory/`](file:///d:/23082026/site/inventory/) directory contains the **canonical 2D CAD geometry specifications** (block descriptors) used by both the Planner (`/ooplanner`) and Studio (`/oostudio`) canvas rendering engines. 

Each JSON descriptor specifies millimeter-accurate physical dimensions, SVG viewBox boundaries, sub-part block primitives (e.g. seat, backrest, armrests, table legs), and CSS token variable bindings.

```
site/inventory/
└── descriptors/             # 23 Canonical Block Descriptors (JSON)
    ├── oando-breeze-task-chair.json
    ├── oando-flex-desk-1200.json
    ├── oando-eclipse-meeting-2400.json
    ├── oando-mellow-sofa-2200.json
    ├── oando-spino-tall-cabinet-900.json
    └── missing-geom-fallback-001.json # Graceful fallback when SKU geometry is missing
```

---

## 1. Block Descriptor Contract (`schemaVersion: 2026-07-04.v2`)

Each file represents a physical piece of furniture mapped to its catalog SKU:

```json
{
  "schemaVersion": "2026-07-04.v2",
  "id": "a81e3a1b-16f4-4000-8000-000000000019",
  "slug": "oando-breeze-task-chair",
  "sku": "OANDO-BREEZE-CHR-TSK",
  "geometry": { "widthMm": 650, "depthMm": 650, "heightMm": 1100 },
  "viewBox": { "x": 0, "y": 0, "width": 650, "height": 650 },
  "mounting": ["floor"],
  "blocks": [
    { "id": "seat", "x": 100, "y": 140, "width": 450, "depth": 380 },
    { "id": "backrest", "x": 120, "y": 40, "width": 410, "depth": 120 },
    { "id": "base", "x": 200, "y": 500, "width": 250, "depth": 100 }
  ],
  "themeTokens": {
    "--fill-primary": "var(--color-surface-raised)",
    "--stroke-accent": "var(--color-border)"
  },
  "checksum": "fd715bc84aab56ac417d0a185d2a2087fba0178268d86c0b8dc36db0661e3202"
}
```

---

## 2. Persistence & Dual-Mode Resolution

Per repository persistence rules (`AGENTS.md` § 5):
* **Local Development (`DEV_AUTH_BYPASS=1`):**  
  The application reads descriptors directly from the filesystem under `site/inventory/descriptors/`.
* **Production Deployment (Vercel Edge):**  
  Because the production filesystem is strictly read-only (`EROFS`), descriptor lookups route to the **Admin Supabase Database** (`rxzpznmxbaoxpikowmfc`) table:
  `public.block_descriptors (id uuid primary key, slug text, descriptor jsonb)`
* **Fallback Safety:**  
  If a newly cataloged SKU lacks a custom geometry definition, the system gracefully resolves to [`missing-geom-fallback-001.json`](file:///d:/23082026/site/inventory/descriptors/missing-geom-fallback-001.json), rendering a standard dimensioned wireframe block on the canvas rather than crashing.
