/**
 * Risk prioritizer for operations-deployment-backup-review.
 *
 * Provides deterministic P0–P3 priority assignment for Gap records.
 * Rules are applied in strict precedence order; a P0/P1 gap is NEVER
 * downgraded because similar coverage exists elsewhere.
 *
 * Pure functions only — no file access, no network, no side effects.
 */

import type { Gap, Priority, Risk } from "./models";

// ---------------------------------------------------------------------------
// Scoring decision record
// ---------------------------------------------------------------------------

export interface GapScore {
  /** Assigned priority. */
  readonly priority: Priority;
  /** Assigned risk level. */
  readonly risk: Risk;
  /** Deterministic rationale for the assignment. */
  readonly rationale: string;
}

// ---------------------------------------------------------------------------
// Keyword classifiers
// ---------------------------------------------------------------------------

/**
 * P0 patterns — missing/contradictory prerequisites that could cause
 * unrecoverable data loss, uncontrolled production impact, or block a
 * known recovery path.
 */
const P0_PATTERNS: ReadonlyArray<{ pattern: RegExp; rationale: string }> = [
  {
    pattern: /no\s+named\s+owner|no\s+owner|owner\s+absent|ownership\s+ambiguous|no\s+rollback\s+owner/i,
    rationale:
      "No named owner for a schema-changing release — unrecoverable release without designated authority.",
  },
  {
    pattern: /no\s+(documented\s+)?restore\s+path|no\s+restore\s+procedure|restore\s+path\s+absent/i,
    rationale:
      "No documented restore path for a database — recovery is blocked without this prerequisite.",
  },
  {
    pattern: /products.*admin\s+ownership\s+ambiguous|database\s+ownership\s+ambiguous|ambiguous\s+database\s+owner/i,
    rationale:
      "Products/Admin ownership is ambiguous — recovery and release cannot proceed without clear ownership.",
  },
  {
    pattern: /no\s+rollback\s+(path|instruction|procedure)|rollback\s+(path|instruction|procedure)\s+absent/i,
    rationale:
      "No rollback path for a schema-changing release — the release is irreversible without a documented rollback.",
  },
  {
    pattern: /data\s+loss|unrecoverable|production\s+(impact|outage|corruption)/i,
    rationale:
      "Risk of unrecoverable data loss or uncontrolled production impact detected.",
  },
  {
    pattern: /no\s+migration\s+(rollback|instruction)|migration\s+rollback\s+absent/i,
    rationale:
      "Migration lacks a rollback instruction — schema-changing release cannot be safely reversed.",
  },
  {
    pattern: /recovery\s+path\s+blocked|blocks?\s+recovery/i,
    rationale: "A known recovery path is blocked by this missing prerequisite.",
  },
];

/**
 * P1 patterns — configured path that lacks required approval, evidence,
 * retention, integrity, or monitoring proof needed before operational approval.
 */
const P1_PATTERNS: ReadonlyArray<{ pattern: RegExp; rationale: string }> = [
  {
    pattern: /no\s+restore\s+drill\s+evidence|restore\s+drill\s+not\s+executed|drill\s+evidence\s+absent/i,
    rationale:
      "Scheduled backup has no restore drill evidence — restorability is unverified.",
  },
  {
    pattern: /worker\s+(change|release)\s+without\s+(independent|separate)\s+recovery|no\s+independent\s+worker\s+recovery/i,
    rationale:
      "Worker change has no independent recovery decision — Worker release cannot be approved independently.",
  },
  {
    pattern: /missing\s+backup\s+coverage|backup\s+(coverage\s+)?element\s+(missing|absent)|no\s+(source|target|retention|restore\s+procedure)\s+for\s+(products|admin|database)/i,
    rationale:
      "Missing backup coverage element for a named database — recovery planning is incomplete.",
  },
  {
    pattern: /no\s+approval\s+(gate|boundary)|approval\s+(gate|boundary)\s+(absent|missing)|ci\s+lacks\s+approval/i,
    rationale:
      "Automated action lacks an approval gate — protected operation may run without explicit owner authorization.",
  },
  {
    pattern: /lacks?\s+(monitoring\s+)?evidence|no\s+(monitoring\s+)?evidence|evidence\s+absent/i,
    rationale:
      "Release or recovery path lacks required monitoring evidence — operational approval is premature.",
  },
  {
    pattern: /no\s+recovery\s+reference|recovery\s+reference\s+absent|ci\s+lacks\s+recovery/i,
    rationale:
      "CI automation lacks a recovery reference — failure handling is undocumented.",
  },
  {
    pattern: /retention\s+(statement\s+)?(absent|missing|undocumented)|no\s+retention\s+statement/i,
    rationale:
      "Backup retention is undocumented — artifact lifecycle and recovery window are unknown.",
  },
  {
    pattern: /integrity\s+(check\s+)?(absent|missing|unverified)|no\s+integrity\s+check/i,
    rationale:
      "Backup integrity verification is absent — successful backup artifact is unconfirmed.",
  },
  {
    pattern: /monitoring\s+(proof|signals?)\s+(absent|missing)|no\s+monitoring\s+(proof|signals?)/i,
    rationale:
      "Release/recovery procedure lacks monitoring signals — operational state cannot be observed.",
  },
];

/**
 * P2 patterns — local config/runbook/CI inconsistency with a documented safe
 * fallback.
 */
