// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 6: Valid project initialization
//
// **Validates: Requirements 4.2, 13.1, 13.2**

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { applyPlannerProjectMutation, type PlannerProjectAtomicStateV1 } from "@planner/lib/plannerProjectOperations";
import {
  PLANNER_REPOSITORY_CONTRACT_VERSION,
  type PlannerGeometrySnapshotV1,
  type PlannerRepositoryContextV1,
  type SavePlannerProjectRequestV1,
} from "@planner/lib/plannerProjectRepository";
import { readPlannerGeometry } from "@planner/lib/plannerGeometryContract";

const PROPERTY_RUNS = 120;

const emptyGeometry: PlannerGeometrySnapshotV1 = {
  contractVersion: 1,
  schemaVersion: 1,
  unit: "mm",
  scalePxPerMm: 0.05,
  geometry: { furniture: [], walls: [], doors: [], windows: [] },
  canvasSnapshot: { version: "7.4.0", objects: [] },
};

const ownerIdArbitrary = fc.stringMatching(/^[a-z][a-z0-9]{3,18}$/);
const projectIdArbitrary = fc.stringMatching(/^project-[a-z0-9]{4,18}$/);
const projectNameArbitrary = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,48}$/);
const timestampArbitrary = fc
  .integer({ min: 1_700_000_000_000, max: 1_900_000_000_000 })
  .map((milliseconds) => new Date(milliseconds).toISOString());

function createRequest(
  projectId: string,
  projectName: string,
): SavePlannerProjectRequestV1 {
  return {
    contractVersion: PLANNER_REPOSITORY_CONTRACT_VERSION,
    expectedRevision: 0,
    idempotencyKey: `create-${projectId}`,
    project: {
      id: projectId,
      name: projectName,
      status: "draft",
      geometry: emptyGeometry,
      sheet: { width_mm: 10_000, height_mm: 7_000, unit: "mm" },
      layers: [],
      thumbnailUrl: null,
    },
  };
}

describe("Feature: planner-comprehensive-audit, Property 6: Valid project initialization", () => {
  it("initializes every valid owner/create input as one editable current-schema revision", () => {
    fc.assert(
      fc.property(
        ownerIdArbitrary,
        projectIdArbitrary,
        projectNameArbitrary,
        timestampArbitrary,
        (ownerId, projectId, projectName, timestamp) => {
          const state: PlannerProjectAtomicStateV1 = {
            project: null,
            receipts: [],
          };
          const context: PlannerRepositoryContextV1 = {
            ownerId,
            correlationId: `correlation-${projectId}`,
          };
          const transition = applyPlannerProjectMutation(
            state,
            context,
            {
              operation: "create",
              projectId,
              request: createRequest(projectId, projectName),
            },
            timestamp,
          );

          expect(transition.effect).toBe("created");
          expect(transition.result.ok).toBe(true);
          expect(transition.state.project).not.toBeNull();

          const project = transition.state.project;
          if (!project) throw new Error("Expected initialized project");

          expect(project.id).toBe(projectId);
          expect(project.ownerId).toBe(ownerId);
          expect(project.name).toBe(projectName.trim());
          expect(project.contractVersion).toBe(1);
          expect(project.schemaVersion).toBe(1);
          expect(project.revision).toBe(1);
          expect(project.status).toBe("draft");
          expect(project.createdAt).toBe(timestamp);
          expect(project.updatedAt).toBe(timestamp);
          expect(Date.parse(project.createdAt)).not.toBeNaN();
          expect(Date.parse(project.updatedAt)).not.toBeNaN();
          expect(readPlannerGeometry(project.geometry).ok).toBe(true);
          expect(project.sheet).toMatchObject({
            width_mm: 10_000,
            height_mm: 7_000,
            unit: "mm",
          });
          expect(project.layers).toEqual([]);
          expect(project.thumbnailUrl).toBeNull();
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 6_202_608, endOnFailure: true },
    );
  });
});
