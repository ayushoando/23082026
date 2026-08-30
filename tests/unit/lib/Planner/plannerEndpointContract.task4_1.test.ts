import { beforeEach, describe, expect, it, vi } from "vitest";

const browserApiMocks = vi.hoisted(() => ({
  browserApiFetch: vi.fn(),
  apiPath: vi.fn((path: string) => `${path}/`),
}));

vi.mock("@/lib/api/browserApi", () => ({
  browserApiFetch: (...args: unknown[]) => browserApiMocks.browserApiFetch(...args),
  apiPath: (path: string) => browserApiMocks.apiPath(path),
}));

import {
  PLANNER_ENDPOINT_CONTRACT_VERSION,
  PLANNER_ENDPOINT_DESCRIPTORS,
  PLANNER_GATE_B_ENDPOINT_CONTRACT,
  readPlannerEndpointSuccess,
} from "@planner/lib/plannerEndpointContract";
import {
  convertSketchToPlan,
  listProjects,
  submitPlannerHandoff,
} from "@planner/lib/plannerApi";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Planner Task 4.1 Gate B endpoint contract", () => {
  it("publishes v1 descriptors for every inventoried endpoint operation", () => {
    expect(PLANNER_GATE_B_ENDPOINT_CONTRACT.contractVersion).toBe(1);
    expect(
      PLANNER_ENDPOINT_DESCRIPTORS.map(({ method, path }) => `${method} ${path}`),
    ).toEqual([
      "GET /api/Planner/catalog",
      "POST /api/Planner/catalog/upload",
      "POST /api/Planner/handoff",
      "GET /api/Planner/projects",
      "POST /api/Planner/projects",
      "GET /api/Planner/projects/{id}",
      "PATCH /api/Planner/projects/{id}",
      "DELETE /api/Planner/projects/{id}",
      "POST /api/Planner/ai-advisor",
      "POST /api/Planner/sketch-to-plan",
    ]);
  });

  it("defines schemas, statuses, security policy, and bounded quotas on every operation", () => {
    for (const descriptor of PLANNER_ENDPOINT_DESCRIPTORS) {
      expect(descriptor.contractVersion).toBe(PLANNER_ENDPOINT_CONTRACT_VERSION);
      expect(descriptor.request.path).toBeDefined();
      expect(descriptor.request.query).toBeDefined();
      expect(descriptor.request.headers).toBeDefined();
      expect(descriptor.request.body.type).toBeTruthy();
      expect(descriptor.responses.success.length).toBeGreaterThan(0);
      expect(descriptor.responses.errors.length).toBeGreaterThan(0);
      expect(descriptor.security.auth).toMatch(/^(guest|member)$/);
      expect(descriptor.security.owner).toBeTruthy();
      expect(descriptor.security.csrf).toBeTruthy();
      expect(descriptor.security.origin).toBeTruthy();
      expect(descriptor.rateLimit.requests).toBeGreaterThan(0);
      expect(descriptor.rateLimit.windowMs).toBe(60_000);
      expect(descriptor.compatibility.acceptedResponses).toEqual([
        "planner-v1",
        "legacy",
      ]);
    }
  });

  it("requires CSRF for every mutation and member auth for project/catalog writes", () => {
    const mutations = PLANNER_ENDPOINT_DESCRIPTORS.filter(
      ({ method }) => method !== "GET",
    );
    expect(
      mutations.every(({ security }) => security.csrf === "double-submit-cookie"),
    ).toBe(true);

    const memberOperations = new Set([
      "planner.catalog.upload",
      "planner.projects.list",
      "planner.projects.create",
      "planner.projects.get",
      "planner.projects.update",
      "planner.projects.delete",
    ]);
    for (const descriptor of PLANNER_ENDPOINT_DESCRIPTORS) {
      if (memberOperations.has(descriptor.id)) {
        expect(descriptor.security.auth).toBe("member");
      }
    }
  });

  it("dual-reads legacy payloads and the versioned v1 data envelope", () => {
    const legacy = [{ id: "p_legacy" }];
    const versioned = {
      contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
      data: [{ id: "p_v1" }],
    };
    expect(readPlannerEndpointSuccess(legacy)).toBe(legacy);
    expect(readPlannerEndpointSuccess(versioned)).toEqual([{ id: "p_v1" }]);
  });
});

describe("Planner Task 4.1 compatible client adapters", () => {
  beforeEach(() => {
    browserApiMocks.browserApiFetch.mockReset();
    browserApiMocks.apiPath.mockClear();
  });

  it("unwraps a versioned projects response without breaking the legacy API", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({
        contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
        data: [{ id: "p_v1", name: "Versioned", objects_count: 0, updated_at: "2026-01-01T00:00:00.000Z" }],
      }),
    );
    await expect(listProjects()).resolves.toMatchObject([
      { id: "p_v1", name: "Versioned" },
    ]);
  });

  it("submits handoffs through the typed adapter and accepts the live spread envelope", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        referenceId: "PH-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        idempotentReplay: false,
        message: "Recorded",
      }),
    );
    const payload = {
      contact: { name: "Buyer", email: "", phone: "", company: "", notes: "" },
      boq: {
        projectId: "p_1",
        projectName: "Plan",
        calculationHash: "1234567890abcdef",
        lines: [],
        subtotalInr: 0,
        gstInr: 0,
        totalInr: 0,
      },
      idempotencyKey: "handoff-1",
    };
    await expect(submitPlannerHandoff(payload)).resolves.toMatchObject({
      referenceId: "PH-1",
      idempotentReplay: false,
    });
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/handoff/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("converts sketches through the typed adapter and unwraps v1", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({
        contractVersion: PLANNER_ENDPOINT_CONTRACT_VERSION,
        data: {
          status: "preview",
          fileName: "plan.png",
          objects: [],
          warnings: [],
        },
      }),
    );
    await expect(
      convertSketchToPlan({
        imageDataUrl: "data:image/png;base64,AA==",
        fileName: "plan.png",
        prompt: "Trace walls",
        includeRooms: true,
      }),
    ).resolves.toEqual({
      status: "preview",
      fileName: "plan.png",
      objects: [],
      warnings: [],
    });
  });
});
