---
name: oando-master
description: Master router and completion contract for the oando1408 repo. Activate this FIRST on any repo task. It decides which repo skill, command, or power to use, and defines what "done" means so work actually finishes. Use when starting any task, unsure which skill applies, or before declaring work complete.
---

# oando Master Skill

One entry point for work in this repo. Read this first; it routes work to the right detailed skill and defines completion. Authority order remains: current user instruction → live code + fresh commands → `AGENTS.md` → `Agents/` → `docs/`.

## Prime directive: finish the work

Make the smallest sound change that meets the user's goal. Use the narrowest valid proof, retain exact evidence, and stop when the user’s acceptance criteria are met.

## Test and gate authorization

Tests, gates, coverage, browser-test runners, and test-like static checks are user-owned by default. An agent may execute one only when both conditions hold:

1. The user explicitly authorizes that command in the current session.
2. An enabled pre-execution `block-agent-tests` hook permits the tool call.

The current live hook is disabled and uses `PostTaskExec`, so it provides no
pre-execution enforcement and does not satisfy the second condition. Do not claim
that it blocked or permitted a command. If a future repaired hook denies a
command, do not retry, bypass, weaken, or remove it; provide the exact command for
the user to run.

## Step 1 — Route the task

| The task is about... | Use this skill | Typical validation |
|----------------------|----------------|--------------------|
| Where does X live / orienting | `repo-map` | graph inspection when needed |
| Blast radius before editing shared code | `graph-impact` | graph-impact analysis |
| CSS, tokens, Tailwind, `site/focss/**` | `focss-css` | `verify:focss`, token checks when authorized |
| Studio/Planner code, imports across forks | `fork-boundaries` | `scan:boundaries` when authorized |
| SQL, schema, migrations, choosing a DB | `db-migrations` | migration dry-run when authorized |

If two rows apply, activate both skills. If none apply, this completion contract still governs.

## Step 2 — Route to a power only when the repo cannot answer

Prefer repository documentation and local source first. The installed-power registry is the source of truth. The names below are candidate routes, not installation claims.

| Need | Power |
|---|---|
| Repo-local workflow, fork boundaries, database routing | `oando-workflow` |
| Complete design-system scaffolding | `design-system-power-builder` |
| Exploratory human-like browser automation | `nova-act` |
| Repeatable browser workflows, screenshots, deploy smoke checks, test authoring | `kane-cli` |
| Version-correct official library/framework docs | `context7` |
| Broad live-web research | `exa` |
| Supabase/Postgres/auth/storage/RLS operations | `supabase-hosted` |
| API collection and API resource management | `postman` |
| Image/video asset operations | `cloudinary` |
| Local project memory and recall | `ltm-power` |
| AI code-review/security-review information | `cubic-code-review` |

Activate only capabilities confirmed present in the current registry and only when necessary.

## Step 3 — Validate in the permitted lane

Run the smallest check that proves the specific change. Non-test static inspection may proceed normally; test-like checks require the authorization conditions above.

1. Layout floor: `pnpm run check:layout`
2. Area-specific checks:
   - CSS: `pnpm run verify:focss`, `pnpm run check:style-tokens`
   - Studio/Planner forks: `pnpm run scan:boundaries`
   - Migrations: `pnpm run db:apply -- --dry` or `:admin`
   - Types: `pnpm run typecheck`
   - Lint: `pnpm run lint`
3. Read the changed path and confirm it remains coherent.

If a required test-like check is not currently authorized or permitted, state it precisely as pending user validation rather than inventing a pass.

## Step 4 — Declare done

The task is complete when all applicable conditions hold:

- The user's stated goal is met.
- Every required permitted validation command has an observed result.
- Any validation failure is fixed within scope or explicitly identified as an unrelated blocker with evidence.
- Studio/Planner boundaries remain intact if either fork changed.
- No blocker was introduced; record a true blocker in root `Failures.md` with a repro command.

Report what changed, the exact validation outcomes, and any user-owned command still pending. Never claim a test passed when it did not run, and never claim rendered behavior from static evidence alone. Repo root and `pnpm` only; UI uses `http://localhost:3000`.
