/**
 * Evidence Record renderer for operations-deployment-backup-review.
 *
 * Responsibilities:
 *   - validateOutputPath  — enforces approved output locations; throws for rejected paths.
 *   - redactSecrets       — replaces credential-like values with [REDACTED]; never removes key names.
 *   - renderEvidenceRecordJSON     — produces a redacted JSON string with a generation note.
 *   - renderEvidenceRecordMarkdown — produces a redacted, partitioned Markdown summary.
 *   - assembleReview      — merges all surface records into one EvidenceRecord.
 *
 * This module renders and assembles strings only. It never writes files, makes
 * network calls, reads environment variables, or imports provider clients.
 *
 * No protected operation is executed by this module.
 */

import type {
  AlignmentDifference,
  EvidenceFact,
  EvidenceRecord,
  Gap,
  ProtectedOperation,
  ReleaseDecision,
  RestoreDrill,
} from "./models";
import type { AlignmentComparisonResult } from "./alignmentComparator";
import type { DatabaseReview } from "./extractors/databases";
import type { MonitoringReview } from "./extractors/monitoring";
import type { R2WorkflowExtraction } from "./extractors/r2";
import type { VercelExtractionResult } from "./extractors/vercel";
import type { WorkerReviewExtraction } from "./extractors/worker";

// ---------------------------------------------------------------------------
// Output-path enforcement
// ---------------------------------------------------------------------------

const APPROVED_PATH_PREFIXES = [
  "agents-work/operations-deployment-backup-review/reviews/",
  "results/operations-deployment-backup-review/",
] as const;

const REJECTED_PATH_PATTERNS: ReadonlyArray<{ test: (p: string) => boolean; reason: string }> = [
  {
    test: (p) => /^https?:\/\//i.test(p),
    reason:
      "HTTP/HTTPS URL paths are not permitted; outputs must be repository-local paths only.",
  },
  {
    test: (p) => /^s3:\/\//i.test(p),
    reason: "S3 bucket paths are not permitted; provider-backed storage is not an approved output location.",
  },
  {
    test: (p) => /^r2:\/\//i.test(p),
    reason: "R2 bucket paths are not permitted; provider-backed storage is not an approved output location.",
  },
  {
    test: (p) => /^gs:\/\//i.test(p),
    reason:
      "GCS bucket paths are not permitted; provider-backed storage is not an approved output location.",
  },
  {
    test: (p) => normalizeSlashes(p).startsWith("site/"),
    reason: "Paths under site/ are not permitted; review outputs must never be placed in the product source tree.",
  },
  {
    test: (p) => isResultsRoot(normalizeSlashes(p)),
    reason:
      "The results/ root is not permitted. Use results/operations-deployment-backup-review/ instead.",
  },
];

