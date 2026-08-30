/**
 * Gate B contract for read-only Planner endpoint consumers.
 *
 * The descriptor version is independent from persisted project/geometry
 * versions. During migration, clients accept both the live legacy response
 * shape and the versioned `{ contractVersion: 1, data }` success envelope.
 */

export const PLANNER_ENDPOINT_CONTRACT_VERSION = 1 as const;
export const PLANNER_ENDPOINT_CONTRACT_HEADER = "x-planner-contract-version" as const;

/**
 * Canonical project-item policy: a foreign record and an absent record both
 * receive the same non-disclosing not-found response.
 */
export const PLANNER_ITEM_ACCESS_POLICY = "non-disclosing-not-found" as const;

export type PlannerEndpointContractVersion =
  typeof PLANNER_ENDPOINT_CONTRACT_VERSION;
export type PlannerItemAccessPolicy = typeof PLANNER_ITEM_ACCESS_POLICY;
export type PlannerHttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
export type PlannerAuthPolicy = "guest" | "member";
export type PlannerOwnerPolicy =
  | "public-catalog"
  | "authenticated-owner-list"
  | "authenticated-owner-or-admin-item"
  | "server-derived-creator"
  | "not-applicable";
export type PlannerCsrfPolicy = "not-required" | "double-submit-cookie";
export type PlannerOriginPolicy =
  | "same-site-cookie"
  | "same-site-cookie-and-csrf";
export type PlannerEnvelopeKind =
  | "legacy-raw"
  | "legacy-success-spread"
  | "planner-v1"
  | "standard-error";

export type PlannerSchema =
  | { readonly type: "none" }
  | { readonly type: "unknown"; readonly description: string }
  | {
      readonly type: "string";
      readonly minLength?: number;
      readonly maxLength?: number;
      readonly format?: "email" | "iso-date-time" | "data-url";
      readonly enum?: readonly string[];
      readonly description?: string;
    }
  | {
      readonly type: "number";
      readonly minimum?: number;
      readonly finite?: boolean;
    }
  | { readonly type: "boolean" }
  | { readonly type: "array"; readonly items: PlannerSchema }
  | {
      readonly type: "object";
      readonly required: readonly string[];
      readonly properties: Readonly<Record<string, PlannerSchema>>;
      readonly additionalProperties?: boolean;
    }
  | {
      readonly type: "union";
      readonly variants: readonly PlannerSchema[];
    };

export interface PlannerParameterDescriptor {
  readonly name: string;
  readonly required: boolean;
  readonly schema: PlannerSchema;
}

export interface PlannerResponseDescriptor {
  readonly status: number;
  readonly envelope: PlannerEnvelopeKind;
  readonly schema: PlannerSchema;
  readonly description: string;
}

export interface PlannerEndpointDescriptor {
  readonly id: string;
  readonly contractVersion: PlannerEndpointContractVersion;
  readonly method: PlannerHttpMethod;
  readonly path: string;
  readonly request: {
    readonly path: readonly PlannerParameterDescriptor[];
    readonly query: readonly PlannerParameterDescriptor[];
    readonly headers: readonly PlannerParameterDescriptor[];
    readonly body: PlannerSchema;
    readonly contentType: "none" | "application/json" | "multipart/form-data";
  };
  readonly responses: {
    readonly success: readonly PlannerResponseDescriptor[];
    readonly errors: readonly PlannerResponseDescriptor[];
  };
  readonly security: {
    readonly auth: PlannerAuthPolicy;
    readonly owner: PlannerOwnerPolicy;
    /** Present only for owner-scoped item endpoints. */
    readonly itemAccess?: PlannerItemAccessPolicy;
    readonly csrf: PlannerCsrfPolicy;
    readonly origin: PlannerOriginPolicy;
  };
  readonly rateLimit: {
    readonly scope: string;
    readonly requests: number;
    readonly windowMs: 60_000;
    readonly key: "normalized-client-ip";
  };
  readonly compatibility: {
    readonly preferredResponse: "planner-v1";
    readonly acceptedResponses: readonly ["planner-v1", "legacy"];
  };
}

