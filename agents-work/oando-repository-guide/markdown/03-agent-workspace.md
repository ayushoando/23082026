# 03 · Agent workspace

[← Product domains](02-product-domains.md) · [Back to start](../README.md)

Two layers steer agents. Neither is product code. How to drive repository work: plain language in, routed and evidenced out.

## In-repo guidance (versioned, authoritative order)

| Path | Role |
|---|---|
| `AGENTS.md` | process floor — authority order, safety, validation routes |
| `Agents/INDEX.md` + `Agents/01..07-*.md` | task handbooks (standard, testing, browser, failures, docs, architecture, css) |
| `docs/` | durable facts (architecture, database, governance) |
| `plans/` | active coordination only — never a durable-fact source |
| `.github/instructions/*.md` | editor-scoped rules for focss, testing, boundaries, migrations |

## Agent tooling layer (user machine, not the repo)

opencode is configured globally under `~/.config/opencode/`: `opencode.jsonc` (permissions, plugins), `skills/oando-*` (repo-map, testing, focss-css, databases, browser-ui), `command/` (`/gate`, `/boundaries`, `/db-dry`). Guardrails deny drifted generic skills, edits under `results/**` and the legacy `site/data/storage/`, and `git worktree`. Presence of a file proves nothing about runtime capability — never claim a skill, command, plugin, or connection is active without observing it this session.

## Capability decisions

Prefer the least powerful option: repo docs first, a skill for repeatable local procedure, a command for a common invocation, an MCP only for a reviewed recurring need for live external data. Keep tests and gates user-authorized per the `AGENTS.md` floor.

## Modes

| Mode | Use |
|---|---|
| Vibe | read-only questions, tiny prose fixes |
| Plan | multi-step changes, write nothing |
| Spec | requirements -> design -> tasks work |
| Autopilot | route selected, user approves each protected step |
| Supervised | mandatory for DB applies, deploys, security/auth, secrets, deletes, backups, unfamiliar areas |

## Start a task from an outcome

State one ordinary-language sentence. The agent then, before modifying anything, applies the authority order, restates the outcome with an action verb and the inferred surface/domain, picks exact first-evidence paths, selects one D01–D22 row from the [guide index](../README.md), loads matching `oando-*` skills (recording rejected/no-match reasons; Local Evidence when nothing matches), chooses a mode from risk and scope, classifies every proposed command (table below), declares artifact placement for output-producing work, and asks only unavoidable Owner Decisions.

## Command classes

| Class | Rule |
|---|---|
| read-only inspection | free |
| Normal-Agent Eligible Check | exact named non-mutating check (`check:layout`, `scan:boundaries`, `verify:focss`, dry-runs) — only when the user authorized it this session |
| Protected Command | gates, tests, coverage, builds, browser runners, DB actions, deploys, backups, local services — needs exact current-session authorization; `pnpm run gate` is never a default |
| no-run pending authorization | anything lacking the above — report pending with the exact command |

A refused command is final: never retry, bypass, or weaken; hand the exact command to the user.

## Records

Route Record (before modification) and the Plain-Language Response Contract are defined on the [start page](../README.md); do not restate them per task. Surface Status values: `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, `legacy`; add a Coverage-Gap Admission when end-to-end proof is absent. A unit result is not browser proof; disk evidence is not hosted persistence; one vitest lane is not the suite.

## Prompt recipes

Append nothing — the rules above already apply.

```text
Map [feature] from its user-facing route through UI, logic, API, persistence,
tests, and operational risks. Do not change code yet.
```

```text
Fix [outcome] in [surface]. Route through AGENTS.md, show the Route Record,
classify commands, stop before any Protected Command.
```

```text
You may run only `pnpm run [exact-script]` from the repository root and report
the result. Run nothing else.
```

```text
Plan the migration for [schema change]: which database owns it, rollback,
grants/policies, types regeneration. Dry-run commands only, preview first.
```

```text
Review this change set for boundary violations and style-token drift, read-only,
report findings with file:line.
```

```text
[Result/audit task] Write outputs only under ./results/[purpose]/ or the approved
agents-work subfolder; state Artifact Class before writing.
```
