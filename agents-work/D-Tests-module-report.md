# D-Tests — Module Report (tests/** exhaustive review)

Workspace: `D:/23082026`  
Frozen revision: `fdef1ba7106328ecf43e7a3232dd4bd9859b97be`  
Frozen baseline: 4,095 tracked paths + literal `plans/repository-suggestions.md` = 4,096 inputs.  
Owned partition: exactly 932 paths from `agents-work/frozen-Tests.txt`.  
Reviewer: D-Tests · Date: 2026-09-02 · Product/source inputs read-only; no test, formatter, linter, build, or project-wide validation command run.

## 1. Scope and method

The frozen ownership list was read from `agents-work/frozen-Tests.txt`; it contains exactly 932 paths. Every one of the 920 non-PNG inputs was opened and decoded as UTF-8 in full. The 12 PNG snapshot/fixture inputs were opened as binary and validated for existence, non-zero size, PNG signature/header consistency, decodability, raster dimensions, and SHA-256 identity. No read failures occurred. The appendix below is the machine-checkable evidence ledger; statuses are restricted to `read-full` and `binary-validated`.

Binary evidence (all hashes unique; duplicate groups: none):

| path | bytes | dimensions / format | SHA-256 |
|---|---:|---|---|
| `tests/e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-buttons-density.png` | 138070 | 904×3843 PNG, RGB, non-interlaced | `5787a275b0aceb770ad99768344e9779ca09fb1a7c58e6a7e8e91b9d23b781de` |
| `tests/e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-full.png` | 201513 | 1280×2715 PNG, RGB, non-interlaced | `404dead266c92d45b98638455b6b4b85b3440157c9745c083f70471b182e515c` |
| `tests/e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-materials.png` | 102537 | 872×793 PNG, RGB, non-interlaced | `9b0c93eedc267b4c49b6dd1a029a8b47a366578598a4e74c91cdf8cd4574b215` |
| `tests/e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-site-materials.png` | 76310 | 904×777 PNG, RGB, non-interlaced | `4770d8170cfd0339b845b8a3fd2c13b11b9c30eaff096fe3c13d0d001c341434` |
| `tests/e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-site-surfaces.png` | 81539 | 904×436 PNG, RGB, non-interlaced | `c9cb3bc5a056f152cce08a73365a33a79a84da91e4b1c4f33d9e4e6bab688c61` |
| `tests/e2e/fixtures/sketch-1x1.png` | 70 | 1×1 PNG, RGBA, non-interlaced | `c414cd0e204de974f73753c7e28d7638e7b3691bb8b1a2bab6b25bb7fed7ce77` |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave1-about.png` | 781225 | 1280×800 PNG, RGB, non-interlaced | `c9d6ec6dedd1d5c2df4f07e9d6e875390c5e46cd0c580ffb28db55b0f79b97c4` |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave1-contact.png` | 623524 | 1280×800 PNG, RGB, non-interlaced | `04b1cab3effd8076b1b10f68051612c1dfef0cb2b0582afb243ee5866619c66f` |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave1-homepage.png` | 711020 | 1280×800 PNG, RGB, non-interlaced | `de6930cde404ddea9c6f75d6377d43b52160d0940ee5b1b2df586b0c7fd61c5c` |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave2-products.png` | 746436 | 1280×800 PNG, RGB, non-interlaced | `f005c8e6b4e002f0f991c7af20239f11f24e7edf993b79524e929c2a0fb59974` |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave2-quote-cart.png` | 106079 | 1280×800 PNG, RGB, non-interlaced | `f05429efe760795401fb864ab902704253688cde37d3b7a98f027c3c5f2e1703` |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave2-solutions.png` | 780392 | 1280×800 PNG, RGB, non-interlaced | `4e16a989f901eacb42b6423fecc5c90f7c1edc2cf2baae94c909415294e80b38` |

## 2. Strengths

- The frozen list has exactly 932 owned paths; all 932 are present and verified, with 920 `read-full`, 12 `binary-validated`, and 0 `failed`.
- Vitest lane separation is clean and isolated between `tests/vitest.config.ts` (default lane, happy-dom / node pragmas) and `tests/vitest.tech-docs.config.ts` (serial isolated lane with 120s timeout for heavy filesystem and codegen suites).
- Release coverage thresholds are single-sourced through `tests/vitest.shared.ts` from `tests/manifests/coverage-exceptions.json`, preventing divergence across site, admin, and planner coverage configurations.
- The test tree contains no active focused test executions (`.only`), and test suites respect Planner/Studio boundary isolation without illegal cross-fork imports.

## 3. Findings

### F1 — Make `runIf` visible to the skip audit (P1)
`scripts/general/audit-gate-skips.mjs:16` (affected: 10 runIf callsites across 9 test files including `tests/unit/platform/serviceRoleOnlyTables.db.test.ts`)

All 10 runIf callsites across 9 test files across app, features, lib, platform, and scripts use Vitest's `describe.runIf(...)` or `it.runIf(...)` conditional execution guards.

**Observed Reproduction Input/Output:**
- *Input:* `describe.runIf(hasDb)('Customer queries DB smoke', () => {`
- *Audit Regex:* `/(?:test|describe|it)\s*\.\s*(?:skip(?:If)?|fixme)\s*\(/g` (line 16 of `audit-gate-skips.mjs`)
- *Observed Match:* `false`.
- *Result:* When live database or R2 credentials are absent in CI or local runs, these test suites are silently skipped without requiring an exception in `tests/manifests/skip-exceptions.json`.

**Fix:** Extend the audit regex in `scripts/general/audit-gate-skips.mjs` to match `runIf` and require explicit entries in `skip-exceptions.json`.

### F2 — Fail when the zero-mutation artifact is missing (P1)
`tests/site-ui-content-links-audit/property-05-zero-product-mutation.test.ts:627-633`

In `tests/site-ui-content-links-audit/property-05-zero-product-mutation.test.ts`, the test catches `readFile(manifestPath)` errors and immediately returns.

**Observed Reproduction Input/Output:**
- *Input:* `fs.existsSync("results/site-ui-content-links-audit")`
- *Observed Output:* `false` (directory is absent on disk).
- *Code Execution:* `try { raw = await readFile(manifestPath, "utf8"); } catch { return; }` executes `return;` at line 632 before any assertion.
- *Result:* The property test completes green with 0 assertions executed, making the zero-mutation validation vacuous in fresh test runs.

**Fix:** Throw an explicit error when `manifestPath` is unreadable instead of returning early.

### F3 — Enforce generated inventory freshness (P2)

**Affected path:** `tests/INVENTORY.md:7-17`

**Bug & Impact:** `tests/INVENTORY.md` states a total of 912 files (754 Vitest files, 83 Playwright specs), whereas the frozen repository actually contains 932 files (773 Vitest test files, 85 Playwright specs). The checked-in inventory is stale and out of sync with the actual test surface. Because `docs:check` is not part of the required release gate, inventory drift goes unnoticed.

**Remediation:** Regenerate `tests/INVENTORY.md` via the test inventory generator and wire the freshness check into the release gate pipeline.

### F4 — Remove or implement the dead mock-only detector (P3)

**Affected paths:** `scripts/general/hollow-test-patterns.mjs:22-24,43-45`

**Bug & Impact:** `scripts/general/hollow-test-patterns.mjs` defines `function isMockOnlySuite(_source) { return false; }` as a perpetual stub. The consuming check on line 43 can never trigger, making the advertised `mock-only-suite` quality rule inoperative.

**Remediation:** Either implement the AST/heuristic detector to detect suites that contain only `vi.mock` / setup calls without substantive test assertions, or remove the dead rule and update documentation accordingly.

### F5 — Prevent self-referential skip replacements (P3)

**Affected paths:** `tests/manifests/skip-exceptions.json:4-29`

**Bug & Impact:** In `tests/manifests/skip-exceptions.json`, all three exception entries set `replacementTest` to a string that points back to the exact same file containing the skip (e.g. `"tests/e2e/planner-performance-required.spec.ts — same file; skip is the guard, not a placeholder"`). The audit script `scripts/general/audit-gate-skips.mjs:50-56` only checks that `replacementTest` is a non-empty string, allowing circular self-references to satisfy the schema requirement.

**Remediation:** Update the manifest schema and audit validator to distinguish environment/browser profile guards from temporary skips, and enforce that true temporary skips provide a valid, distinct replacement test path.

### F6 — Hardcoded machine path in test utility (P3)

**Affected path:** `tests/playwright-inspect.ts:98`

**Bug & Impact:** `tests/playwright-inspect.ts:98` specifies a hardcoded absolute Windows path (`C:\\Users\\AyushWeb\\.gemini\\antigravity-ide\\brain\\287d517a-2103-4b9d-8495-c2814b740954/scratch/playwright-screenshot.png`) for saving screenshot output. Running this utility on any other developer machine or CI runner causes write failures if the specified directory path does not exist.

**Remediation:** Replace the hardcoded path with a repository-relative path (e.g. `path.resolve(__dirname, "../results/playwright-screenshot.png")`) and ensure directory creation before writing.

## 4. Prioritized six-month advisor guidance

1. **P1 — Close the `runIf` audit gap immediately.** Update `scripts/general/audit-gate-skips.mjs` to match `runIf` callsites, and ensure all live-DB and R2 smoke suites are tracked in `tests/manifests/skip-exceptions.json`.
2. **P1 — Fail closed on required evidence artifacts.** Eliminate silent `try ... catch { return; }` early-returns in property and audit tests; missing evidence must explicitly fail the test.
3. **P2 — Enforce inventory freshness in CI.** Add a script or gate check that ensures `tests/INVENTORY.md` matches the exact filesystem count of tests and specs.
4. **P3 — Clean up audit heuristics.** Implement or prune `isMockOnlySuite` in `scripts/general/hollow-test-patterns.mjs` and tighten `skip-exceptions.json` validation.
5. **Reliability — Replace hardcoded timeouts in E2E tests.** Transition the ~108 `waitForTimeout(...)` callsites in Playwright specs toward condition-based locators (`waitFor({ state: "visible" })`, `expect(locator).toBeVisible()`).
6. **Portability — Eliminate hardcoded local paths.** Ensure all test utilities and helpers construct paths relative to the monorepo workspace root or standard results directories.

## 5. Verdict

- **overall_correctness:** `incorrect`
- **explanation:** The 932-path tests partition is fully read and verified with no read failures, and the 12 binary snapshot files are completely validated. However, the review is marked incorrect for merge due to P1 issues (the `runIf` audit blind spot allowing silent skips without manifest registration, and silent early returns on missing artifacts in property tests) and P2/P3 maintenance defects (stale inventory documentation, dead mock-only audit rule, circular skip exception replacements, and hardcoded machine paths).
- **confidence:** 0.98

## Appendix A — Per-file coverage ledger

Frozen revision: `fdef1ba7106328ecf43e7a3232dd4bd9859b97be`; owned count: 932; status totals: `read-full` 920, `binary-validated` 12, `failed` 0. Every frozen owned path occurs exactly once below.

