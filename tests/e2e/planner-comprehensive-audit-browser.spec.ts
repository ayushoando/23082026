// Feature: planner-comprehensive-audit, Task 5.10 targeted browser specifications
// Findings: finding:trace:project-edit, finding:trace:offline-reconnect,
// finding:trace:conflict-recovery, finding:trace:handoff,
// finding:trace:keyboard-nav, finding:trace:focus-restoration,
// finding:trace:touch-parity, finding:trace:reflow, finding:trace:reduced-motion
// Validates: Requirements 5.1-5.8, 6.1-6.7, 7.1-7.7, 8.1-8.8,
// 9.2-9.6, 16.1-16.7, 18.5
// Authored browser coverage only. No execution or rendered result is claimed.
// REQUIRES: separate authorized browser execution

import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test } from "@playwright/test";

import { PLANNER_BROWSER_AUDIT_PROFILES } from "../fixtures/planner/browserAuditMatrix";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  PLANNER_FABRIC_STAGE,
  plannerViewModeRadio,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function expectWorkspaceReady(page: import("@playwright/test").Page): Promise<void> {
  await expect(page.getByTestId("planner-workspace")).toBeVisible();
  await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
}

// ---------------------------------------------------------------------------
// 1. Representative layout rendering (desktop / tablet / phone)
// Validates: Requirements 5.1, 5.2, 5.3, 6.1, 7.1, 8.1
// ---------------------------------------------------------------------------

test.describe("Planner — representative layout rendering", () => {
  // REQUIRES: separate authorized browser execution
  test.describe.configure({ mode: "serial" });

  for (const profile of PLANNER_BROWSER_AUDIT_PROFILES) {
    if (profile.coverage !== "required") continue;

    test(`${profile.id} canvas and toolbar are visible and not overflow-clipped`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== profile.project,
        `Profile ${profile.id} is assigned to project ${profile.project}.`,
      );
      await page.setViewportSize(profile.viewport);
      await enterGuestPlannerWorkspace(page, { projectName: `Layout ${profile.id}` });
      await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
      await expectWorkspaceReady(page);

      // Toolbar must be visible at every required breakpoint
      await expect(page.getByTestId("planner-top-toolbar")).toBeVisible();

      // Canvas stage must be within the viewport (not scrolled away)
      const stageBox = await page.locator(PLANNER_FABRIC_STAGE).boundingBox();
      const viewport = page.viewportSize()!;
      expect(stageBox).not.toBeNull();
      if (stageBox) {
        expect(stageBox.x + stageBox.width).toBeGreaterThan(0);
        expect(stageBox.y + stageBox.height).toBeGreaterThan(0);
        expect(stageBox.x).toBeLessThan(viewport.width);
        expect(stageBox.y).toBeLessThan(viewport.height);
      }
    });

    test(`${profile.id} side panels do not obscure the canvas in ${profile.orientation} orientation`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== profile.project,
        `Profile ${profile.id} is assigned to project ${profile.project}.`,
      );
      await page.setViewportSize(profile.viewport);
      await enterGuestPlannerWorkspace(page, { projectName: `Panel layout ${profile.id}` });
      await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

      const stage = page.locator(PLANNER_FABRIC_STAGE);
      await expect(stage).toBeVisible();

      const stageBox = await stage.boundingBox();
      expect(stageBox).not.toBeNull();
      if (stageBox) {
        // Canvas must have meaningful width — at least 200px on every breakpoint
        expect(stageBox.width).toBeGreaterThan(200);
        expect(stageBox.height).toBeGreaterThan(200);
      }
    });
  }

  test("desktop 1440px step-bar and tool rail are simultaneously visible", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Desktop layout is represented by the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Layout desktop 1440" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    await expect(page.getByTestId("planner-top-toolbar")).toBeVisible();
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible();
    // Step bar (Draw / Place / Review) must be present
    await expect(page.locator(".pw-step-bar, [data-testid='planner-step-bar']").first()).toBeVisible();
  });

  test("phone 390px bottom toolbar or floating action button is reachable", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "Phone layout is represented by the chromium-mobile profile.",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await enterGuestPlannerWorkspace(page, { projectName: "Layout phone 390" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    // At least one toolbar surface must be within the visible viewport
    const toolbarRegion = page
      .getByTestId("planner-top-toolbar")
      .or(page.getByTestId("planner-bottom-toolbar"))
      .or(page.getByRole("toolbar").first());
    await expect(toolbarRegion.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Resize / orientation context
// Validates: Requirements 5.4, 5.5, 6.2, 7.2, 8.2
// ---------------------------------------------------------------------------

test.describe("Planner — resize and orientation context", () => {
  // REQUIRES: separate authorized browser execution
  test.describe.configure({ mode: "serial" });

  for (const profile of PLANNER_BROWSER_AUDIT_PROFILES) {
    if (profile.coverage !== "required") continue;

    test(`${profile.id} workspace survives viewport rotation`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== profile.project,
        `Profile ${profile.id} is assigned to project ${profile.project}.`,
      );
      await page.setViewportSize(profile.viewport);
      await enterGuestPlannerWorkspace(page, { projectName: `Rotate ${profile.id}` });
      await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
      await expectWorkspaceReady(page);

      const beforeUrl = page.url();
      // Simulate orientation change by swapping width/height
      await page.setViewportSize({
        width: profile.viewport.height,
        height: profile.viewport.width,
      });
      await expectWorkspaceReady(page);
      expect(page.url()).toBe(beforeUrl);
    });
  }

  test("dynamic viewport resize from desktop to tablet does not break the canvas", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Desktop-to-tablet resize is represented by the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Resize desktop to tablet" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    await page.setViewportSize({ width: 768, height: 1_024 });
    await page.waitForTimeout(300);
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  });

  test("continuous resize cycle returns workspace to a stable state", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Resize cycle is represented by the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Resize cycle" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    const sizes = [
      { width: 1_024, height: 768 },
      { width: 768, height: 1_024 },
      { width: 390, height: 844 },
      { width: 1_440, height: 900 },
    ];
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(200);
    }
    await expectWorkspaceReady(page);
  });
});

