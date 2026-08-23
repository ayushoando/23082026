/**
 * Studio phone shell at 390×844. Live testids (no planner imports).
 * There is no studio-mobile-shell — contract is studio-workspace + collapsed docks.
 */
import { expect, test } from "@playwright/test";

const PHONE = { width: 390, height: 844 } as const;

test.describe("Studio phone chrome", () => {
  test.describe.configure({ timeout: 90_000 });

  test("390×844: workspace + canvas visible, docks collapsed, tabs reopen", async ({
    page,
  }) => {
    await page.setViewportSize(PHONE);
    await page.goto("http://localhost:3000/oostudio/");
    await expect(page.getByTestId("studio-workspace")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("studio-canvas")).toBeVisible();
    await expect(page.getByTestId("studio-left-panel")).toHaveAttribute(
      "data-collapsed",
      "true",
    );
    await expect(page.getByTestId("studio-side-panel")).toHaveAttribute(
      "data-collapsed",
      "true",
    );

    await page.getByTestId("dock-tab-color").click();
    await expect(page.getByTestId("studio-left-panel")).toHaveAttribute(
      "data-collapsed",
      "false",
    );

    await page.getByTestId("dock-tab-props").click();
    await expect(page.getByTestId("studio-side-panel")).toHaveAttribute(
      "data-collapsed",
      "false",
    );

    const shell = page.getByTestId("studio-workspace");
    const metrics = await shell.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });
});
