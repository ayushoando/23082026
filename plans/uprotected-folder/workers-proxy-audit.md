# Cloudflare Worker Proxy (`workers/`) Subsystem Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`workers/oando-worker-proxy/`](file:///d:/23082026/workers/oando-worker-proxy/)  
**Method:** Live file inspections of `src/index.js`, `src/cachePolicy.js`, `wrangler.toml`, unit tests, and operational npm dependencies.

---

## 1. Subsystem Architecture & Edge Routing

The Cloudflare Worker proxy acts as the front door for `oando.co.in`, handling asset acceleration, vector search offloading, security headers, and reverse-proxying application traffic to Vercel.

```
Request (oando.co.in)
  │
  ├── 1. Protocol Guard: Reject double-slash paths (//...) with HTTP 400
  ├── 2. Security RFC 9116: Serve /.well-known/security.txt directly
  ├── 3. Apex Redirect: www.oando.co.in ──► 308 Permanent Redirect to apex
  ├── 4. Asset Offload: /assets/*, /images/* ──► Cloudflare R2 (oando-asset-cdn)
  ├── 5. Vector Search: /api/vector/* ──► Vectorize Index (catalog-nav)
  └── 6. Dynamic SSR / App: Forward to Vercel (https://oando1408.vercel.app)
```

---

## 2. Source Code & Configuration Breakdown

### 2.1 File Inventory
- **`src/index.js` (11.5 KB):** Main Cloudflare Worker fetch handler. Implements edge routing, path sanitization, R2 asset serving, and origin dispatch.
- **`src/cachePolicy.js` (1.8 KB):** Pure caching and routing utility functions:
  - `apexRedirectLocation(requestUrl)`: Canonical apex URL generation.
  - `requestHasSessionCookie(cookieHeader)`: Supabase auth cookie detection.
  - `pathIsPrivate(pathname)`: Flags private routes (`/api/`, `/admin/`, `/ooplanner/`, `/oostudio/`, `/portal/`, `/dashboard/`, `/login/`, `/access/`).
  - `shouldCacheResponse(...)`: Decides edge cache eligibility.
  - `cacheControlForPath(pathname)`: Assigns immutable cache headers for `/_next/static/` and standard TTLs for public assets.
- **`wrangler.toml` (686 bytes):** Cloudflare deployment configuration.
- **`package-lock.json`:** Independent npm lockfile ensuring hermetic build and zero coupling to pnpm root.

### 2.2 Bindings Configuration
```toml
name = "oando-worker-proxy"
main = "src/index.js"
compatibility_date = "2024-09-03"

[vars]
VERCEL_ORIGIN = "https://oando1408.vercel.app"
PUBLIC_INDEXABLE_HOSTS = "oando.co.in,www.oando.co.in"

[[r2_buckets]]
binding = "ASSET_BUCKET"
bucket_name = "oando-asset-cdn"

[[vectorize]]
binding = "CATALOG_VECTORS"
index_name = "catalog-nav"
```

---

## 3. Unit Test Coverage & Verification

Unlike previous audit assumptions, the worker proxy has dedicated unit tests in the repository test suite:
- [`tests/unit/workers/cachePolicy.test.ts`](file:///d:/23082026/tests/unit/workers/cachePolicy.test.ts) — Validates cache TTLs, cookie detection, private path detection, and apex redirect URLs.
- [`tests/unit/workers/originConfig.test.ts`](file:///d:/23082026/tests/unit/workers/originConfig.test.ts) — Validates header forwarding, host preservation, and protocol guards.

Both test files run cleanly under Vitest:
```powershell
pnpm exec vitest run tests/unit/workers/
```

---

## 4. Package Isolation & Deployment Runbook

Per `pnpm-workspace.yaml`, the worker is **deliberately isolated** from the root workspace. Always deploy using the root npm wrapper or the worker directory:

```powershell
# 1. Run worker unit tests from root
pnpm exec vitest run tests/unit/workers/

# 2. Local worker development
pnpm run worker:dev

# 3. Production worker deployment (requires authorized operator and valid CF token)
pnpm run worker:deploy

# 4. Tail production logs
pnpm run worker:tail
```

### Operational Safeguards:
- `CF-TOKEN-01` has been cleared from `Failures.md`. Active token in `.env.local` is valid.
- Never add `workers/oando-worker-proxy` to `pnpm-workspace.yaml`.
