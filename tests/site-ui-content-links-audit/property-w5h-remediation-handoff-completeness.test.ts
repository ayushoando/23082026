// @vitest-environment node
// Feature: site-ui-content-links-audit, Property W5H: Remediation handoff completeness

/**
 * Property-based test for the Wave 5 Task 6.2 handoff generator.
 *
 * **Validates: Requirements 8.3-8.8, 11.6-11.7, 23.1-23.8, 24.1-24.8, 26.6,
 * 26.8-26.10**
 *
 * Sub-properties verified here:
 *
 * 1. **One complete handoff per defect/group** — every independent defect or
 *    supported duplicate group yields exactly one schema-valid handoff with
 *    all acceptance contexts and `requiresSeparateImplementationAuthorization`.
 * 2. **Copy/Hindi ingestion** — only schema-valid proposals link; a copy
 *    defect with a missing or invalid proposal (e.g. approved Hindi without
 *    an approval reference) is reported as a mismatch, never silently closed.
 * 3. **Pending operations** — blockers on not-run/blocked records aggregate
 *    into pending protected operations with their affected occurrences.
 * 4. **No silent closure loss** — exclusions and coverage gaps that fail
 *    validation are counted as unclassified; owner-decision counts remain.
 *
 * All generated inputs are abstract audit records — not product fixtures and
 * not claims about rendered application behavior. No `site/**` import,
 * network, dev server, or product command is used.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import { AUDIT_SCHEMA_VERSION, parseAuditRecord } from "../../scripts/site-ui-content-links-audit/schemas";
import type {
  HandoffBuildInput,
} from "../../scripts/site-ui-content-links-audit/wave5-handoffs";
import {
  buildRemediationHandoffs,
  finalizeClosureRecords,
} from "../../scripts/site-ui-content-links-audit/wave5-handoffs";

const CREATED_AT = "2026-08-31T12:00:00.000Z";

type Surface = "marketing" | "planner" | "studio";

function envelope(recordId: string) {
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordId,
    createdAt: CREATED_AT,
  } as const;
}

function surfaceSource(surface: Surface, key: string): string {
  if (surface === "planner") return `site/components/Planner/${key}.tsx`;
  if (surface === "studio") return `site/components/Studio/${key}.tsx`;
  return `site/components/site/${key}.tsx`;
}

interface DefectSpec {
  readonly key: string;
  readonly surface: Surface;
  readonly copy: boolean;
  readonly proposalValid: boolean;
  readonly groupId: string | undefined;
  readonly pendingOperation: string | undefined;
}

function buildInput(specs: readonly DefectSpec[]): HandoffBuildInput {
  const findings: object[] = [];
  const evidenceRecords: object[] = [];
  const matrixRows: object[] = [];
  const copyProposals: object[] = [];
  const groups = new Map<string, { surface: Surface; findingIds: string[]; occurrenceIds: string[]; evidenceIds: string[] }>();

  for (const spec of specs) {
    const occurrenceId = `occurrence.w5h.${spec.key}`;
    const findingId = `finding.w5h.${spec.key}`;
    const evidenceId = `evidence.w5h.${spec.key}`;
    const source = surfaceSource(spec.surface, spec.key);
    const proposalId = spec.copy ? `proposal.w5h.${spec.key}` : undefined;

    const blockers = spec.pendingOperation
      ? [
          {
            blockerKind: "authorization" as const,
            detail: "Exact current-session authorization is missing.",
            pendingOperation: spec.pendingOperation,
          },
        ]
      : undefined;

    evidenceRecords.push({
      ...envelope(`record.${evidenceId}`),
      recordType: "evidence",
      evidenceId,
      findingId,
      occurrenceId,
      route: `/${spec.key}`,
      concreteUrl: `/${spec.key}`,
      productSurface: spec.surface,
      stateVariant: "state.default",
      viewportProfile: "viewport.desktop",
      browserProfile: "browser.chromium",
      accessContext: "access.public-guest",
      languageContext: "en",
      auditDimension: "dim.copy-ia",
      expectedResult: "User-visible copy is complete.",
      observedResult: `Fixture defect at ${source}.`,
      claimBasis: "source-observed",
      resultClassification: "nonconforming",
      severity: "medium",
      severityRationale: "Fixture severity rationale.",
      userImpact: "Fixture impact statement.",
      evidenceLane: "static-inspection",
      evidenceType: "fixture-source",
      sourceOrRuntimeLocation: source,
      capturedAt: CREATED_AT,
      reproductionSteps: ["Inspect the fixture source."],
      evidenceReferences: [`occurrence:${occurrenceId}`],
      requirementIds: ["8.3"],
      journeyIds: [`journey.w5h.${spec.key}`],
      shellIds: [`shell.w5h.${spec.key}`],
      relatedFindingIds: [],
      proposedOutcome: "Apply the reviewed replacement.",
      likelyOwner: "fixture-owner",
      dependencies: [`dep.w5h.${spec.key}`],
      verificationMethod: "Static source inspection of the fixture.",
    });
    findings.push({
      ...envelope(`record.${findingId}`),
      recordType: "finding",
      findingId,
      occurrenceId,
      resultClassification: "nonconforming",
      claimBasis: "source-observed",
      conclusionSummary: `Fixture defect for ${occurrenceId}.`,
      evidenceIds: [evidenceId],
      requirementIds: ["8.3"],
      productSurface: spec.surface,
      severityAssessmentId: `severity.w5h.${spec.key}`,
      ...(proposalId ? { copyProposalId: proposalId } : {}),
      copyRelated: spec.copy,
      ...(blockers ? { blockers } : {}),
    });
    matrixRows.push({
      ...envelope(`record.row.${spec.key}`),
      recordType: "matrix-row",
      occurrenceId,
      concreteUrl: `/${spec.key}`,
      productSurface: spec.surface,
      stateId: "state.default",
      viewportId: "viewport.desktop",
      browserId: "browser.chromium",
      accessContextId: "access.public-guest",
      languageId: "en",
      applicableDimensionIds: ["dim.copy-ia"],
      waveId: "5",
      status: "nonconforming",
      findingId,
      inputFingerprint: `fp-${spec.key}`,
      ...(blockers ? { blockers } : {}),
    });
    if (proposalId) {
      copyProposals.push(
        spec.proposalValid
          ? {
              ...envelope(`record.${proposalId}`),
              recordType: "copy-proposal",
              proposalId,
              currentText: "PLACEHOLDER",
              finalEnglishText: "Explore office furniture solutions.",
              placement: `Fixture placement for ${spec.key}`,
              intent: "Replace the placeholder copy.",
              applicableState: "state.default",
              preservedFacts: ["INR pricing context is preserved."],
              hindiNote: {
                translationRequired: true,
                translationOwner: "content-review",
                humanReviewRequired: true,
                reviewNotes: "Hindi wording requires human approval.",
              },
            }
          : {
              ...envelope(`record.${proposalId}`),
              recordType: "copy-proposal",
              proposalId,
              currentText: "PLACEHOLDER",
              finalEnglishText: "Explore office furniture solutions.",
              placement: `Fixture placement for ${spec.key}`,
              intent: "Replace the placeholder copy.",
              applicableState: "state.default",
              preservedFacts: ["INR pricing context is preserved."],
              hindiNote: {
                translationRequired: false,
                approvedHindiText: "बिना अनुमोदन के हिंदी",
                translationOwner: "content-review",
                humanReviewRequired: false,
                reviewNotes: "Invalid: approved Hindi without approval reference.",
              },
            },
      );
    }
    if (spec.groupId) {
      const group = groups.get(spec.groupId) ?? {
        surface: spec.surface,
        findingIds: [],
        occurrenceIds: [],
        evidenceIds: [],
      };
      group.findingIds.push(findingId);
      group.occurrenceIds.push(occurrenceId);
      group.evidenceIds.push(evidenceId);
      groups.set(spec.groupId, group);
    }
  }

  const duplicateGroups = [...groups.entries()].map(([groupId, member]) => ({
    ...envelope(`record.${groupId}`),
    recordType: "duplicate-group",
    duplicateGroupId: groupId,
    productSurface: member.surface,
    rootCauseSignature: `sig-${groupId}`,
    likelySourceAreas: member.evidenceIds.map((evidenceId) => {
      const record = evidenceRecords.find(
        (candidate) =>
          (candidate as { evidenceId: string }).evidenceId === evidenceId,
      ) as { sourceOrRuntimeLocation: string };
      return record.sourceOrRuntimeLocation;
    }),
    violatedContract: "User-visible copy must be complete on every occurrence.",
    failureMechanism: `Fixture mechanism for ${groupId}.`,
    findingIds: member.findingIds,
    occurrenceIds: member.occurrenceIds,
    evidenceIds: member.evidenceIds,
  }));

  return {
    findings,
    duplicateGroups,
    matrixRows,
    evidenceRecords,
    copyProposals,
    exclusions: [],
    coverageGaps: [],
  };
}

const arbKey = fc.stringMatching(/^[a-z][a-z0-9]{2,8}$/);

const arbSpecs: fc.Arbitrary<readonly DefectSpec[]> = fc
  .uniqueArray(arbKey, { minLength: 2, maxLength: 5 })
  .chain((keys) =>
    fc.tuple(
      ...keys.map((key) =>
        fc.record({
          key: fc.constant(key),
          surface: fc.constantFrom<Surface>("marketing", "planner", "studio"),
          copy: fc.boolean(),
          proposalValid: fc.boolean(),
          groupIndex: fc.integer({ min: -1, max: keys.length - 1 }),
          pending: fc.option(fc.integer({ min: 0, max: 2 }), { nil: undefined }),
        }),
      ),
    ).map((raws) => {
      const groupOf = raws.map((raw) => raw.groupIndex);
      return raws.map((raw, index) => {
        const partner = groupOf.findIndex(
          (candidate, candidateIndex) =>
            candidate === raw.groupIndex && candidateIndex !== index,
        );
        const sharesSurfaceWithPartner =
          partner >= 0 && raws[partner]!.surface === raw.surface;
        const groupable = raw.groupIndex >= 0 && sharesSurfaceWithPartner;
        return {
          key: raw.key,
          surface: raw.surface,
          copy: raw.copy,
          proposalValid: raw.proposalValid,
          groupId: groupable ? `group.w5h.${raw.groupIndex}` : undefined,
          pendingOperation:
            raw.pending === undefined
              ? undefined
              : `Authorized browser workflow #${raw.pending}`,
        } satisfies DefectSpec;
      });
    }),
  );

describe(
  "Feature: site-ui-content-links-audit, Property W5H: Remediation handoff completeness",
  () => {
    it(
      "Feature: site-ui-content-links-audit, Property W5H: Remediation handoff completeness — one complete handoff per defect/group with preserved selectors (Req 11.6-11.7, 23.1-23.8)",
      () => {
        fc.assert(
          fc.property(arbSpecs, (specs) => {
            const input = buildInput(specs);
            const result = buildRemediationHandoffs(input, CREATED_AT);

            const groupedIds = new Set(
              input.duplicateGroups.flatMap(
                (group) => (group as { findingIds: string[] }).findingIds,
              ),
            );
            const ungrouped = new Set(
              (input.findings as { findingId: string }[])
                .map((finding) => finding.findingId)
                .filter((findingId) => !groupedIds.has(findingId)),
            );
            const expectedSubjects = input.duplicateGroups.length + ungrouped.size;
            expect(result.validation.handoffs).toBe(expectedSubjects);
            expect(result.validation.handoffSubjects).toBe(expectedSubjects);

            const linked = new Set<string>();
            for (const handoff of result.handoffs) {
              const parsed = parseAuditRecord(handoff);
              expect(
                parsed.success,
                `Handoff invalid: ${JSON.stringify(parsed.success ? null : parsed.diagnostics)}`,
              ).toBe(true);
              expect(
                handoff.requiresSeparateImplementationAuthorization,
              ).toBe(true);
              expect(handoff.authorizationNeed).toContain("separate");
              expect(handoff.affectedOccurrenceIds.length).toBeGreaterThan(0);
              for (const acceptance of [
                handoff.acceptanceStateIds,
                handoff.acceptanceViewportIds,
                handoff.acceptanceBrowserIds,
                handoff.acceptanceAccessContextIds,
                handoff.acceptanceLanguageIds,
              ]) {
                expect(acceptance.length).toBeGreaterThan(0);
              }
              for (const findingId of handoff.findingIds) {
                expect(linked.has(findingId)).toBe(false);
                linked.add(findingId);
              }
              // Fork ownership stays with the finding surface.
              if (handoff.productSurface === "planner") {
                for (const area of handoff.likelySourceAreas) {
                  expect(area).not.toContain("/Studio/");
                }
              }
              if (handoff.productSurface === "studio") {
                for (const area of handoff.likelySourceAreas) {
                  expect(area).not.toContain("/Planner/");
                }
              }
            }
            for (const spec of specs) {
              expect(linked.has(`finding.w5h.${spec.key}`)).toBe(true);
            }
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "Feature: site-ui-content-links-audit, Property W5H: Remediation handoff completeness — copy/Hindi ingestion and pending operations are explicit (Req 8.3-8.8, 24.1-24.8, 26.6, 26.8-26.10)",
      () => {
        fc.assert(
          fc.property(arbSpecs, (specs) => {
            const input = buildInput(specs);
            const result = buildRemediationHandoffs(input, CREATED_AT);

            const copyDefects = specs.filter((spec) => spec.copy);
            expect(result.validation.copyDefects).toBe(copyDefects.length);
            expect(result.validation.copyProposalsValid).toBe(
              copyDefects.filter((spec) => spec.proposalValid).length,
            );

            for (const spec of copyDefects) {
              const mismatches = result.validation.copyProposalMismatches;
              const defectKey = `finding.w5h.${spec.key}`;
              const handoff = result.handoffs.find((candidate) =>
                candidate.findingIds.includes(defectKey),
              );
              if (spec.proposalValid) {
                expect(
                  mismatches,
                ).not.toContain(`copy-defect-without-valid-proposal:${defectKey}`);
                // Ungrouped defects link their own proposal; a grouped handoff
                // links the group's first valid proposal.
                if (spec.groupId) {
                  expect(handoff?.copyProposalId).toMatch(/^proposal\.w5h\./);
                } else {
                  expect(handoff?.copyProposalId).toBe(`proposal.w5h.${spec.key}`);
                }
              } else {
                expect(
                  mismatches,
                ).toContain(`copy-defect-without-valid-proposal:${defectKey}`);
                // A defect whose own proposal is invalid never links it unless
                // its duplicate group carries another member's valid proposal.
                if (!spec.groupId) {
                  expect(handoff?.copyProposalId).toBeUndefined();
                } else {
                  expect(
                    handoff?.copyProposalId === undefined ||
                      result.validation.copyProposalsValid > 0,
                  ).toBe(true);
                }
              }
            }

            // Pending operations carry their affected occurrences.
            const distinctPending = new Set(
              specs
                .map((spec) => spec.pendingOperation)
                .filter((value): value is string => Boolean(value)),
            );
            expect(result.validation.pendingOperationCount).toBe(
              distinctPending.size,
            );
            for (const pending of distinctPending) {
              const operation = result.pendingOperations.find(
                (candidate) => candidate.pendingOperation === pending,
              );
              expect(operation).toBeDefined();
              for (const spec of specs.filter((candidate) => candidate.pendingOperation === pending)) {
                expect(operation?.affectedOccurrenceIds).toContain(
                  `occurrence.w5h.${spec.key}`,
                );
              }
            }
            expect(result.validation.pendingOperationOccurrences).toBe(
              specs.filter((spec) => spec.pendingOperation).length,
            );

            // Closure finalization preserves totals.
            const closure = finalizeClosureRecords({
              exclusions: [],
              coverageGaps: [],
              pendingOperations: result.pendingOperations,
            });
            expect(closure.totals.pendingOperations).toBe(result.pendingOperations.length);
            expect(closure.totals.exclusions).toBe(0);
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "Feature: site-ui-content-links-audit, Property W5H: Remediation handoff completeness — invalid exclusions and gaps stay visible as unclassified (Req 24.1-24.8, 26.9)",
      () => {
        fc.assert(
          fc.property(
            arbSpecs,
            fc.integer({ min: 0, max: 3 }),
            fc.integer({ min: 0, max: 3 }),
            (specs, exclusionCount, gapCount) => {
              const input = buildInput(specs);
              const exclusions: object[] = [];
              for (let index = 0; index < exclusionCount; index += 1) {
                exclusions.push({
                  ...envelope(`record.exclusion.w5h.${index}`),
                  recordType: "exclusion",
                  exclusionId: `exclusion.w5h.${index}`,
                  inventoryId: `route.w5h.${index}`,
                  itemKind: "route",
                  reason: "Fixture local-only route outside the audit scope.",
                  evidenceReferences: [`fixture:${index}`],
                  decisionOwner: "repository-owner",
                  decidedAt: CREATED_AT,
                  reconsiderationTrigger: "Route reactivation.",
                  requiresOwnerDecision: index % 2 === 0,
                  productSurface: "marketing",
                });
              }
              exclusions.push({ recordType: "exclusion", broken: true });
              const coverageGaps: object[] = [];
              for (let index = 0; index < gapCount; index += 1) {
                coverageGaps.push({
                  ...envelope(`record.gap.w5h.${index}`),
                  recordType: "coverage-gap",
                  gapId: `gap.w5h.${index}`,
                  inventoryId: `route.w5h.${index}`,
                  affectedOccurrenceIds: [`occurrence.w5h.${specs[index % specs.length]!.key}`],
                  attemptedEvidenceSources: ["repository-data"],
                  missingPrerequisite: "Fixture data adapter.",
                  userImpact: "Coverage remains incomplete.",
                  proposedResolution: "Implement the adapter.",
                  owner: "audit-tooling",
                  status: "open",
                });
              }
              coverageGaps.push({ recordType: "coverage-gap", broken: true });

              const result = buildRemediationHandoffs(
                { ...input, exclusions, coverageGaps },
                CREATED_AT,
              );
              expect(result.validation.exclusionsFinal).toBe(exclusionCount);
              expect(result.validation.unclassifiedExclusions).toBe(1);
              expect(result.validation.coverageGapsFinal).toBe(gapCount);
              expect(result.validation.unclassifiedCoverageGaps).toBe(1);
              expect(result.validation.ownerDecisionExclusions).toBe(
                Math.ceil(exclusionCount / 2),
              );
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  },
);
