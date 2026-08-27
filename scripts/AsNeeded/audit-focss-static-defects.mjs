#!/usr/bin/env node
/**
 * Read-only static audit for the live site/focss tree.
 *
 * This is intentionally a conservative source audit, not a CSS parser or a
 * browser audit. It cannot prove computed styles, cascade outcomes, generated
 * CSS, or runtime imports. Custom-property resolution is lexical across the
 * FOCSS tree; a fallback is recognized only when var() contains a top-level
 * comma. Selector ownership uses normalized, brace-delimited selectors and
 * reports exact selector namespaces repeated in different files. Relative CSS
 * imports are followed; package imports are treated as external. Comments are
 * ignored while line breaks are retained for stable source locations.
 *
 * The command is read-only. It does not create reports, modify source files,
 * or update baselines. Use --json for deterministic machine-readable output;
 * the human-readable summary is written to stderr in JSON mode.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(
  process.env.FOCSS_STATIC_AUDIT_ROOT ?? scriptDirectory,
  process.env.FOCSS_STATIC_AUDIT_ROOT ? "." : "../..",
);
const focssRoot = path.join(repoRoot, "site", "focss");

const ENTRY_ROOTS = [
  "base/root.css",
  "site/entry.css",
  "admin/entry.css",
  "planner/entry.css",
  "studio/entry.css",
];
const ORPHAN_EXCEPTIONS = new Set([
  "base/root.css",
  "admin/components/design-kit.css",
]);
const RESET_PROPERTIES = [
  "animation-delay",
  "animation-duration",
  "animation-iteration-count",
  "background-attachment",
  "scroll-behavior",
  "transition-duration",
  "transition-delay",
];
const importPattern = /@import\s+(?:url\(\s*)?(?:"([^"]+)"|'([^']+)'|([^\s;)]+))\s*\)?/g;

function normalizeKey(file, root = focssRoot) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function lineAt(text, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (text[cursor] === "\n") line += 1;
  }
  return line;
}

function stripComments(text) {
  let output = "";
  let inComment = false;

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    const next = text[index + 1];

    if (!inComment && current === "/" && next === "*") {
      inComment = true;
      output += "  ";
      index += 1;
      continue;
    }
    if (inComment && current === "*" && next === "/") {
      inComment = false;
      output += "  ";
      index += 1;
      continue;
    }
    output += inComment && current !== "\n" && current !== "\r" ? " " : current;
  }

  return output;
}

function walkCss(directory, files = []) {
  const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkCss(file, files);
    } else if (entry.isFile() && entry.name.endsWith(".css")) {
      files.push(file);
    }
  }
  return files;
}

function readImports(css) {
  const imports = [];
  importPattern.lastIndex = 0;
  let match;
  while ((match = importPattern.exec(css)) !== null) {
    imports.push({
      specifier: match[1] ?? match[2] ?? match[3],
      index: match.index,
    });
  }
  return imports;
}

function resolveRelativeImport(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;
  const direct = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [direct, `${direct}.css`, path.join(direct, "index.css")];
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // An unresolved import is outside this audit's requested finding set.
    }
  }
  return null;
}

function parseImportGraph(cssFiles, sourceByKey, root = focssRoot) {
  const graph = new Map();
  for (const file of cssFiles) {
    const key = normalizeKey(file, root);
    const dependencies = [];
    for (const { specifier } of readImports(sourceByKey.get(key).clean)) {
      const resolved = resolveRelativeImport(file, specifier);
      if (!resolved) continue;
      const dependency = normalizeKey(resolved, root);
      if (!dependency.startsWith("..")) dependencies.push(dependency);
    }
    graph.set(key, [...new Set(dependencies)].sort((a, b) => a.localeCompare(b)));
  }
  return graph;
}

function reachabilityByEntry(graph) {
  const byEntry = new Map();
  for (const entry of ENTRY_ROOTS) {
    if (!graph.has(entry)) continue;
    const reachable = new Set();
    const queue = [entry];
    while (queue.length > 0) {
      const current = queue.shift();
      if (reachable.has(current)) continue;
      reachable.add(current);
      for (const dependency of graph.get(current) ?? []) {
        if (!reachable.has(dependency)) queue.push(dependency);
      }
    }
    byEntry.set(entry, reachable);
  }
  return byEntry;
}

function reachableFiles(graph) {
  const reachable = new Set();
  for (const files of reachabilityByEntry(graph).values()) {
    for (const file of files) reachable.add(file);
  }
  return reachable;
}

function scanCustomProperties(sourceByKey) {
  const declarations = new Set();
  const references = [];

  for (const [file, source] of sourceByKey) {
    const declarationPattern = /(?:^|[{};])\s*(--[A-Za-z_][A-Za-z0-9_-]*)\s*:/gm;
    let declarationMatch;
    while ((declarationMatch = declarationPattern.exec(source.clean)) !== null) {
      declarations.add(declarationMatch[1]);
    }

    const varPattern = /\bvar\s*\(/g;
    let varMatch;
    while ((varMatch = varPattern.exec(source.clean)) !== null) {
      const openIndex = source.clean.indexOf("(", varMatch.index);
      const endIndex = findClosingParen(source.clean, openIndex);
      if (endIndex === -1) continue;

      const contents = source.clean.slice(openIndex + 1, endIndex);
      const nameMatch = contents.match(/^\s*(--[A-Za-z_][A-Za-z0-9_-]*)/);
      if (!nameMatch) continue;
      const nameEnd = nameMatch[0].length;
      references.push({
        file,
        line: lineAt(source.clean, varMatch.index),
        property: nameMatch[1],
        fallback: hasTopLevelComma(contents.slice(nameEnd)),
      });
    }
  }

  const findings = references
    .filter((reference) => !reference.fallback && !declarations.has(reference.property))
    .map((reference) => ({
      file: reference.file,
      line: reference.line,
      property: reference.property,
      reason: "no declaration or fallback",
    }))
    .sort(compareFinding);

  return { declarations, findings };
}

function findClosingParen(text, openIndex) {
  let depth = 0;
  let quote = null;
  for (let index = openIndex; index < text.length; index += 1) {
    const current = text[index];
    if (quote) {
      if (current === "\\") index += 1;
      else if (current === quote) quote = null;
      continue;
    }
    if (current === '"' || current === "'") {
      quote = current;
    } else if (current === "(") {
      depth += 1;
    } else if (current === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function hasTopLevelComma(text) {
  let depth = 0;
  let quote = null;
  for (const current of text) {
    if (quote) {
      if (current === quote) quote = null;
      continue;
    }
    if (current === '"' || current === "'") {
      quote = current;
    } else if (current === "(" || current === "[" || current === "{") {
      depth += 1;
    } else if (current === ")" || current === "]" || current === "}") {
      depth = Math.max(0, depth - 1);
    } else if (current === "," && depth === 0) {
      return true;
    }
  }
  return false;
}

function parseBlocks(clean) {
  const blocks = [];
  const stack = [];
  let segmentStart = 0;
  let quote = null;
  let parenthesisDepth = 0;
  let bracketDepth = 0;

  for (let index = 0; index < clean.length; index += 1) {
    const current = clean[index];
    if (quote) {
      if (current === "\\") index += 1;
      else if (current === quote) quote = null;
      continue;
    }
    if (current === '"' || current === "'") {
      quote = current;
    } else if (current === "(") {
      parenthesisDepth += 1;
    } else if (current === ")") {
      parenthesisDepth = Math.max(0, parenthesisDepth - 1);
    } else if (current === "[") {
      bracketDepth += 1;
    } else if (current === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
    } else if (parenthesisDepth === 0 && bracketDepth === 0 && current === ";") {
      segmentStart = index + 1;
    } else if (parenthesisDepth === 0 && bracketDepth === 0 && current === "{") {
      const block = {
        prelude: clean.slice(segmentStart, index).trim(),
        open: index,
        close: clean.length,
        parent: stack.at(-1) ?? null,
      };
      blocks.push(block);
      stack.push(block);
      segmentStart = index + 1;
    } else if (parenthesisDepth === 0 && bracketDepth === 0 && current === "}") {
      const block = stack.pop();
      if (block) block.close = index;
      segmentStart = index + 1;
    }
  }

  return blocks;
}

function splitSelectors(prelude) {
  const selectors = [];
  let start = 0;
  let parenthesisDepth = 0;
  let bracketDepth = 0;
  let quote = null;

  for (let index = 0; index < prelude.length; index += 1) {
    const current = prelude[index];
    if (quote) {
      if (current === "\\") index += 1;
      else if (current === quote) quote = null;
      continue;
    }
    if (current === '"' || current === "'") quote = current;
    else if (current === "(") parenthesisDepth += 1;
    else if (current === ")") parenthesisDepth = Math.max(0, parenthesisDepth - 1);
    else if (current === "[") bracketDepth += 1;
    else if (current === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    else if (current === "," && parenthesisDepth === 0 && bracketDepth === 0) {
      selectors.push(prelude.slice(start, index));
      start = index + 1;
    }
  }
  selectors.push(prelude.slice(start));
  return selectors;
}

function normalizeSelector(selector) {
  return selector.replace(/\s+/g, " ").trim();
}

function isKeyframeBlock(block) {
  let current = block.parent;
  while (current) {
    if (/^@(?:-webkit-)?keyframes\b/i.test(current.prelude)) return true;
    current = current.parent;
  }
  return false;
}

function scanDuplicateSelectors(sourceByKey, graph) {
  const ownership = new Map();
  const scopes = reachabilityByEntry(graph);
  const entriesByFile = new Map();
  for (const [entry, files] of scopes) {
    for (const file of files) {
      if (!entriesByFile.has(file)) entriesByFile.set(file, new Set());
      entriesByFile.get(file).add(entry);
    }
  }

  for (const [file, source] of sourceByKey) {
    const seenInFile = new Set();
    for (const block of parseBlocks(source.clean)) {
      if (!block.prelude || block.prelude.startsWith("@") || isKeyframeBlock(block)) continue;
      for (const rawSelector of splitSelectors(block.prelude)) {
        const selector = normalizeSelector(rawSelector);
        if (!selector || seenInFile.has(selector)) continue;
        seenInFile.add(selector);
        if (!ownership.has(selector)) ownership.set(selector, new Map());
        ownership.get(selector).set(file, {
          file,
          line: lineAt(source.clean, block.open),
          entries: [...(entriesByFile.get(file) ?? [])].sort((a, b) => a.localeCompare(b)),
        });
      }
    }
  }

  return [...ownership.entries()]
    .map(([namespace, files]) => {
      const occurrences = [...files.values()];
      const commonEntries = ENTRY_ROOTS.filter((entry) =>
        occurrences.every((occurrence) => occurrence.entries.includes(entry)),
      );
      if (commonEntries.length === 0 || occurrences.length < 2) return null;
      return {
        namespace,
        entries: commonEntries,
        files: occurrences.map(({ file, line }) => ({ file, line })).sort(compareFinding),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.namespace.localeCompare(b.namespace));
}

function scanReducedMotion(sourceByKey) {
  const findings = [];
  for (const [file, source] of sourceByKey) {
    if (file === "base/animations.css") continue;
    for (const block of parseBlocks(source.clean)) {
      if (!isReducedMotionMedia(block)) continue;
      for (const child of parseBlocksInBlock(block, source.clean)) {
        if (!hasUniversalSelector(child.prelude) || !hasResetProperty(source.clean.slice(child.open + 1, child.close))) continue;
        findings.push({
          file,
          line: lineAt(source.clean, child.open),
          selector: normalizeSelector(child.prelude),
          reason: "universal reduced-motion reset is outside base/animations.css",
        });
      }
    }
  }
  return uniqueFindings(findings).sort(compareFinding);
}

function parseBlocksInBlock(block, clean) {
  return parseBlocks(clean.slice(block.open + 1, block.close)).filter((child) => {
    return child.prelude && !child.prelude.startsWith("@") && child.open + block.open + 1 < block.close;
  }).map((child) => ({
    ...child,
    open: child.open + block.open + 1,
    close: child.close + block.open + 1,
  }));
}

function isReducedMotionMedia(block) {
  return /^@media\b/i.test(block.prelude) && /prefers-reduced-motion\s*:\s*reduce/i.test(block.prelude);
}

function hasUniversalSelector(prelude) {
  return splitSelectors(prelude).some((selector) => /(^|[\s>+~,(])\*(?=\s*(?:[.:#\[>+~]|$))/.test(selector));
}

function hasResetProperty(body) {
  return RESET_PROPERTIES.some((property) => new RegExp(`(?:^|[;{}])\\s*${property}\\s*:`, "m").test(body));
}

function compareFinding(a, b) {
  return (a.file ?? "").localeCompare(b.file ?? "") ||
    (a.line ?? 0) - (b.line ?? 0) ||
    (a.property ?? a.namespace ?? a.selector ?? "").localeCompare(b.property ?? b.namespace ?? b.selector ?? "");
}

function uniqueFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = JSON.stringify(finding);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function humanSummary(report) {
  const total = Object.values(report.counts).reduce((sum, count) => sum + count, 0);
  if (report.ok) {
    return `audit-focss-static-defects: ok (${report.scope.cssFileCount} stylesheets, 0 findings)`;
  }

  const lines = [
    `audit-focss-static-defects: failed (${total} finding${total === 1 ? "" : "s"})`,
  ];
  for (const [category, count] of Object.entries(report.counts)) {
    if (count > 0) lines.push(`  - ${category}: ${count}`);
  }
  for (const [category, findings] of Object.entries(report.findings)) {
    for (const finding of findings) {
      if (category === "duplicateSelectorNamespaces") {
        lines.push(`    ${category}: ${finding.namespace} (${finding.files.map((item) => `${item.file}:${item.line}`).join(", ")})`);
      } else {
        const location = Number.isInteger(finding.line) ? `${finding.file}:${finding.line}` : finding.file;
        lines.push(`    ${category}: ${location}`);
      }
    }
  }
  return lines.join("\n");
}

export function auditFocssStaticDefects(root = repoRoot) {
  const auditFocssRoot = path.join(root, "site", "focss");
  if (!fs.existsSync(auditFocssRoot) || !fs.statSync(auditFocssRoot).isDirectory()) {
    throw new Error("site/focss/ is missing");
  }

  const files = walkCss(auditFocssRoot);
  const sources = new Map();
  for (const file of files) {
    const key = path.relative(auditFocssRoot, file).replaceAll("\\", "/");
    const raw = fs.readFileSync(file, "utf8");
    sources.set(key, { raw, clean: stripComments(raw) });
  }

  const graph = parseImportGraph(files, sources, auditFocssRoot);
  const reachable = reachableFiles(graph);
  const customProperties = scanCustomProperties(sources);
  const duplicateSelectorNamespaces = scanDuplicateSelectors(sources, graph);
  const reducedMotionResetsOutsideBase = scanReducedMotion(sources);
  const orphanStylesheets = files
    .map((file) => path.relative(auditFocssRoot, file).replaceAll("\\", "/"))
    .filter((file) => !reachable.has(file) && !ORPHAN_EXCEPTIONS.has(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({ file, reason: "not reachable from a FOCSS entry" }));

  const findings = {
    undefinedCustomProperties: customProperties.findings,
    duplicateSelectorNamespaces,
    reducedMotionResetsOutsideBase,
    orphanStylesheets,
  };
  const counts = Object.fromEntries(Object.entries(findings).map(([key, value]) => [key, value.length]));

  return {
    schemaVersion: 1,
    ok: Object.values(counts).every((count) => count === 0),
    scope: {
      cssRoot: "site/focss",
      cssFileCount: files.length,
      entries: ENTRY_ROOTS,
      orphanExceptions: [...ORPHAN_EXCEPTIONS].sort((a, b) => a.localeCompare(b)),
      reachableFileCount: reachable.size,
    },
    counts,
    findings,
  };
}

function errorReport(message) {
  return {
    schemaVersion: 1,
    ok: false,
    error: message,
    counts: {},
    findings: {},
  };
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  const jsonMode = process.argv.includes("--json");
  try {
    const report = auditFocssStaticDefects();
    if (jsonMode) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.stderr.write(`${humanSummary(report)}\n`);
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    const report = errorReport(error instanceof Error ? error.message : String(error));
    if (jsonMode) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.stderr.write(`audit-focss-static-defects: error\n  - ${report.error}\n`);
    process.exitCode = 2;
  }
}
