// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 16: Security checks precede persistence
//
// **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6, 11.7**
//
// Builds on plannerRequestPipeline.ts and plannerRouteAdapter.ts.
//
// Generates invalid methods, inputs, origins, CSRF tokens, sessions, owner
// scopes, and quota states and verifies the structured response and zero
// persistence calls. At least 100 generated cases per property assertion.

import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";

import type { PlannerEndpointDescriptor } from "@planner/lib/plannerEndpointContract";
import type {
  PlannerApiErrorCode,
  PlannerApiIssue,
} from "@planner/lib/plannerApiResponse";
import {
  processPlannerRequest,
  type PlannerEndpointOperationPort,
  type PlannerRequestPipelineDependencies,
  type PlannerVerifiedSession,
} from "@planner/lib/plannerRequestPipeline";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_RUNS = 120;
const PROPERTY_SEED = 20260843;

// ---------------------------------------------------------------------------
// Rejection stage taxonomy
// ---------------------------------------------------------------------------

/**
 * Each stage corresponds to a security check in the pipeline processing order.
 *
 * Pipeline order: correlation → quota → method → validation → origin → csrf
 * → session → owner scope → revision/idempotency → persistence
 *
 * A rejection at any stage must return a structured failure and never invoke
 * the operation port (persistence adapter).
 */
type RejectionStage =
  | "quota"
  | "method"
  | "input"
  | "origin"
  | "csrf"
  | "session"
  | "owner"
  | "precondition";

// ---------------------------------------------------------------------------
// Fixture descriptor — exercises every security dimension
// ---------------------------------------------------------------------------

/**
 * A synthetic descriptor that requires member auth, owner scope, CSRF,
 * origin checks, and body validation. This ensures every pipeline stage
 * is exercised.
 */
const securityDescriptor: PlannerEndpointDescriptor = {
  id: "planner.projects.update",
  contractVersion: 1,
  method: "PATCH",
  path: "/api/Planner/projects/{id}",
  request: {
    path: [
      {
        name: "id",
        required: true,
        schema: { type: "string", minLength: 1 },
      },
    ],
    query: [],
    headers: [
      {
        name: "content-type",
        required: true,
        schema: { type: "string", enum: ["application/json"] },
      },
      {
        name: "x-csrf-token",
        required: true,
        schema: { type: "string", minLength: 1 },
      },
    ],
    body: {
      type: "object",
      required: ["name", "expectedRevision", "idempotencyKey"],
      properties: {
        name: { type: "string", minLength: 1, maxLength: 120 },
        expectedRevision: { type: "number", minimum: 1, finite: true },
        idempotencyKey: { type: "string", minLength: 1, maxLength: 120 },
      },
      additionalProperties: false,
    },
    contentType: "application/json",
  },
  responses: {
    success: [
      {
        status: 200,
        envelope: "planner-v1",
        schema: { type: "unknown", description: "Property fixture" },
        description: "Accepted property fixture",
      },
    ],
    errors: [400, 401, 403, 404, 405, 429, 500].map((status) => ({
      status,
      envelope: "standard-error" as const,
      schema: { type: "unknown" as const, description: "Safe error" },
      description: "Rejected property fixture",
    })),
  },
  security: {
    auth: "member",
    owner: "authenticated-owner-or-admin-item",
    csrf: "double-submit-cookie",
    origin: "same-site-cookie-and-csrf",
  },
  rateLimit: {
    scope: "planner-property:patch",
    requests: 10,
    windowMs: 60_000,
    key: "normalized-client-ip",
  },
  compatibility: {
    preferredResponse: "planner-v1",
    acceptedResponses: ["planner-v1", "legacy"],
  },
};

// ---------------------------------------------------------------------------
// Expected response codes per stage
// ---------------------------------------------------------------------------

const expectedByStage: Readonly<
  Record<RejectionStage, { status: number; code: PlannerApiErrorCode }>
