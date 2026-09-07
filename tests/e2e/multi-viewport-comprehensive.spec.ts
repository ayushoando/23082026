/**
 * Multi-Viewport Comprehensive E2E Audit Suite
 *
 * Requirements:
 * - 5 Canonical Viewports: 390px (first), 768px, 1080px, 1440px, 1920px.
 * - 100% route coverage across all four surfaces + workspaces:
 *   1. Public Marketing & Client Hub
 *   2. Planning Tools & Calculators
 *   3. Member & Portal
 *   4. Admin Surfaces
 *   5. Workspaces (/oostudio, /ooplanner)
 * - Invariants Verified:
 *   1. Zero Horizontal Overflow: documentElement.scrollWidth <= documentElement.clientWidth
 *   2. Mobile Touch Targets: >=48x48px (MIN_TARGET = 48) on 390w for interactive elements
 *   3. Mobile Chrome Coordination & Stacking:
 *      - .mobile-tab-bar does not occlude .pdp-mobile-bar
 *      - .mobile-tab-bar does not occlude CompareDock
 *      - .site-fab-launcher is suppressed (hidden / display: none) when CookieConsentBar is active
 *      - .mobile-app-bar rendered with 0 horizontal overflow
 *
 * Opaque-box requirement verification deriving strictly from ORIGINAL_REQUEST.md,
 * PROJECT.md, and TEST_INFRA.md.
 */

import { expect, test, type Page } from "@playwright/test";

// -----------------------------------------------------------------------------
// 1. Canonical Viewports (390px Audited First per User Requirement)
// -----------------------------------------------------------------------------

export const CANONICAL_VIEWPORTS = [
  {
    id: "390w",
    label: "390px Mobile Baseline (iPhone 12/13/14) — Audited First",
    width: 390,
    height: 844,
  },
  {
    id: "768w",
    label: "768px Compact Portrait / Tablet",
    width: 768,
    height: 1024,
  },
  {
    id: "1080w",
    label: "1080px Narrow Desktop / 1080p Landscape",
    width: 1080,
    height: 800,
  },
  {
    id: "1440w",
    label: "1440px Standard Desktop Reference",
    width: 1440,
    height: 900,
  },
  {
    id: "1920w",
    label: "1920px Full-Width High-Resolution Desktop",
    width: 1920,
    height: 1080,
  },
] as const;

export type CanonicalViewport = (typeof CANONICAL_VIEWPORTS)[number];

// -----------------------------------------------------------------------------
// 2. Comprehensive Route Matrix Across All Surfaces
// -----------------------------------------------------------------------------

export interface AuditRoute {
  path: string;
  name: string;
  surface: "marketing" | "tools" | "portal" | "admin" | "workspace";
  /** If true, skip DOM-based tap target scan (e.g. for pure canvas workspaces) */
  skipTapAudit?: boolean;
}

