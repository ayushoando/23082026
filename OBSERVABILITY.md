# Observability & Telemetry Guide

**Stack:** Next.js 16 (App Router) · OpenTelemetry (OTLP) · New Relic Full-Stack (Browser RUM + Host Infrastructure + Server APM) · Grafana · Prometheus · Vercel AI SDK · Gemini · Mastra · Drizzle ORM

This guide explains how to use, configure, and monitor Oando's built-in observability stack. Telemetry is gathered across two cooperative layers:
1. **Frontend Client (RUM & Session Replay):** Instrumented via the New Relic Pro + SPA Browser Agent (`oando-web`).
2. **Backend Server & Host (APM & Infrastructure):** Telemetry is streamed natively via OpenTelemetry (OTLP) to New Relic APM (`ai-planner-backend`) alongside host metrics (`oando`) and standard Prometheus endpoints.

---

## 1. Architecture Overview & Distributed Tracing

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. Frontend: Client Browser (http://localhost:3000)                                         │
│                                                                                             │
│  site/public/newrelic.js (mounted via <NewRelicScript /> in site/app/layout.tsx)            │
│  • New Relic Browser Agent (Entity: `oando-web`, App ID: 1134725588)                        │
│  • Core Web Vitals (LCP, INP, CLS, FCP, TTFB)                                              │
│  • Single Page App (SPA) route navigations (/studio, /planner, /clients)                    │
│  • Real-time JavaScript error & crash tracking with stack traces                           │
│  • Session Replay (10% sampling, 100% error rate, masked PII)                               │
│  • Distributed Tracing: Injects W3C `traceparent` headers into outgoing fetch requests       │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               │ W3C TraceContext (HTTP fetch / Server Actions)
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. Backend: Next.js 16 Server Runtime & AI Services                                         │
│                                                                                             │
│  site/instrumentation.ts (invoked on Next.js startup)                                       │
│  • registerOTel()            -> Root HTTP request & route handler spans                     │
│  • registerTelemetry()       -> Gemini & Mastra LLM token spans, prompt latency, errors     │
│  • Drizzle ORM               -> Supabase Postgres execution timings                         │
│  • Entity Name: `ai-planner-backend` (configured via OTEL_SERVICE_NAME)                     │
│                                                                                             │
│  GET /api/metrics                                                                           │
│  • Prometheus text exposition (@prometheus-io/client)                                       │
│  • Node.js Event-Loop lag, V8 Heap, GC duration, Libuv active handles                       │
└──────────────────────┬───────────────────────────────────────────────┬──────────────────────┘
                       │                                               │
                       │ OTLP HTTP/Protobuf (:4318)                    │ Scrape (:3000/api/metrics)
                       ▼                                               ▼
┌──────────────────────────────────────────────┐ ┌────────────────────────────────────────────┐
│ New Relic Ingest Gateways                    │ │ Host Infrastructure & Metrics Scraper      │
│ • Browser Beacon: https://bam.nr-data.net    │ │ • New Relic Host Agent (Entity: `oando`)   │
│ • OTLP Endpoint:  https://otlp.nr-data.net   │ │ • CPU, RAM, Disk I/O, Node.js processes    │
│                                              │ │ • Prometheus / Alloy Agent Scraper         │
└──────────────────────┬───────────────────────┘ └────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. New Relic One Unified Observability Portal (https://one.newrelic.com)                    │
│                                                                                             │
│  • Browser Dashboard:       `oando-web`           (RUM, Web Vitals, Session Replay)         │
│  • APM & Services:          `ai-planner-backend`  (Next.js Routes, Gemini Tokens, DB)       │
│  • Host Infrastructure:     `oando`               (Windows host CPU, RAM, Process Health)   │
│  • Distributed Waterfall:   Single Trace linking `oando-web` click -> `ai-planner-backend`  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Entity Map: Why There Are Multiple Entities

When monitoring a modern full-stack web application, New Relic enforces distinct entity types for frontend browser apps, backend services, and host infrastructure. An existing entity name (such as `oando` created by the host installer) cannot be duplicated across disparate agent types.

| Entity Name | Layer / Type | Source / Configuration | What It Monitors |
| :--- | :--- | :--- | :--- |
| **`oando-web`** | **Browser Application (RUM)** | `site/public/newrelic.js` via `<NewRelicScript />` | Core Web Vitals (LCP, INP, CLS), SPA route transitions, Client JavaScript runtime errors, Session Replays, AJAX call latency. |
| **`ai-planner-backend`** | **APM & Services (OTLP)** | `site/instrumentation.ts` + `.env.local` | Next.js server route handlers, Server Actions, Google Gemini token counts & LLM latency, Supabase Postgres SQL query durations via Drizzle ORM. |
| **`oando`** | **Host Infrastructure** | Host machine installer (PowerShell CLI) | Workstation/server CPU utilization, memory (RAM), disk I/O, network bandwidth, and active Node.js processes. |

> [!TIP]
> **Dual Monitoring Benefit:** Having `oando-web` and `ai-planner-backend` separated gives you dedicated frontend and backend telemetry dashboards, while **Distributed Tracing** seamlessly correlates them into unified end-to-end transaction waterfalls.

---

## 3. Frontend Browser Monitoring (`oando-web`)

### Architecture & Files
- **Script Asset:** [`site/public/newrelic.js`](file:///d:/23082026/site/public/newrelic.js) contains the production New Relic Pro + SPA loader (Version 1.321.0).
- **React Component:** [`site/components/analytics/NewRelicScript.tsx`](file:///d:/23082026/site/components/analytics/NewRelicScript.tsx) injects the script into the document `<head>` with the per-request CSP nonce.
- **Root Layout:** Mounted inside `<head>` in [`site/app/layout.tsx`](file:///d:/23082026/site/app/layout.tsx).

### Key Features Configured
- **Pro + SPA Tracking:** Tracks client-side route changes without requiring full page refreshes.
- **Session Replay:**
  - Standard sampling rate: `10%`.
  - Error sampling rate: `100%` (guarantees a replay is captured whenever an uncaught client error occurs).
  - PII protection: `mask_all_inputs: true` ensures sensitive user inputs are masked.
- **Distributed Tracing:** `distributed_tracing: { enabled: true }` attaches W3C trace headers to same-origin fetch calls.

### Content Security Policy (CSP) Configuration
For security compliance, New Relic domains are whitelisted in both [`site/next.config.js`](file:///d:/23082026/site/next.config.js) and [`site/lib/security/headers.ts`](file:///d:/23082026/site/lib/security/headers.ts):
- `script-src`: `'self'`, `nonce-<nonce>`, `https://js-agent.newrelic.com`
- `connect-src`: `'self'`, `https://bam.nr-data.net`, `https://*.nr-data.net`

---

## 4. Backend OpenTelemetry Configuration (`ai-planner-backend`)

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

  // 2. Attach telemetry to all Gemini and Mastra model calls
  registerTelemetry(new OpenTelemetry());
}
```

### Environment Variables (`.env.local`)
Configure the backend OTLP exporter in `.env.local`:

```env
# OpenTelemetry service identifier (shows up under New Relic APM & Services)
OTEL_SERVICE_NAME='ai-planner-backend'

# Protocol for serverless and Next.js App Router
OTEL_EXPORTER_OTLP_PROTOCOL='http/protobuf'

# New Relic OTLP Gateway
# US Region:
OTEL_EXPORTER_OTLP_ENDPOINT='https://otlp.nr-data.net:4318'
# EU Region (if applicable):
# OTEL_EXPORTER_OTLP_ENDPOINT='https://otlp.eu01.nr-data.net:4318'

# New Relic Ingest License Key Header
OTEL_EXPORTER_OTLP_HEADERS='api-key=<YOUR_NEW_RELIC_LICENSE_KEY>'
```

---

## 5. Scraping Prometheus Metrics (`/api/metrics`)

Oando exposes application and Node.js runtime metrics via [`site/app/api/metrics/route.ts`](file:///d:/23082026/site/app/api/metrics/route.ts) using `@prometheus-io/client`.

### Verification Command
```bash
curl http://localhost:3000/api/metrics
```

### Metrics Included
- **Event Loop Health:** `oando_nodejs_eventloop_lag_p50_seconds`, `p90`, `p99`.
- **Memory & V8 Heap:** `oando_nodejs_heap_size_used_bytes`, `heap_space_size_total_bytes`.
- **Garbage Collection:** `oando_nodejs_gc_duration_seconds`.
- **Libuv Handles:** `oando_nodejs_active_handles_total`, `active_resources_total`.

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

## 6. Exploring Telemetry in New Relic One

Log into [New Relic One](https://one.newrelic.com):

### 1. Frontend Browser Monitoring (`oando-web`)
- Navigate to **Browser** in the left sidebar and select **`oando-web`**.
- **Page Views & Web Vitals:** Review Real User Core Web Vitals (LCP, INP, CLS) broken down by URL path and device.
- **Session Replay:** Navigate to **Session Replay** in the left sub-navigation to inspect visual user recordings and user interactions.
- **JS Errors:** Navigate to **Errors Analysis** to see uncaught browser exceptions, stack traces, and affected user sessions.

### 2. Backend APM & Distributed Tracing (`ai-planner-backend`)
- Navigate to **APM & Services** and select **`ai-planner-backend`**.
- **Distributed Tracing:** Click **Distributed Tracing** to view waterfall traces:
  - **Browser Initiation:** Frontend click or fetch captured by `oando-web`.
  - **Next.js Route Handler:** Server Action or API route duration.
  - **Database Query:** Supabase Postgres query timings via Drizzle ORM.
  - **AI Model Execution:** Gemini LLM prompt token counts, completion token counts, and model inference latency.

### 3. Host Infrastructure (`oando`)
- Navigate to **Infrastructure > Hosts** and select **`oando`**.
- Review Windows machine CPU usage, memory utilization, disk activity, and active Node/pnpm processes.

### 4. Useful NRQL Queries (Query Builder / `Ctrl+E`)

```sql
-- 1. Browser Core Web Vitals (LCP, INP, CLS)
SELECT percentile(largestContentfulPaint, 75) AS 'LCP (p75)',
       percentile(interactionToNextPaint, 75) AS 'INP (p75)',
       percentile(cumulativeLayoutShift, 75) AS 'CLS (p75)'
FROM PageViewTiming WHERE appName = 'oando-web' SINCE 1 hour ago

-- 2. JavaScript Errors on the Client
SELECT count(*), latest(errorMessage) 
FROM JavaScriptError WHERE appName = 'oando-web' FACET requestUri SINCE 24 hours ago

-- 3. Backend Trace Spans by Duration
SELECT count(*), average(duration) 
FROM Span WHERE service.name = 'ai-planner-backend' FACET name SINCE 1 hour ago

-- 4. Gemini AI Model Execution Duration & Token Counts
SELECT average(duration), count(*) 
FROM Span WHERE service.name = 'ai-planner-backend' AND (name LIKE '%ai%' OR name LIKE '%gemini%') SINCE 1 hour ago
```

---

## 7. Alternative: Grafana Cloud Setup

If routing telemetry to Grafana Cloud instead of New Relic:
1. In your **Grafana Cloud Portal**, navigate to **Connections > Add new connection > OpenTelemetry**.
2. Update `.env.local`:
   ```env
   OTEL_SERVICE_NAME="ai-planner-backend"
   OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
   OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-<zone>.grafana.net/otlp"
   OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <YOUR_BASE64_TOKEN>"
   ```

---

## 8. Quick Troubleshooting

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| **`oando-web` not showing in New Relic** | Browser script blocked by ad-blocker or CSP | Check browser DevTools console for CSP violations; ensure ad-blockers allow `bam.nr-data.net`. |
| **Session Replays empty** | User sessions lack interactions or haven't hit sampling threshold | Trigger an interaction or an intentional error; error sampling is set to 100%. |
| **No traces appear in APM** | `OTEL_EXPORTER_OTLP_ENDPOINT` or API key incorrect | Verify endpoint (`https://otlp.nr-data.net:4318`) and header (`api-key=NRAK-...`) in `.env.local`. |
| **HTTP 401 on `/api/metrics`** | `METRICS_AUTH_TOKEN` is configured | Provide `Authorization: Bearer <METRICS_AUTH_TOKEN>` in scraper request. |
| **HTTP 404 on `/api/metrics`** | Running in production without enablement flag | Set `OBSERVABILITY_METRICS_ENABLED=1` in production environment variables. |
