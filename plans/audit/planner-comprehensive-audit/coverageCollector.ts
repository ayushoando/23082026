import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  type Dirent,
} from "node:fs";
import path from "node:path";

import type {
  ApiCoverageItem,
  CoverageItem,
  CoverageStatus,
  EvidenceRecord,
  FocssCoverageItem,
  HttpMethod,
  PlannerOwnedArea,
  PlannerSourceCoverageItem,
  ReachableSharedSourceCoverageItem,
  RouteCoverageItem,
  TestCoverageItem,
} from "./auditModel";

const ROUTE_ROOT = "site/app/ooplanner";
const API_ROOT = "site/app/api/Planner";
const FOCSS_ROOT = "site/focss/planner";
const ROUTES_DOCUMENTATION_PATH = "docs/architecture/routes.md";

const PLANNER_SOURCE_ROOTS: ReadonlyArray<{
  path: string;
  area: PlannerOwnedArea;
}> = [
  { path: "site/features/Planner", area: "feature" },
  { path: "site/components/Planner", area: "component" },
  { path: "site/lib/Planner", area: "lib" },
  { path: "site/hooks/Planner", area: "hook" },
  { path: "site/store/Planner", area: "store" },
  { path: "site/server/Planner", area: "server" },
  { path: "site/platform/Planner", area: "platform" },
];

const TEST_DISCOVERY_ROOTS = ["tests", "config/build"] as const;
const MODULE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
  ".js",
  ".jsx",
  ".css",
  ".json",
] as const;
const TEXT_EXTENSIONS = new Set<string>([
  ...MODULE_EXTENSIONS,
  ".md",
  ".jsonc",
]);
const HTTP_METHODS: readonly HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
];

export type CoverageRootCategory =
  | "route"
  | "api"
  | "planner-source"
  | "focss"
  | "tests-config";

export interface CoverageRootRecord {
  path: string;
  category: CoverageRootCategory;
  status: CoverageStatus;
  statusNote: string;
  evidenceRefs: string[];
}

export interface DocumentationConflict {
  id: string;
  documentationPath: string;
  surfaceKind: "route" | "api";
  surfacePath: string;
  conflictKind: "documented-only" | "live-only";
  status: "wired" | "unwired/absent";
  resolution: "live-source";
  evidenceRefs: string[];
  note: string;
}

export interface PlannerCoverageInventory {
  collectorVersion: 1;
  repositoryRoot: ".";
  requirementRefs: ["1.1", "1.2", "1.4", "1.5"];
  roots: CoverageRootRecord[];
  coverageItems: CoverageItem[];
  evidence: EvidenceRecord[];
  documentationConflicts: DocumentationConflict[];
  coverageItemStatusCounts: Record<CoverageStatus, number>;
}

export interface CoverageCollectorOptions {
  repositoryRoot: string;
  routesDocumentationPath?: string;
}

interface ImportGraph {
  reachablePaths: Set<string>;
  importedBy: Map<string, Set<string>>;
}

interface ItemDraft {
  item: CoverageItem;
  evidence: EvidenceRecord;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function toRepositoryPath(repositoryRoot: string, absolutePath: string): string {
  return toPosixPath(path.relative(repositoryRoot, absolutePath));
}

function absoluteFromRepositoryPath(
  repositoryRoot: string,
  repositoryPath: string,
): string {
  return path.resolve(repositoryRoot, ...repositoryPath.split("/"));
}

function isInsideRepository(
  repositoryRoot: string,
  candidatePath: string,
): boolean {
  const relativePath = path.relative(repositoryRoot, candidatePath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith(`..${path.sep}`) && relativePath !== "..")
  );
}

function safeReadText(absolutePath: string): string | null {
  if (!TEXT_EXTENSIONS.has(path.extname(absolutePath).toLowerCase())) {
    return null;
  }
  try {
    return readFileSync(absolutePath, "utf8");
  } catch {
    return null;
  }
}

function walkFiles(repositoryRoot: string, rootPath: string): string[] {
  const absoluteRoot = absoluteFromRepositoryPath(repositoryRoot, rootPath);
  if (!existsSync(absoluteRoot) || !statSync(absoluteRoot).isDirectory()) {
    return [];
  }

  const files: string[] = [];
  const visit = (directory: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }
      const absoluteEntry = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absoluteEntry);
      } else if (entry.isFile()) {
        files.push(toRepositoryPath(repositoryRoot, absoluteEntry));
      }
    }
  };

  visit(absoluteRoot);
  return files.sort(compareText);
}

