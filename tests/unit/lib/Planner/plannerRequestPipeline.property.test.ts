// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 16: Security checks precede persistence
//
// **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6, 11.7**

import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";

import type { PlannerEndpointDescriptor } from "@planner/lib/plannerEndpointContract";
import {
  processPlannerRequest,
  type PlannerRequestPipelineDependencies,
} from "@planner/lib/plannerRequestPipeline";

const PROPERTY_RUNS = 120;
const PROPERTY_SEED = 20260843;

type RejectionStage =
  | "quota"
  | "method"
  | "input"
  | "origin"
  | "csrf"
  | "session"
  | "owner"
  | "precondition";

const descriptor: PlannerEndpointDescriptor = {
  id: "planner.property.update",
  contractVersion: 1,
  method: "POST",
  path: "/api/Planner/projects",
  request: {
    path: [],
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
    owner: "server-derived-creator",
    csrf: "double-submit-cookie",
    origin: "same-site-cookie-and-csrf",
  },
  rateLimit: {
    scope: "planner-property:post",
    requests: 10,
    windowMs: 60_000,
    key: "normalized-client-ip",
  },
  compatibility: {
    preferredResponse: "planner-v1",
    acceptedResponses: ["planner-v1", "legacy"],
  },
};

const expectedByStage: Readonly<
  Record<RejectionStage, { status: number; code: string }>
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

const rejectionArbitrary = fc.record({
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
});

describe("Property 16: Security checks precede persistence", () => {
  it("returns the documented safe rejection and never invokes the operation port", async () => {
    await fc.assert(
      fc.asyncProperty(rejectionArbitrary, async (sample) => {
        const operation = { invoke: vi.fn() };
        const method = sample.stage === "method" ? "PUT" : "POST";
        const request = new Request("https://planner.example/api/Planner/projects", {
          method,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "x-csrf-token": "csrf-token",
            origin: "https://planner.example",
          },
          body: JSON.stringify(
            sample.stage === "input"
              ? { name: "" }
              : {
                  name: sample.name,
                  expectedRevision: sample.revision,
                  idempotencyKey: sample.idempotencyKey,
                },
          ),
        });
        const dependencies: PlannerRequestPipelineDependencies = {
          checkQuota: async () => ({
            allowed: sample.stage !== "quota",
            resetAt: Date.now() + 10_000,
          }),
          verifyOrigin: () => sample.stage !== "origin",
          verifyCsrf: async () => sample.stage !== "csrf",
          verifySession: async () =>
            sample.stage === "session"
              ? null
              : { ownerId: "verified-owner", isAdmin: false },
          authorizeOwnerScope: () => sample.stage !== "owner",
          validateRevisionAndIdempotency: () =>
            sample.stage === "precondition"
              ? [{ path: "body.expectedRevision", message: "Invalid precondition" }]
              : [],
          generateCorrelationId: () => "corr-property-0001",
          now: () => 0,
        };

        const response = await processPlannerRequest({
          descriptor,
          pipelineRequest: { request },
          dependencies,
          operation,
        });
        const payload = (await response.json()) as {
          success: boolean;
          error: { code: string };
          correlationId: string;
        };
        const expected = expectedByStage[sample.stage];

        expect(response.status).toBe(expected.status);
        expect(payload.success).toBe(false);
        expect(payload.error.code).toBe(expected.code);
        expect(payload.correlationId).toBe("corr-property-0001");
        expect(response.headers.get("x-correlation-id")).toBe(
          "corr-property-0001",
        );
        if (sample.stage === "method") {
          expect(response.headers.get("allow")).toContain("POST");
          expect(response.headers.get("allow")).toContain("OPTIONS");
        }
        expect(operation.invoke).not.toHaveBeenCalled();
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });
});
