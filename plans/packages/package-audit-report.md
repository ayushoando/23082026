# Package & Dependency Audit Report

**Date:** 2026-08-31
**Scope:** All 49 dependencies + 27 devDependencies in root `package.json`, plus tech-docs-generator workspace
**Tools:** `pnpm outdated`, `pnpm audit`, `pnpm ls`, import grep analysis
**Package manager:** pnpm 11.24.0 (declared via `packageManager` field with integrity hash)

---

## Executive Summary

The dependency stack is **modern and generally well-chosen** — Next.js 16.3.3, React 19.2.8, TypeScript 7.0.2, Tailwind CSS 4.3.3. No major version lag exists. However, there are **3 dead packages** that should never have been installed, **1 package that can be removed** by replacing its single import with native `fetch`, **3 security vulnerabilities** (all transitive), **17 packages behind latest** (all minor/patch), and **inconsistent version pinning** across the manifest.

### Severity Summary

| Category | Count | Impact |
|---|---|---|
| Dead packages (zero imports) | 3 | Bundle bloat, confusion, supply chain surface |
| Security vulnerabilities | 3 (1 high, 1 moderate, 1 low) | All transitive — no direct fix available |
| Replaceable packages | 1 | `axios` → native `fetch` (1 import site) |
| Misplaced packages | 1 | `polygon-clipping` should be devDep |
| Outdated (minor/patch) | 17 | Bug fixes, minor improvements |
| Version pinning inconsistency | ~30% | Unpredictable lockfile drift |
| Cross-workspace divergence | 1 | `framer-motion` 13.1.1 vs 12.43.0 |

---

## 1. Dead Packages (Zero Imports)

### PKG-C01: `use` v3.1.1

**Severity:** REMOVE
**Evidence:** Zero imports found across the entire codebase (`from "use"`, `require("use")` — no matches).

The npm package `use` is a utility for composing reusable plugin functions (last meaningful update 2019). This was almost certainly installed by accident — likely someone typed `pnpm add use` thinking of React 19's `use()` hook, which is a built-in and needs no package.

**Risk:** Supply chain attack surface. A nearly-abandoned package with a very common name is a prime target for typosquatting or maintainer account takeover.

**Action:** `pnpm remove use`

---

### PKG-C02: `corepack` v0.35.0

**Severity:** REMOVE
**Evidence:** Zero imports found across the entire codebase.

Corepack is a **Node.js built-in binary** (ships with Node 16.9+) that manages package manager versions. It reads the `packageManager` field in `package.json` — which this project already declares:

```json
"packageManager": "pnpm@11.24.0+sha512.bd27e345..."
```

Installing `corepack` as a project dependency is incorrect. It installs a redundant copy of the corepack binary into `node_modules/.bin/`, which can shadow the system version and cause version confusion. It also adds unnecessary weight to the dependency tree.

**Action:** `pnpm remove corepack`

---

### PKG-C03: `pnpm` v11.24.0 (as dependency)

**Severity:** REMOVE
**Evidence:** Zero imports found. The `packageManager` field already declares the same version.

pnpm is declared **twice** — as `packageManager` (correct) and as a production dependency (incorrect). The dependency entry downloads a second copy of pnpm into `node_modules/`, adding ~30MB of unnecessary files. The `packageManager` field + corepack already ensures the correct pnpm version.

This was likely added to ensure pnpm is available in CI, but that's what `corepack enable && corepack prepare` handles (or just installing pnpm globally in CI).

**Action:** `pnpm remove pnpm`

---

## 2. Security Vulnerabilities

### PKG-V01: sharp (HIGH) — CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591

**Severity:** HIGH (transitive)
**Path:** `.` → `@lancedb/lancedb` → `@huggingface/transformers` → `sharp` (<0.35.0)
**Direct dep:** Our `sharp@0.35.4` is patched. The vulnerable copy is a transitive dependency of LanceDB's Hugging Face integration.

**Impact:** libvips vulnerabilities in the old sharp. Only affects LanceDB's internal image processing for embeddings, not our direct image pipeline.

**Fix options:**
1. **pnpm overrides** (recommended): Force the transitive sharp to our patched version:
   ```json
   "pnpm": {
     "overrides": {
       "@huggingface/transformers>sharp": ">=0.35.4"
     }
   }
   ```
2. Wait for `@lancedb/lancedb` to update its dependency tree.

---

### PKG-V02: esbuild (MODERATE) — GHSA-67mh-4wv8-2f99

