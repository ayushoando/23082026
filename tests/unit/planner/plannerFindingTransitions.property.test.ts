// @vitest-environment node
//
// Feature: planner-comprehensive-audit,
// Property 3: Evidence-gated finding transitions.
//
// For any finding transition to a terminal reporting state, the target state is
// an allowed classification and carries observed acceptable evidence, one exact
// pending command or owner action, or blocker evidence as applicable. Lifecycle
// movement is monotonic and remediation preserves every unrelated audited path.
//
// Validates: Requirements 2.5, 2.6, 19.2, 19.7, 19.8.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  FINDING_TRANSITIONS,
  WORKFLOW_STAGE_ORDER,
  type FindingRef,
  type FindingState,
  type PlannerAuditDataset,
  type ValidationRecord,
  type WorkflowTrace,
} from "../../../plans/planner-comprehensive-audit/auditModel";
import {
  createFindingRegistry,
  isComprehensiveRemediationComplete,
  isFullValidationComplete,
  transitionFindingLifecycle,
  validateFindingRegistry,
  type FindingLifecyclePatch,
  type FindingRegistration,
  type FindingRegistryDataset,
} from "../../../plans/planner-comprehensive-audit/findingRegistry";

const SOURCE_EVIDENCE_ID = "evidence:source";
const VALIDATION_EVIDENCE_ID = "evidence:validation";
const VALIDATION_ID = "validation:finding";
const ROUTE_AREA_ID = "area:route";
const TARGET_AREA_ID = "area:source:0";
const WORKFLOW_ID = "workflow:main";
const ROUTE_PATH = "site/app/ooplanner/page.tsx";
const TEST_SEED = 1_907_198;

const FINDING_STATES = Object.freeze(
  Object.keys(FINDING_TRANSITIONS) as FindingState[],
);
const TERMINAL_STATES = [
  "remediated-validation-pending",
  "remediated-with-evidence",
  "blocked-with-evidence",
  "compliant-with-evidence",
] as const satisfies readonly FindingState[];

const plannerPathArb = fc
  .stringMatching(/^[a-z][a-z0-9]{0,9}$/)
  .map((segment) => `site/lib/Planner/generated/${segment}.ts`);
const plannerPathsArb = fc.uniqueArray(plannerPathArb, {
  minLength: 3,
  maxLength: 8,
});
const statePairArb = fc.tuple(
  fc.constantFrom(...FINDING_STATES),
  fc.constantFrom(...FINDING_STATES),
);

function workflowTrace(): WorkflowTrace {
  return {
    id: WORKFLOW_ID,
    name: "Generated Planner workflow",
    routeIds: [ROUTE_AREA_ID],
    stages: WORKFLOW_STAGE_ORDER.map((kind, index) => ({
      id: `${WORKFLOW_ID}:stage:${index}`,
      kind,
      sourcePath: kind === "route-entry" ? ROUTE_PATH : "site/lib/Planner/generated/trace.ts",
      summary: `Trace ${kind}`,
      evidenceRefs: [SOURCE_EVIDENCE_ID],
    })),
    coverage: {
      viewportClasses: ["desktop", "tablet", "phone"],
      inputMethods: ["pointer", "touch", "keyboard"],
      stateIds: ["default", "success"],
      securityControlIds: ["authentication"],
      persistenceModes: ["disk", "supabase"],
    },
    requirementRefs: ["19.2"],
    findingIds: [] as FindingRef[],
    verificationRefs: [VALIDATION_ID],
    evidenceRefs: [SOURCE_EVIDENCE_ID],
  };
}

function pendingValidation(): ValidationRecord {
  return {
    id: VALIDATION_ID,
    findingIds: [],
    kind: "unit",
    target: "repository",
    repositoryRoot: ".",
    requirementRefs: ["2.6", "19.2", "19.8"],
    verifies: "The generated finding lifecycle transition.",
    limitation: "Authored property evidence remains unobserved until authorized execution.",
    state: "pending",
    exactCommand:
      "pnpm exec vitest --run tests/unit/planner/plannerFindingTransitions.property.test.ts",
    pendingOwnerAction: null,
    userAuthorization: "not-authorized",
    hookPermission: "not-observed",
    exitStatus: null,
    outcome: null,
    evidenceRefs: [],
  };
}

