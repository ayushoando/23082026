/**
 * Floor Planner API client. Talks only to `/api/Planner/*` (plus the neutral
 * `/api/exports`) — never to a Studio route.
 *
 * Member load/save must work without DEV_AUTH_BYPASS: use browserApiFetch so
 * requests send session cookies, attach CSRF on mutations, and honor
 * trailingSlash: true (POST redirect would drop the body).
 */
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import type { FurnitureItem, PlannerProject } from "@planner/lib/plannerTypes";

// Mirror the server-side error code taxonomy for consistent classification.
// Reuses API_ERROR_CODES values without importing the server-only ApiError class.
const PLANNER_API_ERROR_CODES = {
  // 400 Bad Request
  VALIDATION_ERROR: "VALIDATION_ERROR" as const,
  INVALID_INPUT: "INVALID_INPUT" as const,
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD" as const,

  // 401 Unauthorized
  AUTH_REQUIRED: "AUTH_REQUIRED" as const,
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS" as const,

  // 403 Forbidden
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS" as const,
  CSRF_FAILED: "CSRF_FAILED" as const,

  // 404 Not Found
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND" as const,

  // 429 Too Many Requests
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED" as const,

  // 500 Internal Server Error
  INTERNAL_ERROR: "INTERNAL_ERROR" as const,
  DATABASE_ERROR: "DATABASE_ERROR" as const,
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE" as const,
};

export type PlannerApiErrorCode =
  (typeof PLANNER_API_ERROR_CODES)[keyof typeof PLANNER_API_ERROR_CODES];

/* ------------------------------------------------------------------ */
/* Typed API error                                                     */
/* ------------------------------------------------------------------ */

/**
 * Typed error thrown for non-OK Planner API responses.
 * Carries the HTTP status, error code, and optional detail text so callers can
 * classify 401 vs 404 vs transient (429/5xx/network) without parsing the message string.
 *
 * The `message` property preserves backward-compatible text for existing callers
 * that check `e.message.includes("404")` etc.
 */
export class PlannerApiError extends Error {
  /** HTTP status code from the response (e.g. 404, 429, 503). */
  readonly status: number;
  /** Stable machine-readable error code (mirrors server-side API_ERROR_CODES). */
  readonly code: PlannerApiErrorCode;
  /** Safe detail string extracted from the response body, if available. */
  readonly detail: string | undefined;

