/** Pure Gate B mutation transitions. Adapters must commit one transition atomically. */

import { createHash } from "node:crypto";

import {
  PLANNER_PROJECT_CONTRACT_VERSION,
  PLANNER_PROJECT_SCHEMA_VERSION,
  PLANNER_REPOSITORY_CONTRACT_VERSION,
  PLANNER_REQUEST_FINGERPRINT_MAX_LENGTH,
  isValidPlannerIdempotencyKey,
  readPlannerProjectEnvelope,
  readPlannerProjectWrite,
  toPlannerProjectResponse,
  toPlannerProjectSummary,
  type PlannerProjectEnvelopeV1,
  type PlannerProjectRepositoryV1,
  type PlannerProjectResponseV1,
  type PlannerProjectSummaryV1,
  type PlannerRepositoryContextV1,
  type PlannerRepositoryResultV1,
  type SavePlannerProjectRequestV1,
} from "@planner/lib/plannerProjectRepository";
import {
  runObservedPlannerPersistenceAtCallSite,
} from "@/lib/observability/planner/plannerObservability.server";
import type { PlannerPersistenceOperation } from "@/lib/observability/planner/plannerObservability";
import {
  PlannerPersistenceConfigurationError,
  runContextualPlannerPersistenceOperation,
} from "@planner/lib/plannerPersistenceMode";

export type PlannerProjectMutationOperationV1 = "create" | "save" | "delete";

export interface PlannerIdempotencyReceiptV1 {
  ownerId: string;
  operation: PlannerProjectMutationOperationV1;
  projectId: string;
  key: string;
  fingerprint: string;
  result:
    | PlannerRepositoryResultV1<PlannerProjectResponseV1>
    | PlannerRepositoryResultV1<{ id: string; deleted: true }>;
}

export interface PlannerProjectAtomicStateV1 {
  project: PlannerProjectEnvelopeV1 | null;
  receipts: readonly PlannerIdempotencyReceiptV1[];
}

export type PlannerProjectMutationCommandV1 =
  | {
      operation: "create" | "save";
      projectId: string;
      request: SavePlannerProjectRequestV1;
    }
  | {
      operation: "delete";
      projectId: string;
      expectedRevision: number;
      idempotencyKey: string;
    };

export type PlannerProjectMutationValueV1 =
  | PlannerProjectResponseV1
  | { id: string; deleted: true };

export interface PlannerProjectMutationTransitionV1 {
  state: PlannerProjectAtomicStateV1;
  result: PlannerRepositoryResultV1<PlannerProjectMutationValueV1>;
  effect: "none" | "created" | "saved" | "deleted";
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "undefined";
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
}

export function fingerprintPlannerMutation(command: PlannerProjectMutationCommandV1): string {
  return canonical(command);
}

/**
 * Keep the persisted receipt fingerprint within the Admin schema bound while
 * retaining the canonical representation for normal-sized requests. Both
 * adapters use this helper so disk and Supabase replay the same identity.
 */
export function boundedPlannerMutationFingerprint(
  command: PlannerProjectMutationCommandV1,
): string {
  const fingerprint = fingerprintPlannerMutation(command);
  if (Array.from(fingerprint).length <= PLANNER_REQUEST_FINGERPRINT_MAX_LENGTH) {
    return fingerprint;
  }
  return createHash("sha256").update(fingerprint, "utf8").digest("hex");
}

function receiptIdentity(
  context: PlannerRepositoryContextV1,
  command: PlannerProjectMutationCommandV1,
): string {
  const key = command.operation === "delete" ? command.idempotencyKey : command.request.idempotencyKey;
  return `${context.ownerId}\u0000${command.operation}\u0000${command.projectId}\u0000${key}`;
}

function receiptIdentityFromStored(receipt: PlannerIdempotencyReceiptV1): string {
  return `${receipt.ownerId}\u0000${receipt.operation}\u0000${receipt.projectId}\u0000${receipt.key}`;
}

function conflict(
  message: string,
  currentRevision?: number,
): PlannerIdempotencyReceiptV1["result"] {
  return {
    ok: false,
    code: "CONFLICT",
    message,
    ...(currentRevision === undefined ? {} : { currentRevision }),
  };
}

function appendReceipt(
  state: PlannerProjectAtomicStateV1,
  context: PlannerRepositoryContextV1,
  command: PlannerProjectMutationCommandV1,
  fingerprint: string,
  result: PlannerIdempotencyReceiptV1["result"],
  project: PlannerProjectEnvelopeV1 | null,
): PlannerProjectAtomicStateV1 {
  const key = command.operation === "delete" ? command.idempotencyKey : command.request.idempotencyKey;
  return {
    project,
    receipts: [
      ...state.receipts,
      {
        ownerId: context.ownerId,
        operation: command.operation,
        projectId: command.projectId,
        key,
        fingerprint,
        result,
      },
    ],
  };
}

