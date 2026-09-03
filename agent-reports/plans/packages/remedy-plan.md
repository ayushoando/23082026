# Package Dependency Remedy Plan

**Date:** 2026-08-31 (updated with replacement analysis)
**Source:** [`package-audit-report.md`](./package-audit-report.md)
**Priority:** Ordered by impact and risk

---

## Part A: Immediate Cleanup

### A1. Remove 3 dead packages

```bash
pnpm remove use corepack pnpm
```

| Package | Why it's here | Why remove |
|---|---|---|
| `use` v3.1.1 | Accidental install — not React's `use()` | Zero imports. Abandoned npm package from 2019. Supply chain risk. |
| `corepack` v0.35.0 | Misunderstanding — it's a Node.js built-in | Zero imports. `packageManager` field already handles pnpm version. |
| `pnpm` v11.24.0 | Redundant — declared as both `packageManager` AND dep | Zero imports. Wastes ~30MB. |

### A2. Move polygon-clipping to devDependencies

```bash
pnpm remove polygon-clipping && pnpm add -D polygon-clipping@^0.15.7
```

Only used in `scripts/generate-svg/pipelineCore.ts` — build-time script, never in runtime `site/` code.

### A3. Add pnpm overrides for 2 transitive CVEs

```json
"pnpm": {
  "overrides": {
    "@huggingface/transformers>sharp": ">=0.35.4",
    "@esbuild-kit/core-utils>esbuild": ">=0.25.0"
  }
}
```

Then `pnpm install && pnpm audit`.

### A4. Update all 17 outdated packages

```bash
pnpm update
```

All gaps are minor/patch. Safe with lockfile.

---

## Part B: Package Replacements

### B1. `axios` → native `fetch` (REMOVE)

**Current:** 1 import in `site/lib/Studio/studioApi.ts`. Uses `axios.create()` for GET/POST/PATCH/DELETE to `/api/Studio/*`.

**Replace with:** The project's own `browserApiFetch` from `site/lib/api/browserApi.ts`, which already wraps native `fetch` with CSRF token handling, error normalization, and retry. The `publishFurniture` function in the same file already uses `browserApiFetch` — the rest of the file just needs to follow suit.

**Savings:** ~30KB gzipped removed from client bundle. One fewer HTTP client to maintain.

**Effort:** 1-2 hours. Rewrite 5 functions in one file.

---

### B2. `framer-motion` → `motion` (RENAME/UPGRADE)

**Current:** `framer-motion@13.1.1` with 15+ component imports across site/.

