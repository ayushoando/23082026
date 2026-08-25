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
const OFFICIAL_SOURCE_PREFIX = "source:official:";

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

function officialCandidates(candidates: readonly SourceRecord[]): readonly SourceRecord[] {
  return candidates.filter((candidate) =>
    candidate.kind === "official_url" && candidate.sourceId.startsWith(OFFICIAL_SOURCE_PREFIX),
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

function entryFor(candidate: SourceRecord, excludedCandidateRefs: ReadonlySet<Identifier>): CoverageEntry {
  const excluded = excludedCandidateRefs.has(candidate.sourceId);
  const unavailable = availabilityIsUnavailable(candidate.availability);
  const status = excluded ? "excluded" : unavailable ? "unavailable" : "reviewed";

  return {
    coverageId: coverageIdFor(candidate),
    sourceId: candidate.sourceId,
    url: candidate.locator,
    ...(candidate.canonicalLocator ? { canonicalUrl: candidate.canonicalLocator } : {}),
    ...(candidate.title ? { currentTitle: candidate.title } : {}),
    family: candidate.officialDocumentationFamily ?? "Unclassified official documentation",
    discoveryMethod: discoveryMethodFor(candidate),
    reviewDateUtc: candidate.reviewDateUtc,
    surface: surfaceFor(candidate),
    applicability: candidate.surfaceApplicability.length > 0 ? "applicable" : "unresolved",
    keyConvention: candidate.claims[0] ?? "No convention extracted; review remains pending.",
    versionSensitiveClaim: candidate.versionSensitiveClaim,
    evidenceProvenanceRef: candidate.sourceId,
    availability: candidate.availability,
    disposition: excluded ? "exclude" : candidate.disposition,
    validationAction: unavailable
      ? "Record an Unverified_Finding and run the next exact-surface validation."
      : "Validate any local compatibility claim on the exact target surface/version.",
    status,
    ...(candidate.limitation ? { limitation: candidate.limitation } : {}),
  };
}

function validateCandidates(candidates: readonly SourceRecord[]): string[] {
  const blockers: string[] = [];
  const sourceIds = new Set<Identifier>();

  for (const candidate of candidates) {
    if (sourceIds.has(candidate.sourceId)) blockers.push(`duplicate discovered official candidate ${candidate.sourceId}`);
    sourceIds.add(candidate.sourceId);
    if (!hasValue(candidate.sourceId)) blockers.push("discovered official candidate requires sourceId");
    if (!hasValue(candidate.locator)) blockers.push(`candidate ${candidate.sourceId || "unknown"} requires URL`);
    if (!hasValue(candidate.officialDocumentationFamily)) blockers.push(`candidate ${candidate.sourceId || "unknown"} requires an official documentation family`);
    if (!isIsoDate(candidate.reviewDateUtc)) blockers.push(`candidate ${candidate.sourceId || "unknown"} requires an ISO review date`);
  }

  return blockers;
}

export class CoverageMatrixBuilder implements CoverageMatrixBuilderContract {
  build(input: CoverageInput): StageResult<CoverageResult> {
    const candidates = officialCandidates(input.candidates);
    const registerResult = buildExclusionRegister(input.exclusions);
    const blockers = [...validateCandidates(candidates), ...registerResult.blockers];
    const candidateRefs = new Set(candidates.map((candidate) => candidate.sourceId));

    for (const exclusion of input.exclusions) {
      if (!candidateRefs.has(exclusion.candidateRef)) {
        blockers.push(`exclusion ${exclusion.exclusionId} references an undiscovered official candidate ${exclusion.candidateRef}`);
      }
    }

    const excludedCandidateRefs = new Set(input.exclusions.map((exclusion) => exclusion.candidateRef));
    const entries = candidates.map((candidate) => entryFor(candidate, excludedCandidateRefs));
    const unavailableCandidateRefs = entries
      .filter((entry) => entry.status === "unavailable")
      .map((entry) => entry.sourceId);
    const hasPendingEntry = entries.some((entry) => entry.status === "pending");
    const complete = blockers.length === 0 && !hasPendingEntry && entries.length === candidates.length;
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

    if (!complete) {
      return {
        status: "partial",
        output,
        blockers,
        evidenceRefs: entries.map((entry) => entry.sourceId),
      };
    }

    return {
      status: "pass",
      output,
      blockers: [],
      evidenceRefs: entries.map((entry) => entry.sourceId),
    };
  }
}

export const coverageMatrixBuilder = new CoverageMatrixBuilder();
export const buildCoverageMatrix = (input: CoverageInput): StageResult<CoverageResult> =>
  coverageMatrixBuilder.build(input);

export default coverageMatrixBuilder;