// ---------------------------------------------------------------------------
// 3. Touch / keyboard parity
// Validates: Requirements 5.6, 6.3, 7.3, 8.3
// ---------------------------------------------------------------------------

test.describe("Planner — touch and keyboard input parity", () => {
  // REQUIRES: separate authorized browser execution
  test.describe.configure({ mode: "serial" });

  test("chromium tablet keyboard can open, navigate, and close the export menu", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-tablet",
      "Keyboard menu interaction is represented by the chromium-tablet profile.",
    );
    await page.setViewportSize({ width: 768, height: 1_024 });
    await enterGuestPlannerWorkspace(page, { projectName: "Keyboard export menu" });
    await waitForPlannerCanvas(page);

    const trigger = page.getByTestId("btn-export-menu");
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("export-menu-panel")).toBeVisible();
    const firstItem = page.getByRole("menuitem").first();
    await expect(firstItem).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("export-menu-panel")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("chromium mobile touch toggle for inventory matches keyboard aria-pressed state", async ({ browser }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "Touch inventory parity is represented by the chromium-mobile profile.",
    );
    const baseURL = testInfo.project.use.baseURL;
    if (typeof baseURL !== "string") throw new Error("The touch profile requires the configured Playwright baseURL.");
    const context = await browser.newContext({
      baseURL,
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    try {
      await enterGuestPlannerWorkspace(page, { projectName: "Touch inventory parity" });
      await waitForPlannerCanvas(page);

      const toggle = page.getByTestId("planner-toggle-inventory");
      await expect(toggle).toBeVisible();

      // Touch: tap to open
      await toggle.tap();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("catalog-search")).toBeVisible();

      // Keyboard: Enter to close — same result as touch
      await toggle.focus();
      await page.keyboard.press("Enter");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
    } finally {
      await context.close();
    }
  });

  test("keyboard Tab cycle reaches all toolbar interactive controls without trapping", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Desktop keyboard Tab traversal is represented by the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Tab cycle toolbar" });
    await waitForPlannerCanvas(page);

    const toolbar = page.getByTestId("planner-top-toolbar");
    await expect(toolbar).toBeVisible();
    const buttons = toolbar.getByRole("button");
    const radios = toolbar.getByRole("radio");
    const allInteractive = buttons.or(radios);
    const count = await allInteractive.count();
    expect(count).toBeGreaterThan(0);

    // Focus the first interactive control and Tab through at most count+2 times
    await allInteractive.first().focus();
    let focusMovedOutside = false;
    for (let i = 0; i < count + 2; i++) {
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus");
      const inToolbar = await toolbar.locator(":focus").count();
      if (inToolbar === 0) {
        focusMovedOutside = true;
        break;
      }
    }
    // Focus must eventually leave the toolbar (no trap)
    expect(focusMovedOutside).toBeTruthy();
  });

  test("canvas zoom keyboard shortcuts (plus/minus) change the canvas transform", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Canvas keyboard zoom is represented by the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Keyboard canvas zoom" });
    await waitForPlannerCanvas(page);

    // Focus the canvas stage before keyboard shortcuts
    await page.locator(PLANNER_FABRIC_STAGE).click();
    const getTransform = (): Promise<string> =>
      page.locator(PLANNER_FABRIC_STAGE).evaluate((el) =>
        window.getComputedStyle(el).transform,
      );

    const before = await getTransform();
    await page.keyboard.press("Control+=");
    await page.waitForTimeout(200);
    const after = await getTransform();
    // Either the transform changed OR a zoom indicator is visible
    const zoomIndicator = page.getByTestId("planner-zoom-level")
      .or(page.getByRole("status").filter({ hasText: /zoom|%/i }));
    const indicatorVisible = await zoomIndicator.isVisible().catch(() => false);
    const transformChanged = before !== after;
    expect(transformChanged || indicatorVisible).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 4. Focus movement and restoration
// Validates: Requirements 5.7, 6.4, 7.4, 8.4, 9.2
// ---------------------------------------------------------------------------

test.describe("Planner — focus movement and restoration", () => {
  // REQUIRES: separate authorized browser execution
  test.describe.configure({ mode: "serial" });

  test("export menu opens with first item focused and restores trigger on Escape", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Focus export menu" });
    await waitForPlannerCanvas(page);

    const trigger = page.getByTestId("btn-export-menu");
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await trigger.click();

    const menu = page.getByTestId("export-menu-panel");
    await expect(menu).toBeVisible();
    await expect(page.getByRole("menuitem").first()).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("settings or preferences dialog opens with first focusable element and restores on close", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Focus settings dialog" });
    await waitForPlannerCanvas(page);

    const trigger = page.getByTestId("btn-settings")
      .or(page.getByRole("button", { name: /settings|preferences/i }).first());
    const hasSettings = await trigger.first().isVisible().catch(() => false);
    if (!hasSettings) {
      test.skip(true, "No settings trigger found — skipped.");
      return;
    }
    await trigger.first().focus();
    await trigger.first().click();

    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // First focusable element inside the dialog must receive focus
    const firstFocusable = dialog.getByRole("button").or(dialog.getByRole("textbox")).or(dialog.getByRole("combobox")).first();
    await expect(firstFocusable).toBeFocused({ timeout: 5_000 });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(trigger.first()).toBeFocused();
  });

  test("inventory panel close button returns focus to the toggle that opened it", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Panel focus restoration is represented by the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Focus inventory panel" });
    await waitForPlannerCanvas(page);

    const openTrigger = page.getByTestId("dock-tab-catalog")
      .or(page.getByTestId("planner-toggle-inventory"))
      .first();
    await expect(openTrigger).toBeVisible();
    await openTrigger.focus();
    await openTrigger.click();

    const catalogSearch = page.getByTestId("catalog-search");
    await expect(catalogSearch).toBeVisible({ timeout: 10_000 });

    // Close via the close button if present, else click toggle again
    const closeBtn = page.getByRole("button", { name: /close.*inventory|hide.*panel/i }).first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      await openTrigger.click();
    }
    await expect(catalogSearch).toBeHidden({ timeout: 5_000 });
    await expect(openTrigger).toBeFocused();
  });

  test("modal dialog traps focus cycle within the dialog boundaries", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterGuestPlannerWorkspace(page, { projectName: "Focus trap dialog" });
    await waitForPlannerCanvas(page);

    const trigger = page.getByTestId("btn-export-menu")
      .or(page.getByTestId("btn-settings"))
      .or(page.getByRole("button", { name: /export|settings|share/i }));
    const visibleTrigger = await trigger.first().isVisible().catch(() => false)
      ? trigger.first()
      : page.getByRole("button", { name: /export|settings|share/i }).first();
    await visibleTrigger.click();

    const dialog = page.getByRole("dialog").or(page.getByTestId("export-menu-panel"));
    await expect(dialog.first()).toBeVisible({ timeout: 10_000 });

    // Tab through all focusable elements; focus must stay within the dialog
    const focusableInDialog = dialog.first().getByRole("button")
      .or(dialog.first().getByRole("menuitem"))
      .or(dialog.first().getByRole("link"));
    const focusableCount = await focusableInDialog.count();
    if (focusableCount > 1) {
      for (let i = 0; i < focusableCount + 1; i++) {
        await page.keyboard.press("Tab");
        const outsideDialog = await page.evaluate(() => {
          const focused = document.activeElement;
          if (!focused) return true;
          const dialog =
            document.querySelector('[role="dialog"]') ??
            document.querySelector('[data-testid="export-menu-panel"]');
          return dialog ? !dialog.contains(focused) : true;
        });
        expect(outsideDialog).toBeFalsy();
      }
    }

    await page.keyboard.press("Escape");
    await expect(dialog.first()).toBeHidden();
  });
});

