import "server-only";

import type { Json } from "@/platform/supabase/types";
import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";
import {
  boundedPlannerMutationFingerprint,
  type PlannerProjectAtomicAdapterV1,
  type PlannerProjectAtomicStateV1,
  type PlannerProjectMutationCommandV1,
  type PlannerProjectMutationOperationV1,
  type PlannerProjectMutationTransitionV1,
} from "@planner/lib/plannerProjectOperations";
import {
  PLANNER_PROJECT_CONTRACT_VERSION,
  PLANNER_PROJECT_SCHEMA_VERSION,
  PLANNER_REPOSITORY_CONTRACT_VERSION,
  isValidPlannerIdempotencyKey,
  readPlannerProjectEnvelope,
  readPlannerProjectWrite,
  toPlannerProjectResponse,
  type PlannerProjectEnvelopeV1,
  type PlannerProjectWriteV1,
} from "@planner/lib/plannerProjectRepository";
import { ensurePlannerProfile } from "@planner/lib/projectsStore.supabase";

type OandoPlanRow = {
  id: string;
  user_id: string;
  name: string;
  engine: string;
  payload: Json;
  thumbnail_url: string | null;
  status: string;
  revision: number;
  schema_version: number;
  created_at: string;
  updated_at: string;
};

interface PlannerMutationRpcArgumentsV1 {
  p_owner_id: string;
  p_operation: PlannerProjectMutationOperationV1;
  p_project_id: string;
  p_expected_revision: number;
  p_idempotency_key: string;
  p_request_fingerprint: string;
  p_name: string | null;
  p_payload: Json | null;
  p_thumbnail_url: string | null;
  p_status: string | null;
  p_schema_version: number;
}

interface PlannerMutationRpcRowV1 {
  response_status: "success" | "not_found" | "conflict";
  response_revision: number | null;
  response_payload: Json | null;
  response_name: string | null;
  response_thumbnail_url: string | null;
  response_plan_status: string | null;
  response_created_at: string | null;
  response_updated_at: string | null;
  replayed: boolean;
}

interface PlannerMutationRpcClientV1 {
  rpc(
    functionName: "planner_mutate_plan_v1",
    args: PlannerMutationRpcArgumentsV1,
  ): PromiseLike<{
    data: unknown;
    error: { code?: string; message: string } | null;
  }>;
}

/**
 * The generated Admin Database type now declares the Planner mutation RPC.
 * The routine metadata does not preserve the nullable/defaulted argument and
 * receipt-envelope contract, so this adapter retains a narrow, runtime-
 * validated boundary instead of trusting a lossy generated signature.
 */
export interface PlannerSupabaseMutationContractHandoffV1 {
  readonly source: "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql";
  readonly rpc: "planner_mutate_plan_v1";
  readonly missing: readonly [];
  readonly generatedTypeBoundary: "Admin generated Database types declare planner_mutate_plan_v1; this adapter validates the nullable RPC envelope at its boundary";
  readonly requiredFollowUp: "Regenerate Admin types with future Admin migrations and retain runtime validation for the RPC envelope";
  readonly owner: "Workstream 4";
}

export const PLANNER_SUPABASE_MUTATION_CONTRACT_HANDOFF_V1 = {
  source:
    "site/platform/supabase/migrations.admin/20260823090000_planner_revision_idempotency.sql",
  rpc: "planner_mutate_plan_v1",
  missing: [],
  generatedTypeBoundary:
    "Admin generated Database types declare planner_mutate_plan_v1; this adapter validates the nullable RPC envelope at its boundary",
  requiredFollowUp:
    "Regenerate Admin types with future Admin migrations and retain runtime validation for the RPC envelope",
  owner: "Workstream 4",
} as const satisfies PlannerSupabaseMutationContractHandoffV1;

