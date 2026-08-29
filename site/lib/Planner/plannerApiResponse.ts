import {
  PLANNER_ENDPOINT_CONTRACT_HEADER,
  PLANNER_ENDPOINT_CONTRACT_VERSION,
} from "@planner/lib/plannerEndpointContract";

export const PLANNER_CORRELATION_HEADER = "x-correlation-id" as const;
export const PLANNER_CORRELATION_ID_MAX_LENGTH = 64;

const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._~-]{8,64}$/;

export type PlannerApiErrorCode =
  | "AUTH_REQUIRED"
  | "CSRF_REJECTED"
  | "INTERNAL_ERROR"
  | "INVALID_REQUEST"
  | "METHOD_NOT_ALLOWED"
  | "NOT_FOUND"
  | "ORIGIN_REJECTED"
  | "OWNER_SCOPE_REJECTED"
  | "RATE_LIMITED"
  | "REVISION_CONFLICT"
  | "SERVICE_UNAVAILABLE";

export interface PlannerApiIssue {
  readonly path: string;
  readonly message: string;
}

export interface PlannerSafeErrorMetadata {
  readonly issues?: readonly PlannerApiIssue[];
  readonly retryAfterSeconds?: number;
  readonly currentRevision?: number;
  readonly recovery?: "reauthenticate-preserve-unsaved";
}

export interface PlannerApiFailure {
  readonly success: false;
  readonly error: {
    readonly code: PlannerApiErrorCode;
    readonly message: string;
    readonly issues?: readonly PlannerApiIssue[];
    readonly retryAfterSeconds?: number;
    readonly currentRevision?: number;
    readonly recovery?: "reauthenticate-preserve-unsaved";
  };
  readonly correlationId: string;
}

export interface PlannerApiSuccess<T> {
  readonly success: true;
  readonly contractVersion: typeof PLANNER_ENDPOINT_CONTRACT_VERSION;
  readonly data: T;
  readonly correlationId: string;
}

const SAFE_MESSAGES: Readonly<Record<PlannerApiErrorCode, string>> = {
  AUTH_REQUIRED: "Authentication required",
  CSRF_REJECTED: "Request verification failed",
  INTERNAL_ERROR: "The request could not be completed",
  INVALID_REQUEST: "Request validation failed",
  METHOD_NOT_ALLOWED: "Method not allowed",
  NOT_FOUND: "Resource not found",
  ORIGIN_REJECTED: "Request origin rejected",
  OWNER_SCOPE_REJECTED: "Resource not found",
  RATE_LIMITED: "Too many requests",
  REVISION_CONFLICT: "The resource has changed",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
};

// ---------------------------------------------------------------------------
// Stable error codes — Requirements 11.8, 11.9
// ---------------------------------------------------------------------------

/** All allowed error codes. Anything else is mapped to INTERNAL_ERROR. */
export const PLANNER_STABLE_ERROR_CODES = new Set<PlannerApiErrorCode>([
  "AUTH_REQUIRED",
  "CSRF_REJECTED",
  "INTERNAL_ERROR",
  "INVALID_REQUEST",
  "METHOD_NOT_ALLOWED",
  "NOT_FOUND",
  "ORIGIN_REJECTED",
  "OWNER_SCOPE_REJECTED",
  "RATE_LIMITED",
  "REVISION_CONFLICT",
  "SERVICE_UNAVAILABLE",
]);

/**
 * Patterns that must never appear in any client-visible response body.
 * Used for post-serialization scanning as a defense-in-depth safety net.
 *
 * Requirements 11.8, 11.9: exclude secrets, credentials, stack traces,
 * tokens, request bodies, project content, and cross-owner data.
 */
