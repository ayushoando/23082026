---
inclusion: fileMatch
fileMatchPattern: "site/lib/ai/**,site/lib/ai/mastra/**,**/*advisor*,**/*mastra*,**/*lancedb*,**/*rag*"
---

# AI Domain

## Stack
- `@mastra/core` — agent orchestration
- `@mastra/memory` — conversation memory
- `@mastra/rag` — retrieval-augmented generation
- `@lancedb/lancedb` — vector store
- `@orama/orama` — full-text search index
- Provider chain: `site/lib/ai/providerChain.ts`

## Conventions
- AI panel component: `site/lib/ai/AiAdvisorPanel.tsx`
- Hook: `site/lib/ai/useAiAdvisor.ts`
- All LLM calls go through `providerChain.ts` — never import providers directly.
- Vector embeddings stored in LanceDB; text index in Orama.
- Keep AI logic server-side (`server-only`) except the panel UI and hook.

## Checks (user-invoked only)
Run these static checks only when explicitly requested; do not run tests or gates automatically.
```
pnpm run typecheck
pnpm run lint
```

## Token efficiency notes
- Batch embeddings where possible (Mastra RAG supports batch ingest).
- Cache provider responses in memory layer to avoid redundant LLM calls.
- Use streaming responses for long completions to reduce perceived latency.

## Graph-layer integration
Inspect imports and dependents directly from the live source tree before optional validation.
