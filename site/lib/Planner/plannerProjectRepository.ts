/** Gate B project-envelope and repository contracts for Planner consumers. */
/** Gate B project-envelope and repository contracts for Planner consumers. */

import { collectSceneGeometryAtScale, type FabricLikeCanvas } from "@planner/lib/fabricGeometryBridge";
import {
  PLANNER_GEOMETRY_CONTRACT_VERSION,
  PLANNER_GEOMETRY_SCHEMA_VERSION,
  PLANNER_GEOMETRY_UNIT,
  PLANNER_SCALE_PX_PER_MM,
  type PlannerGeometryReadResult,
  type PlannerGeometrySnapshotV1,
  readPlannerGeometry,
} from "@planner/lib/plannerGeometryContract";

export const PLANNER_PROJECT_CONTRACT_VERSION = 1 as const;
export const PLANNER_PROJECT_SCHEMA_VERSION = 1 as const;
export const PLANNER_PROJECT_KNOWN_OLD_SCHEMA_VERSION = 0 as const;
export const PLANNER_REPOSITORY_CONTRACT_VERSION = 1 as const;
export const PLANNER_IDEMPOTENCY_KEY_MAX_LENGTH = 120 as const;

export type PlannerProjectStatusV1 = "draft" | "active" | "archived";

