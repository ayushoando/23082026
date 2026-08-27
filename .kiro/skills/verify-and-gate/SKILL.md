---
name: verify-and-gate
description: Explicit-user-authorized test and gate workflow for this repo. Use only when the user explicitly asks to run tests or gates and the active hook permits execution.
---

# Verify and Gate

USER-EXPLICIT AUTHORIZATION REQUIRED. By default, users run tests and gates themselves. An agent may execute a test-like command only when the user explicitly authorizes that command in the current session **and** the active `block-agent-tests` hook permits it. If the hook denies a command, do not retry or bypass it; provide the exact command for the user instead.

Authority: the current user instruction, active hook state, root `AGENTS.md`, and `Testing-handbook.md` govern execution.

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
  observability during debugging, use an installed Datadog power only when it is
  present in the current registry. This skill instructs; the agent activates,
  gated by permissions.yaml.
