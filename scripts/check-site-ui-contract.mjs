#!/usr/bin/env node
/**
 * Site UI contract checker.
 *
 * Consolidates the marketing shell, marketing-copy, and inline-style checks
 * while retaining independent policy scopes through `--scope`.
 *
 *   node scripts/check-site-ui-contract.mjs
 *   node scripts/check-site-ui-contract.mjs --scope shell
 *   node scripts/check-site-ui-contract.mjs --scope copy --scope inline-style
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectPageSources,
  deriveSiteRoutePath,
  findSitePagePath,
  walkSitePageFiles,
} from "./lib/siteUiRouteSources.mjs";
import { REPO_ROOT, SITE_PACKAGE_ROOT } from "./lib/repoRoot.mjs";

const SUPPORTED_SCOPES = new Set(["shell", "copy", "inline-style"]);
const DEFAULT_MANIFEST_FILE = path.join(
  SITE_PACKAGE_ROOT,
  "i18n",
  "marketing-parity-manifest.json",
);
const DEFAULT_MATRIX_FILE = path.join(
  REPO_ROOT,
  "results",
  "site-ui",
  "route-matrix.csv",
);

const ROUTE_COPY_IMPORT_RE =
  /from\s+["']@\/(?:lib\/site-data|features\/site\/data)\/routeCopy["']/;
const I18N_CONSUMER_RE =
  /import\s+(?:type\s+)?[\s\S]*?from\s+["']next-intl(?:\/server)?["']|\b(?:getTranslations|useTranslations)\s*\(/;
const STYLE_ATTR_RE = /\bstyle\s*=\s*\{\s*\{/;
const SHELL_LAYOUT_RE = /<(HomeMarketingLayout|HomeCatalogLayout)\b/;
const LEGACY_SCHEME_WRAPPER_RE =
  /className="[^"]*scheme-page[^"]*flex min-h-screen flex-col items-center/;

const EXEMPT_DIALECTS = new Set([
  "redirect",
  "offline",
  "workspace",
  "feature-delegated",
]);
const WORKSPACE_PATHS = new Set([
  "/access",
  "/choose-product",
  "/dashboard",
  "/login",
  "/portal",
]);
const INLINE_STYLE_ALLOWLIST = new Set([
  "app/(site)/opengraph-image.tsx",
  "app/(site)/twitter-image.tsx",
  "app/(site)/products/[category]/[product]/ProductViewer.tsx",
  "components/home/HomeTrustStrip.tsx",
]);
const INLINE_STYLE_ROOTS = [
  "app/(site)",
  "components/home",
  "components/contact",
  "components/career",
  "components/support",
];

/**
 * @param {string} filePath
 * @returns {Record<string, unknown>}
 */
export function loadManifest(filePath = DEFAULT_MANIFEST_FILE) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing marketing parity manifest: ${filePath}`);
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
      throw new Error("expected an object");
    }
    return manifest;
  } catch (error) {
    throw new Error(
      `Failed to parse marketing parity manifest at ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * @param {string} routePath
 */
function isWorkspacePath(routePath) {
  if (WORKSPACE_PATHS.has(routePath)) return true;
  return [...WORKSPACE_PATHS].some(
    (prefix) => routePath.startsWith(`${prefix}/`) || routePath === prefix,
  );
}

/**
 * @param {string} text
 * @returns {Record<string, string>[]}
 */
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    throw new Error("route matrix must contain a header and at least one route");
  }

  const parseLine = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (inQuotes) {
        if (character === '"' && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else if (character === '"') {
          inQuotes = false;
        } else {
          current += character;
        }
      } else if (character === '"') {
        inQuotes = true;
      } else if (character === ",") {
        values.push(current);
        current = "";
      } else {
        current += character;
      }
    }

    if (inQuotes) throw new Error("route matrix has an unclosed quoted field");
    values.push(current);
    return values;
  };

  const headers = parseLine(lines[0]);
  for (const required of ["path", "layout_root", "dialect"]) {
    if (!headers.includes(required)) {
      throw new Error(`route matrix is missing required column: ${required}`);
    }
  }

  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });
}

/**
 * @param {string} directory
 * @param {string[]} files
 */
function walkJsxFiles(directory, files) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkJsxFiles(absolutePath, files);
    } else if (/\.(?:jsx|tsx)$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }
}

