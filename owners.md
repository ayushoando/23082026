# Ownership and coordination

Use this reference to assign repository work without overlapping writes or evidence ownership. Current user instructions, live repository state, [`AGENTS.md`](./AGENTS.md), and [`plans/README.md`](./plans/README.md) control when older coordination guidance differs.

## Ownership rules

- Work from the repository root and never create a worktree.
- Give each active worker an explicit, disjoint path allowlist and one integration owner.
- Do not edit a worker-owned path until that worker stops and the handoff is verified against the live filesystem and diff.
- Serialize dependent work, shared-file integration, development servers, and validation commands.
- Preserve unrelated and pre-existing changes; never reset, clean, or overwrite work you do not own.
- Keep Studio and Planner fork trees isolated. An authorized owner may run `pnpm run scan:boundaries` before committing either tree.

## Document ownership

| Topic | Canonical owner |
|---|---|
| Process floor and authority | [`AGENTS.md`](./AGENTS.md) |
| Active planning coordination | [`plans/README.md`](./plans/README.md) and indexed `plans/<name>/` folders |
| Active hard blockers | [`Failures.md`](./Failures.md) |
| Documentation placement | [`DOC-MAP.md`](./DOC-MAP.md) |
| Validation evidence | [`Testing-handbook.md`](./Testing-handbook.md) |
| Deploy and migration procedure | [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) |
| Product architecture | [`docs/architecture/product-map.md`](./docs/architecture/product-map.md) |

## Handoff requirements

A handoff must identify completed and partial tasks; every created, modified, moved, or deleted file; static commands and observed results; integration corrections; blockers and out-of-scope needs; and confirmation that no unowned file was modified. Historical handoffs belong in [`HANDOVER.md`](./HANDOVER.md) and never prove current state.

## Validation ownership

Tests, typechecks, gates, builds, browser checks, coverage, and test-like documentation commands require the current user's exact-command authorization and enabled-hook permission. One owner runs an authorized command at a time and records the command, repository-root working directory, exit status, scope, and redacted result. An unrun command is pending, not passed.
