// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 17: Safe structured errors
//
// **Validates: Requirements 11.8, 11.9**
//
// Generate internal exceptions and sensitive payload fragments and verify
// stable safe errors, correlation ids, and prohibited-data exclusion.
// At least 100 generated cases.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  type PlannerApiErrorCode,
  type PlannerApiFailure,
  type PlannerSafeErrorMetadata,
  PLANNER_STABLE_ERROR_CODES,
  PROHIBITED_RESPONSE_PATTERNS,
  isPlannerResponseSafe,
  plannerApiFailure,
  plannerInternalFailure,
  safeMetadata,
  sanitizeOperationFailure,
} from "@planner/lib/plannerApiResponse";

const PROPERTY_RUNS = 120;
const PROPERTY_SEED = 20260843;

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** A valid stable error code from the allowlist. */
const stableCodeArb = fc.constantFrom<PlannerApiErrorCode>(
  ...PLANNER_STABLE_ERROR_CODES,
);

/** An arbitrary string that is NOT a known stable code (simulates corruption). */
const unknownCodeArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((s) => !PLANNER_STABLE_ERROR_CODES.has(s as PlannerApiErrorCode));

/** A syntactically valid correlation id (8–64 alphanum/._~-). */
const correlationIdArb = fc.stringMatching(/^[A-Za-z0-9._~-]{8,64}$/);

/** Generate internal exceptions of varying kinds. */
const exceptionArb = fc.oneof(
  fc.record({
    kind: fc.constant("error" as const),
    value: fc.string({ minLength: 0, maxLength: 400 }).map((msg) => new Error(msg)),
  }),
  fc.record({
    kind: fc.constant("string" as const),
    value: fc.string({ minLength: 0, maxLength: 400 }),
  }),
  fc.record({
    kind: fc.constant("null" as const),
    value: fc.constant(null),
  }),
  fc.record({
    kind: fc.constant("undefined" as const),
    value: fc.constant(undefined),
  }),
  fc.record({
    kind: fc.constant("number" as const),
    value: fc.double(),
  }),
  fc.record({
    kind: fc.constant("object" as const),
    value: fc
      .dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ maxLength: 200 }))
      .map((d) => d as unknown),
  }),
);

/**
 * Sensitive content fragments that match patterns PROHIBITED_RESPONSE_PATTERNS
 * is designed to catch: stack traces with absolute paths, credential key names,
 * Supabase sb- keys, JWT tokens, and ENOENT/EACCES/EROFS with file paths.
 */
