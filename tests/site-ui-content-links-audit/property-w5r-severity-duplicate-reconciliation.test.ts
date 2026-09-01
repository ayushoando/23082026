// @vitest-environment node
// Feature: site-ui-content-links-audit, Property W5R: Final severity reconciliation and duplicate grouping

/**
 * Property-based test for the Wave 5 Task 6.1 reconciliation generator.
 *
 * **Validates: Requirements 20.1-20.8, 21.1-21.7, 26.3-26.5, 26.7**
 *
 * Sub-properties verified here:
 *
 * 1. **Matrix/finding bijection and record retention** — every wave row maps
 *    to exactly one retained final finding; conflicts across waves are
 *    retained rather than merged away.
 * 2. **Duplicate grouping preserves every member** — nonconforming findings
 *    are either grouped or listed ungrouped exactly once; group member IDs,
 *    occurrence IDs, and evidence IDs are preserved.
 * 3. **Fork ownership cannot merge** — Planner and Studio symptoms are never
 *    grouped together, even when generated equivalently (surface-scoped
 *    signatures plus the schema's cross-fork guard).
 * 4. **Severity reconciliation is monotone** — merged cross-wave assessments
 *    carry the highest-supported severity; every original assessment stays
 *    and `requires-owner-decision` findings are preserved.
 * 5. **Fail-closed** — a wave whose rows have no matching finding record is
 *    rejected.
 *
 * All generated inputs are abstract audit records — not product fixtures and
 * not claims about rendered application behavior. No `site/**` import,
 * network, dev server, or product command is used.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  AUDIT_SCHEMA_VERSION,
  DuplicateGroupSchema,
  parseAuditRecord,
} from "../../scripts/site-ui-content-links-audit/schemas";
import type {
  ClassifiedRunRecords,
  WaveRecordSet,
} from "../../scripts/site-ui-content-links-audit/wave5-reconcile";
import {
  SEVERITY_ORDER,
  classifyRunRecords,
  groupRecordsIntoWaves,
  maxSeverity,
  reconcileWaveRecords,
  severityRank,
} from "../../scripts/site-ui-content-links-audit/wave5-reconcile";

const CREATED_AT = "2026-08-31T12:00:00.000Z";

type MatrixRowFixture = ClassifiedRunRecords["matrixRows"][number];
type FindingFixture = ClassifiedRunRecords["findings"][number];
type EvidenceFixture = ClassifiedRunRecords["evidenceRecords"][number];
type SeverityFixture = ClassifiedRunRecords["severityAssessments"][number];
/** Evidence severities exclude the reconciliation bottom `not-applicable`. */
type SpecSeverity = Exclude<(typeof SEVERITY_ORDER)[number], "not-applicable">;

type Surface = "marketing" | "administration" | "planner" | "studio";

const SURFACES: readonly Surface[] = [
  "marketing",
  "administration",
  "planner",
  "studio",
];

function surfaceSource(surface: Surface, key: string): string {
  switch (surface) {
    case "planner":
      return `site/components/Planner/${key}.tsx`;
    case "studio":
      return `site/components/Studio/${key}.tsx`;
    case "administration":
      return `site/app/admin/${key}.tsx`;
    default:
      return `site/components/site/${key}.tsx`;
  }
}

function envelope(recordId: string) {
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordId,
    createdAt: CREATED_AT,
  } as const;
}

interface Fixture {
  readonly rows: readonly MatrixRowFixture[];
  readonly findings: readonly FindingFixture[];
  readonly evidence: readonly EvidenceFixture[];
  readonly severities: readonly SeverityFixture[];
}

interface OccurrenceSpec {
  readonly key: string;
  readonly surface: Surface;
  readonly waves: readonly number[];
  readonly nonconforming: boolean;
  readonly severity: SpecSeverity;
  readonly ownerDecision: boolean;
  readonly dimension: string;
}

