# 05 — Dead Code & Orphaned Modules

Spot-check audit of exported modules with zero importers.

| # | Severity | Finding |
|---|----------|---------|
| 5.1 | Med | **`site/components/pwa/ServiceWorkerRegister.tsx`: zero importers** (grep across `site/` matches only itself) **and** it registers `/sw.js`, which does not exist (`site/public/` has no `sw.js`/`manifest.json`). Double-dead PWA leftover. |
| 5.2 | Low | **`site/components/home/Hero.tsx`** (204 lines, h1-bearing) has zero importers — homepage uses `HomepageHero` (`(site)/page.tsx:4,49`). Still carried in the style-token baseline with 4 findings (`config/quality/style-token-baseline.json:15`). |
| 5.3 | Low | **`site/lib/images/optimizerMode.ts`: no runtime importer.** Referenced only by a "keep in sync" comment in `config/build/next.config.js:30` and its own test (`tests/unit/lib/images/optimizerMode.test.ts:3`). Tested-but-unwired duplicate of config logic; drift risk if next.config changes. |

## Verified alive (no action)

`hooks/useSectorTabs.ts` (4 importers), `lib/productDataTables.ts`, `lib/unwrapActionResult.ts`, `lib/kpiFormat.ts`, `lib/configurator/smartWizard*` (route `api/configurator/smart-wizard`), `lib/uuid/normalizeUuid.ts` (3), `lib/persistence/assertDevDiskWritable.ts` (5), `lib/client/afterIdle.ts` (HomepageHero), `lib/apiCatalog.ts`/`lib/securityTxt.ts` (metadata routes).

**Deletion policy note:** per standing repo rule, nothing here is deleted by this audit — all removals are user-confirmed, per-path, with git-recoverability checks first.
