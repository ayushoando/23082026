import { z } from "zod";

export const AUDIT_SCHEMA_VERSION = "1.0.0";

const DiagnosticCode = {
  blockedRecordRequiresBlocker: "AUDIT_SCHEMA_BLOCKER_REQUIRED",
  deniedAuthorizationRequiresBlockedResult:
    "AUDIT_SCHEMA_DENIED_AUTHORIZATION_REQUIRES_BLOCKED_RESULT",
  invalidField: "AUDIT_SCHEMA_INVALID_FIELD",
  notApplicableRequiresRationale:
    "AUDIT_SCHEMA_NOT_APPLICABLE_RATIONALE_REQUIRED",
  partitionContainsQuarantine: "AUDIT_SCHEMA_PARTITION_CONTAINS_QUARANTINE",
  partitionContainsPendingRows: "AUDIT_SCHEMA_PARTITION_CONTAINS_PENDING_ROWS",
  runtimeAuthorizationRequired: "AUDIT_SCHEMA_RUNTIME_AUTHORIZATION_REQUIRED",
  runtimeClaimRequiresProtectedLane:
    "AUDIT_SCHEMA_RUNTIME_CLAIM_REQUIRES_PROTECTED_LANE",
  runtimeOccurrenceNotAuthorized:
    "AUDIT_SCHEMA_RUNTIME_OCCURRENCE_NOT_AUTHORIZED",
  staticClaimRequiresStaticLane: "AUDIT_SCHEMA_STATIC_CLAIM_REQUIRES_STATIC_LANE",
  unknownRecordType: "AUDIT_SCHEMA_UNKNOWN_RECORD_TYPE",
} as const;

export type AuditSchemaDiagnosticCode =
  (typeof DiagnosticCode)[keyof typeof DiagnosticCode];

const NonEmptyStringSchema = z.string().trim().min(1);
const StringListSchema = z.array(NonEmptyStringSchema).min(1);
const OptionalStringListSchema = z.array(NonEmptyStringSchema);
const IsoTimestampSchema = z.string().refine(
  (value) => Number.isFinite(Date.parse(value)),
  { message: "AUDIT_SCHEMA_INVALID_TIMESTAMP" },
);
const SchemaVersionSchema = z.literal(AUDIT_SCHEMA_VERSION);

const ProductSurfaceSchema = z.enum([
  "marketing",
  "catalog-configurator",
  "portal-dashboard",
  "authentication",
  "legal",
  "administration",
  "planner",
  "studio",
  "offline",
  "shared-shell",
]);

const ResultClassificationSchema = z.enum([
  "conforming",
  "nonconforming",
  "blocked",
  "not-run",
  "not-applicable",
  "requires-owner-decision",
]);

const SeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "advisory",
]);

const EvidenceLaneSchema = z.enum(["static-inspection", "protected-runtime"]);
const ClaimBasisSchema = z.enum([
  "source-observed",
  "source-inferred-expectation",
  "runtime-observed",
]);

const RecordEnvelopeShape = {
  schemaVersion: SchemaVersionSchema,
  recordId: NonEmptyStringSchema,
  createdAt: IsoTimestampSchema,
};

export const ProvenanceReferenceSchema = z
  .object({
    sourceId: NonEmptyStringSchema,
    sourceKind: z.enum([
      "source",
      "repository-data",
      "contract",
      "internal-link",
      "tool",
      "runtime",
      "human-review",
    ]),
    location: NonEmptyStringSchema,
    discoveredAt: IsoTimestampSchema,
    contentHash: NonEmptyStringSchema.optional(),
    authorityRank: z.number().int().min(0),
  })
  .strict();

export type ProvenanceReference = z.infer<typeof ProvenanceReferenceSchema>;

const ProvenanceListSchema = z.array(ProvenanceReferenceSchema).min(1);

export const BlockerDetailSchema = z
  .object({
    blockerKind: z.enum([
      "authorization",
      "hook-denial",
      "permission",
      "fixture",
      "credential",
      "environment",
      "command",
      "owner-decision",
      "source-unavailable",
    ]),
    detail: NonEmptyStringSchema,
    pendingOperation: NonEmptyStringSchema,
    owner: NonEmptyStringSchema.optional(),
  })
  .strict();

export type BlockerDetail = z.infer<typeof BlockerDetailSchema>;

function addConditionalResultIssues(
  resultClassification: z.infer<typeof ResultClassificationSchema>,
  blockers: readonly BlockerDetail[] | undefined,
  notApplicableRationale: string | undefined,
  context: z.RefinementCtx,
): void {
  if (
    (resultClassification === "blocked" || resultClassification === "not-run") &&
    (!blockers || blockers.length === 0)
  ) {
    context.addIssue({
      code: "custom",
      path: ["blockers"],
      message: DiagnosticCode.blockedRecordRequiresBlocker,
    });
  }

  if (
    resultClassification === "not-applicable" &&
    (!notApplicableRationale || !notApplicableRationale.trim())
  ) {
    context.addIssue({
      code: "custom",
      path: ["notApplicableRationale"],
      message: DiagnosticCode.notApplicableRequiresRationale,
    });
  }
}

export const AuthorizationEvidenceSchema = z
  .object({
    operationId: NonEmptyStringSchema,
    exactOperation: NonEmptyStringSchema,
    authorizationStatement: NonEmptyStringSchema,
    authorizedInCurrentSession: z.boolean(),
    repositoryRoot: NonEmptyStringSchema,
    hookName: NonEmptyStringSchema,
    hookDecision: z.enum(["permit", "deny", "not-observed"]),
    requestedAt: IsoTimestampSchema,
    executedAt: IsoTimestampSchema.optional(),
    exitStatus: z.number().int().optional(),
    targetEnvironment: NonEmptyStringSchema,
    affectedOccurrenceIds: StringListSchema,
    credentialOrFixtureNeeds: OptionalStringListSchema,
    outputLocations: OptionalStringListSchema,
    limitations: StringListSchema,
  })
  .strict()
  .superRefine((authorization, context) => {
    if (authorization.hookDecision === "deny") {
      if (authorization.executedAt !== undefined || authorization.exitStatus !== undefined) {
        context.addIssue({
          code: "custom",
          path: ["executedAt"],
          message: "AUDIT_SCHEMA_DENIED_AUTHORIZATION_MUST_REMAIN_UNEXECUTED",
        });
      }
    }

    if (authorization.executedAt !== undefined && authorization.hookDecision !== "permit") {
      context.addIssue({
        code: "custom",
        path: ["hookDecision"],
        message: "AUDIT_SCHEMA_EXECUTED_OPERATION_REQUIRES_PERMITTING_HOOK",
      });
    }
  });

export type AuthorizationEvidence = z.infer<typeof AuthorizationEvidenceSchema>;

function supportsRuntimeClaim(
  authorization: AuthorizationEvidence | undefined,
  occurrenceId: string,
): boolean {
  return Boolean(
    authorization &&
      authorization.authorizedInCurrentSession &&
      authorization.hookDecision === "permit" &&
      authorization.executedAt &&
      authorization.affectedOccurrenceIds.includes(occurrenceId),
  );
}

export const ProvenanceRecordSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("provenance"),
    provenance: ProvenanceReferenceSchema,
  })
  .strict();

const SourceRegistryEntrySchema = z
  .object({
    sourceId: NonEmptyStringSchema,
    label: NonEmptyStringSchema,
    sourceKind: ProvenanceReferenceSchema.shape.sourceKind,
    authorityRank: z.number().int().min(0),
    scope: StringListSchema,
    adapterId: NonEmptyStringSchema.optional(),
    authorizationClass: z.enum(["static-inspection", "protected-runtime"]),
    provenance: ProvenanceListSchema,
  })
  .strict();

export const SourceRegistrySchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("source-registry"),
    registryId: NonEmptyStringSchema,
    sources: z.array(SourceRegistryEntrySchema).min(1),
  })
  .strict();

