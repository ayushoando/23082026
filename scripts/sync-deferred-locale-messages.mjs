#!/usr/bin/env node
/**
 * Scaffold deferred message files from en.json (Phase 4c).
 * Preserves existing translated values; fills structure from en for new keys only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..", "site");
const messagesDir = path.join(siteRoot, "i18n", "messages");

export function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const manifest = readJson(
  path.join(siteRoot, "i18n", "marketing-parity-manifest.json"),
);
const en = readJson(path.join(messagesDir, "en.json"));

const UNSAFE_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function mergePreserveTranslations(existing, enSource) {
  if (enSource === null || typeof enSource !== "object") {
    return existing !== undefined ? existing : enSource;
  }
  if (Array.isArray(enSource)) {
    if (!Array.isArray(existing) || existing.length !== enSource.length) {
      return structuredClone(enSource);
    }
    return enSource.map((item, index) =>
      mergePreserveTranslations(existing[index], item),
    );
  }

  const out = {};
  for (const [key, enValue] of Object.entries(enSource)) {
    if (UNSAFE_OBJECT_KEYS.has(key)) continue;
    const existingValue = existing?.[key];
    if (enValue !== null && typeof enValue === "object") {
      out[key] = mergePreserveTranslations(existingValue, enValue);
      continue;
    }
    out[key] =
      typeof existingValue === "string" &&
      existingValue.length > 0 &&
      existingValue !== enValue
        ? existingValue
        : enValue;
  }
  return out;
}

export function marketingSubtree(
  messages,
  namespaces = manifest.allMarketingNamespaces,
) {
  const out = {};
  for (const namespace of namespaces) {
    if (messages[namespace])
      out[namespace] = structuredClone(messages[namespace]);
  }
  return out;
}

/**
 * @param {{
 *   messagesDir?: string;
 *   locales?: string[];
 *   enSource?: Record<string, unknown>;
 *   namespaces?: string[];
 *   write?: boolean;
 * }} [options]
 */
export function syncDeferredLocaleMessages({
  messagesDir: dir = messagesDir,
  locales = manifest.deferredLocales,
  enSource = en,
  namespaces = manifest.allMarketingNamespaces,
  write = true,
} = {}) {
  const results = [];
  for (const locale of locales) {
    const file = path.join(dir, `${locale}.json`);
    let existing = {};
    if (fs.existsSync(file)) {
      try {
        existing = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (error) {
        throw new Error(
          `Failed to parse existing locale file ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    const merged = { ...existing };
    const subtree = marketingSubtree(enSource, namespaces);
    for (const [namespace, enSubtree] of Object.entries(subtree)) {
      merged[namespace] = mergePreserveTranslations(
        existing[namespace],
        enSubtree,
      );
    }
    if (write) {
      fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    }
    results.push({ locale, namespaces: Object.keys(subtree).length, merged });
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
  for (const result of syncDeferredLocaleMessages()) {
    process.stdout.write(
      `Updated ${result.locale}.json with ${result.namespaces} marketing namespaces\n`,
    );
  }
}
