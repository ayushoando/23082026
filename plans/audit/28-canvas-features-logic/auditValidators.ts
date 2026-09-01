import {
  FINDING_TRANSITIONS,
  PLANNER_AUDIT_AUTHORED_ROOT,
  PLANNER_AUDIT_AUTHORED_TEST_ROOT,
  PLANNER_AUDIT_MACHINE_EVIDENCE_ROOT,
  WORKFLOW_STAGE_ORDER,
} from "./auditModel";
import type {
  AuditFinding,
  AuditValidationOptions,
  AuditValidationResult,
  CoverageDimensions,
  CoverageItem,
  EvidenceArtifact,
  EvidenceRecord,
  FindingState,
  PlannerAuditDataset,
  RequirementRef,
  ValidationIssue,
  ValidationIssueCode,
  ValidationRecord,
} from "./auditModel";

const REQUIREMENT_REF_PATTERN = /^(?:[1-9]|1[0-9])\.[1-9][0-9]*$/;
const WINDOWS_ABSOLUTE_PATH_PATTERN = /^[a-zA-Z]:[\\/]/;

export function isRequirementRef(value: string): value is RequirementRef {
  return REQUIREMENT_REF_PATTERN.test(value);
}

export function isFindingTransitionAllowed(
  from: FindingState,
  to: FindingState,
): boolean {
  return FINDING_TRANSITIONS[from].includes(to);
}

function addIssue(
  issues: ValidationIssue[],
  code: ValidationIssueCode,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

function requireText(
  value: string,
  path: string,
  issues: ValidationIssue[],
): void {
  if (value.trim().length === 0) {
    addIssue(issues, "empty-value", path, "Value must not be empty.");
  }
}

function validateUniqueValues(
  values: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    requireText(value, `${path}[${index}]`, issues);
    if (seen.has(value)) {
      addIssue(
        issues,
        "duplicate-ref",
        `${path}[${index}]`,
        `Duplicate reference: ${value}`,
      );
    }
    seen.add(value);
  });
}

function validateRequirementRefs(
  values: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  validateUniqueValues(values, path, issues);
  values.forEach((value, index) => {
    if (!isRequirementRef(value)) {
      addIssue(
        issues,
        "invalid-requirement-ref",
        `${path}[${index}]`,
        `Requirement reference must use an existing requirement number and acceptance-criterion number: ${value}`,
      );
    }
  });
}

function validateReferences(
  values: readonly string[],
  validValues: ReadonlySet<string>,
  path: string,
  issues: ValidationIssue[],
): void {
  validateUniqueValues(values, path, issues);
  values.forEach((value, index) => {
    if (!validValues.has(value)) {
      addIssue(
        issues,
        "invalid-reference",
        `${path}[${index}]`,
        `Unknown reference: ${value}`,
      );
    }
  });
}

function validateCollectionIds(
  records: ReadonlyArray<{ id: string }>,
  path: string,
  issues: ValidationIssue[],
): Set<string> {
  const ids = new Set<string>();
  records.forEach((record, index) => {
    requireText(record.id, `${path}[${index}].id`, issues);
    if (ids.has(record.id)) {
      addIssue(
        issues,
        "duplicate-id",
        `${path}[${index}].id`,
        `Duplicate id: ${record.id}`,
      );
    }
    ids.add(record.id);
  });
  return ids;
}

function requireNonEmptyReferences(
  values: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  if (values.length === 0) {
    addIssue(
      issues,
      "missing-link",
      path,
      "At least one reference is required.",
    );
  }
}

function validateDimensions(
  dimensions: CoverageDimensions,
  path: string,
  issues: ValidationIssue[],
): void {
  const entries: Array<[keyof CoverageDimensions, readonly string[]]> = [
    ["viewportClasses", dimensions.viewportClasses],
    ["inputMethods", dimensions.inputMethods],
    ["stateIds", dimensions.stateIds],
    ["securityControlIds", dimensions.securityControlIds],
    ["persistenceModes", dimensions.persistenceModes],
  ];

  entries.forEach(([key, values]) => {
    requireNonEmptyReferences(values, `${path}.${key}`, issues);
    validateUniqueValues(values, `${path}.${key}`, issues);
  });
}

