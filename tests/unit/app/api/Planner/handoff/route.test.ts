/**
 * Contract tests for POST /api/Planner/handoff.
 * createPlannerHandoff mocked so this stays unit-level.
 * The Planner route adapter is mocked to call the operation directly
 * with a minimal auth context, bypassing the full pipeline.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const createPlannerHandoff = vi.hoisted(() => vi.fn());

vi.mock("@planner/lib/handoff/createPlannerHandoff", () => ({
  createPlannerHandoff,
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

        // Simulate a minimal auth context (guest — handoff endpoint is guest-level)
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

import { POST } from "@/app/api/Planner/handoff/route";

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    contact: { name: "Ada", email: "ada@example.com", phone: "", company: "", notes: "" },
    boq: {
      projectId: "p1",
      projectName: "Office",
      calculationHash: "a".repeat(64),
      lines: [],
      subtotalInr: 0,
      gstInr: 0,
      totalInr: 0,
    },
    consent: true,
    inquiryType: "design-support",
    idempotencyKey: "idem-route-1",
    ...overrides,
  };
}

function postJson(body: unknown) {
  return new NextRequest("http://localhost/api/Planner/handoff", {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": "t" },
    body: JSON.stringify(body),
  });
}

describe("app/api/Planner/handoff/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createPlannerHandoff.mockResolvedValue({
      ok: true,
      referenceId: "HO-TEST1",
      createdAt: "2026-07-31T12:00:00.000Z",
      idempotentReplay: false,
      message: "Handoff HO-TEST1 recorded for staff follow-up.",
    });
  });

  it("returns validation error for empty name", async () => {
    const res = await POST(
      postJson(validBody({ contact: { name: "", email: "x@y.com" } })),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(createPlannerHandoff).not.toHaveBeenCalled();
  });

  it("returns 200 with referenceId on success", async () => {
    const res = await POST(postJson(validBody()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.referenceId).toBe("HO-TEST1");
    expect(body.data.idempotentReplay).toBe(false);
    expect(createPlannerHandoff).toHaveBeenCalledOnce();
  });

  it("returns 503 when handoff store is not configured", async () => {
    createPlannerHandoff.mockResolvedValue({
      ok: false,
      kind: "not_configured",
      code: "handoff_not_configured",
      message: "not configured",
    });
    const res = await POST(postJson(validBody({ idempotencyKey: "idem-503" })));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 500 on persist failure", async () => {
    createPlannerHandoff.mockResolvedValue({
      ok: false,
      kind: "persist_failed",
      code: "handoff_persist_failed",
      message: "db down",
    });
    const res = await POST(postJson(validBody({ idempotencyKey: "idem-500" })));
    expect(res.status).toBe(500);
  });
});
