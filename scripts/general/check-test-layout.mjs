#!/usr/bin/env node
/**
 * Enforce source-mirrored tests while supporting explicit, expiring migration debt.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = process.env.MONOREPO_ROOT
  ? path.resolve(process.env.MONOREPO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const testsRoot = path.join(repoRoot, "tests");
const manifestPath = path.join(testsRoot, "manifests", "source-test-ownership.json");
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/i;
const SOURCE_ROOTS = [
  "site/app",
  "site/components",
  "site/features",
  "site/focss",
  "site/hooks",
  "site/i18n",
  "site/lib",
  "site/platform",
  "site/server",
  "site/store",
  "scripts",
  "config",
  "workers",
  "tech-docs-generator/src",
  "tech-docs-generator/scripts",
];
const DEFAULT_MANIFEST = {
  standaloneTestRoots: [],
  sourceRoots: SOURCE_ROOTS.map((sourceRoot) => ({ sourceRoot, testRoot: sourceRoot })),
  e2eRouteRoots: [
    "tests/e2e/site/app/(site)",
    "tests/e2e/site/app/admin",
    "tests/e2e/site/app/ooplanner",
    "tests/e2e/site/app/oostudio",
    "tests/e2e/tech-docs-generator",
  ],
  supportRoot: "tests/support",
  migrationAllowlist: [],
};
const SKIP_DIRS = new Set(["node_modules", ".kiro", ".next", ".git", "archive", "_archive", "dist", "coverage", "results"]);

function posix(value) {
  return value.replaceAll("\\", "/");
}

function readManifest() {
  if (!fs.existsSync(manifestPath)) return DEFAULT_MANIFEST;
  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return { ...DEFAULT_MANIFEST, ...parsed };
}

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else files.push(absolute);
  }
  return files;
}

function canonicalTestPrefixes(manifest) {
  const prefixes = [];
  for (const kind of ["unit", "integration"]) {
    for (const rule of manifest.sourceRoots ?? []) {
      prefixes.push(`tests/${kind}/${rule.testRoot}/`);
    }
  }
  return prefixes;
}

function matchesStandaloneTestRoot(relative, pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", "[^/]+");
  return new RegExp(`^${escaped}/`).test(relative);
}

function canonicalStandaloneLocation(relative, manifest) {
  return (manifest.standaloneTestRoots ?? []).some((root) =>
    matchesStandaloneTestRoot(relative, root),
  );
}

function migrationEntry(relative, manifest) {
  return (manifest.migrationAllowlist ?? []).find((entry) => relative.startsWith(entry.prefix));
}

function testStem(fileName) {
  return fileName.replace(/(?:\.(?:smoke|integration))?\.(?:test|spec)\.[cm]?[jt]sx?$/i, "");
}

function canonicalLocation(relative, manifest) {
  for (const kind of ["unit", "integration"]) {
    for (const rule of manifest.sourceRoots ?? []) {
      const prefix = `tests/${kind}/${rule.testRoot}/`;
      if (!relative.startsWith(prefix)) continue;
      if (rule.sourceRoot !== "scripts") return true;

      const stem = testStem(path.posix.basename(relative));
      const sourceMatches = walk(path.join(repoRoot, rule.sourceRoot)).filter((absolute) => {
        const sourceName = path.basename(absolute).replace(/\.[^.]+$/, "");
        return sourceName === stem && !TEST_FILE.test(path.basename(absolute));
      });
      if (sourceMatches.length !== 1) return true;

      const expectedDirectory = posix(
        path.join(
          `tests/${kind}/${rule.testRoot}`,
          path.relative(path.join(repoRoot, rule.sourceRoot), path.dirname(sourceMatches[0])),
        ),
      ).replace(/\/$/, "");
      return path.posix.dirname(relative) === expectedDirectory;
    }
  }
  return false;
}

function validateMigrationEntry(entry, relative) {
  const missing = ["owner", "reason", "expires", "replacementRoot"].filter((field) => !String(entry[field] ?? "").trim());
  if (missing.length > 0) return `${relative} migration entry missing ${missing.join(", ")}`;
  if (Number.isNaN(Date.parse(entry.expires))) return `${relative} migration entry has invalid expiry ${entry.expires}`;
  if (Date.parse(entry.expires) < Date.now()) return `${relative} migration entry expired ${entry.expires}`;
  return null;
}

function suggestedPath(relative, source) {
  const kind = relative.startsWith("tests/integration/") ? "integration" : "unit";
  const file = path.posix.basename(relative);
  const alias = source.match(/from\s+["']@(planner|studio)\/(components|lib|hooks|store|server)(?:\/[^"']*)?["']/i);
  if (alias) {
    const fork = alias[1].toLowerCase() === "planner" ? "Planner" : "Studio";
    return `tests/${kind}/site/${alias[2]}/${fork}/${file}`;
  }
  const direct = relative.match(/^tests\/(unit|integration)\/(app|components|features|hooks|i18n|lib|platform|server|store)\/(.+)$/);
  if (direct) return `tests/${direct[1]}/site/${direct[2]}/${direct[3]}`;
  return null;
}

const manifest = readManifest();
const violations = [];
const migrationWarnings = [];

for (const root of SOURCE_ROOTS) {
  for (const absolute of walk(path.join(repoRoot, root))) {
    if (TEST_FILE.test(path.basename(absolute))) {
      violations.push(`co-located test: ${posix(path.relative(repoRoot, absolute))}`);
    }
  }
}

const canonicalPrefixes = canonicalTestPrefixes(manifest);
const e2eRoots = manifest.e2eRouteRoots ?? [];
const scanRoots = [testsRoot];
for (const scanRoot of scanRoots) {
  for (const absolute of walk(scanRoot)) {
    const relative = posix(path.relative(repoRoot, absolute));
    const source = /\.[cm]?[jt]sx?$/.test(absolute) ? fs.readFileSync(absolute, "utf8") : "";

    if (relative.includes("/Planner/") && /@studio\//i.test(source)) {
      violations.push(`fork boundary: ${relative} imports Studio from a Planner test`);
    }
    if (relative.includes("/Studio/") && /@planner\//i.test(source)) {
      violations.push(`fork boundary: ${relative} imports Planner from a Studio test`);
    }

    const isExecutable = TEST_FILE.test(path.basename(absolute));
    if (!isExecutable) continue;
    const canonical =
      canonicalStandaloneLocation(relative, manifest) ||
      (canonicalPrefixes.some((prefix) => relative.startsWith(prefix)) && canonicalLocation(relative, manifest)) ||
      e2eRoots.some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`));
    if (canonical) continue;

    const migration = migrationEntry(relative, manifest);
    if (migration) {
      const invalid = validateMigrationEntry(migration, relative);
      if (invalid) violations.push(invalid);
      else {
        const suggestion = suggestedPath(relative, source) ?? `${migration.replacementRoot}${path.posix.basename(relative)}`;
        migrationWarnings.push(`${relative} -> ${suggestion}`);
      }
      continue;
    }
    violations.push(`non-canonical test: ${relative}`);
  }
}

if (violations.length > 0) {
  process.stderr.write(`check-test-layout: ${violations.length} violation(s)\n`);
  for (const violation of violations.sort()) process.stderr.write(`  - ${violation}\n`);
  process.exit(1);
}

process.stdout.write(`test layout OK — canonical paths enforced; migration debt=${migrationWarnings.length}\n`);
for (const warning of migrationWarnings.sort()) process.stdout.write(`  MIGRATE ${warning}\n`);
