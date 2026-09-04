# Repository Root Governance & Contracts (`root/`) Audit

**Date:** 2026-09-04  
**Target:** Repository Root Files & Monorepo Governance Anchors  
**Scope:** `AGENTS.md`, `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `Failures.md`, `OPERATIONS_RUNBOOK.md`, and Root Dotfiles.

---

## Executive Summary

The repository root defines the **monorepo-wide execution floor, dependency graph, and governance contracts**. It holds the durable authority files that dictate how autonomous agents, developers, and CI pipelines must interact with the codebase.

```
Repository Root Architecture:
├── Governance & Process Floor:
│   ├── AGENTS.md            # Highest in-tree authority: Process floor, truth rules, boundaries
│   ├── Failures.md          # Sole repository record of active hard blockers
│   ├── owners.md            # Code ownership map across 14 subsystem owners
│   ├── CONTENTS.md          # Master documentation map
│   └── DOC-MAP.md           # Canonical documentation routing index
├── Workspace & Package Management:
│   ├── package.json         # 78 scripts, unified dev/build/gate orchestrator
│   ├── pnpm-workspace.yaml  # Monorepo topology: root product + tech-docs (workers decoupled)
│   ├── pnpm-lock.yaml       # Pinned dependency lockfile
│   └── turbo.json           # Turborepo task pipeline caching configuration
├── Operational Guides:
│   ├── OPERATIONS_RUNBOOK.md# Production runbook (Supabase, R2, Vercel, Cloudflare)
│   ├── Testing-handbook.md  # Vitest and Playwright execution standards
│   ├── START.md             # Developer onboarding checklist
│   └── HANDOVER.md          # Multi-agent/operator session handover log
└── Environment & Tooling Config:
    ├── .oxlintrc.json       # High-speed Oxlint linter rules & ignorePatterns
    ├── vercel.json          # Root Vercel production deployment settings (bom1 edge)
    ├── .env.example         # Canonical environment template (safe for git)
    └── .env.local           # Local secrets file (gitignored, scanned for leaks)
```

---

## 1. Monorepo Topology & Package Contracts

### 1.1 Single Workspace Rule (`pnpm-workspace.yaml`)
* **Packages Managed:** Root (`site/`) and `tech-docs-generator`.
* **The Worker Exception:** [`workers/oando-worker-proxy/`](file:///d:/23082026/workers/oando-worker-proxy/) is **deliberately excluded** from the pnpm workspace. It maintains its own isolated `package-lock.json` and must be installed via `npm ci` inside that directory.
* **Strict Installation Rule:** Always run `pnpm install` from repo root only. Never create nested `node_modules` inside `site/`.
* **Dependency Overrides:** Pinning rules collapse duplicate patch/minor dependencies (e.g. `postcss: 8.5.25`, `@swc/helpers: 0.5.23`, `aria-query: 5.3.2`) to eliminate binary bloat.

### 1.2 Pipeline Task Execution (`turbo.json`)
Defines the DAG dependency graph:
* `build` outputs to `.next/**`.
* `test` depends on `build`.
* `release:gate` depends on `build`, `lint`, `typecheck`, and `test`.

---

## 2. Governance Anchors

### 2.1 `AGENTS.md` (The Repository Floor)
* **Authority Order:** `user instruction > live code and fresh command output > AGENTS.md > Agents/ > docs/`.
* **User Control State:** Terminal words (`pause`, `wait`, `read-only`) immediately freeze disk writes.
* **Fork Boundary:** Studio (`/oostudio`) and Planner (`/ooplanner`) are strictly forked. They must never import each other (`pnpm run scan:boundaries`).
* **Persistence Guarantee:** Production filesystem is read-only (`EROFS`). Runtime writes must use mode-aware wrappers; disk writes are permitted only when `DEV_AUTH_BYPASS=1`.

### 2.2 `Failures.md` (The Blocker Registry)
* Sole authority for active hard blockers.
* Blocker rows may only be removed after an authorized rerun observes the fix with reproducible live evidence.
* Current active rows: 4 recorded, with `CF-TOKEN-01` and `BROWSER-ORIGIN-02` now verified resolved.

---

## 3. Environment & Deployment Configuration

* **Vercel Ingress ([`vercel.json`](file:///d:/23082026/vercel.json)):**  
  Deploys Next.js standalone build to region `bom1` (Mumbai). Injects `X-Robots-Tag: noindex, nofollow` on direct `*.vercel.app` URLs to prevent search duplicate content penalties.
* **Linting ([`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json)):**  
  High-speed Rust-based linter covering TypeScript, React, unicorn, and a11y.
