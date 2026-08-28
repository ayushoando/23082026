import { createEvidenceCompatibilityReviewer, createSafetyRollbackReviewer, runSequentialReview } from "../.kiro/kiro-repo-guidance-setup/reviewers.ts";
import { COMPLETE_REVIEW_STATEMENT, OWNER_DECISIONS, OWNER_DECISION_IDS, REQUIRED_SURFACE_VERSIONS } from "../.kiro/kiro-repo-guidance-setup/contracts.ts";

function passingRun(surface) {
  const sv = REQUIRED_SURFACE_VERSIONS.find(s => s.surface === surface);
  return { validationId: `v-${surface}-${sv.version}`, action: "surface", repositoryRootOrActiveSurface: surface, surface, version: sv.version, scope: "x", executionLayer: "surface_validation", startedAtUtc: "2026-08-25T00:00:00.000Z", result: "pass", commandOrInteraction: "x", exitCodeOrOutcome: "exit 0", evidenceRefs: ["e"], unverifiedItems: [], blocker: "none" };
}
const runs = REQUIRED_SURFACE_VERSIONS.map(sv => passingRun(sv.surface));
const records = REQUIRED_SURFACE_VERSIONS.map(sv => {
  const run = passingRun(sv.surface);
  return { ...sv, status: "applicable", documentedBehavior: [], observedBehavior: [], evidenceFreshness: "fresh", versionSensitiveClaim: false, validationAction: "x", validationRunRefs: [run.validationId], enablementStatus: "enabled-valid", unsupportedClaims: [], migrationConstraints: [], rollbackPathRef: `rb-${sv.surface}` };
});

const ev = createEvidenceCompatibilityReviewer().review({
  inputStageRef: "ig-1",
  sourceInventory: { reviewDateUtc: "2026-08-25", activeSurfaces: ["Local_Repository_Surface"], discoveryMethod: "file_read", records: [{ sourceId: "src-1", kind: "repository_file", locator: "AGENTS.md", reviewDateUtc: "2026-08-25", retrievalMethod: "file_read", surfaceApplicability: ["Local_Repository_Surface"], versionSensitiveClaim: false, availability: "available", evidenceState: "Documented", provenance: { observer: "x", cwdOrSurface: "D:\\23082026", commandOrPath: "AGENTS.md", result: "read" }, trustDecision: "trusted", claims: [], validationRunRefs: [], disposition: "retain" }], unavailableFindings: [] },
  coverageMatrix: { entries: [{ coverageId: "cov-1", sourceId: "src-1", url: "https://kiro.dev/docs", family: "docs", discoveryMethod: "sitemap", reviewDateUtc: "2026-08-25", surface: "Local_Repository_Surface", applicability: "applicable", keyConvention: "guidance", versionSensitiveClaim: false, evidenceProvenanceRef: "prov-1", availability: "available", disposition: "retain", validationAction: "none", status: "reviewed" }], completeReviewStatement: COMPLETE_REVIEW_STATEMENT, complete: true, unavailableCandidateRefs: [], blockers: [] },
  exclusions: { entries: [] },
  artifactInventory: [{ artifactId: "artifact:lane-d-review", kind: "Kiro_Skill", path: ".kiro/skills/repo-map/SKILL.md", inventoryStatus: "present and readable", owner: "repository owner", configurationScope: "project", activationCondition: "after exact-surface validation", canonicalSource: "AGENTS.md", evidenceState: "Observed", disposition: "retain", maintenanceRisk: "low", evidenceRefs: ["src-1"], validationRunRefs: [], rollbackPath: "no rollback applies" }],
  compatibilityRecords: records,
  ownerDecisions: [...OWNER_DECISIONS],
  validationRuns: runs,
});
console.log("evidence:", ev.status);
if (ev.status === "blocked") console.log("ev blockers:", ev.blockers);

const handover = {
  generatedAtUtc: "2026-08-25T00:00:00.000Z", reviewDateUtc: "2026-08-25", completeReviewStatement: COMPLETE_REVIEW_STATEMENT, firstReadPath: ["AGENTS.md"], coverageMatrixRef: "c1", exclusionRegisterRef: "e1", officialFamilyStatuses: [], surfaceCompatibilityStatement: "x", configurationPrecedenceMapRef: "p1", capabilityDispositionTableRef: "d1",
  reviewerStageRefs: [ev.output?.handoff.handoffId ?? "handoff-EvidenceCompatibilityReviewer", "handoff-SafetyRollbackReviewer"],
  ownerDecisionRefs: [...OWNER_DECISION_IDS], evidenceStateLegend: [], artifactDispositions: [{ artifactId: "artifact:lane-d-review", canonicalPath: ".kiro/skills/repo-map/SKILL.md", disposition: "retain", evidenceRefs: ["src-1"], reason: "x", activationCondition: "y", owner: "repository owner", rollbackPath: "no rollback applies" }], validationRuns: runs, knownGaps: [], rollbackRecords: [{ rollbackId: "rb-1", targetArtifactOrScope: "x", preChangeStateRef: "s1", rollbackAction: "y", expectedSuccessSignal: "z", observedEvidence: "w", result: "pass", verificationRunRef: "v1", owner: "repository owner" }], maintenanceTriggers: [], limitations: []
};

