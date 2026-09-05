# Agent Specifications & Workflow Recipes (`specs/`) Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`specs/`](file:///d:/23082026/specs/)  
**Method:** Live file inspection of `specs/state.yaml` and the 8 declarative recipe specifications in `specs/workflows/`.

---

## 1. Specification Machine State (`specs/state.yaml`)

The repository maintains an agentic workflow state file:

```yaml
active_flow: execute
active_epic_id: null
active_story_id: null
active_bug_id: null
active_decisions:
  - "Standard Recipe Library registered with 8 workflow YAMLs"
  - "Terminal-state taxonomy (success, no-op, blocked, exhausted) enforced"
release:
  target_version: null
  last_tag: null
  last_publish: null
git:
  branch: main
  hash: 650f77d
handoff:
  last_step_completed: "Standard recipes created in specs/workflows/"
  last_terminal_state: success
  open_decisions: []
  next_skill: survey-context
```

---

## 2. Declarative Recipe Library (All 8 Workflows)

All eight workflow specifications in [`specs/workflows/`](file:///d:/23082026/specs/workflows/) are active and confirmed:

| Workflow YAML | Trigger Command | Intent / Domain | Canonical Verification Step |
| :--- | :--- | :--- | :--- |
| **`ship.yaml`** | `/ship` | Release verification & gate execution | `git status --porcelain` & `pnpm run gate` |
| **`tdd.yaml`** | `/tdd` | Test-driven development loop | `pnpm run test:fast` |
| **`e2e.yaml`** | `/e2e` | End-to-end browser user journeys | `pnpm exec playwright test -c config/build/playwright.config.ts` |
| **`check-stack.yaml`** | `/check-stack` | Fast layout & workspace sanity | `pnpm run check:layout` |
| **`security.yaml`** | `/security` | Secret scanner & credential audits | `node scripts/general/scan_secrets.mjs` |
| **`build-fix.yaml`** | `/build-fix` | Build repair & standalone compiler | `pnpm run build:site` |
| **`code-review.yaml`** | `/code-review` | Static analysis & boundary check | `pnpm run scan:boundaries && pnpm run lint` |
| **`plan.yaml`** | `/plan` | Task planning & phased decomposition | `pnpm run check:plans-purity` |

---

## 3. Terminal State Taxonomy

Every recipe strictly enforces one of four terminal exit states:
1. **`success`:** Objective achieved; all gates passed cleanly.
2. **`no-op`:** System already in desired state; zero modifications necessary.
3. **`blocked`:** Hard blocker encountered; recorded in `Failures.md`.
4. **`exhausted`:** Retry limit reached without convergence; escalates to operator.

---

## 4. Verification Commands

```powershell
# Validate plan purity
pnpm run check:plans-purity

# Execute standard security scan workflow
node scripts/general/scan_secrets.mjs
```
