# Test layout

Tests are organized by test kind and then mirror their owning repository source path.

- `unit/<source-root>/...` — isolated behavior and component contracts.
- `integration/<source-root>/...` — collaboration between repository modules.
- `e2e/site/app/<route-root>/...` — route-owned browser journeys.
- `e2e/tech-docs-generator/...` — tech-docs browser journeys.
- `support/` — fixtures, page objects, accessibility, visual, and UI-state helpers.
- `manifests/` — ownership, coverage exceptions, skip exceptions, and visual baselines.

The Tech-Docs Vitest suite and its support files are package-local at `tech-docs-generator/tests/`.

Canonical examples:

```text
tests/unit/site/components/Planner/ui/PlannerPhIcon.test.tsx
tests/integration/site/lib/catalog/catalogTree.test.ts
tests/e2e/site/app/ooplanner/dockview.spec.ts
tests/unit/scripts/general/check-test-layout.test.ts
```

Planner and Studio tests remain independent. A test under a Planner path must not import `@studio/*`, and a Studio test must not import `@planner/*`.

Legacy locations are temporary migration debt recorded in `manifests/source-test-ownership.json`. New tests must use canonical paths. Generated inventory covers `tests/`; it lives in `INVENTORY.md` and `results/test-inventory.json`.

## Orphan audit (2026-09-05)

Static inventory only. No files were moved or deleted. Filename or age is not retirement grounds (`plans/05092026/06-test-subsystem-and-integrity-audits.md`). `pnpm run test` / full Vitest was not run.

### Top-level `tests/` vs Plan 06 intended

Plan 06 intended roots: `unit/`, `integration/`, `e2e/`, `fixtures/`, `helpers/`, `manifests/`, `support/`. Tech-docs lane is package-local at `tech-docs-generator/tests/` (42 executable files; not under `tests/`).

| Path | Kind | vs intended |
| --- | --- | --- |
| `tests/unit/` | dir | present (672 executable) |
| `tests/integration/` | dir | present (30 executable) |
| `tests/e2e/` | dir | present (85 Playwright specs, all at `tests/e2e/*.spec.ts`; no `tests/e2e/site/app/...` tree) |
| `tests/fixtures/` | dir | present |
| `tests/helpers/` | dir | present |
| `tests/manifests/` | dir | present |
| `tests/support/` | dir | present |
| `tests/operations-review/` | dir | extra vs the seven intended roots; listed as standalone in `manifests/source-test-ownership.json` (16 files; sources still exist under `scripts/operations-review/`) |
| `tests/site-ui-content-links-audit/` | dir | extra vs the seven intended roots; listed as standalone in the same manifest (11 files; sources still exist under `scripts/site-ui-content-links-audit/`) |

Canonical CONTENTS examples `tests/e2e/site/app/ooplanner/dockview.spec.ts` and `tests/integration/site/lib/catalog/catalogTree.test.ts` are target paths; those trees are not on disk yet.

Live counts from this audit: 814 executable files under `tests/` (Vitest `*.test.*` + Playwright `*.spec.*`) plus 42 under `tech-docs-generator/tests/`. `INVENTORY.md` (same date) lists 727 Vitest + 85 Playwright under `tests/` only.

### Vitest configs vs `pnpm run test`

`pnpm run test` → `scripts/run-full-vitest.mjs` → Lane 1 `tests/vitest.config.ts` + Lane 2 `tests/vitest.tech-docs.config.ts`. Shared constants: `tests/vitest.shared.ts`.

| Current path | Owner | Disposition | Why |
| --- | --- | --- | --- |
| `tests/vitest.config.ts` | unit/integration (Lane 1) | keep | Dual-lane entry. |
| `tests/vitest.tech-docs.config.ts` | tech-docs (Lane 2) | keep | Dual-lane entry. |
| `tests/vitest.shared.ts` | both lanes | keep | Shared include/exclude/coverage. |
| `tests/vitest.site.config.ts` | coverage | keep | Used by `pnpm run test:coverage:site`, not by `pnpm run test`. |
| `tests/vitest.admin.coverage.config.ts` | coverage | keep | Used by `pnpm run test:coverage:admin`. |
| `tests/vitest.coverage.inventory.config.ts` | coverage | keep | Used by `pnpm run ops test:coverage:inventory`. |
| `tests/vitest.admin.live.coverage.config.ts` | coverage | investigate | Not referenced by `package.json` or `scripts/run-ops.mjs`; only appears in generated inventory. Do not delete until a consumer is confirmed or the profile is explicitly retired. |

### Three.js / Open3D

