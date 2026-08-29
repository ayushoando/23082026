# Oando repository and Kiro guide

This is the complete, multi-page map of the repository: product code, data, APIs, tooling, CI, operations, documentation, Kiro configuration, local/generated output, and validation. It maps **every meaningful area**, not every dependency or generated file.

## Read by task

| Need | Open |
|---|---|
| Start, scope, and full coverage index | This page |
| Every root directory/file category and its status | [01 · Full repository map](markdown/01-repository-map.md) |
| All Next.js `site/` layers, routes, assets, and configuration | [02 · Application architecture](markdown/02-application-architecture.md) |
| Marketing, Admin, Planner, Studio, UI, catalog, and AI | [03 · Product domains](markdown/03-product-domains.md) |
| Databases, Supabase, APIs, persistence, i18n, security | [04 · Data, API, and persistence](markdown/04-data-api-persistence.md) |
| Tests, scripts, config, CI, and tech-docs generator | [05 · Tooling, CI, and tech docs](markdown/05-tooling-ci-tech-docs.md) |
| Vercel, Cloudflare Worker, R2, backup, deployment, incidents | [06 · Operations and infrastructure](markdown/06-operations-infrastructure.md) |
| Canonical docs, planning, governance, agent handbooks, blockers | [07 · Docs, governance, and planning](markdown/07-docs-governance-planning.md) |
| `.kiro`, skills, steering, hooks, specs, powers, MCP schemas, LTM | [08 · Kiro workspace](markdown/08-kiro-workspace.md) |
| Environment files, generated output, results, editor/VCS/local tooling | [09 · Local, generated, and environment areas](markdown/09-local-generated-environment.md) |
| Tests, gates, evidence, validation authorization | [10 · Quality and validation](markdown/10-quality-validation.md) |
| Vibe/Spec/Plan, Autopilot/Supervised, prompts, and skills | [11 · Working with Kiro](markdown/11-working-with-kiro.md) |

## Coverage rules

- **Source of truth / editable** means an area may be intentionally changed for the relevant task.
- **Generated** means regenerate it; do not hand-edit it as a source of truth.
- **Local/private** means it supports a developer or tool locally and should not be treated as shared product source.
- **Legacy** means investigate if needed but do not add new production behavior there.

## First five facts to remember

1. The product has four surfaces: Marketing (`/`), Admin (`/admin/*`), Furniture Studio (`/oostudio`), and Floor Planner (`/ooplanner`).
2. Planner and Studio are forked applications. They never import each other.
3. Products Supabase owns marketing catalog/configurator data. Admin Supabase owns staff, customers, plans, furniture, and descriptors.
4. Production filesystem is read-only. Runtime writes use mode-aware persistence wrappers, not raw disk helpers.
5. Run `pnpm` from the repository root. There is no product `site/package.json`.

## Start a task safely

```text
#Folder [likely folder]
Map [feature] from its user-facing route through UI, feature logic, API,
persistence, tests, tooling, and operational risks. Do not change code yet.
```

## Important live-tree corrections

The live repository has **no root `supabase/` directory**—Supabase code and migrations are under `site/platform/supabase/`. It also has **no root `mcp/` directory**—MCP schemas are under `.kiro/mcp/`. This guide uses the live paths.

The HTML version is `html/index.html`, with all rendered pages and `guide.css` under `html/`; the Markdown chapters are under `markdown/`.


## Begin Here: describe the outcome, not the repository vocabulary

Start with one ordinary-language sentence describing the desired outcome. Do not require the contributor to know a path, package, skill, command, or workflow mode. The router performs these steps before any modification or output selection:

1. Read `.kiro/skills/oando-master/SKILL.md` first and preserve the authority order: current user instruction → live code and fresh command output → `AGENTS.md` → `Agents/` → `docs/`; use `plans/README.md` for active coordination after those sources.
2. Restate the outcome with an action verb and the inferred Product Surface or repository domain; define specialized terms before requesting a decision.
3. Select exact first evidence locations and explain why each is first.
4. Select one D01–D22 Domain Index card, or D22 when the topic is unfamiliar.
5. Select every matching Package Skill, reject non-matching or unavailable skills with reasons, and select Local Evidence when no skill matches.
6. Choose `Vibe`, `Plan`, `Spec`, `Autopilot`, or `Supervised` from risk and scope; this is guidance, not a runtime switch.
7. Classify each proposed command as `read-only inspection`, `Normal-Agent Eligible Check`, `Protected Command`, or `no-run pending authorization` before suggesting or running it.
8. For an Output-Producing Task, declare Artifact Class, exact approved output home, filename pattern, owning source/script, authored-or-generated state, and rejected placements. Apply the Site Write Gate before any `./site/` write.
9. Request only unavoidable Owner Decisions. If safe modification facts are missing, choose read-only discovery instead.

### Route Record

Every Repository Task has a Route Record before modification:

```text
Outcome:
Domain / Domain Index card:
Exact first evidence locations and reasons:
Candidate paths:
Selected Package Skills and trigger evidence:
Rejected Package Skills and reasons:
Workflow Mode:
Operational-Risk Classification:
Command Classification for every proposed command:
Artifact Class / selected Workstream or Purpose Subfolder / filename pattern:
Owning source or script / authored or generated:
Rejected placements:
Locked Path Gate state:
Site Write Gate state, when a ./site/ target is proposed:
Validation State:
Unavoidable Owner Decisions:
Next action:
```

A matching skill is additive: select all matching skills, not one assumed skill. If none matches, select Local Evidence and record why. The Completion Record repeats selected and rejected skills, changed scope, observed evidence, pending validation, and true blockers.

