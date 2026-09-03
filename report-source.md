# Oando codebase — deep-research report

**Audience:** project owner and maintainers  
**Research date:** 2026-09-03  
**Scope:** static inspection of the live repository source, configuration, manifests, migrations, tests-as-source, and governing documentation.

For detailed module-level analysis, see the [module-wise report index](module-reports/README.md).

## Executive answer

This is a fairly coherent Next.js 16 App Router monorepo containing three broad product surfaces: marketing/site, Admin, and two deliberately forked canvas products—Studio (`/oostudio`) and Planner (`/ooplanner`). The live architecture has strong security and persistence guardrails: server-derived ownership, explicit Supabase project selection, production filesystem protection, origin/CSRF/rate-limit checks, and response allowlists.

The codebase is not ship-certified by this research pass. No tests, typecheck, build, gate, browser, database, or deployment command was run because this request authorized research rather than validation. The most important findings are static contract or persistence gaps, not runtime reproductions:

1. The CRM project-detail flow calls the canonical Planner create endpoint using an older request/response shape. It omits required `expectedRevision` and `idempotencyKey`, and reads the returned ID from the top level even though canonical responses wrap it in `data`.
2. Studio furniture publishing reads the top PNG from the development disk path even when the selected furniture backend is Supabase. In that mode, PNG quality/checksum validation can be skipped and the descriptor checksum can be null.
3. Theme management currently stores the active theme in process-local global state, despite comments describing a future production database write. A restart or another instance will not share the change.
4. Several Admin plan and analytics responses label their source as `disk_planner_projects` even when mode selection points at Supabase, reducing observability and making operations harder to trust.
5. The repository contains recorded historical blockers around the full gate, browser availability, and Cloudflare credentials. Those records were not revalidated in this session.

## System shape

The root product package is named `ooplanner-oostudio`; its scripts build the Next app under `site/` and the separate tech-docs SPA. The product dependency set is rooted at the repository rather than a `site/package.json`; the only declared pnpm workspace package is `tech-docs-generator`. A separate Cloudflare Worker package is intentionally outside the pnpm workspace. The principal runtime versions declared in the root manifest are Next 16.3.3, React 19.2.8, TypeScript `^7.0.2`, Vitest 4.1.11, Playwright 1.62.1, Tailwind 4.3.3, Fabric 7.4.0, and Dockview React 8.2.0.

The live Next configuration uses `site/next.config.js` plus `config/build/next.config.js`. It enables standalone output, trailing slashes, explicit webpack configuration, image remote patterns, and a large permanent-redirect map for legacy product routes. The default development URL is `http://localhost:3000`; the worker and tech-docs tooling are separate deployment/runtime concerns.

A current source census found 62 page route files and 59 `/api` route files under `site/app`. The page groups are approximately marketing/site 38, Admin 19, Planner 3, Studio 1, and offline 1. The API groups are Admin 12, Planner 7, Studio 7, files 5, plus shared discovery/metadata routes. The principal implementation mass is in `site/components`, `site/features`, `site/lib`, `site/server`, and the FOCSS stylesheets.

The fork boundary is explicit in TypeScript aliases and directory layout. Planner and Studio each have their own components, hooks, stores, libraries, server code, and CSS entry point. A static import review found no direct cross-fork imports. Planner uses the current canvas scale of 0.05 px/mm; Studio retains a 0.2 px/mm legacy scale. The largest maintainability hotspots are `Planner.tsx` at roughly 3,411 lines, `Studio.tsx` at roughly 1,591 lines, `plannerProjectOperations.ts` at roughly 569 lines, and `proxy.ts` at roughly 534 lines.

### Primary surfaces

| Surface | Live route | Responsibility | Notes |
| --- | --- | --- | --- |
| Marketing/site | `/` and grouped `(site)` routes | Catalog, solutions, contact, legal, access, portal | next-intl provider and site FOCSS entry |
| Admin | `/admin/*` | Operations, plans, catalog, CRM, analytics | Requires server-side admin session |
| Planner | `/ooplanner/*` | Floor-plan canvas and project persistence | Independent Planner fork |
| Studio | `/oostudio` | Furniture/configurator canvas and publishing | Independent Studio fork |
| Tech docs | `/tech-docs` | Generated technical inventory/docs | Separate Vite package/output |
| Worker | `workers/oando-worker-proxy` | CDN/cache/proxy operations | Separate wrangler package |

