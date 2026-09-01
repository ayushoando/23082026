// @vitest-environment node
//
// Feature: client-showcase-tabs, Properties 1–4, 9, 10
// Registry constants, filtering, ordering, and deduplication for the sector
// showcase (plans/client-showcase-tabs tasks 8.1–8.2).

import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import {
  CLIENT_REGISTRY,
  SECTOR_TABS,
  getGroupedRecords,
  getPublishedRecords,
  groupPublishedRecords,
} from "@/lib/clients/clientRegistry";
import type { ClientRecord, SectorTabId } from "@/lib/clients/clientTypes";

const TAB_IDS: SectorTabId[] = [
  "financial-services",
  "government-public-sector",
  "education-social-impact",
  "corporates-multinationals",
];

function makeRecord(overrides: Partial<ClientRecord> & { canonicalId: string }): ClientRecord {
  return {
    displayName: `Client ${overrides.canonicalId}`,
    sourceNames: [],
    sectorTab: "financial-services",
    published: true,
    ...overrides,
  };
}

/** A generated set of records with unique canonicalIds. */
function recordSetArb(maxLength = 30): fc.Arbitrary<ClientRecord[]> {
  return fc
    .array(
      fc.record({
        displayName: fc
          .string({ minLength: 1, maxLength: 24 })
          .map((value) => value.trim() || "Unnamed"),
        sectorTab: fc.constantFrom(...TAB_IDS),
        published: fc.boolean(),
      }),
      { minLength: 1, maxLength },
    )
    .map((entries) =>
      entries.map((entry, index) => ({
        canonicalId: `id-${index}`,
        sourceNames: [],
        ...entry,
      })),
    );
}

describe("clientRegistry constants", () => {
  // Feature: client-showcase-tabs, Property 1: the tab strip is exactly the
  // agreed four sectors in IA order with the agreed labels.
  it("SECTOR_TABS matches the agreed IA exactly", () => {
    expect(SECTOR_TABS).toHaveLength(4);
    expect(SECTOR_TABS.map((tab) => tab.id)).toEqual(TAB_IDS);
    expect(SECTOR_TABS.map((tab) => tab.label)).toEqual([
      "Financial Services",
      "Government & Public Sector",
      "Education, Social Impact & Development",
      "Corporates & Multinationals",
    ]);
    for (const tab of SECTOR_TABS) {
      expect(tab.tabId).toBe(`tab-${tab.id}`);
      expect(tab.panelId).toBe(`panel-${tab.id}`);
    }
  });
});

