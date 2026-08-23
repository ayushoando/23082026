/**
 * Full audit of DB image paths that the checker reports broken (no sampling).
 * For every unique broken URL: find the flat disk-truth target, then live-HEAD
 * both the current and target URL against production.
 *
 * Usage:
 *   pnpm exec node scripts/audit-broken-db-image-paths.mjs [--no-live]
 */
import { config } from "dotenv";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const LIVE = !process.argv.includes("--no-live");
const LIVE_BASE = "https://oando.co.in";
const CONCURRENCY = 8;

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const adminUrl =
  process.env.NEXT_ADMIN_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_AUTH_DATABASE_URL?.trim();
const adminKey = process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim();
const adminSb = adminUrl && adminKey
  ? createClient(adminUrl, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const assetsRoot = resolve(process.cwd(), "site/public");
const catalogRoot = resolve(assetsRoot, "assets/catalog");

/** Mirror of candidateWebPaths/resolveLocal from check-supabase-missing-images.mjs. */
const FAMILY_PREFIX = [
  "seating",
  "workstations",
  "tables",
  "storage",
  "soft-seating",
  "educational",
  "collaborative",
];

function candidateWebPaths(webPath) {
  let p = webPath.trim().split("?")[0];
  if (p.startsWith("http://") || p.startsWith("https://")) {
    try {
      p = new URL(p).pathname;
    } catch {
      return [];
    }
  }
  const out = new Set();
  const add = (x) => {
    if (x) out.add(x);
  };
  add(p);
  if (p.startsWith("/images/")) {
    add(p.replace(/^\/images\//, "/assets/"));
  }
  for (const cur of out) {
    if (/\.(jpe?g|png)$/i.test(cur)) {
      add(cur.replace(/\.(jpe?g|png)$/i, ".webp"));
    }
  }
  for (const cur of out) {
    const m = cur.match(
      /^\/assets\/catalog\/(oando-([a-z0-9-]+)--[^/]+)\/(image-\d+\.[a-z0-9]+)$/i,
    );
    if (m) {
      const sku = m[1];
      const famHint = m[2];
      const file = m[3];
      const webp = file.replace(/\.(jpe?g|png)$/i, ".webp");
      const families = FAMILY_PREFIX.includes(famHint) ? [famHint] : FAMILY_PREFIX;
      for (const fam of families) {
        if (!sku.startsWith(`oando-${fam}--`) && fam !== famHint) continue;
        add(`/assets/catalog/${fam}/${sku}/gallery/${webp}`);
        add(`/assets/catalog/${fam}/${sku}/gallery/${file}`);
        add(`/assets/catalog/${fam}/${sku}/detail/${webp}`);
        add(`/assets/catalog/${fam}/${sku}/detail/${file}`);
        add(`/assets/catalog/${fam}/${sku}/${webp}`);
      }
      if (sku.startsWith("oando-soft-seating--")) {
        add(`/assets/catalog/soft-seating/${sku}/gallery/${webp}`);
        add(`/assets/catalog/soft-seating/${sku}/gallery/${file}`);
      }
    }
    const imp = cur.match(
      /^\/assets\/(?:catalog\/)?products\/imported\/([^/]+)\/(image-\d+\.[a-z0-9]+)$/i,
    );
    if (imp) {
      const slug = imp[1];
      const file = imp[2];
      const webp = file.replace(/\.(jpe?g|png)$/i, ".webp");
      add(`/assets/catalog/products/imported/${slug}/gallery/${webp}`);
      add(`/assets/catalog/products/imported/${slug}/gallery/${file}`);
      add(`/assets/catalog/products/imported/${slug}/${webp}`);
    }
    const prod = cur.match(/^\/assets\/products\/(.+)$/i);
    if (prod) {
      add(`/assets/catalog/products/${prod[1]}`);
    }
    const seatImp = cur.match(
      /^\/assets\/products\/imported\/([^/]+)\/(image-\d+\.[a-z0-9]+)$/i,
    );
    if (seatImp) {
      const slug = seatImp[1];
      const file = seatImp[2].replace(/\.(jpe?g|png)$/i, ".webp");
      const aliases = { breez: "breeze", xmesh: "x-mesh" };
      const k = aliases[slug] || slug;
      for (const fam of FAMILY_PREFIX) {
        add(`/assets/catalog/${fam}/oando-${fam}--${k}/gallery/${file}`);
      }
    }
  }
  return [...out];
}

function resolveLocal(webPath) {
  for (const c of candidateWebPaths(webPath)) {
    if (!c.startsWith("/assets/") && !c.startsWith("/images/")) continue;
    if (existsSync(resolve(assetsRoot, c.replace(/^\//, "")))) return { ok: true, resolved: c };
  }
  return { ok: false };
}

function isLocalRef(img) {
  if (typeof img !== "string" || !img.trim()) return false;
  let p = img.trim().split("?")[0];
  if (p.startsWith("http://") || p.startsWith("https://")) {
    try {
      const u = new URL(p);
      if (u.hostname.includes("supabase") || u.pathname.includes("/storage/v1/object/")) return false;
      p = u.pathname;
    } catch {
      return false;
    }
  }
  return p.startsWith("/assets/") || p.startsWith("/images/") || Boolean(img.includes("catalog-assets"));
}

/** Disk truth: SKU dir name -> flat web paths of files directly inside (no gallery/). */
function buildDiskIndex() {
  const bySku = new Map();
  const walk = (dir, rel) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        walk(resolve(dir, e.name), r);
      } else if (rel && rel.split("/").pop()?.startsWith("oando-")) {
        // file directly inside an oando-* SKU dir (flat layout)
        const sku = rel.split("/").pop();
        if (!bySku.has(sku)) bySku.set(sku, []);
        bySku.get(sku).push(`/assets/catalog/${r}`);
      }
    }
  };
  walk(catalogRoot, "");
  return bySku;
}

/** Extract SKU dir name from any broken catalog URL shape. */
function extractSku(p) {
  const m = p.match(/\/(oando-[a-z0-9-]+--[a-z0-9-]+)\//i);
  if (m) return m[1].toLowerCase();
  const imp = p.match(/\/catalog\/products\/imported\/([^/]+)\//i);
  if (imp) return `__imported__${imp[1].toLowerCase()}`;
  return null;
}

function extractFile(p) {
  const m = p.match(/\/([^/?#]+\.(?:webp|jpe?g|png))$/i);
  return m ? m[1].toLowerCase() : null;
}

function classify(p) {
  if (/\/gallery\//i.test(p)) return "gallery-segment";
  if (/\/seating\/(leather|non-leather|cafe|fabric|mesh)\//i.test(p)) return "material-subcategory";
  if (/\/detail\//i.test(p)) return "detail-segment";
  if (/\/products\/imported\//i.test(p)) return "imported-flat";
  return "other";
}

async function headLive(pathname) {
  if (!LIVE) return { skipped: true };
  try {
    const res = await fetch(LIVE_BASE + pathname, {
      method: "HEAD",
      headers: { "user-agent": "oando-audit/1.0" },
    });
    return {
      status: res.status,
      proxy: res.headers.get("x-oando-proxy") || null,
      contentType: res.headers.get("content-type") || null,
    };
  } catch (e) {
    return { status: 0, error: String(e?.message || e) };
  }
}

async function mapLimited(items, limit, fn) {
  const out = Array.from({ length: items.length });
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function main() {
  const { data: products, error: pe } = await sb
    .from("products")
    .select("id,slug,name,images,flagship_image,scene_images")
    .order("name");
  if (pe) throw new Error(`products: ${pe.message}`);

  const { data: piRows, error: pie } = await sb
    .from("product_images")
    .select("id,product_id,image_url,image_kind")
    .limit(5000);
  if (pie) throw new Error(`product_images: ${pie.message}`);

  let furniture = [];
  if (adminSb) {
    const { data: fur, error: fe } = await adminSb
      .from("furniture_catalog")
      .select("id,name,thumbnail_url,top_png_url,front_png_url,side_png_url,top_svg_url")
      .limit(5000);
    if (!fe) furniture = fur || [];
    else console.log("furniture_catalog:", fe.message);
  }

  // 1. Enumerate every unique broken local URL (no sampling).
  const refs = new Map(); // url -> { products:Set, tables:Set }
  const note = (u, where) => {
    if (!refs.has(u)) refs.set(u, { products: new Set(), where: new Set() });
    const e = refs.get(u);
    e.where.add(where);
    return e;
  };
  for (const row of products || []) {
    const imgs = [
      row.flagship_image,
      ...(Array.isArray(row.images) ? row.images : []),
      ...(Array.isArray(row.scene_images) ? row.scene_images : []),
    ].filter(Boolean);
    for (const img of new Set(imgs)) {
      if (!isLocalRef(img)) continue;
      if (!resolveLocal(img).ok) note(img, `products:${row.slug || row.id}`);
    }
  }
  for (const row of piRows || []) {
    if (!isLocalRef(row.image_url)) continue;
    if (!resolveLocal(row.image_url).ok) note(row.image_url, `product_images:${row.id}`);
  }
  for (const f of furniture) {
    for (const field of ["thumbnail_url", "top_png_url", "front_png_url", "side_png_url", "top_svg_url"]) {
      const u = f[field];
      if (!u || !isLocalRef(u)) continue;
      if (!resolveLocal(u).ok) note(u, `furniture:${f.id}:${field}`);
    }
  }

  console.log(`unique broken URLs: ${refs.size}`);

  // 2. Disk truth + rewrite targets.
  const bySku = buildDiskIndex();
  console.log(`disk SKU dirs indexed: ${bySku.size}`);

  const records = [];
  for (const [u, meta] of refs) {
    const sku = extractSku(u);
    const file = extractFile(u);
    const shape = classify(u);
    let target = null;
    let targetOnDisk = false;
    let siblings = [];
    if (sku && sku.startsWith("__imported__")) {
      const slug = sku.slice("__imported__".length);
      const cands = [
        `/assets/catalog/products/imported/${slug}/${file}`,
        `/assets/catalog/products/imported/${slug}/gallery/${file}`,
      ];
      for (const c of cands) {
        if (existsSync(resolve(assetsRoot, c.slice(1)))) {
          target = c;
          targetOnDisk = true;
          break;
        }
      }
    } else if (sku && file) {
      const flat = (bySku.get(sku) || []).filter((p) => p.endsWith(`/${file}`));
      if (flat.length === 1) {
        target = flat[0];
        targetOnDisk = true;
      } else if (flat.length > 1) {
        siblings = flat;
      } else {
        // webp sibling substitution
        const webpFile = file.replace(/\.(jpe?g|png)$/i, ".webp");
        if (webpFile !== file) {
          const flat2 = (bySku.get(sku) || []).filter((p) => p.endsWith(`/${webpFile}`));
          if (flat2.length === 1) {
            target = flat2[0];
            targetOnDisk = true;
          } else if (flat2.length > 1) siblings = flat2;
        }
      }
    }
    records.push({
      url: u,
      shape,
      sku,
      file,
      target,
      targetOnDisk,
      ambiguous: siblings,
      skuDirExists: sku ? bySku.has(sku) : null,
      where: [...meta.where],
    });
  }

  // 3. Live HEAD: current URL + target (concurrency-limited).
  await mapLimited(records, CONCURRENCY, async (r) => {
    r.liveCurrent = await headLive(r.url);
    r.liveTarget = r.target ? await headLive(r.target) : null;
  });

  // 4. Classify outcomes.
  for (const r of records) {
    const curOk = r.liveCurrent?.status === 200;
    const tgtOk = r.liveTarget?.status === 200;
    if (r.target && r.targetOnDisk && tgtOk && !r.ambiguous.length) r.verdict = "SAFE_REWRITE";
    else if (r.target && !tgtOk) r.verdict = "TARGET_MISSING_LIVE";
    else if (!r.target && curOk) r.verdict = "NO_TARGET_LIVE_OK";
    else if (!r.target && !curOk) r.verdict = "NO_TARGET_LIVE_BROKEN";
    else if (r.ambiguous.length) r.verdict = "AMBIGUOUS";
    else r.verdict = "REVIEW";
  }

  const byVerdict = {};
  const byShape = {};
  for (const r of records) {
    byVerdict[r.verdict] = (byVerdict[r.verdict] || 0) + 1;
    byShape[r.shape] = (byShape[r.shape] || 0) + 1;
  }

  const outDir = resolve(process.cwd(), "results/asset-cutover");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "db-path-audit.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        live: LIVE,
        liveBase: LIVE ? LIVE_BASE : null,
        totals: {
          uniqueBroken: records.length,
          byVerdict,
          byShape,
          productRows: (products || []).length,
          productImageRows: (piRows || []).length,
          furnitureRows: furniture.length,
        },
        records,
      },
      null,
      2,
    ),
  );

  console.log(`by verdict: ${JSON.stringify(byVerdict)}`);
  console.log(`by shape:   ${JSON.stringify(byShape)}`);
  console.log(`report: ${outPath}`);
  console.log("\n--- samples of non-SAFE verdicts ---");
  for (const v of Object.keys(byVerdict)) {
    if (v === "SAFE_REWRITE") continue;
    for (const r of records.filter((x) => x.verdict === v).slice(0, 5)) {
      console.log(`  [${v}] ${r.url}`);
      if (r.target) console.log(`      target: ${r.target} live=${r.liveTarget?.status}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
