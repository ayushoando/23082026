# Site Application Routes (`site/app/`) Architecture Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`site/app/`](file:///d:/23082026/site/app/)  
**Method:** Live file inspection of Next.js 16 App Router structure, layout hierarchies, dynamic sitemap implementation, and error boundaries.

---

## 1. Route Topology & Application Domains

The Next.js 16 App Router divides the application into isolated functional route domains:

```
site/app/
├── (site)/                    ✅ Public Marketing & Catalog
│   ├── page.tsx               ✅ Homepage
│   ├── products/              ✅ Catalog grid and Product Detail Pages (PDP)
│   ├── choose-product/        ✅ Configurator wizard entrypoint
│   ├── tools/                 ✅ PWA and calculation tools
│   └── (legal)/               ✅ Privacy, terms, refund policies
├── admin/                     ✅ Operations, Catalog & CRM Portal
│   ├── catalog/               ✅ Product manager
│   ├── plans/                 ✅ Customer floor plans
│   ├── queries/               ✅ Customer lead and query CRM
│   └── themes/                ✅ Design token manager
├── ooplanner/                 ✅ 2D/3D Floor Planner (Dockview + Fabric.js + Three.js)
├── oostudio/                  ✅ 2D/3D Furniture Studio (Fabric.js + glTF)
├── api/                       ✅ Serverless API Routes (Edge + Node runtimes)
│   ├── catalog/
│   ├── plans/
│   ├── admin/
│   └── health/
├── api-docs/                  ✅ OpenAPI Specification UI (Scalar/Swagger)
├── offline/                   ✅ PWA offline fallback shell
├── .well-known/               ✅ Next.js fallback for edge security endpoints
├── robots.ts                  ✅ Dynamic robots.txt generation
├── sitemap.ts                 ✅ Dynamic database-driven sitemap generator
├── layout.tsx                 ✅ Monorepo root shell layout
├── error.tsx                  ✅ Top-level route error boundary
├── global-error.tsx           ✅ Fatal root boundary
└── not-found.tsx              ✅ Dual-language 404 handler (en/hi)
```

---

## 2. Dynamic Sitemap Engine (`site/app/sitemap.ts`)

### 2.1 Reality vs. Prior Misdiagnosis
Previous audits attributed sitemap 404s to static slug lists in `productStaticParams.ts`. Inspection of [`site/app/sitemap.ts`](file:///d:/23082026/site/app/sitemap.ts) confirms that the sitemap is **fully dynamic**:
- It invokes `buildProductStaticParams()` to retrieve active catalog products from the database.
- It filters slugs through `isSafeSitemapSegment()` and maps them against `routeClassification.ts`.
- It adheres strictly to Google Search Central standards by emitting only `<loc>` and `<lastmod>`, intentionally omitting obsolete `<priority>` and `<changefreq>` tags.

### 2.2 Sitemap Health Verification
```powershell
# Run dynamic sitemap health audit
pnpm run audit:sitemap-health
```

---

## 3. Platform Boundaries & Fork Isolation

Per `AGENTS.md §3` and `oando-master`:
- **Studio (`site/app/oostudio/`) and Planner (`site/app/ooplanner/`) are strictly forked trees.**
- Route components under `/oostudio` must NEVER import from `/ooplanner` or `@planner/*`.
- Route components under `/ooplanner` must NEVER import from `/oostudio` or `@studio/*`.
- Boundary violations are continuously prevented via `pnpm run scan:boundaries`.

---

## 4. Verification & Gate Commands

```powershell
# 1. Typecheck the entire Next.js App Router tree
pnpm run typecheck

# 2. Verify boundary isolation
pnpm run scan:boundaries

# 3. Test App Router unit tests
pnpm exec vitest run tests/unit/site/
```