## Request and security model

`site/proxy.ts` is the Next 16 Proxy layer. It handles host normalization, retired-route redirects, maintenance behavior, fast cookie checks, member-only write blocking, guest shell restrictions, CSP/security headers, and request correlation. It intentionally does not replace real session validation; layouts and API handlers perform that work.

The shared API wrapper applies rate limiting before authentication, resolves admin/member/guest roles, optionally enforces CSRF on mutations, and returns a standard error envelope. Admin routes use a stricter admin-session helper. Admin privilege is derived from Supabase `app_metadata`, not user-editable `user_metadata`. Origin checking is fail-closed in production when both Origin and Referer are absent; the development bypass is restricted to non-production and loopback/explicitly allowed hosts.

Planner’s canonical route adapter documents and implements the intended sequence: correlation, quota, schema validation, origin/CSRF, verified session, server-derived owner scope, revision/idempotency checks, persistence, then safe response. Canonical responses use an allowlisted envelope and do not expose owner identifiers, tokens, filesystem paths, or raw internal errors.

These are meaningful strengths. They also mean that older callers which bypass the canonical request contract can fail even when the UI appears to be calling the correct URL.

## Persistence and data ownership

The code separates the Admin and Products Supabase projects. Admin owns staff/customer data, Planner plans, furniture catalog rows, and block descriptors. Products owns marketing catalog/configurator data. Furniture assets use the `catalog-assets` bucket with an explicit Admin storage client for furniture-library paths; other asset families default to the Products storage client. This is safer than relying on an implicit project, but the database documentation still describes the bucket ownership more broadly as Products-owned and should be reconciled with the live asset selector.

Planner persistence is exclusive: development disk is selected only with `DEV_AUTH_BYPASS=1` outside production; otherwise Supabase is selected, and the selected backend must be configured. Production disk writes are guarded and throw `EROFS`. Planner projects use the `oando_plans` table with owner, revision, schema version, status, and timestamps; idempotency receipts support replay-safe mutations. Furniture and descriptor writes similarly have mode-aware wrappers.

One inconsistency remains: the Planner selector rejects ambiguous `DEV_AUTH_BYPASS` values, while the furniture selector effectively treats any value other than the enabled value as Supabase selection. Aligning these selectors would make deployment mistakes fail consistently.

## Key findings

### 1. High priority — CRM and canonical Planner API contracts do not match

`ProjectDetailView` lists Planner projects by accepting either a bare array or a legacy `documents` property. The canonical Planner success response is `{ success, contractVersion, data, correlationId }`, so the live list result is not read from `data` by this caller.

Its create flow sends `name`, `canvas_json`, `sheet`, and `layers`, but the canonical mutation pipeline requires `expectedRevision: 0` for creation and a valid `idempotencyKey`. The same flow then expects `body.id`, while the canonical result is wrapped in `body.data`. The nearby comment also says “Create on disk,” although the active persistence mode may be Supabase.

This is a static contract mismatch. It should be confirmed with an authorized targeted test or browser check, then fixed by using the canonical client contract or deliberately routing this legacy CRM action through a documented legacy endpoint.

### 2. High priority — Studio Supabase publishing still reads a disk-only PNG

The Studio publish route reads `${FURNITURE_DIR}/${id}_top.png` directly. The publishing service performs PNG quality/checksum work only when bytes are supplied. In Supabase mode, furniture assets are stored/retrieved through the Admin `catalog-assets` bucket, so the publish route may not find the PNG on disk. The result can be a published descriptor with no top-PNG checksum and without the intended quality validation.

The publish flow should resolve the asset through the selected catalog backend and pass the retrieved bytes, or make the publish operation explicitly fail when the required asset is unavailable.

### 3. High priority — active theme state is not durable

`/api/theme/manage` validates the requested theme and calls `setActiveThemeId`. The implementation stores the active ID in `globalThis` or an environment default. It does not currently write a database row. Consequently, an instance restart, deployment, or multi-instance request can lose or disagree on the selected theme.