function observedValidation(findingIds: FindingRef[] = []): ValidationRecord {
  return {
    id: VALIDATION_ID,
    findingIds,
    kind: "unit",
    target: "repository",
    repositoryRoot: ".",
    requirementRefs: ["2.6", "19.2", "19.8"],
    verifies: "The generated finding lifecycle transition.",
    limitation: "Observed unit evidence does not prove browser or hosted behavior.",
    state: "observed",
    exactCommand: "authorized-focused-property-validation",
    pendingOwnerAction: null,
    userAuthorization: "authorized",
    hookPermission: "permitted",
    exitStatus: 0,
    outcome: "acceptable",
    evidenceRefs: [VALIDATION_EVIDENCE_ID],
  };
}

function makeDataset(paths: readonly string[], observed: boolean): PlannerAuditDataset {
  const sourceItems = paths.map((path, index) => ({
    id: `area:source:${index}`,
    kind: "planner-source" as const,
    path,
    area: "lib" as const,
    status: "present-but-unverified" as const,
    statusNote: "Generated property-test coverage item.",
    evidenceRefs: [SOURCE_EVIDENCE_ID],
  }));
  const coverageItems = [
    {
      id: ROUTE_AREA_ID,
      kind: "route" as const,
      path: ROUTE_PATH,
      routePath: "/ooplanner",
      routeFileKind: "page" as const,
      status: "wired" as const,
      evidenceRefs: [SOURCE_EVIDENCE_ID],
    },
    ...sourceItems,
  ];

  return {
    coverageItems,
    coverageLinks: coverageItems.map((item) => ({
      itemId: item.id,
      routeIds: [ROUTE_AREA_ID],
      workflowIds: [WORKFLOW_ID],
      viewportClasses: ["desktop", "tablet", "phone"],
      inputMethods: ["pointer", "touch", "keyboard"],
      stateIds: ["default", "success"],
      securityControlIds: ["authentication"],
      persistenceModes: ["disk", "supabase"],
      requirementRefs: ["2.5", "2.6", "19.2", "19.7", "19.8"],
      findingIds: [],
      verificationRefs: [VALIDATION_ID],
      evidenceRefs: [SOURCE_EVIDENCE_ID],
    })),
    workflowTraces: [workflowTrace()],
    evidence: [
      {
        id: SOURCE_EVIDENCE_ID,
        class: "repository",
        summary: "Generated source evidence",
        sourceRefs: [ROUTE_PATH],
        limitation: "Source evidence alone does not prove completed validation.",
      },
      {
        id: VALIDATION_EVIDENCE_ID,
        class: "repository",
        summary: "Observed focused validation",
        sourceRefs: ["authorized-focused-property-validation"],
        limitation: "Unit evidence only.",
      },
    ],
    validations: [observed ? observedValidation() : pendingValidation()],
    findings: [],
  };
}

function registrationForState(
  areaId: string,
  state: FindingState,
  targetClassification: "defect" | "compliant" =
    state === "compliant-with-evidence" ? "compliant" : "defect",
  applyStateToAll = false,
): FindingRegistration {
  const isTarget = areaId === TARGET_AREA_ID;
  const lifecycleApplies = isTarget || applyStateToAll;
  const classification = lifecycleApplies ? targetClassification : "defect";
  const remediationPaths =
    lifecycleApplies &&
    (state === "remediated-validation-pending" ||
      state === "remediated-with-evidence")
      ? ["site/lib/Planner/generated/remediation.ts"]
      : [];
  const completionEvidenceRefs =
    lifecycleApplies &&
    (state === "remediated-with-evidence" || state === "compliant-with-evidence")
      ? [VALIDATION_EVIDENCE_ID]
      : [];

  return {
    auditedAreaId: areaId,
    classification,
    title: `Generated finding for ${areaId}`,
    severity: classification === "compliant" ? "note" : "medium",
    state: lifecycleApplies ? state : "candidate",
    expected: "The audited area satisfies its evidence contract.",
    observed: "The generated finding records its current lifecycle state.",
    reproductionEvidenceRefs: [SOURCE_EVIDENCE_ID],
    completionEvidenceRefs,
    adjacentImpactReviewed:
      lifecycleApplies &&
      TERMINAL_STATES.includes(state as (typeof TERMINAL_STATES)[number]),
    remediationPaths,
    verificationCandidates: [{ validationId: VALIDATION_ID, scope: "finding" }],
    ...(lifecycleApplies && state === "blocked-with-evidence"
      ? {
          blocker: {
            evidenceRefs: [SOURCE_EVIDENCE_ID],
            ownerDecision: "Authorize the generated out-of-scope remediation.",
            acceptedByOwner: false,
          },
        }
      : {}),
  };
}

