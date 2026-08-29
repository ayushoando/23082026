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


## D20 — Kiro, skills, Powers, MCP, and agents card

- **Goal:** Route repository-local Kiro work through the least powerful confirmed capability and distinguish static files from runtime availability.
- **Start Paths:** `./.kiro/`; `./.kiro/skills/`; `./.kiro/agents/`; `./.kiro/mcp/`; `./.kiro/settings/mcp.json`; `./.kiro/hooks/`; `./skills-lock.json`; `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`.
- **Scope:** Skills, steering, agents, powers, MCP schemas/configuration, hooks, specs, inventory, and capability routing.
- **Evidence Steps:** Read authority; inspect the listed paths; compare file presence with actual configuration/registry evidence; classify capability/enforcement risk; record route and availability limitation.
- **Allowed Actions:** Read-only inventory and prose guidance in approved owned paths.
- **Forbidden Actions:** Hook/settings/MCP changes, Power activation, external access, agent-definition edits, or treating path presence as installed/connected/enforced.
- **Risk:** Capability, external data, credentials, and enforcement risk.
- **Expected Evidence:** Classification of active/reference/package/generated documents, selected skills, Power registry state, MCP state, and runtime limitation.
- **Next Decision:** Use Local Evidence first; select `powers-skills-model` for capability-packaging questions.

## Conditional repository skill routing

`oando-master` is always first. Select every matching skill:

| Evidence trigger | Required skill |
|---|---|
| Orientation, path, route, feature, or code-location discovery | `repo-map` |
| Shared Code, dependencies, blast radius, or circularity | `graph-impact` |
| FOCSS, Tailwind configuration, tokens, icons, alignment, or visual contract | `focss-css` |
| Planner/Studio route, feature, component, library, hook, store, server, platform, canvas, catalog, persistence, or handoff | `planner-studio` |
| Planner/Studio Fork Tree or cross-import evaluation | `fork-boundaries` |
| Schema, SQL, migration, RLS, grants, rollback, or Supabase ownership | `db-migrations` |
| Skills, steering, Powers, MCPs, agents, or capability packaging | `powers-skills-model` |
| Authorized validation planning after explicit authorization and Hook Permission | `verify-and-gate` |
| `./site/lib/ai/mastra/`, Mastra, Bedrock, LanceDB, Orama, Fuse.js, embeddings, retrieval, advisory, or provider behavior | `ai-retrieval` only if `./.kiro/skills/ai-retrieval/SKILL.md` exists; otherwise record the missing skill and use Local Evidence plus all other matches |

A non-matching skill is rejected with a plain-language reason. If no skill matches, select Local Evidence and record the no-match reason. These are prose triggers, not an automatic scanner or runtime loader.

## Kiro Markdown inventory baseline

The static Kiro Markdown inventory is exactly **51 paths**: **36 Active Contract-Bearing Documents**, **11 Reference/History Documents**, and **4 Package Documents**. This is a path/classification record, not proof that Kiro loaded, activated, or enforced any document.

| Static class | Count | Current evidence and boundary |
|---|---:|---|
| Active Contract-Bearing | 36 | Includes the five physical files under `./.kiro/agents/`, the nine observed repository-local skill files, the steering/power/routing documents, and `./.kiro/kiro-repo-guidance-setup/README.md`; each path is inventoried individually in the approved task record. |
| Reference/History | 11 | `./.kiro/kiro-repo-guidance-setup/RECONCILIATION.md` plus the ten specification/reference documents under `./.kiro/specs/`; reference status does not make a file active contract coverage. |
| Package Document | 4 | The four `./.kiro/power-packages/*/skills/*/SKILL.md` paths; package presence is not workspace loading or Power installation evidence. |
| Generated Kiro Markdown | 0 claimed | No generated Kiro Markdown is claimed. No Markdown is claimed under `./.kiro/hooks/`, `./.kiro/mcp/`, or `./.kiro/settings/` unless later evidence observes it. External/global Kiro files remain `not-observed`. |

The **12 live guide Markdown work surfaces** are `./agents-work/oando-repository-guide/README.md` and `./agents-work/oando-repository-guide/markdown/01-repository-map.md` through `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`. They are human-authored guide work, separate from the 51-file `./.kiro/**/*.md` inventory. Each inventory entry records path, classification, contract mode (`exact-block`, `canonical-inclusion`, `not-applicable`, or `not-observed`), owner, evidence state, and limitation; it never proves runtime loading.

The five physical Agent definition files remain distinct from the exactly four Active Agent slots: Scout/Map, Planner/Risk, Implementer, and Verifier/Reporter. Coordinator/Serial Integration Owner is attached to one slot, not added as a fifth role. Runtime roster creation, automatic spawning, and universal enforcement remain `guidance-only`/`not-observed`.

The only approved active-document contract forms are the exact full Kiro Agent Contract block or the exact Canonical Inclusion:

```text
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.
```

Reference/History, Package, Generated, inaccessible, and external/global-not-observed documents are not claimed as active contract coverage. The current guidance work does not append contracts to protected Agent definitions, root standards, or other unapproved files.

## Static versus runtime capability evidence

A schema under `./.kiro/mcp/` is not MCP Configuration; an entry under `./.kiro/settings/mcp.json` is not proof of connection/authentication; and a Power folder is not proof that a Power is installed. Confirm a Power through the Installed-Power Registry before presenting it as optional and never activate it automatically. Any external proposal is read-only, least-privilege, owner-approved, and has a fallback.

The five physical Agent definition files are separate from the four Active Agent slots required by Standing Multi-Agent Mode: Scout/Map, Planner/Risk, Implementer, and Verifier/Reporter, with Coordinator/Serial Integration Owner attached to one slot rather than added as a fifth. Preserve `./.kiro/agents/spec-task-runner2.md`. If runtime roster creation, universal pre-action enforcement, or fail-closed denial cannot be observed, report `guidance-only` or `not-observed`; prose is not runtime enforcement.

Use the Plain-Language Response Contract for every Kiro task response. Hook evidence is reported only for the command/tool scope it actually covers and is never generalized to reads, writes, deletes, delegation, or handoffs. Hook changes, contract append, Exact-Line migration, runtime roster/checker, external MCP, Power activation, and automatic spawning remain Separate Approval Work.
