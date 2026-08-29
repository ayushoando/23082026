/** Gate B project-envelope and repository contracts for Planner consumers. */

import {
  PLANNER_GEOMETRY_CONTRACT_VERSION,
  PLANNER_GEOMETRY_SCHEMA_VERSION,
  type PlannerGeometryReadResult,
  type PlannerGeometrySnapshotV1,
  readPlannerGeometry,
} from "@planner/lib/plannerGeometryContract";

export const PLANNER_PROJECT_CONTRACT_VERSION = 1 as const;
export const PLANNER_PROJECT_SCHEMA_VERSION = 1 as const;
export const PLANNER_REPOSITORY_CONTRACT_VERSION = 1 as const;

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

export interface PlannerProjectSummaryV1 {
  id: string;
  name: string;
  revision: number;
  status: PlannerProjectStatusV1;
  thumbnailUrl: string | null;
  updatedAt: string;
}

export interface PlannerRepositoryContextV1 {
  ownerId: string;
  correlationId: string;
}

export interface SavePlannerProjectRequestV1 {
  contractVersion: typeof PLANNER_REPOSITORY_CONTRACT_VERSION;
  project: PlannerProjectEnvelopeV1;
  expectedRevision: number;
  idempotencyKey: string;
}

export type PlannerRepositoryErrorCodeV1 =
  | "CONFLICT"
  | "FORBIDDEN"
  | "INVALID_PROJECT"
  | "NOT_FOUND"
  | "PERSISTENCE_FAILURE"
  | "UNSUPPORTED_GEOMETRY"
  | "UNSUPPORTED_SCHEMA_VERSION";

export type PlannerRepositoryResultV1<T> =
  | { ok: true; value: T }
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
  | { ok: true; value: PlannerProjectEnvelopeV1; source: "current" | "legacy" }
  | {
      ok: false;
      code: "INVALID_PROJECT" | "UNSUPPORTED_SCHEMA_VERSION" | "UNSUPPORTED_GEOMETRY";
      message: string;
      source: unknown;
      geometryResult?: PlannerGeometryReadResult;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function isoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function status(value: unknown): PlannerProjectStatusV1 {
  return value === "draft" || value === "archived" ? value : "active";
}

export function toPlannerProjectResponse(
  envelope: PlannerProjectEnvelopeV1,
): PlannerProjectResponseV1 {
  const { ownerId: _ownerId, ...response } = envelope;
  return response;
}

export function readPlannerProjectEnvelope(input: unknown): PlannerProjectReadResult {
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
  if (
    projectContract !== undefined &&
    projectContract !== PLANNER_PROJECT_CONTRACT_VERSION
  ) {
    return {
      ok: false,
      code: "UNSUPPORTED_SCHEMA_VERSION",
      message: `Unsupported Planner project contract version ${String(projectContract)}`,
      source: input,
    };
  }
  if (
    projectSchema !== undefined &&
    projectSchema !== PLANNER_PROJECT_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      code: "UNSUPPORTED_SCHEMA_VERSION",
      message: `Unsupported Planner project schema version ${String(projectSchema)}`,
      source: input,
    };
  }

  const id = requiredString(input.id);
  const ownerId = requiredString(input.ownerId ?? input.user_id);
  const name = requiredString(input.name);
  const createdAt = isoDate(input.createdAt ?? input.created_at);
  const updatedAt = isoDate(input.updatedAt ?? input.updated_at);
  const revisionRaw = input.revision ?? 1;
  if (
    !id ||
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

  const payload = isRecord(input.payload) ? input.payload : undefined;
  const geometryInput =
    input.geometry ??
    input.geometrySnapshot ??
    payload?.geometry ??
    payload?.geometrySnapshot;
  const geometryResult = readPlannerGeometry(geometryInput);
  if (!geometryResult.ok) {
    return {
      ok: false,
      code: "UNSUPPORTED_GEOMETRY",
      message: geometryResult.message,
      source: input,
      geometryResult,
    };
  }

  return {
    ok: true,
    source:
      projectSchema === PLANNER_PROJECT_SCHEMA_VERSION &&
      geometryResult.source === "current"
        ? "current"
        : "legacy",
    value: {
      contractVersion: PLANNER_PROJECT_CONTRACT_VERSION,
      schemaVersion: PLANNER_PROJECT_SCHEMA_VERSION,
      id,
      ownerId,
      name,
      revision: Number(revisionRaw),
      status: status(input.status),
      geometry: geometryResult.value,
      sheet: isRecord(input.sheet) ? input.sheet : {},
      layers: Array.isArray(input.layers) ? input.layers : [],
      thumbnailUrl:
        typeof (input.thumbnailUrl ?? input.thumbnail_url) === "string"
          ? String(input.thumbnailUrl ?? input.thumbnail_url)
          : null,
      createdAt,
      updatedAt,
    },
  };
}

export const PLANNER_GATE_B_CONTRACT = {
  geometryContractVersion: PLANNER_GEOMETRY_CONTRACT_VERSION,
  geometrySchemaVersion: PLANNER_GEOMETRY_SCHEMA_VERSION,
  projectContractVersion: PLANNER_PROJECT_CONTRACT_VERSION,
  projectSchemaVersion: PLANNER_PROJECT_SCHEMA_VERSION,
  repositoryContractVersion: PLANNER_REPOSITORY_CONTRACT_VERSION,
} as const;
