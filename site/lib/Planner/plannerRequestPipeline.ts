import { isValidPlannerIdempotencyKey } from "@planner/lib/plannerProjectRepository";
import type {
  PlannerEndpointDescriptor,
  PlannerParameterDescriptor,
  PlannerSchema,
} from "@planner/lib/plannerEndpointContract";
import {
  PLANNER_CORRELATION_HEADER,
  plannerApiFailure,
  plannerApiSuccess,
  plannerInternalFailure,
  resolvePlannerCorrelationId,
  sanitizeOperationFailure,
  type PlannerApiErrorCode,
  type PlannerApiIssue,
  type PlannerSafeErrorMetadata,
} from "@planner/lib/plannerApiResponse";
import {
  derivePlannerOwnerScope,
  type PlannerOwnerScope,
} from "@planner/lib/plannerOwnerScope";

export interface PlannerVerifiedSession {
  readonly ownerId: string;
  readonly isAdmin: boolean;
}

export interface PlannerQuotaResult {
  readonly allowed: boolean;
  readonly resetAt: number;
}

export interface PlannerPipelineRequest {
  readonly request: Request;
  readonly pathParams?: Readonly<Record<string, string | undefined>>;
}

export interface PlannerValidatedRequest {
  readonly body: unknown;
  readonly path: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly headers: Readonly<Record<string, string>>;
}

export interface PlannerOperationContext {
  readonly correlationId: string;
  readonly session: PlannerVerifiedSession | null;
  readonly ownerScope: PlannerOwnerScope | null;
  readonly request: PlannerValidatedRequest;
}

export type PlannerOperationResult<T> =
  | {
      readonly ok: true;
      readonly status: number;
      readonly data: T;
      readonly headers?: HeadersInit;
    }
  | {
      readonly ok: false;
      readonly status: number;
      readonly code: PlannerApiErrorCode;
      readonly metadata?: PlannerSafeErrorMetadata;
      readonly headers?: HeadersInit;
    };

/** Gate C binds this port to the finalized repository or endpoint service. */
export interface PlannerEndpointOperationPort<T> {
  invoke(context: PlannerOperationContext): Promise<PlannerOperationResult<T>>;
}

export interface PlannerRequestPipelineDependencies {
  readonly checkQuota: (input: {
    readonly request: Request;
    readonly descriptor: PlannerEndpointDescriptor;
  }) => Promise<PlannerQuotaResult>;
  readonly verifyOrigin: (request: Request) => Promise<boolean> | boolean;
  readonly verifyCsrf: (request: Request) => Promise<boolean>;
  readonly verifySession: (
    request: Request,
  ) => Promise<PlannerVerifiedSession | null>;
  readonly authorizeOwnerScope: (input: {
    readonly descriptor: PlannerEndpointDescriptor;
    readonly session: PlannerVerifiedSession | null;
    readonly ownerScope: PlannerOwnerScope | null;
    readonly request: PlannerValidatedRequest;
  }) => Promise<boolean> | boolean;
  readonly validateRevisionAndIdempotency: (input: {
    readonly descriptor: PlannerEndpointDescriptor;
    readonly request: PlannerValidatedRequest;
  }) => Promise<readonly PlannerApiIssue[]> | readonly PlannerApiIssue[];
  readonly generateCorrelationId?: () => string;
  readonly now?: () => number;
}

interface ValidationResult {
  readonly value: PlannerValidatedRequest | null;
  readonly issues: readonly PlannerApiIssue[];
}

