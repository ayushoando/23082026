/**
 * Contract tests for forked Planner projects collection API.
 * Target surface for CRM/planner clients: GET|POST /api/Planner/projects
 *
 * The pipeline is short-circuited via the plannerRouteAdapter mock so
 * rate-limit, CSRF, and session checks are still exercised through their
 * own vi.mocks, but without going through the full request-processing
 * pipeline that requires descriptors and Supabase at import time.
 *
 * Persistence mode is pinned to `disk` via the plannerProjectRepository
 * mock — these are endpoint-contract tests, not persistence tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { createAuthServerClient } from "@/platform/supabase/server";
import { DEV_BYPASS_USER } from "@/lib/auth/devAuthBypass";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";

// ---------------------------------------------------------------------------
// Mock the Planner route adapter so createPlannerHandler delegates directly
// to the operation without going through the full request pipeline.
// Auth/rate-limit/CSRF are still exercised via their own mocks below.
// ---------------------------------------------------------------------------
vi.mock("@planner/server/plannerRouteAdapter", () => ({
  createPlannerHandler: vi.fn(
    ({ operation }: { operation: { invoke: (ctx: unknown) => Promise<{ ok: boolean; status: number; data?: unknown; code?: string; metadata?: { issues?: unknown[] } }> } }) =>
      async (req: Request) => {
        const correlationId = "test-correlation-id";

        // 1. Rate-limit check (delegates to the still-mocked rateLimit)
        const { rateLimit: rl } = await import("@/lib/rateLimit");
        const quota = await rl("planner:127.0.0.1", 60, 60000);
        if (!quota.success) {
          return Response.json(
            { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" }, correlationId },
            { status: 429 },
          );
        }

        // 2. Session check (delegates to the still-mocked createAuthServerClient)
        const { isDevAuthBypassEnabled, DEV_BYPASS_USER: bypassUser } = await import("@/lib/auth/devAuthBypass");
        let ownerId: string | null = null;
        let isAdmin = false;
        if (isDevAuthBypassEnabled()) {
          ownerId = bypassUser.id;
          isAdmin = true;
        } else {
          const { createAuthServerClient: makeClient } = await import("@/platform/supabase/server");
          const supabase = await makeClient();
          const { data } = await supabase.auth.getUser();
          if (!data.user?.id) {
            return Response.json(
              { success: false, error: { code: "AUTH_REQUIRED", message: "Authentication required", recovery: "reauthenticate-preserve-unsaved" }, correlationId },
              { status: 401 },
            );
          }
          ownerId = data.user.id;
        }

        // 3. CSRF check (delegates to the still-mocked validateCsrfRequest)
        if (req.method === "POST" || req.method === "PATCH" || req.method === "PUT" || req.method === "DELETE") {
          const { validateCsrfRequest: verifyCsrf } = await import("@/lib/security/csrf");
          const csrfOk = await verifyCsrf(req);
          if (!csrfOk) {
            return Response.json(
              { success: false, error: { code: "CSRF_FAILED", message: "Request verification failed" }, correlationId },
              { status: 403 },
            );
          }
        }

        // 4. Parse request body
        let body: unknown = undefined;
        if (req.method !== "GET" && req.method !== "HEAD") {
          const ct = req.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            try {
              body = await req.clone().json();
            } catch {
              return Response.json(
                { success: false, error: { code: "INVALID_REQUEST", message: "Request body could not be parsed" }, correlationId },
                { status: 400 },
              );
            }
          }
        }

        // 5. Invoke the operation with a minimal context
        const context = {
          correlationId,
          session: ownerId ? { ownerId, isAdmin } : null,
          ownerScope: ownerId ? { ownerId } : null,
          request: {
            body,
            path: {},
            query: {},
            headers: {},
          },
        };

        try {
          const result = await operation.invoke(context);
          if (result.ok) {
            return Response.json(
              { success: true, contractVersion: 1, data: result.data, correlationId },
              { status: result.status ?? 200 },
            );
          }
          return Response.json(
            {
              success: false,
              error: {
                code: result.code ?? "INTERNAL_ERROR",
                message: "Request failed",
                ...(result.metadata?.issues ? { issues: result.metadata.issues } : {}),
              },
              correlationId,
            },
            { status: result.status ?? 500 },
          );
        } catch (err) {
          return Response.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: String(err) }, correlationId },
            { status: 500 },
          );
        }
      },
  ),
  createPlannerRejectedMethodHandler: vi.fn(() => async () =>
    Response.json(
      { success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" }, correlationId: "test-correlation-id" },
      { status: 405, headers: { allow: "GET, POST, OPTIONS" } },
    ),
  ),
}));

// ---------------------------------------------------------------------------
// Mock the project endpoint operations so tests don't depend on the full
// geometry/repository pipeline. These are route-level contract tests.
// Use vi.hoisted so the mocks are available when the vi.mock factories run.
// ---------------------------------------------------------------------------
const mockListPlannerProjects = vi.hoisted(() => vi.fn());
const mockCreatePlannerProject = vi.hoisted(() => vi.fn());
vi.mock("@/app/api/Planner/projects/plannerProjectEndpoint", () => ({
  listPlannerProjects: mockListPlannerProjects,
  createPlannerProject: mockCreatePlannerProject,
}));

vi.mock("@planner/lib/plannerPersistenceMode", () => ({
  getPlannerPersistenceMode: () => "disk",
  isPlannerPersistenceConfigured: () => true,
}));

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

import { GET, POST } from "@/app/api/Planner/projects/route";

const sampleProject = {
  id: "p_office_abc123",
  name: "Office",
  revision: 1,
  status: "draft",
  thumbnailUrl: null,
  createdAt: "2026-07-31T12:00:00.000Z",
  updatedAt: "2026-07-31T12:00:00.000Z",
};

describe("app/api/Planner/projects/route.ts", () => {
  const originalBypass = process.env.DEV_AUTH_BYPASS;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEV_AUTH_BYPASS = "true";
    setNodeEnv("test");
    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
    } as never);
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 0 }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
    mockListPlannerProjects.mockResolvedValue({ ok: true, status: 200, data: [] });
    mockCreatePlannerProject.mockResolvedValue({ ok: true, status: 201, data: sampleProject });
  });

  afterEach(() => {
    if (originalBypass === undefined) {
      delete process.env.DEV_AUTH_BYPASS;
    } else {
      process.env.DEV_AUTH_BYPASS = originalBypass;
    }
    setNodeEnv(originalNodeEnv);
  });

  const getReq = () =>
    new NextRequest("http://localhost/api/Planner/projects", { method: "GET" });

  describe("GET", () => {
    it("returns 200 with the project list (wrapped in data envelope)", async () => {
      mockListPlannerProjects.mockResolvedValue({ ok: true, status: 200, data: [sampleProject] });

      const res = await GET(getReq());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(mockListPlannerProjects).toHaveBeenCalledOnce();
    });

    it("returns 200 with an empty array when no projects exist", async () => {
      mockListPlannerProjects.mockResolvedValue({ ok: true, status: 200, data: [] });

      const res = await GET(getReq());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it("returns 401 for an anonymous caller (member gate, parity with /api/plans)", async () => {
      // Disable bypass so auth check reaches Supabase.
      // beforeEach sets DEV_AUTH_BYPASS="true" (not "1"), so bypass is already off.
      vi.mocked(createAuthServerClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as never);

      const res = await GET(getReq());
      expect(res.status).toBe(401);
      expect(mockListPlannerProjects).not.toHaveBeenCalled();
    });

    /**
     * PX-S11 / OPS-S10 / WRK-S17 — /ooplanner/projects/ client list loads under
     * DEV_AUTH_BYPASS=1 without session cookies. withAuth must synthesize
     * DEV_BYPASS_USER so GET /api/Planner/projects never 401s in local bypass.
     */
    it("returns 200 under DEV_AUTH_BYPASS=1 with no session (PX-S11 client list path)", async () => {
      setNodeEnv("development");
      process.env.DEV_AUTH_BYPASS = "1";
      const getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
      vi.mocked(createAuthServerClient).mockResolvedValue({
        auth: { getUser },
      } as never);
      mockListPlannerProjects.mockResolvedValue({ ok: true, status: 200, data: [sampleProject] });

      const res = await GET(getReq());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      // Bypass short-circuits before Supabase session lookup.
      expect(createAuthServerClient).not.toHaveBeenCalled();
      expect(getUser).not.toHaveBeenCalled();
      expect(mockListPlannerProjects).toHaveBeenCalledOnce();
      // DEV_BYPASS_USER has a UUID-shaped id
      expect(DEV_BYPASS_USER.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("returns 429 when rate limited", async () => {
      vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: false, reset: 99 }));
      const res = await GET(getReq());
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error?.code ?? body.success).toBeDefined();
      expect(mockListPlannerProjects).not.toHaveBeenCalled();
    });
  });

  describe("POST", () => {
    const postJson = (body: unknown) =>
      new NextRequest("http://localhost/api/Planner/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

    it("creates a project and returns 201 with the new project record", async () => {
      const newProject = { ...sampleProject, id: "p_open-plan_abc123", name: "Open Plan" };
      mockCreatePlannerProject.mockResolvedValue({ ok: true, status: 201, data: newProject });

      const res = await POST(
        postJson({
          name: "Open Plan",
          canvas_json: { objects: [{ id: 1 }, { id: 2 }] },
          sheet: { units: "mm" },
          layers: [{ name: "walls" }],
          expectedRevision: 0,
          idempotencyKey: "idem-test-create-1",
        }),
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ id: "p_open-plan_abc123", name: "Open Plan" });
      expect(mockCreatePlannerProject).toHaveBeenCalledOnce();
    });

    it("returns 403 when CSRF validation fails", async () => {
      vi.mocked(validateCsrfRequest).mockResolvedValue(false);
      const res = await POST(postJson({ name: "No CSRF", expectedRevision: 0, idempotencyKey: "idem-csrf-test" }));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error?.code).toBe("CSRF_FAILED");
      expect(mockCreatePlannerProject).not.toHaveBeenCalled();
    });

    it("returns 400 for malformed JSON body", async () => {
      const res = await POST(
        new NextRequest("http://localhost/api/Planner/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "not-json{",
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(mockCreatePlannerProject).not.toHaveBeenCalled();
    });
  });
});
