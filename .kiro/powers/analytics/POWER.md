---
name: analytics
displayName: Analytics
description: Route consent, queued events, conversion contracts, and KPI telemetry through the repository's live analytics modules while preserving the unmounted transport boundary.
keywords: ["analytics", "consent", "events", "queue", "conversion", "kpi", "vercel analytics", "speed insights"]
author: "workspace"
---

# Analytics Power

Use this power for analytics implementation and diagnosis. It documents repository behavior only and bundles no MCP server.

## Live routing

- **Consent:** `site/lib/consent.ts` reads `oando_cookie_consent`. Analytics consent exists only for the `accepted` value; rejected or absent consent is not acceptance.
- **Event entry point:** `site/lib/analytics/emitSiteEvent.ts` gates every custom event. While consent is undecided it queues; after rejection it drops; after acceptance it sends or queues when transport is unavailable.
- **Queue:** `site/lib/analytics/eventQueue.ts` keeps at most 40 in-memory events, never flushes without consent, expires events after ten minutes, and retries while the transport is not ready.
- **Transport:** `site/lib/analytics/emitTransport.ts` uses `track` from `@vercel/analytics` and treats `window.va` or `window.vaq` as readiness evidence. Do not treat a package import alone as a mounted browser transport.
- **Conversions:** `site/lib/analytics/conversionContract.ts` owns funnel event names, required fields, privacy filtering, and deduplication; `site/lib/analytics/siteEvents.ts` owns site CTA/search/compare/quote/contact helpers and planner-entry routing.
- **KPI telemetry:** `site/lib/analytics/kpiEvents.ts` emits consent-gated render, fallback, and mismatch events. `site/lib/analytics/kpiIntegrity.ts` compares rendered KPI values with `/api/business-stats` and intentionally keeps telemetry failures out of the user flow.

## Present but unmounted

`@vercel/analytics` and `@vercel/speed-insights` are dependencies, and `site/components/site/SiteAnalytics.tsx` defines consent-gated `<Analytics>` and `<SpeedInsights>` components. Current live application source has no import or render of `SiteAnalytics`; therefore both are **present but unmounted**. In that state custom events can queue, but the component does not establish browser transport readiness. Reclassify only after a live layout/component mount is proven.

## MCP status vocabulary

Use only `.kiro/mcp/**` for schema references. **Schema present** means the snapshot exists there; it does not mean **workspace configured** or **runtime installed**. `.kiro/settings/mcp.json` has an empty `mcpServers` object, so no analytics server is workspace-configured. No direct installed-power/server registry evidence was established, so runtime availability is not verified.

Do not install, configure, or invent an analytics MCP server from this power.
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.