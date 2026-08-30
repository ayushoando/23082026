import {
  PLANNER_ENDPOINT_DESCRIPTORS,
  type PlannerEndpointId,
  type PlannerHttpMethod,
} from "@planner/lib/plannerEndpointContract";
import type { PlannerPersistenceMode } from "@planner/lib/plannerPersistenceMode";

export const PLANNER_OBSERVABILITY_EVENT_NAME = "planner.operation.completed" as const;
export const PLANNER_CORRELATION_HEADER = "x-correlation-id" as const;
export const PLANNER_OBSERVABILITY_MAX_DURATION_MS = 300_000;

/**
 * These are the only fields permitted in a Planner operation event. Keep this
 * list separate from the TypeScript interface because event values can cross a
 * runtime boundary before they reach an exporter.
 */
export const PLANNER_OBSERVABILITY_ALLOWED_FIELDS = [
  "eventName",
  "operation",
  "method",
  "result",
  "status",
  "persistenceMode",
  "durationMs",
  "correlationId",
] as const;

/** Bounded metric labels; correlation ids intentionally never become labels. */
export const PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES = [
  "operation",
  "method",
  "result",
  "status",
  "persistence_mode",
] as const;

export const PLANNER_PERSISTENCE_OPERATIONS = [
  "planner.persistence.list",
  "planner.persistence.create",
  "planner.persistence.load",
  "planner.persistence.save",
  "planner.persistence.delete",
  "planner.persistence.handoff",
] as const;

export type PlannerPersistenceOperation =
  (typeof PLANNER_PERSISTENCE_OPERATIONS)[number];
export type PlannerObservedOperation =
  | PlannerEndpointId
  | PlannerPersistenceOperation;
export type PlannerObservedMethod = PlannerHttpMethod | "INTERNAL";
export type PlannerObservedResult =
  | "success"
  | "rejected"
  | "rate-limited"
  | "authorization-denied"
  | "persistence-failure"
  | "error";
export type PlannerObservedStatus =
  | "2xx"
  | "4xx"
  | "5xx"
  | "other"
  | "not-applicable";
export type PlannerObservedPersistenceMode =
  | PlannerPersistenceMode
  | "not-applicable";

export interface PlannerOperationEvent {
  readonly eventName: typeof PLANNER_OBSERVABILITY_EVENT_NAME;
  readonly operation: PlannerObservedOperation;
  readonly method: PlannerObservedMethod;
  readonly result: PlannerObservedResult;
  readonly status: PlannerObservedStatus;
  readonly persistenceMode: PlannerObservedPersistenceMode;
  readonly durationMs: number;
  readonly correlationId: string;
}

export interface PlannerOperationEventInput {
  readonly operation: PlannerObservedOperation;
  readonly method: PlannerObservedMethod;
  readonly result: PlannerObservedResult;
  readonly status: PlannerObservedStatus;
  readonly persistenceMode: PlannerObservedPersistenceMode;
  readonly durationMs: number;
  readonly correlationId: string;
}

export interface PlannerObservabilityExporter {
  export(event: PlannerOperationEvent): void;
}

export interface PlannerObservabilityFallbackSink {
  write(event: PlannerOperationEvent): void;
}

export interface PlannerObservabilityDependencies {
  readonly exporter: PlannerObservabilityExporter;
  readonly fallbackSink: PlannerObservabilityFallbackSink;
  readonly now?: () => number;
}

const PLANNER_ENDPOINT_OPERATION_SET = new Set<string>(
  PLANNER_ENDPOINT_DESCRIPTORS.map(({ id }) => id),
);
const PLANNER_PERSISTENCE_OPERATION_SET = new Set<string>(
  PLANNER_PERSISTENCE_OPERATIONS,
);
const PLANNER_METHOD_SET = new Set<string>([
  "GET",
  "POST",
  "PATCH",
  "DELETE",
  "INTERNAL",
]);
const PLANNER_RESULT_SET = new Set<string>([
  "success",
  "rejected",
  "rate-limited",
  "authorization-denied",
  "persistence-failure",
  "error",
]);
const PLANNER_STATUS_SET = new Set<string>([
  "2xx",
  "4xx",
  "5xx",
  "other",
  "not-applicable",
]);
const PLANNER_PERSISTENCE_MODE_SET = new Set<string>([
  "disk",
  "supabase",
  "not-applicable",
]);
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._~-]{8,64}$/;

function isApprovedEnumValue(
  value: unknown,
  approvedValues: ReadonlySet<string>,
): value is string {
  return typeof value === "string" && approvedValues.has(value);
}

function isPlannerObservedOperation(
  value: unknown,
): value is PlannerObservedOperation {
  return (
    isApprovedEnumValue(value, PLANNER_ENDPOINT_OPERATION_SET) ||
    isApprovedEnumValue(value, PLANNER_PERSISTENCE_OPERATION_SET)
  );
}

function isPlannerObservedMethod(value: unknown): value is PlannerObservedMethod {
  return isApprovedEnumValue(value, PLANNER_METHOD_SET);
}

function isPlannerObservedResult(value: unknown): value is PlannerObservedResult {
  return isApprovedEnumValue(value, PLANNER_RESULT_SET);
}

