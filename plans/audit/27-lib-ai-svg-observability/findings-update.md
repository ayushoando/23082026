# Updated findings — 27-lib-ai-svg-observability

**Date:** 2026-09-01

## Resolved
- none yet — findings 27.1–27.10 all remain open.

## Fixed along the way (discovered during remediation)
- Following the planner-comprehensive-audit module relocation into this folder (plans/audit/27-lib-ai-svg-observability/): 17 test import paths and 9 in-module path literals were updated and the initialInventory repo-root depth corrected; planner suites verified green (67 files / 374 tests). No report-27 finding was affected.

## Remaining (failures / open items)
- 27.1: open — Orama index still rebuilt from the full catalog on every advisor request (no cache).
- 27.2: open — `catalogRag.ts` still re-embeds the entire catalog every 5 min per process; swallowed upsert failures still set `lastIndexedAt` (silently empty index for 5 min).
- 27.3: open — Vectorize REST calls lack fetch timeouts; `describeIndex` fake stats; upsert fallback id mismatch.
- 27.4: open — `jsonMode` still google/openrouter only (no OpenAI/Bedrock).
- 27.5: open (High) — two incompatible `{slug}.latest.json` writers persist; Studio-published descriptors still not loadable by `tryLoad`/`loadAll` (pointer shape + checksum).
- 27.6: open — no file-size cap before `readFileSync`+`JSON.parse`; `blocks`/`mountingPoints`/`parameterSchema` arrays unbounded.
- 27.7: open — unbounded recursion in `canonicalizeBlockDescriptorInput` can still escape `parseBlockDescriptor`/abort `loadAll`.
- 27.8: open — module-global loader cache never invalidated; pure-JS SHA-256; up to 10k sync `existsSync` probes per publish.
- 27.9: open — `/api/metrics` still fully open in prod when `OBSERVABILITY_METRICS_ENABLED=1` and `METRICS_AUTH_TOKEN` unset.
- 27.10: open — `reportClientError.ts` logs client URL + user-agent; `withAiObservability` records `durationMs: 0`.
- Lib hygiene: open — 12 files >500 lines; `isAbortLikeError` ×3, stream helpers ×2, timeout constant ×2 still duplicated.
