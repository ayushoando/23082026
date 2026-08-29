---
name: oando-master
description: Master router and completion contract for the oando1408 repo. Activate this FIRST on any repo task. It decides which repo skill, command, or power to use, and defines what "done" means so work actually finishes. Use when starting any task, unsure which skill applies, or before declaring work complete.
---

# oando Master Skill

`.kiro/skills/oando-master/SKILL.md` is the canonical repository-local Kiro skill workflow for Repository Task routing and completion criteria. When a Repository Task begins, read this workflow first for routing guidance and completion criteria; use the Referenced Skill Guidance for domain-specific instructions. Authority order remains: current user instruction → live repository evidence and fresh command output → `AGENTS.md` → `Agents/` → `docs/`.

## Prime directive: finish the work

Make the smallest sound change that meets the user's goal. Use the narrowest valid proof, retain exact evidence, and stop when the user’s acceptance criteria are met.

## Test and gate authorization

Tests, gates, coverage, browser-test runners, and test-like static checks are user-owned by default. An agent may execute one only when both conditions hold:

1. The user explicitly authorizes that command in the current session.
2. An enabled pre-execution `block-agent-tests` hook permits the tool call.

The current live hook is enabled and uses `PreToolUse` for `execute_pwsh` and
`control_pwsh_process`, so it enforces the second condition before agent shell
execution. If the hook denies a command, do not retry, bypass, weaken, or remove
it; provide the exact command for the user to run directly instead.

## Step 1 — Route the task

| The task is about... | Use this skill | Typical validation |
|----------------------|----------------|--------------------|
| Where does X live / orienting | `repo-map` | graph inspection when needed |
| Shared-code changes or impact analysis | `graph-impact` | graph-impact analysis |
| CSS, tokens, Tailwind, `site/focss/**` | `focss-css` | `verify:focss`, token checks when authorized |
| Studio/Planner code, imports across forks | `fork-boundaries` | `scan:boundaries` when authorized |
| SQL, schema, migrations, choosing a DB | `db-migrations` | migration dry-run when authorized |
| An evidenced condition matches an Additional Repository Skill | the matching Additional Repository Skill | that guidance's applicable validation |

Route to the Referenced Skill Guidance for every applicable row when conditions overlap; do not discard a matching route. An Additional Repository Skill is conditional on evidence of a match—do not assume a fixed inventory or default route. If no row applies, this completion contract still governs.

## Step 2 — Route to a power only when the repo cannot answer

Start with Local Evidence: repository documentation, source files, configuration, and fresh command output. The Installed-Power Registry is the source of truth. The names below are candidate-Power guidance, not installation or availability evidence.

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

Apply these decisions in order:

1. Use Local Evidence first. If it answers the Repository Task need, do not select a Power.
2. Only when Local Evidence is insufficient, consult the Installed-Power Registry before considering a Candidate Power.
3. When the registry confirms a needed Power, present it as an optional specialized capability; do not activate it automatically.
4. When the registry does not confirm a Candidate Power, do not represent it as installed or activate it; continue with Local Evidence and applicable Referenced Skill Guidance.
5. When a Repository Task requests Power activation, require Installed-Power Registry confirmation before activation. No Power is activated automatically by this workflow.

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
