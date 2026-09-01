# Oando repository guide

This is the complete, multi-page map of the repository: product code, data, APIs, tooling, CI, operations, documentation, the agent workspace and guidance layer, local/generated output, and validation. It maps **every meaningful area**, not every dependency or generated file. The guide's Markdown is the source of truth under `./agents-work/oando-repository-guide/markdown/`; the `html/` projection (plus `guide.css`) is regenerated deterministically by the tech-docs pipeline (`node tech-docs-generator/scripts/generate-all.mjs`) - never hand-edit generated HTML.

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
| Agent workspace: skills, specs, settings history, and MCP inventory | [08 · Agent workspace](markdown/08-agent-workspace.md) |
| Environment files, generated output, results, editor/VCS/local tooling | [09 · Local, generated, and environment areas](markdown/09-local-generated-environment.md) |
| Tests, gates, evidence, validation authorization | [10 · Quality and validation](markdown/10-quality-validation.md) |
| Working with agents: modes, prompts, and skill routing | [11 · Working with agents](markdown/11-agent-workflows.md) |

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

The live repository has **no root `./supabase/` directory**—Supabase code and migrations are under `./site/platform/supabase/` (`migrations/` for Products and `migrations.admin/` for Admin). There is also **no root `./mcp/` directory and no repository MCP schema directory at all**. This guide uses the live paths only; there is no generated projection surface for these Markdown chapters.

## Begin Here: describe the outcome, not the repository vocabulary

Start with one ordinary-language sentence describing the desired outcome. Do not require the contributor to know a path, package, skill, command, or workflow mode. The router performs these steps before any modification or output selection:

1. Begin at the root `./AGENTS.md` process floor and apply the authority order: current user instruction → live code and fresh command output → `AGENTS.md` → `Agents/` (start at `./Agents/INDEX.md`; handbooks `01`–`07`) → `docs/`; use `./plans/README.md` for active coordination after those sources. The live skill routing layer is the user-global opencode skills under `~/.config/opencode/`—`oando-repo-map`, `oando-testing`, `oando-focss-css`, `oando-databases`, and `oando-browser-ui`—plus Local Evidence; these are not repository paths.
2. Restate the outcome with an action verb and the inferred Product Surface or repository domain; define specialized terms before requesting a decision.
3. Select exact first evidence locations and explain why each is first.
4. Select one D01–D22 Domain Index card, or D22 when the topic is unfamiliar.
5. Select every matching opencode skill, reject non-matching or unavailable skills with reasons, and select Local Evidence when no skill matches. The selection/rejection/Local-Evidence mechanism is additive: skills are routing aids, not runtime switches.
6. Choose `Vibe`, `Plan`, `Spec`, `Autopilot`, or `Supervised` from risk and scope; this is guidance, not a runtime switch.
7. Classify each proposed command as `read-only inspection`, `Normal-Agent Eligible Check`, `Protected Command`, or `no-run pending authorization` before suggesting or running it. Tests, gates, builds, browser checks, and coverage require exact current-session authorization per `./AGENTS.md`.
8. For an Output-Producing Task, declare Artifact Class, exact approved output home, filename pattern, owning source/script, authored-or-generated state, and rejected placements. Apply the Site Write Gate before any `./site/` write.
9. Request only unavoidable Owner Decisions. If safe modification facts are missing, choose read-only discovery instead.

### Route Record

Every Repository Task has a Route Record before modification:

