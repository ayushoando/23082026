import { describe, expect, it } from "vitest";

import type {
  FindingRef,
  PlannerAuditDataset,
  ValidationRecord,
  WorkflowTrace,
} from "../../../plans/audit/28-canvas-features-logic/auditModel";
import { WORKFLOW_STAGE_ORDER } from "../../../plans/audit/28-canvas-features-logic/auditModel";
import {
  createFindingRegistry,
  createOwnershipLedger,
  isComprehensiveRemediationComplete,
  isFullValidationComplete,
  transitionFindingLifecycle,
  validateFindingRegistry,
  type FindingRegistration,
} from "../../../plans/audit/28-canvas-features-logic/findingRegistry";

const SOURCE_EVIDENCE_ID = "evidence:source";
const VALIDATION_EVIDENCE_ID = "evidence:validation";
const FINDING_VALIDATION_ID = "validation:finding";
const REPOSITORY_VALIDATION_ID = "validation:repository";
const RECOVERY_WORKFLOW_ID = "workflow:recovery";

function workflowTrace(id: string): WorkflowTrace {
  return {
    id,
    name: id,
    routeIds: ["area:route"],
    stages: WORKFLOW_STAGE_ORDER.map((kind, index) => ({
      id: `${id}:stage:${index}`,
      kind,
      sourcePath:
        kind === "route-entry"
          ? "site/app/ooplanner/page.tsx"
          : "site/lib/Planner/projectsStore.ts",
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
    requirementRefs: ["1.3"],
    findingIds: [] as FindingRef[],
    verificationRefs: [FINDING_VALIDATION_ID],
    evidenceRefs: [SOURCE_EVIDENCE_ID],
  };
}

function makeDataset(): PlannerAuditDataset {
  const validations: ValidationRecord[] = [
    {
      id: FINDING_VALIDATION_ID,
      findingIds: [],
      kind: "unit",
      target: "repository",
      repositoryRoot: ".",
      requirementRefs: ["18.1"],
      verifies: "The individual audited-area finding.",
      limitation: "Does not prove browser or hosted behavior.",
      state: "pending",
      exactCommand:
        "pnpm exec vitest --run tests/unit/planner/plannerFindingRegistry.test.ts",
      pendingOwnerAction: null,
      userAuthorization: "not-authorized",
      hookPermission: "not-observed",
      exitStatus: null,
      outcome: null,
      evidenceRefs: [],
    },
    {
      id: REPOSITORY_VALIDATION_ID,
      findingIds: [],
      kind: "full-gate",
      target: "repository",
      repositoryRoot: ".",
      requirementRefs: ["18.1"],
      verifies: "The entire repository.",
      limitation: "Broader than the individual finding.",
      state: "pending",
      exactCommand: "pnpm run gate",
      pendingOwnerAction: null,
      userAuthorization: "not-authorized",
      hookPermission: "not-observed",
      exitStatus: null,
      outcome: null,
      evidenceRefs: [],
    },
    {
      id: "validation:observed",
      findingIds: [],
      kind: "static-inspection",
      target: "repository",
      repositoryRoot: ".",
      requirementRefs: ["18.1"],
      verifies: "The compliant audited area.",
      limitation: "Static evidence only.",
      state: "observed",
      exactCommand: "authorized-static-inspection",
      pendingOwnerAction: null,
      userAuthorization: "authorized",
      hookPermission: "permitted",
      exitStatus: 0,
      outcome: "acceptable",
      evidenceRefs: [VALIDATION_EVIDENCE_ID],
    },
  ];

  return {
    coverageItems: [
      {
        id: "area:route",
        kind: "route",
        path: "site/app/ooplanner/page.tsx",
        routePath: "/ooplanner",
        routeFileKind: "page",
        status: "wired",
        evidenceRefs: [SOURCE_EVIDENCE_ID],
      },
      {
        id: "area:source",
        kind: "planner-source",
        path: "site/lib/Planner/projectsStore.ts",
        area: "lib",
        status: "present-but-unverified",
        statusNote: "Runtime behavior requires protected validation.",
        evidenceRefs: [SOURCE_EVIDENCE_ID],
      },
    ],
    coverageLinks: [
      {
        itemId: "area:route",
        routeIds: ["area:route"],
        workflowIds: ["workflow:main"],
        viewportClasses: ["desktop", "tablet", "phone"],
        inputMethods: ["pointer", "touch", "keyboard"],
        stateIds: ["default", "success"],
        securityControlIds: ["authentication"],
        persistenceModes: ["disk", "supabase"],
        requirementRefs: ["1.1", "1.3"],
        findingIds: [],
        verificationRefs: [
          FINDING_VALIDATION_ID,
          REPOSITORY_VALIDATION_ID,
          "validation:observed",
        ],
        evidenceRefs: [SOURCE_EVIDENCE_ID],
      },
      {
        itemId: "area:source",
        routeIds: ["area:route"],
        workflowIds: ["workflow:main"],
        viewportClasses: ["desktop", "tablet", "phone"],
        inputMethods: ["pointer", "touch", "keyboard"],
        stateIds: ["default", "success"],
        securityControlIds: ["authentication"],
        persistenceModes: ["disk", "supabase"],
        requirementRefs: ["1.2", "1.3"],
        findingIds: [],
        verificationRefs: [FINDING_VALIDATION_ID, REPOSITORY_VALIDATION_ID],
        evidenceRefs: [SOURCE_EVIDENCE_ID],
      },
    ],
    workflowTraces: [
      workflowTrace("workflow:main"),
      workflowTrace(RECOVERY_WORKFLOW_ID),
    ],
    evidence: [
      {
        id: SOURCE_EVIDENCE_ID,
        class: "repository",
        summary: "Source inspection",
        sourceRefs: ["site/app/ooplanner/page.tsx"],
        limitation: "Source inspection does not prove runtime behavior.",
      },
      {
        id: VALIDATION_EVIDENCE_ID,
        class: "repository",
        summary: "Observed focused inspection",
        sourceRefs: ["authorized-static-inspection"],
        limitation: "Static evidence only.",
      },
    ],
    validations,
    findings: [],
  };
}

function makeRegistrations(): FindingRegistration[] {
  return [
    {
      auditedAreaId: "area:route",
      classification: "compliant",
      title: "Planner entry route is compliant",
      severity: "note",
      state: "compliant-with-evidence",
      expected: "The route is represented by one thin entry.",
      observed: "The audited entry matches the route contract.",
      reproductionEvidenceRefs: [SOURCE_EVIDENCE_ID],
      completionEvidenceRefs: [VALIDATION_EVIDENCE_ID],
      adjacentImpactReviewed: true,
      verificationCandidates: [
        { validationId: REPOSITORY_VALIDATION_ID, scope: "repository" },
        { validationId: "validation:observed", scope: "finding" },
      ],
    },
    {
      auditedAreaId: "area:source",
      classification: "defect",
      title: "Project store remediation awaits validation",
      severity: "medium",
      state: "remediated-validation-pending",
      expected: "The source satisfies its owner-scoped persistence contract.",
      observed: "The smallest source remediation is recorded.",
      reproductionEvidenceRefs: [SOURCE_EVIDENCE_ID],
      adjacentWorkflowIds: [RECOVERY_WORKFLOW_ID],
      adjacentImpactReviewed: true,
      remediationPaths: ["site/lib/Planner/projectsStore.ts"],
      verificationCandidates: [
        { validationId: REPOSITORY_VALIDATION_ID, scope: "repository" },
        { validationId: FINDING_VALIDATION_ID, scope: "finding" },
      ],
    },
  ];
}

function makeCandidateRegistrations(): FindingRegistration[] {
  return [
    {
      auditedAreaId: "area:route",
      classification: "defect",
      title: "Planner route candidate",
      severity: "low",
      state: "candidate",
      expected: "The route meets the audited contract.",
      observed: "The candidate requires lifecycle review.",
      reproductionEvidenceRefs: [SOURCE_EVIDENCE_ID],
      adjacentImpactReviewed: false,
      verificationCandidates: [
        { validationId: FINDING_VALIDATION_ID, scope: "finding" },
      ],
    },
    {
      auditedAreaId: "area:source",
      classification: "defect",
      title: "Planner source candidate",
      severity: "low",
      state: "candidate",
      expected: "The source meets the audited contract.",
      observed: "The candidate requires lifecycle review.",
      reproductionEvidenceRefs: [SOURCE_EVIDENCE_ID],
      adjacentWorkflowIds: [RECOVERY_WORKFLOW_ID],
      adjacentImpactReviewed: false,
      verificationCandidates: [
        { validationId: FINDING_VALIDATION_ID, scope: "finding" },
      ],
    },
  ];
}

describe("Planner Task 1.4 finding registry", () => {
  it("creates one deterministic finding per audited area with impact and path closure", () => {
    const first = createFindingRegistry(makeDataset(), makeRegistrations());
    const second = createFindingRegistry(makeDataset(), makeRegistrations());

    expect(first).toEqual(second);
    expect(first.findings).toHaveLength(first.coverageItems.length);
    expect(new Set(first.findings.map((finding) => finding.auditedAreaId))).toEqual(
      new Set(first.coverageItems.map((item) => item.id)),
    );
    expect(first.coverageLinks.every((link) => link.findingIds.length === 1)).toBe(
      true,
    );

    const defect = first.findings.find(
      (finding) => finding.auditedAreaId === "area:source",
    );
    expect(defect).toEqual(
      expect.objectContaining({
        classification: "defect",
        workflowIds: expect.arrayContaining([RECOVERY_WORKFLOW_ID]),
        adjacentWorkflowIds: [RECOVERY_WORKFLOW_ID],
        narrowestValidationId: FINDING_VALIDATION_ID,
        verificationScope: "finding",
        preservedUnrelatedPaths: ["site/app/ooplanner/page.tsx"],
      }),
    );
    expect(validateFindingRegistry(first)).toEqual({ valid: true, issues: [] });
    expect(isComprehensiveRemediationComplete(first)).toBe(true);
    expect(isFullValidationComplete(first)).toBe(false);
  });

  it("rejects missing and duplicate audited-area registrations", () => {
    const registrations = makeRegistrations();

    expect(() =>
      createFindingRegistry(makeDataset(), registrations.slice(0, 1)),
    ).toThrow("Missing finding registration for audited area: area:source");
    expect(() =>
      createFindingRegistry(makeDataset(), [registrations[0], registrations[0]]),
    ).toThrow("Duplicate finding registration for audited area: area:route");
  });

  it("allows only monotonic transitions and expands adjacent impact before closure", () => {
    const registry = createFindingRegistry(
      makeDataset(),
      makeCandidateRegistrations(),
    );
    const findingId = "finding:area:area:route";
    const verified = transitionFindingLifecycle(
      registry,
      findingId,
      "verified",
    );

    expect(() =>
      transitionFindingLifecycle(verified, findingId, "candidate"),
    ).toThrow("Finding transition is not monotonic: verified -> candidate");

    const approved = transitionFindingLifecycle(
      verified,
      findingId,
      "remediation-approved",
    );
    expect(() =>
      transitionFindingLifecycle(
        approved,
        findingId,
        "remediated-validation-pending",
        {
          remediationPaths: ["site/app/ooplanner/page.tsx"],
          adjacentWorkflowIds: [RECOVERY_WORKFLOW_ID],
        },
      ),
    ).toThrow("A terminal finding requires a completed adjacent-impact review");

    const closedPending = transitionFindingLifecycle(
      approved,
      findingId,
      "remediated-validation-pending",
      {
        remediationPaths: ["site/app/ooplanner/page.tsx"],
        adjacentWorkflowIds: [RECOVERY_WORKFLOW_ID],
        adjacentImpactReviewed: true,
      },
    );
    expect(
      closedPending.findings.find((finding) => finding.id === findingId),
    ).toEqual(
      expect.objectContaining({
        state: "remediated-validation-pending",
        workflowIds: expect.arrayContaining([RECOVERY_WORKFLOW_ID]),
      }),
    );
  });

  it("enforces evidence-backed terminal classifications and exact preservation", () => {
    const registry = createFindingRegistry(makeDataset(), makeRegistrations());
    const invalidEvidence = structuredClone(registry);
    invalidEvidence.findings[0].completionEvidenceRefs = [];

    expect(validateFindingRegistry(invalidEvidence).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-link",
          path: "findings[0].completionEvidenceRefs",
        }),
        expect.objectContaining({
          code: "missing-evidence",
          path: "findings[0].completionEvidenceRefs",
        }),
      ]),
    );

    const invalidPreservation = structuredClone(registry);
    invalidPreservation.findings[1].preservedUnrelatedPaths = [];
    expect(validateFindingRegistry(invalidPreservation).issues).toContainEqual(
      expect.objectContaining({
        code: "missing-link",
        path: "findings[1].preservedUnrelatedPaths",
      }),
    );

    const invalidPendingBlocker = structuredClone(registry);
    invalidPendingBlocker.findings[1].blocker = {
      evidenceRefs: [SOURCE_EVIDENCE_ID],
      ownerDecision: "Approve unrelated scope.",
      acceptedByOwner: false,
    };
    expect(validateFindingRegistry(invalidPendingBlocker).issues).toContainEqual(
      expect.objectContaining({
        code: "invalid-finding-state",
        path: "findings[1].blocker",
      }),
    );
  });

  it("rejects concurrent ownership and gates terminal findings on handoff reconciliation", () => {
    const registry = createFindingRegistry(
      makeDataset(),
      makeCandidateRegistrations(),
    );
    const findingId = "finding:area:area:route";
    const assignment = {
      path: "site/app/ooplanner/page.tsx",
      workstream: "workstream-1" as const,
      findingIds: [findingId],
    };

    expect(() =>
      createOwnershipLedger({
        writablePaths: [assignment.path],
        assignments: [
          assignment,
          { ...assignment, workstream: "workstream-2" },
        ],
        contractHandoffs: [],
        integrationConflicts: [],
      }),
    ).toThrow("Concurrent ownership is forbidden");

    registry.coordinationLedger = createOwnershipLedger({
      writablePaths: [assignment.path],
      assignments: [assignment],
      contractHandoffs: [
        {
          id: "handoff:planner-entry",
          contractPath: assignment.path,
          contractVersion: "1",
          ownerWorkstream: "workstream-1",
          consumerWorkstreams: ["workstream-2"],
          acknowledgedBy: [],
          status: "proposed",
          findingIds: [findingId],
        },
      ],
      integrationConflicts: [
        {
          id: "conflict:planner-entry",
          findingIds: [findingId],
          paths: [assignment.path],
          summary: "The consumer has not reconciled the entry contract.",
          status: "open",
          resolutionEvidenceRefs: [],
        },
      ],
    });

    const verified = transitionFindingLifecycle(
      registry,
      findingId,
      "verified",
    );
    const approved = transitionFindingLifecycle(
      verified,
      findingId,
      "remediation-approved",
    );
    expect(() =>
      transitionFindingLifecycle(
        approved,
        findingId,
        "remediated-validation-pending",
        {
          adjacentImpactReviewed: true,
          remediationPaths: [assignment.path],
        },
      ),
    ).toThrow("Finding transition has unresolved coordination");

    const reconciled = structuredClone(approved);
    const handoff = reconciled.coordinationLedger?.contractHandoffs[0];
    const conflict = reconciled.coordinationLedger?.integrationConflicts[0];
    if (!handoff || !conflict) {
      throw new Error("Expected coordination records for the finding.");
    }
    handoff.status = "acknowledged";
    handoff.acknowledgedBy = ["workstream-2"];
    conflict.status = "resolved";
    conflict.resolutionEvidenceRefs = [SOURCE_EVIDENCE_ID];

    const closedPending = transitionFindingLifecycle(
      reconciled,
      findingId,
      "remediated-validation-pending",
      {
        adjacentImpactReviewed: true,
        remediationPaths: [assignment.path],
      },
    );
    expect(validateFindingRegistry(closedPending)).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("requires owner acceptance before an evidenced blocker completes remediation", () => {
    const registrations = makeRegistrations();
    registrations[1] = {
      ...registrations[1],
      state: "blocked-with-evidence",
      remediationPaths: [],
      blocker: {
        evidenceRefs: [SOURCE_EVIDENCE_ID],
        ownerDecision: "Approve the required out-of-scope remediation.",
        acceptedByOwner: false,
      },
    };
    const registry = createFindingRegistry(makeDataset(), registrations);

    expect(isComprehensiveRemediationComplete(registry)).toBe(false);
    registry.findings[1].blocker!.acceptedByOwner = true;
    expect(isComprehensiveRemediationComplete(registry)).toBe(true);
    expect(validateFindingRegistry(registry, { requireTerminalFindings: true })).toEqual(
      { valid: true, issues: [] },
    );
  });
});
