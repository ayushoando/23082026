# 03 · Product domains

[← Application architecture](02-application-architecture.md) · [Next: data, API, and persistence →](./04-data-api-persistence.md)

This chapter maps Product Surfaces to their route, feature, UI, persistence, and evidence boundaries. A route or import is static evidence only; it does not prove an end-to-end workflow, hosted persistence, deployment, or evaluated AI behavior. Every task begins at the root `AGENTS.md` process floor; conditional skills in the cards are the user-global opencode skills mapped in the Routing baseline in [chapter 01](./01-repository-map.md).

## Marketing site

- **Route roots:** `./site/app/(site)/`
- **Behavior:** `./site/features/site/`
- **UI:** `./site/components/home/` and domain/shared components
- **FOCSS:** `./site/focss/site/`
- **Owns:** product discovery, catalog browsing, SEO, contact, portal, quote, planning marketing, and legal content.
- **Boundary:** marketing `/planner*` pages are distinct from the interactive `/ooplanner` application.

```text
Update [page/component] to [outcome]. Reuse nearby components and FOCSS tokens,
keep it responsive, trace metadata/SEO if discovery changes, and report rendered
or hosted proof only when that proof was actually observed.
```

## Admin, CRM, and operations

- **Route roots:** `./site/app/admin/`
- **Behavior:** `./site/features/admin/`, `./site/features/crm/`, `./site/features/ops/`
- **UI/helpers:** `./site/components/` and `./site/lib/admin/`
- **Owns:** catalog, inventory, plans, price books, themes, analytics, customer queries, and CRM/operations views.
- **CRM status:** the browser CRM workspace is `demo/local-only`; its observed Zustand/browser persistence key is `oando-crm-storage`. Do not describe that demo as Admin Database-backed without end-to-end evidence.
- **Customer-query boundary:** `./site/app/admin/customer-queries/` and `./site/app/api/customer-queries/` are separate Admin Database-backed operations with their own evidence assessment.

```text
In Admin, add [workflow]. Trace the route, feature, API, auth requirement, and
Products-vs-Admin data ownership before editing. Keep the CRM demo separate from
customer-query operations and never expose server credentials.
```

## Floor Planner fork

- **Route:** `/ooplanner`
- **Route/API roots:** `./site/app/ooplanner/`; `./site/app/api/Planner/`
- **Fork roots:** `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/`; `./site/hooks/Planner/`; `./site/store/Planner/`; `./site/server/Planner/`; `./site/platform/Planner/`
- **Owns:** floor layout, furniture placement, project persistence, exports, and handoff.
- **Persistence:** use `./site/lib/Planner/plannerPersistenceMode.ts`; disk is non-production `DEV_AUTH_BYPASS=1`, otherwise Supabase. Never dual-write or use `./site/data/storage/`.
- **Technology:** Fabric.js, dockview-react, Planner-local state, and a Planner canvas scale distinct from Studio.

```text
Change [canvas/panel/project/catalog] behavior in Planner. Trace the Planner-only
UI, API, store, persistence, and proof path. Do not import Studio, copy Studio
geometry/state behavior blindly, or claim hosted persistence from disk evidence.
```

## Furniture Studio fork

- **Route:** `/oostudio`
- **Route/API roots:** `./site/app/oostudio/`; `./site/app/api/Studio/`
- **Fork roots:** `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/`; `./site/hooks/Studio/`; `./site/store/Studio/`; `./site/server/Studio/`; `./site/platform/Studio/`
- **Owns:** furniture authoring, furniture assets, descriptor publishing, and Studio AI helpers.
- **Persistence/release:** furniture and descriptors use mode-aware wrappers; dev records include `./site/inventory/descriptors/`, while production records belong to Admin Supabase. Do not infer release authority from a local JSON file.
- **Technology:** Fabric.js, dockview-react, Studio-local state, and a canvas scale distinct from Planner.

```text
Change [furniture/catalog/publish/canvas] behavior in Studio. Trace Studio-only
UI, API/store, release path, and proof. Do not import Planner, copy Planner
behavior blindly, call an external provider, or claim publish/deployment success
without the corresponding evidence.
```

## Shared boundaries

