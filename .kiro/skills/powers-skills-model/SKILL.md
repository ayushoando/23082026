---
name: powers-skills-model
description: Use the powers and skills model to structure reusable agent capabilities and workflows.
---

# Powers, Skills, Steering, MCP — how they relate

Read root `AGENTS.md` first.

Reference model for this workspace. Sourced from Kiro implementer docs
(pact.io/ai_tools/kiro-power, dev.to AWS Serverless Kiro Power). Rephrased for
licensing compliance.

## The four layers

- **MCP server** — an actual tool process or connection. Repository schema files,
  workspace configuration, and runtime availability are separate facts. Workspace
  configuration belongs in `.kiro/settings/mcp.json`; root `mcp/*/tools/*.json`
  schemas alone do not prove that a server is configured or installed.
- **Power** — a capability package with `POWER.md` as its entry point and optional
  steering or tool documentation. A power may route to MCP tools, but it does not
  have to bundle an MCP manifest or server. Its files do not prove runtime
  installation or activation.
- **Steering** — persistent/on-demand project knowledge in `.kiro/steering/`
  (markdown + explicit `inclusion:` front matter such as `fileMatch`, `manual`,
  or `always`).
- **Skill** — a passive, portable markdown package (`SKILL.md`, front matter
  `name` + `description`) following the Agent Skills standard. It provides
  instructions and may include scripts or templates; the agent decides when to
  load it.

## How they interact

1. When activated, a power can route the agent to tools and on-demand guidance;
   a skill supplies passive procedure and domain detail.
2. A skill cannot call an MCP tool or activate a power by itself. The agent reads
   the skill, checks current capability availability, and then performs any
   permitted activation or tool call.
3. Power and skill discovery are independent and on demand. Neither a repository
   directory nor an MCP schema establishes runtime installation.
4. A Kiro Power entry point is `POWER.md`, not `SKILL.md`. Steering may accompany
   it; an MCP connection is optional rather than mandatory.

## Specs and Quick Spec

- Kiro's **Quick Spec** is a built-in session workflow, not a repository skill or
  custom-agent preset. It generates `requirements.md`, `design.md`, and
  `tasks.md` in one pass. Use the Quick Spec workflow from Kiro's workflow picker:
  <https://kiro.dev/docs/specs/quick-spec/>.
- Kiro's **Requirements-First** option is a Feature Spec workflow. It is the
  gated requirements -> design -> tasks flow:
  <https://kiro.dev/docs/specs/feature-specs/requirements-first/>.
- This repository retains exactly ten repo-specific skills: `ai-retrieval`, `db-migrations`,
  `focss-css`, `fork-boundaries`, `graph-impact`, `oando-master`,
  `planner-studio`, `powers-skills-model`, `repo-map`, and `verify-and-gate`.
  Kiro spec artifacts live under `.kiro/specs/<name>/`; active plan coordination
  and plan-owned evidence use `plans/<name>/` as defined by `plans/README.md`.

## In this workspace

- The repository-local `oando-workflow` power currently contains `POWER.md` and
  steering only; it does not contain `mcp.json`. Do not invent a local manifest
  or infer global/runtime MCP availability from repository files.
- Check the installed-power registry directly before naming or activating an
  external power. A schema directory or prose reference is not installation
  evidence.
- Repository tests and gates are user-owned. The enabled `block-agent-tests`
  hook uses `PreToolUse` for agent shell tools and invokes
  `.kiro/hooks/block-agent-tests.mjs`, so prohibited commands are blocked before
  execution. Do not retry, bypass, weaken, or remove a denial.

## Kiro configuration boundary

- Repository Kiro configuration and supporting Kiro implementation belong under
  the repository-root `.kiro/` directory.
- Referenced application, test, authority, plan, documentation, and infrastructure
  files remain at their established repository paths; referencing them does not
  make them Kiro-owned.
- Do not create competing Kiro guidance or implementation outside `.kiro/`.

Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.