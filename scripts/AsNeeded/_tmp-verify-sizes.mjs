import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

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
const imgs = files.filter((f) => /\.(webp|png|jpe?g|svg)$/i.test(f));
const total = imgs.reduce((s, f) => s + fs.statSync(f).size, 0);
const over1 = imgs
  .filter((f) => fs.statSync(f).size > 1048576)
  .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
const over500 = imgs.filter((f) => fs.statSync(f).size > 512000);
console.log(
  "files",
  imgs.length,
  "bytes",
  total,
  "over1MB",
  over1.length,
  "over500KB",
  over500.length,
);
for (const f of over1) console.log(fs.statSync(f).size, f);

const re = new RegExp("data:image/([^;]+);base64,([A-Za-z0-9+/=]+)");
const svgs = [
  "grasim-aditya-birla.svg",
  "hindalco.svg",
  "aditya-birla-schools.svg",
  "iit-patna.svg",
];
for (const n of svgs) {
  const p = "D:/23082026/site/public/assets/marketing/client-logos/" + n;
  const t = fs.readFileSync(p, "utf8");
  const m = t.match(re);
  console.log(
    n,
    fs.statSync(p).size,
    "hasText",
    (t.match(/<text/g) || []).length,
    "mime",
    m && m[1],
    "b64len",
    m && m[2].length,
  );
  if (m) {
    const buf = Buffer.from(m[2], "base64");
    const meta = await sharp(buf).metadata();
    console.log("  embed", meta.format, meta.width + "x" + meta.height);
  }
}

const log = JSON.parse(
  fs.readFileSync("D:/23082026/scripts/AsNeeded/_tmp-compress-public-images.log.json", "utf8"),
);
const mkt = log.results.filter((r) => r.path && r.path.includes("/marketing/"));
const cat = log.results.filter((r) => r.path && r.path.includes("/catalog/"));
const mktSaved = mkt.reduce((s, r) => s + (r.saved || 0), 0);
const catSaved = cat.reduce((s, r) => s + (r.saved || 0), 0);
console.log("marketingChanged", mkt.length, "saved", mktSaved);
console.log("catalogChanged", cat.length, "saved", catSaved);
const stillBig = log.results.filter((r) => r.after > 1048576);
console.log("stillOver1MBInLog", stillBig.length, stillBig);