const ToolRegistryEntrySchema = z
  .object({
    toolId: NonEmptyStringSchema,
    label: NonEmptyStringSchema,
    scope: StringListSchema,
    inputs: StringListSchema,
    outputs: StringListSchema,
    supportedProfileIds: OptionalStringListSchema,
    knownOmissions: StringListSchema,
    authorizationClass: z.enum([
      "static-inspection",
      "protected-runtime",
      "not-run-pending-authorization",
    ]),
    lastObservedExecutionState: z.enum([
      "never-run",
      "static-output-only",
      "authorized-output-recorded",
      "blocked",
      "not-run",
    ]),
    residualWork: StringListSchema,
    adapterSchema: NonEmptyStringSchema,
    provenance: ProvenanceListSchema,
  })
  .strict();

export const ToolRegistrySchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("tool-registry"),
    registryId: NonEmptyStringSchema,
    tools: z.array(ToolRegistryEntrySchema).min(1),
  })
  .strict();

const AdapterCandidateKindSchema = z.enum([
  "route",
  "dynamic-route",
  "dynamic-instance",
  "shared-shell",
  "specialized-inventory",
  "internal-link",
  "metadata",
  "sitemap-entry",
  "generated-inventory",
  "tool-observation",
]);

export const AdapterCandidateRecordSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("adapter-candidate"),
    candidateId: NonEmptyStringSchema,
    adapterId: NonEmptyStringSchema,
    sourceId: NonEmptyStringSchema,
    toolId: NonEmptyStringSchema.optional(),
    candidateKind: AdapterCandidateKindSchema,
    subjectKey: NonEmptyStringSchema,
    claimedFields: StringListSchema,
    payload: z.record(z.string(), z.unknown()),
    provenance: ProvenanceListSchema,
    isSampled: z.boolean(),
    canCloseCoverage: z.literal(false),
  })
  .strict();

export const AdapterGapRecordSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("adapter-gap"),
    gapId: NonEmptyStringSchema,
    adapterId: NonEmptyStringSchema,
    sourceId: NonEmptyStringSchema,
    toolId: NonEmptyStringSchema.optional(),
    subjectKeys: StringListSchema,
    gapKind: z.enum([
      "unsupported-field",
      "unsupported-profile",
      "partial-output",
      "unavailable-input",
      "sampled-scope",
      "authorization-required",
    ]),
    unsupportedFields: OptionalStringListSchema,
    missingPrerequisite: NonEmptyStringSchema,
    proposedResolution: NonEmptyStringSchema,
    status: z.literal("open"),
    provenance: ProvenanceListSchema,
  })
  .strict()
  .superRefine((gap, context) => {
    if (gap.gapKind === "unsupported-field" && gap.unsupportedFields.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["unsupportedFields"],
        message: "AUDIT_SCHEMA_UNSUPPORTED_FIELD_GAP_REQUIRES_FIELDS",
      });
    }
  });

const AuthorityConflictClaimSchema = z
  .object({
    candidateId: NonEmptyStringSchema,
    sourceId: NonEmptyStringSchema,
    authorityRank: z.number().int().min(0),
    valueFingerprint: NonEmptyStringSchema,
    provenance: ProvenanceListSchema,
  })
  .strict();

export const AuthorityConflictRecordSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("authority-conflict"),
    conflictId: NonEmptyStringSchema,
    subjectKey: NonEmptyStringSchema,
    claimField: NonEmptyStringSchema,
    claims: z.array(AuthorityConflictClaimSchema).min(2),
    resolution: z.enum([
      "higher-authority-selected",
      "requires-owner-decision",
    ]),
    selectedCandidateId: NonEmptyStringSchema.optional(),
    selectedSourceId: NonEmptyStringSchema.optional(),
    selectedAuthorityRank: z.number().int().min(0).optional(),
    provenance: ProvenanceListSchema,
  })
  .strict()
  .superRefine((conflict, context) => {
    if (
      conflict.resolution === "higher-authority-selected" &&
      (!conflict.selectedCandidateId ||
        !conflict.selectedSourceId ||
        conflict.selectedAuthorityRank === undefined)
    ) {
      context.addIssue({
        code: "custom",
        path: ["selectedCandidateId"],
        message: "AUDIT_SCHEMA_AUTHORITY_CONFLICT_REQUIRES_SELECTED_CLAIM",
      });
    }
  });

export const CanonicalRouteRecordSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("route"),
    routeId: NonEmptyStringSchema,
    pattern: NonEmptyStringSchema,
    concreteUrl: NonEmptyStringSchema.optional(),
    routeKind: z.enum(["static", "dynamic", "dynamic-instance"]),
    productSurface: ProductSurfaceSchema,
    status: z.enum([
      "active",
      "redirected",
      "absent",
      "legacy",
      "local-only",
      "protected",
      "unreachable",
    ]),
    sourcePath: NonEmptyStringSchema,
    provenance: ProvenanceListSchema,
    conflictIds: OptionalStringListSchema,
    exclusionId: NonEmptyStringSchema.optional(),
    coverageGapIds: OptionalStringListSchema,
  })
  .strict();

export const DynamicInstanceRecordSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("dynamic-instance"),
    instanceId: NonEmptyStringSchema,
    routeId: NonEmptyStringSchema,
    concreteUrl: NonEmptyStringSchema,
    normalizedUrl: NonEmptyStringSchema,
    parameterValues: z.record(z.string(), NonEmptyStringSchema),
    discoverySources: ProvenanceListSchema,
    discoveredAt: IsoTimestampSchema,
    productSurface: ProductSurfaceSchema,
    status: z.enum(["active", "protected", "unreachable", "gapped"]),
    coverageGapIds: OptionalStringListSchema,
  })
  .strict();

export const SharedShellRecordSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("shared-shell"),
    shellId: NonEmptyStringSchema,
    role: z.enum([
      "layout",
      "header",
      "footer",
      "banner",
      "dialog",
      "consent",
      "error-boundary",
      "loading-boundary",
      "not-found-boundary",
      "provider-output",
      "offline-shell",
    ]),
    productSurface: ProductSurfaceSchema,
    sourcePath: NonEmptyStringSchema,
    visibleOutput: z.literal(true),
    routeIds: OptionalStringListSchema,
    provenance: ProvenanceListSchema,
    status: z.enum(["active", "legacy", "local-only", "unreachable"]),
  })
  .strict();

const OccurrenceSelectorSchema = z
  .object({
    subjectIds: OptionalStringListSchema,
    stateIds: OptionalStringListSchema,
    viewportIds: OptionalStringListSchema,
    browserIds: OptionalStringListSchema,
    accessContextIds: OptionalStringListSchema,
    languageIds: OptionalStringListSchema,
  })
  .strict();

export const SpecializedInventoryRecordSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("specialized-inventory"),
    inventoryId: NonEmptyStringSchema,
    inventoryKind: z.enum([
      "state",
      "journey",
      "link",
      "form",
      "asset",
      "copy-ia",
      "seo",
      "analytics-consent",
      "security-privacy-message",
      "error-recovery",
    ]),
    owner: NonEmptyStringSchema,
    sourceLocator: NonEmptyStringSchema,
    productSurface: ProductSurfaceSchema,
    provenance: ProvenanceListSchema,
    applicableOccurrenceSelector: OccurrenceSelectorSchema,
    status: z.enum(["candidate", "canonical", "excluded", "gapped"]),
    payload: z.record(z.string(), z.unknown()),
    exclusionId: NonEmptyStringSchema.optional(),
    coverageGapIds: OptionalStringListSchema,
  })
  .strict();

const ProfileEntrySchema = z
  .object({
    profileId: NonEmptyStringSchema,
    label: NonEmptyStringSchema,
    enabled: z.boolean(),
    definition: z.record(z.string(), z.unknown()),
  })
  .strict();