## Coverage-Audited Repository Domain Index

The following cards are executable starting points, not claims that a route or capability is wired. Every card uses these Evidence Steps in this order: (1) read authority sources, (2) inspect the listed paths, (3) compare documentation with live evidence, (4) classify Surface Status and operational risk, and (5) record evidence, gaps, route, and next decision. A listed path can be absent, generated, local-private, legacy, or unverified.

### D01 — Map repository authority
- **Goal:** Map repository authority and the first safe inspection path.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./docs/architecture/stack.md`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./agents-work/oando-repository-guide/README.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./plans/README.md`.
- **Scope:** Authority order, exact paths, source/generated/private/legacy classification, and task routing.
- **Allowed Actions:** Read-only mapping, Route Record creation, and approved guide edits in owned paths.
- **Forbidden Actions:** Guessing paths, treating a document as self-validating, or changing locked authority files.
- **Risk:** Documentation and scope risk.
- **Expected Evidence:** Authority order, exact first paths, selected/rejected skills, and next decision.
- **Next Decision:** Choose the next domain card or D22 discovery.

### D02 — Initialize, develop, and debug safely
- **Goal:** Map initialization, local development, and debugging without starting services by assumption.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./package.json`; `./site/`; `./config/build/`; `./Failures.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Root `pnpm` boundary, environment state, local/private/generated areas, and reported symptoms.
- **Allowed Actions:** Read-only inventory and bounded diagnosis planning.
- **Forbidden Actions:** Installing, starting, building, testing, or changing environment files without exact authorization.
- **Risk:** Local environment, secrets, and service risk.
- **Expected Evidence:** Status-labelled environment map or explicit pending owner validation.
- **Next Decision:** Select the smallest read-only diagnostic; all service/test/build commands remain Protected Commands.

### D03 — Trace auth, security, and secrets
- **Goal:** Trace authentication and security boundaries without exposing secrets or weakening controls.
- **Start Paths:** `./site/proxy.ts`; `./site/lib/security/`; `./site/platform/supabase/`; `./.env.example`; `./.env.local`; `./site/.env.local`; `./docs/architecture/stack.md`.
- **Scope:** Edge and handler auth, CSRF/rate limits/RLS references, secret boundaries, and evidence limitations.
- **Allowed Actions:** Read approved helpers and classify data/security risk.
- **Forbidden Actions:** Printing secrets, client-side service keys, changing security controls, or making hosted calls.
- **Risk:** Security, credentials, and data access.
- **Expected Evidence:** Auth source, secret boundary, owner, and unverified hosted behavior.
- **Next Decision:** Route schema/RLS work to `db-migrations` only when evidence matches.

### D04 — Classify environment state
- **Goal:** Classify local environment values and workspace boundaries without exposing private configuration.
- **Start Paths:** `./.env.example`; `./.env.local`; `./site/.env.local`; `./package.json`; `./pnpm-workspace.yaml`; `./START.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Configured shape versus local/private values, workspace packages, and absent/stale claims.
- **Allowed Actions:** Read-only classification and safe documentation updates in owned guide paths.
- **Forbidden Actions:** Syncing, printing, committing, or changing environment values.
- **Risk:** Secret and environment risk.
- **Expected Evidence:** Status-labelled map with private values redacted and next owner action.
- **Next Decision:** Ask for a separate environment or service approval only if required.

### D05 — Locate and assess APIs
- **Goal:** Trace an API outcome from route handler through auth, data boundary, and proof.
- **Start Paths:** `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md`; `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`.
- **Scope:** Route ownership, request/security controls, persistence boundary, and source-level evidence.
- **Allowed Actions:** Read-only route mapping and bounded source edits when explicitly approved.
- **Forbidden Actions:** Hosted requests, migrations, secret exposure, or claiming API behavior from a filename.
- **Risk:** API, auth, data, and release risk.
- **Expected Evidence:** Route source, auth/CSRF/data boundary, and proof limitation.
- **Next Decision:** Select `graph-impact` or `db-migrations` only when the trigger is evidenced.

### D06 — Improve Site UI, SEO, accessibility, or performance
- **Goal:** Improve a marketing interface through the route, feature, component, FOCSS zone, and accessibility contract.
- **Start Paths:** `./site/app/(site)/`; `./site/features/site/`; `./site/components/home/`; `./site/focss/site/`; `./site/i18n/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./docs/architecture/stack.md`.
- **Scope:** UI structure, metadata/SEO, i18n, responsive/accessibility states, and performance planning.
- **Allowed Actions:** Approved Core Product Writes only after the Site Write Gate; use existing patterns.
- **Forbidden Actions:** Non-Core artifacts under `./site/`, custom CSS systems, or browser/performance claims without proof.
- **Risk:** Product UI, accessibility, release, and shared-code risk.
- **Expected Evidence:** Visual Detail Checklist and exact static/rendered-proof limitation.
- **Next Decision:** Route styling/token work to `focss-css`; route shared impact to `graph-impact`.

### D07 — Polish UI, icons, alignment, motion, or assets
- **Goal:** Complete a bounded visual improvement using existing icon, token, asset, and motion patterns.
- **Start Paths:** `./site/components/`; `./site/focss/`; `./site/public/`; `./scripts/generate-svg/`; `./docs/architecture/css.md`; `./docs/architecture/stack.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Existing Phosphor abstraction, alignment, spacing, responsive layout, states, keyboard reachability, reduced motion, licensing, and asset ownership.
- **Allowed Actions:** Reuse existing components and generation paths after a Core Product Write route is approved.
- **Forbidden Actions:** New icon libraries, custom CSS systems, external asset tooling, or skipped loading/empty/error review.
- **Risk:** UI consistency, accessibility, asset licensing, and motion risk.
- **Expected Evidence:** Visual Detail Checklist, asset source, motion-preference review, and proof limitation.
- **Next Decision:** Select `focss-css` whenever styling/tokens/FOCSS evidence matches.

