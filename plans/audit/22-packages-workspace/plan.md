# Plan — Packages & Workspace

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Repair the broken workspace prerequisites and collapse the lockfile duplication.

## Actions (prioritized)
1. **Med** Fix `db:types` in root `package.json` — the global `supabase` CLI is not in devDependencies nor the lockfile, so it breaks on clean machines/CI; add it or a managed wrapper.
2. **Med** Remove `embla-carousel-autoplay` from root dependencies — zero references across `site/` (`site/components/shared/ShowcaseCarousel.tsx` uses `useEmblaCarousel` only, no plugins).
3. **Med** Add `workers/oando-worker-proxy` to `pnpm-workspace.yaml` and delete its npm `package-lock.json` (user-confirmed deletion required), or at minimum document the manual `npm install` prerequisite for `worker:*` scripts.
4. **Med** Remove dead `turbo.json` (no turbo binary anywhere in the graph; `dev:turbo` is Next's Turbopack) — user-confirmed deletion required; drop the `dev:turbo` script from root `package.json`.
5. **Med** Remove the dead `zod ^4.4.3` devDep from `tech-docs-generator/package.json` (zero imports) to collapse zod to one lockfile copy.
6. **Low** Bump tech-docs `framer-motion` to `^13` and `happy-dom` to `^20.12.0`; handle the three orphan scripts `tech-docs-generator/scripts/inventory.mjs`, `tech-docs-generator/scripts/check-renderer-parity.mjs` (wire it into `gate.mjs` instead), duplicate `tech-docs-generator/scripts/generate-coverage-report.mjs` — script deletion requires user confirmation.
7. **Low** Document the tri-sync of the `@planner/*`/`@studio/*` aliases (`site/tsconfig.json`, `tests/vitest.config.ts`, next.config) as a single upgrade checklist.

## Verification
- `pnpm install` — lockfile drops the duplicated zod/framer-motion/happy-dom copies; owner authorization required.
- `pnpm run db:types` — succeeds on a clean machine; `pnpm run gate:fast` — owner authorization required.
