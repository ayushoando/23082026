# D-LibPlatform — Module Report (Slice C: Core Library, Platform & Database)

**Slice:** `site/lib`, `site/platform`, `site/server`, `site/store`, `site/types`, `site/i18n`, `site/inventory` — **503 frozen inputs**  
**Frozen baseline:** `fdef1ba7106328ecf43e7a3232dd4bd9859b97be` · 4,095 tracked paths + `plans/repository-suggestions.md` = 4,096 inputs  
**Reviewer:** `D-LibPlatform` · **Review date:** 2026-09-02  
**Ownership proof:** frozen owned manifest `D:/23082026/agents-work/frozen-LibPlatform.txt`; 503 unique paths.

## 1. Scope and architecture

This partition covers the Planner and Studio libraries, catalog and persistence helpers, server adapters, stores and ambient types, i18n helpers/messages, inventory descriptors, Drizzle query-layer definitions, Supabase clients, and both Products/Admin migration trees. The database split is authoritative: Admin ref `rxzpznmxbaoxpikowmfc` owns plans, profiles, handoffs, teams, price books, audit, furniture, and descriptors; Products ref `erpweaiypimorcunaimz` owns marketing catalog, configurator, flags, and themes. Runtime writes select exactly one backend: local disk only for non-production `DEV_AUTH_BYPASS=1`, otherwise Admin Supabase for plans/furniture/descriptors; production filesystem writes are rejected.

## 2. Strengths

- Server-only Admin and Products service-role clients keep credentials out of browser modules and disable session persistence/refresh for service clients.
- Planner mutations derive owner scope from the verified session, validate idempotency keys/fingerprints, enforce revision checks, and route through a guarded Admin RPC; disk and Supabase adapters are exclusive rather than dual-writing.
- Furniture and descriptor writes enforce the dev-disk gate, while Supabase storage uses the Admin project consistent with the migration that moved furniture/descriptors from Products.
- Supabase migrations consistently enable RLS and pair grants with policies for public/authenticated access where intended; service-only tables are explicitly documented and receive service-role policies in the Admin cleanup migration.
- Catalog read failures have bounded retries and R2/local fallback paths, and planner response/observability helpers bound sensitive values before they cross response or metrics boundaries.

## 3. Grounded findings

### LP-1 · P1 · Provision and atomically update the distributed rate-limit store

**Path and range:** `site/lib/rateLimit.ts:179-228`.

In a production process with `SUPABASE_SERVICE_ROLE_KEY` and a Supabase URL, every check queries `public.rate_limits`, but this frozen partition contains no migration creating that table; the query therefore errors on a fresh target and the catch path falls back to per-instance memory. Even if the table exists remotely, concurrent requests perform read-then-upsert with the same nextCount, so requests racing on one key overwrite one another and can exceed the configured quota across instances. Non-AI routes therefore lose the promised distributed limit, while AI routes fail closed whenever the table is unavailable.

**Observed Reproduction Input/Output:**
- *Input:* Scan 64 SQL migration files across `site/platform/supabase/migrations/**` and `migrations.admin/**` for `CREATE TABLE rate_limits`.
- *Observed Output:* `0` matching table creations found.
- *Result:* Production service-role queries in `site/lib/rateLimit.ts` fail on fresh databases and fall back to local in-memory storage.

**Fix:** Provision `public.rate_limits` via a timestamped migration with appropriate grants/RLS policies and generated types, and replace the read-then-upsert sequence with an atomic increment/reset RPC or an `INSERT ... ON CONFLICT DO UPDATE` statement that returns the updated count in a single round-trip.

### LP-2 · P2 · Treat a blank `SUPABASE_URL` as absent before falling back

**File:** `site/platform/supabase/supabaseAdmin.ts:15-23`  
**Impact:** The documented fallback to `NEXT_PUBLIC_SUPABASE_URL` is bypassed when `SUPABASE_URL` is present but blank: `.trim()` yields `""`, and nullish coalescing does not evaluate the fallback. Any server configuration that supplies an empty `SUPABASE_URL` alongside a valid public URL throws the missing-URL error, disabling Products Admin operations instead of using the configured fallback.  
**Fix:** Use a truthy fallback after trimming (`process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ""`) so blank values behave like unset values, matching `adminServer.ts`.

## 4. Prioritized six-month advisor guidance

