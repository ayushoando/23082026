---
name: verify-and-gate
description: Correct test and gate sequence for this repo. Use before claiming any change is done, when running tests, or when preparing to ship. Enforces two-lane vitest awareness and persistence-mode mocking.
---

# Verify and Gate

Authority: root `AGENTS.md` and `Testing-handbook.md` win over this skill.

## Sequence (dev loop)
1. Focused tests first:
   `pnpm exec vitest run --config tests/vitest.config.ts <path>`
2. Then fast gate (per-module dev bar):
   `pnpm run gate:fast`
3. Ship bar only when releasing:
   `pnpm run gate`

Always run from repo root with `pnpm`. Never npm/yarn/npx.

## Two lanes
`pnpm run test` runs TWO vitest lanes (default + tech-docs). Each prints its own
summary; a `| tail` keeps only the last. Read BOTH, or the two JSON files under
`results/tests/`. tech-docs lane: `pnpm exec vitest run --config tests/vitest.tech-docs.config.ts`.

## Persistence mode in tests
Vitest sets `DEV_AUTH_BYPASS: "true"` so both persistence selectors resolve to
`supabase`. A route test mocking only disk helpers WILL reach the network. Disk
contract tests must `vi.mock` `plannerPersistenceMode` / `furnitureCatalogMode`.
Production filesystem is read-only — disk-green proves nothing about the live path.

## Honesty
No hollow tests. A partial green is not done. Build interrupted by the environment
is not a successful build. Record blockers in `Failures.md`.

## Powers to activate (agent decides)
- Unit/gate green is not browser proof. For interactive UI, canvas, or route
  visual verification, the agent may activate `nova-act` or `kane-cli` (browser
  QA) against `http://localhost:3000` only (never 127.0.0.1). For production
  observability during debugging, `datadog`. This skill instructs; the agent
  activates, gated by permissions.yaml.
