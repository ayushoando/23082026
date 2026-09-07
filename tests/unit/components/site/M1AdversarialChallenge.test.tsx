import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

import { CookieConsentBar } from "@/components/site/CookieConsentBar";
import { SiteHeader, __resetNavCategoriesLoadForTests } from "@/components/site/Header";
import { CompareDock } from "@/components/products/CompareDock";
import { useProductCompare } from "@/lib/store/productCompare";

// Mock Phosphor icons for Header & CompareDock
vi.mock("@phosphor-icons/react", () => ({
  CaretDown: () => <span data-testid="caret-icon" />,
  List: () => <span data-testid="list-icon" />,
  MagnifyingGlass: () => <span data-testid="magnifier-icon" />,
  X: () => <span data-testid="close-icon" />,
  Sparkle: () => <span data-testid="sparkle-icon" />,
  GitDiff: () => <span data-testid="git-diff-icon" />,
  Trash: () => <span data-testid="trash-icon" />,
}));

// Mock Logo
vi.mock("@/components/ui/Logo", () => ({
  OneAndOnlyLogo: () => <div data-testid="header-logo" />,
}));

// Mock Navigation
vi.mock("@/lib/navigation", () => ({
  NAV_CATEGORY_GROUP_ORDER: ["seating"],
  NAV_CATEGORY_GROUPS: {
    seating: { label: "Seating Group", ids: ["chairs"] },
  },
  groupCategories: vi.fn((cats) => cats),
}));

vi.mock("@/features/site/data/navigation", () => ({
  SITE_HEADER_PRIMARY_LINKS: [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products", hasMega: true },
  ],
  SITE_HEADER_MORE_LINKS: [],
  SITE_NAV_LINKS: [{ label: "Home", href: "/" }],
  SITE_AUTH_LINK: { label: "Sign in", href: "/access" },
  SITE_CTA_LINKS: [],
}));

vi.mock("@/lib/analytics/siteEvents", () => ({
  flushAnalyticsAfterConsent: vi.fn(),
  trackPlannerLaunchClicked: vi.fn(),
  trackSiteSearchSubmitted: vi.fn(),
  trackSiteCtaClick: vi.fn(),
}));

let mockPathname = "/products";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn() }),
}));

function revealConsentBar() {
  act(() => {
    vi.advanceTimersByTime(2500);
  });
}

