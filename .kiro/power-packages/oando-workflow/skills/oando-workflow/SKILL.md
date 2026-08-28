---
name: oando-workflow
description: Route OandO repository work to the smallest relevant repository skill or capability guide.
---

# OandO Workflow

Authority order: current user instruction, live code and fresh command output, `AGENTS.md`, `Agents/`, then docs.

## Routing

- Repository structure and locations: `.kiro/skills/repo-map/`
- Shared-code blast radius: `.kiro/skills/graph-impact/`
- Studio/Planner separation: `.kiro/skills/fork-boundaries/`
- Tailwind v4 and FOCSS: `.kiro/skills/focss-css/`
- Database ownership and migrations: `.kiro/skills/db-migrations/`
- Implementation planning: `.kiro/skills/planner-studio/`
- Traces, metrics, errors: the `observability` power
- Consent, events, KPIs: the `analytics` power
- Auth, CSP, CSRF, uploads, rate limits: the `security` power
- Tests and gates: `.kiro/skills/verify-and-gate/`, only with explicit owner authorization

## Constraints

Root `pnpm` only. No worktrees. Preserve unrelated work. UI on `http://localhost:3000`. Production filesystem is read-only. Kiro-owned implementation stays under root `.kiro/`.