function registryForState(
  paths: readonly string[],
  state: FindingState,
  observed =
    state === "remediated-with-evidence" || state === "compliant-with-evidence",
  targetClassification: "defect" | "compliant" =
    state === "compliant-with-evidence" ? "compliant" : "defect",
  applyStateToAll = false,
): FindingRegistryDataset {
  const dataset = makeDataset(paths, observed);
  return createFindingRegistry(
    dataset,
    dataset.coverageItems.map((item) =>
      registrationForState(
        item.id,
        state,
        targetClassification,
        applyStateToAll,
      ),
    ),
  );
}

function findingId(registry: FindingRegistryDataset): string {
  const finding = registry.findings.find(
    (candidate) => candidate.auditedAreaId === TARGET_AREA_ID,
  );
  if (!finding) {
    throw new Error(`Missing generated finding for ${TARGET_AREA_ID}`);
  }
  return finding.id;
}

function patchForTarget(
  target: FindingState,
  remediationPath: string,
): FindingLifecyclePatch {
  switch (target) {
    case "remediated-validation-pending":
      return { adjacentImpactReviewed: true, remediationPaths: [remediationPath] };
    case "remediated-with-evidence":
      return {
        adjacentImpactReviewed: true,
        remediationPaths: [remediationPath],
        completionEvidenceRefs: [VALIDATION_EVIDENCE_ID],
      };
    case "blocked-with-evidence":
      return {
        adjacentImpactReviewed: true,
        blocker: {
          evidenceRefs: [SOURCE_EVIDENCE_ID],
          ownerDecision: "Authorize the generated out-of-scope remediation.",
          acceptedByOwner: false,
        },
      };
    case "compliant-with-evidence":
      return {
        adjacentImpactReviewed: true,
        completionEvidenceRefs: [VALIDATION_EVIDENCE_ID],
      };
    default:
      return {};
  }
}

function synchronizeObservedValidation(
  registry: FindingRegistryDataset,
): FindingRegistryDataset {
  const next = structuredClone(registry);
  const current = next.validations.find((validation) => validation.id === VALIDATION_ID);
  if (!current) {
    throw new Error(`Missing generated validation ${VALIDATION_ID}`);
  }
  next.validations = [observedValidation(current.findingIds)];
  return next;
}

