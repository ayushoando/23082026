import { describe, expect, it } from "vitest";

import {
  derivePlannerValidationManifest,
  recordValidationEvidence,
  type PlannerValidationFindingInput,
} from "../../../plans/planner-comprehensive-audit/validationEvidence";

function finding(
  id: string,
  categories: PlannerValidationFindingInput["categories"],
  changedPaths: readonly string[],
  targetedTestPaths: readonly string[] = [],
): PlannerValidationFindingInput {
  return { id, categories, changedPaths, targetedTestPaths };
}

describe("Planner task 5.11 validation manifest", () => {
  it("keeps each derived action linked only to findings that trigger that check", () => {
    const manifest = derivePlannerValidationManifest([
      finding(
        "finding:unit-only",
        ["unit"],
        ["plans/planner-comprehensive-audit/validationEvidence.ts"],
        ["tests/unit/planner/plannerValidationManifest.test.ts"],
      ),
      finding(
        "finding:browser-only",
        ["responsive", "touch", "keyboard"],
        ["site/app/ooplanner/page.tsx"],
        ["tests/e2e/planner-comprehensive-audit-regression.spec.ts"],
      ),
    ]);

    const unit = manifest.find((action) => action.id === "validation:w5:unit");
    const responsive = manifest.find((action) => action.id === "validation:w5:responsive");
    const fork = manifest.find((action) => action.id === "validation:w5:fork-boundary");

    expect(unit?.findingIds).toEqual(["finding:unit-only"]);
    expect(responsive?.findingIds).toEqual(["finding:browser-only"]);
    expect(fork?.findingIds).toEqual(["finding:browser-only"]);
  });

  it("derives the required narrow commands from path and finding categories without the unavailable scripts typecheck", () => {
    const manifest = derivePlannerValidationManifest([
      {
        ...finding(
          "finding:all-checks",
          [
            "unit",
            "integration",
            "browser",
            "accessibility",
            "responsive",
            "touch",
            "keyboard",
            "api",
            "persistence",
            "performance",
            "fork",
            "focss",
            "type",
            "migration",
            "full-gate",
          ],
          [
            "site/app/api/Planner/projects/route.ts",
            "site/focss/planner/validation.css",
            "site/platform/supabase/migrations.admin/20990101000000_validation.sql",
            "tests/unit/planner/plannerValidationManifest.test.ts",
          ],
          [
            "tests/unit/planner/plannerValidationManifest.test.ts",
            "tests/integration/planner/plannerWorkstream5Regression.test.ts",
            "tests/e2e/planner-comprehensive-audit-regression.spec.ts",
            "tests/e2e/planner-performance-required.spec.ts",
          ],
        ),
        requiresFullGate: true,
      },
    ]);
    const commands = manifest.map((action) => action.exactCommand);

    expect(commands).toEqual(expect.arrayContaining([
      "pnpm run scan:boundaries",
      "pnpm run verify:focss",
      "pnpm run lint:ui:strict",
      "pnpm run check:style-tokens",
      "pnpm run typecheck",
      "pnpm run typecheck:tests",
      "pnpm run db:apply:admin -- --dry",
      "pnpm run db:types:admin",
      "pnpm run gate",
    ]));
    expect(commands.join("\n")).not.toContain("typecheck:scripts");
  });

  it("records an unexecuted action without an exit result and preserves the pending owner action", () => {
    const action = derivePlannerValidationManifest([
      finding(
        "finding:migration",
        ["migration"],
        ["site/platform/supabase/migrations.admin/20990101000000_validation.sql"],
      ),
    ]).find((candidate) => candidate.id === "validation:w5:migration-dry-run");

    if (!action) throw new Error("Expected the migration dry-run action.");

    const record = recordValidationEvidence({
      action,
      userAuthorization: "authorized",
      hookPermission: "permitted",
    });

    expect(record).toMatchObject({
      state: "pending",
      target: "hosted",
      exactCommand: null,
      exitStatus: null,
      outcome: null,
      evidenceRefs: [],
      userAuthorization: "authorized",
      hookPermission: "permitted",
    });
    expect(record.pendingOwnerAction).toContain(action.exactCommand);
    expect(record.limitation).toContain("Unverified behavior:");
  });

  it("records observed exit status, evidence class, output limitation, and unverified behavior only after both permissions are present", () => {
    const action = derivePlannerValidationManifest([
      finding("finding:type", ["type"], ["site/lib/observability/planner/plannerObservability.ts"]),
    ]).find((candidate) => candidate.id === "validation:w5:typecheck");

    if (!action) throw new Error("Expected the typecheck action.");

    const record = recordValidationEvidence({
      action,
      userAuthorization: "authorized",
      hookPermission: "permitted",
      observation: {
        exitStatus: 0,
        outcome: "acceptable",
        evidenceRefs: ["evidence:authorized-typecheck"],
        outputLimitation: "Only the bounded compiler summary was retained.",
        unverifiedBehavior: "Browser rendering and hosted persistence remain unverified.",
      },
    });

    expect(record).toMatchObject({
      state: "observed",
      target: "repository",
      exactCommand: "pnpm run typecheck",
      exitStatus: 0,
      outcome: "acceptable",
      evidenceRefs: ["evidence:authorized-typecheck"],
      userAuthorization: "authorized",
      hookPermission: "permitted",
    });
    expect(record.limitation).toContain("Only the bounded compiler summary was retained.");
    expect(record.limitation).toContain("Browser rendering and hosted persistence remain unverified.");
  });
});
