import { createHash } from "node:crypto";

import {
  type AuthorityClaim,
  type AuthorityResolution,
  type AuthorityResolutionInput,
  type AuthorityResolver as AuthorityResolverContract,
  type EvidenceProvenance,
  type ProvenanceInput,
  type ProvenanceLedger as ProvenanceLedgerContract,
  type SourceRecord,
  type StageResult,
} from "./contracts";

const AUTHORITY_ORDER = [
  "user",
  "live_code_or_fresh_command",
  "AGENTS.md",
  "Agents/*",
  "canonical_docs/*",
  "official_documentation",
  "active_plan",
  "handover_note",
  "historical_evidence",
] as const;

const AUTHORIZATION_VALUE_PATTERN = /(authorization\s*[:=]\s*)(?:Bearer\s+)?[^\s,;]+/gi;
const SECRET_VALUE_PATTERN = /((?:token|secret|password|api[_-]?key)\s*[:=]\s*)([^\s,;]+)/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const URL_SECRET_PATTERN = /([?&](?:token|secret|password|api[_-]?key|auth|signature)=[^&#\s]*)/gi;
const URL_CREDENTIAL_PATTERN = /(https?:\/\/)([^/@\s]+):([^/@\s]+)@/gi;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PRIVATE_URL_PATTERN = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|[A-Za-z0-9.-]+\.(?:internal|local|private))(?::\d+)?(?:\/[^\s"']*)?/gi;

function redactText(value: string): string {
  return value
    .replace(URL_CREDENTIAL_PATTERN, "$1[REDACTED]@")
    .replace(URL_SECRET_PATTERN, "[REDACTED]")
    .replace(PRIVATE_URL_PATTERN, "[REDACTED_PRIVATE_URL]")
    .replace(AUTHORIZATION_VALUE_PATTERN, "$1[REDACTED]")
    .replace(SECRET_VALUE_PATTERN, "$1[REDACTED]")
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]");
}

function redactProvenance(provenance: EvidenceProvenance): EvidenceProvenance {
  return {
    observer: redactText(provenance.observer),
    cwdOrSurface: redactText(provenance.cwdOrSurface),
    commandOrPath: redactText(provenance.commandOrPath),
    result: redactText(provenance.result),
    ...(provenance.integrityBasis ? { integrityBasis: redactText(provenance.integrityBasis) } : {}),
  };
}

function authorityIndex(claim: AuthorityClaim): number {
  const index = AUTHORITY_ORDER.indexOf(claim.sourceRank as (typeof AUTHORITY_ORDER)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function validClaim(claim: AuthorityClaim): boolean {
  return claim.claimId.trim().length > 0 &&
    claim.sourceRef.trim().length > 0 &&
    claim.claim.trim().length > 0 &&
    claim.provenanceRef.trim().length > 0;
}

/**
 * Produces a content hash only after all persisted secret and personal-data
 * values have been redacted. Callers opt in by providing the bytes; this
 * module never reads arbitrary artifact paths or emits their original text.
 */
export function hashSafeArtifact(content: string): string {
  return `sha256:${createHash("sha256").update(redactText(content), "utf8").digest("hex")}`;
}

/** Redacts evidence before it enters the append-only source projection. */
export class ProvenanceLedger implements ProvenanceLedgerContract {
  record(input: ProvenanceInput): StageResult<SourceRecord> {
    if (!input.source.sourceId.trim()) {
      return { status: "blocked", blockers: ["sourceId is required"], evidenceRefs: [] };
    }

    const source: SourceRecord = {
      ...input.source,
      locator: redactText(input.source.locator),
      ...(input.source.canonicalLocator ? { canonicalLocator: redactText(input.source.canonicalLocator) } : {}),
      ...(input.source.title ? { title: redactText(input.source.title) } : {}),
      ...(input.source.displayedDate ? { displayedDate: redactText(input.source.displayedDate) } : {}),
      provenance: redactProvenance(input.source.provenance),
      claims: input.source.claims.map(redactText),
      ...(input.source.limitation ? { limitation: redactText(input.source.limitation) } : {}),
    };

    const blockers = input.claims
      .filter((claim) => claim.sourceRef !== input.source.sourceId)
      .map((claim) => `claim ${claim.claimId} does not reference source ${input.source.sourceId}`);

    if (blockers.length > 0) {
      return { status: "blocked", output: source, blockers, evidenceRefs: [source.sourceId] };
    }

    return { status: "pass", output: source, blockers: [], evidenceRefs: [source.sourceId] };
  }
}

/**
 * Resolves a claim strictly by repository authority while retaining all losing
 * claims. Official, plan, handover, and historical entries remain contextual
 * unless no higher ranked applicable claim exists.
 */
export class AuthorityResolver implements AuthorityResolverContract {
  resolve(input: AuthorityResolutionInput): StageResult<AuthorityResolution> {
    if (!input.resolutionId.trim()) {
      return { status: "blocked", blockers: ["resolutionId is required"], evidenceRefs: [] };
    }
    if (input.claims.length === 0) {
      return { status: "blocked", blockers: ["at least one authority claim is required"], evidenceRefs: [] };
    }

    const invalidClaims = input.claims.filter((claim) => !validClaim(claim));
    if (invalidClaims.length > 0) {
      return {
        status: "blocked",
        blockers: invalidClaims.map((claim) => `claim ${claim.claimId || "<missing>"} is incomplete`),
        evidenceRefs: invalidClaims.map((claim) => claim.claimId).filter(Boolean),
      };
    }

    const orderedClaims = [...input.claims].sort((left, right) => authorityIndex(left) - authorityIndex(right));
    const selected = orderedClaims[0];
    const losingClaimRefs = orderedClaims
      .filter((claim) => claim.claimId !== selected.claimId)
      .map((claim) => claim.claimId);
    const unresolvedImpact = orderedClaims
      .map((claim) => claim.unresolvedImpact)
      .find((impact): impact is string => typeof impact === "string" && impact.trim().length > 0);
    const selectedIsUnverified = selected.evidenceState === "Unverified";

    const output: AuthorityResolution = {
      resolutionId: input.resolutionId,
      claims: input.claims,
      selectedClaimRef: selected.claimId,
      losingClaimRefs,
      rationale: selectedIsUnverified
        ? `Selected ${selected.claimId} by authority rank, but its claim remains Unverified until fresh confirmation.`
        : `Selected ${selected.claimId} by authority order: ${AUTHORITY_ORDER.join(" > ")}.`,
      ...(unresolvedImpact ? { unresolvedImpact } : {}),
    };

    return {
      status: "pass",
      output,
      blockers: [],
      evidenceRefs: input.claims.map((claim) => claim.provenanceRef),
    };
  }
}

export const provenanceLedger = new ProvenanceLedger();
export const authorityResolver = new AuthorityResolver();
export const recordProvenance = (input: ProvenanceInput): StageResult<SourceRecord> => provenanceLedger.record(input);
export const resolveAuthority = (input: AuthorityResolutionInput): StageResult<AuthorityResolution> => authorityResolver.resolve(input);

export default provenanceLedger;
