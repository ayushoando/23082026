# Module 05 - Studio

## Summary

Studio is the independently owned furniture/configurator canvas mounted at `/oostudio`. It has its own components, feature layout, FOCSS entry, server store, autosave logic, catalog APIs, uploads, and publish path. The fork boundary is respected in the static source review.

The high-impact issue is in the publish path: the route still obtains the top PNG directly from the development furniture directory, even though the active catalog/asset mode can be Supabase.

## UI and state

The Studio feature layout loads the Studio FOCSS entry and requires an admin session for the shell. The main Studio component is a large canvas module, with separate hooks and stores for draft state, uploads, and persistence.

`useStudioDraftAutosave.ts` queues changes, keeps one save in flight, and uses a delay of roughly ten seconds. This is a deliberate back-pressure mechanism, but it should be treated as a client convenience layered over revision-aware server persistence.

Studio uses the legacy 0.2 px/mm scale. Planner’s 0.05 px/mm scale is intentionally separate; the products should not share implementation imports.

## Server and catalog flow

The Studio server store has disk helpers under the shared furniture directory and upload locations. Raw disk writes are protected by the development-only disk guard. Mode-aware wrappers expose catalog reads/writes, furniture asset persistence, and upload persistence.

The furniture catalog is Admin-owned in Supabase mode. Furniture-library assets are stored under the `catalog-assets` bucket through an explicit Admin storage client, with sanitized object paths.

The Studio API family includes furniture list/read/write/delete behavior, upload handling, and the furniture publish route. The publish service updates the catalog row and descriptor lifecycle through the selected mode.

## Publish finding: top PNG backend mismatch

[`site/app/api/Studio/furniture/[id]/publish/route.ts`](<../site/app/api/Studio/furniture/[id]/publish/route.ts>) reads `${FURNITURE_DIR}/${id}_top.png` directly. [`publishFurnitureToCatalog.ts`](../site/server/Studio/publishFurnitureToCatalog.ts) only validates PNG quality and computes a checksum when bytes are supplied.

In Supabase mode, the authoritative asset may exist in the Admin `catalog-assets` bucket rather than on the local filesystem. The static consequence is that production publishing can proceed without the intended PNG validation and can persist a null `topPngChecksum`. This should be confirmed with a mode-specific authorized integration check.

The durable fix is to resolve the asset using the same catalog asset selector used for storage. If the asset cannot be retrieved, publishing should fail with an actionable error rather than publish a partially validated descriptor.

## Strengths

- Studio and Planner remain isolated by directory and alias boundaries.
- Raw local writes are guarded outside development bypass mode.
- Catalog writes use server-side wrappers rather than browser service-role access.
- Autosave is queued rather than issuing unbounded concurrent writes.
- Asset paths are sanitized and storage ownership is explicit for furniture-library objects.

## Recommended checks

1. Add a Supabase-mode publish test that stores the top PNG in `catalog-assets` and asserts quality/checksum behavior.
2. Add a missing-asset negative case and ensure no incomplete publish is recorded.
3. Verify autosave behavior around stale revisions, navigation, and reauthentication.
4. Run the Studio boundary scan before committing Studio changes.

## Evidence

- [`site/features/Studio/layout.tsx`](../site/features/Studio/layout.tsx)
- [`site/components/Studio/Studio.tsx`](../site/components/Studio/Studio.tsx)
- [`site/hooks/Studio/useStudioDraftAutosave.ts`](../site/hooks/Studio/useStudioDraftAutosave.ts)
- [`site/server/Studio/studioStore.ts`](../site/server/Studio/studioStore.ts)
- [`site/app/api/Studio/furniture/[id]/publish/route.ts`](<../site/app/api/Studio/furniture/[id]/publish/route.ts>)
- [`site/server/Studio/publishFurnitureToCatalog.ts`](../site/server/Studio/publishFurnitureToCatalog.ts)
- [`site/features/shared/catalog/catalogAssetStorage.server.ts`](../site/features/shared/catalog/catalogAssetStorage.server.ts)

