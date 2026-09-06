import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const POLICY_PATH = path.join(ROOT, "config", "quality", "dependency-audit-policy.json");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "dist",
  "build",
  "results",
  "generated-documents",
]);

const MANIFESTS = [
  {
    id: "root",
    manifestPath: path.join(ROOT, "package.json"),
    sourcePaths: ["site", "scripts", "tests", "config", "newrelic.cjs"],
  },
  {
    id: "tech-docs-generator",
    manifestPath: path.join(ROOT, "tech-docs-generator", "package.json"),
    sourcePaths: ["tech-docs-generator"],
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walkFiles(startPath, files = []) {
  if (!fs.existsSync(startPath)) return files;
  const stat = fs.statSync(startPath);
  if (stat.isFile()) {
    if (SOURCE_EXTENSIONS.has(path.extname(startPath))) files.push(startPath);
    return files;
  }
  for (const entry of fs.readdirSync(startPath, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const fullPath = path.join(startPath, entry.name);
    if (entry.isDirectory()) walkFiles(fullPath, files);
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentionsPackage(content, packageName) {
  const escaped = escapeRegExp(packageName);
  return new RegExp(
    `(?:^|[^A-Za-z0-9@._/-])${escaped}(?:$|[\\s/\\"'])`,
    "m",
  ).test(content);
}

function packageNames(manifest) {
  return Object.keys({
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
    ...(manifest.optionalDependencies ?? {}),
  });
}

function normalizedAllowlist(policy, id) {
  const entries = policy.allowUnreferenced?.[id] ?? {};
  if (!entries || Array.isArray(entries) || typeof entries !== "object") {
    throw new Error(`Expected allowUnreferenced.${id} to be an object in ${POLICY_PATH}`);
  }
  return entries;
}

function normalizedDeferredRemovals(policy, id) {
  const entries = policy.deferredRemoval?.[id] ?? {};
  if (!entries || Array.isArray(entries) || typeof entries !== "object") {
    throw new Error(`Expected deferredRemoval.${id} to be an object in ${POLICY_PATH}`);
  }
  return entries;
}

function collectSource(manifestSpec) {
  const files = manifestSpec.sourcePaths.flatMap((relativePath) =>
    walkFiles(path.join(ROOT, relativePath)),
  );
  return files.map((filePath) => ({
    path: path.relative(ROOT, filePath).replaceAll("\\", "/"),
    content: fs.readFileSync(filePath, "utf8"),
  }));
}

function checkManifest(manifestSpec, policy) {
  const manifest = readJson(manifestSpec.manifestPath);
  const sourceFiles = collectSource(manifestSpec);
  const scripts = Object.values(manifest.scripts ?? {}).join("\n");
  const allowlisted = normalizedAllowlist(policy, manifestSpec.id);
  const deferredRemovals = normalizedDeferredRemovals(policy, manifestSpec.id);
  const candidates = [];
  const deferred = [];

  for (const packageName of packageNames(manifest).sort()) {
    const foundInScript = mentionsPackage(scripts, packageName);
    const firstSourceUse = sourceFiles.find(({ content }) =>
      mentionsPackage(content, packageName),
    );
    if (foundInScript || firstSourceUse || allowlisted[packageName]) continue;
    if (deferredRemovals[packageName]) {
      deferred.push(packageName);
      continue;
    }
    candidates.push(packageName);
  }

  return {
    id: manifestSpec.id,
    scannedFiles: sourceFiles.length,
    candidates,
    deferred,
  };
}

function main() {
  const policy = readJson(POLICY_PATH);
  if (policy.schema !== "oando.dependency-audit-policy.v1") {
    throw new Error(`Unexpected dependency audit policy schema in ${POLICY_PATH}`);
  }

  const results = MANIFESTS.map((manifestSpec) => checkManifest(manifestSpec, policy));
  const candidates = results.flatMap(({ id, candidates: names }) =>
    names.map((packageName) => `${id}: ${packageName}`),
  );
  const deferred = results.flatMap(({ id, deferred: names }) =>
    names.map((packageName) => `${id}: ${packageName}`),
  );

  for (const result of results) {
    console.log(
      `[deps:unused] ${result.id}: scanned ${result.scannedFiles} source files; ${result.candidates.length} unreviewed candidate(s), ${result.deferred.length} deferred removal candidate(s)`,
    );
  }
  if (candidates.length === 0) {
    console.log("[deps:unused] PASS — every declared dependency has source/script evidence, an explicit policy reason, or an owner-deferred removal record.");
    if (deferred.length > 0) {
      console.warn("[deps:unused] Deferred removal candidates:");
      for (const candidate of deferred) console.warn(`  - ${candidate}`);
    }
    return;
  }

  console.error("[deps:unused] Unreviewed dependency candidates:");
  for (const candidate of candidates) console.error(`  - ${candidate}`);
  console.error(
    `[deps:unused] Verify each candidate, then either remove it in a named change or record a specific reason in ${path.relative(ROOT, POLICY_PATH).replaceAll("\\", "/")}.`,
  );
  process.exitCode = 1;
}

main();
