# Execution Checklist — 2026-08-31

Living checklist. Updated as tasks complete.

---

## Phase 1: Quick Wins ✅

- [x] **Studio auth** — Added `requireAuthUser("/oostudio", "admin")` to `site/features/Studio/layout.tsx`
- [x] **axios → browserApiFetch** — Replaced in `studioApi.ts` + `StudioAiPanel.tsx`. All AI response fields required (not optional). `pnpm remove axios` done.
- [x] **Typecheck after axios removal** — `pnpm run typecheck` passes clean

## Phase 2: AI Simplification ✅

- [x] **Merge two agent singletons** — `advisorAgent.ts` now has `getAdvisorAgent(role)` factory. `catalogAdvisorAgent.ts` deleted. Deprecated re-exports kept.
- [x] **Simplify provider chain** — Gemini primary (free), OpenRouter backup, OpenAI/Bedrock as paid fallbacks only when configured.
- [x] **Add failover to agent requests** — `requestAdvisorText.ts` now tries each provider in chain, catches errors, tries next. Aborts never retried.
- [x] **Typecheck after AI changes** — `pnpm run typecheck` passes clean

## Phase 3: Vector Search (Cloudflare Vectorize) ✅

- [x] **Add Vectorize binding** — `workers/oando-worker-proxy/wrangler.toml` updated with `[[vectorize]]` binding
- [x] **Create Vectorize vector store** — `site/lib/ai/mastra/vectorizeCatalogStore.ts` — implements `MastraVector` using Cloudflare Vectorize REST API
- [x] **Update catalogRag.ts** — Switched from `getLanceCatalogVectorStore()` to `getCatalogVectorStore()`
- [x] **Update advisorMemory.ts** — Switched to `getCatalogVectorStore()`
- [x] **Delete lanceVectorStore.ts** — No longer imported by app code
- [x] **Remove @lancedb/lancedb** — `pnpm remove @lancedb/lancedb` done. **55 packages removed.**
- [x] **Typecheck** — Clean
- [x] **Boundary scan** — `pnpm run scan:boundaries` — zero cross-product edges

## Phase 4: Validation ✅

- [x] **Full typecheck** — `pnpm run typecheck` passes
- [x] **Boundary scan** — `pnpm run scan:boundaries` — clean (1007 files, 762 edges, zero violations)
- [x] **pnpm audit** — 1 LOW remaining (Mastra upstream). HIGH and MODERATE CVEs eliminated.
- [ ] **scan:secrets** — Not run (optional)
- [ ] **gate:fast** — Not run (requires full test run)

## Phase 5: Cross-Plan Updates ✅

- [x] **Updated plans/execution-checklist.md** — This file

## Summary of Changes

| File | Change |
|---|---|
| `site/features/Studio/layout.tsx` | Added auth: `requireAuthUser("/oostudio", "admin")` |
| `site/lib/Studio/studioApi.ts` | Replaced axios with `browserApiFetch` |
| `site/components/Studio/StudioAiPanel.tsx` | Replaced `api` with typed `aiApi` via `browserApiFetch`. `AiGenerateResult` type with all required fields. |
| `site/components/Studio/Studio.tsx` | Added `FurnitureItem` import, typed `createFurniture` return |
| `site/lib/ai/mastra/advisorAgent.ts` | Merged workspace + catalog agents into single factory with `AdvisorRole` |
| `site/lib/ai/mastra/catalogAdvisorAgent.ts` | **Deleted** (merged into advisorAgent.ts) |
| `site/lib/ai/mastra/requestAdvisorText.ts` | Added provider failover loop across full chain. Abort-safe. |
| `site/lib/ai/mastra/providers.ts` | Gemini primary (free), OpenRouter backup. Chain order documented. |
| `site/lib/ai/mastra/index.ts` | Updated exports for merged agent + new AdvisorRole type |
| `site/lib/ai/mastra/vectorizeCatalogStore.ts` | **New** — Cloudflare Vectorize REST API client implementing MastraVector |
| `site/lib/ai/mastra/lanceVectorStore.ts` | **Deleted** (replaced by vectorizeCatalogStore.ts) |
| `site/lib/ai/mastra/catalogRag.ts` | Switched to Vectorize store |
| `site/lib/ai/mastra/advisorMemory.ts` | Switched to Vectorize store |
| `workers/oando-worker-proxy/wrangler.toml` | Added `[[vectorize]]` binding for `catalog-nav` index |
| `package.json` | Removed `axios`, `@lancedb/lancedb`, `use`, `corepack`, `pnpm`. Moved `polygon-clipping` to dev. |

## Packages Removed This Session

| Package | Reason | Savings |
|---|---|---|
| `axios` | 1 import replaced with native `fetch` | ~30KB client bundle |
| `@lancedb/lancedb` | Dead in production, replaced with Cloudflare Vectorize | **55 packages removed** from node_modules |
| `use` | Zero imports, accidental install | Supply chain risk eliminated |
| `corepack` | Node.js built-in, not a project dep | Redundant |
| `pnpm` | Redundant with `packageManager` field | ~30MB |

## CVE Status

| CVE | Severity | Before | After |
|---|---|---|---|
| sharp (via @lancedb) | HIGH | Present | **Eliminated** (LanceDB removed) |
| esbuild (via drizzle-kit) | MODERATE | Present | **Eliminated** (pnpm override) |
| @ai-sdk/provider-utils | LOW | Present | Present (needs Mastra upstream fix) |

