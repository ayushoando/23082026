# MCP Servers, Plugins & Skills Comprehensive Audit Report

**Date:** 2026-09-04  
**Scope:** Global plugins (`C:\Users\ayush\.gemini\config\plugins`), Workspace skills (`.agents/skills`), MCP Servers (`C:\Users\ayush\.gemini\antigravity-ide\mcp`), and Architecture Alignment.  
**Stack Alignment:** Next.js 16 + React 19 + Supabase (Postgres) + Cloudflare R2 & Worker Proxy + Vitest/Playwright.

---

## Executive Summary

The current agent environment contains **7 plugins**, **42 skills**, and **1 active MCP server**. However, there is a **65% stack misalignment**: heavy Google Cloud Platform (BigQuery/Dataform/Spark) and Firebase tooling are actively loaded despite the project running exclusively on **Supabase, Cloudflare, and Vercel**.

```
Current Environment Footprint:
├── Active MCP Servers: 1 (gemini-api-docs)
├── Installed Plugins: 7
│   ├── chrome-devtools-plugin (5 skills) — ✅ RELEVANT (A11y, Performance, DevTools)
│   ├── modern-web-guidance-plugin (2 skills) — ✅ RELEVANT (Modern Web, CSS)
│   ├── gemini-api (4 skills) — 🟡 AUXILIARY (AI catalog embeddings)
│   ├── google-antigravity-sdk (1 skill) — 🟡 META (Agent config)
│   ├── data-agent-kit-plugin (17 skills) — ❌ MISALIGNED (BigQuery/GCP pipelines)
│   └── firebase (11 skills) — ❌ MISALIGNED (Firebase/Firestore/Xcode)
└── Workspace Skills (.agents/skills): 3
    ├── recovery-audit — ✅ ACTIVE REPO GOVERNANCE
    ├── safe-change — ✅ ACTIVE REPO GOVERNANCE
    └── ui-redesign — ✅ ACTIVE REPO GOVERNANCE
```

---

## 1. Audit of Currently Installed Skills & Plugins

### 1.1 High-Value & Relevant Tools (Keep & Prioritize)
| Plugin / Skill | Domain | Value to Oando Project |
| :--- | :--- | :--- |
| **`chrome-devtools-plugin`** (`a11y-debugging`, `debug-optimize-lcp`, `chrome-devtools`) | Performance & UX | Critical for validating Core Web Vitals (LCP on product catalog pages) and testing WCAG 2.1 accessibility. |
| **`modern-web-guidance-plugin`** (`modern-web-guidance`) | Frontend Standards | Ensures modern CSS `:has()`, view transitions, container queries, and semantic HTML without framework anti-patterns. |
| **Workspace Skills** (`safe-change`, `recovery-audit`, `ui-redesign`) | Governance | Directly implements the rules defined in `AGENTS.md` to prevent unapproved writes and preserve directory boundaries. |
| **MCP: `gemini-api-docs`** | Documentation | Instant lookup for official Google GenAI SDK method signatures and rate limit handling. |

### 1.2 Irrelevant & Bloated Tools (Candidates for Deactivation)
| Plugin / Skill | Issues & Inefficiencies | Recommended Action |
| :--- | :--- | :--- |
| **`data-agent-kit-plugin`** (17 skills: BigQuery, Dataform, Dataproc, GCS, Composer, Spark) | **High Context Overhead.** Injects dozens of GCP data engineering triggers into the agent's prompt context, none of which apply to Supabase Postgres. | Disable or unload from this workspace profile to save tokens and eliminate false routing. |
| **`firebase`** (11 skills: Firestore, Data Connect, Crashlytics, Xcode, App Hosting) | **Wrong Cloud Database.** Oando uses PostgreSQL (Supabase `rxzpznmxbaoxpikowmfc` & `erpweaiypimorcunaimz`), not Firebase. Triggers can cause hallucinated Firebase queries. | Disable globally unless actively working on external mobile/Firebase apps. |

---

## 2. Recommended High-Impact MCP Servers

To transform the pair-programming workflow into an enterprise-grade setup, configure the following specialized MCP servers:

### 2.1 Supabase / PostgreSQL MCP Server (Priority: P0)
- **Role:** Direct introspection of dual-database schemas, table grants, RLS policies, and index performance.
- **Capabilities:**
  - Execute read-only `EXPLAIN ANALYZE` on sluggish catalog queries.
  - Verify migration rollback statements against live PostgreSQL catalogs before executing `pnpm run db:apply`.
  - Validate that `profiles` table columns match application Drizzle schemas without manual psql commands.
- **Recommended Package:** `@modelcontextprotocol/server-postgres` or Supabase Official MCP.

### 2.2 Cloudflare MCP Server (Priority: P0)
- **Role:** Inspect and manage Cloudflare Workers, R2 buckets, and Vectorize indexes.
- **Capabilities:**
  - Query live status of `oando-worker-proxy` deployments and inspect live tail logs.
  - Verify R2 bucket object counts and prefix structures in `oando-asset-cdn` without shell scripts.
  - Query Vectorize index `catalog-nav` (768 dimensions) to test semantic search similarity scores.
- **Recommended Package:** `@cloudflare/mcp-server-cloudflare`.

### 2.3 Playwright MCP Server (Priority: P1)
- **Role:** Autonomous headless browser testing and visual regression validation.
- **Capabilities:**
  - Run Playwright specs directly within the agent loop, capturing DOM snapshots and action traces.
  - Validate canvas rendering in Studio (`/oostudio`) and Planner (`/ooplanner`) across viewport sizes.

---

## 3. Recommended Custom Skills to Author in `.agents/skills/`

### 3.1 `supabase-dual-db-ops`
- **Purpose:** Enforce repository rules around dual databases (Products vs Admin).
- **Rules Codified:**
  - Never write to `profiles.email` or `profiles.role` (schema traps).
  - Furniture must strictly be written to Admin DB (`furniture_catalog`).
  - All migrations must have `-- rollback:` comments.

### 3.2 `focss-design-token-guard`
- **Purpose:** Protect the `@focss/*` styling system.
- **Rules Codified:**
  - Forbid ad-hoc Tailwind utility classes in `site/app` or `site/components`.
  - Validate CSS variable mappings against `site/focss/tokens/`.

### 3.3 `cloudflare-worker-proxy-deploy`
- **Purpose:** Enforce deployment integrity for `workers/oando-worker-proxy`.
- **Rules Codified:**
  - Ensure `npm ci` runs inside `workers/oando-worker-proxy` (isolated from root pnpm workspace).
  - Verify `VERCEL_ORIGIN` matches production host.
  - Verify Cloudflare account token permissions before pushing.

---

## 4. Implementation Action Plan

1. **Clean Workspace Context:** Unload `data-agent-kit-plugin` and `firebase` from the active agent configuration for workspace `d:\23082026`.
2. **Provision Cloudflare & Postgres MCP:** Add server stanzas in `.agents/mcp_config.json` or `C:\Users\ayush\.gemini\antigravity-ide\mcp\`.
3. **Persist Custom Skills:** Author `supabase-dual-db-ops` and `focss-design-token-guard` under `d:\23082026\.agents\skills\`.
