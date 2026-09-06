# Architecture workflow

Use this workflow to place code and preserve product boundaries before implementation. Read the owning durable reference and, for Next.js changes, the relevant versioned guide under `node_modules/next/dist/docs/` before writing code.

## Bar
- Live architecture docs: `product-map.md` · `stack.md` · `routes.md` · `css.md` under `docs/architecture/`.
- Read product-map before placing code; stack for toolchain / PNG / packages.
- Read `docs/architecture/css.md` + `docs/governance/focss-stop-drift.md` before style changes.
- Match surrounding patterns. Do not invent a second architecture in chat.
- Edge / CSP / i18n honesty: [`../docs/architecture/stack.md`](../docs/architecture/stack.md) §7–8 + [`../docs/governance/rules.md`](../docs/governance/rules.md). Deploy: [`../OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md).

## Product shape
- **Studio** `/oostudio` · **Planner** `/ooplanner` — separate `@studio/*` / `@planner/*`, no cross-imports.
- Residual marketing `app/(site)` · admin `app/admin`.
- Fabric 2D · dockview shells (no in-app Three.js — removed 2026-08-03).
- Store: `server/{Studio,Planner}/` mode-aware wrappers — disk under
  `site/platform/{shared,Studio,Planner}/data/` in dev, Supabase in production.
  `site/data/storage/` is **legacy** — do not write there.

| ❌ Forbidden (raw disk) | ✅ Required (mode-aware) |
|---|---|
| `fs.writeFileSync(PROJECTS_DIR, data)` | `writeProjectRecord(data)` → checks `getPlannerPersistenceMode()` |
| `fs.mkdirSync(FURNITURE_DIR)` | `writeFurnitureItem(item)` → Supabase branch in prod |

## Catalog symbols
- Contract: `site/lib/catalog/planSymbolPngContract.ts` when present.
- Descriptors: `site/inventory/descriptors/` (disk mode) or `block_descriptors`
  (Supabase mode — admin DB). PNG mirror on disk: `site/public/assets/others/legacy/png-catalog/`
  (public URL stays `/png-catalog` via rewrite) — dev only.
- Furniture library: `platform/shared/data/furniture/` (disk) or
  `furniture_catalog` + the `catalog-assets` bucket (Supabase — admin DB).

## Studio → Planner

The Studio writes the furniture library; the Planner rail reads it. There is no
shared module — each fork declares its own store and they meet at the same
backing location. Keep it that way (`pnpm run scan:boundaries`).

## Client registry & logo assets
- **Canonical registry**: `site/lib/clients/clientRegistry.ts` (116 canonical clients across Financial Services, Government & Public Sector, Education & Social Impact, and Corporates & Multinationals).
- **Zero-fallback logo library**: `site/public/assets/marketing/client-logos/` (verified vector SVGs and transparent PNGs; zero letter-initial fallback boxes).
- **Name mapping**: `site/features/site/data/clientLogos.ts` (`CLIENT_LOGO_SRC_BY_NAME` dictionary with 163 mapped names and aliases).
- **Proof surfaces**: `/trusted-by` (quiet luxury split-story showcase, metric counter strip, borderless logo roster) and `/clients` (sector showcase with Schema.org `ItemList` JSON-LD).

## Security architecture
- **Universal headers**: `site/next.config.js` static `/:path*` headers. No `site/next.config.mjs`. Effective CSP is `site/proxy.ts` (nonces). `X-Frame-Options: DENY`, nosniff, `frame-ancestors 'none'`, `form-action 'self'`.
- **Edge proxy**: `site/proxy.ts` applies request nonces, CSP, cookie bounce, and sensitive API protections.
- **Secure cookies**: `site/lib/security/cookies.ts` (`DEFAULT_SECURE_COOKIE_OPTIONS`, `STRICT_SECURE_COOKIE_OPTIONS`) and `site/platform/supabase/server.ts` enforce `httpOnly: true`, `secure: true` in production, `sameSite: "lax" | "strict"`.
- **Input sanitization**: `site/lib/security/sanitize.ts` (`sanitizeInput`, `sanitizeJsonForScript`) sanitizes customer queries and SSR JSON-LD blocks.

## i18n localization
- **Message dictionaries**: `site/i18n/messages/{en,hi}.json` (861 keys across 26 namespaces, root `faq` added, 100% Hindi Devanagari parity, zero empty values).
- **Runtime copy loader**: `site/lib/i18n/withLocaleCopy.ts` hydrates localized strings across all public marketing routes and feature views.

## Tech-docs SPA & Planning tools
- **Tech-docs URL**: `https://oando23.vercel.app` in production (dev `http://localhost:3001`). Loads from root `.env.local` for Supabase.
- **Planning tools hub**: `/tools` (canonical public hub), `/tools/office-space-calculator`, `/tools/meeting-room-capacity-calculator`.

## Observability & Telemetry
- **Cloud-First Observability**: documented in [`../OBSERVABILITY.md`](../OBSERVABILITY.md).
- **Client Analytics**: Vercel Web Analytics & Speed Insights (`site/components/analytics/SiteAnalytics.tsx`) and Google Analytics 4 (`site/components/analytics/GoogleAnalytics.tsx`).
- **OpenTelemetry**: `site/instrumentation.ts` registers `@vercel/otel` and the AI SDK OpenTelemetry provider; `@opentelemetry/api` supplies the privacy-safe AI advisor span wrapper.
- **New Relic Browser**: The vendored SPA agent is served through `/newrelic.js` and guarded by the browser-key environment gate. CSP allows only the New Relic script CDN and beacon origins; nonce-based CSP remains required.
- **AI and metrics**: `site/lib/observability/aiMetrics.ts` emits `oando.ai_advisor.request` spans and Prometheus metrics for both advisor response paths. `/api/metrics` is disabled in production unless explicitly enabled and authenticated.
- **No server agent dependency**: There is no New Relic server SDK, Datadog, Traceloop, or Cast dependency. New Relic receives browser telemetry and OTLP exports; local Prometheus/Grafana is not required.

## VS Code Customization

When editing forked code under `site/{components,lib,hooks,store,server}/{Studio,Planner}/`,
VS Code Copilot automatically loads
[`.github/instructions/boundaries.instructions.md`](../.github/instructions/boundaries.instructions.md)
with fork isolation rules and the allowed/forbidden import map.

For SQL migrations under `site/platform/supabase/migrations/`, it loads
[`.github/instructions/migrations.instructions.md`](../.github/instructions/migrations.instructions.md)
with rollback requirements, Supabase grants + policies, and type regeneration.
