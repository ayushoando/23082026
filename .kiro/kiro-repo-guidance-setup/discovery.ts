import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, relative, resolve } from "node:path";

import {
  COMPLETE_REVIEW_STATEMENT,
  type Availability,
  type DiscoveryRequest,
  type DiscoveryResult,
  type EvidenceProvenance,
  type KiroSurface,
  type RetrievalMethod,
  type SourceRecord,
  type StageResult,
  type UnverifiedFinding,
} from "./contracts";
import type { DiscoveryCollector as DiscoveryCollectorContract } from "./contracts";

const LOCAL_SURFACE: KiroSurface = "Local_Repository_Surface";
const REPOSITORY_OWNER = "repository owner";
const OFFICIAL_DOCS_ROOT = "https://kiro.dev/docs/";
const OFFICIAL_SITEMAP_URL = "https://kiro.dev/sitemap.xml";

/**
 * These are the repository-local authority paths required before later
 * inventory and coverage stages can make a disposition decision. Wildcard
 * directory entries are expanded from the live checkout and are never treated
 * as proof that Kiro loaded or executed an artifact.
 */
export const REQUIRED_REPOSITORY_AUTHORITY_PATHS = [
  "AGENTS.md",
  "START.md",
  "README.md",
  "CONTENTS.md",
  "DOC-MAP.md",
  "HANDOVER.md",
  "Testing-handbook.md",
  "OPERATIONS_RUNBOOK.md",
  "Agents",
  "docs",
  "plans",
  "package.json",
  "pnpm-workspace.yaml",
  ".kiro",
] as const;

/**
 * Settings named by repository-local handover material are inspected as
 * repository paths only. A missing path does not establish anything about a
 * user's global ~/.kiro state.
 */
export const REFERENCED_KIRO_SETTING_PATHS = [
  ".kiro/settings/permissions.yaml",
  ".kiro/settings/mcp.json",
  ".kiro/settings/installed.json",
  ".kiro/settings/agents.json",
  ".kiro/settings/config.json",
] as const;

export const OFFICIAL_DISCOVERY_METHOD =
  "official sitemap and official-site search; external retrieval is blocked by the repository-local collector" as const;

export const OFFICIAL_DISCOVERY_COMPLETION_LIMITATION =
  "No external page retrieval or surface interaction was performed; a URL, sitemap/search seed, or static repository record is not compatibility evidence." as const;

export interface OfficialCandidateSeed {
  readonly id: string;
  readonly url: string;
  readonly family: string;
  readonly title: string;
  readonly discoveryMethod: "sitemap" | "official_search";
  readonly surfaces: readonly KiroSurface[];
}

/**
 * Mandatory family seeds from the requirements/design. They are candidates,
 * not retrieved pages. The collector records them as Unverified when external
 * retrieval is unavailable or unapproved and leaves page expansion to a later
 * approved integration stage.
 */
