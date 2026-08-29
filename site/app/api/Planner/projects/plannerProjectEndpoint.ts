import {
  plannerProjectRepository,
  PLANNER_REPOSITORY_CONTRACT_VERSION,
  readPlannerProjectEnvelope,
  type PlannerProjectResponseV1,
  type PlannerProjectWriteV1,
  type PlannerRepositoryContextV1,
  type PlannerRepositoryResultV1,
  type SavePlannerProjectRequestV1,
} from "@planner/lib/projectsStore";
import type {
  PlannerOperationContext,
  PlannerOperationResult,
} from "@planner/lib/plannerRequestPipeline";

type PlannerRepositoryFailure = Extract<
  PlannerRepositoryResultV1<unknown>,
  { ok: false }
>;

function invalidRequest(path: string): PlannerOperationResult<never> {
  return {
    ok: false,
    status: 400,
    code: "INVALID_REQUEST",
    metadata: { issues: [{ path, message: "Project mutation is invalid" }] },
  };
}

function repositoryContext(
  context: PlannerOperationContext,
): PlannerRepositoryContextV1 | null {
  if (!context.ownerScope) return null;
  return {
    ownerId: context.ownerScope.ownerId,
    correlationId: context.correlationId,
  };
}

function mapRepositoryFailure(
  failure: PlannerRepositoryFailure,
): PlannerOperationResult<never> {
  switch (failure.code) {
    case "CONFLICT":
      return {
        ok: false,
        status: 409,
        code: "REVISION_CONFLICT",
        metadata:
          failure.currentRevision === undefined
            ? {}
            : { currentRevision: failure.currentRevision },
      };
    case "FORBIDDEN":
    case "NOT_FOUND":
      return { ok: false, status: 404, code: "NOT_FOUND" };
    case "CONFIGURATION_ERROR":
    case "PERSISTENCE_FAILURE":
      return { ok: false, status: 503, code: "SERVICE_UNAVAILABLE" };
    case "INVALID_IDEMPOTENCY_KEY":
    case "INVALID_PROJECT":
    case "UNSUPPORTED_GEOMETRY":
    case "UNSUPPORTED_SCHEMA_VERSION":
      return invalidRequest("body");
  }
}

function projectWriteFromPayload(input: {
  payload: Readonly<Record<string, unknown>>;
  id: string;
  ownerId: string;
  current?: PlannerProjectResponseV1;
}): PlannerProjectWriteV1 | null {
  const { payload, id, ownerId, current } = input;
  const now = new Date().toISOString();
  const hasCanvas = payload.canvas_json !== undefined;
  const source = {
    id,
    user_id: ownerId,
    name: payload.name ?? current?.name ?? "Untitled",
    revision: current?.revision ?? 1,
    status: payload.status ?? current?.status ?? "draft",
    sheet: payload.sheet ?? current?.sheet ?? {},
    layers: payload.layers ?? current?.layers ?? [],
    thumbnail_url:
      payload.thumbnail_png ??
      payload.thumbnailUrl ??
      current?.thumbnailUrl ??
      null,
    created_at: current?.createdAt ?? now,
    updated_at: current?.updatedAt ?? now,
    ...(hasCanvas
      ? { canvas_json: payload.canvas_json }
      : { geometry: payload.geometry ?? current?.geometry, canvas_json: {} }),
  };
  const read = readPlannerProjectEnvelope(source, { ownerId });
  if (!read.ok) return null;
  return {
    id: read.value.id,
    name: read.value.name,
    status: read.value.status,
    geometry: read.value.geometry,
    sheet: read.value.sheet,
    layers: read.value.layers,
    thumbnailUrl: read.value.thumbnailUrl,
  };
}

function mutationRequest(
  payload: Readonly<Record<string, unknown>>,
  project: PlannerProjectWriteV1,
): SavePlannerProjectRequestV1 | null {
  if (
    !Number.isSafeInteger(payload.expectedRevision) ||
    typeof payload.idempotencyKey !== "string"
  ) {
    return null;
  }
  return {
    contractVersion: PLANNER_REPOSITORY_CONTRACT_VERSION,
    project,
    expectedRevision: Number(payload.expectedRevision),
    idempotencyKey: payload.idempotencyKey,
  };
}

export async function listPlannerProjects(
  context: PlannerOperationContext,
): Promise<PlannerOperationResult<unknown>> {
  const repository = repositoryContext(context);
  if (!repository) return { ok: false, status: 404, code: "NOT_FOUND" };
  const result = await plannerProjectRepository.list(repository);
  return result.ok
    ? { ok: true, status: 200, data: result.value }
    : mapRepositoryFailure(result);
}

export async function createPlannerProject(
  context: PlannerOperationContext,
): Promise<PlannerOperationResult<unknown>> {
  const repository = repositoryContext(context);
  if (!repository) return { ok: false, status: 404, code: "NOT_FOUND" };
  const payload = context.request.body as Readonly<Record<string, unknown>>;
  const project = projectWriteFromPayload({
    payload,
    id: crypto.randomUUID(),
    ownerId: repository.ownerId,
  });
  if (!project) return invalidRequest("body");
  const request = mutationRequest(payload, project);
  if (!request) return invalidRequest("body");
  const result = await plannerProjectRepository.create(repository, request);
  return result.ok
    ? { ok: true, status: 201, data: result.value }
    : mapRepositoryFailure(result);
}

export async function loadPlannerProject(
  context: PlannerOperationContext,
): Promise<PlannerOperationResult<unknown>> {
  const repository = repositoryContext(context);
  if (!repository) return { ok: false, status: 404, code: "NOT_FOUND" };
  const result = await plannerProjectRepository.load(
    repository,
    context.request.path.id,
  );
  if (!result.ok) return mapRepositoryFailure(result);
  return result.value
    ? { ok: true, status: 200, data: result.value }
    : { ok: false, status: 404, code: "NOT_FOUND" };
}

export async function savePlannerProject(
  context: PlannerOperationContext,
): Promise<PlannerOperationResult<unknown>> {
  const repository = repositoryContext(context);
  if (!repository) return { ok: false, status: 404, code: "NOT_FOUND" };
  const id = context.request.path.id;
  const current = await plannerProjectRepository.load(repository, id);
  if (!current.ok) return mapRepositoryFailure(current);
  if (!current.value) return { ok: false, status: 404, code: "NOT_FOUND" };
  const payload = context.request.body as Readonly<Record<string, unknown>>;
  const project = projectWriteFromPayload({
    payload,
    id,
    ownerId: repository.ownerId,
    current: current.value,
  });
  if (!project) return invalidRequest("body");
  const request = mutationRequest(payload, project);
  if (!request) return invalidRequest("body");
  const result = await plannerProjectRepository.save(repository, id, request);
  return result.ok
    ? { ok: true, status: 200, data: result.value }
    : mapRepositoryFailure(result);
}

export async function deletePlannerProject(
  context: PlannerOperationContext,
): Promise<PlannerOperationResult<unknown>> {
  const repository = repositoryContext(context);
  if (!repository) return { ok: false, status: 404, code: "NOT_FOUND" };
  const payload = context.request.body as Readonly<Record<string, unknown>>;
  if (
    !Number.isSafeInteger(payload.expectedRevision) ||
    typeof payload.idempotencyKey !== "string"
  ) {
    return invalidRequest("body");
  }
  const result = await plannerProjectRepository.delete(
    repository,
    context.request.path.id,
    Number(payload.expectedRevision),
    payload.idempotencyKey,
  );
  return result.ok
    ? { ok: true, status: 200, data: { ok: true } }
    : mapRepositoryFailure(result);
}