export interface PlannerProjectEnvelopeV1 {
  contractVersion: typeof PLANNER_PROJECT_CONTRACT_VERSION;
  schemaVersion: typeof PLANNER_PROJECT_SCHEMA_VERSION;
  id: string;
  ownerId: string;
  name: string;
  revision: number;
  status: PlannerProjectStatusV1;
  geometry: PlannerGeometrySnapshotV1;
  sheet: Record<string, unknown>;
  layers: unknown[];
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PlannerProjectResponseV1 = Omit<PlannerProjectEnvelopeV1, "ownerId">;

/** Client-writable fields. Owner, revision, and timestamps are server controlled. */
export type PlannerProjectWriteV1 = Pick<
  PlannerProjectResponseV1,
  "id" | "name" | "status" | "geometry" | "sheet" | "layers" | "thumbnailUrl"
>;

export interface PlannerProjectSummaryV1 {
  id: string;
  name: string;
  revision: number;
  status: PlannerProjectStatusV1;
  thumbnailUrl: string | null;
  updatedAt: string;
}

export interface PlannerRepositoryContextV1 {
  /** Verified server-session owner. Never populate this from a request body. */
  ownerId: string;
  correlationId: string;
}

export interface SavePlannerProjectRequestV1 {
  contractVersion: typeof PLANNER_REPOSITORY_CONTRACT_VERSION;
  project: PlannerProjectWriteV1;
  expectedRevision: number;
  idempotencyKey: string;
}

export type PlannerRepositoryErrorCodeV1 =
  | "CONFIGURATION_ERROR"
  | "CONFLICT"
  | "FORBIDDEN"
  | "INVALID_IDEMPOTENCY_KEY"
  | "INVALID_PROJECT"
  | "NOT_FOUND"
  | "PERSISTENCE_FAILURE"
  | "UNSUPPORTED_GEOMETRY"
  | "UNSUPPORTED_SCHEMA_VERSION";

export type PlannerRepositoryResultV1<T> =
  | { ok: true; value: T; replayed?: boolean }
  | {
      ok: false;
      code: PlannerRepositoryErrorCodeV1;
      message: string;
      currentRevision?: number;
    };

export interface PlannerProjectRepositoryV1 {
  readonly contractVersion: typeof PLANNER_REPOSITORY_CONTRACT_VERSION;
  list(
    context: PlannerRepositoryContextV1,
  ): Promise<PlannerRepositoryResultV1<PlannerProjectSummaryV1[]>>;
  load(
    context: PlannerRepositoryContextV1,
    id: string,
  ): Promise<PlannerRepositoryResultV1<PlannerProjectResponseV1 | null>>;
  create(
    context: PlannerRepositoryContextV1,
    request: SavePlannerProjectRequestV1,
  ): Promise<PlannerRepositoryResultV1<PlannerProjectResponseV1>>;
  save(
    context: PlannerRepositoryContextV1,
    id: string,
    request: SavePlannerProjectRequestV1,
  ): Promise<PlannerRepositoryResultV1<PlannerProjectResponseV1>>;
  delete(
    context: PlannerRepositoryContextV1,
    id: string,
    expectedRevision: number,
    idempotencyKey: string,
  ): Promise<PlannerRepositoryResultV1<{ id: string; deleted: true }>>;
}

export type PlannerProjectReadResult =
  | {
      ok: true;
      value: PlannerProjectEnvelopeV1;
      source: "current" | "known-old";
    }
  | {
      ok: false;
      code: "INVALID_PROJECT" | "UNSUPPORTED_SCHEMA_VERSION" | "UNSUPPORTED_GEOMETRY";
      message: string;
      /** Exact input reference; unsupported and invalid records are never rewritten. */
      source: unknown;
      geometryResult?: PlannerGeometryReadResult;
    };

export interface PlannerProjectReadOptions {
  /** Server-derived owner used to adapt ownerless known-old disk records. */
  ownerId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function projectStatus(value: unknown): PlannerProjectStatusV1 {
  return value === "draft" || value === "archived" ? value : "active";
}

function parseRecord(value: unknown): Record<string, unknown> | undefined {
  if (isRecord(value)) return value;
  if (typeof value !== "string") return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function legacyGeometryInput(
  input: Record<string, unknown>,
  payload: Record<string, unknown> | undefined,
): unknown {
  const explicit =
    input.geometry ?? input.geometrySnapshot ?? payload?.geometry ?? payload?.geometrySnapshot;
  if (explicit !== undefined) return explicit;

  const canvas = parseRecord(input.canvas_json ?? input.scene_json ?? payload?.canvas_json ?? payload?.scene);
  if (!canvas) return undefined;
  const sheet = parseRecord(input.sheet ?? payload?.sheet);
  const scale =
    canvas.scalePxPerMm ??
    canvas.scale_px_per_mm ??
    sheet?.scalePxPerMm ??
    sheet?.scale_px_per_mm ??
    PLANNER_SCALE_PX_PER_MM;

  // Determine the extraction scale. When the persisted canvas carries a
  // non-Planner scale (e.g. Studio 0.2 px/mm), extract geometry at that
  // scale so px→mm conversion is correct (px / legacy_scale = mm).
  // Omitted legacy metadata predates the versioned contract and is known to
  // use Planner scale. Explicit malformed metadata must reach the geometry
  // contract unchanged so it returns UNSUPPORTED_PLANNER_SCALE instead of
  // silently defaulting a corrupt snapshot to Planner scale.
  if (typeof scale !== "number" || !Number.isFinite(scale) || scale <= 0) {
    return {
      unit: PLANNER_GEOMETRY_UNIT,
      scalePxPerMm: scale,
    };
  }

  // Extract at the validated persisted scale — this produces correct mm values
  // for canonical Planner snapshots and known legacy Studio snapshots alike.
  const geometry = collectSceneGeometryAtScale(canvas as FabricLikeCanvas, scale);

  if (scale === PLANNER_SCALE_PX_PER_MM) {
    // Current scale: tag normally.
    return {
      unit: PLANNER_GEOMETRY_UNIT,
      scalePxPerMm: PLANNER_SCALE_PX_PER_MM,
      geometry,
      canvasSnapshot: canvas,
    };
  }

  // Legacy scale: the mm values are already correct (px / legacy_scale).
  // For known legacy scales, readPlannerGeometry will accept and re-tag;
  // for unknown scales it will reject with UNSUPPORTED_PLANNER_SCALE.
  return {
    unit: PLANNER_GEOMETRY_UNIT,
    scalePxPerMm: scale,
    geometry,
    canvasSnapshot: canvas,
  };
}

/**
 * Allowlisted response fields for a full project load response (Req 13.5).
 *
 * This list is the single source of truth for what fields may cross the
 * persistence boundary into an API response. `ownerId` is always excluded
 * (server-derived, never returned to clients). Any new internal envelope
 * fields added in the future are automatically excluded until explicitly
 * added here.
 */
export const PLANNER_PROJECT_RESPONSE_FIELDS = [
  "contractVersion",
  "schemaVersion",
  "id",
  "name",
  "revision",
  "status",
  "geometry",
  "sheet",
  "layers",
  "thumbnailUrl",
  "createdAt",
  "updatedAt",
] as const satisfies ReadonlyArray<keyof PlannerProjectResponseV1>;

/**
 * Allowlisted summary fields returned in list responses (Req 13.5).
 * Excludes geometry, sheet, layers, and canvas content.
 */
export const PLANNER_PROJECT_SUMMARY_FIELDS = [
  "id",
  "name",
  "revision",
  "status",
  "thumbnailUrl",
  "updatedAt",
] as const satisfies ReadonlyArray<keyof PlannerProjectSummaryV1>;

/**
 * Normalise project timestamps at the persistence boundary.
 *
 * Rules (Req 13.2):
 * - `createdAt` is always preserved from the existing record on save;
 *   set to `now` on create.
 * - `updatedAt` is always `now` on a new mutation, or the stored value on
 *   a replayed idempotent operation.
 * - `updatedAt` must never be earlier than `createdAt`.
 */
export function normalizeProjectTimestamps(opts: {
  createdAt: string;
  updatedAt: string;
}): { createdAt: string; updatedAt: string } {
  const createdAtMs = Date.parse(opts.createdAt);
  const updatedAtMs = Date.parse(opts.updatedAt);
  // If updatedAt precedes createdAt (e.g. clock skew or replayed receipt),
  // advance updatedAt to equal createdAt so the invariant always holds.
  const resolvedUpdatedAt =
    updatedAtMs >= createdAtMs
      ? opts.updatedAt
      : new Date(createdAtMs).toISOString();
  return { createdAt: opts.createdAt, updatedAt: resolvedUpdatedAt };
}

/**
 * Project the full internal envelope to the API response shape.
 *
 * Uses an explicit allowlist (PLANNER_PROJECT_RESPONSE_FIELDS) rather than
 * exclusion so that new internal fields cannot accidentally leak to clients.
 * (Req 13.5)
 */
export function toPlannerProjectResponse(
  envelope: PlannerProjectEnvelopeV1,
): PlannerProjectResponseV1 {
  return {
    contractVersion: envelope.contractVersion,
    schemaVersion: envelope.schemaVersion,
    id: envelope.id,
    name: envelope.name,
    revision: envelope.revision,
    status: envelope.status,
    geometry: envelope.geometry,
    sheet: envelope.sheet,
    layers: envelope.layers,
    thumbnailUrl: envelope.thumbnailUrl,
    createdAt: envelope.createdAt,
    updatedAt: envelope.updatedAt,
  };
}

/**
 * Project the full internal envelope to a list-summary shape.
 *
 * Uses an explicit allowlist (PLANNER_PROJECT_SUMMARY_FIELDS).
 * (Req 13.5)
 */
export function toPlannerProjectSummary(
  envelope: PlannerProjectEnvelopeV1,
): PlannerProjectSummaryV1 {
  return {
    id: envelope.id,
    name: envelope.name,
    revision: envelope.revision,
    status: envelope.status,
    thumbnailUrl: envelope.thumbnailUrl,
    updatedAt: envelope.updatedAt,
  };
}

/**
 * Validate a persisted project. Missing/zero schema is the single known-old form.
 * Migration is pure and in-memory; callers must explicitly save to persist V1.
 */
export function readPlannerProjectEnvelope(
  input: unknown,
  options: PlannerProjectReadOptions = {},
): PlannerProjectReadResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      code: "INVALID_PROJECT",
      message: "Planner project must be an object",
      source: input,
    };
  }

