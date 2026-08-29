#!/usr/bin/env node
/**
 * Reject silent skips, focused tests, and line-coverage ignores across every test lane.
 * Temporary exceptions must be explicit, owned, scoped, expiring, and name a replacement.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = process.env.MONOREPO_ROOT
  ? path.resolve(process.env.MONOREPO_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const testsRoot = path.join(repoRoot, "tests");
const testRoots = [
  testsRoot,
  path.join(repoRoot, ".kiro", "kiro-repo-guidance-setup", "tests"),
  path.join(repoRoot, ".kiro", "specs"),
];
const gateConfigPath = path.join(repoRoot, "config", "build", "playwright-gate-specs.json");
const exceptionPath = path.join(testsRoot, "manifests", "skip-exceptions.json");
const TEST_SOURCE = /\.[cm]?[jt]sx?$/i;
const skipRe = /\b(?:test|describe|it)\s*\.\s*(?:skip(?:If)?|fixme)\s*\(/;
const patterns = [
  { id: "contains-skip", re: skipRe, source: "code" },
  { id: "contains-test-info-skip", re: /\btestInfo\s*\.\s*skip\s*\(/, source: "code" },
  { id: "contains-focused-test", re: /\b(?:test|describe|it)\s*\.\s*only\s*\(/, source: "code" },
  { id: "contains-coverage-ignore", re: /(?:istanbul|v8)\s+ignore|coverage\s+ignore/i, source: "raw" },
];

function posix(value) {
  return value.replaceAll("\\", "/");
}

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", "__snapshots__"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else if (TEST_SOURCE.test(entry.name)) files.push(absolute);
  }
  return files;
}

function codeOnly(source) {
  return source.replace(
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/[^\n\r]*|\/\*[\s\S]*?\*\/)/g,
    (match) => match.replace(/[^\n\r]/g, " "),
  );
}

function loadExceptions() {
  if (!fs.existsSync(exceptionPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(exceptionPath, "utf8"));
  return Array.isArray(parsed.exceptions) ? parsed.exceptions : [];
}

function validException(entry) {
  const required = ["file", "rule", "owner", "reason", "expires", "replacementTest"];
  if (required.some((field) => !String(entry[field] ?? "").trim())) return false;
  const expiry = Date.parse(entry.expires);
  return !Number.isNaN(expiry) && expiry >= Date.now();
}

const failures = [];
const exceptions = loadExceptions();
for (const entry of exceptions) {
  if (!validException(entry)) failures.push({ file: entry.file ?? "<unknown>", reason: "invalid-exception" });
}

if (!fs.existsSync(gateConfigPath)) {
  failures.push({ file: posix(path.relative(repoRoot, gateConfigPath)), reason: "missing-file" });
} else {
  const gate = JSON.parse(fs.readFileSync(gateConfigPath, "utf8"));
  for (const spec of gate.specs ?? []) {
    if (!fs.existsSync(path.join(repoRoot, spec))) failures.push({ file: spec, reason: "missing-file" });
  }
}

for (const testRoot of testRoots) {
  for (const absolute of walk(testRoot)) {
    const file = posix(path.relative(repoRoot, absolute));
    const source = fs.readFileSync(absolute, "utf8");
    const sources = { raw: source, code: codeOnly(source) };
    for (const pattern of patterns) {
      if (!pattern.re.test(sources[pattern.source])) continue;
      const exception = exceptions.find((entry) => entry.file === file && entry.rule === pattern.id && validException(entry));
      if (!exception) failures.push({ file, reason: pattern.id });
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`audit-gate-skips: ${failures.length} issue(s)\n`);
  for (const failure of failures) process.stderr.write(`  ${failure.file} — ${failure.reason}\n`);
  process.exit(1);
}

process.stdout.write(`audit-gate-skips: ok (${exceptions.length} reviewed exception(s))\n`);
