# 8 · Agent workspace

[← Docs, governance, and planning](07-docs-governance-planning.md) · [Next: local/generated/environment →](09-local-generated-environment.md)

Two layers steer agents. Neither is product code, and neither is stored in the repository checkout beyond the in-repo docs.

## In-repo guidance (versioned, authoritative order)

| Path | Role |
|---|---|
| `AGENTS.md` | process floor - authority order, safety, validation routes |
| `Agents/INDEX.md` + `Agents/01..07-*.md` | task handbooks (standard, testing, browser, failures, docs, architecture, css) |
| `docs/` | durable facts (architecture, database, governance) |
| `plans/` | active coordination only - never a durable-fact source |
| `.github/instructions/*.md` | editor-scoped rules for focss, testing, boundaries, migrations |

## Agent tooling layer (user machine, not the repo)

opencode is configured globally under `~/.config/opencode/`: `opencode.jsonc` (permissions, plugins), `skills/oando-*` (repo-map, testing, focss-css, databases, browser-ui), `command/` (`/gate`, `/boundaries`, `/db-dry`). Guardrails deny drifted generic skills, edits under `results/**` and the legacy `site/data/storage/`, and `git worktree`. Presence of a file proves nothing about runtime capability - never claim a skill, command, plugin, or connection is active without observing it this session.

## Capability decisions

Prefer the least powerful option: repo docs first, a skill for repeatable local procedure, a command for a common invocation, an MCP only for a reviewed recurring need for live external data. Keep tests and gates user-authorized per the `AGENTS.md` floor.

## Multi-agent rule

At most four agents, disjoint file ownership, serial integration; never worktrees.