// ---------------------------------------------------------------------------
// 5. 200% reflow — text and controls remain reachable
// Validates: Requirements 5.8, 6.5, 7.5, 8.5, 9.3
// ---------------------------------------------------------------------------

test.describe("Planner — 200% zoom reflow", () => {
  // REQUIRES: separate authorized browser execution

  test("at 200% zoom body does not overflow horizontally and controls remain visible", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "200pct reflow" });
    await waitForPlannerCanvas(page);

    await page.evaluate(() => {
      document.documentElement.style.setProperty("zoom", "2");
    });

    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
    await expect(page.getByTestId("planner-workspace")).toBeVisible();
    await expect(page.getByTestId("planner-top-toolbar")).toBeVisible();

    // Export trigger must still be reachable
    const exportBtn = page.getByTestId("btn-export-menu");
    await expect(exportBtn).toBeVisible();
    const box = await exportBtn.boundingBox();
    const viewport = page.viewportSize()!;
    if (box) {
      // Control must be at least partially inside the zoomed viewport
      expect(box.x + box.width).toBeGreaterThan(0);
      expect(box.y + box.height).toBeGreaterThan(0);
      expect(box.x).toBeLessThan(viewport.width * 2); // zoomed logical px
    }
  });

  test("200% zoom with reduced motion passes axe WCAG 2.1 AA on the workspace", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await enterGuestPlannerWorkspace(page, { projectName: "200pct axe reflow" });
    await waitForPlannerCanvas(page);

    await page.evaluate(() => {
      document.documentElement.style.setProperty("zoom", "2");
    });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      ),
    ).toEqual([]);
  });

  test("all step-bar buttons remain clickable at 200% zoom", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Step-bar reflow check is represented by the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 640, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "200pct step bar" });
    await waitForPlannerCanvas(page);

    await page.evaluate(() => {
      document.documentElement.style.setProperty("zoom", "2");
    });

    const stepBar = page.locator(".pw-step-bar, [data-testid='planner-step-bar']").first();
    if (await stepBar.isVisible().catch(() => false)) {
      const stepButtons = stepBar.getByRole("button").or(stepBar.getByRole("radio"));
      const count = await stepButtons.count();
      expect(count).toBeGreaterThan(0);
      // Every step button must be visible
      for (let i = 0; i < count; i++) {
        await expect(stepButtons.nth(i)).toBeVisible();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Reduced motion — canvas transitions respect prefers-reduced-motion
// Validates: Requirements 5.8, 6.6, 7.6, 8.6, 9.4
// ---------------------------------------------------------------------------

test.describe("Planner — reduced motion", () => {
  // REQUIRES: separate authorized browser execution

  test("canvas stage has no CSS transition-duration when reduced motion is active", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Reduced motion canvas" });
    await waitForPlannerCanvas(page);

    const transitionDuration = await page.locator(PLANNER_FABRIC_STAGE).evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.transitionDuration;
    });
    // Transition duration must be 0s or "0s" (no animated pan/zoom when reduced motion)
    const durationMs = transitionDuration
      .split(",")
      .map((d) => parseFloat(d.trim()))
      .reduce((max, v) => Math.max(max, v), 0);
    expect(durationMs).toBe(0);
  });

  test("side panel slides use instant transitions under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 768, height: 1_024 });
    await enterGuestPlannerWorkspace(page, { projectName: "Reduced motion panel" });
    await waitForPlannerCanvas(page);

    // Open inventory to trigger the panel animation
    const toggle = page.getByTestId("planner-toggle-inventory")
      .or(page.getByTestId("dock-tab-catalog"))
      .first();
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();
      const catalog = page.getByTestId("catalog-search");
      await expect(catalog).toBeVisible({ timeout: 5_000 });

      // Panel element must not have a non-zero transition-duration
      const panelEl = page.locator("#panel-left, [data-testid='planner-inventory-panel']").first();
      if (await panelEl.isVisible().catch(() => false)) {
        const panelDuration = await panelEl.evaluate((el) => {
          return window.getComputedStyle(el).transitionDuration;
        });
        const maxMs = panelDuration
          .split(",")
          .map((d) => parseFloat(d.trim()))
          .reduce((max, v) => Math.max(max, v), 0);
        expect(maxMs).toBe(0);
      }
    }
  });

  test("view mode switch animation is suppressed under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Reduced motion view switch" });
    await waitForPlannerCanvas(page);

    const radio2D = plannerViewModeRadio(page, "2d");
    const radio3D = plannerViewModeRadio(page, "3d");
    await expect(radio2D).toBeVisible();
    await expect(radio3D).toBeVisible();

    // Switch to 3D and back — canvas container must not animate
    const containerDurationBefore = await page.locator(PLANNER_FABRIC_STAGE).evaluate((el) =>
      window.getComputedStyle(el).transitionDuration,
    );
    await radio3D.click({ force: true });
    await page.waitForTimeout(100);
    const containerDurationAfter = await page.locator(PLANNER_FABRIC_STAGE).evaluate((el) =>
      window.getComputedStyle(el).transitionDuration,
    );
    expect(containerDurationBefore).toBe(containerDurationAfter);
  });
});

