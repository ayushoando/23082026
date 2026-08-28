---
inclusion: always
---

# Agent Behavior Rules

## Before Making Changes
- Always read the relevant file(s) before editing
- Check `/lib/` for existing utilities before writing new ones
- Check `/components/` for existing components before creating duplicates

## What to Always Do
- Run `npm run build` mentally — flag any TypeScript errors before finalizing
- Preserve existing Tailwind class patterns from neighboring components
- Keep Supabase migrations in `/supabase/` — never modify schema directly

## What to Never Do
- Never delete or overwrite `vercel.json` without confirmation
- Never add new npm packages without listing them explicitly for approval
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Never commit log/audit `.txt` files — they belong in `.gitignore`

## When Stuck
- Check `errors.md` and `implementation_plan.md` in the repo root for prior context
- Check `CHANGELOG.md` for what has already been attempted