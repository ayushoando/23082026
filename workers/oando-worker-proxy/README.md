# oando-worker-proxy

Cloudflare Worker that serves as a reverse proxy for oando.co.in assets.  
Deploy and edge ops: [`OPERATIONS_RUNBOOK.md`](../../OPERATIONS_RUNBOOK.md). Programme coordination: [`plans/PLAN.md`](../../plans/PLAN.md) · [`plans/README.md`](../../plans/README.md).

## Behavior

1. **Image requests** (`/images/*`): Try R2 bucket first, fall back to Vercel
2. **All other requests**: Proxy to Vercel origin

## Setup

```bash
# Install worker dependencies (from this directory — the worker is NOT a pnpm
# workspace member and keeps its own npm package-lock.json)
npm ci

# Deploy to Cloudflare
pnpm deploy

# Local development
pnpm dev
```

Root `worker:*` scripts (`worker:dev` / `worker:deploy` / `worker:tail`) call
`pnpm --dir workers/oando-worker-proxy <script>` — they run this package's
scripts but do **not** install its dependencies, so the `npm ci` above is a
prerequisite (also required by CI/deploy runbooks).

## Configuration

- **R2 Bucket**: `oando-asset-cdn` (bound as `ASSET_BUCKET`)
- **Vercel Origin**: `https://oando1408.vercel.app` (configurable via `VERCEL_ORIGIN` env var)

## Environment Variables

Set in Cloudflare Dashboard or wrangler.toml:
- `VERCEL_ORIGIN`: Vercel deployment URL — **single source of truth is `wrangler.toml [vars]`**; there is no code fallback (the worker returns a clear 500 if unset)
- `PUBLIC_INDEXABLE_HOSTS`: custom domains that must be indexable (default via wrangler: `oando.co.in,www.oando.co.in`)

## SEO / indexing

`vercel.json` sets `X-Robots-Tag: noindex` for `Host: *.vercel.app` (preview safety).  
This worker **must** send `Host: <vercel origin>` for routing, so Vercel would noindex **apex** too unless we strip that header for public hosts.

**Deploy this worker after any change** or Google/Bing will keep seeing `noindex` on `https://oando.co.in`.
