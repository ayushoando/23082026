import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { assertDevDiskWritable } from "@/lib/persistence/assertDevDiskWritable";
import {
  applyPlannerProjectMutation,
  type PlannerIdempotencyReceiptV1,
  type PlannerProjectAtomicAdapterV1,
  type PlannerProjectAtomicStateV1,
  type PlannerProjectMutationTransitionV1,
} from "@planner/lib/plannerProjectOperations";
import {
  isValidPlannerProjectId,
  readPlannerProjectEnvelope,
} from "@planner/lib/plannerProjectRepository";
import {
  PROJECTS_DIR,
  ensureStorageDirs,
  listProjectsFromDisk,
  loadProject,
} from "@planner/server/plannerStore";

const STATE_SUFFIX = ".planner-state.json";
const LOCK_SUFFIX = ".planner-state.lock";
const LOCK_ATTEMPTS = 100;
const LOCK_RETRY_MS = 10;

interface PersistedPlannerAtomicStateV1 {
  stateVersion: 1;
  project: PlannerProjectAtomicStateV1["project"];
  receipts: readonly PlannerIdempotencyReceiptV1[];
}

interface PersistedPlannerAtomicSourceV1 {
  stateVersion: 1;
  project: unknown | null;
  receipts: readonly PlannerIdempotencyReceiptV1[];
}

class PlannerDiskCompatibilityError extends Error {
  readonly code: "INVALID_PROJECT" | "UNSUPPORTED_SCHEMA_VERSION" | "UNSUPPORTED_GEOMETRY";

  constructor(
    code: "INVALID_PROJECT" | "UNSUPPORTED_SCHEMA_VERSION" | "UNSUPPORTED_GEOMETRY",
    message: string,
  ) {
    super(message);
    this.name = "PlannerDiskCompatibilityError";
    this.code = code;
  }
}

function statePath(projectId: string): string {
  if (!isValidPlannerProjectId(projectId)) throw new Error("Invalid Planner project id");
  return path.join(PROJECTS_DIR, `${projectId}${STATE_SUFFIX}`);
}

