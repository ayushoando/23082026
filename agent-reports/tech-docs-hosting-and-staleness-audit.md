# Tech-Docs Generator: Hosting, Staleness & CSS Architecture Audit

**Date:** 2026-09-04  
**Target:** [`tech-docs-generator/`](file:///d:/23082026/tech-docs-generator/) (Source-driven inventory SPA)  
**Relevant Inquiries:** Where is it hosted, why is it stale, what is its CSS system, and where is the config workflow?

---

## Executive Summary

The Tech-Docs Generator is an independent Vite + React Single Page Application (SPA) located at [`tech-docs-generator/`](file:///d:/23082026/tech-docs-generator/). It is designed to inspect repository source code, generate parity inventories, and visualize system architecture.

This audit details its hosting infrastructure, explains the root causes of stale diagrams, outlines its isolated CSS architecture, and documents its generation workflow.

---

## 1. Where is Tech-Docs Hosted?

- **Production URL:** `https://techdocsgenerator.vercel.app`
- **Canonical Custom Domain (In Resolution):** `https://docs.oando.co.in` (Pending Cloudflare SSL edge cert validation).
- **Hosting Provider:** **Vercel**
- **Hosting Configuration:** [`tech-docs-generator/vercel.json`](file:///d:/23082026/tech-docs-generator/vercel.json)
  ```json
  {
    "outputDirectory": "dist",
    "rewrites": [
      { "source": "/assets/(.*)", "destination": "/assets/$1" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- **Build Output:** Compiled into `tech-docs-generator/dist/` via Vite (`pnpm run build` inside the package).

---

## 2. Why is Tech-Docs Stale? (The 3 Disconnects)

Investigation of the Git history (`commit 6a2ffae` on August 29, 2026) revealed that while the background generator scripts run cleanly, the frontend UI pages have fallen out of sync with production code:

### Disconnect 1: The Mermaid ER Diagram Uses Ancient Archived Tables
In [`tech-docs-generator/src/pages/Database.tsx#L13-L50`](file:///d:/23082026/tech-docs-generator/src/pages/Database.tsx#L13):
The page renders a hardcoded string depicting a relational database structure that was retired weeks ago:
- Shows **`users`** (Postgres public table retired; auth is managed internally by Supabase Auth).
- Shows **`leads`** (Deleted table; not present in either Products or Admin database).
- Shows **`plans`** and **`plan_items`** (Retired relational tables moved to `archive` schema; active table is `public.oando_plans` using JSONB state).
- Shows **`activity`** (Renamed to `public.audit_events`).
- **Omission:** Completely omits `furniture_catalog` and `block_descriptors` (the core furniture data models).

### Disconnect 2: The Generated Component Graph is an Orphan
The script [`tech-docs-generator/scripts/generate-page-component-graph.mjs`](file:///d:/23082026/tech-docs-generator/scripts/generate-page-component-graph.mjs) successfully crawls the repository and generates:
- `generated-documents/repository-graph/page-components/page-component-graph.mmd` (638 nodes, 1,492 edges).
- **The Defect:** [`tech-docs-generator/src/App.tsx`](file:///d:/23082026/tech-docs-generator/src/App.tsx) has **0 routes and 0 imports** for this file. The generated graph is never rendered for viewers.

### Disconnect 3: Static Architecture Strings
In [`tech-docs-generator/src/pages/Architecture.tsx`](file:///d:/23082026/tech-docs-generator/src/pages/Architecture.tsx), static text refers to disk-based SVG files that were purged during the Cloudflare R2 asset migration.

---

## 3. What About the CSS for Tech-Docs?

### Decoupled Tailwind CSS Architecture
* **The Site CSS:** The primary Next.js application strictly uses `@focss/*` (token-driven vanilla CSS in `site/focss/`) and forbids Tailwind.
* **Tech-Docs CSS:** The Tech-Docs SPA intentionally uses a **standalone Tailwind CSS setup** (`tech-docs-generator/src/index.css` and `tech-docs-generator/tailwind.config.ts`).
* **Why the Distinction Exists:**  
  Tech-Docs is an auxiliary developer portal, completely decoupled from the production website bundle. Keeping its styling isolated ensures:
  1. No Tailwind utility classes leak into the main consumer-facing marketing site.
  2. The tech-docs SPA can be built and deployed independently to Vercel without triggering the main site's Next.js webpack build pipeline.

---

## 4. Where is the Config & Generation Workflow?

The generation pipeline is defined across root `package.json` scripts and `tech-docs-generator/scripts/`:

```
Tech-Docs Generation Pipeline:
├── 1. Clean Staging: filesystem.mjs (purges stale generated-documents/)
├── 2. Model Extraction: model.mjs (extracts 18 domain models to generated-documents/data/*.json)
├── 3. Graph Generation: generate-page-component-graph.mjs (generates page-component-graph.mmd)
└── 4. Build SPA: generate-all.mjs (executes vite build)
```

### Registered Commands in Root `package.json`:
| Command | Action |
| :--- | :--- |
| `pnpm run tech-docs:generate` | Runs full model extraction and graph generation into `generated-documents/`. |
| `pnpm run tech-docs:build` | Compiles the Vite SPA into `tech-docs-generator/dist/`. |
| `pnpm run tech-docs:dev` | Launches Vite local dev server at `http://localhost:5173`. |
| `pnpm run test:tech-docs` | Runs dedicated Vitest lane (Lane 2) verifying parity data files. |

---

## 5. Remediation Roadmap

1. **Wire the Graph (P1):** Add route `/repository-graph` in `App.tsx` and render `page-component-graph.mmd` using Mermaid.js.
2. **Update Database Schema (P1):** Replace the hardcoded string in `Database.tsx` with live schema exports from `site/platform/drizzle/schema/`.
3. **Resolve Custom Domain (P2):** Complete Cloudflare SSL handshake for `docs.oando.co.in`.
