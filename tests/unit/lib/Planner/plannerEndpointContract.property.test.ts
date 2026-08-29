// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 15: Endpoint contract completeness
//
// **Validates: Requirements 11.1**

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  PLANNER_ENDPOINT_DESCRIPTORS,
  PLANNER_ENDPOINT_CONTRACT_VERSION,
} from "@planner/lib/plannerEndpointContract";

const PROPERTY_RUNS = 100;
const PROPERTY_SEED = 20260842;

const descriptorArbitrary = fc.constantFrom(...PLANNER_ENDPOINT_DESCRIPTORS);

describe("Property 15: Endpoint contract completeness", () => {
  it("defines method, schemas, statuses, authorization, mutation controls, and quota for every operation", () => {
    fc.assert(
      fc.property(descriptorArbitrary, (descriptor) => {
        expect(descriptor.contractVersion).toBe(PLANNER_ENDPOINT_CONTRACT_VERSION);
        expect(descriptor.id.length).toBeGreaterThan(0);
        expect(["GET", "POST", "PATCH", "DELETE"]).toContain(
          descriptor.method,
        );
        expect(descriptor.path.startsWith("/api/Planner/")).toBe(true);

        expect(descriptor.request.path).toBeDefined();
        expect(descriptor.request.query).toBeDefined();
        expect(descriptor.request.headers).toBeDefined();
        expect(descriptor.request.body.type).toBeTruthy();
        expect(descriptor.request.contentType).toMatch(
          /^(none|application\/json|multipart\/form-data)$/,
        );

        expect(descriptor.responses.success.length).toBeGreaterThan(0);
        expect(descriptor.responses.errors.length).toBeGreaterThan(0);
        expect(
          descriptor.responses.success.every(
            (response) => response.status >= 200 && response.status < 300,
          ),
        ).toBe(true);
        expect(
          descriptor.responses.errors.some((response) => response.status === 405),
        ).toBe(true);
        expect(
          descriptor.responses.errors.some((response) => response.status === 429),
        ).toBe(true);
        for (const response of [
          ...descriptor.responses.success,
          ...descriptor.responses.errors,
        ]) {
          expect(response.envelope).toBeTruthy();
          expect(response.schema.type).toBeTruthy();
          expect(response.description.length).toBeGreaterThan(0);
        }

        expect(["guest", "member"]).toContain(descriptor.security.auth);
        expect(descriptor.security.owner).toBeTruthy();
        expect(descriptor.security.csrf).toMatch(
          /^(not-required|double-submit-cookie)$/,
        );
        expect(descriptor.security.origin).toMatch(
          /^(same-site-cookie|same-site-cookie-and-csrf)$/,
        );
        if (descriptor.method !== "GET") {
          expect(descriptor.security.csrf).toBe("double-submit-cookie");
          expect(descriptor.security.origin).toBe(
            "same-site-cookie-and-csrf",
          );
        }

        expect(descriptor.rateLimit.scope.length).toBeGreaterThan(0);
        expect(descriptor.rateLimit.requests).toBeGreaterThan(0);
        expect(descriptor.rateLimit.windowMs).toBe(60_000);
        expect(descriptor.rateLimit.key).toBe("normalized-client-ip");
      }),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
    );
  });
});