export const OFFICIAL_CANDIDATE_SEEDS = [
  {
    id: "docs",
    url: "https://kiro.dev/docs/",
    family: "Product and operation",
    title: "Kiro documentation",
    discoveryMethod: "sitemap",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Mobile", "Cloud/Crew"],
  },
  {
    id: "how-kiro-works",
    url: "https://kiro.dev/docs/how-kiro-works/",
    family: "Product and operation",
    title: "How Kiro works",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Mobile", "Cloud/Crew"],
  },
  {
    id: "installation",
    url: "https://kiro.dev/docs/installation/",
    family: "Product and operation",
    title: "Installation",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x"],
  },
  {
    id: "authentication",
    url: "https://kiro.dev/docs/authentication/",
    family: "Product and operation",
    title: "Authentication",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Mobile", "Cloud/Crew"],
  },
  {
    id: "first-project",
    url: "https://kiro.dev/docs/first-project/",
    family: "Product and operation",
    title: "First project",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x"],
  },
  {
    id: "ide",
    url: "https://kiro.dev/docs/ide/",
    family: "IDE",
    title: "Kiro IDE",
    discoveryMethod: "sitemap",
    surfaces: ["IDE"],
  },
  {
    id: "cli",
    url: "https://kiro.dev/docs/cli/",
    family: "CLI",
    title: "Kiro CLI",
    discoveryMethod: "sitemap",
    surfaces: ["CLI 2.x", "CLI 3.x"],
  },
  {
    id: "cli-commands",
    url: "https://kiro.dev/docs/cli/commands/",
    family: "CLI",
    title: "CLI commands",
    discoveryMethod: "official_search",
    surfaces: ["CLI 2.x", "CLI 3.x"],
  },
  {
    id: "cli-slash-commands",
    url: "https://kiro.dev/docs/cli/slash-commands/",
    family: "CLI",
    title: "CLI slash commands",
    discoveryMethod: "official_search",
    surfaces: ["CLI 2.x", "CLI 3.x"],
  },
  {
    id: "cli-session-management",
    url: "https://kiro.dev/docs/cli/session-management/",
    family: "CLI",
    title: "CLI session management",
    discoveryMethod: "official_search",
    surfaces: ["CLI 2.x", "CLI 3.x"],
  },
  {
    id: "cli-v3",
    url: "https://kiro.dev/docs/cli/v3/",
    family: "CLI 3.x",
    title: "CLI 3.0",
    discoveryMethod: "sitemap",
    surfaces: ["CLI 3.x"],
  },
  {
    id: "cli-migration",
    url: "https://kiro.dev/docs/cli/migration/",
    family: "Version and workspace migration",
    title: "CLI migration guide",
    discoveryMethod: "official_search",
    surfaces: ["CLI 2.x", "CLI 3.x"],
  },
  {
    id: "web",
    url: "https://kiro.dev/docs/web/",
    family: "Web",
    title: "Kiro Web",
    discoveryMethod: "sitemap",
    surfaces: ["Web"],
  },
  {
    id: "mobile",
    url: "https://kiro.dev/docs/mobile/",
    family: "Mobile",
    title: "Kiro Mobile",
    discoveryMethod: "sitemap",
    surfaces: ["Mobile"],
  },
  {
    id: "cloud-sessions",
    url: "https://kiro.dev/docs/cloud-sessions/",
    family: "Cloud/Crew",
    title: "Cloud sessions",
    discoveryMethod: "sitemap",
    surfaces: ["Cloud/Crew"],
  },
  {
    id: "configuration",
    url: "https://kiro.dev/docs/configuration/",
    family: "Configuration",
    title: "Configuration scopes",
    discoveryMethod: "sitemap",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Mobile", "Cloud/Crew"],
  },
  {
    id: "permissions",
    url: "https://kiro.dev/docs/permissions/",
    family: "Permissions/security",
    title: "Permissions",
    discoveryMethod: "sitemap",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Mobile", "Cloud/Crew"],
  },
  {
    id: "kiroignore",
    url: "https://kiro.dev/docs/kiroignore/",
    family: "Ignore rules",
    title: "Kiro ignore rules",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Local_Repository_Surface"],
  },
  {
    id: "privacy-and-security",
    url: "https://kiro.dev/docs/privacy-and-security/",
    family: "Permissions/security",
    title: "Privacy and security",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Mobile", "Cloud/Crew"],
  },
  {
    id: "crew-security",
    url: "https://kiro.dev/docs/crew/security/",
    family: "Permissions/security",
    title: "Crew security",
    discoveryMethod: "official_search",
    surfaces: ["Cloud/Crew"],
  },
  {
    id: "steering",
    url: "https://kiro.dev/docs/steering/",
    family: "Steering",
    title: "Steering files",
    discoveryMethod: "sitemap",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Local_Repository_Surface"],
  },
  {
    id: "skills",
    url: "https://kiro.dev/docs/skills/",
    family: "Skills",
    title: "Skills",
    discoveryMethod: "sitemap",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Local_Repository_Surface"],
  },
  {
    id: "hooks",
    url: "https://kiro.dev/docs/hooks/",
    family: "Hooks",
    title: "Hooks",
    discoveryMethod: "sitemap",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Local_Repository_Surface"],
  },
  {
    id: "custom-agents",
    url: "https://kiro.dev/docs/custom-agents/",
    family: "Agents/tools",
    title: "Custom agents",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Cloud/Crew"],
  },
  {
    id: "custom-agent-configuration",
    url: "https://kiro.dev/docs/custom-agents/configuration-reference/",
    family: "Agents/tools",
    title: "Custom-agent configuration reference",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x"],
  },
  {
    id: "subagents",
    url: "https://kiro.dev/docs/custom-agents/subagents/",
    family: "Agents/tools",
    title: "Subagents",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x"],
  },
  {
    id: "mcp",
    url: "https://kiro.dev/docs/mcp/",
    family: "MCP",
    title: "MCP",
    discoveryMethod: "sitemap",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Cloud/Crew"],
  },
  {
    id: "powers",
    url: "https://kiro.dev/docs/powers/",
    family: "Powers",
    title: "Powers",
    discoveryMethod: "sitemap",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web", "Cloud/Crew"],
  },
  {
    id: "specs",
    url: "https://kiro.dev/docs/specs/",
    family: "Specifications",
    title: "Specifications",
    discoveryMethod: "sitemap",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web"],
  },
  {
    id: "plans-correctness",
    url: "https://kiro.dev/docs/specs/best-practices/",
    family: "Plans/correctness",
    title: "Specification best practices",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Web"],
  },
  {
    id: "crew-task-runner",
    url: "https://kiro.dev/docs/crew/task-runner/",
    family: "Crew Task Runner",
    title: "Crew Task Runner",
    discoveryMethod: "official_search",
    surfaces: ["Cloud/Crew"],
  },
  {
    id: "continuity",
    url: "https://kiro.dev/docs/continuity/",
    family: "Continuity",
    title: "Context and continuity",
    discoveryMethod: "official_search",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Cloud/Crew"],
  },
] as const satisfies readonly OfficialCandidateSeed[];

