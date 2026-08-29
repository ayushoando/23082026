// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 17: Safe structured errors
//
// **Validates: Requirements 11.8, 11.9**

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  PLANNER_CORRELATION_HEADER,
  isValidPlannerCorrelationId,
  plannerInternalFailure,
  resolvePlannerCorrelationId,
} from "@planner/lib/plannerApiResponse";

const PROPERTY_RUNS = 100;
const PROPERTY_SEED = 20260844;

const sensitiveFragmentArbitrary = fc
  .array(fc.stringMatching(/^[A-Za-z0-9]{8,32}$/), {
    minLength: 1,
    maxLength: 8,
  })
  .map((values) => values.map((value, index) => `SENSITIVE_${index}_${value}`));

describe("Property 17: Safe structured errors", () => {
  it("maps arbitrary internal failures to a stable correlation-bearing response without sensitive content", async () => {
    await fc.assert(
      fc.asyncProperty(sensitiveFragmentArbitrary, async (fragments) => {
        const correlationId = "corr-safe-errors-0001";
        const exception = Object.assign(
          new Error(`stack ${fragments.join(" ")}`),
          {
            token: fragments[0],
            credentials: fragments[1],
            requestBody: { project: fragments[2] },
            crossOwnerRecord: fragments[3],
          },
        );

        const response = plannerInternalFailure(exception, correlationId);
        const text = await response.text();
        const payload = JSON.parse(text) as {
          success: boolean;
          error: { code: string; message: string };
          correlationId: string;
        };

        expect(response.status).toBe(500);
        expect(payload).toEqual({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "The request could not be completed",
          },
          correlationId,
        });
        expect(response.headers.get(PLANNER_CORRELATION_HEADER)).toBe(
          correlationId,
        );
        for (const fragment of fragments) {
          expect(text).not.toContain(fragment);
        }
        expect(text).not.toContain("stack");
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });

  it("accepts only bounded opaque inbound correlation identifiers", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (inbound) => {
        const generated = "corr-generated-0001";
        const resolved = resolvePlannerCorrelationId(inbound, () => generated);
        expect(isValidPlannerCorrelationId(resolved)).toBe(true);
        expect(resolved.length).toBeLessThanOrEqual(64);
        if (!isValidPlannerCorrelationId(inbound)) {
          expect(resolved).toBe(generated);
        }
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED + 1 },
    );
  });
});
