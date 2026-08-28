---
name: observability
displayName: Observability
description: Route repository observability work through the live OpenTelemetry, Prometheus, client-error, and blocker surfaces without claiming unwired vendors or runtime capabilities.
keywords: ["observability", "opentelemetry", "prometheus", "grafana", "metrics", "client errors", "failures"]
author: "workspace"
---

# Observability Power

Use this power to locate and reason about observability already represented in the repository. It is routing documentation only: it bundles no MCP server and does not establish runtime availability.

## Live routing

- **OpenTelemetry is wired:** `site/instrumentation.ts` calls `registerOTel` from `@vercel/otel`, with service name `OTEL_SERVICE_NAME` or `oando-next-site`.
- **Prometheus metrics are wired but availability is conditional:** `site/lib/observability/metrics.ts` initializes default metrics once with the `oando_` prefix. `site/app/api/metrics/route.ts` exposes the registry at `/api/metrics`; in production it returns 404 unless `OBSERVABILITY_METRICS_ENABLED=1`.
- **Prometheus/Grafana are repository-local configuration, not proof of running services:** `config/observability/prometheus.yml` scrapes `/api/metrics/` on `host.docker.internal:3000`; `config/observability/docker-compose.yml` defines pinned Prometheus and Grafana services and provisioning. Do not claim either service is running from static files.
- **Client errors are wired to a structured console sink:** `site/lib/errorLogger.ts` posts bounded error details to `/api/log-error`. `site/app/api/log-error/route.ts` rate-limits and validates the request, then calls `site/lib/observability/reportClientError.ts`, which normalizes fields and emits `console.error("[observability] client error", record)`.
- **Blockers:** only `Failures.md` is authoritative for open hard blockers. Do not create a parallel blocker list in this power or elsewhere.

## Not wired

- **Sentry is not wired.** No Sentry dependency or active integration is present; `site/app/global-error.tsx` explicitly records its removal.
- **Datadog RUM is not wired.** No Datadog dependency, client initialization, or RUM mount is present. Local/cache artifacts would not prove source wiring.

## MCP status vocabulary

Canonical schema references, when the snapshots exist, are under `.kiro/mcp/**`, never root `mcp/**`.

- **schema present** means a schema snapshot exists under `.kiro/mcp/<name>/`; a schema alone is metadata.
- **workspace configured** means `.kiro/settings/mcp.json` contains a server entry. This workspace has an empty `mcpServers` object, so no server is workspace-configured.
- **runtime installed** requires direct installed-power/server registry evidence. No such registry evidence was established here, so runtime availability is not verified.

Do not install, configure, or invent an observability MCP server from this power.
