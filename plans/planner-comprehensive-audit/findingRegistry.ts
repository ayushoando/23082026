import type {
  AuditFinding,
  AuditValidationResult,
  CoverageItemRef,
  FindingBlocker,
  FindingRef,
  FindingSeverity,
  FindingState,
  PlannerAuditDataset,
  RequirementRef,
  ValidationIssue,
  ValidationRecord,
  ValidationRef,
} from "./auditModel";
import {
  isFindingTransitionAllowed,
  validateAuditDataset,
} from "./auditValidators";

export const TASK_1_4_REQUIREMENTS = [
  "2.1",
  "2.3",
  "2.4",
  "2.5",
  "2.6",
  "18.1",
  "19.1",
  "19.2",
  "19.7",
  "19.8",
] as const satisfies readonly RequirementRef[];

export const TERMINAL_FINDING_STATES = [
  "remediated-validation-pending",
  "remediated-with-evidence",
  "blocked-with-evidence",
  "compliant-with-evidence",
] as const satisfies readonly FindingState[];

export type TerminalFindingState =
  (typeof TERMINAL_FINDING_STATES)[number];
export type FindingClassification = "defect" | "compliant";
export type VerificationScope =
  | "finding"
  | "audited-area"
  | "workstream"
  | "repository";

export interface VerificationCandidate {
  validationId: ValidationRef;
  scope: VerificationScope;
}

export interface FindingRegistration {
  auditedAreaId: CoverageItemRef;
  classification: FindingClassification;
  title: string;
  severity: FindingSeverity;
  state: FindingState;
  expected: string;
  observed: string;
  reproductionEvidenceRefs: string[];
  completionEvidenceRefs?: string[];
  adjacentWorkflowIds?: string[];
  adjacentImpactReviewed: boolean;
  remediationPaths?: string[];
  verificationCandidates: VerificationCandidate[];
  blocker?: FindingBlocker;
}

export interface RegisteredAuditFinding extends AuditFinding {
  auditedAreaId: CoverageItemRef;
  classification: FindingClassification;
  adjacentImpactReviewed: boolean;
  preservedUnrelatedPaths: string[];
  narrowestValidationId: ValidationRef;
  verificationScope: VerificationScope;
}

export interface FindingRegistryDataset extends PlannerAuditDataset {
  findings: RegisteredAuditFinding[];
  coordinationLedger?: OwnershipLedger;
}

export interface FindingRegistryValidationOptions {
  requireTerminalFindings?: boolean;
}

export interface FindingLifecyclePatch {
  adjacentWorkflowIds?: string[];
  adjacentImpactReviewed?: boolean;
  remediationPaths?: string[];
  completionEvidenceRefs?: string[];
  blocker?: FindingBlocker;
}

export type PlannerAuditWorkstream =
  | "workstream-1"
  | "workstream-2"
  | "workstream-3"
  | "workstream-4"
  | "workstream-5";

export interface FileOwnershipAssignment {
  path: string;
  workstream: PlannerAuditWorkstream;
  findingIds: FindingRef[];
}

export interface ContractHandoff {
  id: string;
  contractPath: string;
  contractVersion: string;
  ownerWorkstream: PlannerAuditWorkstream;
  consumerWorkstreams: PlannerAuditWorkstream[];
  acknowledgedBy: PlannerAuditWorkstream[];
  status: "proposed" | "acknowledged" | "rejected";
  findingIds: FindingRef[];
}

export interface IntegrationConflict {
  id: string;
  findingIds: FindingRef[];
  paths: string[];
  summary: string;
  status: "open" | "resolved";
  resolutionEvidenceRefs: string[];
}

export interface OwnershipLedger {
  writablePaths: string[];
  assignments: FileOwnershipAssignment[];
  contractHandoffs: ContractHandoff[];
  integrationConflicts: IntegrationConflict[];
}

const VERIFICATION_SCOPE_RANK: Readonly<Record<VerificationScope, number>> = {
  finding: 0,
  "audited-area": 1,
  workstream: 2,
  repository: 3,
};

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort(compareText);
}

