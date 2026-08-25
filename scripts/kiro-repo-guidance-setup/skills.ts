/**
 * Lane C SkillEvaluator.
 *
 * This evaluator is deliberately read-only. It inspects the six repository
 * skill manifests and the visible steering relationship model, then projects
 * typed records. It never activates a skill, changes inclusion scope, invokes
 * a command, or contacts an external service.
 */

import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import {
  INITIAL_SKILL_CANDIDATES,
  REPOSITORY_ROOT,
  type EvidenceState,
  type IsoDate,
  type KiroSurface,
  type MaintenanceRisk,
  type OwnerDecision,
  type RepositoryPath,
  type SkillCandidate,
  type SkillRecord,
  type StageResult,
  type SteeringRecord,
  type ValidationRun,
} from "./contracts";

export const SKILL_ROOT = ".kiro/skills" as const;
export const STEERING_ROOT = ".kiro/steering" as const;
export const STEERING_PATH = `${STEERING_ROOT}/powers-skills-model.md` as const;
export const PRIMARY_REPOSITORY_GUIDANCE_SKILL = "repo-map" as const satisfies SkillCandidate;
export const SKILL_OWNER = "repository owner" as const;
export const OD08_DECISION_ID = "OD-08" as const;
export const LOCAL_REPOSITORY_SURFACE: KiroSurface = "Local_Repository_Surface";
export const LOCAL_REPOSITORY_VERSION = "repository" as const;
export const SKILL_VALIDATION_PREFIX = "validation:skill" as const;
export const SKILL_ROLLBACK_PREFIX = "rollback:skill" as const;

const VALID_DISPOSITIONS = [
  "retain",
  "update",
  "merge",
  "add",
  "retire",
  "observe",
  "defer",
] as const satisfies readonly SkillRecord["disposition"][];

export type SkillDisposition = (typeof VALID_DISPOSITIONS)[number];
export type OverlapResolutionKind = "merge" | "delegate" | "retire" | "reject";

export interface SkillEvaluatorInput {
  readonly repositoryRoot?: RepositoryPath;
  readonly reviewDateUtc?: IsoDate;
  readonly ownerDecisions?: readonly OwnerDecision[];
  /**
   * This explicit flag is accepted for callers whose owner-decision ledger is
   * stored outside the local process. It is only sufficient when true; a
   * false or omitted value remains fail-closed.
   */
  readonly od08Approved?: boolean;
  readonly validationRuns?: readonly ValidationRun[];
  readonly skillRoot?: RepositoryPath;
  readonly steeringPaths?: readonly RepositoryPath[];
}

export interface SkillManifestFields {
  readonly name: string;
  readonly description: string;
  readonly sensitiveContentDetected: boolean;
}

export interface SkillOverlapResolution {
  readonly sourcePath: RepositoryPath;
  readonly targetPath: RepositoryPath;
  readonly resolution: OverlapResolutionKind;
  readonly authoritativePath: RepositoryPath;
  readonly reason: string;
}

export interface EvaluatedSkillRecord extends SkillRecord {
  readonly evidenceState: EvidenceState;
  readonly manifestValid: boolean;
  readonly activationClaimed: boolean;
  readonly activationBlockers: readonly string[];
}

export interface EvaluatedSteeringRecord extends SteeringRecord {
  readonly evidenceState: EvidenceState;
}

export interface SkillEvaluationResult {
  readonly skills: readonly EvaluatedSkillRecord[];
  readonly steering: readonly EvaluatedSteeringRecord[];
  readonly primaryRepositoryGuidanceSkill: typeof PRIMARY_REPOSITORY_GUIDANCE_SKILL;
  readonly exactCandidateSet: readonly SkillCandidate[];
  readonly overlapResolutions: readonly SkillOverlapResolution[];
  readonly activationScopeClaimsAllowed: boolean;
  readonly activationEvidenceRefs: readonly string[];
  readonly blockers: readonly string[];
  readonly activationBlockers: readonly string[];
  readonly evidenceRefs: readonly string[];
}

export interface SkillEvaluatorContract {
  evaluate(input: SkillEvaluatorInput): StageResult<SkillEvaluationResult>;
}

interface SkillMetadata {
  readonly canonicalSources: readonly RepositoryPath[];
  readonly rootCommands: readonly string[];
  readonly constraints: readonly string[];
  readonly prerequisites: readonly RepositoryPath[];
  readonly activationScope: string;
  readonly maintenanceRisk: MaintenanceRisk;
}

interface ReadTextResult {
  readonly status: "available" | "absent" | "unreadable";
  readonly text?: string;
}

