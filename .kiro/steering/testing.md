---
inclusion: fileMatch
fileMatchPattern: "tests/**,config/build/playwright*,**/vitest*"
---

# Testing Domain

## Stack
- **Unit/Integration**: Vitest (two lanes: default + tech-docs)
- **E2E**: Playwright (`@playwright/test`, `@axe-core/playwright`)
- **DOM environment**: happy-dom (not jsdom)
- **Coverage**: `@vitest/coverage-v8`
- **Config**: `tests/vitest.config.ts`, `tests/vitest.tech-docs.config.ts`, `config/build/playwright.config.ts`

## Conventions
- Two Vitest lanes — always check both: `pnpm run test` runs both sequentially.
- DOM tests use happy-dom. Never switch to jsdom without explicit reason.
- Playwright accessibility tests: `pnpm run test:a11y`.
- Test file naming: `*.test.ts` / `*.test.tsx` / `*.spec.ts`.
- No hollow tests (tests that pass without meaningful assertions) — audited by `test:audit:hollow`.

## Checks (user-invoked only)
The user runs these checks explicitly; agents do not run tests, coverage, browser-test runners, or gates automatically.
```
pnpm run p0:unit
pnpm run typecheck:tests
```

## Priority tiers
- P0: auth, planner, studio core (`p0:unit`)
- P7: admin API, storage, ops pages (`test:priority-7`)
- P8: SEO, security, env (`test:priority-8`)

## Loop pattern
When the user requests validation: run the requested command, fix failures, and report the exact result. Do not execute an automatic test loop or final gate.

## Graph-layer integration
Inspect imports and dependents directly from the live source tree to identify covering test files, then report the scoped command to the user.
