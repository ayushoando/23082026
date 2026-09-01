# Plan — site/lib: AI/Mastra, SVG Pipeline, Observability

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Fix the broken descriptor persist/load contract, cap descriptor parsing, cache the lexical search index, and close the metrics-endpoint token gap.

## Actions (prioritized)
1. **High** Align `{slug}.latest.json` writers: make `site/lib/catalog/persistBlockDescriptor.ts` emit the pointer shape (`{slug, n, checksum, schemaVersion}`) the loader expects, and compute the canonical checksum — `site/lib/catalog/svg/descriptorPointer.ts`, `svgTypes.ts`.
2. **Med** Add a file-size cap before `readFileSync` in `svgBlockDescriptorLoader.ts` (`readDescriptorFile`) and bound `blocks`/`mountingPoints`/`parameterSchema` array lengths in `svgTypes.ts`.
3. **Med** Wrap `canonicalizeBlockDescriptorInput` recursion with a depth limit so `RangeError` cannot escape `parseBlockDescriptor`/`loadAll`.
4. **Med** Cache the Orama index (invalidate on catalog change) instead of rebuilding per request — `site/lib/ai/mastra/catalogLocalSearch.ts` + `catalogRetrieval.ts`.
5. **Med** Only set `lastIndexedAt` on confirmed Vectorize upsert success; add fetch timeouts — `catalogRag.ts`, `vectorizeCatalogStore.ts`.
6. **Med** Require `METRICS_AUTH_TOKEN` whenever `OBSERVABILITY_METRICS_ENABLED=1` — `site/app/api/metrics/route.ts`.
7. **Low** Deduplicate `isAbortLikeError` + stream helpers across the two advisor routes; add `jsonMode` for OpenAI/Bedrock.

## Verification
- `pnpm run test` (descriptor loader/persist suites), `pnpm run typecheck`, `pnpm run gate:fast` — owner authorization required.
