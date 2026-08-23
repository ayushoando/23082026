#!/usr/bin/env node
/** Export catalog SKU matrix for plan 02 module 8 (pSEO data spine). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const indexPath = path.join(root, "site", "features", "site", "data", "localCatalogIndex.json");
const outPath = path.join(root, "results", "seo", "pseo-sku-matrix.csv");

const CATEGORY_ALIASES = {
  chairs: "seating",
  chair: "seating",
  storage: "storages",
  "soft-seating": "soft-seating",
  collaborative: "soft-seating",
  educational: "education",
};

function normalizeCategory(raw) {
  const token = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^oando-/, "");
  if (!token) return "seating";
  if (CATEGORY_ALIASES[token]) return CATEGORY_ALIASES[token];
  return token;
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function deriveSlug(entry) {
  const folder = String(entry.id || entry.slug || "").trim();
  const split = folder.indexOf("--");
  if (split !== -1) return folder.slice(split + 2);
  return String(entry.slug || entry.name || folder)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function main() {
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const header = [
    "category",
    "product_slug",
    "name",
    "public_path",
    "series_name",
    "source",
  ];
  const lines = [header.join(",")];
  const seen = new Set();

  for (const entry of index) {
    const category = normalizeCategory(entry.category_id);
    const slug = deriveSlug(entry);
    if (!slug) continue;
    const key = `${category}::${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const row = {
      category,
      product_slug: slug,
      name: entry.name || slug,
      public_path: `/products/${category}/${slug}`,
      series_name: entry.series_name || "",
      source: "localCatalogIndex",
    };
    lines.push(header.map((k) => csvEscape(row[k])).join(","));
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${lines.length - 1} rows to ${outPath}`);
}

main();
