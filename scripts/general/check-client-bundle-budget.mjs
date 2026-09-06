import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STATIC_ROOT = path.join(ROOT, "site", ".next", "static");
const CONFIG_PATH = path.join(ROOT, "config", "quality", "client-bundle-budget.json");

function walkJavaScriptFiles(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walkJavaScriptFiles(fullPath, files);
    else if (entry.isFile() && /\.(?:js|mjs)$/i.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function measure() {
  const files = walkJavaScriptFiles(STATIC_ROOT);
  if (files.length === 0) {
    throw new Error(
      "No client JavaScript build output found at site/.next/static. Run an authorized site production build before checking bundle budgets.",
    );
  }
  const sizes = files.map((filePath) => fs.statSync(filePath).size);
  return {
    totalJavaScriptBytes: sizes.reduce((total, size) => total + size, 0),
    largestJavaScriptChunkBytes: Math.max(...sizes),
    javaScriptFileCount: sizes.length,
  };
}

function validateBudget(config, measurement) {
  if (config.schema !== "oando.client-bundle-budget.v1") {
    throw new Error(`Unexpected bundle budget schema in ${CONFIG_PATH}`);
  }
  const limits = config.limits;
  if (!limits || typeof limits !== "object") {
    throw new Error(`Missing limits in ${CONFIG_PATH}`);
  }
  const checks = [
    ["totalJavaScriptBytes", measurement.totalJavaScriptBytes],
    ["largestJavaScriptChunkBytes", measurement.largestJavaScriptChunkBytes],
    ["javaScriptFileCount", measurement.javaScriptFileCount],
  ];
  const failures = checks
    .filter(([name, observed]) => !Number.isFinite(limits[name]) || observed > limits[name])
    .map(([name, observed]) => `${name}: observed ${observed}, limit ${limits[name] ?? "missing"}`);
  if (failures.length > 0) {
    throw new Error(`Client bundle budget exceeded:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`);
  }
}

function main() {
  const measurement = measure();
  if (process.argv.includes("--print-baseline")) {
    process.stdout.write(`${JSON.stringify(measurement, null, 2)}\n`);
    return;
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Missing ${CONFIG_PATH}; establish an approved build baseline before enforcing budgets.`);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  validateBudget(config, measurement);
  console.log(
    `[bundle-budget] PASS — ${measurement.totalJavaScriptBytes} total bytes, ${measurement.largestJavaScriptChunkBytes} largest chunk, ${measurement.javaScriptFileCount} JavaScript files.`,
  );
}

try {
  main();
} catch (error) {
  console.error(`[bundle-budget] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
