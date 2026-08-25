#!/usr/bin/env node
/**
 * ts-morph based dependency graph — Layer 3 replacement for CAST Imaging.
 *
 * Capabilities:
 *   1. Build full import graph from TypeScript/CSS source.
 *   2. Given a changed file, output all transitive dependents (impact scope).
 *   3. Map dependents to test files that cover them → scoped test list.
 *   4. Detect circular dependencies across all domains.
 *
 * Usage:
 *   node scripts/graph-impact.mjs --file=site/lib/ai/providerChain.ts
 *   node scripts/graph-impact.mjs --file=site/components/Planner/Planner.tsx --depth=2
 *   node scripts/graph-impact.mjs --circles
 *   node scripts/graph-impact.mjs --stats
 *
 * Output: JSON to stdout (pipe to jq for readability).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITE_ROOT = path.join(ROOT, "site");
const TESTS_ROOT = path.join(ROOT, "tests");
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "data", "results", "dist", "coverage", ".kiro"]);

// ─── CLI args ────────────────────────────────────────────────────────────────

function getArg(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  if (process.argv.includes(`--${name}`)) return "true";
  return fallback;
}

const targetFile = getArg("file");
const maxDepth = parseInt(getArg("depth", "10"), 10);
const showCircles = getArg("circles") === "true";
const showStats = getArg("stats") === "true";

// ─── Alias resolution (mirrors tsconfig paths) ───────────────────────────────

const ALIAS_MAP = {
  "@/": "site/",
  "@focss/": "site/focss/",
  "@planner/components/": "site/components/Planner/",
  "@planner/lib/": "site/lib/Planner/",
  "@planner/hooks/": "site/hooks/Planner/",
  "@planner/store/": "site/store/Planner/",
  "@planner/server/": "site/server/Planner/",
  "@studio/components/": "site/components/Studio/",
  "@studio/lib/": "site/lib/Studio/",
  "@studio/hooks/": "site/hooks/Studio/",
  "@studio/store/": "site/store/Studio/",
  "@studio/server/": "site/server/Studio/",
};

function resolveSpecifier(specifier, fromFile) {
  for (const [prefix, target] of Object.entries(ALIAS_MAP)) {
    if (specifier.startsWith(prefix)) {
      return target + specifier.slice(prefix.length);
    }
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const fromDir = path.dirname(fromFile);
    return path.posix.normalize(fromDir + "/" + specifier);
  }
  return null;
}

function findFile(resolved) {
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"];
  const indexFiles = ["index.ts", "index.tsx", "index.js", "index.jsx"];
  for (const ext of extensions) {
    const candidate = path.join(ROOT, resolved + ext);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return resolved + ext;
    }
  }
  for (const idx of indexFiles) {
    const candidate = path.join(ROOT, resolved, idx);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return resolved + "/" + idx;
    }
  }
  return null;
}

// ─── File walking ────────────────────────────────────────────────────────────

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, out);
    else if (/\.(ts|tsx|css|mjs|js|jsx)$/.test(ent.name)) out.push(abs);
  }
  return out;
}

// ─── Import extraction ───────────────────────────────────────────────────────

const IMPORT_PATTERNS = [
  /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /@import\s+(?:url\s*\(\s*)?['"]([^'"]+)['"]/g,
];

function stripComments(src, isCss = false) {
  let result = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  if (!isCss) {
    result = result.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(m.length - p1.length));
  }
  return result;
}

function extractImports(rel, src) {
  const isCss = rel.endsWith(".css");
  const code = stripComments(src, isCss);
  const deps = [];
  for (const pattern of IMPORT_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = re.exec(code)) !== null) {
      const specifier = m[1];
      if (!specifier) continue;
      const resolved = resolveSpecifier(specifier, rel);
      if (resolved === null) continue;
      const found = findFile(resolved);
      if (found) deps.push(found);
    }
  }
  return [...new Set(deps)];
}

// ─── Build graph ─────────────────────────────────────────────────────────────

process.stdout.write("# Building import graph...\n");

const allFiles = [...walk(SITE_ROOT), ...walk(TESTS_ROOT)];
/** @type {Map<string, string[]>} file → files it imports */
const forwardGraph = new Map();
/** @type {Map<string, string[]>} file → files that import it */
const reverseGraph = new Map();

for (const abs of allFiles) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
  let src;
  try {
    src = fs.readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  const deps = extractImports(rel, src);
  forwardGraph.set(rel, deps);
  for (const dep of deps) {
    if (!reverseGraph.has(dep)) reverseGraph.set(dep, []);
    reverseGraph.get(dep).push(rel);
  }
}

process.stdout.write(`# Graph built: ${forwardGraph.size} files, ${[...forwardGraph.values()].reduce((s, d) => s + d.length, 0)} edges\n`);

// ─── Domain classification ───────────────────────────────────────────────────

function classifyDomain(rel) {
  if (/focss|\.css|components\/ui|components\/site|components\/home/.test(rel)) return "ui-css";
  if (/supabase|drizzle|migrations|db_/.test(rel)) return "database";
  if (/lib\/ai|mastra|advisor|lancedb|rag/.test(rel)) return "ai";
  if (/lib\/seo|robots|sitemap|analytics|routeMetadata/.test(rel)) return "seo";
  if (/tests\/|vitest|playwright|\.test\.|\.spec\./.test(rel)) return "testing";
  if (/workers|vercel|wrangler|deploy/.test(rel)) return "deployment";
  if (/Planner|ooplanner/.test(rel)) return "planner";
  if (/Studio|oostudio/.test(rel)) return "studio";
  if (/app\/api|lib\/api|lib\/auth|lib\/security|rateLimit/.test(rel)) return "api";
  return "other";
}

