// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 2: Finding traceability and impact closure
//
// **Validates: Requirements 1.6, 2.3, 19.1, 19.3**
//
// Property 2 (design.md): "For every audited area or verified defect, exactly
// one finding links all affected routes, workflows, source paths, requirements,
// adjacent impacted workflows, and verification methods."

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type {
  CoverageDimensions,
  CoverageItem,
  CoverageLink,
  FindingRef,
  PlannerAuditDataset,
  RequirementRef,
  ValidationRecord,
  WorkflowTrace,
} from "../../../plans/audit/28-canvas-features-logic/auditModel";
import { WORKFLOW_STAGE_ORDER } from "../../../plans/audit/28-canvas-features-logic/auditModel";
import {
  createFindingRegistry,
  TASK_1_4_REQUIREMENTS,
  validateFindingRegistry,
  type FindingRegistration,
} from "../../../plans/audit/28-canvas-features-logic/findingRegistry";

const SOURCE_EVIDENCE_ID = "evidence:traceability-source";
const TRACEABILITY_SEED = 20260823;
const TRACEABILITY_REQUIREMENTS = [
  "1.6",
  "2.3",
  "19.1",
  "19.3",
] as const satisfies readonly RequirementRef[];

interface TraceabilityShape {
  routeCount: number;
  sourceCount: number;
  adjacentImpactCounts: number[];
  defectFlags: boolean[];
}