export const PROHIBITED_RESPONSE_PATTERNS: readonly RegExp[] = [
  // Stack traces
  /at\s+\S+\s+\(.*:\d+:\d+\)/i,
  /\bat\s+(?:Object|Module|Function|async)\.\S+/i,
  // Common credential/secret key names in serialized JSON
  /(?:["']?)(?:password|secret|private_key|api_key|access_token|refresh_token|service_role_key|authorization_header)(?:["']?)\s*[:=]/i,
  // Supabase service role key pattern (sb- prefix, 100+ chars base64)
  /\bsb-[A-Za-z0-9+/=]{40,}\b/,
  // JWT-like tokens (three base64url segments, possibly inside JSON quotes)
  /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  // Node.js internal error with file path
  /(?:ENOENT|EACCES|EPERM|EROFS).*\/[^\s"]+/i,
];

/**
 * Scans serialized JSON for prohibited content patterns.
 * Returns true if the content is safe (no prohibited patterns found).
 *
 * This is a defense-in-depth measure — the primary safeguard is the
 * allowlisted metadata structure in `safeMetadata`.
 */
export function isPlannerResponseSafe(serialized: string): boolean {
  return PROHIBITED_RESPONSE_PATTERNS.every(
    (pattern) => !pattern.test(serialized),
  );
}

// ---------------------------------------------------------------------------
// Correlation identifiers — Requirement 17.3
// ---------------------------------------------------------------------------

export function isValidPlannerCorrelationId(
  value: string | null | undefined,
): value is string {
  return Boolean(value && CORRELATION_ID_PATTERN.test(value));
}

export function resolvePlannerCorrelationId(
  inbound: string | null | undefined,
  generate: () => string = () => crypto.randomUUID(),
): string {
  if (isValidPlannerCorrelationId(inbound)) return inbound;
  const generated = generate();
  return isValidPlannerCorrelationId(generated)
    ? generated
    : crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Safe metadata sanitization — Requirements 11.8, 11.9
// ---------------------------------------------------------------------------

function boundedInteger(value: number | undefined): number | undefined {
  if (!Number.isSafeInteger(value) || Number(value) < 0) return undefined;
  return Math.min(Number(value), Number.MAX_SAFE_INTEGER);
}

/**
 * Sanitize a single issue string to remove potential sensitive content.
 * Strips anything resembling a file path, stack trace fragment, or token.
 */
function sanitizeIssueString(value: string, maxLength: number): string {
  let safe = value.slice(0, maxLength);
  // Strip file path fragments (e.g. /home/user/project/src/file.ts:42)
  safe = safe.replace(/(?:\/[\w.-]+){2,}(?::\d+(?::\d+)?)?/g, "[path]");
  // Strip anything that looks like a stack trace line
  safe = safe.replace(/\bat\s+\S+\s*\(.*\)/g, "[internal]");
  // Strip JWT-like tokens
  safe = safe.replace(
    /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    "[redacted]",
  );
  return safe;
}

/**
 * Allowlist-based metadata sanitization.
 *
 * Only the four documented safe metadata fields pass through:
 * - issues (bounded array of {path, message} with sanitized strings)
 * - retryAfterSeconds (bounded non-negative integer)
 * - currentRevision (bounded non-negative integer)
 * - recovery (literal "reauthenticate-preserve-unsaved" only)
 *
 * Any other properties are silently dropped — this is the primary
 * safeguard preventing operation handlers from leaking sensitive data.
 */
export function safeMetadata(
  metadata: PlannerSafeErrorMetadata = {},
): PlannerSafeErrorMetadata {
  const issues = metadata.issues?.slice(0, 20).map((issue) => ({
    path: sanitizeIssueString(issue.path, 160),
    message: sanitizeIssueString(issue.message, 240),
  }));
  return {
    ...(issues?.length ? { issues } : {}),
    ...(boundedInteger(metadata.retryAfterSeconds) !== undefined
      ? { retryAfterSeconds: boundedInteger(metadata.retryAfterSeconds) }
      : {}),
    ...(boundedInteger(metadata.currentRevision) !== undefined
      ? { currentRevision: boundedInteger(metadata.currentRevision) }
      : {}),
    ...(metadata.recovery === "reauthenticate-preserve-unsaved"
      ? { recovery: metadata.recovery }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Response construction
// ---------------------------------------------------------------------------

function responseHeaders(
  correlationId: string,
  headers?: HeadersInit,
): Headers {
  const result = new Headers(headers);
  result.set(PLANNER_CORRELATION_HEADER, correlationId);
  result.set(
    PLANNER_ENDPOINT_CONTRACT_HEADER,
    String(PLANNER_ENDPOINT_CONTRACT_VERSION),
  );
  return result;
}

export function plannerApiSuccess<T>(
  data: T,
  correlationId: string,
  status = 200,
  headers?: HeadersInit,
): Response {
  const body: PlannerApiSuccess<T> = {
    success: true,
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    data,
    correlationId,
  };
  return Response.json(body, {
    status,
    headers: responseHeaders(correlationId, headers),
  });
}

/**
 * Ensures the error code is a known stable code.
 * Unknown or corrupted codes are mapped to INTERNAL_ERROR.
 */
function stableErrorCode(code: string): PlannerApiErrorCode {
  return PLANNER_STABLE_ERROR_CODES.has(code as PlannerApiErrorCode)
    ? (code as PlannerApiErrorCode)
    : "INTERNAL_ERROR";
}

export function plannerApiFailure(
  code: PlannerApiErrorCode,
  correlationId: string,
  status: number,
  metadata: PlannerSafeErrorMetadata = {},
  headers?: HeadersInit,
): Response {
  const safeCode = stableErrorCode(code);
  const body: PlannerApiFailure = {
    success: false,
    error: {
      code: safeCode,
      message: SAFE_MESSAGES[safeCode],
      ...safeMetadata(metadata),
    },
    correlationId,
  };
  return Response.json(body, {
    status,
    headers: responseHeaders(correlationId, headers),
  });
}

/** Maps every untrusted exception to one stable response without inspecting it. */
export function plannerInternalFailure(
  _exception: unknown,
  correlationId: string,
): Response {
  return plannerApiFailure("INTERNAL_ERROR", correlationId, 500);
}

/**
 * Sanitize an operation-handler error result before it reaches the response.
 *
 * Operation handlers return `PlannerOperationResult` which includes a code
 * and optional metadata. This function ensures:
 * 1. The code is a known stable error code (unknown → INTERNAL_ERROR)
 * 2. The metadata is allowlist-sanitized
 * 3. No sensitive content leaks through issue strings
 *
 * Requirements 11.8, 11.9: stable codes and safe remediation data only.
 */
export function sanitizeOperationFailure(input: {
  readonly code: string;
  readonly metadata?: PlannerSafeErrorMetadata;
}): {
  readonly code: PlannerApiErrorCode;
  readonly metadata: PlannerSafeErrorMetadata;
} {
  return {
    code: stableErrorCode(input.code),
    metadata: safeMetadata(input.metadata ?? {}),
  };
}