export const ProfileRegistrySchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("profile-registry"),
    registryId: NonEmptyStringSchema,
    profileKind: z.enum([
      "viewport",
      "browser",
      "access-context",
      "language",
      "consent",
      "performance",
    ]),
    registryVersion: NonEmptyStringSchema,
    frozenAt: IsoTimestampSchema,
    configurationHash: NonEmptyStringSchema,
    entries: z.array(ProfileEntrySchema).min(1),
  })
  .strict();

export const ApplicabilityDecisionSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("applicability"),
    applicabilityId: NonEmptyStringSchema,
    subjectId: NonEmptyStringSchema,
    dimensionKind: z.enum([
      "state",
      "viewport",
      "browser",
      "access-context",
      "language",
      "consent",
      "performance",
      "audit-dimension",
    ]),
    dimensionId: NonEmptyStringSchema,
    status: z.enum(["applicable", "not-applicable"]),
    rationale: NonEmptyStringSchema.optional(),
    provenance: ProvenanceListSchema,
  })
  .strict()
  .superRefine((decision, context) => {
    if (decision.status === "not-applicable" && !decision.rationale?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["rationale"],
        message: DiagnosticCode.notApplicableRequiresRationale,
      });
    }
  });

export const CoverageMatrixRowSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("matrix-row"),
    occurrenceId: NonEmptyStringSchema,
    routeId: NonEmptyStringSchema.optional(),
    shellId: NonEmptyStringSchema.optional(),
    concreteUrl: NonEmptyStringSchema,
    productSurface: ProductSurfaceSchema,
    stateId: NonEmptyStringSchema,
    viewportId: NonEmptyStringSchema,
    browserId: NonEmptyStringSchema,
    accessContextId: NonEmptyStringSchema,
    languageId: z.enum(["en", "hi"]),
    applicableDimensionIds: z.array(NonEmptyStringSchema),
    waveId: NonEmptyStringSchema,
    status: z.union([z.literal("pending"), ResultClassificationSchema]),
    findingId: NonEmptyStringSchema.optional(),
    inputFingerprint: NonEmptyStringSchema,
    invalidatedAt: IsoTimestampSchema.optional(),
    blockers: z.array(BlockerDetailSchema).optional(),
    notApplicableRationale: NonEmptyStringSchema.optional(),
  })
  .strict()
  .superRefine((row, context) => {
    if (row.status !== "pending" && !row.findingId?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["findingId"],
        message: "AUDIT_SCHEMA_TERMINAL_MATRIX_ROW_REQUIRES_FINDING",
      });
    }
    if (row.status !== "pending") {
      addConditionalResultIssues(
        row.status,
        row.blockers,
        row.notApplicableRationale,
        context,
      );
    }
  });

export const HindiNoteSchema = z
  .object({
    translationRequired: z.boolean(),
    approvedHindiText: NonEmptyStringSchema.optional(),
    approvalReference: NonEmptyStringSchema.optional(),
    translationOwner: NonEmptyStringSchema,
    humanReviewRequired: z.boolean(),
    reviewNotes: NonEmptyStringSchema,
  })
  .strict()
  .superRefine((note, context) => {
    if (note.approvedHindiText && !note.approvalReference?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["approvalReference"],
        message: "AUDIT_SCHEMA_APPROVED_HINDI_REQUIRES_APPROVAL_REFERENCE",
      });
    }
    if (!note.approvedHindiText && (!note.translationRequired || !note.humanReviewRequired)) {
      context.addIssue({
        code: "custom",
        path: ["translationRequired"],
        message: "AUDIT_SCHEMA_UNAPPROVED_HINDI_REQUIRES_REVIEW_WORKFLOW",
      });
    }
  });

export const CopyProposalSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("copy-proposal"),
    proposalId: NonEmptyStringSchema,
    currentText: NonEmptyStringSchema,
    finalEnglishText: NonEmptyStringSchema,
    placement: NonEmptyStringSchema,
    intent: NonEmptyStringSchema,
    applicableState: NonEmptyStringSchema,
    preservedFacts: StringListSchema,
    hindiNote: HindiNoteSchema,
  })
  .strict();

export const SeverityAssessmentSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("severity-assessment"),
    assessmentId: NonEmptyStringSchema,
    findingId: NonEmptyStringSchema,
    severity: SeveritySchema,
    severityRationale: NonEmptyStringSchema,
    decidingDimension: NonEmptyStringSchema,
    userImpact: NonEmptyStringSchema,
    affectedAudience: NonEmptyStringSchema,
    journeyCriticality: NonEmptyStringSchema,
    dataSensitivity: NonEmptyStringSchema,
    legalOrConsentExposure: NonEmptyStringSchema,
    occurrenceCount: z.number().int().min(1),
    recoverability: NonEmptyStringSchema,
    workaroundQuality: NonEmptyStringSchema,
  })
  .strict();

const EvidenceSeveritySchema = z.union([SeveritySchema, z.literal("not-applicable")]);

export const EvidenceRecordSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("evidence"),
    evidenceId: NonEmptyStringSchema,
    findingId: NonEmptyStringSchema,
    occurrenceId: NonEmptyStringSchema,
    route: NonEmptyStringSchema,
    concreteUrl: NonEmptyStringSchema,
    productSurface: ProductSurfaceSchema,
    stateVariant: NonEmptyStringSchema,
    viewportProfile: NonEmptyStringSchema,
    browserProfile: NonEmptyStringSchema,
    accessContext: NonEmptyStringSchema,
    languageContext: z.enum(["en", "hi"]),
    auditDimension: NonEmptyStringSchema,
    expectedResult: NonEmptyStringSchema,
    observedResult: NonEmptyStringSchema,
    claimBasis: ClaimBasisSchema,
    resultClassification: ResultClassificationSchema,
    severity: EvidenceSeveritySchema,
    severityRationale: NonEmptyStringSchema,
    decidingSeverityDimension: NonEmptyStringSchema.optional(),
    userImpact: NonEmptyStringSchema,
    evidenceLane: EvidenceLaneSchema,
    evidenceType: NonEmptyStringSchema,
    sourceOrRuntimeLocation: NonEmptyStringSchema,
    capturedAt: IsoTimestampSchema,
    reproductionSteps: StringListSchema,
    evidenceReferences: StringListSchema,
    requirementIds: StringListSchema,
    journeyIds: OptionalStringListSchema,
    shellIds: OptionalStringListSchema,
    relatedFindingIds: OptionalStringListSchema,
    duplicateGroupId: NonEmptyStringSchema.optional(),
    proposedOutcome: NonEmptyStringSchema,
    copyProposalId: NonEmptyStringSchema.optional(),
    likelyOwner: NonEmptyStringSchema,
    dependencies: OptionalStringListSchema,
    authorization: AuthorizationEvidenceSchema.optional(),
    verificationMethod: NonEmptyStringSchema,
    blockers: z.array(BlockerDetailSchema).optional(),
    notApplicableRationale: NonEmptyStringSchema.optional(),
  })
  .strict()
  .superRefine((evidence, context) => {
    addConditionalResultIssues(
      evidence.resultClassification,
      evidence.blockers,
      evidence.notApplicableRationale,
      context,
    );

    if (
      evidence.resultClassification === "not-applicable" &&
      evidence.severity !== "not-applicable"
    ) {
      context.addIssue({
        code: "custom",
        path: ["severity"],
        message: "AUDIT_SCHEMA_NOT_APPLICABLE_REQUIRES_NOT_APPLICABLE_SEVERITY",
      });
    }

    if (
      evidence.resultClassification !== "not-applicable" &&
      evidence.severity === "not-applicable"
    ) {
      context.addIssue({
        code: "custom",
        path: ["severity"],
        message: "AUDIT_SCHEMA_NOT_APPLICABLE_SEVERITY_REQUIRES_NOT_APPLICABLE_RESULT",
      });
    }

    if (evidence.claimBasis === "runtime-observed") {
      if (evidence.evidenceLane !== "protected-runtime") {
        context.addIssue({
          code: "custom",
          path: ["evidenceLane"],
          message: DiagnosticCode.runtimeClaimRequiresProtectedLane,
        });
      }
      if (!supportsRuntimeClaim(evidence.authorization, evidence.occurrenceId)) {
        context.addIssue({
          code: "custom",
          path: ["authorization"],
          message: DiagnosticCode.runtimeAuthorizationRequired,
        });
      }
    } else if (evidence.evidenceLane !== "static-inspection") {
      context.addIssue({
        code: "custom",
        path: ["evidenceLane"],
        message: DiagnosticCode.staticClaimRequiresStaticLane,
      });
    }

    if (
      evidence.authorization?.hookDecision === "deny" &&
      evidence.resultClassification !== "blocked" &&
      evidence.resultClassification !== "not-run"
    ) {
      context.addIssue({
        code: "custom",
        path: ["resultClassification"],
        message: DiagnosticCode.deniedAuthorizationRequiresBlockedResult,
      });
    }
  });