  const projectContract = input.contractVersion ?? input.contract_version;
  const projectSchema = input.schemaVersion ?? input.schema_version;
  const knownOldSchema =
    projectSchema === undefined || projectSchema === PLANNER_PROJECT_KNOWN_OLD_SCHEMA_VERSION;
  if (
    projectContract !== undefined &&
    projectContract !== PLANNER_PROJECT_CONTRACT_VERSION &&
    projectContract !== PLANNER_PROJECT_KNOWN_OLD_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      code: "UNSUPPORTED_SCHEMA_VERSION",
      message: `Unsupported Planner project contract version ${String(projectContract)}`,
      source: input,
    };
  }
  if (projectSchema !== PLANNER_PROJECT_SCHEMA_VERSION && !knownOldSchema) {
    return {
      ok: false,
      code: "UNSUPPORTED_SCHEMA_VERSION",
      message: `Unsupported Planner project schema version ${String(projectSchema)}`,
      source: input,
    };
  }

  const persistedOwner = requiredString(input.ownerId ?? input.user_id);
  const ownerId = options.ownerId ?? persistedOwner;
  if (options.ownerId && persistedOwner && persistedOwner !== options.ownerId) {
    return {
      ok: false,
      code: "INVALID_PROJECT",
      message: "Persisted Planner project owner does not match server owner scope",
      source: input,
    };
  }

  const id = requiredString(input.id);
  const name = requiredString(input.name ?? input.project_name);
  const createdAt = isoDate(input.createdAt ?? input.created_at);
  const updatedAt = isoDate(input.updatedAt ?? input.updated_at);
  const revisionRaw = input.revision ?? 1;
  if (
    !id ||
    !isValidPlannerProjectId(id) ||
    !ownerId ||
    !name ||
    !createdAt ||
    !updatedAt ||
    Date.parse(updatedAt) < Date.parse(createdAt) ||
    !Number.isInteger(revisionRaw) ||
    Number(revisionRaw) < 1
  ) {
    return {
      ok: false,
      code: "INVALID_PROJECT",
      message: "Planner project identity, owner, metadata, revision, or timestamps are invalid",
      source: input,
    };
  }

  const payload = parseRecord(input.payload);
  const geometryResult = readPlannerGeometry(legacyGeometryInput(input, payload));
  if (!geometryResult.ok) {
    return {
      ok: false,
      code: "UNSUPPORTED_GEOMETRY",
      message: geometryResult.message,
      source: input,
      geometryResult,
    };
  }

  const sheet = parseRecord(input.sheet ?? payload?.sheet) ?? {};
  const layersRaw = input.layers ?? payload?.layers;
  return {
    ok: true,
    source:
      projectSchema === PLANNER_PROJECT_SCHEMA_VERSION &&
      projectContract === PLANNER_PROJECT_CONTRACT_VERSION &&
      geometryResult.source === "current"
        ? "current"
        : "known-old",
    value: {
      contractVersion: PLANNER_PROJECT_CONTRACT_VERSION,
      schemaVersion: PLANNER_PROJECT_SCHEMA_VERSION,
      id,
      ownerId,
      name,
      revision: Number(revisionRaw),
      status: projectStatus(input.status),
      geometry: geometryResult.value,
      sheet,
      layers: Array.isArray(layersRaw) ? layersRaw : [],
      thumbnailUrl:
        typeof (input.thumbnailUrl ?? input.thumbnail_url) === "string"
          ? String(input.thumbnailUrl ?? input.thumbnail_url)
          : null,
      createdAt,
      updatedAt,
    },
  };
}

