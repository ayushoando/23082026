/**
 * Gate B project-envelope and repository contract — published read-only surface.
 *
 * Workstream 2 owns this file. Workstreams 3 (UI/UX) and 4 (API/security)
 * import from here to consume the repository contract without depending on
 * the full plannerProjectRepository implementation details.
 *
 * Contract rules:
 * - Only `ownerId`-stripped `PlannerProjectResponseV1` values cross the API
 *   boundary (Req 13.5). Use `toPlannerProjectResponse` at every response site.
 * - Timestamps are always normalised: `updatedAt >= createdAt` (Req 13.2).
 *   Use `normalizeProjectTimestamps` whenever constructing envelope timestamps
 *   outside of `readPlannerProjectEnvelope`.
 * - Geometry is always in millimetres at Planner scale (0.05 px/mm) (Req 13.8).
 *   Legacy forms (Studio 0.2 px/mm) are adapted deterministically inside
 *   `readPlannerProjectEnvelope`; they never reach callers as raw pixels.
 * - Owner identity is always server-derived (Req 13.1). The `ownerId` field
 *   on `PlannerProjectEnvelopeV1` is populated only from the verified session.
 *
 * Changes to the exported contract require serial reconciliation at Gate B/C.
 * Non-owning workstreams must not modify this file.
 */

export {
  // Version constants
  PLANNER_PROJECT_CONTRACT_VERSION,
  PLANNER_PROJECT_SCHEMA_VERSION,
  PLANNER_PROJECT_KNOWN_OLD_SCHEMA_VERSION,
  PLANNER_REPOSITORY_CONTRACT_VERSION,

  // Allowed field lists — reference these when building API response assertions
  PLANNER_PROJECT_RESPONSE_FIELDS,
  PLANNER_PROJECT_SUMMARY_FIELDS,

  // Gate B contract object (full declared constraints)
  PLANNER_GATE_B_CONTRACT,

  // Boundary validators — always call these before/after persistence
  readPlannerProjectEnvelope,
  readPlannerProjectWrite,

  // Projection helpers — use these to produce API-safe shapes
  toPlannerProjectResponse,
  toPlannerProjectSummary,

  // Timestamp normalisation — use when constructing envelope timestamps
  normalizeProjectTimestamps,

  // Identity validators
  isValidPlannerProjectId,
  isValidPlannerIdempotencyKey,
} from "@planner/lib/plannerProjectRepository";

export type {
  // Envelope types
  PlannerProjectEnvelopeV1,
  PlannerProjectResponseV1,
  PlannerProjectSummaryV1,
  PlannerProjectWriteV1,
  PlannerProjectStatusV1,
  PlannerProjectReadResult,
  PlannerProjectReadOptions,

  // Repository interface and context types
  PlannerProjectRepositoryV1,
  PlannerRepositoryContextV1,
  PlannerRepositoryResultV1,
  PlannerRepositoryErrorCodeV1,
  SavePlannerProjectRequestV1,
} from "@planner/lib/plannerProjectRepository";
