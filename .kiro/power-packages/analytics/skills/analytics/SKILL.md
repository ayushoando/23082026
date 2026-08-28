---
name: analytics
description: Route analytics events through repository consent gating, queueing, conversion contracts, and KPI telemetry.
---

# Analytics

## Flow

`siteEvents` / `conversionContract` / `kpiEvents` → `emitSiteEvent` → consent check → `emitTransport` or `eventQueue`.

## Modules

- Consent: `site/lib/consent.ts`. Accepted emits, undecided queues, rejected drops.
- Entry point: `site/lib/analytics/emitSiteEvent.ts`
- Queue: `site/lib/analytics/eventQueue.ts`
- Transport: `site/lib/analytics/emitTransport.ts`
- Taxonomy and privacy filtering: `site/lib/analytics/conversionContract.ts`
- Site helpers: `site/lib/analytics/siteEvents.ts`
- KPIs: `site/lib/analytics/kpiEvents.ts`, `site/lib/analytics/kpiIntegrity.ts`

## Transport status

`@vercel/analytics` and `@vercel/speed-insights` are installed and `site/components/site/SiteAnalytics.tsx` defines both components, but no live importer or render was found. Treat them as present but unmounted. CSP allowance alone does not prove GA4 or Zaraz invocation.
