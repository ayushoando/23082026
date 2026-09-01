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
