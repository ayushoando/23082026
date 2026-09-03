# Module 03 - persistence and data

## Summary

The persistence model has two Supabase projects and a development disk mode. The important design rule is exclusive selection: a request uses disk in the permitted development bypass mode or Supabase otherwise; it does not silently dual-write or fall back between adapters.

The implementation is stronger than the documentation in some places. The main issues are inconsistent environment parsing for furniture mode, ambiguity about which Supabase project owns the shared asset bucket, and callers/telemetry that still describe disk-only behavior.

## Ownership matrix

| Data | Authoritative production store | Development store | Selection |
| --- | --- | --- | --- |
| Planner projects | Admin `oando_plans` | `site/platform/Planner/data/projects/` | [`plannerPersistenceMode.ts`](../site/lib/Planner/plannerPersistenceMode.ts) |
| Furniture rows | Admin `furniture_catalog` | `site/platform/shared/data/furniture/` | [`furnitureCatalogMode.ts`](../site/lib/catalog/furnitureCatalogMode.ts) |
| Block descriptors | Admin `block_descriptors` | `site/inventory/descriptors/` | furniture/catalog mode policy |
| Furniture-library assets | Admin `catalog-assets` bucket by live selector | local furniture library/upload paths | [`catalogAssetStorage.server.ts`](../site/features/shared/catalog/catalogAssetStorage.server.ts) |
| Marketing/configurator catalog | Products project | repository fixtures/catalog data | Products clients/selectors |
| Customer queries | Admin `customer_queries` | no production-equivalent disk authority | Admin service-role insertion |

The repository documentation describes the two project refs and table ownership, but its broad description of `catalog-assets` as Products-owned does not fully match the live prefix-specific selector. The live code is the source of truth for implementation; the docs should be corrected.

## Mode selection

Planner mode is deliberately strict. It rejects ambiguous `DEV_AUTH_BYPASS` values, refuses production disk mode, and requires credentials for the selected Supabase adapter. The planner repository factory chooses one adapter and does not fall back to another.

Furniture mode selects disk only when the bypass is enabled and otherwise selects Supabase. Unlike Planner mode, it does not reject every malformed bypass value explicitly. A shared parser would make all stores fail closed with the same semantics.

[`assertDevDiskWritable.ts`](../site/lib/persistence/assertDevDiskWritable.ts) provides the final protection for raw disk writes. Export routes also explicitly refuse disk persistence outside the permitted development mode.

## Planner data model

The Drizzle schema in [`site/platform/drizzle/schema/planner.ts`](../site/platform/drizzle/schema/planner.ts) defines plans with UUID identity, owner foreign key, payload, revision, schema version, status, and timestamps. Separate idempotency records capture owner, operation, project, key, fingerprint, and replay status. The migration history includes rollback sections and a later replay fix for an earlier nullable-Boolean guard issue.

The schema and migration files are evidence of intended structure, not evidence that migrations are applied to a live database. Database commands were not run.

## Furniture, descriptors, and assets

Furniture rows and block descriptors are stored through server-side Admin clients. Descriptor publishing reads the current version and upserts a new one; the code comments acknowledge that same-slug concurrent publishes can still result in last-write-wins behavior requiring operator action.

Asset storage is path-aware. Furniture-library paths use the Admin storage client; planner symbols, exports, and generated GLBs use their configured/default project and are constrained by sanitization, ownership namespaces, and size limits. This split should be documented in one authoritative storage matrix.

## Findings

1. **Selector inconsistency:** strict Planner mode parsing and permissive furniture mode parsing can produce different failure behavior for the same malformed environment.
2. **Documentation drift:** the bucket ownership description is broader than the live prefix-specific implementation.
3. **Concurrency caveat:** descriptor version allocation for the same slug is not fully serialized; last-write-wins is acknowledged by the code.
4. **Caller drift:** legacy plan routes and CRM comments still describe disk behavior even though the store can select Supabase.

## Recommended checks

1. Centralize and unit-test the mode parser, including unset, empty, `0`, `1`, malformed, production, and missing-credential cases.
2. Document bucket ownership by object prefix and Supabase project.
3. Decide whether descriptor publish requires database-serialized version allocation.
4. After authorization, run migration dry runs before any apply operation, as required by the repository instructions.

## Evidence

- [`site/lib/Planner/plannerPersistenceMode.ts`](../site/lib/Planner/plannerPersistenceMode.ts)
- [`site/lib/catalog/furnitureCatalogMode.ts`](../site/lib/catalog/furnitureCatalogMode.ts)
- [`site/lib/persistence/assertDevDiskWritable.ts`](../site/lib/persistence/assertDevDiskWritable.ts)
- [`site/lib/Planner/projectsStore.ts`](../site/lib/Planner/projectsStore.ts)
- [`site/server/Planner/plannerStore.ts`](../site/server/Planner/plannerStore.ts)
- [`site/server/Studio/studioStore.ts`](../site/server/Studio/studioStore.ts)
- [`site/lib/catalog/furnitureCatalogStore.supabase.ts`](../site/lib/catalog/furnitureCatalogStore.supabase.ts)
- [`site/lib/catalog/blockDescriptorStore.supabase.ts`](../site/lib/catalog/blockDescriptorStore.supabase.ts)
- [`site/features/shared/catalog/catalogAssetStorage.server.ts`](../site/features/shared/catalog/catalogAssetStorage.server.ts)
- [`site/platform/drizzle/schema/planner.ts`](../site/platform/drizzle/schema/planner.ts)
- [`docs/database/schema.md`](../docs/database/schema.md)

