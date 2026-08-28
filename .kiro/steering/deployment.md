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

## Checks (user-invoked only)
For an explicit deployment check, run the applicable non-test build or worker command; do not run deployment checks automatically on save.
```
pnpm run build:site
pnpm run worker:dev (manual — long running)
```

## Pre-deploy checklist
- [ ] User has explicitly requested the required gate and run it themselves
- [ ] Migrations applied: `db:apply` + `db:apply:admin`
- [ ] Worker deployed if changed: `worker:deploy`
- [ ] R2 backup taken: `r2:backup`

## Observability integration
For explicit post-deploy verification, use the currently wired OpenTelemetry and Prometheus implementation and configuration.
