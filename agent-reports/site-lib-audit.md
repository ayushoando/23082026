# Site Core Libraries (`site/lib/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`site/lib/`](file:///d:/23082026/site/lib/)  
**Footprint:** 31 Modular Subdirectories + 21 Core Service Files  
**Role:** Central Business Logic, Storage Adapters, Infrastructure Wrappers & Cryptographic Utilities

---

## Executive Summary

The [`site/lib/`](file:///d:/23082026/site/lib/) directory forms the **computational backbone** of the application. It decouples low-level cloud infrastructure (Supabase, Cloudflare R2, OpenTelemetry) from React UI components, providing mode-aware persistence wrappers, rate limiters, catalog slug resolvers, and strict boundary firewalls.

```
site/lib/ Subsystem Map:
├── storage/                 # Cloudflare R2 S3 Client (r2Catalog.ts - intact credential contracts)
├── catalog/                 # Product normalization, category hierarchies, static params
├── Planner/                 # Floor planner persistence mode, math solvers, plan serialization
├── Studio/                  # Furniture customizer fabric coordinator, 3D glTF builder
├── auth/                    # JWT parsing, session assertions, RLS token delegation
├── ai/                      # Vector embeddings, semantic similarity, OpenRouter client
├── observability/           # OpenTelemetry spans, metrics registry, Prometheus exporters
├── security/ & rateLimit.ts # Token-bucket rate limiting, CSRF verification, security.txt
├── featureFlags.ts          # Feature toggle resolver (server & client)
├── assetPaths.ts            # 47 KB Media normalizer (rewrites legacy seating paths to R2)
└── productSlugResolver.ts   # Resolves URL slugs to canonical database product IDs
```

---

## 1. Key Service Architectures

| Service Layer | File / Directory | Operational Responsibility |
| :--- | :--- | :--- |
| **R2 Storage** | [`storage/r2Catalog.ts`](file:///d:/23082026/site/lib/storage/r2Catalog.ts) | Intact-pair S3 credential resolution (`CLOUDFLARE_R2_*`), retry wrappers, degraded-mode JSON fallbacks. |
| **Asset Normalizer** | [`assetPaths.ts`](file:///d:/23082026/site/lib/assetPaths.ts) | Normalizes media URLs. Rewrites legacy `/seating/non-leather/SKU` paths to canonical `/seating/{cafe\|fabric\|leather\|mesh}/SKU`. |
| **Rate Limiter** | [`rateLimit.ts`](file:///d:/23082026/site/lib/rateLimit.ts) | IP-based token-bucket rate limiter guarding `/api/contact`, `/api/plans`, and quote request submissions. |
| **Catalog Resolver** | [`catalog/catalogTree.ts`](file:///d:/23082026/site/lib/catalog/catalogTree.ts) | Builds dynamic navigation trees from `catalog_categories` and `catalog_products`. |
| **Persistence Modes**| `Planner/plannerPersistenceMode.ts`<br>`catalog/furnitureCatalogMode.ts` | Dispatches read/write operations to disk under `DEV_AUTH_BYPASS=1` or to Supabase tables in production. |

---

## 2. Critical Findings & Boundary Enforcements

1. **Intact S3 Credential Resolution (`r2Catalog.ts`):**  
   Enforces strict pair precedence: never mixes access key from one environment with secret key from another, and rejects Cloudflare API tokens (Bearer auth) as S3 secret access keys.
2. **Fork Boundary Rule:**  
   `site/lib/Studio/` and `site/lib/Planner/` are strictly independent. Studio never imports `@planner/*` and Planner never imports `@studio/*`.
3. **Product Static Params Defect:**  
   [`site/lib/catalog/productStaticParams.ts`](file:///d:/23082026/site/lib/catalog/productStaticParams.ts) contains the 10 unbacked product slugs (`allure`, `caneva`, `copse`, etc.) that cause 404 errors in `sitemap.xml`.