/**
 * @param {{
 *   siteRoot?: string;
 *   consumerPaths?: string[];
 *   manifestFile?: string;
 *   readFile?: (absolutePath: string) => string;
 *   exists?: (absolutePath: string) => boolean;
 * }} [options]
 */
export function auditMarketingCopySource({
  siteRoot = SITE_PACKAGE_ROOT,
  consumerPaths,
  manifestFile = path.join(siteRoot, "i18n", "marketing-parity-manifest.json"),
  readFile = (absolutePath) => fs.readFileSync(absolutePath, "utf8"),
  exists = (absolutePath) => fs.existsSync(absolutePath),
} = {}) {
  const manifest = consumerPaths === undefined ? loadManifest(manifestFile) : null;
  const paths = consumerPaths ?? manifest?.i18nConsumerPaths;

  if (!Array.isArray(paths) || paths.length === 0 || !paths.every((entry) => typeof entry === "string" && entry.length > 0)) {
    return {
      consumerPaths: [],
      failures: [{ file: "marketing-parity-manifest.json", issue: "missing non-empty i18nConsumerPaths" }],
    };
  }

  const failures = [];
  for (const relativePath of paths) {
    const absolutePath = path.join(siteRoot, relativePath.replaceAll("/", path.sep));
    if (!exists(absolutePath)) {
      failures.push({ file: relativePath, issue: "missing consumer file" });
      continue;
    }

    const source = readFile(absolutePath);
    if (ROUTE_COPY_IMPORT_RE.test(source)) {
      failures.push({ file: relativePath, issue: "imports routeCopy" });
    }
    if (!I18N_CONSUMER_RE.test(source)) {
      failures.push({ file: relativePath, issue: "missing next-intl consumer" });
    }
  }

  return { consumerPaths: paths, failures };
}

/**
 * @param {{ siteRoot?: string }} [options]
 */
export function runCopyCheck(options = {}) {
  const result = auditMarketingCopySource(options);
  return { ...result, ok: result.failures.length === 0 };
}

/** Backward-compatible copy-scope programmatic entry point. */
export const runCheck = runCopyCheck;

/**
 * @param {{ siteRoot?: string }} [options]
 */
export function auditMarketingInlineStyle({ siteRoot = SITE_PACKAGE_ROOT } = {}) {
  const failures = [];
  const files = [];
  const primaryRoot = path.join(siteRoot, "app", "(site)");

  if (!fs.existsSync(primaryRoot)) {
    return {
      checkedFiles: 0,
      failures: [{ file: "app/(site)", issue: "missing required marketing route root" }],
    };
  }

  for (const relativeRoot of INLINE_STYLE_ROOTS) {
    walkJsxFiles(path.join(siteRoot, relativeRoot), files);
  }

  if (files.length === 0) {
    return {
      checkedFiles: 0,
      failures: [{ file: "app/(site)", issue: "marketing style scan found no JSX/TSX files" }],
    };
  }

  for (const absolutePath of files.sort((left, right) => left.localeCompare(right))) {
    const relativePath = path.relative(siteRoot, absolutePath).replaceAll("\\", "/");
    const source = fs.readFileSync(absolutePath, "utf8");
    if (STYLE_ATTR_RE.test(source) && !INLINE_STYLE_ALLOWLIST.has(relativePath)) {
      failures.push({ file: relativePath, issue: "inline style attribute" });
    }
  }

  return { checkedFiles: files.length, failures };
}

/**
 * @param {{ siteRoot?: string; matrixFile?: string }} [options]
 */
