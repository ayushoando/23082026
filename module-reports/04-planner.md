# Module 04 - Planner

## Summary

Planner is an independently owned canvas product mounted at `/ooplanner`. Its canonical project API has a carefully structured request pipeline with verified identity, server-derived owner scope, schema validation, revision compare-and-swap, idempotency, mode-aware persistence, and safe response envelopes.

The principal Planner risk is integration drift: a CRM caller still speaks an older API shape, and legacy plan endpoints remain active beside the canonical `/api/Planner/projects` family.

## UI and route structure

The Planner layout re-exports the Planner feature layout, which loads the Planner FOCSS entry, top bar, toast system, and `main.ooplanner-root`. The entry component selects guest versus signed-in behavior and links signed-in users to the project workspace.

The live Planner API family includes:

- `/api/Planner/projects` for canonical list/create;
- `/api/Planner/projects/[id]` for canonical read/update/delete;
- `/api/Planner/catalog` for catalog reads;
- `/api/Planner/catalog/upload` for multipart catalog uploads;
- `/api/Planner/handoff` for project handoff persistence;
- Planner AI-advisor handling and supporting routes.

The old `/api/plans` and Admin plan routes remain part of the compatibility surface.

## Canonical request pipeline

[`plannerRouteAdapter.ts`](../site/server/Planner/plannerRouteAdapter.ts) describes the intended order as correlation, quota, validation, origin/CSRF, verified session, owner scope, revision/idempotency, persistence, and safe response. [`plannerRequestPipeline.ts`](../site/lib/Planner/plannerRequestPipeline.ts) validates body/schema and mutation preconditions.

For create, `expectedRevision` must be exactly `0`; update/delete require a positive revision. Every canonical mutation also requires a bounded opaque idempotency key. This protects against stale writes and repeated browser/network submissions.

[`plannerProjectOperations.ts`](../site/lib/Planner/plannerProjectOperations.ts) contains pure transition logic for create/update/delete, computes request fingerprints, and turns idempotency receipts into replay-safe results. [`plannerProjectRepository.ts`](../site/lib/Planner/plannerProjectRepository.ts) validates schema, geometry, and scale, and applies response allowlists.

## API response contract

Canonical success responses are shaped as:

```text
{ success: true, contractVersion, data, correlationId }
```

The route handler in [`site/app/api/Planner/projects/route.ts`](../site/app/api/Planner/projects/route.ts) binds POST to the canonical create descriptor. This means the contract is enforced by the route pipeline, not merely documented in a client helper.

## Integration finding: CRM caller

[`ProjectDetailView.tsx`](../site/features/crm/ProjectDetailView.tsx) reads a list response as a bare array or `body.documents`, not `body.data`. Its create request omits both required mutation preconditions and reads the new ID as `body.id` rather than from `body.data`.

The issue is static but material: the CRM flow is not aligned with the canonical contract. Fix options are:

1. update the CRM caller to use the canonical Planner client/request type and unwrap `data`; or
2. intentionally use a legacy endpoint and document the compatibility behavior.

The first option preserves revision/idempotency guarantees and is the cleaner long-term boundary.

## Legacy API surface

[`projectsStore.ts`](../site/lib/Planner/projectsStore.ts) is shared by canonical Planner routes, portal `/api/plans`, and Admin plan routes. The legacy routes have auth/CSRF/rate-limit protections and owner checks, but they do not expose the canonical mutation envelope and may hardcode disk-oriented telemetry. Multiple contracts increase the chance that a new caller copies an obsolete payload shape.

## Local resilience and scale

The Planner UI keeps browser-side backup/session handoff state for resilience and reauthentication. This is a UX recovery layer, not the server authority. Server authority remains the selected disk/Supabase repository.

The current Planner scale is 0.05 px/mm, while legacy Studio data uses 0.2 px/mm. Repository validation explicitly accounts for the scale distinction, which is important for cross-product legacy data handling even though the products must not import each other.

## Recommended checks

1. Add a focused authorized contract test for CRM list/create, including validation failure and successful envelope unwrapping.
2. Inventory all `/api/plans` callers and set a retirement or compatibility owner.
3. Verify stale-revision and idempotent-replay behavior against the configured backend.
4. Run the Planner boundary scan before committing Planner changes.

## Evidence

- [`site/features/Planner/layout.tsx`](../site/features/Planner/layout.tsx)
- [`site/components/Planner/PlannerEntry.tsx`](../site/components/Planner/PlannerEntry.tsx)
- [`site/server/Planner/plannerRouteAdapter.ts`](../site/server/Planner/plannerRouteAdapter.ts)
- [`site/lib/Planner/plannerRequestPipeline.ts`](../site/lib/Planner/plannerRequestPipeline.ts)
- [`site/lib/Planner/plannerProjectOperations.ts`](../site/lib/Planner/plannerProjectOperations.ts)
- [`site/lib/Planner/plannerProjectRepository.ts`](../site/lib/Planner/plannerProjectRepository.ts)
- [`site/lib/Planner/plannerApiResponse.ts`](../site/lib/Planner/plannerApiResponse.ts)
- [`site/app/api/Planner/projects/route.ts`](../site/app/api/Planner/projects/route.ts)
- [`site/features/crm/ProjectDetailView.tsx`](../site/features/crm/ProjectDetailView.tsx)
- [`site/lib/Planner/projectsStore.ts`](../site/lib/Planner/projectsStore.ts)

