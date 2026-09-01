import "server-only";

import { Counter, Histogram, type Registry } from "@prometheus-io/client";

import { getMetricsRegistry } from "@/lib/observability/metrics";
import {
  PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES,
  redactPlannerOperationEvent,
  type PlannerObservabilityDependencies,
  type PlannerObservabilityExporter,
  type PlannerObservabilityFallbackSink,
  type PlannerOperationEvent,
} from "./plannerObservability";

type PlannerMetricLabelName =
  (typeof PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES)[number];

interface PlannerMetrics {
  readonly operations: Counter<PlannerMetricLabelName>;
  readonly errors: Counter<PlannerMetricLabelName>;
  readonly rateLimits: Counter<PlannerMetricLabelName>;
  readonly authorizationDenials: Counter<PlannerMetricLabelName>;
  readonly persistenceFailures: Counter<PlannerMetricLabelName>;
  readonly duration: Histogram<PlannerMetricLabelName>;
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
  return {
    operations: new Counter({
      name: "oando_planner_operations_total",
      help: "Bounded Planner API and persistence operation outcomes",
      labelNames: PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES,
      registers,
    }),
    errors: new Counter({
      name: "oando_planner_errors_total",
      help: "Bounded Planner error outcomes",
      labelNames: PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES,
      registers,
    }),
    rateLimits: new Counter({
      name: "oando_planner_rate_limits_total",
      help: "Bounded Planner rate-limit outcomes",
      labelNames: PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES,
      registers,
    }),
    authorizationDenials: new Counter({
      name: "oando_planner_authorization_denials_total",
      help: "Bounded Planner authorization-denial outcomes",
      labelNames: PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES,
      registers,
    }),
    persistenceFailures: new Counter({
      name: "oando_planner_persistence_failures_total",
      help: "Bounded Planner persistence failure outcomes",
      labelNames: PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES,
      registers,
    }),
    duration: new Histogram({
      name: "oando_planner_operation_duration_seconds",
      help: "Planner API and persistence operation duration",
      labelNames: PLANNER_OBSERVABILITY_METRIC_LABEL_NAMES,
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
    // Keep the exporter safe even when it is called directly instead of via
    // exportPlannerOperationSafely. Unknown fields are dropped and unapproved
    // runtime values are rejected before labels or logs are created.
    const safeEvent = redactPlannerOperationEvent(event);
    const metrics = getPlannerMetrics();
    const labels = requestLabels(safeEvent);
    metrics.operations.inc(labels);
    metrics.duration.observe(
      durationLabels(safeEvent),
      safeEvent.durationMs / 1_000,
    );
    if (safeEvent.result !== "success") metrics.errors.inc(labels);
    if (safeEvent.result === "rate-limited") metrics.rateLimits.inc(labels);
    if (safeEvent.result === "authorization-denied") {
      metrics.authorizationDenials.inc(labels);
    }
    if (safeEvent.result === "persistence-failure") {
      metrics.persistenceFailures.inc(labels);
    }
    console.info("[observability] planner operation", {
      eventName: safeEvent.eventName,
      operation: safeEvent.operation,
      method: safeEvent.method,
      result: safeEvent.result,
      status: safeEvent.status,
      persistenceMode: safeEvent.persistenceMode,
      durationMs: safeEvent.durationMs,
      correlationId: safeEvent.correlationId,
    });
  },
};

export const plannerFallbackSink: PlannerObservabilityFallbackSink = {
  write(event) {
    // The fallback is independently allowlisted because it is also an
    // exported sink and must not rely on one particular caller for redaction.
    const safeEvent = redactPlannerOperationEvent(event);
    console.error("[observability] planner export fallback", {
      eventName: safeEvent.eventName,
      operation: safeEvent.operation,
      method: safeEvent.method,
      result: safeEvent.result,
      status: safeEvent.status,
      persistenceMode: safeEvent.persistenceMode,
      durationMs: safeEvent.durationMs,
      correlationId: safeEvent.correlationId,
    });
  },
};

export const plannerObservabilityDependencies: PlannerObservabilityDependencies = {
  exporter: plannerPrometheusExporter,
  fallbackSink: plannerFallbackSink,
};
