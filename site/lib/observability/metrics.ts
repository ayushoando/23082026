import {
  collectDefaultMetrics,
  register,
} from "@prometheus-io/client";

type ObservabilityGlobal = typeof globalThis & {
  __oandoPrometheusDefaultsInitialized?: boolean;
};

const observabilityGlobal = globalThis as ObservabilityGlobal;

export function getMetricsRegistry() {
  if (!observabilityGlobal.__oandoPrometheusDefaultsInitialized) {
    collectDefaultMetrics({ prefix: "oando_" });
    observabilityGlobal.__oandoPrometheusDefaultsInitialized = true;
  }

  return register;
}
