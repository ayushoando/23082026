import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dir = "D:/23082026/site/public/assets/marketing/client-logos";
const re = new RegExp("data:image/([^;]+);base64,([A-Za-z0-9+/=]+)");
const names = [
  "grasim-aditya-birla.svg",
  "hindalco.svg",
  "aditya-birla-schools.svg",
  "iit-patna.svg",
];
const outDir = "D:/23082026/scripts/AsNeeded/_tmp-previews";
fs.mkdirSync(outDir, { recursive: true });
for (const n of names) {
  const t = fs.readFileSync(path.join(dir, n), "utf8");
  const m = t.match(re);
  const buf = Buffer.from(m[2], "base64");
  const dest = path.join(outDir, n.replace(".svg", ".png"));
  await sharp(buf).png().toFile(dest);
  console.log("wrote", dest);
}

const roots = [
  "D:/23082026/site/public/assets/marketing",
  "D:/23082026/site/public/assets/catalog",
];
function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = roots.flatMap((r) => walk(r));
const over500 = files
  .filter((f) => /\.(webp|png|jpe?g|svg)$/i.test(f) && fs.statSync(f).size > 512000)
  .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
console.log("OVER500");
for (const f of over500) console.log(fs.statSync(f).size, f);
