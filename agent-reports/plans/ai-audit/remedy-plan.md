# AI Implementation Remedy Plan

**Date:** 2026-08-31
**Status:** ✅ ALL FIXES IMPLEMENTED & VERIFIED (AI-FIX-01 through AI-FIX-11)
**Source:** [`ai-audit-report.md`](./ai-audit-report.md)
**Priority:** Ordered by production impact

---

## Wave 1: Critical Fixes (Week 1) — Est. 8-12 hours

### AI-FIX-01: Migrate Vector Search to Cloudflare Vectorize

**Finding:** AI-C01 — Vector store returns empty in production
**Priority:** P0

The entire LanceDB + embedding pipeline is dead in production because the default URI is a local filesystem path and Vercel's FS is read-only. Migrate to **Cloudflare Vectorize** — your Worker already handles edge logic, and Vectorize runs at the edge with no new service to manage.

Steps:
1. Create Vectorize index via wrangler CLI:
   ```bash
   npx wrangler vectorize create catalog-nav --dimensions 768 --metric cosine
   ```
2. Add binding to `workers/oando-worker-proxy/wrangler.toml`:
   ```toml
   [[vectorize]]
   binding = "CATALOG_VECTORS"
   index_name = "catalog-nav"
   ```
3. Add a vector search endpoint to the Worker (or use Vectorize REST API from Next.js)
4. Replace `LanceCatalogVectorStore` with a Vectorize-backed implementation using `fetch` (no new package needed)
5. Remove `@lancedb/lancedb` dependency — saves significant `node_modules` weight and eliminates the HIGH CVE (sharp via huggingface/transformers)
6. Keep Gemini API for embedding generation (OpenRouter doesn't do embeddings)

---

### AI-FIX-02: Merge Two Duplicate Agent Singletons

**Finding:** AI-C02 — advisorAgent.ts and catalogAdvisorAgent.ts are near-identical
**Priority:** P0
**Effort:** 2-3 hours

Replace both files with a single factory:

```typescript
// site/lib/ai/mastra/advisorAgent.ts
import "server-only";
import type { Agent } from "@mastra/core/agent";
import { resolveAdvisorModelChain, toMastraModel } from "./providers";
import { getAdvisorMemory } from "./advisorMemory";
import { createCatalogVectorQueryTool, ensureCatalogVectorIndex } from "./catalogRag";

type AdvisorRole = "workspace" | "catalog";

const INSTRUCTIONS: Record<AdvisorRole, string> = {
  workspace:
    "You are a helpful assistant for One & Only Furniture workspace planning and configuration. Use catalog_vector_search when catalog or product context would improve layout guidance.",
  catalog:
    "You are an enterprise workspace engineering consultant for One & Only Furniture. Use catalog_vector_search when product or page context would improve the answer.",
};

const agents = new Map<AdvisorRole, Agent>();

export async function getAdvisorAgent(role: AdvisorRole = "workspace"): Promise<Agent> {
  const cached = agents.get(role);
  if (cached) return cached;

  await ensureCatalogVectorIndex();
  const { Agent } = await import("@mastra/core/agent");
  const chain = resolveAdvisorModelChain();
  const catalogSearchTool = createCatalogVectorQueryTool();

  const agent = new Agent({
    id: `${role}-advisor`,
    name: role === "catalog" ? "Catalog Advisor" : "Workspace Advisor",
    instructions: INSTRUCTIONS[role],
    model: toMastraModel(chain[0]) ?? "google/gemini-2.5-flash",
    memory: getAdvisorMemory(),
    ...(catalogSearchTool ? { tools: { catalog_vector_search: catalogSearchTool } } : {}),
  });

  agents.set(role, agent);
  return agent;
}
```

Delete `catalogAdvisorAgent.ts`. Update `requestAdvisorText.ts` imports.

---

### AI-FIX-03: Simplify to OpenRouter-Primary + Add Failover

**Finding:** AI-C03 — Only the first provider is tried
**Priority:** P0
**Effort:** 3-4 hours

Simplify the provider chain: **OpenRouter is the primary LLM provider.** Keep Gemini API key for embeddings only (OpenRouter doesn't do embeddings). Remove Bedrock/OpenAI from the LLM chain unless explicitly needed later.

Wrap agent calls with a failover loop in `requestAdvisorText.ts`:

```typescript
async function requestAgentTextWithFailover(
  role: AdvisorRole,
  messages: AdvisorChatMessage[],
  options: RequestAdvisorMessagesOptions = {},
): Promise<string> {
  const chain = resolveAdvisorModelChain();
  if (chain.length === 0) throw new Error("No AI providers configured");

  let lastError: unknown;
  for (const target of chain) {
    try {
      const agent = await getAdvisorAgent(role);
      return await requestAgentText(agent, target, messages, options);
    } catch (err) {
      lastError = err;
      if (isAbortLikeError(err)) throw err; // Don't retry aborts
      console.warn(`[advisor] ${target.label} failed, trying next:`, err);
    }
  }
  throw lastError;
}
```

---

## Wave 2: High Fixes (Week 2) — Est. 6-8 hours

### AI-FIX-04: Enrich Embedding Text

**Finding:** AI-H02 — Embedding text is just names and slugs
**Priority:** P1
**Effort:** 1-2 hours

In `catalogRag.ts` → `buildCatalogVectorDocuments()`:

```typescript
text: [
  product.name,
  product.description ?? "",
  product.series_name ?? "",
  product.metadata?.subcategory ?? "",
  ...(product.metadata?.tags ?? []),
  ...(product.metadata?.material ?? []),
  ...(product.metadata?.useCase ?? []),
  category.name,
].filter(Boolean).join(". "),
```

This gives the embedding model actual semantic content to work with.

---

### AI-FIX-05: Extract Shared Advisor Request Infrastructure

**Finding:** AI-H03 — ~200 lines duplicated between two advisor routes
**Priority:** P1
**Effort:** 3-4 hours

Create `site/lib/ai/mastra/advisorRequestPipeline.ts`:

```typescript
export const ADVISOR_TIMEOUT_MS = 10_000;
export const STREAM_ENCODER = new TextEncoder();
export const STREAM_HEADERS = { ... };

export function emitStreamEvent(...) { ... }
export function createStreamResponse(...) { ... }
export function isAbortLikeError(...) { ... }
export function resolveAdvisorClients() { ... }
```

Both route handlers import from this shared module instead of duplicating.

---

### AI-FIX-06: Fix Conversation Memory Persistence

**Finding:** AI-H01 — InMemoryStore resets on cold start
**Priority:** P1
**Effort:** 2-3 hours

**If you choose Option A (pgvector) for AI-FIX-01**, also migrate memory storage:

```typescript
import { PostgresStore } from "@mastra/core/storage/postgres";

advisorMemory = new Memory({
  storage: new PostgresStore({
    connectionString: process.env.SUPABASE_AUTH_DATABASE_URL,
  }),
  // ...
});
```

**Alternatively**, since both advisor routes already send the full message history in each request, the in-memory store is redundant — the client maintains conversation state. Document this as intentional and simplify:

```typescript
advisorMemory = new Memory({
  storage: new InMemoryStore({ id: "advisor-memory-storage" }),
  options: { lastMessages: 20, semanticRecall: false },
});
```

---

### AI-FIX-07: Remove or Cache Nav Search AI Re-Ranking

**Finding:** AI-H04 — 1.2s LLM call for header autocomplete
**Priority:** P1
**Effort:** 1-2 hours

**Recommended: Remove AI re-ranking.** Orama's lexical search is already fast and relevant for autocomplete. The 1.2s timeout is too slow for a header search dropdown.

If AI re-ranking must stay, add a response cache:
```typescript
const rankCache = new Map<string, { ids: string[]; ts: number }>();
const RANK_CACHE_TTL = 60_000; // 1 minute
```

---

## Wave 3: Medium Fixes (Week 3) — Est. 4-6 hours

### AI-FIX-08: Add Prompt Injection Guards

**Finding:** AI-M02
**Effort:** 1-2 hours

Sanitize user input before inserting into prompts:
```typescript
function sanitizeUserInput(input: string): string {
  return input
    .replace(/\n/g, " ")
    .replace(/[<>{}]/g, "")
    .trim()
    .slice(0, 500);
}
```

Apply to all places where user queries enter system prompts.

---

### AI-FIX-09: Batch Embeddings

**Finding:** AI-M04
**Effort:** 1-2 hours

Replace the sequential loop with batch embedding:
```typescript
async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = resolveMastraEmbeddingModel();
  if (!model) return [];
  
  // Batch in chunks of 20
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += 20) {
    const batch = texts.slice(i, i + 20);
    const embeddings = await Promise.all(
      batch.map(text => embedV2({ model, value: text }))
    );
    results.push(...embeddings.map(e => e.embedding));
  }
  return results;
}
```

---

### AI-FIX-10: Add Retrieval Source Metrics

**Finding:** AI-M05
**Effort:** 1 hour

In `catalogRetrieval.ts`, after retrieval:
```typescript
import { getMetricsRegistry } from "@/lib/observability/metrics";

// Track which retrieval sources contributed
for (const source of sources) {
  registry.counter("advisor_retrieval_source_total", { source }).inc();
}
```

---

### AI-FIX-11: Remove Legacy providerFetch.ts

**Finding:** AI-M01
**Effort:** 1 hour

After all callers are migrated to the Mastra agent path:
1. Remove `providerFetch.ts`
2. Remove `providerChain.ts` (deprecated re-export)
3. Remove exports from `index.ts`

---

## Summary

| Wave | Actions | Impact | Effort |
|---|---|---|---|
| Wave 1 | Production vector search, merge agents, add failover | AI actually works in prod | 8-12 hours |
| Wave 2 | Enrich embeddings, extract shared infra, fix memory, fix nav-search | Better quality + less tech debt | 6-8 hours |
| Wave 3 | Prompt injection guards, batch embeddings, metrics, cleanup | Hardening + observability | 4-6 hours |

---

*Plan generated from static code analysis. LLM response quality, embedding accuracy, and retrieval relevance require production monitoring after fixes are applied.*
