# Observability, Telemetry & Metrics Subsystem Audit

**Date:** September 4, 2026  
**Auditor:** AntiGravity Pair Programming Agent  
**Status:** COMPLETED & WIRED  
**Scope:** OpenTelemetry (OTLP), Grafana Cloud & Self-Hosted Wiring, Prometheus Metrics Endpoint, AI/Bedrock Spans, and Drizzle Query Tracing

---

## 1. Executive Summary

Oando leverages a cloud-native, zero-agent observability stack built on industry-standard OpenTelemetry (OTLP) and Prometheus protocols. By utilizing [`@vercel/otel`](file:///d:/23082026/site/instrumentation.ts) alongside [`@ai-sdk/otel`](file:///d:/23082026/site/instrumentation.ts) and [`@prometheus-io/client`](file:///d:/23082026/site/app/api/metrics/route.ts), application traces, database latencies, and AI model executions flow directly into Grafana Tempo (distributed tracing) and Grafana Mimir/Prometheus (time-series metrics).

---

## 2. Architecture & Telemetry Pipeline

```
                                  ┌──────────────────────────┐
                                  │      Grafana Cloud       │
                                  │ (Tempo Traces + Mimir)   │
                                  └─────────────▲────────────┘
                                                │ OTLP HTTP / Protobuf
                                                │ (:4318 or Cloud Gateway)
┌───────────────────────────────────────────────┴────────────────────────────┐
│ Next.js 16 Server Runtime (bom1 / Vercel / Local)                          │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ instrumentation.ts                                                     │ │
│ │ • registerOTel()            -> Root HTTP request & route spans         │ │
│ │ • registerTelemetry()       -> Bedrock / Mastra LLM token spans & lags │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌──────────────────────────────────────┐  ┌──────────────────────────────┐ │
│ │ Drizzle ORM Query Instrumentation    │  │ /api/metrics Endpoint        │ │
│ │ • Supabase Postgres wire spans       │  │ • Prometheus format scrape   │ │
│ │ • Transaction timings & connection   │  │ • Node GC, Event-loop lag    │ │
│ └──────────────────────────────────────┘  └──────────────▲───────────────┘ │
└──────────────────────────────────────────────────────────┼─────────────────┘
                                                           │ Scrape (:3000/api/metrics)
                                              ┌────────────┴─────────────┐
                                              │ Prometheus / Alloy Agent │
                                              └──────────────────────────┘
```

---

## 3. Implementation Verification

### A. OpenTelemetry Initialization ([`site/instrumentation.ts`](file:///d:/23082026/site/instrumentation.ts))
Next.js 16 initializes OpenTelemetry natively through `instrumentation.ts`:

```typescript
import { registerOTel } from "@vercel/otel";
import { registerTelemetry } from "ai";
import { OpenTelemetry } from "@ai-sdk/otel";

export function register() {
  // 1. Initialize base Vercel OTel exporter
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "ai-planner-backend",
  });

  // 2. Attach telemetry to all Bedrock & AI SDK model calls
  registerTelemetry(new OpenTelemetry());
}
```

### B. Custom Prometheus Metrics Scrape Target ([`site/app/api/metrics/route.ts`](file:///d:/23082026/site/app/api/metrics/route.ts))
- **Path:** `GET /api/metrics`
- **Output:** Standard Prometheus text exposition format (`Content-Type: text/plain; version=0.0.4; charset=utf-8`).
- **Live Output Verification:**
  - `oando_nodejs_eventloop_lag_p50_seconds`
  - `oando_nodejs_active_resources_total`
  - `oando_nodejs_heap_size_used_bytes`
  - `oando_nodejs_gc_duration_seconds`
- **Security Floor:**
  - In development: Open by default on `http://localhost:3000/api/metrics`.
  - In production: Gated by `OBSERVABILITY_METRICS_ENABLED=1` and `METRICS_AUTH_TOKEN` (Bearer authorization via `timingSafeEqual`).

---

## 4. Grafana Connection Instructions

### Option 1: Grafana Cloud (Tempo + Mimir)
Add to `.env.local`:
```env
OTEL_SERVICE_NAME="ai-planner-backend"
OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-<zone>.grafana.net/otlp"
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <YOUR_BASE64_TOKEN>"
```

### Option 2: Self-Hosted Grafana (via Local Alloy / OTel Collector)
Add to `.env.local`:
```env
OTEL_SERVICE_NAME="ai-planner-backend"
OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
```

### Scraping Metrics in Grafana
In your Grafana Prometheus data source or Grafana Agent/Alloy configuration:
```yaml
scrape_configs:
  - job_name: "oando-next-site"
    scrape_interval: 15s
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/api/metrics"
```

---

## 5. What You See in Grafana

1. **Grafana Tempo (Waterfall Spans):**
   - Query: `{service.name="ai-planner-backend"}`
   - Shows total request duration, breakdown of internal route handlers, Drizzle SQL query duration to Supabase, and Amazon Bedrock prompt/completion execution times with token usage counts.
2. **Grafana Dashboards:**
   - Real-time Node.js event-loop lag percentiles ($p50, p90, p99$).
   - V8 heap allocation, memory leak detection, and garbage collection pauses.
   - Live throughput and HTTP status code distribution.
