import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const roots = [
  "D:/23082026/site/public/assets/marketing",
  "D:/23082026/site/public/assets/catalog",
];
const raster = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = roots.flatMap((r) => walk(r));
let over1600 = 0;
let over480Logo = 0;
let over500k = 0;
let over1m = 0;
const samples = [];

for (const f of files) {
  const ext = path.extname(f).toLowerCase();
  const st = fs.statSync(f);
  if (st.size > 500 * 1024) over500k++;
  if (st.size > 1024 * 1024) over1m++;
  if (!raster.has(ext)) continue;
  try {
    const m = await sharp(f).metadata();
    const long = Math.max(m.width || 0, m.height || 0);
    const isLogo = f.replaceAll("\\", "/").includes("/client-logos/");
    if (isLogo && long > 480) over480Logo++;
    if (!isLogo && long > 1600) over1600++;
    if (st.size > 500 * 1024 || long > 2000) {
      samples.push({
        size: st.size,
        dim: `${m.width}x${m.height}`,
        long,
        isLogo,
        f: f.slice("D:\\23082026\\".length),
      });
    }
  } catch {
    console.log("ERR", f);
  }
}

samples.sort((a, b) => b.size - a.size);
console.log({ over1m, over500k, over1600, over480Logo, rasterSamples: samples.length });
for (const s of samples.slice(0, 60)) {
  console.log(s.size, s.dim, s.isLogo ? "LOGO" : "PHOTO", s.f);
}
