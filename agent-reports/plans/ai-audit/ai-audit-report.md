# AI Implementation Audit Report

**Date:** 2026-08-31
**Status:** ✅ ALL FIXES IMPLEMENTED & VERIFIED (See [`remedy-plan.md`](./remedy-plan.md))
**Scope:** Full AI stack — Mastra agents, LLM providers, RAG pipeline, vector store, search engines, memory, all AI API routes
**Files audited:** 14 modules in `site/lib/ai/mastra/`, 5 AI API routes, 1 client hook

---

## Executive Summary

The AI implementation is **architecturally sound** — a well-layered retrieval stack (vector → lexical → catalog-order), multi-provider failover with an allowlist, conversation memory via Mastra, and graceful degradation to heuristic fallbacks when LLMs are unavailable. The code is production-aware (fail-open, timeouts, abort handling).

However, there are **significant issues**: two nearly-identical agent singletons, no provider failover in the agent path (only the first chain target is used), the vector store is completely non-functional in production (returns empty arrays), embedding text is too thin for useful semantic search, and the in-memory conversation memory resets on every serverless cold start. There's also duplicated code between the catalog advisor and planner advisor routes.

### Severity Summary

| Severity | Count |
|---|---|
| Critical | 3 |
| High | 4 |
| Medium | 5 |
| Low | 3 |

---

## Architecture Overview

```
Client (browser)
  ├── useAiAdvisor hook → POST /api/Planner/ai-advisor
  ├── ContactTeaser/UnifiedAssistant → POST /api/ai-advisor
  └── NavSearch → POST /api/nav-search
                     │
                     ▼
            ┌─────────────────┐
            │  Provider Chain  │ Gemini → OpenRouter → OpenRouter-backup → OpenAI → Bedrock
            └────────┬────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  Mastra Agent   providerFetch   Direct
  (generate/     (raw OpenAI-    (nav-search
   stream)        compat fetch)   AI re-ranking)
        │
        ├── Memory (InMemoryStore + optional LanceDB semantic recall)
        └── Tools (catalog_vector_search via @mastra/rag)
                     │
            ┌────────┴────────┐
            ▼                 ▼
      LanceDB Vector    Orama Full-text
      (embeddings)      (lexical search)
```

---

## Critical Findings

### AI-C01: Vector Store is Non-Functional in Production

**Severity:** CRITICAL
**Location:** `site/lib/ai/mastra/lanceVectorStore.ts`

The `LanceCatalogVectorStore` has a method `isProductionNonRemote()` that returns `true` when `NODE_ENV === "production"` and the LanceDB URI is a local filesystem path (the default). When this is true, **every operation returns empty/no-op**:

```typescript
// lanceVectorStore.ts
private isProductionNonRemote(): boolean {
  const isProduction = env.NODE_ENV === "production";
  const isBypass = env.DEV_AUTH_BYPASS === "1";
  return isProduction && !isBypass && !this.isRemoteUri(this.uri);
}

async upsert(...): Promise<string[]> {
  if (this.isProductionNonRemote()) return [];  // ← NO-OP
  // ...
}

async query(...): Promise<QueryResult[]> {
  if (this.isProductionNonRemote()) return [];  // ← ALWAYS EMPTY
  // ...
}
```

Since `LANCE_DB_URI` defaults to a local filesystem path (`.data/lancedb/catalog`), and Vercel's production filesystem is read-only, **all vector search returns zero results in production**. This means:
- `searchCatalogVectors()` always returns `[]`
- `catalogRetrieval.ts` always falls back to lexical (Orama) then catalog-order
- The Mastra agent's `catalog_vector_search` tool returns nothing
- Semantic recall in advisor memory is dead

**The entire LanceDB + embedding infrastructure is dev-only.**

**Fix options:**
1. Configure a remote LanceDB URI (LanceDB Cloud or S3-backed) for production
2. Move embeddings to Supabase pgvector extension (already have Supabase)
3. If vector search isn't needed in production, remove the dead code path and document it

---

### AI-C02: Two Nearly-Identical Agent Singletons

**Severity:** CRITICAL
**Location:** `advisorAgent.ts` vs `catalogAdvisorAgent.ts`

Two files create virtually identical Mastra agents:

