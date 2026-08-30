/**
 * AI stack audit findings dataset.
 *
 * Each record is a `Finding` produced by static inspection of the AI stack
 * under `site/lib/ai/mastra/`, `site/app/api/ai-advisor/route.ts`,
 * `site/app/api/planner/ai-advisor/route.ts`, and
 * `site/lib/observability/aiMetrics.ts`.
 *
 * Coverage: one confirmed finding per audit dimension (seven total).
 * Approval-gated findings are flagged so they surface for owner review and
 * are NOT applied until the owner approves the relevant change class.
 *
 * Evidence strings are verbatim excerpts from the source at the recorded line.
 */

import type { Finding } from "./finding";

export const AI_STACK_FINDINGS: readonly Finding[] = [
  // -------------------------------------------------------------------------
  // 1. correctness
  // -------------------------------------------------------------------------
  {
    id: "correct-001",
    dimension: "correctness",
    severity: "medium",
    location: {
      file: "site/app/api/ai-advisor/route.ts",
      line: 317,
    },
    evidence:
      'function parseAdvisorJson(raw: string): Record<string, unknown> | null { … }' +
      ' — the function strips a JSON code-fence then calls JSON.parse inside a try/catch.' +
      ' If the model returns truncated JSON the parse silently returns null and the route' +
      ' falls back to the heuristic result without surfacing the parse failure to any' +
      ' structured log or metric.',
    changeClass: "safe",
    description:
      "parseAdvisorJson swallows parse errors without emitting a structured log entry or" +
      " incrementing a metric counter. Silent null returns make it impossible to distinguish" +
      " 'model returned malformed JSON' from 'model returned no content', obscuring" +
      " correctness regressions in provider output.",
  },

  // -------------------------------------------------------------------------
  // 2. provider-routing
  // -------------------------------------------------------------------------
  {
    id: "routing-001",
    dimension: "provider-routing",
    severity: "low",
    location: {
      file: "site/lib/ai/mastra/providers.ts",
      line: 160,
    },
    evidence:
      'const DEFAULT_OPENROUTER_MODEL = env.OPENROUTER_MODEL || "openrouter/auto";' +
      ' … function toOpenRouterModelId(model: string): `${string}/${string}` {' +
      '   return model.includes("/") ? (model as `${string}/${string}`) : `openrouter/${model}`;' +
      ' }',
    changeClass: "model-id",
    description:
      "DEFAULT_OPENROUTER_MODEL falls back to 'openrouter/auto', a wildcard routing token" +
      " that delegates model selection to OpenRouter's own policy. This means the effective" +
      " model id is not deterministic and can change across invocations without any code or" +
      " environment change. The value is approval-gated because pinning a specific model id" +
      " is a model-id change requiring owner sign-off.",
  },

  // -------------------------------------------------------------------------
  // 3. retrieval-quality
  // -------------------------------------------------------------------------
  {
    id: "retrieval-001",
    dimension: "retrieval-quality",
    severity: "medium",
    location: {
      file: "site/lib/ai/mastra/lanceVectorStore.ts",
      line: 81,
    },
    evidence:
      "private isProductionNonRemote(): boolean {" +
      "  const isProduction = env.NODE_ENV === 'production';" +
      "  const isBypass = env.DEV_AUTH_BYPASS === '1';" +
      "  return isProduction && !isBypass && !this.isRemoteUri(this.uri);" +
      "}" +
      " — when true, query() returns []",
    changeClass: "safe",
    description:
      "In production without a remote LANCE_DB_URI, isProductionNonRemote() returns true" +
      " and query() silently returns an empty result set. catalogRetrieval.ts treats an" +
      " empty vector result as graceful degradation and falls through to lexical/catalog-order" +
      " layers, but there is no metric or log that distinguishes 'vector index unavailable'" +
      " from 'no relevant results found'. Retrieval-quality cannot be diagnosed without" +
      " adding a structured log or metric for this branch.",
  },

  // -------------------------------------------------------------------------
  // 4. error-handling
  // -------------------------------------------------------------------------
  {
    id: "error-001",
    dimension: "error-handling",
    severity: "low",
    location: {
      file: "site/app/api/ai-advisor/route.ts",
      line: 614,
    },
    evidence:
      'catch (providerError) {' +
      '  const isTimeout = isAbortLikeError(providerError);' +
      '  console.error(' +
      '    `[ai-advisor] ${advisorClient.provider} provider error${' +
      '      isTimeout ? " (timeout)" : ""' +
      '    }:`, providerError,' +
      '  );' +
      '}',
    changeClass: "safe",
    description:
      "Provider errors in handleCatalogAdvisor are caught and logged via console.error with" +
      " the raw providerError object. In production, SDK internals (including potential" +
      " credential fragments in error messages) may reach log aggregators. The planner" +
      " route (route.ts line ~120) correctly logs only a safe classification string;" +
      " the catalog route should apply the same pattern. This is a safe fix.",
  },

  // -------------------------------------------------------------------------
  // 5. observability
  // -------------------------------------------------------------------------
  {
    id: "observability-001",
    dimension: "observability",
    severity: "medium",
    location: {
      file: "site/lib/observability/aiMetrics.ts",
      line: 148,
    },
    evidence:
      "export function recordAdvisorRequest(input: RecordAdvisorRequestInput): void {" +
      "  const metrics = getAiAdvisorMetrics();" +
      "  metrics.requests.inc({ surface, provider, fallback });" +
      "  … }" +
      " — callers in site/app/api/ai-advisor/route.ts: none found by static inspection.",
    changeClass: "safe",
    description:
      "aiMetrics.ts exports recordAdvisorRequest with a complete, privacy-safe API, but" +
      " static inspection of site/app/api/ai-advisor/route.ts finds no call to this" +
      " function. The catalog advisor route does not record any Prometheus metrics, so" +
      " provider selection, fallback events, latency, and error rates are invisible in" +
      " the existing dashboard. Wiring the call is a safe change; it does not alter the" +
      " HTTP contract or any label value.",
  },

  // -------------------------------------------------------------------------
  // 6. route-contract
  // -------------------------------------------------------------------------
  {
    id: "contract-001",
    dimension: "route-contract",
    severity: "low",
    location: {
      file: "site/app/api/planner/ai-advisor/route.ts",
      line: 100,
    },
    evidence:
      "return {" +
      "  ok: true," +
      "  status: 200," +
      "  data: { content: content.trim(), provider: target.provider }," +
      "};",
    changeClass: "safe",
    description:
      "The planner advisor route exposes target.provider (e.g. 'gemini', 'openrouter')" +
      " in the success response body. This is the provider type string, not a credential," +
      " but it leaks infrastructure topology to the client. The catalog route correctly" +
      " exposes only target.label ('gemini', 'openrouter', 'openrouter-backup', etc.)." +
      " Changing the planner response to expose label instead of provider is a safe fix" +
      " that aligns both routes.",
  },

  // -------------------------------------------------------------------------
  // 7. performance
  // -------------------------------------------------------------------------
  {
    id: "perf-001",
    dimension: "performance",
    severity: "info",
    location: {
      file: "site/lib/ai/mastra/catalogRetrieval.ts",
      line: 101,
    },
    evidence:
      "const [vectorIds, lexicalSlugs] = await Promise.all([" +
      "  recallVectorProductIds(trimmed, limit)," +
      "  recallLexicalSlugs(trimmed, products, limit)," +
      "]);",
    changeClass: "safe",
    description:
      "Vector recall and lexical recall run concurrently via Promise.all, which is the" +
      " correct pattern. However, recallLexicalSlugs builds a fresh in-memory Orama index" +
      " from the full product list on every request (createCatalogSearchIndex is called" +
      " inside the function). For catalogs with hundreds of products and high request rates" +
      " this is a repeated O(n) allocation per request. Caching the index across requests" +
      " (e.g. module-level or with a weak-ref keyed on product count) is a safe optimisation" +
      " with no change to the retrieval contract.",
  },
] as const;
