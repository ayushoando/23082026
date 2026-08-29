# 06 · Operations and infrastructure

[← Tooling, CI, and tech docs](05-tooling-ci-tech-docs.md) · [Next: docs, governance, and planning →](./07-docs-governance-planning.md)

## Deployment surfaces

| Layer | Location / authority | What it does |
|---|---|---|
| Next application | `site/`, `vercel.json`, root package scripts | Vercel-hosted product application. |
| Cloudflare Worker | `workers/oando-worker-proxy/` | Edge asset proxy/delivery and Vercel-origin behavior. |
| R2 | Root R2 operations/scripts and Worker binding | Asset delivery, catalog snapshot, database/catalog/repository backups. |
| Supabase | `site/platform/supabase/`, migrations, ops scripts | Products/Admin persistence, auth, storage, RLS. |
| Local observability | `config/observability/` | Prometheus/Grafana Docker stack. |

The Cloudflare Worker is a separate project and deploys separately from the Vercel app.

## Release order

For a release that changes data:

```text
migrations → required seed → code deployment → appropriate smoke/verification
```

Before any external action, Kiro should identify the target environment, database ownership, rollback, backup/recovery path, exact command, and expected impact.

## Root operational command families

| Family | Examples of purpose |
|---|---|
| Database | migrations, dry runs, type generation, DB connection/advisors, seed. |
| Vercel | preview/prod deployment. |
| Worker | local dev, deploy, tail/logs. |
| R2 | backups, catalog snapshots, repository backup, bucket/count operations. |
| Ops registry | long-tail operational commands through `pnpm run ops:list`. |
| Observability | local Prometheus/Grafana start/stop/logs. |

Commands are user-authorized and may be high impact. Do not treat this guide as approval to run them.

## Backups, restore, and maintenance

- `.github/workflows/supabase-backup-r2.yml` is the nightly backup automation.
- R2 retains database dumps, catalog snapshots, and repository backup data according to repository operations procedures.
- Bad deployment rollback, migration rollback, provider recovery/PITR, catalog degraded mode, and Planner local drafts have different recovery paths.
- `SITE_MAINTENANCE_MODE=readonly` is an API write gate; it does not make production filesystem writable.

## Safe requests

```text
Create a read-only release plan for [change]. State target environment, migrations,
seed, code order, risk, backup/rollback, and exact approval points. Do not deploy.
```

```text
Create a read-only incident plan for [symptom]. Identify the surface/provider,
safe observations, customer impact, fallback, recovery path, and approval points.
Do not perform external or write actions.
```

Next: [Docs, governance, and planning](./07-docs-governance-planning.md).