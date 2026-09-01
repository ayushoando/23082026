# Remaining — Dependencies & build/config
**Date:** 2026-09-01

- 19.1 (Med): duplicated search stacks (fuse.js + @orama/orama) still ship simultaneously — open, not started.
- 19.2 (Med): framer-motion major split (root ^13.1.1 vs tech-docs ^12.43.0) — open, not started.
- 19.3 (Med): TypeScript 7 frontier pins requiring `experimental.useTypeScriptCli: true` + `oxlint-tsgolint` — guarded, reassessment open.
- 19.4 (Med): frontier pins (`next 16.3.3`, react 19.2.8 exact, `@types/node ^26.4.0`) — open, not started.
- 19.5: `react-router-dom` devDependency still redundant — open, not started.
- 19.6: duplicate `uuid` majors + minor zod/supabase-js drift — open, not started.
- 19.7 (Med): two-layer redirect table with 8 destination overrides in `site/next.config.js:15-45` — open, not started.
- 19.8: inverted image optimization on production (`unoptimized` defaults true) — open, not started.
- 19.9: page security headers split between `headers()` (API-only) and `site/proxy.ts` — open, not started.
- 19.10: `vercel.json` inert `outputDirectory` / single region — open, not started.
- 19.11: near-vestigial `turbo.json` — open, not started.
- 19.12: info-positive (trailingSlash, `dangerouslyAllowSVG: false`, qualities pin, scoped remote patterns) — no action required.
