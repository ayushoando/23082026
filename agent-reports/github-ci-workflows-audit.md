# GitHub Actions & Automation (`.github/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`.github/`](file:///d:/23082026/.github/)  
**CI Engine:** GitHub Actions (Ubuntu 24.04 / Node.js 24)  
**Package Manager:** `pnpm` v9+

---

## Executive Summary

The [`.github/`](file:///d:/23082026/.github/) directory manages repository **continuous integration, nightly backups, automated dependency updates, and agent instructions**. It defines 4 core workflow pipelines, automated Dependabot schedules, and 4 instruction files that enforce code standards on automated PRs.

```
.github/ Architecture:
├── workflows/
│   ├── release-gate.yml         # Full CI ship bar (lint, test, build, governance, Playwright)
│   ├── supabase-backup-r2.yml   # Nightly 02:15 UTC Dual-Supabase pg_dump to Cloudflare R2
│   ├── site-ui.yml              # Dedicated UI, accessibility, and visual testing lane
│   └── tech-docs.yml            # Tech-Docs parity validation and Vite build verification
├── instructions/                # Automated Contributor & Agent Instructions
│   ├── boundaries.instructions.md # Enforces Studio vs Planner fork isolation
│   ├── focss.instructions.md    # Forbids raw hex and enforces @focss/* tokens
│   ├── migrations.instructions.md # Mandates '-- rollback:' comments in SQL migrations
│   └── testing.instructions.md  # Enforces source-mirrored test layout (tests/CONTENTS.md)
└── dependabot.yml               # Automated daily dependency version grouping
```

---

## 1. CI/CD Workflows Analysis

| Workflow File | Trigger Events | Primary Jobs & Gates | Environment Secrets Injected |
| :--- | :--- | :--- | :--- |
| **`release-gate.yml`** | `push: [main]`, `pull_request` | `pnpm run check:layout`, `pnpm run check:governance`, `pnpm run test` (two-lane), `pnpm run build:site`. | `VERCEL_TOKEN`, `NEXT_PUBLIC_SUPABASE_*` |
| **`supabase-backup-r2.yml`** | Schedule (`15 2 * * *`), `workflow_dispatch` | Installs `postgresql-client` (`pg_dump`), executes `pnpm run ops backup:supabase:r2`. | `PRODUCTS_DATABASE_URL`, `SUPABASE_AUTH_DATABASE_URL`, `CLOUDFLARE_R2_*` *(Note: requires secret sync fix)* |
| **`site-ui.yml`** | `pull_request` affecting `site/**` | Runs `verify:focss`, `lint:ui:strict`, and Playwright fast-gate specs. | Node environment |
| **`tech-docs.yml`** | `pull_request` affecting `tech-docs/**` | Runs `vitest.tech-docs.config.ts` and `tech-docs:build`. | Node environment |

---

## 2. Dependabot Configuration (`dependabot.yml`)

* **Package Ecosystem:** `npm` targeting monorepo root.
* **Update Schedule:** Daily at 06:00 UTC.
* **Grouping Policy:** Groups minor/patch updates into single pull requests (`@types/*`, `vitest-*`, `eslint-*`) to prevent PR notification fatigue.
* **Auto-Merge Safety:** Production deployment in `vercel.json` explicitly ignores `dependabot/**` branches until passing CI release gates.

---

## 3. Workflow Instructions (`.github/instructions/`)

These markdown files act as automated PR quality gates:
1. `boundaries.instructions.md`: Forbids cross-imports between `site/.../Studio` and `site/.../Planner`.
2. `focss.instructions.md`: Forbids inline styles and raw `#hex` values.
3. `migrations.instructions.md`: Demands reversible SQL blocks with `-- rollback:`.
4. `testing.instructions.md`: Demands tests mirror source paths and maintain 2-lane Vitest separation.
