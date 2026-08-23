#!/usr/bin/env node
/** List API routes with auth role hints for plan 03 module 3. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const apiRoot = path.join(root, "site", "app", "api");
const outPath = path.join(root, "results", "data", "api-inventory.txt");

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (ent.name === "route.ts") files.push(full);
  }
  return files;
}

function relApi(file) {
  return path
    .relative(apiRoot, file)
    .replace(/\\/g, "/")
    .replace(/\/route\.ts$/, "");
}

const lines = ["apiPath\tmethods\troleHint\tcsrf\tnotes"];
for (const file of walk(apiRoot).sort()) {
  const src = fs.readFileSync(file, "utf8");
  const apiPath = relApi(file);
  const methods = [
    ...src.matchAll(/\bexport\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g),
    ...src.matchAll(/\bexport\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=/g),
  ].map((m) => m[1]);
  const role = src.match(/role\s*:\s*["'](\w+)["']/)?.[1] ?? (src.includes("requireAdminSession") ? "admin" : src.includes("withAuth") ? "withAuth" : "none");
  const csrf = /requireCsrf\s*:\s*true/.test(src) ? "yes" : "no";
  const notes = src.includes("diskFileUnavailableResponse") ? "disk-mode-guard" : "";
  lines.push(`${apiPath}\t${[...new Set(methods)].join(",") || "?"}\t${role}\t${csrf}\t${notes}`);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${lines.length - 1} routes to ${outPath}`);