function normalizeSlashes(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isResultsRoot(normalized: string): boolean {
  // Matches "results/" root or bare "results" but NOT "results/operations-deployment-backup-review/"
  if (!normalized.startsWith("results/") && normalized !== "results") return false;
  return !normalized.startsWith("results/operations-deployment-backup-review/");
}

/**
 * Validate that `outputPath` is an approved output location.
 *
 * Approved locations:
 *   - agents-work/operations-deployment-backup-review/reviews/…
 *   - results/operations-deployment-backup-review/…
 *
 * Throws a descriptive Error for any rejected path.
 */
export function validateOutputPath(outputPath: string): void {
  const normalized = normalizeSlashes(outputPath);

  for (const rule of REJECTED_PATH_PATTERNS) {
    if (rule.test(outputPath)) {
      throw new Error(
        `Output path rejected: "${outputPath}". Reason: ${rule.reason}`,
      );
    }
  }

  const isApproved = APPROVED_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  if (!isApproved) {
    throw new Error(
      `Output path rejected: "${outputPath}". ` +
        `Approved locations are:\n` +
        APPROVED_PATH_PREFIXES.map((p) => `  - ${p}`).join("\n"),
    );
  }
}

// ---------------------------------------------------------------------------
// Secret redaction
// ---------------------------------------------------------------------------

/**
 * Patterns whose *value portion* is replaced with [REDACTED].
 * Key names are always preserved.
 */
const REDACTION_PATTERNS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  // key=value or key:value forms (case-insensitive key)
  {
    pattern:
      /(?<=(?:secret|key|token|password|pwd|auth|credential|apikey|api_key)s?\s*[=:]\s*)\S+/gi,
    replacement: "[REDACTED]",
  },
  // PostgreSQL / Supabase connection strings — redact everything after "://"
  {
    pattern: /(?<=(?:postgres(?:ql)?):\/\/)[^\s'"]+/gi,
    replacement: "[REDACTED]",
  },
  // Long base64-like strings (40+ characters: alphanumeric, +, /, =)
  {
    pattern: /(?<![a-zA-Z0-9+/=])[a-zA-Z0-9+/]{40,}={0,2}(?![a-zA-Z0-9+/=])/g,
    replacement: "[REDACTED]",
  },
];

/**
 * Redact secret-like values in a string. Key/variable names are never removed.
 * Only the value portion is replaced with [REDACTED].
 */
export function redactSecrets(value: string): string {
  let result = value;
  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    // Reset lastIndex for global patterns to avoid cross-call state bugs
    pattern.lastIndex = 0;
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Walk every string value in an arbitrary JSON-compatible structure and apply
 * redactSecrets to it. Arrays and nested objects are walked recursively.
 * Non-string scalar values (numbers, booleans, null) are preserved as-is.
 */
function redactDeep<T>(value: T): T {
  if (typeof value === "string") {
    return redactSecrets(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(redactDeep) as unknown as T;
  }
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = redactDeep(v);
    }
    return result as unknown as T;
  }
  return value;
}

// ---------------------------------------------------------------------------
// JSON rendering
// ---------------------------------------------------------------------------

const GENERATION_NOTE =
  "Generated by operations-deployment-backup-review tool. No protected operation was executed.";

/**
 * Serialize an EvidenceRecord to JSON with:
 *   - Deep secret redaction on all string values
 *   - A top-level `_generationNote` field asserting no protected operation was run
 */
export function renderEvidenceRecordJSON(record: EvidenceRecord): string {
  const redacted = redactDeep(record);
  const withNote = { _generationNote: GENERATION_NOTE, ...redacted };
  return JSON.stringify(withNote, null, 2);
}

// ---------------------------------------------------------------------------
// Markdown rendering helpers
// ---------------------------------------------------------------------------

function mdHeader(level: 1 | 2 | 3, title: string): string {
  return `${"#".repeat(level)} ${title}`;
}

function mdItemCount(count: number, noun: string): string {
  if (count === 0) return `*No ${noun} recorded.*`;
  return `*${count} ${noun}${count === 1 ? "" : "s"} recorded.*`;
}

function renderFact(fact: EvidenceFact): string {
  const lines: string[] = [
    `- **[${fact.id}]** \`${fact.surface}\` — ${redactSecrets(fact.statement)}`,
    `  - Status: \`${fact.status}\``,
    `  - Source: \`${fact.source.path}\` (${redactSecrets(fact.source.locator)})`,
  ];
  if (fact.externalEvidence) {
    lines.push(
      `  - External evidence: ${redactSecrets(fact.externalEvidence.summary)} ` +
        `(supplied by ${fact.externalEvidence.suppliedBy}, ` +
        `authorization: ${fact.externalEvidence.authorizationReference})`,
    );
  }
  return lines.join("\n");
}

function renderGap(gap: Gap): string {
  const lines: string[] = [
    `- **[${gap.id}]** \`${gap.surface}\` — ${redactSecrets(gap.missingOrContradictoryElement)}`,
    `  - Priority: \`${gap.priority}\` · Risk: \`${gap.risk}\``,
    `  - Sources: ${gap.sourcePaths.map((p) => `\`${p}\``).join(", ")}`,
    `  - Recommended follow-up: ${redactSecrets(gap.recommendedFollowUp)}`,
  ];
  if (gap.namedOwner) {
    lines.push(`  - Named owner: ${gap.namedOwner}`);
  }
  return lines.join("\n");
}

function renderProtectedOperation(op: ProtectedOperation): string {
  const lines: string[] = [
    `- **${redactSecrets(op.operation)}** on \`${op.targetSurface}\``,
    `  - Classification: \`${op.classification}\``,
    `  - Execution status: \`${op.executionStatus}\``,
    `  - Required authorization: ${redactSecrets(op.requiredAuthorization)}`,
    `  - Expected evidence:`,
    ...op.expectedEvidence.map((e) => `    - ${redactSecrets(e)}`),
  ];
  return lines.join("\n");
}