| File | Agent ID | Instructions difference |
|---|---|---|
| `advisorAgent.ts` | `workspace-advisor` | "helpful assistant for workspace planning and configuration" |
| `catalogAdvisorAgent.ts` | `catalog-advisor` | "enterprise workspace engineering consultant" |

Both:
- Use the same `resolveAdvisorModelChain()[0]` (first provider only)
- Use the same `getAdvisorMemory()` singleton
- Use the same `createCatalogVectorQueryTool()`
- Have the same fallback model (`google/gemini-2.5-flash`)
- Are cached as module-level singletons

The only difference is the instruction string. `requestAdvisorText.ts` routes between them:
- `requestAdvisorMessages()` → `advisorAgent` (Planner advisor)
- `requestAdvisorText()` → `catalogAdvisorAgent` (Catalog advisor, JSON mode)

**Impact:** Confusion, maintenance burden, shared memory state between what should be different conversation contexts.

**Fix:** Merge into one agent factory that accepts instructions as a parameter, or use Mastra's `agent.withSystemPrompt()` to customize per-call.

---

### AI-C03: No Provider Failover in Agent Path

**Severity:** CRITICAL
**Location:** `advisorAgent.ts`, `catalogAdvisorAgent.ts`

Both agents destructure only the first provider:
```typescript
const [primaryTarget] = resolveAdvisorModelChain();
```

If the primary provider (typically Gemini) fails, the agent doesn't try the next provider in the chain. The failover chain (Gemini → OpenRouter → OpenRouter-backup → OpenAI → Bedrock) only works in the raw `providerFetch.ts` path — not in the Mastra agent path.

The API route handlers (`ai-advisor/route.ts`, `Planner/ai-advisor/route.ts`) implement their own failover loop, but only for the `requestAdvisorText`/`requestAdvisorMessages` calls — which go through the single-provider agents.

**Fix:** Either:
1. Pass the full chain to the agent and let Mastra handle failover (if supported)
2. Implement failover at the `requestAdvisorText` level by catching errors and retrying with the next agent/model
3. Use Mastra's model router if available

---

## High Findings

### AI-H01: In-Memory Conversation Memory Resets on Cold Start

**Severity:** HIGH
**Location:** `advisorMemory.ts`

The advisor memory uses `InMemoryStore`:
```typescript
advisorMemory = new Memory({
  storage: new InMemoryStore({ id: "advisor-memory-storage" }),
  // ...
});
```

On Vercel serverless, each function invocation may be a cold start. The `InMemoryStore` doesn't persist anywhere — conversation history is lost between invocations. The module-level `let advisorMemory: Memory | null = null` cache only survives within a single serverless instance's lifetime (typically seconds to minutes).

**Impact:** Multi-turn conversations lose context. The advisor can't reference earlier messages reliably.

**Fix options:**
1. Use Mastra's `SupabaseStore` or `PostgresStore` backed by the Admin Supabase database
2. Accept the limitation and document that memory is best-effort (session-scoped at best)
3. Pass full conversation history in each request (the Planner advisor already does this via `messages` array)

---

### AI-H02: Embedding Text is Too Thin for Useful Semantic Search

**Severity:** HIGH
**Location:** `catalogRag.ts` → `buildCatalogVectorDocuments()`

The text used for embeddings is extremely thin:
```typescript
text: `${product.name} ${productSlug} ${category.name}`,
// Example: "Pinnacle oando-seating--pinnacle seating"
```

For categories:
```typescript
text: `${category.name} ${category.id}`,
// Example: "Seating seating"
```

Good semantic search needs rich text: descriptions, features, materials, use cases, specifications. The current text is essentially just names and slugs — barely more useful than a keyword match (which Orama already does).

**Fix:** Enrich the embedding text:
```typescript
text: [
  product.name,
  product.description,
  product.series_name,
  product.metadata?.subcategory,
  ...(product.metadata?.tags ?? []),
  ...(product.metadata?.material ?? []),
  ...(product.metadata?.useCase ?? []),
  category.name,
].filter(Boolean).join(" "),
```

---

### AI-H03: Duplicate Heuristic Fallback and Streaming Code

**Severity:** HIGH
**Location:** `api/ai-advisor/route.ts` vs `api/Planner/ai-advisor/route.ts`