export function auditSiteShell({
  siteRoot = SITE_PACKAGE_ROOT,
  matrixFile = DEFAULT_MATRIX_FILE,
} = {}) {
  const failures = [];
  const addFailure = (failure) => {
    if (!failures.some((entry) => entry.path === failure.path && entry.issue === failure.issue)) {
      failures.push(failure);
    }
  };

  if (!fs.existsSync(matrixFile)) {
    return {
      checkedRoutes: 0,
      failures: [{ path: "route-matrix.csv", issue: "missing route matrix; run site-ui:matrix" }],
      siteRows: 0,
    };
  }

  let rows;
  try {
    rows = parseCsv(fs.readFileSync(matrixFile, "utf8"));
  } catch (error) {
    return {
      checkedRoutes: 0,
      failures: [{
        path: "route-matrix.csv",
        issue: error instanceof Error ? error.message : String(error),
      }],
      siteRows: 0,
    };
  }

  const appDirectory = path.join(siteRoot, "app");
  const siteRows = rows.filter((row) => row.layout_root === "site");
  let checkedRoutes = 0;

  for (const row of siteRows) {
    if (EXEMPT_DIALECTS.has(row.dialect) || isWorkspacePath(row.path)) continue;
    checkedRoutes += 1;

    const pagePath = findSitePagePath(appDirectory, row.path);
    if (!pagePath) {
      addFailure({ path: row.path, issue: "missing page.tsx for (site) route" });
      continue;
    }

    const source = collectPageSources(siteRoot, pagePath);
    const isRedirectOnly = /\b(?:permanentRedirect|redirect)\s*\(/.test(source);
    if (isRedirectOnly && !SHELL_LAYOUT_RE.test(source)) continue;

    if (row.dialect === "scheme-page") {
      addFailure({ path: row.path, issue: "matrix dialect=scheme-page (migration backlog)" });
    }
    if (LEGACY_SCHEME_WRAPPER_RE.test(source)) {
      addFailure({ path: row.path, issue: "legacy scheme-page outer wrapper" });
    }
    if (!SHELL_LAYOUT_RE.test(source)) {
      addFailure({ path: row.path, issue: "missing HomeMarketingLayout or HomeCatalogLayout" });
    }
  }

  for (const pagePath of walkSitePageFiles(appDirectory)) {
    const routePath = deriveSiteRoutePath(appDirectory, pagePath);
    if (isWorkspacePath(routePath)) continue;
    if (LEGACY_SCHEME_WRAPPER_RE.test(collectPageSources(siteRoot, pagePath))) {
      addFailure({ path: routePath, issue: "legacy scheme-page outer wrapper" });
    }
  }

  return { checkedRoutes, failures, siteRows: siteRows.length };
}

/**
 * @param {string[]} argv
 */
function parseScopes(argv) {
  const scopes = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argument === "--scope" ? argv[++index] : argument?.startsWith("--scope=") ? argument.slice(8) : null;
    if (value === null) throw new Error(`Unknown argument: ${argument}`);
    if (!SUPPORTED_SCOPES.has(value)) throw new Error(`Unknown scope: ${value}`);
    scopes.add(value);
  }
  return scopes.size > 0 ? [...scopes] : [...SUPPORTED_SCOPES];
}

/**
 * @param {string} scope
 */
function runScope(scope) {
  if (scope === "copy") {
    const result = runCopyCheck();
    return {
      ...result,
      scope,
      checked: result.consumerPaths.length,
      label: "consumer file(s)",
      targetKey: "file",
    };
  }
  if (scope === "inline-style") {
    const result = auditMarketingInlineStyle();
    return {
      ...result,
      scope,
      checked: result.checkedFiles,
      label: "JSX/TSX file(s)",
      targetKey: "file",
    };
  }

  const result = auditSiteShell();
  return {
    ...result,
    scope,
    checked: result.checkedRoutes,
    label: `marketing route(s); matrix ${result.siteRows} site row(s)`,
    targetKey: "path",
  };
}

function main() {
  let scopes;
  try {
    scopes = parseScopes(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`check-site-ui-contract: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(2);
  }

  const results = scopes.map(runScope);
  const failed = results.filter((result) => result.failures.length > 0);
  if (failed.length > 0) {
    const count = failed.reduce((total, result) => total + result.failures.length, 0);
    process.stderr.write(`check-site-ui-contract: ${count} issue(s) across ${failed.length} scope(s)\n`);
    for (const result of failed) {
      for (const failure of result.failures) {
        process.stderr.write(`  [${result.scope}] ${failure[result.targetKey]} — ${failure.issue}\n`);
      }
    }
    process.exit(1);
  }

  for (const result of results) {
    process.stdout.write(`check-site-ui-contract: ${result.scope} ok (${result.checked} ${result.label})\n`);
  }
}

function isDirectRun() {
  const entry = process.argv[1];
  return Boolean(entry) && path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  main();
}