function findingIdForArea(areaId: CoverageItemRef): string {
  return `finding:area:${areaId}`;
}

function isTerminalFindingState(
  state: FindingState,
): state is TerminalFindingState {
  return TERMINAL_FINDING_STATES.includes(state as TerminalFindingState);
}

function selectNarrowestVerification(
  candidates: readonly VerificationCandidate[],
): VerificationCandidate {
  if (candidates.length === 0) {
    throw new Error("Every finding requires at least one verification candidate.");
  }

  return [...candidates].sort((left, right) => {
    const rankDifference =
      VERIFICATION_SCOPE_RANK[left.scope] -
      VERIFICATION_SCOPE_RANK[right.scope];
    return rankDifference || compareText(left.validationId, right.validationId);
  })[0];
}

function preservedUnrelatedPaths(
  dataset: PlannerAuditDataset,
  sourcePaths: readonly string[],
  remediationPaths: readonly string[],
): string[] {
  const affectedPaths = new Set([...sourcePaths, ...remediationPaths]);
  return uniqueSorted(
    dataset.coverageItems
      .map((item) => item.path)
      .filter((path) => !affectedPaths.has(path)),
  );
}

function addIssue(
  issues: ValidationIssue[],
  code: ValidationIssue["code"],
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

export function validateOwnershipLedger(
  ledger: OwnershipLedger,
): AuditValidationResult {
  const issues: ValidationIssue[] = [];
  const writablePathSet = new Set<string>();
  ledger.writablePaths.forEach((writablePath, index) => {
    if (writablePathSet.has(writablePath)) {
      addIssue(
        issues,
        "duplicate-path",
        `coordinationLedger.writablePaths[${index}]`,
        `Writable path is declared more than once: ${writablePath}`,
      );
    }
    writablePathSet.add(writablePath);
  });

  const assignmentByPath = new Map<string, FileOwnershipAssignment>();
  ledger.assignments.forEach((assignment, index) => {
    if (!writablePathSet.has(assignment.path)) {
      addIssue(
        issues,
        "invalid-reference",
        `coordinationLedger.assignments[${index}].path`,
        `Ownership references an undeclared writable path: ${assignment.path}`,
      );
    }
    if (assignmentByPath.has(assignment.path)) {
      addIssue(
        issues,
        "duplicate-path",
        `coordinationLedger.assignments[${index}].path`,
        `Concurrent ownership is forbidden for: ${assignment.path}`,
      );
    } else {
      assignmentByPath.set(assignment.path, assignment);
    }
  });

  for (const writablePath of writablePathSet) {
    if (!assignmentByPath.has(writablePath)) {
      addIssue(
        issues,
        "missing-link",
        "coordinationLedger.assignments",
        `Writable path has no exclusive owner: ${writablePath}`,
      );
    }
  }

  const handoffIds = new Set<string>();
  ledger.contractHandoffs.forEach((handoff, index) => {
    const path = `coordinationLedger.contractHandoffs[${index}]`;
    if (handoffIds.has(handoff.id)) {
      addIssue(issues, "duplicate-id", `${path}.id`, `Duplicate handoff id: ${handoff.id}`);
    }
    handoffIds.add(handoff.id);

    const owner = assignmentByPath.get(handoff.contractPath);
    if (!owner || owner.workstream !== handoff.ownerWorkstream) {
      addIssue(
        issues,
        "invalid-reference",
        `${path}.ownerWorkstream`,
        `Contract owner does not own ${handoff.contractPath}.`,
      );
    }
    if (handoff.consumerWorkstreams.includes(handoff.ownerWorkstream)) {
      addIssue(
        issues,
        "invalid-reference",
        `${path}.consumerWorkstreams`,
        "A contract owner cannot also be its consumer.",
      );
    }
    if (
      handoff.status === "acknowledged" &&
      !handoff.consumerWorkstreams.every((consumer) =>
        handoff.acknowledgedBy.includes(consumer),
      )
    ) {
      addIssue(
        issues,
        "missing-link",
        `${path}.acknowledgedBy`,
        "Every contract consumer must acknowledge the published version.",
      );
    }
  });

  const conflictIds = new Set<string>();
  ledger.integrationConflicts.forEach((conflict, index) => {
    const path = `coordinationLedger.integrationConflicts[${index}]`;
    if (conflictIds.has(conflict.id)) {
      addIssue(issues, "duplicate-id", `${path}.id`, `Duplicate conflict id: ${conflict.id}`);
    }
    conflictIds.add(conflict.id);
    if (
      conflict.status === "resolved" &&
      conflict.resolutionEvidenceRefs.length === 0
    ) {
      addIssue(
        issues,
        "missing-evidence",
        `${path}.resolutionEvidenceRefs`,
        "A resolved integration conflict requires resolution evidence.",
      );
    }
  });

  issues.sort((left, right) =>
    `${left.path}\u0000${left.code}\u0000${left.message}`.localeCompare(
      `${right.path}\u0000${right.code}\u0000${right.message}`,
    ),
  );
  return { valid: issues.length === 0, issues };
}

export function createOwnershipLedger(
  ledger: OwnershipLedger,
): OwnershipLedger {
  const result = validateOwnershipLedger(ledger);
  if (!result.valid) {
    const details = result.issues
      .map((issue) => `${issue.path} [${issue.code}] ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid Planner ownership ledger:\n${details}`);
  }

  return {
    writablePaths: uniqueSorted(ledger.writablePaths),
    assignments: structuredClone(ledger.assignments).sort((left, right) =>
      compareText(left.path, right.path),
    ),
    contractHandoffs: structuredClone(ledger.contractHandoffs).sort((left, right) =>
      compareText(left.id, right.id),
    ),
    integrationConflicts: structuredClone(ledger.integrationConflicts).sort(
      (left, right) => compareText(left.id, right.id),
    ),
  };
}

function unresolvedCoordinationReasons(
  ledger: OwnershipLedger | undefined,
  findingId: FindingRef,
): string[] {
  if (!ledger) {
    return [];
  }
  const handoffs = ledger.contractHandoffs
    .filter(
      (handoff) =>
        handoff.findingIds.includes(findingId) &&
        handoff.status !== "acknowledged",
    )
    .map((handoff) => `contract handoff ${handoff.id} is ${handoff.status}`);
  const conflicts = ledger.integrationConflicts
    .filter(
      (conflict) =>
        conflict.findingIds.includes(findingId) && conflict.status === "open",
    )
    .map((conflict) => `integration conflict ${conflict.id} is open`);
  return [...handoffs, ...conflicts];
}

function sameValues(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const normalizedLeft = uniqueSorted(left);
  const normalizedRight = uniqueSorted(right);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}

function validateTerminalFinding(
  finding: RegisteredAuditFinding,
  validation: ValidationRecord | undefined,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isTerminalFindingState(finding.state)) {
    return;
  }

  if (!finding.adjacentImpactReviewed) {
    addIssue(
      issues,
      "invalid-finding-state",
      `${path}.adjacentImpactReviewed`,
      "A terminal finding requires a completed adjacent-impact review.",
    );
  }

  for (const adjacentWorkflowId of finding.adjacentWorkflowIds) {
    if (!finding.workflowIds.includes(adjacentWorkflowId)) {
      addIssue(
        issues,
        "missing-link",
        `${path}.workflowIds`,
        `Adjacent workflow must be included before closure: ${adjacentWorkflowId}`,
      );
    }
  }

  if (
    finding.state !== "blocked-with-evidence" &&
    finding.blocker
  ) {
    addIssue(
      issues,
      "invalid-finding-state",
      `${path}.blocker`,
      "Blocker data is permitted only for a blocked-with-evidence finding.",
    );
  }

  if (finding.state === "compliant-with-evidence") {
    if (finding.classification !== "compliant") {
      addIssue(
        issues,
        "invalid-finding-state",
        `${path}.classification`,
        "Only a compliant finding can close as compliant with evidence.",
      );
    }
    if (finding.remediationPaths.length > 0 || finding.blocker) {
      addIssue(
        issues,
        "invalid-finding-state",
        path,
        "A compliant finding cannot claim remediation paths or blocker data.",
      );
    }
  } else if (finding.classification !== "defect") {
    addIssue(
      issues,
      "invalid-finding-state",
      `${path}.classification`,
      "Remediated and blocked terminal states require a defect finding.",
    );
  }

  if (finding.state === "remediated-validation-pending") {
    if (!validation || validation.state !== "pending") {
      addIssue(
        issues,
        "invalid-validation-state",
        `${path}.narrowestValidationId`,
        "Validation-pending remediation requires one pending validation record.",
      );
    }
    if (finding.completionEvidenceRefs.length > 0 || finding.blocker) {
      addIssue(
        issues,
        "invalid-finding-state",
        path,
        "Validation-pending remediation cannot claim completion evidence or blocker data.",
      );
    }
    return;
  }

  if (finding.state === "blocked-with-evidence") {
    if (!finding.blocker) {
      addIssue(
        issues,
        "invalid-finding-state",
        `${path}.blocker`,
        "A blocked finding requires blocker evidence and an owner decision.",
      );
    }
    if (finding.completionEvidenceRefs.length > 0) {
      addIssue(
        issues,
        "invalid-finding-state",
        `${path}.completionEvidenceRefs`,
        "A blocked finding cannot claim remediation completion evidence.",
      );
    }
    return;
  }

  if (
    !validation ||
    validation.state !== "observed" ||
    validation.outcome !== "acceptable"
  ) {
    addIssue(
      issues,
      "invalid-validation-state",
      `${path}.narrowestValidationId`,
      "Evidence-backed closure requires one observed acceptable validation.",
    );
    return;
  }

  for (const evidenceRef of validation.evidenceRefs) {
    if (!finding.completionEvidenceRefs.includes(evidenceRef)) {
      addIssue(
        issues,
        "missing-evidence",
        `${path}.completionEvidenceRefs`,
        `Completion evidence must include validation evidence: ${evidenceRef}`,
      );
    }
  }
}

