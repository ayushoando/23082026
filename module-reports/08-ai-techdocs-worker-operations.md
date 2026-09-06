# Module 08 - AI, tech docs, worker, and operations

## Summary

The auxiliary systems are intentionally separated from the primary product canvas code. AI advisor routes use server-side provider selection and sanitized user input, the tech-docs generator is a separate Vite package, and the Cloudflare Worker is a separate wrangler package for CDN/cache/proxy concerns.

These modules generally degrade or fail safely when optional services are missing, but their external operational state was not validated in this session.

## AI advisor

[`site/lib/ai/mastra/providers.ts`](../site/lib/ai/mastra/providers.ts) defines an allowlisted provider chain covering Gemini, OpenRouter, OpenAI, and Bedrock, selected through server-side environment configuration. [`sanitizeUserInput.ts`](../site/lib/ai/sanitizeUserInput.ts) strips risky formatting and caps user input.

The public AI advisor route applies guest rate limiting and CSRF/origin controls, retrieves catalog context where configured, and falls back to a heuristic response when no provider is available. Planner has a separate route/pipeline integration so the fork boundary remains intact.

Vectorize catalog search is implemented as a REST-backed optional store. Missing configuration produces a no-op/degraded path rather than a hard dependency for every request. This is useful for local operation but can conceal a missing semantic-index capability unless the response or observability clearly identifies fallback mode.

## Tech-docs generator

[`tech-docs-generator/package.json`](../tech-docs-generator/package.json) describes a separate Vite application that generates and builds the technical docs/inventory surface. Its generated output is disposable and should not be treated as hand-maintained product source. The main application links to it through a configurable `NEXT_PUBLIC_TECH_DOCS_URL` boundary.

The root build runs site and tech-docs builds separately. The repository’s test command also has two Vitest lanes, including the tech-docs lane; neither was run for this research.

## Cloudflare Worker

The worker package uses wrangler, binds the `oando-asset-cdn` R2 bucket, references `VERCEL_ORIGIN`, and configures the `catalog-nav` Vectorize index. Its cache policy excludes private/API/product workspace prefixes from public caching, redirects apex/www as configured, and gives long TTLs to static assets while using shorter/stale-while-revalidate behavior elsewhere.

The cache policy is security-sensitive: changes to private-prefix matching can expose authenticated or personalized responses. It should be validated with an authorized deployment/browser check whenever route prefixes change.

## Telemetry and observability

Observability follows the lean, cloud-first architecture documented in [`OBSERVABILITY.md`](../OBSERVABILITY.md). The platform uses decoupled telemetry paths without a permanently enabled daemon. New Relic is intentionally present for Browser SPA monitoring, OTLP ingest, and an opt-in Node APM hybrid bridge:

1. **Client Real User Monitoring (RUM) & Core Web Vitals:** `@vercel/analytics` and `@vercel/speed-insights` in [`site/components/analytics/SiteAnalytics.tsx`](../site/components/analytics/SiteAnalytics.tsx) provide Vercel Core Web Vitals tracking (LCP, INP, CLS).
2. **New Relic Browser:** [`NewRelicScript.tsx`](../site/components/analytics/NewRelicScript.tsx) loads the vendored SPA agent from `/newrelic.js`; the runtime CSP allows only the required New Relic origins and the agent excludes payload/header capture.
3. **Business & Marketing Analytics:** Google Analytics 4 via [`GoogleAnalytics.tsx`](../site/components/analytics/GoogleAnalytics.tsx) when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. Not `@next/third-parties/google`.
4. **Distributed Tracing and AI telemetry:** [`site/instrumentation.ts`](../site/instrumentation.ts) registers `@vercel/otel` and the AI SDK OpenTelemetry provider. [`aiMetrics.ts`](../site/lib/observability/aiMetrics.ts) adds `oando.ai_advisor.request` spans and safe Prometheus metrics for streaming and non-streaming advisor paths; OTLP can export to New Relic with server-only environment credentials.
5. **Optional Node APM bridge:** [`config/observability/newrelic.cjs`](../config/observability/newrelic.cjs) enables the New Relic hybrid agent only when `NEW_RELIC_APM_ENABLED=1`, disables duplicate Next/http/undici instrumentations, and excludes headers/parameters from captured attributes.
6. **Metrics Endpoint:** [`/api/metrics`](../site/app/api/metrics/route.ts) serves Prometheus exposition locally. Production is 404-disabled unless explicitly enabled and returns 401/503 when authentication is missing or invalid.

## Operational records

[`Failures.md`](../Failures.md) records a rejected Cloudflare API token that blocked Vectorize creation and worker deployment. It also records a prior full-gate failure, later targeted test fixes that were not followed by a complete re-gate, earlier command-hook authorization blocks, and a browser walk that could not connect to localhost. These are historical repository records; this report does not convert them into current status.

The release workflow declares Node 24 and environment-driven test/build/browser jobs. The presence of a workflow is not evidence that the latest source passed it.

## Findings and recommendations

1. Keep AI provider/index fallback state visible through the existing privacy-safe telemetry.
2. Keep worker private-prefix cache exclusions synchronized with the Next route map.
3. Resolve the Cloudflare credential blocker before claiming worker/Vectorize readiness.
4. Re-run both test lanes and the full authorized gate after the recorded fixes.
5. Keep generated tech-docs output separate from hand-maintained source and document the publish boundary.
6. Keep the Node APM bridge opt-in and validate its overhead and span de-duplication before enabling it in production.

## Evidence

- [`site/app/api/ai-advisor/route.ts`](../site/app/api/ai-advisor/route.ts)
- [`site/app/api/Planner/ai-advisor/route.ts`](../site/app/api/Planner/ai-advisor/route.ts)
- [`site/lib/ai/mastra/providers.ts`](../site/lib/ai/mastra/providers.ts)
- [`site/lib/ai/sanitizeUserInput.ts`](../site/lib/ai/sanitizeUserInput.ts)
- [`site/lib/ai/mastra/vectorizeCatalogStore.ts`](../site/lib/ai/mastra/vectorizeCatalogStore.ts)
- [`tech-docs-generator/package.json`](../tech-docs-generator/package.json)
- [`workers/oando-worker-proxy/package.json`](../workers/oando-worker-proxy/package.json)
- [`workers/oando-worker-proxy/wrangler.toml`](../workers/oando-worker-proxy/wrangler.toml)
- [`OBSERVABILITY.md`](../OBSERVABILITY.md)
- [`Failures.md`](../Failures.md)
- [`.github/workflows/release-gate.yml`](../.github/workflows/release-gate.yml)
