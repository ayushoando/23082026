/**
 * Alignment comparator for operations-deployment-backup-review.
 *
 * Compares normalized runbook/CI/configuration facts across six dimensions
 * and emits AlignmentDifference records for every detected mismatch.
 *
 * Pure functions only — no file access, network, spawning, or side effects.
 */

import type { AlignmentDifference, Gap, Priority, Risk } from "./models";
import type { RepositorySource } from "./sourceAdapter";

// ---------------------------------------------------------------------------
// Input contract
// ---------------------------------------------------------------------------

/**
 * Repository sources the alignment comparator needs.
 * Every field must carry a RepositorySource (path + content + digest).
 */
export interface AlignmentInput {
  /** OPERATIONS_RUNBOOK.md */
  readonly runbook: RepositorySource;
  /** root package.json */
  readonly rootPackage: RepositorySource;
  /** vercel.json */
  readonly vercelConfig: RepositorySource;
  /** workers/oando-worker-proxy/wrangler.toml */
  readonly workerConfig: RepositorySource;
  /** .github/workflows/supabase-backup-r2.yml */
  readonly ciWorkflow: RepositorySource;
  /** scripts/run-ops.mjs */
  readonly operationsRouter: RepositorySource;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract the `scripts` record from a serialised package.json.
 * Returns an empty object on parse failure (reported as a gap upstream).
 */
function parsePackageScripts(source: RepositorySource): Record<string, string> {
  try {
    const parsed = JSON.parse(source.content) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "scripts" in parsed &&
      typeof (parsed as Record<string, unknown>)["scripts"] === "object"
    ) {
      return (parsed as { scripts: Record<string, string> }).scripts ?? {};
    }
  } catch {
    // malformed JSON: caller gets an empty record; gap is the comparator's responsibility
  }
  return {};
}

/**
 * Extract all `pnpm run <script>` references from a Markdown text block.
 */
function extractRunbookScriptRefs(content: string): string[] {
  const matches = content.matchAll(/pnpm\s+run\s+([\w:@/-]+)/g);
  const refs: string[] = [];
  for (const m of matches) {
    if (m[1]) refs.push(m[1]);
  }
  return [...new Set(refs)];
}

/**
 * Find a named markdown section (from heading to next same-level heading).
 */
