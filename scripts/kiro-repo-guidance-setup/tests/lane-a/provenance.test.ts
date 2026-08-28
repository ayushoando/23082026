// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  authorityResolver,
  hashSafeArtifact,
  provenanceLedger,
} from "../../provenance.ts
import type { AuthorityClaim, SourceRecord } from "../../contracts.ts

function source(): SourceRecord {
  return {
    sourceId: "source:fixture",
    kind: "repository_file",
    locator: "https://private.example.internal/audit?token=secret-value",
    reviewDateUtc: "2026-08-25T00:00:00.000Z",
    retrievalMethod: "file_read",
    surfaceApplicability: ["Local_Repository_Surface"],
    versionSensitiveClaim: false,
    availability: "available",
    evidenceState: "Observed",
    provenance: {
      observer: "maintainer@example.com",
      cwdOrSurface: "D:/repo",
      commandOrPath: "AGENTS.md",
      result: "authorization=Bearer abc.def; token=secret-value",
    },
    trustDecision: "trusted",
    claims: ["token=secret-value"],
    validationRunRefs: [],
    disposition: "observe",
  };
}

function claim(
  claimId: string,
  sourceRank: AuthorityClaim["sourceRank"],
  evidenceState: AuthorityClaim["evidenceState"] = "Observed",
): AuthorityClaim {
  return {
    claimId,
    sourceRef: "source:fixture",
    sourceRank,
    claim: `${claimId} claim`,
    evidenceState,
    provenanceRef: `provenance:${claimId}`,
  };
}

describe("ProvenanceLedger", () => {
  // Validates: Requirements 2.3–2.5, 3.1, 3.4–3.6, 14.1, 14.3
  it("redacts secrets, private URLs, and personal data without mutating the input source", () => {
    const input = source();
    const result = provenanceLedger.record({ source: input, claims: [] });

    expect(result.status).toBe("pass");
    expect(JSON.stringify(result.output)).not.toContain("secret-value");
    expect(JSON.stringify(result.output)).not.toContain("abc.def");
    expect(JSON.stringify(result.output)).not.toContain("maintainer@example.com");
    expect(JSON.stringify(result.output)).not.toContain("private.example.internal");
    expect(input.provenance.observer).toBe("maintainer@example.com");
  });

  it("blocks claim records that refer to another source and hashes only redacted content", () => {
    const otherSourceClaim = { ...claim("claim:other", "AGENTS.md"), sourceRef: "source:other" };
    const result = provenanceLedger.record({ source: source(), claims: [otherSourceClaim] });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toEqual(["claim claim:other does not reference source source:fixture"]);
    expect(hashSafeArtifact("token=secret-value")).not.toContain("secret-value");
  });
});

describe("AuthorityResolver", () => {
  // Validates: Requirements 2.3, 3.3, 3.6, 14.6–14.7
  it("selects the highest authority claim and retains all lower authority claims as context", () => {
    const historical = { ...claim("claim:historical", "historical_evidence"), unresolvedImpact: "requires fresh validation" };
    const agents = claim("claim:agents", "Agents/*");
    const user = claim("claim:user", "user");
    const result = authorityResolver.resolve({ resolutionId: "resolution:authority", claims: [historical, agents, user] });

    expect(result.status).toBe("pass");
    expect(result.output?.selectedClaimRef).toBe("claim:user");
    expect(result.output?.losingClaimRefs).toEqual(["claim:agents", "claim:historical"]);
    expect(result.output?.claims).toEqual([historical, agents, user]);
    expect(result.output?.unresolvedImpact).toBe("requires fresh validation");
  });

  it("does not upgrade an unverified selected claim and fails closed for incomplete input", () => {
    const unverified = claim("claim:agents", "AGENTS.md", "Unverified");
    const result = authorityResolver.resolve({ resolutionId: "resolution:unverified", claims: [unverified] });
    const incomplete = authorityResolver.resolve({ resolutionId: "resolution:invalid", claims: [{ ...unverified, claim: "" }] });

    expect(result.status).toBe("pass");
    expect(result.output?.rationale).toContain("remains Unverified");
    expect(incomplete.status).toBe("blocked");
  });
});
