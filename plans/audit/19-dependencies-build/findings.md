# 19 — Dependencies & Build/Config

## Dependencies — MED severity (version frontier + duplication); no unused suspects

All six suspect deps are **used**: `drizzle-orm` (platform/drizzle schemas, `catalogDrizzle.ts`, `priceBookDrizzleStore.server.ts`, `db_sync_drizzle_schema.ts`), `@orama/orama` (`lib/ai/mastra/catalogLocalSearch.ts:3`), `fuse.js` (`applyCatalogProductFilters.ts:1`, tech-docs `useSearch.ts:2`), `polygon-clipping` (`generate-svg/pipelineCore.ts:22-48`), `uuid` (`normalizeUuid.ts:1`), `dockview-react` (Planner/Studio DockShells; lockfile resolves 8.2.0).

| # | Severity | Finding |
|---|----------|---------|
| 19.1 | Med | **Duplicated search capability:** two client-side search stacks ship simultaneously (`fuse.js` fuzzy filter + `@orama/orama` local index). Likely intentional (filter vs RAG-local-search) — worth consolidating. |
| 19.2 | Med | **framer-motion major split:** root `^13.1.1` vs tech-docs `^12.43.0`; the vitest lane comments (`tests/vitest.tech-docs.config.ts:61-63`) confirm the two instances must never cross. |
| 19.3 | Med | **TypeScript 7 (`^7.0.2`)** — the Go-native compiler in both packages, requiring non-standard workarounds: `experimental.useTypeScriptCli: true` (`config/build/next.config.js:402`, re-asserted in `site/next.config.js:28-33`) and `oxlint-tsgolint ^7.0.2001`. Deliberate, but at the bleeding edge of ecosystem compat. |
| 19.4 | Med | **Frontier pins:** `next 16.3.3`, `react/react-dom 19.2.8` exact-pinned, `@types/node ^26.4.0`. Mitigations present: exact pins, `--webpack` builds, `ignoreBuildErrors: false`. |
| 19.5 | Low | `react-router-dom ^7.18.3` in root devDependencies looks redundant — zero importers outside `tests/tech-docs-generator/`, and the tech-docs lane aliases the specifier to its own copy. Candidate for removal. |
| 19.6 | Low | `uuid` duplicate majors in lockfile (11.1.1 and 14.0.2); minor zod/supabase-js drift between root and tech-docs. |

## Build/config

| # | Severity | Finding |
|---|----------|---------|
| 19.7 | **Med** | **Two-layer redirect table with destination overrides:** base `config/build/next.config.js:86-276` (~95 redirects) wrapped by `site/next.config.js:15-45`, which **rewrites 8 destinations to `/`** (`HOME_REDIRECT_SOURCES`: catalog, brochure, download-brochure, news). Editors of the base table can be misled about effective behavior; pinned only by `tests/unit/config/root-configs.test.ts`. |
| 19.8 | Med(-low) | **Inverted image optimization:** on `VERCEL_ENV=production`, `unoptimized` defaults to **true** (only `NEXT_IMAGE_UNOPTIMIZED=0/false` turns the optimizer back on) (`config/build/next.config.js:31-37`). Deliberate (CDN serves originals, COST-S01) but fragile-by-intent. |
| 19.9 | Med(-low) | **Page security headers split:** `headers()` applies HSTS-preload/CSP/nosniff/XFO only to `/api/:path*` (`next.config.js:278-304`); HTML-page CSP lives in `site/proxy.ts`. Non-obvious split. |
| 19.10 | Low | `vercel.json`: `outputDirectory: "site/.next"` inert/misleading for `framework: "nextjs"`; single region `bom1`; `dependabot/**` deploys disabled; preview-host noindex header coordinates with the worker. |
| 19.11 | Low | `turbo.json` near-vestigial: tasks mirror pnpm scripts but builds run via plain `next build site --webpack`; turbo reachable only through `dev:turbo`, with an in-config RAM warning (`next.config.js:432-434`). |
| 19.12 | Info (positive) | `trailingSlash: true` with all redirect destinations slash-suffixed; `dangerouslyAllowSVG: false`; `images.qualities: [75,85]`; remote patterns limited to supabase + configured asset hosts; `serverExternalPackages` for native deps; webpack client fallbacks; `@focss` aliasing. |
