// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 16: Security checks precede persistence
// Built-in project mutation preconditions are rejected before the W2 operation port.
//
// **Validates: Requirements 11.2, 11.6, 11.7**

import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";

import { PLANNER_ENDPOINT_DESCRIPTORS } from "@planner/lib/plannerEndpointContract";
import {
  processPlannerRequest,
  type PlannerRequestPipelineDependencies,
} from "@planner/lib/plannerRequestPipeline";

const descriptor = PLANNER_ENDPOINT_DESCRIPTORS.find(
  (candidate) => candidate.id === "planner.projects.create",
);

const invalidPreconditionArbitrary = fc.oneof(
  fc.integer({ min: 1, max: 1_000_000 }).map((expectedRevision) => ({
    expectedRevision,
    idempotencyKey: "valid-key-0001",
  })),
  fc.double({ min: 0.1, max: 100, noNaN: true }).map((expectedRevision) => ({
    expectedRevision,
    idempotencyKey: "valid-key-0001",
  })),
  fc.string({ minLength: 1, maxLength: 60 }).map((fragment) => ({
    expectedRevision: 0,
    idempotencyKey: `invalid/${fragment}`,
  })),
);

const dependencies: PlannerRequestPipelineDependencies = {
  checkQuota: async () => ({ allowed: true, resetAt: Date.now() + 60_000 }),
  verifyOrigin: () => true,
  verifyCsrf: async () => true,
  verifySession: async () => ({ ownerId: "verified-owner", isAdmin: false }),
  authorizeOwnerScope: ({ ownerScope }) =>
    ownerScope?.ownerId === "verified-owner" &&
    ownerScope.source === "verified-server-session",
  validateRevisionAndIdempotency: () => [],
  generateCorrelationId: () => "corr-precondition-0001",
};

describe("Property 16: Planner mutation preconditions precede persistence", () => {
  it("rejects invalid revision/idempotency values without invoking the W2 port", async () => {
    expect(descriptor).toBeDefined();
    await fc.assert(
      fc.asyncProperty(invalidPreconditionArbitrary, async (preconditions) => {
        const operation = { invoke: vi.fn() };
        const request = new Request("https://planner.example/api/Planner/projects", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": "csrf-token",
            cookie: "session=verified",
            origin: "https://planner.example",
          },
          body: JSON.stringify({ name: "Project", ...preconditions }),
        });
        const response = await processPlannerRequest({
          descriptor: descriptor!,
          pipelineRequest: { request },
          dependencies,
          operation,
        });
        const body = (await response.json()) as {
          error: { code: string };
          correlationId: string;
        };
        expect(response.status).toBe(400);
        expect(body.error.code).toBe("INVALID_REQUEST");
        expect(body.correlationId).toBe("corr-precondition-0001");
        expect(operation.invoke).not.toHaveBeenCalled();
      }),
      { numRuns: 100, seed: 20260844 },
    );
  });
});
