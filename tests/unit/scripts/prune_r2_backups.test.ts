import { describe, expect, it, vi } from "vitest";
import {
  evaluateRetention,
  getIsoWeekKey,
  isProtectedBackupKey,
  parseBackupDate,
  partitionByPrefix,
  pruneR2Backups,
  type BackupItem,
} from "../../../scripts/prune_r2_backups";

describe("prune_r2_backups", () => {
  describe("isProtectedBackupKey", () => {
    it("protects catalog-latest.json and .gitkeep", () => {
      expect(isProtectedBackupKey("backups/catalog/catalog-latest.json")).toBe(true);
      expect(isProtectedBackupKey(".gitkeep")).toBe(true);
      expect(isProtectedBackupKey("backups/.gitkeep")).toBe(true);
    });

    it("does not protect normal timestamped dumps", () => {
      expect(isProtectedBackupKey("backups/products/pgdump-products-20260904071500.dump")).toBe(false);
      expect(isProtectedBackupKey("backups/admin/pgdump-admin-20260904071500.dump")).toBe(false);
      expect(isProtectedBackupKey("backups/repo/oofplweb-20260904071500.zip")).toBe(false);
      expect(isProtectedBackupKey("backups/catalog/catalog-20260904071500.json")).toBe(false);
    });
  });

  describe("parseBackupDate", () => {
    it("extracts timestamp correctly from standard dump keys", () => {
      const parsed = parseBackupDate("backups/products/pgdump-products-20260904071530.dump");
      expect(parsed).not.toBeNull();
      expect(parsed?.toISOString()).toBe("2026-09-04T07:15:30.000Z");
    });

    it("extracts timestamp from date-only or json keys", () => {
      const parsed = parseBackupDate("backups/catalog/catalog-20260815120000.json");
      expect(parsed).not.toBeNull();
      expect(parsed?.toISOString()).toBe("2026-08-15T12:00:00.000Z");
    });

    it("falls back to provided date if key does not match", () => {
      const fallback = new Date("2026-08-01T00:00:00.000Z");
      const parsed = parseBackupDate("backups/unknown-file.bin", fallback);
      expect(parsed).toEqual(fallback);
    });
  });

  describe("getIsoWeekKey", () => {
    it("returns consistent year-week format", () => {
      const d1 = new Date("2026-09-04T12:00:00.000Z");
      const d2 = new Date("2026-09-05T12:00:00.000Z");
      expect(getIsoWeekKey(d1)).toBe(getIsoWeekKey(d2));
      expect(getIsoWeekKey(d1)).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe("evaluateRetention", () => {
    const now = new Date("2026-09-04T12:00:00.000Z");
    const msInDay = 24 * 60 * 60 * 1000;

    it("keeps all daily backups within 5 days", () => {
      const items: BackupItem[] = [
        { key: "dump-today.dump", date: new Date(now.getTime() - 0.5 * msInDay) },
        { key: "dump-1d.dump", date: new Date(now.getTime() - 1 * msInDay) },
        { key: "dump-2d.dump", date: new Date(now.getTime() - 2 * msInDay) },
        { key: "dump-3d.dump", date: new Date(now.getTime() - 3 * msInDay) },
        { key: "dump-4d.dump", date: new Date(now.getTime() - 4 * msInDay) },
        { key: "dump-5d.dump", date: new Date(now.getTime() - 4.9 * msInDay) },
      ];

      const { toKeep, toDelete } = evaluateRetention(items, now);
      expect(toKeep.length).toBe(6);
      expect(toDelete.length).toBe(0);
    });

    it("keeps 1 backup per week for backups between 5 and 30 days", () => {
      // 2 backups in week A (e.g. Aug 26 and Aug 25 of same week 35)
      const weekADate1 = new Date("2026-08-26T12:00:00.000Z"); // 9 days ago
      const weekADate2 = new Date("2026-08-25T12:00:00.000Z"); // 10 days ago (same ISO week)
      // 1 backup in week B (e.g. 20d ago)
      const weekBDate = new Date("2026-08-15T12:00:00.000Z"); // 20 days ago

      const items: BackupItem[] = [
        { key: "dump-weekA-new.dump", date: weekADate1 },
        { key: "dump-weekA-old.dump", date: weekADate2 },
        { key: "dump-weekB.dump", date: weekBDate },
      ];

      const { toKeep, toDelete } = evaluateRetention(items, now);

      expect(toKeep.map((i) => i.key)).toEqual(["dump-weekA-new.dump", "dump-weekB.dump"]);
      expect(toDelete.map((i) => i.key)).toEqual(["dump-weekA-old.dump"]);
    });

    it("deletes backups beyond the eight newest weekly backups", () => {
      // 10 backups across 10 distinct weeks older than 7 days
      const items: BackupItem[] = Array.from({ length: 10 }, (_, i) => ({
        key: `dump-week-${i + 2}.dump`,
        date: new Date(now.getTime() - (i + 2) * 7 * msInDay),
      }));

      const { toKeep, toDelete } = evaluateRetention(items, now);
      expect(toKeep.length).toBe(8);
      expect(toDelete.length).toBe(2);
      expect(toDelete.map((i) => i.key)).toEqual(["dump-week-10.dump", "dump-week-11.dump"]);
    });

    it("handles a mixed realistic lifecycle across all tiers", () => {
      const items: BackupItem[] = [
        // Daily tier (age <= 7d) -> all kept
        { key: "dump-1d.dump", date: new Date(now.getTime() - 1 * msInDay) },
        { key: "dump-2d.dump", date: new Date(now.getTime() - 2 * msInDay) },
        { key: "dump-3d.dump", date: new Date(now.getTime() - 3 * msInDay) },
        { key: "dump-6d.dump", date: new Date(now.getTime() - 6 * msInDay) },

        // Weekly tier (age > 7d):
        // Week 1 (8d and 9d ago): keep newest (8d), delete older duplicate (9d)
        { key: "dump-8d.dump", date: new Date(now.getTime() - 8 * msInDay) },
        { key: "dump-9d.dump", date: new Date(now.getTime() - 9 * msInDay) },
        // Weeks 2-8 (one per week): all 7 kept
        { key: "dump-16d.dump", date: new Date(now.getTime() - 16 * msInDay) },
        { key: "dump-23d.dump", date: new Date(now.getTime() - 23 * msInDay) },
        { key: "dump-30d.dump", date: new Date(now.getTime() - 30 * msInDay) },
        { key: "dump-37d.dump", date: new Date(now.getTime() - 37 * msInDay) },
        { key: "dump-44d.dump", date: new Date(now.getTime() - 44 * msInDay) },
        { key: "dump-51d.dump", date: new Date(now.getTime() - 51 * msInDay) },
        { key: "dump-58d.dump", date: new Date(now.getTime() - 58 * msInDay) },

        // Expired tier (beyond 8 weekly backups): deleted
        { key: "dump-65d.dump", date: new Date(now.getTime() - 65 * msInDay) },
        { key: "dump-72d.dump", date: new Date(now.getTime() - 72 * msInDay) },

        // Protected item: always kept
        { key: "backups/catalog/catalog-latest.json", date: new Date(now.getTime() - 90 * msInDay) },
      ];

      const { toKeep, toDelete } = evaluateRetention(items, now);

      expect(toKeep.map((i) => i.key)).toContain("dump-1d.dump");
      expect(toKeep.map((i) => i.key)).toContain("dump-2d.dump");
      expect(toKeep.map((i) => i.key)).toContain("dump-3d.dump");
      expect(toKeep.map((i) => i.key)).toContain("dump-6d.dump");
      expect(toKeep.map((i) => i.key)).toContain("dump-8d.dump");
      expect(toKeep.map((i) => i.key)).toContain("dump-16d.dump");
      expect(toKeep.map((i) => i.key)).toContain("dump-23d.dump");

      expect(toDelete.map((i) => i.key)).toContain("dump-9d.dump");
      expect(toDelete.map((i) => i.key)).toContain("dump-65d.dump");
      expect(toDelete.map((i) => i.key)).toContain("dump-72d.dump");
      expect(toDelete.map((i) => i.key)).not.toContain("backups/catalog/catalog-latest.json");
    });
  });

  describe("partitionByPrefix", () => {
    it("groups items by directory prefix", () => {
      const items: BackupItem[] = [
        { key: "backups/products/p1.dump", date: new Date() },
        { key: "backups/products/p2.dump", date: new Date() },
        { key: "backups/admin/a1.dump", date: new Date() },
      ];
      const map = partitionByPrefix(items);
      expect(map.get("backups/products/")?.length).toBe(2);
      expect(map.get("backups/admin/")?.length).toBe(1);
    });
  });

  describe("pruneR2Backups function", () => {
    it("respects dryRun and does not issue delete commands", async () => {
      const mockSend = vi.fn().mockImplementation(async (cmd) => {
        if (cmd.constructor.name === "ListObjectsV2Command") {
          return {
            Contents: [
              { Key: "backups/products/pgdump-products-20260701000000.dump", Size: 100 },
              { Key: "backups/products/pgdump-products-20260701120000.dump", Size: 100 },
            ],
            IsTruncated: false,
          };
        }
        return {};
      });

      const mockClient = { send: mockSend } as unknown as import("@aws-sdk/client-s3").S3Client;
      const log = vi.fn();

      const res = await pruneR2Backups({
        dryRun: true,
        client: mockClient,
        bucket: "test-bucket",
        log,
      });

      expect(res.deleted).toBe(1);
      // Ensure DeleteObjectsCommand was NEVER sent in dryRun mode
      const deleteCalls = mockSend.mock.calls.filter(([c]) => c.constructor.name === "DeleteObjectsCommand");
      expect(deleteCalls.length).toBe(0);
    });
  });
});