function plansTable(client: ReturnType<typeof createSupabaseAuthAdminClient>) {
  return client.from("oando_plans");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function projectWithDedicatedVersions(
  source: Record<string, unknown>,
  row: OandoPlanRow,
): Record<string, unknown> {
  const {
    id: _payloadId,
    ownerId: _payloadOwnerId,
    owner_id: _payloadOwnerIdSnake,
    user_id: _payloadUserId,
    revision: _payloadRevision,
    schemaVersion: _payloadSchemaVersion,
    schema_version: _payloadSchemaVersionSnake,
    createdAt: _payloadCreatedAt,
    created_at: _payloadCreatedAtSnake,
    updatedAt: _payloadUpdatedAt,
    updated_at: _payloadUpdatedAtSnake,
    thumbnailUrl: _payloadThumbnailUrl,
    thumbnail_url: _payloadThumbnailUrlSnake,
    ...withoutServerFields
  } = source;
  return {
    ...withoutServerFields,
    revision: row.revision,
    schema_version: row.schema_version,
  };
}

function rowAsLegacyProject(row: OandoPlanRow): Record<string, unknown> {
  const payload = isRecord(row.payload) ? row.payload : {};
  return {
    ...projectWithDedicatedVersions(payload, row),
    id: row.id,
    ownerId: row.user_id,
    user_id: row.user_id,
    name: row.name,
    status: row.status,
    thumbnail_url: row.thumbnail_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Read current rows through the dedicated revision/schema columns. The
 * plannerRepositoryState branch is read-only compatibility for rows written by
 * the pre-migration adapter; new writes never recreate that payload container.
 */
function projectSourceFromRow(row: OandoPlanRow): unknown | null {
  const payload = isRecord(row.payload) ? row.payload : {};
  const container = payload.plannerRepositoryState;
  if (isRecord(container) && container.stateVersion === 1) {
    if (container.project === null) return null;
    if (isRecord(container.project)) {
      return {
        ...projectWithDedicatedVersions(container.project, row),
        id: row.id,
        ownerId: row.user_id,
        user_id: row.user_id,
        name: row.name,
        status: row.status,
        thumbnail_url: row.thumbnail_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }
  }
  return rowAsLegacyProject(row);
}

/**
 * Return normalized current/known-old records at the adapter boundary while
 * leaving unsupported source rows untouched for the repository facade to
 * reject explicitly. No compatibility result causes a write here.
 */
function projectForRead(ownerId: string, source: unknown | null): unknown | null {
  if (source === null) return null;
  const read = readPlannerProjectEnvelope(source, { ownerId });
  return read.ok ? read.value : source;
}

function payloadFromWrite(project: PlannerProjectWriteV1): Json {
  return {
    contractVersion: PLANNER_PROJECT_CONTRACT_VERSION,
    schemaVersion: PLANNER_PROJECT_SCHEMA_VERSION,
    geometry: project.geometry,
    sheet: project.sheet,
    layers: project.layers,
  } as unknown as Json;
}

async function loadOwnedRow(ownerId: string, projectId: string): Promise<OandoPlanRow | null> {
  if (!isUuid(ownerId) || !isUuid(projectId)) return null;
  const client = createSupabaseAuthAdminClient();
  const { data, error } = await plansTable(client)
    .select("*")
    .eq("id", projectId)
    .eq("user_id", ownerId)
    .maybeSingle();
  if (error) throw new Error("Planner project read failed");
  return (data as OandoPlanRow | null) ?? null;
}

function emptyState(): PlannerProjectAtomicStateV1 {
  return { project: null, receipts: [] };
}

function persistedProjectCompatibilityFailure(
  ownerId: string,
  row: OandoPlanRow | null,
): PlannerProjectMutationTransitionV1 | null {
  if (!row) return null;
  const source = projectSourceFromRow(row);
  if (source === null) return null;
  const read = readPlannerProjectEnvelope(source, { ownerId });
  if (read.ok) return null;
  return {
    state: emptyState(),
    result: read,
    effect: "none",
  };
}

function rejectedMutation(
  code:
    | "FORBIDDEN"
    | "INVALID_IDEMPOTENCY_KEY"
    | "INVALID_PROJECT"
    | "UNSUPPORTED_GEOMETRY",
  message: string,
): PlannerProjectMutationTransitionV1 {
  return {
    state: emptyState(),
    result: { ok: false, code, message },
    effect: "none",
  };
}

function validateMutationCommand(
  context: { ownerId: string; correlationId: string },
  command: PlannerProjectMutationCommandV1,
): PlannerProjectMutationTransitionV1 | null {
  if (!context.ownerId.trim() || !context.correlationId.trim() || !isUuid(context.ownerId)) {
    return rejectedMutation("FORBIDDEN", "Verified owner context is required");
  }
  const key =
    command.operation === "delete"
      ? command.idempotencyKey
      : command.request.idempotencyKey;
  if (!isValidPlannerIdempotencyKey(key)) {
    return rejectedMutation(
      "INVALID_IDEMPOTENCY_KEY",
      "Idempotency key must be a bounded opaque token",
    );
  }
  if (!isUuid(command.projectId)) {
    return rejectedMutation("INVALID_PROJECT", "Planner project identity is invalid");
  }
  if (command.operation === "delete") {
    if (!Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0) {
      return rejectedMutation("INVALID_PROJECT", "Project revision is invalid");
    }
    return null;
  }
  if (command.request.contractVersion !== PLANNER_REPOSITORY_CONTRACT_VERSION) {
    return rejectedMutation("INVALID_PROJECT", "Unsupported repository contract");
  }
  if (command.request.project.id !== command.projectId) {
    return rejectedMutation("INVALID_PROJECT", "Path and project identities differ");
  }
  const write = readPlannerProjectWrite(command.request.project);
  if (!write.ok) {
    return {
      state: emptyState(),
      result: write,
      effect: "none",
    };
  }
  if (
    !Number.isSafeInteger(command.request.expectedRevision) ||
    command.request.expectedRevision < 0
  ) {
    return rejectedMutation("INVALID_PROJECT", "Project revision is invalid");
  }
  if (command.operation === "create" && command.request.expectedRevision !== 0) {
    return {
      state: emptyState(),
      result: {
        ok: false,
        code: "CONFLICT",
        message: "Project creation requires expected revision 0",
      },
      effect: "none",
    };
  }
  return null;
}

function mutationRpcArguments(
  ownerId: string,
  command: PlannerProjectMutationCommandV1,
  requestFingerprint: string,
): PlannerMutationRpcArgumentsV1 {
  const project = command.operation === "delete" ? null : command.request.project;
  return {
    p_owner_id: ownerId,
    p_operation: command.operation,
    p_project_id: command.projectId,
    p_expected_revision:
      command.operation === "delete"
        ? command.expectedRevision
        : command.request.expectedRevision,
    p_idempotency_key:
      command.operation === "delete"
        ? command.idempotencyKey
        : command.request.idempotencyKey,
    p_request_fingerprint: requestFingerprint,
    p_name: project?.name ?? null,
    p_payload: project ? payloadFromWrite(project) : null,
    p_thumbnail_url: project?.thumbnailUrl ?? null,
    p_status: project?.status ?? null,
    p_schema_version: PLANNER_PROJECT_SCHEMA_VERSION,
  };
}

function isJsonValue(value: unknown): value is Json {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`Planner mutation RPC returned an invalid ${field}`);
  }
  return value;
}

function nullableIsoTimestamp(value: unknown, field: string): string | null {
  const timestamp = nullableString(value, field);
  if (timestamp !== null && !isIsoTimestamp(timestamp)) {
    throw new Error(`Planner mutation RPC returned an invalid ${field}`);
  }
  return timestamp;
}

function readMutationRpcResult(data: unknown): PlannerMutationRpcRowV1 {
  if (!Array.isArray(data) || data.length !== 1 || !isRecord(data[0])) {
    throw new Error("Planner mutation RPC returned an invalid result");
  }
  const row = data[0];
  const responseStatus = row.response_status;
  const responseRevisionRaw = row.response_revision;
  const responsePayload = row.response_payload;
  const replayed = row.replayed;
  if (
    responseStatus !== "success" &&
    responseStatus !== "not_found" &&
    responseStatus !== "conflict"
  ) {
    throw new Error("Planner mutation RPC returned an invalid status");
  }
  let responseRevision: number | null;
  if (responseRevisionRaw === null) {
    responseRevision = null;
  } else if (
    typeof responseRevisionRaw === "number" &&
    Number.isSafeInteger(responseRevisionRaw) &&
    responseRevisionRaw >= 1
  ) {
    responseRevision = responseRevisionRaw;
  } else {
    throw new Error("Planner mutation RPC returned an invalid revision");
  }
  if (responsePayload !== null && !isJsonValue(responsePayload)) {
    throw new Error("Planner mutation RPC returned an invalid response payload");
  }
  if (typeof replayed !== "boolean") {
    throw new Error("Planner mutation RPC returned an invalid replay marker");
  }
  return {
    response_status: responseStatus,
    response_revision: responseRevision,
    response_payload: responsePayload,
    response_name: nullableString(row.response_name, "response name"),
    response_thumbnail_url: nullableString(
      row.response_thumbnail_url,
      "response thumbnail URL",
    ),
    response_plan_status: nullableString(row.response_plan_status, "response status"),
    response_created_at: nullableIsoTimestamp(
      row.response_created_at,
      "response created timestamp",
    ),
    response_updated_at: nullableIsoTimestamp(
      row.response_updated_at,
      "response updated timestamp",
    ),
    replayed,
  };
}

async function callPlannerMutation(
  ownerId: string,
  command: PlannerProjectMutationCommandV1,
): Promise<PlannerMutationRpcRowV1> {
  const client = createSupabaseAuthAdminClient() as unknown as PlannerMutationRpcClientV1;
  const { data, error } = await client.rpc(
    "planner_mutate_plan_v1",
    mutationRpcArguments(ownerId, command, boundedPlannerMutationFingerprint(command)),
  );
  if (error) throw new Error("Planner mutation RPC failed");
  return readMutationRpcResult(data);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function mutationProjectEnvelope(
  ownerId: string,
  command: Extract<PlannerProjectMutationCommandV1, { operation: "create" | "save" }>,
  rpcResult: PlannerMutationRpcRowV1,
  row: OandoPlanRow | null,
  now: string,
): PlannerProjectEnvelopeV1 {
  // A response payload is authoritative for current migration rows. The
  // request payload is a bounded compatibility fallback for idempotency
  // receipts created before the response-envelope columns were introduced;
  // the exact fingerprint guarantees it is the same mutation request.
  const fallbackPayload = payloadFromWrite(command.request.project);
  const payload = isRecord(rpcResult.response_payload)
    ? rpcResult.response_payload
    : (fallbackPayload as Record<string, unknown>);
  const createdAt =
    rpcResult.response_created_at ??
    (isIsoTimestamp(row?.created_at) ? row.created_at : now);
  const updatedAt =
    rpcResult.response_updated_at ??
    (isIsoTimestamp(row?.updated_at) ? row.updated_at : now);
  const source = {
    ...payload,
    id: command.projectId,
    ownerId,
    user_id: ownerId,
    name: rpcResult.response_name ?? command.request.project.name,
    status: rpcResult.response_plan_status ?? command.request.project.status,
    thumbnailUrl:
      rpcResult.response_thumbnail_url ?? command.request.project.thumbnailUrl,
    revision: rpcResult.response_revision,
    schemaVersion: PLANNER_PROJECT_SCHEMA_VERSION,
    createdAt,
    updatedAt,
  };
  const read = readPlannerProjectEnvelope(source, { ownerId });
  if (!read.ok) {
    throw new Error(`Planner mutation RPC returned an invalid project: ${read.message}`);
  }
  return read.value;
}

function transitionFromMutationRpc(
  context: { ownerId: string },
  command: PlannerProjectMutationCommandV1,
  row: OandoPlanRow | null,
  rpcResult: PlannerMutationRpcRowV1,
  now: string,
): PlannerProjectMutationTransitionV1 {
  if (rpcResult.response_status === "success") {
    if (command.operation === "delete") {
      return {
        state: emptyState(),
        result: {
          ok: true,
          value: { id: command.projectId, deleted: true },
          ...(rpcResult.replayed ? { replayed: true } : {}),
        },
        effect: rpcResult.replayed ? "none" : "deleted",
      };
    }
    if (rpcResult.response_revision === null) {
      throw new Error("Planner mutation RPC omitted the committed revision");
    }
    const project = mutationProjectEnvelope(
      context.ownerId,
      command,
      rpcResult,
      row,
      now,
    );
    return {
      state: { project, receipts: [] },
      result: {
        ok: true,
        value: toPlannerProjectResponse(project),
        ...(rpcResult.replayed ? { replayed: true } : {}),
      },
      effect: rpcResult.replayed
        ? "none"
        : command.operation === "create"
          ? "created"
          : "saved",
    };
  }

  if (rpcResult.response_status === "not_found") {
    return {
      state: emptyState(),
      result: {
        ok: false,
        code: "NOT_FOUND",
        message: "Project not found",
        ...(rpcResult.replayed ? { replayed: true } : {}),
      },
      effect: "none",
    };
  }

  const currentRevision = rpcResult.response_revision ?? undefined;
  const message =
    command.operation === "create"
      ? "Project already exists"
      : currentRevision === undefined
        ? "Project mutation conflicted"
        : "Project revision is stale";
  return {
    state: emptyState(),
    result: {
      ok: false,
      code: "CONFLICT",
      message,
      ...(currentRevision === undefined ? {} : { currentRevision }),
      ...(rpcResult.replayed ? { replayed: true } : {}),
    },
    effect: "none",
  };
}

export const plannerProjectSupabaseAdapter: PlannerProjectAtomicAdapterV1 = {
  mode: "supabase",
  async list(ownerId) {
    if (!isUuid(ownerId)) return [];
    const client = createSupabaseAuthAdminClient();
    const { data, error } = await plansTable(client)
      .select("*")
      .eq("user_id", ownerId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error("Planner project list failed");
    const projects: unknown[] = [];
    for (const row of (data as OandoPlanRow[] | null) ?? []) {
      const project = projectForRead(ownerId, projectSourceFromRow(row));
      if (project !== null) projects.push(project);
    }
    return projects;
  },
  async load(ownerId, projectId) {
    const row = await loadOwnedRow(ownerId, projectId);
    if (!row) return null;
    return projectForRead(ownerId, projectSourceFromRow(row));
  },
  async mutate(context, command) {
    const rejected = validateMutationCommand(context, command);
    if (rejected) return rejected;

    const row = await loadOwnedRow(context.ownerId, command.projectId);
    const logicalTombstone = row !== null && projectSourceFromRow(row) === null;
    if (logicalTombstone && command.operation !== "create") {
      return {
        state: emptyState(),
        result: { ok: false, code: "NOT_FOUND", message: "Project not found" },
        effect: "none",
      };
    }
    const compatibilityFailure = persistedProjectCompatibilityFailure(
      context.ownerId,
      row,
    );
    if (compatibilityFailure) return compatibilityFailure;
    if (command.operation === "create" || row !== null) {
      await ensurePlannerProfile(context.ownerId);
    }
    const now = new Date().toISOString();
    const rpcResult = await callPlannerMutation(context.ownerId, command);
    return transitionFromMutationRpc(
      context,
      command,
      row,
      rpcResult,
      now,
    );
  },
};
