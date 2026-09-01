//
// Feature: client-showcase-tabs, Properties 7 and 11: empty-sector state and
// card/labelling bijection. Component tests for ClientTabPanel and the
// composed ClientShowcase (plans/client-showcase-tabs task 8.6).

// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import * as fc from "fast-check";
import { ClientTabPanel } from "@/components/site/clients/ClientTabPanel";
import { ClientShowcase } from "@/components/site/clients/ClientShowcase";
import { SECTOR_TABS } from "@/lib/clients/clientRegistry";
import type { ClientRecord, SectorTabId } from "@/lib/clients/clientTypes";

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace: string) =>
    (key: string, values?: Record<string, string | number>) => {
      const templates: Record<string, string> = {
        "showcase.emptySector": "No published clients in {sector} yet.",
      };
      const template = templates[key] ?? `${namespace}.${key}`;
      return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
        String(values?.[name] ?? ""),
      );
    },
}));

const TAB_IDS: SectorTabId[] = SECTOR_TABS.map((tab) => tab.id);

function panelProps(tabId: SectorTabId) {
  const tab = SECTOR_TABS.find((entry) => entry.id === tabId)!;
  return {
    tab,
    panelProps: {
      role: "tabpanel" as const,
      id: tab.panelId,
      "aria-labelledby": tab.tabId,
      hidden: false,
    },
  };
}

function makeRecord(index: number, sectorTab: SectorTabId): ClientRecord {
  return {
    canonicalId: `client-${index}`,
    displayName: `Client ${index} Co`,
    sourceNames: [],
    sectorTab,
    published: true,
  };
}

describe("ClientTabPanel", () => {
  it("renders the labelled empty-sector state when there are no records", () => {
    const { tab, ...props } = panelProps("education-social-impact");
    const { container } = render(
      <ClientTabPanel tab={tab} records={[]} panelProps={props.panelProps} />,
    );

    const status = container.querySelector('[role="status"][aria-live="polite"]');
    expect(status).not.toBeNull();
    expect(status?.textContent).toContain(tab.label);
  });

  it("renders one card per record", () => {
    const { tab, ...props } = panelProps("financial-services");
    const records = [0, 1, 2].map((index) => makeRecord(index, "financial-services"));
    const { container } = render(
      <ClientTabPanel tab={tab} records={records} panelProps={props.panelProps} />,
    );
    expect(container.querySelectorAll("article")).toHaveLength(3);
  });
});

describe("ClientShowcase (composed)", () => {
  const groupedWithOneEmpty: Record<SectorTabId, ClientRecord[]> = {
    "financial-services": [makeRecord(1, "financial-services")],
    "government-public-sector": [makeRecord(2, "government-public-sector")],
    "education-social-impact": [],
    "corporates-multinationals": [makeRecord(3, "corporates-multinationals")],
  };

  it("keeps all four tab buttons present and enabled when a sector is empty", () => {
    const { container } = render(
      <ClientShowcase grouped={groupedWithOneEmpty} tabs={SECTOR_TABS} />,
    );
    const buttons = container.querySelectorAll('[role="tab"]');
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button.hasAttribute("disabled")).toBe(false);
    }
    const emptyPanel = container.querySelector("#panel-education-social-impact");
    expect(emptyPanel?.getAttribute("hidden")).not.toBeNull();
    expect(emptyPanel?.textContent).toContain(
      "No published clients in Education, Social Impact & Development yet.",
    );
  });

  // Feature: client-showcase-tabs, Property 7: the visible cards exactly
  // mirror the published records passed in (no drops, no inventions).
  it("renders an aria-label set equal to the display names passed to each panel", () => {
    fc.assert(
      fc.property(
        fc.record({
          fs: fc.integer({ min: 0, max: 8 }),
          go: fc.integer({ min: 0, max: 8 }),
          ed: fc.integer({ min: 0, max: 8 }),
          co: fc.integer({ min: 0, max: 8 }),
        }),
        (counts) => {
          const grouped = {} as Record<SectorTabId, ClientRecord[]>;
          let next = 0;
          for (const tab of TAB_IDS) {
            const size =
              tab === "financial-services"
                ? counts.fs
                : tab === "government-public-sector"
                  ? counts.go
                  : tab === "education-social-impact"
                    ? counts.ed
                    : counts.co;
            grouped[tab] = Array.from({ length: size }, () => makeRecord(next++, tab));
          }

          const { container } = render(
            <ClientShowcase grouped={grouped} tabs={SECTOR_TABS} />,
          );
          const activeTabId: SectorTabId = "financial-services";
          const activePanel = container.querySelector(`#panel-${activeTabId}`);
          const labels = new Set(
            Array.from(activePanel?.querySelectorAll("article") ?? [])
              .map((article) => article.getAttribute("aria-label") ?? "")
              .filter(Boolean),
          );
          const expected = new Set(grouped[activeTabId].map((record) => record.displayName));
          expect(labels).toEqual(expected);
        },
      ),
      { numRuns: 100 },
    );
  });
});
