# Plan — Test Quality, CSS Usage & Marketing Content

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Resolve the visual-baselines gap (216 expected, 0 on disk), fix e2e flake sources, and strengthen the 5 weakest test suites.

## Actions (prioritized)
1. **High** Decide the visual-baseline strategy for `tests/manifests/visual-baselines.json`: generate + review the 216 baselines, or flip the manifest/policy — `tests/support/visual/visualBaseline.ts` enforces membership today.
2. **Med** Replace `waitForTimeout` with condition-based waits in the worst offenders (`audit-3a-planner-journey-2.spec.ts` ×29, `planner-comprehensive-audit-browser.spec.ts` ×13, `audit-4a-marketing-pages.spec.ts` ×10).
3. **Med** Make the 4 specs use the configured baseURL instead of hardcoded `http://localhost:3000` (note: repo rule is `localhost`, never `127.0.0.1`).
4. **Med** Import the real extractor instead of the local mirror in `tests/operations-review/monitoringGapsAttributable.property.test.ts`.
5. **Med** Rewrite the 5 weakest suites to assert behavior (`tests/unit/lib/fonts.test.ts`, `i18n/config.test.ts`, `sitePackageRoot.test.ts`, `clientLogos.test.ts`, `trusted-by/page.test.tsx`); fix the vacuous `expectMinTapTarget()` in `Footer.test.tsx`.
6. **Low** CSS: no action needed (0-5% unused, dynamic composition caveat).

## Verification
- `pnpm run test` (both vitest lanes), `pnpm run gate:fast`, browser gate via `pnpm run test:browser:gate` — owner authorization required.