function buildFixtures(specs: readonly OccurrenceSpec[]): Fixture {
  const rows: MatrixRowFixture[] = [];
  const findings: FindingFixture[] = [];
  const evidence: EvidenceFixture[] = [];
  const severities: SeverityFixture[] = [];
  for (const spec of specs) {
    const occurrenceId = `occurrence.w5r.${spec.key}`;
    const findingId = `finding.w5r.${spec.key}`;
    const source = surfaceSource(spec.surface, spec.key);
    const assessmentId = `severity.w5r.${spec.key}`;
    for (const waveId of spec.waves) {
      const evidenceId = `evidence.w5r.${spec.key}.${waveId}`;
      const resultClassification: FindingFixture["resultClassification"] =
        spec.ownerDecision
          ? "requires-owner-decision"
          : spec.nonconforming
            ? "nonconforming"
            : "conforming";
      const status: MatrixRowFixture["status"] =
        resultClassification === "requires-owner-decision"
          ? "requires-owner-decision"
          : resultClassification;
      evidence.push({
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
        auditDimension: spec.dimension,
        expectedResult: "The source-visible contract holds.",
        observedResult: `Source inspection observed ${spec.dimension}.`,
        claimBasis: "source-observed",
        resultClassification,
        severity: spec.nonconforming && !spec.ownerDecision ? spec.severity : "advisory",
        severityRationale: "Fixture rationale for property testing.",
        userImpact: "No measured user impact is claimed.",
        evidenceLane: "static-inspection",
        evidenceType: "fixture-source",
        sourceOrRuntimeLocation: source,
        capturedAt: CREATED_AT,
        reproductionSteps: ["Inspect the fixture source location."],
        evidenceReferences: [`occurrence:${occurrenceId}`],
        requirementIds: ["20.1"],
        journeyIds: [],
        shellIds: [],
        relatedFindingIds: [],
        proposedOutcome: "Retain the documented contract.",
        likelyOwner: "fixture-owner",
        dependencies: [],
        verificationMethod: "Static source inspection.",
      });
      if (spec.nonconforming && !spec.ownerDecision) {
        severities.push({
          ...envelope(`record.${assessmentId}.${waveId}`),
          recordType: "severity-assessment",
          assessmentId: `${assessmentId}.${waveId}`,
          findingId,
          severity: spec.severity,
          severityRationale: `Fixture severity ${spec.severity}.`,
          decidingDimension: spec.dimension,
          userImpact: "Fixture impact statement.",
          affectedAudience: "fixture audience",
          journeyCriticality: "secondary",
          dataSensitivity: "none",
          legalOrConsentExposure: "none",
          occurrenceCount: 1,
          recoverability: "recoverable",
          workaroundQuality: "workaround available",
        });
      }
      findings.push({
        ...envelope(`record.${findingId}.w${waveId}`),
        recordType: "finding",
        findingId,
        occurrenceId,
        resultClassification,
        claimBasis: "source-observed",
        conclusionSummary: `Fixture finding for ${occurrenceId} in wave ${waveId}.`,
        evidenceIds: [evidenceId],
        requirementIds: ["20.1"],
        productSurface: spec.surface,
        ...(spec.nonconforming && !spec.ownerDecision
          ? { severityAssessmentId: `${assessmentId}.${waveId}` }
          : {}),
        copyRelated: false,
        ...(spec.ownerDecision
          ? {
              blockers: [
                {
                  blockerKind: "owner-decision" as const,
                  detail: "Severity ownership requires an owner decision.",
                  pendingOperation: "Owner decision on severity",
                },
              ],
            }
          : {}),
      });
      rows.push({
        ...envelope(`record.row.${spec.key}.${waveId}`),
        recordType: "matrix-row",
        occurrenceId,
        concreteUrl: `/${spec.key}`,
        productSurface: spec.surface,
        stateId: "state.default",
        viewportId: "viewport.desktop",
        browserId: "browser.chromium",
        accessContextId: "access.public-guest",
        languageId: "en",
        applicableDimensionIds: [spec.dimension],
        waveId: String(waveId),
        status,
        findingId,
        inputFingerprint: `fp-${spec.key}`,
        ...(spec.ownerDecision
          ? {
              blockers: [
                {
                  blockerKind: "owner-decision" as const,
                  detail: "Severity ownership requires an owner decision.",
                  pendingOperation: "Owner decision on severity",
                },
              ],
            }
          : {}),
      });
    }
  }
  return { rows, findings, evidence, severities };
}

function buildWaveSet(specs: readonly OccurrenceSpec[]): readonly WaveRecordSet[] {
  const fixtures = buildFixtures(specs);
  const byWave = new Map<
    number,
    {
      rows: MatrixRowFixture[];
      findings: FindingFixture[];
      evidence: EvidenceFixture[];
      severities: SeverityFixture[];
    }
  >();
  for (const record of fixtures.rows) {
    const waveId = Number(record.recordId.split(".").pop());
    const bucket = byWave.get(waveId) ?? {
      rows: [],
      findings: [],
      evidence: [],
      severities: [],
    };
    bucket.rows.push(record);
    byWave.set(waveId, bucket);
  }
  for (const record of fixtures.findings) {
    const waveId = Number(record.recordId.split(".").pop()?.replace("w", ""));
    const bucket = byWave.get(waveId);
    if (bucket) bucket.findings.push(record);
  }
  for (const record of fixtures.evidence) {
    const waveId = Number(record.evidenceId.split(".").pop());
    const bucket = byWave.get(waveId);
    if (bucket) bucket.evidence.push(record);
  }
  for (const record of fixtures.severities) {
    const waveId = Number(record.assessmentId.split(".").pop());
    const bucket = byWave.get(waveId);
    if (bucket) bucket.severities.push(record);
  }
  return [...byWave.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(
      ([waveId, bucket]): WaveRecordSet => ({
        waveId,
        matrixRows: bucket.rows,
        findings: bucket.findings,
        evidenceRecords: bucket.evidence,
        severityAssessments: bucket.severities,
      }),
    );
}

const arbSeverity = fc.constantFrom(
  "critical",
  "high",
  "medium",
  "low",
  "advisory",
) as fc.Arbitrary<SpecSeverity>;

const arbKey = fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/);

