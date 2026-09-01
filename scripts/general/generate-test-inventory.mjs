/** Generate a non-overlapping test, support, and migration inventory. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT } from "../lib/repoRoot.mjs";

const TESTS_DIR = path.join(REPO_ROOT, "tests");
const CANONICAL_TEST_ROOTS = ["tests"];
const RESULTS_DIR = path.join(REPO_ROOT, "results");
const INVENTORY_JSON = path.join(RESULTS_DIR, "test-inventory.json");
const MIGRATION_JSON = path.join(RESULTS_DIR, "test-migration-map.json");
const INVENTORY_MD = path.join(TESTS_DIR, "INVENTORY.md");
const OWNERSHIP_PATH = path.join(TESTS_DIR, "manifests", "source-test-ownership.json");

function posix(value) {
  return value.replaceAll("\\", "/");
}

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else files.push(absolute);
  }
  return files;
}

export function classifyTestInventoryPath(relative) {
  const base = path.posix.basename(relative);
  if (/\.spec\.(?:ts|tsx|js|mjs)$/.test(base)) return { kind: "playwright", runner: "playwright" };
  if (/\.test\.(?:ts|tsx|js|mjs)$/.test(base)) return { kind: "vitest", runner: "vitest" };
  if (relative.includes("-snapshots/") || /\.(?:png|webp)$/.test(base)) return { kind: "snapshot", runner: "support" };
  if (relative.includes("/fixtures/") || relative.startsWith("tests/fixtures/") || relative.startsWith("tests/support/fixtures/")) {
    return { kind: "fixture", runner: "support" };
  }
  if (/^(?:setup|globalSetup|globalTeardown)\.[cm]?[jt]s$/.test(base) || /\.(?:setup|helper)\.[cm]?[jt]sx?$/.test(base)) {
    return { kind: "helper", runner: "support" };
  }
  if (/\.[cm]?[jt]sx?$/.test(base)) return { kind: "helper", runner: "support" };
  return { kind: "asset", runner: "support" };
}

export function collectTestInventoryFiles(repoRoot = REPO_ROOT) {
  const testRoot = path.join(repoRoot, "tests");

  return walk(testRoot)
    .map((absolute) => {
      const relative = posix(path.relative(repoRoot, absolute));
      const classification = classifyTestInventoryPath(relative);
      return { name: path.posix.basename(relative), path: relative, ...classification };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function loadMigrationPairs() {
  if (!fs.existsSync(OWNERSHIP_PATH)) return [];
  const manifest = JSON.parse(fs.readFileSync(OWNERSHIP_PATH, "utf8"));
  return (manifest.migrationAllowlist ?? []).map((entry) => ({
    from: entry.prefix,
    to: entry.replacementRoot,
    owner: entry.owner,
    reason: entry.reason,
    expires: entry.expires,
  }));
}

function countsFor(files) {
  const counts = { total: files.length, vitest: 0, playwright: 0, helpers: 0, fixtures: 0, snapshots: 0, assets: 0 };
  for (const file of files) {
    if (file.kind === "vitest") counts.vitest += 1;
    else if (file.kind === "playwright") counts.playwright += 1;
    else if (file.kind === "helper") counts.helpers += 1;
    else if (file.kind === "fixture") counts.fixtures += 1;
    else if (file.kind === "snapshot") counts.snapshots += 1;
    else counts.assets += 1;
  }
  return counts;
}

function writeMarkdown(generatedAt, counts, files) {
  const labels = ["vitest", "playwright", "helper", "fixture", "snapshot", "asset"];
  const lines = [
    "# Test inventory",
    "",
    "Generated executable-test and support-file inventory. Layout rules: `tests/CONTENTS.md`.",
    "",
    `*Updated: ${generatedAt.slice(0, 10)} — regenerate through the repository docs workflow.*`,
    "",
    "## Counts",
    "",
    "| Kind | Count |",
    "|---|---:|",
    `| Vitest executable files | ${counts.vitest} |`,
    `| Playwright executable specs | ${counts.playwright} |`,
    `| Helpers | ${counts.helpers} |`,
    `| Fixtures | ${counts.fixtures} |`,
    `| Snapshots | ${counts.snapshots} |`,
    `| Other assets | ${counts.assets} |`,
    `| **Total files** | **${counts.total}** |`,
    "",
  ];
  for (const label of labels) {
    const category = files.filter((file) => file.kind === label);
    if (category.length === 0) continue;
    lines.push(`## ${label}`, "");
    for (const file of category.slice(0, 200)) lines.push(`- \`${file.path}\``);
    if (category.length > 200) lines.push(`- … +${category.length - 200} more`);
    lines.push("");
  }

  while (lines.at(-1) === "") lines.pop();
  fs.writeFileSync(INVENTORY_MD, `${lines.join("\n")}\n`, "utf8");
}

export function generateTestInventory() {
  const files = collectTestInventoryFiles();
  const counts = countsFor(files);
  const generatedAt = new Date().toISOString();
  const migrationPairs = loadMigrationPairs();

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(INVENTORY_JSON, `${JSON.stringify({ version: 2, generatedAt, source: "tests/", sources: CANONICAL_TEST_ROOTS, counts, files }, null, 2)}\n`, "utf8");
  fs.writeFileSync(MIGRATION_JSON, `${JSON.stringify({ version: 2, generatedAt, description: "Hybrid migration to source-root-preserving test paths", pairs: migrationPairs }, null, 2)}\n`, "utf8");
  writeMarkdown(generatedAt, counts, files);

  console.log(`[generate-test-inventory] total=${counts.total} vitest=${counts.vitest} playwright=${counts.playwright} support=${counts.helpers + counts.fixtures + counts.snapshots + counts.assets}`);
  return { counts, files, migrationPairs };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateTestInventory();
}
