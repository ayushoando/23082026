import "server-only";

import type { Json } from "@/platform/supabase/types";
import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";
import {
  applyPlannerProjectMutation,
  type PlannerIdempotencyReceiptV1,
  type PlannerProjectAtomicAdapterV1,
  type PlannerProjectAtomicStateV1,
  type PlannerProjectMutationCommandV1,
  type PlannerProjectMutationTransitionV1,
} from "@planner/lib/plannerProjectOperations";
import {
  readPlannerProjectEnvelope,
  type PlannerProjectEnvelopeV1,
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
  created_at: string;
  updated_at: string;
};

interface SupabasePlannerAtomicPayloadV1 {
  plannerRepositoryState: {
    stateVersion: 1;
    project: PlannerProjectEnvelopeV1 | null;
    receipts: readonly PlannerIdempotencyReceiptV1[];
  };
}

class PlannerSupabaseCompatibilityError extends Error {
  readonly code: "INVALID_PROJECT" | "UNSUPPORTED_SCHEMA_VERSION" | "UNSUPPORTED_GEOMETRY";

  constructor(
    code: "INVALID_PROJECT" | "UNSUPPORTED_SCHEMA_VERSION" | "UNSUPPORTED_GEOMETRY",
    message: string,
  ) {
    super(message);
    this.name = "PlannerSupabaseCompatibilityError";
    this.code = code;
  }
}

function plansTable(client: ReturnType<typeof createSupabaseAuthAdminClient>) {
  return client.from("oando_plans");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function rowAsLegacyProject(row: OandoPlanRow): Record<string, unknown> {
  const payload = isRecord(row.payload) ? row.payload : {};
  return {
    ...payload,
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    status: row.status,
    thumbnail_url: row.thumbnail_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function stateFromRow(row: OandoPlanRow): PlannerProjectAtomicStateV1 {
  const payload = isRecord(row.payload) ? row.payload : {};
  const container = payload.plannerRepositoryState;
  if (isRecord(container) && container.stateVersion === 1) {
    const receipts = Array.isArray(container.receipts)
      ? (container.receipts as PlannerIdempotencyReceiptV1[])
      : [];
    if (container.project === null) return { project: null, receipts };
    const read = readPlannerProjectEnvelope(container.project, { ownerId: row.user_id });
    if (!read.ok) throw new PlannerSupabaseCompatibilityError(read.code, read.message);
    return { project: read.value, receipts };
  }
  const read = readPlannerProjectEnvelope(rowAsLegacyProject(row), { ownerId: row.user_id });
  if (!read.ok) throw new PlannerSupabaseCompatibilityError(read.code, read.message);
  return { project: read.value, receipts: [] };
}

function projectSourceFromRow(row: OandoPlanRow): unknown | null {
  const payload = isRecord(row.payload) ? row.payload : {};
  const container = payload.plannerRepositoryState;
  if (isRecord(container) && container.stateVersion === 1) {
    return stateFromRow(row).project;
  }
  return rowAsLegacyProject(row);
}

function payloadFromState(state: PlannerProjectAtomicStateV1): Json {
  const payload: SupabasePlannerAtomicPayloadV1 = {
    plannerRepositoryState: {
      stateVersion: 1,
      project: state.project,
      receipts: state.receipts,
    },
  };
  return payload as unknown as Json;
}

function rowValues(
  ownerId: string,
  projectId: string,
  state: PlannerProjectAtomicStateV1,
  previousRow: OandoPlanRow | null,
): Omit<OandoPlanRow, "engine"> & { engine: "ooplanner" } {
  const project = state.project;
  const deletedAt = new Date().toISOString();
  return {
    id: projectId,
    user_id: ownerId,
    name: project?.name ?? "Deleted Planner project",
    engine: "ooplanner",
    payload: payloadFromState(state),
    thumbnail_url: project?.thumbnailUrl ?? null,
    status: project?.status ?? "archived",
    created_at: project?.createdAt ?? previousRow?.created_at ?? deletedAt,
    updated_at: project?.updatedAt ?? deletedAt,
  };
}

async function loadOwnedRow(ownerId: string, projectId: string): Promise<OandoPlanRow | null> {
  const client = createSupabaseAuthAdminClient();
  const { data, error } = await plansTable(client)
    .select("*")
    .eq("id", projectId)
    .eq("user_id", ownerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OandoPlanRow | null) ?? null;
}

async function commitTransition(
  ownerId: string,
  command: PlannerProjectMutationCommandV1,
  row: OandoPlanRow | null,
  transition: PlannerProjectMutationTransitionV1,
): Promise<PlannerProjectMutationTransitionV1> {
  if (transition.effect === "none") return transition;
  await ensurePlannerProfile(ownerId);
  const values = rowValues(ownerId, command.projectId, transition.state, row);
  const client = createSupabaseAuthAdminClient();
  if (!row) {
    const { error } = await plansTable(client).insert(values);
    if (error) {
      if (error.code === "23505") {
        return {
          state: { project: null, receipts: [] },
          result: { ok: false, code: "CONFLICT", message: "Project was created concurrently" },
          effect: "none",
        };
      }
      throw new Error(error.message);
    }
    return transition;
  }

  const { data, error } = await plansTable(client)
    .update(values)
    .eq("id", command.projectId)
    .eq("user_id", ownerId)
    .eq("updated_at", row.updated_at)
    .select("id");
  if (error) throw new Error(error.message);
  if (!Array.isArray(data) || data.length !== 1) {
    const latest = await loadOwnedRow(ownerId, command.projectId);
    const currentRevision = latest ? stateFromRow(latest).project?.revision : undefined;
    return {
      state: latest ? stateFromRow(latest) : { project: null, receipts: [] },
      result: {
        ok: false,
        code: "CONFLICT",
        message: "Project changed concurrently",
        ...(currentRevision === undefined ? {} : { currentRevision }),
      },
      effect: "none",
    };
  }
  return transition;
}

export const plannerProjectSupabaseAdapter: PlannerProjectAtomicAdapterV1 = {
  mode: "supabase",
  async list(ownerId) {
    const client = createSupabaseAuthAdminClient();
    const { data, error } = await plansTable(client)
      .select("*")
      .eq("user_id", ownerId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const projects: unknown[] = [];
    for (const row of (data as OandoPlanRow[] | null) ?? []) {
      const source = projectSourceFromRow(row);
      if (source) projects.push(source);
    }
    return projects;
  },
  async load(ownerId, projectId) {
    const row = await loadOwnedRow(ownerId, projectId);
    if (!row) return null;
    return projectSourceFromRow(row);
  },
  async mutate(context, command) {
    const row = await loadOwnedRow(context.ownerId, command.projectId);
    let state: PlannerProjectAtomicStateV1;
    try {
      state = row ? stateFromRow(row) : { project: null, receipts: [] };
    } catch (error) {
      if (error instanceof PlannerSupabaseCompatibilityError) {
        return {
          state: { project: null, receipts: [] },
          result: { ok: false, code: error.code, message: error.message },
          effect: "none",
        };
      }
      throw error;
    }
    const transition = applyPlannerProjectMutation(
      state,
      context,
      command,
      new Date().toISOString(),
    );
    return commitTransition(context.ownerId, command, row, transition);
  },
};