Either persist the active theme in the intended backing store and read it through the same selector, or label the endpoint as development/process-local behavior and prevent it from presenting itself as durable production management.

### 4. Medium priority — backend source telemetry is hardcoded in Admin plan paths

Admin plan PATCH/DELETE handlers, the Admin plan detail handler, and Admin analytics responses include `disk_planner_projects` as their source label. The underlying project store has a mode-aware `getPlannerProjectsSource()` that can return `supabase_oando_plans`. This is an observability correctness issue rather than evidence that the actual write selected disk.

The response and telemetry should use the selected source helper everywhere. Analytics should also distinguish actual event telemetry from catalog-derived or heuristic metrics.

### 5. Medium priority — two plan API contracts remain live

The legacy `/api/plans` and `/api/admin/plans` handlers still use legacy document-store functions, while `/api/Planner/projects` is the canonical revision/idempotency pipeline. Both are backed by the same mode-aware project store, but their envelopes, mutation preconditions, and telemetry differ. This creates a compatibility surface that is already implicated by the CRM mismatch.

The project should designate one canonical contract, define the compatibility boundary, and either migrate callers or document and test the legacy behavior explicitly.

### 6. Medium priority — documentation and localization descriptions lag live code

Live i18n configuration supports `en` and `hi`, reads a validated `NEXT_LOCALE` cookie, and the Planner entry uses translated `workspace` messages. Some repository docs still describe the implementation as English-only, while a Header comment lists five locales that are not present in the live configuration. The route architecture document also understates the redirect configuration present in the live Next config. These inconsistencies can mislead maintainers and release reviewers.

The database documentation likewise needs to state the actual per-prefix storage-project rule for `catalog-assets`.

### 7. Medium priority — furniture mode parsing is less fail-closed than Planner mode parsing

Planner persistence rejects ambiguous bypass values. Furniture catalog mode selects disk only when the bypass is enabled and otherwise falls through to Supabase. Inconsistent environment parsing makes misconfiguration behavior harder to reason about and can produce confusing “missing Supabase credentials” failures.

Use one shared strict mode parser for all mode-aware stores.

### 8. Accepted security debt — static admin-token fallback has a sunset date

The customer-query management route has the stronger Supabase admin-session path but still accepts a deprecated `x-admin-token` fallback when configured. The implementation uses timing-safe comparison and logs a warning; the code sets a sunset date of 2026-12-01. This is contained, explicitly marked, and should remain on the removal schedule.

## Resilience and operational posture

The code contains useful resilience mechanisms: Planner revision compare-and-swap semantics, idempotency receipts, client-side drafts/backups for UX continuity, guarded local uploads, safe response envelopes, and provider fallbacks for the AI advisor. These mechanisms should not be interpreted as validation results; their runtime effectiveness still needs authorized test/gate execution.

The repository’s `Failures.md` records historical P1 conditions: a rejected Cloudflare API token blocking Vectorize creation/worker deployment, a full-gate run that stopped with 22 failed tests before later targeted fixes, earlier command-hook authorization blocks, and a browser walk that could not connect to localhost. These are repository-recorded observations from earlier dates, not current-session reproductions.

## Recommended order of work

1. Repair or intentionally adapt the CRM caller to the canonical Planner request/response contract.
2. Make Studio publishing retrieve the top PNG through the selected persistence mode and preserve quality/checksum guarantees.
3. Decide and implement durable theme persistence, or explicitly downgrade the endpoint to development-only state.
4. Replace hardcoded Planner source labels and define the canonical-versus-legacy plan API boundary.
5. Reconcile storage, redirects, and locale documentation with live code; centralize strict persistence-mode parsing.
6. Remove the static admin-token fallback by its stated sunset date.
7. After exact authorization, run the repository’s prescribed validation sequence, including both test lanes, typecheck/build/gates, boundary scanning for either fork, browser checks on `http://localhost:3000`, and deployment/DB checks where applicable.

## Validation boundaries and limitations

This report is based on source and documentation inspection only. I did not run `pnpm` tests, typecheck, build, gates, browser checks, database commands, deployment commands, or boundary scans. No live Supabase, Cloudflare, Vercel, or browser state was observed. No runtime failure in the findings above is claimed without an authorized reproduction.

