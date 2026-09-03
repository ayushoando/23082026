# Module 09 - archived work implementation audit

## Direct answer

I checked all five requested archive areas and every file they contain: 24 files total.

The honest result is that these folders do **not** represent five completed product implementations. They contain generated repository maps, static audit checkpoints, a source-oriented sitemap, and a repository-side Planner schema decision. Some related source changes exist in the live repository, but the archive artifacts themselves do not prove runtime implementation.

| Requested area | Archive contents | Status after live-source cross-check |
| --- | --- | --- |
| `repository-graph` | 18 generated graph/stat/impact files | **Implemented as a static snapshot; stale as a current map; no product code implementation.** |
| `repository-map` | 1 generated HTML architecture map | **Implemented as an inspection artifact; explicitly says source changes were none; stale graph facts.** |
| `site-ui-content-links-audit` | 2 completed checkpoint JSON files | **Static audit checkpoint complete; runtime/browser/external-link work not complete or not run.** |
| `client-hub` | 1 archived HTML flowchart plus 1 active plan flowchart outside the archive | **Mapping exists and the active copy was updated; route behavior is not runtime-verified; archive copy is stale.** |
| `planner-comprehensive-audit` | 1 schema-gap decision Markdown file | **Repository migration/schema contract exists; hosted/runtime validation and five follow-up gaps remain open.** |

## 1. `repository-graph`

### What is present

The archive contains a README, a page/component graph in JSON/HTML/Mermaid, a summary, whole-repository stats, a cycle report, and impact reports for Planner, AI/retrieval, marketing, privacy/i18n, catalog, observability, and database types.

The generated page graph reports:

- generated at 2026-08-29;
- 61 page routes;
- 590 nodes;
- 1,348 edges;
- 61 route-to-page records.

The whole-graph stats report:

- 1,283 files;
- 2,401 local import edges;
- 34 unresolved local specifiers;
- configured roots across `site`, `scripts`, `workers`, and tech-docs source/scripts.

The cycle report reports zero strongly connected local-import groups across 1,283 files and 2,401 edges.

### What it proves

It proves that a graph-generation run produced internally consistent-looking static artifacts at that historical revision. The impact reports are useful for blast-radius inspection. They show, for example, that the canonical Planner route adapter fans into the Planner catalog/upload/handoff/project/sketch routes and that Planner project operations are used by both canonical and legacy paths.

It does **not** prove build success, runtime imports, dynamic imports, route availability, or absence of production bugs. The stats file itself records 34 unresolved local references, many involving JSON, generated documents, config, or template paths.

### Live cross-check

The current live source has 62 `page.tsx` routes. The archived graph has 61 and its route set differs:

- current routes added relative to the archived graph: `/faq`, `/portfolio`;
- archived route no longer present as a page: `/clients`.

The live repository has an active `/portfolio` page and an active `/faq` page, while `/clients/page.tsx` is absent. The active route map classifies `/clients` as a redirect alias to `/portfolio`.

### Verdict

**Static graph generation: implemented. Current repository graph: not current. Product implementation: not applicable.** Regenerate before using its counts for release or architectural decisions.

Evidence: [`README.md`](../.archive/agents-work/repository-graph/README.md), [`summary.txt`](../.archive/agents-work/repository-graph/page-components/summary.txt), [`page-component-graph.json`](../.archive/agents-work/repository-graph/page-components/page-component-graph.json), [`stats/latest.json`](../.archive/agents-work/repository-graph/stats/latest.json), [`cycles/latest.json`](../.archive/agents-work/repository-graph/cycles/latest.json), [`live Planner impact report`](../.archive/agents-work/repository-graph/impact/planner/site-server-Planner-plannerRouteAdapter.ts.json).

## 2. `repository-map`

### What is present

The single [`index.html`](../.archive/agents-work/repository-map/index.html) is a generated, beginner-readable architecture map. It covers the Next app, Planner/Studio forks, database ownership, tooling, CI, operations, and graph evidence.

Its own badges state:

- evidence date: 2026-08-29;
- graph: 1,283 files and 2,401 edges;
- routes: 61;
- source changes: none;
- protected commands: not run.

The page explicitly describes itself as inspection-only and says static evidence does not prove build, browser, authorization, RLS, hosted persistence, or deployment behavior.

### Live cross-check

Its architecture statements remain useful, especially the database and fork-boundary summaries, but its route/graph counts are stale for the current tree for the same reason as `repository-graph`: current page routes are 62 and `/faq` plus `/portfolio` now exist while `/clients` is no longer a page source.