Planner and Studio are fully forked. They share approved backing data and API contracts, not modules. No `@studio/*` import belongs in a Planner file, no `@planner/*` import belongs in a Studio file, and no fork may import the other’s `components`, `lib`, `hooks`, `store`, `server`, or platform modules. Geometry helpers must not be copied without accounting for the different canvas scales. If a capability truly belongs in shared code, use an approved `./site/platform/shared/` pattern only after comparing both forks’ scale, state, and persistence assumptions.

Planner talks to `/api/Planner/*`; Studio talks to `/api/Studio/*`; the case-sensitive namespaces and route roots above are separate evidence paths. A boundary check or Fork Tree change routes to `AGENTS.md` §3 plus `pnpm run scan:boundaries` (`scripts/scan-boundaries.mjs`); Planner/Studio feature work begins from the `AGENTS.md` fork rules with `oando-repo-map` for discovery.

## Styling and design system

| Surface | FOCSS zone |
|---|---|
| Marketing | `./site/focss/site/` |
| Admin | `./site/focss/admin/` |
| Planner | `./site/focss/planner/` |
| Studio | `./site/focss/studio/` |

Use semantic tokens, existing components, explicit loading/empty/error states, accessible keyboard interaction, and `oando-focss-css` guidance. Do not introduce a new CSS system, use inline SVG/Lucide in place of the existing Phosphor abstraction, or create cross-zone imports.

## Catalog, assets, AI, and search

| Concern | Start at |
|---|---|
| Catalog adapters and ownership | `./site/lib/catalog/` |
| Plan symbol contract | `./site/lib/catalog/planSymbolPngContract.ts` |
| Catalog asset storage | `./site/features/shared/catalog/catalogAssetStorage.server.ts` |
| AI/retrieval | `./site/lib/ai/mastra/` |
| Fuzzy/full-text/vector retrieval | Fuse.js, Orama, and LanceDB via server-side catalog/AI code |

Use [Data/API](./04-data-api-persistence.md) for exact data ownership, migrations, RLS, release, and persistence rules.

## Coverage-audited product task cards

Every card uses this evidence order: (1) read authority sources, (2) inspect the listed paths, (3) compare documentation with live evidence, (4) classify Surface Status and operational risk, (5) record evidence, gaps, route, artifact/gate state, and next decision. The cards are routing guidance, not runtime discovery.

### D07 — Polish UI, icons, alignment, motion, or assets

