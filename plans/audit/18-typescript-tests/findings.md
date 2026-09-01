# 18 — TypeScript Quality & Tests

## TypeScript — LOW severity overall (excellent)

Grep results across `site/` (raw hits; almost all comment false-positives):

| Pattern | Raw hits | Real code hits |
|---|---|---|
| `: any` | 6 | **0** — all prose/comments (`proxy.ts:393,511`, JSX string `CustomerQueryForm.tsx:348`, comments in `svgTypes.ts:826`, `catalogRetrieval.ts:17`, `aiMetrics.ts:278`) |
| `as any` | 1 | **0** — the comment "No `as any`, no `@ts-ignore`" (`svgBlockDescriptorLoader.ts:263`) |
| `@ts-ignore` / `@ts-expect-error` | 2 | **0** — comment text only |
| `eslint-disable` / `oxlint-disable` | 5 | **5** — all identical, narrow-scoped `react-hooks/exhaustive-deps` suppressions in Studio/Planner keyboard/fabric hooks |

In `tests/`: 1 `as any` hit, 11 `@ts-expect-error`/disable matches in 7 files — all intentional (vitest 4 type omissions in 3 configs, deliberate invalid values in displayText/plannerSafeErrors tests). The repo audits itself (`scripts/general/audit-eslint-disable.mjs`, gate-wired).

## Tests — LOW severity, one med note

- **Structure:** `tests/{unit,integration,e2e,tech-docs-generator,operations-review,manifests,…}`; **765** `*.test.*` files + **85** `tests/e2e/*.spec.ts`. ~895 TS/TSX files in `site/`.
- **Skips:** no bare `describe.skip`/`it.skip` placeholders in unit/integration lanes; all ~40 real skips are conditional Playwright guards in exactly 3 files (`planner-comprehensive-audit-browser.spec.ts` ~35×, `planner-performance-required.spec.ts:133`, `planner-comprehensive-audit-regression.spec.ts` 5×).
- **`tests/manifests/skip-exceptions.json`** whitelists exactly those 3 files — owner `repository-owner`, reasoned justification, `expires: 2027-09-01`, `replacementTest` field. Enforced by `scripts/general/audit-gate-skips.mjs`. Consistent and current.
- **Hollow tests:** sampled suites (`sitePackageRoot`, `i18n/config`, `fonts`) all contain genuine assertions. Dedicated tooling exists and is gate-wired (`audit-hollow-tests.mjs` + `hollow-test-patterns.mjs` via `test:audit:hollow` inside `release:gate`).

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 18.1 | Info (positive) | Zero suppression debt in production code; the 5 hook suppressions are the only pattern, and the repo self-audits them. |
| 18.2 | Med (minor) | **Vitest lanes consistent** (both root at `VITEST_REPO_ROOT`, shared constants from `tests/vitest.shared.ts`, identical env `NODE_ENV=test`/`DEV_AUTH_BYPASS`, same alias block, happy-dom + forks pool, documented `@ts-expect-error` for vitest-4 types; tech-docs lane's `maxWorkers: 1` / 120s timeouts justified in-file) — **but** `environmentMatchGlobs` is deprecated-in-vitest-4, held together by `@ts-expect-error` in 3 configs; will need rework when vitest removes it. |
| 18.3 | Low | `tests/vitest.config.ts:67-69` caps `maxWorkers: 4` with a comment about a Windows + lucide-react CJS race — environment band-aid baked into config. |
| 18.4 | Info | There are actually **6** vitest configs (also `vitest.site`, `vitest.admin.coverage`, `vitest.admin.live.coverage`, `vitest.coverage.inventory`). |