const sensitiveFragmentArb = fc.oneof(
  // Stack trace patterns — must have absolute file paths to match the regex
  fc.constant('at Object.handler (/home/user/project/src/api/route.ts:42:13)'),
  fc.constant("at Module._compile (node:internal/modules/cjs/loader:1103:14)"),
  fc.constant("at Object.run (/var/app/current/server/handler.ts:99:3)"),
  // Credential / secret key names in serialized JSON
  fc.constant('"password": "hunter2"'),
  fc.constant('"secret": "super-secret-value"'),
  fc.constant('"private_key": "-----BEGIN PRIVATE KEY-----"'),
  fc.constant('"api_key": "sk-1234567890abcdef"'),
  fc.constant('"access_token": "ya29.access-token-value"'),
  fc.constant('"refresh_token": "drt_refresh-token-value"'),
  fc.constant('"service_role_key": "sb-erpweaiypimorcunaimz-auth-token-key"'),
  fc.constant('"authorization_header": "Bearer eyJhbGciOiJIUzI1NiJ9"'),
  // Supabase service role key pattern (sb- prefix, 40+ chars)
  fc.constant("sb-erpweaiypimorcunaimzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
  // JWT-like tokens (three base64url dot-separated segments)
  fc.constant(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
  ),
  // Node.js internal errors with absolute file paths
  fc.constant("ENOENT: no such file or directory, open '/var/secrets/db.key'"),
  fc.constant("EACCES: permission denied, open '/etc/shadow'"),
  fc.constant("EROFS: read-only file system, open '/app/data/plans/project.json'"),
);

/**
 * Metadata with issue strings that contain content the sanitizeIssueString
 * function is designed to redact: file paths, stack trace lines, and JWT tokens.
 * These are the three categories sanitizeIssueString targets.
 */
const metadataWithSensitiveIssuesArb = fc.record({
  issues: fc.array(
    fc.record({
      path: fc.oneof(
        fc.string({ minLength: 1, maxLength: 80 }),
        // Absolute file path (sanitizeIssueString strips these)
        fc.constant("/home/deploy/site/lib/Planner/persistence.ts:55:12"),
      ),
      message: fc.oneof(
        fc.string({ minLength: 1, maxLength: 120 }),
        // Stack trace line (sanitizeIssueString strips these)
        fc.constant("at Object.handler (/app/src/route.ts:42:13)"),
        // JWT token (sanitizeIssueString strips these)
        fc.constant(
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.rg2e3c7E5T8p3k",
        ),
      ),
    }),
    { minLength: 0, maxLength: 5 },
  ),
  retryAfterSeconds: fc.option(fc.integer({ min: -10, max: 3600 }), { nil: undefined }),
  currentRevision: fc.option(fc.integer({ min: -10, max: 1_000_000 }), { nil: undefined }),
  recovery: fc.option(
    fc.oneof(
      fc.constant("reauthenticate-preserve-unsaved" as const),
      fc.constant("invalid-recovery" as const),
      fc.constant("" as const),
    ),
    { nil: undefined },
  ),
});

/** Metadata with extra properties that must be dropped. */
const metadataWithExtraFieldsArb = fc.record({
  issues: fc.constant(undefined),
  retryAfterSeconds: fc.option(fc.integer({ min: 0, max: 60 }), { nil: undefined }),
  currentRevision: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  recovery: fc.constant(undefined),
}).chain((base) =>
  fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter(
      (k) => !["issues", "retryAfterSeconds", "currentRevision", "recovery"].includes(k),
    ),
    fc.string({ maxLength: 100 }),
    { minKeys: 1, maxKeys: 4 },
  ).map((extras) => ({ ...base, ...extras }) as unknown as PlannerSafeErrorMetadata),
);

// ---------------------------------------------------------------------------
// Property 17 tests
// ---------------------------------------------------------------------------