`three` / `@react-three/*` are absent from `package.json`. `docs/architecture/stack.md` records 3D removal. `site/app` has no Open3D tree. `/planner/open3d` is a 301 to `/ooplanner` (`config/build/next.config.js`). `data-testid="planner-3d-canvas"` does not exist under `site/`. Gate specs already assert the 3D canvas is absent.

Open3D world pack still declared in `config/build/playwright-open3d-world-specs.json` (not in `config/build/playwright-gate-specs.json`).

| Current path | Owner | Disposition | Why |
| --- | --- | --- | --- |
| `tests/e2e/open3d-3d-presence-residual.spec.ts` | e2e | investigate | Requires `planner-3d-canvas` and `__open3dSceneProbe` / Three scene walk. Product 3D surface is gone. Do not delete; equivalent 2D coverage may exist elsewhere. |
| `tests/e2e/open3d-console-clean.spec.ts` | e2e | investigate | Asserts `planner-3d-canvas` visible and `THREE.Color` console bar. |
| `tests/e2e/open3d-mesh-symbol-live-verify.spec.ts` | e2e | investigate | `switchPlannerViewMode(..., "3d")` + 3D canvas visible. |
| `tests/e2e/open3d-systems-v0-mesh-batch-shots.spec.ts` | e2e | investigate | Same 3D canvas / view-mode dependency. |
| `tests/e2e/open3d-w4-orbit-continuity.spec.ts` | e2e | investigate | 3D orbit continuity; listed in the Open3D world pack. |
| `tests/e2e/open3d-world-standard-journey.spec.ts` | e2e | investigate | Mixed 2D journey plus a 3D canvas visibility step; listed in the Open3D world pack. |
| `tests/e2e/planner-j4-3d-parity.spec.ts` | e2e | investigate | J4 2D↔3D parity against `planner-3d-canvas` and split 3D pane. |
| `tests/e2e/planner-j6-member-restore.spec.ts` | e2e | investigate | Member restore asserts 3D canvas visible. Keep 2D restore assertions until split. |
| `tests/e2e/planner-chrome.spec.ts` | e2e (gate) | keep | Asserts `planner-3d-canvas` count 0 — current product. Later move to `tests/e2e/site/app/ooplanner/`. |
| `tests/e2e/planner-guest-workspace.spec.ts` | e2e (gate) | keep | Same absence assertion. Later move to `tests/e2e/site/app/ooplanner/`. |
| `tests/e2e/open3d-cp05-symbols-s7.spec.ts` | e2e | keep + later move | Fabric/SVG 2D journey; Open3D filename only. Destination `tests/e2e/site/app/ooplanner/`. |
| `tests/e2e/open3d-p01-svg-symbol-persist.spec.ts` | e2e | keep + later move | 2D SVG persist. Same destination. |
| `tests/e2e/open3d-p02-toolbar-truth.spec.ts` | e2e | keep + later move | 2D toolbar/prefs. Same destination. |
| `tests/e2e/open3d-p03-inspector-units.spec.ts` | e2e | keep + later move | 2D inspector. Same destination. |
| `tests/e2e/open3d-p04-snap-measure.spec.ts` | e2e | keep + later move | 2D snap/measure. Same destination. |
| `tests/e2e/open3d-p05-cabinet-multiprim.spec.ts` | e2e | keep + later move | Switches to 2D; no 3D canvas assertion found. Same destination. |
| `tests/e2e/open3d-p06-symbols-inventory.spec.ts` | e2e | keep + later move | 2D symbols inventory. Same destination. |
| `tests/e2e/open3d-p11-theme-mount.spec.ts` | e2e | keep + later move | Theme toggle on guest Planner. Same destination. |
| `tests/e2e/open3d-systems-v0-batch-place.spec.ts` | e2e | keep + later move | Systems v0 2D place; still in Open3D world pack. Same destination. |
| `tests/e2e/open3d-systems-v0-configurator.spec.ts` | e2e | keep + later move | Configurator place. Same destination. |
| `tests/e2e/open3d-systems-v0-place-delete.spec.ts` | e2e | keep + later move | Place/delete. Same destination. |
| `tests/e2e/open3d-systems-v0-workstation-place.spec.ts` | e2e | keep + later move | Workstation place. Same destination. |
| `tests/e2e/open3d-w3-select-delete.spec.ts` | e2e | keep + later move | Select/delete; Open3D world pack. Same destination. |
| `tests/e2e/open3d-w5-save-honesty.spec.ts` | e2e | keep + later move | Save honesty; Open3D world pack. Same destination. |
| `tests/unit/config/playwrightOpen3dWorldSpecs.test.ts` | unit | investigate | Existence contract for the Open3D pack JSON. Keep while those specs remain; do not treat filename as retirement. |
| `config/build/playwright-open3d-world-specs.json` | config (not under `tests/`) | investigate | Still lists five `tests/e2e/open3d-*.spec.ts` paths; not consumed by `pnpm run test`. |

