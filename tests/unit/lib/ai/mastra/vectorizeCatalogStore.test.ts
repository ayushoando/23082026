import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock @mastra/core/vector so the import doesn't pull real Mastra deps
vi.mock("@mastra/core/vector", () => {
  class MastraVector {
    constructor(_opts: { id: string }) {}
  }
  return { MastraVector };
});

describe("VectorizeCatalogStore", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports catalog_nav and 768-d embedder constant", async () => {
    const { CATALOG_VECTOR_INDEX_NAME } = await import("@/lib/ai/mastra/vectorizeCatalogStore");
    const { CATALOG_EMBEDDING_DIMENSION } = await import("@/lib/ai/mastra/embedder");
    expect(CATALOG_VECTOR_INDEX_NAME).toBe("catalog_nav");
    expect(CATALOG_EMBEDDING_DIMENSION).toBe(768);
  });

  it("can be instantiated without env vars (returns empty for all operations)", async () => {
    const { VectorizeCatalogStore } = await import("@/lib/ai/mastra/vectorizeCatalogStore");
    const store = new VectorizeCatalogStore();
    expect(store).toBeDefined();

    // Without CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN, all ops return empty
    const indexes = await store.listIndexes();
    expect(indexes).toEqual([]);

    const results = await store.query({
      indexName: "catalog_nav",
      queryVector: [0.1, 0.2],
      topK: 5,
    });
    expect(results).toEqual([]);

    const ids = await store.upsert({
      indexName: "catalog_nav",
      vectors: [[0.1, 0.2]],
      ids: ["test-1"],
    });
    expect(ids).toEqual([]);
  });

  it("getCatalogVectorStore returns a singleton", async () => {
    const { getCatalogVectorStore } = await import("@/lib/ai/mastra/vectorizeCatalogStore");
    const store1 = getCatalogVectorStore();
    const store2 = getCatalogVectorStore();
    expect(store1).toBe(store2);
  });
});

// =============================================================================
// Property tests — governance (unchanged from LanceDB test, pure logic)
// =============================================================================

type ProposedMutation = {
  package: string;
  proposedVersion: string;
  approver: string | undefined;
  exactPin: string | undefined;
  compatibilityReview: boolean | undefined;
  supplyChainReview: boolean | undefined;
  rollbackPlan: string | undefined;
};

type PhaseDecisionRecord = {
  id: string;
  approvalAuthority: string | undefined;
  decisionDate: string | undefined;
  affectedSurface: string | undefined;
  status: "pending" | "approved" | "rejected" | "superseded" | undefined;
  acceptanceCondition: string | undefined;
  rollbackOwner: string | undefined;
};

const proposedMutationArb = fc.record({
  package: fc.constantFrom(
    "@lancedb/lancedb",
    "@mastra/core",
    "@mastra/rag",
    "@ai-sdk/amazon-bedrock",
    "ai",
  ),
  proposedVersion: fc.stringMatching(/^\d+\.\d+\.\d+$/),
  approver: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: undefined }),
  exactPin: fc.option(fc.stringMatching(/^\d+\.\d+\.\d+$/), { nil: undefined }),
  compatibilityReview: fc.option(fc.boolean(), { nil: undefined }),
  supplyChainReview: fc.option(fc.boolean(), { nil: undefined }),
  rollbackPlan: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
});

const phaseDecisionRecordArb = fc.record({
  id: fc.stringMatching(/^[A-Z]+-\d+$/),
  approvalAuthority: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: undefined }),
  decisionDate: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  affectedSurface: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  status: fc.option(
    fc.constantFrom("pending", "approved", "rejected", "superseded"),
    { nil: undefined },
  ),
  acceptanceCondition: fc.option(fc.string({ minLength: 1, maxLength: 300 }), { nil: undefined }),
  rollbackOwner: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: undefined }),
});

function isMutationGovernanceApproved(mutation: ProposedMutation): boolean {
  return (
    !!mutation.approver &&
    !!mutation.exactPin &&
    mutation.compatibilityReview === true &&
    mutation.supplyChainReview === true &&
    !!mutation.rollbackPlan
  );
}

