#!/usr/bin/env node
/** Grep for raw disk writes outside mode-aware wrappers — plan 03 module 2. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outPath = path.join(root, "results", "data", "persistence-sweep.txt");

const patterns = [
  "writeFileSync",
  "fs.writeFile",
  "fs.promises.writeFile",
  "appendFileSync",
];

const allowPaths = [
  "site/platform/shared/data/",
  "scripts/",
  "tests/",
  "node_modules/",
  "results/",
  ".next/",
];

const hits = [];
for (const pattern of patterns) {
  let rg = "";
  try {
    rg = execSync(`rg -n "${pattern}" site --glob '!**/.next/**'`, {
      cwd: root,
      encoding: "utf8",
    });
  } catch (e) {
    rg = e.stdout ?? "";
  }
  for (const line of rg.split("\n").filter(Boolean)) {
    if (allowPaths.some((p) => line.includes(p))) continue;
    if (line.includes("mode-aware") || line.includes("persistence")) continue;
    hits.push(line);
  }
}

const body = [
  "# Persistence sweep",
  `generatedAt: ${new Date().toISOString()}`,
  "",
  "Mode-aware wrappers: writeFurnitureItem, writeProjectRecord, writeCatalogEntry, publishFurnitureToCatalog",
  "",
  `Suspicious raw-write lines (review): ${hits.length}`,
  ...hits.slice(0, 200),
].join("\n");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, body + "\n", "utf8");
console.log(`Wrote ${outPath} (${hits.length} lines flagged)`);