export const OccurrenceFindingSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("finding"),
    findingId: NonEmptyStringSchema,
    occurrenceId: NonEmptyStringSchema,
    resultClassification: ResultClassificationSchema,
    claimBasis: ClaimBasisSchema,
    conclusionSummary: NonEmptyStringSchema,
    evidenceIds: StringListSchema,
    requirementIds: StringListSchema,
    productSurface: ProductSurfaceSchema,
    severityAssessmentId: NonEmptyStringSchema.optional(),
    copyProposalId: NonEmptyStringSchema.optional(),
    copyRelated: z.boolean(),
    duplicateGroupId: NonEmptyStringSchema.optional(),
    blockers: z.array(BlockerDetailSchema).optional(),
    notApplicableRationale: NonEmptyStringSchema.optional(),
    authorization: AuthorizationEvidenceSchema.optional(),
  })
  .strict()
  .superRefine((finding, context) => {
    addConditionalResultIssues(
      finding.resultClassification,
      finding.blockers,
      finding.notApplicableRationale,
      context,
    );
    if (
      finding.resultClassification === "nonconforming" &&
      !finding.severityAssessmentId?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["severityAssessmentId"],
        message: "AUDIT_SCHEMA_DEFECT_REQUIRES_SEVERITY_ASSESSMENT",
      });
    }
    if (
      finding.resultClassification === "nonconforming" &&
      finding.copyRelated &&
      !finding.copyProposalId?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["copyProposalId"],
        message: "AUDIT_SCHEMA_COPY_DEFECT_REQUIRES_COPY_PROPOSAL",
      });
    }
    if (finding.claimBasis === "runtime-observed") {
      if (!supportsRuntimeClaim(finding.authorization, finding.occurrenceId)) {
        context.addIssue({
          code: "custom",
          path: ["authorization"],
          message: DiagnosticCode.runtimeAuthorizationRequired,
        });
      }
    }
  });

export const DuplicateGroupSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("duplicate-group"),
    duplicateGroupId: NonEmptyStringSchema,
    productSurface: ProductSurfaceSchema,
    rootCauseSignature: NonEmptyStringSchema,
    likelySourceAreas: StringListSchema,
    violatedContract: NonEmptyStringSchema,
    failureMechanism: NonEmptyStringSchema,
    findingIds: StringListSchema,
    occurrenceIds: StringListSchema,
    evidenceIds: StringListSchema,
  })
  .strict()
  .superRefine((group, context) => {
    const hasStudioArea = group.likelySourceAreas.some((area) =>
      /(?:^|[/\\])Studio(?:[/\\]|$)/.test(area),
    );
    const hasPlannerArea = group.likelySourceAreas.some((area) =>
      /(?:^|[/\\])Planner(?:[/\\]|$)/.test(area),
    );
    if (group.productSurface === "planner" && hasStudioArea) {
      context.addIssue({
        code: "custom",
        path: ["likelySourceAreas"],
        message: "AUDIT_SCHEMA_PLANNER_GROUP_CANNOT_REFERENCE_STUDIO",
      });
    }
    if (group.productSurface === "studio" && hasPlannerArea) {
      context.addIssue({
        code: "custom",
        path: ["likelySourceAreas"],
        message: "AUDIT_SCHEMA_STUDIO_GROUP_CANNOT_REFERENCE_PLANNER",
      });
    }
  });

export const ExclusionRecordSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("exclusion"),
    exclusionId: NonEmptyStringSchema,
    inventoryId: NonEmptyStringSchema,
    itemKind: NonEmptyStringSchema,
    reason: NonEmptyStringSchema,
    evidenceReferences: StringListSchema,
    decisionOwner: NonEmptyStringSchema,
    decidedAt: IsoTimestampSchema,
    reconsiderationTrigger: NonEmptyStringSchema,
    requiresOwnerDecision: z.boolean(),
    productSurface: ProductSurfaceSchema,
  })
  .strict();

export const CoverageGapSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("coverage-gap"),
    gapId: NonEmptyStringSchema,
    inventoryId: NonEmptyStringSchema,
    affectedOccurrenceIds: StringListSchema,
    attemptedEvidenceSources: StringListSchema,
    missingPrerequisite: NonEmptyStringSchema,
    userImpact: NonEmptyStringSchema,
    proposedResolution: NonEmptyStringSchema,
    owner: NonEmptyStringSchema,
    status: z.enum(["open", "resolved", "requires-owner-decision"]),
  })
  .strict();

export const RemediationHandoffSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("remediation-handoff"),
    handoffId: NonEmptyStringSchema,
    findingIds: StringListSchema,
    duplicateGroupId: NonEmptyStringSchema.optional(),
    affectedOccurrenceIds: StringListSchema,
    rootCauseHypothesis: NonEmptyStringSchema,
    expectedOutcome: NonEmptyStringSchema,
    proposedBehavior: NonEmptyStringSchema,
    copyProposalId: NonEmptyStringSchema.optional(),
    productSurface: ProductSurfaceSchema,
    likelySourceAreas: StringListSchema,
    sharedShellImpact: OptionalStringListSchema,
    dependencies: OptionalStringListSchema,
    migrationNeed: NonEmptyStringSchema,
    assetNeed: NonEmptyStringSchema,
    contentReviewNeed: NonEmptyStringSchema,
    authorizationNeed: NonEmptyStringSchema,
    acceptanceStateIds: StringListSchema,
    acceptanceViewportIds: StringListSchema,
    acceptanceBrowserIds: StringListSchema,
    acceptanceAccessContextIds: StringListSchema,
    acceptanceLanguageIds: StringListSchema,
    relatedJourneyIds: OptionalStringListSchema,
    regressionRisk: NonEmptyStringSchema,
    rolloutConsiderations: NonEmptyStringSchema,
    rollbackConsiderations: NonEmptyStringSchema,
    verificationMethod: NonEmptyStringSchema,
    requiresSeparateImplementationAuthorization: z.literal(true),
  })
  .strict()
  .superRefine((handoff, context) => {
    const hasStudioArea = handoff.likelySourceAreas.some((area) =>
      /(?:^|[/\\])Studio(?:[/\\]|$)/.test(area),
    );
    const hasPlannerArea = handoff.likelySourceAreas.some((area) =>
      /(?:^|[/\\])Planner(?:[/\\]|$)/.test(area),
    );
    if (handoff.productSurface === "planner" && hasStudioArea) {
      context.addIssue({
        code: "custom",
        path: ["likelySourceAreas"],
        message: "AUDIT_SCHEMA_PLANNER_HANDOFF_CANNOT_REFERENCE_STUDIO",
      });
    }
    if (handoff.productSurface === "studio" && hasPlannerArea) {
      context.addIssue({
        code: "custom",
        path: ["likelySourceAreas"],
        message: "AUDIT_SCHEMA_STUDIO_HANDOFF_CANNOT_REFERENCE_PLANNER",
      });
    }
  });

