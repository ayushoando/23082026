---
inclusion: manual
---

# Kiro Configuration Index

Canonical inventory for repository-root `.kiro/`. Kiro-owned configuration and supporting implementation belong here; application, test, authority, plan, documentation, and infrastructure files remain referenced at their established repository paths.

## Steering

| File | Inclusion | Purpose |
|---|---|---|
| `agent-behavior.md` | always | Authority, coordination, and execution behavior |
| `ai.md` | fileMatch | AI/Mastra/retrieval work |
| `api.md` | fileMatch | API, auth, security, and rate-limit work |
| `coding-standards.md` | always | Repository coding standards |
| `database.md` | fileMatch | Supabase/Drizzle/migration routing |
| `deployment.md` | fileMatch | Vercel, Worker, and R2 deployment |
| `graph-layer.md` | manual | Import graph guidance |
| `ltm-memory-format.md` | fileMatch | LTM data format |
| `ltm-operations.md` | fileMatch | LTM operational routing |
| `nova-act-viewport.md` | manual | Browser viewport guidance |
| `product.md` | always | Product and user context |
| `seo.md` | fileMatch | SEO and related analytics |
| `tech-stack.md` | always | Current application/toolchain stack |
| `testing.md` | fileMatch | Test-source conventions |
| `ui-css.md` | fileMatch | FOCSS/UI conventions |
| `INDEX.md` | manual | This canonical inventory |

## Agents

Five focused definitions are retained:

| Agent | Role |
|---|---|
| `spec-task-runner` | Coordinator/general approved spec execution and integration |
| `spec-task-runner2` | Second coordinator/general executor, sharing Tasks 7-10 with spec-task-runner; never writes the same path concurrently |
| `containment-reconciler` | Governance and MCP containment reconciliation |
| `hook-localizer` | Hook configuration and enforcement localization |
| `capability-powers-author` | MCP settings and observability/analytics/security powers |

Maximum active agents: five. Their write scopes do not overlap during a parallel wave, except spec-task-runner and spec-task-runner2 which share a scope but never write concurrently.

## Skills

`db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `oando-master`, `planner-studio`, `powers-skills-model`, `repo-map`, and `verify-and-gate`.

## Powers

Kiro does not auto-discover workspace powers. Package sources live under `power-packages/` and must be imported through the Powers panel (Add Custom Power → import from folder).

| Package | Purpose |
|---|---|
| `power-packages/oando-workflow` | Master repository router |
| `power-packages/observability` | OTel, metrics, client errors, blockers |
| `power-packages/analytics` | Consent, events, queue, conversions, KPIs |
| `power-packages/security` | Layered auth/security controls and owner-owned checks |

Each package contains `plugin.json` plus `skills/<name>/SKILL.md`. All four are routing-only, so none contains `mcp.json`. Add `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"` to each `plugin.json` manually.

`powers/` holds the previous legacy `POWER.md` documents, retained for reference during transition.

## Hooks and helper

| Hook | Trigger | Enabled | Action |
|---|---|---:|---|
| `block-agent-tests.json` | `PreToolUse` (`execute_pwsh|control_pwsh_process`) | yes | `node .kiro/hooks/block-agent-tests.mjs` |
| `domain-fast-check.json` | `PostFileSave` | yes | Boundary or FOCSS/UI checks; otherwise pass-through |
| `ltm-postturn-capture.json` | `Stop` | yes | LTM capture command |
| `session-start-orient.json` | `SessionStart` | yes | Agent orientation prompt |

`block-agent-tests.mjs` is the canonical local helper. It blocks prohibited agent shell commands before execution; it does not intercept commands the owner runs directly.

## Settings and MCP schemas

- `settings/lsp.json` — language-server configuration.
- `settings/mcp.json` — workspace MCP configuration; `mcpServers` is empty. The optional schema declaration remains pending because the protected settings write was denied; this does not change server count.
- `mcp/chrome-devtools/` — 29 tracked schema files copied with path/hash parity.
- `mcp/cloudflare-docs/` — 2 tracked schema files copied with path/hash parity.
- `mcp/github/` — 91 tracked schema files copied with path/hash parity.
- `mcp/tasks/` — 6 tracked schema files copied with path/hash parity.

Schema presence does not prove workspace configuration or runtime installation. Runtime availability was not verified.

## Governance tooling

`kiro-repo-guidance-setup/` is canonical and contains 25 top-level TypeScript modules plus 43 tests. `README.md` describes the boundary; `RECONCILIATION.md` records byte-level comparison with the abandoned outside copy.

## Removal and reversal ledger

Removed generic bundle: skills `ai-framing`, `ai-framing-template`, `claude-code-workflow`, `deep-research`, `prd`, `prfaq`; their six mirrored agent guides; `steering/product-workflow.md`; and two workflow HTML templates.

Deleted duplicate steering: `product-context.md`, `spec.md`, and `spec-guide.md`.

Outside duplicate cleanup is parity-ready but pending explicit owner confirmation:

- `scripts/kiro-repo-guidance-setup/` — all 68 files reviewed; 51 byte-identical and 17 relocation-only differences rejected.
- `scripts/general/block-agent-tests.mjs` — valid behavior preserved in the canonical helper; undefined `BLOCKED` defect repaired locally.
- root `mcp/{chrome-devtools,cloudflare-docs,github,tasks}/` — exact per-tree relative-path and SHA-256 parity established under `.kiro/mcp/`.

These paths are historical/deletion records, not active runtime routes.

## Validation status

Static configuration inspection is not behavioral validation. Tests, typechecks, gates, coverage, builds, browser checks/runners, and local services remain owner-authorized. Until required checks have observed results: **Configuration changes complete; mandatory repository validation pending owner execution/authorization.**
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.