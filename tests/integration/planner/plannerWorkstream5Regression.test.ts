// @vitest-environment node
// Feature: planner-comprehensive-audit, Task 5.9 targeted regression evidence
// Finding links and sources: plans/audit/28-canvas-features-logic/workstream5Evidence.ts
// Validates: Requirements 2.6, 18.1, 18.5, 19.1-19.4

import { describe, expect, it, vi } from "vitest";

import { derivePlannerOwnerScope, findPlannerOwnedRecord, listPlannerOwnedRecords } from "@planner/lib/plannerOwnerScope";
import { runContextualPlannerPersistenceOperation } from "@planner/lib/plannerPersistenceMode";
import { clearObsoleteErrorOnRetry, getPlannerRequiredState } from "@planner/lib/plannerWorkflowState";
import { fromMm, mmToPx, pxToMm, toMm } from "@planner/lib/plannerUnits";
import { TASK_5_9_REGRESSION_LINKS } from "../../../plans/audit/28-canvas-features-logic/workstream5Evidence";

describe("Task 5.9 finding-linked Planner regressions", () => {
  it("keeps canonical millimetres and Planner scale round trips stable", () => {
    expect(fromMm(toMm(42, "in"), "in")).toBeCloseTo(42, 10);
    expect(pxToMm(mmToPx(2_400))).toBeCloseTo(2_400, 10);
  });

  it("derives owner scope only from a verified server session and does not disclose cross-owner records", () => {
    const scope = derivePlannerOwnerScope({ ownerId: "owner-a" });
    const records = [
      { id: "plan-a", ownerId: "owner-a" },
      { id: "plan-b", ownerId: "owner-b" },
    ];
    expect(listPlannerOwnedRecords(records, scope)).toEqual([records[0]]);
    expect(findPlannerOwnedRecord(records, "plan-b", scope, (record) => record.id)).toBeNull();
    expect(findPlannerOwnedRecord(records, "missing", scope, (record) => record.id)).toBeNull();
  });

  it("selects exactly one persistence adapter and forwards the unchanged correlation context", async () => {
    const context = { ownerId: "owner-a", correlationId: "corr-00000001" };
    const disk = vi.fn(async (received: typeof context) => received);
    const supabase = vi.fn(async (received: typeof context) => received);
    await expect(runContextualPlannerPersistenceOperation(context, { disk, supabase }, {
      NODE_ENV: "development",
      DEV_AUTH_BYPASS: "1",
    })).resolves.toBe(context);
    expect(disk).toHaveBeenCalledOnce();
    expect(disk).toHaveBeenCalledWith(context);
    expect(supabase).not.toHaveBeenCalled();
  });

  it("clears obsolete retry errors into the workflow success state while preserving conflict choices", () => {
    expect(clearObsoleteErrorOnRetry("project-save", "server-error")?.kind).toBe("success");
    expect(clearObsoleteErrorOnRetry("project-save", "conflict")).toBeNull();
    expect(getPlannerRequiredState("project-save", "conflict")?.actions.map((action) => action.id)).toEqual(["use-server", "keep-local"]);
  });

  it("keeps every regression link traceable and the migration branch explicitly conditional", () => {
    for (const link of TASK_5_9_REGRESSION_LINKS) {
      expect(link.findingIds.length).toBeGreaterThan(0);
      expect(link.sourcePaths.length).toBeGreaterThan(0);
      expect(link.requirementRefs.length).toBeGreaterThan(0);
      expect(link.testPath).toMatch(/^tests\/(?:unit|integration|e2e)\//);
    }
    expect(TASK_5_9_REGRESSION_LINKS.find((link) => link.concern === "migration-transform")?.conditionalReason).toMatch(/No Task 4\.9 schema defect/);
  });
});
