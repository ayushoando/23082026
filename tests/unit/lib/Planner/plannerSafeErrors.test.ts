// @vitest-environment node
//
// Task 4.4: Remediate safe structured errors and correlation responses
//
// Dedicated unit tests for the Planner safe error response module.
// Validates stable codes, correlation identifiers, metadata sanitization,
// prohibited content exclusion, and operation-failure sanitization.
//
// **Validates: Requirements 11.8, 11.9, 17.3**

import { describe, expect, it } from "vitest";

import {
  PLANNER_CORRELATION_HEADER,
  PLANNER_STABLE_ERROR_CODES,
  isPlannerResponseSafe,
  isValidPlannerCorrelationId,
  plannerApiFailure,
  plannerApiSuccess,
  plannerInternalFailure,
  resolvePlannerCorrelationId,
  safeMetadata,
  sanitizeOperationFailure,
  type PlannerApiErrorCode,
  type PlannerApiFailure as PlannerApiFailureBody,
  type PlannerSafeErrorMetadata,
} from "@planner/lib/plannerApiResponse";

// ---------------------------------------------------------------------------
// 1. Stable error codes (Requirement 11.8)
// ---------------------------------------------------------------------------

describe("stable error codes", () => {
  const allCodes: PlannerApiErrorCode[] = [
    "AUTH_REQUIRED",
    "CSRF_REJECTED",
    "INTERNAL_ERROR",
    "INVALID_REQUEST",
    "METHOD_NOT_ALLOWED",
    "NOT_FOUND",
    "ORIGIN_REJECTED",
    "OWNER_SCOPE_REJECTED",
    "RATE_LIMITED",
    "REVISION_CONFLICT",
    "SERVICE_UNAVAILABLE",
  ];

  it("PLANNER_STABLE_ERROR_CODES contains all documented error codes", () => {
    for (const code of allCodes) {
      expect(PLANNER_STABLE_ERROR_CODES.has(code)).toBe(true);
    }
  });

  it.each(allCodes)(
    "plannerApiFailure with code %s returns a safe message and no sensitive content",
    async (code) => {
      const response = plannerApiFailure(code, "corr-test-0001", 400);
      const body = (await response.json()) as PlannerApiFailureBody;

      expect(body.success).toBe(false);
      expect(body.error.code).toBe(code);
      expect(typeof body.error.message).toBe("string");
      expect(body.error.message.length).toBeGreaterThan(0);
      expect(body.correlationId).toBe("corr-test-0001");

      // The message must not contain any sensitive patterns
      const text = JSON.stringify(body);
      expect(isPlannerResponseSafe(text)).toBe(true);
    },
  );

  it("every error code has a human-readable safe message", async () => {
    for (const code of allCodes) {
      const response = plannerApiFailure(code, "corr-msg-0001", 500);
      const body = (await response.json()) as PlannerApiFailureBody;
      expect(body.error.message).toBeTruthy();
      expect(body.error.message).not.toContain("undefined");
      expect(body.error.message).not.toContain("null");
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Correlation identifiers (Requirement 17.3)
// ---------------------------------------------------------------------------

describe("correlation identifiers", () => {
  describe("isValidPlannerCorrelationId", () => {
    it("accepts valid correlation IDs within bounds", () => {
      expect(isValidPlannerCorrelationId("abcdefgh")).toBe(true);
      expect(isValidPlannerCorrelationId("req-12345678")).toBe(true);
      expect(isValidPlannerCorrelationId("A".repeat(64))).toBe(true);
      expect(isValidPlannerCorrelationId("abc.def~ghi-jkl_mno")).toBe(true);
    });

    it("rejects null, undefined, and empty strings", () => {
      expect(isValidPlannerCorrelationId(null)).toBe(false);
      expect(isValidPlannerCorrelationId(undefined)).toBe(false);
      expect(isValidPlannerCorrelationId("")).toBe(false);
    });

    it("rejects IDs shorter than 8 characters", () => {
      expect(isValidPlannerCorrelationId("abcdefg")).toBe(false);
    });

    it("rejects IDs longer than 64 characters", () => {
      expect(isValidPlannerCorrelationId("A".repeat(65))).toBe(false);
    });

    it("rejects IDs with disallowed characters", () => {
      expect(isValidPlannerCorrelationId("req/path/12345678")).toBe(false);
      expect(isValidPlannerCorrelationId("req@domain.com")).toBe(false);
      expect(isValidPlannerCorrelationId("req id 12345")).toBe(false);
    });
  });

  describe("resolvePlannerCorrelationId", () => {
    it("preserves a valid inbound correlation ID", () => {
      expect(resolvePlannerCorrelationId("client-req-0001")).toBe(
        "client-req-0001",
      );
    });

    it("generates a new ID when inbound is invalid", () => {
      const generate = () => "generated-id-0001";
      const result = resolvePlannerCorrelationId("bad!", generate);
      expect(result).toBe("generated-id-0001");
    });

    it("falls back to crypto.randomUUID when generator produces invalid ID", () => {
      const generate = () => "x"; // too short
      const result = resolvePlannerCorrelationId(null, generate);
      expect(isValidPlannerCorrelationId(result)).toBe(true);
    });

    it("generates a valid ID when inbound is null", () => {
      const result = resolvePlannerCorrelationId(null);
      expect(isValidPlannerCorrelationId(result)).toBe(true);
    });
  });

  describe("correlation ID propagation in responses", () => {
    it("includes correlation ID in both body and header of success responses", async () => {
      const response = plannerApiSuccess(
        { items: [] },
        "corr-success-0001",
      );
      const body = await response.json();

      expect(body.correlationId).toBe("corr-success-0001");
      expect(response.headers.get(PLANNER_CORRELATION_HEADER)).toBe(
        "corr-success-0001",
      );
    });

    it("includes correlation ID in both body and header of failure responses", async () => {
      const response = plannerApiFailure(
        "INVALID_REQUEST",
        "corr-failure-0001",
        400,
      );
      const body = (await response.json()) as PlannerApiFailureBody;

      expect(body.correlationId).toBe("corr-failure-0001");
      expect(response.headers.get(PLANNER_CORRELATION_HEADER)).toBe(
        "corr-failure-0001",
      );
    });

    it("includes correlation ID in internal failure responses", async () => {
      const response = plannerInternalFailure(
        new Error("boom"),
        "corr-internal-0001",
      );
      const body = (await response.json()) as PlannerApiFailureBody;

      expect(body.correlationId).toBe("corr-internal-0001");
      expect(response.headers.get(PLANNER_CORRELATION_HEADER)).toBe(
        "corr-internal-0001",
      );
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Metadata sanitization (Requirement 11.9)
// ---------------------------------------------------------------------------

describe("metadata sanitization", () => {
  it("passes through valid issues with bounded lengths", () => {
    const metadata: PlannerSafeErrorMetadata = {
      issues: [{ path: "body.name", message: "Required value is missing" }],
    };
    const result = safeMetadata(metadata);
    expect(result.issues).toEqual([
      { path: "body.name", message: "Required value is missing" },
    ]);
  });

  it("truncates issues to maximum 20 entries", () => {
    const issues = Array.from({ length: 30 }, (_, i) => ({
      path: `field.${i}`,
      message: `Error ${i}`,
    }));
    const result = safeMetadata({ issues });
    expect(result.issues?.length).toBe(20);
  });

  it("truncates long path strings to 160 characters", () => {
    const longPath = "x".repeat(300);
    const result = safeMetadata({
      issues: [{ path: longPath, message: "too long" }],
    });
    expect(result.issues?.[0]?.path.length).toBeLessThanOrEqual(160);
  });

  it("truncates long message strings to 240 characters", () => {
    const longMsg = "m".repeat(500);
    const result = safeMetadata({
      issues: [{ path: "field", message: longMsg }],
    });
    expect(result.issues?.[0]?.message.length).toBeLessThanOrEqual(240);
  });

  it("passes through valid retryAfterSeconds", () => {
    expect(safeMetadata({ retryAfterSeconds: 30 })).toEqual({
      retryAfterSeconds: 30,
    });
  });

  it("rejects negative retryAfterSeconds", () => {
    expect(safeMetadata({ retryAfterSeconds: -5 })).toEqual({});
  });

  it("rejects non-integer retryAfterSeconds", () => {
    expect(safeMetadata({ retryAfterSeconds: 1.5 })).toEqual({});
  });

  it("passes through valid currentRevision", () => {
    expect(safeMetadata({ currentRevision: 42 })).toEqual({
      currentRevision: 42,
    });
  });

  it("rejects negative currentRevision", () => {
    expect(safeMetadata({ currentRevision: -1 })).toEqual({});
  });

  it("passes through the allowed recovery literal only", () => {
    expect(
      safeMetadata({ recovery: "reauthenticate-preserve-unsaved" }),
    ).toEqual({ recovery: "reauthenticate-preserve-unsaved" });
  });

  it("rejects unknown recovery values", () => {
    // @ts-expect-error deliberate invalid value for test
    expect(safeMetadata({ recovery: "some-other-recovery" })).toEqual({});
  });

  it("returns empty object for empty metadata", () => {
    expect(safeMetadata({})).toEqual({});
  });

  it("returns empty object for undefined metadata", () => {
    expect(safeMetadata()).toEqual({});
  });

  it("strips extra properties not in the allowlist", () => {
    const metadata = {
      issues: [],
      retryAfterSeconds: 10,
      // Extra properties that must not pass through
      stackTrace: "at Object.run (/app/src/index.ts:42:5)",
      secretKey: "sb-abc123-secret",
      internalMessage: "database connection refused",
    } as unknown as PlannerSafeErrorMetadata;

    const result = safeMetadata(metadata);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("stackTrace");
    expect(serialized).not.toContain("secretKey");
    expect(serialized).not.toContain("internalMessage");
    expect(serialized).not.toContain("database connection refused");
    expect(result.retryAfterSeconds).toBe(10);
  });

  it("sanitizes file paths in issue strings", () => {
    const result = safeMetadata({
      issues: [
        {
          path: "body.file at /home/user/project/src/handler.ts:42:10",
          message: "Error at /var/log/app/server.log:100:5",
        },
      ],
    });
    expect(result.issues?.[0]?.path).not.toContain("/home/user");
    expect(result.issues?.[0]?.message).not.toContain("/var/log");
  });

  it("sanitizes JWT-like tokens in issue strings", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzIn0.abcdefghijklmnopqrstuvwxyz";
    const result = safeMetadata({
      issues: [{ path: "auth", message: `Token ${jwt} is invalid` }],
    });
    expect(result.issues?.[0]?.message).not.toContain("eyJ");
    expect(result.issues?.[0]?.message).toContain("[redacted]");
  });
});

// ---------------------------------------------------------------------------
// 4. Internal failure exclusion (Requirement 11.9)
// ---------------------------------------------------------------------------

describe("internal failure exclusion", () => {
  it("excludes error message from response", async () => {
    const error = new Error("Connection to rxzpznmxbaoxpikowmfc failed");
    const response = plannerInternalFailure(error, "corr-internal-0001");
    const text = await response.text();

    expect(text).not.toContain("Connection to");
    expect(text).not.toContain("rxzpznmxbaoxpikowmfc");
  });

  it("excludes stack trace from response", async () => {
    const error = new Error("fail");
    error.stack = "Error: fail\n    at Object.run (/app/src/handler.ts:42:5)";
    const response = plannerInternalFailure(error, "corr-stack-0001");
    const text = await response.text();

    expect(text).not.toContain("handler.ts");
    expect(text).not.toContain("Object.run");
  });

  it("excludes attached credentials from response", async () => {
    const error = Object.assign(new Error("internal"), {
      token: "sb-eyJhbGciOiJIUzI1NiJ9.secret",
      password: "super-secret-password",
      supabaseUrl: "https://rxzpznmxbaoxpikowmfc.supabase.co",
    });
    const response = plannerInternalFailure(error, "corr-cred-0001");
    const text = await response.text();

    expect(text).not.toContain("super-secret");
    expect(text).not.toContain("sb-eyJ");
    expect(text).not.toContain("rxzpznmxbaoxpikowmfc");
    expect(text).not.toContain("supabase.co");
  });

  it("excludes request body content from response", async () => {
    const error = Object.assign(new Error("internal"), {
      requestBody: { project: { name: "Secret Project", geometry: {} } },
    });
    const response = plannerInternalFailure(error, "corr-body-0001");
    const text = await response.text();

    expect(text).not.toContain("Secret Project");
    expect(text).not.toContain("requestBody");
  });

  it("excludes cross-owner data from response", async () => {
    const error = Object.assign(new Error("forbidden"), {
      crossOwnerRecord: { ownerId: "other-user-id", projectId: "proj-999" },
    });
    const response = plannerInternalFailure(error, "corr-cross-0001");
    const text = await response.text();

    expect(text).not.toContain("other-user-id");
    expect(text).not.toContain("proj-999");
    expect(text).not.toContain("crossOwnerRecord");
  });

  it("always returns status 500 for internal failures", () => {
    const response = plannerInternalFailure(
      new Error("any"),
      "corr-status-0001",
    );
    expect(response.status).toBe(500);
  });

  it("always returns the INTERNAL_ERROR code for internal failures", async () => {
    const response = plannerInternalFailure(
      new Error("any"),
      "corr-code-0001",
    );
    const body = (await response.json()) as PlannerApiFailureBody;
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("handles non-Error exceptions safely", async () => {
    const response = plannerInternalFailure(
      "string exception with secrets: sb-abc123",
      "corr-nonobj-0001",
    );
    const text = await response.text();
    expect(text).not.toContain("sb-abc123");
    expect(response.status).toBe(500);
  });

  it("handles null and undefined exceptions safely", async () => {
    for (const value of [null, undefined, 42, true]) {
      const response = plannerInternalFailure(value, "corr-null-0001");
      const body = (await response.json()) as PlannerApiFailureBody;
      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Prohibited content scanning (defense-in-depth)
// ---------------------------------------------------------------------------

describe("isPlannerResponseSafe", () => {
  it("accepts a clean error response", () => {
    const clean = JSON.stringify({
      success: false,
      error: { code: "INVALID_REQUEST", message: "Request validation failed" },
      correlationId: "corr-test-0001",
    });
    expect(isPlannerResponseSafe(clean)).toBe(true);
  });

  it("rejects content with stack traces", () => {
    const withStack = JSON.stringify({
      error: {
        message: "Error at Object.run (/app/src/handler.ts:42:5)",
      },
    });
    expect(isPlannerResponseSafe(withStack)).toBe(false);
  });

  it("rejects content with JWT tokens", () => {
    const withJwt = JSON.stringify({
      data: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.abcdefghijklmnopqrstuvwxyz",
    });
    expect(isPlannerResponseSafe(withJwt)).toBe(false);
  });

  it("rejects content with credential key names", () => {
    const withCred = JSON.stringify({
      "service_role_key": "sb-secret-value-here",
    });
    expect(isPlannerResponseSafe(withCred)).toBe(false);
  });

  it("rejects content with Supabase service role key pattern", () => {
    const withKey = JSON.stringify({
      key: "sb-" + "A".repeat(60),
    });
    expect(isPlannerResponseSafe(withKey)).toBe(false);
  });

  it("rejects content with Node.js file system errors", () => {
    const withFsError = JSON.stringify({
      message: "ENOENT: no such file or directory /app/data/projects/p1.json",
    });
    expect(isPlannerResponseSafe(withFsError)).toBe(false);
  });

  it("accepts content with normal words that could partially match", () => {
    const normal = JSON.stringify({
      message: "Authentication required",
      code: "AUTH_REQUIRED",
    });
    expect(isPlannerResponseSafe(normal)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. sanitizeOperationFailure (Requirements 11.8, 11.9)
// ---------------------------------------------------------------------------

describe("sanitizeOperationFailure", () => {
  it("passes through known error codes unchanged", () => {
    const codes: PlannerApiErrorCode[] = [
      "AUTH_REQUIRED",
      "INVALID_REQUEST",
      "NOT_FOUND",
      "RATE_LIMITED",
      "REVISION_CONFLICT",
      "SERVICE_UNAVAILABLE",
    ];
    for (const code of codes) {
      const result = sanitizeOperationFailure({ code });
      expect(result.code).toBe(code);
    }
  });

  it("maps unknown error codes to INTERNAL_ERROR", () => {
    const result = sanitizeOperationFailure({
      code: "DATABASE_CONNECTION_REFUSED",
    });
    expect(result.code).toBe("INTERNAL_ERROR");
  });

  it("maps empty string to INTERNAL_ERROR", () => {
    const result = sanitizeOperationFailure({ code: "" });
    expect(result.code).toBe("INTERNAL_ERROR");
  });

  it("sanitizes metadata through the allowlist", () => {
    const result = sanitizeOperationFailure({
      code: "INVALID_REQUEST",
      metadata: {
        issues: [{ path: "body.name", message: "Too short" }],
        retryAfterSeconds: 30,
        // @ts-expect-error testing extra property rejection
        internalDebugInfo: "SELECT * FROM oando_plans WHERE ...",
      },
    });
    const serialized = JSON.stringify(result.metadata);
    expect(serialized).not.toContain("internalDebugInfo");
    expect(serialized).not.toContain("SELECT");
    expect(result.metadata.issues).toHaveLength(1);
    expect(result.metadata.retryAfterSeconds).toBe(30);
  });

  it("returns empty metadata when no metadata is provided", () => {
    const result = sanitizeOperationFailure({ code: "NOT_FOUND" });
    expect(result.metadata).toEqual({});
  });

  it("sanitizes file paths inside issue messages", () => {
    const result = sanitizeOperationFailure({
      code: "INVALID_REQUEST",
      metadata: {
        issues: [
          {
            path: "body",
            message:
              "Failed parsing at /home/deploy/site/lib/Planner/handler.ts:55:12",
          },
        ],
      },
    });
    expect(result.metadata.issues?.[0]?.message).not.toContain(
      "/home/deploy/site",
    );
  });
});

// ---------------------------------------------------------------------------
// 7. End-to-end: error response structure conformance
// ---------------------------------------------------------------------------

describe("error response envelope structure", () => {
  it("every failure response has success=false, error.code, error.message, and correlationId", async () => {
    const codes: PlannerApiErrorCode[] = [
      "AUTH_REQUIRED",
      "CSRF_REJECTED",
      "INTERNAL_ERROR",
      "INVALID_REQUEST",
      "METHOD_NOT_ALLOWED",
      "NOT_FOUND",
      "ORIGIN_REJECTED",
      "OWNER_SCOPE_REJECTED",
      "RATE_LIMITED",
      "REVISION_CONFLICT",
      "SERVICE_UNAVAILABLE",
    ];
    for (const code of codes) {
      const response = plannerApiFailure(code, "corr-envelope-0001", 400);
      const body = (await response.json()) as PlannerApiFailureBody;

      expect(body).toHaveProperty("success", false);
      expect(body).toHaveProperty("error");
      expect(body.error).toHaveProperty("code");
      expect(body.error).toHaveProperty("message");
      expect(body).toHaveProperty("correlationId");
      expect(typeof body.error.code).toBe("string");
      expect(typeof body.error.message).toBe("string");
      expect(typeof body.correlationId).toBe("string");
    }
  });

  it("success response has success=true, data, contractVersion, and correlationId", async () => {
    const response = plannerApiSuccess({ id: "p1" }, "corr-success-0001");
    const body = await response.json();

    expect(body).toHaveProperty("success", true);
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("contractVersion");
    expect(body).toHaveProperty("correlationId", "corr-success-0001");
  });
});