1. **P1 — Make rate limiting a real shared invariant:** land the table migration, grants/RLS policy, generated types, and atomic increment contract together; exercise concurrent requests against both Admin and Products deployment targets.
2. **P2 — Normalize environment selectors:** standardize all URL/key selectors on trimmed truthy fallback semantics and add configuration checks that distinguish missing, blank, and cross-database values before deployment.
3. **P2 — Keep persistence contracts executable:** maintain replay/owner-scope tests for Planner RPC and adapter parity, and verify every catalog/furniture/descriptor migration has matching grants, policies, rollback, and generated types.
4. **P3 — Preserve bounded degradation:** instrument R2/catalog and observability fallback paths with aggregate reason metrics while keeping request/error payloads redacted.

## 5. Coverage honesty

Every path in the frozen owned manifest was opened from the frozen checkout at `fdef1ba7106328ecf43e7a3232dd4bd9859b97be`. Text, code, JSON, CSS, SQL, and config inputs are recorded as `read-full`. The 11 owned PNG thumbnails were validated as existing, non-zero PNGs with decodable dimensions; duplicate SHA-256 groups are recorded below as asset metadata, not as unread inputs. No owned input failed.

**Status totals:** `read-full=492`, `binary-validated=11`, `failed=0`; total `503`.

## 6. Verdict summary

- **overall_correctness:** `incorrect` (LP-1 is a production rate-limit availability/security defect; LP-2 is a configuration fallback defect)
- **explanation:** The partition is fully covered and the two-database/persistence boundaries are mostly coherent, but the production distributed limiter has no owned schema migration and is non-atomic under concurrency, and the Products Admin URL fallback mishandles blank configuration.
- **confidence:** `0.95`

## Appendix A — Machine-checkable per-file evidence

Columns are `path | status | module | reviewer | finding IDs`. Valid statuses are exactly `read-full`, `binary-validated`, and `failed`.

