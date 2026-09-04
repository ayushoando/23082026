# Agent Specifications & Workflow Recipes (`specs/`) Audit

**Date:** 2026-09-04  
**Target:** [`specs/`](file:///d:/23082026/specs/)  
**Role:** Declarative Agent Workflow & Recipe Engine  
**State Machine:** [`specs/state.yaml`](file:///d:/23082026/specs/state.yaml)

---

## Executive Summary

The [`specs/`](file:///d:/23082026/specs/) directory implements a **declarative recipe library and state machine** for autonomous agent operations. It defines bounded execution protocols (such as `/ship`, `/tdd`, `/e2e`, `/security`) with explicit terminal states (`success`, `no-op`, `blocked`, `exhausted`) to enforce reproducible, step-by-step developer workflows.

```
specs/ Architecture:
├── state.yaml               # Active execution state machine & handoff registry
└── workflows/               # Declarative Recipe Library (8 Workflows)
    ├── build-fix.yaml       # /build-fix: Diagnose & repair compiler errors
    ├── check-stack.yaml     # /check-stack: Validate environment & dependencies
    ├── code-review.yaml     # /code-review: Quality & architectural audit
    ├── e2e.yaml             # /e2e: Playwright browser test verification
    ├── plan.yaml            # /plan: Structured implementation planning
    ├── security.yaml        # /security: Secret scanning & vulnerability review
    ├── ship.yaml            # /ship: Audit quality, prepare commit & release
    └── tdd.yaml             # /tdd: Test-driven development loop
```

---

## 1. The State Machine Contract (`state.yaml`)

File: [`specs/state.yaml`](file:///d:/23082026/specs/state.yaml)

* **Purpose:** Acts as the shared scratchpad between successive agent invocations or human handoffs.
* **Tracked State Elements:**
  * `active_flow`: Currently active operation (e.g. `execute`, `audit`).
  * `active_decisions`: Immutable architectural decisions agreed upon during execution.
  * `git.hash`: The baseline commit hash when the workflow started (`650f77d`).
  * `handoff.last_terminal_state`: Records the final state (`success`, `blocked`, `exhausted`).

---

## 2. Declarative Recipe Library (`specs/workflows/`)

Each YAML file in `specs/workflows/` defines a standardized slash-command recipe:

| Recipe File | Trigger Command | Required Skills | Verification Step |
| :--- | :--- | :--- | :--- |
| **`ship.yaml`** | `/ship` | `audit-code`, `commit-message`, `release-branch` | `git status --porcelain` |
| **`tdd.yaml`** | `/tdd` | `write-test`, `implement-code`, `refactor` | `pnpm run test:fast` |
| **`e2e.yaml`** | `/e2e` | `playwright-run`, `trace-inspect` | `npx playwright test -c config/build/playwright.config.ts` |
| **`check-stack.yaml`** | `/check-stack`| `env-check`, `package-audit`, `port-check` | `pnpm run check:layout` |
| **`security.yaml`** | `/security` | `scan-secrets`, `audit-deps` | `node scripts/general/scan_secrets.mjs` |
| **`build-fix.yaml`** | `/build-fix` | `diagnose-ts`, `patch-ast` | `pnpm run build:site` |

---

## 3. Evaluation & Value Assessment

1. **High Quality Governance:** The recipes enforce the "make the smallest sound change" and "zero-unobserved-state" rules defined in `AGENTS.md`.
2. **Terminal State Safety:** Forbids indefinite loops by requiring the agent to declare an explicit terminal state (`success`, `no-op`, `blocked`, `exhausted`).
3. **Observation:** Some skills referenced in the workflows (e.g. `release-branch`, `audit-code`) are conceptual recipe roles that map directly to the safe workflows in `.agents/skills/safe-change/`.
