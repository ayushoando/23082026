#!/usr/bin/env node
/**
 * Compare site/focss trees. Writes results/focss/compare-18082026-vs-<label>.{csv,txt}
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const liveRoot = path.join(repoRoot, "site/focss");

const refs = [
  { id: "OO31072026", root: "E:/OO31072026/site/focss" },
  { id: "26072026", root: "D:/WebD/26072026/site/focss" },
];

function walkCss(root) {
  const out = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".css")) {
        out.push(path.relative(root, p).split(path.sep).join("/"));
      }
    }
  }
  walk(root);
  return out.sort();
}

function norm(text) {
  return text.replace(/\r\n/g, "\n");
}

function lineCount(text) {
  return norm(text).split("\n").length;
}

function hashFile(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function csvEscape(value) {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function comparePair(label, refRoot) {
  const liveSet = new Set(walkCss(liveRoot));
  const refSet = new Set(walkCss(refRoot));
  const all = [...new Set([...liveSet, ...refSet])].sort();
  const rows = [];
  const stats = {
    onlyLive: 0,
    onlyRef: 0,
    shared: 0,
    identical: 0,
    lineEndOnly: 0,
    contentDiff: 0,
  };

  for (const rel of all) {
    const inLive = liveSet.has(rel);
    const inRef = refSet.has(rel);
    let tag;
    if (inLive && !inRef) {
      tag = "only_live";
      stats.onlyLive++;
    } else if (!inLive && inRef) {
      tag = "only_ref";
      stats.onlyRef++;
    } else {
      stats.shared++;
      const livePath = path.join(liveRoot, rel);
      const refPath = path.join(refRoot, rel);
      const hLive = hashFile(livePath);
      const hRef = hashFile(refPath);
      if (hLive === hRef) {
        tag = "identical";
        stats.identical++;
      } else {
        const tLive = norm(fs.readFileSync(livePath, "utf8"));
        const tRef = norm(fs.readFileSync(refPath, "utf8"));
        if (tLive === tRef) {
          tag = "line_ending_only";
          stats.lineEndOnly++;
        } else {
          tag = "content_diff";
          stats.contentDiff++;
        }
      }
    }

    const liveLines = inLive
      ? lineCount(fs.readFileSync(path.join(liveRoot, rel), "utf8"))
      : "";
    const refLines = inRef
      ? lineCount(fs.readFileSync(path.join(refRoot, rel), "utf8"))
      : "";
    const delta =
      inLive && inRef && liveLines !== "" && refLines !== ""
        ? liveLines - refLines
        : "";

    rows.push({
      path: rel,
      tag,
      live_lines: liveLines,
      ref_lines: refLines,
      delta_live_minus_ref: delta,
    });
  }

  const header = "path,tag,live_lines,ref_lines,delta_live_minus_ref";
  const csv = [
    header,
    ...rows.map((r) =>
      [r.path, r.tag, r.live_lines, r.ref_lines, r.delta_live_minus_ref]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");

  const outDir = path.join(repoRoot, "results/focss");
  fs.mkdirSync(outDir, { recursive: true });
  const outCsv = path.join(outDir, `compare-18082026-vs-${label}.csv`);
  fs.writeFileSync(outCsv, `${csv}\n`, "utf8");

  const top = rows
    .filter((r) => r.tag === "content_diff")
    .map((r) => ({
      ...r,
      abs: Math.abs(Number(r.delta_live_minus_ref) || 0),
    }))
    .sort((a, b) => b.abs - a.abs)
    .slice(0, 25);

  const summary = [
    `compare: ${liveRoot}`,
    `     vs: ${refRoot}`,
    `generated: ${new Date().toISOString()}`,
    `live_css_count: ${liveSet.size}`,
    `ref_css_count: ${refSet.size}`,
    `only_live: ${stats.onlyLive}`,
    `only_ref: ${stats.onlyRef}`,
    `shared_paths: ${stats.shared}`,
    `identical: ${stats.identical}`,
    `line_ending_only: ${stats.lineEndOnly}`,
    `content_diff: ${stats.contentDiff}`,
    "",
    "top_content_diff_by_abs_line_delta:",
    ...top.map(
      (t) =>
        `  ${t.path} live=${t.live_lines} ref=${t.ref_lines} delta=${t.delta_live_minus_ref}`,
    ),
    "",
    `csv: ${outCsv}`,
  ].join("\n");

  const outTxt = path.join(outDir, `compare-18082026-vs-${label}.txt`);
  fs.writeFileSync(outTxt, `${summary}\n`, "utf8");
  return { label, stats, outCsv, outTxt, rows };
}

/** 06c-T1 seed — human sets final tag: restore | keep_growth | hybrid | ignore */
function ownerTaskForPath(rel, compareTag) {
  if (compareTag === "identical") return "done";
  if (compareTag === "line_ending_only") return "06c-W0";
  if (compareTag === "only_live") return "06c-W0";
  if (compareTag === "only_ref") return "06c-W0";
  if (rel.startsWith("site/components/homepage/")) return "06c-T2";
  if (rel.startsWith("site/components/chrome/")) return "06c-T3";
  if (
    rel.startsWith("site/components/products/") ||
    rel.startsWith("site/components/shared/editorial")
  ) {
    return "06c-T4";
  }
  if (rel.startsWith("planner/") || rel.startsWith("studio/")) return "06c-T5";
  if (rel.startsWith("admin/")) return "06c-T6";
  if (rel.startsWith("base/type/")) return "06a-frozen";
  if (rel.startsWith("base/")) return "06c-W0";
  if (
    rel.startsWith("site/components/contact/") ||
    rel.startsWith("site/components/clients/")
  ) {
    return "06c-T4";
  }
  return "06c-W0";
}

function suggestedClassifyTag(rel, compareTag, delta) {
  if (compareTag === "identical") return "done";
  if (compareTag === "line_ending_only") return "normalize_eol";
  if (compareTag === "only_live") return "review_growth";
  if (compareTag === "only_ref") return "oo_only_deprecated";
  const d = Math.abs(Number(delta) || 0);
  if (d >= 80) return "needs_restore_or_hybrid";
  if (d >= 25) return "needs_diff_review";
  return "needs_diff_review";
}

function writeSurfaceClassifySeed(rows, outDir) {
  const header = "path,compare_tag,suggested_tag,why,owner_task,live_lines,ref_lines,delta";
  const lines = [
    header,
    ...rows
      .filter((r) => r.tag !== "identical")
      .map((r) => {
        const why = `${r.tag}; delta=${r.delta_live_minus_ref}`;
        const suggested = suggestedClassifyTag(
          r.path,
          r.tag,
          r.delta_live_minus_ref,
        );
        const owner = ownerTaskForPath(r.path, r.tag);
        return [
          r.path,
          r.tag,
          suggested,
          why,
          owner,
          r.live_lines,
          r.ref_lines,
          r.delta_live_minus_ref,
        ]
          .map(csvEscape)
          .join(",");
      }),
  ];
  const out = path.join(outDir, "surface-classify.csv");
  fs.writeFileSync(out, `${lines.join("\n")}\n`, "utf8");
  return out;
}

for (const { id, root } of refs) {
  if (!fs.existsSync(root)) {
    console.error(`skip ${id}: missing ${root}`);
    continue;
  }
  const r = comparePair(id, root);
  console.log(`${r.label}:`, r.stats, "->", path.basename(r.outCsv));
  if (id === "OO31072026") {
    const seed = writeSurfaceClassifySeed(
      r.rows,
      path.join(repoRoot, "results/focss"),
    );
    console.log("surface-classify seed ->", path.basename(seed));
  }
}
