import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mkdirSync = vi.fn();
const assertDevDiskWritable = vi.fn();
const connect = vi.fn();

vi.mock("node:fs", () => ({
  default: { mkdirSync },
  mkdirSync,
}));

vi.mock("@/lib/persistence/assertDevDiskWritable", () => ({
  assertDevDiskWritable,
}));

vi.mock("@lancedb/lancedb", () => ({
  connect,
}));

vi.mock("@mastra/core/vector", () => {
  class MastraVector {
    constructor(_opts: { id: string }) {}
  }
  return { MastraVector };
});

describe("LanceCatalogVectorStore", () => {
  beforeEach(() => {
    vi.resetModules();
    mkdirSync.mockReset();
    assertDevDiskWritable.mockReset();
    connect.mockReset();
    connect.mockResolvedValue({
      tableNames: async () => [],
      createTable: async () => ({ delete: async () => undefined }),
      openTable: async () => null,
      dropTable: async () => undefined,
    });
  });

  it("exports catalog_nav and 768-d embedder constant", async () => {
    const { CATALOG_VECTOR_INDEX_NAME } = await import("@/lib/ai/mastra/lanceVectorStore");
    const { CATALOG_EMBEDDING_DIMENSION } = await import("@/lib/ai/mastra/embedder");
    expect(CATALOG_VECTOR_INDEX_NAME).toBe("catalog_nav");
    expect(CATALOG_EMBEDDING_DIMENSION).toBe(768);
  });

  it("guards local mkdir with assertDevDiskWritable", async () => {
    const { LanceCatalogVectorStore } = await import("@/lib/ai/mastra/lanceVectorStore");
    const store = new LanceCatalogVectorStore("E:/tmp/lancedb-test");
    await store.listIndexes();
    expect(assertDevDiskWritable).toHaveBeenCalled();
    expect(mkdirSync).toHaveBeenCalledWith("E:/tmp/lancedb-test", { recursive: true });
    expect(connect).toHaveBeenCalledWith("E:/tmp/lancedb-test");
  });

  it("skips mkdir for remote URIs", async () => {
    const { LanceCatalogVectorStore } = await import("@/lib/ai/mastra/lanceVectorStore");
    const store = new LanceCatalogVectorStore("s3://bucket/catalog");
    await store.listIndexes();
    expect(assertDevDiskWritable).not.toHaveBeenCalled();
    expect(mkdirSync).not.toHaveBeenCalled();
    expect(connect).toHaveBeenCalledWith("s3://bucket/catalog");
  });
});

// =============================================================================
// Task 1 — Bug-condition exploration property tests (appended)

// ---------------------------------------------------------------------------
// Deterministic arbitraries
// ---------------------------------------------------------------------------

/** URIs that look like remote object-store or cloud endpoints (allowed). */
const remoteUriArb = fc.oneof(
  fc.constant("s3://oando-catalog/lancedb"),
  fc.constant("gs://oando-catalog/lancedb"),
  fc.constant("az://oando-catalog/lancedb"),
  fc.constantFrom(
    "https://remote-store.example.com/v1/lancedb",
    "lancedb+s3://bucket/path",
  ),
);

/** Local filesystem paths that must NEVER be used in a production recall. */
const localPathArb = fc.oneof(
  fc.constant("/app/.data/lancedb/catalog"),
  fc.constant("C:\\app\\.data\\lancedb\\catalog"),
  fc.constant(".data/lancedb/catalog"),
  fc.constant("./lancedb"),
  // simulate the default cwd-relative path the source currently resolves
  fc.constant(process.cwd() + "/.data/lancedb/catalog"),
);

/**
 * A simulated production-environment indicator: `DEV_AUTH_BYPASS` is absent or
 * not "1", which means the production code path is active.
 */
const productionEnvArb = fc.record({
  DEV_AUTH_BYPASS: fc.constantFrom(undefined, "0", "false", ""),
  LANCE_DB_URI: fc.constant(undefined as string | undefined),
  NODE_ENV: fc.constant("production" as const),
});

/**
 * A proposed dependency/provider mutation that must carry governance evidence.
 * Properties 3 and 4 generate these records.
 */
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

type ProposedMutation = {
  package: string;
  proposedVersion: string;
  approver: string | undefined;
  exactPin: string | undefined;
  compatibilityReview: boolean | undefined;
  supplyChainReview: boolean | undefined;
  rollbackPlan: string | undefined;
};

/**
 * A phase decision record that must contain required evidence fields before it
 * can gate any implementation task.
 */
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

type PhaseDecisionRecord = {
  id: string;
  approvalAuthority: string | undefined;
  decisionDate: string | undefined;
  affectedSurface: string | undefined;
  status: "pending" | "approved" | "rejected" | "superseded" | undefined;
  acceptanceCondition: string | undefined;
  rollbackOwner: string | undefined;
};

// ---------------------------------------------------------------------------
// Bug-condition classification helpers
// ---------------------------------------------------------------------------

function isRemoteUri(uri: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(uri);
}

