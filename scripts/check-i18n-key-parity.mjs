#!/usr/bin/env node
/**
 * Deep key parity between locale message files (Phase 4a/4b).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..", "site");
const messagesDir = path.join(siteRoot, "i18n", "messages");
const manifestFile = path.join(
  siteRoot,
  "i18n",
  "marketing-parity-manifest.json",
);

export function collectKeys(value, prefix = "") {
  const keys = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    if (prefix) keys.push(prefix);
    return keys;
  }
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    keys.push(...collectKeys(child, next));
  }
  return keys;
}

export function subtree(messages, namespace) {
  return namespace.split(".").reduce((node, part) => node?.[part], messages);
}

export function extractPlaceholders(value) {
  if (typeof value !== "string") return [];
  const matches = value.match(/\{[a-zA-Z0-9_]+\}/g) ?? [];
  return [...matches].sort();
}

export function loadLocale(locale, dir = messagesDir) {
  const file = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing locale file: ${file}`);
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(
      `Invalid JSON in locale file ${file}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function auditKeyParity({
  baseLocale = "en",
  baseMessages,
  localeMessages,
  locale,
  namespaces,
}) {
  const failures = [];
  for (const namespace of namespaces) {
    const baseSubtree = subtree(baseMessages, namespace);
    if (!baseSubtree) {
      failures.push({
        namespace,
        locale,
        issue: `missing in ${baseLocale}.json`,
      });
      continue;
    }
    const baseKeys = new Set(collectKeys(baseSubtree, namespace));
    const targetSubtree = subtree(localeMessages, namespace);
    if (!targetSubtree) {
      failures.push({ namespace, locale, issue: "missing namespace" });
      continue;
    }
    const targetKeys = new Set(collectKeys(targetSubtree, namespace));

    for (const key of baseKeys) {
      if (!targetKeys.has(key)) {
        failures.push({ namespace, locale, issue: `missing key ${key}` });
      }
    }
    for (const key of targetKeys) {
      if (!baseKeys.has(key)) {
        failures.push({ namespace, locale, issue: `extra key ${key}` });
      }
    }

    for (const key of baseKeys) {
      if (targetKeys.has(key)) {
        const baseVal = subtree(baseMessages, key);
        const targetVal = subtree(localeMessages, key);
        if (typeof baseVal === "string" && typeof targetVal === "string") {
          const baseP = extractPlaceholders(baseVal);
          const targetP = extractPlaceholders(targetVal);
          if (JSON.stringify(baseP) !== JSON.stringify(targetP)) {
            failures.push({
              namespace,
              locale,
              issue: `placeholder mismatch at ${key}: expected [${baseP.join(", ")}], got [${targetP.join(", ")}]`,
            });
          }
        }
      }
    }
  }
  return failures;
}

export function runCheck({
  manifestPath = manifestFile,
  messagesDirectory = messagesDir,
} = {}) {
  let manifest = {};
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    throw new Error(
      `Invalid JSON in manifest file ${manifestPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const baseLocale = "en";
  const baseMessages = loadLocale(baseLocale, messagesDirectory);
  const allFailures = [];
  const parityLocales =
    manifest.parityLocales ??
    manifest.wave1Locales.filter((l) => l !== baseLocale);

  function namespacesForLocale(locale) {
    if (locale === "hi") return Object.keys(baseMessages);
    if (manifest.deferredLocales?.includes(locale))
      return manifest.allMarketingNamespaces;
    return manifest.wave1Namespaces;
  }

  for (const locale of parityLocales) {
    const localeMessages = loadLocale(locale, messagesDirectory);
    const namespaces = namespacesForLocale(locale);
    const failures = auditKeyParity({
      baseLocale,
      baseMessages,
      localeMessages,
      locale,
      namespaces,
    });
    allFailures.push(...failures);
  }

  if (allFailures.length > 0) {
    process.stderr.write(
      `check-i18n-key-parity: ${allFailures.length} issue(s)\n`,
    );
    for (const failure of allFailures) {
      process.stderr.write(
        `  ${failure.namespace} [${failure.locale ?? baseLocale}] — ${failure.issue}\n`,
      );
    }
    return { ok: false, failures: allFailures, parityLocales };
  }

  process.stdout.write(
    `check-i18n-key-parity: ok (locales ${parityLocales.join(", ")})\n`,
  );
  return { ok: true, failures: [], parityLocales };
}

const isDirectRun =
  Boolean(process.argv?.[1]) &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const result = runCheck();
  if (!result.ok) {
    process.exit(1);
  }
}
