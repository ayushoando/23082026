# Cloudflare Worker Audit

**Created:** 2026-08-31
**Status:** ✅ Audit complete — Architecture verified (2026-08-31)

## Architecture

The Worker (`workers/oando-worker-proxy/`) sits between clients and the Vercel origin:

```
Client → Cloudflare DNS → oando-worker-proxy → Vercel (Next.js)
                              │
                              ├── R2 bucket (assets)
                              ├── Security.txt (edge-served)
                              └── www→apex 308 redirect
```

## Bindings (wrangler.toml)
- **R2:** `ASSET_BUCKET` → `oando-asset-cdn`
- **Env:** `VERCEL_ORIGIN`, `PUBLIC_INDEXABLE_HOSTS`

## Cache Policy (cachePolicy.js)

| Feature | Implementation |
|---|---|
| Private paths | `/api/`, `/admin/`, `/ooplanner/`, `/oostudio/`, `/portal/`, `/dashboard/`, `/login/`, `/access/` |
| Session detection | Regex match for `sb-*-auth-token=` cookies |
| Cache eligibility | GET/HEAD only, 200 status, no set-cookie, no session cookie, not private path |
| Static assets | `/_next/static/` → `max-age=31536000, immutable` |
| Other public | `s-maxage=300, stale-while-revalidate=3600` |

## Key Findings

### Strengths
- **Cost guard:** Asset paths never fall through to Vercel — R2 miss serves brand fallback with short TTL
- **Seating subcategory routing:** Complex R2 key rewriting for seating product assets (leather/cafe/fabric/mesh)
- **Robots tag management:** Strips Vercel's `X-Robots-Tag` for public apex, enforces `noindex` on preview/workers.dev hosts
- **HSTS on all responses:** `max-age=31536000; includeSubDomains; preload`
- **Security.txt:** RFC 9116 compliant, served at edge

### Issues
- **security.txt contact is sales email** — not a dedicated security contact (also noted in SEC-L01)
- **Seating routing logic is complex** — hardcoded product sets for leather/cafe/fabric classification. Should this be data-driven?
- **No Vectorize binding** — needed for AI-FIX-05 (Cloudflare Vectorize migration). Will require adding `[[vectorize]]` binding to wrangler.toml.

### Remedy
Only change needed: add Vectorize binding when executing the AI remedy plan. Otherwise the Worker is well-built.