**Severity:** MODERATE (transitive, dev-only)
**Path:** `.` → `drizzle-kit` → `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils` → `esbuild` (≤0.24.2)
**Direct dep:** Our `esbuild@0.28.2` is fine. The vulnerable copy is inside drizzle-kit's legacy ESM loader.

**Impact:** Dev server CORS bypass — only exploitable during local development when drizzle-kit's internal esbuild dev server is running. Low real-world risk.

**Fix options:**
1. **pnpm overrides**: Force transitive esbuild to our version:
   ```json
   "pnpm": {
     "overrides": {
       "@esbuild-kit/core-utils>esbuild": ">=0.25.0"
     }
   }
   ```
2. Wait for `drizzle-kit` to drop the legacy `@esbuild-kit` dependency.

---

### PKG-V03: @ai-sdk/provider-utils (LOW) — GHSA-866g-f22w-33x8

**Severity:** LOW (transitive)
**Path:** `.` → `@mastra/core` → `@ai-sdk/provider-utils` (≤3.0.97)
**Impact:** Uncontrolled resource consumption in AI provider utils. Requires attacker-controlled input to the AI streaming pipeline.

**Fix options:**
1. Wait for `@mastra/core` to update to `@ai-sdk/provider-utils` v4+.
2. **pnpm overrides** if compatible:
   ```json
   "pnpm": {
     "overrides": {
       "@mastra/core>@ai-sdk/provider-utils": ">=4.0.0"
     }
   }
   ```
   ⚠️ Major version bump — test AI features thoroughly.

---

## 3. Replaceable Packages

### PKG-R01: `axios` v1.20.0 → native `fetch`

**Severity:** RECOMMENDED REMOVAL
**Evidence:** Only ONE import in the entire codebase:
- `site/lib/Studio/studioApi.ts` — `import axios from "axios"`

The rest of the codebase consistently uses native `fetch` via the `browserApiFetch` utility in `site/lib/api/browserApi.ts`. The Studio API module is the sole outlier.

**Why remove:**
- axios adds ~30KB (gzipped) to the client bundle for a single import
- Next.js 16 has enhanced `fetch` with caching, revalidation, and request deduplication built in
- The project already has `browserApiFetch` which wraps fetch with CSRF token handling
- Maintaining two HTTP client patterns is confusing

**Migration:** Replace the single axios import in `studioApi.ts` with `browserApiFetch` or plain `fetch`. Then `pnpm remove axios`.

---

## 4. Misplaced Packages

### PKG-M01: `polygon-clipping` v0.15.7 — should be devDependency

**Evidence:** Only ONE import: `scripts/generate-svg/pipelineCore.ts` (build/generation script, not runtime code).

This package performs boolean operations on polygons for SVG generation scripts. It's never imported by any `site/` runtime code, so it doesn't need to be a production dependency.

**Action:** Move to devDependencies:
```bash
pnpm remove polygon-clipping && pnpm add -D polygon-clipping@^0.15.7
```

---

## 5. Outdated Packages (17)

All behind by minor/patch versions only. No major version gaps.

| Package | Current | Latest | Type | Risk |
|---|---|---|---|---|
| `@ai-sdk/amazon-bedrock` | 5.0.66 | 5.0.67 | dep | Low — patch |
| `@aws-sdk/client-s3` | 3.1119.0 | 3.1121.0 | dep | Low — patch |
| `@mastra/core` | 1.63.0 | 1.63.2 | dep | Low — patch, may help PKG-V03 |
| `@mastra/memory` | 1.28.0 | 1.28.1 | dep | Low — patch |
| `@prometheus-io/client` | 0.16.0 | 0.16.1 | dep | Low — patch |
| `@tanstack/react-query` | 5.102.6 | 5.102.8 | dep | Low — patch |
| `corepack` | 0.35.0 | 0.36.0 | dep | N/A — removing |
| `next-intl` | 4.13.7 | 4.14.1 | dep | Medium — minor, new features |
| `react-hook-form` | 7.86.0 | 7.87.0 | dep | Low — patch |
| `resend` | 6.24.0 | 6.25.0 | dep | Low — patch |
| `zod` | 4.4.3 | 4.5.4 | dep | Medium — minor, bug fixes |
| `@testing-library/react` | 16.3.2 | 16.3.3 | dev | Low — patch |
| `happy-dom` | 20.11.8 | 20.12.0 | dev | Low — minor |
| `postcss` | 8.5.25 | 8.5.26 | dev | Low — patch |
| `react-router-dom` | 7.18.2 | 7.18.3 | dev | Low — patch |
| `tsx` | 4.23.12 | 4.23.13 | dev | Low — patch |
| `wrangler` | 4.126.0 | 4.127.1 | dev | Low — patch |