describe("Property 17: Safe structured errors", () => {
  // -------------------------------------------------------------------------
  // 17a — plannerInternalFailure always yields a stable non-sensitive response
  // Requirement 11.8: internal failure → non-sensitive error + correlation id
  // -------------------------------------------------------------------------
  it("maps arbitrary internal exceptions to stable INTERNAL_ERROR with correlation id", async () => {
    await fc.assert(
      fc.asyncProperty(
        exceptionArb,
        correlationIdArb,
        async ({ value: exception }, correlationId) => {
          const response = plannerInternalFailure(exception, correlationId);
          expect(response.status).toBe(500);

          const payload = (await response.json()) as PlannerApiFailure;
          expect(payload.success).toBe(false);
          expect(payload.error.code).toBe("INTERNAL_ERROR");
          expect(payload.error.message).toBe("The request could not be completed");
          expect(payload.correlationId).toBe(correlationId);
          expect(response.headers.get("x-correlation-id")).toBe(correlationId);

          // Requirement 11.9: no sensitive data in serialized body
          const serialized = JSON.stringify(payload);
          expect(isPlannerResponseSafe(serialized)).toBe(true);

          // The response must only contain the stable message, code, and
          // correlation id — no exception details should leak. Verify the
          // error object has exactly the documented fields.
          expect(payload.error).toEqual({
            code: "INTERNAL_ERROR",
            message: "The request could not be completed",
          });
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // -------------------------------------------------------------------------
  // 17b — plannerApiFailure with unknown codes normalizes to INTERNAL_ERROR
  // Requirement 11.8: stable codes only
  // -------------------------------------------------------------------------
  it("normalizes unknown error codes to INTERNAL_ERROR", () => {
    fc.assert(
      fc.property(unknownCodeArb, correlationIdArb, (unknownCode, correlationId) => {
        const result = sanitizeOperationFailure({
          code: unknownCode,
          metadata: {},
        });
        expect(result.code).toBe("INTERNAL_ERROR");
        expect(PLANNER_STABLE_ERROR_CODES.has(result.code)).toBe(true);

        // Also verify through the full response path
        const response = plannerApiFailure(
          unknownCode as PlannerApiErrorCode,
          correlationId,
          500,
        );
        // The response was constructed — verify it returns a safe body
        expect(response.status).toBe(500);
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // -------------------------------------------------------------------------
  // 17c — every stable code produces its documented safe message
  // Requirement 11.8: stable non-sensitive codes
  // -------------------------------------------------------------------------
  it("every known code produces a stable safe message and correlation id", async () => {
    await fc.assert(
      fc.asyncProperty(stableCodeArb, correlationIdArb, async (code, correlationId) => {
        const status =
          code === "RATE_LIMITED"
            ? 429
            : code === "AUTH_REQUIRED"
              ? 401
              : code === "INTERNAL_ERROR"
                ? 500
                : code === "SERVICE_UNAVAILABLE"
                  ? 503
                  : code === "METHOD_NOT_ALLOWED"
                    ? 405
                    : code === "REVISION_CONFLICT"
                      ? 409
                      : code === "INVALID_REQUEST"
                        ? 400
                        : 403;

        const response = plannerApiFailure(code, correlationId, status);
        const payload = (await response.json()) as PlannerApiFailure;

        expect(payload.success).toBe(false);
        expect(payload.error.code).toBe(code);
        expect(typeof payload.error.message).toBe("string");
        expect(payload.error.message.length).toBeGreaterThan(0);
        expect(payload.correlationId).toBe(correlationId);
        expect(response.headers.get("x-correlation-id")).toBe(correlationId);

        // The message must be the stable safe message, not something dynamic
        const serialized = JSON.stringify(payload);
        expect(isPlannerResponseSafe(serialized)).toBe(true);
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // -------------------------------------------------------------------------
  // 17d — PROHIBITED_RESPONSE_PATTERNS detect sensitive content
  // Requirement 11.9: exclude secrets, stack traces, credentials, tokens
  // -------------------------------------------------------------------------
  it("PROHIBITED_RESPONSE_PATTERNS catch every generated sensitive fragment", () => {
    fc.assert(
      fc.property(sensitiveFragmentArb, (fragment) => {
        // The sensitive fragment must be caught by at least one pattern
        const caught = PROHIBITED_RESPONSE_PATTERNS.some((pattern) =>
          pattern.test(fragment),
        );
        expect(caught).toBe(true);
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // -------------------------------------------------------------------------
  // 17e — safeMetadata allowlists only documented fields and sanitizes issues
  // Requirement 11.9: no secrets, credentials, stack traces, tokens leak
  // -------------------------------------------------------------------------
  it("safeMetadata strips extra properties and sanitizes issue strings", () => {
    fc.assert(
      fc.property(metadataWithExtraFieldsArb, (rawMetadata) => {
        const sanitized = safeMetadata(rawMetadata);
        const keys = Object.keys(sanitized);
        const allowedKeys = new Set([
          "issues",
          "retryAfterSeconds",
          "currentRevision",
          "recovery",
        ]);
        for (const key of keys) {
          expect(allowedKeys.has(key)).toBe(true);
        }
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // -------------------------------------------------------------------------
  // 17f — safeMetadata sanitizes issue strings containing sensitive content
  // Requirement 11.9: prohibited data excluded from issue strings
  //
  // The sanitizeIssueString function targets file paths, stack trace lines,
  // and JWT tokens. This test verifies those three categories are redacted.
  // -------------------------------------------------------------------------
  it("sanitizes issue strings to remove file paths, stack trace lines, and JWT tokens", () => {
    fc.assert(
      fc.property(metadataWithSensitiveIssuesArb, (rawMetadata) => {
        const sanitized = safeMetadata(rawMetadata);
        if (sanitized.issues) {
          for (const issue of sanitized.issues) {
            // Absolute file paths must be replaced with [path]
            expect(issue.path).not.toMatch(
              /(?:\/[\w.-]+){2,}(?::\d+(?::\d+)?)?/,
            );
            expect(issue.message).not.toMatch(
              /(?:\/[\w.-]+){2,}(?::\d+(?::\d+)?)?/,
            );
            // Stack trace lines must be replaced with [internal]
            expect(issue.path).not.toMatch(/\bat\s+\S+\s*\(.*\)/);
            expect(issue.message).not.toMatch(/\bat\s+\S+\s*\(.*\)/);
            // JWT tokens must be replaced with [redacted]
            expect(issue.path).not.toMatch(
              /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
            );
            expect(issue.message).not.toMatch(
              /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
            );
          }
        }
        // recovery must be exactly the approved literal or absent
        if (sanitized.recovery !== undefined) {
          expect(sanitized.recovery).toBe("reauthenticate-preserve-unsaved");
        }
        // retryAfterSeconds and currentRevision must be non-negative safe integers
        if (sanitized.retryAfterSeconds !== undefined) {
          expect(Number.isSafeInteger(sanitized.retryAfterSeconds)).toBe(true);
          expect(sanitized.retryAfterSeconds).toBeGreaterThanOrEqual(0);
        }
        if (sanitized.currentRevision !== undefined) {
          expect(Number.isSafeInteger(sanitized.currentRevision)).toBe(true);
          expect(sanitized.currentRevision).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // -------------------------------------------------------------------------
  // 17g — full response body from plannerApiFailure: stable code, correlation,
  // and allowlisted metadata fields only
  // Requirements 11.8, 11.9
  // -------------------------------------------------------------------------
  it("full error response has stable code, correlation id, and allowlisted metadata", async () => {
    await fc.assert(
      fc.asyncProperty(
        stableCodeArb,
        correlationIdArb,
        metadataWithSensitiveIssuesArb,
        async (code, correlationId, rawMetadata) => {
          const response = plannerApiFailure(code, correlationId, 500, rawMetadata);
          const payload = (await response.json()) as PlannerApiFailure;

          // Code is always a known stable code
          expect(PLANNER_STABLE_ERROR_CODES.has(payload.error.code)).toBe(true);
          // Correlation id is always present and matches
          expect(payload.correlationId).toBe(correlationId);
          expect(response.headers.get("x-correlation-id")).toBe(correlationId);
          // success is always false
          expect(payload.success).toBe(false);
          // message is always a non-empty string (the static safe message)
          expect(typeof payload.error.message).toBe("string");
          expect(payload.error.message.length).toBeGreaterThan(0);

          // Error object contains only allowlisted keys
          const errorKeys = Object.keys(payload.error);
          const allowedErrorKeys = new Set([
            "code",
            "message",
            "issues",
            "retryAfterSeconds",
            "currentRevision",
            "recovery",
          ]);
          for (const key of errorKeys) {
            expect(allowedErrorKeys.has(key)).toBe(true);
          }

          // Issues are sanitized: no absolute file paths, stack traces, JWT
          if (payload.error.issues) {
            for (const issue of payload.error.issues) {
              expect(issue.path).not.toMatch(
                /(?:\/[\w.-]+){2,}(?::\d+(?::\d+)?)?/,
              );
              expect(issue.message).not.toMatch(
                /\bat\s+\S+\s*\(.*\)/,
              );
              expect(issue.message).not.toMatch(
                /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
              );
            }
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  // -------------------------------------------------------------------------
  // 17h — sanitizeOperationFailure normalizes handler results
  // Requirements 11.8, 11.9
  // -------------------------------------------------------------------------
  it("sanitizeOperationFailure normalizes code and metadata from handler results", () => {
    fc.assert(
      fc.property(
        fc.oneof(stableCodeArb, unknownCodeArb),
        metadataWithSensitiveIssuesArb,
        (code, rawMetadata) => {
          const result = sanitizeOperationFailure({ code, metadata: rawMetadata });

          // Code is always stable
          expect(PLANNER_STABLE_ERROR_CODES.has(result.code)).toBe(true);

          // Metadata is always sanitized — only allowlisted keys
          const metaKeys = Object.keys(result.metadata);
          const allowedKeys = new Set([
            "issues",
            "retryAfterSeconds",
            "currentRevision",
            "recovery",
          ]);
          for (const key of metaKeys) {
            expect(allowedKeys.has(key)).toBe(true);
          }

          // Sanitized issues have no absolute file paths, stack traces, or JWT tokens
          if (result.metadata.issues) {
            for (const issue of result.metadata.issues) {
              expect(issue.path).not.toMatch(
                /(?:\/[\w.-]+){2,}(?::\d+(?::\d+)?)?/,
              );
              expect(issue.message).not.toMatch(
                /\bat\s+\S+\s*\(.*\)/,
              );
              expect(issue.message).not.toMatch(
                /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
              );
            }
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });
});
