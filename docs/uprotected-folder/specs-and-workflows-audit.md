# Agent Specifications & Workflow Recipes (`specs/`) Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `specs/state.yaml` and `specs/workflows/` directory listed live.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| `specs/state.yaml` exists | Claimed | ✅ **Confirmed** |
| 8 workflow YAML files | Claimed | ✅ **Confirmed** — exactly 8: `build-fix.yaml`, `check-stack.yaml`, `code-review.yaml`, `e2e.yaml`, `plan.yaml`, `security.yaml`, `ship.yaml`, `tdd.yaml` |
| `state.yaml` `active_flow: execute` | Claimed as `execute` | ✅ **Confirmed** — live `state.yaml` has `active_flow: execute` |
| `git.hash: 650f77d` | Claimed | ✅ **Confirmed** — `git.hash: 650f77d` still in `state.yaml` |
| `handoff.last_terminal_state: success` | Claimed | ✅ **Confirmed** |
| "Table shows 6 recipe files" | Listed 6 in table (no `code-review.yaml`, `plan.yaml`) | ⚠️ **INCOMPLETE** — Table only covers `ship.yaml`, `tdd.yaml`, `e2e.yaml`, `check-stack.yaml`, `security.yaml`, `build-fix.yaml`. `code-review.yaml` and `plan.yaml` exist but were omitted from the description table. |
| `active_decisions` content | Not shown | **NEW** — Live `state.yaml` shows: `"Standard Recipe Library registered with 8 workflow YAMLs"` and `"Terminal-state taxonomy (success, no-op, blocked, exhausted) enforced"` |
| `next_skill: survey-context` | Not mentioned | **NEW** — Live `state.yaml` has `next_skill: survey-context` in handoff block |

---

## 1. Live `specs/state.yaml` (Confirmed)

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

**Note:** `git.hash: 650f77d` was the baseline at workflow creation. Current HEAD may differ — this hash is stale if commits have been made since. The state machine does not auto-update on commit.

---

## 2. Declarative Recipe Library — Complete Table (All 8 Workflows)

| File | Trigger | Verification Step | Coverage in Prior Report |
| :--- | :--- | :--- | :--- |
| `ship.yaml` | `/ship` | `git status --porcelain` | ✅ Listed |
| `tdd.yaml` | `/tdd` | `pnpm run test:fast` | ✅ Listed |
| `e2e.yaml` | `/e2e` | `npx playwright test -c config/build/playwright.config.ts` | ✅ Listed |
| `check-stack.yaml` | `/check-stack` | `pnpm run check:layout` | ✅ Listed |
| `security.yaml` | `/security` | `node scripts/general/scan_secrets.mjs` | ✅ Listed |
| `build-fix.yaml` | `/build-fix` | `pnpm run build:site` | ✅ Listed |
| **`code-review.yaml`** | `/code-review` | Not specified in prior report | ❌ **Omitted** |
| **`plan.yaml`** | `/plan` | Not specified in prior report | ❌ **Omitted** |

---

## 3. Assessment (Confirmed)

- Terminal state enforcement and "smallest sound change" alignment with `AGENTS.md` are correct.
- `specs/state.yaml` is a **point-in-time snapshot** — the `git.hash` is frozen at `650f77d` and becomes stale without manual updates.
- `next_skill: survey-context` in the handoff block suggests the last workflow intended to run a survey-context skill as the next step — this has not been executed.
