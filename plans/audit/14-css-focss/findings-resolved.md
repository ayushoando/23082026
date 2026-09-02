# Resolved — CSS system (FOCSS)
**Date:** 2026-09-01

- **14.1 (decision documented):** Single-entry marketing bundle formally accepted, per the plan's either/or. Decision + rationale recorded in the header of `site/focss/site/components/index.css` (verifier contract simplicity, no missing route styles, cacheable static bundle; per-route chains only if bundle budget ever flags it). No behavior change.
- **14.2:** All three near-cap sheets split at clean top-level rule boundaries with cascade order preserved exactly:
  - `site/focss/planner/workspace.css` 796 → 279 lines + new `workspace-overlays.css` (527 lines, canvas-overlay UI). workspace.css now starts with `@import "./workspace-overlays.css";` (spec-valid position) so old head→tail order is unchanged; `planner/entry.css` exact-entry contract untouched.
  - `site/focss/site/components/homepage/home-base.css` 767 → 574 lines + new `home-tool-cards.css` (198 lines, `@utility` tool-card family).
  - `site/focss/site/components/homepage/home-layout.css` 779 → 542 lines + new `home-tool-cards-fallback.css` (243 lines, plain-CSS dark/card fallbacks).
  - New imports inserted in `homepage/index.css` directly after their source sheet (`home-base` → `home-tool-cards`, `home-layout` → `home-tool-cards-fallback`) to pin cascade order.
- **14.3:** `@import "./shell-main.css";` moved from line 634 (after 630+ lines of rules) to the top of `site/focss/admin/base/shell.css` — sheet is now valid without bundler hoisting. Tail duplicate removed; cascade unchanged (hoisting had already loaded it first).

**Verification (real, 2026-09-01):**
- `pnpm run verify:focss` → `ok: true` on all four scopes (structure/imports/fences/modules), 150 CSS files, no cap violations, no cycles, entry chains exact.
- `pnpm run check:style-tokens` → OK, 207 findings (at baseline — no rise).
- `pnpm exec vitest run --config tests/vitest.config.ts "unit/app/css" "plannerAccessibleOverflowDisclosure" "verify-focss-structure"` → 3 files / 10 tests passed (incl. the planner `.planner-disclosed-value` file-content property test, which still reads `planner/workspace.css`).

- **14.4 completion (rename) — DONE 2026-09-02.** The debt-marker file was renamed to its real role: `site/focss/site/components/shared/missing-components.css` → `shared-component-layer.css` (plain rename; all 235 lines byte-identical apart from the header, which no longer says "the historical filename remains until its delete-and-rename is approved" and now records the 14.4 rename). The shared barrel import at `site/focss/site/components/shared/index.css:16` was updated to `@import "./shared-component-layer.css";` — the file remains a barrel resident on purpose: its classes (`.product-gallery*`, `.contact-teaser*`, `.shell-card`) are used outside route-only bundles, which is what the finding's "remove as permanent resident" option would have broken. Repo-wide grep for `missing-components` after the change matches only audit/plan docs and the guard test that asserts the OLD top-level path stays absent (it never was the `shared/` path). Evidence: `pnpm run verify:focss` → `ok: true`, 150 CSS files, no errors/cycles; `pnpm run check:style-tokens` → OK 207 findings (at baseline); `pnpm exec vitest run --config tests/vitest.config.ts tests/unit/app/css` → 1 file / 2 tests passed (`missing-components.test.ts` guard still green).