function renderReleaseDecision(decision: ReleaseDecision): string {
  const lines: string[] = [
    `- **Surface:** \`${decision.surface}\``,
    `  - Approval point: ${redactSecrets(decision.approvalPoint)}`,
    `  - Rollback/recovery: ${redactSecrets(decision.rollbackOrRecoveryProcedure)}`,
    `  - Expected verification evidence:`,
    ...decision.expectedVerificationEvidence.map((e) => `    - ${redactSecrets(e)}`),
  ];
  if (decision.persistedDataImpact) {
    const pdi = decision.persistedDataImpact;
    lines.push(
      `  - Persisted data impact:`,
      `    - Database owners: ${pdi.databaseOwners.join(", ")}`,
      `    - Migration impact: ${redactSecrets(pdi.migrationImpact)}`,
      `    - Seed impact: ${redactSecrets(pdi.seedImpact)}`,
      `    - Backup prerequisite: ${redactSecrets(pdi.backupPrerequisite)}`,
      `    - Compatibility hazard: ${redactSecrets(pdi.compatibilityHazard)}`,
      `    - Code release order: ${redactSecrets(pdi.codeReleaseOrder)}`,
    );
  }
  return lines.join("\n");
}

function renderRestoreDrill(drill: RestoreDrill): string {
  const lines: string[] = [
    `- **Recovery path:** \`${drill.recoveryPath}\``,
    `  - Authorized operator: ${redactSecrets(drill.authorizedOperator)}`,
    `  - Non-production target: ${redactSecrets(drill.nonProductionTarget)}`,
    `  - Artifact category: ${redactSecrets(drill.artifactCategory)}`,
    `  - Recovery objective: ${redactSecrets(drill.recoveryObjective)}`,
    `  - Data handling boundary: ${redactSecrets(drill.dataHandlingBoundary)}`,
    `  - Cleanup/rollback: ${redactSecrets(drill.cleanupOrRollback)}`,
    `  - Success evidence:`,
    ...drill.successEvidence.map((e) => `    - ${redactSecrets(e)}`),
    `  - Execution: ${renderProtectedOperation(drill.execution).replace(/^- /, "").replace(/\n/g, "\n    ")}`,
  ];
  return lines.join("\n");
}

