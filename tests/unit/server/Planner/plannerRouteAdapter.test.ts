// @vitest-environment node
//
// Task 4.2: Prove invalid requests cannot invoke a persistence adapter.
//
// Tests that `createPlannerHandler` enforces the designed processing order:
//   correlation → quota → method/validation → origin/CSRF
//   → session → owner scope → revision/idempotency → persistence
//
// Every test injects a spy as the operation port and asserts it is never
// called when a preceding check rejects. Valid requests pass all checks
// and reach the operation port.
//
// **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6, 11.7**

import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import type { PlannerOperationContext } from "@planner/lib/plannerRequestPipeline";

// ---------------------------------------------------------------------------
// Mocks — declared before imports so vi.mock hoisting works correctly
// ---------------------------------------------------------------------------

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user", email: "test@test.com", app_metadata: {} } },
        error: null,
      }),
    },
  }),
}));

vi.mock("@/lib/auth/devAuthBypass", () => ({
  isDevAuthBypassEnabled: vi.fn().mockReturnValue(false),
  DEV_BYPASS_USER: { id: "dev-user", email: "dev@localhost", role: "admin" },
  DEV_AUTH_BYPASS_ENV: "DEV_AUTH_BYPASS",
}));

vi.mock("@/lib/auth/roles", () => ({
  isAppAdmin: vi.fn().mockReturnValue(false),
  readAppRole: vi.fn().mockReturnValue("member"),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({
    success: true,
    remaining: 99,
    limit: 60,
    reset: Date.now() + 60000,
  }),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn().mockResolvedValue(true),
}));

// ---------------------------------------------------------------------------
// Imports (after vi.mock so hoisting applies)
// ---------------------------------------------------------------------------

import {
  createPlannerHandler,
  plannerMethodNotAllowed,
} from "@planner/server/plannerRouteAdapter";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { createAuthServerClient } from "@/platform/supabase/server";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as unknown as NextRequest;
}

