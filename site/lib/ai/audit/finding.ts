/**
 * AI audit finding model.
 *
 * An internal documentation-level model with no HTTP coupling.
 * Describes audit findings across AI stack dimensions, their severity,
 * evidence, location, and approval-gating classification.
 */

// ---------------------------------------------------------------------------
// Severity
// ---------------------------------------------------------------------------

export type Severity = "critical" | "high" | "medium" | "low" | "info";

/**
 * Numeric rank for each severity level; used for descending-sort comparisons.
 * critical=5 (highest risk) … info=1 (lowest risk).
 */
export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

// ---------------------------------------------------------------------------
// Audit dimensions
// ---------------------------------------------------------------------------

/**
 * The seven audit dimensions.  Every finding must belong to exactly one.
 */
export type AuditDimension =
  | "correctness"
  | "provider-routing"
  | "retrieval-quality"
  | "error-handling"
  | "observability"
  | "route-contract"
  | "performance";

// ---------------------------------------------------------------------------
// Change class
// ---------------------------------------------------------------------------

/**
 * Non-safe change classes that require explicit owner approval before any
 * remediation is applied.
 */
export type ApprovalGatedClass =
  | "provider-config"
  | "prompt-change"
  | "retrieval-ranking"
  | "auth-rule"
  | "db-write"
  | "model-id";

/**
 * Full change-class union.  `"safe"` means the fix can be applied without
 * additional approval; any {@link ApprovalGatedClass} value defers the fix.
 */
export type ChangeClass = ApprovalGatedClass | "safe";

// ---------------------------------------------------------------------------
// Finding interface
// ---------------------------------------------------------------------------

export interface Finding {
  /** Unique kebab-case identifier for this finding. */
  readonly id: string;
  /** The audit dimension this finding belongs to. */
  readonly dimension: AuditDimension;
  /** Assessed risk severity. */
  readonly severity: Severity;
  /** Source location at which the finding was observed. */
  readonly location: {
    readonly file: string;
    readonly line?: number;
  };
  /** Verbatim code or text excerpt that supports the finding. */
  readonly evidence: string;
  /**
   * Whether remediation is safe to apply without additional approval, or
   * which approval-gated class applies.
   */
  readonly changeClass: ChangeClass;
  /** Plain-language description of the finding and its risk. */
  readonly description: string;
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Returns a new array of findings sorted descending by severity rank.
 * Within a severity band the original (input) order is preserved (stable sort).
 */
export function sequenceBySeverity(findings: readonly Finding[]): Finding[] {
  // Array.prototype.sort in modern V8/SpiderMonkey is stable; we exploit that
  // by relying on the original index for equal-rank elements.
  return [...findings].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity],
  );
}

/**
 * Returns `true` when the finding requires owner approval before its
 * remediation may be applied — i.e. `changeClass !== "safe"`.
 */
export function isApprovalGated(finding: Finding): boolean {
  return finding.changeClass !== "safe";
}
