# 06 · Operations and infrastructure

[← Tooling, CI, and tech docs](05-tooling-ci-tech-docs.md) · [Next: docs, governance, and planning →](./07-docs-governance-planning.md)

## Deployment surfaces and owners

| Layer | Location / authority | What it does | Ownership/proof boundary |
|---|---|---|---|
| Next application | `site/`, `vercel.json`, root package scripts | Vercel-hosted product application. | Product source and configured deployment path; no deployment or hosted behavior is proven by a file. |
| Cloudflare Worker | `workers/oando-worker-proxy/` | Edge asset proxy/delivery and Vercel-origin behavior. | Separate project and release target; Worker evidence does not prove Vercel release state. |
| R2 | Root R2 operations/scripts and Worker binding | Asset delivery, catalog snapshots, and database/catalog/repository backup storage. | External storage and backup target; bucket state, retention, and restore are unverified without authorized output. |
| Supabase | `site/platform/supabase/`, migration directories, and operations scripts | Products/Admin persistence, auth, storage, RLS, and grants. | Products (`erpweaiypimorcunaimz`) owns marketing catalog/configurator/flags/themes; Admin (`rxzpznmxbaoxpikowmfc`) owns staff/customers/plans/furniture/descriptors/price books/audit/customer queries. |
| Local observability | `config/observability/` | Prometheus/Grafana local configuration. | Local configuration is not hosted observability proof. |
| Application telemetry | `site/instrumentation.ts`, `site/lib/observability/metrics.ts` | OpenTelemetry registration and Prometheus metrics implementation. | Source wiring is not proof of collected, exported, or alerted metrics. |

The Cloudflare Worker is separate from the Vercel app and deploys separately. Products/Admin ownership must be identified before a release, backup, migration, catalog operation, or recovery decision that touches data.

## Release and recovery order

For a release that changes data, make the read-only plan explicit:

```text
backup/recovery readiness → correct database migration dry run → required seed
→ code deployment → appropriate smoke/verification → rollback or recovery decision
```

The exact order can depend on compatibility and the approved runbook, but every plan names the target environment, Products/Admin owner, migration and seed impact, rollback/recovery path, backup state, exact command, approval point, and expected impact before any external action. A command sequence in a plan is not execution evidence.

## Root operational command families

| Family | Examples of purpose | Default classification |
|---|---|---|
| Database | migrations, dry runs, type generation, DB connection/advisors, seed | Protected Command; choose Products/Admin first |
| Vercel | preview/production deployment | Protected Command |
| Worker | local dev, deploy, tail/logs | Protected Command; local-service or external action as applicable |
| R2 | backups, catalog snapshots, repository backup, bucket/count operations | Protected Command |
| Ops registry | long-tail operational commands; dispatcher `scripts/run-ops.mjs`, ~137 commands via `pnpm run ops:list` | Read-only listing only until the selected operation is classified; execution is protected when it mutates data/infrastructure |
| Observability | Prometheus/Grafana start/stop/logs | Protected local-service command |

Commands are user-authorized and may be high impact. Do not treat this guide as approval to run them. Classify every command as `read-only inspection`, `Normal-Agent Eligible Check`, `Protected Command`, or `no-run pending authorization` before proposal or execution, and record the repository-root working directory.

## Backups, restore, and maintenance

- `.github/workflows/supabase-backup-r2.yml` is the nightly backup automation path; workflow presence is not proof that the latest backup succeeded.
- R2 may retain database dumps, catalog snapshots, and repository backup data according to the operations procedure; retention and restore readiness require current evidence.
- Bad deployment rollback, migration rollback, provider recovery/PITR, catalog degraded mode, and Planner local drafts have different recovery paths. Name the path instead of treating them as interchangeable backups.
- `SITE_MAINTENANCE_MODE=readonly` is an API write gate; it does not make the production filesystem writable and does not replace database rollback or recovery.
- Production filesystem access remains read-only; runtime writes use the mode-aware persistence wrappers described in chapter 04.

## Safe requests

