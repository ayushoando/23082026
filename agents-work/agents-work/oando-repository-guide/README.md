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

The live repository has **no root `./supabase/` directory**—Supabase code and migrations are under `./site/platform/supabase/`. It also has **no root `./mcp/` directory**—MCP schemas are under `./.kiro/mcp/`. This guide uses the live paths.

The co-located HTML surface is conditionally treated as a projection: `./agents-work/oando-repository-guide/html/index.html`, `./agents-work/oando-repository-guide/html/repository-map.html`, `./agents-work/oando-repository-guide/html/application-architecture.html`, `./agents-work/oando-repository-guide/html/product-domains.html`, `./agents-work/oando-repository-guide/html/data-api-persistence.html`, `./agents-work/oando-repository-guide/html/tooling-ci-tech-docs.html`, `./agents-work/oando-repository-guide/html/operations-infrastructure.html`, `./agents-work/oando-repository-guide/html/docs-governance-planning.html`, `./agents-work/oando-repository-guide/html/kiro-workspace.html`, `./agents-work/oando-repository-guide/html/local-generated-environment.html`, `./agents-work/oando-repository-guide/html/quality-and-validation.html`, `./agents-work/oando-repository-guide/html/working-with-kiro.html`, and `./agents-work/oando-repository-guide/html/guide.css`. The Markdown chapters are under `./agents-work/oando-repository-guide/markdown/`. Filename similarity does not prove Markdown-to-HTML provenance or parity.

### HTML projection provenance admission — 2026-08-29

- **Relationship status:** unresolved. The inspected HTML pages contain navigation, a stylesheet link, and a link back to the Markdown README, but no source marker, generator declaration, or deterministic projection metadata. The inspected repository references do not name these HTML paths as generator outputs.
- **Generator evidence:** `./tech-docs-generator/scripts/output-contract.mjs`, `generate-all.mjs`, `render-markdown.mjs`, and `render-json.mjs` target `./generated-documents/{data,docs,site}` and generated `markdown/**` records, not `./agents-work/oando-repository-guide/html/**`. Root `docs:sync` dispatches `./scripts/general/generate-docs.mjs`, whose documented outputs are inventories/results, not this guide. The tech-docs generator must not be run to discover provenance because its contract deletes and recreates `./generated-documents/`.
- **Projection decision:** the exact conditional candidate list is the 12 HTML pages plus `guide.css` named above; the selected writable projection target set is **none**. All 13 candidates remain read-only until a source owner or deterministic generator and an exact target list are evidenced. No HTML or CSS file was changed.
- **Next owner action:** name the Markdown authoring source or the HTML authoring source, identify the deterministic projection command if one exists, and authorize the exact target files individually before any projection edit.
- **Limitation:** this is static provenance evidence only; rendered parity, freshness, and runtime/hosted behavior remain unverified.


## Begin Here: describe the outcome, not the repository vocabulary

Start with one ordinary-language sentence describing the desired outcome. Do not require the contributor to know a path, package, skill, command, or workflow mode. The router performs these steps before any modification or output selection:

1. Read `./.kiro/skills/oando-master/SKILL.md` first and preserve the authority order: current user instruction → live code and fresh command output → `AGENTS.md` → `Agents/` → `docs/`; use `./plans/README.md` for active coordination after those sources. The repository file reference is `./AGENTS.md`.
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

A matching skill is additive: select all matching skills, not one assumed skill. If none matches, select Local Evidence and record why. If a recurring repository task lacks a matching Package Skill, record a separate Package Skill proposal with its trigger, canonical location, authority sources, safety boundary, and completion expectation; do not represent the proposal as an available skill. The Completion Record repeats selected and rejected skills, changed scope, observed evidence, pending validation, and true blockers.

## Coverage-Audited Repository Domain Index

