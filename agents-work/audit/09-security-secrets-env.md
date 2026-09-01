# 09 — Security: Secrets & Env

## Verified clean

- **Hardcoded secrets:** grep for `sk-…`, `whsec_…`, `AKIA…`, `ghp_…`, `github_pat_`, `xox[bp]-`, `AIzaSy…` across repo (excl. node_modules): **no matches**.
- **`scripts/general/scan_secrets.mjs`**: patterns for `sb_secret_`, `sb_publishable_`, Supabase service-role keys, postgres URLs, Cloudflare/OpenAI tokens; scans **git-tracked files only**; skips `.env`/`.env.local` variants; filters doc placeholders. Wired to `pnpm run scan:secrets` and `check:launch`.
- **`.env.example`**: template only — every secret blank. No real values committed.
- **`site/lib/env.server.ts`** (`@t3-oss/env-nextjs`, `server-only`): validates AI keys, DB URLs, Cloudflare R2 pair + API token; all optional; lazy-Proxy validation. `site/platform/supabase/env.ts` handles public Supabase pair.
- `.gitignore` covers `.env.local`, `.env*.local`, `.env*` with `!.env.example`.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 9.1 | **Medium** | **`scan:secrets` is not part of the CI release gate.** `.github/workflows/release-gate.yml` runs `release:gate:fast`/`core` — neither includes `scan:secrets` (it runs only via local `check:launch`). CI regression protection for committed secrets is absent. Fix: add to `release:gate:fast`. |
| 9.2 | Low | Several consumed env vars are **not declared** in `env.server.ts` schema (`RESEND_API_KEY`, `METRICS_AUTH_TOKEN`, `SITE_MAINTENANCE_MODE`, `CUSTOMER_QUERIES_ADMIN_TOKEN(S)`, `E2E_*`, `VERCEL_TOKEN`) — read ad-hoc via `process.env`. The "declared env" contract is partial; the existing `CLOULD_ACCESS_KEY_ID`/`CLOOUDFLARE_*` typo-alias chain (`env.server.ts:80-107`) reveals past typo incidents a schema sweep would catch. |
| 9.3 | Low (naming) | `NEXT_ADMIN_SUPABASE_ANON_KEY` / `NEXT_ADMIN_PUBLISHABLE_KEY` are anon/publishable keys despite the "ADMIN" name — public-by-design, but the naming invites misuse. `.env.example:86-87` documents the rule ("never service role on the static docs host"). |

## Client-exposed data (no issues)

`NEXT_PUBLIC_*` inventory: Supabase URL + anon key (public by design), `SITE_URL`, `ASSET_BASE_URL`, Google/Bing site verification, `TECH_DOCS_URL`, `CRM_DEMO_MODE`. **No secret material.** Service-role keys appear only in server modules. Admin payloads gated server-side (`/api/git-user` admin-only, admin analytics/themes behind `withAuth`, `theme/active` strips catalog tokens). `NEXT_PUBLIC_CRM_DEMO_MODE` toggles synthetic seed data only.
