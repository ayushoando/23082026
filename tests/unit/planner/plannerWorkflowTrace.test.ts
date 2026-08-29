import { describe, expect, it } from "vitest";

import { WORKFLOW_STAGE_ORDER } from "../../../plans/planner-comprehensive-audit/auditModel";
import { validateAuditDataset } from "../../../plans/planner-comprehensive-audit/auditValidators";
import {
  assertFirstPlannerEvidenceMatrix,
  createFirstPlannerEvidenceMatrix,
  FIRST_PLANNER_EVIDENCE_MATRIX_REQUIREMENTS,
  firstPlannerEvidenceMatrix,
} from "../../../plans/planner-comprehensive-audit/firstEvidenceMatrix";
import {
  PLANNER_WORKFLOW_BLUEPRINTS,
  TASK_1_3_VALIDATION_ID,
  workflowFindingId,
  workflowId,
} from "../../../plans/planner-comprehensive-audit/workflowTraceBuilder";

describe("Planner Task 1.3 workflow evidence matrix", () => {
  it("builds deterministic complete traces for every required workflow", () => {
    const first = createFirstPlannerEvidenceMatrix();
    const second = createFirstPlannerEvidenceMatrix();

    expect(first).toEqual(second);
    expect(first.workflowTraces.map((trace) => trace.id)).toEqual(
      PLANNER_WORKFLOW_BLUEPRINTS.map((blueprint) => workflowId(blueprint.key)),
    );

    for (const trace of first.workflowTraces) {
      expect(trace.stages.map((stage) => stage.kind)).toEqual(
        WORKFLOW_STAGE_ORDER,
      );
      expect(trace.stages.at(-1)).toEqual(
        expect.objectContaining({ kind: "user-visible-result" }),
      );
      expect(trace.routeIds).not.toHaveLength(0);
      expect(trace.findingIds).not.toHaveLength(0);
      expect(trace.verificationRefs).toEqual([TASK_1_3_VALIDATION_ID]);
      expect(trace.coverage.viewportClasses).toEqual(
        expect.arrayContaining(["desktop", "tablet", "phone"]),
      );
      expect(trace.coverage.inputMethods).toEqual(
        expect.arrayContaining(["pointer", "touch", "keyboard"]),
      );
      expect(trace.coverage.stateIds).not.toHaveLength(0);
      expect(trace.coverage.securityControlIds).not.toHaveLength(0);
      expect(trace.coverage.persistenceModes).toEqual(
        expect.arrayContaining(["disk", "supabase"]),
      );
    }
  });

  it("links every inventory row and Task 1.3 requirement into the normalized matrix", () => {
    expect(firstPlannerEvidenceMatrix.coverageLinks).toHaveLength(
      firstPlannerEvidenceMatrix.coverageItems.length,
    );
    expect(
      new Set(
        firstPlannerEvidenceMatrix.coverageLinks.map((link) => link.itemId),
      ).size,
    ).toBe(firstPlannerEvidenceMatrix.coverageItems.length);

    for (const link of firstPlannerEvidenceMatrix.coverageLinks) {
      expect(link.routeIds).not.toHaveLength(0);
      expect(link.workflowIds).not.toHaveLength(0);
      expect(link.viewportClasses).not.toHaveLength(0);
      expect(link.inputMethods).not.toHaveLength(0);
      expect(link.stateIds).not.toHaveLength(0);
      expect(link.securityControlIds).not.toHaveLength(0);
      expect(link.persistenceModes).not.toHaveLength(0);
      expect(link.requirementRefs).not.toHaveLength(0);
      expect(link.findingIds).not.toHaveLength(0);
      expect(link.verificationRefs).toEqual([TASK_1_3_VALIDATION_ID]);
      expect(link.evidenceRefs).not.toHaveLength(0);
    }

    const linkedRequirements = new Set(
      firstPlannerEvidenceMatrix.coverageLinks.flatMap(
        (link) => link.requirementRefs,
      ),
    );
    for (const requirement of FIRST_PLANNER_EVIDENCE_MATRIX_REQUIREMENTS) {
      expect(linkedRequirements.has(requirement)).toBe(true);
    }

    expect(() =>
      assertFirstPlannerEvidenceMatrix(firstPlannerEvidenceMatrix),
    ).not.toThrow();
  });

  it("rejects orphan inventory rows and incomplete route-to-result traces", () => {
    const orphaned = structuredClone(firstPlannerEvidenceMatrix);
    const orphanItemId = orphaned.coverageItems[0].id;
    orphaned.coverageLinks = orphaned.coverageLinks.filter(
      (link) => link.itemId !== orphanItemId,
    );

    const orphanResult = validateAuditDataset(orphaned);
    expect(orphanResult.valid).toBe(false);
    expect(orphanResult.issues).toContainEqual(
      expect.objectContaining({
        code: "missing-link",
        message: expect.stringContaining(orphanItemId),
      }),
    );

    const incomplete = structuredClone(firstPlannerEvidenceMatrix);
    incomplete.workflowTraces[0].stages.pop();

    const incompleteResult = validateAuditDataset(incomplete);
    expect(incompleteResult.valid).toBe(false);
    expect(incompleteResult.issues).toContainEqual(
      expect.objectContaining({ code: "incomplete-workflow" }),
    );
  });

  it("rejects traces whose direct finding or verification links are orphaned", () => {
    const dataset = structuredClone(firstPlannerEvidenceMatrix);
    dataset.workflowTraces[0].findingIds = ["finding:missing"];
    dataset.workflowTraces[0].verificationRefs = ["validation:missing"];

    const result = validateAuditDataset(dataset);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-reference",
          path: "workflowTraces[0].findingIds[0]",
        }),
        expect.objectContaining({
          code: "invalid-reference",
          path: "workflowTraces[0].verificationRefs[0]",
        }),
      ]),
    );
  });

  it("records offline, conflict, and unsaved-navigation gaps without compliance claims", () => {
    for (const key of [
      "offline-reconnect",
      "conflict-recovery",
      "unsaved-destructive-navigation",
    ] as const) {
      const finding = firstPlannerEvidenceMatrix.findings.find(
        (candidate) => candidate.id === workflowFindingId(key),
      );
      const blueprint = PLANNER_WORKFLOW_BLUEPRINTS.find(
        (candidate) => candidate.key === key,
      );

      expect(blueprint?.reachability).not.toBe("wired");
      expect(finding).toEqual(
        expect.objectContaining({
          state: "candidate",
          completionEvidenceRefs: [],
          observed: blueprint?.reachabilityNote,
        }),
      );
    }

    expect(firstPlannerEvidenceMatrix.validations).toContainEqual(
      expect.objectContaining({
        id: TASK_1_3_VALIDATION_ID,
        state: "pending",
        exactCommand:
          "pnpm exec vitest --run tests/unit/planner/plannerWorkflowTrace.test.ts",
        exitStatus: null,
        outcome: null,
        evidenceRefs: [],
      }),
    );
  });
});