```text
Create a read-only release plan for [change]. State target environment, Products/Admin owner,
migrations and seed, code order, risk, backup/recovery and rollback path, exact command classes,
approval points, and expected evidence. Do not deploy, mutate a database, write R2, or start a service.
```

```text
Create a read-only incident plan for [symptom]. Identify the surface/provider and data owner,
safe observations, customer impact, fallback, recovery path, exact diagnostic, authorization needs,
and proof limitation. Do not perform external or write actions or claim a cause without output.
```

## D21 — Operations and infrastructure task card

- **Goal:** Plan Vercel, Cloudflare Worker, R2, Supabase, observability, backup, deployment, or incident work without performing an external action by assumption.
- **Start Paths:** `./vercel.json`; `./workers/oando-worker-proxy/`; `./config/observability/`; `./.github/workflows/supabase-backup-r2.yml`; `./OPERATIONS_RUNBOOK.md`; `./scripts/`; `./Failures.md`; `./site/instrumentation.ts`; `./site/lib/observability/metrics.ts`; `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`.
- **Scope:** Target environment, service/data owner, Products/Admin ownership, operational risk, rollback/recovery, observability, backup, incident evidence, and exact command classification.
- **Evidence Steps:** Read authority; inspect listed configuration/workflows/scripts; compare current source with durable claims; classify infrastructure/data/release risk; record a read-only plan, proof limitation, and next decision.
- **Allowed Actions:** Read-only planning and owned guide edits; external actions only under a separately approved Protected Command route.
- **Forbidden Actions:** Deploy, backup, import/export, Docker/local service, remote mutation, external MCP activation, hook/policy change, or a claim about incident cause without authorized output.
- **Risk:** Infrastructure, credentials, data, release, recovery, and external-system risk.
- **Expected Evidence:** Target, owner, exact command, repository-root cwd, authorization state, Hook Decision, exit status if run, rollback/recovery path, first failed subcommand if applicable, and unverified external behavior.
- **Next Decision:** Owner authorizes one exact action, requests the smallest diagnostic, or keeps the plan pending.

## Failure Triage before any gate or policy proposal

When a Full Gate Failure is reported or observed, route to read-only Failure Triage before proposing a hook, gate, baseline, test-selection, allowlist, or command-eligibility change. Capture this record without filling unknowns from a plan or an old log:

```text
Exact Full Gate command:
Repository-root working directory:
Current-session authorization state:
Hook Decision:
Exit status:
First failed subcommand:
Relevant output summary (and output limitation):
Cause classification: observed / unobserved / unverified:
Smallest next authorized diagnostic:
Controls preserved: Full Gate composition / quality baselines / test selection /
  coverage / Hook Permission:
Validation limitation and behavior not verified:
Next owner and decision:
```

If current authorized output is absent, label the cause `unobserved` or `unverified`; request only the smallest authorized diagnostic and do not assert a root cause. Preserve Full Gate composition, quality baselines, test selection, coverage, and Hook Permission enforcement until a separate approved Policy Implementation Proposal changes those assets. A `True Blocker` requires reproducible evidence and belongs only in root `./Failures.md`; supporting authored analysis belongs in an approved `./agents-work/<workstream>/<report-type>/` folder. Do not create a second blocker ledger.

## Protected operations contract

Deployments, Worker actions, R2 backups/catalog snapshots, database actions, observability local services, incident commands, and remote import/export are Protected Commands requiring exact current-session Explicit User Authorization and Hook Permission per `AGENTS.md`. A route, workflow, script entry, or failure report proves configuration or a reported symptom only; it does not prove execution, target state, recovery, or successful deployment. Deployment, Worker release, R2 backup/restore, database apply or seed, hosted inspection, local observability services, package changes, external MCP actions, hook/policy changes, and runtime enforcement remain separate approval tracks; this guidance lane does not run them or convert a reported failure into a root cause without current evidence. Use the Plain-Language Response Contract and report pending checks explicitly.

Next: [Docs, governance, and planning](./07-docs-governance-planning.md).
