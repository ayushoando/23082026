import {
  PLANNER_CORRELATION_HEADER,
  recordPlannerOperationSafely,
  plannerResultFromHttpStatus,
  plannerStatusClass,
  type PlannerObservabilityDependencies,
  type PlannerObservedOperation,
  type PlannerPersistenceOperation,
} from "./plannerObservability";
import type { PlannerHttpMethod } from "@planner/lib/plannerEndpointContract";
import type { PlannerPersistenceMode } from "@planner/lib/plannerPersistenceMode";

export interface ObservePlannerApiResponseInput {
  readonly operation: PlannerObservedOperation;
  readonly method: PlannerHttpMethod;
  readonly startedAtMs: number;
  readonly authorizationProtected: boolean;
  readonly response: Response;
}

export interface ObservePlannerPersistenceInput<T> {
  readonly operation: PlannerPersistenceOperation;
  readonly mode: PlannerPersistenceMode;
  readonly correlationId: string;
  readonly execute: () => Promise<T>;
}

function elapsedMs(startedAtMs: number, now: () => number): number {
  return Math.max(0, now() - startedAtMs);
}

/** Observe a completed API response without reading or replacing its body. */
export function observePlannerApiResponse(
  input: ObservePlannerApiResponseInput,
  dependencies: PlannerObservabilityDependencies,
): Response {
  const correlationId =
    input.response.headers.get(PLANNER_CORRELATION_HEADER) ?? "";
  recordPlannerOperationSafely({
    operation: input.operation,
    method: input.method,
    result: plannerResultFromHttpStatus(
      input.response.status,
      input.authorizationProtected,
    ),
    status: plannerStatusClass(input.response.status),
    persistenceMode: "not-applicable",
    durationMs: elapsedMs(input.startedAtMs, dependencies.now ?? Date.now),
    correlationId,
  }, dependencies);
  return input.response;
}

/**
 * Observe exactly one selected persistence operation. The original result or
 * thrown value is preserved even when primary and fallback export both fail.
 */
export async function runObservedPlannerPersistence<T>(
  input: ObservePlannerPersistenceInput<T>,
  dependencies: PlannerObservabilityDependencies,
): Promise<T> {
  const now = dependencies.now ?? Date.now;
  const startedAtMs = now();
  try {
    const value = await input.execute();
    recordPlannerOperationSafely({
      operation: input.operation,
      method: "INTERNAL",
      result: "success",
      status: "not-applicable",
      persistenceMode: input.mode,
      durationMs: elapsedMs(startedAtMs, now),
      correlationId: input.correlationId,
    }, dependencies);
    return value;
  } catch (error) {
    recordPlannerOperationSafely({
      operation: input.operation,
      method: "INTERNAL",
      result: "persistence-failure",
      status: "not-applicable",
      persistenceMode: input.mode,
      durationMs: elapsedMs(startedAtMs, now),
      correlationId: input.correlationId,
    }, dependencies);
    throw error;
  }
}