### Tests / helpers whose imported source is gone

| Current path | Owner | Disposition | Why |
| --- | --- | --- | --- |
| `tests/e2e/helpers/isolatedAdminSvgPublishWorker.ts` | e2e helper | investigate | Imports deleted `@/features/planner/asset-engine/svg/compileSvgForPublish` (no remaining export of that name), `@/features/admin/product-studio/storage/persistBlockDescriptor` (live module is `@/lib/catalog/persistBlockDescriptor`), and `@/features/admin/product-studio/storage/catalogWriteIsolation` (live module is `@/lib/catalog/catalogWriteIsolation`). Consumed by `tests/e2e/helpers/isolatedAdminSvgPublish.ts`. |
| `tests/helpers/adminCatalogIsolation.ts` | unit helper | investigate | Same deleted `product-studio/storage/catalogWriteIsolation` import. |

Heuristic filename-to-source matching flagged 161 unit/integration files (suffixes such as `.property.test.ts`, Planner/Studio aggregates, script tests under `tests/unit/scripts/` vs `scripts/general/`). Those are layout debt, not deleted sources. Import resolution of executable tests did not find other missing application modules.

### Layout debt (not orphans)

`manifests/source-test-ownership.json` already allowlists these prefixes through 2026-12-31. Classify as later move, keep until a Plan 06 batch claims them.

| Current prefix | Owner | Destination | Why |
| --- | --- | --- | --- |
| `tests/unit/app/`, `components/`, `features/`, `hooks/`, `i18n/`, `lib/`, `platform/`, `server/`, `store/` | unit | `tests/unit/site/<same>/` | Source-mirrored paths; `tests/unit/site/` already holds 7 canonical files with no basename overlap against the legacy trees. |
| `tests/unit/planner/`, `tests/unit/studio/` | unit | `tests/unit/site/{components,lib,hooks,store,server}/{Planner,Studio}/` | Aggregate forks; imports still resolve to live `@planner/*` / `@studio/*` modules. |
| `tests/unit/scripts/` | unit | `tests/unit/scripts/general/` where the script lives under `scripts/general/` | Layout, not missing source. |
| `tests/unit/e2e-helpers/` | unit | `tests/support/` | Tests e2e helpers. |
| `tests/integration/*` (not under `site/`) | integration | `tests/integration/site/...` | 30 files. 26 share basenames with a unit file of the same relative feature path (unit vs integration pair, not a duplicate path). |
| `tests/e2e/*.spec.ts` (85 files) | e2e | `tests/e2e/site/app/{(site),admin,ooplanner,oostudio}/` by route | Plan 06: assign Marketing/Admin/Planner/Studio owners before moving. |
| `tests/e2e/{guestProjectSetup.ts,plannerCanvasHelpers.ts,site-ui-helpers.ts,visual-audit-pages.ts,globalSetup.mjs,globalTeardown.mjs,helpers/,fixtures/}` | e2e support | `tests/support/` (or owner-specific support) | Plan 06 helper consolidation. |
| `tests/helpers/`, `tests/fixtures/` | support | `tests/support/` and `tests/support/fixtures/` | Allowlisted; still the Plan 06 intended names until that batch. |
| `tests/operations-review/`, `tests/site-ui-content-links-audit/` | standalone / unit-of-scripts | keep as standalone, or later `tests/unit/scripts/<name>/` | Sources still on disk. Audit notes call the scripts abandoned; that is not by itself a delete order. |
| Remaining `tests/e2e/*.spec.ts` without 3D markers | e2e | route-owned `tests/e2e/site/app/...` | Layout only. |

### Other unused files at `tests/` root

| Current path | Owner | Disposition | Why |
| --- | --- | --- | --- |
| `tests/setup.ts` | vitest | keep | `VITEST_SETUP_FILE` for every vitest config except extra tech-docs setup. |
| `tests/setup.node.ts` | vitest | investigate | No `setupFiles` reference; not in `package.json`. Parallel of `setup.ts`. |
| `tests/playwright-inspect.ts` | e2e tooling | investigate | Manual Chromium probe; no package/ops script reference. |
| `tests/package.json`, `tests/tsconfig.json` | tooling | keep | Package + typecheck. |

No retirement and no moves in this audit.
