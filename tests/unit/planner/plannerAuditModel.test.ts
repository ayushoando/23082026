import { describe, expect, it } from "vitest";

import type {
  CoverageItem,
  CoverageLink,
  EvidenceArtifact,
  PlannerAuditDataset,
  RequirementRef,
  ValidationRecord,
} from "../../../plans/planner-comprehensive-audit/auditModel";
import {
  WORKFLOW_STAGE_ORDER,
} from "../../../plans/planner-comprehensive-audit/auditModel";
import {
  isFindingTransitionAllowed,
  isRequirementRef,
  validateAuditDataset,
} from "../../../plans/planner-comprehensive-audit/auditValidators";

const TASK_REQUIREMENTS: RequirementRef[] = [
  "1.1",
  "1.2",
  "1.4",
  "1.6",
  "18.1",
  "19.1",
  "19.3",
  "19.4",
];

const coverageItems: CoverageItem[] = [
  {
    id: "route-ooplanner",
    kind: "route",
    path: "site/app/ooplanner/page.tsx",
    routePath: "/ooplanner",
    routeFileKind: "page",
    status: "wired",
    evidenceRefs: ["evidence-source"],
  },
  {
    id: "api-projects",
    kind: "api",
    path: "site/app/api/Planner/projects/route.ts",
    endpointPath: "/api/Planner/projects",
    methods: ["GET", "POST"],
    status: "present-but-unverified",
    statusNote: "Runtime behavior requires protected integration evidence.",
    evidenceRefs: ["evidence-source"],
  },
  {
    id: "source-planner",
    kind: "planner-source",
    path: "site/lib/Planner/projectsStore.ts",
    area: "lib",
    status: "wired",
    evidenceRefs: ["evidence-source"],
  },
  {
    id: "source-shared-auth",
    kind: "reachable-shared-source",
    path: "site/features/shared/api/withAuth.ts",
    reachableFromIds: ["source-planner"],
    status: "wired",
    evidenceRefs: ["evidence-source"],
  },
  {
    id: "focss-planner",
    kind: "focss",
    path: "site/focss/planner/index.css",
    zone: "planner",
    status: "wired",
    evidenceRefs: ["evidence-source"],
  },
  {
    id: "test-planner",
    kind: "test",
    path: "tests/unit/planner/plannerStore.test.ts",
    testClass: "unit",
    coversItemIds: ["source-planner"],
    status: "wired",
    evidenceRefs: ["evidence-source"],
  },
];

function makeCoverageLink(itemId: string): CoverageLink {
  return {
    itemId,
    routeIds: ["route-ooplanner"],
    workflowIds: ["workflow-open-project"],
    viewportClasses: ["desktop", "tablet", "phone"],
    inputMethods: ["pointer", "touch", "keyboard"],
    stateIds: ["default", "loading", "success", "server-error"],
    securityControlIds: ["authentication", "owner-scope"],
    persistenceModes: ["disk", "supabase"],
    requirementRefs: [...TASK_REQUIREMENTS],
    findingIds: ["finding-coverage"],
    verificationRefs: ["validation-static"],
    evidenceRefs: ["evidence-source"],
  };
}

