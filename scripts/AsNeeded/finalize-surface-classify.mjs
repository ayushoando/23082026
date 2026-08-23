#!/usr/bin/env node
/**
 * Add or refresh final `tag` column on results/focss/surface-classify.csv (06c-W0).
 * Run after: node scripts/AsNeeded/compare-focss-trees.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const csvPath = path.join(repoRoot, "results/focss/surface-classify.csv");

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (const c of line) {
    if (c === '"') {
      q = !q;
      continue;
    }
    if (c === "," && !q) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function csvEscape(value) {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Surgical hybrid — never bulk-copy OO tree (06c replan 2026-08-20). */
const HYBRID_P0 = new Set([
  "site/components/products/products-page.css",
  "site/components/contact/contact-page-pass.css",
  "site/components/contact/home-contact-teaser.css",
  "planner/workspace-shell.css",
  "planner/polish.css",
  "planner/controls.css",
  "site/components/products/pdp-cta.css",
  "site/components/products/pdp-detail.css",
]);

const KEEP_GROWTH_ONLY_LIVE = new Set([
  "site/components/chrome/app-shell.css",
  "site/components/chrome/portal-svg-catalog.css",
  "site/components/chrome/shell-global-nav.css",
  "site/components/homepage/home-layout.css",
  "site/components/homepage/home-type.css",
  "site/components/homepage/home-mobile.css",
  "site/components/homepage/planner-hero-demo.css",
  "site/components/planner/planner-feature-pages.css",
  "site/components/planner/planner-landing-mobile.css",
  "site/components/planner/planner-landing-page.css",
  "site/components/planner/planner-landing-shared.css",
  "site/components/products/catalog-category-hero.css",
  "site/components/products/catalog-desktop.css",
  "site/components/products/product-entry-page.css",
  "site/components/shared/mobile-tap-targets.css",
]);

function finalTag(rel, compareTag, delta) {
  if (compareTag === "line_ending_only") return "ignore";
  if (compareTag === "only_ref") {
    if (rel.includes("-fallback.css")) return "ignore";
    return "ignore";
  }
  if (compareTag === "only_live") {
    if (KEEP_GROWTH_ONLY_LIVE.has(rel)) return "keep_growth";
    return "review";
  }
  if (rel.startsWith("base/type/")) return "hybrid";
  if (HYBRID_P0.has(rel)) return "hybrid";
  if (rel === "site/components/chrome/index.css") return "hybrid";
  if (rel === "site/components/chrome/site-footer.css") return "hybrid";
  if (rel === "site/components/chrome/shell-assistant.css") return "hybrid";
  if (rel.startsWith("admin/")) return "keep_growth";
  if (rel.startsWith("studio/")) return "hybrid";
  if (rel === "site/components/homepage/soft-bands.css") return "hybrid";
  const d = Math.abs(Number(delta) || 0);
  if (d === 0 && compareTag === "content_diff") return "hybrid";
  if (d <= 20) return "hybrid";
  return "hybrid";
}

const raw = fs.readFileSync(csvPath, "utf8").trim().split("\n");
const headerParts = parseCsvLine(raw[0]);
const hasTag = headerParts.includes("tag");
const dataRows = raw.slice(1).map((line) => {
  const cols = parseCsvLine(line);
  if (hasTag) {
    return [cols[0], cols[1], cols[4], cols[5], cols[6], cols[7], cols[8]];
  }
  return cols;
});

const outHeader =
  "path,compare_tag,tag,suggested_tag,why,owner_task,live_lines,ref_lines,delta";
const lines = [
  outHeader,
  ...dataRows.map((cols) => {
    const [rel, compareTag, suggested, why, owner, live, ref, delta] = cols;
    const tag = finalTag(rel, compareTag, delta);
    return [rel, compareTag, tag, suggested, why, owner, live, ref, delta]
      .map(csvEscape)
      .join(",");
  }),
];
fs.writeFileSync(csvPath, `${lines.join("\n")}\n`, "utf8");
console.log(`finalized ${dataRows.length} rows -> ${csvPath}`);
