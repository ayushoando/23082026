# Observability & Telemetry Guide

**Stack:** Next.js 16 (App Router) · OpenTelemetry (OTLP) · New Relic / Grafana · Prometheus · Vercel AI SDK · Gemini · Mastra · Drizzle ORM

This guide explains how to use, configure, and monitor Oando's built-in observability stack. You do not need complex third-party agents; telemetry is streamed natively via OpenTelemetry (OTLP) and standard Prometheus endpoints.

---

## 1. Architecture Overview

```
                                  ┌──────────────────────────────┐
                                  │        Grafana Cloud         │
                                  │   (Tempo Traces + Mimir)     │
                                  └──────────────▲───────────────┘
                                                 │ OTLP HTTP/Protobuf
                                                 │ (:4318 or Cloud Gateway)
┌────────────────────────────────────────────────┴─────────────────────────────┐
│ Next.js 16 Application Runtime (http://localhost:3000)                       │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ site/instrumentation.ts                                                  │ │
│ │ • registerOTel()            -> Root HTTP request & route handler spans   │ │
│ │ • registerTelemetry()       -> Gemini / Mastra LLM token spans & lags    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌───────────────────────────────────────┐  ┌───────────────────────────────┐ │
│ │ Drizzle ORM Database Queries          │  │ GET /api/metrics              │ │
│ │ • Supabase Postgres execution timings │  │ • Prometheus text exposition  │ │
│ │ • Transaction & connection spans      │  │ • Node GC, Event-loop lag     │ │
│ └───────────────────────────────────────┘  └───────────────▲───────────────┘ │
└────────────────────────────────────────────────────────────┼─────────────────┘
                                                             │ Scrape (:3000/api/metrics)
                                               ┌─────────────┴──────────────┐
                                               │  Prometheus / Alloy Agent  │
                                               └────────────────────────────┘
```

---

## 2. Telemetry Configuration (`site/instrumentation.ts`)

