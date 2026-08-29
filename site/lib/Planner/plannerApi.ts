/**
 * Floor Planner API client. Talks only to `/api/Planner/*` (plus the neutral
 * `/api/exports`) — never to a Studio route.
 *
 * Member load/save must work without DEV_AUTH_BYPASS: use browserApiFetch so
 * requests send session cookies, attach CSRF on mutations, and honor
 * trailingSlash: true (POST redirect would drop the body).
 */
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import type { SketchPlanObject, SketchRecoveryReason, SketchToPlanRequest } from "@planner/lib/ai/sketchToPlanShared";
import type { PlannerHandoffRequest } from "@planner/lib/handoff/handoffSchema";
import { readPlannerEndpointSuccess } from "@planner/lib/plannerEndpointContract";
import type { FurnitureItem, PlannerProject } from "@planner/lib/plannerTypes";

const PLANNER_API_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR" as const,
  INVALID_INPUT: "INVALID_INPUT" as const,
  INVALID_REQUEST: "INVALID_REQUEST" as const,
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD" as const,
  AUTH_REQUIRED: "AUTH_REQUIRED" as const,
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS" as const,
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS" as const,
  OWNER_SCOPE_REJECTED: "OWNER_SCOPE_REJECTED" as const,
  CSRF_FAILED: "CSRF_FAILED" as const,
  CSRF_REJECTED: "CSRF_REJECTED" as const,
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND" as const,
  NOT_FOUND: "NOT_FOUND" as const,
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED" as const,
  RATE_LIMITED: "RATE_LIMITED" as const,
  REVISION_CONFLICT: "REVISION_CONFLICT" as const,
  OFFLINE: "OFFLINE" as const,
  INTERNAL_ERROR: "INTERNAL_ERROR" as const,
  DATABASE_ERROR: "DATABASE_ERROR" as const,
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE" as const,
};

export type PlannerApiErrorCode =
  (typeof PLANNER_API_ERROR_CODES)[keyof typeof PLANNER_API_ERROR_CODES];

export class PlannerApiError extends Error {
  readonly status: number;
  readonly code: PlannerApiErrorCode;
  readonly detail: string | undefined;
  readonly correlationId: string | undefined;
  readonly currentRevision: number | undefined;
  readonly retryAfterSeconds: number | undefined;
  readonly recovery: "reauthenticate-preserve-unsaved" | undefined;

  constructor(
    status: number,
    code: PlannerApiErrorCode,
    message: string,
    options: {
      detail?: string;
      correlationId?: string;
      currentRevision?: number;
      retryAfterSeconds?: number;
      recovery?: "reauthenticate-preserve-unsaved";
    } = {},
  ) {
    super(message);
    this.name = "PlannerApiError";
    this.status = status;
    this.code = code;
    this.detail = options.detail;
    this.correlationId = options.correlationId;
    this.currentRevision = options.currentRevision;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.recovery = options.recovery;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isConflict(): boolean {
    return this.status === 409 || this.code === "REVISION_CONFLICT";
  }

  get isOffline(): boolean {
    return this.code === "OFFLINE";
  }

  get isTransient(): boolean {
    return this.isOffline || this.status === 429 || this.status >= 500;
  }
}

export function isAbortError(err: unknown): err is DOMException {
  return err instanceof DOMException && err.name === "AbortError";
}

function statusErrorCode(status: number): PlannerApiErrorCode {
  switch (status) {
    case 400:
      return PLANNER_API_ERROR_CODES.INVALID_INPUT;
    case 401:
      return PLANNER_API_ERROR_CODES.AUTH_REQUIRED;
    case 403:
      return PLANNER_API_ERROR_CODES.INSUFFICIENT_PERMISSIONS;
    case 404:
      return PLANNER_API_ERROR_CODES.RESOURCE_NOT_FOUND;
    case 409:
      return PLANNER_API_ERROR_CODES.REVISION_CONFLICT;
    case 429:
      return PLANNER_API_ERROR_CODES.RATE_LIMITED;
    case 503:
      return PLANNER_API_ERROR_CODES.SERVICE_UNAVAILABLE;
    default:
      return PLANNER_API_ERROR_CODES.INTERNAL_ERROR;
  }
}

function isPlannerApiErrorCode(value: string): value is PlannerApiErrorCode {
  return Object.values(PLANNER_API_ERROR_CODES).some((code) => code === value);
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    let code = statusErrorCode(res.status);
    let correlationId = res.headers.get("x-correlation-id") ?? undefined;
    let currentRevision: number | undefined;
    let retryAfterSeconds: number | undefined;
    let recovery: "reauthenticate-preserve-unsaved" | undefined;

    try {
      const body = (await res.json()) as {
        correlationId?: string;
        detail?: string;
        error?: {
          code?: string;
          currentRevision?: number;
          message?: string;
          recovery?: string;
          retryAfterSeconds?: number;
        } | string;
        message?: string;
      };
      if (typeof body.detail === "string" && body.detail) {
        detail = body.detail;
      } else if (typeof body.message === "string" && body.message) {
        detail = body.message;
      } else if (typeof body.error === "string" && body.error) {
        detail = body.error;
      } else if (
        body.error &&
        typeof body.error === "object" &&
        typeof body.error.message === "string" &&
        body.error.message
      ) {
        detail = body.error.message;
      }
      if (body.error && typeof body.error === "object") {
        if (typeof body.error.code === "string" && isPlannerApiErrorCode(body.error.code)) {
          code = body.error.code;
        }
        if (Number.isSafeInteger(body.error.currentRevision)) {
          currentRevision = body.error.currentRevision;
        }
        if (Number.isSafeInteger(body.error.retryAfterSeconds)) {
          retryAfterSeconds = body.error.retryAfterSeconds;
        }
        if (body.error.recovery === "reauthenticate-preserve-unsaved") {
          recovery = body.error.recovery;
        }
      }
      if (typeof body.correlationId === "string" && body.correlationId) {
        correlationId = body.correlationId;
      }
    } catch {
      // Non-JSON errors retain the status-derived safe classification.
    }
    throw new PlannerApiError(res.status, code, detail, {
      detail,
      correlationId,
      currentRevision,
      retryAfterSeconds,
      recovery,
    });
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const payload: unknown = await res.json();
  return readPlannerEndpointSuccess<T>(payload);
}

function jsonInit(method: string, payload?: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  };
}

