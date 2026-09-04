# Site Features (`site/features/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`site/features/`](file:///d:/23082026/site/features/)  
**Role:** Domain-Driven Business Logic, State Coordination & Page Controllers

---

## Executive Summary

The [`site/features/`](file:///d:/23082026/site/features/) directory houses the **domain-driven business logic and feature orchestrators** for Oando. While `site/components/` manages visual rendering and `site/store/` manages state atoms, `site/features/` coordinates data fetching, business rules, user authentication, and multi-component state workflows across 7 feature modules.

```
site/features/ Subsystem Map:
├── Planner/                 # Floor Planner Feature Orchestration
│   ├── layout/              # Dockview multi-panel docking manager
│   ├── tools/               # Wall drawing, room dimensions, auto-arrange solvers
│   └── persistence/         # Plan serialization, autosave debouncers, revision history
├── Studio/                  # Furniture Customizer Feature Orchestration
│   ├── canvas/              # Fabric.js 2D object management and transformation matrices
│   ├── materials/           # Swatch color, texture, and finish state coordinators
│   └── export/              # GLTF 3D mesh generator and high-res screenshot capture
├── admin/                   # Operations & Catalog Management
│   ├── analytics/           # Business revenue metrics and visitor funnel charts
│   ├── catalog/             # Product catalog CRUD, variant editors, price calculators
│   └── inventory/           # Stock status, supplier lead times, and SKU availability
├── shared/                  # Cross-Cutting Core Features
│   ├── auth/                # AuthProvider, Login/Signup views, ResendVerification
│   └── user/                # User profile synchronization and session refresh timers
├── crm/                     # Customer Relationship Management
│   └── leads/               # Planner quote requests, lead status, customer notes
├── ops/                     # Operational Queue Monitors
│   └── queries/             # Contact inquiry triage and email notification hooks
└── site/                    # Marketing Feature Coordinators
    └── editorial/           # EditorialRoute and dynamic hero transitions
```

---

## 1. Domain Feature Modules

| Feature Module | Key Controllers & Views | Business Responsibilities |
| :--- | :--- | :--- |
| **`shared/auth/`** | `AuthShell.tsx`, `AuthProvider.tsx`, `LoginPage.tsx`, `SignupPage.tsx` | Supabase auth integration, bearer JWT lifecycle, password resets, and session timeout alerts. |
| **`Planner/`** | `PlannerDockview.tsx`, `PlannerToolbarCoordinator.tsx` | Coordinates 2D canvas, 3D viewport, catalog drag-and-drop, and revision rollback. |
| **`Studio/`** | `StudioWorkspace.tsx`, `StudioAutosaveCoordinator.tsx` | Manages 2D part assembly, material mapping, and live pricing calculations. |
| **`admin/`** | `AdminCatalogManager.tsx`, `AdminAnalyticsPageView.tsx`, `ThemeEditor.tsx` | Administrative mutations on Products DB and Admin DB, design token customizations. |
| **`crm/`** | `PlannerHandoffReviewer.tsx`, `CustomerQueryDrawer.tsx` | Translates completed floor plans into actionable sales quotes and lead records. |

---

## 2. Architectural Firewalls

1. **Planner / Studio Isolation:**  
   `site/features/Planner/` and `site/features/Studio/` are strictly independent. Neither module imports from the other.
2. **Auth Layer Scoping:**  
   `site/features/shared/auth/` provides authentication context across both `(site)` and `admin`. Anon visitors can use Planner in guest mode (`DEV_AUTH_BYPASS=1` locally), but saving plans to cloud requires an authenticated user profile.
