# AI Implementation Audit Plan

**Created:** 2026-08-31
**Status:** Closed - all 11 remedy fixes applied and verified (2026-09-01)
**Owner:** Repository owner

## Documents

| Document | Purpose |
|---|---|
| [`ai-audit-report.md`](./ai-audit-report.md) | Full audit: Mastra agents, LLM providers, RAG pipeline, vector store, search engines, memory, all 5 AI API routes |
| [`remedy-plan.md`](./remedy-plan.md) | 3-wave fix plan: production vector search, agent consolidation, provider failover, embedding quality, shared infra |

## Key Findings

### Critical (3)
- **Vector store is dead in production** — LanceDB defaults to local filesystem, Vercel FS is read-only. All vector search returns empty arrays in prod. The entire embedding pipeline is dev-only.
- **Two identical agent singletons** — `advisorAgent.ts` and `catalogAdvisorAgent.ts` differ only in the instruction string. Same model, same memory, same tools.
- **No provider failover in agent path** — Only `chain[0]` is used. If Gemini fails, it doesn't try OpenRouter/Bedrock.

### High (4)
- **Memory resets on cold start** — `InMemoryStore` loses conversation history between serverless invocations
- **Embedding text too thin** — Just `"product-name slug category"`, not descriptions/features/tags
- **~200 lines duplicated** between catalog advisor and planner advisor routes
- **Nav search AI re-ranking adds 1.2s** to header autocomplete for questionable value

### What's Working Well
- Provider allowlist (APPROVED_PROVIDER_MODELS) — solid security
- Graceful degradation — heuristic fallbacks when all LLMs fail
- Multi-tier retrieval funnel (vector → lexical → catalog-order)
- Rate limiting with fail-closed for AI routes
- Price sanitization prevents LLM hallucinated prices
- Proper abort/timeout handling with cleanup

## Architecture

Audit-time state (2026-08-31). Closed 2026-09-01: LanceDB replaced by Cloudflare Vectorize, `providerFetch`/`providerChain` retired - see [remedy-plan](./remedy-plan.md).

```
Provider Chain: Gemini → OpenRouter → OpenRouter-backup → OpenAI → Bedrock
                              │
         ┌────────────────────┼──────────────────┐
         ▼                    ▼                   ▼
   Mastra Agent         providerFetch        Nav Search
   (advisor chat)       (legacy raw fetch)   (AI re-ranking)
         │
    Memory (InMemory)
    Tools (catalog_vector_search)
         │
    ┌────┴────┐
    ▼         ▼
  LanceDB   Orama
  (DEAD in   (works)
   prod)
```

## Remedy Timeline

| Wave | What | Effort |
|---|---|---|
| Wave 1 | Fix production vector search (pgvector recommended), merge agents, add failover | 8-12 hours |
| Wave 2 | Enrich embeddings, extract shared infra, fix memory, remove nav-search AI ranking | 6-8 hours |
| Wave 3 | Prompt injection guards, batch embeddings, retrieval metrics, cleanup legacy | 4-6 hours |