### D08 — Work in Admin
- **Goal:** Trace an Admin outcome through route, feature, auth, ownership, and operational risk.
- **Start Paths:** `./site/app/admin/`; `./site/features/admin/`; `./site/components/`; `./site/lib/admin/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`.
- **Scope:** Internal routes, roles, catalog/inventory/plans/price books/themes, and Products versus Admin ownership.
- **Allowed Actions:** Read-only mapping or approved product edits with exact owned paths.
- **Forbidden Actions:** Remote mutations, migrations, service-role exposure, or treating demo state as hosted state.
- **Risk:** Admin authorization, data, and operational risk.
- **Expected Evidence:** Route, auth owner, database owner, and behavior limitation.
- **Next Decision:** Route schema/RLS to `db-migrations` and shared impact to `graph-impact` when evidenced.

### D09 — Assess CRM demo versus customer-query operations
- **Goal:** Distinguish the local CRM browser workspace from Admin Database-backed customer-query operations.
- **Start Paths:** `./site/app/admin/crm/`; `./site/features/crm/`; `./site/app/admin/customer-queries/`; `./site/app/api/customer-queries/`; `./site/features/ops/`; `./docs/architecture/product-map.md`; `./docs/architecture/routes.md`.
- **Scope:** Surface Status, `oando-crm-storage` Zustand/local browser persistence, customer-query API/data ownership, and missing end-to-end proof.
- **Allowed Actions:** Read-only comparison and Coverage-Gap Admission.
- **Forbidden Actions:** Combining the workflows or calling the CRM demo wired to Admin data without evidence.
- **Risk:** Data ownership, customer operations, and overclaim risk.
- **Expected Evidence:** CRM `demo/local-only` status plus separate customer-query status and next evidence source.
- **Next Decision:** Record `present-but-unverified` or `unwired/absent` where end-to-end proof is missing.

### D10 — Trace catalog, configurator, quotes, or inventory
- **Goal:** Trace catalog-facing work to the correct Products/Admin owner and release path.
- **Start Paths:** `./site/lib/catalog/`; `./site/features/shared/catalog/`; `./site/app/(site)/products/`; `./site/app/(site)/quote-cart/`; `./site/app/admin/catalog/`; `./site/app/admin/inventory/`; `./site/app/api/configurator/`; `./site/platform/supabase/migrations/`.
- **Scope:** Catalog/configurator/quote/inventory routes, assets, pricing, data ownership, and persistence.
- **Allowed Actions:** Read-only mapping or approved source changes after ownership selection.
- **Forbidden Actions:** Seed/publish/storage/migration actions without Protected Command authorization.
- **Risk:** Product data, pricing, inventory, release, and database risk.
- **Expected Evidence:** Products/Admin owner, asset/release path, and hosted-proof limitation.
- **Next Decision:** Select `db-migrations` for schema/ownership and `focss-css` for styling triggers.

### D11 — Change Planner safely
- **Goal:** Change or assess Planner behavior while preserving its fork, canvas scale, state, and persistence assumptions.
- **Start Paths:** `./site/app/ooplanner/`; `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/`; `./site/hooks/Planner/`; `./site/store/Planner/`; `./site/server/Planner/`; `./site/platform/Planner/`; `./site/app/api/Planner/`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Planner route, canvas, dockview shell, catalog, project persistence, and handoff.
- **Allowed Actions:** Exact Planner-owned Core Product Write only after route and ownership approval.
- **Forbidden Actions:** Studio imports, cross-fork copying, persistence changes, or unapproved boundary scans/browser checks.
- **Risk:** Fork boundary, persistence, canvas, and release risk.
- **Expected Evidence:** Planner-only source evidence; boundary/persistence behavior remains pending without authorized proof.
- **Next Decision:** Select `planner-studio`; select `fork-boundaries` for fork/cross-import evidence.

### D12 — Change Studio safely
- **Goal:** Change or assess Studio behavior while preserving its separate furniture, descriptor, state, and canvas assumptions.
- **Start Paths:** `./site/app/oostudio/`; `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/`; `./site/hooks/Studio/`; `./site/store/Studio/`; `./site/server/Studio/`; `./site/platform/Studio/`; `./site/app/api/Studio/`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Studio authoring, furniture assets, descriptor publishing, AI helpers, and dockview/canvas behavior.
- **Allowed Actions:** Exact Studio-owned Core Product Write only after route and ownership approval.
- **Forbidden Actions:** Planner imports, cross-fork copying, remote publish, or unapproved checks.
- **Risk:** Fork boundary, furniture data, descriptor release, and AI advisory risk.
- **Expected Evidence:** Studio-only source/release evidence and unverified hosted behavior where applicable.
- **Next Decision:** Select `planner-studio`; select `fork-boundaries` for fork changes.