const arbSpecs: fc.Arbitrary<readonly OccurrenceSpec[]> = fc
  .uniqueArray(arbKey, { minLength: 1, maxLength: 5 })
  .chain((keys) =>
    fc
      .tuple(
        ...keys.map((key) =>
          fc.record({
            key: fc.constant(key),
            surface: fc.constantFrom<Surface>(...SURFACES),
            inWave1: fc.boolean(),
            inWave3: fc.boolean(),
            nonconforming: fc.boolean(),
            ownerDecision: fc.boolean(),
            severity: arbSeverity,
            dimension: fc.constantFrom(
              "dim.route-link-integrity",
              "dim.copy-ia",
              "dim.security-privacy",
            ),
          }),
        ),
      )
      .map((raws) =>
        raws.map((raw) => ({
          key: raw.key,
          surface: raw.surface,
          waves: [raw.inWave1 ? 1 : 0, raw.inWave3 ? 3 : 0].filter(
            (wave) => wave > 0,
          ),
          nonconforming: raw.nonconforming,
          ownerDecision: raw.ownerDecision,
          severity: raw.severity,
          dimension: raw.dimension,
        })),
      ),
  )
  .map((specs) =>
    specs.map((spec) => (spec.waves.length > 0 ? spec : { ...spec, waves: [1] })),
  );