```text
Outcome:
Domain / Domain Index card:
Exact first evidence locations and reasons:
Candidate paths:
Selected skills and trigger evidence:
Rejected skills and reasons:
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

A matching skill is additive: select all matching skills, not one assumed skill. If none matches, select Local Evidence and record why. If a recurring repository task lacks a matching skill, record a separate skill proposal with its trigger, authority sources, safety boundary, and completion expectation; do not represent the proposal as an available skill.

## Coverage-Audited Repository Domain Index

The 22 cards below are outcome-focused, coverage-audited starting points, not claims that a route or capability is wired. A listed path can be absent, generated, local-private, legacy, or unverified. "Skills" means the live user-global opencode skills named in Begin Here, or Local Evidence. The Coverage Audit summary supplies each card's chapter mapping; each card's Start Paths are its Verified Paths and the single path authority. These fields apply once to every card; each card then carries only its own Goal, Start Paths, Scope, Allowed/Forbidden, Risk, Expected Evidence, and Next Decision:

- **Evidence Steps:** (a) read authority sources in authority order; (b) inspect the listed Start Paths; (c) compare documentation with live repository evidence; (d) classify Surface Status and operational risk; (e) record evidence, gaps, the Route Record, and the Next Decision.
- **Required Actions:** complete the ordered Evidence Steps; create or update the Route Record; select every matching skill and record rejected or unavailable skills; classify each proposed command; record a Surface Status or Coverage-Gap Admission before the Next Decision. Use the matching Task-classifier row for routing; reject non-matches/unavailable skills with plain-language reasons, and use Local Evidence with a no-match reason when needed.
- **Surface Status:** use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** declare Artifact Class, exact Workstream or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact. Every write also passes the Locked Path Gate.

These fields are guidance records only: they do not prove runtime loading, enforcement, rendered behavior, hosted persistence, relocation, or a wired capability.

### D01 — Map repository authority
- **Goal:** Map repository authority and the first safe inspection path. **Scope:** authority order, exact paths, source/generated/private/legacy classification, and task routing.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./Agents/`; `./docs/architecture/layout.md`; `./docs/architecture/stack.md`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./plans/README.md`.
- **Allowed:** read-only mapping, Route Record creation, approved guide edits in owned paths. **Forbidden:** guessing paths, treating a document as self-validating, changing locked authority files.
- **Risk:** documentation and scope risk. **Expected Evidence:** authority order, exact first paths, selected/rejected skills, and next decision. **Next Decision:** choose the next domain card or D22 discovery.

### D02 — Initialize, develop, and debug safely
- **Goal:** Map initialization, local development, and debugging without starting services by assumption. **Scope:** root `pnpm` boundary, environment state, local/private/generated areas, and reported symptoms.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./Agents/`; `./package.json`; `./site/`; `./config/build/`; `./Failures.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Allowed:** read-only inventory and bounded diagnosis planning. **Forbidden:** installing, starting, building, testing, or changing environment files without exact authorization.
- **Risk:** local environment, secrets, and service risk. **Expected Evidence:** status-labelled environment map or explicit pending owner validation. **Next Decision:** select the smallest read-only diagnostic; all service/test/build commands remain Protected Commands.

### D03 — Trace auth, security, and secrets
- **Goal:** Trace authentication and security boundaries without exposing secrets or weakening controls. **Scope:** edge and handler auth, CSRF/rate limits/RLS references, secret boundaries, and evidence limitations.
- **Start Paths:** `./site/proxy.ts`; `./site/lib/security/`; `./site/platform/supabase/`; `./.env.example`; `./.env.local`; `./site/.env.local`; `./docs/architecture/stack.md`.
- **Allowed:** read approved helpers and classify data/security risk. **Forbidden:** printing secrets, client-side service keys, changing security controls, or making hosted calls.
- **Risk:** security, credentials, and data access. **Expected Evidence:** auth source, secret boundary, owner, and unverified hosted behavior. **Next Decision:** route schema/RLS work to the `oando-databases` skill only when evidence matches.

### D04 — Classify environment state
- **Goal:** Classify local environment values and workspace boundaries without exposing private configuration. **Scope:** configured shape versus local/private values, workspace packages, and absent/stale claims.
- **Start Paths:** `./.env.example`; `./.env.local`; `./site/.env.local`; `./package.json`; `./pnpm-workspace.yaml`; `./START.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Allowed:** read-only classification and safe documentation updates in owned guide paths. **Forbidden:** syncing, printing, committing, or changing environment values.
- **Risk:** secret and environment risk. **Expected Evidence:** status-labelled map with private values redacted and next owner action. **Next Decision:** ask for a separate environment or service approval only if required.

### D05 — Locate and assess APIs
- **Goal:** Trace an API outcome from route handler through auth, data boundary, and proof. **Scope:** route ownership, request/security controls, persistence boundary, and source-level evidence.
- **Start Paths:** `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md`; `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`.
- **Allowed:** read-only route mapping and bounded source edits when explicitly approved. **Forbidden:** hosted requests, migrations, secret exposure, or claiming API behavior from a filename.
- **Risk:** API, auth, data, and release risk. **Expected Evidence:** route source, auth/CSRF/data boundary, and proof limitation. **Next Decision:** select `oando-repo-map` or `oando-databases` only when the trigger is evidenced.

### D06 — Improve Site UI, SEO, accessibility, or performance
- **Goal:** Improve a marketing interface through the route, feature, component, FOCSS zone, and accessibility contract. **Scope:** UI structure, metadata/SEO, i18n, responsive/accessibility states, and performance planning.
- **Start Paths:** `./site/app/(site)/`; `./site/features/site/`; `./site/components/home/`; `./site/focss/site/`; `./site/i18n/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./docs/architecture/css.md`.
- **Allowed:** approved Core Product Writes only after the Site Write Gate; use existing patterns. **Forbidden:** non-Core artifacts under `./site/`, custom CSS systems, or browser/performance claims without proof.
- **Risk:** product UI, accessibility, release, and shared-code risk. **Expected Evidence:** Visual Detail Checklist and exact static/rendered-proof limitation. **Next Decision:** route styling/token work to `oando-focss-css` and rendered checks to `oando-browser-ui`.

