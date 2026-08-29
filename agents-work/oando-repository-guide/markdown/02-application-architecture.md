# 02 · Application architecture

[← Full map](01-repository-map.md) · [Next: product domains →](./03-product-domains.md)

This page covers every meaningful layer of the main Next.js application under `./site/`. A route or file path is static source evidence only; it does not prove that the route builds, loads, authorizes, renders, or persists correctly.

## Route and runtime layer

| Path | Role |
|---|---|
| `./site/app/` | App Router pages, layouts, errors, metadata, and API handlers. Keep pages thin. |
| `./site/app/(site)/` | Marketing routes: home, products, contact, planning marketing, portal, legal, and SEO-facing pages. |
| `./site/app/admin/` | Internal Admin route pages. |
| `./site/app/oostudio/` | Furniture Studio route entry. |
| `./site/app/ooplanner/` | Floor Planner route entry and project pages. |
| `./site/app/api/` | HTTP route handlers across Admin, Studio, Planner, catalog, AI, security, files, plans, tracking, and other boundaries. |
| `./site/app/api-docs/`, `./site/app/.well-known/`, `./site/app/security.txt/`, `./site/app/offline/` | Discovery/API documentation, security, and offline routes. |
| `./site/proxy.ts` | Edge security/auth/redirect/maintenance entry. This project does not use `middleware.ts`. |
| `./site/instrumentation.ts` | OpenTelemetry registration. |

## Product implementation layers

| Path | Role |
|---|---|
| `./site/features/` | Product behavior by domain: `site`, `admin`, `crm`, `ops`, `shared`, `Planner`, and `Studio`. |
| `./site/components/` | UI composition: marketing/domain/shared UI plus forked `Planner/` and `Studio/` trees. |
| `./site/lib/` | Shared utilities/adapters: catalog, configurator, API, auth/security, analytics, AI, persistence, SEO, tracking, theme, Admin, Planner, and Studio. |
| `./site/hooks/` | React hooks, including fork-specific hooks. |
| `./site/store/` | Client state, including fork-specific Zustand stores. |
| `./site/server/` | Server-only stores/adapters, including separate Planner and Studio persistence stores. |
| `./site/types/` | Application type declarations. |

## Platform and persistence layer

| Path | Role |
|---|---|
| `./site/platform/supabase/` | Supabase clients/helpers, functions, Products migrations, and Admin migrations. |
| `./site/platform/drizzle/` | Drizzle schemas and database representations. Deployable DB changes still use Supabase migrations. |
| `./site/platform/shared/` | Approved shared platform contracts/data; not a shortcut for cross-importing Planner and Studio. |
| `./site/platform/Planner/` | Planner platform/dev-mode data and support. |
| `./site/platform/Studio/` | Studio platform/dev-mode data and support. |
| `./site/platform/route-contract.json` | Route contract information; confirm live routes before relying on it. |

## UI, assets, language, and legacy paths

| Path | Role / rule |
|---|---|
| `./site/focss/` | Tailwind v4 + FOCSS CSS source: `base`, `site`, `admin`, `planner`, and `studio`. No cross-zone imports. |
| `./site/i18n/` | next-intl config, routing, request, `en`/`hi` messages, parity/pending translations. Runtime currently loads English according to static architecture evidence. |
| `./site/inventory/descriptors/` | Local dev-mode descriptor/release records; production equivalent is Admin Supabase. |
| `./site/public/` | Deployable public assets, logos, discovery files, and manifests; a legacy PNG catalog mirror is not release authority. |
| `./site/data/` | Legacy data area. Do not write `./site/data/storage/`. |
| `./site/.next/` | Generated Next build/cache output; never edit as source. |

## Framework/config files

| Path | Role |
|---|---|
| `./site/next.config.js` | Loaded Next configuration. |
| `./site/postcss.config.mjs` | PostCSS/Tailwind pipeline. |
| `./site/tsconfig.json` | Application TypeScript configuration. |
| `./site/next-env.d.ts`, `./site/tsconfig.tsbuildinfo` | Generated/local TypeScript/Next outputs. |

## How to trace any product change

```text
Start at the user-facing route in ./site/app/.
→ Find behavior in ./site/features/.
→ Find UI in ./site/components/.
→ Find shared logic in ./site/lib/ or server behavior in ./site/server/.
→ Find persistence/contracts in ./site/platform/.
→ Find the narrowest proof in ./tests/ or an explicitly authorized check.
```

Use [Product domains](./03-product-domains.md) for surface-specific ownership and [Data/API](./04-data-api-persistence.md) for database, persistence, and API work.

## Coverage-audited routing for application changes

Use this chapter for D05 APIs and D06 Site UI, SEO, accessibility, and performance. For both cards, follow the same ordered evidence method: authority → listed paths → live comparison → status/risk → evidence, gaps, route, and next decision.