const KNOWN_SURFACES = new Set<KiroSurface>([
  "IDE",
  "CLI 2.x",
  "CLI 3.x",
  "Web",
  "Mobile",
  "Cloud/Crew",
  LOCAL_SURFACE,
]);

const ROOT_AUTHORITY_PATHS = new Set([
  "AGENTS.md",
  "START.md",
  "README.md",
  "CONTENTS.md",
  "DOC-MAP.md",
  "HANDOVER.md",
  "Testing-handbook.md",
  "OPERATIONS_RUNBOOK.md",
  "package.json",
  "pnpm-workspace.yaml",
]);

const PATH_PREFIXES = [
  ".kiro",
  "Agents",
  "config",
  "docs",
  "generated-documents",
  "ltm",
  "mcp",
  "plans",
  "scripts",
  "site",
  "tech-docs-generator",
  "tests",
  "workers",
] as const;

const PATH_REFERENCE_PATTERN = /(?:^|[\s"'`()=|])((?:\.?\.?[\\/])?(?:\.kiro|Agents|config|docs|generated-documents|ltm|mcp|plans|scripts|site|tech-docs-generator|tests|workers)[\\/][^\s"'`()=|;&<>]+)/g;

interface LocalInspection {
  readonly source: SourceRecord;
  readonly text?: string;
  readonly isDirectory: boolean;
}

interface DiscoveryAccumulator {
  readonly records: SourceRecord[];
  readonly unavailable: UnverifiedFinding[];
  readonly errors: string[];
  readonly inspections: Map<string, LocalInspection>;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function normalizeRepositoryPath(value: string): string | null {
  const normalized = value
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .replace(/\/+$|\/+$/g, "")
    .replace(/[),.;:]+$/g, "");

  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    return null;
  }

  const firstSegment = normalized.split("/")[0];
  if (!ROOT_AUTHORITY_PATHS.has(normalized) && !PATH_PREFIXES.includes(firstSegment as (typeof PATH_PREFIXES)[number])) {
    return null;
  }

  return normalized;
}

function safeLocator(value: string): string {
  return value
    .replace(/([?&](?:token|secret|password|api[_-]?key)=)[^&]*/gi, "$1[REDACTED]")
    .replace(/(https?:\/\/)([^/@\s]+):([^/@\s]+)@/gi, "$1[REDACTED]@")
    .replace(/\b(?:sk|pk)_[A-Za-z0-9_-]+\b/g, "[REDACTED]");
}

function safeText(value: string): string {
  return value
    .replace(/((?:token|secret|password|api[_-]?key)\s*[:=])\s*[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/https?:\/\/[^\s"']+/gi, (match) => safeLocator(match));
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function isIsoReviewDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

function authorityRankFor(path: string): SourceRecord["authorityRank"] {
  if (path === "AGENTS.md") return "AGENTS.md";
  if (path === "HANDOVER.md") return "handover_note";
  if (path === "plans" || path.startsWith("plans/")) return "active_plan";
  if (path === "Agents" || path.startsWith("Agents/")) return "Agents/*";
  if (path === "docs" || path.startsWith("docs/")) return "canonical_docs/*";
  return "live_code_or_fresh_command";
}

function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && /^[A-Z0-9_]+$/.test(code)) return code;
  }
  return "UNREADABLE";
}

function localPathIsInsideRoot(root: string, candidate: string): boolean {
  const relativeCandidate = relative(root, candidate).replaceAll("\\", "/");
  return relativeCandidate === "" || (!relativeCandidate.startsWith("../") && relativeCandidate !== "..");
}

function sourceProvenance(
  repositoryRoot: string,
  commandOrPath: string,
  result: string,
  integrityBasis: string,
): EvidenceProvenance {
  return {
    observer: "DiscoveryCollector",
    cwdOrSurface: safeText(repositoryRoot),
    commandOrPath: safeText(commandOrPath),
    result: safeText(result),
    integrityBasis,
  };
}

function repositorySource(
  path: string,
  reviewDateUtc: string,
  availability: Availability,
  repositoryRoot: string,
  result: string,
  limitation?: string,
  kind: SourceRecord["kind"] = "repository_file",
  retrievalMethod: RetrievalMethod = "file_read",
): SourceRecord {
  const readable = availability === "available";
  const sourceId = `source:repository:${slug(path)}`;
  return {
    sourceId,
    kind,
    locator: safeLocator(path),
    canonicalLocator: safeLocator(path),
    title: `${basename(path)} repository source`,
    reviewDateUtc,
    retrievalMethod,
    surfaceApplicability: [LOCAL_SURFACE],
    versionSensitiveClaim: false,
    availability,
    evidenceState: readable ? "Observed" : "Unverified",
    provenance: sourceProvenance(
      repositoryRoot,
      path,
      result,
      "repository-local path and readability were inspected; file content is not persisted as discovery evidence",
    ),
    trustDecision: readable ? "trusted" : "unresolved",
    authorityRank: authorityRankFor(path),
    claims: [`repository-source:${path}`],
    validationRunRefs: [],
    disposition: "observe",
    ...(limitation ? { limitation } : {}),
  };
}

function findingFor(
  source: SourceRecord,
  surface: KiroSurface,
  limitation: string,
): UnverifiedFinding {
  return {
    findingId: `finding:${slug(source.sourceId)}:${slug(surface)}`,
    sourceRef: source.sourceId,
    attemptedAtUtc: source.reviewDateUtc,
    surface,
    limitation: safeText(limitation),
    owner: REPOSITORY_OWNER,
    nextValidationRun: `validation:${slug(source.sourceId)}:${slug(surface)}`,
    evidenceState: "Unverified",
    availability: source.availability as Exclude<Availability, "available">,
  };
}

function officialSource(
  seed: OfficialCandidateSeed,
  reviewDateUtc: string,
  activeSurfaces: readonly KiroSurface[],
  externalRetrievalApproved: boolean,
): SourceRecord {
  const limitation = externalRetrievalApproved
    ? "External retrieval was not performed by this read-only collector; an approved integration adapter and exact Active_Surface run are still required."
    : "External retrieval is unapproved and was blocked; the URL remains an unavailable Unverified_Finding.";
  const retrievalMethod: RetrievalMethod =
    seed.discoveryMethod === "sitemap" ? "official_sitemap" : "official_search";

  return {
    sourceId: `source:official:candidate:${seed.id}`,
    kind: "official_url",
    locator: safeLocator(seed.url),
    canonicalLocator: safeLocator(seed.url),
    title: seed.title,
    officialDocumentationFamily: seed.family,
    reviewDateUtc,
    retrievalMethod,
    surfaceApplicability: unique(seed.surfaces.filter((surface) => activeSurfaces.includes(surface))),
    versionSensitiveClaim: true,
    availability: "inaccessible",
    evidenceState: "Unverified",
    provenance: sourceProvenance(
      "official Kiro documentation surface",
      `${seed.discoveryMethod}:${seed.url}`,
      `candidate recorded before decision evidence; ${limitation}`,
      "URL and discovery method are recorded without page retrieval or compatibility inference",
    ),
    trustDecision: "unresolved",
    authorityRank: "official_documentation",
    claims: [
      `official-candidate:${seed.id}`,
      `discovery-method:${seed.discoveryMethod}`,
      "not-surface-validation",
    ],
    validationRunRefs: [],
    disposition: "observe",
    limitation,
  };
}

function officialDiscoveryEvidence(
  sourceId: string,
  locator: string,
  retrievalMethod: RetrievalMethod,
  reviewDateUtc: string,
  activeSurfaces: readonly KiroSurface[],
  externalRetrievalApproved: boolean,
): SourceRecord {
  const limitation = externalRetrievalApproved
    ? "The repository-local collector has no external retrieval adapter; sitemap/search retrieval remains unperformed."
    : "External sitemap/search retrieval is unapproved and was blocked.";
  const method = retrievalMethod === "official_sitemap" ? "sitemap" : "official_search";

  return {
    sourceId,
    kind: "official_url",
    locator,
    canonicalLocator: locator,
    title: method === "sitemap" ? "Official sitemap discovery" : "Official-site search discovery",
    officialDocumentationFamily: "Discovery method",
    reviewDateUtc,
    retrievalMethod,
    surfaceApplicability: activeSurfaces,
    versionSensitiveClaim: true,
    availability: "inaccessible",
    evidenceState: "Unverified",
    provenance: sourceProvenance(
      "official Kiro documentation surface",
      `${method}:${locator}`,
      `discovery method recorded; ${limitation}`,
      "method metadata only; no external response or surface success is stored",
    ),
    trustDecision: "unresolved",
    authorityRank: "official_documentation",
    claims: [`discovery-evidence:${method}`, "not-surface-validation"],
    validationRunRefs: [],
    disposition: "observe",
    limitation,
  };
}

function readTextIfSafe(absolutePath: string, path: string): string | undefined {
  const extension = extname(path).toLowerCase();
  const textExtensions = new Set(["", ".json", ".md", ".mjs", ".js", ".ts", ".tsx", ".yaml", ".yml", ".txt", ".toml"]);
  if (!textExtensions.has(extension)) return undefined;

  try {
    return readFileSync(absolutePath, "utf8");
  } catch {
    return undefined;
  }
}

function inspectLocalPath(
  accumulator: DiscoveryAccumulator,
  repositoryRoot: string,
  repositoryPath: string,
  reviewDateUtc: string,
): LocalInspection | null {
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  if (!normalizedPath) return null;
  const existing = accumulator.inspections.get(normalizedPath);
  if (existing) return existing;

  const absolutePath = resolve(repositoryRoot, normalizedPath);
  if (!localPathIsInsideRoot(resolve(repositoryRoot), absolutePath)) {
    const source = repositorySource(
      normalizedPath,
      reviewDateUtc,
      "impossible_to_match",
      repositoryRoot,
      "repository path rejected because it escapes the repository root",
      "The referenced path is outside the repository-local read boundary.",
    );
    const inspection = { source, isDirectory: false } satisfies LocalInspection;
    accumulator.inspections.set(normalizedPath, inspection);
    accumulator.records.push(source);
    accumulator.unavailable.push(findingFor(source, LOCAL_SURFACE, source.limitation ?? "path outside repository root"));
    return inspection;
  }

  let stats;
  try {
    stats = lstatSync(absolutePath);
  } catch (error) {
    const code = errorCode(error);
    const availability: Availability = code === "ENOENT" ? "impossible_to_match" : "inaccessible";
    const limitation =
      availability === "impossible_to_match"
        ? "Path is absent from the repository-local surface; no user or global Kiro state is inferred."
        : `Path metadata could not be read (${code}); contents are not inferred.`;
    const source = repositorySource(
      normalizedPath,
      reviewDateUtc,
      availability,
      repositoryRoot,
      availability === "impossible_to_match" ? "repository path absent" : `repository path unavailable (${code})`,
      limitation,
    );
    const inspection = { source, isDirectory: false } satisfies LocalInspection;
    accumulator.inspections.set(normalizedPath, inspection);
    accumulator.records.push(source);
    accumulator.unavailable.push(findingFor(source, LOCAL_SURFACE, limitation));
    return inspection;
  }

  if (stats.isDirectory()) {
    try {
      readdirSync(absolutePath);
      const source = repositorySource(
        normalizedPath,
        reviewDateUtc,
        "available",
        repositoryRoot,
        "repository directory readable; visible children will be inspected separately",
      );
      const inspection = { source, isDirectory: true } satisfies LocalInspection;
      accumulator.inspections.set(normalizedPath, inspection);
      accumulator.records.push(source);
      return inspection;
    } catch (error) {
      const code = errorCode(error);
      const limitation = `Repository directory is present but unreadable (${code}); children are not inferred.`;
      const source = repositorySource(
        normalizedPath,
        reviewDateUtc,
        "inaccessible",
        repositoryRoot,
        `repository directory unreadable (${code})`,
        limitation,
      );
      const inspection = { source, isDirectory: true } satisfies LocalInspection;
      accumulator.inspections.set(normalizedPath, inspection);
      accumulator.records.push(source);
      accumulator.unavailable.push(findingFor(source, LOCAL_SURFACE, limitation));
      return inspection;
    }
  }

  try {
    const text = readTextIfSafe(absolutePath, normalizedPath);
    readFileSync(absolutePath);
    const source = repositorySource(
      normalizedPath,
      reviewDateUtc,
      "available",
      repositoryRoot,
      "repository file readable; discovery records metadata only",
    );
    const inspection = { source, text, isDirectory: false } satisfies LocalInspection;
    accumulator.inspections.set(normalizedPath, inspection);
    accumulator.records.push(source);
    return inspection;
  } catch (error) {
    const code = errorCode(error);
    const limitation = `Repository file is present but unreadable (${code}); contents are not inferred.`;
    const source = repositorySource(
      normalizedPath,
      reviewDateUtc,
      "inaccessible",
      repositoryRoot,
      `repository file unreadable (${code})`,
      limitation,
    );
    const inspection = { source, isDirectory: false } satisfies LocalInspection;
    accumulator.inspections.set(normalizedPath, inspection);
    accumulator.records.push(source);
    accumulator.unavailable.push(findingFor(source, LOCAL_SURFACE, limitation));
    return inspection;
  }
}

function collectDirectory(
  accumulator: DiscoveryAccumulator,
  repositoryRoot: string,
  directoryPath: string,
  reviewDateUtc: string,
): void {
  const inspection = inspectLocalPath(accumulator, repositoryRoot, directoryPath, reviewDateUtc);
  if (!inspection?.isDirectory || inspection.source.availability !== "available") return;

  const absolutePath = resolve(repositoryRoot, directoryPath);
  let children: string[];
  try {
    children = readdirSync(absolutePath).sort((left, right) => left.localeCompare(right));
  } catch {
    return;
  }

  for (const child of children) {
    const childPath = `${directoryPath}/${child}`;
    const childInspection = inspectLocalPath(accumulator, repositoryRoot, childPath, reviewDateUtc);
    if (childInspection?.isDirectory) {
      collectDirectory(accumulator, repositoryRoot, childPath, reviewDateUtc);
    }
  }
}

function extractReferencedPaths(text: string): string[] {
  const references: string[] = [];
  for (const match of text.matchAll(PATH_REFERENCE_PATTERN)) {
    const candidate = normalizeRepositoryPath(match[1]);
    if (candidate) references.push(candidate);
  }
  return unique(references);
}

function createCommandSource(
  scriptName: string,
  reviewDateUtc: string,
  repositoryRoot: string,
  packageReadable: boolean,
): SourceRecord {
  const locator = `package.json#scripts.${scriptName}`;
  const availability: Availability = packageReadable ? "available" : "inaccessible";
  const limitation = packageReadable
    ? undefined
    : "package.json could not be read; script declaration and referenced paths are not inferred.";
  return {
    sourceId: `source:command:package-json-scripts:${slug(scriptName)}`,
    kind: "command",
    locator,
    canonicalLocator: "package.json",
    title: `Repository command ${scriptName}`,
    reviewDateUtc,
    retrievalMethod: "repository_command",
    surfaceApplicability: [LOCAL_SURFACE],
    versionSensitiveClaim: false,
    availability,
    evidenceState: packageReadable ? "Observed" : "Unverified",
    provenance: sourceProvenance(
      repositoryRoot,
      locator,
      packageReadable
        ? "package script declaration inspected; command text is intentionally redacted"
        : "package script declaration unavailable",
      "script metadata was inspected without persisting command text or secret-bearing values",
    ),
    trustDecision: packageReadable ? "trusted" : "unresolved",
    authorityRank: "live_code_or_fresh_command",
    claims: [`repository-command:${scriptName}`],
    validationRunRefs: [],
    disposition: "observe",
    ...(limitation ? { limitation } : {}),
  };
}

function packageScripts(text: string | undefined): Record<string, string> | null {
  if (!text) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    const scripts = (parsed as { scripts?: unknown }).scripts;
    if (typeof scripts !== "object" || scripts === null || Array.isArray(scripts)) return {};
    const output: Record<string, string> = {};
    for (const [name, command] of Object.entries(scripts)) {
      if (typeof command === "string") output[name] = command;
    }
    return output;
  } catch {
    return null;
  }
}

function addUnavailableOfficialFindings(
  accumulator: DiscoveryAccumulator,
  source: SourceRecord,
  activeSurfaces: readonly KiroSurface[],
): void {
  const surfaces = source.surfaceApplicability.length > 0 ? source.surfaceApplicability : activeSurfaces;
  for (const surface of surfaces) {
    accumulator.unavailable.push(findingFor(source, surface, source.limitation ?? OFFICIAL_DISCOVERY_COMPLETION_LIMITATION));
  }
}

function validateRequest(input: DiscoveryRequest): string[] {
  const errors: string[] = [];
  if (!input.repositoryRoot || input.repositoryRoot.trim().length === 0) {
    errors.push("repositoryRoot is required");
  }
  if (!isIsoReviewDate(input.reviewDateUtc)) {
    errors.push("reviewDateUtc must be an ISO date or ISO UTC timestamp");
  }
  if (input.activeSurfaces.length === 0) {
    errors.push("at least one Active_Surface is required");
  }
  if (input.activeSurfaces.some((surface) => !KNOWN_SURFACES.has(surface))) {
    errors.push("activeSurfaces contains an unknown Active_Surface");
  }
  return errors;
}

function blockedResult(errors: readonly string[]): StageResult<DiscoveryResult> {
  return {
    status: "blocked",
    blockers: errors,
    evidenceRefs: [],
  };
}

export class DiscoveryCollector implements DiscoveryCollectorContract {
  discover(input: DiscoveryRequest): StageResult<DiscoveryResult> {
    const requestErrors = validateRequest(input);
    if (requestErrors.length > 0) return blockedResult(requestErrors);

    const repositoryRoot = resolve(input.repositoryRoot);
    const accumulator: DiscoveryAccumulator = {
      records: [],
      unavailable: [],
      errors: [],
      inspections: new Map(),
    };

    const officialSitemap = officialDiscoveryEvidence(
      "source:official:discovery:sitemap",
      OFFICIAL_SITEMAP_URL,
      "official_sitemap",
      input.reviewDateUtc,
      input.activeSurfaces,
      input.officialDiscoveryApproved,
    );
    const officialSearch = officialDiscoveryEvidence(
      "source:official:discovery:search",
      OFFICIAL_DOCS_ROOT,
      "official_search",
      input.reviewDateUtc,
      input.activeSurfaces,
      input.officialDiscoveryApproved,
    );
    accumulator.records.push(officialSitemap, officialSearch);
    addUnavailableOfficialFindings(accumulator, officialSitemap, input.activeSurfaces);
    addUnavailableOfficialFindings(accumulator, officialSearch, input.activeSurfaces);
    accumulator.errors.push(
      input.officialDiscoveryApproved
        ? "official sitemap/search retrieval was not performed by the read-only collector"
        : "official sitemap/search retrieval is unapproved and was blocked",
    );

    for (const requiredPath of REQUIRED_REPOSITORY_AUTHORITY_PATHS) {
      const inspection = inspectLocalPath(accumulator, repositoryRoot, requiredPath, input.reviewDateUtc);
      if (inspection?.isDirectory) {
        collectDirectory(accumulator, repositoryRoot, requiredPath, input.reviewDateUtc);
      }
    }
    for (const referencedPath of REFERENCED_KIRO_SETTING_PATHS) {
      inspectLocalPath(accumulator, repositoryRoot, referencedPath, input.reviewDateUtc);
    }

    const packageInspection = accumulator.inspections.get("package.json");
    const scripts = packageScripts(packageInspection?.text);
    if (packageInspection?.source.availability === "available" && scripts === null) {
      accumulator.errors.push("package.json was readable but its scripts object could not be parsed");
    }
    if (scripts) {
      for (const scriptName of Object.keys(scripts).sort()) {
        accumulator.records.push(
          createCommandSource(scriptName, input.reviewDateUtc, repositoryRoot, true),
        );
        for (const referencedPath of extractReferencedPaths(scripts[scriptName])) {
          inspectLocalPath(accumulator, repositoryRoot, referencedPath, input.reviewDateUtc);
        }
      }
    }

    // Inspect path references in readable repository authority and visible Kiro
    // artifacts. Content is used only to locate paths; it is never emitted.
    const initialText = [...accumulator.inspections.values()]
      .filter((inspection) => inspection.source.availability === "available" && inspection.text)
      .map((inspection) => inspection.text as string);
    for (const text of initialText) {
      for (const referencedPath of extractReferencedPaths(text)) {
        inspectLocalPath(accumulator, repositoryRoot, referencedPath, input.reviewDateUtc);
      }
    }

    for (const seed of OFFICIAL_CANDIDATE_SEEDS) {
      const source = officialSource(
        seed,
        input.reviewDateUtc,
        input.activeSurfaces,
        input.officialDiscoveryApproved,
      );
      accumulator.records.push(source);
      addUnavailableOfficialFindings(accumulator, source, input.activeSurfaces);
    }

    const unavailable = unique(accumulator.unavailable.map((finding) => finding.findingId)).map(
      (findingId) => accumulator.unavailable.find((finding) => finding.findingId === findingId) as UnverifiedFinding,
    );
    const records = unique(accumulator.records.map((record) => record.sourceId)).map(
      (sourceId) => accumulator.records.find((record) => record.sourceId === sourceId) as SourceRecord,
    );
    const candidates = records.filter((record) => !record.sourceId.startsWith("source:official:discovery:"));
    const blockers = unique([
      ...accumulator.errors,
      ...unavailable.map((finding) => `${finding.sourceRef} is unavailable and remains Unverified`),
    ]);

    const output: DiscoveryResult = {
      candidates,
      sourceInventory: {
        reviewDateUtc: input.reviewDateUtc,
        activeSurfaces: input.activeSurfaces,
        discoveryMethod: OFFICIAL_DISCOVERY_METHOD,
        records,
        unavailableFindings: unavailable,
      },
      unavailable,
      errors: accumulator.errors,
    };

    if (unavailable.length > 0 || accumulator.errors.length > 0) {
      return {
        status: "partial",
        output,
        blockers,
        evidenceRefs: records.map((record) => record.sourceId),
      };
    }

    return {
      status: "pass",
      output,
      blockers: [],
      evidenceRefs: records.map((record) => record.sourceId),
    };
  }
}

export const discoveryCollector = new DiscoveryCollector();
export const collectDiscovery = (input: DiscoveryRequest): StageResult<DiscoveryResult> =>
  discoveryCollector.discover(input);
export const COMPLETE_REVIEW_LIMITATION = COMPLETE_REVIEW_STATEMENT;

export default discoveryCollector;
