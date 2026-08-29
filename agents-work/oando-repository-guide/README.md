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