export function createFindingRegistry(
  dataset: PlannerAuditDataset,
  registrations: readonly FindingRegistration[],
): FindingRegistryDataset {
  const registrationByArea = new Map<CoverageItemRef, FindingRegistration>();
  for (const registration of registrations) {
    if (registrationByArea.has(registration.auditedAreaId)) {
      throw new Error(
        `Duplicate finding registration for audited area: ${registration.auditedAreaId}`,
      );
    }
    registrationByArea.set(registration.auditedAreaId, registration);
  }

  const knownValidationIds = new Set(
    dataset.validations.map((validation) => validation.id),
  );
  const coverageLinkByItem = new Map(
    dataset.coverageLinks.map((link) => [link.itemId, link]),
  );

  const findings = dataset.coverageItems.map((item) => {
    const registration = registrationByArea.get(item.id);
    if (!registration) {
      throw new Error(`Missing finding registration for audited area: ${item.id}`);
    }
    const link = coverageLinkByItem.get(item.id);
    if (!link) {
      throw new Error(`Missing coverage link for audited area: ${item.id}`);
    }
    const applicableValidationIds = new Set(link.verificationRefs);
    for (const candidate of registration.verificationCandidates) {
      if (!knownValidationIds.has(candidate.validationId)) {
        throw new Error(
          `Unknown validation candidate for ${item.id}: ${candidate.validationId}`,
        );
      }
      if (!applicableValidationIds.has(candidate.validationId)) {
        throw new Error(
          `Inapplicable validation candidate for ${item.id}: ${candidate.validationId}`,
        );
      }
    }

    const verification = selectNarrowestVerification(
      registration.verificationCandidates,
    );
    const remediationPaths = uniqueSorted(registration.remediationPaths ?? []);
    const sourcePaths = [item.path];
    const adjacentWorkflowIds = uniqueSorted(
      registration.adjacentWorkflowIds ?? [],
    );

    return {
      id: findingIdForArea(item.id),
      auditedAreaId: item.id,
      classification: registration.classification,
      title: registration.title,
      severity: registration.severity,
      state: registration.state,
      routeIds: uniqueSorted(link.routeIds),
      workflowIds: uniqueSorted([
        ...link.workflowIds,
        ...adjacentWorkflowIds,
      ]),
      adjacentWorkflowIds,
      adjacentImpactReviewed: registration.adjacentImpactReviewed,
      sourcePaths,
      requirementRefs: uniqueSorted([
        ...link.requirementRefs,
        ...TASK_1_4_REQUIREMENTS,
      ]),
      reproductionEvidenceRefs: uniqueSorted(
        registration.reproductionEvidenceRefs,
      ),
      completionEvidenceRefs: uniqueSorted(
        registration.completionEvidenceRefs ?? [],
      ),
      expected: registration.expected,
      observed: registration.observed,
      affectedScope: [item.id],
      remediationPaths,
      preservedUnrelatedPaths: preservedUnrelatedPaths(
        dataset,
        sourcePaths,
        remediationPaths,
      ),
      validationIds: [verification.validationId],
      narrowestValidationId: verification.validationId,
      verificationScope: verification.scope,
      ...(registration.blocker
        ? { blocker: structuredClone(registration.blocker) }
        : {}),
    } satisfies RegisteredAuditFinding;
  });

  if (registrationByArea.size !== dataset.coverageItems.length) {
    const knownAreaIds = new Set(dataset.coverageItems.map((item) => item.id));
    const unknownAreaIds = [...registrationByArea.keys()].filter(
      (areaId) => !knownAreaIds.has(areaId),
    );
    throw new Error(
      `Finding registrations include unknown audited areas: ${unknownAreaIds.sort(compareText).join(", ")}`,
    );
  }

  const findingByArea = new Map(
    findings.map((finding) => [finding.auditedAreaId, finding]),
  );
  const findingIdsByWorkflow = new Map<string, string[]>();
  for (const finding of findings) {
    for (const workflowId of finding.workflowIds) {
      const findingIds = findingIdsByWorkflow.get(workflowId) ?? [];
      findingIds.push(finding.id);
      findingIdsByWorkflow.set(workflowId, findingIds);
    }
  }

  const selectedValidationIds = new Set(
    findings.map((finding) => finding.narrowestValidationId),
  );
  const validations = dataset.validations
    .filter((validation) => selectedValidationIds.has(validation.id))
    .map((validation) => ({
      ...structuredClone(validation),
      findingIds: findings
        .filter(
          (finding) => finding.narrowestValidationId === validation.id,
        )
        .map((finding) => finding.id),
    }));

  const registry: FindingRegistryDataset = {
    ...structuredClone(dataset),
    coverageLinks: dataset.coverageLinks.map((link) => {
      const finding = findingByArea.get(link.itemId);
      if (!finding) {
        throw new Error(`No registry finding for coverage link: ${link.itemId}`);
      }
      return {
        ...structuredClone(link),
        workflowIds: uniqueSorted([
          ...link.workflowIds,
          ...finding.adjacentWorkflowIds,
        ]),
        findingIds: [finding.id],
        verificationRefs: [finding.narrowestValidationId],
      };
    }),
    workflowTraces: dataset.workflowTraces.map((trace) => ({
      ...structuredClone(trace),
      findingIds: uniqueSorted(findingIdsByWorkflow.get(trace.id) ?? []),
      verificationRefs: uniqueSorted(
        findings
          .filter((finding) => finding.workflowIds.includes(trace.id))
          .map((finding) => finding.narrowestValidationId),
      ),
    })),
    validations,
    findings,
  };

  const result = validateFindingRegistry(registry);
  if (!result.valid) {
    const details = result.issues
      .map((issue) => `${issue.path} [${issue.code}] ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid Planner finding registry:\n${details}`);
  }

  return registry;
}

