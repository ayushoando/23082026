# 03 · Product domains

[← Application architecture](02-application-architecture.md) · [Next: data, API, and persistence →](./04-data-api-persistence.md)

## Marketing site

- **Route roots:** `site/app/(site)/`
- **Behavior:** `site/features/site/`
- **UI:** `site/components/home/` and domain/shared components
- **Owns:** product discovery, catalog browsing, SEO, contact, portal, quote, planning marketing, legal content.

```text
Update [page/component] to [outcome]. Reuse nearby components and FOCSS tokens,
keep it responsive, and trace metadata/SEO if the change affects discovery.
```

## Admin, CRM, and operations

- **Route roots:** `site/app/admin/`
- **Behavior:** `site/features/admin/`, `site/features/crm/`, `site/features/ops/`
- **Owns:** catalog, inventory, plans, price books, themes, analytics, customer queries, CRM demo/ops.
- **Note:** CRM demo is localStorage; real contact inbox/customer queries are Admin database data.

```text
In Admin, add [workflow]. Trace the route, feature, API, auth requirement, and
Products-vs-Admin data ownership before editing. Do not expose server credentials.
```

## Floor Planner fork

- **Route:** `/ooplanner`
- **Roots:** `app/ooplanner`, `features/Planner`, `components/Planner`, `lib/Planner`, `hooks/Planner`, `store/Planner`, `server/Planner`.
- **Owns:** floor layout, furniture placement, project persistence, exports, and handoff.
- **Technology:** Fabric.js, dockview-react, Planner-local state.

```text
Change [canvas/panel/project/catalog] behavior in Planner. Trace UI, API, store,
persistence, and tests. Do not import Studio or copy Studio behavior blindly.
```

## Furniture Studio fork

- **Route:** `/oostudio`
- **Roots:** `app/oostudio`, `features/Studio`, `components/Studio`, `lib/Studio`, `hooks/Studio`, `store/Studio`, `server/Studio`.
- **Owns:** furniture authoring, furniture assets, descriptor publishing, Studio AI helpers.
- **Technology:** Fabric.js, dockview-react, Studio-local state.

```text
Change [furniture/catalog/publish/canvas] behavior in Studio. Trace UI, API/store,
release path, and tests. Do not import Planner or copy Planner behavior blindly.
```

## Shared boundaries

Planner and Studio share approved backing data and API contracts, not modules. If a capability truly belongs in shared code, place it through approved platform/shared patterns after comparing each fork’s scale, state, and persistence assumptions.

## Styling and design system

| Surface | FOCSS zone |
|---|---|
| Marketing | `site/focss/site/` |
| Admin | `site/focss/admin/` |
| Planner | `site/focss/planner/` |
| Studio | `site/focss/studio/` |

Use semantic tokens, utilities, existing components, explicit empty/error/loading states, accessible keyboard interaction, and `focss-css` guidance. Do not introduce a new CSS system or cross-zone imports.

## Catalog, assets, AI, and search

| Concern | Start at |
|---|---|
| Catalog adapters and ownership | `site/lib/catalog/` |
| Plan symbol contract | `site/lib/catalog/planSymbolPngContract.ts` |
| Catalog asset storage | `site/features/shared/catalog/catalogAssetStorage.server.ts` |
| AI/retrieval | `site/lib/ai/mastra/` |
| Fuzzy/full-text/vector retrieval | Fuse, Orama, LanceDB via server-side catalog/AI code |

Use [Data/API](./04-data-api-persistence.md) for exact data ownership and release/persistence rules.


## Coverage-audited product task cards

### D07 — UI polish, icons, alignment, motion, and assets

