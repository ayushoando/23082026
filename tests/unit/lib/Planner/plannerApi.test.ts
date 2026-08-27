/**
 * Client path contract for @planner/lib/plannerApi.
 * Locks the target HTTP surface CRM (and other callers) should repoint to:
 *   /api/Planner/projects[/:id]  (case-sensitive Planner segment)
 *   /api/Planner/catalog[+upload]
 *   /api/exports
 *
 * Member saves (no DEV_AUTH_BYPASS) go through browserApiFetch so CSRF +
 * credentials + trailingSlash are applied.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const browserApiMocks = vi.hoisted(() => ({
  browserApiFetch: vi.fn(),
  apiPath: vi.fn((path: string) =>
    path.endsWith("/") || path.includes("?") ? path : `${path}/`,
  ),
}));

vi.mock("@/lib/api/browserApi", () => ({
  browserApiFetch: (...args: unknown[]) => browserApiMocks.browserApiFetch(...args),
  apiPath: (path: string) => browserApiMocks.apiPath(path),
}));

import {
  createExport,
  createProject,
  deleteProject,
  fileUrl,
  getProject,
  isAbortError,
  listFurniture,
  listProjects,
  PlannerApiError,
  updateProject,
  uploadFurniture,
} from "@planner/lib/plannerApi";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("@planner/lib/plannerApi path contract", () => {
  beforeEach(() => {
    browserApiMocks.browserApiFetch.mockReset();
    browserApiMocks.apiPath.mockClear();
    browserApiMocks.browserApiFetch.mockResolvedValue(jsonResponse({}));
  });

  it("lists projects at GET /api/Planner/projects", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse([{ id: "p_1" }]),
    );
    const data = await listProjects();
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects",
    );
    expect(data).toEqual([{ id: "p_1" }]);
  });

  /**
   * PX-S11 — projects page uses plannerApi → browserApiFetch (credentials +
   * trailingSlash). Under DEV_AUTH_BYPASS the server synthesizes identity;
   * the client must still take the cookie-bearing path so the list loads.
   */
  it("listProjects uses browserApiFetch (credentials path) not bare fetch", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse([{ id: "p_bypass" }]),
    );
    await listProjects();
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledTimes(1);
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects",
    );
    // No second arg on GET — browserApiFetch defaults credentials: "include".
    expect(browserApiMocks.browserApiFetch.mock.calls[0]?.[1]).toBeUndefined();
  });

  it("gets a project at GET /api/Planner/projects/:id", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({ id: "p_1" }),
    );
    await getProject("p_1");
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects/p_1",
    );
  });

  it("creates a project at POST /api/Planner/projects with JSON body", async () => {
    const payload = { name: "A", canvas_json: {} };
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({ id: "p_a_x" }, 201),
    );
    await createProject(payload);
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  });

  it("updates a project at PATCH /api/Planner/projects/:id", async () => {
    const payload = { name: "B" };
    await updateProject("p_1", payload);
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects/p_1",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  });

  it("deletes a project at DELETE /api/Planner/projects/:id", async () => {
    await deleteProject("p_1");
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/projects/p_1",
      { method: "DELETE" },
    );
  });

  it("lists furniture catalog at GET /api/Planner/catalog (never /Studio)", async () => {
    await listFurniture({ category: "desks" });
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/catalog?category=desks",
    );
    const path = String(browserApiMocks.browserApiFetch.mock.calls[0]?.[0] ?? "");
    expect(path).not.toMatch(/Studio/i);
  });

  it("uploads furniture via /api/Planner/catalog/upload (CSRF path)", async () => {
    const form = new FormData();
    form.append("name", "Custom");
    await uploadFurniture(form);
    expect(browserApiMocks.apiPath).toHaveBeenCalledWith(
      "/api/Planner/catalog/upload",
    );
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
      "/api/Planner/catalog/upload/",
      { method: "POST", body: form },
    );
  });

  it("posts exports at POST /api/exports (neutral, not Studio)", async () => {
    const payload = { data_url: "data:image/png;base64,xx", format: "png" };
    await createExport(payload);
    expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("surfaces API error detail when response is not ok", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({ detail: "Authentication required" }, 401),
    );
    await expect(listProjects()).rejects.toThrow("Authentication required");
  });

  it("surfaces message when detail is omitted in error response", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({ message: "Server busy" }, 503),
    );
    await expect(listProjects()).rejects.toThrow("Server busy");
  });

  it("surfaces error string when detail and message are omitted", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({ error: "Access denied" }, 403),
    );
    await expect(listProjects()).rejects.toThrow("Access denied");
  });

  it("surfaces error.message object when present in error response", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      jsonResponse({ error: { message: "Invalid payload format" } }, 400),
    );
    await expect(listProjects()).rejects.toThrow("Invalid payload format");
  });

  it("handles non-JSON error bodies gracefully with default status message", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      new Response("<html>Bad Gateway</html>", { status: 502 }),
    );
    await expect(listProjects()).rejects.toThrow("Request failed (502)");
  });

  it("returns undefined on 204 No Content response", async () => {
    browserApiMocks.browserApiFetch.mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    );
    const result = await deleteProject("p_1");
    expect(result).toBeUndefined();
  });

  it("fileUrl passes through path strings and nullish to null", () => {
    expect(fileUrl("/api/files/projects/a_thumb.png")).toBe(
      "/api/files/projects/a_thumb.png",
    );
    expect(fileUrl(null)).toBeNull();
    expect(fileUrl(undefined)).toBeNull();
    expect(fileUrl("")).toBeNull();
  });
});