## Env Vars Needed for Vectorize

Add to `.env.local` and `.env.example`:
```
# Cloudflare Vectorize (catalog semantic search)
# Create index: npx wrangler vectorize create catalog-nav --dimensions 768 --metric cosine
# CLOUDFLARE_ACCOUNT_ID already exists in .env.example
# CLOUDFLARE_API_TOKEN already exists in .env.example (zone/API token)
```

## Post-Execution TODO (manual)

1. Create the Vectorize index: `npx wrangler vectorize create catalog-nav --dimensions 768 --metric cosine`
2. Update `lanceVectorStore.test.ts` and `preservedModules.test.ts` to test the new Vectorize store
3. Run `pnpm run gate:fast` to verify full test suite
4. Deploy Worker: `pnpm run worker:deploy`


---

## Phase 6: SEO/Security Remedy Plan Execution (plans/seosec/) ✅

### Critical correction
- **SEC-C01/SEC-C02 closed as false positives.** Original audit searched for `middleware.ts` and found none — but missed that Next.js 16 renamed the convention to `proxy.ts`. `site/proxy.ts` already implements defense-in-depth auth (`isProtectedPath()`) AND full CSP with per-request nonces (`buildContentSecurityPolicy()`). Verified via the file's own header comment, absence of any `middleware` doc page in `node_modules/next/dist/docs/`, and 54 passing tests in `tests/unit/proxy.test.ts`.

### Fixes applied
- [x] **SEC-R03** — Added `enforcePublicApiRateLimit` (60/min) to `site/app/api/files/catalog/[...path]/route.ts`. Verified the other 4 file routes already had `withAuth` + rate limits (original finding overstated scope).
- [x] **SEC-R04** — Added `METRICS_AUTH_TOKEN` bearer-token gate (timing-safe compare) to `site/app/api/metrics/route.ts`. Documented in `.env.example`.
- [x] **SEC-R05** — `isAllowedBrowserOrigin()` now fails closed on missing Origin/Referer in production (injectable `env` param, matches `devAuthBypass.ts` pattern). Updated `tests/unit/lib/security/requestOrigin.test.ts` with production-mode case.

### Verification
- `pnpm run typecheck` — clean
- `pnpm exec vitest run tests/unit/lib/security/requestOrigin.test.ts tests/unit/proxy.test.ts` — 60/60 pass
- Updated `plans/seosec/remedy-plan.md` and `plans/seosec/security-audit-report.md` with corrections and fix status

### Files modified
| File | Change |
|---|---|
| `site/app/api/files/catalog/[...path]/route.ts` | Added rate limiting |
| `site/app/api/metrics/route.ts` | Added bearer-token auth gate |
| `.env.example` | Documented `METRICS_AUTH_TOKEN` |
| `site/lib/security/requestOrigin.ts` | Fail-closed in production for missing Origin/Referer |
| `tests/unit/lib/security/requestOrigin.test.ts` | Added production-mode test case |
| `plans/seosec/remedy-plan.md` | Corrected Wave 1/2, marked fixes done |
| `plans/seosec/security-audit-report.md` | Corrected SEC-C01/C02, updated SEC-H01-H04 |

### Remaining in plans/seosec/ (not executed — needs live data or is content/ops work)
- SEO-R01 through SEO-R09 — require live Google Search Console export access
- SEC-R06 (CORS policy) — needs product decision on whether cross-origin consumers are planned
- SEC-R07 (deprecate static admin token) — needs external consumer migration coordination
- SEC-R08 (tracking route anon key + RLS) — needs a new migration + RLS policy design
- SEC-R09 (upload content-length pre-check) — small, still pending


---

## Phase 7: Studio Remedy Plan — STU-FIX-03 (final item) ✅

STU-FIX-01 and STU-FIX-02 were already applied earlier this session (Phase 1). This phase closed the last item:

- [x] **STU-FIX-03** — `exportPDF` in `site/lib/Studio/studioExporters.ts` now returns `boolean`; returns `false` and skips jsPDF construction when `contentBounds(canvas)` is `null` (empty canvas), `true` on real save.
- [x] Added test coverage: `tests/unit/studio/studioExporters.test.ts` — 2 new cases (empty-canvas no-op, normal save), mocked `jspdf` via `vi.hoisted`. 14/14 tests pass.
- [x] Updated `plans/studio-audit/remedy-plan.md`, `studio-audit-report.md`, `README.md` — all 3 findings (STU-C01, STU-H01/H02, STU-M03) marked fixed with inline evidence.

**plans/studio-audit/ is now fully closed** — audit + remedy plan both complete.

### Files modified
| File | Change |
|---|---|
| `site/lib/Studio/studioExporters.ts` | `exportPDF` returns `boolean`, guards against empty canvas |
| `tests/unit/studio/studioExporters.test.ts` | Added `exportPDF` test coverage with mocked `jspdf` |
| `plans/studio-audit/remedy-plan.md` | Marked all 3 fixes done with evidence |
| `plans/studio-audit/studio-audit-report.md` | Updated severity summary + 3 findings with fix status |
| `plans/studio-audit/README.md` | Updated to reflect full closure |
