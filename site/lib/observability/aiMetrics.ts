/**
 * Privacy-safe AI observability metrics.
 *
 * Emits aggregate counters/histograms only.
 * NEVER includes in labels: prompts, personal data, provider keys,
 * raw session IDs, model response bodies, or raw query strings.
 *
 * Approved metric set (decision record 0.4):
 *   - grounded-catalog accuracy
 *   - structured-response validity
 *   - fallback visibility
 *   - latency (p50/p95)
 *   - provider selection
 *   - retrieval contribution
 *   - error rate by class
 */
import "server-only";

import { Counter, Gauge, Histogram, type Registry } from "@prometheus-io/client";

import { getMetricsRegistry } from "@/lib/observability/metrics";

// ---------------------------------------------------------------------------
// Approved label value unions — only pre-approved strings may flow into labels
// ---------------------------------------------------------------------------

export type AiSurface = "catalog" | "planner";

export type AiFallbackReason =
  | "no_chain"
  | "provider_error"
  | "empty_response"
  | "schema_invalid";

export type AiErrorClass =
  | "validation"
  | "auth"
  | "provider"
  | "timeout"
  | "rate_limit";

export type AiRetrievalSource = "vector" | "lexical" | "catalog_order";

// ---------------------------------------------------------------------------
// Input type — only aggregate numeric values and pre-approved label strings
// NEVER add: promptText, sessionId, queryString, responseBody, providerKey
// ---------------------------------------------------------------------------

export interface RecordAdvisorRequestInput {
  /** Which product surface generated this request. */
  surface: AiSurface;
  /**
   * Provider identifier — must be a pre-approved short string (e.g. "bedrock").
   * Must NOT be a key, token, or any secret value.
   */
  provider: string;
  /** Whether the request fell back to a degraded response. */
  fallbackUsed: boolean;
  /** Whether the response is marked as degraded. */
  degraded: boolean;
  /** End-to-end latency in milliseconds (aggregate numeric only). */
  latencyMs: number;
  /** Error class when an error occurred; omit on success. */
  errorClass?: AiErrorClass;
  /** Reason for fallback when fallbackUsed is true; omit otherwise. */
  fallbackReason?: AiFallbackReason;
  /** Retrieval sources that contributed results; omit when retrieval did not run. */
  retrievalSources?: AiRetrievalSource[];
  /** Whether the structured response passed schema validation. */
  schemaValid?: boolean;
  /** Number of catalog items in the response that are grounded in known catalog records. */
  groundedCount?: number;
  /** Total number of catalog items mentioned in the response. */
  totalCount?: number;
}

// ---------------------------------------------------------------------------
// Metric descriptors
// ---------------------------------------------------------------------------

interface AiAdvisorMetrics {
  readonly requests: Counter<"surface" | "provider" | "fallback">;
  readonly fallbacks: Counter<"surface" | "reason">;
  readonly latency: Histogram<"surface" | "provider">;
  readonly errors: Counter<"surface" | "error_class">;
  readonly retrievalSources: Gauge<"surface" | "source">;
  readonly schemaValid: Counter<"surface">;
  readonly schemaInvalid: Counter<"surface">;
}

type AiMetricsGlobal = typeof globalThis & {
  __oandoAiAdvisorMetrics?: AiAdvisorMetrics;
};

// ---------------------------------------------------------------------------
// Factory — singleton per process via globalThis (matches existing pattern)
// ---------------------------------------------------------------------------

function createAiAdvisorMetrics(registry: Registry): AiAdvisorMetrics {
  const registers = [registry];
  return {
    requests: new Counter({
      name: "oando_ai_advisor_requests_total",
      help: "Total AI advisor requests, labelled by surface, provider, and fallback flag",
      labelNames: ["surface", "provider", "fallback"] as const,
      registers,
    }),
    fallbacks: new Counter({
      name: "oando_ai_advisor_fallback_total",
      help: "AI advisor fallback events by surface and reason",
      labelNames: ["surface", "reason"] as const,
      registers,
    }),
    latency: new Histogram({
      name: "oando_ai_advisor_latency_ms",
      help: "AI advisor end-to-end latency in milliseconds",
      labelNames: ["surface", "provider"] as const,
      buckets: [500, 1000, 2000, 3000, 5000, 10000],
      registers,
    }),
    errors: new Counter({
      name: "oando_ai_advisor_errors_total",
      help: "AI advisor errors by surface and error class",
      labelNames: ["surface", "error_class"] as const,
      registers,
    }),
    retrievalSources: new Gauge({
      name: "oando_ai_advisor_retrieval_sources",
      help: "Retrieval source contribution counts by surface and source type",
      labelNames: ["surface", "source"] as const,
      registers,
    }),
    schemaValid: new Counter({
      name: "oando_ai_advisor_schema_valid_total",
      help: "AI advisor responses that passed schema validation",
      labelNames: ["surface"] as const,
      registers,
    }),
    schemaInvalid: new Counter({
      name: "oando_ai_advisor_schema_invalid_total",
      help: "AI advisor responses that failed schema validation",
      labelNames: ["surface"] as const,
      registers,
    }),
  };
}

function getAiAdvisorMetrics(): AiAdvisorMetrics {
  const root = globalThis as AiMetricsGlobal;
  root.__oandoAiAdvisorMetrics ??= createAiAdvisorMetrics(getMetricsRegistry());
  return root.__oandoAiAdvisorMetrics;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Records an aggregate observation for a single AI advisor request.
 *
 * Privacy contract: this function does NOT accept prompt text, raw session IDs,
 * model response bodies, raw query strings, or provider credentials.
 * Only aggregate numeric values and pre-approved label strings are emitted.
 */
export function recordAdvisorRequest(input: RecordAdvisorRequestInput): void {
  const metrics = getAiAdvisorMetrics();

  // requests_total — surface + provider + fallback flag
  metrics.requests.inc({
    surface: input.surface,
    provider: input.provider,
    fallback: input.fallbackUsed ? "true" : "false",
  });

  // fallback_total — only when a fallback occurred
  if (input.fallbackUsed && input.fallbackReason) {
    metrics.fallbacks.inc({
      surface: input.surface,
      reason: input.fallbackReason,
    });
  }

  // latency histogram
  metrics.latency.observe(
    { surface: input.surface, provider: input.provider },
    input.latencyMs,
  );

  // errors_total — only when an error class is present
  if (input.errorClass) {
    metrics.errors.inc({
      surface: input.surface,
      error_class: input.errorClass,
    });
  }

  // retrieval_sources gauge — inc per contributing source
  if (input.retrievalSources) {
    for (const source of input.retrievalSources) {
      metrics.retrievalSources.inc({ surface: input.surface, source });
    }
  }

  // schema validity counters
  if (input.schemaValid === true) {
    metrics.schemaValid.inc({ surface: input.surface });
  } else if (input.schemaValid === false) {
    metrics.schemaInvalid.inc({ surface: input.surface });
  }
}
