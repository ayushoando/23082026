// @vitest-environment node
//
// Task 4.3: Server-derived owner scope and session-expiry handling
//
// Unit tests for:
// - detectClientOwnerIdentifiers (Req 10.7)
// - authorizeOwnerScope rejecting client owner IDs (Req 10.7)
// - Session expiry handoff contract (Req 10.8)
// - Owner scope derivation from server session (Req 10.3–10.6)
// - Non-disclosing item policy (Req 10.6)
// - Pipeline auth → owner scope ordering (Req 11.5)
//
// **Validates: Requirements 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 11.5**

import { describe, expect, it, vi } from "vitest";

import {
  CLIENT_OWNER_IDENTIFIER_KEYS,
  PLANNER_ITEM_OWNER_POLICY,
  PLANNER_SESSION_EXPIRY_RECOVERY,
  derivePlannerOwnerScope,
  detectClientOwnerIdentifiers,
  findPlannerOwnedRecord,
  isPlannerSessionExpiryResponse,
  listPlannerOwnedRecords,
  type PlannerSessionExpiryHandoff,
} from "@planner/lib/plannerOwnerScope";
import type { PlannerEndpointDescriptor } from "@planner/lib/plannerEndpointContract";
import {
  processPlannerRequest,
  type PlannerRequestPipelineDependencies,
  type PlannerValidatedRequest,
} from "@planner/lib/plannerRequestPipeline";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function memberDescriptor(
  ownerPolicy: PlannerEndpointDescriptor["security"]["owner"] = "authenticated-owner-list",
): PlannerEndpointDescriptor {
  return {
    id: "planner.test.owner-scope",
    contractVersion: 1,
    method: "GET",
    path: "/api/Planner/projects",
    request: {
      path: [],
      query: [],
      headers: [],
      body: { type: "none" },
      contentType: "none",
    },
    responses: {
      success: [
        {
          status: 200,
          envelope: "planner-v1",
          schema: { type: "unknown", description: "Test" },
          description: "Test OK",
        },
      ],
      errors: [],
    },
    security: {
      auth: "member",
      owner: ownerPolicy,
      csrf: "not-required",
      origin: "same-site-cookie",
    },
    rateLimit: {
      scope: "test",
      requests: 100,
      windowMs: 60_000,
      key: "normalized-client-ip",
    },
    compatibility: {
      preferredResponse: "planner-v1",
      acceptedResponses: ["planner-v1", "legacy"],
    },
  };
}

function mutationDescriptor(): PlannerEndpointDescriptor {
  return {
    ...memberDescriptor("server-derived-creator"),
    id: "planner.test.create",
    method: "POST",
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
          expectedRevision: { type: "number", minimum: 0, finite: true },
          idempotencyKey: { type: "string", minLength: 1, maxLength: 120 },
        },
        additionalProperties: false,
      },
      contentType: "application/json",
    },
    security: {
      auth: "member",
      owner: "server-derived-creator",
      csrf: "double-submit-cookie",
      origin: "same-site-cookie-and-csrf",
    },
  };
}

interface OwnedFixture {
  id: string;
  ownerId: string;
  data: string;
}