---

## 6. Version Pinning Inconsistency

The manifest mixes three pinning strategies with no clear rationale:

| Strategy | Example | Count | Risk |
|---|---|---|---|
| Exact pin | `"clsx": "2.1.1"` | ~15 | Low — predictable |
| Caret range | `"sharp": "^0.35.4"` | ~45 | Medium — allows minor bumps |
| Mixed on same tier | `"fabric": "7.4.0"` alongside `"framer-motion": "^13.1.1"` | — | Confusing |

**Packages that are exact-pinned:** clsx, tailwind-merge, dockview-react, embla-carousel-autoplay, fabric, zustand, axios, @vercel/otel, @prometheus-io/client, react, react-dom, postcss, fast-check, enhanced-resolve, drizzle-kit, @ai-sdk/amazon-bedrock, pnpm.

**Recommendation:** The lockfile (`pnpm-lock.yaml`) already pins exact versions for reproducible installs. The caret ranges in `package.json` only affect `pnpm update` behavior. Either:
- **Option A:** Pin everything exact (most predictable, requires manual updates)
- **Option B:** Use caret for everything and rely on the lockfile (most common, automatic patch updates on `pnpm update`)

Option B is recommended since the lockfile is committed and `dependabot.yml` is configured.

---

## 7. Cross-Workspace Divergence

| Package | Main workspace | tech-docs-generator | Issue |
|---|---|---|---|
| `framer-motion` | 13.1.1 | 12.43.0 | Major version gap (13 vs 12) |
| `react-router-dom` | 7.18.2 (dev) | 7.18.2 | Aligned ✅ |
| `postcss` | 8.5.25 | 8.5.25 | Aligned ✅ |

`framer-motion` has diverged — the main app is on v13 while tech-docs is still on v12. This means two copies are installed, increasing `node_modules` size. Consider aligning tech-docs to v13 or declaring framer-motion in root `package.json` only (pnpm workspace hoisting).

---

## 8. Dependency Inventory

### Production Dependencies (49) — Classification