export function validateFindingRegistry(
  dataset: FindingRegistryDataset,
  options: FindingRegistryValidationOptions = {},
): AuditValidationResult {
  const issues = [...validateAuditDataset(dataset).issues];
  if (dataset.coordinationLedger) {
    issues.push(...validateOwnershipLedger(dataset.coordinationLedger).issues);
  }
  const coverageItemIds = new Set(
    dataset.coverageItems.map((item) => item.id),
  );
  const validationById = new Map(
    dataset.validations.map((validation) => [validation.id, validation]),
  );
  const findingByArea = new Map<string, RegisteredAuditFinding>();

  dataset.findings.forEach((finding, index) => {
    const path = `findings[${index}]`;
    if (!coverageItemIds.has(finding.auditedAreaId)) {
      addIssue(
        issues,
        "invalid-reference",
        `${path}.auditedAreaId`,
        `Unknown audited area: ${finding.auditedAreaId}`,
      );
    }
    if (findingByArea.has(finding.auditedAreaId)) {
      addIssue(
        issues,
        "duplicate-ref",
        `${path}.auditedAreaId`,
        `Audited area has more than one finding: ${finding.auditedAreaId}`,
      );
    }
    findingByArea.set(finding.auditedAreaId, finding);

    if (
      finding.validationIds.length !== 1 ||
      finding.validationIds[0] !== finding.narrowestValidationId
    ) {
      addIssue(
        issues,
        "invalid-validation-state",
        `${path}.validationIds`,
        "Each finding must map only to its narrowest applicable validation.",
      );
    }

    const expectedPreservedPaths = preservedUnrelatedPaths(
      dataset,
      finding.sourcePaths,
      finding.remediationPaths,
    );
    if (!sameValues(finding.preservedUnrelatedPaths, expectedPreservedPaths)) {
      addIssue(
        issues,
        "missing-link",
        `${path}.preservedUnrelatedPaths`,
        "Remediation records must preserve every unrelated audited path.",
      );
    }

    if (
      options.requireTerminalFindings &&
      !isTerminalFindingState(finding.state)
    ) {
      addIssue(
        issues,
        "invalid-finding-state",
        `${path}.state`,
        "Final registry reconciliation requires a terminal finding classification.",
      );
    }

    if (
      finding.state !== "candidate" &&
      finding.state !== "compliant-with-evidence" &&
      finding.classification !== "defect"
    ) {
      addIssue(
        issues,
        "invalid-finding-state",
        `${path}.classification`,
        "Only defect findings can enter the remediation lifecycle.",
      );
    }

    validateTerminalFinding(
      finding,
      validationById.get(finding.narrowestValidationId),
      path,
      issues,
    );

    if (isTerminalFindingState(finding.state)) {
      for (const reason of unresolvedCoordinationReasons(
        dataset.coordinationLedger,
        finding.id,
      )) {
        addIssue(
          issues,
          "invalid-finding-state",
          `${path}.state`,
          `Terminal finding has unresolved coordination: ${reason}.`,
        );
      }
    }
  });

  dataset.coverageItems.forEach((item, index) => {
    const finding = findingByArea.get(item.id);
    if (!finding) {
      addIssue(
        issues,
        "missing-link",
        `coverageItems[${index}].id`,
        `Audited area has no finding: ${item.id}`,
      );
      return;
    }
    const link = dataset.coverageLinks.find(
      (candidate) => candidate.itemId === item.id,
    );
    if (!link || link.findingIds.length !== 1 || link.findingIds[0] !== finding.id) {
      addIssue(
        issues,
        "missing-link",
        `coverageLinks.${item.id}.findingIds`,
        `Audited area must link to exactly one registry finding: ${finding.id}`,
      );
    }
  });

  issues.sort((left, right) =>
    `${left.path}\u0000${left.code}\u0000${left.message}`.localeCompare(
      `${right.path}\u0000${right.code}\u0000${right.message}`,
    ),
  );

  return { valid: issues.length === 0, issues };
}

