#!/usr/bin/env node
/**
 * Merge exported marketing copy into site/i18n/messages/en.json (Phase 4a scaffold).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");
const enFile = path.join(repoRoot, "site", "i18n", "messages", "en.json");
const exportScript = path.join(scriptsDir, "lib", "exportMarketingCopy.ts");

export function mergeMarketingIntoEn(en, marketing) {
  return {
    ...en,
    ...marketing,
    home: {
      ...en?.home,
      ...marketing?.home,
    },
  };
}

export function loadMarketingExport({
  repoRoot: root = repoRoot,
  exportScriptPath = exportScript,
} = {}) {
  const marketingJson = execFileSync(
    process.execPath,
    [
      path.join(root, "node_modules", "tsx", "dist", "cli.mjs"),
      exportScriptPath,
    ],
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    },
  );
  try {
    return JSON.parse(marketingJson);
  } catch (error) {
    throw new Error(
      `Failed to parse marketing JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * @param {{
 *   enPath?: string;
 *   marketing?: Record<string, unknown>;
 *   write?: boolean;
 *   repoRoot?: string;
 * }} [options]
 */
export function syncMarketingI18nMessages({
  enPath = enFile,
  marketing = undefined,
  write = true,
  repoRoot: root = repoRoot,
} = {}) {
  const payload = marketing ?? loadMarketingExport({ repoRoot: root });
  let en;
  try {
    en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Failed to read English messages from ${enPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const merged = mergeMarketingIntoEn(en, payload);
  if (write) {
    fs.writeFileSync(enPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  }
  return { merged, marketingKeys: Object.keys(payload) };
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
  const { marketingKeys } = syncMarketingI18nMessages();
  process.stdout.write(
    `Updated ${path.relative(repoRoot, enFile)} with ${marketingKeys.length} marketing namespaces\n`,
  );
}
