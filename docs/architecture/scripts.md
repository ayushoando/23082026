# Script and command reference

This reference explains where command names and script behavior are owned. It does not duplicate a volatile per-file inventory or claim that a declared command passes.

## Authorities

| Need | Owning source |
|---|---|
| Root `pnpm run <name>` commands | [`package.json`](../../package.json) |
| Long-tail operations | [`scripts/run-ops.mjs`](../../scripts/run-ops.mjs) |
| `scripts/general/` membership policy | [`scripts/general/README.md`](../../scripts/general/README.md) |
| Deploy, migration, backup, and recovery procedure | [`OPERATIONS_RUNBOOK.md`](../../OPERATIONS_RUNBOOK.md) |
| Validation evidence and authorization | [`Testing-handbook.md`](../../Testing-handbook.md) |
| Generated command inventory | `generated-documents/` (derived; not authority) |

## Script families

| Path | Role |
|---|---|
| `scripts/general/` | Repository checks, audits, environment helpers, and build support |
| `scripts/AsNeeded/` | Focused maintenance and inspection utilities |
| `scripts/lib/` | Shared script-only helpers |
| `scripts/generate-svg/` | SVG pipeline implementation and fixtures |
| `scripts/codemods/` | Explicit source transformations |
| `scripts/run-ops.mjs` | Operations dispatcher |

A file's presence or name does not prove that it is safe, current, reachable, or successful. Inspect callers and owning configuration before changing or documenting behavior.

## Command rules

- Work from the repository root and use `pnpm`.
- Use `pnpm run <key>` for root scripts and `pnpm run ops <key> [-- args]` for Ops routes.
- Do not use `npx` or install dependencies in `site/`.
- A command is `configured` when declared, `observed` only after an authorized completed run, and `pending` when unrun or blocked.
- Tests, typechecks, gates, builds, browser checks, coverage, and test-like checks require exact current-session authorization and enabled-hook permission.
- `scripts/tsconfig.json` is currently present and root `package.json` declares `typecheck:scripts`; this is static availability, not a pass result.

## Updating this reference

When a command changes, update the owning dispatcher first, then correct only the procedure or reference documents that depend on it. Keep generated inventories generated, and never convert old output into current validation evidence.