### D13 — Assess AI and retrieval
- **Goal:** Assess server-side AI/retrieval behavior as advisory output without overstating provider or deployment evidence.
- **Start Paths:** `./site/lib/ai/mastra/`; `./site/app/api/ai-advisor/`; `./site/app/api/Studio/ai/`; `./site/features/Studio/`; `./docs/architecture/stack.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Mastra, Bedrock, LanceDB, Orama, Fuse.js, embeddings, providers, advisory output, and evidence limits.
- **Allowed Actions:** Local-Evidence-first source mapping and approved guidance updates.
- **Forbidden Actions:** Provider calls, package installation, deployment/evaluation claims, or presenting absent `ai-retrieval` as installed.
- **Risk:** External provider, credentials, data, and unsupported-claim risk.
- **Expected Evidence:** Advisory boundary, retrieval/provider source, and missing-skill or unverified status.
- **Next Decision:** Select `ai-retrieval` only if the canonical file exists; otherwise record the gap and use matching existing skills.

### D14 — Select database ownership and persistence mode
- **Goal:** Select Products or Admin ownership and preserve RLS, grants, rollback, and mode-aware persistence.
- **Start Paths:** `./site/platform/supabase/migrations/`; `./site/platform/supabase/migrations.admin/`; `./site/platform/drizzle/schema/`; `./site/lib/Planner/plannerPersistenceMode.ts`; `./site/lib/catalog/furnitureCatalogMode.ts`; `./site/platform/Planner/data/`; `./site/platform/shared/data/furniture/`; `./site/inventory/descriptors/`; `./docs/database/schema.md`; `./docs/database/ops.md`; `./docs/database/drizzle.md`.
- **Scope:** Database ownership, deployable migrations, RLS/grants, rollback, and production read-only filesystem.
- **Allowed Actions:** Read-only schema planning; approved migration edits only in the correct migration path.
- **Forbidden Actions:** Direct schema changes, missing `-- rollback`, dual writes, production disk writes, or apply commands without authorization.
- **Risk:** Data loss, access control, persistence, and release risk.
- **Expected Evidence:** Owner, migration path, policies/grants/rollback, mode, and pending dry-run/hosted proof.
- **Next Decision:** Select `db-migrations`; select `graph-impact` or fork skills when triggers match.

### D15 — Plan tests, fixtures, mocks, and validation
- **Goal:** Classify the narrowest validation lane without treating a plan or one Vitest lane as proof of all behavior.
- **Start Paths:** `./tests/`; `./tests/unit/`; `./tests/integration/`; `./tests/e2e/`; `./tests/fixtures/`; `./tests/helpers/`; `./tests/tech-docs-generator/`; `./config/build/`; `./Testing-handbook.md`; `./package.json`.
- **Scope:** Two Vitest lanes, Playwright, fixtures, helpers, command authorization, and evidence limitations.
- **Allowed Actions:** Read-only validation planning; exact check execution only when current authorization and hook permission exist.
- **Forbidden Actions:** Running tests/gates/builds/browser checks by convention or claiming unobserved output.
- **Risk:** Quality, release, and owner-control risk.
- **Expected Evidence:** Exact command, root cwd, scope, authorization, hook decision, exit status, limitation, or pending state.
- **Next Decision:** Select `verify-and-gate` only after explicit authorization and hook conditions are established.

### D16 — Inspect scripts and command registry
- **Goal:** Map a script or command from its manifest entry through implementation and classify its operational risk.
- **Start Paths:** `./package.json`; `./scripts/`; `./scripts/run-ops.mjs`; `./scripts/ops-command-registry.mjs`; `./config/build/`; `./docs/architecture/scripts.md`; `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`.
- **Scope:** Root script authority, dispatch, static checks, operations, and unavailable command claims.
- **Allowed Actions:** Read-only inspection and documentation corrections in owned paths.
- **Forbidden Actions:** Executing a script, inventing a command, or recommending `pnpm run typecheck:scripts` while `./scripts/tsconfig.json` is absent.
- **Risk:** Command, data, infrastructure, and validation risk.
- **Expected Evidence:** Configured-versus-observed command status and exact authorization state.
- **Next Decision:** Route validation planning to `verify-and-gate` only when permitted.

### D17 — Map packages, dependencies, and workspace boundaries
- **Goal:** Distinguish declared, imported, configured, and observed packages without changing installation or workspace boundaries.
- **Start Paths:** `./package.json`; `./pnpm-workspace.yaml`; `./pnpm-lock.yaml`; `./site/`; `./site/tsconfig.json`; `./tech-docs-generator/`; `./tech-docs-generator/package.json`; `./config/build/`; `./docs/architecture/stack.md`.
- **Scope:** Root workspace, absent `./site/package.json`, tech-docs sibling boundary, live imports, and package-addition approval.
- **Allowed Actions:** Read-only package/status mapping.
- **Forbidden Actions:** Installing, changing manifests/lockfiles, or moving `./tech-docs-generator/` into `./site/` or `./results/site/`.
- **Risk:** Workspace, dependency, build, and boundary risk.
- **Expected Evidence:** Package status and exact boundary statement; no installation claim.
- **Next Decision:** Select `powers-skills-model` only for an evidenced capability-packaging question; use `graph-impact` for shared dependency impact.

### D18 — Maintain documentation and locked guidance
- **Goal:** Place documentation changes in the canonical home while preserving locked references and legacy constraints.
- **Start Paths:** `./docs/architecture/`; `./docs/database/`; `./docs/governance/`; `./docs/governance/charter.md`; `./docs/governance/focss-stop-drift.md`; `./AGENTS.md`; `./DOC-MAP.md`; `./CONTENTS.md`; `./site/data/storage/`; `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`.
- **Scope:** Durable docs, procedures, plans, guide work, locked paths, legacy paths, and source/projection provenance.
- **Allowed Actions:** Read-only evidence and explicitly owned guide work under `./agents-work/oando-repository-guide/`.
- **Forbidden Actions:** Editing `./docs/`, `./Agents/`, root files, HTML, or legacy source without exact authorization/provenance.
- **Risk:** Authority, documentation, and scope risk.
- **Expected Evidence:** Canonical owner, lock/provenance state, placement, and correction decision.
- **Next Decision:** Use a Workstream Subfolder for authored work; use D22 if ownership is unclear.

### D19 — Place results, generated documents, agent work, and blockers
- **Goal:** Put every output in the correct artifact home without claiming relocation that was not observed.
- **Start Paths:** `./results/`; `./results/tests/`; `./results/site/`; `./results/site-ui/`; `./results/ops/`; `./generated-documents/`; `./agents-work/`; `./plans/`; `./plans/README.md`; `./Failures.md`; `./agent-reports/`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Artifact Class, Workstream/Purpose Subfolder, generator ownership, root legacy artifacts, and blocker placement.
- **Allowed Actions:** Classify and record placement; write only to approved owned guide paths or producer destinations under separate approval.
- **Forbidden Actions:** Handwritten reports in `./results/`, new reports at `./agents-work/` root, generated edits, or duplicate blocker ledgers.
- **Risk:** Evidence integrity and discoverability risk.
- **Expected Evidence:** Artifact fields and observed placement; root artifacts remain `legacy/owner-review pending` when unassigned.
- **Next Decision:** Select approved subfolder and owning source/script before any Output-Producing Task write.

### D20 — Route Kiro skills, Powers, MCP, and agents
- **Goal:** Distinguish repository-local guidance from installed/connected capabilities and route the least powerful option.
- **Start Paths:** `./.kiro/`; `./.kiro/skills/`; `./.kiro/agents/`; `./.kiro/mcp/`; `./.kiro/settings/mcp.json`; `./.kiro/hooks/`; `./skills-lock.json`; `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`.
- **Scope:** Conditional skill routing, Kiro Markdown inventory, Power registry, MCP schema/configuration/connection states, and hook boundaries.
- **Allowed Actions:** Read-only inventory and prose guidance in the owned skill/guide paths.
- **Forbidden Actions:** Power activation, external MCP configuration, hook changes, or treating path presence as runtime availability.
- **Risk:** Capability, external access, credentials, and enforcement risk.
- **Expected Evidence:** Classification and installed/connected state only when separately observed.
- **Next Decision:** Use Local Evidence first; select `powers-skills-model` for capability-packaging tasks.

### D21 — Plan operations, deployment, backups, and incidents
- **Goal:** Produce a read-only operational plan with target, impact, recovery, and approval points.
- **Start Paths:** `./vercel.json`; `./workers/oando-worker-proxy/`; `./config/observability/`; `./.github/workflows/supabase-backup-r2.yml`; `./OPERATIONS_RUNBOOK.md`; `./scripts/`; `./Failures.md`; `./site/instrumentation.ts`; `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`.
- **Scope:** Vercel, Worker, R2, Supabase, observability, backup, deploy, and incident boundaries.
- **Allowed Actions:** Read-only planning and evidence classification.
- **Forbidden Actions:** Deployment, backup, Docker/local-service, remote mutation, or declaring a gate failure without output.
- **Risk:** Infrastructure, data, release, and external-system risk.
- **Expected Evidence:** Target, owner, exact Protected Command, rollback/recovery, and pending authorization.
- **Next Decision:** Select `verify-and-gate` only after validation authorization; keep external actions separately approved.

### D22 — Discover an unknown area safely
- **Goal:** Discover the canonical owner and bounded next action for an omitted or unfamiliar repository topic.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./agents-work/oando-repository-guide/README.md`; `./plans/README.md`; `./.kiro/skills/repo-map/SKILL.md`; `./Failures.md`.
- **Scope:** Local Evidence inventory, authority comparison, risk, candidate card/skill, and gap admission.
- **Allowed Actions:** Read-only discovery and proposed Domain Index/skill update.
- **Forbidden Actions:** Creating a category, package, Power, MCP, or runtime implementation from guesswork.
- **Risk:** Scope, authority, capability, and hidden-constraint risk.
- **Expected Evidence:** Evidence inventory, canonical owner, selected/rejected skills, Coverage-Gap Admission, and next decision.
- **Next Decision:** Add a new card or Package Skill only through a separately approved guidance task.

