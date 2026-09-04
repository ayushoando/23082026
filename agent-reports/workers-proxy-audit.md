# Cloudflare Worker Proxy (`workers/`) Subsystem Audit

**Date:** 2026-09-04  
**Target:** [`workers/`](file:///d:/23082026/workers/) & [`workers/oando-worker-proxy/`](file:///d:/23082026/workers/oando-worker-proxy/)  
**Deployment Target:** Cloudflare Global Edge Network  
**Bindings:** Cloudflare R2 (`oando-asset-cdn`), Vectorize (`catalog-nav`)

---

## Executive Summary

The [`workers/`](file:///d:/23082026/workers/) directory houses **`oando-worker-proxy`**, a mission-critical Cloudflare Worker that serves as the **public ingress reverse proxy** for all traffic directed to `oando.co.in`. 

Positioned in front of Vercel, it intercepts static media requests to serve them directly from Cloudflare R2 (eliminating Vercel bandwidth costs), normalizes apex host redirects, serves RFC 9116 security disclosures, and sanitizes SEO headers emitted by upstream Vercel preview environments.

```
Edge Proxy Architecture:
User Request (oando.co.in)
       │
       ▼
Cloudflare Worker (oando-worker-proxy)
├── 1. Protocol Guard: Reject protocol-relative '//' paths (HTTP 400)
├── 2. Apex Canonicalization: Redirect www.oando.co.in -> https://oando.co.in (HTTP 308)
├── 3. Edge RFC 9116: Directly serve /.well-known/security.txt (HTTP 200, 24h cache)
├── 4. Asset Interception:
│      ├── Path matches /assets/* or /images/*
│      ├── Resolve against Cloudflare R2 (oando-asset-cdn)
│      └── On miss: Serve fallback logo (x-oando-proxy: r2-fallback) — Never bill Vercel!
└── 5. Dynamic Reverse Proxy:
       ├── Rewrite Host to Vercel origin (oando1408.vercel.app)
       ├── Preserve x-forwarded-host
       └── Strip upstream 'X-Robots-Tag: noindex' -> Set 'X-Robots-Tag: all' for apex
```

---

## 1. Subsystem Configuration & Bindings

File: [`workers/oando-worker-proxy/wrangler.toml`](file:///d:/23082026/workers/oando-worker-proxy/wrangler.toml)

* **Worker Name:** `oando-worker-proxy`
* **Compatibility Date:** `2024-01-01`
* **Entrypoint:** `src/index.js`
* **R2 Bucket Binding:** `ASSET_BUCKET = "oando-asset-cdn"`
* **Vectorize Index Binding:** `CATALOG_VECTORS = "catalog-nav"` (768 dimensions, cosine similarity)
* **Environment Variables:**
  * `VERCEL_ORIGIN`: `"https://oando1408.vercel.app"`
  * `PUBLIC_INDEXABLE_HOSTS`: `"oando.co.in,www.oando.co.in"`

---

## 2. Core Edge Routing Mechanics

### 2.1 Asset Cost Guard (Shielding Vercel Origin)
When end users request images or 3D furniture models (`/assets/**`, `/images/**`):
1. The worker fetches the object from R2 bucket `ASSET_BUCKET`.
2. On match: Returns HTTP 200 with `Cache-Control: public, max-age=31536000, immutable` and `x-oando-proxy: r2`.
3. On miss: Instead of falling through to Vercel (which would incur bandwidth transfer charges), it serves the brand fallback logo (`marketing/brand/logos/logo-sharp.png`) with a 5-minute TTL (`x-oando-proxy: r2-fallback`).

### 2.2 SEO Indexing Header Restoration
* Because the worker forwards requests to Vercel using origin hostname `oando1408.vercel.app`, Vercel's root [`vercel.json`](file:///d:/23082026/vercel.json) automatically injects `X-Robots-Tag: noindex, nofollow`.
* The worker intercepts Vercel's response at the edge:
  * For apex domains (`oando.co.in`), it **strips the noindex tag** and injects `X-Robots-Tag: all` and `x-oando-indexable: 1`.
  * For staging/preview URLs, it preserves the `noindex` directive to protect Google search ranking from duplicate content penalties.

---

## 3. Operational & Workspace Constraints

1. **Workspace Decoupling:**  
   `workers/oando-worker-proxy` is **not** included in root `pnpm-workspace.yaml`. It manages its own `package-lock.json`.  
   *Operational Rule:* Running `pnpm install` at root will **not** install worker dependencies. Operators must run `npm ci` inside `workers/oando-worker-proxy` prior to running `pnpm run worker:deploy`.
2. **Cloudflare Token Dependency:**  
   Deployment requires an active Account-Owned API token with Workers and R2 permissions. As verified on 2026-09-04, token `cfat_tyy...` is active and blocker `CF-TOKEN-01` is resolved.