function isSafeRelativeAuditPath(path: string): boolean {
  return (
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.startsWith("./") &&
    !path.includes("\\") &&
    !WINDOWS_ABSOLUTE_PATH_PATTERN.test(path) &&
    !path.split("/").includes("..")
  );
}

function validateEvidenceArtifact(
  artifact: EvidenceArtifact,
  path: string,
  issues: ValidationIssue[],
): void {
  // Authored artifacts live under the plan folder; the plan-owned property
  // and example tests live under tests/unit/planner/ (see auditModel.ts).
  const allowedRoots =
    artifact.authorship === "authored"
      ? [PLANNER_AUDIT_AUTHORED_ROOT, PLANNER_AUDIT_AUTHORED_TEST_ROOT]
      : [PLANNER_AUDIT_MACHINE_EVIDENCE_ROOT];

  const inAllowedRoot = allowedRoots.some(
    (root) =>
      artifact.path.startsWith(root) &&
      artifact.path !== root &&
      !artifact.path.startsWith("site/"),
  );

  if (!isSafeRelativeAuditPath(artifact.path) || !inAllowedRoot) {
    addIssue(
      issues,
      "invalid-artifact-path",
      `${path}.path`,
      `${artifact.authorship} artifacts must be non-root files under ${allowedRoots.join(" or ")}`,
    );
  }
}

function validateEvidenceRecords(
  records: readonly EvidenceRecord[],
  path: string,
  issues: ValidationIssue[],
): void {
  records.forEach((record, index) => {
    const recordPath = `${path}[${index}]`;
    requireText(record.summary, `${recordPath}.summary`, issues);
    requireText(record.limitation, `${recordPath}.limitation`, issues);
    requireNonEmptyReferences(record.sourceRefs, `${recordPath}.sourceRefs`, issues);
    validateUniqueValues(record.sourceRefs, `${recordPath}.sourceRefs`, issues);
    if (record.artifact) {
      validateEvidenceArtifact(record.artifact, `${recordPath}.artifact`, issues);
    }
  });
}

function validateCoverageItems(
  items: readonly CoverageItem[],
  evidenceIds: ReadonlySet<string>,
  issues: ValidationIssue[],
): void {
  const itemPathKeys = new Set<string>();
  const itemIds = new Set(items.map((item) => item.id));

  items.forEach((item, index) => {
    const path = `coverageItems[${index}]`;
    requireText(item.path, `${path}.path`, issues);
    const pathKey = `${item.kind}:${item.path}`;
    if (itemPathKeys.has(pathKey)) {
      addIssue(
        issues,
        "duplicate-path",
        `${path}.path`,
        `Duplicate ${item.kind} path: ${item.path}`,
      );
    }
    itemPathKeys.add(pathKey);

    requireNonEmptyReferences(item.evidenceRefs, `${path}.evidenceRefs`, issues);
    validateReferences(
      item.evidenceRefs,
      evidenceIds,
      `${path}.evidenceRefs`,
      issues,
    );

    if (item.status !== "wired") {
      requireText(item.statusNote ?? "", `${path}.statusNote`, issues);
    }

    switch (item.kind) {
      case "route":
        requireText(item.routePath, `${path}.routePath`, issues);
        if (!item.routePath.startsWith("/")) {
          addIssue(
            issues,
            "empty-value",
            `${path}.routePath`,
            "Route paths must start with a slash.",
          );
        }
        break;
      case "api":
        requireText(item.endpointPath, `${path}.endpointPath`, issues);
        requireNonEmptyReferences(item.methods, `${path}.methods`, issues);
        validateUniqueValues(item.methods, `${path}.methods`, issues);
        item.methods.forEach((method, methodIndex) => {
          if (method !== method.toUpperCase()) {
            addIssue(
              issues,
              "empty-value",
              `${path}.methods[${methodIndex}]`,
              "API methods must be uppercase.",
            );
          }
        });
        break;
      case "planner-source":
        break;
      case "reachable-shared-source":
        requireNonEmptyReferences(
          item.reachableFromIds,
          `${path}.reachableFromIds`,
          issues,
        );
        validateReferences(
          item.reachableFromIds,
          itemIds,
          `${path}.reachableFromIds`,
          issues,
        );
        break;
      case "focss":
        if (!item.path.startsWith("site/focss/planner/")) {
          addIssue(
            issues,
            "invalid-reference",
            `${path}.path`,
            "Planner FOCSS coverage must remain under site/focss/planner/.",
          );
        }
        break;
      case "test":
        requireNonEmptyReferences(
          item.coversItemIds,
          `${path}.coversItemIds`,
          issues,
        );
        validateReferences(
          item.coversItemIds,
          itemIds,
          `${path}.coversItemIds`,
          issues,
        );
        break;
    }
  });
}

