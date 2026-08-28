// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  buildCoverageMatrix,
  buildExclusionRegister,
  createExclusionEntry,
} from "../../coverage.ts
import { COMPLETE_REVIEW_STATEMENT, type SourceRecord } from "../../contracts.ts

function candidate(
  sourceId: string,
  overrides: Partial<SourceRecord> = {},
): SourceRecord {
  return {
    sourceId,
    kind: "official_url",
    locator: `https://kiro.dev/docs/${sourceId.replaceAll(":", "/")}/`,
    title: sourceId,
    officialDocumentationFamily: "Skills",
    reviewDateUtc: "2026-08-25",
    retrievalMethod: "official_sitemap",
    surfaceApplicability: ["IDE"],
    versionSensitiveClaim: true,
    availability: "available",
    evidenceState: "Documented",
    provenance: {
      observer: "test",
      cwdOrSurface: "IDE",
      commandOrPath: "official sitemap",
      result: "candidate discovered",
    },
    trustDecision: "trusted",
    claims: ["manifest convention"],
    validationRunRefs: [],
    disposition: "observe",
    ...overrides,
  };
}

describe("CoverageMatrixBuilder", () => {
  // Validates: Requirements 1.2–1.5, 3.1, 11.1, 13.3, 13.6
  it("creates one reviewed, unavailable, or excluded coverage row per discovered official candidate", () => {
    const excluded = candidate("source:official:candidate:billing", {
      officialDocumentationFamily: "Billing",
    });
    const exclusion = createExclusionEntry({
      exclusionId: "EX-test-01",
      candidateRef: excluded.sourceId,
      family: "Billing",
      reason: "No repository-local maintenance effect.",
      scopeBoundary: "repository-local Kiro guidance",
      reviewDateUtc: "2026-08-25",
      reconsiderationTrigger: "Owner adds product-management scope.",
      evidenceRef: excluded.sourceId,
    });

    expect(exclusion.status).toBe("pass");
    const result = buildCoverageMatrix({
      candidates: [
        candidate("source:official:candidate:skills"),
        candidate("source:official:candidate:cli-v3", {
          availability: "inaccessible",
          evidenceState: "Unverified",
          limitation: "No local CLI 3.x validation.",
        }),
        excluded,
      ],
      exclusions: exclusion.output ? [exclusion.output] : [],
      reviewDateUtc: "2026-08-25",
    });

    expect(result.status).toBe("pass");
    expect(result.output?.matrix.entries).toHaveLength(3);
    expect(result.output?.matrix.entries.map((entry) => entry.status)).toEqual([
      "reviewed",
      "unavailable",
      "excluded",
    ]);
    expect(result.output?.matrix.unavailableCandidateRefs).toEqual([
      "source:official:candidate:cli-v3",
    ]);
    expect(result.output?.matrix.complete).toBe(true);
    expect(result.output?.matrix.completeReviewStatement).toBe(COMPLETE_REVIEW_STATEMENT);
    expect(result.output?.exclusions.entries[0]?.owner).toBe("repository owner");
    expect(result.output?.exclusions.entries[0]?.status).toBe("excluded");
  });

  it("keeps relevant inaccessible candidates unavailable rather than silently excluding them", () => {
    const inaccessible = candidate("source:official:candidate:hooks", {
      availability: "redirected",
      evidenceState: "Unverified",
    });
    const result = buildCoverageMatrix({
      candidates: [inaccessible],
      exclusions: [],
      reviewDateUtc: "2026-08-25",
    });

    expect(result.status).toBe("pass");
    expect(result.output?.matrix.entries[0]).toMatchObject({
      sourceId: inaccessible.sourceId,
      status: "unavailable",
      disposition: "observe",
      availability: "redirected",
    });
    expect(result.output?.matrix.unavailableCandidateRefs).toEqual([inaccessible.sourceId]);
  });

  it("fails closed and withholds the completion statement for invalid exclusions", () => {
    const candidateRecord = candidate("source:official:candidate:skills");
    const invalidRegister = buildExclusionRegister([
      {
        exclusionId: "EX-test-02",
        candidateRef: "source:official:candidate:missing",
        family: "Skills",
        reason: "out of scope",
        scopeBoundary: "local scope",
        owner: "repository owner",
        reviewDateUtc: "2026-08-25",
        reconsiderationTrigger: "owner approval",
        evidenceRef: "source:official:candidate:missing",
        status: "excluded",
      },
    ]);
    expect(invalidRegister.status).toBe("pass");

    const result = buildCoverageMatrix({
      candidates: [candidateRecord],
      exclusions: invalidRegister.output?.entries ?? [],
      reviewDateUtc: "2026-08-25",
    });

    expect(result.status).toBe("partial");
    expect(result.output?.matrix.complete).toBe(false);
    expect(result.output?.matrix.completeReviewStatement).toBe("");
    expect(result.blockers).toContain(
      "exclusion EX-test-02 references an undiscovered official candidate source:official:candidate:missing",
    );
  });
});