function makeStableId(prefix: string, repositoryPath: string): string {
  return `${prefix}:${repositoryPath}`;
}

function makePathEvidence(
  id: string,
  sourceRefs: string[],
  summary: string,
  limitation: string,
): EvidenceRecord {
  return {
    id,
    class: "repository",
    summary,
    sourceRefs: [...sourceRefs].sort(compareText),
    limitation,
  };
}

function classifyPathStatus(
  repositoryPath: string,
  reachablePaths: ReadonlySet<string>,
): { status: CoverageStatus; statusNote: string } {
  const normalized = repositoryPath.toLowerCase();
  if (
    normalized.includes("/.next/") ||
    normalized.includes("/generated/") ||
    normalized.includes("/.generated/") ||
    normalized.endsWith(".tsbuildinfo")
  ) {
    return {
      status: "generated",
      statusNote: "The path is generated output and is not treated as source truth.",
    };
  }
  if (
    normalized.includes("/legacy/") ||
    normalized.includes("/_archive/") ||
    normalized.startsWith("site/data/storage/")
  ) {
    return {
      status: "legacy",
      statusNote: "The live path is explicitly marked legacy or archived.",
    };
  }
  if (normalized.startsWith("site/platform/planner/data/")) {
    return {
      status: "demo/local-only",
      statusNote:
        "The path belongs to the non-production DEV_AUTH_BYPASS disk backend.",
    };
  }
  if (reachablePaths.has(repositoryPath)) {
    return {
      status: "wired",
      statusNote: "A live route or API entry reaches this path through local imports.",
    };
  }
  return {
    status: "unreachable",
    statusNote:
      "The file is present in a required Planner root but no live route or API import path reaches it.",
  };
}

function routePathFromFile(repositoryPath: string): string {
  const relativeDirectory = path.posix.dirname(
    path.posix.relative(ROUTE_ROOT, repositoryPath),
  );
  const segments = relativeDirectory
    .split("/")
    .filter(
      (segment) =>
        segment !== "." &&
        !(segment.startsWith("(") && segment.endsWith(")")) &&
        !segment.startsWith("@"),
    );
  return `/${["ooplanner", ...segments].join("/")}`;
}

function apiPathFromFile(repositoryPath: string): string {
  const relativeDirectory = path.posix.dirname(
    path.posix.relative(API_ROOT, repositoryPath),
  );
  const segments = relativeDirectory === "." ? [] : relativeDirectory.split("/");
  return `/${["api", "Planner", ...segments].join("/")}`;
}

function extractHttpMethods(source: string): HttpMethod[] {
  const found = new Set<HttpMethod>();
  const declarationPattern =
    /export\s+(?:async\s+)?(?:function|const|let|var)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g;
  for (const match of source.matchAll(declarationPattern)) {
    found.add(match[1] as HttpMethod);
  }

  const exportListPattern = /export\s*\{([^}]+)\}/g;
  for (const match of source.matchAll(exportListPattern)) {
    for (const method of HTTP_METHODS) {
      const methodPattern = new RegExp(`\\b${method}\\b`);
      if (methodPattern.test(match[1])) {
        found.add(method);
      }
    }
  }
  return HTTP_METHODS.filter((method) => found.has(method));
}

