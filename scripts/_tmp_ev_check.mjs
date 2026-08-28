import { EvidenceCompatibilityReviewerService } from "../.kiro/kiro-repo-guidance-setup/reviewers.ts";
import { COMPLETE_REVIEW_STATEMENT, OWNER_DECISIONS, REQUIRED_SURFACE_VERSIONS } from "../.kiro/kiro-repo-guidance-setup/contracts.ts";

function passingRun(surface) {
  const sv = REQUIRED_SURFACE_VERSIONS.find(s => s.surface === surface);
  return { validationId: `validation-${surface}-${sv.version}`, action: "surface", repositoryRootOrActiveSurface: surface, surface, version: sv.version, scope: "enablement-fixture", executionLayer: "surface_validation", startedAtUtc: "2026-08-25T00:00:00.000Z", result: "pass", commandOrInteraction: "fresh exact-target validation", exitCodeOrOutcome: "exit 0", evidenceRefs: [`evidence-${surface}`], unverifiedItems: [], blocker: "none" };
}

const compatibilityRecordsBase = { status: "Unverified", documentedBehavior: [], observedBehavior: [], evidenceFreshness: "none", versionSensitiveClaim: false, validationAction: "x", validationRunRefs: [], enablementStatus: "blocked", unsupportedClaims: [], migrationConstraints: [] };

function compatibilityRecord(surface, overrides = {}) {
  const sv = REQUIRED_SURFACE_VERSIONS.find(s => s.surface === surface);
  return { ...sv, ...compatibilityRecordsBase, rollbackPathRef: `rollback-${surface}`, ...overrides };
}

function completeCompatibilityRecords() {
  return REQUIRED_SURFACE_VERSIONS.map(sv => {
    const run = passingRun(sv.surface);
    return compatibilityRecord(sv.surface, { status: "applicable", enablementStatus: "enabled-valid", evidenceFreshness: "fresh", validationRunRefs: [run.validationId] });
  });
}

function completeValidationRuns() { return REQUIRED_SURFACE_VERSIONS.map(sv => passingRun(sv.surface)); }

function sourceInventory() { return { reviewDateUtc: "2026-08-25", activeSurfaces: ["Local_Repository_Surface"], discoveryMethod: "file_read", records: [{ sourceId: "src-1", kind: "repository_file", locator: "AGENTS.md", reviewDateUtc: "2026-08-25", retrievalMethod: "file_read", surfaceApplicability: ["Local_Repository_Surface"], versionSensitiveClaim: false, availability: "available", evidenceState: "Documented", provenance: { observer: "enablement-fixture", cwdOrSurface: "D:\\23082026", commandOrPath: "AGENTS.md", result: "read" }, trustDecision: "trusted", claims: [], validationRunRefs: [], disposition: "retain" }], unavailableFindings: [] }; }

const req = {
  inputStageRef: "integration-gate-1", sourceInventory: sourceInventory(),
  coverageMatrix: { entries: [{ coverageId: "cov-1", sourceId: "src-1", url: "https://kiro.dev/docs", family: "docs", discoveryMethod: "sitemap", reviewDateUtc: "2026-08-25", surface: "Local_Repository_Surface", applicability: "applicable", keyConvention: "guidance", versionSensitiveClaim: false, evidenceProvenanceRef: "prov-1", availability: "available", disposition: "retain", validationAction: "none", status: "reviewed" }], completeReviewStatement: COMPLETE_REVIEW_STATEMENT, complete: true, unavailableCandidateRefs: [], blockers: [] },
  exclusions: { entries: [] }, artifactInventory: [{ artifactId: "artifact:enablement-review", kind: "Kiro_Skill", path: ".kiro/skills/repo-map/SKILL.md", inventoryStatus: "present and readable", owner: "repository owner", configurationScope: "project", activationCondition: "after exact-surface validation", canonicalSource: "AGENTS.md", evidenceState: "Observed", disposition: "retain", maintenanceRisk: "low", evidenceRefs: ["src-1"], validationRunRefs: [], rollbackPath: "no rollback applies" }],
  compatibilityRecords: completeCompatibilityRecords(), ownerDecisions: [...OWNER_DECISIONS], validationRuns: completeValidationRuns()
};

const ev = new EvidenceCompatibilityReviewerService().review(req);
console.log("ev status:", ev.status);
if (ev.status !== "pass") console.log("blockers:", JSON.stringify(ev.blockers.slice(0,3)));