### D07 — Polish UI, icons, alignment, motion, or assets
- **Goal:** Complete a bounded visual improvement using existing icon, token, asset, and motion patterns. **Scope:** existing Phosphor abstraction, alignment, spacing, responsive layout, states, keyboard reachability, reduced motion, licensing, and asset ownership.
- **Start Paths:** `./site/components/`; `./site/focss/`; `./site/public/`; `./scripts/generate-svg/`; `./docs/architecture/css.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Allowed:** reuse existing components and generation paths after a Core Product Write route is approved. **Forbidden:** new icon libraries, custom CSS systems, external asset tooling, or skipped loading/empty/error review.
- **Risk:** UI consistency, accessibility, asset licensing, and motion risk. **Expected Evidence:** Visual Detail Checklist, asset source, motion-preference review, and proof limitation. **Next Decision:** select `oando-focss-css` whenever styling/tokens/FOCSS evidence matches.

### D08 — Work in Admin
- **Goal:** Trace an Admin outcome through route, feature, auth, ownership, and operational risk. **Scope:** internal routes, roles, catalog/inventory/plans/price books/themes, and Products versus Admin ownership.
- **Start Paths:** `./site/app/admin/`; `./site/features/admin/`; `./site/components/`; `./site/lib/admin/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`.
- **Allowed:** read-only mapping or approved product edits with exact owned paths. **Forbidden:** remote mutations, migrations, service-role exposure, or treating demo state as hosted state.
- **Risk:** admin authorization, data, and operational risk. **Expected Evidence:** route, auth owner, database owner, and behavior limitation. **Next Decision:** route schema/RLS to `oando-databases` and shared impact to `oando-repo-map` when evidenced.

### D09 — Assess CRM demo versus customer-query operations
- **Goal:** Distinguish the local CRM browser workspace from Admin Database-backed customer-query operations. **Scope:** Surface Status, `oando-crm-storage` Zustand/local browser persistence, customer-query API/data ownership, and missing end-to-end proof.
- **Start Paths:** `./site/app/admin/crm/`; `./site/features/crm/`; `./site/app/admin/customer-queries/`; `./site/app/api/customer-queries/`; `./site/features/ops/`; `./docs/architecture/product-map.md`.
- **Allowed:** read-only comparison and Coverage-Gap Admission. **Forbidden:** combining the workflows or calling the CRM demo wired to Admin data without evidence.
- **Risk:** data ownership, customer operations, and overclaim risk. **Expected Evidence:** CRM `demo/local-only` status plus separate customer-query status and next evidence source. **Next Decision:** record `present-but-unverified` or `unwired/absent` where end-to-end proof is missing.

### D10 — Trace catalog, configurator, quotes, or inventory
- **Goal:** Trace catalog-facing work to the correct Products/Admin owner and release path. **Scope:** catalog/configurator/quote/inventory routes, assets, pricing, data ownership, and persistence.
- **Start Paths:** `./site/lib/catalog/`; `./site/features/shared/catalog/`; `./site/app/(site)/products/`; `./site/app/(site)/quote-cart/`; `./site/app/admin/catalog/`; `./site/app/admin/inventory/`; `./site/app/api/configurator/`; `./site/platform/supabase/migrations/`.
- **Allowed:** read-only mapping or approved source changes after ownership selection. **Forbidden:** seed/publish/storage/migration actions without Protected Command authorization.
- **Risk:** product data, pricing, inventory, release, and database risk. **Expected Evidence:** Products/Admin owner, asset/release path, and hosted-proof limitation. **Next Decision:** select `oando-databases` for schema/ownership and `oando-focss-css` for styling triggers.

### D11 — Change Planner safely
- **Goal:** Change or assess Planner behavior while preserving its fork, canvas scale, state, and persistence assumptions. **Scope:** Planner route, canvas, dockview shell, catalog, project persistence, and handoff.
- **Start Paths:** `./site/app/ooplanner/`; `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/`; `./site/hooks/Planner/`; `./site/store/Planner/`; `./site/server/Planner/`; `./site/platform/Planner/`; `./site/app/api/Planner/`; `./AGENTS.md` (fork rules).
- **Allowed:** exact Planner-owned Core Product Write only after route and ownership approval. **Forbidden:** Studio imports, cross-fork copying, persistence changes, or unapproved boundary scans/browser checks.
- **Risk:** fork boundary, persistence, canvas, and release risk. **Expected Evidence:** Planner-only source evidence; boundary/persistence behavior remains pending without authorized proof. **Next Decision:** use `oando-repo-map` for the fork boundary, `oando-databases` for persistence, and `oando-browser-ui` for authorized UI evidence.

### D12 — Change Studio safely
- **Goal:** Change or assess Studio behavior while preserving its separate furniture, descriptor, state, and canvas assumptions. **Scope:** Studio authoring, furniture assets, descriptor publishing, AI helpers, and dockview/canvas behavior.
- **Start Paths:** `./site/app/oostudio/`; `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/`; `./site/hooks/Studio/`; `./site/store/Studio/`; `./site/server/Studio/`; `./site/platform/Studio/`; `./site/app/api/Studio/`; `./AGENTS.md` (fork rules).
- **Allowed:** exact Studio-owned Core Product Write only after route and ownership approval. **Forbidden:** Planner imports, cross-fork copying, remote publish, or unapproved checks.
- **Risk:** fork boundary, furniture data, descriptor release, and AI advisory risk. **Expected Evidence:** Studio-only source/release evidence and unverified hosted behavior where applicable. **Next Decision:** use `oando-repo-map` for the fork boundary and `oando-databases` for furniture/descriptor data.

### D13 — Assess AI and retrieval
- **Goal:** Assess server-side AI/retrieval behavior as advisory output without overstating provider or deployment evidence. **Scope:** Mastra, Bedrock, LanceDB, Orama, Fuse.js, embeddings, providers, advisory output, and evidence limits.
- **Start Paths:** `./site/lib/ai/mastra/`; `./site/app/api/ai-advisor/`; `./site/app/api/Studio/ai/`; `./site/features/Studio/`; `./docs/architecture/stack.md`.
- **Allowed:** Local-Evidence-first source mapping and approved guidance updates. **Forbidden:** provider calls, package installation, or deployment/evaluation claims.
- **Risk:** external provider, credentials, data, and unsupported-claim risk. **Expected Evidence:** advisory boundary, retrieval/provider source, and unverified status. **Next Decision:** use `oando-repo-map` or Local Evidence; no live skill is dedicated to retrieval, so record the gap.

### D14 — Select database ownership and persistence mode
- **Goal:** Select Products or Admin ownership and preserve RLS, grants, rollback, and mode-aware persistence. **Scope:** database ownership, deployable migrations, RLS/grants, rollback, and production read-only filesystem.
- **Start Paths:** `./site/platform/supabase/migrations/`; `./site/platform/supabase/migrations.admin/`; `./site/platform/drizzle/schema/`; `./site/lib/Planner/plannerPersistenceMode.ts`; `./site/lib/catalog/furnitureCatalogMode.ts`; `./site/platform/shared/data/furniture/`; `./site/inventory/descriptors/`; `./docs/database/schema.md`; `./docs/database/ops.md`; `./docs/database/drizzle.md`.
- **Allowed:** read-only schema planning; approved migration edits only in the correct migration path. **Forbidden:** direct schema changes, missing `-- rollback`, dual writes, production disk writes, or apply commands without authorization.
- **Risk:** data loss, access control, persistence, and release risk. **Expected Evidence:** owner, migration path, policies/grants/rollback, mode, and pending dry-run/hosted proof. **Next Decision:** select `oando-databases`; select `oando-repo-map` for shared impact when triggered.

### D15 — Plan tests, fixtures, mocks, and validation
- **Goal:** Classify the narrowest validation lane without treating a plan or one Vitest lane as proof of all behavior. **Scope:** two Vitest lanes, Playwright, fixtures, helpers, command authorization, and evidence limitations.
- **Start Paths:** `./tests/`; `./tests/unit/`; `./tests/integration/`; `./tests/e2e/`; `./tests/fixtures/`; `./tests/helpers/`; `./tests/tech-docs-generator/`; `./config/build/`; `./Testing-handbook.md`; `./package.json`.
- **Allowed:** read-only validation planning; exact check execution only when current-session authorization and hook permission exist per `./AGENTS.md`. **Forbidden:** running tests/gates/builds/browser checks by convention or claiming unobserved output.
- **Risk:** quality, release, and owner-control risk. **Expected Evidence:** exact command, root cwd, scope, authorization, hook decision, exit status, limitation, or pending state. **Next Decision:** select `oando-testing` only after explicit authorization and hook conditions are established.

### D16 — Inspect scripts and command registry
- **Goal:** Map a script or command from its manifest entry through implementation and classify its operational risk. **Scope:** root script authority, dispatch, static checks, operations, and unavailable command claims.
- **Start Paths:** `./package.json`; `./scripts/`; `./scripts/run-ops.mjs`; `./scripts/ops-command-registry.mjs`; `./config/build/`; `./docs/architecture/scripts.md`; `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`.
- **Allowed:** read-only inspection and documentation corrections in owned paths. **Forbidden:** executing a script, inventing a command, or recommending `pnpm run typecheck:scripts` while `./scripts/tsconfig.json` is absent.
- **Risk:** command, data, infrastructure, and validation risk. **Expected Evidence:** configured-versus-observed command status and exact authorization state. **Next Decision:** route validation planning to `oando-testing` only when permitted.

### D17 — Map packages, dependencies, and workspace boundaries
- **Goal:** Distinguish declared, imported, configured, and observed packages without changing installation or workspace boundaries. **Scope:** root workspace, absent `./site/package.json`, tech-docs sibling boundary, live imports, and package-addition approval.
- **Start Paths:** `./package.json`; `./pnpm-workspace.yaml`; `./pnpm-lock.yaml`; `./site/`; `./site/tsconfig.json`; `./tech-docs-generator/`; `./tech-docs-generator/package.json`; `./docs/architecture/stack.md`.
- **Allowed:** read-only package/status mapping. **Forbidden:** installing, changing manifests/lockfiles, or moving `./tech-docs-generator/` into `./site/` or `./results/site/`.
- **Risk:** workspace, dependency, build, and boundary risk. **Expected Evidence:** package status and exact boundary statement; no installation claim. **Next Decision:** use `oando-repo-map` for shared dependency impact; capability-packaging questions go to Local Evidence.

### D18 — Maintain documentation and locked guidance
- **Goal:** Place documentation changes in the canonical home while preserving locked references and legacy constraints. **Scope:** durable docs, procedures, plans, guide work, locked paths, and legacy paths.
- **Start Paths:** `./docs/architecture/`; `./docs/database/`; `./docs/governance/`; `./docs/governance/charter.md`; `./docs/governance/focss-stop-drift.md`; `./AGENTS.md`; `./Agents/`; `./DOC-MAP.md`; `./CONTENTS.md`; `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`.
- **Allowed:** read-only evidence and explicitly owned guide work under `./agents-work/oando-repository-guide/`. **Forbidden:** editing `./docs/`, `./Agents/`, root files, or legacy source without exact authorization.
- **Risk:** authority, documentation, and scope risk. **Expected Evidence:** canonical owner, lock state, placement, and correction decision. **Next Decision:** use a Workstream Subfolder for authored work; use D22 if ownership is unclear.

### D19 — Place results, generated documents, agent work, and blockers
- **Goal:** Put every output in the correct artifact home without claiming relocation that was not observed. **Scope:** Artifact Class, Workstream/Purpose Subfolder, generator ownership, root legacy artifacts, and blocker placement.
- **Start Paths:** `./results/`; `./results/tests/`; `./results/site/`; `./results/site-ui/`; `./results/ops/`; `./generated-documents/`; `./agents-work/`; `./Agents/`; `./plans/`; `./plans/README.md`; `./Failures.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Allowed:** classify and record placement; write only to approved owned guide paths or producer destinations under separate approval. **Forbidden:** handwritten reports in `./results/`, new reports at `./agents-work/` root, generated edits, or duplicate blocker ledgers.
- **Risk:** evidence integrity and discoverability risk. **Expected Evidence:** artifact fields and observed placement; root artifacts remain `legacy/owner-review pending` when unassigned. **Next Decision:** select the approved subfolder and owning source/script before any Output-Producing Task write.

