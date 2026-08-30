#!/usr/bin/env node
/**
 * Verify the FOCSS architecture as one contract.
 *
 * Scopes:
 *   structure — tree, entry chains, tokens, import graph, and CSS ownership
 *   imports   — every CSS import resolves using CSS package resolution rules
 *   fences    — layout-entry migration and retired-path fences
 *   modules   — CSS-module-only graph, cycle, and stable hash checks
 *
 * Run without --scope to evaluate every scope and receive one aggregate report.
 */
import crypto from "node:crypto";
import enhancedResolve from "enhanced-resolve";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const importPattern = /@import\s+(?:url\(\s*)?(?:["']([^"']+)["']|([^\s;)]+))\s*\)?/g;
const rawColorPattern = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\s*\(/gi;
const maxStylesheetLines = 800;
const scopeNames = new Set(["structure", "imports", "fences", "modules"]);

const externalImportsByFile = new Map([
  ["base/scan.css", new Set(["tailwindcss"])],
  ["base/runtime.css", new Set(["tw-animate-css"])],
  ["planner/entry.css", new Set(["tailwindcss"])],
]);

const forbiddenPaths = [
  "package.json",
  "entries",
  "zones",
  "chrome",
  "modules",
  "tech-stack",
  "product",
  "site/base",
  "site/index.css",
  "base/product.css",
  "base/shadcn-theme.css",
];

const forbiddenFlatBaseSheets = [
  "base/palette.css",
  "base/semantic.css",
  "base/layout.css",
  "base/typography.css",
  "base/type.css",
  "base/colors.css",
  "base/schemes.css",
  "base/buttons.css",
];

const baseIndexImports = [
  "./tokens/palette.css",
  "./tokens/semantic.css",
  "./type/typography.css",
  "./tokens/layout.css",
  "./type/type.css",
  "./animations.css",
  "./containers.css",
];

const layoutEntryImports = new Map([
  ["base/root.css", ["./scan.css", "./index.css"]],
  [
    "site/entry.css",
    [
      "../base/scan.css",
      "../base/runtime.css",
      "../base/document.css",
      "../base/index.css",
      "./type-marketing.css",
      "./heading-document.css",
      "./components/index.css",
    ],
  ],
  [
    "admin/entry.css",
    [
      "../base/scan.css",
      "../base/runtime.css",
      "../base/index.css",
      "../base/document.css",
      "./base/tokens.css",
      "./base/shell.css",
      "./base/type.css",
      "./base/buttons.css",
      "./base/primitives.css",
      "./components/pages.css",
      "./components/entry-hero.css",
      "./components/hub.css",
      "./components/catalog.css",
      "./components/crm.css",
    ],
  ],
  [
    "planner/entry.css",
    [
      "tailwindcss",
      "../base/tokens/palette.css",
      "./base/palette.css",
      "./base/semantic.css",
      "./base/layout.css",
      "./base/document.css",
      "./chrome.css",
      "./controls.css",
      "./polish.css",
      "./workspace-shell.css",
      "./workspace.css",
      "./responsive.css",
      "./dock.css",
    ],
  ],
  [
    "studio/entry.css",
    [
      "../base/scan.css",
      "../base/runtime.css",
      "../base/index.css",
      "../base/document.css",
      "./base/index.css",
      "./chrome.css",
      "./controls.css",
      "./polish.css",
      "./workspace-shell.css",
      "./workspace.css",
      "./dock.css",
    ],
  ],
]);

const requiredBaseTokens = new Map([
  ["base/tokens/palette.css", ["--color-ecru-100", "--color-dark-midnight-blue-500", "--color-white-200"]],
  ["base/tokens/semantic.css", ["--surface-page", "--surface-panel", "--text-body", "--border-soft", "--color-focus", "--shadow-sm"]],
  ["base/tokens/layout.css", ["--space-4", "--container-max", "--radius-md", "--motion-base"]],
]);

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function walkCss(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkCss(absolutePath, files);
    } else if (entry.name.endsWith(".css")) {
      files.push(absolutePath);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function readImports(css) {
  return [...stripComments(css).matchAll(importPattern)].map((match) => match[1] ?? match[2]);
}

function relativeKey(root, absolutePath) {
  return path.relative(root, absolutePath).replaceAll("\\", "/");
}

function resolveRelativeImport(fromFile, specifier) {
  const direct = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [direct, `${direct}.css`, path.join(direct, "index.css")];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function importsExactly(entries, key, expected) {
  const actual = entries.get(key) ?? [];
  return actual.length === expected.length && actual.every((specifier, index) => specifier === expected[index]);
}

function requireImportSequence(errors, entries, key, expected) {
  if (!importsExactly(entries, key, expected)) {
    errors.push(`${key} must import exactly: ${expected.join(" -> ")}`);
  }
}

function reachable(graph, entry, target) {
  const seen = new Set();
  const queue = [...(graph.get(entry) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    if (current === target) return true;
    seen.add(current);
    queue.push(...(graph.get(current) ?? []));
  }
  return false;
}

function reachablePrefix(graph, entry, prefix) {
  const seen = new Set();
  const queue = [...(graph.get(entry) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    if (current.startsWith(prefix)) return current;
    queue.push(...(graph.get(current) ?? []));
  }
  return null;
}

function findCycles(graph) {
  const visited = new Set();
  const visiting = new Set();
  const stack = [];
  const cycles = [];

  function visit(node) {
    if (visited.has(node)) return;
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      cycles.push([...stack.slice(start), node].join(" -> "));
      return;
    }
    visiting.add(node);
    stack.push(node);
    for (const dependency of graph.get(node) ?? []) visit(dependency);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of [...graph.keys()].sort()) visit(node);
  return cycles;
}

function verifyAdminTokenScope(errors, cssByKey) {
  const adminTokens = cssByKey.get("admin/base/tokens.css") ?? "";
  if (!adminTokens) {
    errors.push("required Admin token scope is missing: admin/base/tokens.css");
    return;
  }
  if (!/\.shell-admin-layout\s*(?:,|\{)/.test(adminTokens)) {
    errors.push("admin/base/tokens.css must scope Admin overrides to .shell-admin-layout");
  }
  if (/(?:^|[}\s])body(?:\s|:|\[|\.)/m.test(adminTokens)) {
    errors.push("admin/base/tokens.css must not override document-level body tokens");
  }
  if (cssByKey.has("features/shadcn/theme.css") || cssByKey.has("features/shadcn/tailwind.css")) {
    errors.push("features/shadcn/* must not exist (shadcn pack retired)");
  }
}

function verifyFoundation(errors, graph, entries, cssByKey) {
  requireImportSequence(errors, entries, "base/index.css", baseIndexImports);
  for (const [entry, imports] of layoutEntryImports) {
    requireImportSequence(errors, entries, entry, imports);
  }

  for (const [file, tokens] of requiredBaseTokens) {
    const css = cssByKey.get(file) ?? "";
    for (const token of tokens) {
      if (!css.includes(`${token}:`)) {
        errors.push(`${file} must define the base token ${token}`);
      }
    }
  }

  for (const entry of ["base/root.css", "site/entry.css", "admin/entry.css", "studio/entry.css"]) {
    for (const foundationFile of ["base/tokens/palette.css", "base/tokens/semantic.css", "base/tokens/layout.css"]) {
      if (!reachable(graph, entry, foundationFile)) {
        errors.push(`${entry} must reach ${foundationFile} through base/index.css`);
      }
    }
  }

  if (!reachable(graph, "planner/entry.css", "base/tokens/palette.css")) {
    errors.push("planner/entry.css must reach base/tokens/palette.css");
  }
  if (reachable(graph, "planner/entry.css", "base/tokens/semantic.css")) {
    errors.push("planner/entry.css must not load base/tokens/semantic.css (uses planner/base/semantic.css)");
  }
  if (reachable(graph, "planner/entry.css", "base/type/type.css")) {
    errors.push("planner/entry.css must not load marketing base type utilities");
  }
  if (reachable(graph, "base/root.css", "base/document.css")) {
    errors.push("base/root.css must not reach base/document.css");
  }

  for (const forbiddenPrefix of ["features/product/", "features/shadcn/", "admin/"]) {
    const reached = reachablePrefix(graph, "site/entry.css", forbiddenPrefix);
    if (reached) errors.push(`site/entry.css must not reach ${reached}`);
  }

  for (const forkEntry of ["studio/entry.css", "admin/entry.css"]) {
    if (!reachable(graph, forkEntry, "base/index.css")) {
      errors.push(`${forkEntry} must reach base/index.css`);
    }
    if (!reachable(graph, forkEntry, "base/document.css")) {
      errors.push(`${forkEntry} must reach base/document.css`);
    }
  }

  if (!reachable(graph, "planner/entry.css", "planner/base/document.css")) {
    errors.push("planner/entry.css must reach planner/base/document.css");
  }
  if (reachablePrefix(graph, "admin/entry.css", "features/shadcn/")) {
    errors.push("admin/entry.css must not reach features/shadcn/");
  }
  if (cssByKey.has("features/product/foundation.css") || cssByKey.has("features/product/entry.css")) {
    errors.push("features/product/* must not exist — base is inlined in zone entries");
  }

  verifyAdminTokenScope(errors, cssByKey);
}

function verifySiteComponentsLayout(errors, focssRoot) {
  const componentsRoot = path.join(focssRoot, "site", "components");
  if (!fs.existsSync(componentsRoot)) return;
  for (const entry of fs.readdirSync(componentsRoot, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".css") && entry.name !== "index.css") {
      errors.push(`site/components/${entry.name} must live under site/components/shared/`);
    }
  }
}

function verifyFlatBaseSheets(errors, focssRoot) {
  for (const relativePath of forbiddenFlatBaseSheets) {
    if (fs.existsSync(path.join(focssRoot, relativePath))) {
      errors.push(`forbidden flat base sheet: ${relativePath}`);
    }
  }
}

export function verifyFocssStructure(root = scriptRoot) {
  const focssRoot = path.join(root, "site", "focss");
  const errors = [];
  if (!fs.existsSync(focssRoot)) {
    return { ok: false, errors: ["site/focss/ is missing"], cycles: [], cssFileCount: 0 };
  }

  for (const relativePath of forbiddenPaths) {
    if (fs.existsSync(path.join(focssRoot, relativePath))) {
      errors.push(`forbidden FOCSS path exists: site/focss/${relativePath}`);
    }
  }
  verifyFlatBaseSheets(errors, focssRoot);
  verifySiteComponentsLayout(errors, focssRoot);

  const graph = new Map();
  const entries = new Map();
  const cssByKey = new Map();
  const cssFiles = walkCss(focssRoot);

  for (const file of cssFiles) {
    const key = relativeKey(focssRoot, file);
    const css = fs.readFileSync(file, "utf8");
    const uncommentedCss = stripComments(css);
    cssByKey.set(key, uncommentedCss);

    const lineCount = css.split(/\r?\n/).length;
    if (lineCount > maxStylesheetLines) {
      errors.push(`${key} exceeds the ${maxStylesheetLines}-line FOCSS maximum (${lineCount} lines)`);
    }
    if (key !== "base/scan.css" && /@source\b/.test(uncommentedCss)) {
      errors.push(`${key} uses @source; only base/scan.css may configure Tailwind sources`);
    }
    if (!key.startsWith("base/")) {
      for (const match of uncommentedCss.matchAll(rawColorPattern)) {
        errors.push(`${key} contains raw color literal ${match[0]}; define it in base/ and use its token`);
      }
    }

    const specifiers = readImports(css);
    entries.set(key, specifiers);
    const dependencies = [];
    for (const specifier of specifiers) {
      if (!specifier.startsWith(".")) {
        if (!externalImportsByFile.get(key)?.has(specifier)) {
          errors.push(`${key} imports unsupported external stylesheet ${specifier}`);
        }
        continue;
      }
      const resolved = resolveRelativeImport(file, specifier);
      if (!resolved) {
        errors.push(`${key} cannot resolve ${specifier}`);
        continue;
      }
      const resolvedKey = relativeKey(focssRoot, resolved);
      if (resolvedKey.startsWith("..")) {
        errors.push(`${key} imports outside site/focss/: ${specifier}`);
        continue;
      }
      dependencies.push(resolvedKey);
    }
    graph.set(key, dependencies);
  }

  for (const entry of layoutEntryImports.keys()) {
    if (!graph.has(entry)) errors.push(`required FOCSS entry is missing: ${entry}`);
  }
  verifyFoundation(errors, graph, entries, cssByKey);

  const cycles = findCycles(graph);
  for (const cycle of cycles) errors.push(`FOCSS import cycle: ${cycle}`);
  return { ok: errors.length === 0, errors: [...new Set(errors)].sort(), cycles, cssFileCount: cssFiles.length };
}

function createCssResolver() {
  return enhancedResolve.ResolverFactory.createResolver({
    fileSystem: new enhancedResolve.CachedInputFileSystem(fs, 4_000),
    useSyncFileSystemCalls: true,
    extensions: [".css"],
    mainFields: ["style"],
    conditionNames: ["style"],
    modules: ["node_modules", ...(process.env.NODE_PATH?.split(path.delimiter) ?? [])],
  });
}

function resolveCssImport(resolver, fromFile, specifier) {
  try {
    const target = resolver.resolveSync({}, path.dirname(fromFile), specifier);
    return fs.statSync(target).isFile();
  } catch {
    return false;
  }
}

export function verifyFocssImports(root = scriptRoot) {
  const focssRoot = path.join(root, "site", "focss");
  if (!fs.existsSync(focssRoot)) {
    return { ok: false, errors: ["site/focss/ is missing"], cssFileCount: 0, importCount: 0 };
  }

  const errors = [];
  const resolver = createCssResolver();
  const cssFiles = walkCss(focssRoot);
  let importCount = 0;
  for (const file of cssFiles) {
    const key = relativeKey(root, file);
    for (const specifier of readImports(fs.readFileSync(file, "utf8"))) {
      importCount += 1;
      if (!resolveCssImport(resolver, file, specifier)) {
        errors.push(`${key}: cannot resolve ${specifier}`);
      }
    }
  }

  return { ok: errors.length === 0, errors: [...new Set(errors)].sort(), cssFileCount: cssFiles.length, importCount };
}

function importList(css) {
  return [...css.matchAll(/@import\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

function readFenceFile(focssRoot, relativePath, errors) {
  const target = path.join(focssRoot, relativePath);
  if (!fs.existsSync(target)) {
    errors.push(`required FOCSS fence input is missing: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(target, "utf8");
}

export function verifyFocssFences(root = scriptRoot) {
  const focssRoot = path.join(root, "site", "focss");
  const errors = [];
  if (!fs.existsSync(focssRoot)) {
    return { ok: false, errors: ["site/focss/ is missing"] };
  }

  const rootCss = readFenceFile(focssRoot, "base/root.css", errors);
  const siteCss = readFenceFile(focssRoot, "site/entry.css", errors);
  const runtimeCss = readFenceFile(focssRoot, "base/runtime.css", errors);
  const plannerCss = readFenceFile(focssRoot, "planner/entry.css", errors);
  const studioCss = readFenceFile(focssRoot, "studio/entry.css", errors);
  const adminCss = readFenceFile(focssRoot, "admin/entry.css", errors);

  if (errors.length > 0) return { ok: false, errors };
  if ([rootCss, siteCss, adminCss, plannerCss, studioCss].some((css) => /@source\b/.test(css))) {
    errors.push("raw @source in root/site/product entries — must live only in base/scan.css");
  }

  const rootImports = importList(rootCss);
  const siteImports = importList(siteCss);
  const runtimeImports = importList(runtimeCss);
  const plannerImports = importList(plannerCss);
  const studioImports = importList(studioCss);
  const adminImports = importList(adminCss);
  const isDocument = (specifier) => /document\.css/.test(specifier);
  const productBaseImports = ["../base/scan.css", "../base/runtime.css", "../base/index.css", "../base/document.css"];

  function requireProductBase(label, imports) {
    for (const expected of productBaseImports) {
      if (!imports.includes(expected)) errors.push(`${label} must import ${expected}`);
    }
    if (imports.some((specifier) => specifier.includes("shadcn") || specifier.includes("features/product"))) {
      errors.push(`${label} must not import shadcn or features/product`);
    }
    const documentIndex = imports.findIndex(isDocument);
    const firstLocalIndex = imports.findIndex((specifier) => specifier.startsWith("./"));
    if (documentIndex < 0) {
      errors.push(`${label} must import ../base/document.css`);
    } else if (firstLocalIndex >= 0 && documentIndex > firstLocalIndex) {
      errors.push(`${label}: ../base/document.css must come before zone-local sheets`);
    }
  }

  if (siteImports.some((specifier) => specifier.includes("shadcn"))) errors.push("site/entry.css must not import shadcn");
  if (rootImports.some((specifier) => /runtime|document/.test(specifier))) errors.push("base/root.css must not import runtime or document");
  requireProductBase("admin/entry.css", adminImports);
  requireProductBase("studio/entry.css", studioImports);

  const plannerNeeds = ["tailwindcss", "../base/tokens/palette.css", "./base/palette.css", "./base/semantic.css", "./base/layout.css", "./base/document.css"];
  for (const expected of plannerNeeds) {
    if (!plannerImports.includes(expected)) errors.push(`planner/entry.css must import ${expected}`);
  }
  if (plannerImports.includes("../base/scan.css")) errors.push("planner/entry.css must not import ../base/scan.css — own @import tailwindcss");
  if (plannerImports.some((specifier) => ["../base/runtime.css", "../base/index.css", "../base/document.css"].includes(specifier))) {
    errors.push("planner/entry.css must not import marketing runtime/index/document");
  }
  if (plannerImports.some((specifier) => specifier.includes("shadcn") || specifier.includes("admin/"))) {
    errors.push("planner/entry.css must not import shadcn or admin");
  }

  if (runtimeImports.some(isDocument)) errors.push("base/runtime.css must not import document");
  for (const [relativePath, message] of [
    ["entries", "site/focss/entries/ must be removed"],
    ["base/product.css", "base/product.css must not exist — product base is inlined in zone entries"],
    ["product", "site/focss/product/ must be removed"],
    ["features/product", "features/product/ must be removed — base is inlined in admin/planner/studio entries"],
    ["base/shadcn-theme.css", "base/shadcn-theme.css must be removed (shadcn retired)"],
    ["features/shadcn", "features/shadcn/ must be removed (shadcn pack retired)"],
  ]) {
    if (fs.existsSync(path.join(focssRoot, relativePath))) errors.push(message);
  }

  const documentIndex = siteImports.findIndex(isDocument);
  const baseIndex = siteImports.findIndex((specifier) => specifier === "../base/index.css");
  if (documentIndex < 0 || baseIndex < 0 || documentIndex >= baseIndex) {
    errors.push("site/entry.css: document.css must come before ../base/index.css");
  }
  if (!siteImports.includes("./components/index.css")) errors.push("site/entry.css must import ./components/index.css");
  if (fs.existsSync(path.join(focssRoot, "site/index.css"))) errors.push("site/index.css must be removed — use site/entry.css only");
  if (fs.existsSync(path.join(focssRoot, "site/base"))) errors.push("site/base/ must be removed — sheets live under site/");

  return { ok: errors.length === 0, errors: [...new Set(errors)].sort() };
}

function resolveModuleImport(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;
  const direct = path.normalize(path.join(path.dirname(fromFile), specifier));
  if (fs.existsSync(direct)) return direct;
  if (fs.existsSync(`${direct}.css`)) return `${direct}.css`;
  return null;
}

export function verifyFocssModuleImports(root = scriptRoot) {
  const focssRoot = path.join(root, "site", "focss");
  if (!fs.existsSync(focssRoot)) {
    return { ok: false, errors: ["site/focss/ is missing"], cycles: [], moduleCount: 0, importEdgeCount: 0, graphHash: crypto.createHash("sha256").update("").digest("hex"), modulesWithImports: [] };
  }

  const modules = walkCss(focssRoot).filter((file) => file.endsWith(".module.css"));
  if (modules.length === 0) {
    return { ok: true, skipped: true, reason: "No *.module.css under site/focss — CSS-module graph is not applicable", errors: [], cycles: [], moduleCount: 0, importEdgeCount: 0, graphHash: crypto.createHash("sha256").update("").digest("hex"), modulesWithImports: [] };
  }

  const graph = new Map();
  const errors = [];
  for (const file of modules) {
    const key = relativeKey(focssRoot, file);
    const imports = [];
    for (const specifier of importList(fs.readFileSync(file, "utf8"))) {
      const resolved = resolveModuleImport(file, specifier);
      if (!resolved) {
        errors.push(`${key}: cannot resolve ${specifier}`);
        continue;
      }
      if (!resolved.endsWith(".module.css")) {
        errors.push(`${key}: @import ${specifier} must target another .module.css`);
        continue;
      }
      imports.push(relativeKey(focssRoot, resolved));
    }
    graph.set(key, imports.sort());
  }

  const cycles = findCycles(graph);
  const hashLines = [...graph.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([file, imports]) => `${file}=>${imports.join(",")}`);
  const graphHash = crypto.createHash("sha256").update(hashLines.join("\n")).digest("hex");
  const modulesWithImports = hashLines.filter((line) => line.split("=>")[1]).map((line) => line.split("=>")[0]);
  const importEdgeCount = [...graph.values()].reduce((total, imports) => total + imports.length, 0);

  return { ok: errors.length === 0 && cycles.length === 0, errors: [...new Set(errors)].sort(), cycles, moduleCount: modules.length, importEdgeCount, graphHash, modulesWithImports };
}

function parseCli(argv) {
  const scopes = new Set();
  let root;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--scope" || argument === "--root") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
      if (argument === "--scope") scopes.add(value);
      else root = value;
      index += 1;
      continue;
    }
    if (argument.startsWith("--scope=")) {
      scopes.add(argument.slice("--scope=".length));
      continue;
    }
    if (argument.startsWith("--root=")) {
      root = argument.slice("--root=".length);
      continue;
    }
    throw new Error(`unknown argument: ${argument}`);
  }

  for (const scope of scopes) {
    if (scope !== "all" && !scopeNames.has(scope)) {
      throw new Error(`unknown FOCSS scope: ${scope}`);
    }
  }
  const selectedScopes = scopes.size === 0 || scopes.has("all") ? [...scopeNames] : [...scopes];
  return { root, scopes: selectedScopes.sort() };
}

function resolveRoot(argumentRoot) {
  const configuredRoot = argumentRoot ?? process.env.FOCSS_ROOT ?? process.env.FOCSS_STRUCTURE_ROOT ?? process.env.FOCSS_IMPORT_ROOT;
  return configuredRoot ? path.resolve(configuredRoot) : scriptRoot;
}

export function runFocssVerification(root = scriptRoot, scopes = [...scopeNames]) {
  const checks = {};
  const runners = {
    structure: verifyFocssStructure,
    imports: verifyFocssImports,
    fences: verifyFocssFences,
    modules: verifyFocssModuleImports,
  };
  for (const scope of scopes) checks[scope] = runners[scope](root);
  const failures = Object.entries(checks)
    .flatMap(([scope, result]) => result.errors.map((error) => ({ scope, error })).concat(result.cycles?.map((cycle) => ({ scope, error: `FOCSS import cycle: ${cycle}` })) ?? []));
  return { ok: failures.length === 0, root, scopes, checks, failures };
}

function isDirectRun() {
  return process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
}

if (isDirectRun()) {
  try {
    const options = parseCli(process.argv.slice(2));
    const report = runFocssVerification(resolveRoot(options.root), options.scopes);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(`verify-focss: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
