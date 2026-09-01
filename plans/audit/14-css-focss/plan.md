# Plan — CSS System (FOCSS)

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Keep the FOCSS verifier green while cutting per-route CSS weight and removing spec-invalid debt.

## Actions (prioritized)
1. **Med** Decide the single-entry trade-off for marketing CSS: introduce per-route entry chains or formally accept the 3–4× over-ship documented at `site/focss/site/components/index.css:2-34` / `site/focss/site/entry.css`.
2. **Low** Split the three near-cap sheets before the next feature edit forces it — `site/focss/planner/workspace.css` (796), `site/focss/site/components/homepage/home-layout.css` (779), `site/focss/site/components/homepage/home-base.css` (767).
3. **Low** Move `@import "./shell-main.css"` to the top of `site/focss/admin/base/shell.css` so the sheet is valid without bundler hoisting.
4. **Low** Split or rename `site/focss/site/components/shared/missing-components.css` (233 lines, debt-marker name) and remove it as a permanent resident of the shared barrel (`site/focss/site/components/shared/index.css:16`).

## Verification
- `pnpm run verify:focss` — 800-line cap, entry chains, token fences; owner authorization required.
- `node scripts/general/check-style-tokens.mjs` — token ratchet must not rise above 207 in `config/quality/style-token-baseline.json`.