function jsonRequest(
  url: string,
  method: string,
  body: unknown,
  extraHeaders?: Record<string, string>,
): NextRequest {
  return makeRequest(url, {
    method,
    headers: {
      "content-type": "application/json",
      "x-csrf-token": "valid-csrf-token",
      cookie: "session=abc",
      origin: "https://example.com",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

function memberGetRequest(
  url: string,
  extraHeaders?: Record<string, string>,
): NextRequest {
  return makeRequest(url, {
    method: "GET",
    headers: {
      cookie: "session=abc",
      origin: "https://example.com",
      ...extraHeaders,
    },
  });
}

const PROJECT_URL = "https://example.com/api/Planner/projects";

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("plannerRouteAdapter — request-processing order enforcement", () => {
  describe("rate-limit rejection (step 2: quota)", () => {
    it("returns 429 and never invokes the operation port", async () => {
      const invoke = vi.fn();
      vi.mocked(rateLimit).mockResolvedValueOnce({
        success: false,
        remaining: 0,
        limit: 60,
        reset: Date.now() + 30_000,
      });

      const handler = createPlannerHandler({
        endpointId: "planner.projects.list",
        operation: { invoke },
      });
      const response = await handler(memberGetRequest(PROJECT_URL));
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RATE_LIMITED");
      expect(body.correlationId).toBeTruthy();
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe("method-not-allowed rejection (step 3: method)", () => {
    it("returns 405 with Allow header and never invokes the operation port", async () => {
      const invoke = vi.fn();

      const handler = createPlannerHandler({
        endpointId: "planner.projects.list",
        operation: { invoke },
      });
      // Send a POST to a GET-only descriptor
      const response = await handler(
        jsonRequest(PROJECT_URL, "POST", { name: "test" }),
      );
      const body = await response.json();

      expect(response.status).toBe(405);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("METHOD_NOT_ALLOWED");
      expect(response.headers.get("allow")).toContain("GET");
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe("validation rejection (step 3: input validation)", () => {
    it("returns 400 with issues and never invokes the operation port for missing required body", async () => {
      const invoke = vi.fn();

      const handler = createPlannerHandler({
        endpointId: "planner.projects.create",
        operation: { invoke },
      });
      // Missing required 'name' field (empty body)
      const response = await handler(
        jsonRequest(PROJECT_URL, "POST", {}),
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_REQUEST");
      expect(body.error.issues).toBeDefined();
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe("origin rejection (step 4: origin/CSRF)", () => {
    it("returns 403 for mismatched origin and never invokes the operation port", async () => {
      const invoke = vi.fn();

      // Use the handoff endpoint (guest auth) with CSRF that requires origin check
      // but does NOT require member-only cookie header in its descriptor's required headers
      const handler = createPlannerHandler({
        endpointId: "planner.handoff.create",
        operation: { invoke },
      });
      // Pass a valid JSON body with all required fields, but from a bad origin
      const response = await handler(
        jsonRequest(
          "https://example.com/api/Planner/handoff",
          "POST",
          {
            contact: { name: "Test User" },
            boq: {
              projectId: "p1",
              projectName: "Room",
              calculationHash: "0".repeat(16),
            },
            idempotencyKey: "key-001",
          },
          { origin: "https://evil.example.com" },
        ),
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("ORIGIN_REJECTED");
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe("CSRF rejection (step 4: CSRF)", () => {
    it("returns 403 for invalid CSRF and never invokes the operation port", async () => {
      const invoke = vi.fn();
      vi.mocked(validateCsrfRequest).mockResolvedValueOnce(false);

      // Use the handoff endpoint (guest auth) so no session check interferes
      const handler = createPlannerHandler({
        endpointId: "planner.handoff.create",
        operation: { invoke },
      });
      const response = await handler(
        jsonRequest(
          "https://example.com/api/Planner/handoff",
          "POST",
          {
            contact: { name: "Test User" },
            boq: {
              projectId: "p1",
              projectName: "Room",
              calculationHash: "0".repeat(16),
            },
            idempotencyKey: "key-001",
          },
        ),
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("CSRF_REJECTED");
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe("session rejection (step 5: verified session)", () => {
    it("returns 401 for missing session and never invokes the operation port", async () => {
      const invoke = vi.fn();
      // Simulate no authenticated user
      vi.mocked(createAuthServerClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as never);

      const handler = createPlannerHandler({
        endpointId: "planner.projects.list",
        operation: { invoke },
      });
      const response = await handler(memberGetRequest(PROJECT_URL));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_REQUIRED");
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe("all checks pass → operation invoked", () => {
    it("invokes the operation port when all checks pass", async () => {
      const invoke = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        data: [{ id: "proj-1", name: "Test" }],
      });

      const handler = createPlannerHandler({
        endpointId: "planner.projects.list",
        operation: { invoke },
      });
      const response = await handler(memberGetRequest(PROJECT_URL));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.correlationId).toBeTruthy();
      expect(invoke).toHaveBeenCalledOnce();

      // Verify the operation context has correlation ID and session
      const ctx: PlannerOperationContext = invoke.mock.calls[0][0];
      expect(ctx.correlationId).toBeTruthy();
      expect(ctx.session).toBeTruthy();
      expect(ctx.session?.ownerId).toBe("test-user");
    });
  });

  describe("405 helper", () => {
    it("returns structured 405 with Allow header", async () => {
      const request = makeRequest(PROJECT_URL, { method: "PUT" });
      const response = plannerMethodNotAllowed(request, ["GET", "POST"]);
      const body = await response.json();

      expect(response.status).toBe(405);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("METHOD_NOT_ALLOWED");
      expect(response.headers.get("allow")).toContain("GET");
      expect(response.headers.get("allow")).toContain("POST");
      expect(response.headers.get("allow")).toContain("OPTIONS");
    });
  });

  describe("correlation id propagation", () => {
    it("returns correlation id in response header and body", async () => {
      const invoke = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        data: [],
      });

      const handler = createPlannerHandler({
        endpointId: "planner.projects.list",
        operation: { invoke },
      });
      const response = await handler(memberGetRequest(PROJECT_URL));
      const body = await response.json();

      expect(response.headers.get("x-correlation-id")).toBeTruthy();
      expect(body.correlationId).toBe(
        response.headers.get("x-correlation-id"),
      );
    });

    it("preserves a valid inbound correlation id", async () => {
      const invoke = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        data: [],
      });

      const handler = createPlannerHandler({
        endpointId: "planner.projects.list",
        operation: { invoke },
      });
      const response = await handler(
        memberGetRequest(PROJECT_URL, {
          "x-correlation-id": "client-req-0001",
        }),
      );
      const body = await response.json();

      expect(response.headers.get("x-correlation-id")).toBe(
        "client-req-0001",
      );
      expect(body.correlationId).toBe("client-req-0001");
    });
  });

  describe("ordered rejection — later checks cannot run after earlier rejection", () => {
    it("quota rejection precedes session check", async () => {
      const invoke = vi.fn();
      vi.mocked(rateLimit).mockResolvedValueOnce({
        success: false,
        remaining: 0,
        limit: 60,
        reset: Date.now() + 30_000,
      });
      // Also simulate missing session — but quota should reject first
      vi.mocked(createAuthServerClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as never);

      const handler = createPlannerHandler({
        endpointId: "planner.projects.list",
        operation: { invoke },
      });
      const response = await handler(memberGetRequest(PROJECT_URL));

      expect(response.status).toBe(429);
      expect(invoke).not.toHaveBeenCalled();
    });

    it("validation rejection precedes CSRF check for mutation endpoints", async () => {
      const invoke = vi.fn();
      // CSRF would fail too, but validation should reject first
      vi.mocked(validateCsrfRequest).mockResolvedValueOnce(false);

      const handler = createPlannerHandler({
        endpointId: "planner.projects.create",
        operation: { invoke },
      });
      // Send invalid body (missing name)
      const response = await handler(
        jsonRequest(PROJECT_URL, "POST", {}),
      );

      expect(response.status).toBe(400);
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe("guest endpoints bypass session requirement", () => {
    it("catalog list succeeds without authentication", async () => {
      const invoke = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        data: [{ id: "item-1", name: "Chair" }],
      });
      // Simulate no session
      vi.mocked(createAuthServerClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as never);

      const handler = createPlannerHandler({
        endpointId: "planner.catalog.list",
        operation: { invoke },
      });
      const response = await handler(
        makeRequest("https://example.com/api/Planner/catalog", {
          method: "GET",
        }),
      );

      expect(response.status).toBe(200);
      expect(invoke).toHaveBeenCalledOnce();
    });
  });
});
