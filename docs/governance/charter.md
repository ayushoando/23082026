# Programme charter and historical decisions

This document preserves programme direction and architectural decisions without presenting old plans or measurements as current truth. Current user instructions, live source, the [process floor](../../AGENTS.md), and active plan folders indexed by [`plans/README.md`](../../plans/README.md) take precedence.

## Status

**Status: historical governance with retained constraints.** Verify every implementation, package, route, and completion claim against live source. Current targets and evidence states belong in [benchmarks](./benchmarks.md); enforceable rules belong in [programme governance](./rules.md).

## Product direction

- Furniture Studio (`/oostudio`) authors furniture and release assets.
- Floor Planner (`/ooplanner`) places catalog products and produces layout and bill-of-quantities outputs.
- Marketing and Admin remain separate product surfaces.
- Canvas fidelity, catalog honesty, accessibility, and explicit handoff are product goals, not inferred completion claims.

## Retained architecture decisions

| Area | Retained decision | Status boundary |
|---|---|---|
| Forks | Studio and Planner use separate component, hook, library, store, server, and FOCSS trees with no cross-imports. | Current process contract; validate with `scan:boundaries` only when authorized. |
| Canvas | Fabric remains the 2D engine for both forked workspaces. | Configured from manifest and imports; rendered behavior requires browser evidence. |
| Workspace layout | Each fork owns its Dockview shell and state. | Configured; no shared dock state is permitted. |
| Styling | FOCSS on Tailwind CSS v4 owns semantic tokens and zones; React Aria supplies selected behavior primitives. | Current architecture; see [FOCSS architecture](../architecture/css.md). |
| Icons | Product icon use follows the repository's Phosphor policy. | Configured; current compliance requires an authorized check. |
| State | Each workspace owns its runtime store; normalized application data, not raw package state, is persistence authority. | Retained design constraint. |
| AI | Mastra, LanceDB, and Orama remain server-side advisory infrastructure; suggestions require explicit user application. | Configured; runtime effectiveness is unverified here. |
| Product truth | Missing prices, failed releases, and unsupported capabilities remain explicit rather than guessed or hidden. | Current product constraint. |
| Accessibility | Required actions remain keyboard reachable; reduced motion, forced colors, and responsive browser use are explicit design targets. | Target only; no conformance claim. |

## Persistence and release decisions

- Persistence is exclusive: disk only with `DEV_AUTH_BYPASS=1` outside production, Supabase otherwise. Never dual-write.
- Production filesystem is read-only; runtime writes use mode-aware wrappers.
- Admin owns plans, staff/customer data, furniture rows, and descriptors. Products owns marketing catalog and configurator data.
- Published plan symbols use repository-owned contracts, release records, checksums, and storage pointers. A failed release must not replace the last valid release.
- Database retirement uses a reversible migration or archive schema; never a bare, unrecoverable production drop.

## Configuration envelope

Workspace configuration uses a versioned, revisioned envelope with a validated workspace identifier, profile key, active state, payload, updater, and timestamp. Product-specific schemas validate the payload after the envelope identifies the workspace. Service-role writes remain server-only and behind authenticated administrative APIs.

## Decision-change procedure

1. Identify the retained decision and its live owning source.
2. Record why current product requirements cannot be met within it.
3. Assess fork, persistence, security, accessibility, migration, and rollback impact.
4. Obtain owner approval in the active plan before implementation.
5. Update this charter only after live source and durable references agree.

Historical checklists and baseline command results were removed because they do not establish current state. Git history remains the archive for those tracked records.
