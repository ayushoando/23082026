import "server-only";

import { Counter, Histogram, type Registry } from "@prometheus-io/client";

import { getMetricsRegistry } from "@/lib/observability/metrics";
import type {
  PlannerObservabilityDependencies,
  PlannerObservabilityExporter,
  PlannerObservabilityFallbackSink,
  PlannerOperationEvent,
} from "./plannerObservability";

type RequestLabel =
  | "operation"
  | "method"
  | "result"
  | "status"
  | "persistence_mode";
type DurationLabel =
  | "operation"
  | "method"
  | "result"
  | "status"
  | "persistence_mode";

interface PlannerMetrics {
  readonly operations: Counter<RequestLabel>;
  readonly errors: Counter<RequestLabel>;
  readonly rateLimits: Counter<RequestLabel>;
  readonly authorizationDenials: Counter<RequestLabel>;
  readonly persistenceFailures: Counter<RequestLabel>;
  readonly duration: Histogram<DurationLabel>;
}

type PlannerObservabilityGlobal = typeof globalThis & {
  __oandoPlannerMetrics?: PlannerMetrics;
};

function requestLabels(event: PlannerOperationEvent) {
  return {
    operation: event.operation,
    method: event.method,
    result: event.result,
    status: event.status,
    persistence_mode: event.persistenceMode,
  } as const;
}

function durationLabels(event: PlannerOperationEvent) {
  return {
    operation: event.operation,
    method: event.method,
    result: event.result,
    status: event.status,
    persistence_mode: event.persistenceMode,
  } as const;
}

function createPlannerMetrics(registry: Registry): PlannerMetrics {
  const registers = [registry];
  const requestLabelNames = [
    "operation",
    "method",
    "result",
    "status",
    "persistence_mode",
  ] as const;
  return {
    operations: new Counter({
      name: "oando_planner_operations_total",
      help: "Bounded Planner API and persistence operation outcomes",
      labelNames: requestLabelNames,
      registers,
    }),
    errors: new Counter({
      name: "oando_planner_errors_total",
      help: "Bounded Planner error outcomes",
      labelNames: requestLabelNames,
      registers,
    }),
    rateLimits: new Counter({
      name: "oando_planner_rate_limits_total",
      help: "Bounded Planner rate-limit outcomes",
      labelNames: requestLabelNames,
      registers,
    }),
    authorizationDenials: new Counter({
      name: "oando_planner_authorization_denials_total",
      help: "Bounded Planner authorization-denial outcomes",
      labelNames: requestLabelNames,
      registers,
    }),
    persistenceFailures: new Counter({
      name: "oando_planner_persistence_failures_total",
      help: "Bounded Planner persistence failure outcomes",
      labelNames: requestLabelNames,
      registers,
    }),
    duration: new Histogram({
      name: "oando_planner_operation_duration_seconds",
      help: "Planner API and persistence operation duration",
      labelNames: [
        "operation",
        "method",
        "result",
        "status",
        "persistence_mode",
      ] as const,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60, 300],
      registers,
    }),
  };
}

function getPlannerMetrics(): PlannerMetrics {
  const root = globalThis as PlannerObservabilityGlobal;
  root.__oandoPlannerMetrics ??= createPlannerMetrics(getMetricsRegistry());
  return root.__oandoPlannerMetrics;
}

export const plannerPrometheusExporter: PlannerObservabilityExporter = {
  export(event) {
    const metrics = getPlannerMetrics();
    const labels = requestLabels(event);
    metrics.operations.inc(labels);
    metrics.duration.observe(durationLabels(event), event.durationMs / 1_000);
    if (event.result !== "success") metrics.errors.inc(labels);
    if (event.result === "rate-limited") metrics.rateLimits.inc(labels);
    if (event.result === "authorization-denied") {
      metrics.authorizationDenials.inc(labels);
    }
    if (event.result === "persistence-failure") {
      metrics.persistenceFailures.inc(labels);
    }
    console.info("[observability] planner operation", {
      eventName: event.eventName,
      operation: event.operation,
      method: event.method,
      result: event.result,
      status: event.status,
      persistenceMode: event.persistenceMode,
      durationMs: event.durationMs,
      correlationId: event.correlationId,
    });
  },
};

export const plannerFallbackSink: PlannerObservabilityFallbackSink = {
  write(event) {
    console.error("[observability] planner export fallback", {
      eventName: event.eventName,
      operation: event.operation,
      method: event.method,
      result: event.result,
      status: event.status,
      persistenceMode: event.persistenceMode,
      durationMs: event.durationMs,
      correlationId: event.correlationId,
    });
  },
};

export const plannerObservabilityDependencies: PlannerObservabilityDependencies = {
  exporter: plannerPrometheusExporter,
  fallbackSink: plannerFallbackSink,
};
