# Plan — Coverage Gaps (Runtime, Registry, Browser & Historical Evidence)

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Close the static audit's blind spots by running the minimal evidence-gathering set — no code changes in this plan; every action requires owner authorization.

## Actions (prioritized) — the minimal authorization set
1. **High** `git status --short` — confirm whether `scripts/site-ui-content-links-audit/wave3-partitions.ts` + `wave5-reconcile.ts` are truly untracked (resolves the #1 High finding, currently conditional).
2. **Med** `pnpm run scan:secrets` (then `pnpm run check:launch`) — live secrets evidence vs. source, closing the CI-gate gap.
3. **Med** `pnpm run gate:fast` (dev loop) or `pnpm run gate` (ship bar) — prove the whole gate stack is green today.
4. **Med** `pnpm run test` — confirm the 4,097 + 222 passing tests still pass after any change.
5. **Med** `pnpm audit` — CVE posture for the 1,023 resolved packages (registry access); optionally `pnpm outdated` on root + tech-docs.
6. **Med** `pnpm run build:site` — measured bundle sizes for the gsap/jspdf/fabric static-import findings, then Lighthouse via the `dev-tools/lighthouse` route for LCP/CLS with production-unoptimized images.
7. **Med** `pnpm run db:test` and `pnpm run db:apply -- --dry` — live two-DB state (RLS, archived `block_themes`, missing `rate_limits`).
8. **Low** `pnpm run test:a11y` and `pnpm run audit:visual` — real a11y violations beyond the 4 axe-scanned surfaces and visual regressions.
9. **Low** `git log --follow` over the 105 one-off `scripts/` root files, `specs/state.yaml`, and the ui-audit handover vs FIX-LOG #9 — separate abandoned from recently-used; plus platform state via `wrangler vectorize list` and `vercel env ls`.

## Verification
- These actions ARE the verification: each command requires explicit owner authorization per repo rules; record outputs as generated evidence under `results/` (no hand-written markdown there).
