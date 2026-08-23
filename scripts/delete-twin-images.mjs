/**
 * Delete zero-padded twin imagery (image-0N.ext) that duplicates a canonical
 * un-padded file (image-N.ext), per the audited disk-truth report
 * results/asset-cutover/disk-twin-audit.json (sameByte || sameDims pairs only).
 *
 *  --disk            delete the padded file from site/public/assets/catalog
 *  --r2              delete the padded object from R2 (bucket oando-asset-cdn);
 *                    verifies the canonical key exists in R2 first (skip if not)
 *  --dry             no deletions; print/record the plan
 * Requires an explicit target: --disk, --r2, or both.
 *
 * Usage:
 *   pnpm exec node scripts/delete-twin-images.mjs --disk --dry
 *   pnpm exec node scripts/delete-twin-images.mjs --r2 --dry
 *   pnpm exec node scripts/delete-twin-images.mjs --disk --r2
 */
import { config } from "dotenv";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

config({ path: resolve(process.cwd(), ".env.local") });

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const DO_DISK = args.includes("--disk");
const DO_R2 = args.includes("--r2");
if (!DO_DISK && !DO_R2) {
  console.error("Usage: --disk | --r2 | --disk --r2   (add --dry for a plan-only run)");
  process.exit(2);
}

const ROOT = process.cwd();
const PUBLIC = resolve(ROOT, "site/public");
const auditPath = resolve(ROOT, "results/asset-cutover/disk-twin-audit.json");
if (!existsSync(auditPath)) throw new Error("Run scripts/audit-disk-image-twins.mjs first");
const audit = JSON.parse(readFileSync(auditPath, "utf8"));

/** Resolve each twin group to { padded, flat } absolute paths, safe pairs only. */
const pairs = [];
for (const t of audit.twins) {
  if (!(t.sameByte || t.sameDims)) continue;
  const padded = t.paths.find((p) => /image-0\d/i.test(p));
  const flat = t.paths.find((p) => !/image-0\d/i.test(p));
  if (padded && flat) pairs.push({ padded, flat, key: t.key });
}
console.log(`audited safe twin pairs: ${pairs.length} (of ${audit.twins.length} groups)`);

/**
 * Absolute disk path -> R2 key. Disk layout is site/public/assets/catalog/...,
 * but the bucket keys live under `catalog/...` (the proxy strips `/assets/`).
 */
const toKey = (abs) => {
  const rel = relative(PUBLIC, abs).replace(/\\/g, "/"); // assets/catalog/...
  return rel.replace(/^assets\//, ""); // catalog/...
};

const manifest = {
  generatedAt: new Date().toISOString(),
  mode: `${DRY ? "dry" : "apply"} disk=${DO_DISK} r2=${DO_R2}`,
  disk: [],
  r2: [],
  r2SkippedNoCanonical: [],
  errors: [],
};

// ---- disk deletions ----
if (DO_DISK) {
  let gone = 0;
  for (const p of pairs) {
    const webRel = "/" + toKey(p.padded);
    if (!existsSync(p.padded)) {
      manifest.disk.push({ path: webRel, status: "already-absent" });
      continue;
    }
    // safety: canonical sibling must still exist on disk
    if (!existsSync(p.flat)) {
      manifest.errors.push({ path: webRel, error: "canonical flat file missing; skipped" });
      continue;
    }
    if (DRY) {
      manifest.disk.push({ path: webRel, status: "would-delete" });
      continue;
    }
    try {
      rmSync(p.padded);
      gone++;
      manifest.disk.push({ path: webRel, status: "deleted" });
    } catch (e) {
      manifest.errors.push({ path: webRel, error: String(e.message || e) });
    }
  }
  console.log(`disk: ${DRY ? "would delete" : "deleted"} ${manifest.disk.filter((d) => d.status.endsWith("delete") || d.status === "deleted").length} files`);
}

// ---- R2 deletions ----
if (DO_R2) {
  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() ||
    process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim();
  const endpoint =
    process.env.CLOUDFLARE_S3_URL?.trim() ||
    (process.env.CLOUDFLARE_ACCOUNT_ID
      ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : "");
  const bucket =
    process.env.CLOUDFLARE_R2_CATALOG_BUCKET?.trim() ||
    process.env.CLOUDFLARE_R2_BUCKET?.trim() ||
    "oando-asset-cdn";
  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("Missing R2 credentials/endpoint in .env.local");
  }
  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  // list all keys once
  const keys = new Set();
  let token;
  do {
    const out = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 1000 }),
    );
    for (const item of out.Contents ?? []) if (item.Key) keys.add(item.Key);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  console.log(`r2: listed ${keys.size} objects in ${bucket}`);

  const toDelete = [];
  for (const p of pairs) {
    const padKey = toKey(p.padded);
    const flatKey = toKey(p.flat);
    if (!keys.has(padKey)) {
      manifest.r2.push({ key: padKey, status: "absent-in-r2" });
      continue;
    }
    if (!keys.has(flatKey)) {
      // canonical not in R2: deleting the twin would drop the only copy
      manifest.r2SkippedNoCanonical.push({ key: padKey, canonical: flatKey });
      continue;
    }
    toDelete.push(padKey);
    manifest.r2.push({ key: padKey, status: DRY ? "would-delete" : "pending" });
  }
  console.log(
    `r2: deletable=${toDelete.length} skipped(no canonical in R2)=${manifest.r2SkippedNoCanonical.length} absent=${manifest.r2.filter((r) => r.status === "absent-in-r2").length}`,
  );

  if (!DRY && toDelete.length) {
    for (let i = 0; i < toDelete.length; i += 500) {
      const batch = toDelete.slice(i, i + 500);
      const res = await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: false },
        }),
      );
      const deleted = new Set((res.Deleted ?? []).map((d) => d.Key));
      for (const e of res.Errors ?? []) {
        manifest.errors.push({ key: e.Key, error: `${e.Code} ${e.Message}` });
      }
      for (const r of manifest.r2) {
        if (r.status === "pending" && deleted.has(r.key)) r.status = "deleted";
      }
      console.log(
        `  batch ${Math.floor(i / 500) + 1}: deleted=${(res.Deleted ?? []).length} errors=${(res.Errors ?? []).length}`,
      );
    }
  }
}

const outDir = resolve(ROOT, "results/asset-cutover");
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const outPath = resolve(
  outDir,
  `twin-delete-${DRY ? "plan" : "applied"}-${stamp}.json`,
);
writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`manifest: ${outPath}`);
if (manifest.errors.length) {
  console.log(`errors: ${manifest.errors.length}`);
  manifest.errors.slice(0, 10).forEach((e) => console.log(" ", JSON.stringify(e)));
}
