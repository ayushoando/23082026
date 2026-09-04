# AI Advisor, Mastra & Machine Learning Subsystem Audit

**Date:** September 4, 2026  
**Auditor:** AntiGravity Pair Programming Agent  
**Status:** COMPLETED  
**Scope:** AI Advisor Engine (`site/lib/ai/`), Mastra Agent Framework, Multi-Provider Fallbacks (Gemini, Amazon Bedrock), Catalog RAG, and Telemetry

---

## 1. Executive Summary

Oando integrates an advanced architectural co-pilot and product advisor powered by the **Mastra Agent Framework** ([`site/lib/ai/mastra/`](file:///d:/23082026/site/lib/ai/mastra)) and **Vercel AI SDK**. The subsystem provides:
1. **Interactive Spatial Planning:** Conversational layout recommendations based on room dimensions, occupancy, acoustic needs, and budget.
2. **Catalog RAG (Retrieval-Augmented Generation):** Semantic vector search over product dimensions, certifications, finishes, and price books.
3. **Multi-Model Resilient Fallbacks:** Primary Google Gemini API and Amazon Bedrock models with automatic failover to secondary endpoints.
4. **End-to-End Tracing:** Real-time span instrumentation with `@ai-sdk/otel` capturing prompt tokens, completion tokens, latency, and model IDs into Grafana Tempo.

---

## 2. Supported LLM Providers & Allowlisted Chain

The provider engine ([`providers.ts`](file:///d:/23082026/site/lib/ai/mastra/providers.ts)) enforces a strict security allowlist preventing unvetted model calls:

| Provider | Driver / SDK | Role in Production |
| :--- | :--- | :--- |
| **Google Gemini** | `@google/genai` / HTTP Gateway | Primary high-speed reasoning, layout generation, alt-text synthesis |
| **Amazon Bedrock** | `@ai-sdk/amazon-bedrock` | Enterprise private VPC model execution (Claude 3.5 / Amazon Titan) |
| **OpenRouter** | OpenRouter REST API | Resilient multi-cloud backup fallback |
| **OpenAI** | Vercel AI SDK / OpenAI | Secondary fallback |

---

## 3. Catalog RAG & Semantic Retrieval

- **Vectorization Pipeline ([`vectorizeCatalogStore.ts`](file:///d:/23082026/site/lib/ai/mastra/vectorizeCatalogStore.ts)):** Ingests catalog products, dimensional bounds, fabric themes, and acoustic ratings into semantic chunk embeddings.
- **Local & Remote Search ([`catalogLocalSearch.ts`](file:///d:/23082026/site/lib/ai/mastra/catalogLocalSearch.ts), [`catalogRag.ts`](file:///d:/23082026/site/lib/ai/mastra/catalogRag.ts)):** Combines keyword filtering with vector cosine similarity to return exact furniture SKUs that fit spatial canvas constraints.
- **Advisor Memory ([`advisorMemory.ts`](file:///d:/23082026/site/lib/ai/mastra/advisorMemory.ts)):** Stores conversational context across design turns within a user session.

---

## 4. Security & Abuse Prevention

1. **Input Sanitization ([`sanitizeUserInput.ts`](file:///d:/23082026/site/lib/ai/sanitizeUserInput.ts)):** Strips prompt injection markers, control characters, and abnormal token lengths before passing to model runtimes.
2. **Rate Limit Gating:** All AI endpoints (`/api/ai-advisor`, `/api/Planner/sketch-to-plan`, `/api/generate-alt`) are covered by `AI_RATE_LIMIT_KEY_PATTERN` in [`site/lib/rateLimit.ts`](file:///d:/23082026/site/lib/rateLimit.ts), failing closed if distributed backends disconnect to protect cloud budgets.