function recordIdempotentOutcome(
  state: PlannerProjectAtomicStateV1,
  context: PlannerRepositoryContextV1,
  command: PlannerProjectMutationCommandV1,
  fingerprint: string,
  result: PlannerIdempotencyReceiptV1["result"],
): PlannerProjectMutationTransitionV1 {
  return {
    state: appendReceipt(state, context, command, fingerprint, result, state.project),
    result,
    effect: "none",
  };
}

function validContext(context: PlannerRepositoryContextV1): boolean {
  return Boolean(context.ownerId.trim() && context.correlationId.trim());
}

/**
 * Compute one complete CAS/idempotency transition from one adapter snapshot.
 * The selected adapter must persist `transition.state` as one atomic operation;
 * the facade must not read from or retry through another adapter.
 */
export function applyPlannerProjectMutation(
  state: PlannerProjectAtomicStateV1,
  context: PlannerRepositoryContextV1,
  command: PlannerProjectMutationCommandV1,
  now: string,
): PlannerProjectMutationTransitionV1 {
  if (!validContext(context)) {
    return {
      state,
      result: { ok: false, code: "FORBIDDEN", message: "Verified owner context is required" },
      effect: "none",
    };
  }
  const nowMs = Date.parse(now);
  if (Number.isNaN(nowMs)) {
    return {
      state,
      result: { ok: false, code: "INVALID_PROJECT", message: "Operation time must be ISO-8601" },
      effect: "none",
    };
  }

  const key = command.operation === "delete" ? command.idempotencyKey : command.request.idempotencyKey;
  if (!isValidPlannerIdempotencyKey(key)) {
    return {
      state,
      result: {
        ok: false,
        code: "INVALID_IDEMPOTENCY_KEY",
        message: "Idempotency key must be a bounded opaque token",
      },
      effect: "none",
    };
  }

  const fingerprint = boundedPlannerMutationFingerprint(command);
  const identity = receiptIdentity(context, command);
  const receipt = state.receipts.find(
    (candidate) => receiptIdentityFromStored(candidate) === identity,
  );
  if (receipt) {
    if (receipt.fingerprint !== fingerprint) {
      return {
        state,
        result: conflict("Idempotency key was already used for a different request", state.project?.revision),
        effect: "none",
      };
    }
    return {
      state,
      result: { ...receipt.result, replayed: true },
      effect: "none",
    };
  }

  if (command.operation === "delete") {
    const current = state.project;
    if (!current || current.id !== command.projectId || current.ownerId !== context.ownerId) {
      return recordIdempotentOutcome(
        state,
        context,
        command,
        fingerprint,
        { ok: false, code: "NOT_FOUND", message: "Project not found" },
      );
    }
    if (command.expectedRevision !== current.revision) {
      return recordIdempotentOutcome(
        state,
        context,
        command,
        fingerprint,
        conflict("Project revision is stale", current.revision),
      );
    }
    const result = { ok: true as const, value: { id: current.id, deleted: true as const } };
    return {
      state: appendReceipt(state, context, command, fingerprint, result, null),
      result,
      effect: "deleted",
    };
  }

  if (command.request.contractVersion !== PLANNER_REPOSITORY_CONTRACT_VERSION) {
    return {
      state,
      result: { ok: false, code: "INVALID_PROJECT", message: "Unsupported repository contract" },
      effect: "none",
    };
  }
  if (command.request.project.id !== command.projectId) {
    return {
      state,
      result: { ok: false, code: "INVALID_PROJECT", message: "Path and project identities differ" },
      effect: "none",
    };
  }
  const write = readPlannerProjectWrite(command.request.project);
  if (!write.ok) {
    return { state, result: write, effect: "none" };
  }

  if (command.operation === "create") {
    if (command.request.expectedRevision !== 0) {
      return recordIdempotentOutcome(
        state,
        context,
        command,
        fingerprint,
        conflict("Project creation requires expected revision 0"),
      );
    }
    if (state.project) {
      return recordIdempotentOutcome(
        state,
        context,
        command,
        fingerprint,
        conflict("Project already exists", state.project.revision),
      );
    }
    const project: PlannerProjectEnvelopeV1 = {
      contractVersion: PLANNER_PROJECT_CONTRACT_VERSION,
      schemaVersion: PLANNER_PROJECT_SCHEMA_VERSION,
      ...write.value,
      ownerId: context.ownerId,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    };
    const result = { ok: true as const, value: toPlannerProjectResponse(project) };
    return {
      state: appendReceipt(state, context, command, fingerprint, result, project),
      result,
      effect: "created",
    };
  }

  const current = state.project;
  if (!current || current.id !== command.projectId || current.ownerId !== context.ownerId) {
    return recordIdempotentOutcome(
      state,
      context,
      command,
      fingerprint,
      { ok: false, code: "NOT_FOUND", message: "Project not found" },
    );
  }
  if (command.request.expectedRevision !== current.revision) {
    return recordIdempotentOutcome(
      state,
      context,
      command,
      fingerprint,
      conflict("Project revision is stale", current.revision),
    );
  }
  const currentUpdatedMs = Date.parse(current.updatedAt);
  const updatedAt = new Date(Math.max(nowMs, currentUpdatedMs + 1)).toISOString();
  const project: PlannerProjectEnvelopeV1 = {
    contractVersion: PLANNER_PROJECT_CONTRACT_VERSION,
    schemaVersion: PLANNER_PROJECT_SCHEMA_VERSION,
    ...write.value,
    ownerId: context.ownerId,
    revision: current.revision + 1,
    createdAt: current.createdAt,
    updatedAt,
  };
  const result = { ok: true as const, value: toPlannerProjectResponse(project) };
  return {
    state: appendReceipt(state, context, command, fingerprint, result, project),
    result,
    effect: "saved",
  };
}

