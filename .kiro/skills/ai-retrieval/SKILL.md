---
name: ai-retrieval
description: Use when work concerns the repository's Mastra advisors, Bedrock/provider routing, catalog embeddings, LanceDB, Orama retrieval, advisory output, or AI route contracts.
---

# AI and Retrieval

Read `AGENTS.md` and `.kiro/skills/oando-master/SKILL.md` first. This skill routes repository evidence; it does not activate an AI provider, connect an MCP server, install a Power, or make AI output authoritative.

## Scope and live boundary

The server-side AI boundary is `site/lib/ai/mastra/`. Its modules use `server-only` and are not safe to import into browser components. The browser-safe surface is `site/lib/ai/mastra/client.ts` and the request types/client in `plannerAdvisorClient.ts`; `site/lib/ai/useAiAdvisor.ts` is a compatibility hook over that client surface.

The live implementation is advisory catalog assistance, not an autonomous product or planning authority. Static source evidence does not prove provider credentials, runtime model availability, vector-index loading, hosted persistence, route reachability, or client mounting.

## Local Evidence route

Start with these paths in this order:

1. `site/lib/ai/mastra/index.ts` — public server-side export boundary.
2. `site/lib/ai/mastra/providers.ts` and `providerFetch.ts` — provider chain, fallback order, and server-only credential use.
3. `site/lib/ai/mastra/catalogRetrieval.ts`, `catalogRag.ts`, `catalogLocalSearch.ts`, `embedder.ts`, and `lanceVectorStore.ts` — retrieval order, embedding availability, local index, and filesystem guard.
4. `site/lib/ai/mastra/advisorAgent.ts`, `catalogAdvisorAgent.ts`, `advisorMemory.ts`, and `requestAdvisorText.ts` — Mastra agents, memory, tools, and generation/streaming behavior.
5. `site/app/api/ai-advisor/route.ts` and any route named by the current client — request validation, authorization, fallback, response, and route reachability.
6. `site/features/shared/api/schemas.ts`, `site/lib/auth/`, `site/lib/rateLimit.ts`, and the relevant catalog helper — input, session, abuse-control, and data boundaries.

Select `repo-map` for path discovery and `graph-impact` when a shared AI module or route changes. Select `planner-studio` and `fork-boundaries` only when the evidence shows Planner/Studio fork code is in scope. Select `verify-and-gate` only for an exact owner-authorized validation command.

## Provider and secret boundary

- `providers.ts` resolves Gemini, OpenRouter, OpenAI, and Bedrock targets from server environment values and keeps the chain ordered; Bedrock requires a region plus bearer or AWS credentials.
- `providerFetch.ts` is the lower-level server request boundary. `site/lib/ai/providerChain.ts` is a deprecated compatibility re-export; do not create a second provider path.
- Provider keys, AWS credentials, model identifiers, and provider responses remain server-side. Never place them in client modules, browser payloads, logs, steering, or a skill.
- A provider package import or a configured environment variable is not proof that a provider is reachable or approved for a task.

## Retrieval boundary

`catalogRetrieval.ts` composes the current catalog grounding order:

1. LanceDB vector recall through Mastra RAG when an embedding provider is available.
2. Orama lexical search over live catalog rows without a network key.
3. Catalog order as a deterministic tail filler.

The result is deduplicated by product slug and capped by the requested limit. Retrieval errors fail open to the next layer or catalog order; this is a degraded fallback, not proof of retrieval quality.

`catalogRag.ts` builds product/category/page documents, uses the configured embedding model, and writes the local LanceDB URI through `assertDevDiskWritable`; the default local URI is `.data/lancedb/catalog` unless `LANCE_DB_URI` is set. Production filesystem write behavior remains governed by the repository persistence boundary.

Fuse.js is a separate catalog-filter implementation in `site/lib/catalog/site/applyCatalogProductFilters.ts`. Do not describe that fuzzy filter as part of the Mastra/LanceDB/Orama retrieval chain unless live imports establish a new relationship.

## Route and response contract

The canonical catalog advisor route observed in the App Router is `POST /api/ai-advisor` (`site/app/api/ai-advisor/route.ts`). It is wrapped with the shared `withAuth` boundary for the guest role, rate-limited to five requests, and CSRF-protected. The request contains a validated natural-language `query`, optional catalog/configurator `context`, and optional `stream` flag.

The non-stream response uses the shared success envelope and returns normalized catalog recommendations, summary, INR budget bands, next actions, warnings, and `fallbackUsed` state. The stream response uses NDJSON status/delta/result/error events. The route grounds model prompts on retrieved live catalog rows, normalizes model recommendations back to known catalog entries, and falls back to deterministic heuristic recommendations when providers, catalog rows, parsing, or retrieval are unavailable.

`plannerAdvisorClient.ts` advertises `POST /api/planner/ai-advisor`, but no matching `site/app/api/planner/ai-advisor/route.ts` was observed in the current tree. Treat that client-to-route relationship as a coverage gap (`present-but-unverified`/unwired), not as permission to add or relabel a route. A route repair is a separately approved Core Product Write.

## Advisory-output rules

- Treat every model response, retrieval hit, provider label, and layout suggestion as untrusted advisory data.
- Keep recommendations constrained to live catalog records and existing response schemas; reject malformed or unknown product references.
- Preserve deterministic fallback behavior and visibly distinguish degraded or fallback responses when the route already exposes that state.
- Do not claim that an AI recommendation is validated, optimal, price-authoritative, a final BOQ, or automatically applied. A user or owner must explicitly review and apply any suggested layout or catalog action.
- Do not use AI output to authorize a write, migration, deletion, deployment, credential change, or security decision.

## Validation contract

Read-only inspection may compare imports, schemas, provider branches, route references, fallback paths, and secret boundaries. It cannot establish model reachability, embedding quality, route execution, streaming behavior, browser rendering, or hosted persistence.

Typecheck, lint, tests, gates, browser runners, builds, local services, provider calls, database actions, and deployment remain owner-authorized. If explicitly requested and permitted by the active hook, use the smallest exact root command; otherwise report the command as pending owner validation. Do not suggest `pnpm run typecheck:scripts` while `scripts/tsconfig.json` is absent.

## Separate Approval Work

Keep these outside this skill's passive routing scope: adding or changing AI providers, packages, model defaults, prompt behavior, route contracts, authentication/rate limits/CSRF, retrieval ranking, LanceDB persistence, database/catalog writes, MCP configuration, external network access, secrets, autonomous actions, and any write under `site/`. Use Local Evidence first and record the exact owner decision and rollback boundary before proposing one.

Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.
