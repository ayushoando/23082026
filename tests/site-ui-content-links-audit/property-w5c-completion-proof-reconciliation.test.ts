// @vitest-environment node
// Feature: site-ui-content-links-audit, Property W5C: Completion proof reconciles all totals

/**
 * Property-based test for the Wave 5 Task 6.3 completion-proof generator.
 *
 * **Validates: Requirements 4.7, 22.8-22.9, 26.1-26.12**
 *
 * Sub-properties verified here:
 *
 * 1. **Totals reconcile** — the proof totals equal the ingested record set,
 *    result totals sum to the finding count, and the proof is schema-valid.
 * 2. **No completion with drift** — `declaredComplete` is only true when the
 *    inventory/matrix/finding/evidence bijection, copy/severity/handoff
 *    closure, zero quarantine, zero pending rows, and zero unclassified
 *    inventory all hold; any perturbation forces it false.
 * 3. **Zero product mutation** — `site/**` or unapproved paths in the
 *    changed-path manifest are counted and block completion.
 * 4. **Determinism** — the same artifact set produces the same proof ID.
 *
 * All generated inputs are abstract audit records — not product fixtures and
 * not claims about rendered application behavior. No `site/**` import,
 * network, dev server, or product command is used.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { AuditRunConfiguration } from "../../scripts/site-ui-content-links-audit/config";
import {
  AUDIT_SCHEMA_VERSION,
  parseAuditRecord,
} from "../../scripts/site-ui-content-links-audit/schemas";
import type { ClassifiedRunRecords } from "../../scripts/site-ui-content-links-audit/wave5-reconcile";
import {
  buildCompletionProof,
  verifyZeroProductMutation,
} from "../../scripts/site-ui-content-links-audit/wave5-completion-proof";

const CREATED_AT = "2026-08-31T12:00:00.000Z";

const CONFIG: AuditRunConfiguration = {
  auditId: "site-ui-content-links-audit",
  schemaVersion: "1.0.0",
  specId: "test-spec",
  specConfigPath: ".removed-specs/site-ui-content-links-audit/spec-config.json",
  artifactPaths: {
    toolingRoot: "scripts/site-ui-content-links-audit",
    generatedRoot: "results/site-ui-content-links-audit",
    authoredRoot: "agents-work/site-ui-content-links-audit",
    generatedPurposes: ["manifests", "findings"],
    authoredReportTypes: ["decisions"],
  },
  surfacePartitions: { planner: "planner", studio: "studio" },
  waves: [],
};

function envelope(recordId: string) {
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordId,
    createdAt: CREATED_AT,
  } as const;
}

const PROVENANCE = {
  sourceId: "source.app-router",
  sourceKind: "source" as const,
  location: "site/app/w5c/page.tsx",
  discoveredAt: CREATED_AT,
  authorityRank: 100,
};

function emptyClassified(): ClassifiedRunRecords {
  return {
    matrixRows: [],
    findings: [],
    evidenceRecords: [],
    severityAssessments: [],
    duplicateGroups: [],
    handoffRecords: [],
    inventoryRecords: [],
    quarantinedCount: 0,
    pendingRowCount: 0,
  };
}

function buildConsistentRecords(count: number): ClassifiedRunRecords {
  const records = emptyClassified();
  const matrixRows: object[] = [];
  const findings: object[] = [];
  const evidenceRecords: object[] = [];
  const inventoryRecords: object[] = [];
  for (let index = 0; index < count; index += 1) {
    const occurrenceId = `occurrence.w5c.${index}`;
    const findingId = `finding.w5c.${index}`;
    const evidenceId = `evidence.w5c.${index}`;
    inventoryRecords.push({
      ...envelope(`record.route.w5c.${index}`),
      recordType: "route",
      routeId: `route.w5c.${index}`,
      pattern: `/w5c-${index}`,
      routeKind: "static",
      productSurface: "marketing",
      status: "active",
      sourcePath: `site/app/w5c-${index}/page.tsx`,
      provenance: [PROVENANCE],
      conflictIds: [],
      coverageGapIds: [],
    });
    evidenceRecords.push({
      ...envelope(`record.${evidenceId}`),
      recordType: "evidence",
      evidenceId,
      findingId,
      occurrenceId,
      route: `/w5c-${index}`,
      concreteUrl: `/w5c-${index}`,
      productSurface: "marketing",
      stateVariant: "state.default",
      viewportProfile: "viewport.desktop",
      browserProfile: "browser.chromium",
      accessContext: "access.public-guest",
      languageContext: "en",
      auditDimension: "dim.route-link-integrity",
      expectedResult: "The route contract holds.",
      observedResult: "Fixture source observation.",
      claimBasis: "source-observed",
      resultClassification: "conforming",
      severity: "advisory",
      severityRationale: "Fixture rationale.",
      userImpact: "None established.",
      evidenceLane: "static-inspection",
      evidenceType: "fixture-source",
      sourceOrRuntimeLocation: `site/app/w5c-${index}/page.tsx`,
      capturedAt: CREATED_AT,
      reproductionSteps: ["Inspect the fixture."],
      evidenceReferences: [`occurrence:${occurrenceId}`],
      requirementIds: ["26.1"],
      journeyIds: [],
      shellIds: [],
      relatedFindingIds: [],
      proposedOutcome: "Retain the contract.",
      likelyOwner: "fixture-owner",
      dependencies: [],
      verificationMethod: "Static source inspection.",
    });
    findings.push({
      ...envelope(`record.${findingId}`),
      recordType: "finding",
      findingId,
      occurrenceId,
      resultClassification: "conforming",
      claimBasis: "source-observed",
      conclusionSummary: `Fixture finding ${index}.`,
      evidenceIds: [evidenceId],
      requirementIds: ["26.1"],
      productSurface: "marketing",
      copyRelated: false,
    });
    matrixRows.push({
      ...envelope(`record.row.w5c.${index}`),
      recordType: "matrix-row",
      occurrenceId,
      concreteUrl: `/w5c-${index}`,
      productSurface: "marketing",
      stateId: "state.default",
      viewportId: "viewport.desktop",
      browserId: "browser.chromium",
      accessContextId: "access.public-guest",
      languageId: "en",
      applicableDimensionIds: ["dim.route-link-integrity"],
      waveId: "1",
      status: "conforming",
      findingId,
      inputFingerprint: `fp-w5c-${index}`,
    });
  }
  return {
    ...records,
    matrixRows: matrixRows as ClassifiedRunRecords["matrixRows"],
    findings: findings as ClassifiedRunRecords["findings"],
    evidenceRecords:
      evidenceRecords as ClassifiedRunRecords["evidenceRecords"],
    inventoryRecords,
  };
}

function buildProofInput(
  records: ClassifiedRunRecords,
  overrides: Partial<{
    readonly changedPaths: readonly string[];
    readonly waveCheckpointIds: readonly string[];
  }> = {},
) {
  return {
    runId: "20260831T120000000Z-aabbccddeeff-001122334455",
    manifestId: "manifest.w5c",
    inventoryGeneration: 1,
    createdAt: CREATED_AT,
    records,
    changedPaths: overrides.changedPaths ?? [
      "scripts/site-ui-content-links-audit/wave5-completion-proof.ts",
    ],
    changedPathManifestReference:
      "results/site-ui-content-links-audit/20260831T120000000Z-aabbccddeeff-001122334455/completion-proof/changed-path-manifest.json",
    waveCheckpointIds: overrides.waveCheckpointIds ?? ["wave-0", "wave-1"],
    config: CONFIG,
  };
}

describe(
  "Feature: site-ui-content-links-audit, Property W5C: Completion proof reconciles all totals",
  () => {
    it(
      "Feature: site-ui-content-links-audit, Property W5C: Completion proof reconciles all totals — consistent sets declare completion and totals match (Req 26.1-26.12)",
      () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 4 }), (count) => {
            const records = buildConsistentRecords(count);
            const built = buildCompletionProof(buildProofInput(records));

            expect(parseAuditRecord(built.proof).success).toBe(true);
            expect(built.proof.declaredComplete).toBe(true);
            expect(built.proof.totals.inventory).toBe(count);
            expect(built.proof.totals.matrixRows).toBe(count);
            expect(built.proof.totals.findings).toBe(count);
            expect(built.proof.totals.evidenceRecords).toBe(count);
            const totals = built.proof.resultTotals;
            expect(
              totals.conforming +
                totals.nonconforming +
                totals.blocked +
                totals.notRun +
                totals.notApplicable +
                totals.requiresOwnerDecision,
            ).toBe(count);

            // Deterministic proof identity for identical artifact sets.
            const again = buildCompletionProof(buildProofInput(records));
            expect(again.proof.proofId).toBe(built.proof.proofId);
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "Feature: site-ui-content-links-audit, Property W5C: Completion proof reconciles all totals — any drift or mutation blocks the declaration (Req 4.7, 22.8-22.9, 26.12)",
      () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 3 }),
            fc.constantFrom(
              "extra-evidence",
              "defect-without-severity",
              "pending-row",
              "candidate-inventory",
              "site-mutation",
              "unapproved-path",
              "no-waves",
            ),
            (count, drift) => {
              const records = buildConsistentRecords(count);
              let mutated: ClassifiedRunRecords = records;
              let changedPaths: readonly string[] | undefined;
              let waveCheckpointIds: readonly string[] | undefined;

              switch (drift) {
                case "extra-evidence": {
                  const extra = {
                    ...(records.evidenceRecords[0] as object),
                    recordId: "record.evidence.w5c.extra",
                    evidenceId: "evidence.w5c.extra",
                  };
                  mutated = {
                    ...records,
                    evidenceRecords: [
                      ...records.evidenceRecords,
                      extra,
                    ] as ClassifiedRunRecords["evidenceRecords"],
                  };
                  break;
                }
                case "defect-without-severity": {
                  const defect = {
                    ...(records.findings[0] as object),
                    recordId: "record.finding.w5c.defect",
                    findingId: "finding.w5c.defect",
                    occurrenceId: "occurrence.w5c.defect",
                    resultClassification: "nonconforming",
                    severityAssessmentId: "severity.w5c.missing",
                    evidenceIds: ["evidence.w5c.0"],
                  };
                  const defectRow = {
                    ...(records.matrixRows[0] as object),
                    recordId: "record.row.w5c.defect",
                    occurrenceId: "occurrence.w5c.defect",
                    findingId: "finding.w5c.defect",
                    status: "nonconforming",
                  };
                  mutated = {
                    ...records,
                    findings: [
                      ...records.findings,
                      defect,
                    ] as ClassifiedRunRecords["findings"],
                    matrixRows: [
                      ...records.matrixRows,
                      defectRow,
                    ] as ClassifiedRunRecords["matrixRows"],
                  };
                  break;
                }
                case "pending-row": {
                  const pending = {
                    ...(records.matrixRows[0] as object),
                    recordId: "record.row.w5c.pending",
                    occurrenceId: "occurrence.w5c.pending",
                    status: "pending",
                    findingId: undefined,
                  };
                  mutated = {
                    ...records,
                    matrixRows: [
                      ...records.matrixRows,
                      pending,
                    ] as ClassifiedRunRecords["matrixRows"],
                  };
                  break;
                }
                case "candidate-inventory": {
                  mutated = {
                    ...records,
                    inventoryRecords: [
                      ...records.inventoryRecords,
                      {
                        ...envelope("record.inventory.w5c.candidate"),
                        recordType: "specialized-inventory",
                        inventoryId: "inventory.w5c.candidate",
                        inventoryKind: "state",
                        owner: "fixture",
                        sourceLocator: "site/app/w5c/page.tsx",
                        productSurface: "marketing",
                        provenance: [PROVENANCE],
                        applicableOccurrenceSelector: {},
                        status: "candidate",
                        payload: {},
                      },
                    ],
                  };
                  break;
                }
                case "site-mutation": {
                  changedPaths = ["site/app/(site)/page.tsx"];
                  break;
                }
                case "unapproved-path": {
                  changedPaths = ["audit-report.md"];
                  break;
                }
                case "no-waves": {
                  waveCheckpointIds = [];
                  break;
                }
              }

              const built = buildCompletionProof(
                buildProofInput(mutated, {
                  ...(changedPaths ? { changedPaths } : {}),
                  ...(waveCheckpointIds ? { waveCheckpointIds } : {}),
                }),
              );
              expect(built.proof.declaredComplete).toBe(false);
              expect(parseAuditRecord(built.proof).success).toBe(true);
              expect(
                Object.values(built.invariants).some((holds) => holds === false),
              ).toBe(true);
              if (drift === "site-mutation") {
                expect(built.mutation.productCodeMutations).toBe(1);
              }
              if (drift === "unapproved-path") {
                expect(built.mutation.outsideApprovedPaths).toContain(
                  "audit-report.md",
                );
              }
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      "Feature: site-ui-content-links-audit, Property W5C: Completion proof reconciles all totals — changed-path verification never accepts product boundaries (Req 4.7, 23.6-23.7)",
      () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.constantFrom(
                "site/app/page.tsx",
                "site/components/Planner/Canvas.tsx",
                "site/components/Studio/Editor.tsx",
                "site/lib/Planner/plannerPersistenceMode.ts",
                "results/site-ui-content-links-audit/run/findings/x.ndjson",
                "scripts/site-ui-content-links-audit/schemas.ts",
                "agents-work/site-ui-content-links-audit/decisions/note.json",
                "vercel.json",
                "docs/architecture/stack.md",
              ),
              { minLength: 0, maxLength: 6 },
            ),
            (paths) => {
              const verification = verifyZeroProductMutation(paths, CONFIG);
              const expectedSitePaths = paths.filter((p) =>
                p.startsWith("site/"),
              );
              expect(verification.productCodeMutations).toBe(
                expectedSitePaths.length,
              );
              expect([...verification.siteStarPaths].sort()).toEqual(
                [...expectedSitePaths].sort(),
              );
              for (const approved of paths.filter(
                (p) =>
                  p.startsWith("results/site-ui-content-links-audit/") ||
                  p.startsWith("scripts/site-ui-content-links-audit/") ||
                  p.startsWith("agents-work/site-ui-content-links-audit/"),
              )) {
                expect(verification.outsideApprovedPaths).not.toContain(approved);
              }
              for (const outside of paths.filter(
                (p) =>
                  !p.startsWith("results/site-ui-content-links-audit/") &&
                  !p.startsWith("scripts/site-ui-content-links-audit/") &&
                  !p.startsWith("agents-work/site-ui-content-links-audit/"),
              )) {
                expect(verification.outsideApprovedPaths).toContain(outside);
              }
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  },
);