### D20 — Route agent skills and capabilities
- **Goal:** Distinguish the live capability layer from repository guidance and route the least powerful option. **Scope:** conditional skill routing via the user-global opencode skills (`oando-repo-map`, `oando-testing`, `oando-focss-css`, `oando-databases`, `oando-browser-ui`), Local Evidence fallback, and the agent-workspace history in chapter 08.
- **Start Paths:** `./AGENTS.md`; `./Agents/INDEX.md`; `./skills-lock.json` (verified present; pins only an external `launchdarkly/agent-skills` `onboarding` skill and does not govern the live opencode guidance); `./agents-work/oando-repository-guide/markdown/08-agent-workspace.md`.
- **Allowed:** read-only inventory and prose guidance in the owned guide paths. **Forbidden:** external-integration activation, hook/settings changes, or treating path presence as runtime availability.
- **Risk:** capability, external access, credentials, and enforcement risk. **Expected Evidence:** classification, with installed/connected state only when separately observed. **Next Decision:** use Local Evidence first; capability-packaging questions route to the user-global opencode configuration under `~/.config/opencode/`, not a repository path.

### D21 — Plan operations, deployment, backups, and incidents
- **Goal:** Produce a read-only operational plan with target, impact, recovery, and approval points. **Scope:** Vercel, Worker, R2, Supabase, observability, backup, deploy, and incident boundaries.
- **Start Paths:** `./vercel.json`; `./workers/oando-worker-proxy/`; `./config/observability/`; `./.github/workflows/supabase-backup-r2.yml`; `./OPERATIONS_RUNBOOK.md`; `./scripts/`; `./Failures.md`; `./site/instrumentation.ts`; `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`.
- **Allowed:** read-only planning and evidence classification. **Forbidden:** deployment, backup, Docker/local-service, remote mutation, or declaring a gate failure without output.
- **Risk:** infrastructure, data, release, and external-system risk. **Expected Evidence:** target, owner, exact Protected Command, rollback/recovery, and pending authorization. **Next Decision:** select `oando-testing` only after validation authorization; keep external actions separately approved.

