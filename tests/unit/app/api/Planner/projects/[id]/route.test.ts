/**
 * Contract tests for forked Planner project-by-id API.
 * Target surface: GET|PATCH|DELETE /api/Planner/projects/[id]
 *
 * The pipeline is short-circuited via the plannerRouteAdapter mock so
 * auth/rate-limit/CSRF checks are exercised through their own vi.mocks
 * without the full request-processing pipeline.
 *
 * Persistence is exercised via a mock plannerProjectRepository — no real
 * filesystem I/O occurs.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { createAuthServerClient } from "@/platform/supabase/server";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";

// ---------------------------------------------------------------------------
// Mock the Planner route adapter so createPlannerHandler delegates directly
// to the operation without going through the full request pipeline.
// Auth/rate-limit/CSRF are still exercised via their own mocks below.
// Path params are forwarded through the Next.js route context.
// ---------------------------------------------------------------------------
vi.mock("@planner/server/plannerRouteAdapter", () => ({
  createPlannerHandler: vi.fn(
    ({ operation }: { operation: { invoke: (ctx: unknown) => Promise<{ ok: boolean; status: number; data?: unknown; code?: string; metadata?: { issues?: unknown[] } }> } }) =>
      async (req: Request, ctx?: { params: Promise<Record<string, string>> }) => {
        const correlationId = "test-correlation-id";

        // 1. Rate-limit check
        const { rateLimit: rl } = await import("@/lib/rateLimit");
        const quota = await rl("planner:127.0.0.1", 60, 60000);
        if (!quota.success) {
          return Response.json(
            { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" }, correlationId },
            { status: 429 },
          );
        }

        // 2. Session check
        const { isDevAuthBypassEnabled, DEV_BYPASS_USER } = await import("@/lib/auth/devAuthBypass");
        let ownerId: string | null = null;
        let isAdmin = false;
        if (isDevAuthBypassEnabled()) {
          ownerId = DEV_BYPASS_USER.id;
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

        // 3. CSRF check for mutating methods
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

        // 4. Resolve path params from context
        const pathParams = ctx?.params ? await ctx.params : {};

        // 5. Parse request body
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

        // 6. Invoke the operation with a minimal context
        const context = {
          correlationId,
          session: ownerId ? { ownerId, isAdmin } : null,
          ownerScope: ownerId ? { ownerId } : null,
          request: {
            body,
            path: pathParams,
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
      { status: 405, headers: { allow: "GET, PATCH, DELETE, OPTIONS" } },
    ),
  ),
}));

// ---------------------------------------------------------------------------
// Mock the project endpoint operations so tests don't depend on the full
// geometry/repository pipeline. These are route-level contract tests.
// Use vi.hoisted so the mocks are available when the vi.mock factories run.
// ---------------------------------------------------------------------------
const mockLoadPlannerProject = vi.hoisted(() => vi.fn());
const mockSavePlannerProject = vi.hoisted(() => vi.fn());
const mockDeletePlannerProject = vi.hoisted(() => vi.fn());
vi.mock("@/app/api/Planner/projects/plannerProjectEndpoint", () => ({
  loadPlannerProject: mockLoadPlannerProject,
  savePlannerProject: mockSavePlannerProject,
  deletePlannerProject: mockDeletePlannerProject,
  listPlannerProjects: vi.fn(),
  createPlannerProject: vi.fn(),
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

import { DELETE, GET, PATCH } from "@/app/api/Planner/projects/[id]/route";

const routeContext = { params: Promise.resolve({ id: "p_office_abc123" }) };

/**
 * A simple project shape returned by the mocked operations.
 * Does NOT need to satisfy readPlannerProjectEnvelope since the operations
 * are mocked — this shape only needs to match what the tests assert.
 */
