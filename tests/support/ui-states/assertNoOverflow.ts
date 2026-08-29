import { expect, type Locator, type Page } from "@playwright/test";

export interface OverflowMetrics {
  readonly clientWidth: number;
  readonly scrollWidth: number;
  readonly overflowPixels: number;
}

export async function measureHorizontalOverflow(target: Page | Locator): Promise<OverflowMetrics> {
  if ("url" in target) {
    return target.evaluate(() => {
      const root = document.documentElement;
      return {
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        overflowPixels: Math.max(0, root.scrollWidth - root.clientWidth),
      };
    });
  }
  return target.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    overflowPixels: Math.max(0, element.scrollWidth - element.clientWidth),
  }));
}

export async function assertNoHorizontalOverflow(target: Page | Locator): Promise<void> {
  const metrics = await measureHorizontalOverflow(target);
  expect(metrics.overflowPixels, JSON.stringify(metrics)).toBe(0);
}
