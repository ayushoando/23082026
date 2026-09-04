# Studio & Planner Application Suites Architecture Audit

**Date:** September 4, 2026  
**Auditor:** AntiGravity Pair Programming Agent  
**Status:** COMPLETED  
**Scope:** Fork Purity, Studio (`/oostudio`) vs Planner (`/ooplanner`) Isolation, Canvas Engines, and Persistence Contracts

---

## 1. Executive Summary

Oando's design experiences are divided into two distinct, strictly isolated application suites:
1. **Studio (`/oostudio`):** The product and catalog authoring environment where 2D SVG/PNG furniture blocks, symbols, themes, and dimensional properties are authored and published into the Admin database.
2. **Planner (`/ooplanner`):** The spatial design engine where end users and enterprise clients lay out office floorplans, assemble furniture blocks, and generate Bills of Quantities (BOQ) for procurement.

Under **Process Floor Rule 3 (`AGENTS.md`)**, Studio and Planner are **strictly forked trees**. They must **never** import each other. Cross-product leakage is continuously guarded by CI via `pnpm run scan:boundaries`.

---

## 2. Fork Boundary Matrix

| Layer | Studio Namespace (`@studio/*`) | Planner Namespace (`@planner/*`) | Shared Boundary Rule |
| :--- | :--- | :--- | :--- |
| **Routes** | `site/app/oostudio/` | `site/app/ooplanner/` | No route nesting |
| **Components** | `site/components/Studio/` | `site/components/Planner/` | Zero cross-imports |
| **Libraries** | `site/lib/Studio/` | `site/lib/Planner/` | Zero cross-imports |
| **Hooks** | `site/hooks/Studio/` | `site/hooks/Planner/` | Zero cross-imports |
| **Store / State** | `site/store/Studio/` | `site/store/Planner/` | Independent Zustand/Context |
| **Server Actions** | `site/server/Studio/` | `site/server/Planner/` | Independent action handlers |
| **API Endpoints** | `/api/Studio/*` | `/api/Planner/*` | Independent endpoint namespaces |

---

## 3. Canvas & Rendering Engines

- **Canvas Architecture:** Both applications utilize **Fabric.js 2D** instances managed inside responsive viewports.
- **Dockview Multi-Panel Shell:** Planner uses Dockview (`dockview-react`) to provide dockable panels for Catalog, Properties, Layer Manager, and 2D Canvas views.
- **Deprecation Floor:** Legacy Three.js in-app 3D canvas renderers have been retired and removed to ensure optimal performance on mobile and tablet devices.
- **Symbol Contract ([`planSymbolPngContract.ts`](file:///d:/23082026/site/lib/catalog/planSymbolPngContract.ts)):** Ensures every furniture descriptor provides calibrated PNG and SVG symbol representations for canvas zooming and rendering.

---

## 4. Persistence & Mode-Aware Wrappers

- **Production Read-Only Disk (`EROFS`):** In production on Vercel, the local filesystem cannot be modified.
- **Selector Function:** [`plannerPersistenceMode.ts`](file:///d:/23082026/site/lib/Planner/plannerPersistenceMode.ts) dynamically routes project reads and writes:
  - If `DEV_AUTH_BYPASS=1` (local development), writes target `site/platform/Planner/data/projects/`.
  - In production / staging, writes target the `oando_plans` table in the Supabase Admin database (`rxzpznmxbaoxpikowmfc`).
- **Idempotency & Replay Protection:** Revisions in Planner are validated using atomic revision numbers to prevent multi-tab state overwrite collisions.