interface ManifestInspection {
  readonly folder: SkillCandidate;
  readonly path: RepositoryPath;
  readonly manifestName: string;
  readonly description: string;
  readonly inventoryStatus: SkillRecord["inventoryStatus"];
  readonly manifestValid: boolean;
  readonly errors: readonly string[];
}

const SKILL_METADATA: Readonly<Record<SkillCandidate, SkillMetadata>> = {
  "repo-map": {
    canonicalSources: [
      "AGENTS.md",
      "START.md",
      "docs/architecture/layout.md",
      "docs/architecture/stack.md",
      "docs/architecture/routes.md",
      "docs/architecture/product-map.md",
      "scripts/graph-impact.mjs",
    ],
    rootCommands: [
      "node scripts/graph-impact.mjs --stats",
      "node scripts/graph-impact.mjs --file=<path>",
      "node scripts/graph-impact.mjs --circles",
      "pnpm run docs:sync",
    ],
    constraints: [
      "authority order is user > live code and fresh commands > AGENTS.md > Agents/* > canonical docs/*",
      "orient from canonical repository docs before scanning files blindly",
      "commands run from the repository root with pnpm or reviewed node scripts",
      "do not create worktrees, global settings, external service routes, or product changes",
    ],
    prerequisites: [
      "AGENTS.md",
      "START.md",
      "docs/architecture/layout.md",
      "docs/architecture/stack.md",
      "docs/architecture/routes.md",
      "docs/architecture/product-map.md",
      "scripts/graph-impact.mjs",
      "package.json",
    ],
    activationScope: "primary repository orientation entry point; on-demand activation only after validation",
    maintenanceRisk: "medium",
  },
  "graph-impact": {
    canonicalSources: [
      "AGENTS.md",
      ".kiro/skills/repo-map/SKILL.md",
      "scripts/graph-impact.mjs",
      "package.json",
    ],
    rootCommands: [
      "node scripts/graph-impact.mjs --file=<path>",
      "node scripts/graph-impact.mjs --stats",
      "node scripts/graph-impact.mjs --circles",
      "pnpm run gate:fast",
    ],
    constraints: [
      "use the repository import graph before selecting a broad test scope",
      "run the scoped test command suggested by the graph tool",
      "the fix loop is bounded to at most three iterations before gate:fast",
      "retain the manual graph-impact workflow as the fallback",
    ],
    prerequisites: [
      "AGENTS.md",
      ".kiro/skills/repo-map/SKILL.md",
      "scripts/graph-impact.mjs",
      "package.json",
    ],
    activationScope: "on-demand graph and blast-radius analysis; activation only after validation",
    maintenanceRisk: "medium",
  },
  "verify-and-gate": {
    canonicalSources: [
      "AGENTS.md",
      "Agents/02-testing.md",
      "Testing-handbook.md",
      "tests/vitest.config.ts",
      "tests/vitest.tech-docs.config.ts",
      "package.json",
    ],
    rootCommands: [
      "pnpm exec vitest run --config tests/vitest.config.ts <path>",
      "pnpm run gate:fast",
      "pnpm run gate",
      "pnpm exec vitest run --config tests/vitest.tech-docs.config.ts",
    ],
    constraints: [
      "run focused tests before the fast gate and use pnpm from the repository root",
      "the repository test command has separate default and tech-docs Vitest lanes",
      "do not claim browser, build, external-service, or ship success without fresh evidence",
      "production filesystem writes remain read-only and unrelated resources remain unchanged",
    ],
    prerequisites: [
      "AGENTS.md",
      "Agents/02-testing.md",
      "Testing-handbook.md",
      "tests/vitest.config.ts",
      "tests/vitest.tech-docs.config.ts",
      "package.json",
    ],
    activationScope: "on-demand before done or ship claims; activation only after validation",
    maintenanceRisk: "medium",
  },
  "fork-boundaries": {
    canonicalSources: [
      "AGENTS.md",
      ".github/instructions/boundaries.instructions.md",
      "scripts/scan-boundaries.mjs",
      "docs/architecture/layout.md",
    ],
    rootCommands: ["pnpm run scan:boundaries"],
    constraints: [
      "Studio and Planner are fully forked and must never import one another",
      "CSS zones and APIs remain isolated per fork",
      "run scan:boundaries before committing either fork tree",
      "do not share fork-specific geometry, state, or server modules",
    ],
    prerequisites: [
      "AGENTS.md",
      ".github/instructions/boundaries.instructions.md",
      "scripts/scan-boundaries.mjs",
      "package.json",
    ],
    activationScope: "on-demand for Studio or Planner fork work; activation only after validation",
    maintenanceRisk: "high",
  },
  "focss-css": {
    canonicalSources: [
      "AGENTS.md",
      "Agents/07-css.md",
      "docs/architecture/css.md",
      ".github/instructions/focss.instructions.md",
      "config/build/postcss.config.mjs",
    ],
    rootCommands: [
      "pnpm run verify:focss",
      "pnpm run lint:ui:strict",
      "pnpm run check:style-tokens",
    ],
    constraints: [
      "write against FOCSS semantic tokens and zone structure rather than raw utilities",
      "preserve separate site, admin, planner, and studio CSS zones",
      "do not introduce cross-zone imports or inline SVG/icon conventions",
      "run the FOCSS verification, strict UI lint, and style-token checks from root",
    ],
    prerequisites: [
      "AGENTS.md",
      "Agents/07-css.md",
      "docs/architecture/css.md",
      ".github/instructions/focss.instructions.md",
      "config/build/postcss.config.mjs",
      "package.json",
    ],
    activationScope: "on-demand for FOCSS, CSS, or product UI work; activation only after validation",
    maintenanceRisk: "medium",
  },
  "db-migrations": {
    canonicalSources: [
      "AGENTS.md",
      "docs/database/schema.md",
      "docs/database/ops.md",
      ".github/instructions/migrations.instructions.md",
      "site/platform/supabase",
    ],
    rootCommands: [
      "pnpm run db:apply -- --dry",
      "pnpm run db:apply:admin -- --dry",
      "pnpm run db:types",
      "pnpm run db:types:admin",
    ],
    constraints: [
      "every migration includes a rollback section plus grants and policies",
      "select Admin versus Products database ownership before changing schema",
      "run a dry migration from the repository root before any apply operation",
      "production filesystem writes use mode-aware wrappers and never dual-write",
    ],
    prerequisites: [
      "AGENTS.md",
      "docs/database/schema.md",
      "docs/database/ops.md",
      ".github/instructions/migrations.instructions.md",
      "site/platform/supabase",
      "package.json",
    ],
    activationScope: "on-demand for schema or database migration work; activation only after validation",
    maintenanceRisk: "high",
  },
} as const satisfies Readonly<Record<SkillCandidate, SkillMetadata>>;

