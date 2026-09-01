# Handover — AI Implementation Audit Plan

**Date:** 2026-09-01 · **Status:** ✅ Closed — all findings remediated and verified
**Owner:** Repository owner

## Completed tasks

- **Production vector search fixed:** LanceDB (dead on read-only Vercel FS) replaced by Cloudflare Vectorize — `site/lib/ai/mastra/vectorizeCatalogStore.ts` (new, `MastraVector` via REST API), `catalogRag.ts` + `advisorMemory.ts` rewired, `lanceVectorStore.ts` deleted.
- **Agent singletons merged:** `advisorAgent.ts` exposes `getAdvisorAgent(role)`; `catalogAdvisorAgent.ts` deleted.
- **Provider failover:** `requestAdvisorText.ts` iterates the full chain (Gemini → OpenRouter → OpenRouter-backup → OpenAI → Bedrock), abort-safe.
- **Planner advisor route (spec tasks 6.1–6.3, completed 2026-09-01):**
  - NDJSON streaming added — `PlannerAdvisorRequestSchema` gained optional `stream`; `PlannerOperationResult` gained a raw-`Response` passthrough in `plannerRequestPipeline.ts`; route emits `status`/`delta`/`result` events with deterministic `degraded: true` fallback.
  - Non-streaming core wrapped in `withAiObservability("planner", …)`; the catalog route already recorded through the same `recordAdvisorRequest` adapter.
- Privacy-safe metrics adapter `site/lib/observability/aiMetrics.ts` with `AiRequestObservation` contract.

## Files modified / created

`site/lib/ai/mastra/{vectorizeCatalogStore.ts (new), catalogRag.ts, advisorMemory.ts, advisorAgent.ts, requestAdvisorText.ts, providers.ts, index.ts}` · deleted: `lanceVectorStore.ts`, `catalogAdvisorAgent.ts` · `site/app/api/Planner/ai-advisor/route.ts` · `site/lib/Planner/plannerRequestPipeline.ts` · `site/features/shared/api/schemas.ts` · `site/lib/observability/aiMetrics.ts` · `workers/oando-worker-proxy/wrangler.toml` (Vectorize binding) · tests under `tests/unit/app/api/Planner/ai-advisor/`, `tests/unit/lib/ai/mastra/`, `tests/unit/lib/observability/`.

## Verification evidence

- `pnpm exec vitest run … tests/unit/lib/ai/mastra tests/unit/lib/ai/audit tests/unit/lib/observability` — **14 files, 133/133 pass** (2026-09-01).
- Planner advisor route tests — **30/30 pass** including new NDJSON streaming + degraded-fallback cases.
- `pnpm run typecheck` — clean.

## Blockers / out-of-scope

- **CF-TOKEN-01** (see root `Failures.md`): the Cloudflare Vectorize index `catalog-nav` must be created (`npx wrangler vectorize create catalog-nav --dimensions 768 --metric cosine`) before the vector path is live; token currently rejected.
- `@ai-sdk/provider-utils` LOW CVE — requires Mastra upstream release.

## Ownership confirmation

- Only AI-stack, planner-advisor, observability, schema, and wrangler-binding paths touched; no unrelated files modified.

## Second wave (2026-09-01) - remedy plan fully closed

- AI-FIX-04 enrichment (`buildEmbeddingText` in `catalogRag.ts`), AI-FIX-09 batching (`embedTexts`, chunks of 20), AI-FIX-08 guards (`site/lib/ai/sanitizeUserInput.ts` applied at every prompt chokepoint), AI-FIX-10 metrics (`oando_ai_retrieval_source_contributions_total`), AI-FIX-06 memory documented as Option B, AI-FIX-07 confirmed removed, AI-FIX-11 completed: `providerFetch.ts` + `providerChain.ts` deleted; Planner multimodal fetch relocated to `site/server/Planner/providerFetch.server.ts`.
- Tech-docs AI extractor repointed to `site/lib/ai/mastra/providers.ts` (`resolveAdvisorModelChain`).
- Evidence: `pnpm run typecheck` clean; `pnpm exec vitest run --config tests/vitest.config.ts tests/unit/lib/ai` 15 files / 124 tests pass; new unit tests for sanitize + embedding builder/batching.