export const WaveCheckpointSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("wave-checkpoint"),
    checkpointId: NonEmptyStringSchema,
    runId: NonEmptyStringSchema,
    waveId: z.number().int().min(0).max(5),
    status: z.enum(["pending", "leased", "complete", "blocked", "invalidated"]),
    entryCriteriaMet: z.boolean(),
    exitCriteria: StringListSchema,
    dependencyWaveIds: OptionalStringListSchema,
    ownedPartitionIds: StringListSchema,
    ownedOutputPaths: StringListSchema,
    authorizationRequirement: NonEmptyStringSchema,
    owner: NonEmptyStringSchema.optional(),
    heartbeatAt: IsoTimestampSchema.optional(),
    inputFingerprint: NonEmptyStringSchema,
    inventoryGeneration: z.number().int().min(0),
    terminalItemCount: z.number().int().min(0),
    ownedItemCount: z.number().int().min(0),
    quarantineCount: z.number().int().min(0),
    nonTerminalCount: z.number().int().min(0),
  })
  .strict()
  .superRefine((checkpoint, context) => {
    if (
      checkpoint.status === "complete" &&
      (!checkpoint.entryCriteriaMet ||
        checkpoint.terminalItemCount !== checkpoint.ownedItemCount ||
        checkpoint.quarantineCount !== 0 ||
        checkpoint.nonTerminalCount !== 0)
    ) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "AUDIT_SCHEMA_COMPLETE_WAVE_REQUIRES_CLOSED_PARTITION",
      });
    }
  });

const PartitionManifestSchema = z
  .object({
    partitionId: NonEmptyStringSchema,
    path: NonEmptyStringSchema,
    contentHash: NonEmptyStringSchema,
    recordCount: z.number().int().min(0),
    status: z.enum(["pending", "leased", "complete", "blocked", "invalidated"]),
    inputFingerprint: NonEmptyStringSchema,
    supersedesPartitionId: NonEmptyStringSchema.optional(),
  })
  .strict();

export const RunManifestSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("run-manifest"),
    manifestId: NonEmptyStringSchema,
    runId: NonEmptyStringSchema,
    auditId: NonEmptyStringSchema,
    repositoryRevision: NonEmptyStringSchema,
    configurationHash: NonEmptyStringSchema,
    schemaVersion: SchemaVersionSchema,
    sourceHashes: z.record(z.string(), NonEmptyStringSchema),
    toolVersions: z.record(z.string(), NonEmptyStringSchema),
    inventoryGeneration: z.number().int().min(0),
    partitions: z.array(PartitionManifestSchema).min(1),
    authoredWorkReferences: OptionalStringListSchema,
    changedPaths: OptionalStringListSchema,
    supersedesManifestId: NonEmptyStringSchema.optional(),
  })
  .strict();

const CompletionTotalsSchema = z
  .object({
    inventory: z.number().int().min(0),
    matrixRows: z.number().int().min(0),
    findings: z.number().int().min(0),
    evidenceRecords: z.number().int().min(0),
    copyDefects: z.number().int().min(0),
    copyProposals: z.number().int().min(0),
    defects: z.number().int().min(0),
    severityRationales: z.number().int().min(0),
    handoffSubjects: z.number().int().min(0),
    handoffs: z.number().int().min(0),
    exclusions: z.number().int().min(0),
    unclassifiedInventory: z.number().int().min(0),
    coverageGaps: z.number().int().min(0),
    unclassifiedCoverageGaps: z.number().int().min(0),
    pendingOperations: z.number().int().min(0),
    quarantine: z.number().int().min(0),
    nonTerminalRows: z.number().int().min(0),
  })
  .strict();

export const CompletionProofSchema = z
  .object({
    ...RecordEnvelopeShape,
    recordType: z.literal("completion-proof"),
    proofId: NonEmptyStringSchema,
    runId: NonEmptyStringSchema,
    manifestId: NonEmptyStringSchema,
    declaredComplete: z.boolean(),
    inventoryGeneration: z.number().int().min(0),
    resultTotals: z.object({
      conforming: z.number().int().min(0),
      nonconforming: z.number().int().min(0),
      blocked: z.number().int().min(0),
      notRun: z.number().int().min(0),
      notApplicable: z.number().int().min(0),
      requiresOwnerDecision: z.number().int().min(0),
    }),
    totals: CompletionTotalsSchema,
    waveCheckpointIds: StringListSchema,
    runtimeAuthorizationEvidenceIds: OptionalStringListSchema,
    staticLimitations: StringListSchema,
    changedPathManifestReference: NonEmptyStringSchema,
  })
  .strict()
  .superRefine((proof, context) => {
    if (
      proof.declaredComplete &&
      (proof.totals.inventory !== proof.totals.matrixRows ||
        proof.totals.matrixRows !== proof.totals.findings ||
        proof.totals.findings !== proof.totals.evidenceRecords ||
        proof.totals.copyDefects !== proof.totals.copyProposals ||
        proof.totals.defects !== proof.totals.severityRationales ||
        proof.totals.handoffSubjects !== proof.totals.handoffs ||
        proof.totals.unclassifiedInventory !== 0 ||
        proof.totals.unclassifiedCoverageGaps !== 0 ||
        proof.totals.quarantine !== 0 ||
        proof.totals.nonTerminalRows !== 0)
    ) {
      context.addIssue({
        code: "custom",
        path: ["declaredComplete"],
        message: "AUDIT_SCHEMA_COMPLETE_PROOF_REQUIRES_RECONCILED_TOTALS",
      });
    }
  });

export const AuditRecordSchemas = {
  provenance: ProvenanceRecordSchema,
  "source-registry": SourceRegistrySchema,
  "tool-registry": ToolRegistrySchema,
  "adapter-candidate": AdapterCandidateRecordSchema,
  "adapter-gap": AdapterGapRecordSchema,
  "authority-conflict": AuthorityConflictRecordSchema,
  route: CanonicalRouteRecordSchema,
  "dynamic-instance": DynamicInstanceRecordSchema,
  "shared-shell": SharedShellRecordSchema,
  "specialized-inventory": SpecializedInventoryRecordSchema,
  "profile-registry": ProfileRegistrySchema,
  applicability: ApplicabilityDecisionSchema,
  "matrix-row": CoverageMatrixRowSchema,
  authorization: z
    .object({
      ...RecordEnvelopeShape,
      recordType: z.literal("authorization"),
      authorization: AuthorizationEvidenceSchema,
    })
    .strict(),
  evidence: EvidenceRecordSchema,
  finding: OccurrenceFindingSchema,
  "copy-proposal": CopyProposalSchema,
  "severity-assessment": SeverityAssessmentSchema,
  "duplicate-group": DuplicateGroupSchema,
  exclusion: ExclusionRecordSchema,
  "coverage-gap": CoverageGapSchema,
  "remediation-handoff": RemediationHandoffSchema,
  "wave-checkpoint": WaveCheckpointSchema,
  "run-manifest": RunManifestSchema,
  "completion-proof": CompletionProofSchema,
} as const;

export type AuditRecordType = keyof typeof AuditRecordSchemas;
export type AuditRecord = z.infer<
  (typeof AuditRecordSchemas)[AuditRecordType]
>;

export interface AuditSchemaDiagnostic {
  readonly code: string;
  readonly path: readonly string[];
  readonly message: string;
}

export interface QuarantinedAuditRecord {
  readonly index: number;
  readonly receivedRecordType: string | null;
  readonly diagnostics: readonly AuditSchemaDiagnostic[];
}

export interface PartitionValidationResult {
  readonly records: readonly AuditRecord[];
  readonly quarantined: readonly QuarantinedAuditRecord[];
  readonly pendingOccurrenceIds: readonly string[];
  readonly canClose: boolean;
  readonly closureDiagnostics: readonly AuditSchemaDiagnostic[];
}