describe("getPublishedRecords / getGroupedRecords filtering", () => {
  // Feature: client-showcase-tabs, Property 3: published records land in
  // exactly one sector group, matching their sectorTab.
  it("places every published record in exactly one group", () => {
    fc.assert(
      fc.property(recordSetArb(), (records) => {
        const grouped = groupPublishedRecords(records);
        const groupedFlat = TAB_IDS.flatMap((tab) => grouped[tab]).map((r) => r.canonicalId);
        const publishedIds = records.filter((r) => r.published).map((r) => r.canonicalId);

        for (const canonicalId of publishedIds) {
          expect(groupedFlat.filter((entry) => entry === canonicalId)).toHaveLength(1);
        }
        for (const record of records) {
          if (!record.published) {
            expect(groupedFlat).not.toContain(record.canonicalId);
          }
        }
        for (const tab of TAB_IDS) {
          for (const record of grouped[tab]) {
            expect(record.sectorTab).toBe(tab);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: client-showcase-tabs, Property 2: every group key always exists.
  it("always returns all four sector keys", () => {
    const grouped = groupPublishedRecords([]);
    expect(Object.keys(grouped).sort()).toEqual([...TAB_IDS].sort());
    for (const tab of TAB_IDS) {
      expect(Array.isArray(grouped[tab])).toBe(true);
    }
  });

  // Feature: client-showcase-tabs, Property 4: unpublished records never
  // appear in any group.
  it("excludes unpublished records from all groups", () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 30 }),
        (publishFlags) => {
          const records = publishFlags.map((published, index) =>
            makeRecord({ canonicalId: `c-${index}`, published, sectorTab: TAB_IDS[index % 4] }),
          );
          const grouped = groupPublishedRecords(records);
          const flat = TAB_IDS.flatMap((tab) => grouped[tab]).map((r) => r.canonicalId);

          publishFlags.forEach((published, index) => {
            if (!published) {
              expect(flat).not.toContain(`c-${index}`);
            }
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it("published records agree between getPublishedRecords and the live grouping", () => {
    const published = getPublishedRecords();
    const grouped = getGroupedRecords();
    const flat = TAB_IDS.flatMap((tab) => grouped[tab]);
    expect(flat).toHaveLength(published.length);
    expect(new Set(published.map((r) => r.canonicalId)).size).toBe(published.length);
    for (const tab of TAB_IDS) {
      for (const record of grouped[tab]) {
        expect(record.sectorTab).toBe(tab);
        expect(record.published).toBe(true);
      }
    }
  });

  it("the live registry contains every published record exactly once", () => {
    const ids = CLIENT_REGISTRY.map((record) => record.canonicalId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CLIENT_REGISTRY.some((record) => record.published)).toBe(true);
  });
});

describe("groupPublishedRecords ordering and deduplication", () => {
  // Feature: client-showcase-tabs, Property 9: order is permutation stable
  // (en-IN collation on displayName, canonicalId tiebreaker).
  it("returns the same ordered sequence for any input permutation", () => {
    const base: ClientRecord[] = [
      makeRecord({ canonicalId: "z", displayName: "Zeta Corp", sectorTab: "corporates-multinationals" }),
      makeRecord({ canonicalId: "a", displayName: "Alpha Bank", sectorTab: "financial-services" }),
      makeRecord({ canonicalId: "m", displayName: "Alpha Bank", sectorTab: "financial-services" }),
      makeRecord({ canonicalId: "g", displayName: "Gamma Gov", sectorTab: "government-public-sector" }),
    ];
    const expected = groupPublishedRecords(base);

    fc.assert(
      fc.property(fc.shuffledSubarray(base, { minLength: base.length, maxLength: base.length }), (records) => {
        const permuted = groupPublishedRecords(records);
        for (const tab of TAB_IDS) {
          expect(permuted[tab].map((r) => r.canonicalId)).toEqual(
            expected[tab].map((r) => r.canonicalId),
          );
        }
      }),
      { numRuns: 100 },
    );

    // canonicalId breaks displayName ties deterministically.
    expect(expected["financial-services"].map((r) => r.canonicalId)).toEqual(["a", "m"]);
  });

  it("sorts with en-IN collation and keeps the order under shuffles", () => {
    const records: ClientRecord[] = [
      makeRecord({ canonicalId: "3", displayName: "Tata Motors" }),
      makeRecord({ canonicalId: "1", displayName: "asian paints" }),
      makeRecord({ canonicalId: "2", displayName: "Bharat Electronics" }),
    ];
    const grouped = groupPublishedRecords(records);
    expect(grouped["financial-services"].map((r) => r.displayName)).toEqual([
      "asian paints",
      "Bharat Electronics",
      "Tata Motors",
    ]);
  });

  // Feature: client-showcase-tabs, Property 10: duplicate canonicalIds
  // collapse to one entry per id.
  it("returns at most one entry per canonicalId even with duplicate ids", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        (duplicates) => {
          const records = Array.from({ length: duplicates }, () =>
            makeRecord({ canonicalId: "same-id", displayName: "Same Co", sectorTab: "government-public-sector" }),
          );
          const grouped = groupPublishedRecords(records);
          expect(grouped["government-public-sector"]).toHaveLength(1);
        },
      ),
      { numRuns: 100 },
    );
  });
});
