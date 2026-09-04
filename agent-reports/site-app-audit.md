# Site Application Routes (`site/app/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`site/app/`](file:///d:/23082026/site/app/)  
**Framework:** Next.js 16 App Router (React 19 Server Components & Actions)

---

## Executive Summary

The [`site/app/`](file:///d:/23082026/site/app/) directory constitutes the primary web surface of Oando. It houses **4 distinct application domains** under a single Next.js App Router root: the public marketing site (`(site)`), the administrative operations dashboard (`admin`), the interactive floor planner (`ooplanner`), and the 3D furniture customization studio (`oostudio`).

```
site/app/ Architecture:
├── (site)/                  # Public Marketing & Catalog Domain (en/hi routed)
│   ├── page.tsx             # Homepage hero, categories, curated collections
│   ├── products/            # Catalog browser, category rails, product detail (PDP)
│   ├── choose-product/      # Configurator wizard entrypoint
│   └── (legal)/             # Privacy, terms, refund policies
├── admin/                   # Operations & CRM Portal
│   ├── page.tsx             # Executive analytics & business metrics
│   ├── catalog/             # Product catalog manager & specification editor
│   ├── plans/               # Customer plans reviewer & handoff state
│   ├── queries/             # Contact inquiries & lead CRM
│   └── themes/              # Theme & design kit token editor
├── ooplanner/               # 2D/3D Floor Planner Canvas Engine
│   └── page.tsx             # Dockview desktop layout, Fabric.js 2D, Three.js 3D viewport
├── oostudio/                # 2D/3D Furniture Customizer & Studio
│   └── page.tsx             # Furniture editor, upholstery material switcher, GLTF export
├── api/                     # Serverless API Endpoints (Edge & Node runtime)
│   ├── catalog/             # Product search, category trees, stock checks
│   ├── plans/               # Plan CRUD, autosave, revisions (JSONB)
│   ├── admin/               # Administrative mutations (protected by bearer auth)
│   └── health/              # Liveness and readiness probes
├── api-docs/                # OpenAPI Documentation UI (Scalar/Swagger)
├── robots.ts & sitemap.ts   # Dynamic SEO engines
└── layout.tsx & error.tsx   # Global root shell & boundary handlers
```

---

## 1. Domain Surface Breakdown

| Domain Route | Role & Audience | Runtime Model | Styling Strategy |
| :--- | :--- | :--- | :--- |
| **`/(site)`** | End consumers, search engine crawlers. | Server Components (RSC) + Selective Islands. | Pure `@focss/*` token classes. |
| **`/admin`** | Internal sales reps, catalog managers. | Client-side hydration with session auth. | Admin shell styling (`admin.css`). |
| **`/ooplanner`** | Architects, enterprise workspace planners. | Pure client SPA (Dockview + WebGL Canvas). | Planner layout system (`planner.css`). |
| **`/oostudio`** | Furniture designers, custom specification users. | Pure client SPA (Fabric.js + Canvas). | Studio layout system (`studio.css`). |
| **`/api`** | Backend client requests, third-party hooks. | Edge and Node Serverless Handlers. | Headless JSON responses. |

---

## 2. Key Architectural Guards & Findings

1. **Fork Independence (`/oostudio` vs `/ooplanner`):**  
   The application strictly maintains isolation between Studio and Planner. Studio routes import only `@studio/*`, and Planner routes import only `@planner/*`. Cross-imports trigger immediate failure in `pnpm run scan:boundaries`.
2. **Dynamic Sitemap Defect (`sitemap.ts`):**  
   [`site/app/sitemap.ts`](file:///d:/23082026/site/app/sitemap.ts) serves **10 URLs returning HTTP 404** (e.g. `/products/storages/accessories/`, `/products/soft-seating/allure/`). The static fallback params in `site/lib/catalog/productStaticParams.ts` must be pruned to eliminate search crawler errors.
3. **Layered Error Handling:**  
   - `global-error.tsx`: Root fatal error boundary with brand recovery layout.
   - `not-found.tsx`: 404 handler with smart path suggestion links and localized Hindi/English fallbacks.