describe("Milestone 1 Empirical Verification Suite", () => {
  const rootDir = path.resolve(__dirname, "../../../../");

  describe("1. CSS AST Static Analysis (postcss)", () => {

    it("verifies shell-site-fabs.css suppresses FABs under [data-cookie-consent-bar] only on mobile (<768px)", () => {
      const cssPath = path.join(rootDir, "site/focss/site/components/chrome/shell-site-fabs.css");
      const cssContent = fs.readFileSync(cssPath, "utf-8");
      const root = postcss.parse(cssContent);

      let mobileMediaRule: postcss.AtRule | undefined;
      root.walkAtRules("media", (atRule) => {
        if (atRule.params.includes("< theme(--breakpoint-md)")) {
          mobileMediaRule = atRule;
        }
      });

      expect(mobileMediaRule).toBeDefined();

      // Check suppression inside mobile media query
      const suppressedSelectors: string[] = [];
      let hasDisplayNoneImportant = false;

      mobileMediaRule!.walkRules((rule) => {
        if (rule.selector.includes("[data-cookie-consent-bar]") && (rule.selector.includes(".site-fab-launcher") || rule.selector.includes(".site-fab-anchor"))) {
          suppressedSelectors.push(rule.selector);
          rule.walkDecls("display", (decl) => {
            if (decl.value === "none" && decl.important) {
              hasDisplayNoneImportant = true;
            }
          });
        }
      });

      expect(suppressedSelectors.length).toBeGreaterThan(0);
      expect(hasDisplayNoneImportant).toBe(true);

      // Verify on desktop (outside the mobile media query), display: none !important is NOT set on FABs
      let desktopSuppressed = false;
      root.walkRules((rule) => {
        if (rule.parent === root && rule.selector.includes("[data-cookie-consent-bar]")) {
          rule.walkDecls("display", (decl) => {
            if (decl.value === "none") desktopSuppressed = true;
          });
        }
      });
      expect(desktopSuppressed).toBe(false);
    });

    it("verifies pdp-cta.css anchors .pdp-mobile-bar above .mobile-tab-bar", () => {
      const cssPath = path.join(rootDir, "site/focss/site/components/products/pdp-cta.css");
      const cssContent = fs.readFileSync(cssPath, "utf-8");
      const root = postcss.parse(cssContent);

      let baseBottom = "";
      let baseZIndex = "";
      let tabStackedBottom = "";

      root.walkRules((rule) => {
        if (rule.selector === ".pdp-mobile-bar") {
          rule.walkDecls("bottom", (decl) => { baseBottom = decl.value; });
          rule.walkDecls("z-index", (decl) => { baseZIndex = decl.value; });
        }
        if (rule.selector.includes("has(.mobile-tab-bar)") && rule.selector.includes(".pdp-mobile-bar")) {
          rule.walkDecls("bottom", (decl) => { tabStackedBottom = decl.value; });
        }
      });

      expect(baseBottom).toBe("0");
      expect(baseZIndex).toBe("40");
      expect(tabStackedBottom).toBe("var(--mobile-tab-bar-height, 3.5rem)");
    });

    it("verifies app-shell.css offsets [data-compare-dock] and defines 48px top-bar touch targets", () => {
      const cssPath = path.join(rootDir, "site/focss/site/components/chrome/app-shell.css");
      const cssContent = fs.readFileSync(cssPath, "utf-8");
      const root = postcss.parse(cssContent);

      // Check root variable
      let rootTabHeight = "";
      root.walkRules(":root", (rule) => {
        if (rule.parent === root) {
          rule.walkDecls("--mobile-tab-bar-height", (decl) => { rootTabHeight = decl.value; });
        }
      });
      expect(rootTabHeight).toBe("0rem");

      // Check compare dock rule inside mobile media query
      let compareDockBottom = "";
      let compareDockImportant = false;
      let menuHeight = "";
      let menuMinHeight = "";
      let searchHeight = "";
      let searchMinHeight = "";

      root.walkAtRules("media", (atRule) => {
        if (atRule.params.includes("< theme(--breakpoint-md)")) {
          atRule.walkRules((rule) => {
            if (rule.selector === "[data-compare-dock]") {
              rule.walkDecls("bottom", (decl) => {
                compareDockBottom = decl.value;
                compareDockImportant = decl.important;
              });
            }
            if (rule.selector.includes(".mobile-app-bar__menu")) {
              rule.walkDecls("height", (decl) => { menuHeight = decl.value; });
              rule.walkDecls("min-height", (decl) => { menuMinHeight = decl.value; });
            }
            if (rule.selector.includes(".mobile-app-bar__search")) {
              rule.walkDecls("height", (decl) => { searchHeight = decl.value; });
              rule.walkDecls("min-height", (decl) => { searchMinHeight = decl.value; });
            }
          });
        }
      });

      expect(compareDockBottom).toBe("calc(var(--mobile-tab-bar-height, 3.5rem) + 0.75rem)");
      expect(compareDockImportant).toBe(true);

      // 3rem = 48px
      expect(menuHeight).toBe("3rem");
      expect(menuMinHeight).toBe("3rem");
      expect(searchHeight).toBe("3rem");
      expect(searchMinHeight).toBe("3rem");
    });
  });

  describe("2. CookieConsentBar Component Empirical Tests", () => {
    let mockCookieStore: Record<string, string> = {};
    const originalCookie = Object.getOwnPropertyDescriptor(document, "cookie");

    beforeEach(() => {
      vi.useFakeTimers();
      mockCookieStore = {};
      Object.defineProperty(document, "cookie", {
        get: () => Object.entries(mockCookieStore).map(([k, v]) => `${k}=${v}`).join("; "),
        set: (val: string) => {
          const parts = val.split(";");
          const [k, v] = parts[0].split("=");
          mockCookieStore[k.trim()] = v.trim();
        },
        configurable: true,
      });
      document.documentElement.lang = "en-US";
    });

    afterEach(() => {
      vi.useRealTimers();
      if (originalCookie) {
        Object.defineProperty(document, "cookie", originalCookie);
      }
    });

    it("renders with [data-cookie-consent-bar] and buttons with min-h-12 (48px)", () => {
      render(<CookieConsentBar />);
      revealConsentBar();

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("data-cookie-consent-bar");

      const acceptBtn = screen.getByRole("button", { name: /Accept all cookies/i });
      const rejectBtn = screen.getByRole("button", { name: /Reject non-essential cookies/i });

      // Both buttons must have min-h-12 class
      expect(acceptBtn.className).toContain("min-h-12");
      expect(rejectBtn.className).toContain("min-h-12");

      // Verify grid container for mobile 2-column layout
      const buttonContainer = acceptBtn.parentElement;
      expect(buttonContainer?.className).toContain("grid");
      expect(buttonContainer?.className).toContain("grid-cols-2");
    });

    it("unmounts dialog and removes [data-cookie-consent-bar] upon acceptance", () => {
      render(<CookieConsentBar />);
      revealConsentBar();

      const acceptBtn = screen.getByRole("button", { name: /Accept all cookies/i });
      fireEvent.click(acceptBtn);

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.querySelector("[data-cookie-consent-bar]")).toBeNull();
    });
  });

  describe("3. Header Hamburger Touch Target Empirical Tests", () => {
    it("renders hamburger button with h-12 w-12 (48x48px) and proper accessibility attributes", () => {
      render(<SiteHeader />);
      const hamburger = screen.getByRole("button", { name: /open menu/i });

      expect(hamburger).toBeInTheDocument();
      expect(hamburger.className).toContain("h-12");
      expect(hamburger.className).toContain("w-12");
      expect(hamburger).toHaveAttribute("aria-controls", "mobile-nav-drawer");
      expect(hamburger).toHaveAttribute("aria-haspopup", "dialog");
    });
  });

  describe("4. CompareDock Component Empirical Tests", () => {
    beforeEach(() => {
      mockPathname = "/products";
      useProductCompare.setState({
        items: [
          {
            id: "aeron-chair",
            productUrlKey: "aeron-chair",
            name: "Aeron Ergonomic Chair",
            categoryId: "chairs",
          },
        ],
      });
    });

    it("renders [data-compare-dock] with dynamic bottom style and min-h-12 buttons", () => {
      const source = fs.readFileSync(path.join(rootDir, "site/components/products/CompareDock.tsx"), "utf-8");
      expect(source).toContain('bottom: "calc(var(--mobile-tab-bar-height, 0rem) + 0.75rem)"');

      render(<CompareDock />);

      const dock = screen.getByRole("region", { name: /product comparison shortlist/i });
      expect(dock).toBeInTheDocument();
      expect(dock).toHaveAttribute("data-compare-dock");

      const clearBtn = screen.getByRole("button", { name: /clear comparison shortlist/i });
      const compareLink = screen.getByRole("link", { name: /compare 1 selected/i });

      expect(clearBtn.className).toContain("min-h-12");
      expect(compareLink.className).toContain("min-h-12");
    });

    it("returns null when items is empty", () => {
      useProductCompare.setState({ items: [] });
      const { container } = render(<CompareDock />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null on /compare route", () => {
      mockPathname = "/compare";
      const { container } = render(<CompareDock />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("5. Adversarial Edge Cases & Stacking Hierarchy", () => {
    it("verifies stacking context z-index hierarchy matches architecture specification", () => {
      const appShellCss = fs.readFileSync(path.join(rootDir, "site/focss/site/components/chrome/app-shell.css"), "utf-8");
      const pdpCtaCss = fs.readFileSync(path.join(rootDir, "site/focss/site/components/products/pdp-cta.css"), "utf-8");

      // Verify mobile-tab-bar z-index is 60
      expect(appShellCss).toMatch(/\.mobile-tab-bar[\s\S]*?z-index:\s*60/);

      // Verify mobile cookie consent bar z-index is 45 (above pdp-mobile-bar: 40, below mobile-tab-bar: 60)
      expect(appShellCss).toMatch(/\[data-cookie-consent-bar\][\s\S]*?z-index:\s*45/);

      // Verify pdp-mobile-bar z-index is 40
      expect(pdpCtaCss).toMatch(/\.pdp-mobile-bar[\s\S]*?z-index:\s*40/);

      // Hierarchy assertion: z-index 40 (PDP bar / CompareDock) < 45 (Cookie consent mobile) < 60 (Tab bar)
      const pdpZ = 40;
      const consentZ = 45;
      const tabZ = 60;
      expect(tabZ).toBeGreaterThan(consentZ);
      expect(consentZ).toBeGreaterThan(pdpZ);
    });

    it("verifies zero arbitrary bracket classes in modified components", () => {
      const cookieFile = fs.readFileSync(path.join(rootDir, "site/components/site/CookieConsentBar.tsx"), "utf-8");
      const headerFile = fs.readFileSync(path.join(rootDir, "site/components/site/Header.tsx"), "utf-8");
      const compareFile = fs.readFileSync(path.join(rootDir, "site/components/products/CompareDock.tsx"), "utf-8");

      // Check for arbitrary bracket overrides in modified elements
      expect(cookieFile).not.toMatch(/min-h-\[\d+px\]/);
      expect(cookieFile).not.toMatch(/h-\[\d+px\]/);
      expect(headerFile).toMatch(/site-header__hamburger[\s\S]*?h-12 w-12/);
      expect(headerFile).not.toMatch(/site-header__hamburger[\s\S]*?h-\[\d+px\]/);
      expect(compareFile).not.toMatch(/min-h-\[\d+px\]/);
    });

    it("verifies mobile top-bar buttons are 48x48px (3rem) with no layout collapse", () => {
      const appShellCss = fs.readFileSync(path.join(rootDir, "site/focss/site/components/chrome/app-shell.css"), "utf-8");
      const root = postcss.parse(appShellCss);

      let menuRulesFound = 0;
      root.walkRules((rule) => {
        if (rule.selector.includes(".mobile-app-bar__menu") && rule.selector.includes(".mobile-app-bar__search")) {
          rule.walkDecls((decl) => {
            if (["height", "width", "min-height", "min-width"].includes(decl.prop)) {
              expect(decl.value).toBe("3rem");
              menuRulesFound++;
            }
          });
        }
      });
      // All 4 properties (height, width, min-height, min-width) must equal 3rem
      expect(menuRulesFound).toBe(4);
    });
  });
});