export const AUDIT_ROUTES: AuditRoute[] = [
  // ── Surface 1: Public Marketing & Client Hub ─────────────────────────────
  { path: "/", name: "Homepage", surface: "marketing" },
  { path: "/about", name: "About Us", surface: "marketing" },
  { path: "/clients", name: "Clients Showcase", surface: "marketing" },
  { path: "/trusted-by", name: "Trusted By", surface: "marketing" },
  { path: "/products", name: "Products Catalog", surface: "marketing" },
  { path: "/products/seating", name: "Products Category (Seating)", surface: "marketing" },
  { path: "/products/seating/rider", name: "Product Detail Page (Rider)", surface: "marketing" },
  { path: "/contact", name: "Contact Us", surface: "marketing" },
  { path: "/career", name: "Careers", surface: "marketing" },
  { path: "/downloads", name: "Downloads & Catalogs", surface: "marketing" },
  { path: "/faq", name: "Frequently Asked Questions", surface: "marketing" },
  { path: "/sustainability", name: "Sustainability", surface: "marketing" },
  { path: "/terms", name: "Terms of Service", surface: "marketing" },
  { path: "/privacy", name: "Privacy Policy", surface: "marketing" },
  { path: "/refund-and-return-policy", name: "Refund & Return Policy", surface: "marketing" },
  { path: "/choose-product", name: "Product Chooser Hub", surface: "marketing" },
  { path: "/compare", name: "Product Comparison", surface: "marketing" },

  // ── Surface 2: Planning Tools & Calculators ──────────────────────────────
  { path: "/tools", name: "Planning Tools Index", surface: "tools" },
  { path: "/tools/office-space-calculator", name: "Office Space Calculator", surface: "tools" },
  { path: "/tools/meeting-room-capacity-calculator", name: "Meeting Room Capacity Calculator", surface: "tools" },

  // ── Surface 3: Member & Portal ───────────────────────────────────────────
  { path: "/access", name: "Access Gateway", surface: "portal" },
  { path: "/login", name: "Login", surface: "portal" },
  { path: "/dashboard", name: "Customer Dashboard", surface: "portal" },
  { path: "/portal", name: "Client Portal", surface: "portal" },
  { path: "/portal/guest", name: "Guest Portal", surface: "portal" },
  { path: "/quote-cart", name: "Quote Cart", surface: "portal" },

  // ── Surface 4: Admin Surfaces ────────────────────────────────────────────
  { path: "/admin", name: "Admin Dashboard", surface: "admin" },
  { path: "/admin/catalog", name: "Admin Product Catalog", surface: "admin" },
  { path: "/admin/workspace-catalog", name: "Admin Workspace Catalog", surface: "admin" },
  { path: "/admin/planner-catalog", name: "Admin Planner Catalog", surface: "admin" },
  { path: "/admin/inventory", name: "Admin Inventory", surface: "admin" },
  { path: "/admin/price-books", name: "Admin Price Books", surface: "admin" },
  { path: "/admin/crm", name: "Admin CRM Overview", surface: "admin" },
  { path: "/admin/crm/clients", name: "Admin CRM Clients", surface: "admin" },
  { path: "/admin/crm/quotes", name: "Admin CRM Quotes", surface: "admin" },
  { path: "/admin/customer-queries", name: "Admin Customer Queries", surface: "admin" },
  { path: "/admin/plans", name: "Admin Architectural Plans", surface: "admin" },
  { path: "/admin/analytics", name: "Admin Observability & Analytics", surface: "admin" },
  { path: "/admin/settings", name: "Admin Settings", surface: "admin" },
  { path: "/admin/themes", name: "Admin Themes", surface: "admin" },
  { path: "/admin/design-kit", name: "Admin FOCSS Design Kit", surface: "admin" },
  { path: "/admin/features", name: "Admin Feature Flags", surface: "admin" },

  // ── Surface 5: Isolated Workspaces ───────────────────────────────────────
  { path: "/oostudio", name: "Furniture Studio Workspace", surface: "workspace", skipTapAudit: true },
  { path: "/ooplanner", name: "Floor Planner Workspace", surface: "workspace", skipTapAudit: true },
];

// Representative subsets for deep component checks
export const PUBLIC_MARKETING_ROUTES = AUDIT_ROUTES.filter((r) => r.surface === "marketing");
export const PLANNING_TOOL_ROUTES = AUDIT_ROUTES.filter((r) => r.surface === "tools");
export const PORTAL_ROUTES = AUDIT_ROUTES.filter((r) => r.surface === "portal");
export const ADMIN_ROUTES = AUDIT_ROUTES.filter((r) => r.surface === "admin");
export const WORKSPACE_ROUTES = AUDIT_ROUTES.filter((r) => r.surface === "workspace");

// -----------------------------------------------------------------------------
// 3. Invariant Assertion Helpers
// -----------------------------------------------------------------------------

/**
 * Asserts 0 horizontal overflow on document.documentElement.
 * Strict check: documentElement.scrollWidth <= documentElement.clientWidth.
 */
