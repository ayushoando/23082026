---
inclusion: manual
---

# Powers, Skills, Steering, MCP — how they relate

Reference model for this workspace. Sourced from Kiro implementer docs
(pact.io/ai_tools/kiro-power, dev.to AWS Serverless Kiro Power). Rephrased for
licensing compliance.

## The four layers

- **MCP server** — the actual tools (live connections). Registered in
  `~/.kiro/settings/mcp.json`; Power servers live under `powers.mcpServers`.
- **Power** — an ACTIVE agent bundle. Kiro-native structure:
  `POWER.md` (entry point: frontmatter with `name`/`keywords`, tool docs, best
  practices) + `mcp.json` (MCP connection) + `steering/` (on-demand guidance).
  Detects relevant work by keyword, runs onboarding, routes context, calls the
  MCP tools.
- **Steering** — persistent/on-demand project knowledge in `.kiro/steering/`
  (markdown + `inclusion:` frontmatter: `fileMatch` | `manual` | always).
- **Skill** — a PASSIVE, portable markdown package (`SKILL.md`, frontmatter
  `name`+`description`) following the Agent Skills standard. Instructions,
  scripts, templates. Loads by description match or `/` slash command.

## How they interact

1. Power is the active layer; a skill is passive reference. A power DRAWS ON
   skills for deeper detail (language/CLI/schema examples) — not the reverse.
2. A skill cannot call an MCP tool or activate a power by itself. It is markdown.
   The AGENT reads the skill, then activates the relevant power / calls MCP as the
   skill's procedure directs.
3. Chain: prompt -> agent loads matching skills (instructions) + powers (tools) ->
   agent executes, using power/MCP tools as the skill instructs.
4. Installed separately: Import a Power (GitHub/marketplace) vs Import a skill
   (GitHub). Both load on-demand to keep context lean.
5. Note: a Kiro Power entry point is `POWER.md` (not `SKILL.md`) and bundles
   steering, not skills. The Claude Code equivalent uses `SKILL.md` + `.mcp.json`.

## In this workspace
- Powers (postman, datadog, supabase-hosted, exa, context7, cubic, cloudinary,
  nova-act, kane-cli, design-system-power-builder, ltm-power) carry their own MCP
  config + activation keywords.
- Workspace skills (`.kiro/skills/`: repo-map, graph-impact, verify-and-gate,
  fork-boundaries, focss-css, db-migrations) are passive instruction. They tell
  the agent to run repo tooling (`scripts/graph-impact.mjs`, `pnpm` gates) or, when
  needed, to activate a power. Power activation is gated by `permissions.yaml`.