function isProductionEnv(env: {
  DEV_AUTH_BYPASS?: string;
  NODE_ENV?: string;
}): boolean {
  return env.DEV_AUTH_BYPASS !== "1" && env.NODE_ENV !== "development";
}

/**
 * A mutation is governance-approved only when all five evidence fields are
 * present and truthy.  A missing field is the bug condition for Property 3.
 */
function isMutationGovernanceApproved(mutation: ProposedMutation): boolean {
  return (
    !!mutation.approver &&
    !!mutation.exactPin &&
    mutation.compatibilityReview === true &&
    mutation.supplyChainReview === true &&
    !!mutation.rollbackPlan
  );
}

/**
 * A phase decision record is ready to gate implementation only when it has an
 * explicit approvalAuthority, status === "approved", acceptanceCondition, and
 * rollbackOwner.  A "pending" status is NOT approval.
 */
function isDecisionRecordApproved(record: PhaseDecisionRecord): boolean {
  return (
    !!record.approvalAuthority &&
    record.status === "approved" &&
    !!record.acceptanceCondition &&
    !!record.rollbackOwner
  );
}

// ---------------------------------------------------------------------------
// Property 2 — Production non-remote vector: no local filesystem write
//
// BUG CONDITION:
//   isProduction() AND NOT remoteVectorStoreConfigured()
//   AND attemptsLocalFilesystemWrite()
//
// EXPECTED BASELINE RESULT: FAIL
//   The current source resolves a local cwd-based path when LANCE_DB_URI is
//   absent.  The `conn()` method calls assertDevDiskWritable() + mkdirSync()
//   on that local path, which is the counterexample.
//
// After the fix, vector retrieval must be represented as unavailable (no local
// write) when no remote store is configured in production.
// ---------------------------------------------------------------------------