const noneSchema = { type: "none" } as const satisfies PlannerSchema;
const unknownSchema = {
  type: "unknown",
  description: "Value is owned by the referenced domain contract",
} as const satisfies PlannerSchema;
const stringSchema = { type: "string" } as const satisfies PlannerSchema;
const nonEmptyStringSchema = {
  type: "string",
  minLength: 1,
} as const satisfies PlannerSchema;
const errorSchema = {
  type: "object",
  required: ["success", "error"],
  properties: {
    success: { type: "boolean" },
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: nonEmptyStringSchema,
        message: nonEmptyStringSchema,
        details: unknownSchema,
      },
    },
  },
} as const satisfies PlannerSchema;
const legacyDetailErrorSchema = {
  type: "object",
  required: ["detail"],
  properties: { detail: nonEmptyStringSchema, source: stringSchema },
} as const satisfies PlannerSchema;
const compatibleErrorSchema = {
  type: "union",
  variants: [errorSchema, legacyDetailErrorSchema],
} as const satisfies PlannerSchema;

const furnitureItemSchema = {
  type: "object",
  required: ["id", "name", "category", "dimensions"],
  properties: {
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    category: nonEmptyStringSchema,
    subcategory: { type: "string" },
    tags: { type: "array", items: stringSchema },
    dimensions: {
      type: "object",
      required: ["width_mm", "depth_mm", "height_mm"],
      properties: {
        width_mm: { type: "number", finite: true },
        depth_mm: { type: "number", finite: true },
        height_mm: { type: "number", finite: true },
      },
    },
    thumbnail_url: stringSchema,
    top_png_url: stringSchema,
    top_svg_url: stringSchema,
    is_custom: { type: "boolean" },
  },
  additionalProperties: true,
} as const satisfies PlannerSchema;

const projectSchema = {
  type: "object",
  required: [
    "contractVersion",
    "schemaVersion",
    "id",
    "name",
    "revision",
    "status",
    "geometry",
    "sheet",
    "layers",
    "thumbnailUrl",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    contractVersion: { type: "number", minimum: 1, finite: true },
    schemaVersion: { type: "number", minimum: 1, finite: true },
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    revision: { type: "number", minimum: 1, finite: true },
    status: { type: "string", enum: ["draft", "active", "archived"] },
    geometry: unknownSchema,
    sheet: unknownSchema,
    layers: { type: "array", items: unknownSchema },
    thumbnailUrl: unknownSchema,
    createdAt: { type: "string", format: "iso-date-time" },
    updatedAt: { type: "string", format: "iso-date-time" },
  },
  additionalProperties: false,
} as const satisfies PlannerSchema;

const projectSummarySchema = {
  type: "object",
  required: ["id", "name", "revision", "status", "thumbnailUrl", "updatedAt"],
  properties: {
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    revision: { type: "number", minimum: 1, finite: true },
    status: { type: "string", enum: ["draft", "active", "archived"] },
    thumbnailUrl: unknownSchema,
    updatedAt: { type: "string", format: "iso-date-time" },
  },
  additionalProperties: false,
} as const satisfies PlannerSchema;

const projectWriteFields = {
  name: nonEmptyStringSchema,
  status: { type: "string", enum: ["draft", "active", "archived"] },
  geometry: unknownSchema,
  canvas_json: unknownSchema,
  sheet: unknownSchema,
  layers: unknownSchema,
  thumbnail_png: { type: "string", format: "data-url" },
  thumbnailUrl: stringSchema,
  expectedRevision: { type: "number", minimum: 0, finite: true },
  idempotencyKey: { type: "string", minLength: 1, maxLength: 120 },
} as const;

