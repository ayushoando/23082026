#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..", "site");

const SKIP_VALUE =
  /^(https?:\/\/\S*|\/\S*|mailto:\S*|\+?\d[\d\s-]{8,}|[^@\s]+@[^@\s]+\.[^@\s]+)$/;

export function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function collectLeaves(value, prefix = "", out = []) {
  if (typeof value === "string") {
    if (
      !SKIP_VALUE.test(value.trim()) &&
      !/^[\d+.,\s%-]+$/.test(value.trim())
    ) {
      out.push({ path: prefix, value });
    }
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectLeaves(item, `${prefix}[${index}]`, out),
    );
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectLeaves(child, prefix ? `${prefix}.${key}` : key, out);
    }
  }
  return out;
}

export function setByPath(root, pathExpr, value) {
  const tokens = [];
  const re = /([^.[\]]+)|\[(\d+)\]/g;
  let match = re.exec(pathExpr);
  while (match) {
    tokens.push(match[1] !== undefined ? match[1] : Number(match[2]));
    match = re.exec(pathExpr);
  }
  let cursor = root;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i];
    if (
      token === "__proto__" ||
      token === "constructor" ||
      token === "prototype"
    ) {
      return;
    }
    const next = tokens[i + 1];
    if (cursor[token] === undefined) {
      cursor[token] = typeof next === "number" ? [] : {};
    }
    cursor = cursor[token];
  }
  const last = tokens.at(-1);
  if (last !== "__proto__" && last !== "constructor" && last !== "prototype") {
    cursor[last] = value;
  }
}

export function exportPendingTranslations({
  siteRoot: root = siteRoot,
  write = true,
} = {}) {
  const messages = path.join(root, "i18n", "messages");
  const outputDirectory = path.join(root, "i18n", "pending-translations");
  const manifest = readJson(
    path.join(root, "i18n", "marketing-parity-manifest.json"),
  );

  if (write) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  const en = readJson(path.join(messages, "en.json"));
  const results = [];

  for (const locale of manifest.deferredLocales) {
    const localeMessages = readJson(path.join(messages, `${locale}.json`));
    const pending = {};
    for (const namespace of manifest.allMarketingNamespaces) {
      const enLeaves = collectLeaves(en[namespace], namespace);
      const localeLeaves = Object.fromEntries(
        collectLeaves(localeMessages[namespace], namespace).map((item) => [
          item.path,
          item.value,
        ]),
      );
      for (const leaf of enLeaves) {
        if (localeLeaves[leaf.path] === leaf.value) {
          pending[leaf.path] = leaf.value;
        }
      }
    }
    if (write) {
      fs.writeFileSync(
        path.join(outputDirectory, `${locale}.pending.json`),
        `${JSON.stringify(pending, null, 2)}\n`,
        "utf8",
      );
    }
    results.push({ locale, count: Object.keys(pending).length, pending });
  }
  return results;
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  const results = exportPendingTranslations();
  for (const item of results) {
    process.stdout.write(`${item.locale}: ${item.count} pending strings\n`);
  }
}