export async function assertNoHorizontalOverflow(
  page: Page,
  contextMsg: string,
): Promise<{ scrollWidth: number; clientWidth: number; overflow: number }> {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      scrollWidth: doc ? doc.scrollWidth : 0,
      clientWidth: doc ? doc.clientWidth : 0,
      bodyScrollWidth: body ? body.scrollWidth : 0,
      bodyClientWidth: body ? body.clientWidth : 0,
      overflow: doc ? Math.max(0, doc.scrollWidth - doc.clientWidth) : 0,
    };
  });

  expect(
    metrics.scrollWidth,
    `[Horizontal Overflow] ${contextMsg}: scrollWidth (${metrics.scrollWidth}px) exceeds clientWidth (${metrics.clientWidth}px) by ${metrics.overflow}px`,
  ).toBeLessThanOrEqual(metrics.clientWidth);

  return metrics;
}

/** Minimum mobile touch target standard in pixels (48x48px per WCAG / FOCSS spec) */
export const MIN_TOUCH_TARGET = 48;

export interface TouchTargetOffender {
  selector: string;
  tag: string;
  text: string;
  width: number;
  height: number;
}

/**
 * Scans page for visible interactive elements smaller than 48x48px.
 * Applies standard accessibility exceptions (e.g. data-tap-exempt, inline paragraph links).
 */
export async function auditMobileTouchTargets(
  page: Page,
  minTarget: number = MIN_TOUCH_TARGET,
): Promise<TouchTargetOffender[]> {
  return page.evaluate((min) => {
    const offenders: {
      selector: string;
      tag: string;
      text: string;
      width: number;
      height: number;
    }[] = [];

    const isHidden = (element: HTMLElement): boolean => {
      for (let cur: HTMLElement | null = element; cur; cur = cur.parentElement) {
        const cs = window.getComputedStyle(cur);
        if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") {
          return true;
        }
      }
      return false;
    };

    const candidates = document.querySelectorAll<HTMLElement>(
      "a, button, input:not([type='hidden']), select, [role='button'], [role='link'], [role='tab']",
    );

    for (const el of candidates) {
      if (isHidden(el)) continue;

      const rect = el.getBoundingClientRect();
      // Ignore non-rendered or zero-dimension nodes
      if (rect.width < 1 || rect.height < 1) continue;

      // Honor explicit tap exemption contract
      if (el.hasAttribute("data-tap-exempt") || el.closest("[data-tap-exempt]")) {
        continue;
      }

      // Inline text links inside paragraph/notice text (e.g. legal links) where container provides hit target
      if (
        el.tagName === "A" &&
        el.closest("p, li, [data-cookie-consent-bar]") &&
        rect.height >= 24 &&
        rect.width > 28
      ) {
        if (el.closest("[data-cookie-consent-bar]") || rect.height >= min) {
          continue;
        }
      }

      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      if (w < min || h < min) {
        const id = el.id ? `#${el.id}` : "";
        const testId = el.getAttribute("data-testid") ? `[data-testid="${el.getAttribute("data-testid")}"]` : "";
        const cls =
          el.className && typeof el.className === "string"
            ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
            : "";
        const selector = `${el.tagName.toLowerCase()}${id}${testId || cls}`;
        const rawText = el.textContent || el.getAttribute("aria-label") || el.getAttribute("title") || "";
        const text = rawText.trim().slice(0, 30).replace(/\s+/g, " ");

        offenders.push({
          selector,
          tag: el.tagName.toLowerCase(),
          text,
          width: w,
          height: h,
        });
      }
    }

    return offenders;
  }, minTarget);
}

// -----------------------------------------------------------------------------
// 4. Test Suite Execution: Canonical Viewports (390px Audited First)
// -----------------------------------------------------------------------------

test.describe.configure({ timeout: 60_000 });

// ═════════════════════════════════════════════════════════════════════════════
// VIEWPORT 1: 390px Mobile Baseline (Audited FIRST)
// ═════════════════════════════════════════════════════════════════════════════

const VP_390 = CANONICAL_VIEWPORTS[0];