function renderAlignmentDifference(diff: AlignmentDifference): string {
  const [pathA, pathB] = diff.sourcePaths;
  const lines: string[] = [
    `- **\`${diff.surface}\`** — dimension: \`${diff.dimension}\``,
    `  - Source A: \`${pathA}\``,
    `  - Source B: \`${pathB}\``,
    `  - Exact difference: ${redactSecrets(diff.exactDifference)}`,
    `  - Recommended resolution: ${redactSecrets(diff.recommendedResolution)}`,
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

/**
 * Render an EvidenceRecord as a partitioned Markdown document.
 *
 * Sections (in order):
 *   1. Title + metadata
 *   2. Non-execution statement
 *   3. Observed Repository Configuration
 *   4. Unverified External State
 *   5. Gaps and Recommendations (sorted by priority P0→P3)
 *   6. Protected Operations
 *   7. Release Decisions
 *   8. Restore Drills
 *   9. Alignment Differences
 *  10. Owner Decisions Required
 *
 * All string values are redacted before rendering.
 * Each finding occupies exactly one section.
 */
export function renderEvidenceRecordMarkdown(record: EvidenceRecord): string {
  const sections: string[] = [];

  // ── 1. Title and metadata ──────────────────────────────────────────────
  sections.push(mdHeader(1, "Operations Deployment Backup Review"));
  sections.push(
    [
      `- **Generated at:** ${record.metadata.generatedAt}`,
      record.metadata.repositoryRevision
        ? `- **Repository revision:** ${record.metadata.repositoryRevision}`
        : `- **Repository revision:** not available`,
      `- **Scope:** ${redactSecrets(record.metadata.scope)}`,
    ].join("\n"),
  );

  // ── 2. Non-execution statement ─────────────────────────────────────────
  sections.push("> No protected operation was executed by this review.");

  // ── 3. Observed Repository Configuration ──────────────────────────────
  const observed = record.observedConfiguration;
  sections.push(mdHeader(2, "Observed Repository Configuration"));
  sections.push(mdItemCount(observed.length, "observed configuration fact"));
  if (observed.length > 0) {
    sections.push(observed.map(renderFact).join("\n"));
  }

  // ── 4. Unverified External State ───────────────────────────────────────
  const unverified = record.unverifiedExternalState;
  sections.push(mdHeader(2, "Unverified External State"));
  sections.push(mdItemCount(unverified.length, "unverified external state item"));
  if (unverified.length > 0) {
    sections.push(unverified.map(renderFact).join("\n"));
  }

  // ── 5. Gaps and Recommendations (sorted P0→P3) ─────────────────────────
  const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const sortedGaps = [...record.gapsAndRecommendations].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
  );
  sections.push(mdHeader(2, "Gaps and Recommendations"));
  sections.push(mdItemCount(sortedGaps.length, "gap or recommendation"));
  if (sortedGaps.length > 0) {
    sections.push(sortedGaps.map(renderGap).join("\n"));
  }

  // ── 6. Protected Operations ─────────────────────────────────────────────
  const ops = record.protectedOperations;
  sections.push(mdHeader(2, "Protected Operations"));
  sections.push(
    `*${ops.length} protected operation${ops.length === 1 ? "" : "s"} identified. None were executed.*`,
  );
  if (ops.length > 0) {
    sections.push(ops.map(renderProtectedOperation).join("\n"));
  }

  // ── 7. Release Decisions ────────────────────────────────────────────────
  const releases = record.releaseDecisions;
  sections.push(mdHeader(2, "Release Decisions"));
  sections.push(mdItemCount(releases.length, "release decision"));
  if (releases.length > 0) {
    sections.push(releases.map(renderReleaseDecision).join("\n"));
  }

  // ── 8. Restore Drills ───────────────────────────────────────────────────
  const drills = record.restoreDrills;
  sections.push(mdHeader(2, "Restore Drills"));
  sections.push(mdItemCount(drills.length, "restore drill"));
  if (drills.length > 0) {
    sections.push(drills.map(renderRestoreDrill).join("\n"));
  }

  // ── 9. Alignment Differences ────────────────────────────────────────────
  const diffs = record.alignmentDifferences;
  sections.push(mdHeader(2, "Alignment Differences"));
  sections.push(mdItemCount(diffs.length, "alignment difference"));
  if (diffs.length > 0) {
    sections.push(diffs.map(renderAlignmentDifference).join("\n"));
  }

  // ── 10. Owner Decisions Required ────────────────────────────────────────
  const decisions = record.ownerDecisions;
  sections.push(mdHeader(2, "Owner Decisions Required"));
  sections.push(mdItemCount(decisions.length, "owner decision"));
  if (decisions.length > 0) {
    sections.push(decisions.map((d) => `- ${redactSecrets(d)}`).join("\n"));
  }

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Review assembler
// ---------------------------------------------------------------------------

export interface ReviewAssemblyParams {
  readonly vercelReview: VercelExtractionResult;
  readonly workerReview: WorkerReviewExtraction;
  readonly databaseReview: DatabaseReview;
  readonly r2Review: R2WorkflowExtraction;
  readonly monitoringReview: MonitoringReview;
  readonly alignmentResult: AlignmentComparisonResult;
  /** Optional: locally available git revision string, no network access. */
  readonly repositoryRevision?: string;
}

const REVIEW_SCOPE =
  "Repository-local operations review covering Vercel application, Cloudflare Worker, " +
  "Products database (erpweaiypimorcunaimz), Admin database (rxzpznmxbaoxpikowmfc), " +
  "R2 backup flow, monitoring configuration, recovery planning, and runbook/CI alignment.";

/**
 * Merge all surface review records into a single EvidenceRecord.
 *
 * Each finding occupies exactly one section. Protected operations, gaps, and
 * release decisions from every surface are collected without duplication.
 * Alignment differences and restore drills are preserved as separate sections.
 *
 * No file I/O, network access, or provider interaction occurs here.
 */
export function assembleReview(params: ReviewAssemblyParams): EvidenceRecord {
  const {
    vercelReview,
    workerReview,
    databaseReview,
    r2Review,
    monitoringReview,
    alignmentResult,
    repositoryRevision,
  } = params;

  // ── Collect all observed configuration facts ───────────────────────────
  const observedConfiguration: EvidenceFact[] = [
    ...vercelReview.observedConfiguration,
    ...workerReview.observedConfiguration,
    ...databaseReview.observedConfiguration,
    ...r2Review.observedConfiguration,
    ...monitoringReview.observedConfiguration,
  ];

  // ── Collect all unverified external state facts ────────────────────────
  const unverifiedExternalState: EvidenceFact[] = [
    ...vercelReview.unverifiedExternalState,
    ...workerReview.unverifiedExternalState,
    ...databaseReview.unverifiedExternalState,
    ...r2Review.unverifiedExternalState,
    ...monitoringReview.unverifiedExternalState,
  ];

  // ── Collect all protected operations ──────────────────────────────────
  const protectedOperations: ProtectedOperation[] = [
    ...databaseReview.protectedOperations,
    ...r2Review.protectedOperations,
    ...monitoringReview.protectedOperations,
    // Worker deployment operation from workerReview
    workerReview.deploymentOperation,
  ];

  // ── Collect all gaps and recommendations ──────────────────────────────
  const gapsAndRecommendations: Gap[] = [
    ...vercelReview.gaps,
    ...databaseReview.gaps,
    ...r2Review.gaps,
    ...monitoringReview.gaps,
    // Alignment result promotes high-risk differences into gap records
    ...alignmentResult.gaps,
  ];

  // ── Collect release decisions ──────────────────────────────────────────
  const releaseDecisions: ReleaseDecision[] = [];

  // Vercel release decision
  const vrd = vercelReview.releaseDecision;
  releaseDecisions.push({
    surface: "vercel-application",
    approvalPoint: vrd.approvalPoint,
    rollbackOrRecoveryProcedure: vrd.rollbackOrRecoveryProcedure,
    expectedVerificationEvidence: vrd.expectedVerificationEvidence,
    persistedDataImpact: vrd.persistedDataImpact,
  });

  // Worker release decision (independent — never merged into Vercel)
  const wrd = workerReview.releaseDecision;
  releaseDecisions.push({
    surface: "cloudflare-worker",
    approvalPoint: wrd.approvalPoint,
    rollbackOrRecoveryProcedure: wrd.rollbackOrRecoveryProcedure,
    expectedVerificationEvidence: wrd.expectedVerificationEvidence,
  });

  // ── Restore drills — populated by recovery planner when wired ─────────
  // The recovery planner outputs are not part of the extractor interfaces;
  // callers that have run the recovery planner should merge drills in after
  // calling assembleReview. We emit an empty array as the safe default.
  const restoreDrills: RestoreDrill[] = [];

  // ── Alignment differences ──────────────────────────────────────────────
  const alignmentDifferences: AlignmentDifference[] = [...alignmentResult.differences];

  // ── Owner decisions ─────────────────────────────────────────────────────
  // Core owner decisions that apply regardless of surface findings.
  const ownerDecisions: string[] = [
    "Select the output location for generated review artifacts: either " +
      "agents-work/operations-deployment-backup-review/reviews/ (authored decisions) " +
      "or results/operations-deployment-backup-review/ (generated evidence).",
    "Confirm named owner for any Vercel release that changes persisted data.",
    "Confirm named owner for any Cloudflare Worker release.",
    "Confirm Products database (erpweaiypimorcunaimz) backup and recovery owner.",
    "Confirm Admin database (rxzpznmxbaoxpikowmfc) backup and recovery owner.",
    "Authorize and schedule restore drills for all recovery paths before relying on them.",
  ];

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      repositoryRevision,
      scope: REVIEW_SCOPE,
    },
    observedConfiguration,
    unverifiedExternalState,
    protectedOperations,
    gapsAndRecommendations,
    ownerDecisions,
    releaseDecisions,
    restoreDrills,
    alignmentDifferences,
  };
}