> = {
  quota: { status: 429, code: "RATE_LIMITED" },
  method: { status: 405, code: "METHOD_NOT_ALLOWED" },
  input: { status: 400, code: "INVALID_REQUEST" },
  origin: { status: 403, code: "ORIGIN_REJECTED" },
  csrf: { status: 403, code: "CSRF_REJECTED" },
  session: { status: 401, code: "AUTH_REQUIRED" },
  owner: { status: 404, code: "OWNER_SCOPE_REJECTED" },
  precondition: { status: 400, code: "INVALID_REQUEST" },
};

// ---------------------------------------------------------------------------
// Arbitraries — generate truly diverse invalid inputs per dimension
// ---------------------------------------------------------------------------

/** Methods that differ from the descriptor's PATCH. */
const invalidMethodArb = fc.constantFrom(
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "TRACE",
  "CONNECT",
);

/** Invalid body payloads that fail schema validation for the descriptor. */
const invalidBodyArb = fc.oneof(
  // Missing required "name" field
  fc.record({
    expectedRevision: fc.integer({ min: 1, max: 100_000 }),
    idempotencyKey: fc.stringMatching(/^[A-Za-z0-9._~-]{1,80}$/),
  }),
  // Missing required "expectedRevision" field
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 60 }),
    idempotencyKey: fc.stringMatching(/^[A-Za-z0-9._~-]{1,80}$/),
  }),
  // Missing "idempotencyKey"
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 60 }),
    expectedRevision: fc.integer({ min: 1, max: 100_000 }),
  }),
  // Empty name (violates minLength: 1)
  fc.record({
    name: fc.constant(""),
    expectedRevision: fc.integer({ min: 1, max: 100_000 }),
    idempotencyKey: fc.stringMatching(/^[A-Za-z0-9._~-]{1,80}$/),
  }),
  // Name too long (violates maxLength: 120)
  fc.record({
    name: fc.string({ minLength: 121, maxLength: 200 }),
    expectedRevision: fc.integer({ min: 1, max: 100_000 }),
    idempotencyKey: fc.stringMatching(/^[A-Za-z0-9._~-]{1,80}$/),
  }),
  // Non-finite expectedRevision
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 60 }),
    expectedRevision: fc.constantFrom(NaN, Infinity, -Infinity),
    idempotencyKey: fc.stringMatching(/^[A-Za-z0-9._~-]{1,80}$/),
  }),
  // expectedRevision below minimum
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 60 }),
    expectedRevision: fc.integer({ min: -1000, max: 0 }),
    idempotencyKey: fc.stringMatching(/^[A-Za-z0-9._~-]{1,80}$/),
  }),
  // Unexpected additional property
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 60 }),
    expectedRevision: fc.integer({ min: 1, max: 100_000 }),
    idempotencyKey: fc.stringMatching(/^[A-Za-z0-9._~-]{1,80}$/),
    _injected: fc.string({ minLength: 1, maxLength: 20 }),
  }),
  // Wrong type for name (number instead of string)
  fc.record({
    name: fc.integer(),
    expectedRevision: fc.integer({ min: 1, max: 100_000 }),
    idempotencyKey: fc.stringMatching(/^[A-Za-z0-9._~-]{1,80}$/),
  }),
  // Completely empty body
  fc.constant({}),
);

/** Generated origin URLs that differ from the request's own origin. */
const invalidOriginArb = fc.oneof(
  fc.constant("https://evil.example.com"),
  fc.constant("http://planner.example"),
  fc.webUrl().filter((url) => !url.includes("planner.example")),
  fc.constant(""),
  fc.constant("null"),
);

/** Generated bad CSRF tokens. */
const invalidCsrfArb = fc.oneof(
  fc.constant(""),
  fc.constant("invalid-token"),
  fc.stringMatching(/^[A-Za-z0-9]{1,20}$/),
);

