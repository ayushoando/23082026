/**
 * Fixture-driven unit tests for site/lib/observability/aiMetrics.ts
 *
 * Verifies:
 *   - Metric labels never contain PII-like content
 *   - fallback: "true" counter increments on fallback
 *   - Histogram records latency
 *   - Error class counter increments on error
 *   - Schema validity counters increment correctly
 *   - Retrieval source gauge increments per source
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock @prometheus-io/client before importing the module under test.
// We capture every call to inc() / observe() so we can assert on labels.
// ---------------------------------------------------------------------------

const mockCounterInc = vi.fn();
const mockHistogramObserve = vi.fn();
const mockGaugeInc = vi.fn();

vi.mock("@prometheus-io/client", () => {
  class Counter {
    constructor(public readonly config: Record<string, unknown>) {}
    inc(labels?: Record<string, string>) {
      mockCounterInc(this.config.name, labels ?? {});
    }
  }
  class Histogram {
    constructor(public readonly config: Record<string, unknown>) {}
    observe(labels: Record<string, string>, value: number) {
      mockHistogramObserve(this.config.name, labels, value);
    }
  }
  class Gauge {
    constructor(public readonly config: Record<string, unknown>) {}
    inc(labels?: Record<string, string>) {
      mockGaugeInc(this.config.name, labels ?? {});
    }
  }
  return { Counter, Histogram, Gauge };
});

// Mock the registry / metrics module so getMetricsRegistry() doesn't blow up.
vi.mock("@/lib/observability/metrics", () => ({
  getMetricsRegistry: () => ({}),
}));

// Mock server-only so the import doesn't throw in the test environment.
vi.mock("server-only", () => ({}));

// Force a fresh singleton for every test by clearing the globalThis cache key.
beforeEach(() => {
  (globalThis as typeof globalThis & { __oandoAiAdvisorMetrics?: unknown }).__oandoAiAdvisorMetrics = undefined;
  mockCounterInc.mockClear();
  mockHistogramObserve.mockClear();
  mockGaugeInc.mockClear();
});

// Lazy import after mocks are registered.
const { recordAdvisorRequest } = await import(
  "@/lib/observability/aiMetrics"
);

// ---------------------------------------------------------------------------
// PII safety fixtures
// ---------------------------------------------------------------------------

const PII_PATTERNS = [
  // raw session / user identifiers
  /sess[_-]?[0-9a-f]{8,}/i,
  // email addresses
  /\b[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}\b/i,
  // AWS-style keys
  /AKIA[A-Z0-9]{16}/,
  // bearer / API tokens (long alphanumeric strings ≥ 32 chars that look like tokens)
  /[a-zA-Z0-9_\-]{32,}/,
];

function assertNoPii(calls: unknown[][]) {
  for (const call of calls) {
    const labelsArg = call[1];
    if (!labelsArg || typeof labelsArg !== "object") continue;
    for (const value of Object.values(labelsArg as Record<string, string>)) {
      for (const pattern of PII_PATTERNS) {
        expect(
          pattern.test(String(value)),
          `PII-like value found in metric label: "${value}"`,
        ).toBe(false);
      }
    }
  }
}

describe("aiMetrics – privacy guards", () => {
  it("never places PII-like content in Counter labels for a normal successful request", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: false,
      degraded: false,
      latencyMs: 800,
      schemaValid: true,
    });

    assertNoPii(mockCounterInc.mock.calls);
    assertNoPii(mockHistogramObserve.mock.calls);
  });

  it("never places PII-like content in labels for a fallback request", () => {
    recordAdvisorRequest({
      surface: "planner",
      provider: "bedrock",
      fallbackUsed: true,
      degraded: true,
      latencyMs: 1200,
      fallbackReason: "provider_error",
      errorClass: "provider",
    });

    assertNoPii(mockCounterInc.mock.calls);
    assertNoPii(mockHistogramObserve.mock.calls);
  });
});

// ---------------------------------------------------------------------------
// requests_total counter
// ---------------------------------------------------------------------------

describe("aiMetrics – requests_total counter", () => {
  it("increments with fallback=false for a normal request", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: false,
      degraded: false,
      latencyMs: 500,
    });

    const requestCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_requests_total",
    );
    expect(requestCall).toBeDefined();
    expect(requestCall![1]).toMatchObject({
      surface: "catalog",
      provider: "bedrock",
      fallback: "false",
    });
  });

  it("increments with fallback=true when fallbackUsed is true", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: true,
      degraded: true,
      latencyMs: 500,
      fallbackReason: "empty_response",
    });

    const requestCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_requests_total",
    );
    expect(requestCall).toBeDefined();
    expect(requestCall![1]).toMatchObject({
      fallback: "true",
    });
  });
});

// ---------------------------------------------------------------------------
// fallback_total counter
// ---------------------------------------------------------------------------

describe("aiMetrics – fallback_total counter", () => {
  it("increments fallback_total when fallbackUsed is true and reason is provided", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: true,
      degraded: true,
      latencyMs: 600,
      fallbackReason: "no_chain",
    });

    const fallbackCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_fallback_total",
    );
    expect(fallbackCall).toBeDefined();
    expect(fallbackCall![1]).toMatchObject({
      surface: "catalog",
      reason: "no_chain",
    });
  });

  it("does NOT increment fallback_total when fallbackUsed is false", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: false,
      degraded: false,
      latencyMs: 600,
    });

    const fallbackCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_fallback_total",
    );
    expect(fallbackCall).toBeUndefined();
  });

  it("does NOT increment fallback_total when fallbackUsed is true but no reason given", () => {
    recordAdvisorRequest({
      surface: "planner",
      provider: "bedrock",
      fallbackUsed: true,
      degraded: true,
      latencyMs: 600,
      // no fallbackReason
    });

    const fallbackCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_fallback_total",
    );
    expect(fallbackCall).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Latency histogram
// ---------------------------------------------------------------------------

describe("aiMetrics – latency histogram", () => {
  it("records latency with correct surface and provider labels", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: false,
      degraded: false,
      latencyMs: 1750,
    });

    const histCall = mockHistogramObserve.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_latency_ms",
    );
    expect(histCall).toBeDefined();
    expect(histCall![1]).toMatchObject({ surface: "catalog", provider: "bedrock" });
    expect(histCall![2]).toBe(1750);
  });

  it("records latency for planner surface", () => {
    recordAdvisorRequest({
      surface: "planner",
      provider: "bedrock",
      fallbackUsed: false,
      degraded: false,
      latencyMs: 3200,
    });

    const histCall = mockHistogramObserve.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_latency_ms",
    );
    expect(histCall).toBeDefined();
    expect(histCall![1]).toMatchObject({ surface: "planner" });
    expect(histCall![2]).toBe(3200);
  });
});

// ---------------------------------------------------------------------------
// errors_total counter
// ---------------------------------------------------------------------------

describe("aiMetrics – errors_total counter", () => {
  it("increments errors_total with the provided error class", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: true,
      degraded: true,
      latencyMs: 4000,
      errorClass: "timeout",
    });

    const errorCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_errors_total",
    );
    expect(errorCall).toBeDefined();
    expect(errorCall![1]).toMatchObject({
      surface: "catalog",
      error_class: "timeout",
    });
  });

  it("covers all approved error class values without rejecting them", () => {
    const errorClasses = [
      "validation",
      "auth",
      "provider",
      "timeout",
      "rate_limit",
    ] as const;

    for (const errorClass of errorClasses) {
      mockCounterInc.mockClear();
      recordAdvisorRequest({
        surface: "catalog",
        provider: "bedrock",
        fallbackUsed: true,
        degraded: true,
        latencyMs: 1000,
        errorClass,
      });

      const errorCall = mockCounterInc.mock.calls.find(
        ([name]) => name === "oando_ai_advisor_errors_total",
      );
      expect(errorCall, `Missing errors_total for class "${errorClass}"`).toBeDefined();
      expect(errorCall![1].error_class).toBe(errorClass);
    }
  });

  it("does NOT increment errors_total when no errorClass is provided", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: false,
      degraded: false,
      latencyMs: 400,
    });

    const errorCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_errors_total",
    );
    expect(errorCall).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Schema validity counters
// ---------------------------------------------------------------------------

describe("aiMetrics – schema validity counters", () => {
  it("increments schema_valid_total when schemaValid is true", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: false,
      degraded: false,
      latencyMs: 800,
      schemaValid: true,
    });

    const validCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_schema_valid_total",
    );
    expect(validCall).toBeDefined();
    expect(validCall![1]).toMatchObject({ surface: "catalog" });

    const invalidCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_schema_invalid_total",
    );
    expect(invalidCall).toBeUndefined();
  });

  it("increments schema_invalid_total when schemaValid is false", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: true,
      degraded: true,
      latencyMs: 800,
      schemaValid: false,
      fallbackReason: "schema_invalid",
    });

    const invalidCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_schema_invalid_total",
    );
    expect(invalidCall).toBeDefined();
    expect(invalidCall![1]).toMatchObject({ surface: "catalog" });

    const validCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_schema_valid_total",
    );
    expect(validCall).toBeUndefined();
  });

  it("increments neither schema counter when schemaValid is omitted", () => {
    recordAdvisorRequest({
      surface: "planner",
      provider: "bedrock",
      fallbackUsed: false,
      degraded: false,
      latencyMs: 900,
    });

    const validCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_schema_valid_total",
    );
    const invalidCall = mockCounterInc.mock.calls.find(
      ([name]) => name === "oando_ai_advisor_schema_invalid_total",
    );
    expect(validCall).toBeUndefined();
    expect(invalidCall).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Retrieval source gauge
// ---------------------------------------------------------------------------

describe("aiMetrics – retrieval_sources gauge", () => {
  it("increments the gauge once per listed retrieval source", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: false,
      degraded: false,
      latencyMs: 700,
      retrievalSources: ["vector", "lexical"],
    });

    const gaugeCalls = mockGaugeInc.mock.calls.filter(
      ([name]) => name === "oando_ai_advisor_retrieval_sources",
    );
    expect(gaugeCalls).toHaveLength(2);
    expect(gaugeCalls[0]![1]).toMatchObject({ surface: "catalog", source: "vector" });
    expect(gaugeCalls[1]![1]).toMatchObject({ surface: "catalog", source: "lexical" });
  });

  it("does NOT call the retrieval gauge when retrievalSources is omitted", () => {
    recordAdvisorRequest({
      surface: "catalog",
      provider: "bedrock",
      fallbackUsed: false,
      degraded: false,
      latencyMs: 700,
    });

    const gaugeCalls = mockGaugeInc.mock.calls.filter(
      ([name]) => name === "oando_ai_advisor_retrieval_sources",
    );
    expect(gaugeCalls).toHaveLength(0);
  });
});