### Verdict

**Architecture map artifact: implemented. Product implementation: none claimed or observed. Currentness: partial/stale.** Treat it as a dated snapshot, not as proof that every listed surface is complete.

Evidence: [`repository map`](../.archive/agents-work/repository-map/index.html), [`live Next configuration`](../config/build/next.config.js), [`active client-hub flowchart`](../plans/client-hub/flowcharts/clients-hub-flow.md).

## 3. `site-ui-content-links-audit`

This area has two JSON checkpoint files. Both are marked `waveStatus: complete`, but “complete” means the defined static checkpoint completed; it does not mean the website was browser-tested.

### Wave 0: inventory and matrix

The archived Wave 0 checkpoint reports:

- 100 routes;
- 22 dynamic instances;
- 22 shells;
- 0 conflicts;
- 6 coverage gaps;
- 150 total inventory records;
- 230,400 total matrix occurrences;
- 111,360 applicable and 119,040 not applicable occurrences;
- cardinality reconciliation true;
- 228,800 unique occurrence IDs;
- `hasDuplicates: true` with 1,600 duplicate occurrence IDs;
- 52 generated paths written;
- 0 product-code mutations.

The checkpoint validation criteria mark inventory terminality, frozen profiles, schema validity, matrix generation, cardinality reconciliation, and no product-code writes as satisfied. They do not turn the duplicate IDs or six coverage gaps into a clean end-to-end result.

### Wave 1: links, navigation, states, journeys

The archived Wave 1 checkpoint reports:

- 70 links;
- 0 statically detected link defects;
- 5 pending runtime links;
- 57 navigation records;
- 23 states;
- 9 journeys;
- 3 journey coverage gaps;
- 8 generated paths written;
- 0 product-code mutations.

The pending operations explicitly say they were not run:

1. HTTP HEAD requests for five external/tel/mailto/fragment targets.
2. A Playwright browser workflow for rendered link-target verification.

### Evidence integrity issue

Both checkpoints reference a manifest under:

```text
results/site-ui-content-links-audit/20260830T164237000Z-74b6a5346ac0-3c217a4a5266/manifests/run-manifest.json
```

That manifest path is absent in the current workspace. The checkpoint JSON remains present in the archive, but the referenced run manifest cannot currently be opened from this repository state.

### Verdict

**Static audit generation: implemented. Runtime audit: not implemented/not run. Evidence bundle: incomplete in the current workspace because the referenced manifest is missing. Product code changes: none according to both checkpoint manifests.**

Evidence: [`Wave 0 checkpoint`](<../.archive/agents-work/site-ui-content-links-audit/decisions/wave-0-checkpoint-20260830T164237000Z-74b6a5346ac0-3c217a4a5266.json>) and [`Wave 1 checkpoint`](<../.archive/agents-work/site-ui-content-links-audit/decisions/wave-1-checkpoint-20260830T164237000Z-74b6a5346ac0-3c217a4a5266.json>).

## 4. `client-hub`

### Archived copy

The archived [`clients-hub-flow.md`](../.archive/agents-work/client-hub/flowcharts/clients-hub-flow.md) is a source-oriented sitemap. It maps public pages, Planner marketing, products, proof pages, client access, utilities, redirect aliases, excluded system surfaces, and source-defined content/helpers.

It explicitly says the map does not prove that a route builds, renders, is linked at runtime, authorizes correctly, returns a redirect response, or has data available. It also explicitly marks the meeting-room and office-space calculator routes as placeholder shells, not completed calculator behavior.

### Active copy and live source

The active copy at [`plans/client-hub/flowcharts/clients-hub-flow.md`](../plans/client-hub/flowcharts/clients-hub-flow.md) is not byte-identical to the archive and is more current. It reflects:

- `/faq` as a public page;
- `/portfolio` as the proof page;
- `/clients` as a redirect alias to `/portfolio`;
- an expanded redirect register matching the live Next config;
- the same static-only evidence boundary.

The live source confirms that `site/app/(site)/faq/page.tsx` and `site/app/(site)/portfolio/page.tsx` exist, while `site/app/(site)/clients/page.tsx` does not. The calculator page files exist but still contain `tools-engine-placeholder`. The quote-cart page exists, but the active map says no static inbound link was found in the focused audit; that is not runtime proof.

### Verdict

**Sitemap/documentation update: partially implemented and refreshed in the active plan copy. Route-source change: present in the live tree. Product behavior and runtime journey: not verified. Calculator functionality: explicitly not complete according to source evidence.**