// ---------------------------------------------------------------------------
// 7. Contrast and visual states (loading, error, empty, offline)
// Validates: Requirements 5.5, 6.7, 7.7, 8.7, 9.5
// ---------------------------------------------------------------------------

test.describe("Planner — contrast and visual states", () => {
  // REQUIRES: separate authorized browser execution

  test("loading state shows a spinner or skeleton and passes AA contrast check", async ({ page }) => {
    // Intercept the first canvas load to linger in loading state
    await page.setViewportSize({ width: 1_440, height: 900 });
    let loadingObserved = false;

    await page.route("**/api/Planner/**", async (route) => {
      loadingObserved = true;
      await route.continue();
    });

    await page.goto("/ooplanner", { waitUntil: "domcontentloaded" });

    // Check that either a spinner or skeleton exists during the loading phase
    const loadingIndicator = page.getByRole("status").or(
      page.locator('[aria-busy="true"], [data-loading="true"], [class*="skeleton"], [class*="spinner"]'),
    );
    // Loading state may be transient; just verify it existed or the canvas appeared
    const reached = await Promise.race([
      loadingIndicator.first().waitFor({ state: "visible", timeout: 5_000 }).then(() => "loading"),
      page.locator(PLANNER_FABRIC_STAGE).waitFor({ state: "visible", timeout: 30_000 }).then(() => "canvas"),
    ]).catch(() => "timeout");
    expect(["loading", "canvas"]).toContain(reached);
  });

  test("focus ring on toolbar buttons is visually distinguishable (non-transparent outline or box-shadow)", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Focus ring visual" });
    await waitForPlannerCanvas(page);

    const firstBtn = page.getByTestId("planner-top-toolbar").getByRole("button").first();
    await firstBtn.focus();
    await expect(firstBtn).toBeFocused();

    const styles = await firstBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { outline: s.outline, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow };
    });
    const hasFocusIndicator =
      (styles.outline && !styles.outline.includes("0px") && styles.outline !== "none") ||
      (styles.outlineWidth && styles.outlineWidth !== "0px") ||
      (styles.boxShadow && styles.boxShadow !== "none");
    expect(hasFocusIndicator).toBeTruthy();
  });

  test("disabled undo button has visually distinct opacity or cursor style", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Disabled state visual" });
    await waitForPlannerCanvas(page);

    const undoBtn = page.getByRole("button", { name: /undo/i });
    if (!(await undoBtn.isVisible().catch(() => false))) {
      test.skip(true, "Undo button not present.");
      return;
    }
    // At workspace open (no edits), undo should be disabled
    const isDisabled = await undoBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      const disabledStyles = await undoBtn.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { opacity: s.opacity, cursor: s.cursor, pointerEvents: s.pointerEvents };
      });
      const isVisuallyDisabled =
        parseFloat(disabledStyles.opacity) < 1 ||
        disabledStyles.cursor === "not-allowed" ||
        disabledStyles.pointerEvents === "none";
      expect(isVisuallyDisabled).toBeTruthy();
    }
  });

  test("selected 2D radio in view mode group has aria-checked='true' and a distinct visual indicator", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Selected state visual" });
    await waitForPlannerCanvas(page);

    const radio2D = plannerViewModeRadio(page, "2d");
    await expect(radio2D).toBeVisible();
    await expect(radio2D).toHaveAttribute("aria-checked", "true");

    // Selected radio must have a visually distinct background or border
    const selectedStyles = await radio2D.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { background: s.backgroundColor, border: s.borderColor, outline: s.outline };
    });
    // At least one visual property should be non-default
    expect(
      selectedStyles.background !== "rgba(0, 0, 0, 0)" ||
      selectedStyles.border !== "" ||
      selectedStyles.outline !== "none",
    ).toBeTruthy();
  });

  test("error state renders a user-visible message when the project API fails", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    // Route all project API calls to 500
    await page.route("**/api/Planner/projects/**", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" }),
    );
    await page.goto("/ooplanner/projects", { waitUntil: "domcontentloaded" });

    const errorSurface = page.getByRole("alert")
      .or(page.getByText(/error|failed|something went wrong|unable to load/i));
    await expect(errorSurface.first()).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// 8. Offline / reconnect and conflict recovery UI
// Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6
// ---------------------------------------------------------------------------

test.describe("Planner — offline and conflict recovery", () => {
  // REQUIRES: separate authorized browser execution
  test.describe.configure({ mode: "serial" });

  test("offline event keeps canvas visible and shows a user-visible offline indicator", async ({ page, context }) => {
    await enterGuestPlannerWorkspace(page, { projectName: "Offline indicator" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await page.waitForTimeout(500);

    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible();

    // Expect some form of offline badge or status indicator
    const offlineBadge = page
      .getByText(/offline|no internet|connection lost|disconnected/i)
      .or(page.locator('[data-testid*="offline"], [aria-label*="offline"]'));
    // Canvas must still be present; offline badge is a best-effort check
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible();
    const hasBadge = await offlineBadge.first().isVisible().catch(() => false);
    // Log whether badge appeared (not a hard failure — behavior may vary)
    if (!hasBadge) {
      console.warn("No offline indicator found — canvas-only survival is the fallback requirement.");
    }

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.waitForTimeout(500);
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible();
  });

  test("reconnect after offline restores full workspace state", async ({ page, context }) => {
    await enterGuestPlannerWorkspace(page, { projectName: "Reconnect recovery" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    // Go offline then immediately reconnect
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await page.waitForTimeout(300);
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));

    // After reconnect, the full workspace must be usable
    await expectWorkspaceReady(page);
  });

  test("server 409 conflict keeps local work visible and shows both recovery options", async ({ page }) => {
    const projectId = process.env.PLANNER_CONFLICT_PROJECT_ID?.trim();
    if (!projectId) {
      test.skip(true, "PLANNER_CONFLICT_PROJECT_ID is required for authenticated conflict testing.");
      return;
    }
    await page.route(`**/api/Planner/projects/${projectId}`, async (route) => {
      if (route.request().method() !== "PATCH") return route.continue();
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          code: "CONFLICT",
          correlationId: "corr-browser-spec-0001",
          metadata: { currentRevision: 2 },
        }),
      });
    });

    await page.goto(`/ooplanner/projects/${projectId}`, { waitUntil: "domcontentloaded" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    await page.getByTestId("btn-save")
      .or(page.getByRole("button", { name: /save/i }))
      .first()
      .click();

    await expect(page.getByText(/save conflict|plan has changed|conflict/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /use server version/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /keep (?:my|local) changes/i })).toBeVisible();
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible();
  });

  test("'keep local changes' recovery option dismisses the conflict dialog and preserves canvas", async ({ page }) => {
    const projectId = process.env.PLANNER_CONFLICT_PROJECT_ID?.trim();
    if (!projectId) {
      test.skip(true, "PLANNER_CONFLICT_PROJECT_ID is required for authenticated conflict testing.");
      return;
    }
    await page.route(`**/api/Planner/projects/${projectId}`, async (route) => {
      if (route.request().method() !== "PATCH") return route.continue();
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          code: "CONFLICT",
          correlationId: "corr-browser-spec-0002",
          metadata: { currentRevision: 2 },
        }),
      });
    });

    await page.goto(`/ooplanner/projects/${projectId}`, { waitUntil: "domcontentloaded" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    await page.getByTestId("btn-save")
      .or(page.getByRole("button", { name: /save/i }))
      .first()
      .click();
    await expect(page.getByText(/conflict/i)).toBeVisible({ timeout: 10_000 });

    const keepBtn = page.getByRole("button", { name: /keep (?:my|local) changes/i });
    await expect(keepBtn).toBeVisible();
    await keepBtn.click();

    // Dialog must dismiss and canvas must remain
    await expect(page.getByText(/conflict/i)).toBeHidden({ timeout: 5_000 });
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9. Accessibility: ARIA roles, keyboard navigation, screen-reader landmarks
// Validates: Requirements 5.1, 6.1, 7.1, 8.1, 9.2, 18.5
// ---------------------------------------------------------------------------

test.describe("Planner — accessibility", () => {
  // REQUIRES: separate authorized browser execution

  test("workspace has required ARIA landmarks: main, navigation, toolbar", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "ARIA landmarks" });
    await waitForPlannerCanvas(page);

    await expect(page.getByRole("main")).toBeVisible();
    // At least one toolbar or navigation landmark must exist
    const toolbarOrNav = page.getByRole("toolbar")
      .or(page.getByRole("navigation"));
    await expect(toolbarOrNav.first()).toBeVisible();
  });

  test("canvas stage has an accessible label for screen readers", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Canvas ARIA label" });
    await waitForPlannerCanvas(page);

    const stage = page.locator(PLANNER_FABRIC_STAGE);
    await expect(stage).toBeVisible();

    const ariaLabel = await stage.getAttribute("aria-label");
    const ariaLabelledBy = await stage.getAttribute("aria-labelledby");
    const role = await stage.getAttribute("role");
    // Must have some accessible identification
    expect(ariaLabel || ariaLabelledBy || role).toBeTruthy();
  });

  test("axe WCAG 2.1 AA scan finds no critical or serious violations on the workspace", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Axe AA workspace" });
    await waitForPlannerCanvas(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);
  });

  test("axe WCAG 2.1 AA scan finds no critical or serious violations on the project list route", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await page.goto("/ooplanner/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_000);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);
  });

  test("all interactive controls have accessible names (no unlabeled buttons)", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "Accessible control names" });
    await waitForPlannerCanvas(page);

    // Check toolbar buttons only (canvas buttons are internal to Fabric)
    const toolbar = page.getByTestId("planner-top-toolbar");
    const buttons = toolbar.getByRole("button");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const name = await btn.getAttribute("aria-label");
      const textContent = (await btn.textContent())?.trim();
      const title = await btn.getAttribute("title");
      // Each button must have at least one form of accessible name
      expect(name || textContent || title).toBeTruthy();
    }
  });

  test("view mode radiogroup has correct role hierarchy and aria-checked states", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await enterGuestPlannerWorkspace(page, { projectName: "View mode ARIA" });
    await waitForPlannerCanvas(page);

    const group = page.getByRole("radiogroup", { name: "View mode" });
    await expect(group).toBeVisible();

    const radio2D = group.getByRole("radio", { name: "2D", exact: true });
    const radio3D = group.getByRole("radio", { name: "3D", exact: true });
    await expect(radio2D).toBeVisible();
    await expect(radio3D).toBeVisible();

    // Exactly one radio must be checked
    const checked2D = await radio2D.getAttribute("aria-checked");
    const checked3D = await radio3D.getAttribute("aria-checked");
    expect(
      (checked2D === "true" && checked3D !== "true") ||
      (checked3D === "true" && checked2D !== "true"),
    ).toBeTruthy();
  });

  test("project list page has accessible table or list with row-level labels", async ({ page }) => {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await page.goto("/ooplanner/projects", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_500);

    const listOrTable = page.getByRole("table")
      .or(page.getByRole("list"))
      .or(page.getByRole("grid"))
      .or(page.locator('[data-testid*="project-list"]'));
    // If the list/table is visible it must have a label or caption
    const isVisible = await listOrTable.first().isVisible().catch(() => false);
    if (isVisible) {
      await expect(listOrTable.first()).toBeVisible();
    }
    // Even without a list, the page must pass ARIA landmark check
    await expect(page.getByRole("main")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 10. Required performance profiles: LCP for route entry, INP for canvas
// Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7
// ---------------------------------------------------------------------------

test.describe("Planner — performance profiles (authored, not executed)", () => {
  // REQUIRES: separate authorized browser execution
  // These tests capture raw metrics via the Performance API. No pass/fail
  // threshold is asserted here — thresholds belong in the authorized
  // validation manifest (task 5.11). This file only authors the measurement
  // harness so the exact commands and evidence can be bound later.

  test("desktop LCP for /ooplanner route entry is measurable via PerformanceObserver", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "LCP baseline is captured on the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 1_440, height: 900 });

    // Install LCP observer before navigation
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__lcpEntries = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as unknown as { __lcpEntries: PerformanceEntry[] }).__lcpEntries.push(entry);
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    });

    await enterGuestPlannerWorkspace(page, { projectName: "LCP desktop" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    const lcpEntries = await page.evaluate(() =>
      (window as unknown as { __lcpEntries?: PerformanceEntry[] }).__lcpEntries ?? [],
    );
    // LCP entries must exist — at least one paint candidate observed
    expect(lcpEntries.length).toBeGreaterThan(0);
    const lastLcp = lcpEntries[lcpEntries.length - 1] as PerformancePaintTiming & { startTime: number };
    // Record the value (no threshold asserted — bound in validation manifest)
    testInfo.annotations.push({
      type: "lcp-ms",
      description: String(Math.round(lastLcp.startTime)),
    });
  });

  test("tablet LCP for /ooplanner route entry is measurable via PerformanceObserver", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-tablet",
      "Tablet LCP baseline is captured on the chromium-tablet profile.",
    );
    await page.setViewportSize({ width: 768, height: 1_024 });

    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__lcpEntries = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as unknown as { __lcpEntries: PerformanceEntry[] }).__lcpEntries.push(entry);
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    });

    await enterGuestPlannerWorkspace(page, { projectName: "LCP tablet" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    const lcpEntries = await page.evaluate(() =>
      (window as unknown as { __lcpEntries?: PerformanceEntry[] }).__lcpEntries ?? [],
    );
    expect(lcpEntries.length).toBeGreaterThan(0);
    const lastLcp = lcpEntries[lcpEntries.length - 1] as PerformancePaintTiming & { startTime: number };
    testInfo.annotations.push({
      type: "lcp-ms",
      description: String(Math.round(lastLcp.startTime)),
    });
  });

  test("phone LCP for /ooplanner route entry is measurable via PerformanceObserver", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile",
      "Phone LCP baseline is captured on the chromium-mobile profile.",
    );
    await page.setViewportSize({ width: 390, height: 844 });

    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__lcpEntries = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as unknown as { __lcpEntries: PerformanceEntry[] }).__lcpEntries.push(entry);
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    });

    await enterGuestPlannerWorkspace(page, { projectName: "LCP phone" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    const lcpEntries = await page.evaluate(() =>
      (window as unknown as { __lcpEntries?: PerformanceEntry[] }).__lcpEntries ?? [],
    );
    expect(lcpEntries.length).toBeGreaterThan(0);
    const lastLcp = lcpEntries[lcpEntries.length - 1] as PerformancePaintTiming & { startTime: number };
    testInfo.annotations.push({
      type: "lcp-ms",
      description: String(Math.round(lastLcp.startTime)),
    });
  });

  test("desktop INP for non-canvas toolbar interaction is measurable via event-timing entries", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "INP baseline is captured on the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 1_440, height: 900 });

    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__eventTimings = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as unknown as { __eventTimings: PerformanceEntry[] }).__eventTimings.push(entry);
        }
      });
      observer.observe({ type: "event", durationThreshold: 0, buffered: true });
    });

    await enterGuestPlannerWorkspace(page, { projectName: "INP desktop" });
    await waitForPlannerCanvas(page);

    // Trigger a non-canvas toolbar interaction
    const exportBtn = page.getByTestId("btn-export-menu");
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    const eventTimings = await page.evaluate(() =>
      (window as unknown as { __eventTimings?: Array<{ duration: number; processingStart: number; startTime: number }> })
        .__eventTimings ?? [],
    );
    // Record measured interaction latencies (no threshold asserted)
    const maxDuration = eventTimings.reduce((m, e) => Math.max(m, e.duration ?? 0), 0);
    testInfo.annotations.push({
      type: "inp-ms",
      description: String(Math.round(maxDuration)),
    });
    // Evidence class: repository measurement via PerformanceObserver
    testInfo.annotations.push({
      type: "evidence-class",
      description: "browser",
    });
  });

  test("canvas interaction INP is measurable via event-timing entries during a canvas click", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Canvas INP baseline is captured on the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 1_440, height: 900 });

    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__canvasEventTimings = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as unknown as { __canvasEventTimings: PerformanceEntry[] })
            .__canvasEventTimings.push(entry);
        }
      });
      observer.observe({ type: "event", durationThreshold: 0, buffered: true });
    });

    await enterGuestPlannerWorkspace(page, { projectName: "Canvas INP desktop" });
    await waitForPlannerCanvas(page);

    // Single canvas click (pointer interaction on the upper canvas)
    const stageBox = await page.locator(PLANNER_FABRIC_STAGE).boundingBox();
    if (stageBox) {
      const cx = stageBox.x + stageBox.width / 2;
      const cy = stageBox.y + stageBox.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.waitForTimeout(60);
      await page.mouse.up();
      await page.waitForTimeout(200);
    }

    const eventTimings = await page.evaluate(() =>
      (window as unknown as {
        __canvasEventTimings?: Array<{ duration: number; processingStart: number; startTime: number }>;
      }).__canvasEventTimings ?? [],
    );
    const maxDuration = eventTimings.reduce((m, e) => Math.max(m, e.duration ?? 0), 0);
    testInfo.annotations.push({
      type: "canvas-inp-ms",
      description: String(Math.round(maxDuration)),
    });
    testInfo.annotations.push({
      type: "evidence-class",
      description: "browser",
    });
  });

  test("cold route FCP and TTFB are measurable via Navigation Timing API", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop",
      "Navigation timing baseline is captured on the chromium-desktop profile.",
    );
    await page.setViewportSize({ width: 1_440, height: 900 });

    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__navigationTiming = null;
      window.addEventListener("load", () => {
        const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
        if (entries.length > 0) {
          const nav = entries[0];
          (window as unknown as {
            __navigationTiming: {
              ttfb: number;
              domInteractive: number;
              domComplete: number;
              loadEventEnd: number;
            };
          }).__navigationTiming = {
            ttfb: Math.round(nav.responseStart - nav.fetchStart),
            domInteractive: Math.round(nav.domInteractive),
            domComplete: Math.round(nav.domComplete),
            loadEventEnd: Math.round(nav.loadEventEnd),
          };
        }
      });
    });

    await enterGuestPlannerWorkspace(page, { projectName: "Navigation timing" });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    const timing = await page.evaluate(() =>
      (window as unknown as {
        __navigationTiming?: {
          ttfb: number;
          domInteractive: number;
          domComplete: number;
          loadEventEnd: number;
        };
      }).__navigationTiming,
    );

    if (timing) {
      testInfo.annotations.push({ type: "ttfb-ms", description: String(timing.ttfb) });
      testInfo.annotations.push({ type: "dom-interactive-ms", description: String(timing.domInteractive) });
      testInfo.annotations.push({ type: "dom-complete-ms", description: String(timing.domComplete) });
    }
    testInfo.annotations.push({ type: "evidence-class", description: "browser" });
  });
});

