/**
 * Backup retention pruning for Cloudflare R2 and local backups:
 *   - Daily backups: kept for 7 days (age <= 7 days).
 *   - Weekly backups: keep the newest backup from at most eight ISO weeks.
 *   - Older weekly duplicates and weeks beyond the newest eight are deleted.
 *
 * Usage:
 *   pnpm --filter oando-site exec tsx scripts/prune_r2_backups.ts
 *   pnpm --filter oando-site exec tsx scripts/prune_r2_backups.ts --dry
 *   pnpm run ops backup:prune [-- --dry]
 */
import { createRequire } from "node:module";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { createR2CatalogClient, resolveCatalogBucketName } from "./lib/r2Catalog";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAILY_RETENTION_DAYS = 7;
const MAX_WEEKLY_BACKUPS = 8;

export interface BackupItem {
  key: string;
  date: Date;
  size?: number;
}

export interface PruneEvaluation {
  toKeep: BackupItem[];
  toDelete: BackupItem[];
}

/** Never delete canonical latest pointers or non-backup assets. */
export function isProtectedBackupKey(key: string): boolean {
  if (key.endsWith("/catalog-latest.json") || key === "backups/catalog/catalog-latest.json") {
    return true;
  }
  if (key.endsWith("/.gitkeep") || key === ".gitkeep") {
    return true;
  }
  return false;
}

/** Extract timestamp from key (e.g. pgdump-products-20260904071500.dump). */
export function parseBackupDate(key: string, fallbackDate?: Date): Date | null {
  const m = key.match(/[-_](\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?\./);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    const hour = m[4] ? parseInt(m[4], 10) : 0;
    const minute = m[5] ? parseInt(m[5], 10) : 0;
    const second = m[6] ? parseInt(m[6], 10) : 0;
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
  return fallbackDate ?? null;
}

/** Compute ISO week identifier like 2026-W35 for weekly grouping. */
export function getIsoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Thursday in current week decides the year.
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Evaluates retention policy:
 * - age <= 7 days: keep daily backups.
 * - age > 7 days: keep the newest backup from at most eight ISO weeks.
 */
export function evaluateRetention(
  items: BackupItem[],
  now: Date = new Date(),
): PruneEvaluation {
  // Filter protected files
  const eligible = items.filter((item) => !isProtectedBackupKey(item.key));

  // Sort descending by date (newest first)
  const sorted = [...eligible].sort((a, b) => b.date.getTime() - a.date.getTime());

  const toKeep: BackupItem[] = [];
  const toDelete: BackupItem[] = [];
  const keptWeeks = new Set<string>();

  for (const item of sorted) {
    const ageDays = (now.getTime() - item.date.getTime()) / MS_PER_DAY;

    if (ageDays <= DAILY_RETENTION_DAYS) {
      // Keep all daily backups within 7 days.
      toKeep.push(item);
    } else {
      // Older backups: retain one newest item per ISO week, up to eight weeks.
      const weekKey = getIsoWeekKey(item.date);
      if (!keptWeeks.has(weekKey) && keptWeeks.size < MAX_WEEKLY_BACKUPS) {
        keptWeeks.add(weekKey);
        toKeep.push(item);
      } else {
        toDelete.push(item);
      }
    }
  }

  return { toKeep, toDelete };
}

/** Partition list of backup objects by their prefix / target. */
export function partitionByPrefix(items: BackupItem[]): Map<string, BackupItem[]> {
  const groups = new Map<string, BackupItem[]>();
  for (const item of items) {
    const lastSlash = item.key.lastIndexOf("/");
    const prefix = lastSlash >= 0 ? item.key.slice(0, lastSlash + 1) : "";
    const list = groups.get(prefix) ?? [];
    list.push(item);
    groups.set(prefix, list);
  }
  return groups;
}

export async function listR2Backups(
  client: S3Client,
  bucket: string,
  prefix = "backups/",
): Promise<BackupItem[]> {
  let token: string | undefined;
  const items: BackupItem[] = [];

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (!obj.Key || isProtectedBackupKey(obj.Key)) continue;
      const date = parseBackupDate(obj.Key, obj.LastModified);
      if (date) {
        items.push({
          key: obj.Key,
          date,
          size: obj.Size,
        });
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return items;
}

export async function deleteR2Keys(
  client: S3Client,
  bucket: string,
  keys: string[],
): Promise<number> {
  if (keys.length === 0) return 0;

  // S3 DeleteObjects accepts up to 1000 keys per request
  const CHUNK_SIZE = 1000;
  let deletedCount = 0;

  for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
    const chunk = keys.slice(i, i + CHUNK_SIZE);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
    deletedCount += chunk.length;
  }

  return deletedCount;
}

export async function pruneR2Backups(
  options: {
    dryRun?: boolean;
    now?: Date;
    prefix?: string;
    client?: S3Client;
    bucket?: string;
    log?: (msg: string) => void;
  } = {},
): Promise<{ kept: number; deleted: number }> {
  const log = options.log ?? console.log;
  const now = options.now ?? new Date();
  const dryRun = options.dryRun ?? false;
  const prefix = options.prefix ?? "backups/";

  const client = options.client ?? createR2CatalogClient();
  const bucket = options.bucket ?? resolveCatalogBucketName();

  log(`Scanning s3://${bucket}/${prefix} for backup retention pruning...`);
  const allItems = await listR2Backups(client, bucket, prefix);

  if (allItems.length === 0) {
    log(`No backup items found under s3://${bucket}/${prefix}. Nothing to prune.`);
    return { kept: 0, deleted: 0 };
  }

  // Partition by subfolder (e.g. backups/products/, backups/admin/, backups/repo/, backups/catalog/)
  const groups = partitionByPrefix(allItems);

  const allToKeep: BackupItem[] = [];
  const allToDelete: BackupItem[] = [];

  for (const [groupPrefix, items] of groups.entries()) {
    const { toKeep, toDelete } = evaluateRetention(items, now);
    log(`Prefix ${groupPrefix}: total=${items.length}, keep=${toKeep.length}, delete=${toDelete.length}`);
    allToKeep.push(...toKeep);
    allToDelete.push(...toDelete);
  }

  if (allToDelete.length > 0) {
    log(`Objects identified for pruning (${allToDelete.length}):`);
    for (const item of allToDelete) {
      const ageDays = ((now.getTime() - item.date.getTime()) / MS_PER_DAY).toFixed(1);
      log(`  - ${item.key} (age: ${ageDays} days)`);
    }

    if (dryRun) {
      log(`DRY RUN: Would delete ${allToDelete.length} backup objects.`);
    } else {
      const keysToDelete = allToDelete.map((item) => item.key);
      const count = await deleteR2Keys(client, bucket, keysToDelete);
      log(`Pruned ${count} old backup objects from s3://${bucket}/.`);
    }
  } else {
    log(`All ${allToKeep.length} backups are within the retention policy (daily <= 7d, then <= 8 weekly backups).`);
  }

  return { kept: allToKeep.length, deleted: allToDelete.length };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry") || args.includes("--dry-run");
  await pruneR2Backups({ dryRun });
}

function isMain(): boolean {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return entry.endsWith("prune_r2_backups.ts") || entry.endsWith("prune_r2_backups.js");
}

if (isMain()) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
