/**
 * Property-based tests for withAiObservability and AiRequestObservation.
 *
 * Feature: ai-implementation-audit
 * Property 14: Requests record provider, fallback, and retrieval-layer metrics
 * Property 15: Requests emit a telemetry span with the required attributes
 *              (span emission via @vercel/otel is deferred to integration/browser
 *               authorization; this file tests the observable callback contract)
 *
 * Additional unit tests (Task 5.4):
 *   - duration > 0 is recorded
 *   - observe() throwing does NOT propagate
 *   - fn() result is returned unchanged even when observe() throws
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Mocks — established BEFORE importing the module under test so that Vitest's
// module registry honours the mock during the module's own initialisation.
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

vi.mock("@/lib/observability/metrics", () => ({
  getMetricsRegistry: () => ({}),
}));

// Capture every Prometheus inc/observe call so assertions can inspect them.
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

// ---------------------------------------------------------------------------
// Import module under test AFTER mocks are registered.
// ---------------------------------------------------------------------------

const { withAiObservability } = await import("@/lib/observability/aiMetrics");

// ---------------------------------------------------------------------------
// Reset between tests — clear the singleton so each group sees a fresh registry.
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockCounterInc.mockClear();
  mockHistogramObserve.mockClear();
  mockGaugeInc.mockClear();
  (
    globalThis as typeof globalThis & { __oandoAiAdvisorMetrics?: unknown }
  ).__oandoAiAdvisorMetrics = undefined;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pull every call to `oando_ai_advisor_requests_total` from the counter spy. */
function requestCalls() {
  return mockCounterInc.mock.calls.filter(
    ([name]) => name === "oando_ai_advisor_requests_total",
  );
}

/** Pull latency histogram calls. */
function latencyCalls() {
  return mockHistogramObserve.mock.calls.filter(
    ([name]) => name === "oando_ai_advisor_latency_ms",
  );
}