export class AuditPartitionClosureError extends Error {
  public constructor(diagnostics: readonly AuditSchemaDiagnostic[]) {
    super(diagnostics.map((diagnostic) => diagnostic.code).join(", "));
    this.name = "AuditPartitionClosureError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableDiagnostics(error: z.ZodError): readonly AuditSchemaDiagnostic[] {
  return Object.freeze(
    error.issues
      .map((issue, index) => {
        const path = issue.path.map((segment) => String(segment));
        const hasStableCustomCode =
          issue.code === "custom" && issue.message.startsWith("AUDIT_SCHEMA_");
        return {
          code: hasStableCustomCode
            ? issue.message
            : DiagnosticCode.invalidField,
          path,
          message: hasStableCustomCode
            ? issue.message
            : "The field is missing or invalid for this schema version.",
          index,
        };
      })
      .sort((left, right) => {
        const leftKey = `${left.path.join(".")}\u0000${left.code}\u0000${left.index}`;
        const rightKey = `${right.path.join(".")}\u0000${right.code}\u0000${right.index}`;
        return leftKey.localeCompare(rightKey);
      })
      .map(({ index: _index, ...diagnostic }) => Object.freeze(diagnostic)),
  );
}

function diagnostic(
  code: string,
  path: readonly string[],
  message: string,
): AuditSchemaDiagnostic {
  return Object.freeze({ code, path: Object.freeze([...path]), message });
}

export function parseAuditRecord(
  value: unknown,
):
  | { readonly success: true; readonly data: AuditRecord }
  | { readonly success: false; readonly diagnostics: readonly AuditSchemaDiagnostic[] } {
  if (!isRecord(value) || typeof value.recordType !== "string") {
    return {
      success: false,
      diagnostics: Object.freeze([
        diagnostic(
          DiagnosticCode.unknownRecordType,
          ["recordType"],
          "Audit records must declare a supported recordType.",
        ),
      ]),
    };
  }

  const recordType = value.recordType;
  if (!Object.prototype.hasOwnProperty.call(AuditRecordSchemas, recordType)) {
    return {
      success: false,
      diagnostics: Object.freeze([
        diagnostic(
          DiagnosticCode.unknownRecordType,
          ["recordType"],
          `Unsupported audit recordType: ${recordType}`,
        ),
      ]),
    };
  }

  const schema = AuditRecordSchemas[recordType as AuditRecordType];
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    return { success: false, diagnostics: stableDiagnostics(parsed.error) };
  }
  return { success: true, data: parsed.data as AuditRecord };
}

export function validateAuditPartition(
  records: readonly unknown[],
): PartitionValidationResult {
  const validRecords: AuditRecord[] = [];
  const quarantined: QuarantinedAuditRecord[] = [];
  const pendingOccurrenceIds: string[] = [];

  records.forEach((record, index) => {
    const parsed = parseAuditRecord(record);
    if (!parsed.success) {
      const receivedRecordType =
        isRecord(record) && typeof record.recordType === "string"
          ? record.recordType
          : null;
      quarantined.push(
        Object.freeze({
          index,
          receivedRecordType,
          diagnostics: parsed.diagnostics,
        }),
      );
      return;
    }

    validRecords.push(parsed.data);
    if (parsed.data.recordType === "matrix-row" && parsed.data.status === "pending") {
      pendingOccurrenceIds.push(parsed.data.occurrenceId);
    }
  });

  const closureDiagnostics: AuditSchemaDiagnostic[] = [];
  if (quarantined.length > 0) {
    closureDiagnostics.push(
      diagnostic(
        DiagnosticCode.partitionContainsQuarantine,
        ["quarantined"],
        "A partition with quarantined records cannot close.",
      ),
    );
  }
  if (pendingOccurrenceIds.length > 0) {
    closureDiagnostics.push(
      diagnostic(
        DiagnosticCode.partitionContainsPendingRows,
        ["pendingOccurrenceIds"],
        "A partition with pending matrix rows cannot close.",
      ),
    );
  }

  return Object.freeze({
    records: Object.freeze(validRecords),
    quarantined: Object.freeze(quarantined),
    pendingOccurrenceIds: Object.freeze(pendingOccurrenceIds.sort()),
    canClose: closureDiagnostics.length === 0,
    closureDiagnostics: Object.freeze(closureDiagnostics),
  });
}

export function assertAuditPartitionClosable(
  validation: PartitionValidationResult,
): void {
  if (!validation.canClose) {
    throw new AuditPartitionClosureError(validation.closureDiagnostics);
  }
}

const EXAMPLE_TIMESTAMP = "2026-08-23T12:00:00.000Z";
const EXAMPLE_PROVENANCE = {
  sourceId: "source.route-tree",
  sourceKind: "source",
  location: "site/app",
  discoveredAt: EXAMPLE_TIMESTAMP,
  authorityRank: 1,
} as const;
const EXAMPLE_BLOCKER = {
  blockerKind: "authorization",
  detail: "The browser workflow has not received current-session authorization.",
  pendingOperation: "pnpm exec playwright test --project=chromium",
} as const;
const EXAMPLE_AUTHORIZATION = {
  operationId: "operation.runtime-home",
  exactOperation: "pnpm exec playwright test --project=chromium --grep home",
  authorizationStatement: "The repository owner authorized this exact operation.",
  authorizedInCurrentSession: true,
  repositoryRoot: "d:/23082026",
  hookName: "block-agent-tests",
  hookDecision: "permit",
  requestedAt: EXAMPLE_TIMESTAMP,
  executedAt: EXAMPLE_TIMESTAMP,
  exitStatus: 0,
  targetEnvironment: "local",
  affectedOccurrenceIds: ["occurrence.home.default"],
  credentialOrFixtureNeeds: [],
  outputLocations: ["results/site-ui-content-links-audit/example/evidence/runtime.json"],
  limitations: ["The observation applies only to the selected occurrence."],
} as const;

function exampleEnvelope(recordType: AuditRecordType, recordId: string) {
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType,
    recordId,
    createdAt: EXAMPLE_TIMESTAMP,
  } as const;
}

/**
 * Provides one schema-valid record for every supported top-level record type.
 * Consumers can pass the return value to validateAuditPartition without running
 * a browser, test runner, build, gate, or local service.
 */
