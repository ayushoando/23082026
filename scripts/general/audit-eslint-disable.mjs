#!/usr/bin/env node
/**
 * Fail on eslint-disable comments under product source + tests/scripts.
 * Scans site product trees (not monorepo-root app/ which does not exist).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = process.env.MONOREPO_ROOT
  ? path.resolve(process.env.MONOREPO_ROOT)
  : path.resolve(__dirname, "../..");

/** Relative to monorepo root — product lives under site/. */
const SCAN_DIRS = [
  "site/app",
  "site/components",
  "site/features",
  "site/hooks",
  "site/lib",
  "tests",
  "scripts",
  "config/build",
];
const SCAN_SKIP_FILES = new Set(["scripts/general/audit-eslint-disable.mjs"]);
const ALLOWED_SUPPRESSIONS = new Map([
  ["site/hooks/Studio/useStudioFabric.ts", [/react-hooks\/exhaustive-deps/]],
  ["site/hooks/Planner/usePlannerFabric.ts", [/react-hooks\/exhaustive-deps/]],
  ["site/hooks/Studio/useStudioKeyboardShortcuts.ts", [/react-hooks\/exhaustive-deps/]],
  ["site/hooks/Planner/usePlannerKeyboardShortcuts.ts", [/react-hooks\/exhaustive-deps/]],
  ["site/hooks/Planner/usePlannerSessionWarning.ts", [/react-hooks\/exhaustive-deps/]],
]);
/** Real disable directives only — not the substring in script names / prose. */
const DISABLE_RE = /(?:\/\/|\/\*)\s*eslint-disable(?:-next-line|-line)?\b/;

function walk(dir, files = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return files;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (/\.[cm]?[jt]sx?$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function hasOnlyAllowedSuppressions(rel, source) {
  const allowed = ALLOWED_SUPPRESSIONS.get(rel);
  if (!allowed) return false;
  const lines = source.split(/\r?\n/).filter((line) => DISABLE_RE.test(line));
  return lines.length > 0 && lines.every((line) => allowed.some((re) => re.test(line)));
}

const failures = [];

for (const dir of SCAN_DIRS) {
  const root = path.join(monorepoRoot, dir);
  for (const file of walk(root)) {
    const rel = path.relative(monorepoRoot, file).replaceAll("\\", "/");
    if (SCAN_SKIP_FILES.has(rel)) continue;
    const source = readFileSync(file, "utf8");
    if (DISABLE_RE.test(source) && !hasOnlyAllowedSuppressions(rel, source)) {
      failures.push(rel);
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`audit-eslint-disable: ${failures.length} file(s)\n`);
  for (const f of failures) {
    process.stderr.write(`  ${f}\n`);
  }
  process.exit(1);
}

process.stdout.write("audit-eslint-disable: ok\n");