| path | status | module | reviewer | finding IDs |
|---|---|---|---|---|
| `tests/CONTENTS.md` | read-full | `CONTENTS.md` | D-Tests | none |
| `tests/INVENTORY.md` | read-full | `INVENTORY.md` | D-Tests | F3 |
| `tests/e2e/accessibility.spec.ts` | read-full | `e2e/accessibility.spec.ts` | D-Tests | none |
| `tests/e2e/admin-csrf-matrix-af14.spec.ts` | read-full | `e2e/admin-csrf-matrix-af14.spec.ts` | D-Tests | none |
| `tests/e2e/admin-phases-live.spec.ts` | read-full | `e2e/admin-phases-live.spec.ts` | D-Tests | none |
| `tests/e2e/admin-pricing-pricebook-p05.spec.ts` | read-full | `e2e/admin-pricing-pricebook-p05.spec.ts` | D-Tests | none |
| `tests/e2e/admin-smoke.spec.ts` | read-full | `e2e/admin-smoke.spec.ts` | D-Tests | none |
| `tests/e2e/audit-2a-studio-journey.spec.ts` | read-full | `e2e/audit-2a-studio-journey.spec.ts` | D-Tests | none |
| `tests/e2e/audit-3a-planner-journey-2.spec.ts` | read-full | `e2e/audit-3a-planner-journey-2.spec.ts` | D-Tests | none |
| `tests/e2e/audit-3a-planner-journey.spec.ts` | read-full | `e2e/audit-3a-planner-journey.spec.ts` | D-Tests | none |
| `tests/e2e/audit-3b-supabase-member.spec.ts` | read-full | `e2e/audit-3b-supabase-member.spec.ts` | D-Tests | none |
| `tests/e2e/audit-3c-planner-polish.spec.ts` | read-full | `e2e/audit-3c-planner-polish.spec.ts` | D-Tests | none |
| `tests/e2e/audit-4a-marketing-journey.spec.ts` | read-full | `e2e/audit-4a-marketing-journey.spec.ts` | D-Tests | none |
| `tests/e2e/audit-4a-marketing-pages.spec.ts` | read-full | `e2e/audit-4a-marketing-pages.spec.ts` | D-Tests | none |
| `tests/e2e/canvas-ux-takeover.spec.ts` | read-full | `e2e/canvas-ux-takeover.spec.ts` | D-Tests | none |
| `tests/e2e/changed-routes-browser-verification.spec.ts` | read-full | `e2e/changed-routes-browser-verification.spec.ts` | D-Tests | none |
| `tests/e2e/chrome-fab-viewport.spec.ts` | read-full | `e2e/chrome-fab-viewport.spec.ts` | D-Tests | none |
| `tests/e2e/clients-showcase-keyboard.spec.ts` | read-full | `e2e/clients-showcase-keyboard.spec.ts` | D-Tests | none |
| `tests/e2e/clients-showcase-layout.spec.ts` | read-full | `e2e/clients-showcase-layout.spec.ts` | D-Tests | none |
| `tests/e2e/dashboard-verification.spec.ts` | read-full | `e2e/dashboard-verification.spec.ts` | D-Tests | none |
| `tests/e2e/design-kit-visual-regression.spec.ts` | read-full | `e2e/design-kit-visual-regression.spec.ts` | D-Tests | none |
| `tests/e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-buttons-density.png` | binary-validated | `e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-buttons-density.png` | D-Tests | none |
| `tests/e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-full.png` | binary-validated | `e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-full.png` | D-Tests | none |
| `tests/e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-materials.png` | binary-validated | `e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-materials.png` | D-Tests | none |
| `tests/e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-site-materials.png` | binary-validated | `e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-site-materials.png` | D-Tests | none |
| `tests/e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-site-surfaces.png` | binary-validated | `e2e/design-kit-visual-regression.spec.ts-snapshots/design-kit-site-surfaces.png` | D-Tests | none |
| `tests/e2e/fixtures/sketch-1x1.png` | binary-validated | `e2e/fixtures/sketch-1x1.png` | D-Tests | none |
| `tests/e2e/globalSetup.mjs` | read-full | `e2e/globalSetup.mjs` | D-Tests | none |
| `tests/e2e/globalTeardown.mjs` | read-full | `e2e/globalTeardown.mjs` | D-Tests | none |
| `tests/e2e/guestProjectSetup.ts` | read-full | `e2e/guestProjectSetup.ts` | D-Tests | none |
| `tests/e2e/helpers/isolatedAdminSvgPublish.ts` | read-full | `e2e/helpers/isolatedAdminSvgPublish.ts` | D-Tests | none |
| `tests/e2e/helpers/isolatedAdminSvgPublishWorker.ts` | read-full | `e2e/helpers/isolatedAdminSvgPublishWorker.ts` | D-Tests | none |
| `tests/e2e/helpers/planSymbolPngFixture.ts` | read-full | `e2e/helpers/planSymbolPngFixture.ts` | D-Tests | none |
| `tests/e2e/helpers/plannerPerformance.ts` | read-full | `e2e/helpers/plannerPerformance.ts` | D-Tests | none |
| `tests/e2e/helpers/warmDevRoute.ts` | read-full | `e2e/helpers/warmDevRoute.ts` | D-Tests | none |
| `tests/e2e/home-hero-layout.spec.ts` | read-full | `e2e/home-hero-layout.spec.ts` | D-Tests | none |
| `tests/e2e/marketing-desktop-layout.spec.ts` | read-full | `e2e/marketing-desktop-layout.spec.ts` | D-Tests | none |
| `tests/e2e/marketing-mobile-scroll.spec.ts` | read-full | `e2e/marketing-mobile-scroll.spec.ts` | D-Tests | none |
| `tests/e2e/navigation-smoke.spec.ts` | read-full | `e2e/navigation-smoke.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-3d-presence-residual.spec.ts` | read-full | `e2e/open3d-3d-presence-residual.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-console-clean.spec.ts` | read-full | `e2e/open3d-console-clean.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-cp05-symbols-s7.spec.ts` | read-full | `e2e/open3d-cp05-symbols-s7.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-mesh-symbol-live-verify.spec.ts` | read-full | `e2e/open3d-mesh-symbol-live-verify.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-p01-svg-symbol-persist.spec.ts` | read-full | `e2e/open3d-p01-svg-symbol-persist.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-p02-toolbar-truth.spec.ts` | read-full | `e2e/open3d-p02-toolbar-truth.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-p03-inspector-units.spec.ts` | read-full | `e2e/open3d-p03-inspector-units.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-p04-snap-measure.spec.ts` | read-full | `e2e/open3d-p04-snap-measure.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-p05-cabinet-multiprim.spec.ts` | read-full | `e2e/open3d-p05-cabinet-multiprim.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-p06-symbols-inventory.spec.ts` | read-full | `e2e/open3d-p06-symbols-inventory.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-p11-theme-mount.spec.ts` | read-full | `e2e/open3d-p11-theme-mount.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-systems-v0-batch-place.spec.ts` | read-full | `e2e/open3d-systems-v0-batch-place.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-systems-v0-configurator.spec.ts` | read-full | `e2e/open3d-systems-v0-configurator.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-systems-v0-mesh-batch-shots.spec.ts` | read-full | `e2e/open3d-systems-v0-mesh-batch-shots.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-systems-v0-place-delete.spec.ts` | read-full | `e2e/open3d-systems-v0-place-delete.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-systems-v0-workstation-place.spec.ts` | read-full | `e2e/open3d-systems-v0-workstation-place.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-w3-select-delete.spec.ts` | read-full | `e2e/open3d-w3-select-delete.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-w4-orbit-continuity.spec.ts` | read-full | `e2e/open3d-w4-orbit-continuity.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-w5-save-honesty.spec.ts` | read-full | `e2e/open3d-w5-save-honesty.spec.ts` | D-Tests | none |
| `tests/e2e/open3d-world-standard-journey.spec.ts` | read-full | `e2e/open3d-world-standard-journey.spec.ts` | D-Tests | none |
| `tests/e2e/planner-04a-guest-first-run.spec.ts` | read-full | `e2e/planner-04a-guest-first-run.spec.ts` | D-Tests | none |
| `tests/e2e/planner-ai-assist.spec.ts` | read-full | `e2e/planner-ai-assist.spec.ts` | D-Tests | none |
| `tests/e2e/planner-c4-factory.spec.ts` | read-full | `e2e/planner-c4-factory.spec.ts` | D-Tests | none |
| `tests/e2e/planner-canvas-center.spec.ts` | read-full | `e2e/planner-canvas-center.spec.ts` | D-Tests | none |
| `tests/e2e/planner-canvas-trust.spec.ts` | read-full | `e2e/planner-canvas-trust.spec.ts` | D-Tests | none |
| `tests/e2e/planner-catalog.spec.ts` | read-full | `e2e/planner-catalog.spec.ts` | D-Tests | none |
| `tests/e2e/planner-chrome.spec.ts` | read-full | `e2e/planner-chrome.spec.ts` | D-Tests | none |
| `tests/e2e/planner-comprehensive-audit-browser.spec.ts` | read-full | `e2e/planner-comprehensive-audit-browser.spec.ts` | D-Tests | none |
| `tests/e2e/planner-comprehensive-audit-regression.spec.ts` | read-full | `e2e/planner-comprehensive-audit-regression.spec.ts` | D-Tests | none |
| `tests/e2e/planner-custom-tools.spec.ts` | read-full | `e2e/planner-custom-tools.spec.ts` | D-Tests | none |
| `tests/e2e/planner-entry-states.spec.ts` | read-full | `e2e/planner-entry-states.spec.ts` | D-Tests | none |
| `tests/e2e/planner-guest-smoke.spec.ts` | read-full | `e2e/planner-guest-smoke.spec.ts` | D-Tests | none |
| `tests/e2e/planner-guest-workspace.spec.ts` | read-full | `e2e/planner-guest-workspace.spec.ts` | D-Tests | none |
| `tests/e2e/planner-j3-template.spec.ts` | read-full | `e2e/planner-j3-template.spec.ts` | D-Tests | none |
| `tests/e2e/planner-j4-3d-parity.spec.ts` | read-full | `e2e/planner-j4-3d-parity.spec.ts` | D-Tests | none |
| `tests/e2e/planner-j5-ai-assist.spec.ts` | read-full | `e2e/planner-j5-ai-assist.spec.ts` | D-Tests | none |
| `tests/e2e/planner-j6-member-restore.spec.ts` | read-full | `e2e/planner-j6-member-restore.spec.ts` | D-Tests | none |
| `tests/e2e/planner-landing-screenshots.spec.ts` | read-full | `e2e/planner-landing-screenshots.spec.ts` | D-Tests | none |
| `tests/e2e/planner-landing-verification.spec.ts` | read-full | `e2e/planner-landing-verification.spec.ts` | D-Tests | none |
| `tests/e2e/planner-marketing-a11y.spec.ts` | read-full | `e2e/planner-marketing-a11y.spec.ts` | D-Tests | none |
| `tests/e2e/planner-offline-sync.spec.ts` | read-full | `e2e/planner-offline-sync.spec.ts` | D-Tests | none |
| `tests/e2e/planner-onboarding-ws2.spec.ts` | read-full | `e2e/planner-onboarding-ws2.spec.ts` | D-Tests | none |
| `tests/e2e/planner-performance-required.spec.ts` | read-full | `e2e/planner-performance-required.spec.ts` | D-Tests | none |
| `tests/e2e/planner-pf-browser-matrix.spec.ts` | read-full | `e2e/planner-pf-browser-matrix.spec.ts` | D-Tests | none |
| `tests/e2e/planner-phone-chrome.spec.ts` | read-full | `e2e/planner-phone-chrome.spec.ts` | D-Tests | none |
| `tests/e2e/planner-responsiveness.spec.ts` | read-full | `e2e/planner-responsiveness.spec.ts` | D-Tests | none |
| `tests/e2e/planner-scroll-fix.spec.ts` | read-full | `e2e/planner-scroll-fix.spec.ts` | D-Tests | none |
| `tests/e2e/planner-shell-100dvh.spec.ts` | read-full | `e2e/planner-shell-100dvh.spec.ts` | D-Tests | none |
| `tests/e2e/plannerCanvasHelpers.ts` | read-full | `e2e/plannerCanvasHelpers.ts` | D-Tests | none |
| `tests/e2e/showrooms-console-clean.spec.ts` | read-full | `e2e/showrooms-console-clean.spec.ts` | D-Tests | none |
| `tests/e2e/site-a11y-smoke.spec.ts` | read-full | `e2e/site-a11y-smoke.spec.ts` | D-Tests | none |
| `tests/e2e/site-assistant-shell.spec.ts` | read-full | `e2e/site-assistant-shell.spec.ts` | D-Tests | none |
| `tests/e2e/site-chrome-parity.spec.ts` | read-full | `e2e/site-chrome-parity.spec.ts` | D-Tests | none |
| `tests/e2e/site-locale-switch.spec.ts` | read-full | `e2e/site-locale-switch.spec.ts` | D-Tests | none |
| `tests/e2e/site-navigation-screenshots.spec.ts` | read-full | `e2e/site-navigation-screenshots.spec.ts` | D-Tests | none |
| `tests/e2e/site-navigation-smoke.spec.ts` | read-full | `e2e/site-navigation-smoke.spec.ts` | D-Tests | none |
| `tests/e2e/site-ui-helpers.ts` | read-full | `e2e/site-ui-helpers.ts` | D-Tests | none |
| `tests/e2e/site-visual-regression.spec.ts` | read-full | `e2e/site-visual-regression.spec.ts` | D-Tests | none |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave1-about.png` | binary-validated | `e2e/site-visual-regression.spec.ts-snapshots/wave1-about.png` | D-Tests | none |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave1-contact.png` | binary-validated | `e2e/site-visual-regression.spec.ts-snapshots/wave1-contact.png` | D-Tests | none |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave1-homepage.png` | binary-validated | `e2e/site-visual-regression.spec.ts-snapshots/wave1-homepage.png` | D-Tests | none |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave2-products.png` | binary-validated | `e2e/site-visual-regression.spec.ts-snapshots/wave2-products.png` | D-Tests | none |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave2-quote-cart.png` | binary-validated | `e2e/site-visual-regression.spec.ts-snapshots/wave2-quote-cart.png` | D-Tests | none |
| `tests/e2e/site-visual-regression.spec.ts-snapshots/wave2-solutions.png` | binary-validated | `e2e/site-visual-regression.spec.ts-snapshots/wave2-solutions.png` | D-Tests | none |
| `tests/e2e/sketch-to-plan-pipeline.spec.ts` | read-full | `e2e/sketch-to-plan-pipeline.spec.ts` | D-Tests | none |
| `tests/e2e/studio-phone-chrome.spec.ts` | read-full | `e2e/studio-phone-chrome.spec.ts` | D-Tests | none |
| `tests/e2e/touch-targets.spec.ts` | read-full | `e2e/touch-targets.spec.ts` | D-Tests | none |
| `tests/e2e/viewport-matrix-audit.spec.ts` | read-full | `e2e/viewport-matrix-audit.spec.ts` | D-Tests | none |
| `tests/e2e/visual-audit-full-site.spec.ts` | read-full | `e2e/visual-audit-full-site.spec.ts` | D-Tests | none |
| `tests/e2e/visual-audit-pages.ts` | read-full | `e2e/visual-audit-pages.ts` | D-Tests | none |
| `tests/e2e/zz-direct-nav-check.spec.ts` | read-full | `e2e/zz-direct-nav-check.spec.ts` | D-Tests | none |
| `tests/fixtures/planner-3d-parity.json` | read-full | `fixtures/planner-3d-parity.json` | D-Tests | none |
| `tests/fixtures/planner-guest-wall.json` | read-full | `fixtures/planner-guest-wall.json` | D-Tests | none |
| `tests/fixtures/planner/browserAuditMatrix.ts` | read-full | `fixtures/planner/browserAuditMatrix.ts` | D-Tests | none |
| `tests/fixtures/planner/representativeProject.ts` | read-full | `fixtures/planner/representativeProject.ts` | D-Tests | none |
| `tests/fixtures/plannerTestUuids.ts` | read-full | `fixtures/plannerTestUuids.ts` | D-Tests | none |
| `tests/fixtures/svg-editor-v2/full-safe.svg` | read-full | `fixtures/svg-editor-v2/full-safe.svg` | D-Tests | none |
| `tests/fixtures/svg-editor-v2/hostile/css-url.svg` | read-full | `fixtures/svg-editor-v2/hostile/css-url.svg` | D-Tests | none |
| `tests/fixtures/svg-editor-v2/hostile/data-url.svg` | read-full | `fixtures/svg-editor-v2/hostile/data-url.svg` | D-Tests | none |
| `tests/fixtures/svg-editor-v2/hostile/duplicate-id.svg` | read-full | `fixtures/svg-editor-v2/hostile/duplicate-id.svg` | D-Tests | none |
| `tests/fixtures/svg-editor-v2/hostile/entity.svg` | read-full | `fixtures/svg-editor-v2/hostile/entity.svg` | D-Tests | none |
| `tests/fixtures/svg-editor-v2/hostile/event-handler.svg` | read-full | `fixtures/svg-editor-v2/hostile/event-handler.svg` | D-Tests | none |
| `tests/fixtures/svg-editor-v2/hostile/script.svg` | read-full | `fixtures/svg-editor-v2/hostile/script.svg` | D-Tests | none |
| `tests/fixtures/svg-editor-v2/hostile/unresolved-reference.svg` | read-full | `fixtures/svg-editor-v2/hostile/unresolved-reference.svg` | D-Tests | none |
| `tests/fixtures/svg-editor-v2/minimal-safe.svg` | read-full | `fixtures/svg-editor-v2/minimal-safe.svg` | D-Tests | none |
| `tests/helpers/adminCatalogIsolation.ts` | read-full | `helpers/adminCatalogIsolation.ts` | D-Tests | none |
| `tests/helpers/globalSetup.ts` | read-full | `helpers/globalSetup.ts` | D-Tests | none |
| `tests/helpers/mockNextImage.tsx` | read-full | `helpers/mockNextImage.tsx` | D-Tests | none |
| `tests/helpers/mockNextLink.tsx` | read-full | `helpers/mockNextLink.tsx` | D-Tests | none |
| `tests/helpers/nextIntlServerEnMock.ts` | read-full | `helpers/nextIntlServerEnMock.ts` | D-Tests | none |
| `tests/helpers/paths.ts` | read-full | `helpers/paths.ts` | D-Tests | none |
| `tests/helpers/rateLimitResult.ts` | read-full | `helpers/rateLimitResult.ts` | D-Tests | none |
| `tests/helpers/setNodeEnv.ts` | read-full | `helpers/setNodeEnv.ts` | D-Tests | none |
| `tests/helpers/svgEditorV2TestWorkspace.ts` | read-full | `helpers/svgEditorV2TestWorkspace.ts` | D-Tests | none |
| `tests/integration/app/sitemap-catalog-emit.test.ts` | read-full | `integration/app/sitemap-catalog-emit.test.ts` | D-Tests | none |
| `tests/integration/components/pwa/ServiceWorkerRegister.test.tsx` | read-full | `integration/components/pwa/ServiceWorkerRegister.test.tsx` | D-Tests | none |
| `tests/integration/features/ops/CustomerQueriesOpsPageView.test.tsx` | read-full | `integration/features/ops/CustomerQueriesOpsPageView.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/auth/components/AuthControls.test.tsx` | read-full | `integration/features/shared/auth/components/AuthControls.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/auth/components/AuthShell.test.tsx` | read-full | `integration/features/shared/auth/components/AuthShell.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/auth/components/LoginPage.test.tsx` | read-full | `integration/features/shared/auth/components/LoginPage.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/auth/components/ResendVerificationButton.test.tsx` | read-full | `integration/features/shared/auth/components/ResendVerificationButton.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/auth/components/SignupPage.test.tsx` | read-full | `integration/features/shared/auth/components/SignupPage.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/auth/components/SuspendedPage.test.tsx` | read-full | `integration/features/shared/auth/components/SuspendedPage.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/auth/lib/AuthProvider.test.tsx` | read-full | `integration/features/shared/auth/lib/AuthProvider.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/auth/lib/session.test.ts` | read-full | `integration/features/shared/auth/lib/session.test.ts` | D-Tests | none |
| `tests/integration/features/shared/auth/lib/useDocumentTitle.test.tsx` | read-full | `integration/features/shared/auth/lib/useDocumentTitle.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/components/GuestBadge.test.tsx` | read-full | `integration/features/shared/components/GuestBadge.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/components/RestrictedActionButton.test.tsx` | read-full | `integration/features/shared/components/RestrictedActionButton.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/dashboard/DashboardClient.test.tsx` | read-full | `integration/features/shared/dashboard/DashboardClient.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/entry/AccessPage.test.tsx` | read-full | `integration/features/shared/entry/AccessPage.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/entry/ChooseProductPage.test.tsx` | read-full | `integration/features/shared/entry/ChooseProductPage.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/entry/OpenAssistantButton.test.tsx` | read-full | `integration/features/shared/entry/OpenAssistantButton.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/entry/ProductEntryPage.test.tsx` | read-full | `integration/features/shared/entry/ProductEntryPage.test.tsx` | D-Tests | none |
| `tests/integration/features/shared/shell/GlobalNavHeader.test.tsx` | read-full | `integration/features/shared/shell/GlobalNavHeader.test.tsx` | D-Tests | none |
| `tests/integration/features/site/assistant/AdvancedBot.test.tsx` | read-full | `integration/features/site/assistant/AdvancedBot.test.tsx` | D-Tests | none |
| `tests/integration/features/site/assistant/DynamicBotWrapper.test.tsx` | read-full | `integration/features/site/assistant/DynamicBotWrapper.test.tsx` | D-Tests | none |
| `tests/integration/features/site/assistant/UnifiedAssistant.test.tsx` | read-full | `integration/features/site/assistant/UnifiedAssistant.test.tsx` | D-Tests | none |
| `tests/integration/lib/catalog/catalogTree.test.ts` | read-full | `integration/lib/catalog/catalogTree.test.ts` | D-Tests | none |
| `tests/integration/lib/catalog/productStaticParams.test.ts` | read-full | `integration/lib/catalog/productStaticParams.test.ts` | D-Tests | none |
| `tests/integration/lib/catalog/site/getProducts.test.ts` | read-full | `integration/lib/catalog/site/getProducts.test.ts` | D-Tests | none |
| `tests/integration/lib/catalog/site/imageMetadata.integration.test.ts` | read-full | `integration/lib/catalog/site/imageMetadata.integration.test.ts` | D-Tests | none |
| `tests/integration/lib/catalog/site/specSchema.test.ts` | read-full | `integration/lib/catalog/site/specSchema.test.ts` | D-Tests | none |
| `tests/integration/lib/catalog/sources.test.ts` | read-full | `integration/lib/catalog/sources.test.ts` | D-Tests | none |
| `tests/integration/planner/plannerWorkstream5Regression.test.ts` | read-full | `integration/planner/plannerWorkstream5Regression.test.ts` | D-Tests | none |
| `tests/manifests/coverage-exceptions.json` | read-full | `manifests/coverage-exceptions.json` | D-Tests | none |
| `tests/manifests/skip-exceptions.json` | read-full | `manifests/skip-exceptions.json` | D-Tests | F5 |
| `tests/manifests/source-test-ownership.json` | read-full | `manifests/source-test-ownership.json` | D-Tests | none |
| `tests/manifests/visual-baselines.json` | read-full | `manifests/visual-baselines.json` | D-Tests | none |
| `tests/operations-review/alignmentSourceLinked.property.test.ts` | read-full | `operations-review/alignmentSourceLinked.property.test.ts` | D-Tests | none |
| `tests/operations-review/attributableMissingBackupCoverageGaps.property.test.ts` | read-full | `operations-review/attributableMissingBackupCoverageGaps.property.test.ts` | D-Tests | none |
| `tests/operations-review/attributableMonitoringGaps.property.test.ts` | read-full | `operations-review/attributableMonitoringGaps.property.test.ts` | D-Tests | none |
| `tests/operations-review/evidenceRecordPartitions.property.test.ts` | read-full | `operations-review/evidenceRecordPartitions.property.test.ts` | D-Tests | none |
| `tests/operations-review/extractors.fixture.test.ts` | read-full | `operations-review/extractors.fixture.test.ts` | D-Tests | none |
| `tests/operations-review/incidentUncertaintyPreservation.property.test.ts` | read-full | `operations-review/incidentUncertaintyPreservation.property.test.ts` | D-Tests | none |
| `tests/operations-review/monitoringGapsAttributable.property.test.ts` | read-full | `operations-review/monitoringGapsAttributable.property.test.ts` | D-Tests | none |
| `tests/operations-review/persistedDataReleaseCompleteness.property.test.ts` | read-full | `operations-review/persistedDataReleaseCompleteness.property.test.ts` | D-Tests | none |
| `tests/operations-review/protectedOperationCompleteness.property.test.ts` | read-full | `operations-review/protectedOperationCompleteness.property.test.ts` | D-Tests | none |
| `tests/operations-review/repositoryEvidenceAdmission.property.test.ts` | read-full | `operations-review/repositoryEvidenceAdmission.property.test.ts` | D-Tests | none |
| `tests/operations-review/restoreDrillCompleteness.property.test.ts` | read-full | `operations-review/restoreDrillCompleteness.property.test.ts` | D-Tests | none |
| `tests/operations-review/restoreDrillEvidenceFields.property.test.ts` | read-full | `operations-review/restoreDrillEvidenceFields.property.test.ts` | D-Tests | none |
| `tests/operations-review/scheduledWorkflowCredentialRedaction.property.test.ts` | read-full | `operations-review/scheduledWorkflowCredentialRedaction.property.test.ts` | D-Tests | none |
| `tests/operations-review/sourceLinkedAlignmentDifferences.property.test.ts` | read-full | `operations-review/sourceLinkedAlignmentDifferences.property.test.ts` | D-Tests | none |
| `tests/operations-review/unsupportedExternalClaim.property.test.ts` | read-full | `operations-review/unsupportedExternalClaim.property.test.ts` | D-Tests | none |
| `tests/operations-review/workerReleaseDecision.property.test.ts` | read-full | `operations-review/workerReleaseDecision.property.test.ts` | D-Tests | none |
| `tests/package.json` | read-full | `package.json` | D-Tests | none |
| `tests/playwright-inspect.ts` | read-full | `playwright-inspect.ts` | D-Tests | F6 |
| `tests/setup.node.ts` | read-full | `setup.node.ts` | D-Tests | none |
| `tests/setup.ts` | read-full | `setup.ts` | D-Tests | none |
| `tests/site-ui-content-links-audit/canonicalInventoryClosure.property.test.ts` | read-full | `site-ui-content-links-audit/canonicalInventoryClosure.property.test.ts` | D-Tests | none |
| `tests/site-ui-content-links-audit/dynamicInstanceDeduplication.property.test.ts` | read-full | `site-ui-content-links-audit/dynamicInstanceDeduplication.property.test.ts` | D-Tests | none |
| `tests/site-ui-content-links-audit/property-03-occurrence-bijection.test.ts` | read-full | `site-ui-content-links-audit/property-03-occurrence-bijection.test.ts` | D-Tests | none |
| `tests/site-ui-content-links-audit/property-04-auth-non-escalation.test.ts` | read-full | `site-ui-content-links-audit/property-04-auth-non-escalation.test.ts` | D-Tests | none |
| `tests/site-ui-content-links-audit/property-05-zero-product-mutation.test.ts` | read-full | `site-ui-content-links-audit/property-05-zero-product-mutation.test.ts` | D-Tests | F2 |
| `tests/site-ui-content-links-audit/property-3-occurrence-expansion-finding-bijection.test.ts` | read-full | `site-ui-content-links-audit/property-3-occurrence-expansion-finding-bijection.test.ts` | D-Tests | none |
| `tests/site-ui-content-links-audit/property-5-zero-product-code-mutation.test.ts` | read-full | `site-ui-content-links-audit/property-5-zero-product-code-mutation.test.ts` | D-Tests | none |
| `tests/site-ui-content-links-audit/property-w3-partition-isolation-closure.test.ts` | read-full | `site-ui-content-links-audit/property-w3-partition-isolation-closure.test.ts` | D-Tests | none |
| `tests/site-ui-content-links-audit/property-w5c-completion-proof-reconciliation.test.ts` | read-full | `site-ui-content-links-audit/property-w5c-completion-proof-reconciliation.test.ts` | D-Tests | none |
| `tests/site-ui-content-links-audit/property-w5h-remediation-handoff-completeness.test.ts` | read-full | `site-ui-content-links-audit/property-w5h-remediation-handoff-completeness.test.ts` | D-Tests | none |
| `tests/site-ui-content-links-audit/property-w5r-severity-duplicate-reconciliation.test.ts` | read-full | `site-ui-content-links-audit/property-w5r-severity-duplicate-reconciliation.test.ts` | D-Tests | none |
| `tests/support/accessibility/assertA11y.ts` | read-full | `support/accessibility/assertA11y.ts` | D-Tests | none |
| `tests/support/fixtures/viewportTiers.ts` | read-full | `support/fixtures/viewportTiers.ts` | D-Tests | none |
| `tests/support/page-objects/WorkspacePage.ts` | read-full | `support/page-objects/WorkspacePage.ts` | D-Tests | none |
| `tests/support/ui-states/assertNoOverflow.ts` | read-full | `support/ui-states/assertNoOverflow.ts` | D-Tests | none |
| `tests/support/ui-states/uiStateMatrix.ts` | read-full | `support/ui-states/uiStateMatrix.ts` | D-Tests | none |
| `tests/support/visual/visualBaseline.ts` | read-full | `support/visual/visualBaseline.ts` | D-Tests | none |
| `tests/tech-docs-generator/app-overlay.test.tsx` | read-full | `tech-docs-generator/app-overlay.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/auth-gate.test.tsx` | read-full | `tech-docs-generator/auth-gate.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/auth-provider.test.tsx` | read-full | `tech-docs-generator/auth-provider.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/auth-roles.test.ts` | read-full | `tech-docs-generator/auth-roles.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/component-branch-coverage.test.tsx` | read-full | `tech-docs-generator/component-branch-coverage.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/data-branch-coverage.test.ts` | read-full | `tech-docs-generator/data-branch-coverage.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/data-loaders.test.ts` | read-full | `tech-docs-generator/data-loaders.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/deployment-page-coverage.test.tsx` | read-full | `tech-docs-generator/deployment-page-coverage.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/features-page.test.tsx` | read-full | `tech-docs-generator/features-page.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/generated-domain-section.test.tsx` | read-full | `tech-docs-generator/generated-domain-section.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/generated-status-card.test.tsx` | read-full | `tech-docs-generator/generated-status-card.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/generated-tables.test.tsx` | read-full | `tech-docs-generator/generated-tables.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/generator/check-coverage.test.ts` | read-full | `tech-docs-generator/generator/check-coverage.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/domain-extractors.test.ts` | read-full | `tech-docs-generator/generator/domain-extractors.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/extractor-mutation.test.ts` | read-full | `tech-docs-generator/generator/extractor-mutation.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/extractors.test.ts` | read-full | `tech-docs-generator/generator/extractors.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/filesystem.test.ts` | read-full | `tech-docs-generator/generator/filesystem.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/generation.test.ts` | read-full | `tech-docs-generator/generator/generation.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/guards.test.ts` | read-full | `tech-docs-generator/generator/guards.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/impact-seeds.test.ts` | read-full | `tech-docs-generator/generator/impact-seeds.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/live-regeneration.test.ts` | read-full | `tech-docs-generator/generator/live-regeneration.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/output-contract.test.ts` | read-full | `tech-docs-generator/generator/output-contract.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/publication.test.ts` | read-full | `tech-docs-generator/generator/publication.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/repo-graph.test.ts` | read-full | `tech-docs-generator/generator/repo-graph.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/repository-map.test.ts` | read-full | `tech-docs-generator/generator/repository-map.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/schema.test.ts` | read-full | `tech-docs-generator/generator/schema.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/source-coverage-contract.test.ts` | read-full | `tech-docs-generator/generator/source-coverage-contract.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/source-policy.test.ts` | read-full | `tech-docs-generator/generator/source-policy.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/generator/theme-alignment.test.ts` | read-full | `tech-docs-generator/generator/theme-alignment.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/global-setup.mjs` | read-full | `tech-docs-generator/global-setup.mjs` | D-Tests | none |
| `tests/tech-docs-generator/helpers/shared-repo-model.mjs` | read-full | `tech-docs-generator/helpers/shared-repo-model.mjs` | D-Tests | none |
| `tests/tech-docs-generator/lib-auth-env.test.ts` | read-full | `tech-docs-generator/lib-auth-env.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/login-page.test.tsx` | read-full | `tech-docs-generator/login-page.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/main.test.ts` | read-full | `tech-docs-generator/main.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/package-data.test.ts` | read-full | `tech-docs-generator/package-data.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/package.test.ts` | read-full | `tech-docs-generator/package.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/rendering.test.tsx` | read-full | `tech-docs-generator/rendering.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/routeDomainTypes.test.ts` | read-full | `tech-docs-generator/routeDomainTypes.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/security-page.test.tsx` | read-full | `tech-docs-generator/security-page.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/setup.ts` | read-full | `tech-docs-generator/setup.ts` | D-Tests | none |
| `tests/tech-docs-generator/snapshot.test.ts` | read-full | `tech-docs-generator/snapshot.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/techstack-branches.test.tsx` | read-full | `tech-docs-generator/techstack-branches.test.tsx` | D-Tests | none |
| `tests/tech-docs-generator/testing-data-coverage.test.ts` | read-full | `tech-docs-generator/testing-data-coverage.test.ts` | D-Tests | none |
| `tests/tech-docs-generator/tsconfig.json` | read-full | `tech-docs-generator/tsconfig.json` | D-Tests | none |
| `tests/tech-docs-generator/useSearch.test.tsx` | read-full | `tech-docs-generator/useSearch.test.tsx` | D-Tests | none |
| `tests/tsconfig.json` | read-full | `tsconfig.json` | D-Tests | none |
| `tests/unit/app/(site)/_template.homepage.test.tsx` | read-full | `app/(site)/_template.homepage.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/about/page.test.tsx` | read-full | `app/(site)/about/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/access/AccessForm.test.tsx` | read-full | `app/(site)/access/AccessForm.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/access/page.test.tsx` | read-full | `app/(site)/access/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/career/page.test.tsx` | read-full | `app/(site)/career/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/choose-product/page.test.tsx` | read-full | `app/(site)/choose-product/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/compare/page.test.tsx` | read-full | `app/(site)/compare/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/contact/page.test.tsx` | read-full | `app/(site)/contact/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/dashboard/layout.test.tsx` | read-full | `app/(site)/dashboard/layout.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/dashboard/page.test.tsx` | read-full | `app/(site)/dashboard/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/downloads/page.test.tsx` | read-full | `app/(site)/downloads/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/error.test.tsx` | read-full | `app/(site)/error.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/layout.test.tsx` | read-full | `app/(site)/layout.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/loading.test.tsx` | read-full | `app/(site)/loading.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/login/page.test.tsx` | read-full | `app/(site)/login/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/not-found.test.tsx` | read-full | `app/(site)/not-found.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/opengraph-image.test.tsx` | read-full | `app/(site)/opengraph-image.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/page.legacy.test.tsx` | read-full | `app/(site)/page.legacy.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/page.test.tsx` | read-full | `app/(site)/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/planning/page.test.tsx` | read-full | `app/(site)/planning/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/portal/[id]/page.test.tsx` | read-full | `app/(site)/portal/[id]/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/portal/guest/page.test.tsx` | read-full | `app/(site)/portal/guest/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/portal/guest/view/[id]/page.test.tsx` | read-full | `app/(site)/portal/guest/view/[id]/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/portal/layout.test.tsx` | read-full | `app/(site)/portal/layout.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/portal/page.test.tsx` | read-full | `app/(site)/portal/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/portfolio/page.test.tsx` | read-full | `app/(site)/portfolio/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/privacy/page.test.tsx` | read-full | `app/(site)/privacy/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/[category]/FilterGrid.components.test.tsx` | read-full | `app/(site)/products/[category]/FilterGrid.components.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/[category]/FilterGrid.helpers.test.ts` | read-full | `app/(site)/products/[category]/FilterGrid.helpers.test.ts` | D-Tests | none |
| `tests/unit/app/(site)/products/[category]/FilterGridInner.test.tsx` | read-full | `app/(site)/products/[category]/FilterGridInner.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/[category]/[product]/ProductViewer.test.tsx` | read-full | `app/(site)/products/[category]/[product]/ProductViewer.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/[category]/[product]/layout.test.tsx` | read-full | `app/(site)/products/[category]/[product]/layout.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/[category]/[product]/page.test.tsx` | read-full | `app/(site)/products/[category]/[product]/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/[category]/loading.test.tsx` | read-full | `app/(site)/products/[category]/loading.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/[category]/page.test.tsx` | read-full | `app/(site)/products/[category]/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/category/[slug]/page.test.tsx` | read-full | `app/(site)/products/category/[slug]/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/error.test.tsx` | read-full | `app/(site)/products/error.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/layout.test.tsx` | read-full | `app/(site)/products/layout.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/loading.test.tsx` | read-full | `app/(site)/products/loading.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/products/page.test.tsx` | read-full | `app/(site)/products/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/providers/QueryProvider.test.tsx` | read-full | `app/(site)/providers/QueryProvider.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/quote-cart/layout.test.tsx` | read-full | `app/(site)/quote-cart/layout.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/quote-cart/page.test.tsx` | read-full | `app/(site)/quote-cart/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/refund-and-return-policy/page.test.tsx` | read-full | `app/(site)/refund-and-return-policy/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/robots.test.ts` | read-full | `app/(site)/robots.test.ts` | D-Tests | none |
| `tests/unit/app/(site)/service/page.test.tsx` | read-full | `app/(site)/service/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/showrooms/page.test.tsx` | read-full | `app/(site)/showrooms/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/sitemap.test.ts` | read-full | `app/(site)/sitemap.test.ts` | D-Tests | none |
| `tests/unit/app/(site)/solutions/[category]/page.test.tsx` | read-full | `app/(site)/solutions/[category]/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/solutions/page.test.tsx` | read-full | `app/(site)/solutions/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/sustainability/page.test.tsx` | read-full | `app/(site)/sustainability/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/terms/page.test.tsx` | read-full | `app/(site)/terms/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/trusted-by/page.test.tsx` | read-full | `app/(site)/trusted-by/page.test.tsx` | D-Tests | none |
| `tests/unit/app/(site)/twitter-image.test.tsx` | read-full | `app/(site)/twitter-image.test.tsx` | D-Tests | none |
| `tests/unit/app/.well-known/api-catalog/route.test.ts` | read-full | `app/.well-known/api-catalog/route.test.ts` | D-Tests | none |
| `tests/unit/app/admin/layout.test.tsx` | read-full | `app/admin/layout.test.tsx` | D-Tests | none |
| `tests/unit/app/api/Planner/ai-advisor/plannerAdvisorFallback.property.test.ts` | read-full | `app/api/Planner/ai-advisor/plannerAdvisorFallback.property.test.ts` | D-Tests | none |
| `tests/unit/app/api/Planner/ai-advisor/plannerAdvisorSecrets.property.test.ts` | read-full | `app/api/Planner/ai-advisor/plannerAdvisorSecrets.property.test.ts` | D-Tests | none |
| `tests/unit/app/api/Planner/ai-advisor/plannerAdvisorShape.property.test.ts` | read-full | `app/api/Planner/ai-advisor/plannerAdvisorShape.property.test.ts` | D-Tests | none |
| `tests/unit/app/api/Planner/ai-advisor/plannerAdvisorStreaming.property.test.ts` | read-full | `app/api/Planner/ai-advisor/plannerAdvisorStreaming.property.test.ts` | D-Tests | none |
| `tests/unit/app/api/Planner/ai-advisor/plannerAdvisorValidation.property.test.ts` | read-full | `app/api/Planner/ai-advisor/plannerAdvisorValidation.property.test.ts` | D-Tests | none |
| `tests/unit/app/api/Planner/ai-advisor/plannerAdvisorWiring.test.ts` | read-full | `app/api/Planner/ai-advisor/plannerAdvisorWiring.test.ts` | D-Tests | none |
| `tests/unit/app/api/Planner/ai-advisor/route.test.ts` | read-full | `app/api/Planner/ai-advisor/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/Planner/handoff/route.test.ts` | read-full | `app/api/Planner/handoff/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/Planner/projects/[id]/route.test.ts` | read-full | `app/api/Planner/projects/[id]/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/Planner/projects/route.test.ts` | read-full | `app/api/Planner/projects/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/Planner/sketch-to-plan/route.test.ts` | read-full | `app/api/Planner/sketch-to-plan/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/Studio/furniture/[id]/publish/route.test.ts` | read-full | `app/api/Studio/furniture/[id]/publish/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/Studio/furniture/[id]/route.test.ts` | read-full | `app/api/Studio/furniture/[id]/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/Studio/furniture/route.test.ts` | read-full | `app/api/Studio/furniture/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/Studio/furniture/upload/route.test.ts` | read-full | `app/api/Studio/furniture/upload/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/_lib/public.test.ts` | read-full | `app/api/_lib/public.test.ts` | D-Tests | none |
| `tests/unit/app/api/admin/_lib/server.test.ts` | read-full | `app/api/admin/_lib/server.test.ts` | D-Tests | none |
| `tests/unit/app/api/admin/catalogs/[type]/route.test.ts` | read-full | `app/api/admin/catalogs/[type]/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/admin/features/route.test.ts` | read-full | `app/api/admin/features/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/admin/price-books/route.test.ts` | read-full | `app/api/admin/price-books/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/ai-advisor/catalogContract.property.test.ts` | read-full | `app/api/ai-advisor/catalogContract.property.test.ts` | D-Tests | none |
| `tests/unit/app/api/ai-advisor/route.test.ts` | read-full | `app/api/ai-advisor/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/audit/route.test.ts` | read-full | `app/api/audit/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/business-stats/route.test.ts` | read-full | `app/api/business-stats/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/categories/route.test.ts` | read-full | `app/api/categories/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/configurator/smart-wizard/route.test.ts` | read-full | `app/api/configurator/smart-wizard/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/csrf/route.test.ts` | read-full | `app/api/csrf/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/customer-queries/manage/route.test.ts` | read-full | `app/api/customer-queries/manage/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/customer-queries/route.db.smoke.test.ts` | read-full | `app/api/customer-queries/route.db.smoke.test.ts` | D-Tests | F1 |
| `tests/unit/app/api/customer-queries/route.test.ts` | read-full | `app/api/customer-queries/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/dev-tools/lighthouse/route.test.ts` | read-full | `app/api/dev-tools/lighthouse/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/dev/auth-bypass-status/route.test.ts` | read-full | `app/api/dev/auth-bypass-status/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/exports/route.test.ts` | read-full | `app/api/exports/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/features/route.test.ts` | read-full | `app/api/features/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/filter/route.test.ts` | read-full | `app/api/filter/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/generate-alt/route.test.ts` | read-full | `app/api/generate-alt/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/git-user/route.test.ts` | read-full | `app/api/git-user/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/health/route.test.ts` | read-full | `app/api/health/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/log-error/route.test.ts` | read-full | `app/api/log-error/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/mutation-route-safety.matrix.test.ts` | read-full | `app/api/mutation-route-safety.matrix.test.ts` | D-Tests | none |
| `tests/unit/app/api/nav-categories/route.test.ts` | read-full | `app/api/nav-categories/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/nav-search/route.test.ts` | read-full | `app/api/nav-search/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/plans/[id]/route.test.ts` | read-full | `app/api/plans/[id]/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/plans/route.test.ts` | read-full | `app/api/plans/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/products/filter/route.test.ts` | read-full | `app/api/products/filter/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/products/route.test.ts` | read-full | `app/api/products/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/theme/route.test.ts` | read-full | `app/api/theme/route.test.ts` | D-Tests | none |
| `tests/unit/app/api/tracking/route.test.ts` | read-full | `app/api/tracking/route.test.ts` | D-Tests | none |
| `tests/unit/app/css/site/components/missing-components.test.ts` | read-full | `app/css/site/components/missing-components.test.ts` | D-Tests | none |
| `tests/unit/app/global-error.test.tsx` | read-full | `app/global-error.test.tsx` | D-Tests | none |
| `tests/unit/app/layout.test.tsx` | read-full | `app/layout.test.tsx` | D-Tests | none |
| `tests/unit/app/not-found.test.tsx` | read-full | `app/not-found.test.tsx` | D-Tests | none |
| `tests/unit/app/offline/ReloadButton.test.tsx` | read-full | `app/offline/ReloadButton.test.tsx` | D-Tests | none |
| `tests/unit/app/offline/layout.test.tsx` | read-full | `app/offline/layout.test.tsx` | D-Tests | none |
| `tests/unit/app/offline/page.test.tsx` | read-full | `app/offline/page.test.tsx` | D-Tests | none |
| `tests/unit/app/plannerRootViewportLock.test.ts` | read-full | `app/plannerRootViewportLock.test.ts` | D-Tests | none |
| `tests/unit/app/robots.test.ts` | read-full | `app/robots.test.ts` | D-Tests | none |
| `tests/unit/app/sitemap.test.ts` | read-full | `app/sitemap.test.ts` | D-Tests | none |
| `tests/unit/components/ClientBadge.test.tsx` | read-full | `components/ClientBadge.test.tsx` | D-Tests | none |
| `tests/unit/components/Planner/Planner.test.tsx` | read-full | `components/Planner/Planner.test.tsx` | D-Tests | none |
| `tests/unit/components/Planner/PlannerEntry.test.tsx` | read-full | `components/Planner/PlannerEntry.test.tsx` | D-Tests | none |
| `tests/unit/components/Planner/PlannerErrorBoundary.test.tsx` | read-full | `components/Planner/PlannerErrorBoundary.test.tsx` | D-Tests | none |
| `tests/unit/components/Planner/PlannerProjectAccessState.test.tsx` | read-full | `components/Planner/PlannerProjectAccessState.test.tsx` | D-Tests | none |
| `tests/unit/components/Planner/PlannerProjectLoadState.test.tsx` | read-full | `components/Planner/PlannerProjectLoadState.test.tsx` | D-Tests | none |
| `tests/unit/components/Planner/PlannerProjectsList.test.tsx` | read-full | `components/Planner/PlannerProjectsList.test.tsx` | D-Tests | none |
| `tests/unit/components/Planner/plannerProjectsListState.test.ts` | read-full | `components/Planner/plannerProjectsListState.test.ts` | D-Tests | none |
| `tests/unit/components/ProductGallery.test.tsx` | read-full | `components/ProductGallery.test.tsx` | D-Tests | none |
| `tests/unit/components/Reviews.test.tsx` | read-full | `components/Reviews.test.tsx` | D-Tests | none |
| `tests/unit/components/analytics/KpiIntegrityMonitor.test.tsx` | read-full | `components/analytics/KpiIntegrityMonitor.test.tsx` | D-Tests | none |
| `tests/unit/components/career/CareerPageView.test.tsx` | read-full | `components/career/CareerPageView.test.tsx` | D-Tests | none |
| `tests/unit/components/career/JobCard.test.tsx` | read-full | `components/career/JobCard.test.tsx` | D-Tests | none |
| `tests/unit/components/contact/ContactPageView.test.tsx` | read-full | `components/contact/ContactPageView.test.tsx` | D-Tests | none |
| `tests/unit/components/contact/CustomerQueryForm.test.tsx` | read-full | `components/contact/CustomerQueryForm.test.tsx` | D-Tests | none |
| `tests/unit/components/home/CategoryGrid.test.tsx` | read-full | `components/home/CategoryGrid.test.tsx` | D-Tests | none |
| `tests/unit/components/home/CollectionsSectionHeading.test.tsx` | read-full | `components/home/CollectionsSectionHeading.test.tsx` | D-Tests | none |
| `tests/unit/components/home/HomepageHero.test.tsx` | read-full | `components/home/HomepageHero.test.tsx` | D-Tests | none |
| `tests/unit/components/home/InteractiveTools.test.tsx` | read-full | `components/home/InteractiveTools.test.tsx` | D-Tests | none |
| `tests/unit/components/home/KpiCounter.test.tsx` | read-full | `components/home/KpiCounter.test.tsx` | D-Tests | none |
| `tests/unit/components/home/ShowcaseCarousel.test.tsx` | read-full | `components/home/ShowcaseCarousel.test.tsx` | D-Tests | none |
| `tests/unit/components/home/WhyChooseUs.test.tsx` | read-full | `components/home/WhyChooseUs.test.tsx` | D-Tests | none |
| `tests/unit/components/home/layout/HomeCatalogLayout.test.tsx` | read-full | `components/home/layout/HomeCatalogLayout.test.tsx` | D-Tests | none |
| `tests/unit/components/home/layout/HomeMarketingLayout.test.tsx` | read-full | `components/home/layout/HomeMarketingLayout.test.tsx` | D-Tests | none |
| `tests/unit/components/home/layout/HomeSection.test.tsx` | read-full | `components/home/layout/HomeSection.test.tsx` | D-Tests | none |
| `tests/unit/components/home/layout/HomeSectionInner.test.tsx` | read-full | `components/home/layout/HomeSectionInner.test.tsx` | D-Tests | none |
| `tests/unit/components/home/layout/SiteWorkspaceShell.test.tsx` | read-full | `components/home/layout/SiteWorkspaceShell.test.tsx` | D-Tests | none |
| `tests/unit/components/home/layout/index.test.ts` | read-full | `components/home/layout/index.test.ts` | D-Tests | none |
| `tests/unit/components/home/marketingSurfaces.test.tsx` | read-full | `components/home/marketingSurfaces.test.tsx` | D-Tests | none |
| `tests/unit/components/legal/QuerySectionScroll.test.tsx` | read-full | `components/legal/QuerySectionScroll.test.tsx` | D-Tests | none |
| `tests/unit/components/products/CatalogMobile.test.tsx` | read-full | `components/products/CatalogMobile.test.tsx` | D-Tests | none |
| `tests/unit/components/products/CompareShortlistHydrator.test.tsx` | read-full | `components/products/CompareShortlistHydrator.test.tsx` | D-Tests | none |
| `tests/unit/components/products/ProductsPageView.test.tsx` | read-full | `components/products/ProductsPageView.test.tsx` | D-Tests | none |
| `tests/unit/components/products/compareSurfaces.test.tsx` | read-full | `components/products/compareSurfaces.test.tsx` | D-Tests | none |
| `tests/unit/components/pwa/ServiceWorkerRegister.test.tsx` | read-full | `components/pwa/ServiceWorkerRegister.test.tsx` | D-Tests | none |
| `tests/unit/components/security/csrfSurfaces.test.tsx` | read-full | `components/security/csrfSurfaces.test.tsx` | D-Tests | none |
| `tests/unit/components/shared/ContactTeaser.test.tsx` | read-full | `components/shared/ContactTeaser.test.tsx` | D-Tests | none |
| `tests/unit/components/shared/RouteActionCard.test.tsx` | read-full | `components/shared/RouteActionCard.test.tsx` | D-Tests | none |
| `tests/unit/components/shared/RouteCtaBand.test.tsx` | read-full | `components/shared/RouteCtaBand.test.tsx` | D-Tests | none |
| `tests/unit/components/shared/SectionIntro.test.tsx` | read-full | `components/shared/SectionIntro.test.tsx` | D-Tests | none |
| `tests/unit/components/site/CookieConsentBar.test.tsx` | read-full | `components/site/CookieConsentBar.test.tsx` | D-Tests | none |
| `tests/unit/components/site/EditorialRoute.test.tsx` | read-full | `components/site/EditorialRoute.test.tsx` | D-Tests | none |
| `tests/unit/components/site/Footer.test.tsx` | read-full | `components/site/Footer.test.tsx` | D-Tests | none |
| `tests/unit/components/site/FooterLogoMarquee.test.tsx` | read-full | `components/site/FooterLogoMarquee.test.tsx` | D-Tests | none |
| `tests/unit/components/site/Header.test.tsx` | read-full | `components/site/Header.test.tsx` | D-Tests | none |
| `tests/unit/components/site/LanguageSwitcher.test.tsx` | read-full | `components/site/LanguageSwitcher.test.tsx` | D-Tests | none |
| `tests/unit/components/site/MaintenanceBanner.test.tsx` | read-full | `components/site/MaintenanceBanner.test.tsx` | D-Tests | none |
| `tests/unit/components/site/MobileAppShell.test.tsx` | read-full | `components/site/MobileAppShell.test.tsx` | D-Tests | none |
| `tests/unit/components/site/MobileNavDrawer.test.tsx` | read-full | `components/site/MobileNavDrawer.test.tsx` | D-Tests | none |
| `tests/unit/components/site/RouteChrome.test.tsx` | read-full | `components/site/RouteChrome.test.tsx` | D-Tests | none |
| `tests/unit/components/site/RouteChromeSuspense.test.tsx` | read-full | `components/site/RouteChromeSuspense.test.tsx` | D-Tests | none |
| `tests/unit/components/site/SiteAnalytics.test.tsx` | read-full | `components/site/SiteAnalytics.test.tsx` | D-Tests | none |
| `tests/unit/components/site/SiteConversionTracker.test.tsx` | read-full | `components/site/SiteConversionTracker.test.tsx` | D-Tests | none |
| `tests/unit/components/site/SiteErrorBoundary.test.tsx` | read-full | `components/site/SiteErrorBoundary.test.tsx` | D-Tests | none |
| `tests/unit/components/site/clients/ClientCard.test.tsx` | read-full | `components/site/clients/ClientCard.test.tsx` | D-Tests | none |
| `tests/unit/components/site/clients/ClientLogoArea.test.tsx` | read-full | `components/site/clients/ClientLogoArea.test.tsx` | D-Tests | none |
| `tests/unit/components/site/clients/ClientTabPanel.test.tsx` | read-full | `components/site/clients/ClientTabPanel.test.tsx` | D-Tests | none |
| `tests/unit/components/ui/Button.test.tsx` | read-full | `components/ui/Button.test.tsx` | D-Tests | none |
| `tests/unit/components/ui/EditorPrimitives.test.tsx` | read-full | `components/ui/EditorPrimitives.test.tsx` | D-Tests | none |
| `tests/unit/components/ui/Input.test.tsx` | read-full | `components/ui/Input.test.tsx` | D-Tests | none |
| `tests/unit/components/ui/Label.test.tsx` | read-full | `components/ui/Label.test.tsx` | D-Tests | none |
| `tests/unit/components/ui/Logo.test.tsx` | read-full | `components/ui/Logo.test.tsx` | D-Tests | none |
| `tests/unit/components/ui/PlannerLaunchLink.test.tsx` | read-full | `components/ui/PlannerLaunchLink.test.tsx` | D-Tests | none |
| `tests/unit/components/ui/TrackedLink.test.tsx` | read-full | `components/ui/TrackedLink.test.tsx` | D-Tests | none |
| `tests/unit/components/ui/WhatsAppCTA.test.tsx` | read-full | `components/ui/WhatsAppCTA.test.tsx` | D-Tests | none |
| `tests/unit/components/ui/useFocssResolvedScheme.test.tsx` | read-full | `components/ui/useFocssResolvedScheme.test.tsx` | D-Tests | none |
| `tests/unit/config/build/playwright-gate-specs.test.ts` | read-full | `config/build/playwright-gate-specs.test.ts` | D-Tests | none |
| `tests/unit/config/build/playwright.config.test.ts` | read-full | `config/build/playwright.config.test.ts` | D-Tests | none |
| `tests/unit/config/build/postcss-tailwind.test.ts` | read-full | `config/build/postcss-tailwind.test.ts` | D-Tests | none |
| `tests/unit/config/build/tsconfig.paths.test.ts` | read-full | `config/build/tsconfig.paths.test.ts` | D-Tests | none |
| `tests/unit/config/build/visual-baselines.test.ts` | read-full | `config/build/visual-baselines.test.ts` | D-Tests | none |
| `tests/unit/config/build/vitest-console-reporter.test.ts` | read-full | `config/build/vitest-console-reporter.test.ts` | D-Tests | none |
| `tests/unit/config/build/vitest-dual-lane.test.ts` | read-full | `config/build/vitest-dual-lane.test.ts` | D-Tests | none |
| `tests/unit/config/playwrightOpen3dWorldSpecs.test.ts` | read-full | `config/playwrightOpen3dWorldSpecs.test.ts` | D-Tests | none |
| `tests/unit/config/root-configs.test.ts` | read-full | `config/root-configs.test.ts` | D-Tests | none |
| `tests/unit/e2e-helpers/warmDevRoute.test.ts` | read-full | `e2e-helpers/warmDevRoute.test.ts` | D-Tests | none |
| `tests/unit/features/Planner/plannerEntryPages.test.tsx` | read-full | `features/Planner/plannerEntryPages.test.tsx` | D-Tests | none |
| `tests/unit/features/admin/api/adminActionGuards.test.ts` | read-full | `features/admin/api/adminActionGuards.test.ts` | D-Tests | none |
| `tests/unit/features/admin/api/catalogAdminHandlers.test.ts` | read-full | `features/admin/api/catalogAdminHandlers.test.ts` | D-Tests | none |
| `tests/unit/features/admin/catalog/adminCatalogManagerUtils.test.ts` | read-full | `features/admin/catalog/adminCatalogManagerUtils.test.ts` | D-Tests | none |
| `tests/unit/features/admin/catalog/catalogItemActions.test.ts` | read-full | `features/admin/catalog/catalogItemActions.test.ts` | D-Tests | none |
| `tests/unit/features/admin/catalog/releasedCatalogContract.test.ts` | read-full | `features/admin/catalog/releasedCatalogContract.test.ts` | D-Tests | none |
| `tests/unit/features/admin/design-kit/DesignKitPageView.test.tsx` | read-full | `features/admin/design-kit/DesignKitPageView.test.tsx` | D-Tests | none |
| `tests/unit/features/admin/feature-flags/AdminFeatureFlagsPageView.test.tsx` | read-full | `features/admin/feature-flags/AdminFeatureFlagsPageView.test.tsx` | D-Tests | none |
| `tests/unit/features/admin/feature-flags/updateFeatureFlags.server.test.ts` | read-full | `features/admin/feature-flags/updateFeatureFlags.server.test.ts` | D-Tests | none |
| `tests/unit/features/admin/pricing/priceBookContract.test.tsx` | read-full | `features/admin/pricing/priceBookContract.test.tsx` | D-Tests | none |
| `tests/unit/features/admin/pricing/priceBookGovernance.test.ts` | read-full | `features/admin/pricing/priceBookGovernance.test.ts` | D-Tests | none |
| `tests/unit/features/admin/pricing/priceBookService.test.ts` | read-full | `features/admin/pricing/priceBookService.test.ts` | D-Tests | none |
| `tests/unit/features/admin/pricing/quotePriceBookPin.test.ts` | read-full | `features/admin/pricing/quotePriceBookPin.test.ts` | D-Tests | none |
| `tests/unit/features/admin/ui/AdminFormShell.test.tsx` | read-full | `features/admin/ui/AdminFormShell.test.tsx` | D-Tests | none |
| `tests/unit/features/admin/ui/adminMobileReview.test.ts` | read-full | `features/admin/ui/adminMobileReview.test.ts` | D-Tests | none |
| `tests/unit/features/admin/ui/adminNav.test.ts` | read-full | `features/admin/ui/adminNav.test.ts` | D-Tests | none |
| `tests/unit/features/admin/workspace-config/workspaceConfigurationEnvelope.test.ts` | read-full | `features/admin/workspace-config/workspaceConfigurationEnvelope.test.ts` | D-Tests | none |
| `tests/unit/features/admin/workspace-config/workspaceConfigurationRepository.server.test.ts` | read-full | `features/admin/workspace-config/workspaceConfigurationRepository.server.test.ts` | D-Tests | none |
| `tests/unit/features/crm/ClientsView.test.tsx` | read-full | `features/crm/ClientsView.test.tsx` | D-Tests | none |
| `tests/unit/features/crm/CrmDemoBanner.test.tsx` | read-full | `features/crm/CrmDemoBanner.test.tsx` | D-Tests | none |
| `tests/unit/features/crm/CrmHubView.test.tsx` | read-full | `features/crm/CrmHubView.test.tsx` | D-Tests | none |
| `tests/unit/features/crm/CrmSubnav.test.tsx` | read-full | `features/crm/CrmSubnav.test.tsx` | D-Tests | none |
| `tests/unit/features/crm/CrmWorkspaceBanner.test.tsx` | read-full | `features/crm/CrmWorkspaceBanner.test.tsx` | D-Tests | none |
| `tests/unit/features/crm/EmbeddedCrmChrome.test.tsx` | read-full | `features/crm/EmbeddedCrmChrome.test.tsx` | D-Tests | none |
| `tests/unit/features/crm/ProjectDetailView.test.tsx` | read-full | `features/crm/ProjectDetailView.test.tsx` | D-Tests | none |
| `tests/unit/features/crm/ProjectsView.test.tsx` | read-full | `features/crm/ProjectsView.test.tsx` | D-Tests | none |
| `tests/unit/features/crm/QuotesView.test.tsx` | read-full | `features/crm/QuotesView.test.tsx` | D-Tests | none |
| `tests/unit/features/crm/businessStats.test.ts` | read-full | `features/crm/businessStats.test.ts` | D-Tests | none |
| `tests/unit/features/crm/contactSurfaces.test.ts` | read-full | `features/crm/contactSurfaces.test.ts` | D-Tests | none |
| `tests/unit/features/crm/crmMetrics.test.ts` | read-full | `features/crm/crmMetrics.test.ts` | D-Tests | none |
| `tests/unit/features/crm/crmRoutes.test.ts` | read-full | `features/crm/crmRoutes.test.ts` | D-Tests | none |
| `tests/unit/features/crm/crmUi.test.ts` | read-full | `features/crm/crmUi.test.ts` | D-Tests | none |
| `tests/unit/features/crm/stores/crmDemoSeed.test.ts` | read-full | `features/crm/stores/crmDemoSeed.test.ts` | D-Tests | none |
| `tests/unit/features/crm/stores/crmStore.test.ts` | read-full | `features/crm/stores/crmStore.test.ts` | D-Tests | none |
| `tests/unit/features/ops/CustomerQueriesOpsPageView.test.tsx` | read-full | `features/ops/CustomerQueriesOpsPageView.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/analytics/index.test.ts` | read-full | `features/shared/analytics/index.test.ts` | D-Tests | none |
| `tests/unit/features/shared/analytics/types.test.ts` | read-full | `features/shared/analytics/types.test.ts` | D-Tests | none |
| `tests/unit/features/shared/api/ApiError.test.ts` | read-full | `features/shared/api/ApiError.test.ts` | D-Tests | none |
| `tests/unit/features/shared/api/apiResponse.test.ts` | read-full | `features/shared/api/apiResponse.test.ts` | D-Tests | none |
| `tests/unit/features/shared/api/readApiErrorMessage.test.ts` | read-full | `features/shared/api/readApiErrorMessage.test.ts` | D-Tests | none |
| `tests/unit/features/shared/api/routeObservability.test.ts` | read-full | `features/shared/api/routeObservability.test.ts` | D-Tests | none |
| `tests/unit/features/shared/api/schemas.test.ts` | read-full | `features/shared/api/schemas.test.ts` | D-Tests | none |
| `tests/unit/features/shared/api/withAuth.test.ts` | read-full | `features/shared/api/withAuth.test.ts` | D-Tests | none |
| `tests/unit/features/shared/auth/components/AuthControls.test.tsx` | read-full | `features/shared/auth/components/AuthControls.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/auth/components/AuthShell.test.tsx` | read-full | `features/shared/auth/components/AuthShell.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/auth/components/LoginPage.test.tsx` | read-full | `features/shared/auth/components/LoginPage.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/auth/components/ResendVerificationButton.test.tsx` | read-full | `features/shared/auth/components/ResendVerificationButton.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/auth/components/SignupPage.test.tsx` | read-full | `features/shared/auth/components/SignupPage.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/auth/components/SuspendedPage.test.tsx` | read-full | `features/shared/auth/components/SuspendedPage.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/auth/index.test.ts` | read-full | `features/shared/auth/index.test.ts` | D-Tests | none |
| `tests/unit/features/shared/auth/lib/humanizeAuthError.test.ts` | read-full | `features/shared/auth/lib/humanizeAuthError.test.ts` | D-Tests | none |
| `tests/unit/features/shared/auth/lib/session.test.ts` | read-full | `features/shared/auth/lib/session.test.ts` | D-Tests | none |
| `tests/unit/features/shared/auth/lib/useDocumentTitle.test.tsx` | read-full | `features/shared/auth/lib/useDocumentTitle.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/auth/types.test.ts` | read-full | `features/shared/auth/types.test.ts` | D-Tests | none |
| `tests/unit/features/shared/catalog/catalogAssetStorage.server.test.ts` | read-full | `features/shared/catalog/catalogAssetStorage.server.test.ts` | D-Tests | none |
| `tests/unit/features/shared/catalog/index.test.ts` | read-full | `features/shared/catalog/index.test.ts` | D-Tests | none |
| `tests/unit/features/shared/catalog/productFamilyContract.test.ts` | read-full | `features/shared/catalog/productFamilyContract.test.ts` | D-Tests | none |
| `tests/unit/features/shared/catalog/productFamilyPersistence.test.ts` | read-full | `features/shared/catalog/productFamilyPersistence.test.ts` | D-Tests | none |
| `tests/unit/features/shared/catalog/releasedCatalogProductContract.test.ts` | read-full | `features/shared/catalog/releasedCatalogProductContract.test.ts` | D-Tests | none |
| `tests/unit/features/shared/catalog/types.test.ts` | read-full | `features/shared/catalog/types.test.ts` | D-Tests | none |
| `tests/unit/features/shared/components/GuestBadge.test.tsx` | read-full | `features/shared/components/GuestBadge.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/components/RestrictedActionButton.test.tsx` | read-full | `features/shared/components/RestrictedActionButton.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/crm/index.test.ts` | read-full | `features/shared/crm/index.test.ts` | D-Tests | none |
| `tests/unit/features/shared/crm/types.test.ts` | read-full | `features/shared/crm/types.test.ts` | D-Tests | none |
| `tests/unit/features/shared/dashboard/DashboardClient.test.tsx` | read-full | `features/shared/dashboard/DashboardClient.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/dashboard/workspaceHub.test.ts` | read-full | `features/shared/dashboard/workspaceHub.test.ts` | D-Tests | none |
| `tests/unit/features/shared/entry/AccessPage.test.tsx` | read-full | `features/shared/entry/AccessPage.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/entry/ChooseProductPage.test.tsx` | read-full | `features/shared/entry/ChooseProductPage.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/entry/OpenAssistantButton.test.tsx` | read-full | `features/shared/entry/OpenAssistantButton.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/entry/ProductEntryPage.test.tsx` | read-full | `features/shared/entry/ProductEntryPage.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/index-exports.test.ts` | read-full | `features/shared/index-exports.test.ts` | D-Tests | none |
| `tests/unit/features/shared/quotes/index.test.ts` | read-full | `features/shared/quotes/index.test.ts` | D-Tests | none |
| `tests/unit/features/shared/quotes/types.test.ts` | read-full | `features/shared/quotes/types.test.ts` | D-Tests | none |
| `tests/unit/features/shared/shell/GlobalNavHeader.test.tsx` | read-full | `features/shared/shell/GlobalNavHeader.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/shell/MemberSuiteShell.test.tsx` | read-full | `features/shared/shell/MemberSuiteShell.test.tsx` | D-Tests | none |
| `tests/unit/features/shared/shell/memberSuiteRoutes.test.ts` | read-full | `features/shared/shell/memberSuiteRoutes.test.ts` | D-Tests | none |
| `tests/unit/features/site/advisor/aiAdvisor.test.ts` | read-full | `features/site/advisor/aiAdvisor.test.ts` | D-Tests | none |
| `tests/unit/features/site/assistant/AdvancedBot.test.tsx` | read-full | `features/site/assistant/AdvancedBot.test.tsx` | D-Tests | none |
| `tests/unit/features/site/assistant/DynamicBotWrapper.test.tsx` | read-full | `features/site/assistant/DynamicBotWrapper.test.tsx` | D-Tests | none |
| `tests/unit/features/site/assistant/UnifiedAssistant.test.tsx` | read-full | `features/site/assistant/UnifiedAssistant.test.tsx` | D-Tests | none |
| `tests/unit/features/site/catalog/CatalogLastUpdated.test.tsx` | read-full | `features/site/catalog/CatalogLastUpdated.test.tsx` | D-Tests | none |
| `tests/unit/features/site/catalog/CategoryCatalogMotionShell.test.tsx` | read-full | `features/site/catalog/CategoryCatalogMotionShell.test.tsx` | D-Tests | none |
| `tests/unit/features/site/catalog/CategoryListingHero.test.tsx` | read-full | `features/site/catalog/CategoryListingHero.test.tsx` | D-Tests | none |
| `tests/unit/features/site/contact/createCustomerQuery.db.smoke.test.ts` | read-full | `features/site/contact/createCustomerQuery.db.smoke.test.ts` | D-Tests | F1 |
| `tests/unit/features/site/contact/createCustomerQuery.test.ts` | read-full | `features/site/contact/createCustomerQuery.test.ts` | D-Tests | none |
| `tests/unit/features/site/contact/customerQuerySchema.test.ts` | read-full | `features/site/contact/customerQuerySchema.test.ts` | D-Tests | none |
| `tests/unit/features/site/contact/submitContactAction.test.ts` | read-full | `features/site/contact/submitContactAction.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/assistant.test.ts` | read-full | `features/site/data/assistant.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/brand.test.ts` | read-full | `features/site/data/brand.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/clientLogos.test.ts` | read-full | `features/site/data/clientLogos.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/clientWorkPhotos.test.ts` | read-full | `features/site/data/clientWorkPhotos.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/contact.constants.test.ts` | read-full | `features/site/data/contact.constants.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/contact.test.ts` | read-full | `features/site/data/contact.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/fallbacks.test.ts` | read-full | `features/site/data/fallbacks.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/heroCarousel.test.ts` | read-full | `features/site/data/heroCarousel.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/homepage.test.ts` | read-full | `features/site/data/homepage.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/htmlSitemap.fallbackLabel.test.ts` | read-full | `features/site/data/htmlSitemap.fallbackLabel.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/htmlSitemap.test.ts` | read-full | `features/site/data/htmlSitemap.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/localCatalogIndex.test.ts` | read-full | `features/site/data/localCatalogIndex.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/marketing.test.ts` | read-full | `features/site/data/marketing.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/misc.test.ts` | read-full | `features/site/data/misc.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/navigation-coverage.test.ts` | read-full | `features/site/data/navigation-coverage.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/navigation.test.ts` | read-full | `features/site/data/navigation.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/productSuite.test.ts` | read-full | `features/site/data/productSuite.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/proof.test.ts` | read-full | `features/site/data/proof.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/publicRouteMatrix.test.ts` | read-full | `features/site/data/publicRouteMatrix.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/routeChromeRules.test.ts` | read-full | `features/site/data/routeChromeRules.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/routeClassification.test.ts` | read-full | `features/site/data/routeClassification.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/routeCopy.test.ts` | read-full | `features/site/data/routeCopy.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/routeMetadata.test.ts` | read-full | `features/site/data/routeMetadata.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/seo.localePrefix.test.ts` | read-full | `features/site/data/seo.localePrefix.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/seo.test.ts` | read-full | `features/site/data/seo.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/seoStandardsAudit.test.ts` | read-full | `features/site/data/seoStandardsAudit.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/siteSeoAcceptance.test.ts` | read-full | `features/site/data/siteSeoAcceptance.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/siteSeoContract.test.ts` | read-full | `features/site/data/siteSeoContract.test.ts` | D-Tests | none |
| `tests/unit/features/site/data/support.test.ts` | read-full | `features/site/data/support.test.ts` | D-Tests | none |
| `tests/unit/features/site/planSvg/resolvePdpPlanSvgThumb.server.test.ts` | read-full | `features/site/planSvg/resolvePdpPlanSvgThumb.server.test.ts` | D-Tests | none |
| `tests/unit/features/site/planSvg/resolvePdpPlanSvgThumb.test.ts` | read-full | `features/site/planSvg/resolvePdpPlanSvgThumb.test.ts` | D-Tests | none |
| `tests/unit/features/site/tools/spaceCalculator.test.ts` | read-full | `features/site/tools/spaceCalculator.test.ts` | D-Tests | none |
| `tests/unit/i18n/config.test.ts` | read-full | `i18n/config.test.ts` | D-Tests | none |
| `tests/unit/i18n/marketing-parity-manifest.test.ts` | read-full | `i18n/marketing-parity-manifest.test.ts` | D-Tests | none |
| `tests/unit/i18n/messages.test.ts` | read-full | `i18n/messages.test.ts` | D-Tests | none |
| `tests/unit/i18n/pending-translations.test.ts` | read-full | `i18n/pending-translations.test.ts` | D-Tests | none |
| `tests/unit/i18n/request.test.ts` | read-full | `i18n/request.test.ts` | D-Tests | none |
| `tests/unit/i18n/routing.test.ts` | read-full | `i18n/routing.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/ai/sketchToPlanShared.test.ts` | read-full | `lib/Planner/ai/sketchToPlanShared.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/ai/spaceSuggest.test.ts` | read-full | `lib/Planner/ai/spaceSuggest.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/boq/buildBoqFromGeometry.test.ts` | read-full | `lib/Planner/boq/buildBoqFromGeometry.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/buildValidationFloor.test.ts` | read-full | `lib/Planner/buildValidationFloor.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/commands/registry.test.ts` | read-full | `lib/Planner/commands/registry.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/fabricGeometryBridge.test.ts` | read-full | `lib/Planner/fabricGeometryBridge.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/geometry/alignDistribute.test.ts` | read-full | `lib/Planner/geometry/alignDistribute.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/geometry/distanceGuides.test.ts` | read-full | `lib/Planner/geometry/distanceGuides.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/geometry/openingPlacement.test.ts` | read-full | `lib/Planner/geometry/openingPlacement.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/geometry/wallGraph.test.ts` | read-full | `lib/Planner/geometry/wallGraph.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/handoff/createPlannerHandoff.db.smoke.test.ts` | read-full | `lib/Planner/handoff/createPlannerHandoff.db.smoke.test.ts` | D-Tests | F1 |
| `tests/unit/lib/Planner/handoff/handoffRecovery.test.ts` | read-full | `lib/Planner/handoff/handoffRecovery.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/handoff/handoffSchema.test.ts` | read-full | `lib/Planner/handoff/handoffSchema.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerApi.test.ts` | read-full | `lib/Planner/plannerApi.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerEndpointContract.property.test.ts` | read-full | `lib/Planner/plannerEndpointContract.property.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerEndpointContract.task4_1.test.ts` | read-full | `lib/Planner/plannerEndpointContract.task4_1.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerFabricSerialize.test.ts` | read-full | `lib/Planner/plannerFabricSerialize.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerLocalBackup.test.ts` | read-full | `lib/Planner/plannerLocalBackup.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerMutationPreconditions.property.test.ts` | read-full | `lib/Planner/plannerMutationPreconditions.property.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerOwnerScope.property.test.ts` | read-full | `lib/Planner/plannerOwnerScope.property.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerOwnerScope.task4_3.test.ts` | read-full | `lib/Planner/plannerOwnerScope.task4_3.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerPersistenceMode.test.ts` | read-full | `lib/Planner/plannerPersistenceMode.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerRequestPipeline.property.test.ts` | read-full | `lib/Planner/plannerRequestPipeline.property.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerSafeErrors.property.test.ts` | read-full | `lib/Planner/plannerSafeErrors.property.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerSafeErrors.test.ts` | read-full | `lib/Planner/plannerSafeErrors.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerSnapManager.test.ts` | read-full | `lib/Planner/plannerSnapManager.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/plannerUploadContentLength.test.ts` | read-full | `lib/Planner/plannerUploadContentLength.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/projectSetup/projectSetupSchema.test.ts` | read-full | `lib/Planner/projectSetup/projectSetupSchema.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/projectsStore.ownership.test.ts` | read-full | `lib/Planner/projectsStore.ownership.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/projectsStore.supabase.db.smoke.test.ts` | read-full | `lib/Planner/projectsStore.supabase.db.smoke.test.ts` | D-Tests | F1 |
| `tests/unit/lib/Planner/projectsStore.supabase.ownership.unit.test.ts` | read-full | `lib/Planner/projectsStore.supabase.ownership.unit.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/starterProjectTemplate.test.ts` | read-full | `lib/Planner/starterProjectTemplate.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/underlayCalibrate.test.ts` | read-full | `lib/Planner/underlayCalibrate.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/validation/runValidation.test.ts` | read-full | `lib/Planner/validation/runValidation.test.ts` | D-Tests | none |
| `tests/unit/lib/Planner/wallEndpointGrips.test.ts` | read-full | `lib/Planner/wallEndpointGrips.test.ts` | D-Tests | none |
| `tests/unit/lib/Studio/templates/furnitureTemplates.test.ts` | read-full | `lib/Studio/templates/furnitureTemplates.test.ts` | D-Tests | none |
| `tests/unit/lib/Studio/validateFurnitureMetadata.test.ts` | read-full | `lib/Studio/validateFurnitureMetadata.test.ts` | D-Tests | none |
| `tests/unit/lib/admin/techDocsUrl.test.ts` | read-full | `lib/admin/techDocsUrl.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/AiAdvisorPanel.test.tsx` | read-full | `lib/ai/AiAdvisorPanel.test.tsx` | D-Tests | none |
| `tests/unit/lib/ai/audit/finding.property.test.ts` | read-full | `lib/ai/audit/finding.property.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/audit/findings.test.ts` | read-full | `lib/ai/audit/findings.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/audit/preservedModules.test.ts` | read-full | `lib/ai/audit/preservedModules.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/mastra/catalogRag.test.ts` | read-full | `lib/ai/mastra/catalogRag.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/mastra/catalogRetrieval.test.ts` | read-full | `lib/ai/mastra/catalogRetrieval.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/mastra/embedder.test.ts` | read-full | `lib/ai/mastra/embedder.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/mastra/plannerAdvisorClient.test.ts` | read-full | `lib/ai/mastra/plannerAdvisorClient.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/mastra/providerChain.property.test.ts` | read-full | `lib/ai/mastra/providerChain.property.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/mastra/providerFailover.property.test.ts` | read-full | `lib/ai/mastra/providerFailover.property.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/mastra/providers.test.ts` | read-full | `lib/ai/mastra/providers.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/mastra/retrievalOrdering.property.test.ts` | read-full | `lib/ai/mastra/retrievalOrdering.property.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/mastra/vectorizeCatalogStore.test.ts` | read-full | `lib/ai/mastra/vectorizeCatalogStore.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/sanitizeUserInput.test.ts` | read-full | `lib/ai/sanitizeUserInput.test.ts` | D-Tests | none |
| `tests/unit/lib/ai/useAiAdvisor.test.ts` | read-full | `lib/ai/useAiAdvisor.test.ts` | D-Tests | none |
| `tests/unit/lib/analytics/conversionContract.test.ts` | read-full | `lib/analytics/conversionContract.test.ts` | D-Tests | none |
| `tests/unit/lib/analytics/emitTransport.test.ts` | read-full | `lib/analytics/emitTransport.test.ts` | D-Tests | none |
| `tests/unit/lib/analytics/eventQueue.test.ts` | read-full | `lib/analytics/eventQueue.test.ts` | D-Tests | none |
| `tests/unit/lib/analytics/kpiEvents.test.ts` | read-full | `lib/analytics/kpiEvents.test.ts` | D-Tests | none |
| `tests/unit/lib/analytics/kpiIntegrity.test.ts` | read-full | `lib/analytics/kpiIntegrity.test.ts` | D-Tests | none |
| `tests/unit/lib/analytics/plannerEntry.test.ts` | read-full | `lib/analytics/plannerEntry.test.ts` | D-Tests | none |
| `tests/unit/lib/analytics/siteAttribution.test.ts` | read-full | `lib/analytics/siteAttribution.test.ts` | D-Tests | none |
| `tests/unit/lib/analytics/siteEvents.test.ts` | read-full | `lib/analytics/siteEvents.test.ts` | D-Tests | none |
| `tests/unit/lib/api/ApiError.test.ts` | read-full | `lib/api/ApiError.test.ts` | D-Tests | none |
| `tests/unit/lib/api/apiResponse.test.ts` | read-full | `lib/api/apiResponse.test.ts` | D-Tests | none |
| `tests/unit/lib/api/browserApi.test.ts` | read-full | `lib/api/browserApi.test.ts` | D-Tests | none |
| `tests/unit/lib/api/catalogAdminHandlers.test.ts` | read-full | `lib/api/catalogAdminHandlers.test.ts` | D-Tests | none |
| `tests/unit/lib/api/routeObservability.test.ts` | read-full | `lib/api/routeObservability.test.ts` | D-Tests | none |
| `tests/unit/lib/api/schemas.test.ts` | read-full | `lib/api/schemas.test.ts` | D-Tests | none |
| `tests/unit/lib/api/withAuth.test.ts` | read-full | `lib/api/withAuth.test.ts` | D-Tests | none |
| `tests/unit/lib/apiCatalog.test.ts` | read-full | `lib/apiCatalog.test.ts` | D-Tests | none |
| `tests/unit/lib/assetPaths.test.ts` | read-full | `lib/assetPaths.test.ts` | D-Tests | none |
| `tests/unit/lib/audit/auditRepository.test.ts` | read-full | `lib/audit/auditRepository.test.ts` | D-Tests | none |
| `tests/unit/lib/audit/teamAccess.test.ts` | read-full | `lib/audit/teamAccess.test.ts` | D-Tests | none |
| `tests/unit/lib/auth/constants.test.ts` | read-full | `lib/auth/constants.test.ts` | D-Tests | none |
| `tests/unit/lib/auth/customerSafeAuthError.test.ts` | read-full | `lib/auth/customerSafeAuthError.test.ts` | D-Tests | none |
| `tests/unit/lib/auth/devAuthBypass.test.ts` | read-full | `lib/auth/devAuthBypass.test.ts` | D-Tests | none |
| `tests/unit/lib/auth/e2eAuthEnv.test.ts` | read-full | `lib/auth/e2eAuthEnv.test.ts` | D-Tests | none |
| `tests/unit/lib/auth/plannerRedirect.test.ts` | read-full | `lib/auth/plannerRedirect.test.ts` | D-Tests | none |
| `tests/unit/lib/auth/plannerSession.test.ts` | read-full | `lib/auth/plannerSession.test.ts` | D-Tests | none |
| `tests/unit/lib/auth/roles.test.ts` | read-full | `lib/auth/roles.test.ts` | D-Tests | none |
| `tests/unit/lib/auth/session.test.ts` | read-full | `lib/auth/session.test.ts` | D-Tests | none |
| `tests/unit/lib/auth/supabaseServerActions.test.ts` | read-full | `lib/auth/supabaseServerActions.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/adapters.test.ts` | read-full | `lib/catalog/adapters.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/blockDescriptorStore.supabase.unit.test.ts` | read-full | `lib/catalog/blockDescriptorStore.supabase.unit.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/blocks2d.test.ts` | read-full | `lib/catalog/blocks2d.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/catalogDrizzle.production-build.test.ts` | read-full | `lib/catalog/catalogDrizzle.production-build.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/catalogDrizzle.test.ts` | read-full | `lib/catalog/catalogDrizzle.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/catalogFallbackResolver.test.ts` | read-full | `lib/catalog/catalogFallbackResolver.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/catalogSnapshot.test.ts` | read-full | `lib/catalog/catalogSnapshot.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/catalogSnapshotConstants.test.ts` | read-full | `lib/catalog/catalogSnapshotConstants.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/catalogSnapshotR2.test.ts` | read-full | `lib/catalog/catalogSnapshotR2.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/catalogTree.test.ts` | read-full | `lib/catalog/catalogTree.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/catalogWriteIsolation.test.ts` | read-full | `lib/catalog/catalogWriteIsolation.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/configuratorCatalog.server.test.ts` | read-full | `lib/catalog/configuratorCatalog.server.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/configuratorCatalog.test.ts` | read-full | `lib/catalog/configuratorCatalog.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/configuratorCatalogPayload.test.ts` | read-full | `lib/catalog/configuratorCatalogPayload.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/fallback-branches.test.ts` | read-full | `lib/catalog/fallback-branches.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/fallback.test.ts` | read-full | `lib/catalog/fallback.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/furnitureCatalogMode.test.ts` | read-full | `lib/catalog/furnitureCatalogMode.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/furnitureCatalogStore.supabase.db.smoke.test.ts` | read-full | `lib/catalog/furnitureCatalogStore.supabase.db.smoke.test.ts` | D-Tests | F1 |
| `tests/unit/lib/catalog/furnitureCatalogStore.supabase.unit.test.ts` | read-full | `lib/catalog/furnitureCatalogStore.supabase.unit.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/furnitureCatalogStore.supabase.upload.unit.test.ts` | read-full | `lib/catalog/furnitureCatalogStore.supabase.upload.unit.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/geometry.test.ts` | read-full | `lib/catalog/geometry.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/glbAssetPolicy.test.ts` | read-full | `lib/catalog/glbAssetPolicy.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/lifecycle/catalogLifecycle.shared.test.ts` | read-full | `lib/catalog/lifecycle/catalogLifecycle.shared.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/lifecycle/catalogLifecycle.test.ts` | read-full | `lib/catalog/lifecycle/catalogLifecycle.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/managedCatalogSeed.test.ts` | read-full | `lib/catalog/managedCatalogSeed.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/persistBlockDescriptor.test.ts` | read-full | `lib/catalog/persistBlockDescriptor.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/planSvg.test.ts` | read-full | `lib/catalog/planSvg.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/productStaticParams.test.ts` | read-full | `lib/catalog/productStaticParams.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/productUrlKey.test.ts` | read-full | `lib/catalog/productUrlKey.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/publish/checksumPngBuffer.test.ts` | read-full | `lib/catalog/publish/checksumPngBuffer.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/publish/planSymbolPngQualityGate.test.ts` | read-full | `lib/catalog/publish/planSymbolPngQualityGate.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/publish/svgArtifactStatus.server.test.ts` | read-full | `lib/catalog/publish/svgArtifactStatus.server.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/publish/svgReleaseAuthority.test.ts` | read-full | `lib/catalog/publish/svgReleaseAuthority.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/renderBlock2DToCanvas.test.ts` | read-full | `lib/catalog/renderBlock2DToCanvas.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/resolveBlockColors.test.ts` | read-full | `lib/catalog/resolveBlockColors.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/seed/oandoCatalog.test.ts` | read-full | `lib/catalog/seed/oandoCatalog.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/catalogProductDedupe.test.ts` | read-full | `lib/catalog/site/catalogProductDedupe.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/catalogProductFilters.test.ts` | read-full | `lib/catalog/site/catalogProductFilters.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/categories.test.ts` | read-full | `lib/catalog/site/categories.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/ecoScore.test.ts` | read-full | `lib/catalog/site/ecoScore.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/filterSearchParams.parsers.test.ts` | read-full | `lib/catalog/site/filterSearchParams.parsers.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/filterSearchParams.test.ts` | read-full | `lib/catalog/site/filterSearchParams.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/filterSearchParams.toActive.test.ts` | read-full | `lib/catalog/site/filterSearchParams.toActive.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/filters.test.ts` | read-full | `lib/catalog/site/filters.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/getProducts.test.ts` | read-full | `lib/catalog/site/getProducts.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/imageMetadata.test.ts` | read-full | `lib/catalog/site/imageMetadata.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/marketingImages.test.ts` | read-full | `lib/catalog/site/marketingImages.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/slugResolver.test.ts` | read-full | `lib/catalog/site/slugResolver.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/specSchema.test.ts` | read-full | `lib/catalog/site/specSchema.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/site/traits.test.ts` | read-full | `lib/catalog/site/traits.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/sources.test.ts` | read-full | `lib/catalog/sources.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/surface2d5.test.ts` | read-full | `lib/catalog/surface2d5.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/svg/descriptorPointer.io.test.ts` | read-full | `lib/catalog/svg/descriptorPointer.io.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/svg/descriptorPointer.names.test.ts` | read-full | `lib/catalog/svg/descriptorPointer.names.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/svg/svgBlockDescriptorLoader.test.ts` | read-full | `lib/catalog/svg/svgBlockDescriptorLoader.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/svg/svgBlockDescriptorLoader.tryLoad.test.ts` | read-full | `lib/catalog/svg/svgBlockDescriptorLoader.tryLoad.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/svg/svgTypes.checksum.test.ts` | read-full | `lib/catalog/svg/svgTypes.checksum.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/svg/svgTypes.parse.test.ts` | read-full | `lib/catalog/svg/svgTypes.parse.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/types.test.ts` | read-full | `lib/catalog/types.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/workspaceCatalogHierarchy.test.ts` | read-full | `lib/catalog/workspaceCatalogHierarchy.test.ts` | D-Tests | none |
| `tests/unit/lib/catalog/workstationV0Pricing.test.ts` | read-full | `lib/catalog/workstationV0Pricing.test.ts` | D-Tests | none |
| `tests/unit/lib/clientIp.test.ts` | read-full | `lib/clientIp.test.ts` | D-Tests | none |
| `tests/unit/lib/clients/clientRegistry.test.ts` | read-full | `lib/clients/clientRegistry.test.ts` | D-Tests | none |
| `tests/unit/lib/clients/clientsShowcaseI18n.test.ts` | read-full | `lib/clients/clientsShowcaseI18n.test.ts` | D-Tests | none |
| `tests/unit/lib/configurator/barrel.test.ts` | read-full | `lib/configurator/barrel.test.ts` | D-Tests | none |
| `tests/unit/lib/configurator/catalog.test.ts` | read-full | `lib/configurator/catalog.test.ts` | D-Tests | none |
| `tests/unit/lib/configurator/constants.test.ts` | read-full | `lib/configurator/constants.test.ts` | D-Tests | none |
| `tests/unit/lib/configurator/smartWizard.impl.test.ts` | read-full | `lib/configurator/smartWizard.impl.test.ts` | D-Tests | none |
| `tests/unit/lib/configurator/smartWizard.test.ts` | read-full | `lib/configurator/smartWizard.test.ts` | D-Tests | none |
| `tests/unit/lib/configurator/smartWizardCatalog.test.ts` | read-full | `lib/configurator/smartWizardCatalog.test.ts` | D-Tests | none |
| `tests/unit/lib/configurator/smartWizardConstants.test.ts` | read-full | `lib/configurator/smartWizardConstants.test.ts` | D-Tests | none |
| `tests/unit/lib/consent.test.ts` | read-full | `lib/consent.test.ts` | D-Tests | none |
| `tests/unit/lib/displayText.test.ts` | read-full | `lib/displayText.test.ts` | D-Tests | none |
| `tests/unit/lib/email/sendStaffQueryNotification.test.ts` | read-full | `lib/email/sendStaffQueryNotification.test.ts` | D-Tests | none |
| `tests/unit/lib/env.server.test.ts` | read-full | `lib/env.server.test.ts` | D-Tests | none |
| `tests/unit/lib/errorLogger.test.ts` | read-full | `lib/errorLogger.test.ts` | D-Tests | none |
| `tests/unit/lib/featureFlags.test.ts` | read-full | `lib/featureFlags.test.ts` | D-Tests | none |
| `tests/unit/lib/fonts.test.ts` | read-full | `lib/fonts.test.ts` | D-Tests | none |
| `tests/unit/lib/helpers/images.test.ts` | read-full | `lib/helpers/images.test.ts` | D-Tests | none |
| `tests/unit/lib/helpers/motion.test.ts` | read-full | `lib/helpers/motion.test.ts` | D-Tests | none |
| `tests/unit/lib/hooks/useInViewOnce.test.tsx` | read-full | `lib/hooks/useInViewOnce.test.tsx` | D-Tests | none |
| `tests/unit/lib/hooks/useOnlineStatus.test.tsx` | read-full | `lib/hooks/useOnlineStatus.test.tsx` | D-Tests | none |
| `tests/unit/lib/hooks/useSectorTabs.test.ts` | read-full | `lib/hooks/useSectorTabs.test.ts` | D-Tests | none |
| `tests/unit/lib/i18n/config.test.ts` | read-full | `lib/i18n/config.test.ts` | D-Tests | none |
| `tests/unit/lib/i18n/htmlLang.test.ts` | read-full | `lib/i18n/htmlLang.test.ts` | D-Tests | none |
| `tests/unit/lib/i18n/navigation.test.ts` | read-full | `lib/i18n/navigation.test.ts` | D-Tests | none |
| `tests/unit/lib/i18n/parity.test.ts` | read-full | `lib/i18n/parity.test.ts` | D-Tests | none |
| `tests/unit/lib/i18n/request-runtime.test.ts` | read-full | `lib/i18n/request-runtime.test.ts` | D-Tests | none |
| `tests/unit/lib/i18n/withLocaleCopy.test.ts` | read-full | `lib/i18n/withLocaleCopy.test.ts` | D-Tests | none |
| `tests/unit/lib/images/optimizerMode.test.ts` | read-full | `lib/images/optimizerMode.test.ts` | D-Tests | none |
| `tests/unit/lib/kpiFormat.test.ts` | read-full | `lib/kpiFormat.test.ts` | D-Tests | none |
| `tests/unit/lib/layout/siteLayoutContext.test.ts` | read-full | `lib/layout/siteLayoutContext.test.ts` | D-Tests | none |
| `tests/unit/lib/navigation.test.ts` | read-full | `lib/navigation.test.ts` | D-Tests | none |
| `tests/unit/lib/observability/aiMetrics.test.ts` | read-full | `lib/observability/aiMetrics.test.ts` | D-Tests | none |
| `tests/unit/lib/observability/aiObservability.property.test.ts` | read-full | `lib/observability/aiObservability.property.test.ts` | D-Tests | none |
| `tests/unit/lib/observability/reportClientError.test.ts` | read-full | `lib/observability/reportClientError.test.ts` | D-Tests | none |
| `tests/unit/lib/paths/adminCatalogOps.test.ts` | read-full | `lib/paths/adminCatalogOps.test.ts` | D-Tests | none |
| `tests/unit/lib/paths/blockDescriptorsDir.test.ts` | read-full | `lib/paths/blockDescriptorsDir.test.ts` | D-Tests | none |
| `tests/unit/lib/paths/sitePackageRoot.server.test.ts` | read-full | `lib/paths/sitePackageRoot.server.test.ts` | D-Tests | none |
| `tests/unit/lib/paths/sitePackageRoot.test.ts` | read-full | `lib/paths/sitePackageRoot.test.ts` | D-Tests | none |
| `tests/unit/lib/persistence/assertDevDiskWritable.test.ts` | read-full | `lib/persistence/assertDevDiskWritable.test.ts` | D-Tests | none |
| `tests/unit/lib/platform/maintenanceMode.test.ts` | read-full | `lib/platform/maintenanceMode.test.ts` | D-Tests | none |
| `tests/unit/lib/productDataTables.test.ts` | read-full | `lib/productDataTables.test.ts` | D-Tests | none |
| `tests/unit/lib/productSlugResolver.test.ts` | read-full | `lib/productSlugResolver.test.ts` | D-Tests | none |
| `tests/unit/lib/rateLimit.test.ts` | read-full | `lib/rateLimit.test.ts` | D-Tests | none |
| `tests/unit/lib/security/csrf.test.ts` | read-full | `lib/security/csrf.test.ts` | D-Tests | none |
| `tests/unit/lib/security/csrfConstants.test.ts` | read-full | `lib/security/csrfConstants.test.ts` | D-Tests | none |
| `tests/unit/lib/security/requestOrigin.test.ts` | read-full | `lib/security/requestOrigin.test.ts` | D-Tests | none |
| `tests/unit/lib/security/sanitize.test.ts` | read-full | `lib/security/sanitize.test.ts` | D-Tests | none |
| `tests/unit/lib/security/staticAdminToken.test.ts` | read-full | `lib/security/staticAdminToken.test.ts` | D-Tests | none |
| `tests/unit/lib/security/uploadLimits.test.ts` | read-full | `lib/security/uploadLimits.test.ts` | D-Tests | none |
| `tests/unit/lib/seo/indexnow.test.ts` | read-full | `lib/seo/indexnow.test.ts` | D-Tests | none |
| `tests/unit/lib/siteUrl.test.ts` | read-full | `lib/siteUrl.test.ts` | D-Tests | none |
| `tests/unit/lib/siteViewport.test.ts` | read-full | `lib/siteViewport.test.ts` | D-Tests | none |
| `tests/unit/lib/storage/r2Catalog.test.ts` | read-full | `lib/storage/r2Catalog.test.ts` | D-Tests | none |
| `tests/unit/lib/store/productCompare.test.ts` | read-full | `lib/store/productCompare.test.ts` | D-Tests | none |
| `tests/unit/lib/store/quoteCart.test.ts` | read-full | `lib/store/quoteCart.test.ts` | D-Tests | none |
| `tests/unit/lib/theme/ThemeProvider.test.tsx` | read-full | `lib/theme/ThemeProvider.test.tsx` | D-Tests | none |
| `tests/unit/lib/theme/activeThemeId.test.ts` | read-full | `lib/theme/activeThemeId.test.ts` | D-Tests | none |
| `tests/unit/lib/theme/catalogTokenKeys.test.ts` | read-full | `lib/theme/catalogTokenKeys.test.ts` | D-Tests | none |
| `tests/unit/lib/theme/plannerThemePacks.test.ts` | read-full | `lib/theme/plannerThemePacks.test.ts` | D-Tests | none |
| `tests/unit/lib/theme/presets.test.ts` | read-full | `lib/theme/presets.test.ts` | D-Tests | none |
| `tests/unit/lib/theme/schema.test.ts` | read-full | `lib/theme/schema.test.ts` | D-Tests | none |
| `tests/unit/lib/theme/useThemeAdmin.test.tsx` | read-full | `lib/theme/useThemeAdmin.test.tsx` | D-Tests | none |
| `tests/unit/lib/theme/verifyThemeRuntime.test.ts` | read-full | `lib/theme/verifyThemeRuntime.test.ts` | D-Tests | none |
| `tests/unit/lib/tracking/anonymousUserId.test.ts` | read-full | `lib/tracking/anonymousUserId.test.ts` | D-Tests | none |
| `tests/unit/lib/tracking/trackingCookie.test.ts` | read-full | `lib/tracking/trackingCookie.test.ts` | D-Tests | none |
| `tests/unit/lib/tracking/userHistoryRepository.test.ts` | read-full | `lib/tracking/userHistoryRepository.test.ts` | D-Tests | none |
| `tests/unit/lib/types/businessStats.test.ts` | read-full | `lib/types/businessStats.test.ts` | D-Tests | none |
| `tests/unit/lib/ui/KeyboardShortcuts.test.tsx` | read-full | `lib/ui/KeyboardShortcuts.test.tsx` | D-Tests | none |
| `tests/unit/lib/ui/Slot.test.tsx` | read-full | `lib/ui/Slot.test.tsx` | D-Tests | none |
| `tests/unit/lib/ui/SmartLayoutEngine.test.tsx` | read-full | `lib/ui/SmartLayoutEngine.test.tsx` | D-Tests | none |
| `tests/unit/lib/ui/Tooltip.test.tsx` | read-full | `lib/ui/Tooltip.test.tsx` | D-Tests | none |
| `tests/unit/lib/ui/UndoToast.test.tsx` | read-full | `lib/ui/UndoToast.test.tsx` | D-Tests | none |
| `tests/unit/lib/unwrapActionResult.test.ts` | read-full | `lib/unwrapActionResult.test.ts` | D-Tests | none |
| `tests/unit/lib/utils.test.ts` | read-full | `lib/utils.test.ts` | D-Tests | none |
| `tests/unit/lib/uuid/normalizeUuid.test.ts` | read-full | `lib/uuid/normalizeUuid.test.ts` | D-Tests | none |
| `tests/unit/lib/z-index.test.ts` | read-full | `lib/z-index.test.ts` | D-Tests | none |
| `tests/unit/planner/canvasCommandParity.test.ts` | read-full | `planner/canvasCommandParity.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerAccessibleControlCompleteness.property.test.ts` | read-full | `planner/plannerAccessibleControlCompleteness.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerAccessibleOverflowDisclosure.property.test.ts` | read-full | `planner/plannerAccessibleOverflowDisclosure.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerAuditModel.test.ts` | read-full | `planner/plannerAuditModel.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerBrowserAuditMatrix.test.ts` | read-full | `planner/plannerBrowserAuditMatrix.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerCanvasLayers.test.ts` | read-full | `planner/plannerCanvasLayers.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerCoverageClosure.property.test.ts` | read-full | `planner/plannerCoverageClosure.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerCoverageCollector.test.ts` | read-full | `planner/plannerCoverageCollector.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerDeleteUnavailability.property.test.ts` | read-full | `planner/plannerDeleteUnavailability.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerExclusivePersistence.property.test.ts` | read-full | `planner/plannerExclusivePersistence.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerExportMenu.test.tsx` | read-full | `planner/plannerExportMenu.test.tsx` | D-Tests | none |
| `tests/unit/planner/plannerFailureSafeUiState.property.test.ts` | read-full | `planner/plannerFailureSafeUiState.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerFinalReconciliation.test.ts` | read-full | `planner/plannerFinalReconciliation.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerFindingRegistry.test.ts` | read-full | `planner/plannerFindingRegistry.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerFindingTraceability.property.test.ts` | read-full | `planner/plannerFindingTraceability.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerFindingTransitions.property.test.ts` | read-full | `planner/plannerFindingTransitions.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerFocusAndTouch.test.tsx` | read-full | `planner/plannerFocusAndTouch.test.tsx` | D-Tests | none |
| `tests/unit/planner/plannerFormValuePreservation.property.test.ts` | read-full | `planner/plannerFormValuePreservation.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerGeometry.test.ts` | read-full | `planner/plannerGeometry.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerGeometryPersistence.property.test.ts` | read-full | `planner/plannerGeometryPersistence.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerGuestBoundaryIntegrity.property.test.ts` | read-full | `planner/plannerGuestBoundaryIntegrity.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerIdempotentMutation.property.test.ts` | read-full | `planner/plannerIdempotentMutation.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerInputCommandParity.property.test.ts` | read-full | `planner/plannerInputCommandParity.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerObservability.property.test.ts` | read-full | `planner/plannerObservability.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerPerformanceFindingCompleteness.property.test.ts` | read-full | `planner/plannerPerformanceFindingCompleteness.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerPerformanceMeasurement.test.ts` | read-full | `planner/plannerPerformanceMeasurement.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerPersistenceCompatibility.test.ts` | read-full | `planner/plannerPersistenceCompatibility.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerRepositoryFacade.property.test.ts` | read-full | `planner/plannerRepositoryFacade.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerRequiredStateCompleteness.property.test.ts` | read-full | `planner/plannerRequiredStateCompleteness.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerResponsiveContext.property.test.ts` | read-full | `planner/plannerResponsiveContext.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerResponsiveLayout.test.ts` | read-full | `planner/plannerResponsiveLayout.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerRevisionCas.property.test.ts` | read-full | `planner/plannerRevisionCas.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerScale.property.test.ts` | read-full | `planner/plannerScale.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerSchemaCompatibility.property.test.ts` | read-full | `planner/plannerSchemaCompatibility.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerSerializationRoundTrip.test.ts` | read-full | `planner/plannerSerializationRoundTrip.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerSnapStatusLabel.test.ts` | read-full | `planner/plannerSnapStatusLabel.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerStore.test.ts` | read-full | `planner/plannerStore.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerTokens.test.ts` | read-full | `planner/plannerTokens.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerTouchActionCss.test.ts` | read-full | `planner/plannerTouchActionCss.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerValidProjectInitialization.property.test.ts` | read-full | `planner/plannerValidProjectInitialization.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerValidationEvidence.property.test.ts` | read-full | `planner/plannerValidationEvidence.property.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerValidationManifest.test.ts` | read-full | `planner/plannerValidationManifest.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerWorkflowState.test.ts` | read-full | `planner/plannerWorkflowState.test.ts` | D-Tests | none |
| `tests/unit/planner/plannerWorkflowTrace.test.ts` | read-full | `planner/plannerWorkflowTrace.test.ts` | D-Tests | none |
| `tests/unit/platform/Planner/plannerAdminMigration.test.ts` | read-full | `platform/Planner/plannerAdminMigration.test.ts` | D-Tests | none |
| `tests/unit/platform/Planner/plannerSupabaseMutation.db.smoke.test.ts` | read-full | `platform/Planner/plannerSupabaseMutation.db.smoke.test.ts` | D-Tests | F1 |
| `tests/unit/platform/drizzle/adminDb.test.ts` | read-full | `platform/drizzle/adminDb.test.ts` | D-Tests | none |
| `tests/unit/platform/drizzle/createPostgresDrizzle.test.ts` | read-full | `platform/drizzle/createPostgresDrizzle.test.ts` | D-Tests | none |
| `tests/unit/platform/drizzle/databaseUrls.test.ts` | read-full | `platform/drizzle/databaseUrls.test.ts` | D-Tests | none |
| `tests/unit/platform/drizzle/drizzle.config.test.ts` | read-full | `platform/drizzle/drizzle.config.test.ts` | D-Tests | none |
| `tests/unit/platform/drizzle/productsDb.test.ts` | read-full | `platform/drizzle/productsDb.test.ts` | D-Tests | none |
| `tests/unit/platform/drizzle/schema/catalog.test.ts` | read-full | `platform/drizzle/schema/catalog.test.ts` | D-Tests | none |
| `tests/unit/platform/drizzle/schema/index.test.ts` | read-full | `platform/drizzle/schema/index.test.ts` | D-Tests | none |
| `tests/unit/platform/drizzle/schema/planner.test.ts` | read-full | `platform/drizzle/schema/planner.test.ts` | D-Tests | none |
| `tests/unit/platform/planner-canvas.test.ts` | read-full | `platform/planner-canvas.test.ts` | D-Tests | none |
| `tests/unit/platform/plannerHandoffsRlsPolicy.test.ts` | read-full | `platform/plannerHandoffsRlsPolicy.test.ts` | D-Tests | F1 |
| `tests/unit/platform/route-contract.test.ts` | read-full | `platform/route-contract.test.ts` | D-Tests | none |
| `tests/unit/platform/serviceRoleOnlyTables.db.test.ts` | read-full | `platform/serviceRoleOnlyTables.db.test.ts` | D-Tests | F1 |
| `tests/unit/platform/supabase/adminServer.test.ts` | read-full | `platform/supabase/adminServer.test.ts` | D-Tests | none |
| `tests/unit/platform/supabase/auth-admin.test.ts` | read-full | `platform/supabase/auth-admin.test.ts` | D-Tests | none |
| `tests/unit/platform/supabase/clients.test.ts` | read-full | `platform/supabase/clients.test.ts` | D-Tests | none |
| `tests/unit/platform/supabase/env.test.ts` | read-full | `platform/supabase/env.test.ts` | D-Tests | none |
| `tests/unit/platform/supabase/supabaseAdmin.test.ts` | read-full | `platform/supabase/supabaseAdmin.test.ts` | D-Tests | none |
| `tests/unit/platform/supabase/types.test.ts` | read-full | `platform/supabase/types.test.ts` | D-Tests | none |
| `tests/unit/platform/supabaseMigrations.test.ts` | read-full | `platform/supabaseMigrations.test.ts` | D-Tests | none |
| `tests/unit/platform/types/database.admin.types.test.ts` | read-full | `platform/types/database.admin.types.test.ts` | D-Tests | none |
| `tests/unit/platform/types/database.types.test.ts` | read-full | `platform/types/database.types.test.ts` | D-Tests | none |
| `tests/unit/proxy.live-smoke.test.ts` | read-full | `proxy.live-smoke.test.ts` | D-Tests | none |
| `tests/unit/proxy.test.ts` | read-full | `proxy.test.ts` | D-Tests | none |
| `tests/unit/scripts/asset-cutover-r2.smoke.test.ts` | read-full | `scripts/asset-cutover-r2.smoke.test.ts` | D-Tests | F1 |
| `tests/unit/scripts/audit-api-route-safety.test.ts` | read-full | `scripts/audit-api-route-safety.test.ts` | D-Tests | none |
| `tests/unit/scripts/audit-eslint-disable.test.ts` | read-full | `scripts/audit-eslint-disable.test.ts` | D-Tests | none |
| `tests/unit/scripts/audit-gate-skips.test.ts` | read-full | `scripts/audit-gate-skips.test.ts` | D-Tests | none |
| `tests/unit/scripts/audit-hollow-tests.test.ts` | read-full | `scripts/audit-hollow-tests.test.ts` | D-Tests | none |
| `tests/unit/scripts/audit-sitemap-health.test.ts` | read-full | `scripts/audit-sitemap-health.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-admin-api-auth.test.ts` | read-full | `scripts/check-admin-api-auth.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-composer-styles.test.ts` | read-full | `scripts/check-composer-styles.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-homepage-dialect.test.ts` | read-full | `scripts/check-homepage-dialect.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-i18n-key-parity.test.ts` | read-full | `scripts/check-i18n-key-parity.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-marketing-copy-source.test.ts` | read-full | `scripts/check-marketing-copy-source.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-marketing-inline-style.test.ts` | read-full | `scripts/check-marketing-inline-style.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-plans-purity.test.ts` | read-full | `scripts/check-plans-purity.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-product-icons.test.ts` | read-full | `scripts/check-product-icons.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-root-markdown-links.test.ts` | read-full | `scripts/check-root-markdown-links.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-site-page-shell.test.ts` | read-full | `scripts/check-site-page-shell.test.ts` | D-Tests | none |
| `tests/unit/scripts/check-test-layout.test.ts` | read-full | `scripts/check-test-layout.test.ts` | D-Tests | none |
| `tests/unit/scripts/clean-test-artifacts.test.ts` | read-full | `scripts/clean-test-artifacts.test.ts` | D-Tests | none |
| `tests/unit/scripts/coverage-metrics.test.ts` | read-full | `scripts/coverage-metrics.test.ts` | D-Tests | none |
| `tests/unit/scripts/coverage-policy.test.ts` | read-full | `scripts/coverage-policy.test.ts` | D-Tests | none |
| `tests/unit/scripts/db_test_connection.test.ts` | read-full | `scripts/db_test_connection.test.ts` | D-Tests | none |
| `tests/unit/scripts/export-pending-translations.test.ts` | read-full | `scripts/export-pending-translations.test.ts` | D-Tests | none |
| `tests/unit/scripts/general/generate-test-inventory.test.ts` | read-full | `scripts/general/generate-test-inventory.test.ts` | D-Tests | none |
| `tests/unit/scripts/generate-coverage-report.test.ts` | read-full | `scripts/generate-coverage-report.test.ts` | D-Tests | none |
| `tests/unit/scripts/generate-svg/sanitize.test.ts` | read-full | `scripts/generate-svg/sanitize.test.ts` | D-Tests | none |
| `tests/unit/scripts/generate-vitest-report.test.ts` | read-full | `scripts/generate-vitest-report.test.ts` | D-Tests | none |
| `tests/unit/scripts/lib/repoRoot.mjs.test.ts` | read-full | `scripts/lib/repoRoot.mjs.test.ts` | D-Tests | none |
| `tests/unit/scripts/lib/repoRoot.test.ts` | read-full | `scripts/lib/repoRoot.test.ts` | D-Tests | none |
| `tests/unit/scripts/lib/scriptEnv.test.ts` | read-full | `scripts/lib/scriptEnv.test.ts` | D-Tests | none |
| `tests/unit/scripts/lib/vitest-excludes.test.ts` | read-full | `scripts/lib/vitest-excludes.test.ts` | D-Tests | none |
| `tests/unit/scripts/lint-ui-contract.test.ts` | read-full | `scripts/lint-ui-contract.test.ts` | D-Tests | none |
| `tests/unit/scripts/migrate-svg-catalog-to-png.test.ts` | read-full | `scripts/migrate-svg-catalog-to-png.test.ts` | D-Tests | none |
| `tests/unit/scripts/responsive-audit-config.test.ts` | read-full | `scripts/responsive-audit-config.test.ts` | D-Tests | none |
| `tests/unit/scripts/root-surface-purity.test.ts` | read-full | `scripts/root-surface-purity.test.ts` | D-Tests | none |
| `tests/unit/scripts/scan_secrets.test.ts` | read-full | `scripts/scan_secrets.test.ts` | D-Tests | none |
| `tests/unit/scripts/smoke-svg-fixtures.test.ts` | read-full | `scripts/smoke-svg-fixtures.test.ts` | D-Tests | none |
| `tests/unit/scripts/sync-deferred-locale-messages.test.ts` | read-full | `scripts/sync-deferred-locale-messages.test.ts` | D-Tests | none |
| `tests/unit/scripts/sync-hi-wave1-messages.test.ts` | read-full | `scripts/sync-hi-wave1-messages.test.ts` | D-Tests | none |
| `tests/unit/scripts/sync-marketing-i18n-messages.test.ts` | read-full | `scripts/sync-marketing-i18n-messages.test.ts` | D-Tests | none |
| `tests/unit/scripts/translate-deferred-marketing-flat.test.ts` | read-full | `scripts/translate-deferred-marketing-flat.test.ts` | D-Tests | none |
| `tests/unit/scripts/validate-launch-env.test.ts` | read-full | `scripts/validate-launch-env.test.ts` | D-Tests | none |
| `tests/unit/scripts/verify-focss-imports.test.ts` | read-full | `scripts/verify-focss-imports.test.ts` | D-Tests | none |
| `tests/unit/scripts/verify-focss-structure.test.ts` | read-full | `scripts/verify-focss-structure.test.ts` | D-Tests | none |
| `tests/unit/scripts/verify-png-release.test.ts` | read-full | `scripts/verify-png-release.test.ts` | D-Tests | none |
| `tests/unit/server/Planner/plannerRouteAdapter.test.ts` | read-full | `server/Planner/plannerRouteAdapter.test.ts` | D-Tests | none |
| `tests/unit/server/Planner/plannerSecurityPrecedesPersistence.property.test.ts` | read-full | `server/Planner/plannerSecurityPrecedesPersistence.property.test.ts` | D-Tests | none |
| `tests/unit/server/Planner/sketchToPlan.server.test.ts` | read-full | `server/Planner/sketchToPlan.server.test.ts` | D-Tests | none |
| `tests/unit/server/Studio/publishFurnitureToCatalog.test.ts` | read-full | `server/Studio/publishFurnitureToCatalog.test.ts` | D-Tests | none |
| `tests/unit/site/components/Planner/PlannerDockShell.test.tsx` | read-full | `site/components/Planner/PlannerDockShell.test.tsx` | D-Tests | none |
| `tests/unit/site/components/Planner/ui/PlannerPhIcon.test.tsx` | read-full | `site/components/Planner/ui/PlannerPhIcon.test.tsx` | D-Tests | none |
| `tests/unit/site/components/Studio/StudioDockShell.test.tsx` | read-full | `site/components/Studio/StudioDockShell.test.tsx` | D-Tests | none |
| `tests/unit/site/components/Studio/ui/StudioPhIcon.test.tsx` | read-full | `site/components/Studio/ui/StudioPhIcon.test.tsx` | D-Tests | none |
| `tests/unit/site/focss/dock-contract.test.ts` | read-full | `site/focss/dock-contract.test.ts` | D-Tests | none |
| `tests/unit/store/Planner/plannerCatalogStore.test.ts` | read-full | `store/Planner/plannerCatalogStore.test.ts` | D-Tests | none |
| `tests/unit/studio/authorizeStudioCatalogTopPng.test.ts` | read-full | `studio/authorizeStudioCatalogTopPng.test.ts` | D-Tests | none |
| `tests/unit/studio/prepareStudioFurnitureCatalogFiles.test.ts` | read-full | `studio/prepareStudioFurnitureCatalogFiles.test.ts` | D-Tests | none |
| `tests/unit/studio/renderTopPngFromSvg.test.ts` | read-full | `studio/renderTopPngFromSvg.test.ts` | D-Tests | none |
| `tests/unit/studio/studioCanvasLayers.test.ts` | read-full | `studio/studioCanvasLayers.test.ts` | D-Tests | none |
| `tests/unit/studio/studioCatalogTopPngPersist.test.ts` | read-full | `studio/studioCatalogTopPngPersist.test.ts` | D-Tests | none |
| `tests/unit/studio/studioDrawColors.test.ts` | read-full | `studio/studioDrawColors.test.ts` | D-Tests | none |
| `tests/unit/studio/studioEnsureDockPanel.test.ts` | read-full | `studio/studioEnsureDockPanel.test.ts` | D-Tests | none |
| `tests/unit/studio/studioExportMenu.test.tsx` | read-full | `studio/studioExportMenu.test.tsx` | D-Tests | none |
| `tests/unit/studio/studioExporters.test.ts` | read-full | `studio/studioExporters.test.ts` | D-Tests | none |
| `tests/unit/studio/studioFabricSerialize.test.ts` | read-full | `studio/studioFabricSerialize.test.ts` | D-Tests | none |
| `tests/unit/studio/studioGeometry.test.ts` | read-full | `studio/studioGeometry.test.ts` | D-Tests | none |
| `tests/unit/studio/studioImporters.test.ts` | read-full | `studio/studioImporters.test.ts` | D-Tests | none |
| `tests/unit/studio/studioPropertySizeFields.test.ts` | read-full | `studio/studioPropertySizeFields.test.ts` | D-Tests | none |
| `tests/unit/studio/studioShapeGeometry.test.ts` | read-full | `studio/studioShapeGeometry.test.ts` | D-Tests | none |
| `tests/unit/studio/studioStore.test.ts` | read-full | `studio/studioStore.test.ts` | D-Tests | none |
| `tests/unit/studio/studioTokens.test.ts` | read-full | `studio/studioTokens.test.ts` | D-Tests | none |
| `tests/unit/workers/cachePolicy.test.ts` | read-full | `workers/cachePolicy.test.ts` | D-Tests | none |
| `tests/unit/workers/originConfig.test.ts` | read-full | `workers/originConfig.test.ts` | D-Tests | none |
| `tests/vitest.admin.coverage.config.ts` | read-full | `vitest.admin.coverage.config.ts` | D-Tests | none |
| `tests/vitest.admin.live.coverage.config.ts` | read-full | `vitest.admin.live.coverage.config.ts` | D-Tests | none |
| `tests/vitest.config.ts` | read-full | `vitest.config.ts` | D-Tests | none |
| `tests/vitest.coverage.inventory.config.ts` | read-full | `vitest.coverage.inventory.config.ts` | D-Tests | none |
| `tests/vitest.shared.ts` | read-full | `vitest.shared.ts` | D-Tests | none |
| `tests/vitest.site.config.ts` | read-full | `vitest.site.config.ts` | D-Tests | none |
| `tests/vitest.tech-docs.config.ts` | read-full | `vitest.tech-docs.config.ts` | D-Tests | none |