**Replace with:** `motion` — the same library, [renamed in 2025](https://motion.dev/). The import path changed from `framer-motion` to `motion/react`. The `motion` package also offers a `motion/mini` entry (2.3KB) for simple animations and `motion` (17KB) for the full API — vs the current 35KB for `framer-motion`.

**Why:** `framer-motion` is the legacy package name. `motion` is the actively maintained successor. Same API, same team, but the new package has tree-shaking improvements and a smaller core. Eventually `framer-motion` will stop getting updates.

**Migration:** Mechanical import path change. The API is identical.
```diff
- import { motion, AnimatePresence } from "framer-motion";
+ import { motion, AnimatePresence } from "motion/react";
```

**Savings:** Potentially 15-18KB gzipped if components are migrated to `motion/mini` where they only use basic animations (many of your components just do fadeUp/opacity/translateY).

**Effort:** 2-3 hours. Find-and-replace imports, test each component. Also aligns tech-docs-generator (currently on framer-motion 12.43.0).

---

### B3. `gsap` + `@gsap/react` — EVALUATE CONSOLIDATION

**Current:** gsap is used in 3-4 places:
- `site/lib/helpers/gsapMotion.ts` — ScrollTrigger setup, reveal presets
- Quote-cart header reveal (GSAP_REVEAL with stagger)
- Legal pages (`data-legal-reveal` scroll animation)
- `useGSAP` hook from `@gsap/react`

**framer-motion already provides:** `useInView`, `whileInView`, `useScroll`, `useTransform`, `AnimatePresence` — all of which cover the same use cases (scroll-triggered reveals, parallax, staggered entry).

**Option 1: Consolidate to motion only** — Replace GSAP scroll reveals with motion's `whileInView` + stagger. This is what `site/lib/helpers/motion.ts` already does for 15+ components. GSAP's 3-4 consumers would move to the same pattern.
- **Savings:** ~25KB gzipped (gsap core + ScrollTrigger + @gsap/react)
- **Effort:** 4-6 hours. Rewrite scroll reveal logic in 3-4 components.
- **Risk:** Medium. GSAP's `ScrollTrigger` is more powerful for complex scrub/pin animations. But this project doesn't use scrub or pin — just basic scroll-triggered opacity/translateY reveals, which motion handles natively.

**Option 2: Keep both** — The current split is logical (framer-motion = component-level declarative, gsap = imperative scroll). ~60KB combined is acceptable for a marketing site.

**Recommendation:** Option 1 (consolidate). The gsap usage is minimal and duplicates what motion already does in 15+ other components. But this is lower priority than the other fixes.

---

### B4. `uuid` → Web Crypto (PARTIAL REPLACE)

**Current:** 1 import in `site/lib/uuid/normalizeUuid.ts` for `uuidv5()` (deterministic name-based UUIDs from slugs) and `validate()`.

**The situation:** `crypto.randomUUID()` is native and already used elsewhere for random UUIDs. But UUIDv5 (deterministic, SHA-1-based) has no native Web Crypto equivalent. There's a [gist showing how to implement it with SubtleCrypto](https://gist.github.com/ijisol/bc6ebd1ecb1c31d4981f24c8093a3b82), but it's ~40 lines of manual SHA-1 hashing.

**Recommendation:** Keep `uuid` for now. The v5 functionality is genuinely needed for `catalogProductIdFromSlug()` and has no clean native replacement. The package is well-maintained and lightweight (~5KB). Not worth hand-rolling SHA-1 UUID generation.

---

### B5. `@t3-oss/env-nextjs` → Zod 4 native env validation (EVALUATE)

**Current:** 1 import in `site/lib/env.server.ts`. Uses `createEnv()` to validate server environment variables with Zod schemas.

**Zod 4 (already installed)** now has built-in `.parse()` that can validate `process.env` directly. The `@t3-oss/env-nextjs` wrapper adds:
- Client/server env separation (prevents server env leaking to client bundles)
- `NEXT_PUBLIC_` prefix enforcement
- Validation at import time with good error messages

**Recommendation:** Keep for now. The client/server separation and `NEXT_PUBLIC_` enforcement is valuable and not trivially replicated with raw Zod. The package is actively maintained (Colin McDonnell is involved) and tiny (~2KB). But if you ever want to simplify, a 30-line Zod wrapper would replace it.

---

### B6. `@prometheus-io/client` — CORRECT PACKAGE (no replacement needed)

**Current:** v0.16.0. This IS the official Prometheus Node.js client — it was renamed from `prom-client` to `@prometheus-io/client` in the v16 release. The project is on the right package. Just update to 0.16.1.

---

### B7. `clsx` + `tailwind-merge` → keep both (no replacement)

**Current:** `clsx` for conditional class joining, `tailwind-merge` for deduplication. Combined in `site/lib/utils.ts` as `cn()`.

10+ direct `clsx` imports also exist across components (bypassing `cn()`).

**Why keep:** This is the standard pattern. `tailwind-merge` can't replace `clsx` (it handles dedup, not conditional logic). `clsx` can't replace `tailwind-merge` (it doesn't know Tailwind class priority). Together they're ~3KB.

**Minor cleanup:** Consider replacing the 10+ direct `clsx` imports with `cn()` from `site/lib/utils.ts` for consistency, since `cn()` already wraps both.

---

## Part C: Architecture Assessment — Package Groups

### C1. AI & Retrieval Stack (7 packages, ~2.5MB installed)

| Package | Role | Imports | Verdict |
|---|---|---|---|
| `@mastra/core` | Agent framework, LLM routing, embeddings | 7 files | ✅ Core — justified |
| `@mastra/memory` | Conversation memory for advisor agent | 1 file (`advisorMemory.ts`) | 🟡 Light usage — single file wrapper |
| `@mastra/rag` | RAG pipeline tools | 1 file (`catalogRag.ts`) — `createVectorQueryTool` | 🟡 Light usage — single function import |
| `@ai-sdk/amazon-bedrock` | Bedrock LLM provider for Mastra | Provider config | ✅ Required if using Bedrock |
| `@lancedb/lancedb` | Vector embeddings storage/search | 1 file (`lanceVectorStore.ts`) | ✅ Required for semantic search |
| `@orama/orama` | Full-text search engine | 1 file (`catalogLocalSearch.ts`) | 🟡 See analysis below |
| `fuse.js` | Fuzzy client-side search | 1 file (`applyCatalogProductFilters.ts`) | 🟡 See analysis below |

**3 search engines — is that redundant?**

No, they serve different purposes in a search funnel:

| Engine | Where | What it does |
|---|---|---|
| **LanceDB** | Server — vector store | Semantic similarity search ("chairs like Aeron"). Embedding-based. Used by the AI advisor for RAG retrieval. |
| **Orama** | Server — full-text | Exact/partial text matching with scoring ("mesh back 500mm"). Used for structured catalog search with filters. |
| **Fuse.js** | Client — fuzzy filter | Typo-tolerant fuzzy matching on already-loaded product lists ("ergnomic" → "ergonomic"). Used in the product filter grid after data is fetched. |

**Could any be removed?**
- Fuse.js: Orama can also do fuzzy matching, but Fuse.js runs client-side on already-loaded data — different execution context. If you wanted to eliminate it, you'd move all filtering server-side. Low priority.
- Orama: Could theoretically be replaced by Supabase full-text search (`tsvector`) or LanceDB's own filtering. But Orama runs in-process without network latency. Keep.
- LanceDB: No replacement for vector search. Required for the AI advisor's RAG pipeline.

**@mastra/memory and @mastra/rag — are they justified?**

They're lightly used (1 file each) but they're part of the Mastra ecosystem that `@mastra/core` depends on architecturally. Removing them would mean reimplementing conversation memory and the vector query tool manually. The value isn't in lines of code — it's in Mastra's integration with the agent framework. Keep.

---

### C2. Animation Stack (4 packages, ~60KB gzipped)

| Package | Imports | Role |
|---|---|---|
| `framer-motion` 13.1.1 | 15+ components | Declarative component animations (motion.div, AnimatePresence, useInView, useScroll) |
| `gsap` 3.15.0 | 2 files | ScrollTrigger reveals on legal/quote-cart pages |
| `@gsap/react` 2.1.2 | via useGSAP hook | React integration for gsap |
| `tw-animate-css` 1.4.0 | CSS-only (runtime.css) | Tailwind animation utility classes |

**The overlap:** framer-motion and gsap both do scroll-triggered reveals. framer-motion does it in 15+ components via `whileInView`/`useInView`. gsap does it in 2-3 components via `ScrollTrigger`. The gsap usage could migrate to framer-motion's patterns, saving ~25KB. See B3 above.

**tw-animate-css:** Provides pre-built CSS animation classes (fade-in, slide-up, etc.) used via Tailwind utility classes. The FOCSS system has its own keyframes too (`home-reveal-up`, `marquee-left`, etc.). tw-animate-css fills a different niche — it's for component-level CSS animations in admin/planner surfaces where framer-motion isn't loaded. Keep.

---

### C3. State Management (3 packages)

| Package | Stores | Role |
|---|---|---|
| `zustand` 5.0.15 | 7 stores | Studio UI, Studio catalog, Planner UI, Planner catalog, quote-cart (persisted), product compare (persisted), CRM |
| `@tanstack/react-query` 5.102.6 | Used in FilterGrid, admin pages | Server state caching + refetch |
| `nuqs` 2.10.1 | 5 imports | URL query state for filters and admin views |

**Is there overlap?** No — each handles a different state tier:
- **zustand:** Client-only ephemeral/persisted state (cart, compare, dock panel positions)
- **react-query:** Server state with cache invalidation (product lists, admin data)
- **nuqs:** URL state (filter params, search terms — shareable/bookmarkable)

This is actually a clean architecture. No replacements needed.

---

### C4. Database Stack (4 packages)

| Package | Role | When used |
|---|---|---|
| `@supabase/supabase-js` | Supabase client (query builder, auth, storage) | Most runtime queries — `.from().select().eq()` |
| `@supabase/ssr` | SSR cookie-based Supabase client | Server components + API routes |
| `drizzle-orm` | Type-safe ORM with migrations | Schema definitions, some server queries |
| `postgres` | Raw Postgres driver | Scripts (seed, migrate, backup), Drizzle connection |

**The pattern:** Supabase JS for most application queries (benefits from RLS, real-time, auth integration). Drizzle for schema definitions and type generation. Raw `postgres` driver for scripts and Drizzle's connection layer. This is the [recommended Supabase + Drizzle pattern](https://supabase.com/docs/guides/database/drizzle).

**Could Drizzle replace Supabase JS?** Technically yes — Drizzle can do everything the Supabase client does, with stronger types. But you'd lose:
- Supabase's built-in RLS enforcement on the client
- Real-time subscriptions
- Storage client integration
- The simpler `.from().select()` API for basic queries

**Recommendation:** Keep both. The split is standard and well-reasoned. Use Supabase JS for auth + RLS-guarded reads, Drizzle for complex joins/aggregations and schema management.

---

### C5. Observability Stack (4 packages)

| Package | Role | Status |
|---|---|---|
| `@vercel/otel` 2.1.3 | OpenTelemetry registration | 1 import in `instrumentation.ts` — registers OTLP exporter |
| `@prometheus-io/client` 0.16.0 | Custom Prometheus metrics | Used in `site/lib/observability/metrics.ts` |
| `@vercel/analytics` 2.0.1 | Vercel Web Analytics (page views, visitor counts) | Mounted in `SiteAnalytics.tsx` |
| `@vercel/speed-insights` 2.0.0 | Core Web Vitals (LCP, FID, CLS) | Mounted in `SiteAnalytics.tsx` |

**Overlap?** Vercel Analytics and Prometheus metrics track different things:
- Vercel: Client-side page views, visitors, Web Vitals (sent to Vercel dashboard)
- Prometheus: Server-side request counts, latencies, error rates (scraped by Prometheus/Grafana stack in `config/observability/`)
- OTLP: Distributed traces (sent to configured OTLP endpoint, if set)

No replacements needed. The stack is clean and each package serves a distinct purpose.

---

### C6. UI Component Stack (5 packages)

| Package | Role | Usage depth |
|---|---|---|
| `react-aria-components` 1.20.0 | Accessible UI primitives | Button, Dialog, Modal, Input, TextArea — 5+ component files |
| `dockview-react` 8.2.0 | Dock panel layout | Studio + Planner dock shells (6+ imports) |
| `@phosphor-icons/react` 2.1.10 | Icon library | Used everywhere (50+ imports estimated) |
| `embla-carousel-react` 8.6.0 | Carousel/slider | Product gallery, hero slider |
| `fabric` 7.4.0 | HTML5 Canvas | Planner + Studio drawing canvas — core to the product |

**Are there redundant component libraries?** No. react-aria provides accessible primitives (button, dialog, modal), not a full component library. The project builds its own components on top. dockview is a specialized dock/panel layout that nothing else provides. fabric is the 2D canvas engine — irreplaceable for the Planner/Studio product.

No replacements needed.

---

### C7. Form Stack (4 packages)

| Package | Role |
|---|---|
| `react-hook-form` 7.86.0 | Form state, validation, submission |
| `@hookform/resolvers` 5.9.1 | Zod resolver for react-hook-form |
| `zod` 4.4.3 | Schema validation (forms + API + env) |
| `next-safe-action` 8.6.1 | Type-safe server actions with error handling |

**Are forms consistent?** Yes — contact forms, admin forms, and catalog management all use react-hook-form + zod + next-safe-action. The pattern is: zod schema → react-hook-form with zodResolver → useAction(serverAction) for submission. Clean and consistent.

No replacements needed.

---

## Summary — What to actually change

| Priority | Action | Savings | Effort |
|---|---|---|---|
| **Do now** | Remove `use`, `corepack`, `pnpm` | ~30MB node_modules, supply chain risk | 5 min |
| **Do now** | Add pnpm overrides for 2 CVEs | Fixes HIGH + MODERATE vulnerabilities | 10 min |
| **Do now** | `pnpm update` | 17 packages current | 5 min |
| **Do soon** | Replace `axios` → `browserApiFetch` | ~30KB client bundle | 1-2 hours |
| **Do soon** | Rename `framer-motion` → `motion` | Future-proofing, potential 15-18KB savings | 2-3 hours |
| **Evaluate** | Consolidate gsap → motion | ~25KB client bundle | 4-6 hours |
| **Keep** | AI stack (7 packages) | N/A — each serves a distinct role | — |
| **Keep** | State management (zustand + react-query + nuqs) | N/A — clean tier split | — |
| **Keep** | Database stack (supabase + drizzle + postgres) | N/A — recommended pattern | — |
| **Keep** | Observability (otel + prometheus + vercel) | N/A — distinct metrics | — |
| **Keep** | UI components (react-aria + dockview + phosphor + embla + fabric) | N/A — each irreplaceable | — |
| **Keep** | Form stack (react-hook-form + zod + next-safe-action) | N/A — consistent pattern | — |
| **Keep** | Search stack (LanceDB + Orama + Fuse.js) | N/A — different tiers of search | — |
| **Keep** | `uuid` | v5 deterministic UUIDs have no native replacement | — |
| **Keep** | `@t3-oss/env-nextjs` | Client/server env separation worth the 2KB | — |

---

*Analysis based on import grep across entire codebase, `pnpm audit`, `pnpm outdated`, and web research for package alternatives. All "zero imports" claims verified by regex search.*

Content was rephrased for compliance with licensing restrictions.