describe("Planner comprehensive audit Property 3", () => {
  it("accepts exactly the declared monotonic lifecycle edges", () => {
    fc.assert(
      fc.property(plannerPathsArb, statePairArb, (paths, [from, to]) => {
        const fromNeedsObserved =
          from === "remediated-with-evidence" ||
          from === "compliant-with-evidence";
        const needsObservedTarget =
          to === "compliant-with-evidence" ||
          (from === "remediated-validation-pending" &&
            to === "remediated-with-evidence");
        const observed =
          fromNeedsObserved ||
          (needsObservedTarget && from === "candidate");
        const classification: "defect" | "compliant" =
          from === "compliant-with-evidence" ||
          (from === "candidate" && to === "compliant-with-evidence")
            ? "compliant"
            : "defect";
        let registry = registryForState(
          paths,
          from,
          observed,
          classification,
        );
        const id = findingId(registry);
        const allowed = FINDING_TRANSITIONS[from].includes(to);

        // The public lifecycle patch does not carry validation records. For the
        // declared pending -> evidenced edge, synchronize the independently
        // observed validation in the cloned aggregate before applying the edge.
        if (
          from === "remediated-validation-pending" &&
          to === "remediated-with-evidence"
        ) {
          registry = synchronizeObservedValidation(registry);
        }

        if (!allowed) {
          expect(() =>
            transitionFindingLifecycle(
              registry,
              id,
              to,
              patchForTarget(to, paths[0]),
            ),
          ).toThrow(`Finding transition is not monotonic: ${from} -> ${to}`);
          return;
        }

        const transitioned = transitionFindingLifecycle(
          registry,
          id,
          to,
          patchForTarget(to, paths[0]),
        );
        expect(
          transitioned.findings.find((finding) => finding.id === id)?.state,
        ).toBe(to);
        expect(validateFindingRegistry(transitioned)).toEqual({
          valid: true,
          issues: [],
        });
      }),
      { numRuns: 200, seed: TEST_SEED },
    );
  });

  it("rejects every terminal classification when its required evidence gate is absent", () => {
    fc.assert(
      fc.property(
        plannerPathsArb,
        fc.constantFrom(...TERMINAL_STATES),
        (paths, terminalState) => {
          const registry = registryForState(
            paths,
            terminalState,
            undefined,
            undefined,
            true,
          );

          if (terminalState === "blocked-with-evidence") {
            expect(isComprehensiveRemediationComplete(registry)).toBe(false);
            const accepted = structuredClone(registry);
            for (const finding of accepted.findings) {
              if (finding.blocker) finding.blocker.acceptedByOwner = true;
            }
            expect(isComprehensiveRemediationComplete(accepted)).toBe(true);
            expect(isFullValidationComplete(accepted)).toBe(false);
          } else {
            expect(isComprehensiveRemediationComplete(registry)).toBe(true);
            expect(isFullValidationComplete(registry)).toBe(
              terminalState === "remediated-with-evidence" ||
                terminalState === "compliant-with-evidence",
            );
          }

          const invalid = structuredClone(registry);
          const target = invalid.findings.find(
            (finding) => finding.auditedAreaId === TARGET_AREA_ID,
          );
          if (!target) {
            throw new Error(`Missing generated finding for ${TARGET_AREA_ID}`);
          }

          switch (terminalState) {
            case "remediated-validation-pending": {
              const validation = invalid.validations[0];
              if (validation.state !== "pending") {
                throw new Error("Expected a generated pending validation.");
              }
              validation.exactCommand = null;
              validation.pendingOwnerAction = null;
              break;
            }
            case "remediated-with-evidence":
            case "compliant-with-evidence":
              target.completionEvidenceRefs = [];
              break;
            case "blocked-with-evidence":
              target.blocker = {
                evidenceRefs: [],
                ownerDecision: "",
                acceptedByOwner: false,
              };
              break;
          }

          const result = validateFindingRegistry(invalid, {
            requireTerminalFindings: true,
          });
          expect(result.valid).toBe(false);
          expect(
            result.issues.some(
              (issue) =>
                issue.code === "invalid-validation-state" ||
                issue.code === "missing-evidence" ||
                issue.code === "empty-value",
            ),
          ).toBe(true);
        },
      ),
      { numRuns: 200, seed: TEST_SEED + 1 },
    );
  });

  it("preserves every unrelated path and leaves the input registry unchanged", () => {
    fc.assert(
      fc.property(
        plannerPathsArb,
        fc.subarray([0, 1, 2, 3, 4, 5, 6, 7], { minLength: 1 }),
        (paths, generatedIndexes) => {
          const remediationPaths = generatedIndexes
            .filter((index) => index < paths.length)
            .map((index) => paths[index]);
          fc.pre(remediationPaths.length > 0);

          const registry = registryForState(paths, "remediation-approved");
          const before = structuredClone(registry);
          const id = findingId(registry);
          const transitioned = transitionFindingLifecycle(
            registry,
            id,
            "remediated-validation-pending",
            {
              adjacentImpactReviewed: true,
              remediationPaths,
            },
          );
          const target = transitioned.findings.find(
            (finding) => finding.id === id,
          );
          if (!target) {
            throw new Error(`Missing transitioned finding ${id}`);
          }

          const affected = new Set([...target.sourcePaths, ...remediationPaths]);
          const expectedUnrelated = transitioned.coverageItems
            .map((item) => item.path)
            .filter((path) => !affected.has(path))
            .sort();

          expect(target.remediationPaths).toEqual([...remediationPaths].sort());
          expect(target.preservedUnrelatedPaths).toEqual(expectedUnrelated);
          expect(transitioned.coverageItems).toEqual(before.coverageItems);
          expect(registry).toEqual(before);
          expect(validateFindingRegistry(transitioned)).toEqual({
            valid: true,
            issues: [],
          });
        },
      ),
      { numRuns: 200, seed: TEST_SEED + 2 },
    );
  });
});