| path | status | module | reviewer | finding IDs |
|---|---|---|---|---|
| site/i18n/config.ts | read-full | site/i18n | D-LibPlatform | none |
| site/i18n/marketing-parity-manifest.json | read-full | site/i18n | D-LibPlatform | none |
| site/i18n/messages/en.json | read-full | site/i18n | D-LibPlatform | none |
| site/i18n/messages/hi.json | read-full | site/i18n | D-LibPlatform | none |
| site/i18n/request.ts | read-full | site/i18n | D-LibPlatform | none |
| site/i18n/routing.ts | read-full | site/i18n | D-LibPlatform | none |
| site/inventory/descriptors/missing-geom-fallback-001.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-breeze-task-chair.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-cafe-discussion-table-900.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-casca-guest-chair.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-classy-meeting-1800.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-eclipse-meeting-2400.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-flex-desk-1200.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-fluid-desk-1400.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-fluid-desk-1600.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-fluid-pedestal-400.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-fluid-ws-linear-1200.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-fluid-ws-linear-1400.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-fluid-ws-lshape-1600.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-halo-meeting-3000.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-mellow-sofa-2200.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-mozio-ws-cluster-1800.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-omnia-desk-1800.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-omnia-storage-1200.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-phoenix-l-desk-1600.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-spino-low-cabinet-800.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-spino-tall-cabinet-900.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-sway-ws-bench-2400.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/inventory/descriptors/oando-xmesh-locker-900.json | read-full | site/inventory/descriptors | D-LibPlatform | none |
| site/lib/Planner/ai/applySuggestedLayout.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/ai/sketchToPlanShared.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/ai/spaceSuggest.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/ai/validateLayoutSchema.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/boq/buildBoqFromGeometry.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/boq/exportBoqCsv.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/boq/exportBoqJson.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/boq/types.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/buildValidationFloor.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/catalogStore.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/commands/canvasCommands.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/commands/registry.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/commands/useCanvasActions.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/fabricGeometryBridge.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/geometry/alignDistribute.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/geometry/distanceGuides.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/geometry/openingPlacement.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/geometry/wallGraph.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/handoff/createPlannerHandoff.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/handoff/handoffRecovery.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/handoff/handoffSchema.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/observability/plannerObservability.server.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/observability/plannerObservability.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/observability/plannerObservabilityAdapters.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/observability/plannerObservabilityExporter.server.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerApi.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerApiResponse.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerAutoArrange.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerCanvasLayers.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerColorUtils.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerDocument.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerDxfExport.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerEndpointContract.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerExporters.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerFabricSerialize.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerGeometryContract.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerLocalBackup.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerOwnerScope.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerPalette.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerPersistenceMode.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerProjectEnvelope.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerProjectOperations.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerProjectRepository.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerRequestPipeline.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerSnap.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerSnapManager.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerSnapStatusLabel.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerStep.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerTokens.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerTypes.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerUnits.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/plannerWorkflowState.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/projectFurnitureBoq.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/projectIndex.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/projectSetup/projectSetupSchema.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/projectsStore.supabase.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/projectsStore.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/starterProjectTemplate.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/underlayCalibrate.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/validation/furnitureClearance.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/validation/furnitureOverlap.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/validation/furnitureRoomBoundary.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/validation/furnitureWallCollision.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/validation/index.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/validation/openingClearance.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/validation/runValidation.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/validation/types.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Planner/wallEndpointGrips.ts | read-full | site/lib/Planner | D-LibPlatform | none |
| site/lib/Studio/studioAiLlm.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioApi.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioCanvasLayers.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioColorUtils.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioDrawColors.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioDxfExport.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioEnsureDockPanel.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioExporters.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioFabricSerialize.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioImporters.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioPalette.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioPropertySizeFields.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioShapeGeometry.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioSnap.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioTokens.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioTypes.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/studioUnits.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/templates/furnitureTemplates.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/Studio/validateFurnitureMetadata.ts | read-full | site/lib/Studio | D-LibPlatform | none |
| site/lib/admin/techDocsUrl.ts | read-full | site/lib/admin | D-LibPlatform | none |
| site/lib/ai/AiAdvisorPanel.tsx | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/audit/finding.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/audit/findings.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/advisorAgent.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/advisorMemory.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/catalogLocalSearch.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/catalogRag.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/catalogRetrieval.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/client.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/embedder.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/index.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/plannerAdvisorClient.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/providers.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/requestAdvisorText.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/mastra/vectorizeCatalogStore.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/sanitizeUserInput.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/ai/useAiAdvisor.ts | read-full | site/lib/ai | D-LibPlatform | none |
| site/lib/analytics/conversionContract.ts | read-full | site/lib/analytics | D-LibPlatform | none |
| site/lib/analytics/emitSiteEvent.ts | read-full | site/lib/analytics | D-LibPlatform | none |
| site/lib/analytics/emitTransport.ts | read-full | site/lib/analytics | D-LibPlatform | none |
| site/lib/analytics/eventQueue.ts | read-full | site/lib/analytics | D-LibPlatform | none |
| site/lib/analytics/kpiEvents.ts | read-full | site/lib/analytics | D-LibPlatform | none |
| site/lib/analytics/kpiIntegrity.ts | read-full | site/lib/analytics | D-LibPlatform | none |
| site/lib/analytics/plannerEntry.ts | read-full | site/lib/analytics | D-LibPlatform | none |
| site/lib/analytics/siteAttribution.ts | read-full | site/lib/analytics | D-LibPlatform | none |
| site/lib/analytics/siteEvents.ts | read-full | site/lib/analytics | D-LibPlatform | none |
| site/lib/api/browserApi.ts | read-full | site/lib/api | D-LibPlatform | none |
| site/lib/apiCatalog.ts | read-full | site/lib/apiCatalog.ts | D-LibPlatform | none |
| site/lib/assetPaths.ts | read-full | site/lib/assetPaths.ts | D-LibPlatform | none |
| site/lib/audit/auditRepository.ts | read-full | site/lib/audit | D-LibPlatform | none |
| site/lib/audit/logAdminAction.ts | read-full | site/lib/audit | D-LibPlatform | none |
| site/lib/audit/teamAccess.ts | read-full | site/lib/audit | D-LibPlatform | none |
| site/lib/auth/constants.ts | read-full | site/lib/auth | D-LibPlatform | none |
| site/lib/auth/customerSafeAuthError.ts | read-full | site/lib/auth | D-LibPlatform | none |
| site/lib/auth/devAuthBypass.ts | read-full | site/lib/auth | D-LibPlatform | none |
| site/lib/auth/e2eAuthEnv.ts | read-full | site/lib/auth | D-LibPlatform | none |
| site/lib/auth/plannerRedirect.ts | read-full | site/lib/auth | D-LibPlatform | none |
| site/lib/auth/plannerSession.ts | read-full | site/lib/auth | D-LibPlatform | none |
| site/lib/auth/roles.ts | read-full | site/lib/auth | D-LibPlatform | none |
| site/lib/auth/session.ts | read-full | site/lib/auth | D-LibPlatform | none |
| site/lib/auth/supabaseServerActions.ts | read-full | site/lib/auth | D-LibPlatform | none |
| site/lib/catalog/adapters.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/blockDescriptorStore.supabase.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/blockPrimitives.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/blocks.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/blocks2d.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/catalogData.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/catalogDrizzle.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/catalogFallbackResolver.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/catalogHierarchy.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/catalogSnapshotConstants.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/catalogSnapshotR2.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/catalogTree.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/catalogTypes.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/catalogWriteIsolation.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/configuratorCatalog.server.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/configuratorCatalog.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/configuratorCatalogPayload.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/fallback.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/furnitureCatalogMode.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/furnitureCatalogStore.supabase.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/geometry.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/glbAssetPolicy.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/lifecycle/catalogLifecycle.shared.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/lifecycle/catalogLifecycle.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/managedCatalogSeed.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/persistBlockDescriptor.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/planSvg.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/planSymbolPngContract.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/plannerManagedProductsShared.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/productStaticParams.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/productUrlKey.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/publish/planSymbolPngQualityGate.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/publish/pngPublishChecksum.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/publish/svgArtifactStatus.server.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/publish/svgReleaseAuthority.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/renderBlock2DToCanvas.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/resolveBlockColors.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/seed/oandoCatalog.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/applyCatalogProductFilters.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/catalogProductDedupe.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/catalogProductFilters.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/categories.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/ecoScore.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/filterSearchParams.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/filters.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/getProducts.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/imageMetadata.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/marketingImages.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/slugResolver.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/specSchema.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/site/traits.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/sources.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/accessories.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/blocks2d.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/chairs.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/equipment.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/index.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/soft-seating.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/storage.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/tables.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/theme-executive-dark.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/theme-premium-light.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/theme.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/tokens-fabric.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/tokens-lighting.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/tokens-metal.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/tokens-primitives.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/tokens-wood.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/tokens.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/styles/workstations.css | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/surface2d5.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/svg/descriptorPointer.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/svg/sha256.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/svg/svgBlockDescriptorLoader.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/svg/svgTypes.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/types.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/workspaceCatalog.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/workstationBoqV0.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/workstationMeshV0.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/catalog/workstationSystemV0.ts | read-full | site/lib/catalog | D-LibPlatform | none |
| site/lib/client/afterIdle.ts | read-full | site/lib/client | D-LibPlatform | none |
| site/lib/clientIp.ts | read-full | site/lib/clientIp.ts | D-LibPlatform | none |
| site/lib/clients/clientRegistry.ts | read-full | site/lib/clients | D-LibPlatform | none |
| site/lib/clients/clientTypes.ts | read-full | site/lib/clients | D-LibPlatform | none |
| site/lib/configurator/smartWizard.impl.ts | read-full | site/lib/configurator | D-LibPlatform | none |
| site/lib/configurator/smartWizard.ts | read-full | site/lib/configurator | D-LibPlatform | none |
| site/lib/configurator/smartWizardCatalog.ts | read-full | site/lib/configurator | D-LibPlatform | none |
| site/lib/configurator/smartWizardConstants.ts | read-full | site/lib/configurator | D-LibPlatform | none |
| site/lib/consent.ts | read-full | site/lib/consent.ts | D-LibPlatform | none |
| site/lib/displayText.ts | read-full | site/lib/displayText.ts | D-LibPlatform | none |
| site/lib/email/sendStaffQueryNotification.ts | read-full | site/lib/email | D-LibPlatform | none |
| site/lib/env.server.ts | read-full | site/lib/env.server.ts | D-LibPlatform | none |
| site/lib/errorLogger.ts | read-full | site/lib/errorLogger.ts | D-LibPlatform | none |
| site/lib/featureFlags.ts | read-full | site/lib/featureFlags.ts | D-LibPlatform | none |
| site/lib/fonts.ts | read-full | site/lib/fonts.ts | D-LibPlatform | none |
| site/lib/helpers/gsapMotion.ts | read-full | site/lib/helpers | D-LibPlatform | none |
| site/lib/helpers/images.ts | read-full | site/lib/helpers | D-LibPlatform | none |
| site/lib/helpers/motion.ts | read-full | site/lib/helpers | D-LibPlatform | none |
| site/lib/hooks/useInViewOnce.ts | read-full | site/lib/hooks | D-LibPlatform | none |
| site/lib/hooks/useOnlineStatus.ts | read-full | site/lib/hooks | D-LibPlatform | none |
| site/lib/hooks/useRuntimeFeatureFlags.ts | read-full | site/lib/hooks | D-LibPlatform | none |
| site/lib/i18n/htmlLang.ts | read-full | site/lib/i18n | D-LibPlatform | none |
| site/lib/i18n/navigation.ts | read-full | site/lib/i18n | D-LibPlatform | none |
| site/lib/i18n/withLocaleCopy.ts | read-full | site/lib/i18n | D-LibPlatform | none |
| site/lib/images/optimizerMode.ts | read-full | site/lib/images | D-LibPlatform | none |
| site/lib/kpiFormat.ts | read-full | site/lib/kpiFormat.ts | D-LibPlatform | none |
| site/lib/layout/siteLayoutContext.ts | read-full | site/lib/layout | D-LibPlatform | none |
| site/lib/navigation.ts | read-full | site/lib/navigation.ts | D-LibPlatform | none |
| site/lib/observability/aiMetrics.ts | read-full | site/lib/observability | D-LibPlatform | none |
| site/lib/observability/metrics.ts | read-full | site/lib/observability | D-LibPlatform | none |
| site/lib/observability/reportClientError.ts | read-full | site/lib/observability | D-LibPlatform | none |
| site/lib/paths/adminCatalogOps.ts | read-full | site/lib/paths | D-LibPlatform | none |
| site/lib/paths/sitePackageRoot.server.ts | read-full | site/lib/paths | D-LibPlatform | none |
| site/lib/paths/sitePackageRoot.ts | read-full | site/lib/paths | D-LibPlatform | none |
| site/lib/persistence/assertDevDiskWritable.ts | read-full | site/lib/persistence | D-LibPlatform | none |
| site/lib/platform/maintenanceMode.ts | read-full | site/lib/platform | D-LibPlatform | none |
| site/lib/productDataTables.ts | read-full | site/lib/productDataTables.ts | D-LibPlatform | none |
| site/lib/productSlugResolver.ts | read-full | site/lib/productSlugResolver.ts | D-LibPlatform | none |
| site/lib/rateLimit.ts | read-full | site/lib | D-LibPlatform | LP-1 |
| site/lib/safe-action.ts | read-full | site/lib/safe-action.ts | D-LibPlatform | none |
| site/lib/security/csrf.ts | read-full | site/lib/security | D-LibPlatform | none |
| site/lib/security/csrfConstants.ts | read-full | site/lib/security | D-LibPlatform | none |
| site/lib/security/requestNonce.ts | read-full | site/lib/security | D-LibPlatform | none |
| site/lib/security/requestOrigin.ts | read-full | site/lib/security | D-LibPlatform | none |
| site/lib/security/sanitize.ts | read-full | site/lib/security | D-LibPlatform | none |
| site/lib/security/staticAdminToken.ts | read-full | site/lib/security | D-LibPlatform | none |
| site/lib/security/svgSanitizer.ts | read-full | site/lib/security | D-LibPlatform | none |
| site/lib/security/uploadLimits.ts | read-full | site/lib/security | D-LibPlatform | none |
| site/lib/securityTxt.ts | read-full | site/lib/securityTxt.ts | D-LibPlatform | none |
| site/lib/seo/indexnow.ts | read-full | site/lib/seo | D-LibPlatform | none |
| site/lib/siteUrl.ts | read-full | site/lib/siteUrl.ts | D-LibPlatform | none |
| site/lib/siteViewport.ts | read-full | site/lib/siteViewport.ts | D-LibPlatform | none |
| site/lib/storage/r2Catalog.ts | read-full | site/lib/storage | D-LibPlatform | none |
| site/lib/store/productCompare.ts | read-full | site/lib/store | D-LibPlatform | none |
| site/lib/store/quoteCart.ts | read-full | site/lib/store | D-LibPlatform | none |
| site/lib/theme/ThemeProvider.tsx | read-full | site/lib/theme | D-LibPlatform | none |
| site/lib/theme/activeThemeId.ts | read-full | site/lib/theme | D-LibPlatform | none |
| site/lib/theme/catalogTokenKeys.ts | read-full | site/lib/theme | D-LibPlatform | none |
| site/lib/theme/plannerThemePacks.ts | read-full | site/lib/theme | D-LibPlatform | none |
| site/lib/theme/presets.ts | read-full | site/lib/theme | D-LibPlatform | none |
| site/lib/theme/schema.ts | read-full | site/lib/theme | D-LibPlatform | none |
| site/lib/theme/useThemeAdmin.ts | read-full | site/lib/theme | D-LibPlatform | none |
| site/lib/theme/verifyThemeRuntime.ts | read-full | site/lib/theme | D-LibPlatform | none |
| site/lib/tracking/anonymousUserId.ts | read-full | site/lib/tracking | D-LibPlatform | none |
| site/lib/tracking/trackingCookie.ts | read-full | site/lib/tracking | D-LibPlatform | none |
| site/lib/tracking/userHistoryRepository.ts | read-full | site/lib/tracking | D-LibPlatform | none |
| site/lib/types/businessStats.ts | read-full | site/lib/types | D-LibPlatform | none |
| site/lib/ui/KeyboardShortcuts.tsx | read-full | site/lib/ui | D-LibPlatform | none |
| site/lib/ui/Slot.tsx | read-full | site/lib/ui | D-LibPlatform | none |
| site/lib/ui/SmartLayoutEngine.tsx | read-full | site/lib/ui | D-LibPlatform | none |
| site/lib/ui/Tooltip.tsx | read-full | site/lib/ui | D-LibPlatform | none |
| site/lib/ui/UndoToast.tsx | read-full | site/lib/ui | D-LibPlatform | none |
| site/lib/unwrapActionResult.ts | read-full | site/lib/unwrapActionResult.ts | D-LibPlatform | none |
| site/lib/utils.ts | read-full | site/lib/utils.ts | D-LibPlatform | none |
| site/lib/uuid/normalizeUuid.ts | read-full | site/lib/uuid | D-LibPlatform | none |
| site/lib/z-index.ts | read-full | site/lib/z-index.ts | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3b-refresh-marker-1786286951638_78a2d8.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3b-refresh-marker-1786286951638_78a2d8_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3b-refresh-marker-1786801573811_de5dd1.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3b-refresh-marker-1786801573811_de5dd1_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786027240979_fc48b8.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786027240979_fc48b8_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786346036556_af3377.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786346036556_af3377_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786726452472_1bc519.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786726452472_1bc519_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786801128387_82ca63.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786801128387_82ca63_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786802551857_3d377e.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786802551857_3d377e_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786803323768_98c71a.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786803323768_98c71a_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786898553644_012f6d.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1786898553644_012f6d_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1787015180831_e123a7.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_3c-project-menu-marker-1787015180831_e123a7_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_untitled-plan_d80e0e.json | read-full | site/platform/Planner | D-LibPlatform | none |
| site/platform/Planner/data/projects/p_untitled-plan_d80e0e_thumb.png | binary-validated | site/platform/Planner | D-LibPlatform | none |
| site/platform/Studio/data/seed-furniture.json | read-full | site/platform/Studio | D-LibPlatform | none |
| site/platform/drizzle/adminDb.ts | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/createPostgresDrizzle.ts | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/databaseUrls.ts | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/drizzle.config.ts | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/migrations/0000_daffy_longshot.sql | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/migrations/0001_add_missing_indexes.sql | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/migrations/meta/0000_snapshot.json | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/migrations/meta/_journal.json | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/migrations/products/0002_svg_assets_v2.sql | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/productsDb.ts | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/schema/catalog.ts | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/schema/index.ts | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/drizzle/schema/planner.ts | read-full | site/platform/drizzle | D-LibPlatform | none |
| site/platform/planner-canvas.json | read-full | site/platform/planner-canvas.json | D-LibPlatform | none |
| site/platform/route-contract.json | read-full | site/platform/route-contract.json | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_04f657.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_1740df.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_20744d.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_353f6d.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_384ef0.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_3c952b.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_4bb913.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_4fc1d5.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_50a0c6.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_589ed8.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_9008ea.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_9466b7.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_9b68db.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_a6f269.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_a98cb3.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_b8d4f3.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_cd553a.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_cecf0e.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_d1e12b.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_d4741b.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_d78b8f.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_de6340.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_e3568d.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/f_item_ef4fbd.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_boardroom_table.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_boardroom_table_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_bookshelf.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_bookshelf_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_desk_double.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_desk_double_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_desk_single.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_desk_single_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_exec_chair.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_exec_chair_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_filing_cabinet.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_filing_cabinet_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_lounge_chair.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_lounge_chair_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_meeting_rect.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_meeting_rect_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_meeting_round.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_meeting_round_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_pedestal.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_pedestal_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_planter.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_planter_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_sofa_2.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_sofa_2_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_sofa_3.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_sofa_3_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_stool.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_stool_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_task_chair.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_task_chair_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_workstation_4.json | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/shared/data/furniture/seed_workstation_4_top.svg | read-full | site/platform/shared | D-LibPlatform | none |
| site/platform/supabase/adminServer.ts | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/auth-admin.ts | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/client.ts | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/config.toml | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/env.ts | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/functions/assistant-chat/deno.json | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/functions/assistant-chat/index.ts | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260524240000_drop_catalog_duplicates.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260524240001_drop_dead_better_auth.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260524240002_create_missing_tables.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260628100000_planner_plans_and_audit.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260713000000_price_books.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260727010000_product_studio_drafts.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260727020000_workspace_editor_configs.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260727030000_product_studio_templates.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260731120000_admin_modules_feature_flags_and_handoffs.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260731140000_seed_sketch_to_plan_flag.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260801100000_planner_handoffs_owner_only_read.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260801110000_archive_legacy_planner_tables.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260801120000_document_service_role_only_tables.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260805180000_studio_furniture_to_admin.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260806120000_feature_flags_grants.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260812190001_admin_advisor_cleanup.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260814200001_customer_queries_insert_grant.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260819000001_analytics_events.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260830095000_planner_idempotency_replay_fix.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations.admin/20260901120000_user_history_owner_rls.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/001_create_image_assets.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20240101000000_create_image_assets.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20240101000001_image_assets_rls.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20250522000000_create_image_assets.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20250522000001_image_assets_rls.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260101000000_initial_schema.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260224180058_create_projects_table.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260226000000_add_3d_model.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260226100000_image_mapping.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260301093000_create_business_stats.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260302110000_create_product_specs_and_images.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260302170000_create_customer_queries.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260302193000_create_user_history.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260307150500_add_product_slug_aliases_and_name_key.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260307153500_rename_to_catalog_tables.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260307184000_ensure_product_slug_aliases_table.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260309113000_add_canonical_catalog_fields.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260313100000_fix_rls_and_permissions.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260524233835_drop_unused_legacy_tables.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260524233836_pin_function_search_path.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260524233837_add_foreign_key_indexes.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260524233838_drop_duplicate_index.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260524233839_enable_rls_and_policies.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260524233840_drop_duplicate_indexes_from_tier3.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260524233841_secure_local_migration_history.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260524240000_drop_admin_domain_tables.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260601120000_create_configurator_products.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260604134500_create_block_themes.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260620050600_add_missing_indexes.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260628100000_create_planner_managed_products_and_feature_flags.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260629100000_advisor_block_themes_rls_and_search_path.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260714100000_create_svg_revisions.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260716100000_add_published_svg_revision_id.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260725180000_block_descriptors_lifecycle.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260731120000_feature_flags_admin_modules_seed.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260731140000_seed_sketch_to_plan_flag.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260801120000_document_service_role_only_tables.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260801130000_create_furniture_catalog.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260806120000_feature_flags_grants.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260812190000_products_advisor_cleanup.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260813090000_retire_products_furniture_catalog.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260814120000_restore_catalog_satellite_tables.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/migrations/20260814200000_archive_products_leftover_public.sql | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/server.ts | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/supabase/supabaseAdmin.ts | read-full | site/platform/supabase | D-LibPlatform | LP-2 |
| site/platform/supabase/types.ts | read-full | site/platform/supabase | D-LibPlatform | none |
| site/platform/types/database.admin.types.ts | read-full | site/platform/types | D-LibPlatform | none |
| site/platform/types/database.types.ts | read-full | site/platform/types | D-LibPlatform | none |
| site/server/Planner/plannerProjectDiskAdapter.ts | read-full | site/server/Planner | D-LibPlatform | none |
| site/server/Planner/plannerProjectSupabaseAdapter.ts | read-full | site/server/Planner | D-LibPlatform | none |
| site/server/Planner/plannerRouteAdapter.ts | read-full | site/server/Planner | D-LibPlatform | none |
| site/server/Planner/plannerStore.ts | read-full | site/server/Planner | D-LibPlatform | none |
| site/server/Planner/providerFetch.server.ts | read-full | site/server/Planner | D-LibPlatform | none |
| site/server/Planner/sketchToPlan.server.ts | read-full | site/server/Planner | D-LibPlatform | none |
| site/server/Studio/authorizeStudioCatalogTopPng.ts | read-full | site/server/Studio | D-LibPlatform | none |
| site/server/Studio/prepareStudioFurnitureCatalogFiles.ts | read-full | site/server/Studio | D-LibPlatform | none |
| site/server/Studio/publishFurnitureToCatalog.ts | read-full | site/server/Studio | D-LibPlatform | none |
| site/server/Studio/renderTopPngFromSvg.ts | read-full | site/server/Studio | D-LibPlatform | none |
| site/server/Studio/studioFurnitureSeed.ts | read-full | site/server/Studio | D-LibPlatform | none |
| site/server/Studio/studioStore.ts | read-full | site/server/Studio | D-LibPlatform | none |
| site/store/Planner/plannerCatalogStore.ts | read-full | site/store/Planner | D-LibPlatform | none |
| site/store/Planner/plannerUiStore.ts | read-full | site/store/Planner | D-LibPlatform | none |
| site/store/Studio/studioCatalogStore.ts | read-full | site/store/Studio | D-LibPlatform | none |
| site/store/Studio/studioUiStore.ts | read-full | site/store/Studio | D-LibPlatform | none |
| site/types/database.admin.types.ts | read-full | site/types | D-LibPlatform | none |
| site/types/database.types.ts | read-full | site/types | D-LibPlatform | none |
| site/types/webmcp.d.ts | read-full | site/types | D-LibPlatform | none |

