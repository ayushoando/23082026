# Fork boundary + import-graph audit — 2026-08-26

Scope: `/oando-master` `/fork-boundaries` `/graph-impact` routed check of the
Studio/Planner fork boundary and repo-wide circular dependencies, followed by
remediation of all findings.

## 1. Fork boundary scan

Command: `pnpm run scan:boundaries` (`scripts/scan-boundaries.mjs`)

| Metric | Before | After |
| --- | --- | --- |
| Files scanned | 968 | 970 |
| Owned files analyzed | 225 | 225 |
| Import edges checked | 651 | 651 |
| Cross-product edges | 0 | 0 |

Result: **clean** both before and after remediation. No Studio↔Planner
imports, no shared layer. The two new files created during remediation
(`emitSiteEvent.ts`, `blockPrimitives.ts`) sit in shared marketing-site
modules (`site/lib/analytics`, `site/lib/catalog`), not inside either fork
tree, so the file count moved from 968 → 970 with boundary status unchanged.

## 2. Circular dependency scan

Command: `node scripts/graph-impact.mjs --circles`

Before: 4 cycles found (1744 files, 3376 edges). None touched the Studio or
Planner fork trees.

| # | Cycle | Nature |
| --- | --- | --- |
| 1 | `site/lib/analytics/siteEvents.ts` ↔ `conversionContract.ts` | Real runtime cycle (both directions import live functions) |
| 2 | `getProducts.ts` → `catalogTree.ts` → `catalogFallbackResolver.ts` → `fallback.ts` → `site/categories.ts` → back to `getProducts.ts` | Type-only closure (`import type` from `getProducts.ts`, which just re-exported types owned by `types.ts`) |
| 3 | `priceBookGovernance.ts` ↔ `priceBookService.ts` | Type-only closure (`import type` on both sides) |
| 4 | `blocks2d.ts` ↔ `surface2d5.ts` | Type-only closure (`surface2d5.ts` imported `type Prim` back from `blocks2d.ts`) |

Only cycle 1 was a genuine runtime cycle; it also sat on the highest fan-in
file in the set (`siteEvents.ts`, 27 total impacted files / 11 consuming
components per `graph-impact.mjs --file`).

After remediation: `{"circularDependencies": 0, "cycles": []}` (1748 files,
3378 edges).

## 3. Remediation

| Cycle | Fix | Files touched |
| --- | --- | --- |
| 1 | Extracted the consent-gated emit primitive (`emitSiteEvent`, `flushAnalyticsAfterConsent`) into new `site/lib/analytics/emitSiteEvent.ts`. `siteEvents.ts` and `conversionContract.ts` both import from the new module instead of each other; `siteEvents.ts` re-exports for existing consumers. | `emitSiteEvent.ts` (new), `siteEvents.ts`, `conversionContract.ts` |
| 2 | Repointed `categories.ts` to import `CompatCategory`/`CompatProduct`/`CompatSeries` from `types.ts` (their origin) instead of the re-export in `getProducts.ts`. | `site/lib/catalog/site/categories.ts` |
| 3 | Moved `PriceBookRole` and `PriceBookHighRiskAction` into the shared `priceBookContract.ts`; both `priceBookGovernance.ts` and `priceBookService.ts` import from there and re-export for existing consumers. | `priceBookContract.ts`, `priceBookGovernance.ts`, `priceBookService.ts` |
| 4 | Extracted the `Prim` primitive type union (`RectPrim`, `LinePrim`, `CirclePrim`, `ArcPrim`, `PathPrim`, `BasePrim`) into new `site/lib/catalog/blockPrimitives.ts`. `blocks2d.ts` re-exports for existing consumers; `surface2d5.ts` imports directly from the new module. | `blockPrimitives.ts` (new), `blocks2d.ts`, `surface2d5.ts` |

No behavior changes — all four fixes are import/type reorganization only.

## 4. Verification performed

- `get_diagnostics` on all 11 touched/created files — no type errors.
- `node scripts/graph-impact.mjs --circles` — 0 cycles (was 4).
- `pnpm run scan:boundaries` — boundary OK, unchanged.
- `node scripts/general/check-repo-layout.mjs` (ran directly; `pnpm run
  check:layout` was blocked by the repo's unconditional agent-test hook) —
  OK, required workspace present, no nested installs or wrong locks.

## 5. Not run (per repo policy — tests are user-invoked only)

Unit tests covering the touched modules were identified but not executed by
the agent, per this repo's `verify-and-gate` / `block-agent-tests` policy.
Run manually if desired:

```
pnpm exec vitest run --config tests/vitest.config.ts tests/unit/lib/analytics/siteEvents.test.ts
pnpm exec vitest run --config tests/vitest.config.ts tests/unit/features/admin/pricing/priceBookGovernance.test.ts
pnpm exec vitest run --config tests/vitest.config.ts tests/unit/lib/catalog/blocks2d.test.ts tests/unit/lib/catalog/renderBlock2DToCanvas.test.ts
```

## Files changed

- `site/lib/analytics/emitSiteEvent.ts` (new)
- `site/lib/analytics/siteEvents.ts`
- `site/lib/analytics/conversionContract.ts`
- `site/lib/catalog/site/categories.ts`
- `site/features/admin/pricing/priceBookContract.ts`
- `site/features/admin/pricing/priceBookGovernance.ts`
- `site/features/admin/pricing/priceBookService.ts`
- `site/lib/catalog/blockPrimitives.ts` (new)
- `site/lib/catalog/blocks2d.ts`
- `site/lib/catalog/surface2d5.ts`