/** Adapter port: one call must atomically compare and commit the returned state. */
export interface PlannerProjectAtomicAdapterV1 {
  readonly mode: "disk" | "supabase";
  list(ownerId: string): Promise<readonly unknown[]>;
  load(ownerId: string, projectId: string): Promise<unknown | null>;
  mutate(
    context: PlannerRepositoryContextV1,
    command: PlannerProjectMutationCommandV1,
  ): Promise<PlannerProjectMutationTransitionV1>;
}

export interface PlannerProjectAdapterSetV1 {
  disk: PlannerProjectAtomicAdapterV1;
  supabase: PlannerProjectAtomicAdapterV1;
}

function repositoryFailure(error: unknown): PlannerRepositoryResultV1<never> {
  if (error instanceof PlannerPersistenceConfigurationError) {
    return { ok: false, code: "CONFIGURATION_ERROR", message: error.message };
  }
  return {
    ok: false,
    code: "PERSISTENCE_FAILURE",
    message: "Selected Planner persistence adapter failed",
  };
}

/**
 * Assert that the adapter registered under `slot` declares the same mode.
 * This is a defence-in-depth check: the `runContextualPlannerPersistenceOperation`
 * caller guarantees only one slot runs per operation, but a misconfigured adapter
 * set (e.g. supabase adapter placed in disk slot) would silently write to the
 * wrong backend. Throwing here converts misconfiguration into a loud
 * CONFIGURATION_ERROR before any adapter call. (Requirements 12.5, 12.6)
 */
function assertAdapterSlotMode(
  adapter: PlannerProjectAtomicAdapterV1,
  expectedMode: "disk" | "supabase",
): void {
  if (adapter.mode !== expectedMode) {
    throw new PlannerPersistenceConfigurationError(
      `Planner adapter slot '${expectedMode}' received an adapter that declares mode '${adapter.mode}'. ` +
        "Adapter positions must match their declared modes to enforce exclusive persistence selection.",
    );
  }
}

/**
 * Validate the adapter set at construction time. Catches slot/mode mismatches
 * before the first operation is attempted. (Requirements 12.4, 12.5, 12.6)
 */
function assertAdapterSetValid(adapters: PlannerProjectAdapterSetV1): void {
  assertAdapterSlotMode(adapters.disk, "disk");
  assertAdapterSlotMode(adapters.supabase, "supabase");
}

async function withSelectedAdapter<TResult>(
  context: PlannerRepositoryContextV1,
  adapters: PlannerProjectAdapterSetV1,
  persistenceOperation: PlannerPersistenceOperation,
  operation: (adapter: PlannerProjectAtomicAdapterV1) => Promise<TResult>,
  env: NodeJS.ProcessEnv,
): Promise<TResult> {
  const runSelected = (
    selectedContext: PlannerRepositoryContextV1,
    adapter: PlannerProjectAtomicAdapterV1,
    expectedMode: "disk" | "supabase",
  ): Promise<TResult> => {
    // Defence-in-depth per-operation check: the resolved persistence mode must
    // match the adapter being called. Selected-adapter failures are reported
    // without consulting the other backend. (Requirements 12.5, 12.6, 12.8)
    assertAdapterSlotMode(adapter, expectedMode);
    return runObservedPlannerPersistenceAtCallSite({
      operation: persistenceOperation,
      mode: adapter.mode,
      correlationId: selectedContext.correlationId,
      execute: () => operation(adapter),
    });
  };

  return runContextualPlannerPersistenceOperation(
    context,
    {
      disk: (selectedContext) => runSelected(selectedContext, adapters.disk, "disk"),
      supabase: (selectedContext) => runSelected(selectedContext, adapters.supabase, "supabase"),
    },
    env,
  );
}

