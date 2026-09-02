# Repository Analysis & Suggestions

## Executive Summary
An audit of the `ooplanner-oostudio` repository was performed across its Configuration, Testing Infrastructure, and Architecture using background scout agents. The following sections break down inconsistencies, technical debt, and actionable suggestions to align the project with Next.js 16 and React 19 standards.

---

## 1. Configuration Audit

**Overview:** 
The project follows a Next.js 16 (React 19, TypeScript 7) monorepo architecture with a clean Tailwind CSS v4 and FOCSS design system. Configuration is centralized under `config/build/` with app-level extensions under `site/`.

**Findings & Suggestions:**
- **[site/tsconfig.json]** - **[Dead Artifact Removed]** - The `.next/dev/dev/types/**/*.ts` include path was a recursive artifact from a copy-paste error. **Fix applied:** I have already removed this dead line from `site/tsconfig.json`.
- **[site/tsconfig.json vs config/build/tsconfig.json]** - **[TypeScript Target Drift & Duplication]** - `site/tsconfig.json` specifies `"target": "ES2017"` and `"allowJs": false` without extending `config/build/tsconfig.json` (which defines `"target": "ES2018"` and `"allowJs": true`), while `scripts/tsconfig.json` specifies `"target": "ES2022"`. 
  - *Suggested Fix:* Standardize target across workspace tsconfigs to `ES2022` or `ES2020` and have `site/tsconfig.json` extend `config/build/tsconfig.json` where applicable.
- **[config/build/next.config.js vs site/next.config.js]** - **[Redirect Destination Inconsistency]** - `config/build/next.config.js` defines redirects for routes like `/news`, `/brochure`, and `/catalog` to destination pages (e.g., `/about/`, `/downloads/`), but `site/next.config.js` overrides `HOME_REDIRECT_SOURCES` to redirect them all to `/`. 
  - *Suggested Fix:* Align base redirects in `config/build/next.config.js` with `site/next.config.js` to avoid diverging routing behavior.
- **[config/build/next.config.js]** - **[Next.js Experimental Flags Alignment]** - `experimental.useTypeScriptCli: true` is configured for TypeScript 7 compiler CLI compatibility. 
  - *Suggested Fix:* Retain `useTypeScriptCli` for TS 7 compatibility but monitor Next.js upstream stabilization for TS CLI flags.
- **[site/focss / PostCSS]** - **[Tailwind v4 Integration]** - Tailwind v4 is cleanly integrated with `@tailwindcss/postcss` in `postcss.config.mjs`, utilizing native CSS directives without legacy files. No migration debt identified.

---

## 2. Testing Audit

**Overview:** 
The testing infrastructure is strictly governed with dual-lane Vitest execution, automated anti-hollow assertion audits, skip guards, and strict persistence mode rules.

**Findings & Suggestions:**
- **[tests/tsconfig.json]** - **[Typecheck Gap]** - E2E Playwright specs (83 files under `tests/e2e/`) are explicitly excluded from `tests/tsconfig.json` and are not typechecked by `pnpm run typecheck:tests` or `pnpm run typecheck`. 
  - *Suggested Fix:* Add an `e2e/tsconfig.json` extending root configs or include `tests/e2e/**/*.ts` in a dedicated script so Playwright tests are type-validated during CI.
- **[tests/CONTENTS.md vs Directory Layout]** - **[Layout Rule Violation]** - The source-mirrored layout rule is violated by legacy directories (`tests/unit/app/`, `tests/unit/components/`, etc.). 
  - *Suggested Fix:* Execute migration waves before the 2026-12-31 expiry in `source-test-ownership.json` to move suites to canonical `tests/unit/site/...` and `tests/support/...` locations.
- **[tests/vitest.*.config.ts]** - **[Configuration Proliferation]** - There are six independent Vitest configuration files. 
  - *Suggested Fix:* Consolidate shared aliases and test pools using Vitest Workspace configuration (`vitest.workspace.ts`) while keeping execution profiles distinct.
- **[tests/vitest.admin.live.coverage.config.ts]** - **[Suppressed Coverage Thresholds]** - Admin live coverage configuration has thresholds suppressed to 0% and is decoupled from standard release gates. 
  - *Suggested Fix:* Establish an incremental threshold floor for live admin modules.
- **[Live DB Smoke Suites]** - **[Silent Skipping]** - DB smoke suites skip silently without error when service environment credentials are unset. 
  - *Suggested Fix:* Add an explicit CI validation step verifying that live DB smoke suites actually execute assertions when scheduled.
- **[config/build/playwright-gate-specs.json]** - **[Excluded Specs]** - The release browser gate executes only 8 of the 83 Playwright specs, leaving ~75 E2E specs excluded from default PR/release gating. 
  - *Suggested Fix:* Document an explicit nightly/scheduled CI matrix for secondary E2E specs.
- **[tests/setup.ts]** - **[Complex Monkey-Patching]** - Complex monkey-patching of `React.act` delegates due to Vitest CJS fork resolution under React 19. 
  - *Suggested Fix:* Streamline to native React 19 `globalThis.IS_REACT_ACT_ENVIRONMENT = true` once upstream Vitest/RTL bundler resolution is upgraded.

---

## 3. Architecture Audit

**Overview:** 
The repository enforces a strict two-fork architecture for interactive workspaces: Furniture Studio (`/oostudio`) and Floor Planner (`/ooplanner`). Each fork owns its vertical slice across components, lib, hooks, store, server, and focss CSS with dedicated import aliases.

**Findings & Suggestions:**
- **[Product Boundaries]** - Verified zero boundary violations between Studio and Planner forked trees (`scripts/scan-boundaries.mjs`).
- **[docs/architecture/routes.md]** - **[Outdated Documentation]** - Page and API route documentation has several omissions and references outdated proxy/config files.
  - *Suggested Fix:* Update the routes catalog to include missing API routes and correct the Next.js edge/proxy documentation.
- **[docs/architecture/stack.md]** - **[Version Drift]** - Application stack documentation contains minor package version discrepancies compared to `package.json`.
  - *Suggested Fix:* Sync the documented versions (Next.js 16.3.3, React 19.2.8, TS 7.0.2) in `stack.md` to reflect the active `package.json` state.