### Coverage Audit

| Card | Chapter | Coverage state | Evidence limitation | Next decision |
|---|---:|---|---|---|
| D01 Repository map and authority | 01 | Card present | Path presence is not runtime proof | Select domain or D22 |
| D02 Initialization/local development/debugging | 09 | Card present | No service or command result observed | Request exact owner-approved diagnostic |
| D03 Auth/security/secrets | 04 | Card present | Hosted/security behavior unverified | Trace live helper or request scoped approval |
| D04 Environment | 09 | Card present | Private values not inspected as content | Preserve local-private boundary |
| D05 APIs | 04 | Card present | Hosted API behavior unverified | Trace route and data boundary |
| D06 Site UI/SEO/accessibility/performance | 02–03 | Card present | Rendered/performance proof unverified | Apply Site Write Gate and visual checklist |
| D07 UI polish/assets/motion | 03 | Card present | Asset/rendered proof unverified | Reuse existing abstraction and route styling |
| D08 Admin | 03 | Card present | Role/hosted persistence proof unverified | Select data owner before edit |
| D09 CRM/customer queries | 03, 06 | Card present | CRM is local-only; query E2E needs proof | Maintain separate statuses |
| D10 Catalog/configurator/quotes/inventory | 03–04 | Card present | Publish/storage proof unverified | Select Products/Admin owner |
| D11 Planner | 03 | Card present | Boundary/persistence proof pending | Route to Planner and fork skills |
| D12 Studio | 03 | Card present | Boundary/release proof pending | Route to Studio and fork skills |
| D13 AI/retrieval | 03 | Card present | Provider/deployment/evaluation unverified | Record absent AI skill if applicable |
| D14 Databases/persistence | 04 | Card present | Remote state/apply not observed | Require ownership, rollback, RLS/grants |
| D15 Tests/fixtures/Playwright | 05, 10 | Card present | No command result observed | Request exact validation authorization |
| D16 Scripts/command registry | 05 | Card present | Configured is not passed | Classify command before proposal |
| D17 Packages/workspaces | 05 | Card present | Declared is not wired | Preserve sibling boundaries |
| D18 Documentation/locked/legacy | 07 | Card present | HTML provenance unresolved | Keep locked sources read-only |
| D19 Results/generated/agent work/blockers | 07, 09 | Card present | No relocation evidence | Select producer-owned destination |
| D20 Kiro/skills/Powers/MCP/agents | 08 | Card present | Static inventory is not runtime loading | Use Local Evidence first |
| D21 Operations/infrastructure | 06 | Card present | External state unverified | Produce read-only plan |
| D22 Unknown-area discovery | 01, 07, 08 | Card present | New area requires evidence | Propose card/skill only after owner decision |