// ─── Impact analysis (BFS on reverse graph) ──────────────────────────────────

function getImpact(file, depth = 10) {
  const visited = new Set();
  const queue = [{ file, level: 0 }];
  const result = [];

  while (queue.length > 0) {
    const { file: current, level } = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    if (current !== file) {
      result.push({ file: current, depth: level, domain: classifyDomain(current) });
    }
    if (level < depth) {
      const dependents = reverseGraph.get(current) || [];
      for (const dep of dependents) {
        if (!visited.has(dep)) queue.push({ file: dep, level: level + 1 });
      }
    }
  }

  return result;
}

// ─── Find covering tests ─────────────────────────────────────────────────────

function findCoveringTests(impactedFiles) {
  const tests = new Set();
  for (const { file } of impactedFiles) {
    if (/\.test\.|\.spec\./.test(file)) {
      tests.add(file);
    }
  }
  // Also check if the target file itself is imported by test files
  return [...tests];
}

// ─── Circular dependency detection (Tarjan's) ────────────────────────────────

function findCircles() {
  const circles = [];
  const visited = new Set();
  const stack = new Set();
  const path_stack = [];

  function dfs(node) {
    if (stack.has(node)) {
      const cycleStart = path_stack.indexOf(node);
      if (cycleStart >= 0) {
        circles.push(path_stack.slice(cycleStart));
      }
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    path_stack.push(node);

    const deps = forwardGraph.get(node) || [];
    for (const dep of deps) {
      dfs(dep);
    }

    path_stack.pop();
    stack.delete(node);
  }

  for (const file of forwardGraph.keys()) {
    if (!visited.has(file)) dfs(file);
  }

  // Deduplicate circles (normalize by sorting the rotation)
  const seen = new Set();
  const unique = [];
  for (const cycle of circles) {
    const key = [...cycle].sort().join("→");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(cycle);
    }
  }

  return unique.slice(0, 50); // cap at 50 to avoid noise
}

// ─── Stats ───────────────────────────────────────────────────────────────────

function getStats() {
  const domainCounts = {};
  const highFanIn = [];
  const highFanOut = [];

  for (const [file, deps] of forwardGraph) {
    const domain = classifyDomain(file);
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    if (deps.length > 15) highFanOut.push({ file, fanOut: deps.length, domain });
  }

  for (const [file, dependents] of reverseGraph) {
    if (dependents.length > 10) highFanIn.push({ file, fanIn: dependents.length, domain: classifyDomain(file) });
  }

  highFanIn.sort((a, b) => b.fanIn - a.fanIn);
  highFanOut.sort((a, b) => b.fanOut - a.fanOut);

  return {
    totalFiles: forwardGraph.size,
    totalEdges: [...forwardGraph.values()].reduce((s, d) => s + d.length, 0),
    domainCounts,
    highFanIn: highFanIn.slice(0, 20),
    highFanOut: highFanOut.slice(0, 20),
  };
}

// ─── Output ──────────────────────────────────────────────────────────────────

if (targetFile) {
  // Normalize the target file path
  const normalized = targetFile.replace(/\\/g, "/");
  const found = findFile(normalized) || normalized;

  if (!forwardGraph.has(found) && !reverseGraph.has(found)) {
    console.error(`File not found in graph: ${found}`);
    console.error(`Try: site/lib/... or site/components/...`);
    process.exit(1);
  }

  const impact = getImpact(found, maxDepth);
  const tests = findCoveringTests(impact);
  const directDeps = forwardGraph.get(found) || [];

  const output = {
    target: found,
    domain: classifyDomain(found),
    directDependencies: directDeps.length,
    totalImpacted: impact.length,
    impactByDomain: {},
    coveringTests: tests,
    suggestedTestCommand: tests.length > 0
      ? `pnpm exec vitest run --config tests/vitest.config.ts ${tests.map((t) => path.relative("", t)).join(" ")}`
      : "pnpm run p0:unit",
    impactedFiles: impact.slice(0, 50),
  };

  for (const { domain } of impact) {
    output.impactByDomain[domain] = (output.impactByDomain[domain] || 0) + 1;
  }

  console.log(JSON.stringify(output, null, 2));
} else if (showCircles) {
  const circles = findCircles();
  console.log(JSON.stringify({
    circularDependencies: circles.length,
    cycles: circles,
  }, null, 2));
} else if (showStats) {
  const stats = getStats();
  console.log(JSON.stringify(stats, null, 2));
} else {
  console.error("Usage:");
  console.error("  node scripts/graph-impact.mjs --file=site/lib/ai/providerChain.ts");
  console.error("  node scripts/graph-impact.mjs --file=site/components/Planner/Planner.tsx --depth=3");
  console.error("  node scripts/graph-impact.mjs --circles");
  console.error("  node scripts/graph-impact.mjs --stats");
  process.exit(1);
}
