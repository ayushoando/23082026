// @vitest-environment node

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  collectDiscovery,
  discoveryCollector,
} from "../../discovery.ts
import {
  buildCoverageMatrix,
  buildExclusionRegister,
  createExclusionEntry,
} from "../../coverage.ts
import {
  INITIAL_SKILL_CANDIDATES,
  COMPLETE_REVIEW_STATEMENT,
  type AuthorityClaim,
  type AuthorityRank,
  type ExclusionEntry,
  type SourceRecord,
} from "../../contracts.ts
import {
  REQUIRED_CANONICAL_GUIDANCE_PATHS,
  repositoryInventory,
} from "../../inventory.ts
import {
  authorityResolver,
  provenanceLedger,
} from "../../provenance.ts

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  const originalReadFileSync = actual.readFileSync;
  const readFileSync = (
    path: Parameters<typeof originalReadFileSync>[0],
    options?: Parameters<typeof originalReadFileSync>[1],
  ) => {
    const normalizedPath = String(path).replaceAll("\\", "/");
    if (normalizedPath.endsWith("/AGENTS.md") || normalizedPath === "AGENTS.md") {
      throw Object.assign(new Error("permission denied"), { code: "EACCES" });
    }
    return originalReadFileSync(path, options);
  };
  return { ...actual, readFileSync };
});

const temporaryRoots: string[] = [];

function emptyRepository(): string {
  const root = mkdtempSync(join(tmpdir(), "kiro-lane-a-edge-"));
  temporaryRoots.push(root);
  return root;
}

function officialCandidate(
  sourceId: string,
  overrides: Partial<SourceRecord> = {},
): SourceRecord {
  return {
    sourceId,
    kind: "official_url",
    locator: `https://kiro.dev/docs/${sourceId.replaceAll(":", "/")}/`,
    canonicalLocator: `https://kiro.dev/docs/${sourceId.replaceAll(":", "/")}/`,
    title: sourceId,
    officialDocumentationFamily: "Hooks",
    reviewDateUtc: "2026-08-25",
    retrievalMethod: "official_sitemap",
    surfaceApplicability: ["IDE"],
    versionSensitiveClaim: true,
    availability: "available",
    evidenceState: "Documented",
    provenance: {
      observer: "Lane A fixture",
      cwdOrSurface: "IDE",
      commandOrPath: "official sitemap fixture",
      result: "candidate discovered",
    },
    trustDecision: "trusted",
    authorityRank: "official_documentation",
    claims: ["fixture convention"],
    validationRunRefs: [],
    disposition: "observe",
    ...overrides,
  };
}

function authorityClaim(
  claimId: string,
  sourceRank: AuthorityRank,
  text: string,
  evidenceState: AuthorityClaim["evidenceState"] = "Observed",
): AuthorityClaim {
  return {
    claimId,
    sourceRef: `source:${claimId}`,
    sourceRank,
    claim: text,
    evidenceState,
    provenanceRef: `provenance:${claimId}`,
  };
}