export function createAuditSchemaExamples(): readonly unknown[] {
  const copyProposal = {
    ...exampleEnvelope("copy-proposal", "record.copy-proposal"),
    proposalId: "proposal.home.heading",
    currentText: "Get furniture",
    finalEnglishText: "Explore office furniture solutions",
    placement: "Marketing home hero heading",
    intent: "Clarify the primary catalog action.",
    applicableState: "default",
    preservedFacts: ["Catalog pricing remains in INR."],
    hindiNote: {
      translationRequired: true,
      translationOwner: "content-review",
      humanReviewRequired: true,
      reviewNotes: "Hindi wording requires human approval before publication.",
    },
  } as const;

  const severityAssessment = {
    ...exampleEnvelope("severity-assessment", "record.severity"),
    assessmentId: "severity.home.copy",
    findingId: "F-occurrence.home.default",
    severity: "low",
    severityRationale: "The wording is localized and does not block the journey.",
    decidingDimension: "user-impact",
    userImpact: "The user may need more time to identify the catalog action.",
    affectedAudience: "marketing visitors",
    journeyCriticality: "secondary",
    dataSensitivity: "none",
    legalOrConsentExposure: "none",
    occurrenceCount: 1,
    recoverability: "immediate",
    workaroundQuality: "The navigation remains available.",
  } as const;

  return Object.freeze([
    {
      ...exampleEnvelope("provenance", "record.provenance"),
      provenance: EXAMPLE_PROVENANCE,
    },
    {
      ...exampleEnvelope("source-registry", "record.source-registry"),
      registryId: "registry.sources",
      sources: [
        {
          sourceId: "source.route-tree",
          label: "App Router tree",
          sourceKind: "source",
          authorityRank: 1,
          scope: ["site/app"],
          authorizationClass: "static-inspection",
          provenance: [EXAMPLE_PROVENANCE],
        },
      ],
    },
    {
      ...exampleEnvelope("tool-registry", "record.tool-registry"),
      registryId: "registry.tools",
      tools: [
        {
          toolId: "tool.route-matrix",
          label: "Route matrix generator",
          scope: ["route candidates"],
          inputs: ["site/app"],
          outputs: ["route patterns"],
          supportedProfileIds: [],
          knownOmissions: ["It does not close dynamic instance coverage."],
          authorizationClass: "static-inspection",
          lastObservedExecutionState: "never-run",
          residualWork: ["Map candidates to occurrence rows."],
          adapterSchema: "adapter-candidate@1",
          provenance: [EXAMPLE_PROVENANCE],
        },
      ],
    },
    {
      ...exampleEnvelope("adapter-candidate", "record.adapter-candidate"),
      candidateId: "candidate.home.route",
      adapterId: "adapter.source.app-router-tree",
      sourceId: "source.route-tree",
      candidateKind: "route",
      subjectKey: "site/app/(site)/page.tsx",
      claimedFields: ["pattern", "routeKind"],
      payload: { pattern: "/", routeKind: "static" },
      provenance: [EXAMPLE_PROVENANCE],
      isSampled: false,
      canCloseCoverage: false,
    },
    {
      ...exampleEnvelope("adapter-gap", "record.adapter-gap"),
      gapId: "gap.adapter.home.visible-output",
      adapterId: "adapter.source.app-router-tree",
      sourceId: "source.route-tree",
      subjectKeys: ["site/app/(site)/page.tsx"],
      gapKind: "unsupported-field",
      unsupportedFields: ["visibleOutput"],
      missingPrerequisite: "The route adapter does not evaluate rendered visibility.",
      proposedResolution: "Evaluate visible output in a later static or authorized runtime stage.",
      status: "open",
      provenance: [EXAMPLE_PROVENANCE],
    },
    {
      ...exampleEnvelope("authority-conflict", "record.authority-conflict"),
      conflictId: "conflict.home.status",
      subjectKey: "route.home",
      claimField: "status",
      claims: [
        {
          candidateId: "candidate.home.source",
          sourceId: "source.route-tree",
          authorityRank: 10,
          valueFingerprint: "active",
          provenance: [EXAMPLE_PROVENANCE],
        },
        {
          candidateId: "candidate.home.generated",
          sourceId: "source.generated-inventories",
          authorityRank: 70,
          valueFingerprint: "legacy",
          provenance: [
            {
              ...EXAMPLE_PROVENANCE,
              sourceId: "source.generated-inventories",
              sourceKind: "tool",
              authorityRank: 70,
            },
          ],
        },
      ],
      resolution: "higher-authority-selected",
      selectedCandidateId: "candidate.home.source",
      selectedSourceId: "source.route-tree",
      selectedAuthorityRank: 10,
      provenance: [EXAMPLE_PROVENANCE],
    },
    {
      ...exampleEnvelope("route", "record.route"),
      routeId: "route.home",
      pattern: "/",
      routeKind: "static",
      productSurface: "marketing",
      status: "active",
      sourcePath: "site/app/(site)/page.tsx",
      provenance: [EXAMPLE_PROVENANCE],
      conflictIds: [],
      coverageGapIds: [],
    },
    {
      ...exampleEnvelope("dynamic-instance", "record.dynamic-instance"),
      instanceId: "instance.product-chair",
      routeId: "route.product",
      concreteUrl: "/products/chair",
      normalizedUrl: "/products/chair",
      parameterValues: { slug: "chair" },
      discoverySources: [EXAMPLE_PROVENANCE],
      discoveredAt: EXAMPLE_TIMESTAMP,
      productSurface: "catalog-configurator",
      status: "active",
      coverageGapIds: [],
    },
    {
      ...exampleEnvelope("shared-shell", "record.shared-shell"),
      shellId: "shell.site-header",
      role: "header",
      productSurface: "shared-shell",
      sourcePath: "site/components/site/SiteHeader.tsx",
      visibleOutput: true,
      routeIds: ["route.home"],
      provenance: [EXAMPLE_PROVENANCE],
      status: "active",
    },
    {
      ...exampleEnvelope("specialized-inventory", "record.inventory"),
      inventoryId: "inventory.home-link-catalog",
      inventoryKind: "link",
      owner: "site-navigation",
      sourceLocator: "site/components/site/SiteHeader.tsx#catalog-link",
      productSurface: "shared-shell",
      provenance: [EXAMPLE_PROVENANCE],
      applicableOccurrenceSelector: {
        subjectIds: ["route.home"],
        stateIds: ["state.default"],
        viewportIds: [],
        browserIds: [],
        accessContextIds: [],
        languageIds: [],
      },
      status: "canonical",
      payload: { target: "/catalog" },
      coverageGapIds: [],
    },
    {
      ...exampleEnvelope("profile-registry", "record.profile-registry"),
      registryId: "registry.viewports",
      profileKind: "viewport",
      registryVersion: "1",
      frozenAt: EXAMPLE_TIMESTAMP,
      configurationHash: "configuration-hash",
      entries: [
        {
          profileId: "viewport.desktop",
          label: "Desktop",
          enabled: true,
          definition: { width: 1440, height: 900, inputMode: "mouse" },
        },
      ],
    },
    {
      ...exampleEnvelope("applicability", "record.applicability"),
      applicabilityId: "applicability.home.default",
      subjectId: "route.home",
      dimensionKind: "state",
      dimensionId: "state.default",
      status: "applicable",
      provenance: [EXAMPLE_PROVENANCE],
    },
    {
      ...exampleEnvelope("matrix-row", "record.matrix-row"),
      occurrenceId: "occurrence.home.default",
      routeId: "route.home",
      concreteUrl: "/",
      productSurface: "marketing",
      stateId: "state.default",
      viewportId: "viewport.desktop",
      browserId: "browser.chromium",
      accessContextId: "access.guest",
      languageId: "en",
      applicableDimensionIds: ["dimension.link"],
      waveId: "wave-0",
      status: "conforming",
      findingId: "F-occurrence.home.default",
      inputFingerprint: "fingerprint.home.default",
    },
    {
      ...exampleEnvelope("authorization", "record.authorization"),
      authorization: EXAMPLE_AUTHORIZATION,
    },
    {
      ...exampleEnvelope("evidence", "record.evidence"),
      evidenceId: "evidence.home.link",
      findingId: "F-occurrence.home.default",
      occurrenceId: "occurrence.home.default",
      route: "/",
      concreteUrl: "/",
      productSurface: "marketing",
      stateVariant: "default",
      viewportProfile: "viewport.desktop",
      browserProfile: "browser.chromium",
      accessContext: "access.guest",
      languageContext: "en",
      auditDimension: "link",
      expectedResult: "The catalog link has an internal target.",
      observedResult: "The source declares the catalog link.",
      claimBasis: "source-observed",
      resultClassification: "conforming",
      severity: "advisory",
      severityRationale: "No source-visible defect was identified.",
      userImpact: "None identified from static evidence.",
      evidenceLane: "static-inspection",
      evidenceType: "source-reference",
      sourceOrRuntimeLocation: "site/components/site/SiteHeader.tsx",
      capturedAt: EXAMPLE_TIMESTAMP,
      reproductionSteps: ["Inspect the source reference."],
      evidenceReferences: ["site/components/site/SiteHeader.tsx"],
      requirementIds: ["5.1"],
      journeyIds: [],
      shellIds: ["shell.site-header"],
      relatedFindingIds: [],
      proposedOutcome: "Retain the current source-visible link contract.",
      likelyOwner: "site-navigation",
      dependencies: [],
      verificationMethod: "Static source inspection.",
    },
    {
      ...exampleEnvelope("finding", "record.finding"),
      findingId: "F-occurrence.home.default",
      occurrenceId: "occurrence.home.default",
      resultClassification: "conforming",
      claimBasis: "source-observed",
      conclusionSummary: "The static source declares the expected catalog link.",
      evidenceIds: ["evidence.home.link"],
      requirementIds: ["5.1"],
      productSurface: "marketing",
      copyRelated: false,
    },
    copyProposal,
    severityAssessment,
    {
      ...exampleEnvelope("duplicate-group", "record.duplicate-group"),
      duplicateGroupId: "group.home-links",
      productSurface: "marketing",
      rootCauseSignature: "marketing-navigation-label",
      likelySourceAreas: ["site/components/site/SiteHeader.tsx"],
      violatedContract: "Visible labels must identify the expected destination.",
      failureMechanism: "Ambiguous navigation copy.",
      findingIds: ["F-occurrence.home.default"],
      occurrenceIds: ["occurrence.home.default"],
      evidenceIds: ["evidence.home.link"],
    },
    {
      ...exampleEnvelope("exclusion", "record.exclusion"),
      exclusionId: "exclusion.legacy-route",
      inventoryId: "route.legacy",
      itemKind: "route",
      reason: "The source identifies this route as legacy and outside the audit scope.",
      evidenceReferences: ["site/app/legacy/page.tsx"],
      decisionOwner: "repository-owner",
      decidedAt: EXAMPLE_TIMESTAMP,
      reconsiderationTrigger: "Route reactivation.",
      requiresOwnerDecision: false,
      productSurface: "marketing",
    },
    {
      ...exampleEnvelope("coverage-gap", "record.coverage-gap"),
      gapId: "gap.product-instances",
      inventoryId: "route.product",
      affectedOccurrenceIds: ["occurrence.product.pending"],
      attemptedEvidenceSources: ["repository-data"],
      missingPrerequisite: "Read-only product data adapter.",
      userImpact: "Product instance coverage is incomplete.",
      proposedResolution: "Implement the repository data adapter in Task 1.3.",
      owner: "audit-tooling",
      status: "open",
    },
    {
      ...exampleEnvelope("remediation-handoff", "record.remediation-handoff"),
      handoffId: "handoff.home-copy",
      findingIds: ["F-occurrence.home.default"],
      affectedOccurrenceIds: ["occurrence.home.default"],
      rootCauseHypothesis: "The heading does not name the catalog destination.",
      expectedOutcome: "Users understand that the call to action opens the catalog.",
      proposedBehavior: "Replace the ambiguous heading with the approved proposal.",
      copyProposalId: "proposal.home.heading",
      productSurface: "marketing",
      likelySourceAreas: ["site/components/site/SiteHeader.tsx"],
      sharedShellImpact: [],
      dependencies: [],
      migrationNeed: "None.",
      assetNeed: "None.",
      contentReviewNeed: "Hindi review is required.",
      authorizationNeed: "A separate product implementation scope is required.",
      acceptanceStateIds: ["state.default"],
      acceptanceViewportIds: ["viewport.desktop"],
      acceptanceBrowserIds: ["browser.chromium"],
      acceptanceAccessContextIds: ["access.guest"],
      acceptanceLanguageIds: ["en", "hi"],
      relatedJourneyIds: [],
      regressionRisk: "Low.",
      rolloutConsiderations: "Publish with reviewed Hindi wording.",
      rollbackConsiderations: "Restore the previous approved copy.",
      verificationMethod: "Review the rendered copy in an authorized browser workflow.",
      requiresSeparateImplementationAuthorization: true,
    },
    {
      ...exampleEnvelope("wave-checkpoint", "record.wave-checkpoint"),
      checkpointId: "checkpoint.wave-0",
      runId: "20260823T120000000Z-abcdef123456-abcdef123456",
      waveId: 0,
      status: "complete",
      entryCriteriaMet: true,
      exitCriteria: ["Schemas validate."],
      dependencyWaveIds: [],
      ownedPartitionIds: ["partition.wave-0.marketing"],
      ownedOutputPaths: ["results/site-ui-content-links-audit/example/manifests/wave-0.json"],
      authorizationRequirement: "static-inspection-only",
      inputFingerprint: "fingerprint.wave-0",
      inventoryGeneration: 1,
      terminalItemCount: 1,
      ownedItemCount: 1,
      quarantineCount: 0,
      nonTerminalCount: 0,
    },
    {
      ...exampleEnvelope("run-manifest", "record.run-manifest"),
      manifestId: "manifest.example",
      runId: "20260823T120000000Z-abcdef123456-abcdef123456",
      auditId: "site-ui-content-links-audit",
      repositoryRevision: "abcdef123456",
      configurationHash: "configuration-hash",
      sourceHashes: { "site/app": "source-hash" },
      toolVersions: { audit: "1.0.0" },
      inventoryGeneration: 1,
      partitions: [
        {
          partitionId: "partition.wave-0.marketing",
          path: "results/site-ui-content-links-audit/example/manifests/wave-0.json",
          contentHash: "content-hash",
          recordCount: 1,
          status: "complete",
          inputFingerprint: "fingerprint.wave-0",
        },
      ],
      authoredWorkReferences: [],
      changedPaths: ["scripts/site-ui-content-links-audit/schemas.ts"],
    },
    {
      ...exampleEnvelope("completion-proof", "record.completion-proof"),
      proofId: "proof.example",
      runId: "20260823T120000000Z-abcdef123456-abcdef123456",
      manifestId: "manifest.example",
      declaredComplete: false,
      inventoryGeneration: 1,
      resultTotals: {
        conforming: 1,
        nonconforming: 0,
        blocked: 0,
        notRun: 0,
        notApplicable: 0,
        requiresOwnerDecision: 0,
      },
      totals: {
        inventory: 1,
        matrixRows: 1,
        findings: 1,
        evidenceRecords: 1,
        copyDefects: 0,
        copyProposals: 1,
        defects: 0,
        severityRationales: 1,
        handoffSubjects: 0,
        handoffs: 1,
        exclusions: 1,
        unclassifiedInventory: 0,
        coverageGaps: 1,
        unclassifiedCoverageGaps: 0,
        pendingOperations: 0,
        quarantine: 0,
        nonTerminalRows: 0,
      },
      waveCheckpointIds: ["checkpoint.wave-0"],
      runtimeAuthorizationEvidenceIds: [],
      staticLimitations: ["No protected runtime work was executed."],
      changedPathManifestReference: "manifest.example",
    },
  ]);
}

