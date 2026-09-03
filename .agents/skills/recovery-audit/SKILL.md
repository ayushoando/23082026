---
name: recovery-audit
description: Audit recovery reports, agent output, and a damaged worktree without changing files. Use when deciding what can safely be restored or completed after agent work went wrong.
---

# Recovery Audit

This is a strictly read-only assessment skill. Its purpose is to make a recovery decision reviewable before any file changes occur.

## Method

1. Read the current worktree status, relevant source, and the named reports or agent output.
2. Separate evidence into: present source of truth, user-owned uncommitted work, generated artifacts, and unverified recommendations.
3. Identify each potential recovery action by exact file, expected result, supporting evidence, risk, and whether the current source already contains it.
4. Produce a proposed recovery set only. Do not apply, delete, move, reset, stage, commit, run tests, or start services.

## Handoff

Require a new explicit user instruction that names the approved recovery set before any modification. When approved, use `$safe-change` for the implementation rather than extending this audit.
