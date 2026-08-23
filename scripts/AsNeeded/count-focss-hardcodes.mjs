#!/usr/bin/env node
/** Inventory raw values in site/focss (not a ratchet). Token sheets are listed separately. */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("site/focss");
const TOKEN_OK = /[/\\]base[/\\]tokens[/\\]|[/\\]base[/\\]type[/\\]typography\.css$/;
const HEX = /#(?:[0-9a-fA-F]{3,8})\b/g;
const RGB = /\b(?:rgb|rgba|hsl|hsla)\s*\(/g;
const W300 = /font-weight:\s*300\b/g;
const RAW_PX = /:\s*-?\d+(?:\.\d+)?px\b/g;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".css")) out.push(p);
  }
  return out;
}

const files = walk(root);
const rows = [];
for (const file of files) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const hex = [...text.matchAll(HEX)].length;
  const rgb = [...text.matchAll(RGB)].length;
  const w300 = [...text.matchAll(W300)].length;
  const px = [...text.matchAll(RAW_PX)].length;
  if (hex || rgb || w300 || px) {
    rows.push({ rel, tokenLayer: TOKEN_OK.test(file.replaceAll("\\", "/")), hex, rgb, w300, px });
  }
}

const product = rows.filter((r) => !r.tokenLayer);
const sum = (k) => product.reduce((n, r) => n + r[k], 0);
console.log(`files_with_hits ${rows.length}`);
console.log(`product_hex ${sum("hex")} product_rgb ${sum("rgb")} product_w300 ${sum("w300")} product_px ${sum("px")}`);
for (const r of product.sort((a, b) => b.hex + b.px - (a.hex + a.px)).slice(0, 25)) {
  console.log(`${r.rel}\thex=${r.hex}\trgb=${r.rgb}\tw300=${r.w300}\tpx=${r.px}`);
}
