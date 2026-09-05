# Tech-Docs Generator: Hosting, Staleness & CSS Architecture Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `tech-docs-generator/vercel.json`, `src/pages/Architecture.tsx`, `src/index.css`, `src/App.tsx` all read directly.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| `vercel.json` rewrite rule | Simple `"/(.*)" → "/index.html"` | ⚠️ **REVISED** — live `vercel.json` has more complex rewrite: `"/((?!assets/|favicon\.ico|icon\.png|.*\\..*).*)"`; also has `installCommand` and `buildCommand` set (installs from monorepo root via pnpm). |
| `vercel.json` `outputDirectory` | `"dist"` | ✅ **Confirmed** |
| Production URL | `https://techdocsgenerator.vercel.app` | ✅ **Confirmed** (cannot verify live without browser request) |
| Custom domain | `https://docs.oando.co.in` pending SSL | ⚠️ **Status unknown** — not re-verifiable without DNS lookup in this session |
| Disconnect 3: Architecture.tsx static SVG strings | "References defunct disk SVG authorities" | ✅ **Confirmed** — live file still contains `SvgDisk["Published SVG files"]`, `R2["Cloudflare R2 target"]`, and `"PNG/SVG residual may remain disk-authoritative until cutover is complete"` |
| CSS: "standalone Tailwind CSS setup with `tailwind.config.ts`" | Claimed | ❌ **WRONG** — No `tailwind.config.ts` or `tailwind.config.js` exists. CSS uses `@import "tailwindcss"` directly (Tailwind v4 CSS-first API). No separate config file needed in v4. |
| Model extraction: "18 domain models" | Claimed | ❌ **WRONG** — `COVERAGE_REQUIRED_DOMAINS` has **18 domains** ✅ (correcting my earlier count of 15 — the full array includes `css-theme`, `i18n`, `docs-health` at the end, not visible in the first page of output) |
| Disconnect 1: Database.tsx stale ER diagram | Confirmed | ✅ **Confirmed** (also verified in prior sessions) |
| Disconnect 2: Graph orphan | Confirmed | ✅ **Confirmed** — `App.tsx` has no `/repository-graph` route |

---

## 1. Hosting (Live State)

- **Production URL:** `https://techdocsgenerator.vercel.app`
- **Hosting Provider:** Vercel  
- **Custom Domain:** `https://docs.oando.co.in` (SSL status unconfirmed this session)

**Live `tech-docs-generator/vercel.json`:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "cd .. && pnpm install",
  "buildCommand": "cd .. && pnpm --filter oando-tech-docs build && node tech-docs-generator/scripts/stage-vercel-output.mjs",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/((?!assets/|favicon\\.ico|icon\\.png|.*\\..*).*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key difference from prior report:** The `buildCommand` installs from the monorepo root (`cd ..`) and runs `stage-vercel-output.mjs` post-build. The rewrite pattern is more precise than a bare catch-all — it explicitly allows asset files through rather than rewriting them to `index.html`.

---

## 2. Why is Tech-Docs Stale? (3 Disconnects Confirmed)

### Disconnect 1: Mermaid ER Diagram Uses Archived Tables ✅

`Database.tsx` still hardcodes: `users`, `plans`, `leads`, `plan_items`, `activity` — all archived. Missing: `furniture_catalog`, `block_descriptors`, `audit_events`, `planner_managed_products`.

### Disconnect 2: Generated Graph is an Orphan ✅

`App.tsx` has no `/repository-graph` route. `page-component-graph.mmd` (638 nodes, 1,492 edges) is generated and discarded.

### Disconnect 3: Architecture.tsx Static SVG References ✅

Live `Architecture.tsx` still contains:
```
SvgDisk["Published SVG files"]
R2["Cloudflare R2 target"]
"PNG/SVG residual may remain disk-authoritative until cutover is complete."
```
The cutover comment itself confirms the file was written mid-migration and never updated.

---

## 3. CSS Architecture (Corrected)

| Layer | Prior Report | Live Reality |
| :--- | :--- | :--- |
| Tailwind config file | `tailwind.config.ts` | ❌ **Does not exist** — Tailwind v4 uses CSS-first API |
| CSS entry | `src/index.css` | ✅ Confirmed |
| Tailwind import | Not specified | `@import "tailwindcss"` + `@import "tw-animate-css"` |
| FOCSS integration | Not mentioned | **NEW:** `src/index.css` also imports `../../site/focss/base/index.css` — **the Tech-Docs SPA shares FOCSS base tokens from the main site** |

**The "completely decoupled Tailwind CSS" claim is partially wrong.** The Tech-Docs SPA imports FOCSS base tokens from `site/focss/` — it is not fully isolated. Changes to FOCSS base tokens affect the tech-docs SPA.

---

## 4. Generation Pipeline Commands (Confirmed)

| Command | Action | Status |
| :--- | :--- | :--- |
| `pnpm run tech-docs:generate` | Runs model extraction + graph generation | ✅ Present |
| `pnpm run tech-docs:build` | Vite SPA build | ✅ Present |
| `pnpm run tech-docs:dev` | Vite dev server (`localhost:5173`) | ✅ Present |
| `pnpm run test:tech-docs` | Vitest Lane 2 (tech-docs parity) | ✅ Present |

---

## 5. Remediation Roadmap (Status: 0/3 Done)

| Action | Status |
| :--- | :--- |
| Wire `/repository-graph` in `App.tsx` | ❌ Not done |
| Replace hardcoded ER diagram in `Database.tsx` | ❌ Not done |
| Update `Architecture.tsx` SVG/disk references | ❌ Not done |
| (Additional) Update `docs.oando.co.in` domain SSL resolution | ❌ Unconfirmed |
