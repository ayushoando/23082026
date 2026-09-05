# Tech-Docs Generator (`tech-docs-generator/`) Subsystem Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`tech-docs-generator/`](file:///d:/23082026/tech-docs-generator/)  
**Method:** Live file inspections of extraction scripts, React SPA router, CSS definitions, and build pipelines.

---

## 1. Subsystem Architecture

```
tech-docs-generator/
├── scripts/                 ← 55 extraction and generation scripts
│   ├── model.mjs            ← 18 COVERAGE_REQUIRED_DOMAINS definition
│   ├── generate-all.mjs     ← Full extraction pipeline CLI
│   ├── extract-*.mjs        ← 16 domain-specific AST extractors
│   ├── generate-page-component-graph.mjs ← Component graph generator
│   └── filesystem.mjs       ← Staging cleanup and parity validation
├── src/
│   ├── pages/               ← 12 dedicated interactive documentation pages
│   ├── components/          ← Reusable navigation, code viewer, and graph widgets
│   ├── index.css            ← Tailwind v4 CSS-first stylesheet (@import "tailwindcss" + @theme {})
│   └── App.tsx              ← SPA router definitions
├── package.json             ← Workspace package: oando-tech-docs
└── vercel.json              ← Independent deployment configuration (docs.oando.co.in)
```

---

## 2. Dual-Engine Architecture

### 2.1 Engine A: Extraction Pipeline
1. **Clean Staging:** `filesystem.mjs` clears the ephemeral `generated-documents/` staging directory.
2. **AST Extraction:** 16 domain extractors scan the repository and emit structured JSON datasets (`dependencies.json`, `routes.json`, `database.json`, `security.json`, etc.).
3. **Graph Generation:** Assembles `repo-graph.json` (~32.38 MB). Because of its large memory footprint, this file must never be parsed synchronously on the browser main thread.
4. **Parity Validation:** Verifies structural parity against required schema contracts.

### 2.2 Engine B: Interactive React SPA
- **Pages (12):** Architecture, Routes, Database, APIs, Code Organization, Deployment, Features, Security, Testing, Environment, Workspace, and Docs Health.
- **Tailwind v4 Integration:** Uses Tailwind v4's CSS-first architecture with zero `tailwind.config.ts` overhead. Configuration is declared directly in CSS via `@theme {}` blocks.

---

## 3. Diagram & Schema Alignment

- `Database.tsx` displays live Supabase tables (`furniture_catalog`, `block_descriptors`, `catalog_products`, `audit_events`, `customer_queries`), replacing references to archived tables (`users`, `plans`, `leads`).

---

## 4. Verification & Build Commands

```powershell
# 1. Run tech-docs unit and parity tests
pnpm run tech-docs:test

# 2. Build tech-docs generator SPA
pnpm run build:tech-docs

# 3. Execute full extraction pipeline
node tech-docs-generator/scripts/generate-all.mjs
```