function validateWorkflowTraces(
  dataset: PlannerAuditDataset,
  routeIds: ReadonlySet<string>,
  evidenceIds: ReadonlySet<string>,
  validationIds: ReadonlySet<string>,
  findingIds: ReadonlySet<string>,
  issues: ValidationIssue[],
): void {
  dataset.workflowTraces.forEach((trace, traceIndex) => {
    const path = `workflowTraces[${traceIndex}]`;
    requireText(trace.name, `${path}.name`, issues);
    requireNonEmptyReferences(trace.routeIds, `${path}.routeIds`, issues);
    validateReferences(trace.routeIds, routeIds, `${path}.routeIds`, issues);
    requireNonEmptyReferences(
      trace.requirementRefs,
      `${path}.requirementRefs`,
      issues,
    );
    validateRequirementRefs(
      trace.requirementRefs,
      `${path}.requirementRefs`,
      issues,
    );
    requireNonEmptyReferences(trace.findingIds, `${path}.findingIds`, issues);
    validateReferences(
      trace.findingIds,
      findingIds,
      `${path}.findingIds`,
      issues,
    );
    requireNonEmptyReferences(
      trace.verificationRefs,
      `${path}.verificationRefs`,
      issues,
    );
    validateReferences(
      trace.verificationRefs,
      validationIds,
      `${path}.verificationRefs`,
      issues,
    );
    requireNonEmptyReferences(trace.evidenceRefs, `${path}.evidenceRefs`, issues);
    validateReferences(
      trace.evidenceRefs,
      evidenceIds,
      `${path}.evidenceRefs`,
      issues,
    );
    validateDimensions(trace.coverage, `${path}.coverage`, issues);
    validateUniqueValues(
      trace.stages.map((stage) => stage.id),
      `${path}.stages.*.id`,
      issues,
    );

    if (trace.stages.length !== WORKFLOW_STAGE_ORDER.length) {
      addIssue(
        issues,
        "incomplete-workflow",
        `${path}.stages`,
        `Workflow must contain all ${WORKFLOW_STAGE_ORDER.length} required stages.`,
      );
    }

    WORKFLOW_STAGE_ORDER.forEach((expectedKind, stageIndex) => {
      const stage = trace.stages[stageIndex];
      if (!stage || stage.kind !== expectedKind) {
        addIssue(
          issues,
          "incomplete-workflow",
          `${path}.stages[${stageIndex}]`,
          `Expected workflow stage ${expectedKind} at index ${stageIndex}.`,
        );
        return;
      }
      requireText(stage.id, `${path}.stages[${stageIndex}].id`, issues);
      requireText(
        stage.sourcePath,
        `${path}.stages[${stageIndex}].sourcePath`,
        issues,
      );
      requireText(
        stage.summary,
        `${path}.stages[${stageIndex}].summary`,
        issues,
      );
      requireNonEmptyReferences(
        stage.evidenceRefs,
        `${path}.stages[${stageIndex}].evidenceRefs`,
        issues,
      );
      validateReferences(
        stage.evidenceRefs,
        evidenceIds,
        `${path}.stages[${stageIndex}].evidenceRefs`,
        issues,
      );
    });
  });
}