| Package | Version | Classification | Usage |
|---|---|---|---|
| `@ai-sdk/amazon-bedrock` | 5.0.66 | ✅ Core AI | Bedrock LLM provider |
| `@aws-sdk/client-s3` | ^3.1119.0 | ✅ Core infra | R2/S3 asset operations |
| `@gsap/react` | ^2.1.2 | ✅ Active | React GSAP hooks (quote-cart, editorial) |
| `@hookform/resolvers` | ^5.9.1 | ✅ Active | Zod resolver for react-hook-form |
| `@lancedb/lancedb` | ^0.37.1 | ✅ Core AI | Vector search for catalog embeddings |
| `@mastra/core` | ^1.63.0 | ✅ Core AI | Mastra agent framework |
| `@mastra/memory` | ^1.28.0 | ✅ Core AI | Agent memory/context |
| `@mastra/rag` | ^2.6.0 | ✅ Core AI | RAG pipeline for advisor |
| `@orama/orama` | ^3.1.18 | ✅ Core search | Full-text search engine |
| `@phosphor-icons/react` | ^2.1.10 | ✅ Active | Icon library (used everywhere) |
| `@prometheus-io/client` | 0.16.0 | ✅ Observability | Prometheus metrics |
| `@supabase/ssr` | ^0.12.5 | ✅ Core auth | SSR cookie-based Supabase client |
| `@supabase/supabase-js` | ^2.112.4 | ✅ Core DB | Supabase client |
| `@t3-oss/env-nextjs` | ^0.13.11 | ✅ Active | Type-safe env validation |
| `@tanstack/react-query` | ^5.102.6 | ✅ Active | Client-side data fetching |
| `@vercel/analytics` | ^2.0.1 | ✅ Active | Vercel web analytics |
| `@vercel/otel` | 2.1.3 | ✅ Observability | OpenTelemetry instrumentation |
| `@vercel/speed-insights` | ^2.0.0 | ✅ Active | Core Web Vitals tracking |
| `axios` | 1.20.0 | 🟡 **Replace** | 1 import — use native fetch |
| `clsx` | 2.1.1 | ✅ Active | Class name composition |
| `corepack` | ^0.35.0 | 🔴 **Remove** | Zero imports — system tool |
| `dockview-react` | 8.2.0 | ✅ Core UI | Studio + Planner dock panels |
| `drizzle-orm` | ^0.45.2 | ✅ Core DB | ORM for Postgres |
| `embla-carousel-autoplay` | 8.6.0 | ✅ Active | Carousel autoplay plugin |
| `embla-carousel-react` | ^8.6.0 | ✅ Active | Product/hero carousels |
| `fabric` | 7.4.0 | ✅ Core UI | Canvas rendering (Planner/Studio) |
| `framer-motion` | ^13.1.1 | ✅ Active | 15+ imports — animations |
| `fuse.js` | ^7.5.0 | ✅ Active | Fuzzy search for catalog |
| `gsap` | ^3.15.0 | ✅ Active | GSAP animations (editorial) |
| `jspdf` | ^4.2.1 | ✅ Active | PDF export (Planner) |
| `next` | 16.3.3 | ✅ Core | Framework |
| `next-intl` | ^4.13.7 | ✅ Active | i18n |
| `next-safe-action` | ^8.6.1 | ✅ Active | 12+ imports — server actions |
| `nuqs` | ^2.10.1 | ✅ Active | URL query state (5 imports) |
| `pnpm` | 11.24.0 | 🔴 **Remove** | Zero imports — redundant with packageManager |
| `polygon-clipping` | ^0.15.7 | 🟡 **Move to dev** | Scripts only, not runtime |
| `postgres` | ^3.4.9 | ✅ Core DB | Direct Postgres driver for Drizzle |
| `react` | 19.2.8 | ✅ Core | — |
| `react-aria-components` | 1.20.0 | ✅ Active | Accessible UI primitives |
| `react-dom` | 19.2.8 | ✅ Core | — |
| `react-hook-form` | ^7.86.0 | ✅ Active | Form management |
| `resend` | ^6.24.0 | ✅ Active | Email sending |
| `server-only` | ^0.0.1 | ✅ Active | Server-side import guard |
| `sharp` | ^0.35.4 | ✅ Active | Image processing |
| `tailwind-merge` | 3.6.0 | ✅ Active | Tailwind class merging |
| `tw-animate-css` | ^1.4.0 | ✅ Active | CSS animation utilities |
| `use` | ^3.1.1 | 🔴 **Remove** | Zero imports — accidental install |
| `uuid` | ^14.0.2 | ✅ Minimal | 1 import (v5 deterministic UUIDs) |
| `zod` | ^4.4.3 | ✅ Active | Schema validation |
| `zustand` | 5.0.15 | ✅ Active | State management |

### DevDependencies (27) — all justified

Every devDependency has confirmed usage: testing (vitest, playwright, testing-library, happy-dom, fast-check, axe-core), tooling (typescript, tsx, esbuild, oxlint, postcss, tailwindcss, drizzle-kit, secretlint), types (@types/node, @types/react, @types/react-dom), build helpers (cross-env, dotenv, jiti, enhanced-resolve, vite, ts-morph), and deployment (wrangler).

`react-router-dom` in devDependencies is used by the tech-docs-generator workspace. Correctly placed.

---

## 9. Animation Library Overlap

The project uses **three** animation approaches:

| Library | Usage | Bundle cost |
|---|---|---|
| **framer-motion** v13.1.1 | 15+ components — motion, AnimatePresence, useScroll, useInView, useReducedMotion | ~35KB gzipped |
| **gsap** v3.15.0 + `@gsap/react` | 3-4 components — quote-cart, legal pages, editorial reveals | ~25KB gzipped |
| **CSS keyframes** (FOCSS) | Marquee, consent-slide-in, hero-slider-bounce, planner-demo-float | 0KB (in CSS) |

This isn't necessarily a problem — framer-motion handles component-level declarative animations while GSAP handles imperative scroll-driven animations. But it's worth noting the ~60KB combined cost. Consolidating to one (framer-motion, which already handles scroll-reveal via `useInView`) would save ~25KB.

**Recommendation:** Not urgent. If bundle size becomes a concern, migrate GSAP reveals to framer-motion's `whileInView` and remove GSAP. But both are well-used and the split is logical.

---

*Report generated from `pnpm outdated`, `pnpm audit`, `pnpm ls`, and grep-based import analysis across the full codebase.*
