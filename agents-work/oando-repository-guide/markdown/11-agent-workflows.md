# 11 · Agent workflows

[← Quality and validation](10-quality-validation.md) · [Back to start](README.md)

How to drive repository work: plain-language in, routed and evidenced out.

## Modes

| Mode | Use |
|---|---|
| Vibe | read-only questions, tiny prose fixes |
| Plan | multi-step changes, write nothing |
| Spec | requirements -> design -> tasks work |
| Autopilot | route selected, user approves each protected step |
| Supervised | mandatory for DB applies, deploys, security/auth, secrets, deletes, backups, unfamiliar areas |

## Start a task from an outcome

State one ordinary-language sentence. The agent then, before modifying anything:

1. Applies the authority order (user > live code > `AGENTS.md` > `Agents/` > `docs/`).
2. Restates the outcome with an action verb and the inferred surface/domain.
3. Picks exact first-evidence paths; never guesses paths.
4. Selects one D01-D22 card (D22 when unfamiliar) from the [guide index](README.md).
5. Loads matching `oando-*` skills (repo-map, testing, focss-css, databases, browser-ui); records rejected/no-match reasons; uses Local Evidence when nothing matches.
6. Chooses a mode from risk and scope.
7. Classifies every proposed command (table below).
8. For output-producing work: declares Artifact Class, target subfolder, filename pattern, owning source, authored-or-generated, rejected placements; applies the Locked Path Gate to every write and the Site Write Gate to `./site/` targets.
9. Asks only unavoidable Owner Decisions.

## Command classes

| Class | Rule |
|---|---|
| read-only inspection | free |
| Normal-Agent Eligible Check | exact named non-mutating check (`check:layout`, `scan:boundaries`, `verify:focss`, dry-runs) - only when the user authorized it this session |
| Protected Command | gates, tests, coverage, builds, browser runners, DB actions, deploys, backups, local services - needs exact current-session authorization; `pnpm run gate` is never a default |
| no-run pending authorization | anything lacking the above - report pending with the exact command |

A refused command is final: never retry, bypass, or weaken; hand the exact command to the user.

## Records

Route Record (before modification): Outcome · Domain card · First evidence paths + reasons · Candidate paths · Skills selected/rejected + reasons · Mode · Risk · Command classification · Artifact placement · Locked Path / Site Write Gate states · Validation state · Owner decisions · Next action.

Response contract (every start, update, handoff, completion), in order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files.

Surface Status values: `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, `legacy`; add a Coverage-Gap Admission when end-to-end proof is absent. A unit result is not browser proof; disk evidence is not hosted persistence; one vitest lane is not the suite.

## Prompt recipes

Append nothing - the rules above already apply.

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
