// @vitest-environment node
// Feature: planner-comprehensive-audit, Property 24: Correlation and privacy preservation
// Feature: planner-comprehensive-audit, Property 25: Observability failure isolation
// Validates: Requirements 17.1, 17.3, 17.4, 17.5, 17.6

import { register } from "@prometheus-io/client";
import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";

import {
  PLANNER_CORRELATION_HEADER,
  PLANNER_OBSERVABILITY_ALLOWED_FIELDS,
  PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES,
  createPlannerOperationEvent,
  exportPlannerOperationSafely,
  plannerEventValues,
  plannerResultFromHttpStatus,
  redactPlannerOperationEvent,
  type PlannerObservedOperation,
  type PlannerOperationEvent,
  type PlannerObservabilityDependencies,
} from "@/lib/observability/planner/plannerObservability";
import {
  observePlannerApiResponse,
  runObservedPlannerPersistence,
} from "@/lib/observability/planner/plannerObservabilityAdapters";

vi.mock("server-only", () => ({}));

const { plannerFallbackSink, plannerPrometheusExporter } = await import(
  "@/lib/observability/planner/plannerObservabilityExporter.server"
);

const PROPERTY_RUNS = 200;
const correlationArbitrary = fc.uuid().map(
  (value) => `corr-${value.replace(/-/g, "")}`,
);
const operationArbitrary = fc.constantFrom<PlannerObservedOperation>(
  "planner.catalog.list",
  "planner.catalog.upload",
  "planner.handoff.create",
  "planner.projects.list",
  "planner.projects.create",
  "planner.projects.get",
  "planner.projects.update",
  "planner.projects.delete",
  "planner.ai-advisor",
  "planner.sketch-to-plan.convert",
  "planner.persistence.list",
  "planner.persistence.create",
  "planner.persistence.load",
  "planner.persistence.save",
  "planner.persistence.delete",
  "planner.persistence.handoff",
);

function taggedValue(tag: string): fc.Arbitrary<string> {
  return fc.uuid().map((value) => `${tag}-${value}`);
}

interface ProhibitedValues {
  readonly contactData: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly projectContent: string;
  readonly geometry: string;
  readonly requestBody: string;
  readonly token: string;
  readonly cookies: string;
  readonly credentials: string;
  readonly secret: string;
  readonly freeFormError: string;
  readonly identifierBearingUrl: string;
}

const prohibitedValuesArbitrary: fc.Arbitrary<ProhibitedValues> = fc.record({
  contactData: taggedValue("contact"),
  ownerId: taggedValue("owner"),
  projectId: taggedValue("project-id"),
  projectName: taggedValue("project-name"),
  projectContent: taggedValue("project-content"),
  geometry: taggedValue("geometry"),
  requestBody: taggedValue("request-body").map((value) =>
    JSON.stringify({ contact: value, geometry: value }),
  ),
  token: taggedValue("token").map((value) => `Bearer ${value}`),
  cookies: taggedValue("cookie").map((value) => `sb-auth-token=${value}`),
  credentials: taggedValue("credential").map((value) => `client-secret:${value}`),
  secret: taggedValue("secret"),
  freeFormError: taggedValue("error").map((value) => `Error: ${value}`),
  identifierBearingUrl: taggedValue("url").map(
    (value) => `https://planner.example/projects/${value}`,
  ),
});

function dependencies(
  exportEvent: (event: PlannerOperationEvent) => void,
  fallback: (event: PlannerOperationEvent) => void = () => undefined,
  now: () => number = () => 25,
): PlannerObservabilityDependencies {
  return {
    exporter: { export: exportEvent },
    fallbackSink: { write: fallback },
    now,
  };
}

function buildUntrustedEvent(
  event: PlannerOperationEvent,
  prohibited: ProhibitedValues,
): Record<string, unknown> {
  return {
    ...event,
    contactData: prohibited.contactData,
    ownerId: prohibited.ownerId,
    projectId: prohibited.projectId,
    projectName: prohibited.projectName,
    projectContent: prohibited.projectContent,
    geometry: prohibited.geometry,
    requestBody: prohibited.requestBody,
    token: prohibited.token,
    cookies: prohibited.cookies,
    credentials: prohibited.credentials,
    secret: prohibited.secret,
    error: prohibited.freeFormError,
    url: prohibited.identifierBearingUrl,
    nested: {
      contact: prohibited.contactData,
      owner: prohibited.ownerId,
      project: {
        id: prohibited.projectId,
        name: prohibited.projectName,
        content: prohibited.projectContent,
        geometry: prohibited.geometry,
      },
      request: prohibited.requestBody,
      authorization: prohibited.token,
      cookie: prohibited.cookies,
      credentials: prohibited.credentials,
      secret: prohibited.secret,
      error: prohibited.freeFormError,
      url: prohibited.identifierBearingUrl,
    },
    labels: {
      ownerId: prohibited.ownerId,
      projectId: prohibited.projectId,
      url: prohibited.identifierBearingUrl,
    },
  };
}

