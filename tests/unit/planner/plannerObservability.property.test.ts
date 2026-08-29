// @vitest-environment node
// Feature: planner-comprehensive-audit, Property 24: Correlation and privacy preservation
// Feature: planner-comprehensive-audit, Property 25: Observability failure isolation
// Validates: Requirements 17.1, 17.3, 17.4, 17.5, 17.6

import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";

import {
  createPlannerOperationEvent,
  plannerEventValues,
  plannerResultFromHttpStatus,
  type PlannerOperationEvent,
  type PlannerObservabilityDependencies,
} from "@/lib/observability/planner/plannerObservability";
import {
  observePlannerApiResponse,
  runObservedPlannerPersistence,
} from "@/lib/observability/planner/plannerObservabilityAdapters";

const PROPERTY_RUNS = 200;
const correlationArbitrary = fc.integer({ min: 0, max: 0x7fffffff }).map(
  (value) => `corr-${value.toString(36).padStart(8, "0")}`,
);
const prohibitedValueArbitrary = fc.oneof(
  fc.emailAddress(),
  fc.uuid(),
  fc.webUrl(),
  fc.string({ minLength: 24, maxLength: 80 }),
).filter((value) => value.length > 7);

function dependencies(
  exportEvent: (event: PlannerOperationEvent) => void,
  fallback: (event: PlannerOperationEvent) => void = () => undefined,
): PlannerObservabilityDependencies {
  return {
    exporter: { export: exportEvent },
    fallbackSink: { write: fallback },
    now: () => 25,
  };
}

describe("Property 24: Correlation and privacy preservation", () => {
  it("propagates one opaque id while generated prohibited values cannot enter the allowlisted event", async () => {
    await fc.assert(
      fc.asyncProperty(
        correlationArbitrary,
        fc.array(prohibitedValueArbitrary, { minLength: 1, maxLength: 8 }),
        async (correlationId, prohibitedValues) => {
          const events: PlannerOperationEvent[] = [];
          const deps = dependencies((event) => events.push(event));
          const response = new Response(null, {
            status: 200,
            headers: { "x-correlation-id": correlationId },
          });

          expect(
            observePlannerApiResponse(
              {
                operation: "planner.projects.get",
                method: "GET",
                startedAtMs: 10,
                authorizationProtected: true,
                response,
              },
              deps,
            ),
          ).toBe(response);

          const persistenceValue = { correlationId, stable: true };
          await expect(
            runObservedPlannerPersistence(
              {
                operation: "planner.persistence.load",
                mode: "disk",
                correlationId,
                execute: async () => persistenceValue,
              },
              deps,
            ),
          ).resolves.toBe(persistenceValue);

          expect(events).toHaveLength(2);
          expect(events.map((event) => event.correlationId)).toEqual([
            correlationId,
            correlationId,
          ]);
          const serialized = JSON.stringify(events);
          for (const prohibited of prohibitedValues) {
            expect(serialized).not.toContain(prohibited);
          }
          expect(Object.keys(events[0]).sort()).toEqual([
            "correlationId",
            "durationMs",
            "eventName",
            "method",
            "operation",
            "persistenceMode",
            "result",
            "status",
          ]);
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 24_202_608, endOnFailure: true },
    );
  });

  it("bounds every non-enum value accepted by the event contract", () => {
    fc.assert(
      fc.property(correlationArbitrary, fc.double({ noNaN: false }), (correlationId, durationMs) => {
        const event = createPlannerOperationEvent({
          operation: "planner.projects.list",
          method: "GET",
          result: "success",
          status: "2xx",
          persistenceMode: "not-applicable",
          durationMs,
          correlationId,
        });
        expect(event.durationMs).toBeGreaterThanOrEqual(0);
        expect(event.durationMs).toBeLessThanOrEqual(300_000);
        expect(plannerEventValues(event)).not.toContain(undefined);
        expect(plannerResultFromHttpStatus(404, true)).toBe("authorization-denied");
        expect(plannerResultFromHttpStatus(404, false)).toBe("rejected");
      }),
      { numRuns: PROPERTY_RUNS, seed: 24_202_609, endOnFailure: true },
    );
  });
});

describe("Property 25: Observability failure isolation", () => {
  it("preserves generated user and persistence outcomes and sends the identical redacted event to fallback", async () => {
    await fc.assert(
      fc.asyncProperty(
        correlationArbitrary,
        fc.oneof(fc.integer(), fc.string(), fc.boolean(), fc.constant(null)),
        async (correlationId, operationValue) => {
          const primaryEvents: PlannerOperationEvent[] = [];
          const fallbackEvents: PlannerOperationEvent[] = [];
          const deps = dependencies(
            (event) => {
              primaryEvents.push(event);
              throw new Error("export unavailable");
            },
            (event) => fallbackEvents.push(event),
          );
          const response = new Response(null, {
            status: 503,
            headers: { "x-correlation-id": correlationId },
          });
          expect(
            observePlannerApiResponse(
              {
                operation: "planner.projects.update",
                method: "PATCH",
                startedAtMs: 20,
                authorizationProtected: true,
                response,
              },
              deps,
            ),
          ).toBe(response);
          await expect(
            runObservedPlannerPersistence({
              operation: "planner.persistence.save",
              mode: "supabase",
              correlationId,
              execute: async () => operationValue,
            }, deps),
          ).resolves.toBe(operationValue);
          expect(primaryEvents).toHaveLength(2);
          expect(fallbackEvents).toHaveLength(2);
          expect(fallbackEvents[0]).toBe(primaryEvents[0]);
          expect(fallbackEvents[1]).toBe(primaryEvents[1]);
          expect(fallbackEvents.every(Object.isFrozen)).toBe(true);
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 25_202_608, endOnFailure: true },
    );
  });

  it("rethrows the exact persistence failure even when both sinks fail", async () => {
    const failure = new Error("opaque persistence failure");
    const deps = dependencies(
      () => { throw new Error("primary failed"); },
      () => { throw new Error("fallback failed"); },
    );
    const execute = vi.fn(async () => { throw failure; });
    await expect(runObservedPlannerPersistence({
      operation: "planner.persistence.delete",
      mode: "disk",
      correlationId: "corr-00000001",
      execute,
    }, deps)).rejects.toBe(failure);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