function markdownSection(content: string, heading: RegExp): string {
  const lines = content.split("\n");
  let capturing = false;
  const result: string[] = [];
  const levelMatch = heading.source.match(/^#+/);
  const level = levelMatch ? levelMatch[0].length : 2;
  for (const line of lines) {
    if (heading.test(line)) {
      capturing = true;
      result.push(line);
      continue;
    }
    if (capturing) {
      // Stop at a heading of same or higher level
      const nextHead = line.match(/^(#+)\s/);
      if (nextHead && nextHead[1].length <= level) break;
      result.push(line);
    }
  }
  return result.join("\n");
}

/**
 * Extract named owner/role mentions from a section of Markdown text.
 * Looks for patterns like "Owner:", "Responsible:", or role keywords.
 */
function extractOwnerMentions(text: string): string[] {
  const owners: string[] = [];
  const ownerPatterns = [
    /[Oo]wner[:\s]+([A-Za-z][A-Za-z0-9 _-]{1,50})/g,
    /[Rr]esponsible[:\s]+([A-Za-z][A-Za-z0-9 _-]{1,50})/g,
    /[Oo]wned by[:\s]+([A-Za-z][A-Za-z0-9 _-]{1,50})/g,
  ];
  for (const pattern of ownerPatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      if (m[1]) owners.push(m[1].trim());
    }
  }
  return [...new Set(owners)];
}

/**
 * Extract environment-variable names from vercel.json env/build/routes fields.
 */
function extractVercelEnvVars(content: string): string[] {
  const envVars: string[] = [];
  try {
    const parsed = JSON.parse(content) as unknown;
    if (typeof parsed !== "object" || parsed === null) return envVars;
    const obj = parsed as Record<string, unknown>;

    const collectKeys = (val: unknown): void => {
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        for (const k of Object.keys(val as Record<string, unknown>)) {
          // env var key pattern: all-caps with underscores
          if (/^[A-Z][A-Z0-9_]{1,60}$/.test(k)) {
            envVars.push(k);
          }
          collectKeys((val as Record<string, unknown>)[k]);
        }
      } else if (Array.isArray(val)) {
        for (const item of val) collectKeys(item);
      }
    };

    for (const section of ["env", "build", "functions", "routes"]) {
      if (section in obj) collectKeys(obj[section]);
    }
  } catch {
    // ignore parse errors
  }
  return [...new Set(envVars)];
}

/**
 * Extract environment-variable names documented in a runbook Markdown file.
 */
function extractRunbookEnvVarRefs(content: string): string[] {
  const matches = content.matchAll(/`([A-Z][A-Z0-9_]{1,60})`/g);
  const vars: string[] = [];
  for (const m of matches) {
    if (m[1]) vars.push(m[1]);
  }
  return [...new Set(vars)];
}

/**
 * Extract ordered step sequences from runbook content.
 * Returns an array of step labels in document order.
 */
function extractRunbookStepOrder(content: string): string[] {
  const lines = content.split("\n");
  const steps: string[] = [];
  for (const line of lines) {
    const ordered = line.match(/^\d+\.\s+(.+)/);
    if (ordered?.[1]) {
      steps.push(ordered[1].trim());
    }
  }
  return steps;
}

/**
 * Detect whether a CI workflow YAML contains an explicit approval gate
 * (environment with protection rules or required reviewers).
 */
function ciHasApprovalGate(content: string): boolean {
  return /environment:|required_reviewers:|reviewers:/i.test(content);
}

/**
 * Extract a runbook's documented CI approval steps/requirements.
 */
function runbookRequiresApproval(content: string): boolean {
  return /approval|authorized|sign.?off|owner must|requires owner/i.test(content);
}

/**
 * Extract all `pnpm run` command references from a YAML workflow file.
 */
function extractCiCommandRefs(content: string): string[] {
  const matches = content.matchAll(/pnpm\s+run\s+([\w:@/-]+)/g);
  const refs: string[] = [];
  for (const m of matches) {
    if (m[1]) refs.push(m[1]);
  }
  return [...new Set(refs)];
}

/**
 * Extract recovery procedure command references from runbook content.
 * Looks for "Recovery" or "Rollback" sections.
 */
function extractRunbookRecoveryCommands(content: string): string[] {
  const recoverySection = markdownSection(content, /^#+\s+.*[Rr]ecovery|[Rr]ollback/);
  return extractRunbookScriptRefs(recoverySection);
}

// ---------------------------------------------------------------------------
// Core comparison logic — one function per dimension
// ---------------------------------------------------------------------------

/**
 * Dimension: command
 * Runbook references `pnpm run X` but root package.json lacks script X,
 * or a CI workflow uses a command not in the package.json or runbook.
 */
function compareCommands(input: AlignmentInput): AlignmentDifference[] {
  const diffs: AlignmentDifference[] = [];
  const scripts = parsePackageScripts(input.rootPackage);
  const availableScripts = new Set(Object.keys(scripts));

  const runbookRefs = extractRunbookScriptRefs(input.runbook.content);
  const missingFromPackage = runbookRefs.filter((ref) => !availableScripts.has(ref));

  for (const cmd of missingFromPackage) {
    diffs.push({
      surface: "runbook-ci-alignment",
      dimension: "command",
      sourcePaths: [input.runbook.source.path, input.rootPackage.source.path],
      exactDifference: `Runbook references "pnpm run ${cmd}" but no such script exists in root package.json.`,
      recommendedResolution: `Add script "${cmd}" to root package.json, or update the runbook to reference the correct script name.`,
    });
  }

  // CI workflow uses commands not in package.json
  const ciRefs = extractCiCommandRefs(input.ciWorkflow.content);
  const missingCiCommands = ciRefs.filter((ref) => !availableScripts.has(ref));

  for (const cmd of missingCiCommands) {
    diffs.push({
      surface: "runbook-ci-alignment",
      dimension: "command",
      sourcePaths: [input.ciWorkflow.source.path, input.rootPackage.source.path],
      exactDifference: `CI workflow references "pnpm run ${cmd}" but no such script exists in root package.json.`,
      recommendedResolution: `Add script "${cmd}" to root package.json, or correct the CI workflow step command.`,
    });
  }

  // Operations router uses commands not in package.json
  const routerRefs = extractRunbookScriptRefs(input.operationsRouter.content);
  const missingRouterCommands = routerRefs.filter((ref) => !availableScripts.has(ref));

  for (const cmd of missingRouterCommands) {
    diffs.push({
      surface: "runbook-ci-alignment",
      dimension: "command",
      sourcePaths: [input.operationsRouter.source.path, input.rootPackage.source.path],
      exactDifference: `Operations router references "pnpm run ${cmd}" but no such script exists in root package.json.`,
      recommendedResolution: `Add script "${cmd}" to root package.json, or fix the operations router command reference.`,
    });
  }

  return diffs;
}

/**
 * Dimension: owner
 * A runbook section names an owner/role but CI workflow lacks an equivalent
 * authorization step (environment gate, required reviewer).
 */
function compareOwners(input: AlignmentInput): AlignmentDifference[] {
  const diffs: AlignmentDifference[] = [];

  const runbookOwners = extractOwnerMentions(input.runbook.content);
  const hasCiApproval = ciHasApprovalGate(input.ciWorkflow.content);

  if (runbookOwners.length > 0 && !hasCiApproval) {
    const ownerList = runbookOwners.join(", ");
    diffs.push({
      surface: "runbook-ci-alignment",
      dimension: "owner",
      sourcePaths: [input.runbook.source.path, input.ciWorkflow.source.path],
      exactDifference: `Runbook names owner(s) [${ownerList}] but CI workflow has no approval gate (environment protection or required reviewers).`,
      recommendedResolution:
        "Add an environment protection rule or required-reviewers step to the CI workflow to enforce the documented owner approval boundary.",
    });
  }

  return diffs;
}

/**
 * Dimension: environment
 * vercel.json declares an env var that runbook does not document (or vice versa).
 */
function compareEnvironments(input: AlignmentInput): AlignmentDifference[] {
  const diffs: AlignmentDifference[] = [];

  const vercelVars = new Set(extractVercelEnvVars(input.vercelConfig.content));
  const runbookVars = new Set(extractRunbookEnvVarRefs(input.runbook.content));

  // Vars in vercel.json but absent from runbook
  for (const envVar of vercelVars) {
    if (!runbookVars.has(envVar)) {
      diffs.push({
        surface: "runbook-ci-alignment",
        dimension: "environment",
        sourcePaths: [input.vercelConfig.source.path, input.runbook.source.path],
        exactDifference: `vercel.json references environment variable "${envVar}" that is not documented in OPERATIONS_RUNBOOK.md.`,
        recommendedResolution: `Document the purpose, owner, and required value constraints for "${envVar}" in the runbook environment section.`,
      });
    }
  }

  return diffs;
}

/**
 * Dimension: order
 * Runbook documents step sequence A→B→C but CI or script suggests a different
 * operational order (e.g., migration before seed vs. seed before migration).
 */
function compareOrder(input: AlignmentInput): AlignmentDifference[] {
  const diffs: AlignmentDifference[] = [];

  const runbookSteps = extractRunbookStepOrder(input.runbook.content);

  // Check for migration/seed ordering conflict
  const migrationIdx = runbookSteps.findIndex((s) => /migrat/i.test(s));
  const seedIdx = runbookSteps.findIndex((s) => /seed/i.test(s));

  if (migrationIdx !== -1 && seedIdx !== -1) {
    const runbookOrder = migrationIdx < seedIdx ? "migration → seed" : "seed → migration";

    // Check CI workflow for conflicting order
    const ciContent = input.ciWorkflow.content;
    const ciMigrationPos = ciContent.search(/migrat/i);
    const ciSeedPos = ciContent.search(/seed/i);

    if (ciMigrationPos !== -1 && ciSeedPos !== -1) {
      const ciOrder = ciMigrationPos < ciSeedPos ? "migration → seed" : "seed → migration";
      if (runbookOrder !== ciOrder) {
        diffs.push({
          surface: "runbook-ci-alignment",
          dimension: "order",
          sourcePaths: [input.runbook.source.path, input.ciWorkflow.source.path],
          exactDifference: `Runbook documents "${runbookOrder}" order but CI workflow implies "${ciOrder}" order.`,
          recommendedResolution:
            "Align the runbook and CI workflow to the same migration→seed ordering. Migrations must run before seed data.",
        });
      }
    }

    // Check operations router for conflicting order
    const routerContent = input.operationsRouter.content;
    const routerMigrationPos = routerContent.search(/migrat/i);
    const routerSeedPos = routerContent.search(/seed/i);

    if (routerMigrationPos !== -1 && routerSeedPos !== -1) {
      const routerOrder =
        routerMigrationPos < routerSeedPos ? "migration → seed" : "seed → migration";
      if (runbookOrder !== routerOrder) {
        diffs.push({
          surface: "runbook-ci-alignment",
          dimension: "order",
          sourcePaths: [input.runbook.source.path, input.operationsRouter.source.path],
          exactDifference: `Runbook documents "${runbookOrder}" order but operations router implies "${routerOrder}" order.`,
          recommendedResolution:
            "Align the runbook and operations router to the same migration→seed ordering.",
        });
      }
    }
  }

  return diffs;
}

/**
 * Dimension: approval
 * CI automates a backup or deployment action without a runbook approval
 * boundary or recovery reference.
 */
function compareApproval(input: AlignmentInput): AlignmentDifference[] {
  const diffs: AlignmentDifference[] = [];

  const ciAutomatesBackup =
    /backup|supabase.*backup|r2.*upload/i.test(input.ciWorkflow.content);
  const ciAutomatesDeployment = /deploy|vercel|wrangler/i.test(input.ciWorkflow.content);

  const hasCiApproval = ciHasApprovalGate(input.ciWorkflow.content);
  const runbookRequiresApprovalFlag = runbookRequiresApproval(input.runbook.content);

  if ((ciAutomatesBackup || ciAutomatesDeployment) && !hasCiApproval) {
    const actionType = ciAutomatesDeployment ? "deployment" : "backup";

    const recoveryRef = /recovery|rollback|restore/i.test(input.ciWorkflow.content);
    const missingElements: string[] = [];

    if (runbookRequiresApprovalFlag) {
      missingElements.push("approval gate");
    }
    if (!recoveryRef) {
      missingElements.push("recovery reference");
    }

    if (missingElements.length > 0) {
      diffs.push({
        surface: "runbook-ci-alignment",
        dimension: "approval",
        sourcePaths: [input.ciWorkflow.source.path, input.runbook.source.path],
        exactDifference: `CI workflow automates a ${actionType} action without: ${missingElements.join(", ")}.`,
        recommendedResolution: `Add ${missingElements.join(" and ")} to the CI workflow. Document the approval boundary and recovery procedure per the runbook requirement.`,
      });
    }
  }

  return diffs;
}

/**
 * Dimension: recovery
 * Documented recovery procedure references a command that doesn't exist in
 * package.json.
 */
function compareRecovery(input: AlignmentInput): AlignmentDifference[] {
  const diffs: AlignmentDifference[] = [];

  const scripts = parsePackageScripts(input.rootPackage);
  const availableScripts = new Set(Object.keys(scripts));
  const recoveryCommands = extractRunbookRecoveryCommands(input.runbook.content);

  for (const cmd of recoveryCommands) {
    if (!availableScripts.has(cmd)) {
      diffs.push({
        surface: "runbook-ci-alignment",
        dimension: "recovery",
        sourcePaths: [input.runbook.source.path, input.rootPackage.source.path],
        exactDifference: `Recovery procedure references "pnpm run ${cmd}" but no such script exists in root package.json.`,
        recommendedResolution: `Add script "${cmd}" to root package.json or update the recovery procedure to reference a script that exists.`,
      });
    }
  }

  return diffs;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AlignmentComparisonResult {
  readonly differences: readonly AlignmentDifference[];
  readonly gaps: readonly Gap[];
}

/**
 * Compare runbook, package.json, Vercel config, Worker config, CI workflow,
 * and operations router across all six alignment dimensions.
 *
 * Returns AlignmentDifference records (source-linked, exact difference,
 * recommended resolution) and Gap records for structural issues.
 *
 * Pure function: no file I/O, no side effects.
 */
export function compareAlignment(input: AlignmentInput): AlignmentComparisonResult {
  const allDifferences: AlignmentDifference[] = [
    ...compareCommands(input),
    ...compareOwners(input),
    ...compareEnvironments(input),
    ...compareOrder(input),
    ...compareApproval(input),
    ...compareRecovery(input),
  ];

  // Promote alignment differences that map to P0/P1 risk into Gap records
  const gaps: Gap[] = allDifferences
    .filter(
      (d) =>
        d.dimension === "approval" ||
        d.dimension === "recovery" ||
        d.dimension === "owner",
    )
    .map((d, idx): Gap => {
      const priority: Priority =
        d.dimension === "approval" || d.dimension === "recovery" ? "P1" : "P2";
      const risk: Risk =
        d.dimension === "approval" || d.dimension === "recovery" ? "high" : "medium";

      return {
        id: `alignment.${d.dimension}.${idx}`,
        surface: d.surface,
        missingOrContradictoryElement: d.exactDifference,
        risk,
        priority,
        sourcePaths: [...d.sourcePaths],
        recommendedFollowUp: d.recommendedResolution,
      };
    });

  return { differences: allDifferences, gaps };
}

/**
 * Assert that a given AlignmentDifference satisfies the structural invariants.
 * Returns a string describing the first violation, or null if the record is valid.
 */
export function validateAlignmentDifference(diff: AlignmentDifference): string | null {
  if (!diff.sourcePaths[0]?.trim()) {
    return "sourcePaths[0] must be a non-empty source path";
  }
  if (!diff.sourcePaths[1]?.trim()) {
    return "sourcePaths[1] must be a non-empty source path";
  }
  if (!diff.exactDifference.trim()) {
    return "exactDifference must be non-empty";
  }
  if (!diff.recommendedResolution.trim()) {
    return "recommendedResolution must be non-empty";
  }
  const validDimensions = ["command", "owner", "environment", "order", "approval", "recovery"];
  if (!validDimensions.includes(diff.dimension)) {
    return `dimension must be one of: ${validDimensions.join(", ")}`;
  }
  return null;
}