const projectWriteSchema = {
  type: "object",
  required: ["name", "expectedRevision", "idempotencyKey"],
  properties: projectWriteFields,
  additionalProperties: false,
} as const satisfies PlannerSchema;

const projectPatchSchema = {
  type: "object",
  required: ["expectedRevision", "idempotencyKey"],
  properties: projectWriteFields,
  additionalProperties: false,
} as const satisfies PlannerSchema;

const projectDeleteSchema = {
  type: "object",
  required: ["expectedRevision", "idempotencyKey"],
  properties: {
    expectedRevision: { type: "number", minimum: 1, finite: true },
    idempotencyKey: { type: "string", minLength: 1, maxLength: 120 },
  },
  additionalProperties: false,
} as const satisfies PlannerSchema;

const projectIdParameter = {
  name: "id",
  required: true,
  schema: nonEmptyStringSchema,
} as const satisfies PlannerParameterDescriptor;

const cookieHeader = {
  name: "cookie",
  required: false,
  schema: {
    type: "string",
    minLength: 1,
    description: "Session cookie for member routes and CSRF cookie for mutations",
  },
} as const satisfies PlannerParameterDescriptor;
const jsonHeaders = [
  {
    name: "content-type",
    required: true,
    schema: { type: "string", enum: ["application/json"] },
  },
  {
    name: "x-csrf-token",
    required: true,
    schema: nonEmptyStringSchema,
  },
  cookieHeader,
] as const satisfies readonly PlannerParameterDescriptor[];

const noHeaders = [] as const satisfies readonly PlannerParameterDescriptor[];
const memberHeaders = [cookieHeader] as const;
const csrfOnlyHeaders = [jsonHeaders[1], cookieHeader] as const;

function standardErrors(
  statuses: readonly number[],
): readonly PlannerResponseDescriptor[] {
  return statuses.map((status) => ({
    status,
    envelope: "standard-error" as const,
    schema: compatibleErrorSchema,
    description:
      status === 400
        ? "Request validation failed"
        : status === 401
          ? "Authenticated member session required"
          : status === 403
            ? "CSRF, feature, or role policy rejected the request"
            : status === 404
              ? "Owned resource is absent or deliberately undisclosed"
              : status === 405
                ? "Method is not exposed by the route module"
                : status === 409
                ? "Revision or idempotency conflict"
                : status === 413
                  ? "Upload exceeds the configured size limit"
                  : status === 429
                    ? "Per-IP request quota exceeded"
                    : status === 503
                      ? "Required persistence or conversion service unavailable"
                      : "Unexpected server failure",
  }));
}

const baseCompatibility = {
  preferredResponse: "planner-v1",
  acceptedResponses: ["planner-v1", "legacy"],
} as const;

const baseRateLimit = {
  windowMs: 60_000,
  key: "normalized-client-ip",
} as const;

