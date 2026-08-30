// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 6: Valid project initialization
//
// **Validates: Requirements 4.2, 13.1, 13.2**

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  applyPlannerProjectMutation,
  type PlannerProjectAtomicStateV1,
} from "@planner/lib/plannerProjectOperations";
import {
  readPlannerGeometry,
  type PlannerGeometrySnapshotV1,
} from "@planner/lib/plannerGeometryContract";
import {
  PLANNER_GATE_B_CONTRACT,
  type PlannerRepositoryContextV1,
  type SavePlannerProjectRequestV1,
} from "@planner/lib/plannerProjectRepository";
import {
  projectSetupSchema,
  type ProjectSetup,
} from "@planner/lib/projectSetup/projectSetupSchema";

const PROPERTY_RUNS = 120;
const PROPERTY_SEED = 6_202_608;

const emptyGeometry: PlannerGeometrySnapshotV1 = {
  contractVersion: PLANNER_GATE_B_CONTRACT.geometryContractVersion,
  schemaVersion: PLANNER_GATE_B_CONTRACT.geometrySchemaVersion,
  unit: PLANNER_GATE_B_CONTRACT.geometryUnit,
  scalePxPerMm: PLANNER_GATE_B_CONTRACT.geometryScalePxPerMm,
  geometry: { furniture: [], walls: [], doors: [], windows: [] },
  canvasSnapshot: { version: "7.4.0", objects: [] },
};

const ownerIdArbitrary = fc.stringMatching(/^[a-z][a-z0-9]{3,18}$/);
const projectIdArbitrary = fc.stringMatching(/^project-[a-z0-9]{4,18}$/);
const projectNameArbitrary = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,48}$/);
const timestampArbitrary = fc
  .integer({ min: 1_700_000_000_000, max: 1_900_000_000_000 })
  .map((milliseconds) => new Date(milliseconds).toISOString());

const validProjectSetupArbitrary: fc.Arbitrary<ProjectSetup> = fc
  .record({
    projectName: projectNameArbitrary,
    roomWidthMm: fc.integer({ min: 1, max: 200_000 }),
    roomDepthMm: fc.integer({ min: 1, max: 200_000 }),
    seatTarget: fc.option(fc.integer({ min: 1, max: 10_000 }), { nil: undefined }),
    unitSystem: fc.constantFrom<"mm" | "in">("mm", "in"),
  })
  .map((input) => projectSetupSchema.parse(input));

interface ValidProjectCreationInput {
  readonly projectId: string;
  readonly setup: ProjectSetup;
}

const validProjectCreationInputArbitrary: fc.Arbitrary<ValidProjectCreationInput> = fc.record({
  projectId: projectIdArbitrary,
  setup: validProjectSetupArbitrary,
});

function createRequest(input: ValidProjectCreationInput): SavePlannerProjectRequestV1 {
  return {
    contractVersion: PLANNER_GATE_B_CONTRACT.repositoryContractVersion,
    expectedRevision: 0,
    idempotencyKey: `create-${input.projectId}`,
    project: {
      id: input.projectId,
      name: input.setup.projectName,
      status: "draft",
      geometry: emptyGeometry,
      sheet: {
        width_mm: input.setup.roomWidthMm,
        height_mm: input.setup.roomDepthMm,
        unit: input.setup.unitSystem,
      },
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
        validProjectCreationInputArbitrary,
        timestampArbitrary,
        (ownerId, creationInput, timestamp) => {
          const state: PlannerProjectAtomicStateV1 = {
            project: null,
            receipts: [],
          };
          const context: PlannerRepositoryContextV1 = {
            ownerId,
            correlationId: `correlation-${creationInput.projectId}`,
          };
          const transition = applyPlannerProjectMutation(
            state,
            context,
            {
              operation: "create",
              projectId: creationInput.projectId,
              request: createRequest(creationInput),
            },
            timestamp,
          );

          expect(transition.effect).toBe("created");
          expect(transition.result.ok).toBe(true);
          expect(transition.state.project).not.toBeNull();

          const project = transition.state.project;
          if (!project) throw new Error("Expected initialized project");

          expect(project.id).toBe(creationInput.projectId);
          expect(project.ownerId).toBe(ownerId);
          expect(project.name).toBe(creationInput.setup.projectName);
          expect(project.contractVersion).toBe(PLANNER_GATE_B_CONTRACT.projectContractVersion);
          expect(project.schemaVersion).toBe(PLANNER_GATE_B_CONTRACT.projectSchemaVersion);
          expect(project.revision).toBe(1);
          expect(project.status).toBe("draft");
          expect(project.createdAt).toBe(timestamp);
          expect(project.updatedAt).toBe(timestamp);
          expect(Date.parse(project.createdAt)).not.toBeNaN();
          expect(Date.parse(project.updatedAt)).not.toBeNaN();
          expect(Date.parse(project.updatedAt)).toBeGreaterThanOrEqual(Date.parse(project.createdAt));

          expect(project.sheet).toEqual({
            width_mm: creationInput.setup.roomWidthMm,
            height_mm: creationInput.setup.roomDepthMm,
            unit: creationInput.setup.unitSystem,
          });
          expect(project.layers).toEqual([]);
          expect(project.thumbnailUrl).toBeNull();

          const geometry = project.geometry;
          expect(geometry.contractVersion).toBe(PLANNER_GATE_B_CONTRACT.geometryContractVersion);
          expect(geometry.schemaVersion).toBe(PLANNER_GATE_B_CONTRACT.geometrySchemaVersion);
          expect(geometry.unit).toBe(PLANNER_GATE_B_CONTRACT.geometryUnit);
          expect(geometry.scalePxPerMm).toBe(PLANNER_GATE_B_CONTRACT.geometryScalePxPerMm);
          const geometryRead = readPlannerGeometry(geometry);
          expect(geometryRead.ok).toBe(true);
          if (!geometryRead.ok) throw new Error("Expected valid initialized geometry");
          expect(geometryRead.source).toBe("current");
          expect(geometry.geometry).toEqual({
            furniture: [],
            walls: [],
            doors: [],
            windows: [],
          });
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED, endOnFailure: true },
    );
  });
});