function passThroughDeps(
  overrides: Partial<PlannerRequestPipelineDependencies> = {},
): PlannerRequestPipelineDependencies {
  return {
    checkQuota: async () => ({ allowed: true, resetAt: Date.now() + 60_000 }),
    verifyOrigin: () => true,
    verifyCsrf: async () => true,
    verifySession: async () => ({
      ownerId: "server-owner-123",
      isAdmin: false,
    }),
    authorizeOwnerScope: () => true,
    validateRevisionAndIdempotency: () => [],
    generateCorrelationId: () => "corr-test-0001",
    now: () => 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Task 4.3: Server-derived owner scope and session-expiry handling", () => {
  // -----------------------------------------------------------------------
  // Req 10.7: detectClientOwnerIdentifiers
  // -----------------------------------------------------------------------
  describe("detectClientOwnerIdentifiers (Req 10.7)", () => {
    it("returns empty for clean payloads with no owner fields", () => {
      expect(detectClientOwnerIdentifiers({ name: "Plan A" })).toEqual([]);
      expect(detectClientOwnerIdentifiers({})).toEqual([]);
    });

    it.each(CLIENT_OWNER_IDENTIFIER_KEYS)(
      "detects client-supplied %s field",
      (key) => {
        const body = { name: "Plan A", [key]: "attacker-id" };
        const detected = detectClientOwnerIdentifiers(body);
        expect(detected).toContain(key);
      },
    );

    it("detects multiple client owner fields at once", () => {
      const body = {
        name: "Plan",
        user_id: "u1",
        ownerId: "u2",
        owner_id: "u3",
      };
      const detected = detectClientOwnerIdentifiers(body);
      expect(detected).toContain("user_id");
      expect(detected).toContain("ownerId");
      expect(detected).toContain("owner_id");
    });

    it("ignores null and undefined values", () => {
      const body = { user_id: null, ownerId: undefined };
      expect(detectClientOwnerIdentifiers(body)).toEqual([]);
    });

    it("handles non-object inputs gracefully", () => {
      expect(detectClientOwnerIdentifiers(null)).toEqual([]);
      expect(detectClientOwnerIdentifiers(undefined)).toEqual([]);
      expect(detectClientOwnerIdentifiers("string")).toEqual([]);
      expect(detectClientOwnerIdentifiers(42)).toEqual([]);
      expect(detectClientOwnerIdentifiers([{ user_id: "x" }])).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Req 10.3, 10.5, 11.5: Guest → project op requires auth
  // -----------------------------------------------------------------------
  describe("Guest project operation requires authentication (Req 10.3, 11.5)", () => {
    it("returns 401 with recovery hint when session is null", async () => {
      const operation = { invoke: vi.fn() };
      const request = new Request("https://app.example/api/Planner/projects", {
        method: "GET",
      });
      const deps = passThroughDeps({
        verifySession: async () => null,
      });
      const response = await processPlannerRequest({
        descriptor: memberDescriptor(),
        pipelineRequest: { request },
        dependencies: deps,
        operation,
      });
      const payload = (await response.json()) as {
        success: boolean;
        error: { code: string; recovery?: string };
        correlationId: string;
      };
      expect(response.status).toBe(401);
      expect(payload.error.code).toBe("AUTH_REQUIRED");
      expect(payload.error.recovery).toBe(
        PLANNER_SESSION_EXPIRY_RECOVERY,
      );
      expect(operation.invoke).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Req 10.4: List returns only owned records
  // -----------------------------------------------------------------------
  describe("listPlannerOwnedRecords (Req 10.4)", () => {
    it("filters records to the server-derived owner", () => {
      const records: OwnedFixture[] = [
        { id: "p1", ownerId: "alice", data: "plan1" },
        { id: "p2", ownerId: "bob", data: "plan2" },
        { id: "p3", ownerId: "alice", data: "plan3" },
      ];
      const scope = derivePlannerOwnerScope({ ownerId: "alice" });
      const result = listPlannerOwnedRecords(records, scope);
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.ownerId === "alice")).toBe(true);
    });

    it("returns empty array when no records belong to the owner", () => {
      const records: OwnedFixture[] = [
        { id: "p1", ownerId: "bob", data: "plan1" },
      ];
      const scope = derivePlannerOwnerScope({ ownerId: "alice" });
      expect(listPlannerOwnedRecords(records, scope)).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Req 10.6: Non-disclosing item policy
  // -----------------------------------------------------------------------
  describe("findPlannerOwnedRecord non-disclosing policy (Req 10.6)", () => {
    const records: OwnedFixture[] = [
      { id: "p1", ownerId: "alice", data: "plan1" },
      { id: "p2", ownerId: "bob", data: "plan2" },
    ];

    it("returns owned record", () => {
      const scope = derivePlannerOwnerScope({ ownerId: "alice" });
      const result = findPlannerOwnedRecord(
        records,
        "p1",
        scope,
        (r) => r.id,
      );
      expect(result?.id).toBe("p1");
    });

    it("returns null for cross-owner access — indistinguishable from absent", () => {
      const scope = derivePlannerOwnerScope({ ownerId: "alice" });
      const crossOwner = findPlannerOwnedRecord(
        records,
        "p2",
        scope,
        (r) => r.id,
      );
      const absent = findPlannerOwnedRecord(
        records,
        "nonexistent",
        scope,
        (r) => r.id,
      );
      expect(crossOwner).toBeNull();
      expect(absent).toBeNull();
      // Both return null — deliberately non-disclosing
    });

    it("documents the non-disclosing-not-found policy constant", () => {
      expect(PLANNER_ITEM_OWNER_POLICY).toBe("non-disclosing-not-found");
    });
  });

  // -----------------------------------------------------------------------
  // Req 10.7: Server-session derivation, client IDs rejected
  // -----------------------------------------------------------------------
  describe("derivePlannerOwnerScope (Req 10.7)", () => {
    it("derives scope from server session only", () => {
      const scope = derivePlannerOwnerScope({ ownerId: "server-user-123" });
      expect(scope).toEqual({
        ownerId: "server-user-123",
        source: "verified-server-session",
      });
    });

    it("scope source is always 'verified-server-session'", () => {
      const scope = derivePlannerOwnerScope({ ownerId: "any-id" });
      expect(scope.source).toBe("verified-server-session");
    });
  });

  // -----------------------------------------------------------------------
  // Req 10.7: Pipeline rejects client-supplied owner IDs
  // -----------------------------------------------------------------------
  describe("Pipeline rejects client owner identifiers (Req 10.7)", () => {
    it("returns OWNER_SCOPE_REJECTED when body contains user_id", async () => {
      const operation = { invoke: vi.fn() };
      const request = new Request("https://app.example/api/Planner/projects", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": "csrf-token",
          origin: "https://app.example",
        },
        body: JSON.stringify({
          name: "My Plan",
          expectedRevision: 0,
          idempotencyKey: "key-123",
          user_id: "attacker-supplied-id",
        }),
      });

      // Allow additionalProperties so user_id passes schema validation
      const descriptor: PlannerEndpointDescriptor = {
        ...mutationDescriptor(),
        request: {
          ...mutationDescriptor().request,
          body: {
            type: "object",
            required: ["name", "expectedRevision", "idempotencyKey"],
            properties: {
              name: { type: "string", minLength: 1, maxLength: 120 },
              expectedRevision: { type: "number", minimum: 0, finite: true },
              idempotencyKey: { type: "string", minLength: 1, maxLength: 120 },
              user_id: { type: "string" },
            },
            additionalProperties: true,
          },
        },
      };

      // authorizeOwnerScope should reject because body contains user_id
      const deps = passThroughDeps({
        authorizeOwnerScope: ({ request: validatedReq }) => {
          // Reproduce the real authorizeOwnerScope behavior
          if (validatedReq) {
            const clientKeys = detectClientOwnerIdentifiers(
              validatedReq.body,
            );
            if (clientKeys.length > 0) return false;
          }
          return true;
        },
      });

      const response = await processPlannerRequest({
        descriptor,
        pipelineRequest: { request },
        dependencies: deps,
        operation,
      });
      const payload = (await response.json()) as {
        success: boolean;
        error: { code: string };
      };
      expect(response.status).toBe(404);
      expect(payload.error.code).toBe("OWNER_SCOPE_REJECTED");
      expect(operation.invoke).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Req 10.8: Session expiry handoff contract
  // -----------------------------------------------------------------------
  describe("Session expiry handoff contract (Req 10.8)", () => {
    it("PLANNER_SESSION_EXPIRY_RECOVERY is the documented value", () => {
      expect(PLANNER_SESSION_EXPIRY_RECOVERY).toBe(
        "reauthenticate-preserve-unsaved",
      );
    });

    it("isPlannerSessionExpiryResponse detects valid handoff", () => {
      const response: PlannerSessionExpiryHandoff = {
        code: "AUTH_REQUIRED",
        recovery: "reauthenticate-preserve-unsaved",
        correlationId: "corr-123",
      };
      expect(isPlannerSessionExpiryResponse(response)).toBe(true);
    });

    it("isPlannerSessionExpiryResponse rejects non-expiry errors", () => {
      expect(
        isPlannerSessionExpiryResponse({
          code: "NOT_FOUND",
          recovery: undefined,
        }),
      ).toBe(false);
      expect(
        isPlannerSessionExpiryResponse({
          code: "AUTH_REQUIRED",
          recovery: "other",
        }),
      ).toBe(false);
      expect(
        isPlannerSessionExpiryResponse({
          code: "INTERNAL_ERROR",
        }),
      ).toBe(false);
    });

    it("pipeline returns recovery hint on session expiry", async () => {
      const operation = { invoke: vi.fn() };
      const request = new Request("https://app.example/api/Planner/projects", {
        method: "GET",
      });
      const deps = passThroughDeps({
        verifySession: async () => null,
      });
      const response = await processPlannerRequest({
        descriptor: memberDescriptor(),
        pipelineRequest: { request },
        dependencies: deps,
        operation,
      });
      const payload = (await response.json()) as {
        success: boolean;
        error: { code: string; recovery: string };
        correlationId: string;
      };

      expect(isPlannerSessionExpiryResponse({
        code: payload.error.code,
        recovery: payload.error.recovery,
        correlationId: payload.correlationId,
      })).toBe(true);
      expect(operation.invoke).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Req 10.5, 11.5: Owner scope verified server-side before persistence
  // -----------------------------------------------------------------------
  describe("Owner scope verified before persistence (Req 10.5, 11.5)", () => {
    it("operation receives server-derived ownerScope, not client data", async () => {
      let capturedContext: {
        ownerScope: { ownerId: string; source: string } | null;
      } | null = null;

      const operation = {
        invoke: vi.fn(async (ctx: unknown) => {
          capturedContext = ctx as typeof capturedContext;
          return { ok: true as const, status: 200, data: { projects: [] } };
        }),
      };
      const request = new Request("https://app.example/api/Planner/projects", {
        method: "GET",
      });
      const deps = passThroughDeps();

      await processPlannerRequest({
        descriptor: memberDescriptor(),
        pipelineRequest: { request },
        dependencies: deps,
        operation,
      });

      expect(operation.invoke).toHaveBeenCalledOnce();
      expect(capturedContext?.ownerScope).toEqual({
        ownerId: "server-owner-123",
        source: "verified-server-session",
      });
    });

    it("rejects with 404 when owner scope cannot be derived", async () => {
      const operation = { invoke: vi.fn() };
      const request = new Request("https://app.example/api/Planner/projects", {
        method: "GET",
      });
      const deps = passThroughDeps({
        authorizeOwnerScope: () => false,
      });

      const response = await processPlannerRequest({
        descriptor: memberDescriptor(),
        pipelineRequest: { request },
        dependencies: deps,
        operation,
      });
      const payload = (await response.json()) as {
        error: { code: string };
      };
      expect(response.status).toBe(404);
      expect(payload.error.code).toBe("OWNER_SCOPE_REJECTED");
      expect(operation.invoke).not.toHaveBeenCalled();
    });
  });
});