export function createBlockedEvidenceExample(): unknown {
  return {
    ...exampleEnvelope("evidence", "record.evidence.blocked"),
    evidenceId: "evidence.home.runtime-blocked",
    findingId: "F-occurrence.home.default",
    occurrenceId: "occurrence.home.default",
    route: "/",
    concreteUrl: "/",
    productSurface: "marketing",
    stateVariant: "default",
    viewportProfile: "viewport.desktop",
    browserProfile: "browser.chromium",
    accessContext: "access.guest",
    languageContext: "en",
    auditDimension: "responsive-layout",
    expectedResult: "The route remains usable at the selected profile.",
    observedResult: "Runtime work was not executed.",
    claimBasis: "source-inferred-expectation",
    resultClassification: "not-run",
    severity: "advisory",
    severityRationale: "No runtime conclusion is available.",
    userImpact: "Runtime usability remains unverified.",
    evidenceLane: "static-inspection",
    evidenceType: "authorization-gap",
    sourceOrRuntimeLocation: "authorization registry",
    capturedAt: EXAMPLE_TIMESTAMP,
    reproductionSteps: ["Request authorization for the exact browser operation."],
    evidenceReferences: ["authorization registry"],
    requirementIds: ["4.3"],
    journeyIds: [],
    shellIds: [],
    relatedFindingIds: [],
    proposedOutcome: "Run the exact protected operation after authorization.",
    likelyOwner: "audit-tooling",
    dependencies: [],
    verificationMethod: "Authorized browser workflow.",
    blockers: [EXAMPLE_BLOCKER],
  };
}
