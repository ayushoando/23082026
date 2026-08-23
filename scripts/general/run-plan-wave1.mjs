#!/usr/bin/env node
/**
 * Wave-1 plan execution — automated evidence for plans 01, 03, 05, 06, 07 (partial).
 * Writes JSON status under results/plan-execution/status.json
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const resultsRoot = path.join(root, "results");

function run(cmd, opts = {}) {
  try {
    const out = execSync(cmd, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...opts,
    });
    return { ok: true, output: out };
  } catch (e) {
    const err = e;
    return {
      ok: false,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
      code: err.status ?? 1,
    };
  }
}

function ensureDir(rel) {
  fs.mkdirSync(path.join(resultsRoot, rel), { recursive: true });
}

function writeText(rel, text) {
  ensureDir(path.dirname(rel));
  fs.writeFileSync(path.join(resultsRoot, rel), text, "utf8");
}

const steps = [];

function step(name, fn) {
  const result = fn();
  steps.push({ name, ...result });
  return result;
}

step("check:layout", () => {
  const r = run("pnpm run check:layout");
  writeText("plan-execution/check-layout.txt", r.output);
  return { ok: r.ok, evidence: "results/plan-execution/check-layout.txt" };
});

step("gate:fast", () => {
  const r = run("pnpm run gate:fast");
  writeText("foundation/gate-green.txt", r.output);
  return { ok: r.ok, evidence: "results/foundation/gate-green.txt" };
});

step("api-inventory", () => {
  const r = run("node scripts/general/generate-api-inventory.mjs");
  return { ok: r.ok, evidence: "results/data/api-inventory.txt", output: r.output };
});

step("persistence-sweep", () => {
  const r = run("node scripts/general/generate-persistence-sweep.mjs");
  return { ok: r.ok, evidence: "results/data/persistence-sweep.txt", output: r.output };
});

step("false-green-audit", () => {
  const r = run("node scripts/general/audit-hollow-tests.mjs");
  writeText("quality/false-green-hollow.txt", r.output);
  const r2 = run("node scripts/general/audit-gate-skips.mjs");
  writeText("quality/false-green-skips.txt", r2.output);
  return {
    ok: r.ok && r2.ok,
    evidence: "results/quality/false-green-hollow.txt",
  };
});

step("focss-structure", () => {
  const r = run("node scripts/AsNeeded/verify-focss-structure.mjs");
  writeText("frontend/focss-graph.txt", r.output);
  return { ok: r.ok, evidence: "results/frontend/focss-graph.txt" };
});

step("redirect-map", () => {
  const r = run("node scripts/general/generate-redirect-map.mjs");
  return { ok: r.ok, evidence: "results/seo/redirect-map.txt" };
});

step("pseo-sku-matrix", () => {
  const r = run("node scripts/general/generate-pseo-sku-matrix.mjs");
  return { ok: r.ok, evidence: "results/seo/pseo-sku-matrix.csv" };
});

const status = {
  generatedAt: new Date().toISOString(),
  wave: "W1-automated",
  steps,
  allOk: steps.every((s) => s.ok),
};

ensureDir("plan-execution");
fs.writeFileSync(
  path.join(resultsRoot, "plan-execution/status.json"),
  JSON.stringify(status, null, 2) + "\n",
  "utf8",
);

console.log(JSON.stringify(status, null, 2));
process.exit(status.allOk ? 0 : 1);