interface TraceabilityCase {
  dataset: PlannerAuditDataset;
  registrations: FindingRegistration[];
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

function coverageDimensions(): CoverageDimensions {
  return {
    viewportClasses: ["desktop", "tablet", "phone"],
    inputMethods: ["pointer", "touch", "keyboard"],
    stateIds: ["default", "success", "recovery"],
    securityControlIds: ["authentication", "owner-scope"],
    persistenceModes: ["disk", "supabase"],
  };
}

function workflowTrace(
  id: string,
  routeIds: string[],
  validationId: string,
): WorkflowTrace {
  return {
    id,
    name: `Trace ${id}`,
    routeIds,
    stages: WORKFLOW_STAGE_ORDER.map((kind, index) => ({
      id: `${id}:stage:${index}`,
      kind,
      sourcePath:
        kind === "route-entry"
          ? "site/app/ooplanner/page.tsx"
          : `site/lib/Planner/generatedArea${index}.ts`,
      summary: `Trace ${kind}`,
      evidenceRefs: [SOURCE_EVIDENCE_ID],
    })),
    coverage: coverageDimensions(),
    requirementRefs: [...TRACEABILITY_REQUIREMENTS],
    findingIds: [] as FindingRef[],
    verificationRefs: [validationId],
    evidenceRefs: [SOURCE_EVIDENCE_ID],
  };
}

function makeTraceabilityCase(shape: TraceabilityShape): TraceabilityCase {
  const routeItems: CoverageItem[] = Array.from(
    { length: shape.routeCount },
    (_, index) => ({
      id: `area:route:${index}`,
      kind: "route",
      path: `site/app/ooplanner/generated-${index}/page.tsx`,
      routePath: `/ooplanner/generated-${index}`,
      routeFileKind: "page",
      status: "wired",
      evidenceRefs: [SOURCE_EVIDENCE_ID],
    }),
  );
  const sourceItems: CoverageItem[] = Array.from(
    { length: shape.sourceCount },
    (_, index) => ({
      id: `area:source:${index}`,
      kind: "planner-source",
      path: `site/lib/Planner/generatedSource${index}.ts`,
      area: "lib",
      status: "present-but-unverified",
      statusNote: "Runtime behavior requires separately authorized validation.",
      evidenceRefs: [SOURCE_EVIDENCE_ID],
    }),
  );
  const coverageItems = [...routeItems, ...sourceItems];
  const allRouteIds = routeItems.map((item) => item.id);
  const coverageLinks: CoverageLink[] = [];
  const workflowTraces: WorkflowTrace[] = [];
  const validations: ValidationRecord[] = [];
  const registrations: FindingRegistration[] = [];

  coverageItems.forEach((item, areaIndex) => {
    const routeIds =
      item.kind === "route" ? [item.id] : [...allRouteIds];
    const baseWorkflowId = `workflow:base:${areaIndex}`;
    const adjacentWorkflowIds = Array.from(
      { length: shape.adjacentImpactCounts[areaIndex] },
      (_, adjacentIndex) =>
        `workflow:adjacent:${areaIndex}:${adjacentIndex}`,
    );
    const validationId = `validation:finding:${areaIndex}`;

    coverageLinks.push({
      itemId: item.id,
      routeIds,
      workflowIds: [baseWorkflowId],
      ...coverageDimensions(),
      requirementRefs: [...TRACEABILITY_REQUIREMENTS],
      findingIds: [],
      verificationRefs: [validationId],
      evidenceRefs: [SOURCE_EVIDENCE_ID],
    });
    workflowTraces.push(
      workflowTrace(baseWorkflowId, routeIds, validationId),
      ...adjacentWorkflowIds.map((workflowId) =>
        workflowTrace(workflowId, routeIds, validationId),
      ),
    );
    validations.push({
      id: validationId,
      findingIds: [],
      kind: "unit",
      target: "repository",
      repositoryRoot: ".",
      requirementRefs: [...TRACEABILITY_REQUIREMENTS],
      verifies: `Traceability closure for ${item.id}.`,
      limitation: "Does not prove browser or hosted behavior.",
      state: "pending",
      exactCommand: null,
      pendingOwnerAction: `Run the focused traceability validation for ${item.id}.`,
      userAuthorization: "not-authorized",
      hookPermission: "not-observed",
      exitStatus: null,
      outcome: null,
      evidenceRefs: [],
    });
    registrations.push({
      auditedAreaId: item.id,
      classification: shape.defectFlags[areaIndex] ? "defect" : "compliant",
      title: `Traceability finding for ${item.id}`,
      severity: shape.defectFlags[areaIndex] ? "medium" : "note",
      state: shape.defectFlags[areaIndex] ? "verified" : "candidate",
      expected: "Every affected audit dimension is linked through one finding.",
      observed: "The generated area has complete normalized traceability.",
      reproductionEvidenceRefs: [SOURCE_EVIDENCE_ID],
      adjacentWorkflowIds,
      adjacentImpactReviewed: true,
      verificationCandidates: [{ validationId, scope: "finding" }],
    });
  });

  return {
    dataset: {
      coverageItems,
      coverageLinks,
      workflowTraces,
      evidence: [
        {
          id: SOURCE_EVIDENCE_ID,
          class: "repository",
          summary: "Generated audited-area source evidence.",
          sourceRefs: coverageItems.map((item) => item.path),
          limitation: "Static source evidence does not prove runtime behavior.",
        },
      ],
      validations,
      findings: [],
    },
    registrations,
  };
}

const traceabilityCaseArbitrary: fc.Arbitrary<TraceabilityCase> = fc
  .record({
    routeCount: fc.integer({ min: 1, max: 3 }),
    sourceCount: fc.integer({ min: 1, max: 5 }),
  })
  .chain(({ routeCount, sourceCount }) => {
    const areaCount = routeCount + sourceCount;
    return fc
      .record({
        adjacentImpactCounts: fc.array(fc.integer({ min: 1, max: 3 }), {
          minLength: areaCount,
          maxLength: areaCount,
        }),
        defectFlags: fc.array(fc.boolean(), {
          minLength: areaCount,
          maxLength: areaCount,
        }),
      })
      .map(({ adjacentImpactCounts, defectFlags }) =>
        makeTraceabilityCase({
          routeCount,
          sourceCount,
          adjacentImpactCounts,
          defectFlags,
        }),
      );
  });

describe("Property 2: Finding traceability and impact closure", () => {
  it("links every audited area and adjacent impact through exactly one finding", () => {
    fc.assert(
      fc.property(traceabilityCaseArbitrary, ({ dataset, registrations }) => {
        const registry = createFindingRegistry(dataset, registrations);
        const repeatedRegistry = createFindingRegistry(dataset, registrations);

        expect(registry).toEqual(repeatedRegistry);
        expect(validateFindingRegistry(registry)).toEqual({
          valid: true,
          issues: [],
        });
        expect(registry.findings).toHaveLength(registry.coverageItems.length);
        expect(
          uniqueSorted(registry.findings.map((finding) => finding.auditedAreaId)),
        ).toEqual(
          uniqueSorted(registry.coverageItems.map((item) => item.id)),
        );

        for (const item of dataset.coverageItems) {
          const originalLink = dataset.coverageLinks.find(
            (link) => link.itemId === item.id,
          );
          const registration = registrations.find(
            (candidate) => candidate.auditedAreaId === item.id,
          );
          const matches = registry.findings.filter(
            (finding) => finding.auditedAreaId === item.id,
          );

          expect(originalLink).toBeDefined();
          expect(registration).toBeDefined();
          expect(matches).toHaveLength(1);
          if (!originalLink || !registration || matches.length !== 1) {
            continue;
          }

          const finding = matches[0];
          const expectedAdjacentWorkflowIds = uniqueSorted(
            registration.adjacentWorkflowIds ?? [],
          );
          const expectedWorkflowIds = uniqueSorted([
            ...originalLink.workflowIds,
            ...expectedAdjacentWorkflowIds,
          ]);
          const expectedRequirementRefs = uniqueSorted([
            ...originalLink.requirementRefs,
            ...TASK_1_4_REQUIREMENTS,
          ]);
          expect(registration.verificationCandidates).toHaveLength(1);
          const selectedCandidate = registration.verificationCandidates.at(0);
          if (!selectedCandidate) {
            continue;
          }
          const selectedValidationId = selectedCandidate.validationId;

          expect(finding.routeIds).toEqual(uniqueSorted(originalLink.routeIds));
          expect(finding.workflowIds).toEqual(expectedWorkflowIds);
          expect(finding.adjacentWorkflowIds).toEqual(
            expectedAdjacentWorkflowIds,
          );
          expect(finding.sourcePaths).toEqual([item.path]);
          expect(finding.requirementRefs).toEqual(expectedRequirementRefs);
          expect(finding.requirementRefs).toEqual(
            expect.arrayContaining([...TRACEABILITY_REQUIREMENTS]),
          );
          expect(finding.validationIds).toEqual([selectedValidationId]);
          expect(finding.narrowestValidationId).toBe(selectedValidationId);

          const normalizedLink = registry.coverageLinks.find(
            (link) => link.itemId === item.id,
          );
          expect(normalizedLink).toBeDefined();
          if (!normalizedLink) {
            continue;
          }

          expect(normalizedLink.findingIds).toEqual([finding.id]);
          expect(normalizedLink.routeIds).toEqual(finding.routeIds);
          expect(normalizedLink.workflowIds).toEqual(finding.workflowIds);
          expect(normalizedLink.verificationRefs).toEqual(
            finding.validationIds,
          );
          expect(normalizedLink.viewportClasses).toEqual(
            originalLink.viewportClasses,
          );
          expect(normalizedLink.inputMethods).toEqual(originalLink.inputMethods);
          expect(normalizedLink.stateIds).toEqual(originalLink.stateIds);
          expect(normalizedLink.securityControlIds).toEqual(
            originalLink.securityControlIds,
          );
          expect(normalizedLink.persistenceModes).toEqual(
            originalLink.persistenceModes,
          );

          for (const workflowId of finding.workflowIds) {
            const trace = registry.workflowTraces.find(
              (candidate) => candidate.id === workflowId,
            );
            expect(trace).toBeDefined();
            if (!trace) {
              continue;
            }
            expect(trace.findingIds).toContain(finding.id);
            expect(trace.verificationRefs).toContain(selectedValidationId);
          }
        }

        expect(
          registry.coverageLinks.every((link) => link.findingIds.length === 1),
        ).toBe(true);
      }),
      { numRuns: 100, seed: TRACEABILITY_SEED },
    );
  });
});
