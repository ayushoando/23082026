# Testing Audit

**Created:** 2026-08-31
**Status:** Audit complete

## Test Infrastructure

| Tool | Config | Purpose |
|---|---|---|
| Vitest | `tests/vitest.config.ts` | Unit + integration tests |
| Vitest (tech-docs) | `tests/vitest.tech-docs.config.ts` | Tech-docs generator tests |
| Vitest (site coverage) | `tests/vitest.site.config.ts` | Site-specific coverage |
| Vitest (admin coverage) | `tests/vitest.admin.coverage.config.ts` | Admin coverage |
| Vitest (admin live coverage) | `tests/vitest.admin.live.coverage.config.ts` | One-shot live admin-module coverage (measurement only, not a gate entry) |
| Vitest (inventory coverage) | `tests/vitest.coverage.inventory.config.ts` | Dark-product inventory coverage — broad include, no thresholds |
| Playwright | `config/build/playwright.config.ts` | E2E + browser tests |
| Playwright (gate specs) | `config/build/playwright-gate-specs.json` | Release gate browser tests |
| happy-dom | Via vitest config | DOM environment for tests |
| @axe-core/playwright | Via Playwright | Accessibility testing |
| fast-check | Property-based testing | Fuzzy/random input tests |
| @testing-library/react | Component testing | React component unit tests |

## Test Organization

```
tests/
├── unit/          — Unit tests (mirrors site/ structure)
├── integration/   — Integration tests
├── e2e/           — Playwright end-to-end tests
├── fixtures/      — Test data
├── helpers/       — Test utilities
├── support/       — Test support modules
├── manifests/     — Test manifests for audit scripts
├── site-ui-content-links-audit/ — audit-program property tests (separate lane)
├── tech-docs-generator/ — tech-docs lane setup + tests
└── operations-review/ — Operations review tests
```

### 2026-09-01 additions (verified on disk 2026-09-01)

- **Unit:** `tests/unit/lib/clients/clientRegistry.test.ts` · `tests/unit/lib/hooks/useSectorTabs.test.ts` · `tests/unit/components/site/clients/` (3 files: `ClientCard.test.tsx`, `ClientLogoArea.test.tsx`, `ClientTabPanel.test.tsx`) · `tests/unit/lib/security/staticAdminToken.test.ts` · `tests/unit/scripts/audit-sitemap-health.test.ts` · `tests/unit/planner/plannerFinalReconciliation.test.ts`.
- **E2E:** `tests/e2e/clients-showcase-keyboard.spec.ts`, `tests/e2e/clients-showcase-layout.spec.ts`.
- **Audit-program lane:** 4 new property files in `tests/site-ui-content-links-audit/` (w3 partition isolation, w5r severity/duplicate reconciliation, w5h remediation handoffs, w5c completion-proof) — lane now **11 files / 36 tests**.

## Gate Structure (from package.json)

| Command | Scope |
|---|---|
| `pnpm run gate:fast` | Dev loop: typecheck, priority tests, lint, style checks, governance |
| `pnpm run gate` | Ship bar: gate:fast + full test suite + build + coverage + browser tests |
| `pnpm run test` | Two Vitest lanes (default + tech-docs) |
| `pnpm run test:coverage` | Coverage run with report generation |
| `pnpm run test:browser:gate` | Playwright release gate |
| `pnpm run test:a11y` | Playwright accessibility tests |

## Audit Scripts (from package.json)

| Script | Purpose |
|---|---|
| `test:audit` | Release-preset audits |
| `test:audit:fast` | Fast-preset audits |
| `test:audit:hollow` | Detect tests with no assertions |
| `test:audit:fake-test` | Detect placeholder tests |
| `test:audit:gate-skips` | Detect skipped tests in gate |
| `test:audit:eslint-disable` | Detect eslint-disable comments |
| `test:audit:api-routes` | Audit API route safety patterns |

## Key Observations

### Strengths
- **Comprehensive gate system** — fast gate for dev loop, full gate for ship bar. Both scripted and enforced.
- **Priority-based test suites** — `p0:unit` (auth, planner, studio), `test:priority-7` (admin, storage, catalog), `test:priority-8` (SEO, security, auth, rate limit) — smart ordering.
- **Audit scripts catch quality issues** — hollow tests, fake tests, skipped tests, eslint-disable. Proactive quality enforcement.
- **Coverage tracking** — separate coverage configs for planner, site, and admin. Reports generated to `results/`.
- **axe-core for a11y** — Playwright accessibility spec exists.

### Issues
- **Can't verify current coverage numbers** — running tests requires authorization
- **No mutation testing** — no Stryker or similar tool. Property-based testing (fast-check) partially covers this.
- **Visual regression** — `audit:visual` exists with Playwright screenshots, but not part of the regular gate
- **Coverage configs proliferate** — 6 vitest `*.config.ts` files under `tests/` (default, tech-docs, site, admin coverage, admin live coverage, inventory coverage; `vitest.shared.ts` is shared config, not a lane). Corrected 2026-09-01 — the earlier "5 different" wording was stale. Could consolidate with vitest workspaces.

### No remedy plan needed
The testing infrastructure is solid. The audit scripts are better than most codebases. Running `pnpm run test` + `pnpm run gate:fast` would reveal any current failures, but that requires authorization.
