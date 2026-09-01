# 14 — CSS System (FOCSS)

**Overall: compliant; the 800-line cap holds; token ratchet sanctioned debt; two structural watch items.**

## File sizes — 800-line cap holds across all 147 CSS files

| File | Lines |
|---|---|
| `site/focss/planner/workspace.css` | **796** (4 from cap) |
| `site/focss/site/components/homepage/home-layout.css` | 779 |
| `site/focss/site/components/homepage/home-base.css` | 767 |
| `site/focss/admin/components/design-kit.css` | 724 |
| `site/focss/admin/base/primitives.css` | 676 |
| `site/focss/admin/base/shell.css` | 634 |
| `site/focss/planner/workspace-shell.css` | 561 |

## Verifier conformance

`scripts/AsNeeded/verify-focss.mjs` enforces: 800-line max (line 22), exact entry chains for `base/root.css`, `site/entry.css`, `admin/entry.css`, `planner/entry.css`, `studio/entry.css` (lines 66–134), required base tokens, no import cycles, no raw color literals outside `base/`, `@source` only in `base/scan.css`, retired-path fences. Entry chains match on disk (`site/focss/site/entry.css`, `site/focss/site/components/index.css` resolve exactly as contracted). `admin/components/design-kit.css` correctly excluded from the global admin entry and route-imported instead (`app/admin/design-kit/page.tsx:6`).

## Token ratchet

`scripts/general/check-style-tokens.mjs` governance C3/C4/C5/C10 gate with per-file ratchet; baseline records **207 live token-bypass findings** (`config/quality/style-token-baseline.json:2` — worst: `features/crm/QuotesView.tsx` 20, `ViewportControls.tsx` 10, `MobileNavDrawer.tsx` 9). Ratchet fails only on increases — existing debt is sanctioned.

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 14.1 | **Med** | **Unused-CSS risk by design:** `site/components/index.css` imports the CSS of *every* marketing route into one `site/entry.css` bundle (`index.css:2-34`) — all shipped on every marketing page. 3–4× page-specific CSS on any given route. Deliberate single-entry trade-off. |
| 14.2 | Low | Three sheets within 4–35 lines of the 800 cap (`planner/workspace.css` 796, `homepage/home-layout.css` 779, `homepage/home-base.css` 767) — next feature edit in them forces a split. |
| 14.3 | Low | `@import "./shell-main.css"` appears *after* 600+ lines of rules in `shell.css:634` — invalid per CSS spec, works only via bundler hoisting. |
| 14.4 | Low | Debt-marker filename `missing-components.css` (233 lines) is a permanent resident of the shared barrel (`site/focss/site/components/shared/missing-components.css:1-5`, imported at `shared/index.css:16`). |
