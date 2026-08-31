import {
  COMPLETE_REVIEW_STATEMENT,
  type Availability,
  type CoverageEntry,
  type CoverageInput,
  type CoverageMatrix,
  type CoverageMatrixBuilder as CoverageMatrixBuilderContract,
  type CoverageResult,
  type DiscoveryMethod,
  type ExclusionEntry,
  type ExclusionRegister,
  type Identifier,
  type KiroSurface,
  type SourceRecord,
  type StageResult,
} from "./contracts";

const REPOSITORY_OWNER = "repository owner";
const OFFICIAL_DISCOVERY_SOURCE_PREFIX = "source:official:discovery:";

/**
 * Scope reasons and reconsideration triggers required for the initial local
 * adoption exclusions. A caller still records the concrete candidate source
 * and evidence reference through `createExclusionEntry`.
 */
export const INITIAL_EXCLUSION_POLICIES = {
  billingMarketingAndUnrelatedIntegrations: {
    reason: "No repository-local onboarding, configuration, execution, continuity, security, or maintenance effect.",
    scopeBoundary: "repository-local Kiro guidance and configuration",
    reconsiderationTrigger: "Owner adds an external-service or product-management scope.",
  },
  incompatibleCrewExecution: {
    reason: "Crew was uninstalled and the documented behavior conflicts with no-worktree, maximum-one-agent, and explicit-approval rules.",
    scopeBoundary: "local implementation wave; Crew execution remains outside the OD-04 exception",
    reconsiderationTrigger: "Owner approves a repository-compatible design and named surface.",
  },
  crewMemoryAndKnowledgeAsLocalLtmProof: {
    reason: "Crew capabilities do not prove that the local LTM capture implementation works.",
    scopeBoundary: "local LTM capture evidence",
    reconsiderationTrigger: "A supported local implementation and fresh validation are available, or the owner selects Crew.",
  },
  crewOnlyConfiguration: {
    reason: "Crew-specific scope is not the observed IDE/project scope.",
    scopeBoundary: "repository-local IDE/project adoption",
    reconsiderationTrigger: "Owner selects Cloud/Crew as an Active_Surface.",
  },
  webMobileHookAndGlobalConfiguration: {
    reason: "Web/Mobile do not use global configuration and do not support hooks.",
    scopeBoundary: "local hook and global-configuration adoption",
    reconsiderationTrigger: "Owner selects Web or Mobile and requests a surface-specific review.",
  },
} as const;

export interface ExclusionEntryInput {
  readonly exclusionId: Identifier;
  readonly candidateRef: Identifier;
  readonly family: string;
  readonly reason: string;
  readonly scopeBoundary: string;
  readonly owner?: string;
  readonly reviewDateUtc: string;
  readonly reconsiderationTrigger: string;
  readonly evidenceRef: Identifier;
}