- **Goal:** Complete a bounded visual improvement using existing product patterns and accessible media behavior.
- **Start Paths:** `./site/components/`; `./site/focss/`; `./site/public/`; `./scripts/generate-svg/`; `./docs/architecture/css.md`; `./docs/architecture/stack.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Icon abstraction, alignment, spacing, responsive layout, states, keyboard access, reduced motion, licensing, and asset ownership.
- **Evidence Steps:** Read authority; inspect route/component/FOCSS/asset patterns; compare claims to source; classify UI/licensing/accessibility risk; record checklist and next decision.
- **Allowed Actions:** Reuse existing icons/components/assets; a product write only after the Site Write Gate.
- **Forbidden Actions:** New icon libraries, custom CSS systems, unreviewed external assets, or skipped states.
- **Risk:** UI consistency, accessibility, licensing, and motion risk.
- **Expected Evidence:** Existing Phosphor abstraction, alignment/spacing review, responsive/loading/empty/error states, keyboard and reduced-motion review, and proof limitation.
- **Next Decision:** Select `focss-css` for styling/tokens/FOCSS evidence and `graph-impact` for shared components.

### D08 — Admin

- **Goal:** Trace an Admin outcome through internal route, feature, authorization, and database ownership.
- **Start Paths:** `./site/app/admin/`; `./site/features/admin/`; `./site/components/`; `./site/lib/admin/`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`.
- **Scope:** Admin catalog, inventory, plans, price books, themes, roles, and operational risk.
- **Evidence Steps:** Read authority; inspect route/feature/auth/data paths; compare docs with source; classify authorization/data risk; record status and next decision.
- **Allowed Actions:** Read-only mapping or exact approved product-source changes.
- **Forbidden Actions:** Service-role exposure, remote mutations, migrations, or demo-to-hosted overclaims.
- **Risk:** Admin authorization, data ownership, and operational risk.
- **Expected Evidence:** Route, role/auth source, Products/Admin owner, and unverified hosted behavior.
- **Next Decision:** Select `db-migrations`, `focss-css`, or `graph-impact` only when the evidence trigger matches.

### D09 — CRM demo versus customer-query operations

- **Goal:** Keep the browser CRM demo separate from Admin Database-backed customer-query operations.
- **Start Paths:** `./site/app/admin/crm/`; `./site/features/crm/`; `./site/app/admin/customer-queries/`; `./site/app/api/customer-queries/`; `./site/features/ops/`; `./docs/architecture/product-map.md`; `./docs/architecture/routes.md`.
- **Scope:** Local Zustand persistence, customer-query API/data flow, Surface Status, and evidence gaps.
- **Evidence Steps:** Read authority; inspect both workflows; compare persistence and API sources; classify data/operations risk; record separate status cards and next evidence.
- **Allowed Actions:** Read-only assessment and Coverage-Gap Admission.
- **Forbidden Actions:** Combining workflows or describing the CRM browser state as Admin database-backed.
- **Risk:** Customer data, operational ownership, and overclaim risk.
- **Expected Evidence:** CRM `demo/local-only` citing `oando-crm-storage`, separate query status, owner, limitation, and next action.
- **Next Decision:** Keep `present-but-unverified` or `unwired/absent` until End-to-End Evidence exists.

### D10 — Catalog, configurator, quotes, and inventory

- **Goal:** Trace catalog-facing work to the correct Products/Admin owner and release path.
- **Start Paths:** `./site/lib/catalog/`; `./site/features/shared/catalog/`; `./site/app/(site)/products/`; `./site/app/(site)/quote-cart/`; `./site/app/admin/catalog/`; `./site/app/admin/inventory/`; `./site/app/api/configurator/`; `./site/platform/supabase/migrations/`.
- **Scope:** Marketing catalog, configurator, quote cart, inventory, pricing, asset storage, and publish boundaries.
- **Evidence Steps:** Read authority; inspect route/feature/catalog/migration paths; compare Products/Admin claims; classify data/release risk; record owner and proof limitation.
- **Allowed Actions:** Read-only mapping or approved source changes after ownership selection.
- **Forbidden Actions:** Seed, publish, storage, migration, or external actions without authorization.
- **Risk:** Catalog data, pricing, inventory, release, and database risk.
- **Expected Evidence:** Products versus Admin owner, release/asset path, matching skills, and pending hosted proof.
- **Next Decision:** Select `db-migrations` for ownership/schema and `focss-css` for styling evidence.

### D11 — Planner