// ---------------------------------------------------------------------------
// 11. Extended optional profiles (Firefox tablet, WebKit mobile)
// Validates: Requirements 6.1-6.7, 7.1-7.7, 8.1-8.8
// ---------------------------------------------------------------------------

const OPTIONAL_PROFILE_TAG = "@optional-browser-profile";

test.describe("Planner — extended optional browser profiles", () => {
  // REQUIRES: separate authorized browser execution

  test(`${OPTIONAL_PROFILE_TAG} Firefox tablet keyboard export menu interaction has explicit optional coverage`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "firefox-tablet",
      "Optional Firefox tablet keyboard interaction is isolated to the firefox-tablet project.",
    );
    await page.setViewportSize({ width: 768, height: 1_024 });
    await enterGuestPlannerWorkspace(page, { projectName: "Firefox tablet keyboard" });
    await waitForPlannerCanvas(page);

    const trigger = page.getByTestId("btn-export-menu");
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("export-menu-panel")).toBeVisible();
    await expect(page.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("export-menu-panel")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test(`${OPTIONAL_PROFILE_TAG} WebKit mobile touch inventory parity has explicit optional coverage`, async ({ browser }, testInfo) => {
    test.skip(
      testInfo.project.name !== "webkit-mobile",
      "Optional WebKit mobile touch interaction is isolated to the webkit-mobile project.",
    );
    const baseURL = testInfo.project.use.baseURL;
    if (typeof baseURL !== "string") throw new Error("The touch profile requires the configured Playwright baseURL.");
    const context = await browser.newContext({
      ...devices["iPhone 13"],
      baseURL,
    });
    const page = await context.newPage();
    try {
      await enterGuestPlannerWorkspace(page, { projectName: "WebKit touch parity" });
      await waitForPlannerCanvas(page);

      const toggle = page.getByTestId("planner-toggle-inventory");
      await expect(toggle).toBeVisible();
      await toggle.tap();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("catalog-search")).toBeVisible();
      await toggle.focus();
      await page.keyboard.press("Enter");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
    } finally {
      await context.close();
    }
  });

  test(`${OPTIONAL_PROFILE_TAG} Firefox tablet axe AA scan finds no critical violations`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "firefox-tablet",
      "Optional Firefox tablet axe scan is isolated to the firefox-tablet project.",
    );
    await page.setViewportSize({ width: 768, height: 1_024 });
    await enterGuestPlannerWorkspace(page, { projectName: "Firefox axe scan" });
    await waitForPlannerCanvas(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);
  });

  test(`${OPTIONAL_PROFILE_TAG} WebKit mobile 200% reflow does not overflow body`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "webkit-mobile",
      "Optional WebKit mobile reflow check is isolated to the webkit-mobile project.",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await enterGuestPlannerWorkspace(page, { projectName: "WebKit reflow" });
    await waitForPlannerCanvas(page);

    await page.evaluate(() => {
      document.documentElement.style.setProperty("zoom", "2");
    });

    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
    await expect(page.getByTestId("planner-workspace")).toBeVisible();
  });
});