describe("@planner/lib/plannerApi typed error classification and signal forwarding", () => {
  beforeEach(() => {
    browserApiMocks.browserApiFetch.mockReset();
    browserApiMocks.apiPath.mockClear();
    browserApiMocks.browserApiFetch.mockResolvedValue(jsonResponse({}));
  });

  describe("typed 404 classification", () => {
    it("throws PlannerApiError with status 404, isNotFound true, isTransient false", async () => {
      browserApiMocks.browserApiFetch.mockResolvedValueOnce(
        jsonResponse({ detail: "Project not found" }, 404),
      );
      try {
        await getProject("p_missing");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PlannerApiError);
        const apiErr = err as PlannerApiError;
        expect(apiErr.status).toBe(404);
        expect(apiErr.isNotFound).toBe(true);
        expect(apiErr.isTransient).toBe(false);
        expect(apiErr.message).toBe("Project not found");
      }
    });
  });

  describe("typed 401 classification", () => {
    // The one failure mode a persisted audit artifact actually recorded for
    // /ooplanner/projects/[id] (plans/ref/remediation-unified/audit.md D7):
    // HTTP 401 with "Authentication required", not 404 or 429.
    it("throws PlannerApiError with status 401, isUnauthorized true, isTransient/isNotFound false", async () => {
      browserApiMocks.browserApiFetch.mockResolvedValueOnce(
        jsonResponse({ error: { message: "Authentication required" } }, 401),
      );
      try {
        await getProject("demo-plan");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PlannerApiError);
        const apiErr = err as PlannerApiError;
        expect(apiErr.status).toBe(401);
        expect(apiErr.isUnauthorized).toBe(true);
        expect(apiErr.isForbidden).toBe(false);
        expect(apiErr.isNotFound).toBe(false);
        expect(apiErr.isTransient).toBe(false);
      }
    });
  });

  describe("typed 403 classification", () => {
    it("throws PlannerApiError with status 403, isForbidden true, isUnauthorized/isTransient false", async () => {
      browserApiMocks.browserApiFetch.mockResolvedValueOnce(
        jsonResponse({ detail: "Insufficient permissions" }, 403),
      );
      try {
        await getProject("p_1");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PlannerApiError);
        const apiErr = err as PlannerApiError;
        expect(apiErr.status).toBe(403);
        expect(apiErr.isForbidden).toBe(true);
        expect(apiErr.isUnauthorized).toBe(false);
        expect(apiErr.isTransient).toBe(false);
      }
    });
  });

  describe("typed 429/503 classification", () => {
    it("throws PlannerApiError with status 429, isTransient true, isNotFound false", async () => {
      browserApiMocks.browserApiFetch.mockResolvedValueOnce(
        jsonResponse({ detail: "Too many requests" }, 429),
      );
      try {
        await getProject("p_1");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PlannerApiError);
        const apiErr = err as PlannerApiError;
        expect(apiErr.status).toBe(429);
        expect(apiErr.isTransient).toBe(true);
        expect(apiErr.isNotFound).toBe(false);
      }
    });

    it("throws PlannerApiError with status 503, isTransient true, isNotFound false", async () => {
      browserApiMocks.browserApiFetch.mockResolvedValueOnce(
        jsonResponse({ detail: "Service unavailable" }, 503),
      );
      try {
        await getProject("p_1");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(PlannerApiError);
        const apiErr = err as PlannerApiError;
        expect(apiErr.status).toBe(503);
        expect(apiErr.isTransient).toBe(true);
        expect(apiErr.isNotFound).toBe(false);
      }
    });
  });

  describe("optional signal forwarding", () => {
    it("forwards signal to browserApiFetch when provided to getProject", async () => {
      const controller = new AbortController();
      browserApiMocks.browserApiFetch.mockResolvedValueOnce(
        jsonResponse({ id: "p_1", name: "Test" }),
      );
      await getProject("p_1", { signal: controller.signal });
      expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
        "/api/Planner/projects/p_1",
        { signal: controller.signal },
      );
    });

    it("forwards signal to browserApiFetch when provided to listProjects", async () => {
      const controller = new AbortController();
      browserApiMocks.browserApiFetch.mockResolvedValueOnce(
        jsonResponse([{ id: "p_1" }]),
      );
      await listProjects({ signal: controller.signal });
      expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
        "/api/Planner/projects",
        { signal: controller.signal },
      );
    });

    it("passes signal as undefined when getProject is called without options", async () => {
      browserApiMocks.browserApiFetch.mockResolvedValueOnce(
        jsonResponse({ id: "p_1", name: "Test" }),
      );
      await getProject("p_1");
      expect(browserApiMocks.browserApiFetch).toHaveBeenCalledWith(
        "/api/Planner/projects/p_1",
        { signal: undefined },
      );
    });
  });

  describe("AbortError identification", () => {
    it("isAbortError returns true for DOMException with name AbortError", () => {
      const err = new DOMException("The operation was aborted", "AbortError");
      expect(isAbortError(err)).toBe(true);
    });

    it("isAbortError returns false for a regular Error", () => {
      const err = new Error("something went wrong");
      expect(isAbortError(err)).toBe(false);
    });

    it("isAbortError returns false for a PlannerApiError", () => {
      const err = new PlannerApiError(404, "Not found");
      expect(isAbortError(err)).toBe(false);
    });
  });

  describe("unchanged successful project parsing", () => {
    it("getProject returns the parsed project object on 200", async () => {
      const project = { id: "p_1", name: "My Plan", canvas_json: { objects: [] } };
      browserApiMocks.browserApiFetch.mockResolvedValueOnce(
        jsonResponse(project),
      );
      const result = await getProject("p_1");
      expect(result).toEqual(project);
    });
  });
});