function isPlannerObservedStatus(value: unknown): value is PlannerObservedStatus {
  return isApprovedEnumValue(value, PLANNER_STATUS_SET);
}

function isPlannerObservedPersistenceMode(
  value: unknown,
): value is PlannerObservedPersistenceMode {
  return isApprovedEnumValue(value, PLANNER_PERSISTENCE_MODE_SET);
}

export function isPlannerCorrelationId(value: unknown): value is string {
  return typeof value === "string" && CORRELATION_ID_PATTERN.test(value);
}

export function clampPlannerDuration(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs < 0) return 0;
  return Math.min(
    PLANNER_OBSERVABILITY_MAX_DURATION_MS,
    Math.round(durationMs * 1_000) / 1_000,
  );
}

export function plannerStatusClass(status: number): PlannerObservedStatus {
  if (!Number.isInteger(status) || status < 100 || status > 599) return "other";
  if (status >= 200 && status < 300) return "2xx";
  if (status >= 400 && status < 500) return "4xx";
  if (status >= 500) return "5xx";
  return "other";
}

export function plannerResultFromHttpStatus(
  status: number,
  authorizationProtected = false,
): PlannerObservedResult {
  if (status >= 200 && status < 300) return "success";
  if (status === 429) return "rate-limited";
  if (
    status === 401 ||
    status === 403 ||
    (status === 404 && authorizationProtected)
  ) {
    return "authorization-denied";
  }
  if (status >= 400 && status < 500) return "rejected";
  return "error";
}

export function createPlannerOperationEvent(
  input: PlannerOperationEventInput,
): PlannerOperationEvent {
  if (
    !isPlannerObservedOperation(input.operation) ||
    !isPlannerObservedMethod(input.method) ||
    !isPlannerObservedResult(input.result) ||
    !isPlannerObservedStatus(input.status) ||
    !isPlannerObservedPersistenceMode(input.persistenceMode) ||
    !isPlannerCorrelationId(input.correlationId)
  ) {
    throw new Error("Planner observability event contains an unapproved value");
  }
  return Object.freeze({
    eventName: PLANNER_OBSERVABILITY_EVENT_NAME,
    operation: input.operation,
    method: input.method,
    result: input.result,
    status: input.status,
    persistenceMode: input.persistenceMode,
    durationMs: clampPlannerDuration(input.durationMs),
    correlationId: input.correlationId,
  });
}

/**
 * Runtime shape check for events crossing an instrumentation/export boundary.
 * Extra properties are deliberately ignored and removed by the redactor.
 */
export function isPlannerOperationEvent(
  value: unknown,
): value is PlannerOperationEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.eventName === PLANNER_OBSERVABILITY_EVENT_NAME &&
    isPlannerObservedOperation(candidate.operation) &&
    isPlannerObservedMethod(candidate.method) &&
    isPlannerObservedResult(candidate.result) &&
    isPlannerObservedStatus(candidate.status) &&
    isPlannerObservedPersistenceMode(candidate.persistenceMode) &&
    typeof candidate.durationMs === "number" &&
    isPlannerCorrelationId(candidate.correlationId)
  );
}

/**
 * Rebuild the event from the bounded allowlist before it reaches any exporter.
 * Planner observability never accepts request bodies, URLs, errors, cookies,
 * credentials, project data, geometry, contact values, or caller-supplied
 * labels.
 */
export function redactPlannerOperationEvent(
  event: unknown,
): PlannerOperationEvent {
  if (!isPlannerOperationEvent(event)) {
    throw new Error("Planner observability event failed privacy validation");
  }
  return createPlannerOperationEvent({
    operation: event.operation,
    method: event.method,
    result: event.result,
    status: event.status,
    persistenceMode: event.persistenceMode,
    durationMs: event.durationMs,
    correlationId: event.correlationId,
  });
}

/**
 * Export an allowlisted event. Exporter and fallback failures never escape into
 * the user or persistence workflow. The same redacted frozen event is offered
 * to the fallback sink when primary export fails.
 */
export function exportPlannerOperationSafely(
  event: PlannerOperationEvent,
  dependencies: Pick<
    PlannerObservabilityDependencies,
    "exporter" | "fallbackSink"
  >,
): void {
  let redactedEvent: PlannerOperationEvent;
  try {
    redactedEvent = redactPlannerOperationEvent(event);
  } catch {
    return;
  }
  try {
    dependencies.exporter.export(redactedEvent);
  } catch {
    try {
      dependencies.fallbackSink.write(redactedEvent);
    } catch {
      // Observability is deliberately failure-isolated from product behavior.
    }
  }
}

export function recordPlannerOperationSafely(
  input: PlannerOperationEventInput,
  dependencies: Pick<
    PlannerObservabilityDependencies,
    "exporter" | "fallbackSink"
  >,
): void {
  try {
    exportPlannerOperationSafely(createPlannerOperationEvent(input), dependencies);
  } catch {
    // Invalid instrumentation input must not alter the product operation.
  }
}

export function plannerEventValues(event: PlannerOperationEvent): readonly unknown[] {
  return Object.freeze(Object.values(event));
}
