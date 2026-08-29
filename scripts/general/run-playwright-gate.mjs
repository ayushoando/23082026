#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(repositoryRoot, "config", "build", "playwright-gate-specs.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const specs = Array.isArray(manifest.specs) ? manifest.specs : [];

if (specs.length === 0) {
  throw new Error("playwright-gate-specs.json must contain at least one spec");
}
for (const spec of specs) {
  if (!fs.existsSync(path.join(repositoryRoot, spec))) {
    throw new Error(`Playwright gate spec does not exist: ${spec}`);
  }
}

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(
  pnpm,
  [
    "exec",
    "playwright",
    "test",
    "-c",
    "config/build/playwright.config.ts",
    ...specs,
    ...process.argv.slice(2),
  ],
  { cwd: repositoryRoot, stdio: "inherit", env: process.env },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