test.describe(`[Priority 1] Canonical ${VP_390.label}`, () => {
  // ── 1.1 Horizontal Overflow Audit across all 44 routes ─────────────────
  test.describe("1.1 Horizontal Overflow Audit (390w)", () => {
    for (const route of AUDIT_ROUTES) {
      test(`[390w Overflow] ${route.name} (${route.path})`, async ({ page }) => {
        await page.setViewportSize({ width: VP_390.width, height: VP_390.height });
        await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForTimeout(500);

        await assertNoHorizontalOverflow(page, `${route.name} at 390w`);
      });
    }
  });

  // ── 1.2 Mobile Touch Target Standard (>=48x48px) ───────────────────────
  test.describe("1.2 Mobile Touch Target Standard (>=48x48px on 390w)", () => {
    const touchAuditRoutes = AUDIT_ROUTES.filter((r) => !r.skipTapAudit);

    for (const route of touchAuditRoutes) {
      test(`[390w Tap Target] ${route.name} (${route.path})`, async ({ page }) => {
        await page.setViewportSize({ width: VP_390.width, height: VP_390.height });
        await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForTimeout(600);

        const offenders = await auditMobileTouchTargets(page, MIN_TOUCH_TARGET);
        expect(
          offenders,
          `Found ${offenders.length} interactive elements on ${route.path} below ${MIN_TOUCH_TARGET}x${MIN_TOUCH_TARGET}px: ${JSON.stringify(offenders.slice(0, 5))}`,
        ).toEqual([]);
      });
    }
  });

  // ── 1.3 Mobile Chrome Coordination & Stacking ───────────────────────────
  test.describe("1.3 Mobile Chrome Coordination & Stacking (390w)", () => {
    test("PDP mobile bar (.pdp-mobile-bar) is not occluded by .mobile-tab-bar", async ({ page }) => {
      await page.setViewportSize({ width: VP_390.width, height: VP_390.height });
      await page.goto("/products/seating/rider", { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForTimeout(800);

      const pdpBar = page.locator(".pdp-mobile-bar, [data-testid='pdp-mobile-bar']").first();
      const tabBar = page.locator(".mobile-tab-bar").first();

      const pdpVisible = await pdpBar.isVisible({ timeout: 5000 }).catch(() => false);
      const tabVisible = await tabBar.isVisible({ timeout: 5000 }).catch(() => false);

      if (pdpVisible && tabVisible) {
        const pdpBox = await pdpBar.boundingBox();
        const tabBox = await tabBar.boundingBox();
        expect(pdpBox).not.toBeNull();
        expect(tabBox).not.toBeNull();

        if (pdpBox && tabBox) {
          // pdp-mobile-bar bottom must sit at or above the top of mobile-tab-bar
          const pdpBottom = pdpBox.y + pdpBox.height;
          expect(
            pdpBottom,
            `PDP mobile bar bottom (${pdpBottom}px) is occluded by mobile tab bar top (${tabBox.y}px)`,
          ).toBeLessThanOrEqual(tabBox.y + 1);
        }
      }
    });

    test("CompareDock is not occluded by .mobile-tab-bar", async ({ page }) => {
      await page.setViewportSize({ width: VP_390.width, height: VP_390.height });
      await page.goto("/products", { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForTimeout(600);

      // Seed comparison item in client state
      await page.evaluate(() => {
        const state = {
          state: {
            items: [
              { productUrlKey: "rider", name: "Rider Ergonomic Task Chair" },
            ],
          },
          version: 0,
        };
        localStorage.setItem("oando-product-compare", JSON.stringify(state));
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);

      const dock = page.locator("[data-compare-dock]").first();
      const tabBar = page.locator(".mobile-tab-bar").first();

      const dockVisible = await dock.isVisible({ timeout: 5000 }).catch(() => false);
      const tabVisible = await tabBar.isVisible({ timeout: 5000 }).catch(() => false);

      if (dockVisible && tabVisible) {
        const dockBox = await dock.boundingBox();
        const tabBox = await tabBar.boundingBox();
        expect(dockBox).not.toBeNull();
        expect(tabBox).not.toBeNull();

        if (dockBox && tabBox) {
          // CompareDock bottom must not be covered by mobile-tab-bar
          const dockBottom = dockBox.y + dockBox.height;
          expect(
            dockBottom,
            `CompareDock bottom (${dockBottom}px) is occluded by mobile tab bar top (${tabBox.y}px)`,
          ).toBeLessThanOrEqual(tabBox.y + 1);
        }
      }
    });

    test("Floating action buttons (.site-fab-launcher) are suppressed when CookieConsentBar is active (<768px)", async ({ page }) => {
      await page.setViewportSize({ width: VP_390.width, height: VP_390.height });
      // Reset consent cookie to trigger CookieConsentBar
      await page.context().clearCookies();
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForTimeout(1000);

      const consentBar = page.locator("[data-cookie-consent-bar]").first();
      const consentVisible = await consentBar.isVisible({ timeout: 6000 }).catch(() => false);

      if (consentVisible) {
        // Floating action buttons must be suppressed (hidden or display: none)
        const visibleFabs = page.locator(".site-fab-launcher:visible");
        const count = await visibleFabs.count();
        expect(
          count,
          `Expected 0 visible .site-fab-launcher buttons when CookieConsentBar is active on mobile, but found ${count}`,
        ).toBe(0);
      }
    });

    test("Mobile app header (.mobile-app-bar) renders cleanly with 0 overflow", async ({ page }) => {
      await page.setViewportSize({ width: VP_390.width, height: VP_390.height });
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForTimeout(600);

      const mobileBar = page.locator(".mobile-app-bar").first();
      await expect(mobileBar).toBeVisible();

      const metrics = await mobileBar.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// VIEWPORT 2: 768px Compact Portrait / Tablet
// ═════════════════════════════════════════════════════════════════════════════

const VP_768 = CANONICAL_VIEWPORTS[1];

test.describe(`Canonical ${VP_768.label}`, () => {
  test.describe("Horizontal Overflow Audit (768w)", () => {
    for (const route of AUDIT_ROUTES) {
      test(`[768w Overflow] ${route.name} (${route.path})`, async ({ page }) => {
        await page.setViewportSize({ width: VP_768.width, height: VP_768.height });
        await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForTimeout(500);

        await assertNoHorizontalOverflow(page, `${route.name} at 768w`);
      });
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// VIEWPORT 3: 1080px Narrow Desktop / 1080p Landscape
// ═════════════════════════════════════════════════════════════════════════════

const VP_1080 = CANONICAL_VIEWPORTS[2];

test.describe(`Canonical ${VP_1080.label}`, () => {
  test.describe("Horizontal Overflow Audit (1080w)", () => {
    for (const route of AUDIT_ROUTES) {
      test(`[1080w Overflow] ${route.name} (${route.path})`, async ({ page }) => {
        await page.setViewportSize({ width: VP_1080.width, height: VP_1080.height });
        await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForTimeout(500);

        await assertNoHorizontalOverflow(page, `${route.name} at 1080w`);
      });
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// VIEWPORT 4: 1440px Standard Desktop Reference
// ═════════════════════════════════════════════════════════════════════════════

const VP_1440 = CANONICAL_VIEWPORTS[3];

test.describe(`Canonical ${VP_1440.label}`, () => {
  test.describe("Horizontal Overflow Audit (1440w)", () => {
    for (const route of AUDIT_ROUTES) {
      test(`[1440w Overflow] ${route.name} (${route.path})`, async ({ page }) => {
        await page.setViewportSize({ width: VP_1440.width, height: VP_1440.height });
        await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForTimeout(500);

        await assertNoHorizontalOverflow(page, `${route.name} at 1440w`);
      });
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// VIEWPORT 5: 1920px Full-Width High-Resolution Desktop
// ═════════════════════════════════════════════════════════════════════════════

const VP_1920 = CANONICAL_VIEWPORTS[4];

test.describe(`Canonical ${VP_1920.label}`, () => {
  test.describe("Horizontal Overflow Audit (1920w)", () => {
    for (const route of AUDIT_ROUTES) {
      test(`[1920w Overflow] ${route.name} (${route.path})`, async ({ page }) => {
        await page.setViewportSize({ width: VP_1920.width, height: VP_1920.height });
        await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForTimeout(500);

        await assertNoHorizontalOverflow(page, `${route.name} at 1920w`);
      });
    }
  });
});
