/**
 * Contract tests for POST /api/Planner/sketch-to-plan.
 * The Planner route adapter is mocked to call the operation directly
 * with a minimal auth context, bypassing the full pipeline.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requestSketchToPlan = vi.hoisted(() => vi.fn());
const isFeatureEnabled = vi.hoisted(() => vi.fn(() => true));

vi.mock("@planner/server/sketchToPlan.server", () => ({
  requestSketchToPlan,
  classifySketchConversionError: vi.fn(
    (err: unknown, fileName: string): { reason: string; fileName: string } => {
      // Replicate the shared classifySketchConversionError logic:
      // if the error has a .reason string property it's a SketchConversionError.
      if (
        err !== null &&
        err !== undefined &&
        typeof (err as Record<string, unknown>).reason === "string"
      ) {
        return {
          reason: (err as { reason: string }).reason,
          fileName,
        };
      }
      return { reason: "server_error", fileName };
    },
  ),
  getSketchRecoveryMessage: vi.fn((reason: string) => `Recovery: ${reason}`),
}));

vi.mock("@/lib/featureFlags", () => ({
  isFeatureEnabled,
}));

// ---------------------------------------------------------------------------
// Mock the Planner route adapter so createPlannerHandler delegates directly
// to the operation without going through the full request pipeline.
// ---------------------------------------------------------------------------
vi.mock("@planner/server/plannerRouteAdapter", () => ({
  createPlannerHandler: vi.fn(
    ({ operation }: { operation: { invoke: (ctx: unknown) => Promise<{ ok: boolean; status: number; data?: unknown; code?: string; metadata?: { issues?: unknown[] } }> } }) =>
      async (req: Request) => {
        const correlationId = "test-correlation-id";

        // Parse JSON body
        let body: unknown = undefined;
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

        // Simulate a minimal auth context (guest — sketch-to-plan allows guest)
        const context = {
          correlationId,
          session: { ownerId: "user-1", isAdmin: false },
          ownerScope: { ownerId: "user-1" },
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
      { status: 405, headers: { allow: "POST, OPTIONS" } },
    ),
  ),
}));

import { POST } from "@/app/api/Planner/sketch-to-plan/route";
import { SketchConversionError } from "@/lib/Planner/ai/sketchToPlanShared";

const routeContext: { params: Promise<Record<string, string>> } = {
  params: Promise.resolve({} as Record<string, string>),
};

const invokePost = (body: unknown) => POST(postJson(body), routeContext);

function postJson(body: unknown) {
  return new NextRequest("http://localhost/api/Planner/sketch-to-plan", {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": "t" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  imageDataUrl: "data:image/png;base64,aaaa",
  fileName: "sketch.png",
  prompt: "Trace walls",
  includeRooms: true,
};

describe("app/api/Planner/sketch-to-plan/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isFeatureEnabled.mockReturnValue(true);
    requestSketchToPlan.mockResolvedValue({
      objects: [{ type: "wall", x1: 0, y1: 0, x2: 4000, y2: 0 }],
      warnings: [],
    });
  });

  it("returns 403 when feature flag off", async () => {
    isFeatureEnabled.mockReturnValue(false);
    const res = await invokePost(postJson(validBody));
    expect(res.status).toBe(403);
    expect(requestSketchToPlan).not.toHaveBeenCalled();
  });

  it("returns validation error for bad image", async () => {
    const res = await invokePost(
      postJson({ ...validBody, imageDataUrl: "not-a-data-url" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns preview success", async () => {
    const res = await invokePost(postJson(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("preview");
    expect(body.data.objects).toHaveLength(1);
  });

  it("returns fallback success for missing provider", async () => {
    requestSketchToPlan.mockRejectedValue(
      new SketchConversionError(
        "missing_provider",
        "sketch.png",
        "AI conversion is unavailable",
      ),
    );
    const res = await invokePost(postJson(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("fallback");
    expect(body.data.reason).toBe("missing_provider");
  });
});
