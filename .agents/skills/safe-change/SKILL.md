---
name: safe-change
description: Make user-approved repository changes with explicit scope and reversible preflight. Use for recovery-sensitive work or whenever the user requests tightly controlled edits.
---

# Safe Change

Use this skill to keep a requested change contained. It does not broaden the user’s authority.

## Control state

- Treat `wait`, `pause`, `read-only`, `do not write`, and equivalent wording as an immediate stop on all writes. This includes generated images, external mutations, and commands that create caches, builds, coverage, or test artifacts.
- Stay read-only until the user explicitly lifts that state. A new task that clearly asks to create, edit, or apply a named change lifts it only for that named task.
- Treat “finish” and “complete” as limited to the current directly stated task. They do not authorize work in plans, reports, audits, recovered files, or historical agent output.

## Scope before edits

1. Read the current worktree and the files directly relevant to the request.
2. Name the exact files intended for modification before the first edit. If the user has not authorized a concrete change, return findings without editing.
3. Preserve unrelated changes. Never use destructive Git commands, bulk restoration, deletion, or report-driven changes without the user naming the exact target.
4. Use the repository’s prescribed edit mechanism. Keep the change minimal and owned by the stated task.

## Validation and handoff

- Run a test, build, browser check, or command that may write only when the current user explicitly authorizes that exact command and repository policy permits it.
- Inspect the diff limited to the intended files before reporting completion.
- Report changed files, checks actually run, and blockers separately. Do not claim broader completion than the stated task.