describe("LanceCatalogVectorStore — production non-remote write guard (baseline: EXPECTED TO FAIL)", () => {
  /**
   * Simulate a vector recall in a production context where LANCE_DB_URI is
   * absent.  On the unfixed baseline, `conn()` will reach mkdirSync.
   * The test asserts that mkdirSync is NOT called.
   */
  it(
    "does not attempt a local filesystem write when no remote store is configured in production",
    async () => {
      // Reset module registry so env changes are reflected.
      vi.resetModules();

      // Simulate production environment: no LANCE_DB_URI, no DEV_AUTH_BYPASS.
      const savedLanceDbUri = process.env["LANCE_DB_URI"];
      const savedDevAuthBypass = process.env["DEV_AUTH_BYPASS"];
      const savedNodeEnv = process.env["NODE_ENV"];
      delete process.env["LANCE_DB_URI"];
      delete process.env["DEV_AUTH_BYPASS"];
      process.env["NODE_ENV"] = "production";

      mkdirSync.mockReset();
      assertDevDiskWritable.mockReset();

      let capturedError: unknown = undefined;

      try {
        const { LanceCatalogVectorStore } = await import(
          "@/lib/ai/mastra/lanceVectorStore"
        );
        const store = new LanceCatalogVectorStore(); // uses default resolveLanceDbUri()
        await store.listIndexes();
      } catch (err) {
        capturedError = err;
      } finally {
        // Restore env.
        if (savedLanceDbUri !== undefined) {
          process.env["LANCE_DB_URI"] = savedLanceDbUri;
        }
        if (savedDevAuthBypass !== undefined) {
          process.env["DEV_AUTH_BYPASS"] = savedDevAuthBypass;
        }
        if (savedNodeEnv !== undefined) {
          process.env["NODE_ENV"] = savedNodeEnv;
        } else {
          delete process.env["NODE_ENV"];
        }
      }

      // BUG CONDITION: mkdirSync was called (local path attempt).
      // On the unfixed baseline this assertion FAILS, producing the
      // counterexample: mkdirSync.mock.calls.length > 0.
      //
      // After the fix the store must either throw an "unavailable" error
      // before reaching mkdirSync, or return an empty/unavailable result.
      expect(mkdirSync).not.toHaveBeenCalled();

      // Either the store returns cleanly (unavailable capability) or throws
      // a typed "unavailable" error — but never silently writes locally.
      if (capturedError !== undefined) {
        // The thrown error must clearly indicate unavailability, not a
        // filesystem-path error.
        expect(String(capturedError)).not.toMatch(/ENOENT|EROFS|mkdirSync/i);
      }
    },
  );

  it(
    "never calls mkdirSync for any simulated production configuration without remote URI",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          productionEnvArb,
          async (env) => {
            vi.resetModules();

            const saved = {
              LANCE_DB_URI: process.env["LANCE_DB_URI"],
              DEV_AUTH_BYPASS: process.env["DEV_AUTH_BYPASS"],
              NODE_ENV: process.env["NODE_ENV"],
            };

            delete process.env["LANCE_DB_URI"];
            if (env.DEV_AUTH_BYPASS !== undefined) {
              process.env["DEV_AUTH_BYPASS"] = env.DEV_AUTH_BYPASS;
            } else {
              delete process.env["DEV_AUTH_BYPASS"];
            }
            // Explicitly set production NODE_ENV so the guard fires
            process.env["NODE_ENV"] = env.NODE_ENV;

            mkdirSync.mockReset();
            assertDevDiskWritable.mockReset();

            try {
              const { LanceCatalogVectorStore } = await import(
                "@/lib/ai/mastra/lanceVectorStore"
              );
              const store = new LanceCatalogVectorStore();
              await store.listIndexes().catch(() => {/* unavailable is acceptable */});
            } finally {
              if (saved.LANCE_DB_URI !== undefined) {
                process.env["LANCE_DB_URI"] = saved.LANCE_DB_URI;
              } else {
                delete process.env["LANCE_DB_URI"];
              }
              if (saved.DEV_AUTH_BYPASS !== undefined) {
                process.env["DEV_AUTH_BYPASS"] = saved.DEV_AUTH_BYPASS;
              } else {
                delete process.env["DEV_AUTH_BYPASS"];
              }
            }

            // BUG CONDITION counterexample: mkdirSync was called.
            // Expected baseline: FAIL (current source calls mkdirSync locally).
            expect(mkdirSync).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 10, seed: 20260843 },
      );
    },
  );

  it("allows remote URI without local write (should PASS on baseline)", async () => {
    await fc.assert(
      fc.asyncProperty(remoteUriArb, async (uri) => {
        vi.resetModules();
        mkdirSync.mockReset();
        assertDevDiskWritable.mockReset();
        connect.mockReset();
        connect.mockResolvedValue({
          tableNames: async () => [],
          createTable: async () => ({ delete: async () => undefined }),
          openTable: async () => null,
          dropTable: async () => undefined,
        });

        const { LanceCatalogVectorStore } = await import(
          "@/lib/ai/mastra/lanceVectorStore"
        );
        const store = new LanceCatalogVectorStore(uri);
        await store.listIndexes();

        expect(mkdirSync).not.toHaveBeenCalled();
        expect(assertDevDiskWritable).not.toHaveBeenCalled();
        expect(connect).toHaveBeenCalledWith(uri);
      }),
      { numRuns: 20, seed: 20260843 },
    );
  });

  it("all local paths are identified as non-remote (baseline URI classification)", () => {
    fc.assert(
      fc.property(localPathArb, (path) => {
        // The isRemoteUri helper must classify these as non-remote.
        expect(isRemoteUri(path)).toBe(false);
      }),
      { numRuns: 50, seed: 20260843 },
    );
  });

  it("all remote scheme URIs are identified as remote", () => {
    fc.assert(
      fc.property(remoteUriArb, (uri) => {
        expect(isRemoteUri(uri)).toBe(true);
      }),
      { numRuns: 50, seed: 20260843 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3 — Package/provider governance
//
// A proposed mutation to any AI/retrieval package or provider entry must have:
//   - a named approver
//   - an exact pinned version
//   - a compatibility review
//   - a supply-chain review
//   - a rollback plan
//
// Any mutation missing any of these fields must be rejected before manifests
// or lockfiles change.
//
// Expected baseline result: PASS (encodes the governance policy as contract).
// ---------------------------------------------------------------------------

describe("Package/provider mutation governance (expected to PASS on baseline)", () => {
  it("rejects any package mutation missing one or more governance evidence fields", () => {
    fc.assert(
      fc.property(proposedMutationArb, (mutation) => {
        const approved = isMutationGovernanceApproved(mutation);

        if (!approved) {
          // A mutation that lacks governance fields must NOT proceed.
          const missing: string[] = [];
          if (!mutation.approver) missing.push("approver");
          if (!mutation.exactPin) missing.push("exactPin");
          if (mutation.compatibilityReview !== true) missing.push("compatibilityReview");
          if (mutation.supplyChainReview !== true) missing.push("supplyChainReview");
          if (!mutation.rollbackPlan) missing.push("rollbackPlan");

          // The counterexample here would be: approved === true when fields are
          // missing — that would be a governance enforcement failure.
          expect(missing.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200, seed: 20260843 },
    );
  });

  it("accepts a mutation only when all five governance fields are present and truthy", () => {
    // A fully-specified mutation should pass the governance check.
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
    // Generate mutations that are guaranteed to be missing at least one field.
    const missingApproverArb = proposedMutationArb.map((m) => ({
      ...m,
      approver: undefined,
    }));
    const missingPinArb = proposedMutationArb.map((m) => ({
      ...m,
      exactPin: undefined,
    }));
    const missingRollbackArb = proposedMutationArb.map((m) => ({
      ...m,
      rollbackPlan: undefined,
    }));

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

// ---------------------------------------------------------------------------
// Property 4 — Phase-record fields required before a decision is applied
//
// A phase decision record must have approvalAuthority, status === "approved",
// acceptanceCondition, and rollbackOwner before it can gate an implementation
// task.  A "pending" status is explicitly NOT approval.
//
// Expected baseline result: PASS (encodes the decision-record contract).
// ---------------------------------------------------------------------------

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
      // Override status with a terminal non-approved state.
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
