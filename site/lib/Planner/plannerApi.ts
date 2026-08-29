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
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD" as const,
  AUTH_REQUIRED: "AUTH_REQUIRED" as const,
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS" as const,
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS" as const,
  CSRF_FAILED: "CSRF_FAILED" as const,
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND" as const,
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED" as const,
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

  constructor(status: number, code: PlannerApiErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "PlannerApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
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

  get isTransient(): boolean {
    return this.status === 429 || this.status >= 500;
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
    case 429:
      return PLANNER_API_ERROR_CODES.RATE_LIMIT_EXCEEDED;
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

    try {
      const body = (await res.json()) as {
        detail?: string;
        error?: { code?: string; message?: string } | string;
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
      if (
        body.error &&
        typeof body.error === "object" &&
        typeof body.error.code === "string" &&
        isPlannerApiErrorCode(body.error.code)
      ) {
        code = body.error.code;
      }
    } catch {
      // Non-JSON errors retain the status-derived safe classification.
    }
    throw new PlannerApiError(res.status, code, detail, detail);
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

/** Catalog the Planner places on plans — listing is read-only. */
export const listFurniture = async (
  params: Record<string, string> = {},
): Promise<FurnitureItem[]> => {
  const qs = new URLSearchParams(params).toString();
  const path = qs
    ? `/api/Planner/catalog?${qs}`
    : "/api/Planner/catalog";
  const response = await browserApiFetch(path);
  return readJson<FurnitureItem[]>(response);
};

/** Planner-side custom furniture upload. */
export async function uploadFurniture(formData: FormData): Promise<FurnitureItem> {
  const response = await browserApiFetch(apiPath("/api/Planner/catalog/upload"), {
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
  const response = await browserApiFetch("/api/Planner/projects", {
    signal: options?.signal,
  });
  return readJson<PlannerProject[]>(response);
}

export async function getProject(
  id: string,
  options?: GetProjectOptions,
): Promise<PlannerProject> {
  const response = await browserApiFetch(
    `/api/Planner/projects/${encodeURIComponent(id)}`,
    { signal: options?.signal },
  );
  return readJson<PlannerProject>(response);
}

export async function createProject(payload: unknown): Promise<PlannerProject> {
  const response = await browserApiFetch(
    "/api/Planner/projects",
    jsonInit("POST", payload),
  );
  return readJson<PlannerProject>(response);
}

export async function updateProject(
  id: string,
  payload: unknown,
): Promise<PlannerProject> {
  const response = await browserApiFetch(
    `/api/Planner/projects/${encodeURIComponent(id)}`,
    jsonInit("PATCH", payload),
  );
  return readJson<PlannerProject>(response);
}

export async function deleteProject(id: string): Promise<{ ok: boolean }> {
  const response = await browserApiFetch(
    `/api/Planner/projects/${encodeURIComponent(id)}`,
    { method: "DELETE" },
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
  const response = await browserApiFetch(
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
  const response = await browserApiFetch(
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
  const response = await browserApiFetch(
    "/api/exports",
    jsonInit("POST", payload),
  );
  return readJson(response);
}

export const fileUrl = (path: string | null | undefined) => (path ? path : null);
