/**
 * Audit byte-level twins among zero-padded siblings (image-1.webp vs image-01.webp)
 * under site/public/assets/catalog. Read-only; writes audit JSON only.
 * Usage: pnpm exec node scripts/audit-disk-image-twins.mjs
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "site/public/assets/catalog");
const hash = (b) => createHash("sha256").update(b).digest("hex");
const norm = (n) => n.replace(/image-0*(\d+)/i, "image-$1");

/** VP8/VP8L/VP8X dimension probe for webp; null for other formats. */
function webpDims(b) {
  if (b.length < 30 || b.toString("latin1", 0, 4) !== "RIFF" || b.toString("latin1", 8, 12) !== "WEBP") return null;
  const fourcc = b.toString("latin1", 12, 16);
  if (fourcc === "VP8 ") {
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === "VP8X") {
    return { w: (b.readUIntLE(24, 3) & 0xffffff) + 1, h: (b.readUIntLE(27, 3) & 0xffffff) + 1 };
  }
  return null;
}

const groups = new Map();
let files = 0;
function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const full = join(d, e.name);
    if (e.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(webp|jpe?g|png)$/i.test(e.name)) continue;
    files++;
    const buf = readFileSync(full);
    const key = join(d, norm(e.name)).toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({
      file: e.name,
      full,
      size: statSync(full).size,
      hash: hash(buf),
      dims: webpDims(buf),
    });
  }
}
walk(root);

const twins = [];
for (const [k, v] of groups) {
  if (v.length > 1) {
    const sameByte = new Set(v.map((x) => x.hash)).size === 1;
    const dims = v.map((x) => x.dims && `${x.dims.w}x${x.dims.h}`);
    const sameDims = new Set(dims).size === 1;
    twins.push({
      key: relative(root, k).replace(/\\/g, "/"),
      sameByte,
      sameDims,
      dims,
      files: v.map((x) => `${x.file}:${x.size}`),
      paths: v.map((x) => x.full.replace(/\\/g, "/")),
    });
  }
}
const sameB = twins.filter((t) => t.sameByte).length;
const sameD = twins.filter((t) => !t.sameByte && t.sameDims).length;
console.log("files scanned:", files);
console.log("zero-pad twin groups:", twins.length, "| byte-identical:", sameB, "| diff bytes same dims:", sameD, "| diff dims:", twins.length - sameB - sameD);
for (const t of twins.slice(0, 20)) {
  console.log(" ", t.sameByte ? "SAME" : t.sameDims ? "DIM=" : "DIFF", t.key, JSON.stringify(t.files), JSON.stringify(t.dims));
}

const outDir = resolve(process.cwd(), "results/asset-cutover");
mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, "disk-twin-audit.json");
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), files, twins }, null, 2));
console.log("report:", out);
