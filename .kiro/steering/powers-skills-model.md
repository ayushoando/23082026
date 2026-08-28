---
inclusion: always
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

## Specs and Quick Spec
- Kiro's **Quick Spec** is a built-in session workflow, not a repository skill or
  custom-agent preset. It generates `requirements.md`, `design.md`, and
  `tasks.md` in one pass. Use the Quick Spec workflow from Kiro's workflow picker:
  <https://kiro.dev/docs/specs/quick-spec/>.
- Kiro's **Requirements-First** option is a Feature Spec workflow. It is the
  gated requirements -> design -> tasks flow, not an agent named
  `feature-requirements-first-workflow`:
  <https://kiro.dev/docs/specs/feature-specs/requirements-first/>.
- `feature-requirements-first-workflow` is not a documented Kiro built-in agent,
  subagent, preset, or skill. Do not invoke it or add a seventh repository skill
  to emulate it; the six-skill candidate set is distinct from the mandatory `oando-master` router. Repository spec artifacts belong under
  `plans/ref/<name>/`.

## In this workspace
- In this workspace, the installed powers are discoverable from the global installed-power registry and their MCP servers from the global Kiro MCP settings. The repository-local `oando-workflow` power intentionally ships an empty `mcp.json` and routes to those global servers; do not populate the local manifest.
- Repository tests and gates are user-invoked only. Do not load `verify-and-gate` for automatic validation, do not enable automatic test hooks, and do not run test-like shell commands. The `block-agent-tests` hook remains an unconditional hard block because its PreToolUse payload cannot safely represent a trusted user-invocation exception.

## Kiro configuration boundary — hard rule
- Any repository change that configures, extends, repairs, or documents Kiro must be made under `.kiro/` only.
- Do not create or modify Kiro configuration, steering, hooks, agents, skills, powers, or related repository guidance outside `.kiro/`.
- This boundary governs repository file changes; it does not prohibit reading official Kiro documentation or using the Kiro CLI.
