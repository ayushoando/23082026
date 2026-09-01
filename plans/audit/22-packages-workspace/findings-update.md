# Updated findings — 22-packages-workspace

**Date:** 2026-09-01

## Resolved
- none yet — No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- none

## Remaining (failures / open items)
- 22.1: open — `db:types` still depends on a global `supabase` CLI absent from devDependencies and the lockfile (broken on clean machines/CI).
- 22.2: open — `turbo.json` still dead config; `dev:turbo` still in root package.json.
- 22.3: open — `worker:*` still silently depends on a manual `npm install` inside `workers/oando-worker-proxy` (not a workspace member; split undocumented).
- 22.4: open — ~25 ops commands still mirrored in package.json and the run-ops COMMANDS map (drift-prone).
- Dead dependencies: open — `embla-carousel-autoplay` (root) and `zod ^4.4.3` devDep (tech-docs, zero imports) still installed; zod still duplicated 4.4.3/4.5.4.
- Lockfile duplication: open — framer-motion 12/13, happy-dom 20.11/20.12 (tech-docs specifiers not bumped); uuid 11/14 upstream-pinned.
- tech-docs orphan scripts: open — `inventory.mjs`, unwired `check-renderer-parity.mjs`, duplicate `generate-coverage-report.mjs` unchanged (deletion/wiring needs user confirmation).
- Version-frontier fragility: open — TS 7 / Next 16 / Vitest 4 / Tailwind 4 workarounds and the 3-way `@planner/*`/`@studio/*` alias sync still undocumented.
