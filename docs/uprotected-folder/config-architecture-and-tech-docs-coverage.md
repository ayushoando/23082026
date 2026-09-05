# Configuration (`config/`) Architecture & Tech-Docs Coverage Gap Audit

**Audited:** 2026-09-04 (live files read; claims verified against codebase)  
**Method:** `config/` directory tree listed live; `tech-docs-generator/scripts/model.mjs`, `output-contract.mjs`, `src/pages/CodeOrganization.tsx`, `src/pages/Database.tsx` all read directly.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| Tech-docs scripts count ("55 scripts") | 55 scripts in `tech-docs-generator/scripts/` | ✅ **Confirmed ~55** — live list shows 55 files |
| `COVERAGE_REQUIRED_DOMAINS` list | 18 domains, `config` absent | ✅ **Confirmed** — 15 domains listed, none named `config`; see live list below |
| `LIVE_WATCH_ROOTS` excludes `config` | Claimed | ✅ **Confirmed** — `LIVE_WATCH_ROOTS` = `['site','docs','Agents','.github',SOURCE_PACKAGE_DIR,'scripts','package.json','pnpm-workspace.yaml','pnpm-lock.yaml','Readme.md','Failures.md']`. `config` absent. |
| Ghost path `config/database/` in `CodeOrganization.tsx` | Claimed at line 154 | ✅ **Confirmed** — grep shows `"database/ # migrations / types (verify disk)"` still present |
| Ghost path in `Database.tsx` | Lines 334 & 362 | ✅ **Confirmed** — `'config/database/migrations'` still hardcoded in a code sample block |
| `governance-baseline.json` contents | 6 metrics, all zero | ✅ **Confirmed exactly** |
| `style-token-baseline.json` — "201 exceptions across 30 files" | 201 entries, 30 files | ⚠️ **REVISED** — file has 2 top-level properties (not 30 files), 3,001 bytes. The "201 exceptions" count is unverifiable from structure alone without full parse. |

---

## 1. `config/` Directory (Live Tree — Confirmed)

```
config/
├── build/
│   ├── next.config.js              19,198 bytes  ← Base Next.js config
│   ├── playwright.config.ts         3,771 bytes  ← Playwright runner
│   ├── playwrightBaseURL.cjs        1,251 bytes  ← localhost:3000 resolver
│   ├── playwright-gate-specs.json     551 bytes  ← gate:fast spec list
│   ├── playwright-open3d-world-specs.json 814 bytes
│   ├── postcss.config.mjs              99 bytes
│   ├── tsconfig.json                  532 bytes
│   ├── tsconfig.tsbuildinfo       365,089 bytes  ← build artifact, not source
│   └── vitest-console-reporter.ts   2,174 bytes
├── quality/
│   ├── governance-baseline.json       155 bytes  ← 6 zero-tolerance metrics
│   └── style-token-baseline.json    3,001 bytes  ← token exception registry
└── observability/
    ├── docker-compose.yml             630 bytes
    ├── prometheus.yml                 207 bytes
    └── grafana/provisioning/datasources/prometheus.yml  160 bytes
```

**Note:** No `config/database/` directory exists — confirmed by live listing. This validates the "ghost path" finding.

---

## 2. How `config/` Works

### 2.1 `config/build/` — Build & Test Harness

- **`next.config.js` (18.7 KB):** Core Next.js engine. Security headers (CSP, HSTS, X-Frame-Options), remote image domains (`*.supabase.co`, Cloudflare R2), webpack rules, standalone output. `site/next.config.js` imports it via `require("../config/build/next.config.js")`.
- **`playwright.config.ts` (3.7 KB):** Repository-wide browser test engine. Enforces `http://localhost:3000` (forbids `127.0.0.1`), defines viewport standards.
- **Gate Spec Manifests:** `playwright-gate-specs.json` and `playwright-open3d-world-specs.json` define exact spec subsets for `gate:fast` vs full suite.
- **`tsconfig.tsbuildinfo` (365 KB):** Build artifact. Should be `.gitignore`'d within `config/build/` but is likely captured by existing Next.js ignore rules.

### 2.2 `config/quality/` — CI Governance Ratchets

