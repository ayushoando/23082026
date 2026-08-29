/**
 * R3 — Guest Playwright smoke.
 *
 * Missing base URLs and unavailable servers are hard failures: release evidence
 * must never become green by silently skipping this journey.
 *
 * Run:
 *   pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/planner-guest-smoke.spec.ts
 */
import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

const envBaseURL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  process.env.BASE_URL?.trim() ||
  "";

test.describe("Planner guest smoke (R3)", () => {
  test("guest loads topbar, first-use, or help control", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    const targetBase = (baseURL ?? envBaseURL).trim();
    expect(targetBase, "PLAYWRIGHT_BASE_URL or configured baseURL").not.toBe("");

    const probe = await request.get("/", {
      timeout: 8_000,
      failOnStatusCode: false,
    });
    expect(probe.status(), "guest smoke server status").toBeGreaterThan(0);
    expect(probe.status(), "guest smoke server status").toBeLessThan(500);

    // Uses enterGuestPlannerWorkspace: races topbar/fabric/setup (guest auto-skip OK).
    await enterGuestPlannerWorkspace(page, { projectName: "R3 guest smoke" });

    const shellControl = page.locator(
      [
        '[data-testid="planner-topbar"]',
        '[data-testid="planner-first-use"]',
        '[data-testid="planner-toggle-help"]',
        '[data-testid="planner-toggle-help-desktop"]',
      ].join(", "),
    );
    await expect(shellControl.first()).toBeVisible({ timeout: 45_000 });
  });
});
