# Configuration (`config/`) Architecture & Tech-Docs Coverage Gap Audit

**Date:** 2026-09-04  
**Target:** [`config/`](file:///d:/23082026/config/) Directory & [`tech-docs-generator/`](file:///d:/23082026/tech-docs-generator/) Extraction Pipeline  
**Inquiry:** *"How does this work, report, and why does tech stack generator not cover this?"*

---

## Executive Summary

The root [`config/`](file:///d:/23082026/config/) directory is the **foundational build, quality, and observability substrate** for the entire monorepo. It houses the root Next.js build configuration, Playwright end-to-end harnesses, zero-regression CI governance baselines, and local telemetry infrastructure.

Despite its critical operational role, the Tech-Docs Generator (`tech-docs-generator`) **almost completely ignores `config/`**. The documentation SPA hardcodes obsolete ghost paths (such as non-existent `config/database/`) and fails to extract CI quality baselines or observability configurations into its domain model.

```
config/ Architecture:
├── build/                # Monorepo Build & Test Harness
│   ├── next.config.js    # Base Next.js config (headers, redirects, webpack, standalone)
│   ├── playwright.config.ts # Root Playwright e2e runner configuration
│   ├── playwrightBaseURL.cjs # Base URL resolver (localhost:3000)
│   ├── playwright-gate-specs.json # Specs required for fast gate passes
│   ├── playwright-open3d-world-specs.json # Specs for 3D planner canvas
│   ├── postcss.config.mjs # CSS compiler config
│   ├── tsconfig.json     # TypeScript project reference for build harness
│   └── vitest-console-reporter.ts # Custom quiet console reporter for Vitest
├── quality/              # CI Governance & Quality Ratchets
│   ├── governance-baseline.json # Zero-regression counters (D2_npx, P4_migration, etc.)
│   └── style-token-baseline.json # Tracked per-file inline style/token exceptions (201 total)
└── observability/        # Local Metrics & Telemetry Stack
    ├── docker-compose.yml # Prometheus + Grafana local containers
    ├── prometheus.yml    # Scraper config for Next.js /api/metrics (port 3000)
    └── grafana/          # Provisioned datasources and visualization dashboards
```

---

## 1. How `config/` Works

### 1.1 `config/build/` — Build & Test Harness
This directory decouples build configuration from application source code:
* **`next.config.js` (19KB):**  
  The core Next.js engine configuration. Rather than bloating `site/next.config.js`, all shared logic—security headers (CSP, HSTS, X-Frame-Options), remote image domains (`*.supabase.co`, Cloudflare R2), Turbopack/Webpack rules, and standalone server output—is defined here. `site/next.config.js` simply imports it:
  ```javascript
  const baseConfig = require("../config/build/next.config.js");
  ```
* **`playwright.config.ts` (3.7KB):**  
  The repository-wide browser testing engine. Enforces viewport standards (`chromium-desktop`, `firefox-tablet`, `webkit-mobile`), mandates `http://localhost:3000` (forbidding `127.0.0.1`), and manages webServer lifecycle.
* **Gate Spec Manifests:**  
  `playwright-gate-specs.json` and `playwright-open3d-world-specs.json` explicitly define the exact subset of specs run during fast gate checks (`pnpm run gate:fast`), preventing slow full-suite runs during rapid development loops.

### 1.2 `config/quality/` — CI Ratchets & Governance Baselines
This directory stores machine-verified quality floors that prevent technical debt regression:
* **`governance-baseline.json`:**  
  Enforced by [`scripts/general/check-governance.mjs`](file:///d:/23082026/scripts/general/check-governance.mjs). It enforces zero-tolerance metrics:
  ```json
  {
    "D2_npx": 0,
    "D3_dead_overrides": 0,
    "D6_nonportable_in_gate": 0,
    "P2_csp_unsafe_inline": 0,
    "P4_migration_no_rollback": 0,
    "S2_stray_report": 0
  }
  ```
  If any developer introduces a migration without a `-- rollback:` comment or adds an unsafe inline script to CSP, this ratchet triggers an immediate CI failure.
* **`style-token-baseline.json`:**  
  Tracks exactly 201 legacy inline style/token exceptions across 30 files in `site/`. The validator ([`scripts/AsNeeded/check-style-tokens.mjs`](file:///d:/23082026/scripts/AsNeeded/check-style-tokens.mjs)) allows legacy exceptions but fails CI if any new inline style or untokenized hex code is introduced.

### 1.3 `config/observability/` — Telemetry & Metrics
* **`docker-compose.yml` & `prometheus.yml`:**  
  Allows developers to spin up a local telemetry stack with `docker compose -f config/observability/docker-compose.yml up`.
* **Metrics Ingestion:**  
  Prometheus scrapes the OpenTelemetry endpoint exposed by Next.js at `http://host.docker.internal:3000/api/metrics` at 5-second intervals.
* **Grafana Provisioning:**  
  Auto-loads dashboard definitions in `grafana/provisioning/` for real-time visualization of Next.js route latency, SSR render duration, and database connection pool saturation.

---

## 2. Why Does Tech Stack Generator NOT Cover `config/`?

An exhaustive audit of the 55 scripts in [`tech-docs-generator/scripts/`](file:///d:/23082026/tech-docs-generator/scripts/) and the 12 UI pages in [`tech-docs-generator/src/pages/`](file:///d:/23082026/tech-docs-generator/src/pages/) revealed **4 distinct architectural disconnects**:

### Disconnect 1: `config` is Omitted from `COVERAGE_REQUIRED_DOMAINS`
In [`tech-docs-generator/scripts/model.mjs:41-60`](file:///d:/23082026/tech-docs-generator/scripts/model.mjs#L41-L60), the generator enforces model extraction across 18 required domains (`workspace`, `next-app`, `api`, `deployment`, `database`, `testing`, etc.).  
**`config` is not a required domain.** The model extractor treats `config/` as auxiliary scaffolding rather than a first-class architectural layer.

### Disconnect 2: `config` is Excluded from the Live File Watcher
In [`tech-docs-generator/scripts/output-contract.mjs:34-46`](file:///d:/23082026/tech-docs-generator/scripts/output-contract.mjs#L34-L46), `LIVE_WATCH_ROOTS` defines the directory roots monitored during documentation development:
```javascript
export const LIVE_WATCH_ROOTS = [
  'site', 'docs', 'Agents', '.github', SOURCE_PACKAGE_DIR, 'scripts',
  'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', 'Readme.md', 'Failures.md'
];
```
`config` is **absent**. If an operator modifies `next.config.js`, adds a Playwright spec to `playwright-gate-specs.json`, or updates `governance-baseline.json`, the Tech-Docs server does not detect the change and never rebuilds.

### Disconnect 3: The UI Hardcodes Obsolete Ghost Paths
The Tech-Docs frontend pages were written against an obsolete mental model from early August 2026:
* In [`tech-docs-generator/src/pages/CodeOrganization.tsx:154`](file:///d:/23082026/tech-docs-generator/src/pages/CodeOrganization.tsx#L154):
  ```bash
  config/
  ├── build/                   # Build / test harness (live)
  ├── database/                # migrations / types (verify disk)  <-- GHOST PATH!
  └── …
  ```
  The author literally wrote `(verify disk)`. On disk, `config/database/` does not exist; database migrations live in `site/platform/supabase/migrations/`.
* In [`tech-docs-generator/src/pages/Database.tsx:334`](file:///d:/23082026/tech-docs-generator/src/pages/Database.tsx#L334) & `Line 362`:
  The page attempts to scan `config/database/migrations` and `config/database/types/database.types.ts`, returning empty lists.

### Disconnect 4: Zero Extractors for Quality & Observability
Among the 23 extractors in `tech-docs-generator/scripts/` (`extract-ci.mjs`, `extract-database.mjs`, `extract-features.mjs`, etc.):
* **`config/quality/`:** Zero extractors parse `governance-baseline.json` or `style-token-baseline.json`. The Tech-Docs UI has no page displaying active governance limits or the token debt baseline.
* **`config/observability/`:** Zero extractors parse `docker-compose.yml` or Prometheus scrape configs. The UI completely omits the telemetry architecture.
* **`config/build/`:** Only [`extract-runner-selection.mjs`](file:///d:/23082026/tech-docs-generator/scripts/extract-runner-selection.mjs#L106) touches `config/build/playwright.config.ts`, and only to read browser runner strings.

---

## 3. Remediation Blueprint for Tech-Docs

To bring `config/` under full Tech-Docs generator coverage:

1. **Add `extract-config.mjs`:** Create an extractor in `tech-docs-generator/scripts/` that reads:
   - `config/build/*.json` (spec manifests)
   - `config/quality/governance-baseline.json` (governance ratchets)
   - `config/observability/prometheus.yml` (metrics architecture)
2. **Update `LIVE_WATCH_ROOTS`:** Add `'config'` to `output-contract.mjs` so documentation hot-reloads on config updates.
3. **Purge Ghost Paths:** Update `CodeOrganization.tsx` and `Database.tsx` to remove `config/database/` references and point to the real `config/quality/` and `config/observability/` trees.
4. **Register Domain in `model.mjs`:** Add `'config'` and `'quality-ratchets'` to `COVERAGE_REQUIRED_DOMAINS`.