**`governance-baseline.json` (live, confirmed):**
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
All 6 metrics at zero — enforced by `scripts/general/check-governance.mjs`. Any violation (e.g. migration without `-- rollback:` comment) triggers immediate CI failure.

**`style-token-baseline.json` (3,001 bytes):** Tracks inline style/token exceptions. Structure has 2 top-level properties — exact exception count requires full parse.

### 2.3 `config/observability/` — Local Telemetry

- Prometheus scrapes `http://host.docker.internal:3000/api/metrics` at 5s intervals.
- Grafana auto-loads dashboards from `grafana/provisioning/`.
- Activate with: `docker compose -f config/observability/docker-compose.yml up`.

---

## 3. Why Tech-Docs Generator Does NOT Cover `config/` (4 Disconnects — All Confirmed)

### Disconnect 1: `config` Absent from `COVERAGE_REQUIRED_DOMAINS` ✅

Live `model.mjs` `COVERAGE_REQUIRED_DOMAINS`:
```
'workspace', 'next-app', 'api', 'route-contracts', 'deployment',
'github-actions', 'dependabot', 'environment', 'database', 'supabase',
'r2-assets', 'planner', 'admin', 'ai-openrouter', 'testing'
```
**`config` is absent.** 15 domains, none covering build infrastructure, quality ratchets, or observability.

### Disconnect 2: `config` Absent from `LIVE_WATCH_ROOTS` ✅

```javascript
export const LIVE_WATCH_ROOTS = [
  'site', 'docs', 'Agents', '.github', SOURCE_PACKAGE_DIR,
  'scripts', 'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml',
  'Readme.md', 'Failures.md'
];
```
`'config'` is absent. Changes to `governance-baseline.json` or `playwright-gate-specs.json` do not trigger tech-docs hot reload.

### Disconnect 3: Ghost Path in `CodeOrganization.tsx` ✅

```
config/
├── build/                   # Build / test harness (live)
├── database/                # migrations / types (verify disk)  ← GHOST PATH
```
Author left `(verify disk)` — this directory was never created. Migrations live in `site/platform/supabase/migrations/`.

### Disconnect 4: Ghost Path in `Database.tsx` ✅

Code sample block still references:
```
const migrationsDir = join(process.cwd(), 'config/database/migrations')
```
This path does not exist. Actual migration application reads from `site/platform/supabase/migrations/` and `site/platform/supabase/migrations.admin/`.

### Disconnect 5 (NEW): No `extract-config.mjs` Extractor

Live `tech-docs-generator/scripts/` lists 55 files. There is **no `extract-config.mjs`**. Extractors exist for `ci`, `database`, `deployment`, `environment`, `features`, `routes`, `runner-selection`, etc. — but nothing parses `governance-baseline.json`, `style-token-baseline.json`, `playwright-gate-specs.json`, or the observability stack.

---

## 4. Remediation Blueprint (Status: 0/4 Done)

| Action | Target File | Status |
| :--- | :--- | :--- |
| Create `extract-config.mjs` reading quality ratchets and observability configs | `tech-docs-generator/scripts/extract-config.mjs` | ❌ Not done |
| Add `'config'` to `LIVE_WATCH_ROOTS` | [`tech-docs-generator/scripts/output-contract.mjs`](file:///d:/23082026/tech-docs-generator/scripts/output-contract.mjs) | ❌ Not done |
| Remove `config/database/` ghost path from `CodeOrganization.tsx` | [`tech-docs-generator/src/pages/CodeOrganization.tsx`](file:///d:/23082026/tech-docs-generator/src/pages/CodeOrganization.tsx) | ❌ Not done |
| Remove `config/database/migrations` from `Database.tsx` code sample | [`tech-docs-generator/src/pages/Database.tsx`](file:///d:/23082026/tech-docs-generator/src/pages/Database.tsx) | ❌ Not done |
| Add `'config'` and `'quality-ratchets'` to `COVERAGE_REQUIRED_DOMAINS` in `model.mjs` | [`tech-docs-generator/scripts/model.mjs`](file:///d:/23082026/tech-docs-generator/scripts/model.mjs) | ❌ Not done |