  constructor(status: number, code: PlannerApiErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "PlannerApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }

  /** True when the response was an explicit not-found (status 404). */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * True when the session is missing entirely (401). Distinct from
   * `isForbidden` — the recovery action is sign-in, not retry. This is the
   * one failure mode a persisted audit artifact actually recorded for
   * `/ooplanner/projects/[id]` (see plans/ref/remediation-unified/audit.md D7).
   */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /**
   * True when the session exists but lacks permission for this project
   * (403). Not retryable — the same request will not succeed later. The
   * `[id]` route currently masks a foreign project as 404 rather than 403,
   * so this is reachable only via other `withAuth` role checks.
   */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** True when the failure is likely transient and retryable (429, 5xx). */
  get isTransient(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

/**
 * Type guard: returns true when the error is a fetch AbortError (request
 * was cancelled via AbortSignal). Callers should treat this as a silent
 * cancellation, not a visible project failure.
 */
export function isAbortError(err: unknown): err is DOMException {
  return (
    err instanceof DOMException && err.name === "AbortError"
  );
}

/* ------------------------------------------------------------------ */
/* Response helpers                                                     */
/* ------------------------------------------------------------------ */

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    let code: PlannerApiErrorCode = PLANNER_API_ERROR_CODES.INTERNAL_ERROR;
    
    try {
      const body = (await res.json()) as {
        detail?: string;
        error?: { code?: string; message?: string } | string;
        message?: string;
      };
      
      // Extract detail/message from response body
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
      
      // Extract error code if present in the response
      if (
        body.error &&
        typeof body.error === "object" &&
        typeof body.error.code === "string" &&
        body.error.code
      ) {
        // Map the server code to our mirrored codes
        const serverCode = body.error.code as PlannerApiErrorCode;
        if (Object.values(PLANNER_API_ERROR_CODES).includes(serverCode)) {
          code = serverCode;
        }
      }
      
      // Fallback code mapping based on HTTP status
      if (!body.error || typeof body.error !== "object" || !body.error.code) {
        switch (res.status) {
          case 400:
            code = PLANNER_API_ERROR_CODES.INVALID_INPUT;
            break;
          case 401:
            code = PLANNER_API_ERROR_CODES.AUTH_REQUIRED;
            break;
          case 403:
            code = PLANNER_API_ERROR_CODES.INSUFFICIENT_PERMISSIONS;
            break;
          case 404:
            code = PLANNER_API_ERROR_CODES.RESOURCE_NOT_FOUND;
            break;
          case 429:
            code = PLANNER_API_ERROR_CODES.RATE_LIMIT_EXCEEDED;
            break;
          case 503:
            code = PLANNER_API_ERROR_CODES.SERVICE_UNAVAILABLE;
            break;
          default:
            code = PLANNER_API_ERROR_CODES.INTERNAL_ERROR;
        }
      }
    } catch {
      /* non-JSON error body */
      // Set code based on status for non-JSON responses
      switch (res.status) {
        case 401:
          code = PLANNER_API_ERROR_CODES.AUTH_REQUIRED;
          break;
        case 404:
          code = PLANNER_API_ERROR_CODES.RESOURCE_NOT_FOUND;
          break;
        case 429:
          code = PLANNER_API_ERROR_CODES.RATE_LIMIT_EXCEEDED;
          break;
        case 503:
          code = PLANNER_API_ERROR_CODES.SERVICE_UNAVAILABLE;
          break;
      }
    }
    throw new PlannerApiError(res.status, code, detail, detail);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

function jsonInit(method: string, payload?: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  };
}

/** Catalog the Planner places on plans — listing is read-only. */
export const listFurniture = (
  params: Record<string, string> = {},
): Promise<FurnitureItem[]> => {
  const qs = new URLSearchParams(params).toString();
  const path = qs
    ? `/api/Planner/catalog?${qs}`
    : "/api/Planner/catalog";
  return browserApiFetch(path).then((r) => readJson<FurnitureItem[]>(r));
};

/** Planner-side custom furniture upload. */
export const uploadFurniture = (formData: FormData): Promise<FurnitureItem> =>
  browserApiFetch(apiPath("/api/Planner/catalog/upload"), {
    method: "POST",
    body: formData,
  }).then((r) => readJson<FurnitureItem>(r));

/* ------------------------------------------------------------------ */
/* Optional GET request options                                        */
/* ------------------------------------------------------------------ */

/**
 * Options accepted by read-only Planner API helpers (`getProject`,
 * `listProjects`). Passing no options preserves existing call-site behavior.
 */
export interface GetProjectOptions {
  /** AbortSignal forwarded to the underlying fetch for cancellation support. */
  signal?: AbortSignal;
}

export const listProjects = (
  options?: GetProjectOptions,
): Promise<PlannerProject[]> =>
  browserApiFetch("/api/Planner/projects", {
    signal: options?.signal,
  }).then((r) => readJson<PlannerProject[]>(r));

export const getProject = (
  id: string,
  options?: GetProjectOptions,
): Promise<PlannerProject> =>
  browserApiFetch(`/api/Planner/projects/${encodeURIComponent(id)}`, {
    signal: options?.signal,
  }).then((r) => readJson<PlannerProject>(r));

export const createProject = (payload: unknown): Promise<PlannerProject> =>
  browserApiFetch("/api/Planner/projects", jsonInit("POST", payload)).then((r) =>
    readJson<PlannerProject>(r),
  );

export const updateProject = (
  id: string,
  payload: unknown,
): Promise<PlannerProject> =>
  browserApiFetch(
    `/api/Planner/projects/${encodeURIComponent(id)}`,
    jsonInit("PATCH", payload),
  ).then((r) => readJson<PlannerProject>(r));

export const deleteProject = (id: string): Promise<{ ok: boolean }> =>
  browserApiFetch(`/api/Planner/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).then((r) => readJson<{ ok: boolean }>(r));

export const createExport = (payload: {
  format?: string;
  data_url: string;
  name?: string;
}): Promise<unknown> =>
  browserApiFetch("/api/exports", jsonInit("POST", payload)).then((r) =>
    readJson(r),
  );

export const fileUrl = (path: string | null | undefined) => (path ? path : null);