/** Generated owner IDs for client-supplied owner identifier rejection. */
const clientOwnerIdArb = fc.oneof(
  fc.uuid(),
  fc.string({ minLength: 1, maxLength: 36 }),
  fc.constant("attacker-owner-id"),
);

/** Rate-limit reset times. */
const resetAtArb = fc.integer({ min: 0, max: 2_000_000_000_000 });

// A valid body used when the injection is in a different stage
const validBodyArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 60 }),
  expectedRevision: fc.integer({ min: 1, max: 100_000 }),
  idempotencyKey: fc.stringMatching(/^[A-Za-z0-9._~-]{1,80}$/),
});

// A valid session for stages that pass auth
const validSession: PlannerVerifiedSession = {
  ownerId: "verified-owner-id",
  isAdmin: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = "https://planner.example/api/Planner/projects/proj-001";

function buildRequest(
  method: string,
  body: unknown,
  overrides: {
    origin?: string;
    csrfToken?: string;
    contentType?: string;
  } = {},
): Request {
  const headers: Record<string, string> = {
    "content-type": overrides.contentType ?? "application/json; charset=utf-8",
    "x-csrf-token": overrides.csrfToken ?? "valid-csrf-token",
    origin: overrides.origin ?? "https://planner.example",
  };
  return new Request(BASE_URL, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

function buildDependencies(
  overrides: Partial<PlannerRequestPipelineDependencies> = {},
): PlannerRequestPipelineDependencies {
  return {
    checkQuota: async () => ({ allowed: true, resetAt: Date.now() + 60_000 }),
    verifyOrigin: () => true,
    verifyCsrf: async () => true,
    verifySession: async () => validSession,
    authorizeOwnerScope: () => true,
    validateRevisionAndIdempotency: () => [],
    generateCorrelationId: () => "corr-prop16-test",
    now: () => Date.now(),
    ...overrides,
  };
}

function buildOperationSpy(): PlannerEndpointOperationPort<unknown> {
  return { invoke: vi.fn() };
}

interface ParsedErrorResponse {
  success: boolean;
  error?: { code: string; message?: string; issues?: PlannerApiIssue[] };
  correlationId: string;
}

async function parseResponse(response: Response): Promise<ParsedErrorResponse> {
  return (await response.json()) as ParsedErrorResponse;
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Feature: planner-comprehensive-audit, Property 16: Security checks precede persistence", () => {
  // =========================================================================
  // 11.6: Rate-limit exceeded → structured 429, no persistence
  // =========================================================================
  it("rejects with RATE_LIMITED and zero persistence when quota is exceeded", async () => {
    await fc.assert(
      fc.asyncProperty(
        validBodyArb,
        resetAtArb,
        async (body, resetAt) => {
          const operation = buildOperationSpy();
          const request = buildRequest("PATCH", body);
          const deps = buildDependencies({
            checkQuota: async () => ({ allowed: false, resetAt }),
          });

          const response = await processPlannerRequest({
            descriptor: securityDescriptor,
            pipelineRequest: { request, pathParams: { id: "proj-001" } },
            dependencies: deps,
            operation,
          });

          const payload = await parseResponse(response);
          expect(response.status).toBe(429);
          expect(payload.success).toBe(false);
          expect(payload.error?.code).toBe("RATE_LIMITED");
          expect(payload.correlationId).toBeTruthy();
          expect(response.headers.get("retry-after")).toBeTruthy();
          expect(operation.invoke).not.toHaveBeenCalled();
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // 11.7: Unsupported method → structured 405 with Allow header, no persistence
  // =========================================================================
  it("rejects with METHOD_NOT_ALLOWED and zero persistence for wrong HTTP methods", async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidMethodArb,
        validBodyArb,
        async (method, body) => {
          const operation = buildOperationSpy();
          const request = buildRequest(method, body);
          const deps = buildDependencies();

          const response = await processPlannerRequest({
            descriptor: securityDescriptor,
            pipelineRequest: { request, pathParams: { id: "proj-001" } },
            dependencies: deps,
            operation,
          });

          const payload = await parseResponse(response);
          expect(response.status).toBe(405);
          expect(payload.success).toBe(false);
          expect(payload.error?.code).toBe("METHOD_NOT_ALLOWED");
          expect(payload.correlationId).toBeTruthy();

          const allow = response.headers.get("allow") ?? "";
          expect(allow).toContain("PATCH");
          expect(allow).toContain("OPTIONS");
          expect(operation.invoke).not.toHaveBeenCalled();
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // 11.2, 11.3: Invalid input → structured 400 with issues, no persistence
  // =========================================================================
  it("rejects with INVALID_REQUEST and zero persistence for invalid body inputs", async () => {
    await fc.assert(
      fc.asyncProperty(invalidBodyArb, async (body) => {
        const operation = buildOperationSpy();
        const request = buildRequest("PATCH", body);
        const deps = buildDependencies();

        const response = await processPlannerRequest({
          descriptor: securityDescriptor,
          pipelineRequest: { request, pathParams: { id: "proj-001" } },
          dependencies: deps,
          operation,
        });

        const payload = await parseResponse(response);
        expect(response.status).toBe(400);
        expect(payload.success).toBe(false);
        expect(payload.error?.code).toBe("INVALID_REQUEST");
        expect(payload.correlationId).toBeTruthy();
        expect(operation.invoke).not.toHaveBeenCalled();
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // 11.2: Missing required path parameter → structured 400, no persistence
  // =========================================================================
  it("rejects with INVALID_REQUEST when required path params are missing", async () => {
    await fc.assert(
      fc.asyncProperty(validBodyArb, async (body) => {
        const operation = buildOperationSpy();
        const request = buildRequest("PATCH", body);
        const deps = buildDependencies();

        // Omit pathParams entirely to trigger "id" required check
        const response = await processPlannerRequest({
          descriptor: securityDescriptor,
          pipelineRequest: { request },
          dependencies: deps,
          operation,
        });

        const payload = await parseResponse(response);
        expect(response.status).toBe(400);
        expect(payload.success).toBe(false);
        expect(payload.error?.code).toBe("INVALID_REQUEST");
        expect(operation.invoke).not.toHaveBeenCalled();
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // 11.2: Missing required header → structured 400, no persistence
  // =========================================================================
  it("rejects with INVALID_REQUEST when required headers are missing", async () => {
    await fc.assert(
      fc.asyncProperty(validBodyArb, async (body) => {
        const operation = buildOperationSpy();
        // Omit content-type and csrf-token headers
        const request = new Request(BASE_URL, {
          method: "PATCH",
          headers: { origin: "https://planner.example" },
          body: JSON.stringify(body),
        });
        const deps = buildDependencies();

        const response = await processPlannerRequest({
          descriptor: securityDescriptor,
          pipelineRequest: { request, pathParams: { id: "proj-001" } },
          dependencies: deps,
          operation,
        });

        const payload = await parseResponse(response);
        expect(response.status).toBe(400);
        expect(payload.success).toBe(false);
        expect(payload.error?.code).toBe("INVALID_REQUEST");
        expect(operation.invoke).not.toHaveBeenCalled();
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // 11.4: Invalid origin → structured 403, no persistence
  // =========================================================================
  it("rejects with ORIGIN_REJECTED and zero persistence for bad origins", async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidOriginArb,
        validBodyArb,
        async (origin, body) => {
          const operation = buildOperationSpy();
          const request = buildRequest("PATCH", body, { origin });
          const deps = buildDependencies({
            verifyOrigin: () => false,
          });

          const response = await processPlannerRequest({
            descriptor: securityDescriptor,
            pipelineRequest: { request, pathParams: { id: "proj-001" } },
            dependencies: deps,
            operation,
          });

          const payload = await parseResponse(response);
          expect(response.status).toBe(403);
          expect(payload.success).toBe(false);
          expect(payload.error?.code).toBe("ORIGIN_REJECTED");
          expect(payload.correlationId).toBeTruthy();
          expect(operation.invoke).not.toHaveBeenCalled();
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // 11.4: Invalid CSRF token → structured 403, no persistence
  // =========================================================================
  it("rejects with CSRF_REJECTED and zero persistence for bad CSRF tokens", async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidCsrfArb,
        validBodyArb,
        async (csrfToken, body) => {
          const operation = buildOperationSpy();
          const request = buildRequest("PATCH", body, { csrfToken });
          const deps = buildDependencies({
            verifyCsrf: async () => false,
          });

          const response = await processPlannerRequest({
            descriptor: securityDescriptor,
            pipelineRequest: { request, pathParams: { id: "proj-001" } },
            dependencies: deps,
            operation,
          });

          const payload = await parseResponse(response);
          expect(response.status).toBe(403);
          expect(payload.success).toBe(false);
          expect(payload.error?.code).toBe("CSRF_REJECTED");
          expect(payload.correlationId).toBeTruthy();
          expect(operation.invoke).not.toHaveBeenCalled();
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // 11.5: No verified session → structured 401, no persistence
  // =========================================================================
  it("rejects with AUTH_REQUIRED and zero persistence when session is absent", async () => {
    await fc.assert(
      fc.asyncProperty(validBodyArb, async (body) => {
        const operation = buildOperationSpy();
        const request = buildRequest("PATCH", body);
        const deps = buildDependencies({
          verifySession: async () => null,
        });

        const response = await processPlannerRequest({
          descriptor: securityDescriptor,
          pipelineRequest: { request, pathParams: { id: "proj-001" } },
          dependencies: deps,
          operation,
        });

        const payload = await parseResponse(response);
        expect(response.status).toBe(401);
        expect(payload.success).toBe(false);
        expect(payload.error?.code).toBe("AUTH_REQUIRED");
        expect(payload.correlationId).toBeTruthy();
        expect(operation.invoke).not.toHaveBeenCalled();
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // 11.5: Owner scope rejected → structured 404, no persistence
  // =========================================================================
  it("rejects with OWNER_SCOPE_REJECTED and zero persistence when owner authorization fails", async () => {
    await fc.assert(
      fc.asyncProperty(
        clientOwnerIdArb,
        validBodyArb,
        async (_clientOwnerId, body) => {
          const operation = buildOperationSpy();
          const request = buildRequest("PATCH", body);
          const deps = buildDependencies({
            authorizeOwnerScope: () => false,
          });

          const response = await processPlannerRequest({
            descriptor: securityDescriptor,
            pipelineRequest: { request, pathParams: { id: "proj-001" } },
            dependencies: deps,
            operation,
          });

          const payload = await parseResponse(response);
          expect(response.status).toBe(404);
          expect(payload.success).toBe(false);
          expect(payload.error?.code).toBe("OWNER_SCOPE_REJECTED");
          expect(payload.correlationId).toBeTruthy();
          expect(operation.invoke).not.toHaveBeenCalled();
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // 11.2: Precondition violations → structured 400, no persistence
  // =========================================================================
  it("rejects with INVALID_REQUEST and zero persistence for precondition failures", async () => {
    const preconditionIssueArb = fc.record({
      path: fc.constantFrom(
        "body.expectedRevision",
        "body.idempotencyKey",
        "body.revision",
      ),
      message: fc.string({ minLength: 5, maxLength: 80 }),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(preconditionIssueArb, { minLength: 1, maxLength: 5 }),
        validBodyArb,
        async (issues, body) => {
          const operation = buildOperationSpy();
          const request = buildRequest("PATCH", body);
          const deps = buildDependencies({
            validateRevisionAndIdempotency: () => issues,
          });

          const response = await processPlannerRequest({
            descriptor: securityDescriptor,
            pipelineRequest: { request, pathParams: { id: "proj-001" } },
            dependencies: deps,
            operation,
          });

          const payload = await parseResponse(response);
          expect(response.status).toBe(400);
          expect(payload.success).toBe(false);
          expect(payload.error?.code).toBe("INVALID_REQUEST");
          expect(payload.correlationId).toBeTruthy();
          expect(operation.invoke).not.toHaveBeenCalled();
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // Combined: Any single rejection stage → structured response, no persistence
  // =========================================================================
  it("returns the documented safe rejection for any single invalid stage and never invokes persistence", async () => {
    const combinedArb = fc.record({
      stage: fc.constantFrom<RejectionStage>(
        "quota",
        "method",
        "input",
        "origin",
        "csrf",
        "session",
        "owner",
        "precondition",
      ),
      name: fc.string({ minLength: 1, maxLength: 80 }),
      revision: fc.integer({ min: 1, max: 1_000_000 }),
      idempotencyKey: fc.stringMatching(/^[A-Za-z0-9._~-]{1,80}$/),
      wrongMethod: invalidMethodArb,
    });

    await fc.assert(
      fc.asyncProperty(combinedArb, async (sample) => {
        const operation = buildOperationSpy();
        const method = sample.stage === "method" ? sample.wrongMethod : "PATCH";
        const body =
          sample.stage === "input"
            ? { name: "" }
            : {
                name: sample.name,
                expectedRevision: sample.revision,
                idempotencyKey: sample.idempotencyKey,
              };

        const request = buildRequest(method, body);
        const deps = buildDependencies({
          checkQuota: async () => ({
            allowed: sample.stage !== "quota",
            resetAt: Date.now() + 10_000,
          }),
          verifyOrigin: () => sample.stage !== "origin",
          verifyCsrf: async () => sample.stage !== "csrf",
          verifySession: async () =>
            sample.stage === "session" ? null : validSession,
          authorizeOwnerScope: () => sample.stage !== "owner",
          validateRevisionAndIdempotency: () =>
            sample.stage === "precondition"
              ? [{ path: "body.expectedRevision", message: "Stale revision" }]
              : [],
        });

        const response = await processPlannerRequest({
          descriptor: securityDescriptor,
          pipelineRequest: { request, pathParams: { id: "proj-001" } },
          dependencies: deps,
          operation,
        });

        const payload = await parseResponse(response);
        const expected = expectedByStage[sample.stage];

        expect(response.status).toBe(expected.status);
        expect(payload.success).toBe(false);
        expect(payload.error?.code).toBe(expected.code);
        expect(typeof payload.correlationId).toBe("string");
        expect(payload.correlationId.length).toBeGreaterThan(0);
        expect(response.headers.get("x-correlation-id")).toBeTruthy();

        if (sample.stage === "method") {
          const allow = response.headers.get("allow") ?? "";
          expect(allow).toContain("PATCH");
          expect(allow).toContain("OPTIONS");
        }
        if (sample.stage === "quota") {
          expect(response.headers.get("retry-after")).toBeTruthy();
        }
        expect(operation.invoke).not.toHaveBeenCalled();
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // Pipeline ordering: earliest rejection takes precedence over later stages
  // =========================================================================
  it("enforces pipeline ordering — an early rejection prevents later stages from running", async () => {
    const stageOrder: RejectionStage[] = [
      "quota",
      "method",
      "input",
      "origin",
      "csrf",
      "session",
      "owner",
      "precondition",
    ];

    const stageIndexArb = fc.integer({
      min: 0,
      max: stageOrder.length - 1,
    });

    await fc.assert(
      fc.asyncProperty(
        stageIndexArb,
        validBodyArb,
        async (stageIdx, body) => {
          const failingStage = stageOrder[stageIdx]!;
          const operation = buildOperationSpy();

          // Track which dependency functions were called
          const called: Set<string> = new Set();

          const method = failingStage === "method" ? "PUT" : "PATCH";
          const requestBody = failingStage === "input" ? { name: "" } : body;
          const request = buildRequest(method, requestBody);

          const deps = buildDependencies({
            checkQuota: async () => {
              called.add("quota");
              return {
                allowed: failingStage !== "quota",
                resetAt: Date.now() + 10_000,
              };
            },
            verifyOrigin: () => {
              called.add("origin");
              return failingStage !== "origin";
            },
            verifyCsrf: async () => {
              called.add("csrf");
              return failingStage !== "csrf";
            },
            verifySession: async () => {
              called.add("session");
              return failingStage === "session" ? null : validSession;
            },
            authorizeOwnerScope: () => {
              called.add("owner");
              return failingStage !== "owner";
            },
            validateRevisionAndIdempotency: () => {
              called.add("precondition");
              return failingStage === "precondition"
                ? [{ path: "body.revision", message: "Fail" }]
                : [];
            },
          });

          const response = await processPlannerRequest({
            descriptor: securityDescriptor,
            pipelineRequest: { request, pathParams: { id: "proj-001" } },
            dependencies: deps,
            operation,
          });

          const payload = await parseResponse(response);
          const expected = expectedByStage[failingStage];

          // Correct status and code
          expect(response.status).toBe(expected.status);
          expect(payload.error?.code).toBe(expected.code);
          expect(operation.invoke).not.toHaveBeenCalled();

          // Later dependency-backed stages must not have been called.
          // Note: "method" and "input" are checked inline (no dependency fn),
          // so we only verify dependency-backed stages after the failing one.
          const dependencyStages: RejectionStage[] = [
            "quota",
            "origin",
            "csrf",
            "session",
            "owner",
            "precondition",
          ];
          const failIdx = dependencyStages.indexOf(failingStage);
          if (failIdx >= 0) {
            for (let i = failIdx + 1; i < dependencyStages.length; i++) {
              const laterStage = dependencyStages[i]!;
              expect(called.has(laterStage)).toBe(false);
            }
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // =========================================================================
  // Structured response invariant: every rejection has required shape
  // =========================================================================
  it("every rejection response has success:false, an error code, a message, and a correlation id", async () => {
    const stageArb = fc.constantFrom<RejectionStage>(
      "quota",
      "method",
      "input",
      "origin",
      "csrf",
      "session",
      "owner",
      "precondition",
    );

    await fc.assert(
      fc.asyncProperty(stageArb, validBodyArb, async (stage, body) => {
        const operation = buildOperationSpy();
        const method = stage === "method" ? "DELETE" : "PATCH";
        const requestBody = stage === "input" ? {} : body;
        const request = buildRequest(method, requestBody);

        const deps = buildDependencies({
          checkQuota: async () => ({
            allowed: stage !== "quota",
            resetAt: Date.now() + 10_000,
          }),
          verifyOrigin: () => stage !== "origin",
          verifyCsrf: async () => stage !== "csrf",
          verifySession: async () =>
            stage === "session" ? null : validSession,
          authorizeOwnerScope: () => stage !== "owner",
          validateRevisionAndIdempotency: () =>
            stage === "precondition"
              ? [{ path: "body.revision", message: "Precondition fail" }]
              : [],
        });

        const response = await processPlannerRequest({
          descriptor: securityDescriptor,
          pipelineRequest: { request, pathParams: { id: "proj-001" } },
          dependencies: deps,
          operation,
        });

        const payload = await parseResponse(response);

        // Structural invariants for ALL rejection responses
        expect(payload.success).toBe(false);
        expect(payload.error).toBeDefined();
        expect(typeof payload.error?.code).toBe("string");
        expect(payload.error!.code.length).toBeGreaterThan(0);
        expect(typeof payload.correlationId).toBe("string");
        expect(payload.correlationId.length).toBeGreaterThan(0);
        expect(response.headers.get("x-correlation-id")).toBe(
          payload.correlationId,
        );
        expect(response.headers.get("x-planner-contract-version")).toBe("1");
        expect(operation.invoke).not.toHaveBeenCalled();
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });
});