export function transitionFindingLifecycle(
  dataset: FindingRegistryDataset,
  findingId: string,
  targetState: FindingState,
  patch: FindingLifecyclePatch = {},
): FindingRegistryDataset {
  const current = dataset.findings.find((finding) => finding.id === findingId);
  if (!current) {
    throw new Error(`Unknown finding: ${findingId}`);
  }
  if (!isFindingTransitionAllowed(current.state, targetState)) {
    throw new Error(
      `Finding transition is not monotonic: ${current.state} -> ${targetState}`,
    );
  }
  if (isTerminalFindingState(targetState)) {
    const unresolvedReasons = unresolvedCoordinationReasons(
      dataset.coordinationLedger,
      current.id,
    );
    if (unresolvedReasons.length > 0) {
      throw new Error(
        `Finding transition has unresolved coordination: ${unresolvedReasons.join("; ")}`,
      );
    }
  }
  if (
    current.adjacentImpactReviewed &&
    patch.adjacentImpactReviewed === false
  ) {
    throw new Error("Adjacent-impact review cannot regress after completion.");
  }

  const next = structuredClone(dataset);
  const finding = next.findings.find((candidate) => candidate.id === findingId);
  if (!finding) {
    throw new Error(`Unknown finding after cloning: ${findingId}`);
  }

  finding.state = targetState;
  finding.adjacentWorkflowIds = uniqueSorted([
    ...finding.adjacentWorkflowIds,
    ...(patch.adjacentWorkflowIds ?? []),
  ]);
  finding.workflowIds = uniqueSorted([
    ...finding.workflowIds,
    ...finding.adjacentWorkflowIds,
  ]);
  finding.adjacentImpactReviewed =
    finding.adjacentImpactReviewed || patch.adjacentImpactReviewed === true;
  finding.remediationPaths = uniqueSorted([
    ...finding.remediationPaths,
    ...(patch.remediationPaths ?? []),
  ]);
  finding.completionEvidenceRefs = uniqueSorted([
    ...finding.completionEvidenceRefs,
    ...(patch.completionEvidenceRefs ?? []),
  ]);
  finding.preservedUnrelatedPaths = preservedUnrelatedPaths(
    next,
    finding.sourcePaths,
    finding.remediationPaths,
  );
  if (patch.blocker) {
    finding.blocker = structuredClone(patch.blocker);
  }

  const coverageLink = next.coverageLinks.find(
    (link) => link.itemId === finding.auditedAreaId,
  );
  if (!coverageLink) {
    throw new Error(
      `Missing coverage link for audited area: ${finding.auditedAreaId}`,
    );
  }
  coverageLink.workflowIds = uniqueSorted([
    ...coverageLink.workflowIds,
    ...finding.adjacentWorkflowIds,
  ]);
  coverageLink.findingIds = [finding.id];
  coverageLink.verificationRefs = [finding.narrowestValidationId];

  for (const trace of next.workflowTraces) {
    if (!finding.workflowIds.includes(trace.id)) {
      continue;
    }
    trace.findingIds = uniqueSorted([...trace.findingIds, finding.id]);
    trace.verificationRefs = uniqueSorted([
      ...trace.verificationRefs,
      finding.narrowestValidationId,
    ]);
  }

  const result = validateFindingRegistry(next);
  if (!result.valid) {
    const details = result.issues
      .map((issue) => `${issue.path} [${issue.code}] ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid finding lifecycle transition:\n${details}`);
  }

  return next;
}

export function isComprehensiveRemediationComplete(
  dataset: FindingRegistryDataset,
): boolean {
  if (!validateFindingRegistry(dataset, { requireTerminalFindings: true }).valid) {
    return false;
  }

  return dataset.findings.every((finding) => {
    if (finding.classification === "compliant") {
      return finding.state === "compliant-with-evidence";
    }
    if (
      finding.state === "remediated-validation-pending" ||
      finding.state === "remediated-with-evidence"
    ) {
      return true;
    }
    return (
      finding.state === "blocked-with-evidence" &&
      finding.blocker?.acceptedByOwner === true
    );
  });
}

export function isFullValidationComplete(
  dataset: FindingRegistryDataset,
): boolean {
  if (!validateFindingRegistry(dataset, { requireTerminalFindings: true }).valid) {
    return false;
  }

  const validationById = new Map(
    dataset.validations.map((validation) => [validation.id, validation]),
  );
  return dataset.findings.every((finding) => {
    if (
      finding.state !== "remediated-with-evidence" &&
      finding.state !== "compliant-with-evidence"
    ) {
      return false;
    }
    const validation = validationById.get(finding.narrowestValidationId);
    return (
      validation?.state === "observed" &&
      validation.outcome === "acceptable"
    );
  });
}