function extractImportSpecifiers(source: string): string[] {
  const specifiers = new Set<string>();
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
    /@import\s+(?:url\(\s*)?["']([^"']+)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }
  return [...specifiers].sort(compareText);
}

function aliasBasePath(specifier: string): string | null {
  const aliases: ReadonlyArray<[string, string]> = [
    ["@planner/components", "site/components/Planner"],
    ["@planner/lib", "site/lib/Planner"],
    ["@planner/hooks", "site/hooks/Planner"],
    ["@planner/store", "site/store/Planner"],
    ["@planner/server", "site/server/Planner"],
    ["@focss", "site/focss"],
    ["@", "site"],
  ];
  for (const [alias, target] of aliases) {
    if (specifier === alias) {
      return target;
    }
    if (specifier.startsWith(`${alias}/`)) {
      return `${target}/${specifier.slice(alias.length + 1)}`;
    }
  }
  return null;
}

function resolveLocalImport(
  repositoryRoot: string,
  importerPath: string,
  specifier: string,
): string | null {
  let basePath: string | null = null;
  if (specifier.startsWith(".")) {
    basePath = path.posix.normalize(
      path.posix.join(path.posix.dirname(importerPath), specifier),
    );
  } else {
    basePath = aliasBasePath(specifier);
  }
  if (!basePath) {
    return null;
  }

  const candidates = new Set<string>([basePath]);
  if (!path.posix.extname(basePath)) {
    for (const extension of MODULE_EXTENSIONS) {
      candidates.add(`${basePath}${extension}`);
      candidates.add(`${basePath}/index${extension}`);
    }
  }

  for (const candidate of candidates) {
    const absoluteCandidate = absoluteFromRepositoryPath(repositoryRoot, candidate);
    if (
      isInsideRepository(repositoryRoot, absoluteCandidate) &&
      existsSync(absoluteCandidate) &&
      statSync(absoluteCandidate).isFile()
    ) {
      return toRepositoryPath(repositoryRoot, absoluteCandidate);
    }
  }
  return null;
}

function buildImportGraph(
  repositoryRoot: string,
  seedPaths: readonly string[],
): ImportGraph {
  const reachablePaths = new Set<string>();
  const importedBy = new Map<string, Set<string>>();
  const pending = [...new Set(seedPaths)].sort(compareText).reverse();

  while (pending.length > 0) {
    const currentPath = pending.pop();
    if (!currentPath || reachablePaths.has(currentPath)) {
      continue;
    }
    reachablePaths.add(currentPath);
    const source = safeReadText(
      absoluteFromRepositoryPath(repositoryRoot, currentPath),
    );
    if (source === null) {
      continue;
    }

    for (const specifier of extractImportSpecifiers(source)) {
      const resolvedPath = resolveLocalImport(
        repositoryRoot,
        currentPath,
        specifier,
      );
      if (!resolvedPath) {
        continue;
      }
      const importers = importedBy.get(resolvedPath) ?? new Set<string>();
      importers.add(currentPath);
      importedBy.set(resolvedPath, importers);
      if (!reachablePaths.has(resolvedPath)) {
        pending.push(resolvedPath);
        pending.sort(compareText).reverse();
      }
    }
  }

  return { reachablePaths, importedBy };
}

function coverageRootDrafts(repositoryRoot: string): {
  roots: CoverageRootRecord[];
  evidence: EvidenceRecord[];
} {
  const definitions: Array<{
    path: string;
    category: CoverageRootCategory;
  }> = [
    { path: ROUTE_ROOT, category: "route" },
    { path: API_ROOT, category: "api" },
    ...PLANNER_SOURCE_ROOTS.map((root) => ({
      path: root.path,
      category: "planner-source" as const,
    })),
    { path: FOCSS_ROOT, category: "focss" },
    ...TEST_DISCOVERY_ROOTS.map((rootPath) => ({
      path: rootPath,
      category: "tests-config" as const,
    })),
  ];
  const roots: CoverageRootRecord[] = [];
  const evidence: EvidenceRecord[] = [];

  for (const definition of definitions.sort((left, right) =>
    compareText(left.path, right.path),
  )) {
    const absolutePath = absoluteFromRepositoryPath(
      repositoryRoot,
      definition.path,
    );
    const exists =
      existsSync(absolutePath) && statSync(absolutePath).isDirectory();
    const isLocalOnly = definition.path === "site/platform/Planner";
    const status: CoverageStatus = exists
      ? isLocalOnly
        ? "demo/local-only"
        : "present-but-unverified"
      : "unwired/absent";
    const evidenceId = makeStableId("evidence-root", definition.path);
    const parentPath = path.posix.dirname(definition.path);
    roots.push({
      path: definition.path,
      category: definition.category,
      status,
      statusNote: exists
        ? isLocalOnly
          ? "The root exists and contains the approved development-only disk backend."
          : "The root exists in the live tree; runtime behavior remains unverified."
        : "The required discovery root is absent from the live tree.",
      evidenceRefs: [evidenceId],
    });
    evidence.push(
      makePathEvidence(
        evidenceId,
        [exists ? definition.path : parentPath],
        exists
          ? `Live discovery root exists: ${definition.path}`
          : `Required discovery root is absent: ${definition.path}`,
        "Directory presence or absence is static repository evidence only.",
      ),
    );
  }
  return { roots, evidence };
}

function createRouteDraft(repositoryPath: string): ItemDraft {
  const evidenceId = makeStableId("evidence-route", repositoryPath);
  const item: RouteCoverageItem = {
    id: makeStableId("route", repositoryPath),
    kind: "route",
    path: repositoryPath,
    routePath: routePathFromFile(repositoryPath),
    routeFileKind: path.posix.basename(repositoryPath) === "page.tsx" ? "page" : "layout",
    status: "wired",
    statusNote:
      "The live App Router page/layout convention wires this source path; rendered behavior is not asserted.",
    evidenceRefs: [evidenceId],
  };
  return {
    item,
    evidence: makePathEvidence(
      evidenceId,
      [repositoryPath],
      `Live Planner ${item.routeFileKind} route discovered at ${item.routePath}.`,
      "Static route-source presence does not prove build or browser behavior.",
    ),
  };
}

function createApiDraft(
  repositoryRoot: string,
  repositoryPath: string,
): ItemDraft | null {
  const source = safeReadText(
    absoluteFromRepositoryPath(repositoryRoot, repositoryPath),
  );
  if (source === null) {
    return null;
  }
  const methods = extractHttpMethods(source);
  if (methods.length === 0) {
    return null;
  }
  const evidenceId = makeStableId("evidence-api", repositoryPath);
  const item: ApiCoverageItem = {
    id: makeStableId("api", repositoryPath),
    kind: "api",
    path: repositoryPath,
    endpointPath: apiPathFromFile(repositoryPath),
    methods,
    status: "present-but-unverified",
    statusNote:
      "Exported handlers are present, but protected integration evidence has not been executed.",
    evidenceRefs: [evidenceId],
  };
  return {
    item,
    evidence: makePathEvidence(
      evidenceId,
      [repositoryPath],
      `Live Planner API handler exports ${methods.join(", ")} at ${item.endpointPath}.`,
      "Export inspection does not prove runtime, authorization, or persistence behavior.",
    ),
  };
}

function createPlannerSourceDraft(
  repositoryPath: string,
  area: PlannerOwnedArea,
  graph: ImportGraph,
): ItemDraft {
  const classification = classifyPathStatus(
    repositoryPath,
    graph.reachablePaths,
  );
  const evidenceId = makeStableId("evidence-source", repositoryPath);
  const item: PlannerSourceCoverageItem = {
    id: makeStableId("planner-source", repositoryPath),
    kind: "planner-source",
    path: repositoryPath,
    area,
    status: classification.status,
    statusNote: classification.statusNote,
    evidenceRefs: [evidenceId],
  };
  return {
    item,
    evidence: makePathEvidence(
      evidenceId,
      [repositoryPath],
      `${area} path classified ${classification.status} from the live import tree.`,
      "Static reachability does not prove that a user workflow executes the path.",
    ),
  };
}

function createFocssDraft(
  repositoryPath: string,
  graph: ImportGraph,
): ItemDraft {
  const classification = classifyPathStatus(
    repositoryPath,
    graph.reachablePaths,
  );
  const evidenceId = makeStableId("evidence-focss", repositoryPath);
  const item: FocssCoverageItem = {
    id: makeStableId("focss", repositoryPath),
    kind: "focss",
    path: repositoryPath,
    zone: "planner",
    status: classification.status,
    statusNote: classification.statusNote,
    evidenceRefs: [evidenceId],
  };
  return {
    item,
    evidence: makePathEvidence(
      evidenceId,
      [repositoryPath],
      `Planner FOCSS path classified ${classification.status} from live imports.`,
      "Import reachability does not prove computed style or rendered behavior.",
    ),
  };
}

function isOwnedPath(repositoryPath: string): boolean {
  return (
    repositoryPath.startsWith(`${ROUTE_ROOT}/`) ||
    repositoryPath.startsWith(`${API_ROOT}/`) ||
    repositoryPath.startsWith(`${FOCSS_ROOT}/`) ||
    PLANNER_SOURCE_ROOTS.some((root) =>
      repositoryPath.startsWith(`${root.path}/`),
    )
  );
}

function createSharedDrafts(
  graph: ImportGraph,
  pathToItemId: ReadonlyMap<string, string>,
): ItemDraft[] {
  const drafts: ItemDraft[] = [];
  const sharedPaths = [...graph.reachablePaths]
    .filter((repositoryPath) => !isOwnedPath(repositoryPath))
    .sort(compareText);
  const allPathToItemId = new Map(pathToItemId);
  for (const sharedPath of sharedPaths) {
    allPathToItemId.set(
      sharedPath,
      makeStableId("reachable-shared-source", sharedPath),
    );
  }

  for (const repositoryPath of sharedPaths) {
    const reachableFromIds = [...(graph.importedBy.get(repositoryPath) ?? [])]
      .map((importerPath) => allPathToItemId.get(importerPath))
      .filter((itemId): itemId is string => Boolean(itemId))
      .sort(compareText);
    if (reachableFromIds.length === 0) {
      continue;
    }
    const evidenceId = makeStableId("evidence-shared", repositoryPath);
    const item: ReachableSharedSourceCoverageItem = {
      id: allPathToItemId.get(repositoryPath) ??
        makeStableId("reachable-shared-source", repositoryPath),
      kind: "reachable-shared-source",
      path: repositoryPath,
      reachableFromIds,
      status: "wired",
      statusNote:
        "The path is transitively reachable from a live Planner route or API entry.",
      evidenceRefs: [evidenceId],
    };
    drafts.push({
      item,
      evidence: makePathEvidence(
        evidenceId,
        [repositoryPath, ...[...(graph.importedBy.get(repositoryPath) ?? [])]],
        "Shared support is reachable through a local Planner import edge.",
        "Static import reachability does not prove runtime execution.",
      ),
    });
  }
  return drafts;
}

function testClassForPath(repositoryPath: string): TestCoverageItem["testClass"] {
  const normalized = repositoryPath.toLowerCase();
  if (normalized.includes("/e2e/") || normalized.includes("playwright")) {
    return "browser";
  }
  if (normalized.includes("/integration/")) {
    return "integration";
  }
  if (normalized.includes("/unit/")) {
    return "unit";
  }
  return "static";
}

function isRelevantTestOrConfig(
  repositoryPath: string,
  source: string,
): boolean {
  const normalizedPath = repositoryPath.toLowerCase();
  return (
    normalizedPath.includes("planner") ||
    /(?:\/ooplanner\b|\bPlanner\b|@planner\/|components\/Planner|features\/Planner|lib\/Planner|hooks\/Planner|store\/Planner|server\/Planner|platform\/Planner)/.test(
      source,
    )
  );
}

function inferCoveredItemIds(
  repositoryRoot: string,
  repositoryPath: string,
  source: string,
  pathToItemId: ReadonlyMap<string, string>,
  coverageItems: readonly CoverageItem[],
): string[] {
  const covered = new Set<string>();
  for (const specifier of extractImportSpecifiers(source)) {
    const resolvedPath = resolveLocalImport(
      repositoryRoot,
      repositoryPath,
      specifier,
    );
    const itemId = resolvedPath ? pathToItemId.get(resolvedPath) : undefined;
    if (itemId) {
      covered.add(itemId);
    }
  }

  for (const item of coverageItems) {
    const siteRelativePath = item.path.startsWith("site/")
      ? item.path.slice("site/".length)
      : item.path;
    const itemRoot = siteRelativePath.split("/").slice(0, 2).join("/");
    if (
      source.includes(item.path) ||
      source.includes(siteRelativePath) ||
      (itemRoot.includes("Planner") && source.includes(itemRoot))
    ) {
      covered.add(item.id);
    }
  }

  if (covered.size === 0) {
    for (const item of coverageItems) {
      if (item.kind === "route" && item.routeFileKind === "page") {
        covered.add(item.id);
      }
    }
  }
  return [...covered].sort(compareText);
}

function createTestDrafts(
  repositoryRoot: string,
  pathToItemId: ReadonlyMap<string, string>,
  coverageItems: readonly CoverageItem[],
): ItemDraft[] {
  const candidatePaths = new Set<string>();
  for (const rootPath of TEST_DISCOVERY_ROOTS) {
    for (const repositoryPath of walkFiles(repositoryRoot, rootPath)) {
      candidatePaths.add(repositoryPath);
    }
  }
  if (existsSync(absoluteFromRepositoryPath(repositoryRoot, "site/tsconfig.json"))) {
    candidatePaths.add("site/tsconfig.json");
  }

  const drafts: ItemDraft[] = [];
  for (const repositoryPath of [...candidatePaths].sort(compareText)) {
    const source = safeReadText(
      absoluteFromRepositoryPath(repositoryRoot, repositoryPath),
    );
    if (source === null || !isRelevantTestOrConfig(repositoryPath, source)) {
      continue;
    }
    const coversItemIds = inferCoveredItemIds(
      repositoryRoot,
      repositoryPath,
      source,
      pathToItemId,
      coverageItems,
    );
    if (coversItemIds.length === 0) {
      continue;
    }
    const classification = classifyPathStatus(repositoryPath, new Set());
    const status: CoverageStatus =
      classification.status === "generated"
        ? "generated"
        : "present-but-unverified";
    const statusNote =
      status === "generated"
        ? classification.statusNote
        : "The test or configuration is relevant by path, import, alias, or inclusion pattern; execution is protected and unobserved.";
    const evidenceId = makeStableId("evidence-test", repositoryPath);
    const item: TestCoverageItem = {
      id: makeStableId("test", repositoryPath),
      kind: "test",
      path: repositoryPath,
      testClass: testClassForPath(repositoryPath),
      coversItemIds,
      status,
      statusNote,
      evidenceRefs: [evidenceId],
    };
    drafts.push({
      item,
      evidence: makePathEvidence(
        evidenceId,
        [repositoryPath],
        `Planner-relevant ${item.testClass} test/configuration discovered from live content.`,
        "Source inclusion does not claim that the test or configuration has run.",
      ),
    });
  }
  return drafts;
}

function extractDocumentedPaths(
  source: string,
  surfaceKind: "route" | "api",
): Set<string> {
  const prefix = surfaceKind === "route" ? "/ooplanner" : "/api/Planner";
  const paths = new Set<string>();
  for (const match of source.matchAll(/`(\/[^`\s]+)`/g)) {
    const candidate = match[1].replace(/[),.;:]+$/, "");
    if (
      candidate.startsWith(prefix) &&
      !candidate.includes("*") &&
      !candidate.includes("{")
    ) {
      paths.add(candidate.replace(/\/$/, "") || "/");
    }
  }
  return paths;
}

function compareDocumentation(
  repositoryRoot: string,
  documentationPath: string,
  routeItems: readonly RouteCoverageItem[],
  apiItems: readonly ApiCoverageItem[],
): { conflicts: DocumentationConflict[]; evidence: EvidenceRecord[] } {
  const absoluteDocumentationPath = absoluteFromRepositoryPath(
    repositoryRoot,
    documentationPath,
  );
  const source = safeReadText(absoluteDocumentationPath);
  if (source === null) {
    return { conflicts: [], evidence: [] };
  }

  const liveByKind = {
    route: new Set(
      routeItems
        .filter((item) => item.routeFileKind === "page")
        .map((item) => item.routePath),
    ),
    api: new Set(apiItems.map((item) => item.endpointPath)),
  };
  const conflicts: DocumentationConflict[] = [];
  const evidence: EvidenceRecord[] = [];

  for (const surfaceKind of ["route", "api"] as const) {
    const documented = extractDocumentedPaths(source, surfaceKind);
    const live = liveByKind[surfaceKind];
    const allPaths = new Set([...documented, ...live]);
    for (const surfacePath of [...allPaths].sort(compareText)) {
      if (documented.has(surfacePath) === live.has(surfacePath)) {
        continue;
      }
      const conflictKind = documented.has(surfacePath)
        ? "documented-only"
        : "live-only";
      const matchingLiveItems =
        surfaceKind === "route"
          ? routeItems.filter((item) => item.routePath === surfacePath)
          : apiItems.filter((item) => item.endpointPath === surfacePath);
      const evidenceId = makeStableId(
        "evidence-documentation-conflict",
        `${surfaceKind}:${surfacePath}`,
      );
      const sourceRefs = [
        documentationPath,
        ...(matchingLiveItems.length > 0
          ? matchingLiveItems.map((item) => item.path)
          : [surfaceKind === "route" ? ROUTE_ROOT : API_ROOT]),
      ];
      conflicts.push({
        id: makeStableId(
          "documentation-conflict",
          `${surfaceKind}:${surfacePath}`,
        ),
        documentationPath,
        surfaceKind,
        surfacePath,
        conflictKind,
        status: conflictKind === "live-only" ? "wired" : "unwired/absent",
        resolution: "live-source",
        evidenceRefs: [evidenceId],
        note:
          conflictKind === "live-only"
            ? "The live source tree contains this surface although the documentation inventory omits it."
            : "Documentation names this surface, but the corresponding live route or handler is absent.",
      });
      evidence.push(
        makePathEvidence(
          evidenceId,
          sourceRefs,
          `Live source overrides a ${conflictKind} documentation claim for ${surfacePath}.`,
          "This is a static source-versus-document comparison, not runtime proof.",
        ),
      );
    }
  }
  return { conflicts, evidence };
}

function countStatuses(
  coverageItems: readonly CoverageItem[],
): Record<CoverageStatus, number> {
  const counts: Record<CoverageStatus, number> = {
    wired: 0,
    "present-but-unverified": 0,
    "demo/local-only": 0,
    generated: 0,
    legacy: 0,
    "unwired/absent": 0,
    unreachable: 0,
  };
  for (const item of coverageItems) {
    counts[item.status] += 1;
  }
  return counts;
}

export function collectPlannerCoverage(
  options: CoverageCollectorOptions,
): PlannerCoverageInventory {
  const repositoryRoot = path.resolve(options.repositoryRoot);
  const routePaths = walkFiles(repositoryRoot, ROUTE_ROOT).filter((filePath) =>
    /\/(?:page|layout)\.tsx$/.test(filePath),
  );
  const apiPaths = walkFiles(repositoryRoot, API_ROOT).filter((filePath) =>
    /\/route\.(?:ts|tsx)$/.test(filePath),
  );
  const seedPaths = [...routePaths, ...apiPaths].sort(compareText);
  const graph = buildImportGraph(repositoryRoot, seedPaths);
  const rootDrafts = coverageRootDrafts(repositoryRoot);
  const drafts: ItemDraft[] = [];

  for (const repositoryPath of routePaths) {
    drafts.push(createRouteDraft(repositoryPath));
  }
  for (const repositoryPath of apiPaths) {
    const draft = createApiDraft(repositoryRoot, repositoryPath);
    if (draft) {
      drafts.push(draft);
    }
  }
  for (const root of PLANNER_SOURCE_ROOTS) {
    for (const repositoryPath of walkFiles(repositoryRoot, root.path)) {
      drafts.push(createPlannerSourceDraft(repositoryPath, root.area, graph));
    }
  }
  for (const repositoryPath of walkFiles(repositoryRoot, FOCSS_ROOT)) {
    drafts.push(createFocssDraft(repositoryPath, graph));
  }

  let pathToItemId = new Map(
    drafts.map((draft) => [draft.item.path, draft.item.id]),
  );
  const sharedDrafts = createSharedDrafts(graph, pathToItemId);
  drafts.push(...sharedDrafts);
  pathToItemId = new Map(drafts.map((draft) => [draft.item.path, draft.item.id]));

  const coverageBeforeTests = drafts.map((draft) => draft.item);
  drafts.push(
    ...createTestDrafts(
      repositoryRoot,
      pathToItemId,
      coverageBeforeTests,
    ),
  );

  drafts.sort((left, right) =>
    compareText(
      `${left.item.kind}\u0000${left.item.path}`,
      `${right.item.kind}\u0000${right.item.path}`,
    ),
  );
  const coverageItems = drafts.map((draft) => draft.item);
  const routeItems = coverageItems.filter(
    (item): item is RouteCoverageItem => item.kind === "route",
  );
  const apiItems = coverageItems.filter(
    (item): item is ApiCoverageItem => item.kind === "api",
  );
  const documentation = compareDocumentation(
    repositoryRoot,
    options.routesDocumentationPath ?? ROUTES_DOCUMENTATION_PATH,
    routeItems,
    apiItems,
  );
  const evidence = [
    ...rootDrafts.evidence,
    ...drafts.map((draft) => draft.evidence),
    ...documentation.evidence,
  ].sort((left, right) => compareText(left.id, right.id));

  return {
    collectorVersion: 1,
    repositoryRoot: ".",
    requirementRefs: ["1.1", "1.2", "1.4", "1.5"],
    roots: rootDrafts.roots,
    coverageItems,
    evidence,
    documentationConflicts: documentation.conflicts.sort((left, right) =>
      compareText(left.id, right.id),
    ),
    coverageItemStatusCounts: countStatuses(coverageItems),
  };
}