- **Goal:** Complete a bounded visual improvement using existing icon, token, asset, and motion patterns for the named Product Surface.
- **Start Paths:** `./site/components/`; `./site/focss/`; `./site/public/`; `./scripts/generate-svg/`; `./docs/architecture/css.md`; `./docs/architecture/stack.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Existing Phosphor abstraction, icon and adjacent-control alignment, spacing, responsive layout, loading/empty/error states, keyboard/focus access, reduced motion, licensing, asset ownership, and existing generation paths.
- **Evidence Steps:**
  1. Read the root `./AGENTS.md` process floor, the other authority sources, and the applicable surface guidance.
  2. Inspect the route/component, FOCSS zone, Phosphor map/abstraction, public asset, and generation paths listed above.
  3. Compare design/documentation claims with the neighboring implementation; identify the owner and whether an asset is source, generated, legacy, or external.
  4. Classify UI consistency, accessibility, licensing, motion, shared-code, and release risk; record Surface Status or a Coverage-Gap Admission.
  5. Record the Visual Detail Checklist, selected/rejected skills, Artifact Class/gates, evidence limitation, and next decision.
- **Conditional Skills:** Select `oando-repo-map` for orientation and `oando-focss-css` for styling, tokens, icons, motion, or FOCSS evidence. Add `oando-testing` only for an explicitly authorized and hook-permitted UI/static check; otherwise reject it as pending. Fork Tree evidence follows `AGENTS.md` §3; shared-component impact uses Local Evidence.
- **Allowed Actions:** Reuse existing icons, components, semantic tokens, and approved asset-generation paths; write only after the Site Write Gate classifies an exact Core Product Write.
- **Forbidden Actions:** New icon libraries, inline SVG/Lucide replacements, custom CSS systems, unreviewed external assets, unlicensed media, skipped states, or rendered claims from static inspection.
- **Artifact / Workspace Boundary:** Authoring goes to `./agents-work/<workstream>/<report-type>/`, command evidence to `./results/<purpose>/`, tech-docs to `./generated-documents/`; `./site/` only for an exact approved Core Product path.
- **Locked Path / Site Write Gates:** `./docs/`, `./Agents/`, and direct root files are Locked evidence unless the exact file is authorized. Before a `./site/` write, name the exact product outcome, owned paths, matching skills, and expected evidence; otherwise keep the work read-only.
- **Risk:** UI consistency, accessibility, asset licensing, motion, and release risk.
- **Expected Evidence:** Existing `PhIcon`/`phIconMap` abstraction, icon/adjacent-control alignment, spacing/tokens, responsive behavior, loading/empty/error states, keyboard/focus behavior, reduced-motion review, asset owner/source/license, and exact static-versus-rendered proof limitation.
- **Next Decision:** Select the surface card or request one bounded, owner-approved visual proof.

### D08 — Work in Admin

- **Goal:** Trace an Admin outcome through its internal route, feature, authorization, data owner, and operational risk.
- **Start Paths:** `./site/app/admin/`; `./site/features/admin/`; `./site/components/`; `./site/lib/admin/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`.
- **Scope:** Admin routes, roles, catalog/inventory/plans/price books/themes, CRM/operations boundaries, and Products versus Admin ownership.
- **Evidence Steps:**
  1. Read authority sources and state whether the outcome is an Admin route, an Admin data workflow, or a neighboring CRM/operations surface.
  2. Inspect the route, feature, shared component, auth helper, API, and data paths listed above.
  3. Compare route and ownership documentation with live source; distinguish static route presence from authorization and hosted behavior.
  4. Classify authorization, data, operational, UI, and shared-code risk; assign Surface Status or a gap record.
  5. Record the Route Record, conditional skills, artifact/gate state, proof limitation, and next decision.
- **Conditional Skills:** Select `oando-repo-map` for route discovery, `oando-focss-css` for Admin styling/tokens/icons, and `oando-databases` for schema, RLS, grants, rollback, or Admin/Products ownership. Add `oando-testing` only for explicit protected validation authorized this session; otherwise reject it as pending. Shared-code impact uses Local Evidence.
- **Allowed Actions:** Read-only mapping or an exact approved product-source change after the correct owner and Site Write Gate are recorded.
- **Forbidden Actions:** Service-role exposure, remote mutations, migrations without their own authorization, or describing demo/local state as hosted Admin data.
- **Artifact / Workspace Boundary:** Source writes are Core Product Writes only in owned `./site/` paths; reports/handoffs stay in `./agents-work/<workstream>/<report-type>/`, Machine Evidence in `./results/<purpose>/`, tech-docs in `./generated-documents/`.
- **Locked Path / Site Write Gates:** Protected docs/root/Agents files require exact current-request authorization; any `./site/` write requires the exact outcome, paths, skills, and expected evidence. Non-Core artifacts are redirected.
- **Risk:** Admin authorization, data ownership, customer/operational impact, and release risk.
- **Expected Evidence:** Route, role/auth source, Products/Admin owner, Surface Status or gap, selected/rejected skills, and explicit hosted-behavior limitation.
- **Next Decision:** Select `oando-databases` or `oando-focss-css` only when its trigger is evidenced; shared-code impact uses Local Evidence; otherwise continue Local Evidence.

### D09 — Assess CRM demo versus customer-query operations

- **Goal:** Keep the local CRM browser workspace separate from Admin Database-backed customer-query operations and report each Surface Status honestly.
- **Start Paths:** `./site/app/admin/crm/`; `./site/features/crm/`; `./site/app/admin/customer-queries/`; `./site/app/api/customer-queries/`; `./site/features/ops/`; `./docs/architecture/product-map.md`; `./docs/architecture/routes.md`.
- **Scope:** CRM Zustand/local browser persistence, the `oando-crm-storage` key, customer-query API/data flow, ownership, operational risk, and missing end-to-end proof. It excludes combining the two workflows.
- **Evidence Steps:**
  1. Read authority sources and define whether the request concerns the CRM demo, customer queries, or both.
  2. Inspect the CRM and customer-query routes, features, API handlers, persistence helpers, and architecture references separately.
  3. Compare local persistence and Admin Database claims with live source; do not transfer one workflow’s status to the other.
  4. Classify data, customer-operations, authorization, and overclaim risk; record two separate Surface Status entries or a gap for each unresolved path.
  5. Record selected/rejected skills, artifact/gate state, evidence limitations, owner actions, and next decision.
- **Conditional Skills:** Select `oando-repo-map` for orientation and `oando-databases` when customer-query schema, RLS, grants, or Admin ownership evidence is involved. Add `oando-testing` only for explicitly authorized protected validation. Shared API/helper impact uses Local Evidence; operations vocabulary alone is not a trigger.
- **Allowed Actions:** Read-only comparison and a Coverage-Gap Admission when end-to-end proof is missing.
- **Forbidden Actions:** Combining workflows, calling the CRM demo Admin Database-backed, making remote mutations, or claiming customer-query behavior from a browser key or route name alone.
- **Artifact / Workspace Boundary:** Author the assessment/gap under `./agents-work/<workstream>/<report-type>/`; only tool-generated evidence in `./results/<purpose>/`; never audits or temporary files under `./site/` or `./results/` root.
- **Locked Path / Site Write Gates:** Locked evidence remains read-only without exact authorization. This card is assessment-only by default; any `./site/` write needs its own Core Product outcome, owned path, matching skills, and Site Write Gate record.
- **Risk:** Customer data, operations, authorization, persistence ownership, and overclaim risk.
- **Expected Evidence:** CRM `demo/local-only` with evidence source `oando-crm-storage`, a separately classified customer-query surface with its Admin Database owner, limitations, next evidence source, and owner action.
- **Next Decision:** Keep a surface `present-but-unverified` or `unwired/absent` until End-to-End Evidence exists; never upgrade the CRM demo because the query path is wired.

### D10 — Trace catalog, configurator, quotes, or inventory

- **Goal:** Trace catalog-facing work to the correct Products/Admin owner, asset path, and release/persistence boundary.
- **Start Paths:** `./site/lib/catalog/`; `./site/features/shared/catalog/`; `./site/app/(site)/products/`; `./site/app/(site)/quote-cart/`; `./site/app/admin/catalog/`; `./site/app/admin/inventory/`; `./site/app/api/configurator/`; `./site/platform/supabase/migrations/`.
- **Scope:** Marketing catalog, configurator, quote cart, inventory, pricing, catalog assets, publish paths, and database ownership.
- **Evidence Steps:**
  1. Read authority sources and state whether the outcome is marketing catalog/configurator, Admin inventory, quote handling, or a shared catalog boundary.
  2. Inspect route, feature, catalog adapter, API, asset-storage, and migration paths listed above.
  3. Compare Products/Admin ownership, release, and persistence claims with live helpers and migrations; distinguish source from local mirror.
  4. Classify product-data, pricing, inventory, asset, release, and database risk; assign status or a gap.
  5. Record the Route Record, conditional skills, artifact/gate state, hosted-proof limitation, and next decision.
- **Conditional Skills:** Select `oando-repo-map` for path discovery, `oando-databases` for ownership/schema/RLS/grants/rollback, and `oando-focss-css` for catalog UI styling or tokens. Add `oando-testing` only for explicit protected validation. Fork-contract evidence follows `AGENTS.md` §3; shared catalog dependencies use Local Evidence.
- **Allowed Actions:** Read-only mapping or an approved source change after selecting Products versus Admin and completing the relevant Site Write Gate.
- **Forbidden Actions:** Seed, publish, storage, migration, remote database, or external asset actions without the required authorization; never treat a legacy public mirror as release authority.
- **Artifact / Workspace Boundary:** Product source/assets may target only an exact approved `./site/` Core Product path; authored reports use `./agents-work/<workstream>/<report-type>/`, generated evidence `./results/<purpose>/`, tech-docs `./generated-documents/`; `./results/site/` is not a source destination.
- **Locked Path / Site Write Gates:** Protected root/docs/Agents paths require exact authorization. A `./site/` write must name outcome, paths, skills, and expected evidence; Non-Core outputs are rejected and redirected.
- **Risk:** Catalog data, pricing, inventory, release, asset, database, and customer-facing risk.
- **Expected Evidence:** Products versus Admin owner, migration/storage/release path, selected/rejected skills, Surface Status/gap, and pending hosted proof.
- **Next Decision:** Select `oando-databases` for schema/ownership or `oando-focss-css` for styling; fork concerns follow `AGENTS.md` §3.

### D11 — Change Planner safely

- **Goal:** Change or assess Planner behavior while preserving its independent route, canvas scale, state, persistence, and handoff contract.
- **Start Paths:** `./site/app/ooplanner/`; `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/`; `./site/hooks/Planner/`; `./site/store/Planner/`; `./site/server/Planner/`; `./site/platform/Planner/`; `./site/app/api/Planner/`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Planner route, dockview/Fabric canvas, projects, furniture placement, catalog rail, mode-aware persistence, exports, and handoff. It excludes Studio modules and assumptions.
- **Evidence Steps:**
  1. Read authority sources and identify the user-facing `/ooplanner` outcome.
  2. Inspect Planner-only route, feature, component, lib, hook, store, server, platform, API, and persistence paths.
  3. Compare route, canvas, scale, state, and persistence documentation with live Planner source; check the backing-data/API boundary without importing Studio.
  4. Classify fork, canvas, persistence, data, accessibility, and release risk; record Surface Status or a Coverage-Gap Admission.
  5. Record exact owned paths, conditional skills, Site/Locked Path gates, proof limitation, and next decision.
- **Conditional Skills:** Begin from the `AGENTS.md` §3 fork rules with `oando-repo-map` for Planner discovery. Add `oando-databases` for schema/RLS/ownership and `oando-focss-css` for Planner-zone styling. Add `oando-testing` (or `/boundaries` for boundary scans) only for an explicitly authorized and hook-permitted boundary, browser, test, or type check; otherwise keep it pending. Cross-import evaluation uses Local Evidence.
- **Allowed Actions:** Exact Planner-owned Core Product Write only after route, ownership, fork boundary, and Site Write Gate approval; otherwise read-only mapping.
- **Forbidden Actions:** Studio imports, cross-fork copying, shared geometry/state helpers without scale review, persistence changes without the mode-aware path, or unapproved boundary/browser/persistence checks.
- **Artifact / Workspace Boundary:** Planner product source remains in the exact owned `./site/` Fork Tree; analysis uses `./agents-work/<workstream>/<report-type>/`, evidence `./results/<purpose>/`, tech-docs `./generated-documents/`. No report or plan is a `./site/` artifact.
- **Locked Path / Site Write Gates:** Locked docs/root/Agents evidence requires exact authorization. Before any Planner `./site/` write, state the exact outcome, owned paths, matching skills, and expected evidence; a Non-Core Artifact is redirected.
- **Risk:** Fork boundary, canvas geometry, persistence, data, accessibility, and release risk.
- **Expected Evidence:** Planner-only source/persistence/API evidence, no cross-import claim, selected/rejected skills, Surface Status/gap, and a statement that `scan:boundaries`, browser, persistence, and test evidence remain pending unless explicitly authorized and observed.
- **Next Decision:** Continue with the narrowest Planner-owned source path or request one exact owner-approved proof.

### D12 — Change Studio safely

- **Goal:** Change or assess Studio behavior while preserving its independent furniture, descriptor, state, canvas, and release assumptions.
- **Start Paths:** `./site/app/oostudio/`; `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/`; `./site/hooks/Studio/`; `./site/store/Studio/`; `./site/server/Studio/`; `./site/platform/Studio/`; `./site/app/api/Studio/`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Furniture authoring, asset upload, descriptor publishing, Studio AI helpers, dockview/Fabric canvas, mode-aware persistence, and release. It excludes Planner modules and behavior.
- **Evidence Steps:**
  1. Read authority sources and identify the user-facing `/oostudio` outcome.
  2. Inspect Studio-only route, feature, component, lib, hook, store, server, platform, API, asset, and descriptor paths.
  3. Compare furniture, descriptor, release, state, scale, and persistence claims with live Studio source; do not infer Planner behavior.
  4. Classify fork, furniture-data, descriptor-release, credential, AI-advisory, accessibility, and deployment risk; record status or a gap.
  5. Record exact owned paths, conditional skills, artifact/gate state, proof limitation, and next decision.
- **Conditional Skills:** Begin from the `AGENTS.md` §3 fork rules with `oando-repo-map` for Studio discovery. Add `oando-databases` for furniture/descriptors schema, RLS, ownership, or rollback and `oando-focss-css` for Studio-zone styling. Add `oando-testing` only for an explicitly authorized and hook-permitted check; otherwise keep it pending. Cross-import evaluation uses Local Evidence.
- **Allowed Actions:** Exact Studio-owned Core Product Write only after route, ownership, fork-boundary, and Site Write Gate approval; otherwise use Local Evidence.
- **Forbidden Actions:** Planner imports, cross-fork copying, remote publish, provider calls, unsupported AI/deployment claims, or persistence changes outside approved mode-aware wrappers.
- **Artifact / Workspace Boundary:** Studio source/assets may target only an exact approved `./site/` Core Product path; guidance uses `./agents-work/<workstream>/<report-type>/`, evidence `./results/<purpose>/`, tech-docs `./generated-documents/`. Reports are never placed under `./site/`.
- **Locked Path / Site Write Gates:** Locked paths require exact current-request authorization. Before any Studio `./site/` write, state the exact outcome, owned paths, matching skills, and expected evidence; reject Non-Core Artifacts and redirect them.
- **Risk:** Fork boundary, furniture data, descriptor release, credential, AI advisory, and deployment risk.
- **Expected Evidence:** Studio-only source/release evidence, no cross-import claim, selected/rejected skills, Surface Status/gap, and an explicit statement that hosted persistence and provider/deployment behavior remain unverified without matching proof.
- **Next Decision:** Continue with the narrowest Studio-owned source path or request one exact owner-approved proof.

### D13 — Assess AI and retrieval

- **Goal:** Assess server-side AI/retrieval behavior as advisory output without overstating provider, evaluation, deployment, or persistence evidence.
- **Start Paths:** `./site/lib/ai/mastra/`; `./site/app/api/ai-advisor/`; `./site/app/api/Studio/ai/`; `./site/features/Studio/`; `./docs/architecture/stack.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Mastra, Amazon Bedrock, LanceDB, Orama, Fuse.js, embeddings, providers, route boundaries, credentials, customer-data handling, and user-applied advisory output. It excludes provider calls, package installation, and deployment.
- **Evidence Steps:**
  1. Read authority sources and state whether the outcome is catalog retrieval, the advisor route, or Studio AI assistance.
  2. Inspect server-only AI/retrieval modules, listed routes, Studio integration, configuration, and data boundaries.
  3. Compare configured/imported/provider claims with live source; distinguish a route/import from a connected provider or evaluated workflow.
  4. Classify credential, external-provider, customer-data, retrieval, advisory, and release risk; assign Surface Status or a Coverage-Gap Admission.
  5. Record advisory wording, selected/rejected skills, artifact/gate state, exact provider/retrieval limitation, and next decision.
