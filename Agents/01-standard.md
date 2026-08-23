# Standard

## Bar

- Root `AGENTS.md` wins.
- Smallest sound change. Preserve unrelated work.
- No handwritten `any`.
- Before acting: `START.md` · the relevant how-to · MEMORY ethics (session summary ≠ substitute).

## Execution

- Repo root only. **No worktrees.**
- **Agents:** Max 1 agent only — strictly single-agent execution; no parallel agents or fan-outs.
- **pnpm** from root only — never inside `site/` or `tech-docs-generator/`.
- Secrets only in `.env.local` / `site/.env.local` when required.
- Do not invent product behavior. Every how-to has **Goal · Files · Run · Expect · Evidence · Acceptance**.

## Evidence

- Live code + fresh commands decide PASS/FAIL.
- Do not claim browser outcomes from unit tests alone.
- Optional raw dumps: `results/` only (never ship as PASS proof).
- `pnpm run test` prints **two** lane summaries; one is not the suite.
- Calling a failure pre-existing requires a baseline run at the prior commit.

## Types

- No handwritten `any` — including "the generated types lag" escape hatches. Those
  casts hid a live bug where `ensurePlannerProfile` wrote columns `profiles` does
  not have, failing every production Planner save. Regenerate the types instead:
  `pnpm run db:types:admin`, `pnpm run db:types` (root `package.json` scripts wrapping
  the ops runner per `AGENTS.md` §7).
