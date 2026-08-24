---
inclusion: fileMatch
fileMatchPattern: "vercel.json,.vercelignore,workers/**,wrangler*,scripts/*deploy*,scripts/*vercel*,scripts/*worker*,scripts/*r2*"
---

# Deployment Domain

## Stack
- **Hosting**: Vercel (Next.js standalone output)
- **Edge workers**: Cloudflare Workers (`workers/oando-worker-proxy`, Wrangler)
- **Storage**: Cloudflare R2 (asset backup, catalog snapshots, repo backup)
- **Build**: `pnpm run build:site` (includes sharp check + standalone prep)

## Conventions
- Deploy site: `pnpm run vercel:prod` (production) / `pnpm run vercel:preview`.
- Deploy worker: `pnpm run worker:deploy`.
- R2 operations: `pnpm run r2:backup`, `r2:catalog-snapshot`, `r2:repo-backup`.
- Never push directly to production without passing `pnpm run gate`.
- `.vercelignore` must exclude test artifacts, scripts, and agent reports.

## Fast checks (run on save)
```
pnpm run build:site
pnpm run worker:dev (manual — long running)
```

## Pre-deploy checklist
- [ ] `pnpm run gate` passes
- [ ] Migrations applied: `db:apply` + `db:apply:admin`
- [ ] Worker deployed if changed: `worker:deploy`
- [ ] R2 backup taken: `r2:backup`

## Observability integration
Use Datadog power for post-deploy verification: check RUM for error spikes, traces for latency regressions.