async function plannerFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await browserApiFetch(path, init);
  } catch (error: unknown) {
    if (isAbortError(error)) throw error;
    throw new PlannerApiError(0, PLANNER_API_ERROR_CODES.OFFLINE, "No network connection", {
      detail: "Your work is still available in this browser. Reconnect and try again.",
    });
  }
}

export interface PlannerMutationOptions {
  expectedRevision: number;
  idempotencyKey: string;
}

export function createPlannerIdempotencyKey(operation: string, projectId: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${operation}-${projectId}-${random}`.replace(/[^A-Za-z0-9._~-]/g, "-").slice(0, 120);
}

function mutationPayload(payload: unknown, options?: PlannerMutationOptions): unknown {
  if (!options || !payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  return {
    ...(payload as Record<string, unknown>),
    expectedRevision: options.expectedRevision,
    idempotencyKey: options.idempotencyKey,
  };
}

/** Catalog the Planner places on plans — listing is read-only. */
export const listFurniture = async (
  params: Record<string, string> = {},
): Promise<FurnitureItem[]> => {
  const qs = new URLSearchParams(params).toString();
  const path = qs
    ? `/api/Planner/catalog?${qs}`
    : "/api/Planner/catalog";
  const response = await plannerFetch(path);
  return readJson<FurnitureItem[]>(response);
};

/** Planner-side custom furniture upload. */
export async function uploadFurniture(formData: FormData): Promise<FurnitureItem> {
  const response = await plannerFetch(apiPath("/api/Planner/catalog/upload"), {
    method: "POST",
    body: formData,
  });
  return readJson<FurnitureItem>(response);
}

export interface GetProjectOptions {
  signal?: AbortSignal;
}

export async function listProjects(
  options?: GetProjectOptions,
): Promise<PlannerProject[]> {
  const response = await plannerFetch("/api/Planner/projects", {
    signal: options?.signal,
  });
  return readJson<PlannerProject[]>(response);
}

export async function getProject(
  id: string,
  options?: GetProjectOptions,
): Promise<PlannerProject> {
  const response = await plannerFetch(
    `/api/Planner/projects/${encodeURIComponent(id)}`,
    { signal: options?.signal },
  );
  return readJson<PlannerProject>(response);
}

export async function createProject(
  payload: unknown,
  options?: PlannerMutationOptions,
): Promise<PlannerProject> {
  const response = await plannerFetch(
    "/api/Planner/projects",
    jsonInit("POST", mutationPayload(payload, options)),
  );
  return readJson<PlannerProject>(response);
}

export async function updateProject(
  id: string,
  payload: unknown,
  options?: PlannerMutationOptions,
): Promise<PlannerProject> {
  const response = await plannerFetch(
    `/api/Planner/projects/${encodeURIComponent(id)}`,
    jsonInit("PATCH", mutationPayload(payload, options)),
  );
  return readJson<PlannerProject>(response);
}

export async function deleteProject(
  id: string,
  options?: PlannerMutationOptions,
): Promise<{ ok: boolean }> {
  const response = await plannerFetch(
    `/api/Planner/projects/${encodeURIComponent(id)}`,
    jsonInit("DELETE", options),
  );
  return readJson<{ ok: boolean }>(response);
}

export interface PlannerHandoffResponse {
  referenceId: string;
  createdAt: string;
  idempotentReplay: boolean;
  message: string;
}

/** Version-compatible adapter for the guest handoff endpoint. */
export async function submitPlannerHandoff(
  payload: PlannerHandoffRequest,
): Promise<PlannerHandoffResponse> {
  const response = await plannerFetch(
    apiPath("/api/Planner/handoff"),
    jsonInit("POST", payload),
  );
  return readJson<PlannerHandoffResponse>(response);
}

export type PlannerSketchToPlanResponse =
  | {
      status: "preview";
      fileName: string;
      objects: SketchPlanObject[];
      warnings: string[];
    }
  | {
      status: "fallback";
      fileName: string;
      reason: SketchRecoveryReason;
      message: string;
    };

/** Version-compatible adapter for preview and recoverable fallback outcomes. */
export async function convertSketchToPlan(
  payload: SketchToPlanRequest,
): Promise<PlannerSketchToPlanResponse> {
  const response = await plannerFetch(
    apiPath("/api/Planner/sketch-to-plan"),
    jsonInit("POST", payload),
  );
  return readJson<PlannerSketchToPlanResponse>(response);
}

export async function createExport(payload: {
  format?: string;
  data_url: string;
  name?: string;
}): Promise<unknown> {
  const response = await plannerFetch(
    "/api/exports",
    jsonInit("POST", payload),
  );
  return readJson(response);
}

export const fileUrl = (path: string | null | undefined) => (path ? path : null);
