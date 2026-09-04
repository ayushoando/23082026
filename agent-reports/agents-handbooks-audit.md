# Agent Handbooks (`Agents/`) Subsystem Audit

**Date:** 2026-09-04  
**Target:** [`Agents/`](file:///d:/23082026/Agents/)  
**Role:** Standardized Operating Handbooks for Autonomous Coding Agents  
**Governance Authority:** Subservient only to User Instructions, Live Code, and [`AGENTS.md`](file:///d:/23082026/AGENTS.md)

---

## Executive Summary

The [`Agents/`](file:///d:/23082026/Agents/) directory contains **7 specialized domain handbooks** and auxiliary research guides that define the behavioral constraints and operational protocols for AI agents interacting with the repository.

```
Agents/ Handbook Library:
├── INDEX.md                 # Master directory & handbook navigation index
├── 01-standard.md           # Core Process: Authority hierarchy, worktree rules, pnpm only
├── 02-testing.md            # Testing Rules: Two-lane Vitest, happy-dom, Playwright standards
├── 03-browser.md            # Browser Rules: http://localhost:3000 only, multi-viewport walk
├── 04-failures.md           # Blocker Rules: Sole authority in Failures.md, live evidence only
├── 05-documentation.md      # Docs Rules: Zero markdown in results/, DOC-MAP.md routing
├── 06-architecture.md       # Architectural Rules: Dual-Supabase, fork boundaries, EROFS prod
├── 07-css.md                # CSS Rules: @focss/* tokens, zero hex literals, verify:focss
├── research-practices.md    # Evidence-based research standards (no unobserved commands)
└── research-gap-areas.md    # Known areas requiring manual operator clarification
```

---

## 1. Handbook Deep Dives

| Handbook | Title | Key Governance Rules Enforced |
| :--- | :--- | :--- |
| **`01-standard.md`** | Process Floor | User instructions always win; single root worktree only; pnpm only; smallest sound change; no hand-written `any`. |
| **`02-testing.md`** | Testing Standards | One green test $\neq$ full suite; DOM requires `happy-dom`; two-lane execution (`test:unit` and `test:tech-docs`). |
| **`03-browser.md`** | Browser Workflows | **Mandatory Origin:** `http://localhost:3000` (never use `127.0.0.1`); runs across 3 viewports: desktop (1280px), tablet (768px), mobile (375px). |
| **`04-failures.md`** | Blocker Protocol | [`Failures.md`](file:///d:/23082026/Failures.md) is the sole record of blockers; never invent blocker states; delete rows only upon verified live rerun. |
| **`05-documentation.md`**| Docs & Reports | `results/` is generated evidence only ($\le$ 4 hours TTL); durable agent reports live strictly in [`agent-reports/`](file:///d:/23082026/agent-reports/). |
| **`06-architecture.md`**| System Boundaries | Studio and Planner are strictly forked; dual-database split (Products vs Admin); production filesystem is read-only (`EROFS`). |
| **`07-css.md`** | FOCSS Standards | Zero raw hex color codes; all styling must use `@focss/*` tokens; enforced via `verify:focss` and `check:style-tokens`. |

---

## 2. Agent Operational Compliance

These handbooks provide the operational backbone that prevents coding agents from making destructive changes, breaking fork boundaries, or hallucinating test execution.