### D05 — Locate and assess APIs

- **Goal:** Trace an API outcome from its route handler through authentication, data ownership, and the narrowest honest proof.
- **Start Paths:** `./site/app/api/`; `./site/lib/apiCatalog.ts`; `./site/proxy.ts`; `./docs/architecture/routes.md`; `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`.
- **Scope:** Route ownership, request/security controls, auth/CSRF/rate-limit boundaries, persistence, shared dependencies, and source-level proof. It excludes hosted calls, migrations, and secret exposure unless separately approved.
- **Evidence Steps:**
  1. Read `./.kiro/skills/oando-master/SKILL.md`, then apply the authority order before interpreting the API inventory.
  2. Inspect the listed route, catalog, proxy, and data-boundary paths; follow the handler to its helper and persistence owner.
  3. Compare `./docs/architecture/routes.md` and guide claims with live handlers and imports; record absent, legacy, or contradictory paths.
  4. Classify route, auth, data, security, release, and shared-code risk and assign Surface Status or a Coverage-Gap Admission where end-to-end proof is missing.
  5. Record the Route Record, selected/rejected skills, artifact/gate state, exact proof limitation, and next decision.
- **Conditional Skills:** Select `repo-map` for route/path discovery. Add `graph-impact` when shared API/helper dependency or blast-radius evidence is present. Add `db-migrations` when schema, RLS, grants, rollback, or database ownership evidence is present. Add `verify-and-gate` only for an explicitly authorized and hook-permitted protected API check; otherwise reject it as pending. Use `planner-studio` or `fork-boundaries` only if the API evidence is for a Planner/Studio Fork Tree; do not select them by route-name guesswork.
- **Allowed Actions:** Read-only route mapping and an explicitly approved Core Product Write to an owned source path after the Site Write Gate. Reuse existing helpers and preserve secret boundaries.
- **Forbidden Actions:** Hosted requests, migrations, remote mutations, service-role exposure, guessed endpoints, or claims that a route works because a `route.ts` file exists.
- **Artifact / Workspace Boundary:** API source changes are Core Product Writes only in explicitly owned `./site/` paths. Agent-authored analysis or handoffs belong under `./agents-work/<workstream>/<report-type>/`; generated command evidence belongs under `./results/<purpose>/`; generated tech-docs belong under `./generated-documents/`. Never put a report, result, skill, plan, or temporary file under `./site/`.
- **Locked Path / Site Write Gates:** `./docs/`, `./Agents/`, every direct root file, and `./.kiro/agents/**` are read-only evidence unless the exact file is named and authorized in the current request; a substitute copy is not proof. Any `./site/` source write must state the exact Core Product outcome, owned paths, matching skills, and expected evidence before writing.
- **Risk:** API, authentication, data, security, release, and shared-code risk.
- **Expected Evidence:** Exact route source, auth/CSRF/data boundary, Products/Admin or other persistence owner, status/gap record, selected/rejected skills, and an explicit statement of what hosted behavior remains unverified.
- **Next Decision:** Select the next source or data card, request one owner-approved diagnostic, or keep the API behavior pending.

### D06 — Improve Site UI, SEO, accessibility, or performance

- **Goal:** Improve a marketing Site UI outcome through the route, feature, component, FOCSS zone, SEO/i18n, responsive, and accessibility contracts.
- **Start Paths:** `./site/app/(site)/`; `./site/features/site/`; `./site/components/home/`; `./site/focss/site/`; `./site/i18n/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./docs/architecture/stack.md`.
- **Scope:** UI structure, metadata/SEO, i18n, responsive behavior, loading/empty/error states, keyboard reachability, and performance planning. The Visual Detail Checklist is defined in `./03-product-domains.md` and is required for any interface change.
- **Evidence Steps:**
  1. Read the router and authority sources, then define the named Site outcome in ordinary language.
  2. Inspect the route, neighboring feature/component pattern, FOCSS site zone, i18n source, and relevant architecture references.
  3. Compare documentation with live source and identify the actual component, metadata owner, and shared-code boundary.
  4. Classify UI, accessibility, responsive, performance, release, and shared-code risk; assign Surface Status or a Coverage-Gap Admission.
  5. Record the Visual Detail Checklist, Route Record, artifact/gate state, exact rendered-proof limitation, and next decision.
