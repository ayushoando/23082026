# Oando codebase - module-wise reports

**Research date:** 2026-09-03  
**Audience:** project owner, maintainers, and module owners  
**Method:** static inspection of live source, configuration, manifests, migrations, and repository documentation.

These reports expand the executive findings in [`report-source.md`](../report-source.md). They describe what the code declares and what can be inferred from static contracts. They do not claim runtime success or failure where no authorized execution was performed.

## Report map

| Report | Module coverage | Main conclusion |
| --- | --- | --- |
| [01 - Architecture and routing](01-architecture-routing.md) | App Router, build configuration, route map, fork boundaries, FOCSS | The shell is coherent, but documentation and route ownership need continual reconciliation. |
| [02 - Authentication and security](02-authentication-security.md) | Proxy, sessions, roles, CSRF, origin, rate limits, CSP, bypass | The layered security design is strong; the deprecated static admin token remains scheduled debt. |
| [03 - Persistence and data](03-persistence-data.md) | Admin/Products split, mode selectors, stores, assets, migrations | Exclusive persistence is well guarded, with selector inconsistency and storage-doc drift. |
| [04 - Planner](04-planner.md) | Canvas, canonical API, repositories, revision/idempotency, legacy routes | The canonical pipeline is disciplined, but a CRM caller uses the wrong contract and two APIs remain live. |
| [05 - Studio](05-studio.md) | Furniture canvas, autosave, catalog, uploads, publishing | The fork is isolated and mode-aware; Supabase publishing has a disk-only top-PNG gap. |
| [06 - Admin and CRM](06-admin-crm.md) | Admin shell, plans, analytics, CRM, customer queries, themes | Admin has strong session controls, but theme durability and source telemetry are incomplete. |
| [07 - Marketing, catalog, and i18n](07-marketing-catalog-i18n.md) | Marketing routes, catalog, locale loading, site styling, shared assets | The public surface is broad and localized for en/hi; docs/comments overstate or understate parts of it. |
| [08 - AI, tech docs, worker, and operations](08-ai-techdocs-worker-operations.md) | AI advisor, Vectorize, tech-docs SPA, Cloudflare worker, release posture | Auxiliary systems degrade gracefully in places, but external deployment state and full gates remain unverified. |
| [09 - Archived work implementation audit](09-archived-work-implementation-audit.md) | All five requested `.archive/agents-work` areas and live-source cross-checks | The archive artifacts exist, but most are static evidence; runtime work and several Planner follow-ups remain unverified or open. |

## Validation boundary

No tests, typecheck, build, gate, browser, database, deployment, or boundary-scan command was run during this report expansion. The repository-recorded historical conditions in [`Failures.md`](../Failures.md) are cited as historical evidence only.
