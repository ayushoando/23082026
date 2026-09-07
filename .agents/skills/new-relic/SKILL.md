---
name: new-relic
description: "Configure, diagnose, and audit New Relic Browser, Node APM hybrid agent, OpenTelemetry tracing, and Prometheus exposition under the thermonuclear standard. Enforces zero credential leaks, nonce CSP compliance, privacy-safe AI metrics, and unified APM entity bridging."
---

# New Relic Observability — Thermonuclear Telemetry Standard

Use this skill when configuring, diagnosing, instrumenting, or auditing New Relic Browser (SPA), the New Relic Node APM hybrid agent, OpenTelemetry (`@vercel/otel`), AI advisor metrics, or Prometheus exposition across the Oando platform.

Telemetry in this repository is engineered with zero-compromise production safeguards: absolute credential privacy, cryptographic nonce-based CSP compliance, strict data masking, and mathematical synchronization between APM and OpenTelemetry entities.

---

## 1. The Thermonuclear Truth Floor for Observability

Under `AGENTS.md` and [`OBSERVABILITY.md`](file:///d:/23082026/OBSERVABILITY.md):
$$\text{User Instruction} > \text{Live Code / Fresh Command Output} > \text{AGENTS.md} > \text{Agents/} > \text{docs/}$$

- **Claim Isolation:** A local HTTP 200 response proves local route behavior only. It does **not** prove that a New Relic account is ingesting data or that Vercel production environment variables are active. Do not claim remote ingestion without authorized account proof.
- **Zero Credential Exposure:** Telemetry ingest keys and license keys must never appear in logs, console output, commits, pull requests, or documentation.
- **Runtime Topology:**
  ```mermaid
  flowchart TD
      Browser[Visitor Browser] --> GA4[Google Analytics 4]
      Browser --> Vercel[Vercel Web Analytics + Speed Insights]
      Browser --> NRBrowser[New Relic Browser SPA Agent]
      Next[Next.js Server] --> OTel[OpenTelemetry via @vercel/otel]
      Next --> NRApm[New Relic Node APM Hybrid Agent]
      OTel --> NRApm[Internal OTel APM Bridge]
      NRApm --> NREntity[Unified 'oando-web' APM Entity]
      Next --> AIProm[AI Advisor Spans + Prometheus Metrics]
      AIProm --> Metrics[GET /api/metrics]
  ```

---

## 2. The Six Non-Negotiable Laws of Observability

```
┌────────────────────────────────────────────────────────────────────────┐
│               THE 6 THERMONUCLEAR LAWS OF OBSERVABILITY                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. ZERO CREDENTIAL EXPOSURE & CONTINUOUS SECRET SCANNING               │
│ 2. SAME-ORIGIN BROWSER SPA AGENT & PRIVACY MASKING INVARIANTS          │
│ 3. NONCE-BASED CONTENT SECURITY POLICY (CSP) COMPLIANCE                │
│ 4. HYBRID NODE APM AGENT & UNIFIED OPENTELEMETRY BRIDGE                │
│ 5. AI ADVISOR PRIVACY-SAFE METRICS & SPAN WRAPPER                      │
│ 6. PROMETHEUS EXPOSITION ENDPOINT TRI-STATE SECURITY GATE             │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Law 1: Zero Credential Exposure & Continuous Secret Scanning
- `NEW_RELIC_LICENSE_KEY` (OTLP / APM server ingest) and `NEW_RELIC_BROWSER_KEY` (browser agent key) are strictly confidential secrets.
- Secrets belong exclusively in `.env.local` or `site/.env.local` (both gitignored). Never place values in root `.env.example` or `site/.env.example`.
- **Pre-Commit Enforcement:** Any observability change must pass `node scripts/general/scan_secrets.mjs` with zero findings.

### Law 2: Same-Origin Browser SPA Agent & Privacy Masking Invariants
- Browser telemetry is mounted by [`site/components/analytics/NewRelicScript.tsx`](file:///d:/23082026/site/components/analytics/NewRelicScript.tsx).
- Loads exclusively through the same-origin dynamic route [`/newrelic.js`](file:///d:/23082026/site/app/newrelic.js/route.ts), which substitutes the browser key at request time. No key is baked into static assets.
- Vendored agent template: [`site/lib/analytics/newrelic-agent.template.js`](file:///d:/23082026/site/lib/analytics/newrelic-agent.template.js).
- **Mandatory Privacy Settings:**
  - `capture_payloads: 'none'`
  - `mask_all_inputs: true`
  - AJAX deny list: contains only `bam.nr-data.net` so application hosts remain observable while user input and request bodies are never transmitted.
- **Linter Suppression Governance:** The minified agent template is explicitly suppressed in `.oxlintrc.json`. Do not remove or alter this authorized suppression.

### Law 3: Nonce-Based Content Security Policy (CSP) Compliance
- Content Security Policy maintains strict per-request cryptographic nonces configured in `site/proxy.ts` and `site/next.config.js`.
- The **only** New Relic origins permitted in CSP headers:
  - `script-src`: `https://js-agent.newrelic.com`
  - `connect-src`: `https://bam.nr-data.net` and `https://*.nr-data.net`
- **Forbidden Violations:** Never add `'unsafe-inline'`, never broaden `'unsafe-eval'`, and never introduce wildcard `*` domains to appease telemetry scripts.

### Law 4: Hybrid Node APM Agent & Unified OpenTelemetry Bridge
- Configured in [`config/observability/newrelic.cjs`](file:///d:/23082026/config/observability/newrelic.cjs) and loaded only when `NEW_RELIC_APM_ENABLED=1` and `NEXT_RUNTIME=nodejs`.
- Server tracing initializes via [`site/instrumentation.ts`](file:///d:/23082026/site/instrumentation.ts) calling `registerOTel({ serviceName: "oando-web" })`.
- **The Single Entity Invariant:** The OpenTelemetry `serviceName` ("oando-web") **must match** `NEW_RELIC_APP_NAME` ("oando-web"). The APM agent's internal OpenTelemetry bridge intercepts native `@vercel/otel` spans and attaches them to the unified `oando-web` APM entity. Never rename `serviceName`, as this permanently fractures telemetry into two separate entities.
- Duplicate agent instrumentations (`http`, `next`, `undici`) are disabled in `newrelic.cjs` to eliminate redundant span reporting.

### Law 5: AI Advisor Privacy-Safe Metrics & Span Wrapper
- AI Advisor queries ([`site/app/api/Planner/ai-advisor/route.ts`](file:///d:/23082026/site/app/api/Planner/ai-advisor/route.ts)) are wrapped by [`site/lib/observability/aiMetrics.ts`](file:///d:/23082026/site/lib/observability/aiMetrics.ts).
- Creates the `oando.ai_advisor.request` OpenTelemetry span and records Prometheus counters/histograms.
- **Zero Payload Leakage:** Telemetry records only high-level metadata: `provider`, `fallback_used`, `outcome` (success/error), and token counts. User prompts, design criteria, chat completions, and API keys are strictly excluded from span attributes.

### Law 6: Prometheus Exposition Endpoint Tri-State Security Gate
- Route [`site/app/api/metrics/route.ts`](file:///d:/23082026/site/app/api/metrics/route.ts) exposes metrics in `text/plain; version=0.0.4` format.
- In production, it is protected by a strict tri-state security barrier:
  1. `OBSERVABILITY_METRICS_ENABLED=0` $\rightarrow$ Returns **404 Not Found**.
  2. `OBSERVABILITY_METRICS_ENABLED=1` without `Authorization: Bearer <METRICS_AUTH_TOKEN>` $\rightarrow$ Returns **401 Unauthorized**.
  3. `OBSERVABILITY_METRICS_ENABLED=1` with missing token in environment $\rightarrow$ Returns **503 Service Unavailable**.
- The metrics route is never exposed unauthenticated in production.

---

## 3. Environment Configuration Contract

Keep real values exclusively in `.env.local` or `site/.env.local`:

```ini
# Browser Ingest (supplied dynamically at request time via /newrelic.js)
NEW_RELIC_BROWSER_KEY=

# OpenTelemetry Service Identifier (must match NEW_RELIC_APP_NAME)
OTEL_SERVICE_NAME=oando-web

# Server Node APM Hybrid Bridge (server-only)
NEW_RELIC_APM_ENABLED=0
NEW_RELIC_APP_NAME=oando-web
NEW_RELIC_LICENSE_KEY=

# Production Prometheus Security Gate
OBSERVABILITY_METRICS_ENABLED=0
METRICS_AUTH_TOKEN=
```

---

## 4. Verification & Audit Runbook

Execute this verification sequence after changing telemetry or observability configurations:

```powershell
# 1. Run secret scanner to guarantee zero exposed license keys
node scripts/general/scan_secrets.mjs

# 2. Check governance and linter suppression rules
node scripts/general/check-governance.mjs

# 3. Local route verification on http://localhost:3000 (when dev server is active)
# Verify same-origin browser agent loads with 200 and key substitution
curl -I http://localhost:3000/newrelic.js

# Verify Prometheus metrics endpoint locally
curl -I http://localhost:3000/api/metrics

# 4. Verify instrumentation builds without type errors
pnpm run check:layout
```