const P2_PATTERNS: ReadonlyArray<{ pattern: RegExp; rationale: string }> = [
  {
    pattern: /command\s+(name\s+)?drift|runbook\s+references.*but.*package\.json|different\s+command\s+name/i,
    rationale:
      "Command name drift between runbook and package.json — execution may follow the wrong route.",
  },
  {
    pattern: /environment\s+(variable\s+)?drift|env\s+var\s+(not\s+documented|absent\s+from\s+runbook)/i,
    rationale:
      "Environment variable documented in config but absent from runbook — deployment prerequisite may be missed.",
  },
  {
    pattern: /order.of.operations\s+drift|step\s+order\s+(differs|mismatch)|ordering\s+(conflict|mismatch)/i,
    rationale:
      "Step ordering differs between runbook and CI/scripts — execution sequence may diverge.",
  },
  {
    pattern: /runbook.*references.*but.*not.*exist|script.*not.*exist.*runbook/i,
    rationale:
      "Runbook references a script that does not exist — could cause failed execution if followed literally.",
  },
  {
    pattern: /ci\s+workflow.*references.*but.*not.*package\.json|ci.*command.*not\s+in\s+package\.json/i,
    rationale:
      "CI workflow references a command that does not exist in package.json — workflow step will fail.",
  },
];

/**
 * P3 patterns — documentation completeness or clarity improvements.
 */
const P3_PATTERNS: ReadonlyArray<{ pattern: RegExp; rationale: string }> = [
  {
    pattern: /documentation\s+(completeness|clarity|improvement)|clarification\s+needed/i,
    rationale:
      "Documentation clarity improvement — command, owner, and recovery path are otherwise complete.",
  },
  {
    pattern: /context\s+(missing|absent)|no\s+context\s+provided/i,
    rationale:
      "Missing contextual explanation — the operational path is complete but not explained.",
  },
  {
    pattern: /description\s+(absent|missing)|undescribed\s+step/i,
    rationale:
      "Step description is absent — the procedure is identifiable but its intent is not explained.",
  },
];

// ---------------------------------------------------------------------------
// Priority-to-risk mapping
// ---------------------------------------------------------------------------

const PRIORITY_RISK_MAP: Readonly<Record<Priority, Risk>> = {
  P0: "critical",
  P1: "high",
  P2: "medium",
  P3: "low",
};

// ---------------------------------------------------------------------------
// ID prefix heuristics
// ---------------------------------------------------------------------------

/**
 * Extract a priority hint from a well-formed gap ID.
 * IDs authored by extractors follow patterns like:
 *   "products.backup.source.missing" → P1
 *   "alignment.approval.0"           → P1
 *   "alignment.recovery.0"           → P1
 *   "alignment.owner.0"              → P2
 *   "alignment.command.0"            → P2
 *   "monitoring.procedure.*.missing" → P1
 */
function hintFromId(id: string): Priority | null {
  // Structural id hints
  if (/alignment\.(approval|recovery)\.\d+/.test(id)) return "P1";
  if (/alignment\.(command|owner|environment|order)\.\d+/.test(id)) return "P2";
  if (/monitoring\.procedure\..+\.missing/.test(id)) return "P1";
  if (/\.(backup|restore|recovery|migration)\..*(missing|absent|gap)/.test(id)) return "P1";
  if (/ownership|ambiguous/.test(id)) return "P0";
  return null;
}

// ---------------------------------------------------------------------------
// Core scoring function
// ---------------------------------------------------------------------------

/**
 * Score a single Gap with a deterministic P0–P3 priority and risk level.
 *
 * Matching order: P0 → P1 → P2 → P3 → P2 fallback.
 * The result is based only on the gap's own content — never downgraded
 * because similar coverage exists elsewhere.
 */
export function scoreGap(gap: Gap): GapScore {
  const text = `${gap.missingOrContradictoryElement} ${gap.recommendedFollowUp} ${gap.id}`;

  // P0 — check most severe first
  for (const { pattern, rationale } of P0_PATTERNS) {
    if (pattern.test(text)) {
      return { priority: "P0", risk: "critical", rationale };
    }
  }

  // P1
  for (const { pattern, rationale } of P1_PATTERNS) {
    if (pattern.test(text)) {
      return { priority: "P1", risk: "high", rationale };
    }
  }

  // P2
  for (const { pattern, rationale } of P2_PATTERNS) {
    if (pattern.test(text)) {
      return { priority: "P2", risk: "medium", rationale };
    }
  }

  // P3
  for (const { pattern, rationale } of P3_PATTERNS) {
    if (pattern.test(text)) {
      return { priority: "P3", risk: "low", rationale };
    }
  }

  // ID-based structural hint (falls back to P2 default if hint is null)
  const idHint = hintFromId(gap.id);
  if (idHint !== null) {
    return {
      priority: idHint,
      risk: PRIORITY_RISK_MAP[idHint],
      rationale: `Gap ID "${gap.id}" structurally maps to ${idHint} by alignment dimension or extractor naming convention.`,
    };
  }

  // Default: P2 / medium — an unclassified gap has an unknown safe-fallback risk
  return {
    priority: "P2",
    risk: "medium",
    rationale:
      "No P0–P3 keyword pattern matched; defaulting to P2/medium as the conservative assignment for an unclassified configuration inconsistency.",
  };
}

// ---------------------------------------------------------------------------
// Bulk prioritizer
// ---------------------------------------------------------------------------

const PRIORITY_ORDER: Readonly<Record<Priority, number>> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

/**
 * Re-score and sort a list of Gap records from P0 to P3.
 *
 * The scored priority and risk may differ from the gap's authored values;
 * the scoring function's output is deterministic and takes precedence.
 * A gap is NEVER downgraded because similar coverage exists for another gap.
 *
 * Returns a new array sorted P0 → P3 (P0 first).
 */
export function prioritizeGaps(gaps: readonly Gap[]): Gap[] {
  return gaps
    .map((gap): Gap => {
      const { priority, risk } = scoreGap(gap);
      // Return an updated gap with the scored values; preserve all other fields
      return { ...gap, priority, risk };
    })
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}
