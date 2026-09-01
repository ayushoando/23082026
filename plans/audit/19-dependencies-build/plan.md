# Plan — Dependencies & Build/Config

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Collapse the search-stack and version duplication and make the redirect and image-optimization behavior legible.

## Actions (prioritized)
1. **Med** Consolidate or formally document the two shipping search stacks — `fuse.js` (`applyCatalogProductFilters.ts:1`, tech-docs `useSearch.ts:2`) vs `@orama/orama` (`lib/ai/mastra/catalogLocalSearch.ts:3`).
2. **Med** Bump tech-docs framer-motion `^12.43.0` to root's `^13.1.1` (`tech-docs-generator/package.json`) to end the two-instance split guarded by `tests/vitest.tech-docs.config.ts:61-63`.
3. **Med** Document or collapse the 8 redirect destination overrides in `site/next.config.js:15-45` (`HOME_REDIRECT_SOURCES`) against the base table in `config/build/next.config.js:86-276`; re-evaluate production `unoptimized: true` (`config/build/next.config.js:31-37`).
4. **Med** Keep the TS 7 / Next 16 frontier pins guarded — retain `experimental.useTypeScriptCli: true` (`config/build/next.config.js:402`, `site/next.config.js:28-33`) and exact pins until the ecosystem stabilizes; reassess at each upgrade.
5. **Low** Remove `react-router-dom` from root devDependencies (zero importers outside `tests/tech-docs-generator/`, which aliases its own copy).
6. **Low** Clean `vercel.json` (`outputDirectory` inert for nextjs) and decide `turbo.json`'s fate together with report 22.

## Verification
- `pnpm audit` and `pnpm outdated` — registry evidence; internet + owner go-ahead required.
- `pnpm run test` — includes `tests/unit/config/root-configs.test.ts`; `pnpm run build:site` — owner authorization required.