### Surface Status and Coverage-Gap Admission

Use only `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy`. Every status names Evidence Source, Current Owner, Next Action, and Evidence Limitation. The Admin CRM browser workspace remains `demo/local-only` while the `oando-crm-storage` browser key is the observed persistence boundary; Admin customer-query operations remain a separate database-backed surface. `/admin/product-studio` and the interactive legacy `/planner/*` tree remain `unwired/absent` until live route evidence changes that status; marketing `/planner*` pages remain distinct from `/ooplanner`.

```text
Coverage-Gap Admission Card
Named Area or Capability:
Status:
Evidence Sources Checked:
Evidence Limitation:
Next Evidence Source:
Owner Action:
Scope Boundary:
Next Decision:
```

Do not call an area wired or complete without End-to-End Evidence. Propagate the card to the Plain-Language Response Contract and Completion Record.

## Artifact placement and strict workspace boundaries

| Output | Approved home | Prohibited home |
|---|---|---|
| Agent-authored report/work product | `./agents-work/<workstream>/<report-type>/` or approved `./agents-work/oando-repository-guide/` | `./agents-work/` root, `./results/`, `./site/` |
| Command-generated Machine Evidence | `./results/<purpose>/`, such as `./results/tests/`, `./results/site/`, `./results/site-ui/`, `./results/ops/` | `./results/` root, `./agents-work/`, `./site/` |
| Tech-docs generator output | `./generated-documents/` | `./results/`, `./agents-work/`, `./site/` |
| Active plan material | `./plans/<name>/` indexed by `./plans/README.md` | `./results/`, `./site/`, unowned root |
| True Blocker | Root `./Failures.md`; supporting authored analysis in approved `./agents-work/<workstream>/<report-type>/` | Duplicate ledgers |
| Product source | Approved product source; `./site/` only for an approved Core Product Write | `./site/` for reports, skills, results, prompts, plans, or generated files |
| Repository skill | `./.kiro/skills/` | `./site/`, `./results/`, `./agents-work/` |

> If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.

Keep `./tech-docs-generator/` as a root-level sibling of `./site/`; keep `./generated-documents/` separate; treat `./results/site/` as Machine Evidence, not source or a package relocation target. A Route Record for an Output-Producing Task must name Artifact Class, selected subfolder, filename pattern, owning source/script, authored/generated state, rejected placements, and observed placement in the Completion Record.

### Locked Path Gate

Before any write, classify the exact target as `Locked`, `explicitly owner-authorized`, or `writable`. Treat `./docs/`, `./Agents/`, and every root-level `./*.md` file as read-only evidence unless the Repository Owner explicitly names and authorizes that exact file in the current request. Treat `./.kiro/agents/` as protected read-only evidence as well. A read permission never becomes write/delete permission. If the target is not exact-authorized, stop, preserve the source, record the unavoidable Owner Decision and Separate Approval Work, and put supporting analysis only in an approved `./agents-work/<workstream>/<report-type>/` folder. Do not create a copy and claim the locked source changed. `./agents-work/` is distinct from `./Agents/`.

### Site Write Gate

Before any `./site/` write, the Route Record must classify the target as an explicitly approved Core Product Write or a Non-Core Artifact. A Core Product Write states the exact product outcome, owned paths, matching skills, and expected evidence. Reports, results, audits, handoffs, prompts, plans, skills, steering files, MCP definitions, generated files, temporary files, debug files, and other Non-Core Artifacts are stopped and redirected to their approved non-site home. No workspace/package relocation is implied: moving `./tech-docs-generator/` into `./site/` or `./results/site/` requires a separate Workspace-Boundary Task.

## Plain-Language Response Contract

Every task-start, progress, handoff, pause, and completion response uses this field order: **Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions.** Explain specialized terms before requesting a decision. For output-producing work, also include the artifact fields and observed placement. Missing proof remains pending or blocked; it is never silently promoted to pass.

## Standing Multi-Agent Mode