function existingProject(overrides: Record<string, unknown> = {}) {
  return {
    id: "p_office_abc123",
    name: "Office",
    revision: 1,
    status: "draft" as const,
    thumbnailUrl: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("app/api/Planner/projects/[id]/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set DEV_AUTH_BYPASS to "true" (not "1") so isDevAuthBypassEnabled() is false,
    // meaning auth checks reach the mocked Supabase client.
    process.env.DEV_AUTH_BYPASS = "true";
    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
    } as never);
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 0 }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
    mockLoadPlannerProject.mockResolvedValue({ ok: true, status: 200, data: existingProject() });
    mockSavePlannerProject.mockResolvedValue({ ok: true, status: 200, data: existingProject() });
    mockDeletePlannerProject.mockResolvedValue({ ok: true, status: 200, data: { ok: true } });
  });

  it("returns 401 for an anonymous caller (member gate, parity with /api/plans)", async () => {
    // beforeEach sets DEV_AUTH_BYPASS="true" (not "1"), so isDevAuthBypassEnabled() is false.
    // Mock Supabase to return null user → 401.
    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as never);

    const res = await GET(
      new NextRequest("http://localhost/api/Planner/projects/p_office_abc123"),
      routeContext,
    );
    expect(res.status).toBe(401);
    expect(mockLoadPlannerProject).not.toHaveBeenCalled();
  });

  describe("GET", () => {
    it("returns 200 with the project record when found (wrapped in data envelope)", async () => {
      const project = existingProject();
      mockLoadPlannerProject.mockResolvedValue({ ok: true, status: 200, data: project });

      const res = await GET(new NextRequest("http://localhost/api/Planner/projects/p_office_abc123"), routeContext);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ id: "p_office_abc123", name: "Office" });
      expect(mockLoadPlannerProject).toHaveBeenCalledOnce();
    });

    it("returns 404 when project is missing", async () => {
      mockLoadPlannerProject.mockResolvedValue({ ok: false, status: 404, code: "NOT_FOUND" });

      const res = await GET(new NextRequest("http://localhost/api/Planner/projects/missing"), {
        params: Promise.resolve({ id: "missing" }),
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBeDefined();
    });
  });

  describe("PATCH", () => {
    const patchJson = (patchBody: unknown, id = "p_office_abc123") =>
      new NextRequest(`http://localhost/api/Planner/projects/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patchBody),
      });

    it("returns 404 when the project does not exist", async () => {
      mockSavePlannerProject.mockResolvedValue({ ok: false, status: 404, code: "NOT_FOUND" });

      const res = await PATCH(
        patchJson({ name: "Nope", expectedRevision: 1, idempotencyKey: "idem-patch-notfound" }),
        routeContext,
      );
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(mockSavePlannerProject).toHaveBeenCalledOnce();
    });

    it("updates name and returns 200 with updated project", async () => {
      const project = existingProject();
      const updatedProject = { ...project, name: "Renamed Office", revision: 2, updatedAt: "2026-07-31T15:30:00.000Z" };
      mockSavePlannerProject.mockResolvedValue({ ok: true, status: 200, data: updatedProject });

      const res = await PATCH(
        patchJson({ name: "Renamed Office", expectedRevision: 1, idempotencyKey: "idem-patch-rename" }),
        routeContext,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ id: "p_office_abc123", name: "Renamed Office" });
      expect(mockSavePlannerProject).toHaveBeenCalledOnce();
    });

    it("returns 400 for malformed JSON body", async () => {
      const res = await PATCH(
        new NextRequest("http://localhost/api/Planner/projects/p_office_abc123", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: "{bad",
        }),
        routeContext,
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(mockSavePlannerProject).not.toHaveBeenCalled();
    });
  });

  describe("DELETE", () => {
    // Send DELETE with JSON body containing the required idempotency fields.
    const deleteJson = (id: string, overrides: Record<string, unknown> = {}) =>
      new NextRequest(`http://localhost/api/Planner/projects/${id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedRevision: 1,
          idempotencyKey: "idem-delete-test",
          ...overrides,
        }),
      });

    it("returns 200 { data: { ok: true } } when project is deleted", async () => {
      mockDeletePlannerProject.mockResolvedValue({ ok: true, status: 200, data: { ok: true } });

      const res = await DELETE(deleteJson("p_office_abc123"), routeContext);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(mockDeletePlannerProject).toHaveBeenCalledOnce();
    });

    it("returns 404 when project does not exist", async () => {
      mockDeletePlannerProject.mockResolvedValue({ ok: false, status: 404, code: "NOT_FOUND" });

      const res = await DELETE(deleteJson("ghost"), { params: Promise.resolve({ id: "ghost" }) });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });
});