function makeDataset(): PlannerAuditDataset {
  return {
    coverageItems: structuredClone(coverageItems),
    coverageLinks: coverageItems.map((item) => makeCoverageLink(item.id)),
    workflowTraces: [
      {
        id: "workflow-open-project",
        name: "Open a Planner project",
        routeIds: ["route-ooplanner"],
        stages: WORKFLOW_STAGE_ORDER.map((kind, index) => ({
          id: `stage-${index}`,
          kind,
          sourcePath:
            kind === "user-visible-result"
              ? "site/components/Planner/Planner.tsx"
              : "site/lib/Planner/projectsStore.ts",
          summary: `Trace ${kind}`,
          evidenceRefs: ["evidence-source"],
        })),
        coverage: {
          viewportClasses: ["desktop", "tablet", "phone"],
          inputMethods: ["pointer", "touch", "keyboard"],
          stateIds: ["default", "loading", "success", "server-error"],
          securityControlIds: ["authentication", "owner-scope"],
          persistenceModes: ["disk", "supabase"],
        },
        requirementRefs: [...TASK_REQUIREMENTS],
        findingIds: ["finding-coverage"],
        verificationRefs: ["validation-static"],
        evidenceRefs: ["evidence-source"],
      },
    ],
    evidence: [
      {
        id: "evidence-source",
        class: "repository",
        summary: "Repository source inspection",
        sourceRefs: ["site/app/ooplanner/page.tsx"],
        limitation: "Static source does not prove rendered behavior.",
        artifact: {
          authorship: "authored",
          path: "plans/planner-comprehensive-audit/records/coverage.json",
        },
      },
      {
        id: "evidence-validation",
        class: "repository",
        summary: "Observed static validation output",
        sourceRefs: ["pnpm run typecheck"],
        limitation: "Does not prove browser behavior.",
        artifact: {
          authorship: "generated",
          path: "results/planner-comprehensive-audit/validation/typecheck.json",
        },
      },
    ],
    validations: [
      {
        id: "validation-static",
        state: "observed",
        findingIds: ["finding-coverage"],
        kind: "type",
        target: "repository",
        repositoryRoot: ".",
        requirementRefs: ["18.1", "19.4"],
        verifies: "The audit model is type-safe.",
        limitation: "Rendered and hosted behavior remain unverified.",
        exactCommand: "pnpm run typecheck",
        pendingOwnerAction: null,
        userAuthorization: "authorized",
        hookPermission: "permitted",
        exitStatus: 0,
        outcome: "acceptable",
        evidenceRefs: ["evidence-validation"],
      },
    ],
    findings: [
      {
        id: "finding-coverage",
        title: "Coverage model is represented",
        severity: "note",
        state: "compliant-with-evidence",
        routeIds: ["route-ooplanner"],
        workflowIds: ["workflow-open-project"],
        adjacentWorkflowIds: [],
        sourcePaths: [
          "plans/planner-comprehensive-audit/auditModel.ts",
          "plans/planner-comprehensive-audit/auditValidators.ts",
        ],
        requirementRefs: [...TASK_REQUIREMENTS],
        reproductionEvidenceRefs: ["evidence-source"],
        completionEvidenceRefs: ["evidence-validation"],
        expected: "Typed audit coverage and evidence records.",
        observed: "The complete typed dataset validates.",
        affectedScope: ["planner-comprehensive-audit"],
        remediationPaths: [],
        validationIds: ["validation-static"],
      },
    ],
  };
}

describe("Planner comprehensive audit model", () => {
  it("accepts a complete dataset spanning every Task 1.1 coverage kind", () => {
    const result = validateAuditDataset(makeDataset(), {
      requiredRequirementRefs: TASK_REQUIREMENTS,
    });

    expect(result).toEqual({ valid: true, issues: [] });
  });

  it("rejects authored and generated evidence outside their approved roots", () => {
    const dataset = makeDataset();
    dataset.evidence[0].artifact = {
      authorship: "generated",
      path: "site/planner-audit/report.json",
    } as unknown as EvidenceArtifact;

    const result = validateAuditDataset(dataset);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "invalid-artifact-path",
        path: "evidence[0].artifact.path",
      }),
    );
  });

  it("rejects incomplete traces and result claims on pending validation", () => {
    const dataset = makeDataset();
    dataset.workflowTraces[0].stages.pop();
    dataset.validations[0] = {
      ...dataset.validations[0],
      state: "pending",
      exactCommand: "pnpm run typecheck",
      pendingOwnerAction: null,
      userAuthorization: "not-authorized",
      hookPermission: "not-observed",
      exitStatus: 0,
      outcome: "acceptable",
      evidenceRefs: ["evidence-validation"],
    } as unknown as ValidationRecord;

    const result = validateAuditDataset(dataset);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "incomplete-workflow",
        "invalid-validation-state",
      ]),
    );
  });

  it("returns issues in deterministic order", () => {
    const dataset = makeDataset();
    dataset.coverageLinks[0].requirementRefs.push("1.1");
    dataset.coverageLinks[0].evidenceRefs = [];

    expect(validateAuditDataset(dataset)).toEqual(validateAuditDataset(dataset));
    expect(
      validateAuditDataset(dataset).issues.map(
        (issue) => `${issue.path}:${issue.code}`,
      ),
    ).toEqual(
      [...validateAuditDataset(dataset).issues]
        .sort((left, right) =>
          `${left.path}\u0000${left.code}\u0000${left.message}`.localeCompare(
            `${right.path}\u0000${right.code}\u0000${right.message}`,
          ),
        )
        .map((issue) => `${issue.path}:${issue.code}`),
    );
  });

  it("recognizes only granular references to the 19 defined requirements", () => {
    expect(isRequirementRef("19.4")).toBe(true);
    expect(isRequirementRef("20.1")).toBe(false);
    expect(isRequirementRef("1")).toBe(false);
  });

  it("allows only declared monotonic finding transitions", () => {
    expect(
      isFindingTransitionAllowed(
        "remediated-validation-pending",
        "remediated-with-evidence",
      ),
    ).toBe(true);
    expect(
      isFindingTransitionAllowed("remediated-with-evidence", "verified"),
    ).toBe(false);
    expect(isFindingTransitionAllowed("verified", "verified")).toBe(false);
  });
});