- **Conditional Skills:** Select `repo-map` for orientation. Add `focss-css` for FOCSS, semantic-token, styling, icon, or motion evidence. Add `graph-impact` when a shared component, hook, lib, or dependency blast radius is evidenced. Add `verify-and-gate` only for an explicitly authorized and hook-permitted UI/browser/performance check; otherwise reject it as pending. Do not select `planner-studio` or `fork-boundaries` unless the evidence leaves the marketing Site surface and enters a Planner/Studio Fork Tree.
- **Allowed Actions:** Approved Core Product Writes only after the Site Write Gate; reuse existing components, Phosphor abstraction, semantic tokens, and zone patterns.
- **Forbidden Actions:** Reports or other Non-Core Artifacts under `./site/`, custom CSS systems, cross-zone imports, guessed routes, or browser/performance claims without the corresponding observation.
- **Artifact / Workspace Boundary:** Product UI source remains in its approved `./site/` path only for a Core Product Write. Authored guidance/handoffs belong under `./agents-work/<workstream>/<report-type>/`; Machine Evidence belongs under `./results/<purpose>/`; generated tech-docs belong under `./generated-documents/`; `./results/site/` is not a source-tree destination.
- **Locked Path / Site Write Gates:** Locked documentation and root controls remain read-only without exact current-request authorization. Before any `./site/` write, classify Core Product Write versus Non-Core Artifact and state the exact outcome, owned paths, matching skills, and expected static/rendered evidence. Redirect a report, result, prompt, plan, skill, generated file, or debug artifact instead of writing it to `./site/`.
- **Risk:** Product UI, accessibility, responsive behavior, performance, release, and shared-code risk.
- **Expected Evidence:** Route-to-feature-to-component trace, FOCSS zone, metadata/i18n owner, selected/rejected skills, Visual Detail Checklist, and exact limitation separating static source evidence from rendered proof.
- **Next Decision:** Route styling/token evidence to `focss-css`, shared impact to `graph-impact`, or request the smallest permitted UI proof.

## Planner and Studio fork boundaries

Planner and Studio are separate Product Surfaces with independent route, feature, component, library, hook, store, server, platform, API, canvas, and persistence roots. They share approved backing data/API contracts only; they do not share modules.

| Surface | Route and API roots | Fork roots |
|---|---|---|
| Planner | `./site/app/ooplanner/`; `./site/app/api/Planner/` | `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/`; `./site/hooks/Planner/`; `./site/store/Planner/`; `./site/server/Planner/`; `./site/platform/Planner/` |
| Studio | `./site/app/oostudio/`; `./site/app/api/Studio/` | `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/`; `./site/hooks/Studio/`; `./site/store/Studio/`; `./site/server/Studio/`; `./site/platform/Studio/` |
| Approved shared boundary | No route or fork module | `./site/platform/shared/` only when both forks’ scale, state, and persistence assumptions have been compared |

Do not import `./site/*/Studio/` from Planner or `./site/*/Planner/` from Studio, do not copy fork behavior blindly, and do not share geometry helpers without accounting for the different canvas scales. Planner and Studio also use separate FOCSS zones and case-sensitive API namespaces. The interactive `/ooplanner` route is distinct from marketing `/planner*` pages.

## Artifact, Locked Path, and Site Write gates

For every Output-Producing Task, the Route Record identifies the Artifact Class, exact Workstream or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, and rejected placements. Use `./agents-work/<workstream>/<report-type>/` for authored reports/work products, `./results/<purpose>/` for Machine Evidence, `./generated-documents/` for generated tech-docs, `./plans/<name>/` for active plans, and `./Failures.md` only for an evidenced True Blocker under its exact authorization boundary. Keep `./tech-docs-generator/` separate from `./site/` and keep `./results/site/` separate from `./site/`.

The Locked Path Gate classifies every proposed target as `Locked`, `explicitly owner-authorized`, or `writable` before writing. Direct root files, `./docs/**`, `./Agents/**`, and `./.kiro/agents/**` are Locked by default; reading one does not grant write or delete permission, and a substitute copy never proves the source changed.

The Site Write Gate applies before any `./site/` write: name the exact Core Product outcome, owned paths, matching skills, and expected evidence. A report, audit, handoff, prompt, plan, skill, steering file, MCP definition, generated file, temporary/debug file, or other Non-Core Artifact is rejected from `./site/` and redirected to its approved home. Static source evidence cannot prove a browser result, hosted API behavior, deployment, or persistence.

## Evidence-honest response and completion

Every task start, progress update, handoff, pause, and completion uses the Plain-Language Response Contract in this order: **Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions.** For Output-Producing Tasks, include the artifact/workspace fields, rejected placements, Locked Path Gate, and Site Write Gate state without changing that order.

A Completion Record names the changed paths and reasons, observed static or authorized command evidence, pending checks, Surface Status/Coverage-Gap admissions, Separate Approval Work, and True Blockers. Static route tracing does not prove rendered interaction, browser accessibility, hosted API behavior, persistence, deployment, connected MCP, installed Power state, or automatic skill/runtime loading; label each unobserved fact as pending or unverified.
