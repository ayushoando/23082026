# 22 — Packages & Workspace Audit

**Workspace reality:** members are root (`.`) + `tech-docs-generator` only (`pnpm-workspace.yaml`). `site/` is **not a package** (no package.json — app dir of the root package). `workers/oando-worker-proxy` is **not a workspace member** — it has its own npm `package-lock.json`, deliberately spared by `cleanup-nested-installs.mjs`, but the split is undocumented in the workspace comment.

## Workers split cost

- Two wrangler tracks: root pnpm `^4.127.1` vs worker npm `^4.123.0` — drift possible between `worker:deploy` and root tooling.
- `pnpm --dir … dev` runs scripts but does not install — `worker:*` silently depends on a manual `npm install` inside the worker dir; CI must remember an extra `npm ci`.
- Cleaner fix candidate: add `workers/oando-worker-proxy` to `pnpm-workspace.yaml` and delete the npm lock (package has no npm-specific needs).

## tech-docs-generator (10 prod + 13 dev deps)

All deps verified imported except: **`zod ^4.4.3` (devDep) has zero imports** — and it is the sole reason `zod@4.4.3` exists in the lockfile next to root's `4.5.4`. Removing it collapses zod to one copy.

- Configs all real and wired: `vite.config.ts` (port **3001** strictPort — off product :3000), `vitest.config.ts` (package-local aliases for mermaid/highlight.js, `maxWorkers: 1`, 120s timeouts justified), own `vercel.json` (deploys as its own Vercel project via `pnpm --filter oando-tech-docs build`).
- `src/pages`: 12 pages, all routed in `App.tsx` — no dead pages.
- **Orphan scripts (zero inbound references):** `scripts/inventory.mjs`, `scripts/check-renderer-parity.mjs` (a full parity checker **not wired into `gate.mjs`** — notable gap), `scripts/generate-coverage-report.mjs` (duplicate of the root-wired copy).
- Fragile-looking: package scripts invoke `node ../node_modules/vitest/vitest.mjs` (bypasses bin shims).

## Root package.json — 100 scripts, wiring unusually clean

Every `node scripts/…` reference across all 100 scripts resolves on disk (12 spot-checks + ops registry). Gaps:

| # | Severity | Finding |
|---|----------|---------|
| 22.1 | Med | **`db:types` depends on a global `supabase` CLI** that is not in devDependencies nor the lockfile — broken on clean machines/CI. |
| 22.2 | Med | **`turbo.json` is dead config** — no `turbo` binary anywhere in the graph; `dev:turbo` runs Next's Turbopack (`--turbo`), which is unrelated to Turborepo and redundant on Next 16 (turbo is default). |
| 22.3 | Low | `worker:*` prerequisite (manual npm install) — see above. |
| 22.4 | Low | ~25 ops commands mirrored in both package.json and `run-ops.mjs` COMMANDS map — intentional (parsed by `ops-command-registry.mjs`) but drift-prone. |

## Dead dependency (new finding, root deps)

**`embla-carousel-autoplay` — zero references in all of `site/`** (ShowcaseCarousel uses `useEmblaCarousel` only, no plugins array). Ships in node_modules for nothing. All other spot-checked suspects (`@vercel/speed-insights`, `@prometheus-io/client`, `@gsap/react`, `tw-animate-css` — used via CSS import in `focss/base/runtime.css:1`, `tailwind-merge`, `clsx`, `jspdf`, `dockview-react`, `@hookform/resolvers`, `react-hook-form`, `next-intl`, `nuqs`, `next-safe-action`) are live.

## Lockfile health (1,023 packages, lockfile v9.0)

Core is clean: single versions of react 19.2.8, next 16.3.3, typescript 7.0.2, vite 8.2.2, vitest 4.1.11, tailwindcss 4.3.3. The 14 workspace `overrides` are doing their job. Remaining fat:

| Duplication | Cause | Fix path |
|---|---|---|
| framer-motion 12.43.0 + 13.1.1 | tech-docs `^12.43.0` lag (uses only `motion`/`AnimatePresence`) | bump tech-docs to ^13 |
| uuid 11.1.1 + 14.0.2 | transitive via `@a2a-js/sdk` (Mastra graph) pins 11 | upstream change only |
| zod 4.4.3 + 4.5.4 | tech-docs dead devDep | remove the devDep |
| happy-dom 20.11.8 + 20.12.0 | tech-docs `^20.11.1` vs root `^20.12.0` | bump specifier |

## Version-frontier workarounds (all commented and intentional, but fragile)

- **TS 7:** `useTypeScriptCli: true` asserted in **two** next.configs (belt-and-suspenders), `oxlint-tsgolint` for type-aware lint.
- **Next 16:** webpack default (`--webpack`) because `turbopack.root` at monorepo root indexes huge node_modules (RAM risk, in-config comment); `@planner/*`/`@studio/*` aliases duplicated in **three** places that must stay in sync (site/tsconfig.json, tests/vitest.config.ts, next.config) — most likely place the next upgrade bites.
- **Vitest 4:** `@ts-expect-error` on `environmentMatchGlobs` (×3 configs), jsdom peer stripped via pnpm overrides, `poolOptions` removal note in tech-docs config.
- **Tailwind 4:** dual plugin setup (`@tailwindcss/vite` + `@tailwindcss/postcss`), postcss 8.5.25 override, `@focss` junction symlink created by the postinstall script.