function validateCoverageLinks(
  dataset: PlannerAuditDataset,
  itemIds: ReadonlySet<string>,
  routeIds: ReadonlySet<string>,
  workflowIds: ReadonlySet<string>,
  evidenceIds: ReadonlySet<string>,
  validationIds: ReadonlySet<string>,
  findingIds: ReadonlySet<string>,
  issues: ValidationIssue[],
): void {
  const linkedItemIds = new Set<string>();
  const linkedWorkflowIds = new Set<string>();
  dataset.coverageLinks.forEach((link, index) => {
    const path = `coverageLinks[${index}]`;
    if (linkedItemIds.has(link.itemId)) {
      addIssue(
        issues,
        "duplicate-id",
        `${path}.itemId`,
        `Coverage item has more than one normalized link: ${link.itemId}`,
      );
    }
    linkedItemIds.add(link.itemId);
    validateReferences([link.itemId], itemIds, `${path}.itemId`, issues);

    requireNonEmptyReferences(link.routeIds, `${path}.routeIds`, issues);
    validateReferences(link.routeIds, routeIds, `${path}.routeIds`, issues);
    if (routeIds.has(link.itemId) && !link.routeIds.includes(link.itemId)) {
      addIssue(
        issues,
        "missing-link",
        `${path}.routeIds`,
        `Route coverage must link its own route id: ${link.itemId}`,
      );
    }
    requireNonEmptyReferences(link.workflowIds, `${path}.workflowIds`, issues);
    validateReferences(
      link.workflowIds,
      workflowIds,
      `${path}.workflowIds`,
      issues,
    );
    link.workflowIds.forEach((workflowId) => linkedWorkflowIds.add(workflowId));
    requireNonEmptyReferences(
      link.requirementRefs,
      `${path}.requirementRefs`,
      issues,
    );
    validateRequirementRefs(
      link.requirementRefs,
      `${path}.requirementRefs`,
      issues,
    );
    requireNonEmptyReferences(link.findingIds, `${path}.findingIds`, issues);
    validateReferences(link.findingIds, findingIds, `${path}.findingIds`, issues);
    requireNonEmptyReferences(
      link.verificationRefs,
      `${path}.verificationRefs`,
      issues,
    );
    validateReferences(
      link.verificationRefs,
      validationIds,
      `${path}.verificationRefs`,
      issues,
    );
    requireNonEmptyReferences(link.evidenceRefs, `${path}.evidenceRefs`, issues);
    validateReferences(
      link.evidenceRefs,
      evidenceIds,
      `${path}.evidenceRefs`,
      issues,
    );
    validateDimensions(link, path, issues);
  });

  dataset.coverageItems.forEach((item, index) => {
    if (!linkedItemIds.has(item.id)) {
      addIssue(
        issues,
        "missing-link",
        `coverageItems[${index}].id`,
        `Coverage item is absent from the normalized matrix: ${item.id}`,
      );
    }
  });
  dataset.workflowTraces.forEach((workflow, index) => {
    if (!linkedWorkflowIds.has(workflow.id)) {
      addIssue(
        issues,
        "missing-link",
        `workflowTraces[${index}].id`,
        `Workflow is absent from the normalized matrix: ${workflow.id}`,
      );
    }
  });
}

function validateValidationRecord(
  record: ValidationRecord,
  index: number,
  findingIds: ReadonlySet<string>,
  evidence: ReadonlyMap<string, EvidenceRecord>,
  issues: ValidationIssue[],
): void {
  const path = `validations[${index}]`;
  requireText(record.verifies, `${path}.verifies`, issues);
  requireText(record.limitation, `${path}.limitation`, issues);
  requireNonEmptyReferences(record.findingIds, `${path}.findingIds`, issues);
  validateReferences(record.findingIds, findingIds, `${path}.findingIds`, issues);
  requireNonEmptyReferences(
    record.requirementRefs,
    `${path}.requirementRefs`,
    issues,
  );
  validateRequirementRefs(
    record.requirementRefs,
    `${path}.requirementRefs`,
    issues,
  );

  if (record.exactCommand?.includes("typecheck:scripts")) {
    addIssue(
      issues,
      "invalid-validation-state",
      `${path}.exactCommand`,
      "The unavailable typecheck:scripts command must not appear in a validation plan.",
    );
  }

  if (record.state === "pending") {
    const hasCommand = Boolean(record.exactCommand?.trim());
    const hasOwnerAction = Boolean(record.pendingOwnerAction?.trim());
    if (hasCommand === hasOwnerAction) {
      addIssue(
        issues,
        "invalid-validation-state",
        path,
        "Pending validation must define exactly one exact command or owner action.",
      );
    }
    if (
      record.exitStatus !== null ||
      record.outcome !== null ||
      record.evidenceRefs.length > 0
    ) {
      addIssue(
        issues,
        "invalid-validation-state",
        path,
        "Unexecuted validation cannot claim an exit status, outcome, or evidence.",
      );
    }
    return;
  }

  requireText(record.exactCommand, `${path}.exactCommand`, issues);
  if (
    record.userAuthorization !== "authorized" ||
    record.hookPermission !== "permitted"
  ) {
    addIssue(
      issues,
      "invalid-validation-state",
      path,
      "Observed validation requires exact user authorization and hook permission.",
    );
  }
  requireNonEmptyReferences(record.evidenceRefs, `${path}.evidenceRefs`, issues);
  record.evidenceRefs.forEach((evidenceId, evidenceIndex) => {
    const evidenceRecord = evidence.get(evidenceId);
    if (!evidenceRecord) {
      addIssue(
        issues,
        "invalid-reference",
        `${path}.evidenceRefs[${evidenceIndex}]`,
        `Unknown reference: ${evidenceId}`,
      );
      return;
    }
    if (evidenceRecord.class !== record.target) {
      addIssue(
        issues,
        "invalid-validation-state",
        `${path}.evidenceRefs[${evidenceIndex}]`,
        `Validation target ${record.target} cannot claim ${evidenceRecord.class} evidence.`,
      );
    }
  });
}

