#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { Project } from "ts-morph";

const ROOT = path.resolve(process.cwd());
const AGENTS_WORK_ROOT = path.resolve(ROOT, "agents-work");
const DEFAULT_REPORT_ROOT = path.resolve(AGENTS_WORK_ROOT, "repository-graph");
const GRAPH_ROOTS = [
  "site",
  "scripts",
  "workers",
  "tech-docs-generator/src",
  "tech-docs-generator/scripts",
];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css"]);
const AST_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SKIP_DIRECTORY_NAMES = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "coverage",
  "results",
  "generated-documents",
  "public",
]);
const MAX_REPORTED_CYCLES = 100;

function normalizeRelative(value) {
  return value.replaceAll(path.sep, "/").replace(/^\.\//, "");
}

function readArgument(name) {
  const prefix = `${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function isWithinDirectory(parentDirectory, candidateDirectory) {
  const relativePath = path.relative(parentDirectory, candidateDirectory);
  return relativePath === "" || (!relativePath.startsWith(`..${path.sep}`) && relativePath !== "..");
}

function reportRoot() {
  const requested = readArgument("--out");
  const candidate = path.resolve(ROOT, requested ?? path.relative(ROOT, DEFAULT_REPORT_ROOT));
  if (!isWithinDirectory(AGENTS_WORK_ROOT, candidate)) {
    fail(`Report output must remain under ${normalizeRelative(path.relative(ROOT, AGENTS_WORK_ROOT))}/`);
  }
  return candidate;
}

function safeReportSegment(value) {
  return value.replaceAll("/", "-").replace(/[^a-zA-Z0-9._-]/g, "-");
}

function writeReport(payload, folder, filename) {
  const directory = path.resolve(reportRoot(), folder);
  if (!isWithinDirectory(AGENTS_WORK_ROOT, directory)) {
    fail("Report output directory escaped agents-work/");
  }
  fs.mkdirSync(directory, { recursive: true });
  const reportPath = path.resolve(directory, filename);
  if (!isWithinDirectory(AGENTS_WORK_ROOT, reportPath)) {
    fail("Report output path escaped agents-work/");
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return normalizeRelative(path.relative(ROOT, reportPath));
}

function emitReport(payload, folder, filename) {
  print({ ...payload, reportPath: writeReport(payload, folder, filename) });
}

function fail(message) {
  throw new Error(message);
}

function isWithinRepository(absolutePath) {
  const relativePath = path.relative(ROOT, absolutePath);
  return relativePath === "" || (!relativePath.startsWith(`..${path.sep}`) && relativePath !== "..");
}

function shouldSkipDirectory(absolutePath, entryName) {
  if (SKIP_DIRECTORY_NAMES.has(entryName)) return true;
  const relativePath = normalizeRelative(path.relative(ROOT, absolutePath));
  return /(^|\/)(?:migrations(?:\.admin)?|test-results|__snapshots__)(\/|$)/.test(relativePath);
}

function collectFiles(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(absolutePath, entry.name)) collectFiles(absolutePath, files);
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!SOURCE_EXTENSIONS.has(extension) || entry.name.endsWith(".d.ts")) continue;
    files.push(absolutePath);
  }
  return files;
}

function sourceFiles() {
  const files = GRAPH_ROOTS.flatMap((relativeRoot) =>
    collectFiles(path.resolve(ROOT, relativeRoot)),
  );
  return [...new Set(files.map((file) => path.resolve(file)))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function stripComments(source, isCss = false) {
  let result = source.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "));
  if (!isCss) {
    result = result.replace(/(^|[^:])\/\/[^\n]*/g, (match, prefix) =>
      prefix + " ".repeat(match.length - prefix.length),
    );
  }
  return result;
}

function parseJsonConfig(configPath) {
  if (!fs.existsSync(configPath)) return null;
  const source = fs.readFileSync(configPath, "utf8");
  try {
    return JSON.parse(source);
  } catch {
    try {
      const withoutComments = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      return JSON.parse(withoutComments);
    } catch {
      return null;
    }
  }
}

function loadAliases() {
  const configPaths = [
    "tsconfig.json",
    "site/tsconfig.json",
    "workers/oando-worker-proxy/tsconfig.json",
    "tech-docs-generator/tsconfig.json",
  ];
  const aliases = [];
  for (const relativeConfigPath of configPaths) {
    const configPath = path.resolve(ROOT, relativeConfigPath);
    const config = parseJsonConfig(configPath);
    const paths = config?.compilerOptions?.paths;
    if (!paths || typeof paths !== "object") continue;
    const configDirectory = path.dirname(configPath);
    const baseUrl = path.resolve(configDirectory, config.compilerOptions.baseUrl ?? ".");
    for (const [pattern, targets] of Object.entries(paths)) {
      if (!Array.isArray(targets)) continue;
      const wildcard = pattern.includes("*");
      const prefix = wildcard ? pattern.slice(0, pattern.indexOf("*")) : pattern;
      for (const target of targets) {
        if (typeof target !== "string") continue;
        const targetPrefix = wildcard ? target.slice(0, target.indexOf("*")) : target;
        aliases.push({
          prefix,
          targetBase: path.resolve(baseUrl, targetPrefix),
          wildcard,
          exactPattern: pattern,
        });
      }
    }
  }
  return aliases.sort((left, right) => right.prefix.length - left.prefix.length);
}

function candidatePaths(basePath) {
  const candidates = [basePath];
  const extension = path.extname(basePath).toLowerCase();
  const stem = extension ? basePath.slice(0, -extension.length) : basePath;
  const extensionSubstitutions = {
    ".js": [".js", ".jsx", ".ts", ".tsx"],
    ".jsx": [".jsx", ".tsx"],
    ".mjs": [".mjs", ".mts", ".js", ".ts"],
    ".cjs": [".cjs", ".cts", ".js", ".ts"],
  };
  if (extensionSubstitutions[extension]) {
    for (const alternativeExtension of extensionSubstitutions[extension]) {
      candidates.push(`${stem}${alternativeExtension}`);
    }
  } else if (!extension || !SOURCE_EXTENSIONS.has(extension)) {
    for (const sourceExtension of SOURCE_EXTENSIONS) candidates.push(`${basePath}${sourceExtension}`);
  }
  for (const sourceExtension of SOURCE_EXTENSIONS) {
    candidates.push(path.join(basePath, `index${sourceExtension}`));
  }
  return candidates;
}

function buildResolver(files) {
  const filesByRelativePath = new Map(
    files.map((absolutePath) => [normalizeRelative(path.relative(ROOT, absolutePath)), absolutePath]),
  );
  const filesByLowercasePath = new Map(
    [...filesByRelativePath.keys()].map((relativePath) => [relativePath.toLowerCase(), relativePath]),
  );
  const aliases = loadAliases();

  function findCandidate(basePath) {
    for (const candidate of candidatePaths(path.resolve(basePath))) {
      if (!isWithinRepository(candidate)) continue;
      const relativePath = normalizeRelative(path.relative(ROOT, candidate));
      if (filesByRelativePath.has(relativePath)) return relativePath;
      const caseInsensitiveMatch = filesByLowercasePath.get(relativePath.toLowerCase());
      if (caseInsensitiveMatch) return caseInsensitiveMatch;
    }
    return null;
  }

  function resolveSpecifier(fromRelativePath, specifier) {
    if (specifier.startsWith(".")) {
      return findCandidate(path.resolve(ROOT, path.dirname(fromRelativePath), specifier));
    }
    for (const alias of aliases) {
      if (alias.wildcard) {
        if (!specifier.startsWith(alias.prefix)) continue;
        const remainder = specifier.slice(alias.prefix.length);
        return findCandidate(path.join(alias.targetBase, remainder));
      }
      if (specifier === alias.exactPattern) return findCandidate(alias.targetBase);
    }
    return null;
  }

  function isConfiguredAlias(specifier) {
    return aliases.some((alias) =>
      alias.wildcard ? specifier.startsWith(alias.prefix) : specifier === alias.exactPattern,
    );
  }

  return { filesByRelativePath, resolveSpecifier, isConfiguredAlias, aliases };
}

function collectFallbackSpecifiers(source) {
  const specifiers = [];
  const code = stripComments(source);
  const staticPatterns = [
    /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of staticPatterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) specifiers.push(match[1]);
  }
  return specifiers;
}

function collectSpecifiers(absolutePath, project) {
  const source = fs.readFileSync(absolutePath, "utf8");
  const extension = path.extname(absolutePath).toLowerCase();
  const specifiers = [];
  if (extension === ".css") {
    const css = stripComments(source, true);
    const pattern = /@import\s+(?:url\s*\(\s*)?["']([^"']+)["']/g;
    let match;
    while ((match = pattern.exec(css)) !== null) specifiers.push(match[1]);
    return [...new Set(specifiers)];
  }

  if (AST_EXTENSIONS.has(extension)) {
    try {
      const sourceFile = project.addSourceFileAtPath(absolutePath);
      for (const declaration of sourceFile.getImportDeclarations()) {
        specifiers.push(declaration.getModuleSpecifierValue());
      }
      for (const declaration of sourceFile.getExportDeclarations()) {
        const moduleSpecifier = declaration.getModuleSpecifierValue();
        if (moduleSpecifier) specifiers.push(moduleSpecifier);
      }
    } catch {
      specifiers.push(...collectFallbackSpecifiers(source));
    }
  } else {
    specifiers.push(...collectFallbackSpecifiers(source));
  }

  specifiers.push(...collectFallbackSpecifiers(source));
  const dynamicPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)|\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;
  const code = stripComments(source);
  let dynamicMatch;
  while ((dynamicMatch = dynamicPattern.exec(code)) !== null) {
    specifiers.push(dynamicMatch[1] ?? dynamicMatch[2]);
  }
  return [...new Set(specifiers)];
}

function classifyDomain(relativePath) {
  if (relativePath.startsWith("site/app/(site)/") || relativePath.startsWith("site/features/site/")) return "marketing";
  if (
    relativePath.startsWith("site/app/admin/") ||
    relativePath.startsWith("site/features/admin/") ||
    relativePath.startsWith("site/features/crm/") ||
    relativePath.startsWith("site/features/ops/")
  ) return "admin-ops";
  if (relativePath.includes("/Planner/") || relativePath.includes("/ooplanner/")) return "planner";
  if (relativePath.includes("/Studio/") || relativePath.includes("/oostudio/")) return "studio";
  if (relativePath.startsWith("site/lib/ai/") || relativePath.includes("/ai/mastra/")) return "ai-retrieval";
  if (relativePath.startsWith("site/platform/supabase/") || relativePath.startsWith("site/platform/drizzle/")) return "database-platform";
  if (relativePath.startsWith("site/focss/")) return "focss";
  if (relativePath.startsWith("site/")) {
    const siteArea = relativePath.split("/")[1] ?? "root";
    return `site/${siteArea.includes(".") ? "root" : siteArea}`;
  }
  if (relativePath.startsWith("scripts/")) {
    const scriptsArea = relativePath.split("/")[1] ?? "root";
    return `scripts/${scriptsArea.includes(".") ? "root" : scriptsArea}`;
  }
  if (relativePath.startsWith("workers/")) return "worker";
  if (relativePath.startsWith("tech-docs-generator/")) return "tech-docs";
  return "other";
}

function buildGraph() {
  const files = sourceFiles();
  const resolver = buildResolver(files);
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: { allowJs: true, checkJs: false },
  });
  const graph = new Map();
  const unresolved = new Map();

  for (const absolutePath of files) {
    const relativePath = normalizeRelative(path.relative(ROOT, absolutePath));
    const dependencies = new Set();
    const unresolvedSpecifiers = [];
    for (const specifier of collectSpecifiers(absolutePath, project)) {
      const dependency = resolver.resolveSpecifier(relativePath, specifier);
      if (dependency && dependency !== relativePath) dependencies.add(dependency);
      else if (!dependency && (specifier.startsWith(".") || resolver.isConfiguredAlias(specifier))) unresolvedSpecifiers.push(specifier);
    }
    graph.set(relativePath, dependencies);
    if (unresolvedSpecifiers.length > 0) unresolved.set(relativePath, unresolvedSpecifiers);
  }

  const reverse = new Map([...graph.keys()].map((file) => [file, new Set()]));
  for (const [from, dependencies] of graph) {
    for (const dependency of dependencies) reverse.get(dependency)?.add(from);
  }
  return { graph, reverse, unresolved, aliases: resolver.aliases };
}

function domainStats(graph) {
  const stats = new Map();
  for (const [file, dependencies] of graph) {
    const domain = classifyDomain(file);
    const current = stats.get(domain) ?? { files: 0, edges: 0 };
    current.files += 1;
    current.edges += dependencies.size;
    stats.set(domain, current);
  }
  return Object.fromEntries(
    [...stats.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([domain, values]) => [domain, values]),
  );
}

function rankedFiles(graph, reverse, direction) {
  const source = direction === "fanIn" ? reverse : graph;
  return [...source.entries()]
    .map(([file, dependencies]) => ({ file, count: dependencies.size, domain: classifyDomain(file) }))
    .sort((left, right) => right.count - left.count || left.file.localeCompare(right.file))
    .slice(0, 20);
}

function runStats({ graph, reverse, unresolved, aliases }) {
  const payload = {
    mode: "stats",
    roots: GRAPH_ROOTS.filter((relativeRoot) => fs.existsSync(path.resolve(ROOT, relativeRoot))),
    aliases: aliases.map((alias) => ({
      prefix: alias.prefix,
      target: normalizeRelative(path.relative(ROOT, alias.targetBase)),
    })),
    files: graph.size,
    edges: [...graph.values()].reduce((total, dependencies) => total + dependencies.size, 0),
    unresolvedLocalSpecifiers: [...unresolved.values()].reduce((total, values) => total + values.length, 0),
    unresolvedExamples: [...unresolved.entries()]
      .slice(0, 25)
      .map(([file, specifiers]) => ({ file, specifiers })),
    domains: domainStats(graph),
    highestFanIn: rankedFiles(graph, reverse, "fanIn"),
    highestFanOut: rankedFiles(graph, reverse, "fanOut"),
  };
  emitReport(payload, "stats", "latest.json");
}

function resolveInputFile(input, graph) {
  const raw = input.replaceAll("\\", "/").replace(/^\.\//, "");
  const direct = normalizeRelative(raw);
  if (graph.has(direct)) return direct;
  const absolute = path.isAbsolute(input) ? path.resolve(input) : path.resolve(ROOT, input);
  const relative = normalizeRelative(path.relative(ROOT, absolute));
  if (graph.has(relative)) return relative;
  for (const candidate of candidatePaths(absolute)) {
    const candidateRelative = normalizeRelative(path.relative(ROOT, candidate));
    if (graph.has(candidateRelative)) return candidateRelative;
  }
  const lower = direct.toLowerCase();
  return [...graph.keys()].find((file) => file.toLowerCase() === lower) ?? null;
}

function parseDepth(value) {
  if (value === null) return Number.POSITIVE_INFINITY;
  if (!/^\d+$/.test(value)) fail(`--depth must be a non-negative integer; received ${value}`);
  return Number(value);
}

function runImpact({ graph, reverse }) {
  const input = readArgument("--file");
  if (!input) fail("--file=<path> is required for impact analysis");
  const file = resolveInputFile(input, graph);
  if (!file) fail(`File is not in the graph: ${input}`);
  const depth = parseDepth(readArgument("--depth"));
  const queue = [{ file, distance: 0 }];
  const distances = new Map([[file, 0]]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (current.distance >= depth) continue;
    for (const dependent of reverse.get(current.file) ?? []) {
      if (distances.has(dependent)) continue;
      distances.set(dependent, current.distance + 1);
      queue.push({ file: dependent, distance: current.distance + 1 });
    }
  }
  const dependents = [...distances.entries()]
    .filter(([dependent]) => dependent !== file)
    .map(([dependent, distance]) => ({
      file: dependent,
      distance,
      domain: classifyDomain(dependent),
      fanIn: reverse.get(dependent)?.size ?? 0,
      fanOut: graph.get(dependent)?.size ?? 0,
    }))
    .sort((left, right) => left.distance - right.distance || left.file.localeCompare(right.file));
  const payload = {
    mode: "file",
    file,
    domain: classifyDomain(file),
    depth: Number.isFinite(depth) ? depth : null,
    depthMeaning: "The seed is distance 0; --depth=N includes dependents up to N import hops.",
    directDependencies: [...(graph.get(file) ?? [])].sort(),
    directDependents: [...(reverse.get(file) ?? [])].sort(),
    dependents,
  };
  emitReport(payload, `impact/${safeReportSegment(payload.domain)}`, `${safeReportSegment(file)}.json`);
}

function findCycles(graph) {
  let nextIndex = 0;
  const indices = new Map();
  const lowLinks = new Map();
  const stack = [];
  const onStack = new Set();
  const components = [];

  function visit(file) {
    indices.set(file, nextIndex);
    lowLinks.set(file, nextIndex);
    nextIndex += 1;
    stack.push(file);
    onStack.add(file);
    for (const dependency of graph.get(file) ?? []) {
      if (!indices.has(dependency)) {
        visit(dependency);
        lowLinks.set(file, Math.min(lowLinks.get(file), lowLinks.get(dependency)));
      } else if (onStack.has(dependency)) {
        lowLinks.set(file, Math.min(lowLinks.get(file), indices.get(dependency)));
      }
    }
    if (lowLinks.get(file) !== indices.get(file)) return;
    const component = [];
    let member;
    do {
      member = stack.pop();
      onStack.delete(member);
      component.push(member);
    } while (member !== file);
    if (component.length > 1 || graph.get(file)?.has(file)) components.push(component.sort());
  }

  for (const file of graph.keys()) if (!indices.has(file)) visit(file);
  return components.sort((left, right) => left[0].localeCompare(right[0]));
}

function runCycles({ graph }) {
  const cycles = findCycles(graph);
  const reportedCycles = cycles.slice(0, MAX_REPORTED_CYCLES).map((members) => ({
    members,
    domains: [...new Set(members.map(classifyDomain))].sort(),
  }));
  const payload = {
    mode: "circles",
    files: graph.size,
    edges: [...graph.values()].reduce((total, dependencies) => total + dependencies.size, 0),
    cycleCount: cycles.length,
    reportedCycleCount: reportedCycles.length,
    truncated: cycles.length > MAX_REPORTED_CYCLES,
    cycles: reportedCycles,
  };
  emitReport(payload, "cycles", "latest.json");
}

function printHelp() {
  print({
    usage: [
      "node scripts/graph-impact.mjs --stats [--out=agents-work/repository-graph]",
      "node scripts/graph-impact.mjs --circles [--out=agents-work/repository-graph]",
      "node scripts/graph-impact.mjs --file=<repository-relative-path> [--depth=N] [--out=agents-work/repository-graph]",
    ],
    roots: GRAPH_ROOTS,
    behavior: "Read-only local import graph; results are printed to stdout and saved as JSON reports.",
    depth: "The seed is distance 0; --depth=2 includes direct dependents and one additional hop.",
    reportLayout: {
      stats: "agents-work/repository-graph/stats/latest.json",
      cycles: "agents-work/repository-graph/cycles/latest.json",
      impact: "agents-work/repository-graph/impact/<domain>/<file>.json",
    },
    outputBoundary: "Report output must remain under agents-work/; this tool never writes to site/.",
  });
}

async function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    printHelp();
    return;
  }
  const modeFlags = [hasFlag("--stats"), hasFlag("--circles"), readArgument("--file") !== null];
  if (modeFlags.filter(Boolean).length !== 1) {
    printHelp();
    fail("Choose exactly one mode: --stats, --circles, or --file=<path>");
  }
  const graph = buildGraph();
  if (hasFlag("--stats")) runStats(graph);
  else if (hasFlag("--circles")) runCycles(graph);
  else runImpact(graph);
}

main().catch((error) => {
  process.stderr.write(`graph-impact: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