- **Conditional Skills:** Select `oando-repo-map` for AI path discovery. No dedicated AI/retrieval skill exists, so record the gap and use Local Evidence plus every other matching skill. Add `oando-databases` for data/schema/RLS evidence and `oando-focss-css` only for a UI styling concern; fork evidence follows `AGENTS.md` §3. Add `oando-testing` only for explicit protected validation authorized this session per `AGENTS.md`; otherwise reject it as pending.
- **Allowed Actions:** Local-Evidence-first source mapping and approved prose guidance; source writes require their own exact Core Product Write and Site Write Gate.
- **Forbidden Actions:** Provider calls, external capability activation, package installation, credential exposure, autonomous application of advisory output, or claims of deployed/evaluated AI from static imports or route presence.
- **Artifact / Workspace Boundary:** AI assessments and handoffs use `./agents-work/<workstream>/<report-type>/`; command evidence uses `./results/<purpose>/`; tech-docs use `./generated-documents/`; no report, prompt, skill, or audit belongs under `./site/`.
- **Locked Path / Site Write Gates:** Protected root/docs/Agents paths remain read-only without exact authorization. Any `./site/` source write must be a Core Product Write with exact outcome, paths, skills, and expected evidence; Non-Core AI reports are redirected.
- **Risk:** Credentials, external providers, customer data, retrieval correctness, advisory overreach, and unsupported-claim risk.
- **Expected Evidence:** Retrieval/provider source, route/data boundary, advisory-only wording, the recorded no-dedicated-retrieval-skill gap, Surface Status/gap, and no-deployment/no-evaluation limitation.
- **Next Decision:** Keep the output advisory and request the smallest owner-approved diagnostic or separately approved provider/evaluation work.

