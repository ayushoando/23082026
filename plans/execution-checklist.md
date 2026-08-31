# Execution Checklist — 2026-08-31

Living checklist. Updated as tasks complete.

---

## Phase 1: Quick Wins

- [x] **Studio auth** — Added `requireAuthUser("/oostudio", "admin")` to `site/features/Studio/layout.tsx`
- [ ] **axios → browserApiFetch** — Replace in `site/lib/Studio/studioApi.ts`, then `pnpm remove axios`
- [ ] **Typecheck after axios removal** — `pnpm run typecheck`

## Phase 2: AI Simplification

- [ ] **Merge two agent singletons** — Combine `advisorAgent.ts` + `catalogAdvisorAgent.ts` into one factory
- [ ] **Simplify provider chain** — Gemini primary (free), OpenRouter backup, drop Bedrock/OpenAI from default chain
- [ ] **Add failover to agent requests** — Try chain[0], catch, try chain[1]
- [ ] **Typecheck after AI changes** — `pnpm run typecheck`

## Phase 3: Vector Search (Cloudflare Vectorize)

- [ ] **Add Vectorize binding** — Update `workers/oando-worker-proxy/wrangler.toml`
- [ ] **Create Vectorize vector store** — Replace `LanceCatalogVectorStore` with Vectorize REST client
- [ ] **Update embedder** — Keep Gemini for embeddings, remove LanceDB references
- [ ] **Update catalogRag.ts** — Use new vector store
- [ ] **Update index.ts exports** — Remove LanceDB exports
- [ ] **Remove @lancedb/lancedb** — `pnpm remove @lancedb/lancedb`
- [ ] **Typecheck after Vectorize** — `pnpm run typecheck`

## Phase 4: Validation

- [ ] **Full typecheck** — `pnpm run typecheck`
- [ ] **Boundary scan** — `pnpm run scan:boundaries` (Studio layout changed)
- [ ] **Security scan** — `pnpm run scan:secrets`
- [ ] **Fast gate** — `pnpm run gate:fast`

## Phase 5: Cross-Plan Updates

- [ ] **Update plans with execution results**

---

*Last updated: starting execution*
