import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOTS = [
  "D:/23082026/site/public/assets/marketing",
  "D:/23082026/site/public/assets/catalog",
];
const RASTER = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const LOGO_LONG = 480;
const PHOTO_LONG = 1600;
const PHOTO_MIN_BYTES = 200 * 1024;
const SVG_EMBED_MIN_BYTES = 80 * 1024;

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function rel(p) {
  return path.relative("D:/23082026", p).replaceAll("\\", "/");
}

function isLogoPath(p) {
  return p.replaceAll("\\", "/").includes("/client-logos/");
}

function svgDataUri(svgText) {
  const re =
    /((?:xlink:)?href)=["']data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)["']/i;
  return svgText.match(re);
}

async function compressRasterBuffer(buf, ext, maxLong) {
  const img = sharp(buf, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  const long = Math.max(width, height);
  let pipeline = img;
  if (long > maxLong && width && height) {
    pipeline = pipeline.resize({
      width: maxLong,
      height: maxLong,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  if (ext === ".png") {
    pipeline = pipeline.png({ compressionLevel: 9, palette: true, effort: 10, quality: 80 });
  } else if (ext === ".jpg" || ext === ".jpeg") {
    pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
  } else if (ext === ".webp") {
    pipeline = pipeline.webp({ quality: 80, effort: 6, smartSubsample: true });
  } else {
    return null;
  }
  const out = await pipeline.toBuffer({ resolveWithObject: true });
  return {
    data: out.data,
    width: out.info.width,
    height: out.info.height,
    srcWidth: width,
    srcHeight: height,
  };
}

async function processSvg(file) {
  const before = fs.statSync(file).size;
  if (before < SVG_EMBED_MIN_BYTES) {
    return { skipped: "svg-small", before };
  }
  const text = fs.readFileSync(file, "utf8");
  const m = svgDataUri(text);
  if (!m) {
    return { skipped: "svg-vector", before };
  }
  const attr = m[1];
  const mime = m[2].toLowerCase();
  const b64 = m[3].replace(/\s+/g, "");
  const raw = Buffer.from(b64, "base64");
  const ext = mime === "png" ? ".png" : mime === "webp" ? ".webp" : ".jpg";
  const compressed = await compressRasterBuffer(raw, ext, LOGO_LONG);
  if (!compressed) return { skipped: "svg-unsupported", before };
  const newB64 = compressed.data.toString("base64");
  const replacement = `${attr}="data:image/${mime === "jpg" ? "jpeg" : mime};base64,${newB64}"`;
  const next = text.replace(m[0], replacement);
  const outBuf = Buffer.from(next, "utf8");
  if (outBuf.length >= before) {
    return {
      skipped: "not-smaller",
      before,
      after: outBuf.length,
      longAfter: Math.max(compressed.width, compressed.height),
      longBefore: Math.max(compressed.srcWidth, compressed.srcHeight),
    };
  }
  fs.writeFileSync(file, outBuf);
  return {
    changed: true,
    before,
    after: outBuf.length,
    longBefore: Math.max(compressed.srcWidth, compressed.srcHeight),
    longAfter: Math.max(compressed.width, compressed.height),
    kind: "svg-embed",
  };
}

async function processRaster(file) {
  const ext = path.extname(file).toLowerCase();
  const before = fs.statSync(file).size;
  const logo = isLogoPath(file);
  const maxLong = logo ? LOGO_LONG : PHOTO_LONG;
  const src = fs.readFileSync(file);
  let meta;
  try {
    meta = await sharp(src, { failOn: "none" }).metadata();
  } catch (e) {
    return { skipped: "unreadable", before, error: e.message };
  }
  const long = Math.max(meta.width || 0, meta.height || 0);
  const needsResize = long > maxLong;
  const needsWeight = logo ? before > 80 * 1024 : before >= PHOTO_MIN_BYTES;
  if (!needsResize && !needsWeight) {
    return { skipped: "already-small", before, longBefore: long };
  }
  if (!logo && before < PHOTO_MIN_BYTES && !needsResize) {
    return { skipped: "already-small", before, longBefore: long };
  }
  if (!logo && before < PHOTO_MIN_BYTES) {
    return { skipped: "already-small", before, longBefore: long };
  }
  const compressed = await compressRasterBuffer(src, ext, maxLong);
  if (!compressed) return { skipped: "unsupported", before, longBefore: long };
  if (compressed.data.length >= before) {
    return {
      skipped: "not-smaller",
      before,
      after: compressed.data.length,
      longBefore: long,
      longAfter: Math.max(compressed.width, compressed.height),
    };
  }
  fs.writeFileSync(file, compressed.data);
  return {
    changed: true,
    before,
    after: compressed.data.length,
    longBefore: long,
    longAfter: Math.max(compressed.width, compressed.height),
    kind: logo ? "logo-raster" : "photo",
  };
}

const files = ROOTS.flatMap((r) => walk(r));
const results = [];
let changed = 0;
let saved = 0;

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  try {
    let r;
    if (ext === ".svg") r = await processSvg(file);
    else if (RASTER.has(ext)) r = await processRaster(file);
    else continue;
    if (!r) continue;
    if (r.changed) {
      changed++;
      saved += r.before - r.after;
      const row = {
        path: rel(file),
        before: r.before,
        after: r.after,
        saved: r.before - r.after,
        longBefore: r.longBefore,
        longAfter: r.longAfter,
        kind: r.kind,
      };
      results.push(row);
      console.log(
        "OK",
        row.before,
        "->",
        row.after,
        `long ${row.longBefore}->${row.longAfter}`,
        row.path,
      );
    } else if (r.skipped === "svg-vector" || r.skipped === "unreadable") {
      console.log("SKIP", r.skipped, r.before, rel(file), r.error || "");
    }
  } catch (e) {
    console.log("FAIL", rel(file), e.message);
    results.push({ path: rel(file), error: e.message });
  }
}

console.log("DONE changed=" + changed + " savedBytes=" + saved + " rows=" + results.length);
fs.writeFileSync(
  "D:/23082026/scripts/AsNeeded/_tmp-compress-public-images.log.json",
  JSON.stringify({ changed, saved, results }, null, 2),
);