The following 22 cards are outcome-focused, coverage-audited starting points, not claims that a route or capability is wired. A card heading supplies the Card ID and outcome name; its chapter mapping, Goal, Start Paths, Scope, Required Actions, Evidence Steps, Allowed Actions, Forbidden Actions, Risk, Expected Evidence, and Next Decision are the required card fields. Every card uses these Evidence Steps in this order: (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; and (5) record evidence, gaps, the Route Record, and the Next Decision. A listed path can be absent, generated, local-private, legacy, or unverified.

For every card, Required Actions means complete the ordered Evidence Steps, create or update the Route Record, select every matching Package Skill and record rejected or unavailable skills, classify each proposed command, and record a status or Coverage-Gap Admission before the next decision. The Coverage Audit row is part of each card record and supplies its Chapter mapping, Verified Paths, Surface Status, evidence sources, limitation, and Next Decision without creating a second path authority. The matching task-classifier row supplies the trigger, first Local Evidence, additive skill set, command classification, and completion-evidence expectation; when no skill matches, it must name Local Evidence and the no-match reason. When a task produces an output, its card also requires Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement in the Completion Record. A proposed `./site/` target additionally requires the Site Write Gate; every write requires the Locked Path Gate. These fields are guidance records only: they do not prove runtime loading, enforcement, rendered behavior, hosted persistence, HTML parity, relocation, or a wired capability.

### D01 — Map repository authority
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Map repository authority and the first safe inspection path.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./docs/architecture/stack.md`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./agents-work/oando-repository-guide/README.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./plans/README.md`.
- **Scope:** Authority order, exact paths, source/generated/private/legacy classification, and task routing.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only mapping, Route Record creation, and approved guide edits in owned paths.
- **Forbidden Actions:** Guessing paths, treating a document as self-validating, or changing locked authority files.
- **Risk:** Documentation and scope risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Authority order, exact first paths, selected/rejected skills, and next decision.
- **Next Decision:** Choose the next domain card or D22 discovery.

### D02 — Initialize, develop, and debug safely
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Map initialization, local development, and debugging without starting services by assumption.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./package.json`; `./site/`; `./config/build/`; `./Failures.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Root `pnpm` boundary, environment state, local/private/generated areas, and reported symptoms.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only inventory and bounded diagnosis planning.
- **Forbidden Actions:** Installing, starting, building, testing, or changing environment files without exact authorization.
- **Risk:** Local environment, secrets, and service risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Status-labelled environment map or explicit pending owner validation.
- **Next Decision:** Select the smallest read-only diagnostic; all service/test/build commands remain Protected Commands.

### D03 — Trace auth, security, and secrets
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Trace authentication and security boundaries without exposing secrets or weakening controls.
- **Start Paths:** `./site/proxy.ts`; `./site/lib/security/`; `./site/platform/supabase/`; `./.env.example`; `./.env.local`; `./site/.env.local`; `./docs/architecture/stack.md`.
- **Scope:** Edge and handler auth, CSRF/rate limits/RLS references, secret boundaries, and evidence limitations.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read approved helpers and classify data/security risk.
- **Forbidden Actions:** Printing secrets, client-side service keys, changing security controls, or making hosted calls.
- **Risk:** Security, credentials, and data access.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Auth source, secret boundary, owner, and unverified hosted behavior.
- **Next Decision:** Route schema/RLS work to `db-migrations` only when evidence matches.

### D04 — Classify environment state
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Classify local environment values and workspace boundaries without exposing private configuration.
- **Start Paths:** `./.env.example`; `./.env.local`; `./site/.env.local`; `./package.json`; `./pnpm-workspace.yaml`; `./START.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Configured shape versus local/private values, workspace packages, and absent/stale claims.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only classification and safe documentation updates in owned guide paths.
- **Forbidden Actions:** Syncing, printing, committing, or changing environment values.
- **Risk:** Secret and environment risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Status-labelled map with private values redacted and next owner action.
- **Next Decision:** Ask for a separate environment or service approval only if required.

### D05 — Locate and assess APIs
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Trace an API outcome from route handler through auth, data boundary, and proof.
- **Start Paths:** `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md`; `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`.
- **Scope:** Route ownership, request/security controls, persistence boundary, and source-level evidence.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only route mapping and bounded source edits when explicitly approved.
- **Forbidden Actions:** Hosted requests, migrations, secret exposure, or claiming API behavior from a filename.
- **Risk:** API, auth, data, and release risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Route source, auth/CSRF/data boundary, and proof limitation.
- **Next Decision:** Select `graph-impact` or `db-migrations` only when the trigger is evidenced.

### D06 — Improve Site UI, SEO, accessibility, or performance
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Improve a marketing interface through the route, feature, component, FOCSS zone, and accessibility contract.
- **Start Paths:** `./site/app/(site)/`; `./site/features/site/`; `./site/components/home/`; `./site/focss/site/`; `./site/i18n/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./docs/architecture/stack.md`.
- **Scope:** UI structure, metadata/SEO, i18n, responsive/accessibility states, and performance planning.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Approved Core Product Writes only after the Site Write Gate; use existing patterns.
- **Forbidden Actions:** Non-Core artifacts under `./site/`, custom CSS systems, or browser/performance claims without proof.
- **Risk:** Product UI, accessibility, release, and shared-code risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Visual Detail Checklist and exact static/rendered-proof limitation.
- **Next Decision:** Route styling/token work to `focss-css`; route shared impact to `graph-impact`.

### D07 — Polish UI, icons, alignment, motion, or assets
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Complete a bounded visual improvement using existing icon, token, asset, and motion patterns.
- **Start Paths:** `./site/components/`; `./site/focss/`; `./site/public/`; `./scripts/generate-svg/`; `./docs/architecture/css.md`; `./docs/architecture/stack.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Existing Phosphor abstraction, alignment, spacing, responsive layout, states, keyboard reachability, reduced motion, licensing, and asset ownership.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Reuse existing components and generation paths after a Core Product Write route is approved.
- **Forbidden Actions:** New icon libraries, custom CSS systems, external asset tooling, or skipped loading/empty/error review.
- **Risk:** UI consistency, accessibility, asset licensing, and motion risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Visual Detail Checklist, asset source, motion-preference review, and proof limitation.
- **Next Decision:** Select `focss-css` whenever styling/tokens/FOCSS evidence matches.

### D08 — Work in Admin
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Trace an Admin outcome through route, feature, auth, ownership, and operational risk.
- **Start Paths:** `./site/app/admin/`; `./site/features/admin/`; `./site/components/`; `./site/lib/admin/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`.
- **Scope:** Internal routes, roles, catalog/inventory/plans/price books/themes, and Products versus Admin ownership.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only mapping or approved product edits with exact owned paths.
- **Forbidden Actions:** Remote mutations, migrations, service-role exposure, or treating demo state as hosted state.
- **Risk:** Admin authorization, data, and operational risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Route, auth owner, database owner, and behavior limitation.
- **Next Decision:** Route schema/RLS to `db-migrations` and shared impact to `graph-impact` when evidenced.

### D09 — Assess CRM demo versus customer-query operations
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Distinguish the local CRM browser workspace from Admin Database-backed customer-query operations.
- **Start Paths:** `./site/app/admin/crm/`; `./site/features/crm/`; `./site/app/admin/customer-queries/`; `./site/app/api/customer-queries/`; `./site/features/ops/`; `./docs/architecture/product-map.md`; `./docs/architecture/routes.md`.
- **Scope:** Surface Status, `oando-crm-storage` Zustand/local browser persistence, customer-query API/data ownership, and missing end-to-end proof.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only comparison and Coverage-Gap Admission.
- **Forbidden Actions:** Combining the workflows or calling the CRM demo wired to Admin data without evidence.
- **Risk:** Data ownership, customer operations, and overclaim risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** CRM `demo/local-only` status plus separate customer-query status and next evidence source.
- **Next Decision:** Record `present-but-unverified` or `unwired/absent` where end-to-end proof is missing.

### D10 — Trace catalog, configurator, quotes, or inventory
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Trace catalog-facing work to the correct Products/Admin owner and release path.
- **Start Paths:** `./site/lib/catalog/`; `./site/features/shared/catalog/`; `./site/app/(site)/products/`; `./site/app/(site)/quote-cart/`; `./site/app/admin/catalog/`; `./site/app/admin/inventory/`; `./site/app/api/configurator/`; `./site/platform/supabase/migrations/`.
- **Scope:** Catalog/configurator/quote/inventory routes, assets, pricing, data ownership, and persistence.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only mapping or approved source changes after ownership selection.
- **Forbidden Actions:** Seed/publish/storage/migration actions without Protected Command authorization.
- **Risk:** Product data, pricing, inventory, release, and database risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Products/Admin owner, asset/release path, and hosted-proof limitation.
- **Next Decision:** Select `db-migrations` for schema/ownership and `focss-css` for styling triggers.

### D11 — Change Planner safely
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Change or assess Planner behavior while preserving its fork, canvas scale, state, and persistence assumptions.
- **Start Paths:** `./site/app/ooplanner/`; `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/`; `./site/hooks/Planner/`; `./site/store/Planner/`; `./site/server/Planner/`; `./site/platform/Planner/`; `./site/app/api/Planner/`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Planner route, canvas, dockview shell, catalog, project persistence, and handoff.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Exact Planner-owned Core Product Write only after route and ownership approval.
- **Forbidden Actions:** Studio imports, cross-fork copying, persistence changes, or unapproved boundary scans/browser checks.
- **Risk:** Fork boundary, persistence, canvas, and release risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Planner-only source evidence; boundary/persistence behavior remains pending without authorized proof.
- **Next Decision:** Select `planner-studio`; select `fork-boundaries` for fork/cross-import evidence.

### D12 — Change Studio safely
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Change or assess Studio behavior while preserving its separate furniture, descriptor, state, and canvas assumptions.
- **Start Paths:** `./site/app/oostudio/`; `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/`; `./site/hooks/Studio/`; `./site/store/Studio/`; `./site/server/Studio/`; `./site/platform/Studio/`; `./site/app/api/Studio/`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Studio authoring, furniture assets, descriptor publishing, AI helpers, and dockview/canvas behavior.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Exact Studio-owned Core Product Write only after route and ownership approval.
- **Forbidden Actions:** Planner imports, cross-fork copying, remote publish, or unapproved checks.
- **Risk:** Fork boundary, furniture data, descriptor release, and AI advisory risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Studio-only source/release evidence and unverified hosted behavior where applicable.
- **Next Decision:** Select `planner-studio`; select `fork-boundaries` for fork changes.

### D13 — Assess AI and retrieval
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Assess server-side AI/retrieval behavior as advisory output without overstating provider or deployment evidence.
- **Start Paths:** `./site/lib/ai/mastra/`; `./site/app/api/ai-advisor/`; `./site/app/api/Studio/ai/`; `./site/features/Studio/`; `./docs/architecture/stack.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Mastra, Bedrock, LanceDB, Orama, Fuse.js, embeddings, providers, advisory output, and evidence limits.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Local-Evidence-first source mapping and approved guidance updates.
- **Forbidden Actions:** Provider calls, package installation, deployment/evaluation claims, or presenting absent `ai-retrieval` as installed.
- **Risk:** External provider, credentials, data, and unsupported-claim risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Advisory boundary, retrieval/provider source, and missing-skill or unverified status.
- **Next Decision:** Select `ai-retrieval` only if the canonical file exists; otherwise record the gap and use matching existing skills.

### D14 — Select database ownership and persistence mode
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Select Products or Admin ownership and preserve RLS, grants, rollback, and mode-aware persistence.
- **Start Paths:** `./site/platform/supabase/migrations/`; `./site/platform/supabase/migrations.admin/`; `./site/platform/drizzle/schema/`; `./site/lib/Planner/plannerPersistenceMode.ts`; `./site/lib/catalog/furnitureCatalogMode.ts`; `./site/platform/Planner/data/`; `./site/platform/shared/data/furniture/`; `./site/inventory/descriptors/`; `./docs/database/schema.md`; `./docs/database/ops.md`; `./docs/database/drizzle.md`.
- **Scope:** Database ownership, deployable migrations, RLS/grants, rollback, and production read-only filesystem.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only schema planning; approved migration edits only in the correct migration path.
- **Forbidden Actions:** Direct schema changes, missing `-- rollback`, dual writes, production disk writes, or apply commands without authorization.
- **Risk:** Data loss, access control, persistence, and release risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Owner, migration path, policies/grants/rollback, mode, and pending dry-run/hosted proof.
- **Next Decision:** Select `db-migrations`; select `graph-impact` or fork skills when triggers match.

### D15 — Plan tests, fixtures, mocks, and validation
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Classify the narrowest validation lane without treating a plan or one Vitest lane as proof of all behavior.
- **Start Paths:** `./tests/`; `./tests/unit/`; `./tests/integration/`; `./tests/e2e/`; `./tests/fixtures/`; `./tests/helpers/`; `./tests/tech-docs-generator/`; `./config/build/`; `./Testing-handbook.md`; `./package.json`.
- **Scope:** Two Vitest lanes, Playwright, fixtures, helpers, command authorization, and evidence limitations.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only validation planning; exact check execution only when current authorization and hook permission exist.
- **Forbidden Actions:** Running tests/gates/builds/browser checks by convention or claiming unobserved output.
- **Risk:** Quality, release, and owner-control risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Exact command, root cwd, scope, authorization, hook decision, exit status, limitation, or pending state.
- **Next Decision:** Select `verify-and-gate` only after explicit authorization and hook conditions are established.

### D16 — Inspect scripts and command registry
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Map a script or command from its manifest entry through implementation and classify its operational risk.
- **Start Paths:** `./package.json`; `./scripts/`; `./scripts/run-ops.mjs`; `./scripts/ops-command-registry.mjs`; `./config/build/`; `./docs/architecture/scripts.md`; `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`.
- **Scope:** Root script authority, dispatch, static checks, operations, and unavailable command claims.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only inspection and documentation corrections in owned paths.
- **Forbidden Actions:** Executing a script, inventing a command, or recommending `pnpm run typecheck:scripts` while `./scripts/tsconfig.json` is absent.
- **Risk:** Command, data, infrastructure, and validation risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Configured-versus-observed command status and exact authorization state.
- **Next Decision:** Route validation planning to `verify-and-gate` only when permitted.

### D17 — Map packages, dependencies, and workspace boundaries
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Distinguish declared, imported, configured, and observed packages without changing installation or workspace boundaries.
- **Start Paths:** `./package.json`; `./pnpm-workspace.yaml`; `./pnpm-lock.yaml`; `./site/`; `./site/tsconfig.json`; `./tech-docs-generator/`; `./tech-docs-generator/package.json`; `./config/build/`; `./docs/architecture/stack.md`.
- **Scope:** Root workspace, absent `./site/package.json`, tech-docs sibling boundary, live imports, and package-addition approval.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only package/status mapping.
- **Forbidden Actions:** Installing, changing manifests/lockfiles, or moving `./tech-docs-generator/` into `./site/` or `./results/site/`.
- **Risk:** Workspace, dependency, build, and boundary risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Package status and exact boundary statement; no installation claim.
- **Next Decision:** Select `powers-skills-model` only for an evidenced capability-packaging question; use `graph-impact` for shared dependency impact.

### D18 — Maintain documentation and locked guidance
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Place documentation changes in the canonical home while preserving locked references and legacy constraints.
- **Start Paths:** `./docs/architecture/`; `./docs/database/`; `./docs/governance/`; `./docs/governance/charter.md`; `./docs/governance/focss-stop-drift.md`; `./AGENTS.md`; `./DOC-MAP.md`; `./CONTENTS.md`; `./site/data/storage/`; `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`.
- **Scope:** Durable docs, procedures, plans, guide work, locked paths, legacy paths, and source/projection provenance.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only evidence and explicitly owned guide work under `./agents-work/oando-repository-guide/`.
- **Forbidden Actions:** Editing `./docs/`, `./Agents/`, root files, HTML, or legacy source without exact authorization/provenance.
- **Risk:** Authority, documentation, and scope risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Canonical owner, lock/provenance state, placement, and correction decision.
- **Next Decision:** Use a Workstream Subfolder for authored work; use D22 if ownership is unclear.

### D19 — Place results, generated documents, agent work, and blockers
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Put every output in the correct artifact home without claiming relocation that was not observed.
- **Start Paths:** `./results/`; `./results/tests/`; `./results/site/`; `./results/site-ui/`; `./results/ops/`; `./generated-documents/`; `./agents-work/`; `./plans/`; `./plans/README.md`; `./Failures.md`; `./agent-reports/`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Artifact Class, Workstream/Purpose Subfolder, generator ownership, root legacy artifacts, and blocker placement.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Classify and record placement; write only to approved owned guide paths or producer destinations under separate approval.
- **Forbidden Actions:** Handwritten reports in `./results/`, new reports at `./agents-work/` root, generated edits, or duplicate blocker ledgers.
- **Risk:** Evidence integrity and discoverability risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Artifact fields and observed placement; root artifacts remain `legacy/owner-review pending` when unassigned.
- **Next Decision:** Select approved subfolder and owning source/script before any Output-Producing Task write.

### D20 — Route Kiro skills, Powers, MCP, and agents
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Distinguish repository-local guidance from installed/connected capabilities and route the least powerful option.
- **Start Paths:** `./.kiro/`; `./.kiro/skills/`; `./.kiro/agents/`; `./.kiro/mcp/`; `./.kiro/settings/mcp.json`; `./.kiro/hooks/`; `./skills-lock.json`; `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`.
- **Scope:** Conditional skill routing, Kiro Markdown inventory, Power registry, MCP schema/configuration/connection states, and hook boundaries.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only inventory and prose guidance in the owned skill/guide paths.
- **Forbidden Actions:** Power activation, external MCP configuration, hook changes, or treating path presence as runtime availability.
- **Risk:** Capability, external access, credentials, and enforcement risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Classification and installed/connected state only when separately observed.
- **Next Decision:** Use Local Evidence first; select `powers-skills-model` for capability-packaging tasks.

### D21 — Plan operations, deployment, backups, and incidents
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Produce a read-only operational plan with target, impact, recovery, and approval points.
- **Start Paths:** `./vercel.json`; `./workers/oando-worker-proxy/`; `./config/observability/`; `./.github/workflows/supabase-backup-r2.yml`; `./OPERATIONS_RUNBOOK.md`; `./scripts/`; `./Failures.md`; `./site/instrumentation.ts`; `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`.
- **Scope:** Vercel, Worker, R2, Supabase, observability, backup, deploy, and incident boundaries.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only planning and evidence classification.
- **Forbidden Actions:** Deployment, backup, Docker/local-service, remote mutation, or declaring a gate failure without output.
- **Risk:** Infrastructure, data, release, and external-system risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Target, owner, exact Protected Command, rollback/recovery, and pending authorization.
- **Next Decision:** Select `verify-and-gate` only after validation authorization; keep external actions separately approved.

### D22 — Discover an unknown area safely
- **Chapter mapping:** See this card's Coverage Audit row for the numbered guide chapter and Verified Paths.
- **Goal:** Discover the canonical owner and bounded next action for an omitted or unfamiliar repository topic.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./agents-work/oando-repository-guide/README.md`; `./plans/README.md`; `./.kiro/skills/repo-map/SKILL.md`; `./Failures.md`.
- **Scope:** Local Evidence inventory, authority comparison, risk, candidate card/skill, and gap admission.
- **Required Actions:** Complete the ordered Evidence Steps; create or update the Route Record; select every matching Package Skill and record rejected or unavailable skills; classify proposed commands; and record Surface Status or a Coverage-Gap Admission before the Next Decision.
- **Evidence Steps:** (1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.
- **Allowed Actions:** Read-only discovery and proposed Domain Index/skill update.
- **Forbidden Actions:** Creating a category, package, Power, MCP, or runtime implementation from guesswork.
- **Risk:** Scope, authority, capability, and hidden-constraint risk.
- **Routing and Command Classification:** Use the matching classifier row; select every evidenced matching Package Skill, reject non-matches/unavailable skills with plain-language reasons, use Local Evidence with a no-match reason when needed, and classify every proposed command before execution.
- **Surface Status / Coverage Gap:** Use only the five allowed statuses; cite Evidence Source, Current Owner, Next Action, and Evidence Limitation, and add a Coverage-Gap Admission when End-to-End Evidence is absent.
- **Artifact Boundary (when output is produced):** Declare Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement only in the Completion Record.
- **Site Write Gate (when a target is under `./site/`):** Classify an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence; stop or redirect every Non-Core Artifact.
- **Expected Evidence:** Evidence inventory, canonical owner, selected/rejected skills, Coverage-Gap Admission, and next decision.
- **Next Decision:** Add a new card or Package Skill only through a separately approved guidance task.

### Coverage Audit

Each row audits one and only one D01–D22 card. `Verified Paths` points to that card's exact `Start Paths` above so the card remains the single path authority; the audit still records the chapter, status, evidence sources, limitation, and next decision required by the card. These are static guidance classifications, not runtime status records.

| Card | Outcome | Chapter | Verified Paths | Surface Status | Evidence Sources | Evidence Limitation | Next Decision |
|---|---|---:|---|---|---|---|---|
| D01 | Map repository authority | 01 | D01 Start Paths above | `present-but-unverified` | Authority paths and live repository comparison | Path/document presence does not prove runtime routing or completeness | Select the next domain card or D22 |
| D02 | Initialize, develop, and debug safely | 09 | D02 Start Paths above | `present-but-unverified` | `./START.md`, `./AGENTS.md`, manifest/build paths | No service, install, build, test, or debug result is observed | Request the smallest owner-approved diagnostic |
| D03 | Trace auth, security, and secrets | 04 | D03 Start Paths above | `present-but-unverified` | Edge, security, Supabase, and environment-boundary paths | Hosted security behavior and secret use are unverified | Trace the live helper and data boundary |
| D04 | Classify environment state | 09 | D04 Start Paths above | `present-but-unverified` | Environment examples, local files, workspace manifest, and guide chapter | Private values are not evidence to expose; configuration is not runtime proof | Preserve the local-private boundary |
| D05 | Locate and assess APIs | 04 | D05 Start Paths above | `present-but-unverified` | API route tree, catalog, proxy, route docs | Source presence does not prove request controls, persistence, or hosted responses | Trace route, auth, and data boundary |
| D06 | Improve Site UI, SEO, accessibility, or performance | 02–03 | D06 Start Paths above | `present-but-unverified` | Site route, feature, component, FOCSS, i18n, and architecture paths | Static paths do not prove rendered layout, accessibility, responsive states, or performance | Apply Site Write Gate and Visual Detail Checklist |
| D07 | Polish UI, icons, alignment, motion, or assets | 03 | D07 Start Paths above | `present-but-unverified` | Components, FOCSS, public assets, generator, CSS, and domain paths | Icon alignment, generated assets, licensing, motion, and interaction proof are unverified | Reuse the existing abstraction and route styling |
| D08 | Work in Admin | 03 | D08 Start Paths above | `present-but-unverified`; `/admin/product-studio`: `unwired/absent` | Admin route/feature/lib paths and route/product docs | Route presence does not prove roles, authorization, persistence, or hosted behavior | Select the data owner and auth evidence |
| D09 | Assess CRM versus customer-query operations | 03, 06 | D09 Start Paths above | CRM: `demo/local-only`; customer queries: `present-but-unverified` | CRM paths, customer-query routes/API, operations paths, and `oando-crm-storage` evidence | Browser storage is not Admin Database proof; query end-to-end behavior is unverified | Keep the workflows separate and collect each next evidence source |
| D10 | Trace catalog, configurator, quotes, or inventory | 03–04 | D10 Start Paths above | `present-but-unverified` | Catalog/configurator routes, Admin paths, and Products migration path | Ownership, publish, storage, pricing, and hosted persistence are not fully observed | Select Products/Admin ownership |
| D11 | Change or assess Planner safely | 03 | D11 Start Paths above | `present-but-unverified`; interactive legacy `/planner/*`: `unwired/absent` | `/ooplanner`, Planner fork paths, and domain chapter | Planner fork, persistence, browser, and hosted proof are unverified; legacy tree is distinct | Route to Planner and fork skills |
| D12 | Change or assess Studio safely | 03 | D12 Start Paths above | `present-but-unverified` | `/oostudio`, Studio fork paths, and domain chapter | Studio release, descriptor, persistence, and hosted proof are unverified | Route to Studio and fork skills |
| D13 | Assess AI and retrieval | 03 | D13 Start Paths above | `present-but-unverified` | Mastra/API/Studio AI paths and stack/domain docs | Provider, deployment, evaluation, and optional `ai-retrieval` skill state are not runtime proof | Record the missing skill if absent and keep output advisory |
| D14 | Select database ownership and persistence mode | 04 | D14 Start Paths above | `present-but-unverified` | Products/Admin migration paths, Drizzle schema, selectors, disk paths, database docs | Remote state, dry-run/apply result, and hosted persistence are unobserved | Require owner, RLS, grants, rollback, and mode evidence |
| D15 | Plan tests, fixtures, mocks, and validation | 05, 10 | D15 Start Paths above | `present-but-unverified` | Test trees, fixtures/helpers, build config, handbook, manifest | No command result is observed; one lane is not the full suite | Request exact validation authorization |
| D16 | Inspect scripts and command registry | 05 | D16 Start Paths above | `present-but-unverified` | Manifest, scripts, dispatch/registry, build config, script docs | Configured commands are not observed passes; `pnpm run typecheck:scripts` is unavailable while `./scripts/tsconfig.json` is absent | Classify the exact command before proposal |
| D17 | Map packages, dependencies, and workspace boundaries | 05 | D17 Start Paths above | `present-but-unverified` | Root manifests/lockfile, `./site/tsconfig.json`, tech-docs package, stack docs | Declared/imported/configured status does not prove installation or runtime wiring | Preserve sibling boundaries and seek package approval separately |
| D18 | Maintain documentation and locked guidance | 07 | D18 Start Paths above | `present-but-unverified` | Durable docs, locked/legacy paths, root guidance, and guide chapter | Markdown/HTML provenance and rendered parity are unresolved | Keep locked sources read-only and determine provenance |
| D19 | Place results, generated documents, Agent Work Reports, and blockers | 07, 09 | D19 Start Paths above | `present-but-unverified` | Results purpose folders, generated output, agents-work, plans, and blocker paths | No producer execution or relocation evidence is observed | Select the producer-owned destination |
| D20 | Route Kiro skills, Powers, MCP, and Agents | 08 | D20 Start Paths above | `present-but-unverified` | `.kiro` paths, MCP schema/config, hooks, lock, and guide chapter | Static inventory does not prove skill loading, Power installation, MCP connection, or enforcement | Use Local Evidence first and distinguish capability states |
| D21 | Plan operations, deployment, backups, and incidents | 06 | D21 Start Paths above | `present-but-unverified` | Vercel, Worker, observability, workflow, runbook, scripts, and failures paths | External state, command output, deployment, backup, and recovery are unverified | Produce a read-only target/risk/rollback plan |
| D22 | Discover an unknown area safely | 01, 07, 08 | D22 Start Paths above | `present-but-unverified` | Authority, layout, guide, planning, repo-map, and blocker paths | An omitted area has no canonical owner until live evidence establishes one | Propose a card or skill only after evidence and owner decision |

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
| True Blocker | Root `./Failures.md`; supporting authored analysis in approved `./agents-work/<workstream>/<report-type>/` | Duplicate ledgers |
| Product source | Approved product source; `./site/` only for an approved Core Product Write | `./site/` for reports, skills, results, prompts, plans, or generated files |
| Repository skill | `./.kiro/skills/` | `./site/`, `./results/`, `./agents-work/` |

> If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.

Keep `./tech-docs-generator/` as a root-level sibling of `./site/`; keep `./generated-documents/` separate; treat `./results/site/` as Machine Evidence, not source or a package relocation target. A Route Record for an Output-Producing Task must name Artifact Class, selected subfolder, filename pattern, owning source/script, authored/generated state, rejected placements, and observed placement in the Completion Record.

### Locked Path Gate

Before any write, classify the exact target as `Locked`, `explicitly owner-authorized`, or `writable`. Treat every file directly under `./` (including root Markdown and control files), every path under `./docs/`, every path under `./Agents/`, and every path under `./.kiro/agents/` as read-only evidence unless the Repository Owner explicitly names and authorizes that exact file in the current request. A read permission never becomes write/delete permission. If the target is not exact-authorized, stop, preserve the source, record the unavoidable Owner Decision and Separate Approval Work, and put supporting analysis only in an approved `./agents-work/<workstream>/<report-type>/` folder. Do not create a copy, mirror, generated substitute, or report and claim the locked source changed. `./agents-work/` is distinct from `./Agents/`; the exact `./agents-work/oando-repository-guide/README.md` target is writable here only because the current request explicitly names it.

### Site Write Gate

Before any `./site/` write, the Route Record must classify the target as an explicitly approved Core Product Write or a Non-Core Artifact. A Core Product Write states the exact product outcome, owned paths, matching skills, and expected evidence. Reports, results, audits, handoffs, prompts, plans, skills, steering files, MCP definitions, generated files, temporary files, debug files, and other Non-Core Artifacts are stopped and redirected to their approved non-site home. No workspace/package relocation is implied: moving `./tech-docs-generator/` into `./site/` or `./results/site/` requires a separate Workspace-Boundary Task.

## Plain-Language Response Contract

Explain specialized terms before requesting a decision. Every task-start, progress, handoff, pause, and completion response uses this field order: **Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions.** If an output is produced, also report Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, Locked Path Gate, Site Write Gate when relevant, and observed placement. Missing proof remains `pending`, `blocked`, or `not-observed`; it is never silently promoted to pass, wired, complete, runtime, rendered, hosted, or relocated.

### Completion Record

At completion or pause, repeat the selected and rejected Package Skills from the Route Record, the changed scope (or the inspected scope when no files changed), exact observed static or authorized evidence, pending validation with the exact command and authorization limitation, Coverage-Gap Admissions, Separate Approval Work, True Blockers, next owner, and status. State the repository-root working directory for any command evidence, the Hook Decision and exit status when a command was actually observed, and the behavior that remains unverified. A command name, plan, inline marker, path, import, or prose rule is not a command result. If no files changed, say so and state the decision reached. A True Blocker is an evidenced condition preventing completion within authorized scope and is recorded only in root `./Failures.md`; do not create a duplicate ledger.
## Standing Multi-Agent Mode

Every Repository Task starts in Standing Multi-Agent Mode. Before exploration or writing, the coordinator records exactly four Active Agent slots and one owner for serial integration:

| Slot | Role | Permission | Bounded responsibility |
|---|---|---|---|
| Scout/Map | Read-only orientation and path discovery | Read-only | Authority order, exact evidence locations, candidate paths, and repository map |
| Planner/Risk (Planner/Risk Analyst) | Scope, skill, risk, command, and approval planning | Read-only | Route Record, additive/rejected skill decisions, Operational-Risk and Command Classification, ownership proposals, and pending checks |
| Implementer | Approved change within exact exclusive paths | Write only after approval and ownership | Smallest sound change in the named paths; preserve unrelated work and stop on conflict or scope drift |
| Verifier/Reporter | Evidence review and closure | Read-only | Static read-back, Coverage-Gap review, Completion Record, and Plain-Language Response Contract reporting |

Attach `Coordinator/Serial Integration Owner` to one of these slots (the approved plan uses `I/C-01` with the Implementer); it is a function, not a fifth role. Before action, publish the Agent Roster, Ownership Matrix, Route Record, Deliverable Register, Pre-Action Gate Records when applicable, Handoff Record Register, and Conflict Stop Rule. Declare exact paths and read/write permission, exclusions, delivery conditions, allowed checks, pending checks, and next owner. Parallel work is limited to read-only research or genuinely disjoint ownership; shared paths, terminology, handoffs, and integration are serial. If four runtime entries cannot be observed, report `guidance-only` or `not-observed` and never silently fall back to one Agent.

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

Every handoff contains: **Objective; Role and Next Owner; Scope; Paths Read and Paths Changed; Route Record; Evidence; Decisions; Coverage Gaps; Validation Command; Repository Root; Authorization State; Hook Decision; Exit Status; Validation Limitation; Blockers; Next Action; Status.** An unavailable value is `not-observed`, not omitted. The receiving owner verifies that changed paths match exclusive ownership, that observed output is distinguished from `not-run`, and that no pending evidence was promoted to `verified` or `complete`.

If ownership overlaps, edits conflict, evidence contradicts, a path is unowned, an approval or required field is missing, or the task expands beyond the Route Record, invoke the Conflict Stop Rule: stop all affected writes, preserve the competing source and evidence, do not overwrite, merge, reinterpret, redirect, choose an alternate path/Agent/tool, or infer approval, and route the exact conflict to the Repository Owner. Resume only after the Ownership Matrix and Route Record are serially reconciled. Close only after verification with exact proof, explicit pending validation, or an evidenced True Blocker in root `./Failures.md`.

The current guide is prose guidance. Automatic spawning, a universal pre-action interceptor, runtime roster creation/loading, hook changes, contract append, Exact-Line migration, and any other enforcement implementation remain Separate Approval Work; the current text does not claim they are active.

## Separate Approval Work boundaries

The current guidance lane is limited to this authored README: Begin Here, Route Record, D01–D22 cards and classifier, Coverage Audit, status/gap rules, artifact and workspace boundaries, Locked Path Gate, Site Write Gate, response/completion contract, and Standing Multi-Agent/Agent Compliance guidance. It is prose and static documentation only.

The following remain separate work and are not implemented or implied here: hook or policy changes, command allowlists, universal Pre-Action Enforcement, runtime Locked Path enforcement, automatic Agent spawning or roster loading, active-document contract append, Exact-Line rollout, `./.kiro/agents/**` changes, package installation, application/runtime changes, database or migration actions, deployment, backup, external MCP configuration or invocation, Power activation, AI provider/package changes, and workspace-boundary relocation. Any `./site/` work must be an explicitly approved Core Product Write; reports, results, audits, handoffs, prompts, plans, skills, generated files, and other Non-Core Artifacts are redirected away from `./site/`.

HTML/CSS projection work is also separate until the Markdown-to-HTML source relationship is evidenced. This README does not claim HTML parity, generator execution, rendered behavior, runtime enforcement, connected MCP, installed Power, hosted persistence, producer execution, or relocation. `./tech-docs-generator/` remains a root-level sibling of `./site/`; `./generated-documents/` remains separate; `./results/site/` remains Machine Evidence rather than a source or relocation target.

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