function lockPath(projectId: string): string {
  if (!isValidPlannerProjectId(projectId)) throw new Error("Invalid Planner project id");
  return path.join(PROJECTS_DIR, `${projectId}${LOCK_SUFFIX}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readReceipts(value: unknown): readonly PlannerIdempotencyReceiptV1[] {
  if (!Array.isArray(value)) throw new Error("Invalid Planner receipt state");
  for (const receipt of value) {
    if (
      !isRecord(receipt) ||
      typeof receipt.ownerId !== "string" ||
      (receipt.operation !== "create" && receipt.operation !== "save" && receipt.operation !== "delete") ||
      typeof receipt.projectId !== "string" ||
      typeof receipt.key !== "string" ||
      typeof receipt.fingerprint !== "string" ||
      !isRecord(receipt.result) ||
      typeof receipt.result.ok !== "boolean"
    ) {
      throw new Error("Invalid Planner idempotency receipt");
    }
  }
  return value as PlannerIdempotencyReceiptV1[];
}

async function readPersistedStateSource(
  projectId: string,
): Promise<PersistedPlannerAtomicSourceV1 | undefined> {
  try {
    const source: unknown = JSON.parse(await fs.readFile(statePath(projectId), "utf8"));
    if (!isRecord(source) || source.stateVersion !== 1) {
      throw new Error("Unsupported Planner disk state version");
    }
    return {
      stateVersion: 1,
      project: source.project === null ? null : source.project,
      receipts: readReceipts(source.receipts),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function readPersistedState(
  projectId: string,
  ownerId: string,
): Promise<PlannerProjectAtomicStateV1 | undefined> {
  const persisted = await readPersistedStateSource(projectId);
  if (!persisted) return undefined;
  let project: PlannerProjectAtomicStateV1["project"] = null;
  if (persisted.project !== null) {
    const read = readPlannerProjectEnvelope(persisted.project, { ownerId });
    if (!read.ok) throw new PlannerDiskCompatibilityError(read.code, read.message);
    project = read.value;
  }
  return { project, receipts: persisted.receipts };
}

async function readInitialState(
  projectId: string,
  ownerId: string,
): Promise<PlannerProjectAtomicStateV1> {
  const persisted = await readPersistedState(projectId, ownerId);
  if (persisted) return persisted;
  const legacy = await loadProject(projectId, { ignoreAtomicState: true });
  if (!legacy) return { project: null, receipts: [] };
  const read = readPlannerProjectEnvelope(legacy, { ownerId });
  if (!read.ok) throw new PlannerDiskCompatibilityError(read.code, read.message);
  return { project: read.value, receipts: [] };
}

async function writeAtomicState(
  projectId: string,
  state: PlannerProjectAtomicStateV1,
): Promise<void> {
  assertDevDiskWritable();
  await ensureStorageDirs();
  const destination = statePath(projectId);
  const temporary = `${destination}.${process.pid}.${crypto.randomUUID()}.tmp`;
  const persisted: PersistedPlannerAtomicStateV1 = {
    stateVersion: 1,
    project: state.project,
    receipts: state.receipts,
  };
  const handle = await fs.open(temporary, "wx");
  try {
    await handle.writeFile(JSON.stringify(persisted, null, 2), "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await fs.rename(temporary, destination);
  } catch (error) {
    await fs.rm(temporary, { force: true });
    throw error;
  }
}

async function withProjectLock<T>(projectId: string, operation: () => Promise<T>): Promise<T> {
  assertDevDiskWritable();
  await ensureStorageDirs();
  const lock = lockPath(projectId);
  for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt += 1) {
    try {
      const handle = await fs.open(lock, "wx");
      try {
        return await operation();
      } finally {
        await handle.close();
        await fs.rm(lock, { force: true });
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (attempt === LOCK_ATTEMPTS - 1) {
        throw new Error("Timed out acquiring Planner project lock");
      }
      await delay(LOCK_RETRY_MS);
    }
  }
  throw new Error("Planner project lock unavailable");
}

async function stateProjectIds(): Promise<Set<string>> {
  await ensureStorageDirs();
  const entries = await fs.readdir(PROJECTS_DIR);
  return new Set(
    entries
      .filter((name) => name.endsWith(STATE_SUFFIX))
      .map((name) => name.slice(0, -STATE_SUFFIX.length)),
  );
}

function persistedOwnerId(source: unknown): string | undefined {
  if (!isRecord(source)) return undefined;
  const owner = source.ownerId ?? source.owner_id ?? source.user_id;
  return typeof owner === "string" && owner.trim() ? owner.trim() : undefined;
}

/**
 * Normalize supported/known-old disk records before returning them. An
 * unsupported version is returned unchanged so the repository facade can
 * produce an explicit compatibility result; no adapter write is attempted.
 * Records belonging to another owner remain non-disclosing in list/load.
 */
function diskProjectForRead(source: unknown, ownerId: string): unknown | null {
  const persistedOwner = persistedOwnerId(source);
  if (persistedOwner && persistedOwner !== ownerId) return null;
  const read = readPlannerProjectEnvelope(source, { ownerId });
  if (read.ok) return read.value;
  if (read.code === "UNSUPPORTED_SCHEMA_VERSION" || read.code === "UNSUPPORTED_GEOMETRY") {
    return source;
  }
  return null;
}

export const plannerProjectDiskAdapter: PlannerProjectAtomicAdapterV1 = {
  mode: "disk",
  async list(ownerId) {
    const stateIds = await stateProjectIds();
    const projects: unknown[] = [];
    for (const projectId of stateIds) {
      const persisted = await readPersistedStateSource(projectId);
      if (!persisted || persisted.project === null) continue;
      const project = diskProjectForRead(persisted.project, ownerId);
      if (project !== null) projects.push(project);
    }
    const legacy = await listProjectsFromDisk({ ignoreAtomicState: true });
    for (const source of legacy) {
      const id = typeof source.id === "string" ? source.id : "";
      if (stateIds.has(id)) continue;
      const project = diskProjectForRead(source, ownerId);
      if (project !== null) projects.push(project);
    }
    return projects;
  },
  async load(ownerId, projectId) {
    const persisted = await readPersistedStateSource(projectId);
    if (persisted) {
      return persisted.project === null
        ? null
        : diskProjectForRead(persisted.project, ownerId);
    }
    const legacy = await loadProject(projectId, { ignoreAtomicState: true });
    return legacy ? diskProjectForRead(legacy, ownerId) : null;
  },
  async mutate(context, command) {
    return withProjectLock(command.projectId, async (): Promise<PlannerProjectMutationTransitionV1> => {
      let state: PlannerProjectAtomicStateV1;
      try {
        state = await readInitialState(command.projectId, context.ownerId);
      } catch (error) {
        if (error instanceof PlannerDiskCompatibilityError) {
          return {
            state: { project: null, receipts: [] },
            result: { ok: false, code: error.code, message: error.message },
            effect: "none",
          };
        }
        throw error;
      }
      const transition = applyPlannerProjectMutation(state, context, command, new Date().toISOString());
      if (transition.state !== state) await writeAtomicState(command.projectId, transition.state);
      return transition;
    });
  },
};
