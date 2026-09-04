# Results & Ephemeral Evidence Subsystem Audit

**Date:** September 4, 2026  
**Auditor:** AntiGravity Pair Programming Agent  
**Status:** COMPLETED  
**Scope:** Ephemeral Test Evidence, 4-Hour TTL Lifecycle, Cache Sanitization, and Layout Contracts

---

## 1. Executive Summary

The [`results/`](file:///d:/23082026/results) directory serves as the repository's dedicated output sink for automated test harnesses, coverage metrics, and headless browser run dumps. Under **Process Floor Rule 3 (`AGENTS.md`)**, this folder is strictly for **ephemeral generated evidence** with a maximum Time-To-Live (TTL) of $\le$ 4 hours.

Hand-written Markdown reports, long-term documentation, and audit notes are strictly prohibited from being saved under `results/`. All durable findings must be published directly to [`agent-reports/`](file:///d:/23082026/agent-reports/).

---

## 2. Directory Layout & Artifact Types

| Subdirectory / File | Emitting Process | Data Format & Purpose |
| :--- | :--- | :--- |
| **`results/audits/`** | Security, link, and SEO scripts | Raw JSON run logs and scan diagnostics |
| **`results/playwright-report/`** | Playwright E2E test runs | HTML trace bundles, screenshots, failure videos |
| **`results/site/`** | Site performance & bundle analyzers | Webpack/Turbopack chunk metrics |
| **`results/site-ui/`** | Visual regression audits | DOM element layout and viewport diffs |
| **`results/test-results/`** | Vitest test runner (default + tech-docs) | JUnit XML and Vitest execution summaries |
| **`results/test-inventory.json`** | `scripts/general/generate-test-inventory.mjs` | Cached list of all test suites across the monorepo |
| **`results/test-migration-map.json`** | Test migration tooling | Vitest lane transition mappings |

---

## 3. Git & Retention Governance

1. **Gitignore Protection:**
   - In [`.gitignore`](file:///d:/23082026/.gitignore), `results/*` is ignored with `!results/.gitkeep` ensuring temporary multi-megabyte test traces never enter Git history.
2. **Automated Pruning:**
   - Running `node scripts/clean-test-artifacts.mjs` clears stale test dumps, snapshots, and traces older than 4 hours.
3. **CI Gate Invariant:**
   - CI rejects commits containing hand-written Markdown files inside `results/`, preserving clean evidence separation.