## Appendix B — Binary validation metadata

All 11 binary inputs are non-zero, PNG-header-consistent, and dimension-decodable. Duplicate SHA-256 groups (identical frozen bytes) are intentional fixture thumbnails and do not represent missing review inputs.

| path set | format | measured metadata | SHA-256 |
|---|---|---|---|
| `site/platform/Planner/data/projects/p_3b-refresh-marker-1786286951638_78a2d8_thumb.png`, `site/platform/Planner/data/projects/p_3c-project-menu-marker-1786346036556_af3377_thumb.png` | PNG | 538x328; 5,072 bytes each | `c19a14cc553f9b10096c57dee41bfe5508df04fb4cb9979f5a6a8a747b265dc4` |
| `site/platform/Planner/data/projects/p_3b-refresh-marker-1786801573811_de5dd1_thumb.png`, `site/platform/Planner/data/projects/p_3c-project-menu-marker-1786726452472_1bc519_thumb.png`, `site/platform/Planner/data/projects/p_3c-project-menu-marker-1786801128387_82ca63_thumb.png`, `site/platform/Planner/data/projects/p_3c-project-menu-marker-1786802551857_3d377e_thumb.png`, `site/platform/Planner/data/projects/p_3c-project-menu-marker-1786803323768_98c71a_thumb.png`, `site/platform/Planner/data/projects/p_3c-project-menu-marker-1786898553644_012f6d_thumb.png`, `site/platform/Planner/data/projects/p_3c-project-menu-marker-1787015180831_e123a7_thumb.png` | PNG | 574x327; 5,268 bytes each | `0137a8a8a51308f33015d5d8be0a1141eff679555fa1b2d5b3675d14ca0810c4` |
| `site/platform/Planner/data/projects/p_untitled-plan_d80e0e_thumb.png` | PNG | 661x381; 6,679 bytes | `3c43974e9b9cb0cb439086b45578d8c2375e45d5360271977401d7ab2d36c287` |
