# Active blockers

This file is the repository's sole record of current hard blockers. Add a row only with reproducible evidence, and remove it only after an authorized rerun observes the fix.

| Resource | Destination |
|---|---|
| Active planning coordination | [`plans/README.md`](./plans/README.md) |
| Browser origin | `http://localhost:3000` only |

An empty blocker table is valid. Do not copy blocker identifiers into other documents; link to this file instead.

---

| ID | Priority | Blocker | Evidence | Action |
|----|----------|---------|----------|--------------|
| CF-TOKEN-01 | P1 | Cloudflare API token rejected — blocks `wrangler vectorize create catalog-nav` and `pnpm run worker:deploy` | `npx wrangler vectorize list` (repo root, with and without `loadEnvLocal`) → `Invalid access token [code: 9109]` / `Authentication error [code: 10000]` against account `78e07661362639e5e9008dadd85a3f2d`, observed 2026-09-01 | Owner rotates `CLOUDFLARE_API_TOKEN` in `.env.local` with Vectorize + Workers deploy permissions; then create the index and redeploy the worker |
| GATE-RECHECK-01 | P1 | Ship bar not re-observed after the 2026-09-02 vitest fixes | Last full `pnpm run gate` exited 1 at `pnpm run test` (22 failed / 4215 passed). Targeted re-run of those files later passed 126/126. Build, coverage, docs, governance, and `test:browser:gate` never ran on the fixed tree | Re-run `pnpm run gate` on current `main`; delete this row only if that command exits 0 |
| GATE-AUTH-02 | P1 | Ship-bar commands could not execute in this session | After explicit readiness, `pnpm run scan:boundaries` was attempted by Muse-A but the shell hook required approval with no interactive approval UI; therefore `pnpm run gate:fast` and `pnpm run gate` were not run and have no exit codes/output | Authorize shell execution and rerun `pnpm run scan:boundaries`, `pnpm run gate:fast`, then `pnpm run gate`; remove GATE-RECHECK-01 only if full gate exits 0 |
| BROWSER-ORIGIN-02 | P1 | Browser walk could not start because the required local app was unavailable | Muse-B attempted `http://localhost:3000` and Chromium returned `net::ERR_CONNECTION_REFUSED`; no routes or screenshots were observed | Start the app at `http://localhost:3000`, then rerun the four-viewport browser walk |
