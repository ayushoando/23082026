# Cloudflare Worker Proxy (`workers/`) Subsystem Audit

**Audited:** 2026-09-04 (live source code read)  
**Method:** `workers/oando-worker-proxy/src/index.js` (11,541 bytes), `src/cachePolicy.js` (1,873 bytes), `wrangler.toml` (686 bytes), `package.json`, `package-lock.json` all read live.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| Entrypoint: `src/index.js` | Claimed | ✅ **Confirmed** |
| R2 binding: `ASSET_BUCKET = "oando-asset-cdn"` | Claimed | ✅ **Confirmed** |
| Vectorize binding: `CATALOG_VECTORS = "catalog-nav"` | Claimed | ✅ **Confirmed** |
| `VERCEL_ORIGIN`: `"https://oando1408.vercel.app"` | Claimed | ✅ **Confirmed** |
| `PUBLIC_INDEXABLE_HOSTS`: `"oando.co.in,www.oando.co.in"` | Claimed | ✅ **Confirmed** |
| Worker files: just `src/index.js` implied | Prior report only mentioned `index.js` | ❌ **INCOMPLETE** — Worker has **two source files**: `src/index.js` (11,541 bytes) and `src/cachePolicy.js` (1,873 bytes). `index.js` imports from `./cachePolicy.js`. |
| Protocol guard: reject `//` paths with HTTP 400 | Claimed | ✅ **Confirmed in source** — `if (pathname.startsWith('//'))` → 400 |
| Apex redirect: `www.` → apex with HTTP 308 | Claimed | ✅ **Confirmed** — `apexRedirectLocation()` in `cachePolicy.js` |
| RFC 9116 security.txt served at edge | Claimed | ✅ **Confirmed** — full `SECURITY_TXT` constant with `Expires: 2027-08-09`, `Hiring` URL |
| Asset cost guard: R2 → fallback logo (never Vercel) | Claimed | ✅ **Confirmed** — extensive R2 key resolution logic including path rewriting and padded image variants |
| SEO noindex stripping for apex domain | Claimed | ✅ **Confirmed** in routing logic |
| `CF-TOKEN-01` blocker "resolved" | Claimed ("token cfat_tyy... is active") | ⚠️ **STALE** — `CF-TOKEN-01` still in `Failures.md`. Operator has not cleared it. |
| Worker not in pnpm workspace | Claimed | ✅ **Confirmed** — `workers/oando-worker-proxy` has own `package-lock.json` (51,599 bytes) |

---

## 1. Live Source Architecture

```
workers/oando-worker-proxy/
├── src/
│   ├── index.js       11,541 bytes  ← Main fetch handler
│   └── cachePolicy.js  1,873 bytes  ← Cache/routing utility functions
├── wrangler.toml          686 bytes  ← Cloudflare config (confirmed)
├── package.json           252 bytes  ← Standalone package
├── package-lock.json   51,599 bytes  ← npm lockfile (NOT pnpm)
└── README.md            1,890 bytes
```

**`cachePolicy.js` exports (confirmed live):**
```javascript
export function apexRedirectLocation(requestUrl)  // www.→apex 308
export function requestHasSessionCookie(cookieHeader)  // Supabase cookie detection
export function pathIsPrivate(pathname)  // /api/, /admin/, /ooplanner/, /oostudio/, /portal/, etc.
export function shouldCacheResponse({method, pathname, cookieHeader, status, setCookie})
export function cacheControlForPath(pathname)  // /_next/static/ → immutable; else s-maxage=300
```

**Private path prefixes** defined in `cachePolicy.js` (not in prior report):
```
/api/, /admin/, /ooplanner/, /oostudio/, /portal/, /dashboard/, /login/, /access/
```

---

## 2. Core Edge Routing (Confirmed + Extended)

### 2.1 Request Processing Order

1. **Protocol guard** — Reject `//`-prefix paths → HTTP 400
2. **Apex canonicalization** — `www.` → `https://oando.co.in` → HTTP 308 (via `apexRedirectLocation()`)
3. **RFC 9116 security.txt** — Served at edge for `/.well-known/security.txt` and `/security.txt` (trailing-slash normalized)
4. **Asset interception** — `/assets/*` or `/images/*` paths → R2 with complex key resolution (see below)
5. **Dynamic reverse proxy** — All other requests → Vercel origin with header sanitization

### 2.2 R2 Asset Key Resolution (More Complex Than Reported)

The worker has non-trivial key resolution logic not mentioned in the prior report:

- **Seating subcategory rewrite:** Slug sets (`leather`, `cafe`, `fabric`, `mesh`) from hardcoded product name lists. Rewrites `/seating/non-leather/{sku}` → `/seating/{material}/{sku}`.
- **Gallery path normalization:** `/gallery/` variants tried
- **Key variants tried per request:**
  - `baseKey` (path minus leading `/`)
  - Key without `assets/` prefix (for bucket keys stored without the dir prefix)
  - Padded/unpadded image number variants (`image-01` vs `image-1`)
- **On R2 miss for `/assets/`:** Serves brand fallback logo with 5-min TTL (`x-oando-proxy: r2-fallback`)
- **On R2 miss for `/images/`:** Falls through differently from `/assets/`

### 2.3 SEO Header Sanitization (Confirmed)

Vercel returns `X-Robots-Tag: noindex, nofollow` on all `oando1408.vercel.app` responses. Worker:
- For apex hosts: strips noindex, sets `X-Robots-Tag: all` + `x-oando-indexable: 1`
- For staging/preview: preserves `noindex`

### 2.4 Cache Policy (from `cachePolicy.js`)

| Route Type | Cache-Control |
| :--- | :--- |
| `/_next/static/**` | `public, max-age=31536000, immutable` |
| All other public routes | `public, s-maxage=300, stale-while-revalidate=3600` |
| Private paths, session cookies, non-200, non-GET | Not cached |

---

## 3. Worker Test Coverage (Corrected)

The prior report said only `originConfig.test.ts` exists. **Live state:**

| Test File | Tests |
| :--- | :--- |
| `tests/unit/workers/cachePolicy.test.ts` | Tests all 5 `cachePolicy.js` exports |
| `tests/unit/workers/originConfig.test.ts` | Tests worker route matching and origin proxy logic |

---

## 4. Operational Constraints (Confirmed)

1. **Workspace isolation:** `workers/oando-worker-proxy` is NOT in pnpm workspace. Must `npm ci` inside the directory before deploy.
2. **Deploy command:** `pnpm run worker:deploy` (from root, but runs `npm ci` inside worker dir as prerequisite).
3. **CF-TOKEN-01:** Token appears functionally active (prior agent verified `cfat_tyy...`). Blocker row **still in `Failures.md`** — operator must remove.

---

## 5. Security Disclosure (Confirmed Details)

```
Contact: mailto:sales@oando.co.in
Contact: tel:+91-98356-30940
Expires: 2027-08-09T00:00:00.000Z
Preferred-Languages: en, hi
Canonical: https://oando.co.in/.well-known/security.txt
Policy: https://oando.co.in/privacy/
Hiring: https://oando.co.in/career/
```

Served with `cache-control: public, max-age=86400` (24h TTL — prior report's claim confirmed).
