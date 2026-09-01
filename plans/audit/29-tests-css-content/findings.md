# 29 — Test Quality, CSS Usage & Marketing Content

## 1. Test quality (14 suites sampled)

Overall above-average: most suites assert behavior (roles/attrs/computed args). Strong: `tests/unit/app/api/tracking/route.test.ts` (10 scenarios), `portal/page.test.tsx` (error demotion + timeout), `WhatsAppCTA.test.tsx` (analytics args, consent, aria).

**5 weakest suites (med):**
| Suite | Weakness |
|---|---|
| `tests/unit/lib/i18n/config.test.ts` | constant equality + existsSync only; no content assertions |
| `tests/unit/lib/fonts.test.ts` | `toBeDefined()` + regex-grepping own source text — non-behavioral |
| `tests/unit/lib/paths/sitePackageRoot.test.ts` | `endsWith("/public")` / existsSync tautologies |
| `tests/unit/features/site/data/clientLogos.test.ts` | hardcodes expected mapping values — mirror-of-source, tests nothing |
| `tests/unit/app/(site)/trusted-by/page.test.tsx` | 2 of 6 tests regex-assert raw page.tsx source (readFileSync + prop-string matching) — brittle |

Also: `Footer.test.tsx` `expectMinTapTarget()` vacuous (regex-matches className, doesn't verify 44px) — low. `tests/operations-review` fast-check property tests are meaningful (numRuns 100-200, real invariants) — caveat (med): `monitoringGapsAttributable.property.test.ts` re-implements the gap contract locally instead of importing the real extractor — validates a mirror, not the code.

## 2. CSS unused-selector risk (5 focss marketing files sampled)

Rough unused: **~0-5% — low risk.** Every top-level selector traced to TSX usage. Caveat: dynamic class composition (`` `${prefix}-hero__img` `` in `EditorialHeroMedia.tsx:52`) means naive grep overstates dead CSS. Convention actively maintained + structure-verified by tests.

## 3. Marketing content

- **Placeholders: none** (no lorem/TODO/TBD/xxx in `site/app/(site)/**`; en.json "placeholder" hits are legitimate form attributes).
- **Broken internal hrefs: none** — `/news` and `/gallery` exist only as intentional 308 redirects, no hrefs reference them; all sampled hrefs resolve to real routes.

## 4. Visual baselines — HIGH

`tests/manifests/visual-baselines.json` defines 4 surfaces (`/`, `/admin`, `/ooplanner`, `/oostudio`) x 6 states x 3 browsers x 3 viewports = **216 expected baselines**. **Baseline count on disk: 0** — `tests/visual-baselines/` does not exist. Route coverage 4/61 (~6.6%). Policy says `allowMissing: false` + `updatesRequireReview: true` — suite is red-by-design or silently generates unreviewed snapshots on first run.

## 5. e2e hygiene

| # | Severity | Finding |
|---|----------|---------|
| 29.1 | Med | **110 `waitForTimeout` across 24 files.** Worst: `audit-3a-planner-journey-2.spec.ts` (29), `planner-comprehensive-audit-browser.spec.ts` (13), `audit-4a-marketing-pages.spec.ts` (10), `plannerCanvasHelpers.ts` (7). |
| 29.2 | Med | **4 specs hardcode `http://localhost:3000`** ignoring configured baseURL (`chrome-fab-viewport.spec.ts`, `marketing-desktop-layout.spec.ts`, `marketing-mobile-scroll.spec.ts`, `studio-phone-chrome.spec.ts`); `open3d-world-standard-journey.spec.ts:124` self-constructs baseURL. |
| 29.3 | Info | No specs reference removed features (`/news`, `/gallery` absent; sampled goto targets all exist). |