const STEERING_CANONICAL_SOURCES = [
  "AGENTS.md",
  ".kiro/skills/repo-map/SKILL.md",
  ".kiro/skills/graph-impact/SKILL.md",
  ".kiro/skills/verify-and-gate/SKILL.md",
  ".kiro/skills/fork-boundaries/SKILL.md",
  ".kiro/skills/focss-css/SKILL.md",
  ".kiro/skills/db-migrations/SKILL.md",
] as const satisfies readonly RepositoryPath[];

const STEERING_RULES = [
  "keeps powers, skills, steering, and MCP as distinct surfaces",
  "does not replace AGENTS.md or the primary repository guidance skill",
  "delegates domain-specific repository rules to the selected specialized skill",
] as const;

const SCOPE_WORDS = /\b(?:repo|repository|codebase|files?|graph|tests?|gate|ship|Studio|Planner|CSS|Tailwind|SQL|schema|database|migration|skills?|guidance|surface|zone|imports?)\b/i;
const ACTIVATION_WORDS = /\buse\s+(?:when|before|for|on)\b/i;
const SENSITIVE_CONTENT = /(?:token|secret|password|api[_-]?key)\s*[:=]\s*\S+|https?:\/\/[^\s]+/gi;

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
}

function isInsideRoot(root: string, candidate: string): boolean {
  const relativeCandidate = normalizePath(relative(root, candidate));
  return relativeCandidate === "" || (!relativeCandidate.startsWith("../") && relativeCandidate !== "..");
}

function resolveRepositoryPath(repositoryRoot: string, repositoryPath: string): string | null {
  const root = resolve(repositoryRoot);
  const candidate = resolve(root, repositoryPath);
  return isInsideRoot(root, candidate) ? candidate : null;
}

function readText(repositoryRoot: string, repositoryPath: string): ReadTextResult {
  const absolutePath = resolveRepositoryPath(repositoryRoot, repositoryPath);
  if (!absolutePath) return { status: "unreadable" };

  try {
    const stats = lstatSync(absolutePath);
    if (!stats.isFile()) return { status: "unreadable" };
    return { status: "available", text: readFileSync(absolutePath, "utf8") };
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "UNREADABLE")
      : "UNREADABLE";
    return { status: code === "ENOENT" ? "absent" : "unreadable" };
  }
}

function pathExists(repositoryRoot: string, repositoryPath: string): boolean {
  const absolutePath = resolveRepositoryPath(repositoryRoot, repositoryPath);
  if (!absolutePath) return false;
  try {
    lstatSync(absolutePath);
    return true;
  } catch {
    return false;
  }
}