The report is a research artifact, not a replacement for `Failures.md`, the repository handbooks, or an authorized release gate. The repository root was also not recognized as a Git worktree during inspection, so no branch/diff status is asserted.

## Claim-to-source ledger

| Claim | Primary source |
| --- | --- |
| Next app build, package versions, scripts, and workspace shape | [`package.json`](package.json), [`pnpm-workspace.yaml`](pnpm-workspace.yaml) |
| Next 16 configuration, standalone output, redirects, asset and webpack policy | [`site/next.config.js`](site/next.config.js), [`config/build/next.config.js`](config/build/next.config.js) |
| Fork aliases and directory boundaries | [`site/tsconfig.json`](site/tsconfig.json), [`README.md`](README.md) |
| Next 16 Proxy behavior and security boundary | [`site/proxy.ts`](site/proxy.ts), [`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`](node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md) |
| Route-handler contract and canonical Planner response envelope | [`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`](node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md), [`site/lib/Planner/plannerApiResponse.ts`](site/lib/Planner/plannerApiResponse.ts), [`site/app/api/Planner/projects/route.ts`](site/app/api/Planner/projects/route.ts) |
| CRM request/response mismatch | [`site/features/crm/ProjectDetailView.tsx`](site/features/crm/ProjectDetailView.tsx), [`site/lib/Planner/plannerRequestPipeline.ts`](site/lib/Planner/plannerRequestPipeline.ts) |
| Planner persistence selector and mode-aware store | [`site/lib/Planner/plannerPersistenceMode.ts`](site/lib/Planner/plannerPersistenceMode.ts), [`site/lib/Planner/projectsStore.ts`](site/lib/Planner/projectsStore.ts), [`site/server/Planner/plannerStore.ts`](site/server/Planner/plannerStore.ts) |
| Furniture/descriptor ownership and asset storage | [`site/lib/catalog/furnitureCatalogMode.ts`](site/lib/catalog/furnitureCatalogMode.ts), [`site/lib/catalog/furnitureCatalogStore.supabase.ts`](site/lib/catalog/furnitureCatalogStore.supabase.ts), [`site/lib/catalog/blockDescriptorStore.supabase.ts`](site/lib/catalog/blockDescriptorStore.supabase.ts), [`site/features/shared/catalog/catalogAssetStorage.server.ts`](site/features/shared/catalog/catalogAssetStorage.server.ts) |
| Studio publish PNG path and checksum behavior | [`site/app/api/Studio/furniture/[id]/publish/route.ts`](<site/app/api/Studio/furniture/[id]/publish/route.ts>), [`site/server/Studio/publishFurnitureToCatalog.ts`](site/server/Studio/publishFurnitureToCatalog.ts) |
| Production disk-write guard | [`site/lib/persistence/assertDevDiskWritable.ts`](site/lib/persistence/assertDevDiskWritable.ts), [`site/app/api/exports/route.ts`](site/app/api/exports/route.ts) |
| Theme process-local state | [`site/app/api/theme/manage/route.ts`](site/app/api/theme/manage/route.ts), [`site/lib/theme/activeThemeId.ts`](site/lib/theme/activeThemeId.ts) |
| Admin source-label drift and analytics heuristics | [`site/app/api/admin/plans/route.ts`](site/app/api/admin/plans/route.ts), [`site/app/api/admin/plans/[id]/route.ts`](<site/app/api/admin/plans/[id]/route.ts>), [`site/app/api/admin/analytics/route.ts`](site/app/api/admin/analytics/route.ts) |
| Locale implementation and documentation drift | [`site/i18n/config.ts`](site/i18n/config.ts), [`site/i18n/request.ts`](site/i18n/request.ts), [`site/components/Planner/PlannerEntry.tsx`](site/components/Planner/PlannerEntry.tsx), [`docs/architecture/stack.md`](docs/architecture/stack.md), [`README.md`](README.md) |
| Deprecated admin-token fallback and recorded historical blockers | [`site/lib/security/staticAdminToken.ts`](site/lib/security/staticAdminToken.ts), [`site/app/api/customer-queries/manage/route.ts`](site/app/api/customer-queries/manage/route.ts), [`Failures.md`](Failures.md) |
