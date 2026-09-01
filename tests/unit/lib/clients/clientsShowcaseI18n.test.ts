// @vitest-environment node
//
// Feature: client-showcase-tabs i18n + live-page guard (2026-09-01/02 fixes)
//
// The sector showcase renders clients.showcase.sectionHeading and
// clients.showcase.emptySector ({sector} interpolated from SECTOR_TABS
// labels — see ClientTabPanel/SectorTabButton). These tests pin the copy
// contract in BOTH en.json and hi.json and prove the live registry cannot
// produce an empty tab today.

import { describe, expect, it } from "vitest";

import enMessages from "@/i18n/messages/en.json";
import hiMessages from "@/i18n/messages/hi.json";
import {
  SECTOR_TABS,
  getGroupedRecords,
  getPublishedRecords,
} from "@/lib/clients/clientRegistry";

type ShowcaseCopy = Record<string, string | undefined>;
type MessageBundle = { clients?: { showcase?: ShowcaseCopy } };

const bundles: Record<"en" | "hi", MessageBundle> = {
  en: enMessages as MessageBundle,
  hi: hiMessages as MessageBundle,
};

function showcaseOf(locale: "en" | "hi"): ShowcaseCopy {
  const showcase = bundles[locale].clients?.showcase;
  expect(showcase, `clients.showcase missing in ${locale}.json`).toBeDefined();
  return showcase ?? {};
}

function countPlaceholder(text: string, token: string): number {
  return text.split(token).length - 1;
}

const REQUIRED_KEYS = ["sectionHeading", "emptySector"] as const;
const EXPECTED_TAB_IDS = [
  "financial-services",
  "government-public-sector",
  "education-social-impact",
  "corporates-multinationals",
] as const;

describe("clients.showcase i18n copy", () => {
  for (const locale of ["en", "hi"] as const) {
    describe(`${locale}.json`, () => {
      it("contains non-empty sectionHeading and emptySector", () => {
        const showcase = showcaseOf(locale);
        for (const key of REQUIRED_KEYS) {
          const value = showcase[key];
          expect(
            typeof value === "string" && value.trim().length > 0,
            `clients.showcase.${key} must be a non-empty string in ${locale}.json`,
          ).toBe(true);
        }
      });

      it("interpolates {sector} exactly once (in emptySector, not sectionHeading)", () => {
        const showcase = showcaseOf(locale);
        const total = REQUIRED_KEYS.reduce(
          (sum, key) =>
            sum + countPlaceholder(showcase[key] ?? "", "{sector}"),
          0,
        );
        expect(total).toBe(1);
        expect(countPlaceholder(showcase.emptySector ?? "", "{sector}")).toBe(
          1,
        );
        expect(countPlaceholder(showcase.sectionHeading ?? "", "{sector}")).toBe(
          0,
        );
      });
    });
  }

  it("keeps en and hi showcase key sets identical", () => {
    expect(Object.keys(showcaseOf("hi")).sort()).toEqual(
      Object.keys(showcaseOf("en")).sort(),
    );
  });

  it("does not hardcode any SECTOR_TABS label in the showcase copy", () => {
    // Tab labels come from SECTOR_TABS meta and are passed through {sector};
    // baking a label into the translation would drift the two sources.
    for (const locale of ["en", "hi"] as const) {
      const serialized = JSON.stringify(showcaseOf(locale));
      for (const tab of SECTOR_TABS) {
        expect(
          serialized.includes(tab.label),
          `${locale} showcase copy must not hardcode label "${tab.label}"`,
        ).toBe(false);
      }
    }
  });
});

describe("live showcase grouping (no empty tab on the page)", () => {
  it("SECTOR_TABS is exactly the four agreed sector ids with non-empty labels", () => {
    expect(SECTOR_TABS.map((tab) => tab.id)).toEqual([...EXPECTED_TAB_IDS]);
    for (const tab of SECTOR_TABS) {
      expect(tab.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("getGroupedRecords keys === SECTOR_TABS ids", () => {
    const grouped = getGroupedRecords();
    expect(Object.keys(grouped)).toEqual(SECTOR_TABS.map((tab) => tab.id));
  });

  it("every sector tab currently has at least one published record", () => {
    const grouped = getGroupedRecords();
    for (const tab of SECTOR_TABS) {
      expect(
        grouped[tab.id].length,
        `tab "${tab.id}" would render emptySector on the live page`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("every published record's sectorTab resolves to grouped content", () => {
    const grouped = getGroupedRecords();
    const tabIds = new Set<string>(SECTOR_TABS.map((tab) => tab.id));
    for (const record of getPublishedRecords()) {
      expect(tabIds.has(record.sectorTab)).toBe(true);
      expect(
        grouped[record.sectorTab].some(
          (entry) => entry.canonicalId === record.canonicalId,
        ),
      ).toBe(true);
    }
  });
});