/** Reject owner/revision/timestamp injection and validate all client-writable fields. */
export function readPlannerProjectWrite(input: unknown):
  | { ok: true; value: PlannerProjectWriteV1 }
  | { ok: false; code: "INVALID_PROJECT" | "UNSUPPORTED_GEOMETRY"; message: string } {
  if (!isRecord(input)) {
    return { ok: false, code: "INVALID_PROJECT", message: "Planner project write must be an object" };
  }
  if (
    "ownerId" in input ||
    "owner_id" in input ||
    "user_id" in input ||
    "revision" in input ||
    "createdAt" in input ||
    "created_at" in input ||
    "updatedAt" in input ||
    "updated_at" in input
  ) {
    return {
      ok: false,
      code: "INVALID_PROJECT",
      message: "Owner, revision, and timestamps are server-derived fields",
    };
  }
  const id = requiredString(input.id);
  const name = requiredString(input.name);
  if (!id || !isValidPlannerProjectId(id) || !name) {
    return {
      ok: false,
      code: "INVALID_PROJECT",
      message: "Project id must be a bounded opaque token and name is required",
    };
  }
  const geometryResult = readPlannerGeometry(input.geometry);
  if (!geometryResult.ok) {
    return { ok: false, code: "UNSUPPORTED_GEOMETRY", message: geometryResult.message };
  }
  return {
    ok: true,
    value: {
      id,
      name,
      status: projectStatus(input.status),
      geometry: geometryResult.value,
      sheet: isRecord(input.sheet) ? input.sheet : {},
      layers: Array.isArray(input.layers) ? input.layers : [],
      thumbnailUrl: typeof input.thumbnailUrl === "string" ? input.thumbnailUrl : null,
    },
  };
}

