// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 2: Protected operations are non-executable and complete.
//
// Validates: Requirements 1.2, 6.3

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  AuthorizationGuard,
  PROTECTED_ACTIONS,
  type ProtectedAction,
  type Surface,
} from "../../scripts/operations-review";

const protectedActionInventory = [
  { action: "vercel-deployment", targetSurface: "vercel-application" },
  {
    action: "cloudflare-worker-deployment",
    targetSurface: "cloudflare-worker",
  },
  { action: "provider-inspection", targetSurface: "monitoring" },
  { action: "products-backup", targetSurface: "products-database" },
  { action: "admin-backup", targetSurface: "admin-database" },
  { action: "r2-write", targetSurface: "r2-backup" },
  { action: "r2-retrieval", targetSurface: "r2-backup" },
  { action: "restore", targetSurface: "admin-database" },
  { action: "migration", targetSurface: "products-database" },
  { action: "seed", targetSurface: "admin-database" },
  { action: "local-observability-startup", targetSurface: "monitoring" },
  { action: "provider-log-access", targetSurface: "cloudflare-worker" },
] as const satisfies readonly {
  readonly action: ProtectedAction;
  readonly targetSurface: Surface;
}[];

const inventoryActionSet = new Set(
  protectedActionInventory.map(({ action }) => action),
);
const expectedEvidenceArb = fc
  .array(fc.string(), { minLength: 1, maxLength: 4 })
  .map((evidence) =>
    evidence.map((item, index) => `evidence-${index}-${item.trim() || "item"}`),
  );

describe("Property 2: Protected operations are non-executable and complete", () => {
  it("covers the complete protected-action inventory", () => {
    expect(new Set(PROTECTED_ACTIONS)).toEqual(inventoryActionSet);
    expect(PROTECTED_ACTIONS).toHaveLength(protectedActionInventory.length);
  });

  it("emits exactly one complete pending metadata record for every generated protected operation", () => {
    const authorizationGuard = new AuthorizationGuard();

    fc.assert(
      fc.property(
        fc.constantFrom(...protectedActionInventory),
        expectedEvidenceArb,
        fc.constantFrom("not-run", "pending-authorization"),
        ({ action, targetSurface }, expectedEvidence, executionStatus) => {
          const operation = authorizationGuard.classify({
            action,
            targetSurface,
            expectedEvidence,
            executionStatus,
          });

          expect(operation).toEqual({
            operation: action,
            targetSurface,
            classification: "protected-operation",
            requiredAuthorization: expect.stringContaining("Explicit"),
            expectedEvidence,
            executionStatus,
          });
          expect(Object.keys(operation).sort()).toEqual([
            "classification",
            "executionStatus",
            "expectedEvidence",
            "operation",
            "requiredAuthorization",
            "targetSurface",
          ]);
          expect(operation).not.toHaveProperty("executionResult");
          expect(operation).not.toHaveProperty("executedAt");
        },
      ),
      { numRuns: 100 },
    );
  });
});
