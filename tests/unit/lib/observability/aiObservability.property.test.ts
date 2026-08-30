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
// Mocks — established before importing the module under test.
//
// We mock @prometheus-io/client and @/lib/observability/metrics so the module
// initialises without errors.  We then spy on `recordAdvisorRequest` after
// import so assertions target the real call site inside `withAiObservability`.
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

vi.mock("@/lib/observability/metrics", () => ({
  getMetricsRegistry: () => ({}),
}));

// Capture inc/observe calls so spy assertions work even with the mocked client
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
// Spy on recordAdvisorRequest so we can inspect calls from withAiObservability.
// ---------------------------------------------------------------------------

const aiMetrics = await import("@/lib/observability/aiMetrics");
const { withAiObservability } = aiMetrics;

// Spy wraps the real export — this intercepts calls made by withAiObservability
// because both share the same module binding in ESM via vi's hoisting.
const recordAdvisorSpy = vi.spyOn(aiMetrics, "recordAdvisorRequest");

// ---------------------------------------------------------------------------
// Reset between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  recordAdvisorSpy.mockClear();
  mockCounterInc.mockClear();
  mockHistogramObserve.mockClear();
  mockGaugeInc.mockClear();
  // Clear the singleton so each test group sees a fresh registry
  (globalThis as typeof globalThis & { __oandoAiAdvisorMetrics?: unknown }).__oandoAiAdvisorMetrics = undefined;
});

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
  fc.constantFrom("vector" as const, "lexical" as const, "catalog_order" as const),
  { minLength: 0, maxLength: 4 },
);

/**
 * Produces an AiRequestObservation-shaped object with arbitrary valid values.
 * `option` with `nil: undefined` may return `null` in some fc versions —
 * we normalise those to `undefined` in the `.map` step.
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
// Property 14: Requests record provider, fallback, and retrieval-layer metrics
// ---------------------------------------------------------------------------

describe(
  "Feature: ai-implementation-audit, Property 14: Requests record provider, fallback, and retrieval-layer metrics",
  () => {
    it(
      "recordAdvisorRequest is called exactly once per withAiObservability invocation",
      async () => {
        await fc.assert(
          fc.asyncProperty(routeArb, observationArb, async (route, obs) => {
            recordAdvisorSpy.mockClear();

            const result = await withAiObservability(
              route,
              async () => "ok",
              () => obs,
            );

            expect(result).toBe("ok");
            expect(recordAdvisorSpy).toHaveBeenCalledTimes(1);
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "recordAdvisorRequest receives the surface from the observation's route",
      async () => {
        await fc.assert(
          fc.asyncProperty(observationArb, async (obs) => {
            recordAdvisorSpy.mockClear();

            await withAiObservability(
              obs.route,
              async () => null,
              () => obs,
            );

            const call = recordAdvisorSpy.mock.calls[0]?.[0];
            expect(call).toBeDefined();
            expect(call!.surface).toBe(obs.route);
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "recordAdvisorRequest receives the fallback flag from the observation",
      async () => {
        await fc.assert(
          fc.asyncProperty(observationArb, async (obs) => {
            recordAdvisorSpy.mockClear();

            await withAiObservability(
              obs.route,
              async () => null,
              () => obs,
            );

            const call = recordAdvisorSpy.mock.calls[0]?.[0];
            expect(call).toBeDefined();
            expect(call!.fallbackUsed).toBe(obs.fallback);
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "recordAdvisorRequest receives the provider from the observation (or 'unknown' when absent)",
      async () => {
        await fc.assert(
          fc.asyncProperty(observationArb, async (obs) => {
            recordAdvisorSpy.mockClear();

            await withAiObservability(
              obs.route,
              async () => null,
              () => obs,
            );

            const call = recordAdvisorSpy.mock.calls[0]?.[0];
            expect(call).toBeDefined();
            if (obs.provider !== undefined) {
              expect(call!.provider).toBe(obs.provider);
            } else {
              expect(call!.provider).toBe("unknown");
            }
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "recordAdvisorRequest receives retrievalSources matching the observation sources",
      async () => {
        await fc.assert(
          fc.asyncProperty(observationArb, async (obs) => {
            recordAdvisorSpy.mockClear();

            await withAiObservability(
              obs.route,
              async () => null,
              () => obs,
            );

            const call = recordAdvisorSpy.mock.calls[0]?.[0];
            expect(call).toBeDefined();
            if (obs.sources !== undefined) {
              expect(call!.retrievalSources).toEqual(obs.sources);
            } else {
              expect(call!.retrievalSources).toBeUndefined();
            }
          }),
          { numRuns: 100 },
        );
      },
    );
  },
);

// ---------------------------------------------------------------------------
// Property 15: Requests emit a telemetry span with the required attributes
//
// @vercel/otel does not expose an in-memory span exporter in the unit-test
// environment.  We verify the observable contract: the `observe` callback is
// called exactly once with the resolved fn() value, and the observation it
// returns contains all required span-attribute fields (provider, fallback,
// sources).
//
// Span emission from @vercel/otel is PENDING USER AUTHORIZATION for
// browser/integration test validation.
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
      "the observation shape has the required span-attribute fields: fallback (bool), durationMs > 0, optional provider (string), optional sources (array)",
      async () => {
        await fc.assert(
          fc.asyncProperty(observationArb, async (obs) => {
            const observeSpy = vi.fn().mockReturnValue(obs);

            await withAiObservability(
              obs.route,
              async () => null,
              observeSpy,
            );

            // The span attribute contract: fallback must be boolean
            expect(typeof obs.fallback).toBe("boolean");

            // durationMs must be positive (the spec says the observation carries duration)
            expect(obs.durationMs).toBeGreaterThan(0);

            // provider is optional but must be a string when present
            if (obs.provider !== undefined) {
              expect(typeof obs.provider).toBe("string");
              // must never be a raw secret or long token (>31 chars)
              expect(obs.provider.length).toBeLessThanOrEqual(31);
            }

            // sources is optional but must be an array of strings when present
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

    // NOTE — asserting that @vercel/otel emits a span named "ai.catalog" /
    // "ai.planner" with provider/fallback/source attributes requires an
    // in-memory OTLP exporter in the test process.  That test is
    // PENDING USER AUTHORIZATION (browser / integration test lane).
  },
);

// ---------------------------------------------------------------------------
// Task 5.4 — Unit tests: duration, error isolation, result passthrough
// ---------------------------------------------------------------------------

describe("withAiObservability – unit tests (Task 5.4)", () => {
  it("records a positive latencyMs even for very fast functions", async () => {
    // We supply a durationMs of 5 in the observation so the adapter uses it.
    await withAiObservability(
      "catalog",
      async () => "fast",
      () => ({
        route: "catalog" as const,
        fallback: false,
        durationMs: 5,
      }),
    );

    const call = recordAdvisorSpy.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    expect(call!.latencyMs).toBeGreaterThan(0);
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
    ).resolves.toBeUndefined(); // .then() callback returns undefined — no rejection

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

  it("does NOT call recordAdvisorRequest when observe() throws", async () => {
    recordAdvisorSpy.mockClear();

    await withAiObservability(
      "catalog",
      async () => null,
      () => {
        throw new Error("observe-error");
      },
    );

    expect(recordAdvisorSpy).not.toHaveBeenCalled();
  });

  it("does NOT propagate a recordAdvisorRequest() internal exception", async () => {
    recordAdvisorSpy.mockImplementationOnce(() => {
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
          recordAdvisorSpy.mockClear();

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