Every Repository Task starts in Standing Multi-Agent Mode. Before exploration or writing, the coordinator records exactly four Active Agent slots: Scout/Map (read-only orientation), Planner/Risk (read-only scope/risk/command planning), Implementer (write only within approved exclusive paths), and Verifier/Reporter (read-only evidence/closure). One slot carries the Coordinator/Serial Integration Owner designation; this is not a fifth role. The Roster, Ownership Matrix, Route Record, Deliverable Register, Conflict Stop Rule, and Handoff Record register exist before action. Parallel work is limited to read-only research or disjoint ownership; shared paths are serial. If four runtime entries cannot be observed, report `guidance-only` or `not-observed` and do not silently fall back to one Agent. The current guide is prose guidance; automatic spawning, universal pre-action enforcement, hook changes, contract append, Exact-Line migration, and other implementation remain Separate Approval Work.
## Task-classifier table

This table makes the D01–D22 routing decision inspectable. It is a prose index, not a runtime scanner. Each row names the first Local Evidence, every skill that may match, the command boundary, and the completion proof; when no skill trigger matches, select Local Evidence and record the no-match reason.

| Card | Trigger | First Local Evidence | Selected skills | Command classification | Completion evidence |
|---|---|---|---|---|---|
| D01 Repository map and authority | Orientation, authority, or path discovery | `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./plans/README.md` | `repo-map`; `graph-impact` only when shared impact is evidenced | Read-only inspection first | Route Record with authority order, exact paths, and selected/rejected skills |
| D02 Initialization, local development, and debugging | Onboarding, environment, or debugging | `./START.md`; `./AGENTS.md`; `./package.json`; `./config/build/` | `repo-map` | Read-only inspection; install, service, build, test, and debug commands are Protected Commands | Root-working-directory and `pnpm` boundary, environment/status map, or pending owner validation |
| D03 Auth, security, and secrets | Auth, secret, CSRF, rate-limit, RLS, or security boundary | `./site/proxy.ts`; `./site/lib/security/`; `./site/platform/supabase/`; `./.env.example` | `repo-map`; `db-migrations` for schema/RLS/ownership; `graph-impact` for shared security code | Read-only inspection; hosted and security actions are protected or separate | Auth source, secret boundary, data owner, and unverified hosted behavior |
| D04 Environment | Environment values, workspace shape, or local configuration | `./.env.example`; `./.env.local`; `./site/.env.local`; `./pnpm-workspace.yaml` | `repo-map` | Read-only inspection; sync and service commands are pending | Redacted status-labelled environment map and next owner action |
| D05 APIs | Route handler, API catalog, auth, or data-flow discovery | `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md` | `repo-map`; `graph-impact` for shared/API impact; `db-migrations` for schema ownership | Read-only inspection; API tests, builds, and hosted calls are Protected Commands | Route source, auth/data boundary, and hosted-proof limitation |
| D06 Site UI, SEO, accessibility, and performance | Marketing interface, metadata, i18n, accessibility, or performance | `./site/app/(site)/`; `./site/features/site/`; `./site/components/home/`; `./site/focss/site/` | `repo-map`; `focss-css`; `graph-impact` for shared UI | Source inspection first; browser and performance checks are Protected Commands unless explicitly eligible | Route-to-pattern trace, Visual Detail Checklist, and rendered-proof limitation |
| D07 UI polish, icons, alignment, motion, and assets | Visual detail, icon, token, asset, or motion change | `./site/components/`; `./site/focss/`; `./site/public/`; `./scripts/generate-svg/` | `focss-css`; `graph-impact` for shared components; `repo-map` | Read-only inspection; asset generators and browser checks are protected or pending | Existing Phosphor abstraction, alignment/state/accessibility review, asset source, and motion limitation |
| D08 Admin | Internal route, role, Admin feature, or operational data flow | `./site/app/admin/`; `./site/features/admin/`; `./site/lib/admin/`; `./docs/architecture/routes.md` | `repo-map`; `db-migrations`; `focss-css`; `graph-impact` when each trigger is evidenced | Read-only inspection; mutations and database actions are Protected Commands | Route/auth source, Products-or-Admin owner, Surface Status, and behavior limitation |
| D09 CRM demo versus customer-query operations | CRM, customer query, or unwired-surface assessment | `./site/app/admin/crm/`; `./site/features/crm/`; `./site/app/admin/customer-queries/`; `./site/app/api/customer-queries/` | `repo-map`; `db-migrations` for Admin data work | Read-only inspection; no workflow combination or hosted claim | `demo/local-only` CRM status citing `oando-crm-storage`, separate query status, and gap card |
| D10 Catalog, configurator, quotes, and inventory | Catalog, configurator, quote, pricing, inventory, or asset release | `./site/lib/catalog/`; `./site/features/shared/catalog/`; `./site/app/(site)/products/`; `./site/app/admin/inventory/` | `repo-map`; `db-migrations`; `focss-css`; `graph-impact` when triggered | Read-only inspection; seed, publish, storage, migration, and browser actions are Protected Commands | Products/Admin owner, release path, exact scope, and hosted-proof limitation |
| D11 Planner | Planner route, canvas, catalog, persistence, or handoff | `./site/app/ooplanner/`; `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/` | `planner-studio`; `fork-boundaries`; `graph-impact`; `db-migrations`; `focss-css` when triggered | Read-only inspection; boundary, browser, persistence, tests, and builds are Protected Commands | Planner-only source evidence, fork boundary state, and pending proof where unobserved |
| D12 Studio | Studio route, furniture, descriptor, canvas, catalog, or handoff | `./site/app/oostudio/`; `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/` | `planner-studio`; `fork-boundaries`; `graph-impact`; `db-migrations`; `focss-css` when triggered | Read-only inspection; publish, provider, browser, persistence, tests, and builds are protected | Studio-only source/release evidence, no-cross-import state, and pending hosted proof |
| D13 AI and retrieval | Mastra, Bedrock, LanceDB, Orama, Fuse.js, embeddings, retrieval, or advisory output | `./site/lib/ai/mastra/`; `./site/app/api/ai-advisor/`; `./site/app/api/Studio/ai/`; `./docs/architecture/stack.md` | `repo-map`; `ai-retrieval` only if `./.kiro/skills/ai-retrieval/SKILL.md` exists; all other matching skills | Read-only inspection; provider, package, build, test, and external actions are Protected or separate | Advisory boundary, source evidence, missing-skill state, and no unsupported deployment/evaluation claim |
| D14 Databases, RLS, grants, rollback, and mode-aware persistence | Schema, SQL, migration, ownership, persistence, RLS, grants, or rollback | `./site/platform/supabase/migrations/`; `./site/platform/supabase/migrations.admin/`; `./site/platform/drizzle/schema/`; persistence selectors | `db-migrations`; `graph-impact`; `planner-studio` and `fork-boundaries` when fork persistence is implicated | Read-only inspection; dry runs, applies, types, seeds, and remote DB actions are Protected Commands | Products/Admin owner, migration path, RLS/grants/rollback, mode, and pending hosted proof |
| D15 Tests, fixtures, mocks, and validation | Test, fixture, mock, browser, coverage, or validation planning | `./tests/`; `./tests/unit/`; `./tests/integration/`; `./tests/e2e/`; `./package.json` | `repo-map`; `verify-and-gate` only after exact authorization and Hook Permission; `graph-impact` when triggered | Tests, browser runners, coverage, builds, and gates are Protected Commands | Exact command, root cwd, authorization, hook decision, exit status, scope, and limitation |
| D16 Scripts and command registry | Script, command, CI, or operational dispatch discovery | `./package.json`; `./scripts/`; `./scripts/run-ops.mjs`; `./scripts/ops-command-registry.mjs` | `repo-map`; `graph-impact`; `verify-and-gate` only for authorized validation planning | Read-only inspection; operational scripts and commands are Protected or pending | Configured-versus-observed status and exact command classification; `pnpm run typecheck:scripts` is unavailable |
| D17 Packages, dependencies, and workspace boundaries | Package, import, manifest, lockfile, or workspace question | `./package.json`; `./pnpm-workspace.yaml`; `./pnpm-lock.yaml`; `./site/tsconfig.json`; `./tech-docs-generator/package.json` | `repo-map`; `graph-impact`; `powers-skills-model` only for capability packaging | Read-only inspection; install, build, lockfile, and workspace changes are protected or separate | Declared/imported/configured status, no `./site/package.json`, and sibling-boundary evidence |
| D18 Documentation, architecture, locked, and legacy guidance | Durable docs, procedure, plan, guide, locked, or legacy path | `./docs/architecture/`; `./docs/database/`; `./docs/governance/`; `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md` | `repo-map`; `focss-css` when locked FOCSS guidance is implicated | Read-only inspection; locked writes require exact owner authorization | Canonical owner, lock/legacy state, placement, provenance, and correction decision |
| D19 Results, generated documents, agent work, and blockers | Artifact placement, report, result, generated output, plan, or blocker | `./results/`; `./results/tests/`; `./results/site/`; `./generated-documents/`; `./agents-work/`; `./plans/README.md` | `repo-map`; Local Evidence from `./plans/README.md` for plan coordination | Read-only inspection; producer commands are classified separately | Artifact Class, exact subfolder, filename pattern, producer, authored/generated state, and observed placement |
| D20 MCP, skills, Powers, and agents | Kiro skill, steering, agent, hook, MCP, or capability packaging question | `./.kiro/`; `./.kiro/skills/`; `./.kiro/agents/`; `./.kiro/mcp/`; `./.kiro/settings/mcp.json` | `powers-skills-model`; `repo-map` | Read-only inspection; hook/settings/MCP changes and Power activation are separate approval work | Static classification, registry/configuration/connection distinction, and runtime limitation |
| D21 Operations, deployment, backups, observability, and incidents | Vercel, Worker, R2, Supabase, backup, observability, deployment, or incident | `./vercel.json`; `./workers/oando-worker-proxy/`; `./config/observability/`; `./OPERATIONS_RUNBOOK.md`; `./Failures.md` | `repo-map`; `db-migrations` when DB ownership is implicated; `verify-and-gate` only after authorization | Deploy, backup, Docker/local-service, remote, and incident commands are Protected Commands | Target, owner, impact, exact pending command, rollback/recovery, and unverified external state |
| D22 Unknown-area discovery | Omitted, unfamiliar, or newly discovered repository area | `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./.kiro/skills/repo-map/SKILL.md`; `./plans/README.md` | `repo-map`; `powers-skills-model` only for an evidenced capability question; otherwise every later match is conditional | Read-only inspection first; no new category, package, Power, MCP, or runtime action by guesswork | Evidence inventory, canonical owner, risk, Coverage-Gap Admission, and proposed next decision |

### Protected-root scope clarification

The Locked Path Gate uses the broader Protected Path Set from the approved addendum: every file directly under `./` is read-only evidence by default, in addition to every path under `./docs/`, every path under `./Agents/`, and every path under `./.kiro/agents/`. The earlier root-level Markdown shorthand is a minimum example, not an exclusion of non-Markdown root control files. Only the exact file named and authorized by the Repository Owner in the current request may be written or deleted; a copy or mirror never proves that the protected source changed.