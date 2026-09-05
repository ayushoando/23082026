import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const logos = "D:/23082026/site/public/assets/marketing/client-logos";
const files = fs.readdirSync(logos).map((f) => path.join(logos, f));

for (const f of files) {
  const st = fs.statSync(f);
  const ext = path.extname(f).toLowerCase();
  if (ext === ".svg") {
    const t = fs.readFileSync(f, "utf8");
    const img = (t.match(/<image/g) || []).length;
    const data = t.match(/data:image\/[^;]+/g) || [];
    if (st.size > 40000 || img) {
      console.log("SVG", st.size, path.basename(f), "images=" + img, data.join(","));
    }
    continue;
  }
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;
  try {
    const m = await sharp(f).metadata();
    if (st.size > 30000 || Math.max(m.width || 0, m.height || 0) > 600) {
      console.log("RAS", st.size, `${m.width}x${m.height}`, path.basename(f), m.format);
    }
  } catch (e) {
    console.log("ERR", f, e.message);
  }
}