## Visual Detail Checklist

Before reporting a product-interface change complete, review each applicable item and record the evidence or limitation:

- [ ] Use the existing Phosphor abstraction and `phIconMap`; do not add a new icon library, inline SVG, or Lucide substitute.
- [ ] Check icon alignment and the alignment of adjacent controls, labels, hit areas, and focus indicators.
- [ ] Check spacing, semantic tokens, FOCSS zone, density, and overflow at the target surface.
- [ ] Check responsive layout, wrapping, clipping, and keyboard-reachable alternatives to pointer or drag-only interaction.
- [ ] Check loading, empty, error, disabled, and success states where the surface can reach them.
- [ ] Check keyboard reachability, focus visibility/order, and accessible names; do not treat mouse-only canvas behavior as keyboard proof.
- [ ] Check reduced-motion behavior when animation or transition applies; preserve the existing GSAP/Framer and motion-preference patterns.
- [ ] For image or animation work, check owner/source, existing `./scripts/generate-svg/` or asset path, licensing, alt/metadata, and the intended output home before writing.

Static source evidence can establish that a checklist was reviewed, but it cannot establish rendered alignment, browser accessibility, animation behavior, or production asset delivery without the matching authorized observation.

## Surface Status and Coverage-Gap rules

Use only these Surface Status values: `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, and `legacy`. Every status record includes **Evidence Source(s)**, **Current Owner**, **Next Action**, and **Evidence Limitation**.

- **`wired`:** current end-to-end evidence covers the route/interface, relevant behavior, data flow, and required persistence or external boundary. Static path presence alone is insufficient.
- **`demo/local-only`:** an intentionally local/demo workflow is evidenced but is not a hosted or production-backed surface. The CRM browser workspace is this status, with the observed key `oando-crm-storage`.
- **`present-but-unverified`:** a route, module, or declared integration is present, but the required runtime, authorization, browser, hosted, or persistence proof is not observed.
- **`unwired/absent`:** the named route or complete interface/data flow is not evidenced as a live end-to-end surface. `/admin/product-studio` and the interactive legacy `/planner/*` app tree remain examples until current route evidence changes them; marketing `/planner*` pages are separate.
- **`legacy`:** an older path may be present but is not a current implementation owner; `./site/data/storage/` and legacy public mirrors require explicit review before any new behavior.

Do not transfer a status between Planner and Studio, between the CRM demo and customer queries, or between a local disk path and hosted Supabase. A Coverage-Gap Admission is required whenever the evidence needed to choose a status is missing, contradictory, or outside the approved scope.

```text
Coverage-Gap Admission Card
Named Area or Capability:
Status:
Evidence Source(s) Checked:
Evidence Limitation:
Next Evidence Source:
Owner Action:
Scope Boundary:
Next Decision:
```

Propagate the gap card to the Route Record, progress/handoff response, and Completion Record. A gap is not a failure; it prevents an absent or unverified surface from being reported as wired.

## Artifact, workspace, Locked Path, and Site Write rules

For every Output-Producing Task, record Artifact Class, exact Workstream or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, and rejected placements. Authored work goes to `./agents-work/<workstream>/<report-type>/`, Machine Evidence to `./results/<purpose>/`, tech-docs to `./generated-documents/`, active plans to `./plans/<name>/`, and evidenced True Blockers only to `./Failures.md`. Keep `./tech-docs-generator/` a root-level sibling of `./site/` and `./results/site/` separate from the source tree.

The Locked Path Gate classifies a target as `Locked`, `explicitly owner-authorized`, or `writable` before any write. Every direct root file, `./docs/**`, and `./Agents/**` is Locked by default; reading a path does not grant write/delete permission, naming one file does not unlock its neighbors, and a substitute copy never proves a protected source changed.

The Site Write Gate applies before any `./site/` write and requires the exact Core Product outcome, owned paths, matching skills, and expected evidence. Reports, audits, prompts, plans, skills, generated files, temporary files, debug files, and other Non-Core Artifacts are rejected from `./site/` and redirected to their approved homes.

## Product-task response boundary

Use the Plain-Language Response Contract for every task start, progress update, handoff, pause, and completion in this order: **Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions.** For Output-Producing Tasks, also include the artifact/workspace fields, rejected placements, and both gate states without changing the 13-field order.

AI output is advisory and requires explicit user application. Static imports, a route, a local model configuration, a browser key, or a schema do not prove provider connection, evaluation, deployment, hosted persistence, or runtime loading. A Completion Record names exact changed files, observed evidence, pending checks, status/gap admissions, Separate Approval Work, and True Blockers; it never promotes unobserved behavior to complete.
