# API Routes & Endpoint Security Audit

**Date:** September 4, 2026  
**Auditor:** AntiGravity Pair Programming Agent  
**Status:** NOT COMPLETE  
**Scope:** REST & Webhook Route Inventory, CSRF Architecture, Rate Limiting, and Authentication Defenses

---

## 1. Executive Summary

Oando maintains 47 physical API routes under [`site/app/api/`](file:///d:/23082026/site/app/api) catalogued in [`site/lib/apiCatalog.ts`](file:///d:/23082026/site/lib/apiCatalog.ts). The API surface is partitioned into four functional quadrants:
1. **Public Discovery & Marketing (`/api/products`, `/api/categories`, `/api/nav-search`):** Cached, read-heavy, and protected by edge CDN rules.
2. **Design Suites (`/api/Planner/*`, `/api/Studio/*`):** State serialization, canvas revisions, BOQ generation, and furniture asset streaming.
3. **Administrative & Operations (`/api/admin/*`, `/api/theme/*`):** Role-protected, price-book mutations, and IndexNow search engine push.
4. **AI & Generation Endpoints (`/api/ai-advisor`, `/api/Planner/sketch-to-plan`, `/api/generate-alt`):** Rate-limited with fail-closed security to prevent credit exhaustion.

---

## 2. API Route Surface Inventory

### A. Public & Marketing Surface
- `GET /api/health`: Basic liveness probe returning status code 200.
- `GET /api/csrf`: Generates and issues signed CSRF tokens stored in HTTP-only cookies.
- `GET /api/products`, `GET /api/products/filter`: Catalog query interface over Products DB.
- `GET /api/categories`, `GET /api/nav-categories`: Taxonomical navigation trees.
- `GET/POST /api/nav-search`: Substring search with query debouncing.
- `POST /api/customer-queries`: Public contact/lead form submission writing to `customer_queries` table.

### B. Studio & Planner Application APIs
- `GET/POST/PUT/DELETE /api/Planner/projects`, `.../projects/{id}`: Mode-aware persistence for interactive design projects.
- `POST /api/Planner/handoff`: Converts canvas layout into bill-of-quantities (BOQ) with authenticated client records.
- `POST /api/Planner/sketch-to-plan`: Vision-assisted architectural layout generation.
- `GET/POST/PATCH/DELETE /api/Studio/furniture`, `.../furniture/{id}`: 2D Fabric furniture item definitions and publication workflows.
- `POST /api/Studio/furniture/{id}/publish`: Promotes draft furniture items into active catalog state.

### C. Admin & Operations Surface
- `GET /api/admin/analytics`: Aggregated platform metrics and canvas session durations.
- `GET/PATCH /api/admin/features`: Feature flag toggle endpoints backed by Admin DB.
- `POST /api/admin/indexnow`: Notifies Bing/Yandex search engines of updated product slugs.
- `GET/POST /api/admin/price-books`: Currency and markup rules for enterprise quoting.
- `GET/POST /api/admin/catalogs/{type}`: Multi-domain descriptor catalog CRUD.

### D. Asset & File Streaming APIs
- `GET /api/files/catalog/{path}`: R2 / Supabase CDN proxy for product photography.
- `GET /api/files/furniture/{filename}`: Optimized SVG / PNG symbol streams for the 2D canvas.
- `GET /api/files/projects/{filename}`: Plan JSON snapshots.

---

## 3. Endpoint Security Architecture

### A. CSRF Defense Architecture ([`site/app/api/csrf/route.ts`](file:///d:/23082026/site/app/api/csrf/route.ts))
- Mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) require an `x-csrf-token` header matching the encrypted HMAC session token.
- Safe read methods (`GET`, `HEAD`, `OPTIONS`) bypass token validation.

### B. Multi-Tiered Rate Limiting ([`site/lib/rateLimit.ts`](file:///d:/23082026/site/lib/rateLimit.ts))
- **Distributed Backend:** Uses atomic database / Redis token buckets (`rate_limits_atomic` table).
- **Fail-Closed AI Protection:** High-cost routes matched by `AI_RATE_LIMIT_KEY_PATTERN` (`ai-advisor`, `sketch-to-plan`, `generate-alt`, `smart-wizard`) fail closed if rate-limit backends disconnect, preventing unmetered LLM API usage.
- **Fail-Open Operational Protection:** Non-AI routes fail open to a local 10,000-key memory map to prevent service disruption during brief DB network hiccups.

### C. Developer & Debug Route Quarantine
- Routes under `/api/dev/*` and `/api/dev-tools/*` (e.g. `auth-bypass-status`, `lighthouse`) enforce:
  ```typescript
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }
  ```
- These endpoints never leak internal server configurations in production builds on Vercel.

---

## 4. RFC Compliance & OpenAPI Specifications

- **RFC 9727 API Catalog:** Exposed via `/.well-known/api-catalog` (`application/linkset+json`).
- **RFC 9116 Security:** Exposed via `/.well-known/security.txt` and `/security.txt`.
- **OpenAPI 3.1 Documentation:** Documented via `/openapi.json` and human-navigable at `/api-docs`.
