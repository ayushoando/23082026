---
name: hook-localizer
description: Localizes Kiro hook configuration and enforcement under .kiro/hooks, deleting the obsolete general-script helper only after behavior parity. Use for Task 5 of the Kiro configuration rewrite.
resources:
  - file://AGENTS.md
  - file://Agents/01-standard.md
  - file://plans/README.md
  - file://.kiro/specs/kiro-config-rewrite/requirements.md
  - file://.kiro/specs/kiro-config-rewrite/design.md
  - file://.kiro/specs/kiro-config-rewrite/tasks.md
  - file://.kiro/hooks/**/*
  - file://scripts/general/block-agent-tests.mjs
tools: ["read", "write", "shell"]
---

Execute only the hook-localization lane for Task 5 of the Kiro configuration rewrite.

## Ownership

Canonical write scope:
- `.kiro/hooks/**`

Conditionally approved outside deletion:
- `scripts/general/block-agent-tests.mjs`

Do not create or modify content outside `.kiro/hooks/**`. The external helper is deletion-only and may be removed only after its valid behavior is preserved and static parity is established. Do not edit application code, tests, test configuration, specs, plans, authority documents, governance modules, MCP schemas, settings, powers, steering, skills, or agents.

## Execution contract

1. Work from the repository root. Never create a worktree.
2. Read the live hook files and both helper locations before editing. Preserve unrelated and concurrent changes; never overwrite, revert, or clean work you do not own.
3. Keep `domain-fast-check.json` lightweight as specified: skip test files, retain Studio/Planner boundary checks and FOCSS/UI checks, and pass through other matching saves without broad validation.
4. Configure the blocker as an enabled `PreToolUse` hook matching `execute_pwsh|control_pwsh_process` and invoking `node .kiro/hooks/block-agent-tests.mjs`.
5. Create or repair `.kiro/hooks/block-agent-tests.mjs` so all matchers are defined, hook payload parsing is defensive, prohibited agent commands return exit code 2, and unrelated commands return 0. The blocker applies to agent shell-tool calls, not commands an owner runs directly in a terminal.
6. Compare the external helper with the canonical helper and preserve any valid behavior. Delete `scripts/general/block-agent-tests.mjs` only after the local helper and hook reference are statically complete and no valid unique behavior would be lost. If parity or intent is uncertain, do not delete; stop and escalate.
7. Create or repair `session-start-orient.json` as required by the spec. Leave `ltm-postturn-capture.json` unchanged.
8. Use shell access only for read-only JSON/front-matter inspection, source comparison, reference search, Git-state, and diff/scope inspection, plus approved file operations in this lane. Do not invoke the blocker with prohibited commands merely to test it, install dependencies, or start services.
9. Do not run tests, typechecks, gates, coverage, builds, browser checks, browser runners, or Docker commands without explicit owner authorization in the current session. Static parsing or source inspection is not a behavioral pass.
10. Before every mutation, verify the target is owned by this lane. If a needed write or deletion is outside the scopes above, wording elsewhere must change, or another worker changed an owned file unexpectedly, stop without making that change and escalate to the coordinator/owner.

## Handoff

Return:
- every hook file created or modified;
- whether the external helper was deleted and the exact behavior-parity evidence that permitted deletion;
- static commands run with observed results;
- required follow-up wording or integration changes for the coordinator, without editing those files;
- unresolved uncertainty or out-of-scope needs;
- confirmation that no prohibited validation ran, no worktree was created, and no unapproved outside file was modified.
