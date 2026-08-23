#!/usr/bin/env node
/**
 * Fail when Phase 4 i18n consumer routes still import marketing copy from routeCopy.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..", "site");
const manifestFile = path.join(
  siteRoot,
  "i18n",
  "marketing-parity-manifest.json",
);

export const ROUTE_COPY_IMPORT_RE =
  /from\s+["']@\/lib\/site-data\/routeCopy["']/;
export const I18N_IMPORT_RE =
  /from\s+["']next-intl(?:\/server)?["']|getTranslations|useTranslations/;

export function loadManifest(filePath = manifestFile) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing manifest: ${filePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Failed to parse manifest at ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * @param {{
 *   siteRoot?: string;
 *   consumerPaths?: string[];
 *   readFile?: (absPath: string) => string;
 *   exists?: (absPath: string) => boolean;
 * }} [options]
 */
export function auditMarketingCopySource({
  siteRoot: root = siteRoot,
  consumerPaths,
  readFile = (absPath) => fs.readFileSync(absPath, "utf8"),
  exists = (absPath) => fs.existsSync(absPath),
} = {}) {
  const paths = consumerPaths ?? loadManifest().i18nConsumerPaths ?? [];
  const failures = [];

  for (const relPath of paths) {
    const abs = path.join(root, relPath.replaceAll("/", path.sep));
    if (!exists(abs)) {
      failures.push({ file: relPath, issue: "missing consumer file" });
      continue;
    }

    const source = readFile(abs);
    if (ROUTE_COPY_IMPORT_RE.test(source)) {
      failures.push({ file: relPath, issue: "imports routeCopy.ts" });
    }
    if (!I18N_IMPORT_RE.test(source)) {
      failures.push({
        file: relPath,
        issue: "missing getTranslations/useTranslations",
      });
    }
  }

  return { failures, consumerPaths: paths };
}

export function runCheck({ siteRoot: root = siteRoot } = {}) {
  const { failures, consumerPaths } = auditMarketingCopySource({
    siteRoot: root,
  });
  return {
    ok: failures.length === 0,
    failures,
    consumerPaths,
  };
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
  const { ok, failures, consumerPaths } = runCheck();
  if (!ok) {
    process.stderr.write(
      `check-marketing-copy-source: ${failures.length} issue(s)\n`,
    );
    for (const failure of failures) {
      process.stderr.write(`  ${failure.file} — ${failure.issue}\n`);
    }
    process.exit(1);
  }

  process.stdout.write(
    `check-marketing-copy-source: ok (${consumerPaths.length} consumer file(s))\n`,
  );
}