Both routes implement:
- Their own provider chain resolution (`resolveAdvisorClients()`)
- Their own heuristic fallback functions
- Their own NDJSON streaming infrastructure (`STREAM_ENCODER`, `STREAM_HEADERS`, `emitStreamEvent`, `createStreamResponse`)
- Their own timeout handling (`AI_ADVISOR_TIMEOUT_MS` = 10s in both)
- Their own abort detection (`isAbortLikeError()`)

~200 lines of identical streaming/fallback/timeout code is duplicated.

**Fix:** Extract shared streaming, fallback, and provider-chain utilities into a shared module (e.g., `site/lib/ai/mastra/advisorRequestPipeline.ts`).

---

### AI-H04: Nav Search AI Re-Ranking Has 1.2s Timeout but No Value Guarantee

**Severity:** HIGH
**Location:** `api/nav-search/route.ts` → `aiRank()`

The nav search route:
1. Runs Orama local search (fast, <10ms)
2. Then asks the LLM to re-rank the results with a 1.2s timeout

The LLM re-ranking sends the full candidate list as text and asks for a JSON response with ranked IDs. If the LLM is slow (>1.2s), the ranking is skipped silently. But:
- The LLM sees product IDs and titles, not descriptions — limited signal for re-ranking
- 1.2s added latency for a header search autocomplete is noticeable
- The re-ranking prompt is simple (`"Rank navigation results for furniture website intent"`) with no few-shot examples
- If the LLM returns malformed JSON, it fails silently

