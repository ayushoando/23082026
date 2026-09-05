import fs from "node:fs";
import sharp from "sharp";

const file =
  "D:/23082026/site/public/assets/marketing/client-logos/iit-patna.svg";
const before = fs.statSync(file).size;
const text = fs.readFileSync(file, "utf8");

const tags = [...text.matchAll(/<(text|image|path|g|rect)\b/g)].map((x) => x[1]);
console.log("tags", tags);

const m = text.match(/href=["']data:image\/png;base64,([\s\S]*?)["']/i);
if (!m) {
  console.log("NO_MATCH");
  process.exit(1);
}
const b64 = m[1]
  .replace(/&#10;/g, "")
  .replace(/&#x0A;/gi, "")
  .replace(/&#xA;/gi, "")
  .replace(/\s+/g, "");
const raw = Buffer.from(b64, "base64");
const meta = await sharp(raw).metadata();
console.log("embed", raw.length, `${meta.width}x${meta.height}`);
const out = await sharp(raw)
  .rotate()
  .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true, effort: 10, quality: 80 })
  .toBuffer({ resolveWithObject: true });
const newB64 = out.data.toString("base64");
const next = text.replace(m[0], `href="data:image/png;base64,${newB64}"`);
const buf = Buffer.from(next, "utf8");
if (buf.length >= before) {
  console.log("NOT_SMALLER", before, buf.length);
  process.exit(0);
}
fs.writeFileSync(file, buf);
const afterTags = [...next.matchAll(/<(text|image|path|g|rect)\b/g)].map((x) => x[1]);
console.log("afterTags", afterTags);
console.log(
  "OK",
  before,
  "->",
  buf.length,
  `long ${Math.max(meta.width, meta.height)}->${Math.max(out.info.width, out.info.height)}`,
);
