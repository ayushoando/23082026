// @vitest-environment node
//
// Feature: SEC-R09 oversized-upload pre-check (2026-09-01/02 fixes)
//
// readRequestBody is module-private in plannerRequestPipeline, so the
// pre-check is exercised through the exported processPlannerRequest seam —
// the same harness style as plannerRequestPipeline.property.test.ts. The
// formData spy proves ordering: a declared Content-Length far above
// 10 MiB + 64 KiB must reject with body.file "File too large" BEFORE the
// multipart payload is materialized (the installed formData() throws, so a
// parse would surface a different issue).

import {
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

import { MAX_MULTIPART_UPLOAD_BYTES } from "@/lib/security/uploadLimits";
import type { PlannerEndpointDescriptor } from "@planner/lib/plannerEndpointContract";
import {
  processPlannerRequest,
  type PlannerOperationContext,
  type PlannerEndpointOperationPort,
  type PlannerRequestPipelineDependencies,
} from "@planner/lib/plannerRequestPipeline";

/** Mirrors the non-exported CONTENT_LENGTH_MARGIN_BYTES in uploadLimits. */
const CONTENT_LENGTH_MARGIN_BYTES = 64 * 1024;
const OVERSIZED_BYTES =
  MAX_MULTIPART_UPLOAD_BYTES + CONTENT_LENGTH_MARGIN_BYTES + 1;

const UPLOAD_URL = "https://planner.example/api/Planner/catalog/upload";

const uploadDescriptor: PlannerEndpointDescriptor = {
  id: "planner.test.upload",
  contractVersion: 1,
  method: "POST",
  path: "/api/Planner/catalog/upload",
  request: {
    path: [],
    query: [],
    headers: [
      {
        name: "content-type",
        required: true,
        schema: { type: "string", enum: ["multipart/form-data"] },
      },
    ],
    body: {
      type: "object",
      required: ["file", "name", "category"],
      properties: {
        file: { type: "unknown", description: "Multipart File" },
        name: { type: "string", minLength: 1 },
        category: { type: "string", minLength: 1 },
      },
    },
    contentType: "multipart/form-data",
  },
  responses: {
    success: [
      {
        status: 201,
        envelope: "planner-v1",
        schema: { type: "unknown", description: "Upload fixture" },
        description: "Accepted upload fixture",
      },
    ],
    errors: [400, 405, 429, 500].map((status) => ({
      status,
      envelope: "standard-error" as const,
      schema: { type: "unknown" as const, description: "Safe error" },
      description: "Rejected upload fixture",
    })),
  },
  security: {
    auth: "guest",
    owner: "public-catalog",
    csrf: "not-required",
    origin: "same-site-cookie",
  },
  rateLimit: {
    scope: "planner-test-upload:post",
    requests: 10,
    windowMs: 60_000,
    key: "normalized-client-ip",
  },
  compatibility: {
    preferredResponse: "planner-v1",
    acceptedResponses: ["planner-v1", "legacy"],
  },
};

function buildForm(): FormData {
  const form = new FormData();
  form.set(
    "file",
    new File([new Uint8Array([1, 2, 3, 4])], "chair.png", {
      type: "image/png",
    }),
  );
  form.set("name", "Chair");
  form.set("category", "seating");
  return form;
}

interface MultipartRequestOptions {
  /** Explicit Content-Length header; omitted means the header is absent. */
  contentLength?: string;
  /** When true, calling formData() fails — only reaching it proves a defect. */
  formDataMustNotRun?: boolean;
}

function multipartRequest(
  options: MultipartRequestOptions = {},
): { request: Request; formDataSpy: Mock } {
  // No explicit content-type: undici derives "multipart/form-data" with the
  // real boundary from the FormData body, so formData() can parse it back.
  const headers: Record<string, string> = {};
  if (options.contentLength !== undefined) {
    headers["content-length"] = options.contentLength;
  }
  const request = new Request(UPLOAD_URL, {
    method: "POST",
    headers,
    body: buildForm(),
  });
  const originalFormData = request.formData.bind(request);
  const formDataSpy: Mock = vi.fn(async () => {
    if (options.formDataMustNotRun) {
      throw new Error(
        "SEC-R09: formData() must not run when the declared body size exceeds the budget",
      );
    }
    return originalFormData();
  });
  request.formData = formDataSpy as unknown as typeof request.formData;
  return { request, formDataSpy };
}

function pipelineDependencies(): PlannerRequestPipelineDependencies {
  return {
    checkQuota: async () => ({ allowed: true, resetAt: 0 }),
    verifyOrigin: () => true,
    verifyCsrf: async () => true,
    verifySession: async () => null,
    authorizeOwnerScope: () => true,
    validateRevisionAndIdempotency: () => [],
    generateCorrelationId: () => "corr-upload-secr09",
  };
}

function captureOperation(): {
  operation: PlannerEndpointOperationPort<Record<string, string>>;
  contexts: PlannerOperationContext[];
} {
  const contexts: PlannerOperationContext[] = [];
  const operation: PlannerEndpointOperationPort<Record<string, string>> = {
    invoke: vi.fn(async (context) => {
      contexts.push(context);
      return { ok: true, status: 201, data: { id: "created" } };
    }),
  };
  return { operation, contexts };
}

interface FailurePayload {
  success: false;
  error: {
    code: string;
    issues?: readonly { path: string; message: string }[];
  };
  correlationId: string;
}

async function readFailure(response: Response): Promise<FailurePayload> {
  return (await response.json()) as FailurePayload;
}

describe("SEC-R09 pre-check in the planner request pipeline", () => {
  it("rejects a declared Content-Length far above the budget without parsing the body", async () => {
    const { request, formDataSpy } = multipartRequest({
      contentLength: String(OVERSIZED_BYTES + 20 * 1024 * 1024),
      formDataMustNotRun: true,
    });
    const { operation, contexts } = captureOperation();

    const response = await processPlannerRequest({
      descriptor: uploadDescriptor,
      pipelineRequest: { request },
      dependencies: pipelineDependencies(),
      operation,
    });
    const payload = await readFailure(response);

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("INVALID_REQUEST");
    expect(payload.error.issues).toContainEqual({
      path: "body.file",
      message: "File too large",
    });
    // The parse-failure fallback must NOT appear: the pre-check ran first.
    expect(
      payload.error.issues?.some((entry) =>
        entry.message.includes("could not be parsed"),
      ),
    ).toBe(false);
    expect(formDataSpy).not.toHaveBeenCalled();
    expect(operation.invoke).not.toHaveBeenCalled();
    expect(contexts).toHaveLength(0);
  });

  it("parses the multipart body normally when Content-Length is absent", async () => {
    const { request, formDataSpy } = multipartRequest();
    const { operation, contexts } = captureOperation();

    const response = await processPlannerRequest({
      descriptor: uploadDescriptor,
      pipelineRequest: { request },
      dependencies: pipelineDependencies(),
      operation,
    });
    const payload = (await response.json()) as {
      success: boolean;
      data: { id: string };
    };

    expect(response.status).toBe(201);
    expect(payload.success).toBe(true);
    expect(formDataSpy).toHaveBeenCalledTimes(1);
    const body = contexts[0]?.request.body as Record<string, unknown>;
    expect(body.name).toBe("Chair");
    expect(body.category).toBe("seating");
    expect(body.file).toBeInstanceOf(File);
  });

  it("parses the body when Content-Length sits exactly within the margin", async () => {
    const { request, formDataSpy } = multipartRequest({
      contentLength: String(
        MAX_MULTIPART_UPLOAD_BYTES + CONTENT_LENGTH_MARGIN_BYTES,
      ),
    });
    const { operation } = captureOperation();

    const response = await processPlannerRequest({
      descriptor: uploadDescriptor,
      pipelineRequest: { request },
      dependencies: pipelineDependencies(),
      operation,
    });

    expect(response.status).toBe(201);
    expect(formDataSpy).toHaveBeenCalledTimes(1);
    expect(operation.invoke).toHaveBeenCalledTimes(1);
  });

  it("rejects exactly one byte over the budget and accepts one byte under it", async () => {
    const over = multipartRequest({
      contentLength: String(OVERSIZED_BYTES),
      formDataMustNotRun: true,
    });
    const overOutcome = await processPlannerRequest({
      descriptor: uploadDescriptor,
      pipelineRequest: { request: over.request },
      dependencies: pipelineDependencies(),
      operation: captureOperation().operation,
    });
    expect(overOutcome.status).toBe(400);
    expect(over.formDataSpy).not.toHaveBeenCalled();

    const under = multipartRequest({
      contentLength: String(OVERSIZED_BYTES - 1),
    });
    const underOutcome = await processPlannerRequest({
      descriptor: uploadDescriptor,
      pipelineRequest: { request: under.request },
      dependencies: pipelineDependencies(),
      operation: captureOperation().operation,
    });
    expect(underOutcome.status).toBe(201);
    expect(under.formDataSpy).toHaveBeenCalledTimes(1);
  });

  it("leaves the JSON content path unaffected by the multipart pre-check", async () => {
    const jsonDescriptor: PlannerEndpointDescriptor = {
      ...uploadDescriptor,
      id: "planner.test.json",
      request: {
        ...uploadDescriptor.request,
        headers: [],
        body: { type: "unknown", description: "JSON fixture" },
        contentType: "application/json",
      },
    };
    const request = new Request("https://planner.example/api/Planner/json", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(OVERSIZED_BYTES + 10 * 1024 * 1024),
      },
      body: JSON.stringify({ hello: "world" }),
    });
    const { operation, contexts } = captureOperation();

    const response = await processPlannerRequest({
      descriptor: jsonDescriptor,
      pipelineRequest: { request },
      dependencies: pipelineDependencies(),
      operation,
    });

    expect(response.status).toBe(201);
    expect(contexts[0]?.request.body).toEqual({ hello: "world" });
  });
});
