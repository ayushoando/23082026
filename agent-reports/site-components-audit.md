# Site Components (`site/components/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`site/components/`](file:///d:/23082026/site/components/)  
**Component Standard:** React 19 Function Components, Strict TypeScript Props, Pure `@focss/*` Styling

---

## Executive Summary

The [`site/components/`](file:///d:/23082026/site/components/) directory contains all shared and domain-specific UI presentation components across 26 modular subdirectories. It enforces strict separation between domain logic (located in `site/features/`) and presentation primitives, while maintaining architectural firewalls between the **Studio** and **Planner** design suites.

```
site/components/ Subsystem Map:
├── ui/                      # Base Design System Primitives (Buttons, Dialogs, Drawers, Tabs)
├── Planner/                 # Dedicated 2D/3D Planner UI (Dockview panels, catalog rails, auto-arrange)
├── Studio/                  # Dedicated Furniture Customizer UI (Fabric canvas, material pickers, 3D glTF)
├── products/                # Catalog UI (ProductCard, CompareDock, FilterRails, SpecificationTables)
├── home/                    # Marketing Hero (HomepageHero, ShowcaseCarousel, CuratedCollections)
├── shared/ & site/          # Site Header, Sticky Navigation, MobileNavDrawer, FooterMarquee
├── pwa/                     # Progressive Web App (ServiceWorkerRegister, InstallPromptModal)
└── Domain Pages:            # about/, contact/, clients/, showrooms/, solutions/, sustainability/
```

---

## 1. Core Component Subsystems

| Subsystem | Primary Components | Key Responsibilities | Architectural Constraints |
| :--- | :--- | :--- | :--- |
| **Base UI (`ui/`)** | `Button.tsx`, `Modal.tsx`, `Drawer.tsx`, `Tabs.tsx`, `ViewportControls.tsx` | Foundational accessible UI primitives. | Pure CSS token classes (`@focss/*`). Zero inline style overrides. |
| **Planner (`Planner/`)** | `PlannerCanvas.tsx`, `PlannerCatalogRail.tsx`, `PlannerAutoArrangeDialog.tsx` | Layout planning canvas, toolbars, and dockview docking panels. | **Strictly forked:** Must never import from `@studio/*`. |
| **Studio (`Studio/`)** | `StudioCanvas.tsx`, `StudioToolbar.tsx`, `StudioMaterialPicker.tsx` | Furniture customization canvas and 3D glTF previewers. | **Strictly forked:** Must never import from `@planner/*`. |
| **Catalog (`products/`)** | `ProductGrid.tsx`, `ProductCard.tsx`, `CompareDock.tsx`, `FilterBar.tsx` | Multi-category product exploration and comparative specs. | Client islands within server-rendered catalog routes. |
| **PWA (`pwa/`)** | `ServiceWorkerRegister.tsx`, `OfflineBanner.tsx` | Offline service worker lifecycle and web app install prompt. | Mounts conditionally on client browser support. |

---

## 2. Design System & CSS Token Compliance

* **Token Strictness:** All components consume CSS tokens from `site/focss/tokens/` via semantic classes (e.g. `c-btn`, `c-modal`, `c-dock`).
* **Legacy Exceptions:** Exactly 201 legacy inline style exceptions exist across 30 files, recorded and capped in [`config/quality/style-token-baseline.json`](file:///d:/23082026/config/quality/style-token-baseline.json).
* **Automated Guardrail:** Checked via `pnpm run check:style-tokens` (`scripts/AsNeeded/check-style-tokens.mjs`). Any new inline style attribute (`style={{ ... }}`) fails CI gates immediately.
