# Oando Subsystem Plan: Security, Observability, and Release Operations

**File Target:** `plans/05092026/12-security-observability-and-release.md`  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Scope:** Effective response headers, CSP/nonces, third-party scripts, security telemetry, metrics, client-error privacy, releases, and incident evidence.  
**Out of Scope:** Replacing the auth model, changing database data, or deploying infrastructure without separate authorization.

---

## 1. Why This Is a Separate Plan

Security controls are currently spread across `site/proxy.ts`, static headers, route handlers, environment checks, browser behaviour, and operational scripts. Observability is similarly split between Prometheus metrics, Planner telemetry, and client-error capture. The release gate checks code quality but does not by itself prove that the canonical host serves the intended revision or header set.

This plan gives those cross-cutting concerns a release owner and an evidence chain.

### Evidence Anchors

| Surface | Observed responsibility | Planning implication |
|---|---|---|
| `site/proxy.ts` | Per-request CSP nonce, path-aware CSP, host canonicalization, maintenance policy, and edge request controls. | Treat proxy-generated headers as the primary runtime contract. |
| `site/lib/security/headers.ts` and `config/build/next.config.js` | Static defence headers and a second header configuration surface. | Establish which header wins for every route; avoid divergent CSP policy. |
| `site/lib/security/requestNonce.ts` and root/site layouts | Forward and consume the request nonce. | Verify nonce propagation in rendered production HTML, not only in source. |
| `site/app/api/metrics/route.ts` and `site/lib/observability/metrics.ts` | Prometheus metric export, production enablement, and optional bearer-token protection. | Metrics must be disabled or authenticated in production; never assume a local default is safe to expose. |
| `site/lib/observability/reportClientError.ts` and Planner observability adapters | Bounded, privacy-aware error and event capture. | Telemetry must be failure-isolated and must not log secrets, cookies, raw request bodies, or unrestricted URLs. |
| [`OBSERVABILITY.md`](../../OBSERVABILITY.md) | Cloud-first telemetry architecture (GA4, Vercel RUM, OpenTelemetry). | Lean cloud-first monitoring; zero dependencies on dead third-party APMs (Datadog, New Relic, Traceloop, Cast); local Docker Prometheus/Grafana is unneeded in production. |

---

## 2. Security and Telemetry Invariants

1. The effective production response header set is measured from the canonical host after deployment; source configuration alone is insufficient.
2. Each third-party script or connection origin has an owner, purpose, source file, required CSP directive, consent requirement, and removal test.
3. Do not add `unsafe-inline`, broad wildcards, or permanent suppressions to work around a CSP or hydration error. Diagnose the actual emitting component/origin first.
4. `unsafe-eval` remains restricted to the canvas-heavy paths that demonstrably require it; it must not become a site-wide convenience setting.
5. Metrics in production are either deliberately disabled or enabled with authenticated access. A production-enabled endpoint with no authentication token is a release blocker.
6. Client and server telemetry is bounded, redacted, and failure-isolated from the product request path.
7. A release is not complete until source revision, deployed artifact, canonical-host response, and browser runtime observation agree.

---

## 3. Security Workstreams

### Phase A — Effective Header and Third-Party Inventory

For each representative route class—marketing, Admin, member, guest product, canvas-heavy, API, redirect, error, and `robots.txt`—record:

| Field | Required evidence |
|---|---|
| Final URL and status | Canonical-host fetch with redirects followed. |
| Header ownership | Proxy/static/platform source and observed final header. |
| CSP directives | Exact effective `script-src`, `connect-src`, `frame-src`, `frame-ancestors`, and nonce behaviour. |
| Third parties | Script/network origin, purpose, consent state, and owning component/configuration. |
| Indexability | Robots/meta/X-Robots state, consistent with route classification. |

Reconcile duplicate header writers before changing policy. If a configuration is unobserved, label it unobserved rather than assuming it is active.

### Phase B — Nonce, CSP, and Hydration Discipline

Validate nonce flow from request header through layout to rendered script tags. When React reports hydration error `#418`, first capture only the first component-stack line and compare server HTML with first client render. Do not add `suppressHydrationWarning` to new trees.

For third-party changes, inspect both the HTML and browser network/console result. A removed import is incomplete if an old deployment, static asset, CSP allowance, or connection origin remains active.

### Phase C — Telemetry and Privacy Contract

Define a small event schema for every exporter:

- allowed labels and cardinality;
- source of timestamp and request identity;
- redaction/truncation rules;
- retention and access owner;
- failure behaviour;
- test fixture that demonstrates no cookie, authorization value, secret, raw body, or uncontrolled URL can be emitted.

The telemetry architecture standardizes on the cloud-first model documented in [`OBSERVABILITY.md`](../../OBSERVABILITY.md):
- Client Core Web Vitals & RUM: `@vercel/analytics` and `@vercel/speed-insights`.
- Business Analytics: Google Analytics 4 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`).
- Distributed Tracing: Standard OpenTelemetry in `site/instrumentation.ts`.
- Local Metric Scraping: `/api/metrics` is available for ad-hoc Prometheus scraping without requiring local Docker containers (`config/observability/`) or third-party agent daemons.

---

## 4. Release and Incident Workflow

### Pre-Release Evidence

Before an authorized deploy, record the intended commit SHA, changed surfaces, required migration/rollback status, exact allowed third-party deltas, and the authorized gate results. A failed gate stops the release; do not deploy to “see whether production fixes it.”

### Post-Release Provenance Check

After propagation, compare:

1. local `HEAD` and the deployment revision identified by the delivery platform;
2. canonical-host final URL, host, status, and selected HTML markers;
3. effective security headers and robots state;
4. browser console, including a hydration check;
5. expected third-party scripts and network origins; and
6. a protected-route and metrics-access probe appropriate to the release scope.

Record a mismatch as a release-provenance incident. Do not change unrelated product code while investigating a stale or misrouted deployment.

### Incident Severity and Rollback

| Condition | Immediate action | Evidence to preserve |
|---|---|---|
| Authentication or protected-route exposure | Stop rollout and restore the last verified guard/deployment. | Request class, status, safe route, revision; never credentials. |
| CSP blocks required first-party functionality | Identify route, directive, blocked origin, and owner before a scoped correction. | Console message, response header, and source owner. |
| Unexpected third-party origin or script | Disable/revert the source or deployment path after confirming the artifact. | HTML/network observation and release revision. |
| Metrics exposed without intended production protection | Disable metrics or restore authentication before further analysis. | Endpoint status/header only; never the token. |
| Release provenance mismatch | Halt further deploys and identify the serving deployment/edge route. | SHA, final host, response markers, timestamps. |

---

## 5. Completion Criteria

- Every response-header writer and third-party origin has a named owner and observed effective result.
- CSP/nonces and hydration are verified in a browser for changed route classes.
- Production metrics behaviour is explicitly disabled or authenticated, with safe telemetry schemas.
- Releases carry a reproducible source-to-canonical-host evidence record.
- Incidents have scoped rollback conditions that do not weaken authentication, CSP, or privacy controls.
- No deployment, Cloudflare change, secret rotation, or vendor integration occurs merely to satisfy this plan.
## Test reconciliation update (2026-09-05)

Reconcile CI and release selection after moves; record revision/browser provenance and external side effects of helpers. Capture-only jobs do not satisfy security or release checks.

Acceptance: record current path, owner, destination/disposition, preserved assertions, affected commands, and evidence. A filename or age alone is insufficient grounds for retirement. Runtime validation remains pending; this update changes planning documents only.
