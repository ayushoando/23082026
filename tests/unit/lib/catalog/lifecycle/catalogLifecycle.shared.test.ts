import { describe, it, expect } from "vitest";
import {
  isBuyerVisibleLifecycle,
  isBuyerVisibleSlug,
  resolveCatalogLifecycle,
  type CatalogLifecycleManifest,
} from "@/lib/catalog/lifecycle/catalogLifecycle.shared";

const manifest: CatalogLifecycleManifest = {
  "desk-live": { state: "live", updatedAt: "2026-01-01T00:00:00.000Z" },
  "desk-draft": { state: "draft", updatedAt: "2026-01-01T00:00:00.000Z" },
  "desk-retired": { state: "retired", updatedAt: "2026-01-01T00:00:00.000Z" },
};

describe("catalogLifecycle.shared", () => {
  describe("isBuyerVisibleLifecycle", () => {
    it("treats only the live state as buyer-visible", () => {
      expect(isBuyerVisibleLifecycle("live")).toBe(true);
      expect(isBuyerVisibleLifecycle("draft")).toBe(false);
      expect(isBuyerVisibleLifecycle("retired")).toBe(false);
    });
  });

  describe("isBuyerVisibleSlug", () => {
    it("returns true for a live slug", () => {
      expect(isBuyerVisibleSlug("desk-live", manifest)).toBe(true);
    });

    it("hides draft and retired slugs", () => {
      expect(isBuyerVisibleSlug("desk-draft", manifest)).toBe(false);
      expect(isBuyerVisibleSlug("desk-retired", manifest)).toBe(false);
    });

    it("treats a slug missing from the manifest as live (legacy default)", () => {
      expect(isBuyerVisibleSlug("unknown-slug", manifest)).toBe(true);
    });
  });

  describe("resolveCatalogLifecycle", () => {
    it("returns the recorded state when the slug is present", () => {
      expect(resolveCatalogLifecycle("desk-live", manifest)).toBe("live");
      expect(resolveCatalogLifecycle("desk-retired", manifest)).toBe("retired");
    });

    it("defaults an unknown slug to draft", () => {
      expect(resolveCatalogLifecycle("unknown-slug", manifest)).toBe("draft");
    });

    it("defaults to draft when the entry exists but has no state", () => {
      const partial = {
        "no-state": { updatedAt: "2026-01-01T00:00:00.000Z" },
      } as unknown as CatalogLifecycleManifest;
      expect(resolveCatalogLifecycle("no-state", partial)).toBe("draft");
    });
  });
});
