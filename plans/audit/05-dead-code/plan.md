# Plan — Dead Code & Orphaned Modules

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Remove the three verified-orphaned modules per the repo's user-confirmed, per-path deletion policy.

## Actions (prioritized)
1. **Med** Delete `site/components/pwa/ServiceWorkerRegister.tsx` — user-confirmed deletion required; zero importers and it registers `/sw.js`, which does not exist in `site/public/` (double-dead PWA leftover).
2. **Low** Delete `site/components/home/Hero.tsx` (204 lines, h1-bearing) — user-confirmed deletion required; homepage uses `HomepageHero` (`site/app/(site)/page.tsx:4,49`); then drop its 4 entries from `config/quality/style-token-baseline.json:15`.
3. **Low** Resolve `site/lib/images/optimizerMode.ts` — user-confirmed deletion required, or wire it into `config/build/next.config.js:30` to kill the tested-but-unwired drift risk.

## Verification
- `pnpm run typecheck`, `pnpm run test`, `pnpm run gate:fast` — deletions are per-path and git-recoverable; gate runs require owner authorization.