function expectNoProhibitedValues(
  value: unknown,
  prohibited: ProhibitedValues,
): void {
  const serialized = JSON.stringify(value) ?? "";
  for (const prohibitedValue of Object.values(prohibited)) {
    expect(serialized).not.toContain(prohibitedValue);
  }
}

function expectAllowlistedEvent(event: PlannerOperationEvent): void {
  expect(Object.keys(event).sort()).toEqual(
    [...PLANNER_OBSERVABILITY_ALLOWED_FIELDS].sort(),
  );
  expect(plannerEventValues(event)).not.toContain(undefined);
}

describe("Property 24: Correlation and privacy preservation", () => {
  it("propagates one opaque id while generated prohibited values stay out of events, labels, logs, and fallback payloads", async () => {
    const observedEvents: PlannerOperationEvent[] = [];
    const fallbackEvents: PlannerOperationEvent[] = [];
    const generatedProhibitedValues: string[] = [];
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      await fc.assert(
        fc.asyncProperty(
          operationArbitrary,
          correlationArbitrary,
          prohibitedValuesArbitrary,
          async (operation, correlationId, prohibited) => {
            generatedProhibitedValues.push(...Object.values(prohibited));
            const coreEvent = createPlannerOperationEvent({
              operation,
              method: "GET",
              result: "success",
              status: "2xx",
              persistenceMode: "not-applicable",
              durationMs: 15,
              correlationId,
            });
            const untrustedEvent = buildUntrustedEvent(coreEvent, prohibited);
            const safeEvent = redactPlannerOperationEvent(untrustedEvent);
            expectAllowlistedEvent(safeEvent);
            expectNoProhibitedValues(safeEvent, prohibited);

            const eventStart = observedEvents.length;
            exportPlannerOperationSafely(
              untrustedEvent,
              dependencies((event) => observedEvents.push(event)),
            );

            const response = new Response(
              JSON.stringify({ success: false, error: prohibited.freeFormError }),
              {
                status: 503,
                headers: { [PLANNER_CORRELATION_HEADER]: correlationId },
              },
            );
            const observedResponse = observePlannerApiResponse(
              {
                operation: "planner.projects.get",
                method: "GET",
                startedAtMs: 10,
                authorizationProtected: true,
                response,
              },
              dependencies((event) => observedEvents.push(event)),
            );
            expect(observedResponse).toBe(response);
            expect(response.headers.get(PLANNER_CORRELATION_HEADER)).toBe(
              correlationId,
            );

            const persistenceResult = {
              ok: true,
              projectContent: prohibited.projectContent,
            };
            await expect(
              runObservedPlannerPersistence(
                {
                  operation: "planner.persistence.load",
                  mode: "disk",
                  correlationId,
                  execute: async () => persistenceResult,
                },
                dependencies((event) => observedEvents.push(event)),
              ),
            ).resolves.toBe(persistenceResult);

            const iterationEvents = observedEvents.slice(eventStart);
            expect(iterationEvents).toHaveLength(3);
            expect(iterationEvents.map((event) => event.correlationId)).toEqual([
              correlationId,
              correlationId,
              correlationId,
            ]);
            for (const event of iterationEvents) {
              expectAllowlistedEvent(event);
              expectNoProhibitedValues(event, prohibited);
            }

            const fallbackStart = fallbackEvents.length;
            exportPlannerOperationSafely(untrustedEvent, {
              exporter: {
                export: () => {
                  throw new Error("exporter unavailable");
                },
              },
              fallbackSink: {
                write: (event) => fallbackEvents.push(event),
              },
            });
            const fallbackEvent = fallbackEvents.at(fallbackStart);
            expect(fallbackEvent).toBeDefined();
            if (fallbackEvent) {
              expect(fallbackEvent.correlationId).toBe(correlationId);
              expectAllowlistedEvent(fallbackEvent);
              expectNoProhibitedValues(fallbackEvent, prohibited);
            }

            const infoStart = infoSpy.mock.calls.length;
            plannerPrometheusExporter.export(safeEvent);
            const infoCalls = infoSpy.mock.calls.slice(infoStart);
            expect(infoCalls).toHaveLength(1);
            expectNoProhibitedValues(infoCalls, prohibited);

            const errorStart = errorSpy.mock.calls.length;
            plannerFallbackSink.write(safeEvent);
            const errorCalls = errorSpy.mock.calls.slice(errorStart);
            expect(errorCalls).toHaveLength(1);
            expectNoProhibitedValues(errorCalls, prohibited);
          },
        ),
        { numRuns: PROPERTY_RUNS, seed: 24_202_608, endOnFailure: true },
      );

      const plannerMetrics = (await register.getMetricsAsJSON()).filter((metric) =>
        metric.name.startsWith("oando_planner_"),
      );
      expect(plannerMetrics.length).toBeGreaterThan(0);
      const allowedLabelNames = new Set<string>(
        PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES,
      );
      for (const metric of plannerMetrics) {
        for (const sample of metric.values) {
          expect(
            Object.keys(sample.labels).every(
              (labelName) => labelName === "le" || allowedLabelNames.has(labelName),
            ),
          ).toBe(true);
          expect(sample.labels).not.toHaveProperty("correlationId");
        }
      }
      const serializedPlannerMetrics = JSON.stringify(plannerMetrics) ?? "";
      for (const prohibitedValue of generatedProhibitedValues) {
        expect(serializedPlannerMetrics).not.toContain(prohibitedValue);
      }
    } finally {
      infoSpy.mockRestore();
      errorSpy.mockRestore();
    }
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
  interface PersistenceSuccess {
    readonly kind: "success";
    readonly value: {
      readonly payload: string;
      readonly revision: number;
    };
  }

  interface PersistenceFailure {
    readonly kind: "failure";
    readonly error: Error;
  }

  type PersistenceOutcome = PersistenceSuccess | PersistenceFailure;

  const responseOutcomeArbitrary = fc.record({
    status: fc.constantFrom(200, 201, 400, 401, 403, 404, 409, 429, 500, 503),
    body: fc.string({ maxLength: 120 }),
  });
  const persistenceOutcomeArbitrary: fc.Arbitrary<PersistenceOutcome> = fc.oneof(
    fc.record({
      kind: fc.constant("success" as const),
      value: fc.record({
        payload: fc.string({ maxLength: 120 }),
        revision: fc.integer(),
      }),
    }),
    fc.string({ maxLength: 120 }).map(
      (message): PersistenceFailure => ({
        kind: "failure",
        error: new Error(message),
      }),
    ),
  );

  it("preserves generated API responses and persistence values/errors when primary export fails and fallback failure is swallowed", async () => {
    await fc.assert(
      fc.asyncProperty(
        correlationArbitrary,
        responseOutcomeArbitrary,
        persistenceOutcomeArbitrary,
        fc.boolean(),
        async (correlationId, responseOutcome, persistenceOutcome, fallbackFails) => {
          const primaryEvents: PlannerOperationEvent[] = [];
          const fallbackEvents: PlannerOperationEvent[] = [];
          const exportOrder: string[] = [];
          const primaryExporter = vi.fn((event: PlannerOperationEvent): void => {
            exportOrder.push("primary");
            primaryEvents.push(event);
            throw new Error("primary exporter unavailable");
          });
          const fallbackSink = vi.fn((event: PlannerOperationEvent): void => {
            exportOrder.push("fallback");
            fallbackEvents.push(event);
            if (fallbackFails) throw new Error("fallback sink unavailable");
          });
          const deps = dependencies(primaryExporter, fallbackSink);
          const response = new Response(responseOutcome.body, {
            status: responseOutcome.status,
            headers: {
              [PLANNER_CORRELATION_HEADER]: correlationId,
              "content-type": "text/plain",
            },
          });
          const expectedResponseBody = await response.clone().text();

          const observedResponse = observePlannerApiResponse(
            {
              operation: "planner.projects.update",
              method: "PATCH",
              startedAtMs: 20,
              authorizationProtected: true,
              response,
            },
            deps,
          );
          expect(observedResponse).toBe(response);
          expect(observedResponse.status).toBe(responseOutcome.status);
          expect(
            observedResponse.headers.get(PLANNER_CORRELATION_HEADER),
          ).toBe(correlationId);
          expect(await observedResponse.clone().text()).toBe(expectedResponseBody);

          const execute = vi.fn(async () => {
            if (persistenceOutcome.kind === "success") {
              return persistenceOutcome.value;
            }
            throw persistenceOutcome.error;
          });
          const observedPersistence = runObservedPlannerPersistence(
            {
              operation: "planner.persistence.save",
              mode: "supabase",
              correlationId,
              execute,
            },
            deps,
          );
          if (persistenceOutcome.kind === "success") {
            await expect(observedPersistence).resolves.toBe(
              persistenceOutcome.value,
            );
          } else {
            await expect(observedPersistence).rejects.toBe(
              persistenceOutcome.error,
            );
          }
          expect(execute).toHaveBeenCalledTimes(1);

          expect(primaryExporter).toHaveBeenCalledTimes(2);
          expect(fallbackSink).toHaveBeenCalledTimes(2);
          expect(exportOrder).toEqual([
            "primary",
            "fallback",
            "primary",
            "fallback",
          ]);
          expect(fallbackEvents).toHaveLength(primaryEvents.length);
          primaryEvents.forEach((primaryEvent, index) => {
            const fallbackEvent = fallbackEvents[index];
            expect(fallbackEvent).toBeDefined();
            expect(fallbackEvent).toBe(primaryEvent);
            if (fallbackEvent) {
              expect(fallbackEvent.correlationId).toBe(correlationId);
              expect(Object.isFrozen(fallbackEvent)).toBe(true);
              expectAllowlistedEvent(fallbackEvent);
            }
          });
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