export const PLANNER_ENDPOINT_DESCRIPTORS = [
  {
    id: "planner.catalog.list",
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    method: "GET",
    path: "/api/Planner/catalog",
    request: {
      path: [],
      query: [
        { name: "category", required: false, schema: stringSchema },
        { name: "q", required: false, schema: stringSchema },
      ],
      headers: noHeaders,
      body: noneSchema,
      contentType: "none",
    },
    responses: {
      success: [
        {
          status: 200,
          envelope: "legacy-raw",
          schema: { type: "array", items: furnitureItemSchema },
          description: "Filtered public catalog items",
        },
      ],
      errors: standardErrors([405, 429, 500]),
    },
    security: {
      auth: "guest",
      owner: "public-catalog",
      csrf: "not-required",
      origin: "same-site-cookie",
    },
    rateLimit: { ...baseRateLimit, scope: "planner-catalog:get", requests: 60 },
    compatibility: baseCompatibility,
  },
  {
    id: "planner.catalog.upload",
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    method: "POST",
    path: "/api/Planner/catalog/upload",
    request: {
      path: [],
      query: [],
      headers: csrfOnlyHeaders,
      body: {
        type: "object",
        required: ["file", "name", "category", "width_mm", "depth_mm", "height_mm"],
        properties: {
          file: { type: "unknown", description: "Multipart File" },
          name: nonEmptyStringSchema,
          category: nonEmptyStringSchema,
          subcategory: stringSchema,
          tags: stringSchema,
          width_mm: { type: "number", finite: true },
          depth_mm: { type: "number", finite: true },
          height_mm: { type: "number", finite: true },
        },
      },
      contentType: "multipart/form-data",
    },
    responses: {
      success: [
        {
          status: 201,
          envelope: "legacy-raw",
          schema: furnitureItemSchema,
          description: "Created custom catalog item",
        },
      ],
      errors: standardErrors([400, 401, 403, 405, 413, 429, 500]),
    },
    security: {
      auth: "member",
      owner: "not-applicable",
      csrf: "double-submit-cookie",
      origin: "same-site-cookie-and-csrf",
    },
    rateLimit: {
      ...baseRateLimit,
      scope: "planner-catalog-upload:post",
      requests: 15,
    },
    compatibility: baseCompatibility,
  },
  {
    id: "planner.handoff.create",
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    method: "POST",
    path: "/api/Planner/handoff",
    request: {
      path: [],
      query: [],
      headers: jsonHeaders,
      body: {
        type: "object",
        required: ["contact", "boq", "idempotencyKey"],
        properties: {
          contact: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", minLength: 1, maxLength: 120 },
              email: { type: "string", format: "email" },
              phone: { type: "string", maxLength: 40 },
              company: { type: "string", maxLength: 120 },
              notes: { type: "string", maxLength: 2000 },
            },
          },
          boq: {
            type: "object",
            required: ["projectId", "projectName", "calculationHash"],
            properties: {
              projectId: nonEmptyStringSchema,
              projectName: nonEmptyStringSchema,
              calculationHash: { type: "string", minLength: 16, maxLength: 128 },
              lines: { type: "array", items: unknownSchema },
              subtotalInr: { type: "number", minimum: 0, finite: true },
              gstInr: { type: "number", minimum: 0, finite: true },
              totalInr: { type: "number", minimum: 0, finite: true },
            },
          },
          idempotencyKey: { type: "string", minLength: 1, maxLength: 120 },
          projectNotes: { type: "string", maxLength: 2000 },
        },
      },
      contentType: "application/json",
    },
    responses: {
      success: [
        {
          status: 200,
          envelope: "legacy-success-spread",
          schema: {
            type: "object",
            required: ["success", "referenceId", "createdAt", "idempotentReplay", "message"],
            properties: {
              success: { type: "boolean" },
              referenceId: nonEmptyStringSchema,
              createdAt: { type: "string", format: "iso-date-time" },
              idempotentReplay: { type: "boolean" },
              message: nonEmptyStringSchema,
            },
          },
          description: "Stable handoff confirmation",
        },
      ],
      errors: standardErrors([400, 403, 405, 429, 500, 503]),
    },
    security: {
      auth: "guest",
      owner: "server-derived-creator",
      csrf: "double-submit-cookie",
      origin: "same-site-cookie-and-csrf",
    },
    rateLimit: { ...baseRateLimit, scope: "planner-handoff:post", requests: 20 },
    compatibility: baseCompatibility,
  },
  {
    id: "planner.projects.list",
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    method: "GET",
    path: "/api/Planner/projects",
    request: { path: [], query: [], headers: memberHeaders, body: noneSchema, contentType: "none" },
    responses: {
      success: [{ status: 200, envelope: "planner-v1", schema: { type: "array", items: projectSummarySchema }, description: "Projects scoped to the authenticated owner" }],
      errors: standardErrors([401, 405, 429, 500, 503]),
    },
    security: { auth: "member", owner: "authenticated-owner-list", csrf: "not-required", origin: "same-site-cookie" },
    rateLimit: { ...baseRateLimit, scope: "planner-projects:get", requests: 60 },
    compatibility: baseCompatibility,
  },
  {
    id: "planner.projects.create",
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    method: "POST",
    path: "/api/Planner/projects",
    request: { path: [], query: [], headers: jsonHeaders, body: projectWriteSchema, contentType: "application/json" },
    responses: {
      success: [{ status: 201, envelope: "planner-v1", schema: projectSchema, description: "Created owner-scoped project" }],
      errors: standardErrors([400, 401, 403, 405, 409, 429, 500, 503]),
    },
    security: { auth: "member", owner: "server-derived-creator", csrf: "double-submit-cookie", origin: "same-site-cookie-and-csrf" },
    rateLimit: { ...baseRateLimit, scope: "planner-projects:post", requests: 30 },
    compatibility: baseCompatibility,
  },
  {
    id: "planner.projects.get",
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    method: "GET",
    path: "/api/Planner/projects/{id}",
    request: { path: [projectIdParameter], query: [], headers: memberHeaders, body: noneSchema, contentType: "none" },
    responses: {
      success: [{ status: 200, envelope: "planner-v1", schema: projectSchema, description: "Owned project under the non-disclosing item policy" }],
      errors: standardErrors([401, 404, 405, 429, 500, 503]),
    },
    security: { auth: "member", owner: "authenticated-owner-or-admin-item", itemAccess: PLANNER_ITEM_ACCESS_POLICY, csrf: "not-required", origin: "same-site-cookie" },
    rateLimit: { ...baseRateLimit, scope: "planner-projects-id:get", requests: 60 },
    compatibility: baseCompatibility,
  },
  {
    id: "planner.projects.update",
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    method: "PATCH",
    path: "/api/Planner/projects/{id}",
    request: { path: [projectIdParameter], query: [], headers: jsonHeaders, body: projectPatchSchema, contentType: "application/json" },
    responses: {
      success: [{ status: 200, envelope: "planner-v1", schema: projectSchema, description: "Updated owned project" }],
      errors: standardErrors([400, 401, 403, 404, 405, 409, 429, 500, 503]),
    },
    security: { auth: "member", owner: "authenticated-owner-or-admin-item", itemAccess: PLANNER_ITEM_ACCESS_POLICY, csrf: "double-submit-cookie", origin: "same-site-cookie-and-csrf" },
    rateLimit: { ...baseRateLimit, scope: "planner-projects-id:patch", requests: 30 },
    compatibility: baseCompatibility,
  },
  {
    id: "planner.projects.delete",
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    method: "DELETE",
    path: "/api/Planner/projects/{id}",
    request: { path: [projectIdParameter], query: [], headers: jsonHeaders, body: projectDeleteSchema, contentType: "application/json" },
    responses: {
      success: [{ status: 200, envelope: "planner-v1", schema: { type: "object", required: ["ok"], properties: { ok: { type: "boolean" } } }, description: "Deletion confirmation" }],
      errors: standardErrors([400, 401, 403, 404, 405, 409, 429, 500, 503]),
    },
    security: { auth: "member", owner: "authenticated-owner-or-admin-item", itemAccess: PLANNER_ITEM_ACCESS_POLICY, csrf: "double-submit-cookie", origin: "same-site-cookie-and-csrf" },
    rateLimit: { ...baseRateLimit, scope: "planner-projects-id:delete", requests: 20 },
    compatibility: baseCompatibility,
  },
  {
    id: "planner.ai-advisor",
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    method: "POST",
    path: "/api/Planner/ai-advisor",
    request: {
      path: [],
      query: [],
      headers: jsonHeaders,
      body: {
        type: "object",
        required: ["messages"],
        properties: {
          mode: {
            type: "string",
            enum: ["chat", "space-suggest"],
          },
          messages: {
            type: "array",
            items: {
              type: "object",
              required: ["role", "content"],
              properties: {
                role: { type: "string", enum: ["system", "user", "assistant"] },
                content: { type: "string", minLength: 1, maxLength: 2000 },
              },
              additionalProperties: false,
            },
          },
          context: unknownSchema,
        },
        additionalProperties: false,
      },
      contentType: "application/json",
    },
    responses: {
      success: [
        {
          status: 200,
          envelope: "legacy-success-spread",
          schema: {
            type: "object",
            required: ["success", "content"],
            properties: {
              success: { type: "boolean" },
              content: nonEmptyStringSchema,
              degraded: { type: "boolean" },
              provider: stringSchema,
            },
            additionalProperties: false,
          },
          description: "Advisory text response or deterministic degraded fallback",
        },
      ],
      errors: standardErrors([400, 403, 405, 429, 500]),
    },
    security: {
      auth: "guest",
      owner: "not-applicable",
      csrf: "double-submit-cookie",
      origin: "same-site-cookie-and-csrf",
    },
    rateLimit: {
      ...baseRateLimit,
      scope: "planner-advisor",
      requests: 5,
    },
    compatibility: baseCompatibility,
  },
  {
    id: "planner.sketch-to-plan.convert",
    contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
    method: "POST",
    path: "/api/Planner/sketch-to-plan",
    request: {
      path: [], query: [], headers: jsonHeaders,
      body: {
        type: "object",
        required: ["imageDataUrl", "fileName", "prompt"],
        properties: {
          imageDataUrl: { type: "string", minLength: 1, maxLength: 1_500_000, format: "data-url" },
          fileName: { type: "string", minLength: 1, maxLength: 200 },
          prompt: { type: "string", minLength: 1, maxLength: 2000 },
          includeRooms: { type: "boolean" },
        },
      },
      contentType: "application/json",
    },
    responses: {
      success: [{ status: 200, envelope: "legacy-success-spread", schema: { type: "object", required: ["success", "status", "fileName"], properties: { success: { type: "boolean" }, status: { type: "string", enum: ["preview", "fallback"] }, fileName: nonEmptyStringSchema, objects: { type: "array", items: unknownSchema }, warnings: { type: "array", items: stringSchema }, reason: stringSchema, message: stringSchema } }, description: "Preview geometry or recoverable fallback" }],
      errors: standardErrors([400, 403, 405, 429, 500, 503]),
    },
    security: { auth: "guest", owner: "not-applicable", csrf: "double-submit-cookie", origin: "same-site-cookie-and-csrf" },
    rateLimit: { ...baseRateLimit, scope: "planner-sketch-to-plan", requests: 6 },
    compatibility: baseCompatibility,
  },
] as const satisfies readonly PlannerEndpointDescriptor[];

export type PlannerEndpointId =
  (typeof PLANNER_ENDPOINT_DESCRIPTORS)[number]["id"];

/** Gate B publication consumed read-only by UI, observability, and audit lanes. */
export const PLANNER_GATE_B_ENDPOINT_CONTRACT = {
  contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
  header: PLANNER_ENDPOINT_CONTRACT_HEADER,
  responseMigration: {
    preferred: "planner-v1",
    accepted: ["planner-v1", "legacy"],
  },
  endpoints: PLANNER_ENDPOINT_DESCRIPTORS,
} as const;

export interface PlannerVersionedSuccess<T> {
  readonly contractVersion: PlannerEndpointContractVersion;
  readonly data: T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Dual-read success parser. Versioned responses are unwrapped; legacy raw
 * arrays/objects and `{ success: true, ...payload }` responses pass through.
 */
export function readPlannerEndpointSuccess<T>(payload: unknown): T {
  if (
    isRecord(payload) &&
    payload.contractVersion === PLANNER_ENDPOINT_CONTRACT_VERSION &&
    "data" in payload
  ) {
    return payload.data as T;
  }
  return payload as T;
}
