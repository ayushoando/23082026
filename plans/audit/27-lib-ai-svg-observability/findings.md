# 27 — site/lib Deep Audit: AI/Mastra, SVG Pipeline, Observability

## 1. AI / Mastra

Wiring: two singleton agents (`workspace`, `catalog`) sharing in-memory `Memory` (last 20 msgs) + `catalog_vector_search` tool; RAG index = Cloudflare Vectorize via REST, embedder Gemini/OpenRouter; lexical fallback = Orama. Provider chain: Gemini → OpenRouter → OpenAI → Bedrock, gated by `APPROVED_PROVIDER_MODELS`; per-request failover with 10s abort per target. 3-layer retrieval funnel (vector → Orama → catalog order), every layer fail-open.

| # | Severity | Finding |
|---|----------|---------|
| 27.1 | **Med** | **Orama index rebuilt from the full catalog on every advisor request** (`catalogLocalSearch.ts` inside `recallLexicalSlugs`) — O(N) CPU/alloc per query, no cache. |
| 27.2 | **Med** | `catalogRag.ts` `ensureCatalogVectorIndex` embeds the **entire catalog every 5 min per process**; upsert failures swallowed (`vectorizeCatalogStore` returns `[]`) yet `lastIndexedAt` still set → **silently empty vector index for 5 min**. |
| 27.3 | Low | Vectorize REST calls have no fetch timeouts; `describeIndex` returns fake stats (`count: 0`); upsert fallback ids can mismatch. |
| 27.4 | Low | `jsonMode` providerOptions only for google/openrouter — OpenAI/Bedrock get no JSON mode (heuristic fallback handles it). |

Quota paths: catalog advisor 5/min/IP for guest AND member (no tiering); Planner advisor: outer pipeline quota + inner 2/min/IP guest-only (PLN-FIX-04, verified fixed). Prompt-injection guard `sanitizeUserInput` at 3 chokepoints (safe, slightly redundant). `rateLimit.ts` Supabase backend read-then-upsert is non-atomic at the limit boundary (low).

## 2. SVG descriptor pipeline (`site/lib/catalog/svg/`)

Flow: pointer `{slug}.latest.json` → versioned descriptor; Zod validation + SHA-256 checksum; tmp+rename atomic persist; slug regex + path containment blocks traversal; complete error taxonomy mapped to HTTP.

| # | Severity | Finding |
|---|----------|---------|
| 27.5 | **High** | **Two incompatible `{slug}.latest.json` writers.** `persistBlockDescriptor.ts` writes the descriptor body + `version`/`updatedAt` as latest; the loader expects a pointer `{slug, n, checksum, schemaVersion}`. `readLatestPointer` returns null on persist's shape → loader falls back to legacy `{slug}.json`, which persist never writes → **descriptors published via Studio are not loadable by `tryLoad`/`loadAll`** (404). Persist never computes the required checksum either → `409.hash_mismatch` even if found. |
| 27.6 | **Med** | No file-size cap before `readFileSync`+`JSON.parse` in `readDescriptorFile`; `blocks`, `mountingPoints`, `parameterSchema` arrays unbounded (only `importedPaths` capped) → memory DoS via hostile descriptor. |
| 27.7 | **Med** | `canonicalizeBlockDescriptorInput` recurses unbounded over parsed JSON — deeply-nested input throws `RangeError` outside the wrapped `JSON.parse` try/catch, escaping `parseBlockDescriptor` and aborting `loadAll` entirely. |
| 27.8 | Low | Module-global loader cache never invalidated per-load; pure-JS SHA-256 over canonical JSON (CPU); `nextVersion` does up to 10k sync `existsSync` probes per publish. |

## 3. Observability

In-process Prometheus registry (`oando_` prefix), scraped at `/api/metrics`. **PII clean** — bounded enum labels only, correlationId deliberately excluded, planner events redacted/allowlisted before export.

| # | Severity | Finding |
|---|----------|---------|
| 27.9 | Med(-low) | `/api/metrics` in prod with `OBSERVABILITY_METRICS_ENABLED=1` but `METRICS_AUTH_TOKEN` unset is **fully open** (default metrics + label cardinality exposed). |
| 27.10 | Low | `reportClientError.ts` logs client URL (query strings) + user-agent to server console; `withAiObservability` records `durationMs: 0` from the planner observe callback (misleading contract). |

## 4. Lib hygiene

Files >500 lines: `assetPaths.ts` (1,248), `catalog/blocks2d.ts` (1,220), `svgTypes.ts` (891), `clientRegistry.ts` (754), `plannerEndpointContract.ts` (698), `categories.ts` (613), `plannerProjectRepository.ts` (609), `plannerWorkflowState.ts` (599), `plannerProjectOperations.ts` (569), `plannerRequestPipeline.ts` (552), `projectsStore.ts` (522), `catalogTypes.ts` (503).

Duplicated helpers: `isAbortLikeError` x3 (requestAdvisorText + both advisor routes); `emitStreamEvent`/`createStreamResponse`/STREAM_HEADERS duplicated across both advisor routes; 10s provider timeout constant x2; custom isomorphic SHA-256 alongside node:crypto (intentional, second path to keep correct).
