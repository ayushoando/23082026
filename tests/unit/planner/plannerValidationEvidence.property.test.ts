// @vitest-environment node
// Feature: planner-comprehensive-audit, Property 27: Authorization-gated validation
// Feature: planner-comprehensive-audit, Property 28: Change-derived validation plan
// Feature: planner-comprehensive-audit, Property 29: Evidence-class separation
// Validates: Requirements 14.10, 17.7, 18.1-18.9, 19.4-19.6

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { EvidenceRecord, HookPermissionState, UserAuthorizationState } from "../../../plans/planner-comprehensive-audit/auditModel";
import {
  derivePlannerValidationManifest,
  evidenceClassForOrigin,
  FORBIDDEN_VALIDATION_COMMANDS,
  hasSeparatedEvidenceClass,
  isValidationExecutionEligible,
  recordValidationEvidence,
  type EvidenceOrigin,
  type PlannerValidationCategory,
  type PlannerValidationFindingInput,
} from "../../../plans/planner-comprehensive-audit/validationEvidence";

const PROPERTY_RUNS = 200;
const userAuthorizationArbitrary = fc.constantFrom<UserAuthorizationState>("not-requested", "not-authorized", "authorized");
const hookPermissionArbitrary = fc.constantFrom<HookPermissionState>("not-observed", "denied", "permitted");
const categoryArbitrary = fc.uniqueArray(fc.constantFrom<PlannerValidationCategory>("unit", "integration", "browser", "accessibility", "performance", "fork", "focss", "type", "migration", "full-gate"), { minLength: 1, maxLength: 10 });

function finding(categories: readonly PlannerValidationCategory[], changedPaths: readonly string[]): PlannerValidationFindingInput {
  return { id: "finding:generated", categories, changedPaths };
}

describe("Property 27: Authorization-gated validation", () => {
  it("records an outcome only when both exact authorization states permit execution", () => {
    fc.assert(fc.property(userAuthorizationArbitrary, hookPermissionArbitrary, fc.integer(), (userAuthorization, hookPermission, exitStatus) => {
      const action = derivePlannerValidationManifest([finding(["type"], ["site/lib/Planner/observability/plannerObservability.ts"])])[0];
      const eligible = isValidationExecutionEligible(userAuthorization, hookPermission);
      const record = recordValidationEvidence({
        action,
        userAuthorization,
        hookPermission,
        observation: { exitStatus, outcome: exitStatus === 0 ? "acceptable" : "unacceptable", evidenceRefs: ["evidence:generated"], outputLimitation: "Generated property observation." },
      });
      expect(record.state).toBe(eligible ? "observed" : "pending");
      if (record.state === "pending") {
        expect(record.exitStatus).toBeNull();
        expect(record.outcome).toBeNull();
        expect(record.exactCommand).toBe(action.exactCommand);
      } else {
        expect(record.userAuthorization).toBe("authorized");
        expect(record.hookPermission).toBe("permitted");
      }
    }), { numRuns: PROPERTY_RUNS, seed: 27_202_608, endOnFailure: true });
  });
});

describe("Property 28: Change-derived validation plan", () => {
  it("derives every narrow path/category trigger and always excludes typecheck:scripts", () => {
    fc.assert(fc.property(categoryArbitrary, (categories) => {
      const paths = [
        "site/components/Planner/Example.tsx",
        "site/focss/planner/example.css",
        "site/platform/supabase/migrations.admin/20990101000000_example.sql",
        "tests/unit/planner/example.test.ts",
      ];
      const manifest = derivePlannerValidationManifest([{
        ...finding(categories, paths),
        targetedTestPaths: ["tests/unit/planner/example.test.ts"],
        requiresFullGate: categories.includes("full-gate"),
      }]);
      const commands = manifest.map((entry) => entry.exactCommand);
      expect(commands).toContain("pnpm run scan:boundaries");
      expect(commands).toContain("pnpm run verify:focss");
      expect(commands).toContain("pnpm run lint:ui:strict");
      expect(commands).toContain("pnpm run check:style-tokens");
      expect(commands).toContain("pnpm run typecheck");
      expect(commands).toContain("pnpm run typecheck:tests");
      expect(commands).toContain("pnpm run db:apply:admin -- --dry");
      expect(commands).toContain("pnpm run db:types:admin");
      expect(commands.join("\n")).not.toContain("typecheck:scripts");
      for (const forbidden of FORBIDDEN_VALIDATION_COMMANDS) expect(commands).not.toContain(forbidden);
    }), { numRuns: PROPERTY_RUNS, seed: 28_202_608, endOnFailure: true });
  });
});

describe("Property 29: Evidence-class separation", () => {
  it("accepts exactly the class fixed by the generated evidence origin and rejects promotion from static inspection", () => {
    const origins: readonly EvidenceOrigin[] = ["static-inspection", "browser-run", "integration-run", "hosted-inspection", "deployment-smoke"];
    fc.assert(fc.property(fc.constantFrom(...origins), fc.constantFrom("repository", "browser", "integration", "hosted", "deployment"), (origin, claimedClass) => {
      const record: EvidenceRecord = { id: "evidence:generated", class: claimedClass, summary: "Generated evidence record", sourceRefs: ["source"], limitation: "Generated property input" };
      expect(hasSeparatedEvidenceClass(record, origin)).toBe(claimedClass === evidenceClassForOrigin(origin));
      if (origin === "static-inspection" && claimedClass !== "repository") expect(hasSeparatedEvidenceClass(record, origin)).toBe(false);
    }), { numRuns: PROPERTY_RUNS, seed: 29_202_608, endOnFailure: true });
  });
});