Evidence: [`archived sitemap`](../.archive/agents-work/client-hub/flowcharts/clients-hub-flow.md), [`active sitemap`](../plans/client-hub/flowcharts/clients-hub-flow.md), [`live redirect config`](../config/build/next.config.js), [`FAQ page`](<../site/app/(site)/faq/page.tsx>), [`portfolio page`](<../site/app/(site)/portfolio/page.tsx>), [`meeting-room calculator`](<../site/app/(site)/tools/meeting-room-capacity-calculator/page.tsx>), [`office calculator`](<../site/app/(site)/tools/office-space-calculator/page.tsx>).

## 5. `planner-comprehensive-audit`

### What is implemented in repository source

The archived decision and its active counterpart make a specific repository-side decision: preserve the existing Admin migration; do not create duplicate corrective SQL for Task 4.10.

The live repository contains:

- `20260823090000_planner_revision_idempotency.sql` with revision/schema-version/idempotency constraints, RLS, grants, indexes, guarded RPC behavior, and rollback;
- checked-in Admin table types for `oando_plans` and `planner_operation_idempotency`;
- an atomic Supabase Planner adapter;
- a disk adapter preserving the same mutation/receipt semantics for permitted development mode;
- the canonical Planner project repository and request pipeline.

That is real repository implementation evidence for the schema and covered atomic contract.

### What remains open

The decision record itself identifies five gaps/handoffs still not closed:

1. Generated Admin RPC function typing is absent; the `Functions` map is empty, so the adapter keeps a local validated RPC boundary.
2. Drizzle schema parity does not include the full idempotency response envelope fields consumed by the RPC adapter.
3. Legacy `projectsStore.supabase` list/load/upsert/delete operations still bypass `expectedRevision`, `idempotencyKey`, and `planner_mutate_plan_v1`.
4. A stale adapter note still says generated Admin types lack migration columns, even though table columns are present.
5. The repository migration test still contains the `migration-required` branch/absent-schema record and has not been reconciled with the `no-migration` decision.

The active decision also states that no hosted schema inspection, migration dry-run, migration application, Admin type generation, RPC invocation, runtime adapter check, test, integration check, deployment, or remote result was claimed.

### Verdict

**Repository schema/migration contract: implemented. Hosted application/runtime proof: not available. Planner application contract: partially implemented; five documented follow-up gaps remain.** Do not interpret the `no-migration` decision as “Planner is fully complete”; it means “do not create duplicate migration SQL for a schema contract already present in repository source.”

Evidence: [`archived decision`](../.archive/agents-work/planner-comprehensive-audit/decisions/task-4-9-schema-gap-decision.md), [`active decision`](../plans/planner-comprehensive-audit/decisions/task-4-9-schema-gap-decision.md), [`typed decision`](../plans/planner-comprehensive-audit/schemaGapDecision.ts), [`Admin migration`](../site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql), [`Admin types`](../site/platform/types/database.admin.types.ts), [`Supabase adapter`](../site/server/Planner/plannerProjectSupabaseAdapter.ts), [`legacy Supabase store`](../site/lib/Planner/projectsStore.supabase.ts), [`migration evidence test`](../tests/unit/platform/Planner/plannerAdminMigration.test.ts).

## Final implementation ledger

| Capability | Truthful status |
| --- | --- |
| Repository graph generation | Exists, but archived snapshot is stale and has unresolved references. |
| Whole-repository architecture map | Exists as a static HTML report; no source implementation was claimed. |
| Static UI/link inventory | Checkpoints exist and are marked complete; Wave 0 records duplicates/gaps. |
| External link availability | Not run; five targets remain pending. |
| Browser-rendered link/journey verification | Not run. |
| Client-hub route map | Active documentation was updated; route source reflects FAQ/Portfolio and Clients redirect. |
| Client-hub calculators | Not complete; source still contains placeholder shells. |
| Planner revision/idempotency schema | Present in repository migration/types/adapters. |
| Planner hosted migration state | Not verified. |
| Planner legacy-path contract cleanup | Not implemented; explicitly listed as a follow-up gap. |
| Planner generated RPC typing | Not implemented; local adapter typing remains. |
| Planner stale test/handoff reconciliation | Not implemented; explicitly listed as a follow-up gap. |

## What was not done

I did not run tests, typecheck, builds, gates, browser checks, database commands, migration dry-runs, RPC calls, or deployments. I also did not edit product source while performing this cross-check. The statuses above come from archive metadata plus direct live-file inspection, not from guessed runtime behavior.