function safeDescription(value: string): string {
  SENSITIVE_CONTENT.lastIndex = 0;
  return value.replace(SENSITIVE_CONTENT, "[REDACTED]").trim();
}

function hasSensitiveContent(value: string): boolean {
  SENSITIVE_CONTENT.lastIndex = 0;
  return SENSITIVE_CONTENT.test(value);
}

function parseFrontmatter(text: string): SkillManifestFields | null {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;

  const fields = new Map<string, string>();
  let closingIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index].trimEnd();
    if (line.trim() === "---") {
      closingIndex = index;
      break;
    }
    const match = /^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const value = match[2].trim().replace(/^['"]|['"]$/g, "");
    fields.set(match[1], value);
  }

  if (closingIndex < 0) return null;
  const rawDescription = fields.get("description") ?? "";
  return {
    name: fields.get("name") ?? "",
    description: safeDescription(rawDescription),
    sensitiveContentDetected: hasSensitiveContent(rawDescription),
  };
}

function descriptionErrors(description: string): string[] {
  const errors: string[] = [];
  const words = description.split(/\s+/).filter(Boolean);
  if (words.length < 10 || description.length < 50) {
    errors.push("description must be specific and contain at least ten words");
  }
  if (!ACTIVATION_WORDS.test(description)) {
    errors.push("description must state a concrete activation condition");
  }
  if (!SCOPE_WORDS.test(description)) {
    errors.push("description must state a concrete repository or domain scope");
  }
  return errors;
}

function manifestPath(folder: SkillCandidate, skillRoot: RepositoryPath): RepositoryPath {
  return `${normalizePath(skillRoot)}/${folder}/SKILL.md`;
}

function inspectManifest(repositoryRoot: string, folder: SkillCandidate, skillRoot: RepositoryPath): ManifestInspection {
  const path = manifestPath(folder, skillRoot);
  const read = readText(repositoryRoot, path);
  if (read.status === "absent") {
    return {
      folder,
      path,
      manifestName: "",
      description: "",
      inventoryStatus: "absent",
      manifestValid: false,
      errors: [`${path} is absent`],
    };
  }
  if (read.status !== "available" || !read.text) {
    return {
      folder,
      path,
      manifestName: "",
      description: "",
      inventoryStatus: "present but unreadable",
      manifestValid: false,
      errors: [`${path} is present but unreadable`],
    };
  }

  const fields = parseFrontmatter(read.text);
  if (!fields) {
    return {
      folder,
      path,
      manifestName: "",
      description: "",
      inventoryStatus: "present but unreadable",
      manifestValid: false,
      errors: [`${path} has no readable SKILL.md frontmatter`],
    };
  }

  const errors: string[] = [];
  if (fields.name !== folder) {
    errors.push(`${path} name ${fields.name || "<empty>"} does not match folder ${folder}`);
  }
  if (fields.sensitiveContentDetected) {
    errors.push(`${path} description contains sensitive content and cannot be accepted`);
  }
  errors.push(...descriptionErrors(fields.description).map((error) => `${path}: ${error}`));

  return {
    folder,
    path,
    manifestName: fields.name,
    description: fields.description,
    inventoryStatus: "present and readable",
    manifestValid: errors.length === 0,
    errors,
  };
}