function exclusionEntry(exclusionId: string, candidateRef: string): ExclusionEntry {
  return {
    exclusionId,
    candidateRef,
    family: "Billing",
    reason: "No repository-local maintenance effect.",
    scopeBoundary: "repository-local Kiro guidance",
    owner: "repository owner",
    reviewDateUtc: "2026-08-25",
    reconsiderationTrigger: "Owner adds product-management scope.",
    evidenceRef: candidateRef,
    status: "excluded",
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("DiscoveryCollector examples and edge cases", () => {
  it("records an empty repository as unavailable without inventing global or user state", () => {
    const root = emptyRepository();

    const result = discoveryCollector.discover({
      repositoryRoot: root,
      reviewDateUtc: "2026-08-25",
      activeSurfaces: ["IDE", "Local_Repository_Surface"],
      officialDiscoveryApproved: false,
    });

    expect(result.status).toBe("partial");
    const output = result.output;
    expect(output).toBeDefined();
    if (!output) return;

    const agents = output.sourceInventory.records.find((record) => record.locator === "AGENTS.md");
    const kiro = output.sourceInventory.records.find((record) => record.locator === ".kiro");
    expect(agents).toMatchObject({
      availability: "impossible_to_match",
      evidenceState: "Unverified",
      authorityRank: "AGENTS.md",
    });
    expect(kiro).toMatchObject({
      availability: "impossible_to_match",
      evidenceState: "Unverified",
    });
    expect(output.unavailable.some((finding) => finding.sourceRef === agents?.sourceId)).toBe(true);
    expect(output.unavailable.every((finding) => finding.evidenceState === "Unverified")).toBe(true);
    expect(output.sourceInventory.records.map((record) => record.sourceId).length).toBe(
      new Set(output.sourceInventory.records.map((record) => record.sourceId)).size,
    );
  });

  it("does not perform approved external retrieval and redacts secret-bearing referenced paths", () => {
    const root = emptyRepository();
    mkdirSync(join(root, "scripts"), { recursive: true });
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({
        scripts: {
          "unsafe-check": "node scripts/missing-secret.mjs --token=lane-a-secret-value",
        },
      }),
      "utf8",
    );

    const result = collectDiscovery({
      repositoryRoot: root,
      reviewDateUtc: "2026-08-25",
      activeSurfaces: ["CLI 3.x"],
      officialDiscoveryApproved: true,
    });

    expect(result.status).toBe("partial");
    expect(result.output?.errors).toContain(
      "official sitemap/search retrieval was not performed by the read-only collector",
    );
    expect(JSON.stringify(result.output)).not.toContain("lane-a-secret-value");
    expect(
      (result.output?.sourceInventory.records ?? [])
        .filter((record) => record.kind === "official_url")
        .every((record) => record.availability !== "available" && record.evidenceState === "Unverified"),
    ).toBe(true);
    expect(
      result.output?.sourceInventory.records.find(
        (record) => record.locator === "scripts/missing-secret.mjs",
      ),
    ).toMatchObject({
      availability: "impossible_to_match",
      evidenceState: "Unverified",
    });
  });
});

describe("RepositoryInventory examples and edge cases", () => {
  it("marks every canonical and Kiro path absent in an empty repository", () => {
    const root = emptyRepository();
    const result = repositoryInventory.scan({
      repositoryRoot: root,
      reviewDateUtc: "2026-08-25",
      paths: [],
    });

    expect(result.status).toBe("pass");
    const output = result.output;
    expect(output).toBeDefined();
    if (!output) return;

    expect(output.canonicalSources).toHaveLength(REQUIRED_CANONICAL_GUIDANCE_PATHS.length);
    expect(output.canonicalSources.every((record) => record.inventoryStatus === "absent")).toBe(true);
    expect(output.kiroArtifacts.find((record) => record.path === ".kiro")?.inventoryStatus).toBe("absent");
    expect(
      output.kiroArtifacts
        .filter((record) => record.path.startsWith(".kiro/skills/"))
        .map((record) => record.path)
        .sort(),
    ).toEqual(INITIAL_SKILL_CANDIDATES.map((skill) => `.kiro/skills/${skill}`).sort());
    expect(output.missingPaths).toEqual(expect.arrayContaining(["AGENTS.md", ".kiro", ".kiroignore"]));
  });

  it("distinguishes an unreadable canonical file from absent and traversal paths and deduplicates requests", () => {
    const root = emptyRepository();
    writeFileSync(join(root, "AGENTS.md"), "local rules\n", "utf8");

    const result = repositoryInventory.scan({
      repositoryRoot: root,
      reviewDateUtc: "2026-08-25",
      paths: ["AGENTS.md", "AGENTS.md", ".kiro/../../outside-repository"],
    });

    expect(result.status).toBe("pass");
    const records = [...(result.output?.canonicalSources ?? []), ...(result.output?.kiroArtifacts ?? [])];
    const agentsRecords = records.filter((record) => record.path === "AGENTS.md");
    expect(agentsRecords).toHaveLength(1);
    expect(agentsRecords[0]).toMatchObject({
      inventoryStatus: "present but unreadable",
      canonicalSource: "AGENTS.md",
      evidenceState: "Unverified",
      disposition: "defer",
    });
    expect(records.find((record) => record.path === "START.md")?.inventoryStatus).toBe("absent");
    expect(records.find((record) => record.path === ".kiro/../../outside-repository")?.inventoryStatus).toBe("unknown");
    expect(result.output?.missingPaths).toEqual(
      expect.arrayContaining(["START.md", ".kiro/../../outside-repository"]),
    );
  });
});

describe("ProvenanceLedger and AuthorityResolver examples and edge cases", () => {
  it("retains contradictory claims in exact user-to-canonical authority order", () => {
    const claims = [
      authorityClaim("canonical", "canonical_docs/*", "canonical documentation rule"),
      authorityClaim("agents", "Agents/*", "agent handbook rule"),
      authorityClaim("agents-file", "AGENTS.md", "repository process rule"),
      authorityClaim("fresh", "live_code_or_fresh_command", "fresh command observation"),
      authorityClaim("user", "user", "explicit user instruction"),
    ];

    const result = authorityResolver.resolve({
      resolutionId: "resolution:exact-authority-order",
      claims,
    });

    expect(result.status).toBe("pass");
    expect(result.output?.selectedClaimRef).toBe("user");
    expect(result.output?.losingClaimRefs).toEqual(["fresh", "agents-file", "agents", "canonical"]);
    expect(result.output?.claims).toEqual(claims);
    expect(result.evidenceRefs).toEqual(claims.map((claim) => claim.provenanceRef));
    expect(result.output?.rationale).toContain(
      "user > live_code_or_fresh_command > AGENTS.md > Agents/* > canonical_docs/*",
    );
  });

  it("fails closed for empty authority input and rejects an empty provenance source id", () => {
    const emptyClaims = authorityResolver.resolve({
      resolutionId: "resolution:empty",
      claims: [],
    });
    expect(emptyClaims.status).toBe("blocked");
    expect(emptyClaims.blockers).toEqual(["at least one authority claim is required"]);

    const source: SourceRecord = {
      sourceId: "",
      kind: "repository_file",
      locator: "AGENTS.md",
      reviewDateUtc: "2026-08-25",
      retrievalMethod: "file_read",
      surfaceApplicability: ["Local_Repository_Surface"],
      versionSensitiveClaim: false,
      availability: "available",
      evidenceState: "Observed",
      provenance: {
        observer: "fixture",
        cwdOrSurface: "Local_Repository_Surface",
        commandOrPath: "AGENTS.md",
        result: "read",
      },
      trustDecision: "trusted",
      claims: [],
      validationRunRefs: [],
      disposition: "observe",
    };
    const ledgerResult = provenanceLedger.record({ source, claims: [] });
    expect(ledgerResult.status).toBe("blocked");
    expect(ledgerResult.blockers).toEqual(["sourceId is required"]);
  });
});

describe("CoverageMatrixBuilder and ExclusionRegister examples and edge cases", () => {
  it("keeps redirected, inaccessible, contradictory, and impossible-to-match candidates unavailable", () => {
    const candidates = ([
      ["redirected", "redirected"],
      ["inaccessible", "inaccessible"],
      ["contradictory", "contradictory"],
      ["impossible", "impossible_to_match"],
    ] as const).map(([name, availability]) =>
      officialCandidate(`source:official:candidate:${name}`, {
        availability,
        evidenceState: "Unverified",
        limitation: `${name} candidate is not available on the selected surface.`,
      }),
    );

    const result = buildCoverageMatrix({
      candidates,
      exclusions: [],
      reviewDateUtc: "2026-08-25",
    });

    expect(result.status).toBe("pass");
    expect(result.output?.matrix.complete).toBe(true);
    expect(result.output?.matrix.entries.map((entry) => entry.status)).toEqual([
      "unavailable",
      "unavailable",
      "unavailable",
      "unavailable",
    ]);
    expect(result.output?.matrix.unavailableCandidateRefs).toEqual(
      candidates.map((candidate) => candidate.sourceId),
    );
    expect(result.output?.matrix.entries.every((entry) => entry.disposition === "observe")).toBe(true);
    expect(
      result.output?.matrix.entries.every((entry) => entry.validationAction.includes("Unverified_Finding")),
    ).toBe(true);
    expect(result.output?.matrix.completeReviewStatement).toBe(COMPLETE_REVIEW_STATEMENT);
  });

  it("rejects duplicate discovered sources and duplicate exclusion references", () => {
    const duplicate = officialCandidate("source:official:candidate:duplicate");
    const coverageResult = buildCoverageMatrix({
      candidates: [duplicate, { ...duplicate, title: "same source, conflicting title" }],
      exclusions: [],
      reviewDateUtc: "2026-08-25",
    });

    expect(coverageResult.status).toBe("partial");
    expect(coverageResult.output?.matrix.complete).toBe(false);
    expect(coverageResult.blockers).toContain(
      "duplicate discovered official candidate source:official:candidate:duplicate",
    );

    const first = createExclusionEntry({
      exclusionId: "EX-duplicate-1",
      candidateRef: "source:official:candidate:billing",
      family: "Billing",
      reason: "No repository-local maintenance effect.",
      scopeBoundary: "repository-local Kiro guidance",
      reviewDateUtc: "2026-08-25",
      reconsiderationTrigger: "Owner adds product-management scope.",
      evidenceRef: "source:official:candidate:billing",
    });
    expect(first.status).toBe("pass");
    expect(first.output).toBeDefined();
    if (!first.output) return;

    const duplicateRegister = buildExclusionRegister([
      first.output,
      exclusionEntry("EX-duplicate-1", "source:official:candidate:other"),
      exclusionEntry("EX-duplicate-2", "source:official:candidate:billing"),
    ]);
    expect(duplicateRegister.status).toBe("blocked");
    expect(duplicateRegister.blockers).toContain("duplicate exclusion ID EX-duplicate-1");
    expect(duplicateRegister.blockers).toContain(
      "duplicate exclusion candidate reference source:official:candidate:billing",
    );
  });

  it("allows an empty coverage input to complete only with the exact completion statement", () => {
    const result = buildCoverageMatrix({
      candidates: [],
      exclusions: [],
      reviewDateUtc: "2026-08-25",
    });

    expect(result.status).toBe("pass");
    expect(result.output?.matrix).toMatchObject({
      entries: [],
      complete: true,
      unavailableCandidateRefs: [],
      completeReviewStatement: COMPLETE_REVIEW_STATEMENT,
    });
  });
});
