---
name: oando-workflow
displayName: OandO Workflow
description: Repo-local workflow power for the oando1408 monorepo. Orient with the import graph and canonical docs, enforce Studio/Planner fork boundaries, respect user-invoked verification, and route to the smallest installed power only when the repo cannot answer.
keywords: ["oando", "map repo", "orient", "blast radius", "impact", "graph", "fork boundary", "studio", "planner", "gate", "verify", "vitest", "focss", "migration", "supabase", "two databases"]
author: "workspace"
---

# OandO Workflow Power

An ACTIVE workflow bundle for this repo. It routes work to the repo's own tooling
and to the smallest relevant installed power. Authority order: user > live code +
fresh commands > AGENTS.md > Agents/ > docs/.

## Companion skills (the agent draws on these)
Passive reference under `.kiro/skills/`:
- `repo-map` — orient via canonical docs + `scripts/graph-impact.mjs`.
- `graph-impact` — blast radius + scoped test command before running the suite.
- `fork-boundaries` — Studio/Planner never import each other; `pnpm run scan:boundaries`.
- `verify-and-gate` — user-invoked focused tests -> `gate:fast` -> `gate`; two vitest lanes.
- `focss-css` — FOCSS-on-Tailwind-v4 tokens and zones.
- `db-migrations` — two-DB routing; `-- rollback`; dry-run first.

## Activation routing (smallest relevant power, or none)
- Repo structure / where-does-X-live -> `repo-map` skill + `graph-impact`. No power.
- Change impact / which tests -> `graph-impact` (`node scripts/graph-impact.mjs --file=<path>`). No power.
- Studio/Planner edits -> `fork-boundaries` + `pnpm run scan:boundaries`. No power.
- Done/ship check -> load `verify-and-gate` only when the user explicitly invokes that skill and asks for tests or gates. Otherwise never load it for automatic validation. Browser proof -> `nova-act` for exploratory human-like checks or `kane-cli` for repeatable browser workflows and screenshots (localhost only).
- CSS -> `focss-css` + `pnpm run verify:focss`. No power.
- Schema/SQL -> `db-migrations`; live DB ops -> `supabase-hosted` (confirm Admin vs Products).
- Complete design-system scaffolding -> `design-system-power-builder`.
- Current official library/framework docs -> `context7`; broad web research -> `exa`.
- API collections/resources -> `postman`; image/video assets -> `cloudinary`.
- Project memory/recall -> `ltm-power`; AI code-review/security-review information -> `cubic-code-review`.
- Production observability -> use Datadog only if it is present in the installed registry; otherwise proceed without an external power.
- Activate only the named power for the user’s concrete need; otherwise use repository tooling or no power.

## Rules
- Skills are passive markdown; the AGENT activates powers/MCP, gated by
  `~/.kiro/settings/permissions.yaml`.
- Do not use an external power when repo docs, the graph, or `pnpm` scripts answer.
- Tests and gates are user-invoked only. The `block-agent-tests` PreToolUse hook is an unconditional hard block because its payload cannot safely represent a trusted user-invocation or `verify-and-gate` exception. Never add or enable an automatic test hook.
- UI only at `http://localhost:3000`. pnpm only. No worktrees. Prod FS is read-only.

## MCP
This power ships no new MCP server; it routes to already-installed power MCPs.
`mcp.json` is intentionally empty (`{}`). See `~/.kiro/settings/mcp.json` for the
installed power servers.