function requireFindingEvidence(
  finding: AuditFinding,
  path: string,
  issues: ValidationIssue[],
): void {
  requireText(finding.expected, `${path}.expected`, issues);
  requireText(finding.observed, `${path}.observed`, issues);
  requireNonEmptyReferences(
    finding.reproductionEvidenceRefs,
    `${path}.reproductionEvidenceRefs`,
    issues,
  );
}

function validateFindingState(
  finding: AuditFinding,
  path: string,
  issues: ValidationIssue[],
): void {
  if (finding.state !== "candidate") {
    requireFindingEvidence(finding, path, issues);
  }

  switch (finding.state) {
    case "candidate":
    case "verified":
    case "remediation-approved":
      break;
    case "remediated-validation-pending":
      requireNonEmptyReferences(
        finding.remediationPaths,
        `${path}.remediationPaths`,
        issues,
      );
      break;
    case "remediated-with-evidence":
      requireNonEmptyReferences(
        finding.remediationPaths,
        `${path}.remediationPaths`,
        issues,
      );
      requireNonEmptyReferences(
        finding.completionEvidenceRefs,
        `${path}.completionEvidenceRefs`,
        issues,
      );
      break;
    case "blocked-with-evidence":
      if (!finding.blocker) {
        addIssue(
          issues,
          "invalid-finding-state",
          `${path}.blocker`,
          "Blocked findings require blocker evidence and an owner decision.",
        );
      } else {
        requireNonEmptyReferences(
          finding.blocker.evidenceRefs,
          `${path}.blocker.evidenceRefs`,
          issues,
        );
        requireText(
          finding.blocker.ownerDecision,
          `${path}.blocker.ownerDecision`,
          issues,
        );
      }
      break;
    case "compliant-with-evidence":
      requireNonEmptyReferences(
        finding.completionEvidenceRefs,
        `${path}.completionEvidenceRefs`,
        issues,
      );
      break;
  }
}

