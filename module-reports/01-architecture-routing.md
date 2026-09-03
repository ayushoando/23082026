# Module 01 - architecture and routing

## Summary

The repository is a root-managed Next.js 16 App Router application with a separate Vite technical-docs package and a separate Cloudflare Worker package. The Next app combines marketing/site routes, Admin routes, Planner, and Studio. Planner and Studio are intentionally forked and have separate implementation trees and CSS entries.

The architecture is understandable from the live files. The main maintenance risk is not unclear ownership in code; it is drift between documentation, compatibility routes, and callers using old contracts.

## Ownership and layout

| Area | Location | Role |
| --- | --- | --- |
| Next app | [`site/`](../site) | Runtime application |
| Marketing/Admin routes | [`site/app/(site)`](<../site/app/(site)>), [`site/app/admin`](../site/app/admin) | Public site and staff suite |
| Planner fork | [`site/components/Planner`](../site/components/Planner), [`site/features/Planner`](../site/features/Planner), corresponding lib/hooks/store/server trees | Floor-plan product |
| Studio fork | [`site/components/Studio`](../site/components/Studio), [`site/features/Studio`](../site/features/Studio), corresponding lib/hooks/store/server trees | Furniture/configurator product |
| CSS | [`site/focss`](../site/focss) | FOCSS zone entries and layers |
| Tech docs | [`tech-docs-generator`](../tech-docs-generator) | Separate generated inventory/docs SPA |
| Worker | [`workers/oando-worker-proxy`](../workers/oando-worker-proxy) | CDN/cache/proxy deployment |

The aliases in [`site/tsconfig.json`](../site/tsconfig.json) make the fork boundary visible: `@planner/*` resolves into Planner code and `@studio/*` resolves into Studio code. A static import review found no direct cross-fork imports.

## Runtime and build configuration

[`site/next.config.js`](../site/next.config.js) composes [`config/build/next.config.js`](../config/build/next.config.js) and the next-intl plugin. The live configuration declares:

- standalone output and output tracing from the repository root;
- trailing slashes and a localhost development URL;
- explicit webpack behavior and FOCSS aliases;
- image remote patterns with SVG disabled and production images unoptimized by default;
- server external packages for sharp, lancedb, and Mastra;
- permanent redirects for legacy routes and a rewrite for generated tech docs;
- strict build type errors (`ignoreBuildErrors: false`).

The root scripts use webpack explicitly for development and site builds. The repository package manifest owns the main dependency graph, while `tech-docs-generator` is the declared workspace package. The worker is deployed with wrangler and is intentionally not part of that workspace.

## Route surface

A current file census found 62 page route files and 59 `/api` route files under `site/app`. The principal page groups are:

- marketing/site: home, products, solutions, tools, portal, access, legal, contact, and supporting pages;
- Admin: dashboard, catalog, CRM, plans, analytics, and operational screens;
- Planner: entry, project list, and project detail;
- Studio: the dedicated furniture/configurator entry;
- offline and discovery/meta routes.

The API groups are Admin, Planner, Studio, files, customer-query/theme/export/AI endpoints, and discovery/metadata routes.

[`site/proxy.ts`](../site/proxy.ts) centralizes host redirects, retired-path redirects, maintenance handling, member-only write blocking, protected page fast checks, CSP, and security headers. It is a request boundary, not the sole authentication authority; layouts and handlers validate sessions.

## Styling architecture

The FOCSS entry files create distinct zones:

- site: marketing base, runtime, document, typography, headings, and components;
- Admin: admin tokens, shell, type, buttons, primitives, pages, catalog, CRM, and hub styles;
- Planner: Tailwind, palette, semantic/layout, controls, workspace, responsive, and Dockview layers;
- Studio: site base/runtime plus Studio-specific base, chrome, controls, workspace, and Dockview layers.

The site component index intentionally ships a broad marketing component set on marketing routes. That is documented as an accepted bundle-size tradeoff, but it should be measured when performance is a release concern.

## Findings and recommendations

1. Keep the TypeScript aliases and import boundary as the authoritative fork contract; update documentation whenever route ownership moves.
2. Treat the redirect map in [`config/build/next.config.js`](../config/build/next.config.js) as live behavior. The route architecture document currently understates this configuration.
3. Add an automated ownership check to the authorized boundary scan workflow before changing either fork.
4. Break large canvas components into domain/state/rendering modules only when behavior-preserving tests and ownership are available; avoid broad refactoring during contract fixes.

## Evidence

- [`package.json`](../package.json)
- [`pnpm-workspace.yaml`](../pnpm-workspace.yaml)
- [`site/next.config.js`](../site/next.config.js)
- [`config/build/next.config.js`](../config/build/next.config.js)
- [`site/tsconfig.json`](../site/tsconfig.json)
- [`site/app`](../site/app)
- [`docs/architecture/layout.md`](../docs/architecture/layout.md)
- [`docs/architecture/routes.md`](../docs/architecture/routes.md)