function hasValue(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Coverage is intentionally limited to page candidates. The discovery-method
 * records for the official sitemap/search are evidence about how candidates
 * were found, not additional pages that need their own coverage row.
 */
function officialCandidates(candidates: readonly SourceRecord[]): readonly SourceRecord[] {
  return candidates.filter((candidate) =>
    candidate.kind === "official_url" && !candidate.sourceId.startsWith(OFFICIAL_DISCOVERY_SOURCE_PREFIX),
  );
}

function discoveryMethodFor(candidate: SourceRecord): DiscoveryMethod {
  switch (candidate.retrievalMethod) {
    case "official_sitemap":
      return "sitemap";
    case "official_search":
      return "official_search";
    default:
      return "linked_page";
  }
}

function surfaceFor(candidate: SourceRecord): KiroSurface {
  return candidate.surfaceApplicability[0] ?? "Local_Repository_Surface";
}

function availabilityIsUnavailable(availability: Availability): boolean {
  return availability !== "available";
}

function coverageIdFor(candidate: SourceRecord): Identifier {
  return `coverage:${candidate.sourceId.replace(/^source:/, "").replace(/[^A-Za-z0-9]+/g, "-")}`;
}

function unavailableLimitation(candidate: SourceRecord): string {
  return candidate.limitation ??
    `Candidate is ${candidate.availability}; an exact target retrieval and validation are required before it can be treated as available evidence.`;
}

function hasReviewEvidence(candidate: SourceRecord): boolean {
  return candidate.evidenceState === "Documented" ||
    candidate.evidenceState === "Observed" ||
    candidate.evidenceState === "Validated";
}

function pendingLimitation(candidate: SourceRecord): string {
  if (!hasReviewEvidence(candidate)) {
    return `Candidate evidence state is ${candidate.evidenceState}; documented, observed, or validated page evidence is required before review can complete.`;
  }
  if (candidate.surfaceApplicability.length === 0) {
    return "Candidate has no Active_Surface applicability; the target surface must be identified before review can complete.";
  }
  return "Candidate disposition requires an explicit Exclusion_Register entry before it can be excluded.";
}

function validateExclusion(entry: ExclusionEntry): string[] {
  const blockers: string[] = [];
  if (!hasValue(entry.exclusionId)) blockers.push("an exclusion requires exclusionId");
  if (!hasValue(entry.candidateRef)) blockers.push("an exclusion requires candidateRef");
  if (!hasValue(entry.family)) blockers.push(`exclusion ${entry.exclusionId || "unknown"} requires family`);
  if (!hasValue(entry.reason)) blockers.push(`exclusion ${entry.exclusionId || "unknown"} requires a scope reason`);
  if (!hasValue(entry.scopeBoundary)) blockers.push(`exclusion ${entry.exclusionId || "unknown"} requires scopeBoundary`);
  if (!hasValue(entry.owner)) blockers.push(`exclusion ${entry.exclusionId || "unknown"} requires an owner`);
  if (!isIsoDate(entry.reviewDateUtc)) blockers.push(`exclusion ${entry.exclusionId || "unknown"} requires an ISO review date`);
  if (!hasValue(entry.reconsiderationTrigger)) blockers.push(`exclusion ${entry.exclusionId || "unknown"} requires a reconsideration trigger`);
  if (!hasValue(entry.evidenceRef)) blockers.push(`exclusion ${entry.exclusionId || "unknown"} requires evidenceRef`);
  if (entry.status !== "excluded") blockers.push(`exclusion ${entry.exclusionId || "unknown"} must have excluded status`);
  return blockers;
}

/** Builds one validated exclusion record without inferring that a relevant unavailable page is out of scope. */
export function createExclusionEntry(input: ExclusionEntryInput): StageResult<ExclusionEntry> {
  const entry: ExclusionEntry = {
    ...input,
    owner: input.owner ?? REPOSITORY_OWNER,
    status: "excluded",
  };
  const blockers = validateExclusion(entry);

  if (blockers.length > 0) {
    return { status: "blocked", output: entry, blockers, evidenceRefs: [] };
  }

  return { status: "pass", output: entry, blockers: [], evidenceRefs: [entry.evidenceRef] };
}

/** Validates a register while preserving every supplied exclusion record. */
export function buildExclusionRegister(entries: readonly ExclusionEntry[]): StageResult<ExclusionRegister> {
  const blockers = entries.flatMap(validateExclusion);
  const identifiers = new Set<string>();
  const candidateRefs = new Set<string>();

  for (const entry of entries) {
    if (identifiers.has(entry.exclusionId)) blockers.push(`duplicate exclusion ID ${entry.exclusionId}`);
    if (candidateRefs.has(entry.candidateRef)) blockers.push(`duplicate exclusion candidate reference ${entry.candidateRef}`);
    identifiers.add(entry.exclusionId);
    candidateRefs.add(entry.candidateRef);
  }

  const output: ExclusionRegister = { entries };
  if (blockers.length > 0) return { status: "blocked", output, blockers, evidenceRefs: entries.map((entry) => entry.evidenceRef) };
  return { status: "pass", output, blockers: [], evidenceRefs: entries.map((entry) => entry.evidenceRef) };
}

function entryFor(
  candidate: SourceRecord,
  excludedCandidateRefs: ReadonlySet<Identifier>,
  reviewDateUtc: string,
): CoverageEntry {
  const unavailable = availabilityIsUnavailable(candidate.availability);
  const explicitlyExcluded = excludedCandidateRefs.has(candidate.sourceId);
  const pending = !unavailable &&
    (!hasReviewEvidence(candidate) ||
      candidate.surfaceApplicability.length === 0 ||
      candidate.disposition === "exclude");
  const status = unavailable
    ? "unavailable"
    : explicitlyExcluded
      ? "excluded"
      : pending
        ? "pending"
        : "reviewed";

  return {
    coverageId: coverageIdFor(candidate),
    sourceId: candidate.sourceId,
    url: candidate.locator,
    ...(candidate.canonicalLocator ? { canonicalUrl: candidate.canonicalLocator } : {}),
    ...(candidate.title ? { currentTitle: candidate.title } : {}),
    family: candidate.officialDocumentationFamily ?? "Unclassified official documentation",
    discoveryMethod: discoveryMethodFor(candidate),
    reviewDateUtc,
    surface: surfaceFor(candidate),
    applicability: candidate.surfaceApplicability.length > 0 ? "applicable" : "unresolved",
    keyConvention: candidate.claims[0] ?? "No convention extracted; review remains pending.",
    versionSensitiveClaim: candidate.versionSensitiveClaim,
    evidenceProvenanceRef: candidate.sourceId,
    availability: candidate.availability,
    disposition: unavailable ? "observe" : explicitlyExcluded ? "exclude" : pending ? "observe" : candidate.disposition,
    validationAction: unavailable
      ? "Record an Unverified_Finding and run the next exact-surface validation."
      : pending
        ? "Obtain fresh exact-target evidence before marking this candidate reviewed."
        : "Validate any local compatibility claim on the exact target surface/version.",
    status,
    ...(unavailable
      ? { limitation: unavailableLimitation(candidate) }
      : pending
        ? { limitation: pendingLimitation(candidate) }
        : candidate.limitation
          ? { limitation: candidate.limitation }
          : {}),
  };
}

function validateCandidates(candidates: readonly SourceRecord[]): string[] {
  const blockers: string[] = [];
  const sourceIds = new Set<Identifier>();
  const coverageIds = new Set<Identifier>();

  for (const candidate of candidates) {
    if (sourceIds.has(candidate.sourceId)) blockers.push(`duplicate discovered official candidate ${candidate.sourceId}`);
    sourceIds.add(candidate.sourceId);

    if (!hasValue(candidate.sourceId)) blockers.push("discovered official candidate requires sourceId");
    if (!hasValue(candidate.locator)) blockers.push(`candidate ${candidate.sourceId || "unknown"} requires URL`);
    if (!hasValue(candidate.officialDocumentationFamily)) blockers.push(`candidate ${candidate.sourceId || "unknown"} requires an official documentation family`);
    if (!isIsoDate(candidate.reviewDateUtc)) blockers.push(`candidate ${candidate.sourceId || "unknown"} requires an ISO review date`);

    const coverageId = coverageIdFor(candidate);
    if (coverageIds.has(coverageId)) blockers.push(`duplicate coverage ID ${coverageId} for discovered official candidates`);
    coverageIds.add(coverageId);

    if (availabilityIsUnavailable(candidate.availability) && candidate.evidenceState !== "Unverified") {
      blockers.push(`candidate ${candidate.sourceId || "unknown"} is ${candidate.availability} but is not Unverified`);
    }
  }

  return blockers;
}

function validateExclusionsAgainstCandidates(
  candidates: readonly SourceRecord[],
  exclusions: readonly ExclusionEntry[],
): string[] {
  const blockers: string[] = [];
  const candidateById = new Map(candidates.map((candidate) => [candidate.sourceId, candidate]));
  const excludedCandidateRefs = new Set(exclusions.map((exclusion) => exclusion.candidateRef));

  for (const candidate of candidates) {
    if (candidate.disposition === "exclude" && !excludedCandidateRefs.has(candidate.sourceId)) {
      blockers.push(`candidate ${candidate.sourceId} requests exclusion without an Exclusion_Register entry`);
    }
  }

  for (const exclusion of exclusions) {
    const candidate = candidateById.get(exclusion.candidateRef);
    if (!candidate) {
      blockers.push(`exclusion ${exclusion.exclusionId} references an undiscovered official candidate ${exclusion.candidateRef}`);
      continue;
    }

    if (candidate.officialDocumentationFamily !== exclusion.family) {
      blockers.push(`exclusion ${exclusion.exclusionId} family does not match candidate ${exclusion.candidateRef}`);
    }
    if (availabilityIsUnavailable(candidate.availability)) {
      blockers.push(`candidate ${candidate.sourceId} is ${candidate.availability} and must remain unavailable Unverified, not excluded`);
      if (candidate.disposition === "exclude") {
        blockers.push(`candidate ${candidate.sourceId} has an exclusion disposition despite unavailable evidence`);
      }
    }
  }

  return blockers;
}

function validateInput(input: CoverageInput): string[] {
  const blockers: string[] = [];
  if (!isIsoDate(input.reviewDateUtc)) blockers.push("reviewDateUtc must be an ISO date or ISO UTC timestamp");
  return blockers;
}

export class CoverageMatrixBuilder implements CoverageMatrixBuilderContract {
  build(input: CoverageInput): StageResult<CoverageResult> {
    const candidates = officialCandidates(input.candidates);
    const registerResult = buildExclusionRegister(input.exclusions);
    const exclusionBlockers = validateExclusionsAgainstCandidates(candidates, input.exclusions);
    const blockers = [
      ...validateInput(input),
      ...validateCandidates(candidates),
      ...registerResult.blockers,
      ...exclusionBlockers,
    ];
    const exclusionValidationPassed = registerResult.status === "pass" && exclusionBlockers.length === 0;
    const excludedCandidateRefs = exclusionValidationPassed
      ? new Set(input.exclusions.map((exclusion) => exclusion.candidateRef))
      : new Set<Identifier>();
    const entries = candidates.map((candidate) => entryFor(candidate, excludedCandidateRefs, input.reviewDateUtc));
    const candidateRefs = new Set(candidates.map((candidate) => candidate.sourceId));
    const entryRefs = new Set(entries.map((entry) => entry.sourceId));
    const candidateCoverageIsOneToOne = entries.length === candidates.length &&
      candidateRefs.size === candidates.length &&
      entryRefs.size === candidates.length &&
      candidates.every((candidate) => entryRefs.has(candidate.sourceId));
    const unavailableCandidateRefs = entries
      .filter((entry) => entry.status === "unavailable")
      .map((entry) => entry.sourceId);
    const completeStatuses = new Set(["reviewed", "excluded", "unavailable"]);
    const complete = blockers.length === 0 &&
      candidateCoverageIsOneToOne &&
      entries.every((entry) => completeStatuses.has(entry.status));
    const matrix: CoverageMatrix = {
      entries,
      completeReviewStatement: complete ? COMPLETE_REVIEW_STATEMENT : "",
      complete,
      unavailableCandidateRefs,
      blockers,
    };
    const output: CoverageResult = {
      matrix,
      exclusions: registerResult.output ?? { entries: input.exclusions },
      blockers,
    };
    const evidenceRefs = [
      ...entries.map((entry) => entry.sourceId),
      ...input.exclusions.map((exclusion) => exclusion.evidenceRef),
    ];

    if (!complete) {
      return {
        status: "partial",
        output,
        blockers,
        evidenceRefs: [...new Set(evidenceRefs)],
      };
    }

    return {
      status: "pass",
      output,
      blockers: [],
      evidenceRefs: [...new Set(evidenceRefs)],
    };
  }
}

export const coverageMatrixBuilder = new CoverageMatrixBuilder();
export const buildCoverageMatrix = (input: CoverageInput): StageResult<CoverageResult> =>
  coverageMatrixBuilder.build(input);

export default coverageMatrixBuilder;