function validateFindings(
  dataset: PlannerAuditDataset,
  routeIds: ReadonlySet<string>,
  workflowIds: ReadonlySet<string>,
  evidenceIds: ReadonlySet<string>,
  validationIds: ReadonlySet<string>,
  issues: ValidationIssue[],
): void {
  dataset.findings.forEach((finding, index) => {
    const path = `findings[${index}]`;
    requireText(finding.title, `${path}.title`, issues);
    requireNonEmptyReferences(finding.routeIds, `${path}.routeIds`, issues);
    validateReferences(finding.routeIds, routeIds, `${path}.routeIds`, issues);
    requireNonEmptyReferences(finding.workflowIds, `${path}.workflowIds`, issues);
    validateReferences(
      finding.workflowIds,
      workflowIds,
      `${path}.workflowIds`,
      issues,
    );
    validateReferences(
      finding.adjacentWorkflowIds,
      workflowIds,
      `${path}.adjacentWorkflowIds`,
      issues,
    );
    requireNonEmptyReferences(finding.sourcePaths, `${path}.sourcePaths`, issues);
    validateUniqueValues(finding.sourcePaths, `${path}.sourcePaths`, issues);
    requireNonEmptyReferences(
      finding.requirementRefs,
      `${path}.requirementRefs`,
      issues,
    );
    validateRequirementRefs(
      finding.requirementRefs,
      `${path}.requirementRefs`,
      issues,
    );
    validateReferences(
      finding.reproductionEvidenceRefs,
      evidenceIds,
      `${path}.reproductionEvidenceRefs`,
      issues,
    );
    validateReferences(
      finding.completionEvidenceRefs,
      evidenceIds,
      `${path}.completionEvidenceRefs`,
      issues,
    );
    requireNonEmptyReferences(
      finding.affectedScope,
      `${path}.affectedScope`,
      issues,
    );
    validateUniqueValues(finding.affectedScope, `${path}.affectedScope`, issues);
    validateUniqueValues(
      finding.remediationPaths,
      `${path}.remediationPaths`,
      issues,
    );
    requireNonEmptyReferences(
      finding.validationIds,
      `${path}.validationIds`,
      issues,
    );
    validateReferences(
      finding.validationIds,
      validationIds,
      `${path}.validationIds`,
      issues,
    );
    if (finding.blocker) {
      validateReferences(
        finding.blocker.evidenceRefs,
        evidenceIds,
        `${path}.blocker.evidenceRefs`,
        issues,
      );
    }
    validateFindingState(finding, path, issues);
  });
}

function validateRequiredRequirementCoverage(
  dataset: PlannerAuditDataset,
  options: AuditValidationOptions,
  issues: ValidationIssue[],
): void {
  const coveredRequirements = new Set(
    dataset.coverageLinks.flatMap((link) => link.requirementRefs),
  );
  const requiredRequirements = options.requiredRequirementRefs ?? [];
  validateRequirementRefs(
    requiredRequirements,
    "options.requiredRequirementRefs",
    issues,
  );
  requiredRequirements.forEach((requirementRef, index) => {
    if (!coveredRequirements.has(requirementRef)) {
      addIssue(
        issues,
        "orphan-requirement",
        `options.requiredRequirementRefs[${index}]`,
        `Required requirement has no coverage-matrix link: ${requirementRef}`,
      );
    }
  });
}

export function validateAuditDataset(
  dataset: PlannerAuditDataset,
  options: AuditValidationOptions = {},
): AuditValidationResult {
  const issues: ValidationIssue[] = [];
  const itemIds = validateCollectionIds(
    dataset.coverageItems,
    "coverageItems",
    issues,
  );
  const workflowIds = validateCollectionIds(
    dataset.workflowTraces,
    "workflowTraces",
    issues,
  );
  const evidenceIds = validateCollectionIds(
    dataset.evidence,
    "evidence",
    issues,
  );
  const validationIds = validateCollectionIds(
    dataset.validations,
    "validations",
    issues,
  );
  const findingIds = validateCollectionIds(dataset.findings, "findings", issues);
  const routeIds = new Set(
    dataset.coverageItems
      .filter((item) => item.kind === "route")
      .map((item) => item.id),
  );
  const evidenceById = new Map(
    dataset.evidence.map((record) => [record.id, record]),
  );

  validateEvidenceRecords(dataset.evidence, "evidence", issues);
  validateCoverageItems(dataset.coverageItems, evidenceIds, issues);
  validateWorkflowTraces(
    dataset,
    routeIds,
    evidenceIds,
    validationIds,
    findingIds,
    issues,
  );
  dataset.validations.forEach((record, index) =>
    validateValidationRecord(
      record,
      index,
      findingIds,
      evidenceById,
      issues,
    ),
  );
  validateFindings(
    dataset,
    routeIds,
    workflowIds,
    evidenceIds,
    validationIds,
    issues,
  );
  validateCoverageLinks(
    dataset,
    itemIds,
    routeIds,
    workflowIds,
    evidenceIds,
    validationIds,
    findingIds,
    issues,
  );
  validateRequiredRequirementCoverage(dataset, options, issues);

  issues.sort((left, right) =>
    `${left.path}\u0000${left.code}\u0000${left.message}`.localeCompare(
      `${right.path}\u0000${right.code}\u0000${right.message}`,
    ),
  );

  return { valid: issues.length === 0, issues };
}