const saf = createSafetyRollbackReviewer().review({ evidenceReview: ev.output, approvalBoundaries: [{ boundaryId: "ab-1", scope: "project", requestedChange: "enable local skill", targetSurface: "Local_Repository_Surface", owner: "repository owner", approvalStatus: "approved", approvalDate: "2026-08-25", preChangeStateRef: "snapshot:lane-d-review", securityBoundary: "repository-local, no secrets or external data", expectedSideEffects: ["read-only inspection of repository guidance"], rollbackPathRef: "rollback:lane-d-review" }], policyFindings: [], snapshots: ["snapshot:lane-d-review"], knownGaps: { entries: [] }, rollbackRecords: [{ rollbackId: "rollback:lane-d-review", targetArtifactOrScope: "repository-local guidance", preChangeStateRef: "snapshot:lane-d-review", rollbackAction: "restore the captured bytes", expectedSuccessSignal: "captured bytes match", observedEvidence: "captured bytes match", result: "pass", verificationRunRef: "validation:lane-d-review-rollback", owner: "repository owner" }], proposedHandover: handover });
console.log("safety:", saf.status);
if (saf.status === "blocked") console.log("saf blockers:", saf.output?.blockers ?? saf.blockers);

const seq = runSequentialReview({ evidence: { inputStageRef: "ig-1", sourceInventory: { reviewDateUtc: "2026-08-25", activeSurfaces: ["Local_Repository_Surface"], discoveryMethod: "file_read", records: [{ sourceId: "src-1", kind: "repository_file", locator: "AGENTS.md", reviewDateUtc: "2026-08-25", retrievalMethod: "file_read", surfaceApplicability: ["Local_Repository_Surface"], versionSensitiveClaim: false, availability: "available", evidenceState: "Documented", provenance: { observer: "x", cwdOrSurface: "D:\\23082026", commandOrPath: "AGENTS.md", result: "read" }, trustDecision: "trusted", claims: [], validationRunRefs: [], disposition: "retain" }], unavailableFindings: [] }, coverageMatrix: { entries: [{ coverageId: "cov-1", sourceId: "src-1", url: "https://kiro.dev/docs", family: "docs", discoveryMethod: "sitemap", reviewDateUtc: "2026-08-25", surface: "Local_Repository_Surface", applicability: "applicable", keyConvention: "guidance", versionSensitiveClaim: false, evidenceProvenanceRef: "prov-1", availability: "available", disposition: "retain", validationAction: "none", status: "reviewed" }], completeReviewStatement: COMPLETE_REVIEW_STATEMENT, complete: true, unavailableCandidateRefs: [], blockers: [] }, exclusions: { entries: [] }, artifactInventory: [{ artifactId: "artifact:lane-d-review", kind: "Kiro_Skill", path: ".kiro/skills/repo-map/SKILL.md", inventoryStatus: "present and readable", owner: "repository owner", configurationScope: "project", activationCondition: "after exact-surface validation", canonicalSource: "AGENTS.md", evidenceState: "Observed", disposition: "retain", maintenanceRisk: "low", evidenceRefs: ["src-1"], validationRunRefs: [], rollbackPath: "no rollback applies" }], compatibilityRecords: records, ownerDecisions: [...OWNER_DECISIONS], validationRuns: runs }, safety: { approvalBoundaries: [{ boundaryId: "ab-1", scope: "project", requestedChange: "x", targetSurface: "Local_Repository_Surface", owner: "repository owner", approvalStatus: "approved", approvalDate: "2026-08-25", preChangeStateRef: "snapshot:lane-d-review", securityBoundary: "x", expectedSideEffects: ["x"], rollbackPathRef: "y" }], policyFindings: [], snapshots: ["snapshot:lane-d-review"], knownGaps: { entries: [] }, rollbackRecords: [{ rollbackId: "rollback:lane-d-review", targetArtifactOrScope: "x", preChangeStateRef: "y", rollbackAction: "z", expectedSuccessSignal: "a", observedEvidence: "b", result: "pass", verificationRunRef: "c", owner: "d" }], proposedHandover: handover } });
console.log("seq bothReviewerStagesPass:", seq.bothReviewerStagesPass);
if (!seq.bothReviewerStagesPass) {
  console.log("ev result:", seq.evidenceReview.status, seq.evidenceReview.blockers);
  console.log("saf result:", seq.safetyReview?.status, seq.safetyReview?.blockers);
}
