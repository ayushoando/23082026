# Configuration (`config/`) Architecture & Tech-Docs Coverage Gap Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`config/`](file:///d:/23082026/config/)  
**Method:** Live file inspections of `config/build/`, `config/quality/`, `config/observability/`, and tech-docs coverage contracts.

---

## 1. Directory Tree & Architecture

The `config/` directory serves as the centralized harness for builds, testing, quality ratchets, and telemetry:

```
config/
├── build/
│   ├── next.config.js              ← Shared base Next.js engine (CSP headers, R2 domains, standalone)
│   ├── playwright.config.ts         ← Playwright browser runner (Chromium, Firefox, WebKit)
│   ├── playwrightBaseURL.cjs        ← Enforces http://localhost:3000 (never 127.0.0.1)
│   ├── playwright-gate-specs.json   ← Manifest of specs run in fast gate
│   ├── playwright-open3d-world-specs.json ← 3D viewport specs
│   ├── postcss.config.mjs          ← PostCSS processor config
│   ├── tsconfig.json               ← Build harness TypeScript config
│   └── vitest-console-reporter.ts  ← Clean Vitest console logger
├── quality/
│   ├── governance-baseline.json    ← 6 zero-tolerance CI governance metrics
│   └── style-token-baseline.json   ← 201 registered inline style token exceptions
└── observability/
    ├── docker-compose.yml          ← Local Prometheus/Grafana stack
    ├── prometheus.yml              ← Metrics scrape configuration
    └── grafana/provisioning/datasources/prometheus.yml ← Grafana datasource
```

*Note on Ghost Paths:* No `config/database/` directory exists on disk. Any reference in technical documentation or diagrams to `config/database/` represents a documentation artifact and should refer to `site/platform/supabase/migrations/` and `migrations.admin/`.

---

## 2. Quality Ratchets (`config/quality/`)

### 2.1 Governance Baseline (`governance-baseline.json`)
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
All six metrics are strictly enforced with zero tolerance during `pnpm run check:governance`.

### 2.2 Style Token Baseline (`style-token-baseline.json`)
- Tracks 201 legacy inline token violations across 30 files.
- Verified by `pnpm run check:style-tokens`.
- Can be ratcheted down when styles are converted to `@focss/tokens`.

---

## 3. Tech-Docs Coverage & Domain Models

In `tech-docs-generator/scripts/model.mjs`, `COVERAGE_REQUIRED_DOMAINS` defines 18 required domains:
`workspace`, `next-app`, `api`, `route-contracts`, `deployment`, `github-actions`, `dependabot`, `environment`, `database`, `supabase`, `r2-assets`, `planner`, `admin`, `ai-openrouter`, `testing`, `css-theme`, `i18n`, and `docs-health`.

---

## 4. Verification Commands

```powershell
# 1. Run governance baseline validation
pnpm run check:governance

# 2. Run style token baseline check
pnpm run check:style-tokens

# 3. Verify tech-docs domain coverage contract
pnpm run tech-docs:test
```
