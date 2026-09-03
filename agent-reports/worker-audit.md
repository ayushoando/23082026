# Cloudflare Worker Proxy & Edge Architecture Audit Record

**Date:** 2026-08-31  
**Status:** ✅ 100% AUDITED & VERIFIED  
**Scope:** `workers/oando-worker-proxy/`, edge caching policy, Cloudflare Vectorize binding, R2 asset bucket routing, security headers  

---

## 1. Edge Architecture

Clients route through Cloudflare DNS to the edge worker proxy before hitting Vercel:
```
Client -> Cloudflare DNS -> oando-worker-proxy -> Vercel (Next.js)
                                  |
                                  |-- R2 bucket (assets / CDN)
                                  |-- Cloudflare Vectorize (catalog-nav)
                                  |-- security.txt (edge-served)
                                  \-- www -> apex 308 redirect
```

---

## 2. Bindings & Features

- **Vectorize Binding:** `wrangler.toml` declares `[[vectorize]] binding = "CATALOG_VECTORS"` targeting index `catalog-nav` for edge AI catalog search.
- **R2 Asset Storage:** `ASSET_BUCKET` bound to `oando-asset-cdn`. Asset misses serve brand fallbacks without falling through to origin.
- **Edge Cache Policy:** Private routes (`/api/`, `/admin/`, `/ooplanner/`, `/oostudio/`, `/portal/`, `/dashboard/`) bypass cache completely based on session cookie pattern matching.
- **Security Headers:** Enforces HSTS (`max-age=31536000; includeSubDomains; preload`) and edge RFC 9116 `security.txt`.
