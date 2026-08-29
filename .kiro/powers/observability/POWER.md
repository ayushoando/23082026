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

- **OpenTelemetry is wired:** `site/instrumentation.ts` calls `registerOTel` from `@vercel/otel` (`2.1.3` in root `package.json`), with service name `OTEL_SERVICE_NAME` or the fallback `oando-next-site`.
- **Prometheus metrics are wired but availability is conditional:** `site/lib/observability/metrics.ts` imports `@prometheus-io/client` (`0.16.0` in root `package.json`) and lazily calls `collectDefaultMetrics({ prefix: "oando_" })` once per process via a `globalThis` guard. `site/app/api/metrics/route.ts` (`export const runtime = "nodejs"`, `dynamic = "force-dynamic"`) serves `registry.metrics()` at `GET /api/metrics`; in production it returns `404` unless `OBSERVABILITY_METRICS_ENABLED=1`, so metrics are reachable in dev/preview by default and opt-in in prod.
- **Prometheus/Grafana are repository-local configuration, not proof of running services:** `config/observability/prometheus.yml` scrapes `metrics_path: /api/metrics/` on `host.docker.internal:3000` every 15s; `config/observability/docker-compose.yml` defines pinned `prom/prometheus:v3.5.0` and `grafana/grafana:12.0.0` services with Grafana on host port `3002` and provisioning mounted from `config/observability/grafana/provisioning`. These files only prove config exists — they do not prove either container is running. Start with `docker compose -f config/observability/docker-compose.yml up` if the owner wants a live stack (do not start this yourself without explicit request; it is a service-launch action).
- **Client errors are wired to a structured console sink, not an external error tracker:** `site/lib/errorLogger.ts` (`logClientError`) posts bounded fields (message, stack, componentStack, url, userAgent, label) to `POST /api/log-error`. `site/app/api/log-error/route.ts` calls `enforcePublicApiRateLimit` (20 req budget), enforces a `16KB` body cap, validates the payload with a `zod` schema (message/stack/componentStack/url/userAgent/label length limits), then calls `site/lib/observability/reportClientError.ts`. That function is marked `import "server-only"`, trims/normalizes each field, and emits `console.error("[observability] client error", record)` — there is no downstream forwarding to any vendor.
- **`site/app/global-error.tsx`** is the App Router global error boundary. Its comment states "Sentry removed 2026-07-09" and it currently only `console.error`s the digest/message/stack; it does not call `reportClientError` or `logClientError`.
- **Blockers:** only `Failures.md` is authoritative for open hard blockers. As of this write it has zero open rows in its table — treat that as "no open blocker recorded," not as "blockers are absent from the process." Do not create a parallel blocker list in this power or elsewhere.

## Not wired

- **Sentry is not wired.** `package.json` has no `sentry`-matching dependency; `site/app/global-error.tsx` explicitly records its removal ("Sentry removed 2026-07-09").
- **Datadog RUM is not wired.** `package.json` has no `datadog`-matching dependency, and no client initialization or RUM mount was found. Any local Datadog MCP cache under `.kiro/mcp/` or elsewhere is unrelated tool metadata, not proof of product-side RUM wiring.

## MCP status vocabulary

Canonical schema references, when the snapshots exist, are under `.kiro/mcp/**`, never root `mcp/**`.

- **schema present** means a schema snapshot exists under `.kiro/mcp/<name>/`; a schema alone is metadata.
- **workspace configured** means `.kiro/settings/mcp.json` contains a server entry. This workspace has an empty `mcpServers` object, so no server is workspace-configured.
- **runtime installed** requires direct installed-power/server registry evidence. No such registry evidence was established here, so runtime availability is not verified.

Do not install, configure, or invent an observability MCP server from this power.
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.