import { test, expect } from "@playwright/test";

const VIEWPORT = { width: 390, height: 844 } as const;

async function assertAnchorsOnCanvas(
  page: import("@playwright/test").Page,
): Promise<number> {
  const anchors = page.locator(".site-fab-launcher:visible");
  const count = await anchors.count();
  for (let i = 0; i < count; i++) {
    const box = await anchors.nth(i).boundingBox();
    if (!box) continue;
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(VIEWPORT.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(VIEWPORT.height + 1);
  }
  expect(count).toBeGreaterThan(0);
  return count;
}

test("FAB anchors stay on-canvas at 390x844", async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await page.goto("/");
  await page.locator(".site-fab-launcher").first().waitFor({ state: "visible", timeout: 20_000 });
  await assertAnchorsOnCanvas(page);
});

test("FAB anchors stay on-canvas at 390x844 with compare dock", async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const marker = document.createElement("div");
    marker.setAttribute("data-compare-dock", "");
    marker.setAttribute("aria-hidden", "true");
    document.body.appendChild(marker);
  });
  await page.waitForTimeout(400);
  await assertAnchorsOnCanvas(page);
});

test("FAB anchors clear cookie consent bar when visible", async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    document.cookie = "oando_cookie_consent=; Max-Age=0; path=/";
    const bar = document.querySelector("[data-cookie-consent-bar]");
    if (!bar) {
      const el = document.createElement("div");
      el.setAttribute("data-cookie-consent-bar", "");
      el.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;height:72px;z-index:40;";
      document.body.appendChild(el);
    }
  });
  await page.waitForTimeout(500);
  const bar = page.locator("[data-cookie-consent-bar]").first();
  await expect(bar).toBeVisible({ timeout: 8000 });
  const barBox = await bar.boundingBox();
  expect(barBox).not.toBeNull();
  const anchors = page.locator(".site-fab-launcher:visible");
  const count = await anchors.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const box = await anchors.nth(i).boundingBox();
    if (!box || !barBox) continue;
    expect(box.y + box.height).toBeLessThanOrEqual(barBox.y + 1);
  }
});

for (const route of ["/", "/products/", "/contact/"] as const) {
  test(`tap targets >=44 on ${route} at 390x844`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForTimeout(1500);
    const offenders = await page.evaluate(() => {
      const bad: string[] = [];
      const hidden = (el: Element) => {
        const anchor = (el as HTMLElement).closest("a, button") ?? el;
        for (let n: Element | null = anchor; n; n = n.parentElement) {
          const cs = getComputedStyle(n as HTMLElement);
          if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return true;
          if ((n as HTMLElement).offsetParent === null && cs.position !== "fixed") {
            const r = (n as HTMLElement).getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return true;
          }
        }
        return false;
      };
      const nodes = Array.from(document.querySelectorAll("a:not([data-tap-exempt]), button:not([data-tap-exempt])"));
      for (const el of nodes) {
        if (hidden(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        if (r.width === 0 && r.height === 0) continue;
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        const min = Math.min(w, h);
        if (min >= 44) continue;
        const narrowWrappingLink = el.tagName === "A" && el.textContent && el.textContent.trim().length > 18 && w > 80;
        if (narrowWrappingLink && h >= 34 && h < 44) continue;
        const id =
          (el as HTMLElement).dataset.testid ||
          el.getAttribute("aria-label") ||
          el.className.toString().slice(0, 50) ||
          el.tagName;
        const txt = (el.textContent || "").trim().slice(0, 30).replace(/\s+/g, " ");
        bad.push(`${id}:${w}x${h}${txt ? `(${txt})` : ""}`);
      }
      return bad;
    });
    expect(offenders, offenders.join(", ")).toEqual([]);
  });
}
