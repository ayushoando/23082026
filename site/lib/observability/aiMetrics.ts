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
import { SpanStatusCode, trace } from "@opentelemetry/api";

import { getMetricsRegistry } from "@/lib/observability/metrics";

const aiAdvisorTracer = trace.getTracer("oando.ai-advisor");

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
  readonly retrievalContributions: Counter<"surface" | "source">;
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
    retrievalContributions: new Counter({
      name: "oando_ai_retrieval_source_contributions_total",
      help: "Catalog retrieval funnel contributions — one increment per contributing source per retrieval run",
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

/**
 * Records one privacy-safe counter increment per contributing retrieval
 * source for a single retrieval funnel run (remediation AI-FIX-10).
 *
 * Labels use the pre-approved `AiSurface` / `AiRetrievalSource` unions only —
 * never query text, product content, or session identifiers. Best-effort:
 * metric failures are swallowed and must never break retrieval.
 */
export function recordRetrievalSourceContributions(
  surface: AiSurface,
  sources: readonly AiRetrievalSource[],
): void {
  try {
    const metrics = getAiAdvisorMetrics();
    for (const source of sources) {
      metrics.retrievalContributions.inc({ surface, source });
    }
  } catch {
    // intentionally swallowed — observability must not affect retrieval
  }
}

// ---------------------------------------------------------------------------
// AI Observability adapter — Task 5.1
// ---------------------------------------------------------------------------

/**
 * Aggregate observation produced from a single AI advisor call.
 *
 * Privacy contract: only pre-approved label strings; never include prompt
 * text, session IDs, model response bodies, raw query strings, or keys.
 */
export interface AiRequestObservation {
  /** Which product surface handled this request. */
  route: "catalog" | "planner";
  /**
   * Provider label (e.g. "bedrock") — must NOT be a secret or raw model id.
   * Optional: may be absent when the chain is empty.
   */
  provider?: string;
  /** Whether the request fell back to a degraded/heuristic response. */
  fallback: boolean;
  /**
   * Retrieval layers that contributed results (e.g. ["vector", "lexical"]).
   * Optional: absent when retrieval did not run.
   */
  sources?: string[];
  /** End-to-end duration of `fn()` in milliseconds. */
  durationMs: number;
  /** True when the request ended with an error. */
  error?: boolean;
}

/**
 * Wraps an async AI advisor call with best-effort Prometheus metric recording.
 *
 * - Calls `fn()` and measures wall-clock duration.
 * - Calls `observe(result)` to obtain the `AiRequestObservation`.
 * - Feeds the observation into `recordAdvisorRequest`.
 * - Metric recording is best-effort: any error thrown inside `observe()` or
 *   `recordAdvisorRequest()` is swallowed — it never changes the result or
 *   propagates to the caller.
 * - Always returns the resolved value of `fn()` unchanged.
 *
 * @param route  The product surface ("catalog" | "planner").
 * @param fn     The async work to wrap.
 * @param observe Callback that maps the resolved result to an observation.
 */
export async function withAiObservability<T>(
  route: "catalog" | "planner",
  fn: () => Promise<T>,
  observe: (result: T) => AiRequestObservation,
): Promise<T> {
  const start = Date.now();
  const span = aiAdvisorTracer.startSpan("oando.ai_advisor.request");
  span.setAttribute("oando.ai.surface", route);

  try {
    const result = await fn();
    const durationMs = Date.now() - start;

    // Best-effort recording — never throws to the caller.
    try {
      const obs = observe(result);
      const provider = obs.provider ?? "unknown";
      const latencyMs = obs.durationMs > 0 ? obs.durationMs : durationMs;

      recordAdvisorRequest({
        surface: obs.route,
        provider,
        fallbackUsed: obs.fallback,
        degraded: obs.fallback,
        latencyMs,
        errorClass: obs.error ? "provider" : undefined,
        retrievalSources: obs.sources as AiRetrievalSource[] | undefined,
      });

      // These custom span attributes are deliberately aggregate-only. Do not
      // add prompts, responses, headers, session IDs, or model payloads here.
      span.setAttribute("oando.ai.provider", provider);
      span.setAttribute("oando.ai.fallback", obs.fallback);
    } catch {
      // Observability must not affect the advisor result.
    }

    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    // Do not record the exception: provider errors can contain request data.
    span.setAttribute("oando.ai.error", true);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