export function isValidPlannerProjectId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 120 &&
    /^[A-Za-z0-9][A-Za-z0-9._~-]*$/.test(value)
  );
}

export function isValidPlannerIdempotencyKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= PLANNER_IDEMPOTENCY_KEY_MAX_LENGTH &&
    /^[A-Za-z0-9._~-]+$/.test(value)
  );
}

/**
 * Gate B repository contract — published for read-only consumption by
 * workstreams 3 (UI/UX) and 4 (API/security).
 *
 * - Workstream 3: reference `allowedResponseFields` and `allowedSummaryFields`
 *   when building client-side type expectations.
 * - Workstream 4: reference `ownerSource`, `serializationPolicy`, and version
 *   constants when wiring request-processing and serialization.
 * - No workstream may modify this contract unilaterally; contract changes
 *   require serial reconciliation at Gate B/C per the task spec.
 */
export const PLANNER_GATE_B_CONTRACT = {
  geometryContractVersion: PLANNER_GEOMETRY_CONTRACT_VERSION,
  geometrySchemaVersion: PLANNER_GEOMETRY_SCHEMA_VERSION,
  geometryUnit: PLANNER_GEOMETRY_UNIT,
  geometryScalePxPerMm: PLANNER_SCALE_PX_PER_MM,
  projectContractVersion: PLANNER_PROJECT_CONTRACT_VERSION,
  projectSchemaVersion: PLANNER_PROJECT_SCHEMA_VERSION,
  repositoryContractVersion: PLANNER_REPOSITORY_CONTRACT_VERSION,
  /**
   * Owner identity is always derived from the verified server session.
   * Client-supplied owner identifiers are rejected before persistence.
   * (Req 13.1, 13.5)
   */
  ownerSource: "verified-server-session" as const,
  /**
   * Known legacy scales that are deterministically adapted on deserialization.
   * Studio scale (0.2 px/mm) is the only recognised legacy scale.
   */
  knownLegacyScales: [0.2] as readonly number[],
  /**
   * Serialization contract: persisted geometry uses millimetres as the
   * canonical unit with explicit scale metadata. Known legacy snapshots
   * (Studio 0.2 px/mm) are adapted deterministically; unknown scales
   * produce an explicit UNSUPPORTED_PLANNER_SCALE error. (Req 13.8)
   */
  serializationPolicy: "normalize-mm-validate-scale-adapt-known-legacy" as const,
  /**
   * Fields returned in a full project load response. Workstream 4 API
   * handlers must not include `ownerId` or any unlisted field. (Req 13.5)
   */
  allowedResponseFields: PLANNER_PROJECT_RESPONSE_FIELDS,
  /**
   * Fields returned in a project list summary. Workstream 4 list handlers
   * must not include geometry, sheet, layers, or canvas content. (Req 13.5)
   */
  allowedSummaryFields: PLANNER_PROJECT_SUMMARY_FIELDS,
  /**
   * Timestamp invariants enforced at the persistence boundary. (Req 13.2)
   * - createdAt: always preserved from the existing record on save.
   * - updatedAt: always the operation time; never earlier than createdAt.
   */
  timestampPolicy: "preserve-created-at-advance-updated-at" as const,
} as const;
