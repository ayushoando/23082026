# Tech-Docs Generator (`tech-docs-generator/`) Subsystem Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `tech-docs-generator/` directory structure, `src/index.css`, `tailwind.config.ts` existence, scripts count, and `src/App.tsx` routes all verified live in prior sessions this conversation.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| "55 Generator scripts" | Claimed | ✅ **Confirmed** — live listing shows 55 files in `tech-docs-generator/scripts/` |
| "18 domain models" in `model.mjs` | Claimed | ✅ **CONFIRMED** — `COVERAGE_REQUIRED_DOMAINS` has exactly 18: `workspace`, `next-app`, `api`, `route-contracts`, `deployment`, `github-actions`, `dependabot`, `environment`, `database`, `supabase`, `r2-assets`, `planner`, `admin`, `ai-openrouter`, `testing`, `css-theme`, `i18n`, `docs-health` |
| "16 domain extractors" | Claimed | ✅ **Confirmed** — grep of `extract-*.mjs` files matches count |
| `tailwind.config.ts` listed in directory tree | Claimed | ❌ **WRONG** — No `tailwind.config.ts` exists. Tailwind v4 CSS-first API; config is embedded in `src/index.css` via `@theme {}` block |
| `src/index.css` described as "Standalone Tailwind CSS stylesheet" | Claimed | ⚠️ **INCOMPLETE** — `src/index.css` also imports `../../site/focss/base/index.css`. The tech-docs SPA is not fully CSS-isolated from the main site. |
| "12 Dedicated Pages" | Claimed | ✅ **Confirmed** — 12 pages listed match live `src/pages/` |
| Stale `Database.tsx` diagrams | Confirmed | ✅ **Confirmed** (independently verified) |
| Graph orphan (25KB Mermaid) | Claimed "25KB" | ⚠️ **NOT REVERIFIED** — `page-component-graph.mmd` is generated; live size not re-checked. Prior session showed directory exists. |
| `repo-graph.json` "33.9 MB" | Claimed | ⚠️ **REVISED** — Live size is **32.38 MB** (not 33.9 MB) |
| "App.tsx uses HashRouter/BrowserRouter" | Claimed | Not re-verified in this session |

---

## 1. Directory Architecture (Live-Corrected)

```
tech-docs-generator/
├── scripts/                 ← 55 files (confirmed)
│   ├── model.mjs            ← 18 COVERAGE_REQUIRED_DOMAINS (confirmed)
│   ├── generate-all.mjs     ← CLI pipeline (confirmed)
│   ├── extract-*.mjs        ← 16 domain extractors (confirmed)
│   ├── generate-page-component-graph.mjs ← Orphan generator
│   └── filesystem.mjs       ← Parity validation, clean staging
├── src/
│   ├── pages/               ← 12 pages (confirmed)
│   ├── components/
│   ├── index.css            ← Tailwind v4 @import "tailwindcss" + tw-animate-css
│   │                           + @import "../../site/focss/base/index.css"  ← NOT isolated
│   │                           + @theme {} block (Tailwind v4 config-in-CSS)
│   └── App.tsx              ← 12 routes, 0 /repository-graph route
├── package.json             ← oando-tech-docs workspace package
├── vercel.json              ← pnpm install from monorepo root; stage-vercel-output.mjs post-build
└── [NO tailwind.config.ts]  ← Tailwind v4 CSS-first; no separate config file
```

---

## 2. Dual-Engine Mechanics (Confirmed)

### Engine A: Extraction Pipeline

1. **Clean Staging** — `filesystem.mjs` wipes `generated-documents/`
2. **AST Extraction** — 16 domain extractors; total `repo-graph.json` output: **32.38 MB** (not 33.9 MB)
3. **Parity Validation** — byte-for-byte check against `PARITY_DATA_FILES`

### Engine B: Interactive SPA

12 pages confirmed. Zero `/repository-graph` route in `App.tsx`.

---

## 3. CSS Architecture (Corrected)

| Aspect | Prior Report | Live Reality |
| :--- | :--- | :--- |
| Config file | `tailwind.config.ts` | **Does not exist** |
| Tailwind version | Not specified | **v4** (CSS-first API via `@import "tailwindcss"`) |
| CSS isolation | "Does not affect site/focss" | **Partially wrong** — imports `site/focss/base/index.css` |
| Theme config | In `.ts` file | In `index.css` `@theme {}` block |

---

## 4. Testing (Lane 2)

| Lane | Config | Purpose | Status |
| :--- | :--- | :--- | :--- |
| Lane 1 | `tests/vitest.config.ts` | Application unit/integration | Must pass for release |
| Lane 2 | `tests/vitest.tech-docs.config.ts` | Tech-docs parity/contract assertions | Must pass for release |

Both lanes must be green. Lane 1 alone is not a passing run.

---

## 5. Disconnects & Technical Debt (All Confirmed)

1. **Stale `Database.tsx` diagrams** — `users`, `plans`, `leads`, `activity` all archived. Missing: `furniture_catalog`, `block_descriptors`, `planner_managed_products`. ❌ Not fixed.
2. **Orphan component graph** — `page-component-graph.mmd` generated but no `/repository-graph` route in `App.tsx`. ❌ Not fixed.
3. **`repo-graph.json` size** — 32.38 MB, too large for client-side browser loading. Not chunked or pre-filtered. ❌ Not addressed.
4. **Ghost paths** — `config/database/` referenced in `CodeOrganization.tsx` and `Database.tsx` code samples. ❌ Not fixed.
5. **`config` not watched** — `LIVE_WATCH_ROOTS` excludes `config/`. ❌ Not fixed.
