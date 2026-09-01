# Plan — TypeScript Quality & Tests

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Keep the near-zero suppression debt intact and pre-empt the deprecated Vitest 4 config surface before it breaks the lanes.

## Actions (prioritized)
1. **Med** Replace deprecated `environmentMatchGlobs` with the Vitest 4 successor API in the 3 configs held together by `@ts-expect-error` (`tests/vitest.config.ts` plus the tech-docs and coverage lane configs), so a future Vitest removal is not a break.
2. **Low** Address the `maxWorkers: 4` Windows + lucide-react CJS band-aid in `tests/vitest.config.ts:67-69` — fix at root cause or document as permanent.
3. **Low** Plan the renewal of the 3-file skip allowlist `tests/manifests/skip-exceptions.json` (`planner-comprehensive-audit-browser.spec.ts`, `planner-performance-required.spec.ts:133`, `planner-comprehensive-audit-regression.spec.ts`) before `expires: 2027-09-01`.
4. **Info** No suppression cleanup needed in `site/` — the only pattern is 5 narrow `react-hooks/exhaustive-deps` disables in Studio/Planner hooks, self-audited by `scripts/general/audit-eslint-disable.mjs`.

## Verification
- `pnpm run test` — both vitest lanes green after config changes; owner authorization required.
- `pnpm run test:audit:hollow` and `node scripts/general/audit-eslint-disable.mjs` — audit gates stay clean.