function issue(path: string, message: string): PlannerApiIssue {
  return { path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateSchema(
  schema: PlannerSchema,
  value: unknown,
  path: string,
): PlannerApiIssue[] {
  switch (schema.type) {
    case "none":
    case "unknown":
      return [];
    case "string": {
      if (typeof value !== "string") return [issue(path, "Expected a string")];
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        return [issue(path, "String is too short")];
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        return [issue(path, "String is too long")];
      }
      if (schema.enum && !schema.enum.includes(value)) {
        return [issue(path, "Value is not allowed")];
      }
      if (schema.format === "email" && value && !/^\S+@\S+\.\S+$/.test(value)) {
        return [issue(path, "Invalid email")];
      }
      if (
        schema.format === "iso-date-time" &&
        Number.isNaN(Date.parse(value))
      ) {
        return [issue(path, "Invalid date-time")];
      }
      if (schema.format === "data-url" && !/^data:[^,]+,/.test(value)) {
        return [issue(path, "Invalid data URL")];
      }
      return [];
    }
    case "number": {
      if (typeof value !== "number") return [issue(path, "Expected a number")];
      if (schema.finite && !Number.isFinite(value)) {
        return [issue(path, "Expected a finite number")];
      }
      if (schema.minimum !== undefined && value < schema.minimum) {
        return [issue(path, "Number is below the minimum")];
      }
      return [];
    }
    case "boolean":
      return typeof value === "boolean" ? [] : [issue(path, "Expected a boolean")];
    case "array":
      return Array.isArray(value)
        ? value.flatMap((entry, index) =>
            validateSchema(schema.items, entry, `${path}.${index}`),
          )
        : [issue(path, "Expected an array")];
    case "object": {
      if (!isRecord(value)) return [issue(path, "Expected an object")];
      const issues = schema.required.flatMap((name) =>
        value[name] === undefined
          ? [issue(`${path}.${name}`, "Required value is missing")]
          : [],
      );
      for (const [name, entry] of Object.entries(value)) {
        const propertySchema = schema.properties[name];
        if (!propertySchema) {
          if (schema.additionalProperties === false) {
            issues.push(issue(path, "Unexpected property"));
          }
          continue;
        }
        issues.push(...validateSchema(propertySchema, entry, `${path}.${name}`));
      }
      return issues;
    }
    case "union": {
      const alternatives = schema.variants.map((variant) =>
        validateSchema(variant, value, path),
      );
      return alternatives.some((candidate) => candidate.length === 0)
        ? []
        : alternatives[0] ?? [issue(path, "Value does not match any allowed shape")];
    }
  }
}

function normalizeContentType(value: string): string {
  return value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function readParameters(
  parameters: readonly PlannerParameterDescriptor[],
  readValue: (name: string) => string | null | undefined,
  path: string,
): { values: Record<string, string>; issues: PlannerApiIssue[] } {
  const values: Record<string, string> = {};
  const issues: PlannerApiIssue[] = [];
  for (const parameter of parameters) {
    let value = readValue(parameter.name);
    if (parameter.name.toLowerCase() === "content-type" && value) {
      value = normalizeContentType(value);
    }
    if (value === null || value === undefined || value === "") {
      if (parameter.required) {
        issues.push(issue(`${path}.${parameter.name}`, "Required value is missing"));
      }
      continue;
    }
    values[parameter.name] = value;
    issues.push(...validateSchema(parameter.schema, value, `${path}.${parameter.name}`));
  }
  return { values, issues };
}

function normalizeFormValue(schema: PlannerSchema, value: FormDataEntryValue): unknown {
  if (schema.type === "number" && typeof value === "string") return Number(value);
  if (schema.type === "boolean" && typeof value === "string") return value === "true";
  return value;
}

async function readRequestBody(
  request: Request,
  descriptor: PlannerEndpointDescriptor,
): Promise<{ value: unknown; issue?: PlannerApiIssue }> {
  if (descriptor.request.contentType === "none") return { value: undefined };
  try {
    if (descriptor.request.contentType === "application/json") {
      return { value: await request.json() };
    }
    const form = await request.formData();
    const body: Record<string, unknown> = {};
    if (descriptor.request.body.type === "object") {
      for (const [name, schema] of Object.entries(
        descriptor.request.body.properties,
      )) {
        const value = form.get(name);
        if (value !== null) body[name] = normalizeFormValue(schema, value);
      }
    }
    return { value: body };
  } catch {
    return {
      value: null,
      issue: issue("body", "Request body could not be parsed"),
    };
  }
}

async function validateRequest(
  input: PlannerPipelineRequest,
  descriptor: PlannerEndpointDescriptor,
): Promise<ValidationResult> {
  const requestUrl = new URL(input.request.url);
  const path = readParameters(
    descriptor.request.path,
    (name) => input.pathParams?.[name],
    "path",
  );
  const query = readParameters(
    descriptor.request.query,
    (name) => requestUrl.searchParams.get(name),
    "query",
  );
  const headers = readParameters(
    descriptor.request.headers,
    (name) => input.request.headers.get(name),
    "headers",
  );
  const body = await readRequestBody(input.request, descriptor);
  const issues = [
    ...path.issues,
    ...query.issues,
    ...headers.issues,
    ...(body.issue ? [body.issue] : validateSchema(descriptor.request.body, body.value, "body")),
  ];
  return {
    value:
      issues.length === 0
        ? {
            body: body.value,
            path: path.values,
            query: query.values,
            headers: headers.values,
          }
        : null,
    issues,
  };
}

function allowedMethods(descriptor: PlannerEndpointDescriptor): string {
  const methods = new Set([
    descriptor.method,
    ...plannerMethodsForPath(descriptor.path),
    "OPTIONS",
  ]);
  return Array.from(methods).join(", ");
}

function plannerMethodsForPath(path: string): string[] {
  // Kept local to avoid an endpoint-registry dependency in the reusable pipeline.
  return path === "/api/Planner/projects"
    ? ["GET", "POST"]
    : path === "/api/Planner/projects/{id}"
      ? ["GET", "PATCH", "DELETE"]
      : [];
}

function requiresVerifiedOwnerScope(
  descriptor: PlannerEndpointDescriptor,
): boolean {
  return (
    descriptor.security.auth === "member" &&
    (descriptor.security.owner === "authenticated-owner-list" ||
      descriptor.security.owner === "authenticated-owner-or-admin-item" ||
      descriptor.security.owner === "server-derived-creator")
  );
}

function validateMutationPreconditions(
  descriptor: PlannerEndpointDescriptor,
  request: PlannerValidatedRequest,
): PlannerApiIssue[] {
  if (
    descriptor.id !== "planner.projects.create" &&
    descriptor.id !== "planner.projects.update" &&
    descriptor.id !== "planner.projects.delete"
  ) {
    return [];
  }
  if (!isRecord(request.body)) {
    return [issue("body", "Mutation preconditions are required")];
  }
  const issues: PlannerApiIssue[] = [];
  const expectedRevision = request.body.expectedRevision;
  const requiredMinimum = descriptor.id === "planner.projects.create" ? 0 : 1;
  if (
    !Number.isSafeInteger(expectedRevision) ||
    Number(expectedRevision) < requiredMinimum ||
    (descriptor.id === "planner.projects.create" && expectedRevision !== 0)
  ) {
    issues.push(
      issue(
        "body.expectedRevision",
        descriptor.id === "planner.projects.create"
          ? "Project creation requires revision 0"
          : "A positive integer revision is required",
      ),
    );
  }
  if (!isValidPlannerIdempotencyKey(request.body.idempotencyKey)) {
    issues.push(
      issue(
        "body.idempotencyKey",
        "A bounded opaque idempotency key is required",
      ),
    );
  }
  return issues;
}

export async function processPlannerRequest<T>(input: {
  readonly descriptor: PlannerEndpointDescriptor;
  readonly pipelineRequest: PlannerPipelineRequest;
  readonly dependencies: PlannerRequestPipelineDependencies;
  readonly operation: PlannerEndpointOperationPort<T>;
}): Promise<Response> {
  const { descriptor, pipelineRequest, dependencies, operation } = input;
  const correlationId = resolvePlannerCorrelationId(
    pipelineRequest.request.headers.get(PLANNER_CORRELATION_HEADER),
    dependencies.generateCorrelationId,
  );
  try {
    const quota = await dependencies.checkQuota({
      request: pipelineRequest.request,
      descriptor,
    });
    if (!quota.allowed) {
      const retryAfterSeconds = Math.max(
        0,
        Math.ceil((quota.resetAt - (dependencies.now?.() ?? Date.now())) / 1000),
      );
      return plannerApiFailure(
        "RATE_LIMITED",
        correlationId,
        429,
        { retryAfterSeconds },
        { "Retry-After": String(retryAfterSeconds) },
      );
    }

    if (pipelineRequest.request.method.toUpperCase() !== descriptor.method) {
      return plannerApiFailure(
        "METHOD_NOT_ALLOWED",
        correlationId,
        405,
        {},
        { Allow: allowedMethods(descriptor) },
      );
    }

    const validated = await validateRequest(pipelineRequest, descriptor);
    if (!validated.value) {
      return plannerApiFailure("INVALID_REQUEST", correlationId, 400, {
        issues: validated.issues,
      });
    }

    if (
      descriptor.security.origin === "same-site-cookie-and-csrf" &&
      !(await dependencies.verifyOrigin(pipelineRequest.request))
    ) {
      return plannerApiFailure("ORIGIN_REJECTED", correlationId, 403);
    }

    if (
      descriptor.security.csrf === "double-submit-cookie" &&
      !(await dependencies.verifyCsrf(pipelineRequest.request))
    ) {
      return plannerApiFailure("CSRF_REJECTED", correlationId, 403);
    }

    const session = await dependencies.verifySession(pipelineRequest.request);
    if (descriptor.security.auth === "member" && !session) {
      return plannerApiFailure("AUTH_REQUIRED", correlationId, 401, {
        recovery: "reauthenticate-preserve-unsaved",
      });
    }

    const ownerScope =
      session && requiresVerifiedOwnerScope(descriptor)
        ? derivePlannerOwnerScope(session)
        : null;
    if (requiresVerifiedOwnerScope(descriptor) && !ownerScope) {
      return plannerApiFailure("OWNER_SCOPE_REJECTED", correlationId, 404);
    }

    if (
      requiresVerifiedOwnerScope(descriptor) &&
      !(await dependencies.authorizeOwnerScope({
        descriptor,
        session,
        ownerScope,
        request: validated.value,
      }))
    ) {
      return plannerApiFailure("OWNER_SCOPE_REJECTED", correlationId, 404);
    }

    const preconditionIssues = [
      ...validateMutationPreconditions(descriptor, validated.value),
      ...(await dependencies.validateRevisionAndIdempotency({
        descriptor,
        request: validated.value,
      })),
    ];
    if (preconditionIssues.length > 0) {
      return plannerApiFailure("INVALID_REQUEST", correlationId, 400, {
        issues: preconditionIssues,
      });
    }

    const result = await operation.invoke({
      correlationId,
      session,
      ownerScope,
      request: validated.value,
    });
    if (result.ok) {
      return plannerApiSuccess(
        result.data,
        correlationId,
        result.status,
        result.headers,
      );
    }
    // Sanitize operation-handler failure before building the response.
    // This ensures stable codes and allowlisted metadata only — even if
    // the operation handler returns unexpected fields or sensitive strings.
    const sanitized = sanitizeOperationFailure({
      code: result.code,
      metadata: result.metadata,
    });
    return plannerApiFailure(
      sanitized.code,
      correlationId,
      result.status,
      sanitized.metadata,
      result.headers,
    );
  } catch (exception) {
    return plannerInternalFailure(exception, correlationId);
  }
}

export function verifySameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
