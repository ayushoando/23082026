/**
 * Client Showcase — data layer, components, section integration, and layout.
 *
 * Feature: client-showcase-tabs
 * Covers spec Tasks 1 (registry data layer), 3 (leaf components), 4 (panel
 * composition), 5 (page-level RSC wrapper) and 9.2 (layout browser checks at
 * 320/768/1280/1440/1920px).
 *
 * Browser evidence: fresh run against http://localhost:3000/clients/.
 */

import { expect, test, type Page } from "@playwright/test";

const SECTORS = [
  { id: "financial-services", label: "Financial Services" },
  { id: "government-public-sector", label: "Government & Public Sector" },
  {
    id: "education-social-impact",
    label: "Education, Social Impact & Development",
  },
  { id: "corporates-multinationals", label: "Corporates & Multinationals" },
] as const;

const SECTION_HEADING = "Our Clients";

async function openClientsPage(page: Page): Promise<void> {
  await page.goto("/clients/");
  await expect(
    page.getByRole("heading", { name: SECTION_HEADING }),
  ).toBeVisible();
}

async function activePanel(page: Page, sectorId: string) {
  const tabButton = page.locator(`#tab-${sectorId}`);
  await tabButton.click();
  const panel = page.locator(`#panel-${sectorId}`);
  await expect(panel).toBeVisible();
  return panel;
}

test.describe("Feature: client-showcase-tabs — data layer and registry (Task 1)", () => {
  test("renders exactly four sector tabs in the required IA order", async ({
    page,
  }) => {
    await openClientsPage(page);

    const tabs = page.getByRole("tablist").getByRole("tab");
    await expect(tabs).toHaveCount(4);
    for (const [index, sector] of SECTORS.entries()) {
      await expect(tabs.nth(index)).toHaveText(sector.label);
      await expect(tabs.nth(index)).toHaveAttribute(
        "aria-controls",
        `panel-${sector.id}`,
      );
    }
  });

  test("published records appear under their own sector panel only", async ({
    page,
  }) => {
    await openClientsPage(page);

    const financial = await activePanel(page, "financial-services");
    await expect(financial.locator("article")).not.toHaveCount(0);
    await expect(
      financial.locator('article[aria-label="HDFC"]'),
    ).toHaveCount(1);

    const government = await activePanel(page, "government-public-sector");
    await expect(
      government.locator('article[aria-label="Bihar State Power Holding Company Limited"]'),
    ).toHaveCount(1);

    const education = await activePanel(page, "education-social-impact");
    await expect(
      education.locator('article[aria-label="D. Goenka School"]'),
    ).toHaveCount(1);

    const corporates = await activePanel(page, "corporates-multinationals");
    await expect(
      corporates.locator('article[aria-label="Tata Motors"]'),
    ).toHaveCount(1);

    // Registry invariants: canonical ids are unique and only published records
    // are grouped (no duplicate aria-labels within an active panel).
    for (const sector of SECTORS) {
      const panel = await activePanel(page, sector.id);
      const labels = await panel.locator("article").evaluateAll((cards) =>
        cards.map((card) => card.getAttribute("aria-label")),
      );
      expect(new Set(labels).size).toBe(labels.length);
    }
  });
});

test.describe("Feature: client-showcase-tabs — leaf components (Tasks 3, 4)", () => {
  test("cards expose the display name as aria-label and visible text", async ({
    page,
  }) => {
    await openClientsPage(page);

    const financial = await activePanel(page, "financial-services");
    const hdfc = financial.locator('article[aria-label="HDFC"]');
    await expect(hdfc).toBeVisible();
    await expect(hdfc).toContainText("HDFC");
  });

  test("records with a logo render an img; records without one render initials", async ({
    page,
  }) => {
    await openClientsPage(page);

    // DMRC is published without a logoPath — the logo area must show the
    // initials fallback (two-word algorithm → "DM") and no <img>.
    const government = await activePanel(page, "government-public-sector");
    const dmrc = government.locator('article[aria-label="DMRC"]');
    await expect(dmrc).toHaveCount(1);
    await expect(dmrc.locator("img")).toHaveCount(0);
    await expect(dmrc).toContainText("DM");

    // BSPHCL ships a curated logo path — an <img> must be present in the DOM.
    const bsphcl = government.locator(
      'article[aria-label="Bihar State Power Holding Company Limited"]',
    );
    await expect(bsphcl.locator("img")).toHaveCount(1);
  });

  test("inactive sector panels stay hidden with correct ARIA wiring", async ({
    page,
  }) => {
    await openClientsPage(page);

    for (const sector of SECTORS.slice(1)) {
      await expect(page.locator(`#panel-${sector.id}`)).toBeHidden();
    }
    await expect(page.locator("#panel-financial-services")).toBeVisible();
    await expect(page.locator("#panel-financial-services")).toHaveAttribute(
      "role",
      "tabpanel",
    );
    await expect(page.locator("#panel-financial-services")).toHaveAttribute(
      "aria-labelledby",
      "tab-financial-services",
    );
  });
});

test.describe("Feature: client-showcase-tabs — section integration (Task 5)", () => {
  test("showcase section is labeled, headed, and rendered on /clients/", async ({
    page,
  }) => {
    await openClientsPage(page);

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: SECTION_HEADING }),
    });
    await expect(section).toHaveCount(1);
    await expect(
      section.getByRole("tablist", { name: "Client industry sectors" }),
    ).toBeVisible();
  });
});

test.describe("Feature: client-showcase-tabs — layout checks (Task 9.2)", () => {
  test("auto-fill grid column count grows with viewport width", async ({
    page,
  }) => {
    const columnCountAt = async (width: number): Promise<number> => {
      await page.setViewportSize({ width, height: 900 });
      await openClientsPage(page);
      const panel = await activePanel(page, "financial-services");
      return panel
        .locator("article")
        .first()
        .evaluate((card) => {
          const grid = card.parentElement;
          if (!grid) return 0;
          const template = getComputedStyle(grid).gridTemplateColumns;
          return template.split(" ").filter(Boolean).length;
        });
    };

    const at320 = await columnCountAt(320);
    const at1280 = await columnCountAt(1280);
    const at1920 = await columnCountAt(1920);
    expect(at320).toBeGreaterThan(0);
    expect(at1280).toBeGreaterThan(at320);
    expect(at1920).toBeGreaterThanOrEqual(at1280);
  });

  for (const width of [320, 768, 1280, 1440, 1920]) {
    test(`no horizontal page scrollbar and centered section at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await openClientsPage(page);

      const scrollWidth = await page.evaluate(
        () => document.scrollingElement?.scrollWidth ?? 0,
      );
      expect(scrollWidth).toBeLessThanOrEqual(width);

      const centered = await page.evaluate(() => {
        const section = document.querySelector("section");
        if (!section) return null;
        const rect = section.getBoundingClientRect();
        const left = rect.left;
        const right = window.innerWidth - rect.right;
        return { left, right, delta: Math.abs(left - right) };
      });
      expect(centered).not.toBeNull();
      expect(centered!.delta).toBeLessThanOrEqual(1);

      // No card or tab element overflows the container boundary.
      const overflow = await page.evaluate(() => {
        const section = document.querySelector("section");
        if (!section) return 0;
        const containerRight = section.getBoundingClientRect().right;
        const cards = Array.from(
          section.querySelectorAll<HTMLElement>("article, [role='tab']"),
        );
        return cards.filter(
          (card) => card.getBoundingClientRect().right > containerRight + 1,
        ).length;
      });
      expect(overflow).toBe(0);
    });
  }
});
