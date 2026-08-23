/**
 * Apply verified flat-path rewrites to products + product_images.
 * Only rewrites URL pairs marked SAFE_REWRITE in results/asset-cutover/db-path-audit.json
 * (target exists on disk AND returned live 200 from R2 during audit).
 *
 * Usage:
 *   pnpm exec node scripts/apply-db-image-path-rewrite.mjs --dry
 *   pnpm exec node scripts/apply-db-image-path-rewrite.mjs --apply
 */
import { config } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const MODE = process.argv.includes("--apply") ? "apply" : process.argv.includes("--dry") ? "dry" : null;
if (!MODE) {
  console.error("Usage: --dry | --apply");
  process.exit(2);
}

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Missing Supabase env");
const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const auditPath = resolve(process.cwd(), "results/asset-cutover/db-path-audit.json");
if (!existsSync(auditPath)) throw new Error("Missing audit report; run scripts/audit-broken-db-image-paths.mjs first");
const audit = JSON.parse(readFileSync(auditPath, "utf8"));

const rewrites = new Map();
for (const r of audit.records) {
  if (r.verdict !== "SAFE_REWRITE") continue;
  if (!r.target || r.target === r.url) continue;
  if (r.liveTarget?.status !== 200) continue; // defense in depth
  rewrites.set(r.url, r.target);
}
console.log(`SAFE rewrite pairs from audit: ${rewrites.size}`);

const remap = (v) => (typeof v === "string" && rewrites.has(v) ? rewrites.get(v) : v);

async function main() {
  const { data: products, error: pe } = await sb
    .from("products")
    .select("id,slug,name,images,flagship_image,scene_images");
  if (pe) throw new Error(`products: ${pe.message}`);

  const { data: piRows, error: pie } = await sb
    .from("product_images")
    .select("id,product_id,image_url,image_kind,sort_order")
    .limit(5000);
  if (pie) throw new Error(`product_images: ${pie.message}`);

  // ---- compute changes + build backup of every affected row ----
  const productChanges = [];
  for (const row of products || []) {
    const images = (row.images || []).map(remap);
    const flag = remap(row.flagship_image);
    const scene = (row.scene_images || []).map(remap);
    const changed =
      JSON.stringify(images) !== JSON.stringify(row.images || []) ||
      flag !== row.flagship_image ||
      JSON.stringify(scene) !== JSON.stringify(row.scene_images || []);
    if (changed) {
      productChanges.push({
        before: {
          id: row.id,
          slug: row.slug,
          images: row.images,
          flagship_image: row.flagship_image,
          scene_images: row.scene_images,
        },
        after: { images, flagship_image: flag, scene_images: scene },
      });
    }
  }

  const piChanges = [];
  for (const row of piRows || []) {
    const next = remap(row.image_url);
    if (next !== row.image_url) {
      piChanges.push({
        before: { id: row.id, product_id: row.product_id, image_url: row.image_url },
        after: { image_url: next },
      });
    }
  }

  console.log(`products rows to update: ${productChanges.length}`);
  console.log(`product_images rows to update: ${piChanges.length}`);

  if (!productChanges.length && !piChanges.length) {
    console.log("nothing to do");
    return;
  }

  // ---- backup (rollback artifact) ----
  const outDir = resolve(process.cwd(), "results/asset-cutover");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const backupPath = resolve(outDir, `db-path-rewrite-backup-${stamp}.json`);
  writeFileSync(
    backupPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        mode: MODE,
        host: new URL(url).host,
        rewritePairs: [...rewrites.entries()].map(([from, to]) => ({ from, to })),
        productsBefore: productChanges.map((c) => c.before),
        productImagesBefore: piChanges.map((c) => c.before),
      },
      null,
      2,
    ),
  );
  console.log(`backup: ${backupPath}`);

  if (MODE === "dry") {
    console.log("\n--- dry run: sample changes ---");
    for (const c of productChanges.slice(0, 8)) {
      console.log(`  products ${c.before.slug}: ${c.before.flagship_image} -> ${c.after.flagship_image}`);
    }
    for (const c of piChanges.slice(0, 8)) {
      console.log(`  product_images ${c.before.id}: ${c.before.image_url} -> ${c.after.image_url}`);
    }
    console.log("dry run complete; no writes performed");
    return;
  }

  // ---- apply ----
  const applied = { products: 0, productImages: 0 };
  const errors = [];
  for (const c of productChanges) {
    const { error } = await sb
      .from("products")
      .update(c.after)
      .eq("id", c.before.id);
    if (error) errors.push({ table: "products", id: c.before.id, slug: c.before.slug, error: error.message });
    else applied.products++;
  }
  for (const c of piChanges) {
    const { error } = await sb
      .from("product_images")
      .update(c.after)
      .eq("id", c.before.id);
    if (error) errors.push({ table: "product_images", id: c.before.id, error: error.message });
    else applied.productImages++;
  }

  const logPath = resolve(outDir, `db-path-rewrite-applied-${stamp}.json`);
  writeFileSync(
    logPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        backup: backupPath,
        applied,
        errors,
        productChanges,
        productImageChanges: piChanges,
      },
      null,
      2,
    ),
  );

  console.log(`applied: products=${applied.products} product_images=${applied.productImages}`);
  if (errors.length) {
    console.log(`ERRORS (${errors.length}):`);
    for (const e of errors.slice(0, 20)) console.log(" ", JSON.stringify(e));
  }
  console.log(`change log: ${logPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