### D22 — Discover an unknown area safely
- **Goal:** Discover the canonical owner and bounded next action for an omitted or unfamiliar repository topic. **Scope:** Local Evidence inventory, authority comparison, risk, candidate card/skill, and gap admission.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./Agents/INDEX.md`; `./docs/architecture/layout.md`; `./plans/README.md`; `./Failures.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`.
- **Allowed:** read-only discovery and a proposed Domain Index/skill update. **Forbidden:** creating a category, package, external integration, or runtime implementation from guesswork.
- **Risk:** scope, authority, capability, and hidden-constraint risk. **Expected Evidence:** evidence inventory, canonical owner, selected/rejected skills, Coverage-Gap Admission, and next decision. **Next Decision:** add a new card or skill proposal only through a separately approved guidance task.

### Coverage Audit summary

Each card audits exactly one row; Verified Paths point to that card's Start Paths, which remain the single path authority. Chapter mapping: D01→01, D02→09, D03→04, D04→09, D05→04, D06→02–03, D07→03, D08→03, D09→03+06, D10→03–04, D11→03, D12→03, D13→03, D14→04, D15→05+10, D16→05, D17→05, D18→07, D19→07+09, D20→08, D21→06, D22→01+07+08. Every card is static guidance with `present-but-unverified` status except D09, whose CRM browser workspace is `demo/local-only`; within D08/D11, `/admin/product-studio` and the interactive legacy `/planner/*` tree are `unwired/absent`. Evidence sources are the listed Start Paths compared against live repository output; the shared limitation is that path or document presence never proves runtime routing, rendered behavior, hosted persistence, or completeness. Each card's Next Decision is its listed Next Decision field.

### Surface Status and Coverage-Gap Admission

Use only `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy`. Every status names Evidence Source, Current Owner, Next Action, and Evidence Limitation. The Admin CRM browser workspace remains `demo/local-only` while the `oando-crm-storage` browser key is the observed persistence boundary; Admin customer-query operations remain a separate database-backed surface. `/admin/product-studio` and the interactive legacy `/planner/*` tree remain `unwired/absent` until live route evidence changes that status; marketing `/planner*` pages remain distinct from `/ooplanner`.

```text
Coverage-Gap Admission Card
Named Area or Capability:
Status:
Current Owner:
Evidence Sources Checked:
Evidence Limitation:
Next Evidence Source:
Owner Action:
Scope Boundary:
Next Decision:
```

Do not call an area wired or complete without End-to-End Evidence. Propagate the card to the Plain-Language Response Contract and Completion Record. A Coverage-Gap Admission is not by itself a True Blocker; an evidenced True Blocker belongs only in root `./Failures.md`.

## Artifact placement and strict workspace boundaries

| Output | Approved home | Prohibited home |
|---|---|---|
| Agent-authored report/work product | `./agents-work/<workstream>/<report-type>/` or approved `./agents-work/oando-repository-guide/` | `./agents-work/` root, `./results/`, `./site/` |
| Command-generated Machine Evidence | `./results/<purpose>/`, such as `./results/tests/`, `./results/site/`, `./results/site-ui/`, `./results/ops/` | `./results/` root, `./agents-work/`, `./site/` |
| Tech-docs generator output | `./generated-documents/` | `./results/`, `./agents-work/`, `./site/` |
| Active plan material | `./plans/<name>/` indexed by `./plans/README.md` | `./results/`, `./site/`, unowned root |
| Agent skills | User-global opencode configuration (`~/.config/opencode/`), outside this repository | `./site/`, `./results/`, `./agents-work/` |
| True Blocker | Root `./Failures.md`; supporting authored analysis in approved `./agents-work/<workstream>/<report-type>/` | Duplicate ledgers |
| Product source | Approved product source; `./site/` only for an approved Core Product Write | `./site/` for reports, skills, results, prompts, plans, or generated files |

> If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site. Keep `./tech-docs-generator/` as a root-level sibling of `./site/`; keep `./generated-documents/` separate; treat `./results/site/` as Machine Evidence, not source or a package relocation target.

### Locked Path Gate

Before any write, classify the exact target as `Locked`, `explicitly owner-authorized`, or `writable`. Treat every file directly under `./` (including root Markdown and control files), every path under `./docs/`, and every path under `./Agents/` as read-only evidence unless the Repository Owner explicitly names and authorizes that exact file in the current request; this follows the current-session authorization rule in `./AGENTS.md`. A read permission never becomes write/delete permission. If the target is not exact-authorized, stop, preserve the source, record the unavoidable Owner Decision and Separate Approval Work, and put supporting analysis only in an approved `./agents-work/<workstream>/<report-type>/` folder. Do not create a copy, mirror, generated substitute, or report and claim the locked source changed. `./agents-work/` is distinct from `./Agents/`; the exact `./agents-work/oando-repository-guide/README.md` target is writable here only because the current request explicitly names it. The Protected Path Set covers every file directly under `./` by default (root Markdown shorthand is a minimum example, not an exclusion of non-Markdown control files), in addition to `./docs/` and `./Agents/`; a copy or mirror never proves that the protected source changed.

### Site Write Gate

Before any `./site/` write, the Route Record must classify the target as an explicitly approved Core Product Write or a Non-Core Artifact. A Core Product Write states the exact product outcome, owned paths, matching skills, and expected evidence. Reports, results, audits, handoffs, prompts, plans, skills, generated files, temporary files, debug files, and other Non-Core Artifacts are stopped and redirected to their approved non-site home. No workspace/package relocation is implied: moving `./tech-docs-generator/` into `./site/` or `./results/site/` requires a separate Workspace-Boundary Task.

## Plain-Language Response Contract

Explain specialized terms before requesting a decision. Every task-start, progress, handoff, pause, and completion response uses this field order: **Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions.** If an output is produced, also report Artifact Class, exact subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, Locked Path Gate, Site Write Gate when relevant, and observed placement. Missing proof remains `pending`, `blocked`, or `not-observed`; it is never silently promoted to pass, wired, complete, runtime, rendered, hosted, or relocated.

**Completion Record.** At completion or pause, repeat the selected and rejected skills from the Route Record, the changed scope (or the inspected scope when no files changed), exact observed static or authorized evidence, pending validation with the exact command and authorization limitation, Coverage-Gap Admissions, Separate Approval Work, True Blockers, next owner, and status. State the repository-root working directory for any command evidence, the Hook Decision and exit status when a command was actually observed, and the behavior that remains unverified. A command name, plan, inline marker, path, import, or prose rule is not a command result. If no files changed, say so and state the decision reached. A True Blocker is an evidenced condition preventing completion within authorized scope and is recorded only in root `./Failures.md`; do not create a duplicate ledger.

## Standing Multi-Agent Mode

Every Repository Task starts in Standing Multi-Agent Mode. Before exploration or writing, the coordinator records exactly four Active Agent slots and one owner for serial integration:

| Slot | Role | Permission | Bounded responsibility |
|---|---|---|---|
| Scout/Map | Read-only orientation and path discovery | Read-only | Authority order, exact evidence locations, candidate paths, and repository map |
| Planner/Risk | Scope, skill, risk, command, and approval planning | Read-only | Route Record, additive/rejected skill decisions, Operational-Risk and Command Classification, ownership proposals, and pending checks |
| Implementer | Approved change within exact exclusive paths | Write only after approval and ownership | Smallest sound change in the named paths; preserve unrelated work and stop on conflict or scope drift |
| Verifier/Reporter | Evidence review and closure | Read-only | Static read-back, Coverage-Gap review, Completion Record, and Plain-Language Response Contract reporting |

Attach `Coordinator/Serial Integration Owner` to one of these slots; it is a function, not a fifth role. Before action, publish the Agent Roster, Ownership Matrix, Route Record, Deliverable Register, Pre-Action Gate Records when applicable, Handoff Record Register, and Conflict Stop Rule. Declare exact paths and read/write permission, exclusions, delivery conditions, allowed checks, pending checks, and next owner. Parallel work is limited to read-only research or genuinely disjoint ownership; shared paths, terminology, handoffs, and integration are serial. If four runtime entries cannot be observed, report `guidance-only` or `not-observed` and never silently fall back to one Agent.

### Agent Compliance Contract

Every Agent declares the following before repository exploration, before proposing a command, and before writing. The declaration is a prose gate, not proof of host/runtime enforcement:

```text
I read the current user request: [yes / missing source].
I read the applicable global repository standard: [AGENTS.md and applicable named standard / missing source].
User instructions outrank defaults; recorded override: [none / exact override].
Requested outcome: [what the user asked for].
My assigned scope: [what I will do].
My owned paths and permission: [exact paths; read-only or write].
My exclusions: [exact paths, actions, and outputs I will not touch].
My delivery conditions: [what must be true and what evidence I will hand back].
Validation allowed now: [exact permitted checks / none].
Validation pending authorization: [exact checks / none].
Next owner: [named Agent or Repository Owner].
```

An Agent does only the assigned outcome inside the named paths. It does not infer permission from proximity, convention, a package script, an inline marker, an old plan, or a helpful neighboring fix; it preserves unrelated work and never overwrites an unowned change. Missing authorization, ambiguous ownership, contradictory evidence, hidden constraints, or scope expansion is a stop condition. Re-route the new work, obtain the Owner Decision, update the Route Record and Ownership Matrix, and resume only after serial integration.

### Handoff, serial integration, and conflict stop

Every handoff contains: **Objective; Role and Next Owner; Scope; Paths Read and Paths Changed; Route Record; Evidence; Decisions; Coverage Gaps; Validation Command; Repository Root; Authorization State; Hook Decision; Exit Status; Validation Limitation; Blockers; Next Action; Status.** An unavailable value is `not-observed`, not omitted. The receiving owner verifies that changed paths match exclusive ownership, that observed output is distinguished from `not-run`, and that no pending evidence was promoted to `verified` or `complete`. If ownership overlaps, edits conflict, evidence contradicts, a path is unowned, an approval or required field is missing, or the task expands beyond the Route Record, invoke the Conflict Stop Rule: stop all affected writes, preserve the competing source and evidence, do not overwrite, merge, reinterpret, redirect, choose an alternate path/Agent/tool, or infer approval, and route the exact conflict to the Repository Owner. Resume only after the Ownership Matrix and Route Record are serially reconciled. Close only after verification with exact proof, explicit pending validation, or an evidenced True Blocker in root `./Failures.md`.

## Separate Approval Work boundaries

The current guidance lane is limited to this authored README: Begin Here, Route Record, D01–D22 cards and classifier, Coverage Audit summary, status/gap rules, artifact and workspace boundaries, Locked Path Gate, Site Write Gate, response/completion contract, and Standing Multi-Agent/Agent Compliance guidance. It is prose and static documentation only. The following remain separate work and are not implemented or implied here: hook or policy changes, command allowlists, universal Pre-Action Enforcement, runtime Locked Path enforcement, automatic Agent spawning or roster loading, active-document contract append, changes to the user-global opencode configuration outside this repository, package installation, application/runtime changes, database or migration actions, deployment, backup, external integrations or invocations, AI provider/package changes, and workspace-boundary relocation. Any `./site/` work must be an explicitly approved Core Product Write; reports, results, audits, handoffs, prompts, plans, skills, generated files, and other Non-Core Artifacts are redirected away from `./site/`. This README claims no generator execution, rendered behavior, runtime enforcement, hosted persistence, producer execution, or relocation.

## Task-classifier table

This table makes the D01–D22 routing decision inspectable. It is a prose index, not a runtime scanner. Each row names the first Local Evidence, every skill that may match, the command boundary, and the completion proof; when no skill trigger matches, select Local Evidence and record the no-match reason.

| Card | Trigger | First Local Evidence | Selected skills | Command classification | Completion evidence |
|---|---|---|---|---|---|
| D01 Repository map and authority | Orientation, authority, or path discovery | `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./plans/README.md` | `oando-repo-map` | Read-only inspection first | Route Record with authority order, exact paths, and selected/rejected skills |
| D02 Initialization, local development, and debugging | Onboarding, environment, or debugging | `./START.md`; `./AGENTS.md`; `./package.json`; `./config/build/` | `oando-repo-map` | Read-only inspection; install, service, build, test, and debug commands are Protected Commands | Root-working-directory and `pnpm` boundary, environment/status map, or pending owner validation |
| D03 Auth, security, and secrets | Auth, secret, CSRF, rate-limit, RLS, or security boundary | `./site/proxy.ts`; `./site/lib/security/`; `./site/platform/supabase/`; `./.env.example` | `oando-repo-map`; `oando-databases` for schema/RLS/ownership | Read-only inspection; hosted and security actions are protected or separate | Auth source, secret boundary, data owner, and unverified hosted behavior |
| D04 Environment | Environment values, workspace shape, or local configuration | `./.env.example`; `./.env.local`; `./site/.env.local`; `./pnpm-workspace.yaml` | `oando-repo-map` | Read-only inspection; sync and service commands are pending | Redacted status-labelled environment map and next owner action |
| D05 APIs | Route handler, API catalog, auth, or data-flow discovery | `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md` | `oando-repo-map`; `oando-databases` for schema ownership | Read-only inspection; API tests, builds, and hosted calls are Protected Commands | Route source, auth/data boundary, and hosted-proof limitation |
| D06 Site UI, SEO, accessibility, and performance | Marketing interface, metadata, i18n, accessibility, or performance | `./site/app/(site)/`; `./site/features/site/`; `./site/components/home/`; `./site/focss/site/` | `oando-focss-css`; `oando-browser-ui` for rendered checks | Source inspection first; browser and performance checks are Protected Commands unless explicitly eligible | Route-to-pattern trace, Visual Detail Checklist, and rendered-proof limitation |
| D07 UI polish, icons, alignment, motion, and assets | Visual detail, icon, token, asset, or motion change | `./site/components/`; `./site/focss/`; `./site/public/`; `./scripts/generate-svg/` | `oando-focss-css`; `oando-browser-ui` for visual checks | Read-only inspection; asset generators and browser checks are protected or pending | Existing Phosphor abstraction, alignment/state/accessibility review, asset source, and motion limitation |
| D08 Admin | Internal route, role, Admin feature, or operational data flow | `./site/app/admin/`; `./site/features/admin/`; `./site/lib/admin/`; `./docs/architecture/routes.md` | `oando-repo-map`; `oando-databases`; `oando-focss-css` when each trigger is evidenced | Read-only inspection; mutations and database actions are Protected Commands | Route/auth source, Products-or-Admin owner, Surface Status, and behavior limitation |
| D09 CRM demo versus customer-query operations | CRM, customer query, or unwired-surface assessment | `./site/app/admin/crm/`; `./site/features/crm/`; `./site/app/admin/customer-queries/`; `./site/app/api/customer-queries/` | `oando-repo-map`; `oando-databases` for Admin data work | Read-only inspection; no workflow combination or hosted claim | `demo/local-only` CRM status citing `oando-crm-storage`, separate query status, and gap card |
| D10 Catalog, configurator, quotes, and inventory | Catalog, configurator, quote, pricing, inventory, or asset release | `./site/lib/catalog/`; `./site/features/shared/catalog/`; `./site/app/(site)/products/`; `./site/app/admin/inventory/` | `oando-repo-map`; `oando-databases`; `oando-focss-css` when triggered | Read-only inspection; seed, publish, storage, migration, and browser actions are Protected Commands | Products/Admin owner, release path, exact scope, and hosted-proof limitation |
| D11 Planner | Planner route, canvas, catalog, persistence, or handoff | `./site/app/ooplanner/`; `./site/features/Planner/`; `./site/lib/Planner/`; `./AGENTS.md` (fork rules) | `oando-repo-map`; `oando-databases`; `oando-focss-css`; `oando-browser-ui` when triggered | Read-only inspection; boundary, browser, persistence, tests, and builds are Protected Commands | Planner-only source evidence, fork boundary state, and pending proof where unobserved |
| D12 Studio | Studio route, furniture, descriptor, canvas, catalog, or handoff | `./site/app/oostudio/`; `./site/features/Studio/`; `./site/lib/Studio/`; `./AGENTS.md` (fork rules) | `oando-repo-map`; `oando-databases`; `oando-focss-css`; `oando-browser-ui` when triggered | Read-only inspection; publish, provider, browser, persistence, tests, and builds are protected | Studio-only source/release evidence, no-cross-import state, and pending hosted proof |
| D13 AI and retrieval | Mastra, Bedrock, LanceDB, Orama, Fuse.js, embeddings, retrieval, or advisory output | `./site/lib/ai/mastra/`; `./site/app/api/ai-advisor/`; `./site/app/api/Studio/ai/`; `./docs/architecture/stack.md` | `oando-repo-map` or Local Evidence (no live skill is dedicated to retrieval; record the gap) | Read-only inspection; provider, package, build, test, and external actions are Protected or separate | Advisory boundary, source evidence, and no unsupported deployment/evaluation claim |
| D14 Databases, RLS, grants, rollback, and mode-aware persistence | Schema, SQL, migration, ownership, persistence, RLS, grants, or rollback | `./site/platform/supabase/migrations/`; `./site/platform/supabase/migrations.admin/`; `./site/platform/drizzle/schema/` | `oando-databases`; `oando-repo-map` | Read-only inspection; dry runs, applies, types, seeds, and remote DB actions are Protected Commands | Products/Admin owner, migration path, RLS/grants/rollback, mode, and pending hosted proof |
| D15 Tests, fixtures, mocks, and validation | Test, fixture, mock, browser, coverage, or validation planning | `./tests/`; `./tests/unit/`; `./tests/integration/`; `./tests/e2e/`; `./package.json` | `oando-testing` only after exact authorization and Hook Permission; `oando-browser-ui` for browser lanes | Tests, browser runners, coverage, builds, and gates are Protected Commands | Exact command, root cwd, authorization, hook decision, exit status, scope, and limitation |
| D16 Scripts and command registry | Script, command, CI, or operational dispatch discovery | `./package.json`; `./scripts/`; `./scripts/run-ops.mjs`; `./scripts/ops-command-registry.mjs` | `oando-repo-map`; `oando-testing` only for authorized validation planning | Read-only inspection; operational scripts and commands are Protected or pending | Configured-versus-observed status and exact command classification; `pnpm run typecheck:scripts` is unavailable |
| D17 Packages, dependencies, and workspace boundaries | Package, import, manifest, lockfile, or workspace question | `./package.json`; `./pnpm-workspace.yaml`; `./pnpm-lock.yaml`; `./tech-docs-generator/package.json` | `oando-repo-map` | Read-only inspection; install, build, lockfile, and workspace changes are protected or separate | Declared/imported/configured status, no `./site/package.json`, and sibling-boundary evidence |
| D18 Documentation, architecture, locked, and legacy guidance | Durable docs, procedure, plan, guide, locked, or legacy path | `./docs/architecture/`; `./docs/database/`; `./docs/governance/`; `./AGENTS.md`; `./Agents/` | `oando-repo-map`; `oando-focss-css` when locked FOCSS guidance is implicated | Read-only inspection; locked writes require exact owner authorization | Canonical owner, lock/legacy state, placement, and correction decision |
| D19 Results, generated documents, agent work, and blockers | Artifact placement, report, result, generated output, plan, or blocker | `./results/`; `./results/tests/`; `./results/site/`; `./generated-documents/`; `./agents-work/`; `./plans/README.md` | Local Evidence; `oando-repo-map` | Read-only inspection; producer commands are classified separately | Artifact Class, exact subfolder, filename pattern, producer, authored/generated state, and observed placement |
| D20 Agent skills and capabilities | Skill, agent, hook, settings, or capability-packaging question | `./AGENTS.md`; `./Agents/INDEX.md`; `./skills-lock.json`; `./agents-work/oando-repository-guide/markdown/08-agent-workspace.md` | Live global opencode skills when triggered; Local Evidence otherwise | Read-only inspection; hook/settings changes and external integrations are separate approval work | Static classification, live-versus-repository capability distinction, and runtime limitation |
| D21 Operations, deployment, backups, observability, and incidents | Vercel, Worker, R2, Supabase, backup, observability, deployment, or incident | `./vercel.json`; `./workers/oando-worker-proxy/`; `./config/observability/`; `./OPERATIONS_RUNBOOK.md`; `./Failures.md` | `oando-repo-map`; `oando-databases` when DB ownership is implicated; `oando-testing` only after authorization | Deploy, backup, Docker/local-service, remote, and incident commands are Protected Commands | Target, owner, impact, exact pending command, rollback/recovery, and unverified external state |
| D22 Unknown-area discovery | Omitted, unfamiliar, or newly discovered repository area | `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./Agents/INDEX.md`; `./plans/README.md` | `oando-repo-map` or Local Evidence; every later match is conditional | Read-only inspection first; no new category, package, external integration, or runtime action by guesswork | Evidence inventory, canonical owner, risk, Coverage-Gap Admission, and proposed next decision |