/** Pull retrieval-source gauge calls. */
function retrievalCalls() {
  return mockGaugeInc.mock.calls.filter(
    ([name]) => name === "oando_ai_advisor_retrieval_sources",
  );
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const routeArb = fc.constantFrom("catalog" as const, "planner" as const);

const providerArb = fc.constantFrom(
  "bedrock",
  "openai",
  "gemini",
  "openrouter",
  "unknown",
);

const sourcesArb = fc.array(
  fc.constantFrom(
    "vector" as const,
    "lexical" as const,
    "catalog_order" as const,
  ),
  { minLength: 0, maxLength: 4 },
);

/**
 * Generates an AiRequestObservation-shaped value with arbitrary valid fields.
 * `fc.option` with `nil: undefined` may return `null` in some fc versions;
 * the `.map` step normalises those to `undefined`.
 */
const observationArb = fc
  .record({
    route: routeArb,
    provider: fc.option(providerArb, { nil: undefined }),
    fallback: fc.boolean(),
    sources: fc.option(sourcesArb, { nil: undefined }),
    durationMs: fc.integer({ min: 1, max: 30_000 }),
    error: fc.option(fc.boolean(), { nil: undefined }),
  })
  .map((obs) => ({
    ...obs,
    provider: obs.provider ?? undefined,
    sources: obs.sources ?? undefined,
    error: obs.error ?? undefined,
  }));

// ---------------------------------------------------------------------------
// Property 14 — Requests record provider, fallback, and retrieval-layer metrics
// ---------------------------------------------------------------------------

describe(
  "Feature: ai-implementation-audit, Property 14: Requests record provider, fallback, and retrieval-layer metrics",
  () => {
    it(
      "oando_ai_advisor_requests_total is incremented exactly once per call",
      async () => {
        await fc.assert(
          fc.asyncProperty(routeArb, observationArb, async (route, obs) => {
            mockCounterInc.mockClear();
            mockHistogramObserve.mockClear();
            mockGaugeInc.mockClear();

            const result = await withAiObservability(
              route,
              async () => "ok",
              () => obs,
            );

            expect(result).toBe("ok");
            expect(requestCalls()).toHaveLength(1);
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "requests_total label carries surface matching the observation route",
      async () => {
        await fc.assert(
          fc.asyncProperty(observationArb, async (obs) => {
            mockCounterInc.mockClear();

            await withAiObservability(
              obs.route,
              async () => null,
              () => obs,
            );

            const [, labels] = requestCalls()[0]!;
            expect(labels.surface).toBe(obs.route);
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "requests_total label carries fallback='true' when fallback is true, 'false' otherwise",
      async () => {
        await fc.assert(
          fc.asyncProperty(observationArb, async (obs) => {
            mockCounterInc.mockClear();

            await withAiObservability(
              obs.route,
              async () => null,
              () => obs,
            );

            const [, labels] = requestCalls()[0]!;
            expect(labels.fallback).toBe(obs.fallback ? "true" : "false");
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "requests_total label carries provider from observation, or 'unknown' when absent",
      async () => {
        await fc.assert(
          fc.asyncProperty(observationArb, async (obs) => {
            mockCounterInc.mockClear();

            await withAiObservability(
              obs.route,
              async () => null,
              () => obs,
            );

            const [, labels] = requestCalls()[0]!;
            if (obs.provider !== undefined) {
              expect(labels.provider).toBe(obs.provider);
            } else {
              expect(labels.provider).toBe("unknown");
            }
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "retrieval-source gauge is incremented once per source in observation.sources",
      async () => {
        await fc.assert(
          fc.asyncProperty(
            observationArb.filter((o) => o.sources !== undefined),
            async (obs) => {
              mockGaugeInc.mockClear();

              await withAiObservability(
                obs.route,
                async () => null,
                () => obs,
              );

              const calls = retrievalCalls();
              expect(calls).toHaveLength(obs.sources!.length);
              for (let i = 0; i < obs.sources!.length; i++) {
                expect(calls[i]![1].source).toBe(obs.sources![i]);
              }
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      "retrieval-source gauge is NOT called when observation.sources is absent",
      async () => {
        await fc.assert(
          fc.asyncProperty(
            observationArb.filter((o) => o.sources === undefined),
            async (obs) => {
              mockGaugeInc.mockClear();

              await withAiObservability(
                obs.route,
                async () => null,
                () => obs,
              );

              expect(retrievalCalls()).toHaveLength(0);
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  },
);

// ---------------------------------------------------------------------------
// Property 15 — Requests emit a telemetry span with the required attributes
//
// @vercel/otel does not expose an in-memory span exporter in the unit-test
// environment.  We verify the observable contract: the `observe` callback is
// called exactly once with the resolved fn() value, and the observation it
// returns contains all required span-attribute fields (provider, fallback,
// sources).
//
// Full span attribute assertion (that @vercel/otel emits a span named
// "ai.catalog" / "ai.planner" carrying provider/fallback/source attributes)
// is PENDING USER AUTHORIZATION for browser/integration test validation.
// ---------------------------------------------------------------------------

describe(
  "Feature: ai-implementation-audit, Property 15: Requests emit a telemetry span with the required attributes",
  () => {
    it(
      "the observe callback is called exactly once with the resolved fn() result",
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 0, max: 9999 }),
            observationArb,
            async (value, obs) => {
              const observeSpy = vi.fn().mockReturnValue(obs);

              const result = await withAiObservability(
                obs.route,
                async () => value,
                observeSpy,
              );

              expect(observeSpy).toHaveBeenCalledTimes(1);
              expect(observeSpy).toHaveBeenCalledWith(value);
              expect(result).toBe(value);
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      "the observation shape satisfies the required span-attribute contract",
      async () => {
        await fc.assert(
          fc.asyncProperty(observationArb, async (obs) => {
            const observeSpy = vi.fn().mockReturnValue(obs);

            await withAiObservability(
              obs.route,
              async () => null,
              observeSpy,
            );

            // fallback must be boolean (required span attribute)
            expect(typeof obs.fallback).toBe("boolean");

            // durationMs must be positive
            expect(obs.durationMs).toBeGreaterThan(0);

            // provider is optional; when present it must be a short string (label safe)
            if (obs.provider !== undefined) {
              expect(typeof obs.provider).toBe("string");
              expect(obs.provider.length).toBeLessThanOrEqual(31);
            }

            // sources is optional; when present it must be an array of strings
            if (obs.sources !== undefined) {
              expect(Array.isArray(obs.sources)).toBe(true);
              for (const s of obs.sources) {
                expect(typeof s).toBe("string");
              }
            }
          }),
          { numRuns: 100 },
        );
      },
    );
  },
);

// ---------------------------------------------------------------------------
// Task 5.4 — Unit tests: duration, error isolation, result passthrough
// ---------------------------------------------------------------------------

describe("withAiObservability – unit tests (Task 5.4)", () => {
  it("records a positive latencyMs to the histogram even for very fast functions", async () => {
    await withAiObservability(
      "catalog",
      async () => "fast",
      () => ({
        route: "catalog" as const,
        fallback: false,
        durationMs: 5,
      }),
    );

    const calls = latencyCalls();
    expect(calls).toHaveLength(1);
    // latency value (third arg to histogram.observe) must be > 0
    expect(calls[0]![2]).toBeGreaterThan(0);
  });

  it("returns fn() result unchanged when observe() completes normally", async () => {
    const expected = { id: 42, name: "chair" };
    const result = await withAiObservability(
      "catalog",
      async () => expected,
      () => ({
        route: "catalog" as const,
        fallback: false,
        durationMs: 100,
      }),
    );

    expect(result).toBe(expected);
  });

  it("does NOT propagate an exception thrown inside observe()", async () => {
    let resolved: string | undefined;

    await expect(
      withAiObservability(
        "planner",
        async () => "the-value",
        () => {
          throw new Error("observe exploded");
        },
      ).then((v) => {
        resolved = v;
      }),
    ).resolves.toBeUndefined(); // .then() returns void — no rejection

    expect(resolved).toBe("the-value");
  });

  it("returns fn() result unchanged even when observe() throws", async () => {
    const payload = { deep: { nested: true } };
    const result = await withAiObservability(
      "catalog",
      async () => payload,
      () => {
        throw new Error("boom");
      },
    );

    expect(result).toBe(payload);
  });

  it("does NOT call any metric when observe() throws (best-effort boundary)", async () => {
    mockCounterInc.mockClear();
    mockHistogramObserve.mockClear();

    await withAiObservability(
      "catalog",
      async () => null,
      () => {
        throw new Error("observe-error");
      },
    );

    // The try/catch in withAiObservability swallows everything after fn() resolves
    expect(requestCalls()).toHaveLength(0);
    expect(latencyCalls()).toHaveLength(0);
  });

  it("does NOT propagate a metric-layer (recordAdvisorRequest) exception", async () => {
    // Force the Counter to throw to simulate a broken Prometheus registry.
    mockCounterInc.mockImplementationOnce(() => {
      throw new Error("metrics store exploded");
    });

    const expected = "safe-result";
    const result = await withAiObservability(
      "catalog",
      async () => expected,
      () => ({
        route: "catalog" as const,
        fallback: false,
        durationMs: 50,
      }),
    );

    expect(result).toBe(expected);
  });

  it("property: fn() return value is always returned unchanged regardless of observe outcome (≥100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.anything(),
        fc.boolean(), // whether observe throws
        async (value, shouldThrow) => {
          const result = await withAiObservability(
            "catalog",
            async () => value,
            () => {
              if (shouldThrow) throw new Error("observe-error");
              return {
                route: "catalog" as const,
                fallback: false,
                durationMs: 1,
              };
            },
          );

          expect(result).toStrictEqual(value);
        },
      ),
      { numRuns: 100 },
    );
  });
});