function projectMutationResult(
  result: PlannerRepositoryResultV1<PlannerProjectMutationValueV1>,
): PlannerRepositoryResultV1<PlannerProjectResponseV1> {
  if (!result.ok) return result;
  if ("deleted" in result.value) {
    return { ok: false, code: "PERSISTENCE_FAILURE", message: "Adapter returned an invalid mutation result" };
  }
  // value is PlannerProjectResponseV1 after narrowing "deleted" away
  return result as PlannerRepositoryResultV1<PlannerProjectResponseV1>;
}

function deleteMutationResult(
  result: PlannerRepositoryResultV1<PlannerProjectMutationValueV1>,
): PlannerRepositoryResultV1<{ id: string; deleted: true }> {
  if (!result.ok) return result;
  if (!("deleted" in result.value)) {
    return { ok: false, code: "PERSISTENCE_FAILURE", message: "Adapter returned an invalid delete result" };
  }
  // value is { id: string; deleted: true } after narrowing
  return result as PlannerRepositoryResultV1<{ id: string; deleted: true }>;
}

/** Compose the Gate B repository over exactly one runtime-selected atomic adapter. */
export function createPlannerProjectRepository(
  adapters: PlannerProjectAdapterSetV1,
  env: NodeJS.ProcessEnv = process.env,
): PlannerProjectRepositoryV1 {
  // Validate adapter slots once at construction. A mismatch throws
  // PlannerPersistenceConfigurationError so the caller receives CONFIGURATION_ERROR
  // rather than a silent write to the wrong backend. (Requirements 12.4–12.6)
  assertAdapterSetValid(adapters);
  return {
    contractVersion: PLANNER_REPOSITORY_CONTRACT_VERSION,
    async list(context) {
      try {
        const sources = await withSelectedAdapter(
          context,
          adapters,
          "planner.persistence.list",
          (adapter) => adapter.list(context.ownerId),
          env,
        );
        const summaries: PlannerProjectSummaryV1[] = [];
        for (const source of sources) {
          const read = readPlannerProjectEnvelope(source, { ownerId: context.ownerId });
          if (!read.ok) return read;
          summaries.push(toPlannerProjectSummary(read.value));
        }
        summaries.sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id),
        );
        return { ok: true, value: summaries };
      } catch (error) {
        return repositoryFailure(error);
      }
    },
    async load(context, id) {
      try {
        const source = await withSelectedAdapter(
          context,
          adapters,
          "planner.persistence.load",
          (adapter) => adapter.load(context.ownerId, id),
          env,
        );
        if (source === null) return { ok: true, value: null };
        const read = readPlannerProjectEnvelope(source, { ownerId: context.ownerId });
        if (!read.ok) return read;
        return { ok: true, value: toPlannerProjectResponse(read.value) };
      } catch (error) {
        return repositoryFailure(error);
      }
    },
    async create(context, request) {
      try {
        const transition = await withSelectedAdapter(
          context,
          adapters,
          "planner.persistence.create",
          (adapter) =>
            adapter.mutate(context, {
              operation: "create",
              projectId: request.project.id,
              request,
            }),
          env,
        );
        return projectMutationResult(transition.result);
      } catch (error) {
        return repositoryFailure(error);
      }
    },
    async save(context, id, request) {
      try {
        const transition = await withSelectedAdapter(
          context,
          adapters,
          "planner.persistence.save",
          (adapter) => adapter.mutate(context, { operation: "save", projectId: id, request }),
          env,
        );
        return projectMutationResult(transition.result);
      } catch (error) {
        return repositoryFailure(error);
      }
    },
    async delete(context, id, expectedRevision, idempotencyKey) {
      try {
        const transition = await withSelectedAdapter(
          context,
          adapters,
          "planner.persistence.delete",
          (adapter) =>
            adapter.mutate(context, {
              operation: "delete",
              projectId: id,
              expectedRevision,
              idempotencyKey,
            }),
          env,
        );
        return deleteMutationResult(transition.result);
      } catch (error) {
        return repositoryFailure(error);
      }
    },
  };
}
