# MCP Servers, Plugins & Skills Audit

**Audited:** 2026-09-04 (live workspace plugin inventory verified)  
**Method:** Plugin list read from active system context. Workspace `.agents/skills/` directory read live. No MCP server additions observed since prior report.

---

## What Changed vs. Prior Report

| Finding | Prior Report Claim | Live Reality |
| :--- | :--- | :--- |
| Workspace skills count | 3 (`recovery-audit`, `safe-change`, `ui-redesign`) | ✅ **Confirmed** — all 3 still present, no new skills added |
| Recommended custom skills | Not yet authored | ✅ **Still not authored** — `supabase-dual-db-ops`, `focss-design-token-guard`, `cloudflare-worker-proxy-deploy` remain as recommendations only |
| Recommended MCPs | Not yet provisioned | ✅ **Still not provisioned** — no Supabase, Cloudflare, or Playwright MCP configured |
| GCP/Firebase plugin bloat | 65% stack misalignment | ✅ **Still present** — `data-agent-kit-plugin` (17 GCP skills) and `firebase` (11 skills) still active in global config |

---

## Executive Summary

No changes have been made since the prior report. The environment carries **65% stack misalignment** with GCP/Firebase plugins loaded against a Supabase/Cloudflare/Vercel stack. The three recommended workspace skills and three recommended MCPs remain unimplemented.

---

## 1. Current Plugin Inventory (Confirmed Active)

```
Active Environment Footprint:
├── MCP Servers: 1
│   └── gemini-api-docs — ✅ RELEVANT (GenAI SDK docs lookup)
├── Global Plugins: 7
│   ├── chrome-devtools-plugin (5 skills) — ✅ RELEVANT
│   │   a11y-debugging, debug-optimize-lcp, chrome-devtools,
│   │   memory-leak-debugging, troubleshooting
│   ├── modern-web-guidance-plugin (2 skills) — ✅ RELEVANT
│   │   modern-web-guidance, chrome-extensions
│   ├── gemini-api (4 skills) — 🟡 AUXILIARY (AI advisor/RAG)
│   │   gemini-api-dev, gemini-interactions-api,
│   │   gemini-live-api-dev, gemini-omni-flash-api
│   ├── google-antigravity-sdk (1 skill) — 🟡 META
│   ├── data-agent-kit-plugin (17 skills) — ❌ MISALIGNED (BigQuery/GCP)
│   │   bigquery-*, dataform-*, dbt-*, gcp-*, gcs-*,
│   │   discovering-gcp-data-assets, federate-lakehouse-catalog, etc.
│   └── firebase (11 skills) — ❌ MISALIGNED (Firestore/Crashlytics/Xcode)
│       firebase-*, xcode-project-setup
└── Workspace Skills (.agents/skills/): 3
    ├── recovery-audit — ✅ ACTIVE
    ├── safe-change — ✅ ACTIVE
    └── ui-redesign — ✅ ACTIVE
```

---

## 2. Recommended MCPs (Not Yet Provisioned — Still P0/P1)

### 2.1 Supabase / PostgreSQL MCP (P0 — Not Provisioned)

- **Why:** Live schema introspection of both Supabase DBs without manual psql/curl. Validate that `profiles` has no `email/role`, verify RLS policy coverage, dry-run migrations.
- **Package:** `@modelcontextprotocol/server-postgres` or Supabase Official MCP
- **Config target:** `.agents/mcp_config.json`
- **Connection strings:** `PRODUCTS_DATABASE_URL` and `SUPABASE_AUTH_DATABASE_URL` from `.env.local`

### 2.2 Cloudflare MCP (P0 — Not Provisioned)

- **Why:** Inspect `oando-worker-proxy` deployment status, tail live logs, query R2 bucket object inventory, test Vectorize `catalog-nav` similarity searches.
- **Package:** `@cloudflare/mcp-server-cloudflare`
- **Config target:** `.agents/mcp_config.json`
- **Credentials:** `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` from `.env.local`

### 2.3 Playwright MCP (P1 — Not Provisioned)

- **Why:** Run Playwright specs inside the agent loop. Currently `BROWSER-ORIGIN-02` blocker prevents browser walks; a Playwright MCP would allow structured E2E without manual server management.
- **Config target:** `.agents/mcp_config.json`

---

## 3. Recommended Custom Skills (Not Yet Authored — Still Pending)

### 3.1 `supabase-dual-db-ops` → `.agents/skills/supabase-dual-db-ops/SKILL.md`

Rules to codify:
- Never write `profiles.email` or `profiles.role` — columns don't exist, triggers `PGRST204`
- Furniture (`furniture_catalog`) and block descriptors → Admin DB only (`rxzpznmxbaoxpikowmfc`)
- All migrations must have `-- rollback:` comment (enforced by `check:governance` ratchet)
- Persistence wrappers (`writeFurnitureItem`, etc.) — never raw disk helpers in production
- Dry-run before applying: `pnpm run db:apply -- --dry` and `pnpm run db:apply:admin -- --dry`

### 3.2 `focss-design-token-guard` → `.agents/skills/focss-design-token-guard/SKILL.md`

Rules to codify:
- Zero raw `#hex` literals in CSS (enforced by `pnpm run check:style-tokens`)
- No ad-hoc Tailwind utility classes in `site/app` or `site/components`
- All CSS variables must resolve through `site/focss/tokens/`
- 151 modular CSS files — run `pnpm run verify:focss` after any CSS change
- Import hierarchy: Tokens → Foundations → Components → Shells; zero cycles

### 3.3 `cloudflare-worker-proxy-deploy` → `.agents/skills/cloudflare-worker-proxy-deploy/SKILL.md`

Rules to codify:
- Worker is **not** in the pnpm workspace; run `npm ci` inside `workers/oando-worker-proxy/` before any deploy
- Verify `VERCEL_ORIGIN` in `wrangler.toml` matches live production host before deploy
- Verify Cloudflare API token scope: Workers + R2 + Vectorize + Zone DNS
- Deploy command: `pnpm run worker:deploy` (runs `release:gate` as prerequisite)
- Secret name canonical: `CLOUDFLARE_API_TOKEN` (not `CLOUDFLARE_API_TOKEN_*` variants)

---

## 4. Implementation Action Plan (Updated Status)

| Action | Status | Priority |
| :--- | :--- | :---: |
| Unload `data-agent-kit-plugin` from workspace agent profile | ❌ Not done | P1 |
| Unload `firebase` from workspace agent profile | ❌ Not done | P1 |
| Create `.agents/mcp_config.json` with Supabase Postgres MCP | ❌ Not done | P0 |
| Create `.agents/mcp_config.json` with Cloudflare MCP | ❌ Not done | P0 |
| Create `.agents/mcp_config.json` with Playwright MCP | ❌ Not done | P1 |
| Author `supabase-dual-db-ops` skill | ❌ Not done | P1 |
| Author `focss-design-token-guard` skill | ❌ Not done | P1 |
| Author `cloudflare-worker-proxy-deploy` skill | ❌ Not done | P2 |