function discoverExtraManifests(repositoryRoot: string, skillRoot: RepositoryPath): string[] {
  const absoluteRoot = resolveRepositoryPath(repositoryRoot, skillRoot);
  if (!absoluteRoot) return [normalizePath(skillRoot)];

  const discovered: string[] = [];
  const visit = (absoluteDirectory: string, relativeDirectory: string): void => {
    let entries;
    try {
      entries = readdirSync(absoluteDirectory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const absolutePath = resolve(absoluteDirectory, entry.name);
      if (entry.isFile() && entry.name === "SKILL.md") {
        discovered.push(`${normalizePath(skillRoot)}/${relativePath}`);
      } else if (entry.isDirectory()) {
        visit(absolutePath, relativePath);
      }
    }
  };

  try {
    lstatSync(absoluteRoot);
  } catch {
    return [];
  }
  visit(absoluteRoot, "");

  const expected = new Set(
    INITIAL_SKILL_CANDIDATES.map((skill) => manifestPath(skill, skillRoot)),
  );
  return discovered.filter((path) => !expected.has(path)).sort();
}

function packageScripts(repositoryRoot: string): Readonly<Record<string, string>> {
  const packageFile = readText(repositoryRoot, "package.json");
  if (packageFile.status !== "available" || !packageFile.text) return {};
  try {
    const parsed: unknown = JSON.parse(packageFile.text);
    if (typeof parsed !== "object" || parsed === null) return {};
    const scripts = (parsed as { scripts?: unknown }).scripts;
    if (typeof scripts !== "object" || scripts === null || Array.isArray(scripts)) return {};
    return Object.fromEntries(
      Object.entries(scripts).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

function commandErrors(repositoryRoot: string, commands: readonly string[]): string[] {
  const scripts = packageScripts(repositoryRoot);
  const errors: string[] = [];

  for (const command of commands) {
    if (!/^(?:pnpm\s+|node\s+scripts\/)/.test(command)) {
      errors.push(`root command is not a reviewed root-only pnpm/node command: ${command}`);
    }

    for (const match of command.matchAll(/pnpm\s+run\s+([A-Za-z0-9:_-]+)/g)) {
      if (!scripts[match[1]]) errors.push(`root command references missing package script ${match[1]}`);
    }

    for (const match of command.matchAll(/node\s+(scripts\/[A-Za-z0-9_./-]+)/g)) {
      if (!pathExists(repositoryRoot, match[1])) errors.push(`root command references missing script ${match[1]}`);
    }
  }

  return errors;
}

function sourceErrors(repositoryRoot: string, paths: readonly RepositoryPath[]): string[] {
  return paths.flatMap((path) => (pathExists(repositoryRoot, path) ? [] : [`canonical source is unavailable: ${path}`]));
}

function prerequisiteRecords(repositoryRoot: string, paths: readonly RepositoryPath[]): { records: string[]; blockers: string[] } {
  const records: string[] = [];
  const blockers: string[] = [];
  for (const path of paths) {
    if (pathExists(repositoryRoot, path)) {
      records.push(`available: ${path}`);
    } else {
      records.push(`unavailable: ${path}`);
      blockers.push(`required prerequisite is unavailable: ${path}`);
    }
  }
  return { records, blockers };
}

function od08Recorded(input: SkillEvaluatorInput): boolean {
  if (input.od08Approved === true) return true;
  return (input.ownerDecisions ?? []).some(
    (decision) =>
      decision.decisionId === OD08_DECISION_ID &&
      decision.owner.trim().length > 0 &&
      decision.selectedPolicy === "enable after validation" &&
      (decision.approvalStatus === "owner-approved" || decision.approvalStatus === "owner-approved-conditional") &&
      decision.unresolvedStatus !== "unresolved",
  );
}

// This predicate validates only repository-local artifact/prerequisite evidence.
// It never proves that Kiro activated a skill on IDE, CLI, Web, Mobile,
// Cloud/Crew, or any other external execution surface.
function isPassingLocalValidation(
  run: ValidationRun,
  repositoryRoot: string,
  reviewDateUtc: IsoDate | undefined,
): boolean {
  if (!reviewDateUtc) return false;

  const reviewTime = Date.parse(reviewDateUtc);
  const validationTime = Date.parse(run.startedAtUtc);
  if (!Number.isFinite(reviewTime) || !Number.isFinite(validationTime) || validationTime < reviewTime) {
    return false;
  }

  const validationRoot = run.repositoryRootOrActiveSurface;
  if (validationRoot === LOCAL_REPOSITORY_SURFACE) return false;

  return (
    typeof run.validationId === "string" &&
    run.validationId.trim().length > 0 &&
    normalizePath(resolve(String(validationRoot))).toLowerCase() === normalizePath(resolve(repositoryRoot)).toLowerCase() &&
    run.surface === LOCAL_REPOSITORY_SURFACE &&
    run.version === LOCAL_REPOSITORY_VERSION &&
    run.executionLayer === "surface_validation" &&
    run.result === "pass" &&
    run.blocker === "none" &&
    run.unverifiedItems.length === 0 &&
    run.evidenceRefs.length > 0
  );
}

function validationMatchesSkill(
  run: ValidationRun,
  skill: SkillCandidate,
  path: RepositoryPath,
  repositoryRoot: string,
  reviewDateUtc: IsoDate | undefined,
): boolean {
  if (!isPassingLocalValidation(run, repositoryRoot, reviewDateUtc)) return false;

  const searchable = `${run.action} ${run.scope} ${run.commandOrInteraction}`.toLowerCase();
  const scoped = run.scope.toLowerCase();
  const exactPath = path.toLowerCase();
  const skillPath = `.kiro/skills/${skill}/skill.md`;
  const allSkills = /all\s+six\s+(?:local\s+)?skills|six\s+(?:local\s+)?skill\s+manifests/.test(scoped);
  const namespaced = scoped.includes(exactPath) || scoped.includes(skillPath) || allSkills;
  const manifestAndPrerequisiteChecks = /\bmanifest\b/.test(searchable) && /\bprerequisite(?:s)?\b/.test(searchable);
  return manifestAndPrerequisiteChecks && namespaced;
}

function freshValidationRefs(
  input: SkillEvaluatorInput,
  skill: SkillCandidate,
  path: RepositoryPath,
  repositoryRoot: string,
): string[] {
  return unique(
    (input.validationRuns ?? [])
      .filter((run) => validationMatchesSkill(run, skill, path, repositoryRoot, input.reviewDateUtc))
      .map((run) => run.validationId),
  );
}

function validationBlocker(
  skill: SkillCandidate,
  od08: boolean,
  refs: readonly string[],
  reviewDateUtc: IsoDate | undefined,
): string | null {
  if (!od08) {
    return `${skill}: activation scope is unverified because OD-08 is not recorded`;
  }
  if (!reviewDateUtc) {
    return `${skill}: activation scope is unverified because no review date is available to establish fresh validation`;
  }
  if (refs.length === 0) {
    return `${skill}: activation scope is unverified because no fresh passing Local_Repository_Surface validation exists for this repository root and skill manifest prerequisites`;
  }
  return null;
}

function overlapResolution(
  sourcePath: RepositoryPath,
  targetPath: RepositoryPath,
  resolution: OverlapResolutionKind,
  reason: string,
  authoritativePath: RepositoryPath = targetPath,
): SkillOverlapResolution {
  return {
    sourcePath,
    targetPath,
    resolution,
    authoritativePath,
    reason,
  };
}

const STEERING_SKILL_DELEGATIONS: Readonly<Record<string, SkillCandidate>> = {
  "graph-layer.md": "graph-impact",
  "testing.md": "verify-and-gate",
  "planner-studio.md": "fork-boundaries",
  "ui-css.md": "focss-css",
  "database.md": "db-migrations",
} as const;

function discoverSteeringPaths(repositoryRoot: string): RepositoryPath[] {
  const absoluteRoot = resolveRepositoryPath(repositoryRoot, STEERING_ROOT);
  if (!absoluteRoot) return [STEERING_PATH];

  try {
    const paths = readdirSync(absoluteRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => `${STEERING_ROOT}/${entry.name}` as RepositoryPath)
      .sort();
    return paths.length > 0 ? paths : [STEERING_PATH];
  } catch {
    return [STEERING_PATH];
  }
}

function buildOverlapResolutions(
  steeringPaths: readonly RepositoryPath[] = [STEERING_PATH],
): SkillOverlapResolution[] {
  const primaryPath = ".kiro/skills/repo-map/SKILL.md" as const;
  const resolutions: SkillOverlapResolution[] = [];
  for (const skill of INITIAL_SKILL_CANDIDATES) {
    if (skill === PRIMARY_REPOSITORY_GUIDANCE_SKILL) continue;
    resolutions.push(
      overlapResolution(
        `.kiro/skills/${skill}/SKILL.md`,
        primaryPath,
        "delegate",
        `${skill} delegates repository orientation, authority order, and canonical-source routing to repo-map while retaining only its domain-specific rules`,
      ),
    );
  }

  for (const path of steeringPaths) {
    const normalizedPath = normalizePath(path);
    if (normalizedPath === STEERING_PATH) {
      resolutions.push(
        overlapResolution(
          normalizedPath,
          primaryPath,
          "delegate",
          "the relationship model delegates repository authority and onboarding orientation to repo-map and does not replace AGENTS.md",
        ),
      );
    }

    const steeringFile = normalizedPath.slice(normalizedPath.lastIndexOf("/") + 1);
    const delegatedSkill = STEERING_SKILL_DELEGATIONS[steeringFile];
    if (delegatedSkill) {
      const targetPath = `.kiro/skills/${delegatedSkill}/SKILL.md` as RepositoryPath;
      resolutions.push(
        overlapResolution(
          normalizedPath,
          targetPath,
          "delegate",
          `${normalizedPath} delegates ${delegatedSkill}-specific operating rules to the specialized skill while retaining only steering scope and domain context`,
          targetPath,
        ),
      );
    }
  }
  return resolutions;
}

function steeringRecord(
  repositoryRoot: string,
  path: RepositoryPath,
  overlapResolutions: readonly SkillOverlapResolution[],
): { record: EvaluatedSteeringRecord; blockers: string[] } {
  const read = readText(repositoryRoot, path);
  const evidenceRef = `observed:steering:${normalizePath(path)}`;
  if (read.status !== "available" || !read.text) {
    const status: SteeringRecord["inventoryStatus"] = read.status === "absent" ? "absent" : "present but unreadable";
    return {
      record: {
        path,
        inclusion: "",
        inventoryStatus: status,
        ownedRules: [...STEERING_RULES],
        referencedCanonicalSources: [...STEERING_CANONICAL_SOURCES],
        overlapResolution: "delegate: repository authority and onboarding orientation to .kiro/skills/repo-map/SKILL.md",
        disposition: "defer",
        evidenceRefs: [evidenceRef],
        rollbackPath: `restore ${path} and prior steering inclusion state`,
        evidenceState: "Unverified",
      },
      blockers: [`steering file ${path} is ${status}`],
    };
  }

  const frontmatter = parseSteeringFrontmatter(read.text);
  const inclusion = frontmatter.inclusion;
  const blockers: string[] = [];
  if (!inclusion) blockers.push(`steering file ${path} has no inclusion value`);
  const missingSources = sourceErrors(repositoryRoot, STEERING_CANONICAL_SOURCES);
  blockers.push(...missingSources);
  const related = overlapResolutions.filter((item) => item.sourcePath === path);
  const overlapDescription = related.length > 0
    ? related.map((item) => `${item.resolution}: ${item.targetPath}`).join("; ")
    : "retain: no selected skill duplicates this steering file's domain-specific rules";

  return {
    record: {
      path,
      inclusion: inclusion || "unknown",
      inventoryStatus: "present and readable",
      ownedRules: [...STEERING_RULES],
      referencedCanonicalSources: [...STEERING_CANONICAL_SOURCES],
      overlapResolution: overlapDescription,
      disposition: blockers.length === 0 ? "retain" : "defer",
      evidenceRefs: [evidenceRef, ...STEERING_CANONICAL_SOURCES.map((source) => `observed:source:${source}`)],
      rollbackPath: `restore ${path} and prior steering inclusion state`,
      evidenceState: blockers.length === 0 ? "Observed" : "Unverified",
    },
    blockers,
  };
}

function parseSteeringFrontmatter(text: string): { inclusion: string } {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return { inclusion: "" };
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line === "---") break;
    const match = /^inclusion\s*:\s*(.+)$/.exec(line);
    if (match) return { inclusion: match[1].trim().replace(/^['"]|['"]$/g, "") };
  }
  return { inclusion: "" };
}

function recordForSkill(
  repositoryRoot: string,
  inspection: ManifestInspection,
  input: SkillEvaluatorInput,
  od08: boolean,
  overlapResolutions: readonly SkillOverlapResolution[],
): { record: EvaluatedSkillRecord; blockers: string[]; activationBlockers: string[] } {
  const metadata = SKILL_METADATA[inspection.folder];
  const sourceBlockers = sourceErrors(repositoryRoot, metadata.canonicalSources);
  const prerequisite = prerequisiteRecords(repositoryRoot, metadata.prerequisites);
  const commandBlockers = commandErrors(repositoryRoot, metadata.rootCommands);
  const validationRefs = freshValidationRefs(input, inspection.folder, inspection.path, repositoryRoot);
  const activationBlockers = [validationBlocker(inspection.folder, od08, validationRefs, input.reviewDateUtc)].filter(
    (value): value is string => value !== null,
  );
  const structuralBlockers = [
    ...inspection.errors,
    ...sourceBlockers,
    ...prerequisite.blockers,
    ...commandBlockers,
  ];
  const validForActivation = inspection.manifestValid && structuralBlockers.length === 0 && activationBlockers.length === 0;
  const skillOverlaps = overlapResolutions
    .filter((item) => item.sourcePath === inspection.path || item.targetPath === inspection.path)
    .map((item) => `${item.resolution}: ${item.sourcePath} -> ${item.authoritativePath}; ${item.reason}`);

  const evidenceRefs = unique([
    `observed:skill:${inspection.folder}`,
    ...metadata.canonicalSources.map((source) => `observed:source:${source}`),
    ...validationRefs,
  ]);
  const record: EvaluatedSkillRecord = {
    path: inspection.path,
    folderName: inspection.folder,
    manifestName: inspection.manifestName,
    description: inspection.description,
    inventoryStatus: inspection.inventoryStatus,
    disposition: structuralBlockers.length === 0 ? "retain" : "defer",
    isPrimaryRepositoryGuidanceSkill: inspection.folder === PRIMARY_REPOSITORY_GUIDANCE_SKILL,
    activationScope: validForActivation
      ? metadata.activationScope
      : `unverified: no activation scope claim; requires recorded OD-08 and a fresh passing Local_Repository_Surface validation for ${inspection.folder}`,
    canonicalSources: [...metadata.canonicalSources],
    rootCommands: [...metadata.rootCommands],
    constraints: [...metadata.constraints],
    prerequisites: prerequisite.records,
    overlapResolutions: skillOverlaps,
    owner: SKILL_OWNER,
    maintenanceRisk: metadata.maintenanceRisk,
    evidenceRefs,
    validationRunRefs: validationRefs,
    rollbackPath: `${SKILL_ROLLBACK_PREFIX}:${inspection.folder}:restore ${inspection.path} and prior activation state`,
    evidenceState: inspection.manifestValid && structuralBlockers.length === 0 ? "Observed" : "Unverified",
    manifestValid: inspection.manifestValid,
    activationClaimed: validForActivation,
    activationBlockers,
  };

  return { record, blockers: structuralBlockers, activationBlockers };
}

function blockedResult(
  output: SkillEvaluationResult,
  blockers: readonly string[],
  evidenceRefs: readonly string[],
): StageResult<SkillEvaluationResult> {
  return {
    status: "blocked",
    output: { ...output, blockers: unique(blockers) },
    blockers: unique(blockers),
    evidenceRefs: unique(evidenceRefs),
  };
}

export function evaluateSkills(input: SkillEvaluatorInput = {}): StageResult<SkillEvaluationResult> {
  const repositoryRoot = resolve(input.repositoryRoot ?? REPOSITORY_ROOT);
  const skillRoot = normalizePath(input.skillRoot ?? SKILL_ROOT);
  const steeringPaths = input.steeringPaths
    ? unique(input.steeringPaths.map(normalizePath))
    : discoverSteeringPaths(repositoryRoot);
  const od08 = od08Recorded(input);
  const overlapResolutions = buildOverlapResolutions(steeringPaths);
  const inspections = INITIAL_SKILL_CANDIDATES.map((folder) => inspectManifest(repositoryRoot, folder, skillRoot));
  const extraManifests = discoverExtraManifests(repositoryRoot, skillRoot);
  const structuralBlockers = extraManifests.length > 0
    ? [`skill candidate set must contain exactly six manifests; unexpected manifests: ${extraManifests.join(", ")}`]
    : [];

  const skillResults = inspections.map((inspection) =>
    recordForSkill(repositoryRoot, inspection, input, od08, overlapResolutions),
  );
  const steeringResults = steeringPaths.map((path) => steeringRecord(repositoryRoot, normalizePath(path), overlapResolutions));
  const skills = skillResults.map((result) => result.record);
  const steering = steeringResults.map((result) => result.record);
  const skillBlockers = skillResults.flatMap((result) => result.blockers);
  const steeringBlockers = steeringResults.flatMap((result) => result.blockers);
  const activationBlockers = skillResults.flatMap((result) => result.activationBlockers);
  const evidenceRefs = unique([
    ...skills.flatMap((skill) => skill.evidenceRefs),
    ...steering.flatMap((record) => record.evidenceRefs),
  ]);
  const activationEvidenceRefs = unique(skills.flatMap((skill) => skill.validationRunRefs));
  const blockers = unique([...structuralBlockers, ...skillBlockers, ...steeringBlockers]);
  const activationScopeClaimsAllowed =
    od08 &&
    skills.length === INITIAL_SKILL_CANDIDATES.length &&
    skills.every((skill) => skill.manifestValid && skill.activationBlockers.length === 0 && skill.activationClaimed);
  const output: SkillEvaluationResult = {
    skills,
    steering,
    primaryRepositoryGuidanceSkill: PRIMARY_REPOSITORY_GUIDANCE_SKILL,
    exactCandidateSet: [...INITIAL_SKILL_CANDIDATES],
    overlapResolutions,
    activationScopeClaimsAllowed,
    activationEvidenceRefs,
    blockers,
    activationBlockers,
    evidenceRefs,
  };

  if (blockers.length > 0) return blockedResult(output, blockers, evidenceRefs);
  if (activationBlockers.length > 0 || !od08) {
    return {
      status: "partial",
      output,
      blockers: unique(activationBlockers.length > 0 ? activationBlockers : [
        "activation scope remains unverified until OD-08 is recorded and fresh validation passes",
      ]),
      evidenceRefs,
    };
  }

  return {
    status: "pass",
    output,
    blockers: [],
    evidenceRefs,
  };
}

export class SkillEvaluator implements SkillEvaluatorContract {
  evaluate(input: SkillEvaluatorInput = {}): StageResult<SkillEvaluationResult> {
    return evaluateSkills(input);
  }
}

export const skillEvaluator = new SkillEvaluator();
export const evaluateSkillManifests = evaluateSkills;
export default skillEvaluator;

export const SKILL_CANDIDATES = INITIAL_SKILL_CANDIDATES;
export const SKILL_METADATA_BY_NAME = SKILL_METADATA;
export const OVERLAP_RESOLUTIONS = buildOverlapResolutions();
export const VALID_SKILL_DISPOSITIONS: readonly SkillDisposition[] = VALID_DISPOSITIONS;
