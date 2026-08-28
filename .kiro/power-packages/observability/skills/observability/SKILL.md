---
name: observability
description: Route traces, metrics, client errors, and blocker investigation through the observability surfaces wired in this repository.
---

# Observability

## Wired

- OpenTelemetry: `site/instrumentation.ts` via `@vercel/otel`, service name from `OTEL_SERVICE_NAME`.
- Metrics: `site/lib/observability/metrics.ts` with the `oando_` prefix, exposed at `/api/metrics`. Production returns 404 unless `OBSERVABILITY_METRICS_ENABLED=1`.
- Local Prometheus/Grafana config: `config/observability/`. Starting those services is owner-invoked.
- Client errors: `site/lib/errorLogger.ts` posts to `/api/log-error`, which calls `site/lib/observability/reportClientError.ts` and emits a structured `console.error` record.
- Hard blockers: root `Failures.md` only.

## Not wired

Sentry and Datadog RUM are absent from current source. Do not describe them as integrated.