**Fix options:**
1. Remove AI re-ranking from nav-search (Orama's lexical ranking is already good for autocomplete)
2. If keeping it, add caching of AI rankings for repeated queries
3. Use embeddings for re-ranking instead of an LLM call (faster, cheaper)

---

## Medium Findings

### AI-M01: providerFetch.ts is Legacy but Still Exported

**Severity:** MEDIUM
**Location:** `providerChain.ts`, `providerFetch.ts`

`providerChain.ts` is marked `@deprecated` and re-exports from `providerFetch.ts`. But `providerFetch.ts` is a raw OpenAI-compatible fetch client that duplicates what the Mastra agent framework already provides. It's still exported from `index.ts` and used by `nav-search` (via `requestAdvisorText` through `requestAdvisorText.ts` → agent.generate).

Two parallel LLM calling paths exist:
1. **Mastra agent path:** `requestAdvisorMessages/requestAdvisorText` → Agent.generate/stream
2. **Raw fetch path:** `requestProviderText` → direct OpenAI-compat fetch

**Fix:** Consolidate to the Mastra agent path. Remove `providerFetch.ts` once all callers are migrated.

---

### AI-M02: No Input Sanitization on Advisor System Prompts

**Severity:** MEDIUM
**Location:** `api/ai-advisor/route.ts`, `api/nav-search/route.ts`

User queries are passed directly into system prompts without sanitization for prompt injection:
```typescript
// nav-search AI ranking
`Context: ${context}\nQuery: ${query}\nCandidates:\n${compact}`
```

A crafted search query could manipulate the LLM's ranking behavior.

**Fix:** Add a prompt injection guard — either escape special characters in user input, or use a structured prompt format that separates user input from instructions.

---

### AI-M03: Catalog Vector Index Rebuilds Every 5 Minutes

**Severity:** MEDIUM
**Location:** `catalogRag.ts` → `ensureCatalogVectorIndex()`

```typescript
if (!force && indexPromise && now - lastIndexedAt < 5 * 60 * 1000) {
  return indexPromise;
}
```

The full catalog is re-embedded every 5 minutes (or on cold start). Each re-index embeds every product, which:
- Costs money (embedding API calls)
- Takes time (sequential embedding loop, not batched)
- Resets on every serverless cold start anyway

**Fix:** 
1. Batch embeddings instead of sequential `for` loop
2. Persist the index to a remote store (see AI-C01)
3. Only re-index when catalog changes (use a catalog version hash)

---

### AI-M04: Embedding is Sequential, Not Batched

**Severity:** MEDIUM
**Location:** `catalogRag.ts` → `embedTexts()`

```typescript
async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    const { embedding } = await embedV2({ model, value: text });
    embeddings.push(embedding);
  }
  return embeddings;
}
```

Each text is embedded one-at-a-time with `await`. For 200+ products, this means 200+ sequential API calls. Most embedding APIs support batch requests.

**Fix:** Use batch embedding (Mastra's `embedMany` or the provider's batch endpoint).

---

### AI-M05: No Observability for Vector Search Quality

**Severity:** MEDIUM
**Location:** `catalogRetrieval.ts`

The retrieval function tracks which sources contributed (`sources: ["vector" | "lexical" | "catalog-order"]`) but this data isn't logged or metricked. You can't measure:
- How often vector search contributes results
- Vector vs lexical result overlap
- Whether AI re-ranking improves click-through

**Fix:** Emit Prometheus metrics or structured logs for retrieval source distribution.

---

## Low Findings

### AI-L01: Hardcoded Fallback Model String

Both agents use `"google/gemini-2.5-flash"` as a fallback when no provider is configured:
```typescript
model: toMastraModel(primaryTarget) ?? "google/gemini-2.5-flash",
```
This string won't work without a Gemini API key. It should fall back to a no-op or error, not a model string that will fail at runtime.

### AI-L02: `@deprecated` Export Still in Use

`providerChain.ts` is marked deprecated but still importable. Consider removing it.

### AI-L03: Sketch-to-Plan Feature Flag

`sketch-to-plan` is behind `isFeatureEnabled("sketchToPlan")` — confirm it's intentionally disabled or remove the dead code.

---

## What's Working Well

| Area | Assessment |
|---|---|
| **Provider allowlist** | APPROVED_PROVIDER_MODELS prevents unauthorized providers from entering the chain. Good security. |
| **Graceful degradation** | Every AI route has heuristic fallbacks. If all LLMs fail, users still get useful responses. |
| **Retrieval funnel** | Vector → lexical → catalog-order is a solid multi-tier approach. |
| **Rate limiting** | All AI routes are rate-limited with fail-closed behavior in production. |
| **Orama local search** | Fast, in-process, no network — excellent for the lexical tier. |
| **Streaming support** | NDJSON streaming implemented for both advisor routes. |
| **Abort handling** | Proper AbortController usage with timeout cleanup. |
| **Price sanitization** | `sanitizeAdvisorPriceText()` prevents LLM hallucinated prices from reaching users. |

---

## Files Audited

| File | Role |
|---|---|
| `site/lib/ai/mastra/providers.ts` | Provider chain with allowlist |
| `site/lib/ai/mastra/providerFetch.ts` | Raw OpenAI-compat fetch (legacy) |
| `site/lib/ai/mastra/advisorAgent.ts` | Workspace advisor agent singleton |
| `site/lib/ai/mastra/catalogAdvisorAgent.ts` | Catalog advisor agent singleton |
| `site/lib/ai/mastra/advisorMemory.ts` | In-memory conversation memory |
| `site/lib/ai/mastra/embedder.ts` | Embedding model resolution |
| `site/lib/ai/mastra/lanceVectorStore.ts` | LanceDB vector store (MastraVector) |
| `site/lib/ai/mastra/catalogRag.ts` | RAG pipeline — indexing + vector query tool |
| `site/lib/ai/mastra/catalogLocalSearch.ts` | Orama full-text search |
| `site/lib/ai/mastra/catalogRetrieval.ts` | Multi-tier retrieval funnel |
| `site/lib/ai/mastra/requestAdvisorText.ts` | Agent request dispatcher |
| `site/lib/ai/mastra/plannerAdvisorClient.ts` | Browser client for planner advisor |
| `site/lib/ai/useAiAdvisor.ts` | React hook for advisor chat |
| `site/app/api/ai-advisor/route.ts` | Catalog advisor API route |
| `site/app/api/Planner/ai-advisor/route.ts` | Planner advisor API route |
| `site/app/api/nav-search/route.ts` | Navigation search with AI re-ranking |
| `site/app/api/configurator/smart-wizard/route.ts` | Smart wizard route |
| `site/app/api/generate-alt/route.ts` | AI alt-text generation |
| `site/app/api/Planner/sketch-to-plan/route.ts` | Sketch-to-plan conversion |

---

*Report generated from static code analysis. Runtime behavior (actual LLM response quality, embedding similarity accuracy, retrieval relevance) requires production monitoring.*
