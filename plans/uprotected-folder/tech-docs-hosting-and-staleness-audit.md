# Tech-Docs Generator: Hosting, Staleness & CSS Architecture Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`tech-docs-generator/`](file:///d:/23082026/tech-docs-generator/)  
**Method:** Live file inspection of `tech-docs-generator/vercel.json`, `src/pages/Architecture.tsx`, and `src/index.css`.

---

## 1. Vercel Hosting Architecture

- **Production Deployment Target:** Vercel
- **Live URL:** `https://techdocsgenerator.vercel.app`
- **Canonical Custom Domain:** `https://docs.oando.co.in`

### Live `tech-docs-generator/vercel.json` Configuration:
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

### Key Hosting Properties:
1. **Monorepo Build Context:** Installs and builds from the monorepo root using `cd .. && pnpm ...`.
2. **Asset Routing:** The rewrite regex explicitly allows static assets, icons, and Vite chunks to bypass the SPA index rewrite.

---

## 2. Diagram & Schema Alignment Status

1. **Database Schema Diagram (`Database.tsx`):**
   Aligned with live Supabase schemas. Replaces legacy references to archived tables with current tables:
   - Admin DB: `furniture_catalog`, `block_descriptors`, `oando_plans`, `audit_events`.
   - Products DB: `catalog_products`, `catalog_categories`, `catalog_product_specs`.
2. **Architecture Documentation (`Architecture.tsx`):**
   Reflects the Cloudflare R2 asset pipeline, dual-database routing, and standalone Next.js deployment.

---

## 3. Tailwind v4 CSS-First Architecture

The tech-docs generator employs Tailwind CSS v4:
- No `tailwind.config.ts` exists or is required.
- Configuration is declared in [`tech-docs-generator/src/index.css`](file:///d:/23082026/tech-docs-generator/src/index.css) via `@import "tailwindcss";` and `@theme {}` variables.

---

## 4. Verification & Build Commands

```powershell
# 1. Test build pipeline locally
pnpm --filter oando-tech-docs build

# 2. Stage Vercel output
node tech-docs-generator/scripts/stage-vercel-output.mjs

# 3. Run tech-docs test suite
pnpm run tech-docs:test
```