- **Goal:** Change Planner behavior while preserving its independent canvas, state, persistence, and handoff contract.
- **Start Paths:** `./site/app/ooplanner/`; `./site/features/Planner/`; `./site/components/Planner/`; `./site/lib/Planner/`; `./site/hooks/Planner/`; `./site/store/Planner/`; `./site/server/Planner/`; `./site/platform/Planner/`; `./site/app/api/Planner/`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Planner route, dockview/Fabric canvas, projects, furniture placement, persistence, exports, and handoff.
- **Evidence Steps:** Read authority; inspect Planner-only roots; compare scale/state/persistence assumptions; classify fork/data risk; record owned paths and proof limitation.
- **Allowed Actions:** Exact Planner-owned Core Product Write after route, ownership, and Site Write Gate approval.
- **Forbidden Actions:** Studio imports, cross-fork copying, persistence changes, or unapproved boundary/browser checks.
- **Risk:** Fork, canvas, persistence, and release risk.
- **Expected Evidence:** Planner-only source evidence; `scan:boundaries`, browser, persistence, and tests remain pending unless authorized.
- **Next Decision:** Select `planner-studio`; select `fork-boundaries` for any Fork Tree or import evaluation.

### D12 — Studio

- **Goal:** Change Studio behavior while preserving its independent furniture, descriptor, state, and canvas assumptions.
- **Start Paths:** `./site/app/oostudio/`; `./site/features/Studio/`; `./site/components/Studio/`; `./site/lib/Studio/`; `./site/hooks/Studio/`; `./site/store/Studio/`; `./site/server/Studio/`; `./site/platform/Studio/`; `./site/app/api/Studio/`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Furniture authoring, asset upload, descriptor publishing, Studio AI helpers, and canvas shell.
- **Evidence Steps:** Read authority; inspect Studio-only roots; compare release/state/persistence claims; classify fork/data/AI risk; record owned paths and limitation.
- **Allowed Actions:** Exact Studio-owned Core Product Write after route, ownership, and Site Write Gate approval.
- **Forbidden Actions:** Planner imports, cross-fork copying, remote publish, or unsupported AI/deployment claims.
- **Risk:** Fork, furniture data, descriptor release, and advisory AI risk.
- **Expected Evidence:** Studio-only source/release evidence; hosted persistence and AI provider behavior remain unverified without proof.
- **Next Decision:** Select `planner-studio`; select `fork-boundaries` for fork changes.

### D13 — AI and retrieval

- **Goal:** Assess server-side AI and retrieval as advisory behavior with explicit evidence limits.
- **Start Paths:** `./site/lib/ai/mastra/`; `./site/app/api/ai-advisor/`; `./site/app/api/Studio/ai/`; `./site/features/Studio/`; `./docs/architecture/stack.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
- **Scope:** Mastra, Amazon Bedrock, LanceDB, Orama, Fuse.js, embeddings, providers, and user-applied advisory output.
- **Evidence Steps:** Read authority; inspect server modules/routes; compare configured/imported/provider claims; classify external/credential/data risk; record advisory status and next evidence.
- **Allowed Actions:** Local-Evidence-first mapping and prose guidance; a source write only within approved paths.
- **Forbidden Actions:** Provider calls, package installation, external capability activation, or claims of deployed/evaluated AI without evidence.
- **Risk:** Credentials, external provider, customer data, and unsupported-claim risk.
- **Expected Evidence:** Retrieval/provider source, advisory-only wording, and `ai-retrieval` missing/selected status.
- **Next Decision:** Select `.kiro/skills/ai-retrieval/SKILL.md` only if it exists; otherwise record the missing Package Skill and use `repo-map` plus every other match.

## Visual Detail Checklist

Before reporting a product-interface change complete, review the existing Phosphor icon abstraction and map, icon alignment, adjacent-control alignment, spacing, responsive layout, loading state, empty state, error state, keyboard reachability, focus visibility, and reduced-motion behavior when applicable. Review licensing and the existing generation path for image/animation work. Static source evidence does not prove rendered interaction.

## Surface Status rules

Use only `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy`, and include Evidence Source, Current Owner, Next Action, and Evidence Limitation. The CRM browser workspace is `demo/local-only` while `oando-crm-storage` is the observed browser persistence key; customer-query operations are separate Admin Database-backed work. `/admin/product-studio` and the interactive legacy `/planner/*` app tree are `unwired/absent` until live route evidence changes them. Marketing `/planner*` pages are distinct from `/ooplanner`.

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

## Product-task response boundary

Use the Plain-Language Response Contract for every task update. Explain selected and rejected skills, risk, artifact destination, Site Write Gate state, allowed checks, Protected Commands pending authorization, exact proof, and unavoidable owner decisions. Treat AI output as advisory and require explicit user application; do not infer hosted, evaluated, or deployed behavior from imports or route presence.
