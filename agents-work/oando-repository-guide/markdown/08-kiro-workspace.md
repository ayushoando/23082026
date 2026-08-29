# 08 · Kiro workspace

[← Docs, governance, and planning](07-docs-governance-planning.md) · [Next: local/generated/environment →](./09-local-generated-environment.md)

`.kiro/` is the repository-local Kiro control plane. It is not product runtime code.

## Kiro areas

| Path | Role | Important distinction |
|---|---|---|
| `.kiro/skills/` | Reusable repository workflows | Passive instructions selected for matching tasks. |
| `.kiro/steering/` | Persistent/conditional project context | Team rules and architecture guidance for the agent. |
| `.kiro/hooks/` | Event-based enforcement/automation | Can block/ask/perform context actions; preserve safety hooks. |
| `.kiro/specs/` | Kiro requirements/design/tasks artifacts | Structured feature/bug work. |
| `.kiro/agents/` | Custom specialized agent definitions | Agent roles/workflows, not product code. |
| `.kiro/powers/`, `power-packages/` | Reusable capability-package source | A folder does not prove a power is installed/runnable in the client. |
| `.kiro/mcp/` | MCP schemas/tool definitions | Does not prove a server is configured, connected, authenticated, or safe to invoke. |
| `.kiro/settings/` | Workspace settings such as LSP/MCP configuration | Do not overwrite existing configuration without an explicit configuration task. |
| `.kiro/kiro-repo-guidance-setup/` | Repository Kiro setup guidance | Workspace setup/support material. |

## Existing repository skills

| Skill | Use it for |
|---|---|
| `oando-master` | Start/routing/completion contract for repository work. |
| `repo-map` | Orientation and locating code. |
| `graph-impact` | Import/blast-radius analysis. |
| `focss-css` | FOCSS/Tailwind v4/tokens/zones. |
| `fork-boundaries` | Planner/Studio isolation. |
| `planner-studio` | Planner/Studio product work. |
| `db-migrations` | Database ownership/migration/RLS work. |
| `verify-and-gate` | Explicitly authorized validation. |
| `powers-skills-model` | Decide between steering, skill, power, and MCP. |

## MCP and power decision

Use a repository skill/steering file for repeatable local procedure or policy. Consider a power when a recurring workflow needs bundled knowledge and constrained tools. Consider an MCP only for a reviewed, approved, recurring need for live external data/actions unavailable through repository code, scripts, Kiro-native tools, or built-in web research.

```text
Assess whether a skill, steering rule, power, or MCP fits [need]. Prefer the
least powerful option. If external integration is justified, propose read-only,
least-privilege setup and a fallback; do not configure it yet.
```

## Other Kiro-adjacent state

- `ltm/` is local long-term memory/tooling state, not application source.
- `skills-lock.json` participates in skill/workspace lock configuration.
- `.github/instructions/` also contributes task-scoped agent guidance.

Next: [Local, generated, and environment areas](./09-local-generated-environment.md).