describe(
  "Feature: site-ui-content-links-audit, Property W5R: Final severity reconciliation and duplicate grouping",
  () => {
    it(
      "Feature: site-ui-content-links-audit, Property W5R: Final severity reconciliation and duplicate grouping — bijection, member retention, and fork separation (Req 20.1-20.8, 21.1-21.7)",
      () => {
        fc.assert(
          fc.property(arbSpecs, (specs) => {
            const waves = buildWaveSet(specs);
            const result = reconcileWaveRecords(waves, CREATED_AT);

            const totalRows = waves.reduce(
              (sum, wave) => sum + wave.matrixRows.length,
              0,
            );
            expect(result.matrixFindingBijection).toBe(true);
            expect(result.finalFindings).toHaveLength(totalRows);

            // Every nonconforming finding is grouped or ungrouped exactly once.
            const nonconformingIds = new Set(
              result.finalFindings
                .filter(
                  (finding) => finding.resultClassification === "nonconforming",
                )
                .map((finding) => finding.findingId),
            );
            const groupedIds = new Set(
              result.duplicateGroups.flatMap((group) => group.findingIds),
            );
            const ungroupedIds = new Set(result.ungroupedDefectFindingIds);
            for (const findingId of nonconformingIds) {
              const inGroup = groupedIds.has(findingId);
              const inUngrouped = ungroupedIds.has(findingId);
              expect(inGroup !== inUngrouped).toBe(true);
            }
            for (const group of result.duplicateGroups) {
              const parsed = DuplicateGroupSchema.safeParse(group);
              expect(
                parsed.success,
                `Group invalid: ${JSON.stringify(parsed.error?.issues)}`,
              ).toBe(true);
              // Members and their occurrences/evidence are retained.
              const memberFindings = result.finalFindings.filter((finding) =>
                group.findingIds.includes(finding.findingId),
              );
              expect(memberFindings.length).toBeGreaterThanOrEqual(2);
              for (const finding of memberFindings) {
                expect(group.occurrenceIds).toContain(finding.occurrenceId);
                expect(finding.duplicateGroupId).toBe(group.duplicateGroupId);
              }
              // Fork separation: single surface per group.
              const surfaces = new Set(
                memberFindings.map((finding) => finding.productSurface),
              );
              expect(surfaces.size).toBe(1);
              expect(group.productSurface).toBe([...surfaces][0]);
            }
            // Planner and Studio are never in one group even with identical
            // synthetic symptom shapes.
            const plannerSpecs: readonly OccurrenceSpec[] = [
              {
                key: "crossplanner",
                surface: "planner",
                waves: [1],
                nonconforming: true,
                ownerDecision: false,
                severity: "medium",
                dimension: "dim.copy-ia",
              },
              {
                key: "crossstudio",
                surface: "studio",
                waves: [1],
                nonconforming: true,
                ownerDecision: false,
                severity: "medium",
                dimension: "dim.copy-ia",
              },
            ];
            const cross = reconcileWaveRecords(
              buildWaveSet(plannerSpecs),
              CREATED_AT,
            );
            for (const group of cross.duplicateGroups) {
              expect(group.findingIds).not.toHaveLength(2);
            }
            // requires-owner-decision records are preserved.
            const ownerIds = new Set(
              result.finalFindings
                .filter(
                  (finding) =>
                    finding.resultClassification === "requires-owner-decision",
                )
                .map((finding) => finding.findingId),
            );
            for (const findingId of ownerIds) {
              expect(result.requiresOwnerDecisionFindingIds).toContain(findingId);
            }
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "Feature: site-ui-content-links-audit, Property W5R: Final severity reconciliation and duplicate grouping — merged severity is the highest supported factor and originals stay (Req 21.1-21.7, 26.7)",
      () => {
        fc.assert(
          fc.property(
            fc.array(arbSeverity, { minLength: 1, maxLength: 5 }),
            arbSeverity,
            (severities, extra) => {
              // Monotonicity: a higher impact can never reduce severity.
              const max = maxSeverity(severities);
              for (const severity of severities) {
                expect(severityRank(max)).toBeGreaterThanOrEqual(
                  severityRank(severity),
                );
              }
              expect(severityRank(maxSeverity([...severities, extra]))).toBeGreaterThanOrEqual(
                severityRank(max),
              );

              // Cross-wave merge: one occurrence, two waves, two assessments.
              const lower: SpecSeverity =
                maxSeverity(severities) === "critical" ? "low" : "critical";
              const specs: readonly OccurrenceSpec[] = [
                {
                  key: "merged-occ",
                  surface: "marketing",
                  waves: [1, 3],
                  nonconforming: true,
                  ownerDecision: false,
                  severity: lower,
                  dimension: "dim.route-link-integrity",
                },
                {
                  key: "merged-occ-high",
                  surface: "marketing",
                  waves: [2],
                  nonconforming: true,
                  ownerDecision: false,
                  severity: "critical",
                  dimension: "dim.route-link-integrity",
                },
              ];
              const result = reconcileWaveRecords(buildWaveSet(specs), CREATED_AT);
              const merged = result.finalSeverityAssessments.filter(
                (assessment) =>
                  assessment.assessmentId.startsWith("severity.wave5.merged."),
              );
              for (const assessment of merged) {
                expect(
                  severityRank(assessment.severity),
                ).toBeGreaterThanOrEqual(severityRank(lower));
                expect(
                  parseAuditRecord(assessment).success,
                ).toBe(true);
              }
              // Originals retained.
              const originals = result.finalSeverityAssessments.filter(
                (assessment) => assessment.assessmentId.startsWith("severity.w5r."),
              );
              expect(originals.length).toBeGreaterThanOrEqual(specs.length);
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      "Feature: site-ui-content-links-audit, Property W5R: Final severity reconciliation and duplicate grouping — ingestion quarantines invalid records and reconciliation fails closed (Req 20.1, 22.8, 26.3)",
      () => {
        fc.assert(
          fc.property(arbSpecs, (specs) => {
            const fixtures = buildFixtures(specs);
            const classified: ClassifiedRunRecords = classifyRunRecords([
              ...fixtures.rows,
              ...fixtures.findings,
              ...fixtures.evidence,
              ...fixtures.severities,
              { recordType: "matrix-row", junk: true },
            ]);
            expect(classified.quarantinedCount).toBe(1);
            expect(classified.matrixRows.length).toBe(fixtures.rows.length);

            const waves = groupRecordsIntoWaves(classified);
            const result = reconcileWaveRecords(waves, CREATED_AT);
            expect(result.matrixFindingBijection).toBe(true);

            // Fail-closed: a row without a matching finding must be rejected.
            const brokenWave: WaveRecordSet = {
              waveId: 4,
              matrixRows: [
                {
                  ...fixtures.rows[0]!,
                  recordId: "record.row.broken",
                },
              ],
              findings: [],
              evidenceRecords: [],
              severityAssessments: [],
            };
            expect(() =>
              reconcileWaveRecords([brokenWave], CREATED_AT),
            ).toThrowError();
          }),
          { numRuns: 100 },
        );
      },
    );
  },
);
