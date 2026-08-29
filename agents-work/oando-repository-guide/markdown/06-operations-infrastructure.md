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


## D21 — Operations and infrastructure task card

- **Goal:** Plan Vercel, Cloudflare Worker, R2, Supabase, observability, backup, deployment, or incident work without performing an external action by assumption.
- **Start Paths:** `./vercel.json`; `./workers/oando-worker-proxy/`; `./config/observability/`; `./.github/workflows/supabase-backup-r2.yml`; `./OPERATIONS_RUNBOOK.md`; `./scripts/`; `./Failures.md`; `./site/instrumentation.ts`; `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`.
- **Scope:** Target environment, service/data owner, risk, rollback/recovery, observability, and exact command classification.
- **Evidence Steps:** Read authority; inspect listed configuration/workflows/scripts; compare current source with durable claims; classify infrastructure/data/release risk; record a read-only plan and next decision.
- **Allowed Actions:** Read-only planning and owned guide edits; external actions only under a separately approved Protected Command route.
- **Forbidden Actions:** Deploy, backup, import/export, Docker/local service, remote mutation, Power/MCP activation, or claim an incident cause without output.
- **Risk:** Infrastructure, credentials, data, release, and external-system risk.
- **Expected Evidence:** Target, owner, exact command, authorization state, hook decision, rollback/recovery path, and unverified external behavior.
- **Next Decision:** Owner authorizes one exact action or keeps the plan pending.

## Failure Triage before any gate or policy proposal

When a Full Gate Failure is reported or observed, route to read-only Failure Triage before proposing a hook, gate, baseline, test-selection, or allowlist change. Capture:

```text
Exact Full Gate command:
Repository-root working directory:
Current-session authorization state:
Hook decision:
Exit status:
First failed subcommand:
Relevant output summary:
Cause classification: observed / unobserved / unverified:
Smallest next authorized diagnostic:
Controls preserved:
```

If current authorized output is absent, the cause is `unobserved` or `unverified`; request only the smallest authorized diagnostic and do not assert a root cause. Preserve Full Gate composition, quality baselines, test selection, coverage, and Hook Permission enforcement. A True Blocker with reproducible evidence belongs only in root `./Failures.md`, subject to the Locked Path Gate and exact owner authorization; supporting authored analysis belongs in an approved `./agents-work/<workstream>/<report-type>/` folder.

## Protected operations contract

Deployments, Worker actions, R2 backups/catalog snapshots, database actions, observability local services, and incident commands are Protected Commands. They require exact current-session Explicit User Authorization and Hook Permission. A route, workflow, or script entry proves configuration only; it does not prove execution, target state, recovery, or successful deployment. Use the Plain-Language Response Contract and report pending checks explicitly.