function isDecisionRecordApproved(record: PhaseDecisionRecord): boolean {
  return (
    !!record.approvalAuthority &&
    record.status === "approved" &&
    !!record.acceptanceCondition &&
    !!record.rollbackOwner
  );
}

describe("Package/provider mutation governance (expected to PASS on baseline)", () => {
  it("rejects any package mutation missing one or more governance evidence fields", () => {
    fc.assert(
      fc.property(proposedMutationArb, (mutation) => {
        const approved = isMutationGovernanceApproved(mutation);
        if (!approved) {
          const missing: string[] = [];
          if (!mutation.approver) missing.push("approver");
          if (!mutation.exactPin) missing.push("exactPin");
          if (mutation.compatibilityReview !== true) missing.push("compatibilityReview");
          if (mutation.supplyChainReview !== true) missing.push("supplyChainReview");
          if (!mutation.rollbackPlan) missing.push("rollbackPlan");
          expect(missing.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200, seed: 20260843 },
    );
  });

  it("accepts a mutation only when all five governance fields are present and truthy", () => {
    const fullyApproved: ProposedMutation = {
      package: "@lancedb/lancedb",
      proposedVersion: "0.19.0",
      approver: "repository-owner",
      exactPin: "0.19.0",
      compatibilityReview: true,
      supplyChainReview: true,
      rollbackPlan: "Revert to 0.18.0 using pnpm add @lancedb/lancedb@0.18.0 after owner approval.",
    };
    expect(isMutationGovernanceApproved(fullyApproved)).toBe(true);
  });

  it("every generated mutation missing at least one field is classified as unapproved", () => {
    const missingApproverArb = proposedMutationArb.map((m) => ({ ...m, approver: undefined }));
    const missingPinArb = proposedMutationArb.map((m) => ({ ...m, exactPin: undefined }));
    const missingRollbackArb = proposedMutationArb.map((m) => ({ ...m, rollbackPlan: undefined }));

    for (const arb of [missingApproverArb, missingPinArb, missingRollbackArb]) {
      fc.assert(
        fc.property(arb, (mutation) => {
          expect(isMutationGovernanceApproved(mutation)).toBe(false);
        }),
        { numRuns: 50, seed: 20260843 },
      );
    }
  });
});

describe("Phase decision record validation (expected to PASS on baseline)", () => {
  it("a record with status=pending is never treated as approved", () => {
    fc.assert(
      fc.property(phaseDecisionRecordArb, (record) => {
        if (record.status === "pending") {
          expect(isDecisionRecordApproved(record)).toBe(false);
        }
      }),
      { numRuns: 200, seed: 20260843 },
    );
  });

  it("a record missing approvalAuthority is never approved regardless of status", () => {
    fc.assert(
      fc.property(
        phaseDecisionRecordArb.map((r) => ({ ...r, approvalAuthority: undefined })),
        (record) => {
          expect(isDecisionRecordApproved(record)).toBe(false);
        },
      ),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("a record missing rollbackOwner is never approved", () => {
    fc.assert(
      fc.property(
        phaseDecisionRecordArb.map((r) => ({ ...r, rollbackOwner: undefined })),
        (record) => {
          expect(isDecisionRecordApproved(record)).toBe(false);
        },
      ),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("a fully-populated approved record satisfies the approval check", () => {
    const approvedRecord: PhaseDecisionRecord = {
      id: "R-01",
      approvalAuthority: "repository-owner",
      decisionDate: "2025-08-23",
      affectedSurface: "catalog-advisor retrieval capability",
      status: "approved",
      acceptanceCondition:
        "Non-remote production vector recall returns unavailable with no filesystem write.",
      rollbackOwner: "repository-owner",
    };
    expect(isDecisionRecordApproved(approvedRecord)).toBe(true);
  });

  it("a 'superseded' or 'rejected' record does not gate implementation", () => {
    const supersededOrRejectedArb = phaseDecisionRecordArb.map((r) => ({
      ...r,
      status: (r.id.length % 2 === 0 ? "superseded" : "rejected") as
        | "superseded"
        | "rejected",
    }));
    fc.assert(
      fc.property(supersededOrRejectedArb, (record) => {
        expect(isDecisionRecordApproved(record)).toBe(false);
      }),
      { numRuns: 50, seed: 20260843 },
    );
  });
});
