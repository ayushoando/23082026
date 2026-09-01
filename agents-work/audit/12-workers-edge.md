# 12 — Workers & Edge (`workers/oando-worker-proxy`)

**Structure:** `src/index.js` (272 lines), `src/cachePolicy.js`, `wrangler.toml`, npm `package.json` + `package-lock.json`, `README.md`. Not a pnpm workspace member; root `worker:dev/deploy/tail` scripts reach it via `pnpm --dir`.

## Behavior (verified)

- `www → apex` 308 (HSTS); serves RFC 9116 `security.txt`; serves `/assets/*` + `/images/*` from **R2** (`ASSET_BUCKET` binding) with key-layout rewrites; brand fallback image on miss (300s TTL); hard 404 on asset-path miss (never billed to Vercel); else proxies to `VERCEL_ORIGIN` with `Host` rewritten and `x-forwarded-host`/`x-forwarded-proto` set from the request (lines 187–196).
- No auth on the worker — public edge/CDN proxy by design; no admin surface, no config/debug endpoints.
- **Cache policy** (`src/cachePolicy.js`): never caches non-GET/HEAD, non-200, `Set-Cookie` responses, requests with a Supabase session cookie (`sb-*-auth-token` regex), or private prefixes `/api/, /admin/, /ooplanner/, /oostudio/, /portal/, /dashboard/, /login/, /access/` — prevents authenticated-HTML cache poisoning.
- `X-Robots-Tag` from origin dropped and re-applied only for allow-listed public hosts (noindex for `*.vercel.app`/`*.workers.dev`); hop-by-hop headers stripped. Defeats the vercel.json preview-noindex poisoning.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 12.1 | **Medium** | **Hardcoded origin:** `wrangler.toml:12` `VERCEL_ORIGIN = "https://oando1408.vercel.app"` plus a second hardcoded fallback in `src/index.js:188`. A Vercel project rename silently breaks the production proxy. Note: `oando1408` itself is owner-off-limits — only the indirection should change, not that project. |
| 12.2 | **Medium** | **Product data embedded in worker code:** `src/index.js:76-95` hardcodes seating SKU→material slug sets (`seatingLeather/Cafe/Fabric`) and a rewrite regex; `src/index.js:127-137` hardcodes `/images/` path remapping. Duplicates catalog knowledge into the edge — will drift when the catalog changes. |
| 12.3 | Med(-low) | **Stale runtime:** `compatibility_date = "2024-01-01"` against wrangler 4.x (2+ years behind); no `[env.production]`, no routes/custom-domain config (presumably dashboard-bound, undocumented here). |
| 12.4 | Info (positive) | R2-first asset serving with a cost guard; HSTS on every response path; RFC 9116 security.txt at edge; `[[vectorize]]` binding for RAG; no secrets in repo (`wrangler.toml` has only non-secret vars). |
| 12.5 | Info | `security.txt` hardcodes personal email + phone (`index.js:15-17`) — intentional RFC 9116 disclosure contact. |
| 12.6 | Low | Worker has its own **npm** `package-lock.json` inside a pnpm repo; wrangler version skew (root `^4.127.1` vs worker `^4.123.0`). |
