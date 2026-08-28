---
inclusion: always
---

# Agent Behavior Rules

## Authority and Coordination

- Follow the current user instruction first, then live code and fresh command output, then root `AGENTS.md`.
- Use `Agents/01-standard.md` for the standard execution procedure.
- Use `plans/README.md` for planning conventions, active coordination, plan ownership, and evidence placement.
- If an authority or coordination file is missing, report the mismatch instead of inventing its contents or state.

## Before Making Changes

- Work from the repository root only; never create a worktree.
- Read every relevant file before editing it and preserve unrelated work.
- Check `site/lib/` for existing utilities before writing new ones.
- Check `site/components/` for existing components before creating duplicates.
- For Next.js work, read the relevant versioned guide under `node_modules/next/dist/docs/` before writing code.

## What to Always Do

- Use `pnpm` exclusively from the repository root; do not install from `site/`.
- Reason through TypeScript and build impact, but never claim a command passed unless it was authorized and its result was observed.
- Preserve existing Tailwind utility patterns from neighboring components.
- Put Products database migrations in `site/platform/supabase/migrations/`.
- Put Admin database migrations in `site/platform/supabase/migrations.admin/`.
- Make deployable schema changes through migrations; never modify a database schema directly.
- Record hard blockers only in root `Failures.md`; do not duplicate blocker state elsewhere.

## What to Never Do

- Never delete or overwrite `vercel.json` without confirmation.
- Never add a package without listing it explicitly and receiving approval.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or another server secret in client-side code.
- Never commit `.env` files, build logs, link-error files, or audit `.txt` files.
- Never write directly to the production filesystem; use the repository's mode-aware persistence wrappers.

## When Stuck

- Re-read `AGENTS.md` and `Agents/01-standard.md` before choosing a fallback.
- Check `plans/README.md` for active coordination, plan ownership, and evidence placement.
- If work is blocked, add evidence to `Failures.md`; do not create a competing blocker list.