Next.js 16 automatically invokes [`site/instrumentation.ts`](file:///d:/23082026/site/instrumentation.ts) on server startup:

```typescript
import { registerOTel } from "@vercel/otel";
import { registerTelemetry } from "ai";
import { OpenTelemetry } from "@ai-sdk/otel";

export function register() {
  // 1. Initialize base OpenTelemetry exporter for Next.js routes & server actions
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "ai-planner-backend",
  });

  // 2. Attach telemetry to all Gemini, OpenRouter, and Mastra model calls
  registerTelemetry(new OpenTelemetry());
}
```

---

## 3. Connecting to Cloud Monitoring (New Relic / Grafana)

Environment variables in `.env.local` control where telemetry data is sent.

### Option A: New Relic Cloud (Active / Recommended)
New Relic supports standard OTLP HTTP ingestion natively without requiring proprietary Node agents (which can conflict with Next.js App Router / Webpack bundling).

1. Retrieve your **Ingest - License Key** in New Relic (**API Keys** > **Ingest - License**).
2. Add the following to `.env.local`:

```env
# OpenTelemetry service identifier (shows up under New Relic APM & Services)
OTEL_SERVICE_NAME="ai-planner-backend"

# Protocol for serverless and Next.js App Router
OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"

# New Relic OTLP Gateway
# US Region (default):
OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp.nr-data.net:4318"
# EU Region (if your New Relic account URL has .eu01.):
# OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp.eu01.nr-data.net:4318"

# Ingest API Key Header
OTEL_EXPORTER_OTLP_HEADERS="api-key=<YOUR_NEW_RELIC_LICENSE_KEY>"
```

3. **Prometheus Metrics:** The New Relic Infrastructure agent installed on your host can scrape `http://localhost:3000/api/metrics` using the New Relic Prometheus OpenMetrics integration (`nri-prometheus`).

### Option B: Grafana Cloud (Tempo for Traces + Mimir for Metrics)
1. In your **Grafana Cloud Portal**, navigate to **Connections > Add new connection**.
2. Select **OpenTelemetry**.
3. Under the **Environment Variables** section, copy the generated endpoint and authorization token.
4. Add them to `.env.local`:

```env
# OpenTelemetry service identifier
OTEL_SERVICE_NAME="ai-planner-backend"

# Protocol for serverless and Edge environments
OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"

# Grafana Cloud OTLP Gateway
OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-<zone>.grafana.net/otlp"

# Generated Basic Auth token from Grafana Cloud
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <YOUR_BASE64_TOKEN>"
```

### Option C: Self-Hosted Grafana / Local OTel Collector / Grafana Alloy
If running a local Grafana Alloy, OpenTelemetry Collector, or Tempo container on your workstation:

```env
OTEL_SERVICE_NAME="ai-planner-backend"
OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
```


---

## 4. Scraping Prometheus Metrics (`/api/metrics`)

Oando exposes application and Node.js runtime metrics via [`site/app/api/metrics/route.ts`](file:///d:/23082026/site/app/api/metrics/route.ts) using `@prometheus-io/client`.

### Verification Command
To verify metrics locally:
```bash
curl http://localhost:3000/api/metrics
```

### Metrics Included
- **Event Loop Health:** `oando_nodejs_eventloop_lag_p50_seconds`, `p90`, `p99`.
- **Memory & V8 Heap:** `oando_nodejs_heap_size_used_bytes`, `heap_space_size_total_bytes`.
- **Garbage Collection:** `oando_nodejs_gc_duration_seconds`.
- **Libuv Handles:** `oando_nodejs_active_handles_total`, `active_resources_total`.

### Grafana Agent / Prometheus Scrape Configuration
Add this target to your Prometheus or Grafana Alloy configuration:

```yaml
scrape_configs:
  - job_name: "oando-next-site"
    scrape_interval: 15s
    metrics_path: "/api/metrics"
    static_configs:
      - targets: ["localhost:3000"]
```

### Production Security Floor
In production environments:
1. Metrics scraping is disabled by default (returns `404`) unless enabled with:
   ```env
   OBSERVABILITY_METRICS_ENABLED=1
   ```
2. Protect metrics endpoints from public access with a Bearer token:
   ```env
   METRICS_AUTH_TOKEN="your-secure-random-token"
   ```
   When set, scrapers must pass: `Authorization: Bearer your-secure-random-token`.

---

## 5. Exploring Telemetry Data

### In New Relic (Automatic Ingestion — No Data Source Setup Required)
Unlike Grafana, New Relic does not require configuring individual data sources. Data sent via OTLP is automatically indexed across New Relic One:

1. **Distributed Tracing & APM:**
   - Go to **APM & Services** from the left navigation.
   - Click on your entity: **`ai-planner-backend`**.
   - Click **Distributed Tracing** in the sidebar to see live waterfall spans:
     - **Root Span:** Next.js HTTP route handler duration.
     - **Database Spans:** Exact SQL queries and timings executed via Drizzle ORM against Supabase.
     - **AI Model Spans:** Gemini / Mastra LLM token counts, latency, and model IDs.
2. **NRQL Queries (Query Builder):**
   - Click **Query Your Data** (or press `Ctrl+E` / `Cmd+E`).
   - Query trace spans:
     ```sql
     SELECT count(*), average(duration) FROM Span WHERE service.name = 'ai-planner-backend' FACET name SINCE 1 hour ago
     ```
   - Query AI model durations:
     ```sql
     SELECT * FROM Span WHERE name LIKE '%ai%' OR name LIKE '%gemini%' SINCE 1 hour ago
     ```

---

### In Grafana (Data Sources)

#### Distributed Tracing (Tempo Data Source)
1. Open Grafana and click **Explore**.
2. Select your **Tempo** data source.
3. Query traces for your service:
   ```
   {service.name="ai-planner-backend"}
   ```
4. **Waterfall Visualization:** Click any trace to view the timing breakdown (Next.js route -> Drizzle SQL -> Gemini model).

#### Time-Series Metrics (Prometheus / Mimir Data Source)
2. Useful Prometheus PromQL queries:
   - **Event Loop Lag ($p99$):**
     ```promql
     oando_nodejs_eventloop_lag_p99_seconds
     ```
   - **Memory Usage (MB):**
     ```promql
     oando_nodejs_heap_size_used_bytes / 1024 / 1024
     ```
   - **Active Event Handles:**
     ```promql
     oando_nodejs_active_handles_total
     ```

---

## 6. Quick Troubleshooting

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| **No traces appear in Tempo** | `OTEL_EXPORTER_OTLP_ENDPOINT` is unreachable or incorrect | Verify endpoint in `.env.local` and ensure local collector is listening on port `4318`. |
| **HTTP 401 on `/api/metrics`** | `METRICS_AUTH_TOKEN` is configured but request lacks header | Provide `Authorization: Bearer <METRICS_AUTH_TOKEN>` in scraper config. |
| **HTTP 404 on `/api/metrics`** | Running in production without enablement flag | Set `OBSERVABILITY_METRICS_ENABLED=1` in production environment variables. |
| **Next.js startup warning** | Service name fallback | Set `OTEL_SERVICE_NAME="ai-planner-backend"` in `.env.local`. |
